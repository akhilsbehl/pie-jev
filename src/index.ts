import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { Text } from '@earendil-works/pi-tui'
import { Type, type Static } from 'typebox'
import { askJev } from './jev.js'

export { askJev } from './jev.js'
export type { JevAnswer, JevQuestion, JevQuestionType, JevRequestControl, JevResponse } from './jev.js'
export { DEFAULT_JEV_TIMEOUT_MS, JEV_ENDPOINT, JEV_MODEL } from './jev.js'

const JevQuestionSchema = Type.Object({
  type: Type.Union([Type.Literal('noul'), Type.Literal('choice'), Type.Literal('score')]),
  instructions: Type.String({ minLength: 1, description: 'What the model must evaluate for this question.' }),
  criteria: Type.Any({
    description:
      "Per-type criteria. noul REQUIRES an object with 'true' and 'false' entries, e.g. {\"true\": \"Urgent\", \"false\": \"Not urgent\"}; any other shape fails. choice takes an object mapping each option name to its description. score takes an array of level labels.",
  }),
})

const AskJevInputSchema = Type.Object({
  state: Type.String({ minLength: 1, description: 'The full state/context string the model evaluates.' }),
  questions: Type.Record(Type.String({ minLength: 1 }), JevQuestionSchema, {
    minProperties: 1,
    description: 'At least one named question to evaluate against the state.',
  }),
})

type AskJevInput = Static<typeof AskJevInputSchema>

export function prettyPrint(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function toolResult(response: { model: string; answers: unknown; usage: unknown; id: string; provider: string }) {
  return {
    content: [{ type: 'text' as const, text: prettyPrint(response) }],
    details: response,
  }
}

export default function pieJevExtension(pi: ExtensionAPI): void {
  pi.registerTool({
    name: 'ask_jev',
    label: 'Ask JEV',
    description: 'Ask JEV (OpenRouter Decisions API) a structured state/questions evaluation. Requires explicit state and questions; do not invent them.',
    promptSnippet: 'Ask JEV with explicit state and questions',
    promptGuidelines: ['Use ask_jev when you have an explicit state string and structured questions to evaluate with JEV.'],
    parameters: AskJevInputSchema,
    async execute(_toolCallId, params: AskJevInput, signal) {
      const response = await askJev(params.state, params.questions, { signal })
      return toolResult(response)
    },
    renderCall(args, theme, context) {
      const names = Object.keys(args.questions).join(', ')
      const summary = `${theme.fg('success', theme.bold('ask_jev'))}${theme.fg('muted', ` · ${names}`)}`
      if (!context.expanded) {
        return new Text(summary, 0, 0)
      }
      return new Text(
        `${summary}\n${theme.fg('success', 'Prompt:')}\n${theme.fg('success', prettyPrint({ state: args.state, questions: args.questions }))}`,
        0,
        0,
      )
    },
    renderResult(result, options, theme, context) {
      if (!options.expanded) {
        return new Text('', 0, 0)
      }
      const details = result.details as Record<string, unknown> | undefined
      const textBody = String(
        (result.content as Array<{ type: string; text?: string }>).find(item => item.type === 'text')?.text ?? '',
      )
      if (context.isError || details === undefined || (typeof details === 'object' && Object.keys(details).length === 0)) {
        return new Text(`\n${theme.fg('error', textBody.trim() === '' ? 'Unknown error' : textBody)}`, 0, 0)
      }
      return new Text(
        `\n${theme.fg('border', 'Response:')}\n${theme.fg('border', prettyPrint(details))}`,
        0,
        0,
      )
    },
  })
}
