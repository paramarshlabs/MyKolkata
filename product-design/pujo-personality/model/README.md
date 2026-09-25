# The Pujo Personality model

The runnable core of the bible: the configuration, the scoring engine, and the tools that prove it works. Dependency-free; needs only Node 20 or later.

## Files

| File | What it is |
|---|---|
| `dimensions.json` | The fourteen dimensions, their anchors, families, and which may be used commercially; the unscored preference facets |
| `archetypes.json` | The nine archetypes: names, taglines, sigils, card grounds, prototypes (μ), importance weights (λ), pair relationships, squad roles |
| `questions.json` | Every question: core flow, rapid-fire, tie-breakers, alternates, preferences, each option's evidence, reaction line and rationale |
| `calibration.json` | Generated. Neutral-prior offsets per archetype, and the neutral mean and spread per dimension (for drawing the DNA) |
| `scoring.mjs` | The engine: balanced evidence, the estimate, distance plus centred cosine, softmax, the result, the tie-breaker, explanations, DNA petals |
| `simulate.mjs` | Synthetic-respondent validation. Writes `SIMULATION.md` with `--write` |
| `tune.mjs` | Parameter sweeps for the scoring method and temperatures |
| `calibrate.mjs` | Fits the neutral-prior offsets. Writes `calibration.json` |
| `render-question-bank.mjs` | Generates `../04-question-bank.md` from `questions.json` |
| `model.test.mjs` | Integrity and behaviour tests (17) |
| `SIMULATION.md` | Generated. The latest validation report |

## Commands

Run from the repository root.

```bash
node --test "product-design/pujo-personality/model/*.test.mjs"             # tests
node product-design/pujo-personality/model/simulate.mjs --write              # validation report
node product-design/pujo-personality/model/calibrate.mjs                     # refit calibration
node product-design/pujo-personality/model/render-question-bank.mjs          # regenerate the question bank doc
node product-design/pujo-personality/model/tune.mjs                          # parameter sweep
```

`SIM_N` and `CAL_N` set the number of synthetic respondents (defaults: 4,000 and 30,000).

## Using the engine

```js
import { evaluate } from './scoring.mjs'

const result = evaluate(
  [
    { questionId: 'q_last_pandal', optionIds: ['a'] },
    { questionId: 'q_soundtrack', optionIds: ['e', 'b'] },
    // …
  ],
  { questionsDoc, archetypesDoc, dimensionsDoc, opts: { bias: calibration.bias } },
)

result.primary      // 'night_owl'
result.secondary    // 'pet_pujari' or null (pure)
result.band         // 'clear' | 'leaning' | 'close'
result.tiebreak     // { dim, questionId } when band is 'close'
result.ranked       // every archetype with probability, distance, cosine
result.vector       // fourteen dimension values
result.because      // the three dimensions that pulled hardest
```

If `result.tiebreak` is set, ask that question, append the answer and call `evaluate` again. Pass `calibration.bias` in production.

## Changing the model safely

1. Edit the JSON.
2. `node --test` (structure and canonical cases must pass).
3. `simulate.mjs`: recovery at p = 0.6 should stay above 90% for every archetype, and random respondents between 8% and 15% per archetype before calibration.
4. `calibrate.mjs`, then `simulate.mjs --write` again.
5. `render-question-bank.mjs`.
6. Bump `version` in the JSON files, and note what changed and why.

Results saved in production record the model version that produced them, so a change never silently rewrites anyone's identity.

## Porting to the app

Copy `scoring.mjs` to `frontend/lib/pujo-personality/scoring.ts` (it is plain ES, so it only needs types), serve the JSON through `GET /api/pujo/config`, and move `model.test.mjs` into `frontend/tests/`. The client scores for an instant reveal; the server recomputes whenever a result is saved.
