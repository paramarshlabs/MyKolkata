/*
 * Builds lib/pujo-personality/content.json from the nine character bibles in
 * product-design/pujo-personality/archetypes/. The bibles are where the lore
 * is written and reviewed; the app reads this generated file, and
 * tests/pujoPersonalityContent.test.mjs fails if the two drift apart.
 *
 *   node scripts/pujo/build-content.mjs        (from frontend/)
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const frontend = new URL('../../', import.meta.url)
const biblesDir = new URL('../product-design/pujo-personality/archetypes/', frontend)
const archetypesJson = new URL('lib/pujo-personality/model/archetypes.json', frontend)
const matchDoc = new URL('../product-design/pujo-personality/07-pujo-match.md', frontend)
const output = new URL('lib/pujo-personality/content.json', frontend)

/* The design system has no italic or bold to give, so the markdown emphasis goes. */
const plain = (s) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim()

function section(md, heading, next = /^## /m) {
  const start = md.indexOf(heading)
  if (start < 0) return ''
  const rest = md.slice(start + heading.length)
  const end = rest.search(next)
  return end < 0 ? rest : rest.slice(0, end)
}

function tableRow(md, key) {
  const row = md.split('\n').find((line) => line.startsWith(`| **${key}**`))
  if (!row) return ''
  return plain(row.split('|').slice(2, -1).join('|'))
}

function afterBold(md, label) {
  const line = md.split('\n').find((l) => l.startsWith(`**${label}`))
  if (!line) return ''
  return plain(line.replace(/^\*\*[^*]+\*\*\s*/, ''))
}

function listAfter(md, label) {
  const lines = md.split('\n')
  const start = lines.findIndex((l) => l.startsWith(`**${label}`))
  if (start < 0) return []
  const items = []
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) { if (items.length) break; continue }
    const m = line.match(/^(?:\d+\.|-)\s+(.*)$/)
    if (!m) break
    items.push(plain(m[1]).replace(/^"|"$/g, ''))
  }
  return items
}

export async function buildContent() {
  const { archetypes } = JSON.parse(await readFile(archetypesJson, 'utf8'))
  const files = (await readdir(biblesDir)).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()
  const out = {}

  for (const file of files) {
    const md = await readFile(new URL(file, biblesDir), 'utf8')
    const title = md.match(/^# (.+?) — (.+)$/m)
    if (!title) throw new Error(`${file}: no title`)
    const archetype = archetypes.find((a) => a.name === title[1].trim())
    if (!archetype) throw new Error(`${file}: "${title[1]}" is not an archetype in archetypes.json`)

    const bnRow = tableRow(md, 'বাংলা')
    const gloss = bnRow.includes('(') ? bnRow.slice(bnRow.indexOf('(') + 1).replace(/\)$/, '') : ''
    const lore = section(md, '## 2. Lore').split(/\n\s*\n/).map((p) => plain(p.replace(/\n/g, ' '))).filter(Boolean)
    const playlist = md.match(/A playlist called \*([^*]+)\*/)

    out[archetype.id] = {
      name: title[1].trim(),
      bn: title[2].trim(),
      bnGloss: gloss,
      tagline: tableRow(md, 'Tagline'),
      oneLine: tableRow(md, 'One line'),
      hour: tableRow(md, 'Hour on the Pujo Clock'),
      philosophy: tableRow(md, 'Core philosophy'),
      belief: tableRow(md, 'What they believe about Pujo'),
      difference: tableRow(md, 'What makes them different'),
      lore,
      light: afterBold(md, 'Light:'),
      shadow: afterBold(md, 'Shadow'),
      says: listAfter(md, 'What they say.'),
      proud: afterBold(md, 'What makes them proud.'),
      playlist: playlist ? playlist[1] : '',
      statements: listAfter(md, 'Shareable statements'),
    }
  }
  return { generatedFrom: 'product-design/pujo-personality', archetypes: out, pairs: await buildPairs(archetypes) }
}

/* The pair copy deck: 07-pujo-match.md §6, one table per kind of relationship. */
const PAIR_SECTIONS = [
  ['### 6.1 Same archetype', 'same'],
  ['### 6.2 Kin', 'kin'],
  ['### 6.3 Complement', 'complement'],
  ['### 6.4 Spark', 'spark'],
  ['### 6.5 Crossover', 'crossover'],
]

async function buildPairs(archetypes) {
  const md = await readFile(matchDoc, 'utf8')
  const idOf = (name) => {
    const a = archetypes.find((x) => x.name === name.trim())
    if (!a) throw new Error(`07-pujo-match.md: unknown archetype "${name}"`)
    return a.id
  }
  const pairs = []
  for (const [heading, kind] of PAIR_SECTIONS) {
    const rows = section(md, heading, /^#{2,3} /m).split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Pair'))
    for (const row of rows) {
      const [pair, headline, line, plan] = row.split('|').slice(1, -1).map((c) => plain(c))
      const [a, b] = pair.split(' + ').map(idOf)
      pairs.push({ a, b, kind, headline, line, plan })
    }
  }
  return pairs
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const content = await buildContent()
  await writeFile(output, JSON.stringify(content, null, 2) + '\n')
  console.log(`Wrote ${Object.keys(content.archetypes).length} archetypes to lib/pujo-personality/content.json`)
}
