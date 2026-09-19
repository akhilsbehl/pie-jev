import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'
import { Text } from '@earendil-works/pi-tui'
import { Type, type Static } from 'typebox'
import { askJev } from './jev.js'

export { askJev } from './jev.js'
export type { JevAnswer, JevQuestion, JevQuestionType, JevRequestControl, JevResponse } from './jev.js'
export { DEFAULT_JEV_TIMEOUT_MS, JEV_ENDPOINT, JEV_MODEL } from './jev.js'

const JevQuestionSchema = Type.Object({
  type: Type.Union([Type.Literal('noul'), Type.Literal('choice'), Type.Literal('score')]),
  instructions: Type.String({ minLength: 1 }),
  criteria: Type.Any(),
})

const AskJevInputSchema = Type.Object({
  state: Type.String({ minLength: 1 }),
  questions: Type.Record(Type.String({ minLength: 1 }), JevQuestionSchema, { minProperties: 1 }),
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
      if (!context.expanded) {
        return new Text('', 0, 0)
      }
      return new Text(
        `\n${theme.fg('accent', 'Prompt:')}\n${theme.fg('toolOutput', prettyPrint({ state: args.state, questions: args.questions }))}`,
        0,
        0,
      )
    },
    renderResult(result, options, theme) {
      if (!options.expanded) {
        return new Text('', 0, 0)
      }
      const details = result.details as Record<string, unknown> | undefined
      const body =
        details !== undefined && typeof details === 'object'
          ? prettyPrint(details)
          : String(
              (result.content as Array<{ type: string; text?: string }>).find(item => item.type === 'text')?.text ?? '',
            )
      return new Text(`\n${theme.fg('accent', 'Response:')}\n${theme.fg('toolOutput', body)}`, 0, 0)
    },
  })
}
