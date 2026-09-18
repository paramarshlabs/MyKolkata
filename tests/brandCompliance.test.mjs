import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

/*
 * The house rules from /design.md, enforced across every page, component and
 * stylesheet. /brand-kit is the live reference and documents some of these
 * rules by breaking them on purpose, so it is exempt where noted.
 */

const root = new URL('../', import.meta.url)

async function walk(dir, exts) {
  const out = []
  for (const entry of await readdir(new URL(dir, root), { withFileTypes: true })) {
    const rel = `${dir}${entry.name}`
    if (entry.isDirectory()) out.push(...await walk(`${rel}/`, exts))
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(rel)
  }
  return out
}

/* commented-out code is not shipped UI */
const stripComments = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((line) => !/^\s*\/\//.test(line)).join('\n')

const sources = async (dirs, exts) => {
  const files = (await Promise.all(dirs.map((dir) => walk(dir, exts)))).flat()
  return Promise.all(files.map(async (file) => ({ file, text: stripComments(await readFile(new URL(file, root), 'utf8')) })))
}

const ui = await sources(['app/', 'components/'], ['.tsx'])
const css = await sources(['app/', 'styles/'], ['.css'])
const product = ui.filter(({ file }) => !file.startsWith('app/brand-kit/'))

const offenders = (files, pattern) => files.filter(({ text }) => pattern.test(text)).map(({ file }) => file)

test('no react-icons — the brand draws its own line icons and emblems', () => {
  assert.deepEqual(offenders(ui, /from ['"]react-icons/), [])
})

test('Clear Sans ships Regular only: no bold utilities and no heavy font-weight on Latin', () => {
  assert.deepEqual(offenders(product, /\bfont-(bold|semibold|extrabold|black|medium)\b/), [])
  assert.deepEqual(offenders(css, /font-weight:\s*(bold|[5-9]00)/), [])
})

test('no ALL-CAPS eyebrow labels', () => {
  assert.deepEqual(offenders(css, /text-transform:\s*uppercase/), [])
  assert.deepEqual(offenders(product, /\buppercase\b/), [])
})

test('the retired palette is gone — no gray, orange, blue or purple utilities', () => {
  const retired = /\b(bg|text|border|ring|from|to|via)-(gray|slate-\d|orange|amber|red|blue|green|yellow|purple|white|black)(-\d{2,3})?\b/
  assert.deepEqual(offenders(product, retired), [])
})

test('no pure #000 or #FFF anywhere in the UI', () => {
  const pure = /#(?:fff|ffffff|000|000000)\b/i
  assert.deepEqual(offenders(product, pure), [])
  assert.deepEqual(offenders(css.filter(({ file }) => file !== 'app/globals.css'), pure), [])
})

test('no emoji in product copy', () => {
  assert.deepEqual(offenders(product, /\p{Extended_Pictographic}/u), [])
})

test('no exclamation marks in product copy', () => {
  /* JSX text between tags, and string literals rendered as copy */
  assert.deepEqual(offenders(product, />[^<>{}]*[A-Za-z][^<>{}]*!\s*</), [])
})

test('Bengali in product markup is marked lang="bn"', () => {
  const unmarked = product.filter(({ text }) => text.split('\n').some((line) =>
    /[ঀ-৿]/.test(line) && /<[a-z]/.test(line) && !/lang="bn"/.test(line)))
  assert.deepEqual(unmarked.map(({ file }) => file), [])
})

test('every Pujo date lives in one constant', async () => {
  const all = await sources(['app/', 'components/', 'lib/'], ['.ts', '.tsx'])
  assert.deepEqual(offenders(all.filter(({ file }) => file !== 'lib/pujo.ts'), /2026-10-\d\d/), [])
})

test('the Tailwind theme is the brand and nothing else', async () => {
  const globals = await readFile(new URL('app/globals.css', root), 'utf8')
  for (const namespace of ['color', 'font', 'font-weight', 'radius', 'shadow']) {
    assert.match(globals, new RegExp(`--${namespace}-\\*: initial;`))
  }
  assert.match(globals, /--color-crimson: #d72638;/)
  assert.match(globals, /b, strong, th, optgroup \{ font-weight: 400; \}/)
})

test('fonts are self-hosted and the two Latin faces are preloaded', async () => {
  const layout = await readFile(new URL('app/layout.tsx', root), 'utf8')
  assert.match(layout, /preload\('\/fonts\/clear-sans-text\.woff2'/)
  assert.match(layout, /preload\('\/fonts\/clear-sans-display\.woff2'/)
})

test('the brand kit and the product share one kolka, one set of icons and one notch bar', async () => {
  const kit = await readFile(new URL('app/brand-kit/page.tsx', root), 'utf8')
  assert.match(kit, /from '@\/components\/brand\/kolka'/)
  assert.match(kit, /from '@\/components\/brand\/icons'/)
  assert.match(kit, /className="mk-notchbar"/)
  assert.doesNotMatch(kit, /function Medallion|const ICONS = |const EMBLEMS = |const MAHALAYA/)
})
