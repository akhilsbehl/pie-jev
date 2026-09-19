export type JevQuestionType = 'noul' | 'choice' | 'score'

export type JevQuestion = {
  type: JevQuestionType
  instructions: string
  criteria: unknown
}

/**
 * Criteria shape the JEV API requires for `noul` questions: an object with
 * `true` and `false` entries describing each pole. Anything else is rejected
 * by the API with `400 invalid_union`, so `askJev` validates this locally.
 */
export type JevNoulCriteria = {
  true: unknown
  false: unknown
}

export type JevRequestControl = {
  signal?: AbortSignal
  timeoutMs?: number
}

export type JevAnswer = {
  type: JevQuestionType
  [key: string]: unknown
}

export type JevResponse = {
  model: string
  answers: Record<string, JevAnswer>
  usage: unknown
  id: string
  provider: string
}

export const JEV_MODEL = 'typesafe/jev-1.13'
export const JEV_ENDPOINT = 'https://openrouter.ai/api/alpha/decisions'
export const DEFAULT_JEV_TIMEOUT_MS = 90_000

function abortError(): Error {
  const error = new Error('operation aborted')
  error.name = 'AbortError'
  return error
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateQuestions(questions: Record<string, JevQuestion>): void {
  const names = Object.keys(questions)
  if (names.length === 0) {
    throw new Error('askJev requires at least one question')
  }
  for (const name of names) {
    const question = questions[name] as JevQuestion | undefined
    if (!isRecord(question)) {
      throw new Error(`askJev question '${name}' must be an object`)
    }
    if (question.type !== 'noul' && question.type !== 'choice' && question.type !== 'score') {
      throw new Error(`askJev question '${name}' has invalid type`)
    }
    if (typeof question.instructions !== 'string' || question.instructions.length === 0) {
      throw new Error(`askJev question '${name}' requires non-empty instructions`)
    }
    if (!('criteria' in (question as Record<string, unknown>))) {
      throw new Error(`askJev question '${name}' requires criteria`)
    }
    if (question.type === 'noul') {
      const criteria = (question as { criteria: unknown }).criteria
      if (!isRecord(criteria) || !('true' in criteria) || !('false' in criteria)) {
        throw new Error(
          `askJev question '${name}' of type 'noul' requires criteria with 'true' and 'false' entries, e.g. { true: '...', false: '...' }; the JEV API rejects any other shape with 400 invalid_union`,
        )
      }
    }
  }
}

function validateResponse(value: unknown, questions: Record<string, JevQuestion>): JevResponse {
  if (!isRecord(value)) {
    throw new Error('JEV response was not an object')
  }
  const { model, answers, usage, id, provider } = value
  if (typeof model !== 'string' || model.length === 0) {
    throw new Error('JEV response had invalid model')
  }
  if (!isRecord(answers)) {
    throw new Error('JEV response had invalid answers')
  }
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('JEV response had invalid id')
  }
  if (typeof provider !== 'string' || provider.length === 0) {
    throw new Error('JEV response had invalid provider')
  }
  if (!('usage' in value)) {
    throw new Error('JEV response had missing usage')
  }
  const validatedAnswers: Record<string, JevAnswer> = {}
  for (const name of Object.keys(questions)) {
    const expected = questions[name]
    if (expected === undefined) continue
    const answer = answers[name]
    if (!isRecord(answer)) {
      throw new Error(`JEV response was missing answer '${name}'`)
    }
    if (answer['type'] !== expected.type) {
      throw new Error(`JEV answer '${name}' had wrong type`)
    }
    validatedAnswers[name] = answer as JevAnswer
  }
  return { model, answers: validatedAnswers, usage, id, provider }
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text()
    return text.replace(/\s+/g, ' ').trim().slice(0, 500)
  } catch {
    return ''
  }
}

export async function askJev(
  state: string,
  questions: Record<string, JevQuestion>,
  control: JevRequestControl = {},
): Promise<JevResponse> {
  if (typeof state !== 'string' || state.length === 0) {
    throw new Error('askJev requires a non-empty state string')
  }
  if (!isRecord(questions)) {
    throw new Error('askJev requires a questions object')
  }
  validateQuestions(questions)

  const apiKey = process.env['OPENROUTER_API_KEY']?.trim()
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set')
  }

  const timeoutMs = control.timeoutMs ?? DEFAULT_JEV_TIMEOUT_MS
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('askJev timeoutMs must be a positive integer')
  }

  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), timeoutMs)
  const signal =
    control.signal === undefined
      ? timeoutController.signal
      : AbortSignal.any([timeoutController.signal, control.signal])

  if (signal.aborted) {
    clearTimeout(timeout)
    throw abortError()
  }

  let response: Response
  try {
    response = await fetch(JEV_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: JEV_MODEL, state, questions }),
      signal,
    })
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      if (timeoutController.signal.aborted && !(control.signal?.aborted)) {
        const timeoutError = new Error(`JEV request timed out after ${timeoutMs}ms`)
        timeoutError.name = 'TimeoutError'
        throw timeoutError
      }
      throw abortError()
    }
    throw error
  }
  clearTimeout(timeout)

  if (!response.ok) {
    const body = await readErrorBody(response)
    throw new Error(`JEV request failed with status ${response.status}${body ? `: ${body}` : ''}`)
  }

  let value: unknown
  try {
    value = await response.json()
  } catch (error) {
    throw new Error(`JEV response was not valid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  return validateResponse(value, questions)
}
