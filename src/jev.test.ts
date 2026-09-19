import { describe, expect, it, vi, afterEach } from 'vitest'
import { askJev } from './jev.js'

const questions = {
  permission_decision: {
    type: 'choice' as const,
    instructions: 'Choose.',
    criteria: { ACCEPT: 'yes', ESCALATE: 'no' },
  },
}

const successBody = {
  model: 'typesafe/jev-1.13-20260917',
  answers: {
    permission_decision: { type: 'choice', choice: 'ACCEPT', confidence: 0.99 },
  },
  usage: { input_tokens: 1, output_tokens: 1 },
  id: 'gen-1',
  provider: 'TypeSafe',
}

function mockFetchOnce(impl: (url: unknown, init: unknown) => Promise<unknown>): ReturnType<typeof vi.fn> {
  const fn = vi.fn(impl as never) as unknown as typeof fetch
  vi.stubGlobal('fetch', fn)
  return fn as unknown as ReturnType<typeof vi.fn>
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('askJev transport', () => {
  it('posts only model/state/questions with auth headers', async () => {
    process.env['OPENROUTER_API_KEY'] = 'test-key'
    const fetchMock = mockFetchOnce(async (_url: unknown, init: unknown) => ({
      ok: true,
      status: 200,
      json: async () => successBody,
    }))

    const response = await askJev('state', questions, { timeoutMs: 1000 })

    expect(response.model).toBe(successBody.model)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = (fetchMock.mock.calls[0] ?? []) as [unknown, RequestInit]
    expect(url).toBe('https://openrouter.ai/api/alpha/decisions')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-key')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(JSON.parse(String(init.body))).toEqual({
      model: 'typesafe/jev-1.13',
      state: 'state',
      questions,
    })
  })

  it('throws when the API key is missing', async () => {
    delete process.env['OPENROUTER_API_KEY']
    await expect(askJev('state', questions, { timeoutMs: 1000 })).rejects.toThrow('OPENROUTER_API_KEY')
  })

  it.each([
    [{ bad: { type: 'noul', instructions: 'Do it?', criteria: { action: 'yes', no_action: 'no' } } }],
    [{ bad: { type: 'noul', instructions: 'Do it?', criteria: ['yes', 'no'] } }],
    [{ bad: { type: 'noul', instructions: 'Do it?', criteria: { true: 'yes' } } }],
    [{ bad: { type: 'noul', instructions: 'Do it?' } }],
  ])('rejects invalid noul criteria locally without calling the API (%s)', async badQuestions => {
    process.env['OPENROUTER_API_KEY'] = 'test-key'
    const fetchMock = mockFetchOnce(async () => ({ ok: true, status: 200, json: async () => successBody }))
    await expect(askJev('state', badQuestions as never, { timeoutMs: 1000 })).rejects.toThrow(/criteria/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws on HTTP failure', async () => {
    process.env['OPENROUTER_API_KEY'] = 'test-key'
    mockFetchOnce(async () => ({ ok: false, status: 500, text: async () => 'bad' }))
    await expect(askJev('state', questions, { timeoutMs: 1000 })).rejects.toThrow('status 500')
  })

  it('throws on missing answers and wrong answer type', async () => {
    process.env['OPENROUTER_API_KEY'] = 'test-key'
    mockFetchOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ...successBody, answers: {} }),
    }))
    await expect(askJev('state', questions, { timeoutMs: 1000 })).rejects.toThrow("missing answer")

    mockFetchOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        ...successBody,
        answers: { permission_decision: { type: 'noul', noul: 1 } },
      }),
    }))
    await expect(askJev('state', questions, { timeoutMs: 1000 })).rejects.toThrow('wrong type')
  })

  it('honours an already-aborted signal', async () => {
    process.env['OPENROUTER_API_KEY'] = 'test-key'
    const controller = new AbortController()
    controller.abort()
    await expect(askJev('state', questions, { signal: controller.signal, timeoutMs: 1000 })).rejects.toThrow()
  })
})
