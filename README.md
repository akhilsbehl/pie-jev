# pie-jev

Standalone JEV client library and Pi extension. It exports `askJev` and exposes that same function as Pi's top-level `ask_jev` tool.

## Library

```ts
import { askJev } from 'pie-jev'

const response = await askJev(
  'Help! My payouts have been failing for 3 days.',
  {
    is_urgent: {
      type: 'noul',
      instructions: 'Does this message convey urgency?',
      criteria: { true: 'Explicitly time-sensitive', false: 'No urgency expressed' },
    },
  },
  { signal: AbortSignal.timeout(90_000), timeoutMs: 90_000 },
)
```

`askJev(state, questions, control?)` posts to `https://openrouter.ai/api/alpha/decisions` with `Content-Type: application/json` and `Authorization: Bearer $OPENROUTER_API_KEY`. The body contains only `model: "typesafe/jev-1.13"`, `state`, and `questions`. It returns `{ model, answers, usage, id, provider }`. Answer values are type-specific (`noul`, `choice`, or `score` fields — not a universal `answer` field). Answer metadata is preserved after validating the top-level object, named answer presence, and requested answer type.

The narrow third argument is cancellation/timeout control only (`signal`, `timeoutMs`). There are no model/provider/sampling controls. HTTP, timeout, cancellation, JSON, and response-shape failures throw.

## Pi tool

Top-level Pi tool `ask_jev` takes exactly:

```json
{ "state": "string", "questions": { "question_name": { "type": "noul|choice|score", "instructions": "string", "criteria": "any" } } }
```

It returns the successful JEV response object and delegates to `askJev` through one shared transport path. Failures throw a tool error.

Requires `OPENROUTER_API_KEY` in the environment.

## Development

Run `npm run typecheck`, `npm test`, and `npm run build`. Generated `dist/` files are tracked.

## License

[MIT](LICENSE).
