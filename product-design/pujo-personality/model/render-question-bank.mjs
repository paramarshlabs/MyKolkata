/*
 * Renders ../04-question-bank.md from questions.json so the document can never
 * drift from the model.
 *   node product-design/pujo-personality/model/render-question-bank.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const load = (f) => JSON.parse(readFileSync(join(here, f), 'utf8'))
const dimensionsDoc = load('dimensions.json')
const archetypesDoc = load('archetypes.json')
const questionsDoc = load('questions.json')
const DIM_NAME = Object.fromEntries(dimensionsDoc.dimensions.map((d) => [d.id, d.name]))
const ARCH = archetypesDoc.archetypes
const byId = Object.fromEntries(questionsDoc.questions.map((q) => [q.id, q]))

const align = (o, a) => Object.entries(o.evidence ?? {}).reduce((s, [d, [v, w]]) => s + w * a.importance[d] * (1 - 2 * Math.abs(v - a.prototype[d])), 0)
function signal(option) {
  const ranked = ARCH.map((a) => ({ a, s: align(option, a) })).sort((x, y) => y.s - x.s)
  if (!ranked[0] || ranked[0].s <= 0.15) return 'None (neutral)'
  const top = ranked.filter((r, i) => i === 0 || (r.s > 0.15 && r.s >= ranked[0].s * 0.7)).slice(0, 3)
  return top.map((r) => r.a.name).join(', ')
}
function strength(option) {
  const max = Math.max(0, ...Object.values(option.evidence ?? {}).map(([, w]) => w))
  if (max >= 0.9) return 'Strong'
  if (max >= 0.5) return 'Medium'
  if (max > 0) return 'Light'
  return 'None'
}
const ev = (o) => Object.entries(o.evidence ?? {}).map(([d, [v, w]]) => `${DIM_NAME[d]} ${v}×${w}`).join('<br>') || '—'
const measured = (q) => {
  const tot = {}
  for (const o of q.options) for (const [d, [, w]] of Object.entries(o.evidence ?? {})) tot[d] = (tot[d] ?? 0) + w
  return Object.entries(tot).sort((x, y) => y[1] - x[1]).map(([d]) => DIM_NAME[d]).join(', ')
}
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|')

const L = []
const w = (s = '') => L.push(s)

w('# D. Question bank')
w()
w('> Generated from [`model/questions.json`](model/questions.json) by `model/render-question-bank.mjs`. Edit the JSON, re-run the script, re-run `model/simulate.mjs`. Never edit this file by hand.')
w()
w('How to read the tables:')
w()
w('- **Evidence** is `dimension value×weight`. The value is where the answer places the person (0 to 1); the weight is how hard it pushes. The engine balances each question automatically (see `03-personality-system.md` §4), so an answer is also a small signal about the answers not chosen.')
w('- **Archetype signal** lists the archetypes an in-character respondent would pick this answer for, strongest first. It is computed from the prototypes, not hand-labelled, so it stays honest when weights change.')
w('- **Strength** is the answer\'s strongest single push: Strong (0.9 or more), Medium (0.5 or more), Light (below 0.5).')
w()
w('## The flow a person actually sees')
w()
w('| Step | Questions | Time budget |')
w('|---|---|---|')
w(`| Core | ${questionsDoc.flow.core.length} scenario questions, one per screen | about 9 seconds each, 2 minutes in total |`)
w(`| Rapid-fire | ${questionsDoc.flow.rapid.length} this-or-that swipes on one screen, skippable | about 15 seconds |`)
w('| Tie-breaker | one binary question, only when the top two archetypes are within 6 points | about 3 seconds, shown to a minority |')
w(`| After the reveal | ${questionsDoc.flow.preferences.length} optional preference chips (never scored) | about 15 seconds |`)
w()
w('Target: reveal in under two and a half minutes from the first tap. The rapid-fire screen is skippable and costs almost nothing when skipped (98.7% to 98.5% recovery at p = 0.75 in simulation). It exists for delight and for shareable badges (Team Sabeki, Last Metro), not for accuracy. The mirror question is the opposite: removing it costs 1 to 4 points.')
w()
w('Order matters. The quiz opens with the most recognisable Pujo dilemma (1:30 am, one last pandal), puts the emotional questions (love, Dashami) near the end when the person is invested, and closes on the mirror question (pick a frame) so the last thing they do is choose an image of themselves.')
w()
w('## Coverage by topic')
w()
w('The brief asked for questions across thirteen topics. Where each is covered:')
w()
w('| Topic | Covered by |')
w('|---|---|')
const topics = [
  ['Pujo behaviour', '`q_last_pandal`, `q_plan`, `q_queue`, `q_theme_pandal`'],
  ['Music', '`q_soundtrack`, `q_dhaak`; `rf_dance` in reserve'],
  ['Fashion', '`q_ashtami_look`, `rf_photo`'],
  ['Food', '`q_plate`, plus food answers in `q_last_pandal`, `q_queue`, `q_dhaak`, `q_love`, `q_dashami`; `rf_plate` in reserve'],
  ['Social life', '`q_crew`, `q_dashami`, plus squad answers in five other questions; `rf_table` in reserve'],
  ['Romance', '`q_love`, plus romance answers in `q_last_pandal`, `q_plate`, `q_ashtami_look`, `q_theme_pandal`, `q_crew`'],
  ['Nightlife', '`q_last_pandal`, `q_queue` (the 3 am answer), `rf_metro`'],
  ['Art', '`q_theme_pandal`, `rf_theme`, plus art answers in `q_plan`, `q_dhaak`, `q_crew`'],
  ['Tradition', '`q_mahalaya`, `q_dashami`, `q_ashtami_look` (laal-paar), `q_plate` (bhog)'],
  ['Nostalgia', '`q_mahalaya`, `q_soundtrack` (old Pujo songs), `q_theme_pandal` (ek-chala); `alt_memory` in reserve'],
  ['Exploration', '`q_plan`, `rf_para`, `q_dhaak` (keep moving), `q_ashtami_look` (sneakers)'],
  ['Budget', '`pref_budget`, after the reveal. Deliberately never scored, so no archetype becomes a class marker'],
  ['Crowd tolerance', '`q_queue`, `rf_crush`, plus crowd answers in `q_plan`, `q_crew`, `q_dhaak`, `q_dashami`'],
]
for (const [t, q] of topics) w(`| ${t} | ${q} |`)
w()

const section = (title, ids, intro) => {
  w(`## ${title}`)
  w()
  if (intro) { w(intro); w() }
  for (const id of ids) {
    const q = byId[id]
    w(`### \`${q.id}\`: ${esc(q.prompt)}`)
    w()
    if (q.visual) w(`- **Visual:** ${q.visual}`)
    w(`- **Type:** ${q.type}${q.maxSelect ? `, up to ${q.maxSelect}` : ''}`)
    w(`- **Measures:** ${measured(q)}`)
    if (q.rationale) w(`- **Why it's here:** ${q.rationale}`)
    if (q.musicReinforce) w(`- **Could music data reinforce it:** ${q.musicReinforce}`)
    w()
    const hasReaction = q.options.some((o) => o.reaction)
    w(`| Answer | ${hasReaction ? 'Reaction line (shown after the tap) | ' : ''}Evidence | Archetype signal | Strength |`)
    w(`|---|${hasReaction ? '---|' : ''}---|---|---|`)
    for (const o of q.options) {
      w(`| ${esc(o.text)} | ${hasReaction ? `${esc(o.reaction) || '—'} | ` : ''}${ev(o)} | ${signal(o)} | ${strength(o)} |`)
    }
    w()
  }
}

section('Core questions', questionsDoc.flow.core)
section('Rapid-fire (shown)', questionsDoc.flow.rapid, 'One screen, five swipes, reusing the swipe interaction that already exists on the `/tinder` page. Each swipe carries about a third of a core question\'s weight.')
section('Rapid-fire (in reserve)', questionsDoc.questions.filter((q) => q.block === 'rapid' && !questionsDoc.flow.rapid.includes(q.id)).map((q) => q.id), 'Swap in for A/B tests, or next season to keep the quiz fresh for people retaking it.')

w('## Tie-breakers')
w()
w('Shown only when the two leading archetypes are within the tie margin. The engine picks the dimension that best separates those two archetypes and that it knows least about, then asks the matching question below. On screen it is framed as drama, not doubt: "It\'s close. One more."')
w()
w('| Dimension | Question | Answers |')
w('|---|---|---|')
for (const q of questionsDoc.questions.filter((x) => x.block === 'tiebreak')) {
  w(`| ${DIM_NAME[q.dim]} | ${esc(q.prompt)} | ${q.options.map((o) => esc(o.text)).join(' / ')} |`)
}
w()
section('Alternates', questionsDoc.questions.filter((q) => q.block === 'alternate').map((q) => q.id), 'Fully weighted replacements for rotation and A/B tests. Keep the core flow fixed for launch so every result is comparable; rotate from the second week once the calibration has real data.')

w('## After the reveal: preference chips (never scored)')
w()
w('Asked after the person has their identity, framed as "Tune your recommendations". They filter and rank recommendations and set the status badge. They never touch the archetype, so an identity can never become a proxy for diet, budget, class or neighbourhood.')
w()
w('| Question | Options | Used for |')
w('|---|---|---|')
const used = {
  status: 'Status badge (Homecomer, First Pujo, Far away). Homecomers get compressed routes; far-away users get the live and watch-from-anywhere layer.',
  diet: 'Hard filter on food recommendations.',
  move: 'Route shape: walking clusters, Metro-first routes, or cab-friendly hops.',
  budget: 'Ranking only, never a hard filter unless the person asks. Optional.',
  turf: 'Starting point for routes. Coarse zones only; never a precise location.',
  age_band: 'Age gate. Under 18: full reveal and a downloadable card, nothing stored, no Pujo Match, no personalised ads (DPDP Act, s.9).',
}
for (const id of questionsDoc.flow.preferences) {
  const q = byId[id]
  w(`| ${esc(q.prompt)} | ${q.options.map((o) => esc(o.text)).join(' / ')} | ${used[q.facet] ?? ''} |`)
}
w()
w('## Retired during design')
w()
w('- **"A list of places to eat. The pandals are whatever\'s next door."** (from `q_plan`). The best line in the quiz, but the Pet Pujari already had six strong homes and the Shiuli had none in that question; simulation showed Shiuli collapsing into Para Kid without a dawn answer there. Use the line in Pet Pujari marketing instead.')
w('- **"Me and my camera."** (from `q_crew`). Merged into "Just me and my camera, early, before anyone else is up." so the Shiuli and the Art Kid share a solitary answer instead of the Shiuli being forced into the family answer.')
w()

writeFileSync(join(here, '..', '04-question-bank.md'), L.join('\n') + '\n')
console.log(`Wrote 04-question-bank.md (${L.length} lines)`)
