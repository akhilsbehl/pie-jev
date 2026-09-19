import { describe, expect, it, vi, afterEach } from 'vitest'
import pieJevExtension, { prettyPrint } from './index.js'

const params = {
  state: 'Help! My payouts have been failing for 3 days.',
  questions: {
    is_urgent: {
      type: 'noul' as const,
      instructions: 'Does this message convey urgency?',
      criteria: { true: 'Explicitly time-sensitive', false: 'No urgency expressed' },
    },
  },
}

const response = {
  model: 'typesafe/jev-1.13-20260917',
  answers: { is_urgent: { type: 'noul', noul: 0.99 } },
  usage: { input_tokens: 10, output_tokens: 5 },
  id: 'gen-1',
  provider: 'TypeSafe',
}

function registeredTool() {
  let captured: any
  pieJevExtension({ registerTool: (tool: any) => { captured = tool } } as never)
  if (captured === undefined) throw new Error('ask_jev was not registered')
  return captured
}

const seenColors: string[] = []
const theme = {
  fg: (color: string, text: string) => {
    seenColors.push(color)
    return text
  },
  bold: (text: string) => text,
}

function rendered(component: { render: (width: number) => string[] }): string {
  return component.render(120).join('\n')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ask_jev rendering', () => {
  it('pretty-prints arbitrary values', () => {
    expect(prettyPrint({ a: 1 })).toBe('{\n  "a": 1\n}')
  })

  it('shows a one-line summary when collapsed and the full prompt when expanded', () => {
    const tool = registeredTool()
    const collapsed = rendered(tool.renderCall(params, theme, { expanded: false }))
    expect(collapsed).toContain('ask_jev')
    expect(collapsed).toContain('is_urgent')
    expect(collapsed).not.toContain('Help! My payouts have been failing')
    const expanded = rendered(tool.renderCall(params, theme, { expanded: true }))
    expect(expanded).toContain('ask_jev')
    expect(expanded).toContain('Prompt:')
    expect(expanded).toContain('Help! My payouts have been failing')
    expect(expanded).toContain('"is_urgent"')
    expect(seenColors).toContain('success')
  })

  it('hides the response when collapsed and shows it pretty-printed when expanded', () => {
    const tool = registeredTool()
    const result = { content: [{ type: 'text', text: prettyPrint(response) }], details: response }
    expect(rendered(tool.renderResult(result, { expanded: false }, theme, {})).trim()).toBe('')
    const expanded = rendered(tool.renderResult(result, { expanded: true }, theme, {}))
    expect(expanded).toContain('Response:')
    expect(expanded).toContain('gen-1')
    expect(expanded).toContain('\n  ')
    expect(expanded).not.toContain('Help! My payouts have been failing')
    expect(seenColors).toContain('border')
    expect(seenColors.every(color => !color.startsWith('#'))).toBe(true)
  })

  it('renders tool errors as error text instead of an empty response object', () => {
    const tool = registeredTool()
    const failure = {
      content: [{ type: 'text', text: 'JEV request failed with status 400' }],
      details: {},
    }
    expect(rendered(tool.renderResult(failure, { expanded: false }, theme, { isError: true })).trim()).toBe('')
    const expanded = rendered(tool.renderResult(failure, { expanded: true }, theme, { isError: true }))
    expect(expanded).toContain('JEV request failed with status 400')
    expect(expanded).not.toContain('Response:')
    expect(seenColors).toContain('error')
  })

  it('returns pretty-printed tool content from execute', async () => {
    process.env['OPENROUTER_API_KEY'] = 'test-key'
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => response })))
    const tool = registeredTool()
    const result = await tool.execute('call-1', params, undefined)
    const text = result.content[0]?.text ?? ''
    expect(() => JSON.parse(text)).not.toThrow()
    expect(JSON.parse(text)).toEqual(response)
    expect(text).toContain('\n  ')
  })
})
