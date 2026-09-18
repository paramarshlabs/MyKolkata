import assert from 'node:assert/strict'
import { access, readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8')

const exists = (relativePath) =>
  access(new URL(`../${relativePath}`, import.meta.url)).then(() => true, () => false)

test('Next does not force immutable caching for development assets', async () => {
  const config = await readSource('next.config.ts')

  assert.doesNotMatch(config, /source:\s*['"]\/_next\/static\/:path\*['"]/)
  assert.doesNotMatch(config, /max-age=31536000,\s*immutable/)
})

test('the authenticated app shell is the notch bar, with the account inside it', async () => {
  const shell = await readSource('components/layout/MainShell.tsx')
  const nav = await readSource('components/layout/Navbar.tsx')

  assert.match(shell, /<Navbar \/>/)
  assert.doesNotMatch(shell, /UserMenu|TopNavbar|DarkModeToggle/)
  assert.match(nav, /className="mk-notchbar"/)
  assert.match(nav, /className="bezel"/)
  assert.match(nav, /nn nn-logo/)
  assert.match(nav, /nn nn-menu/)
  assert.match(nav, /nn nn-right/)
  assert.match(nav, /nn nn-island/)
  assert.match(nav, /<UserMenu \/>/)
  assert.match(nav, /aria-current=\{active \? 'page' : undefined\}/)
})

test('navigation search hands off to Near You, except on Near You itself', async () => {
  const nav = await readSource('components/layout/Navbar.tsx')

  assert.match(nav, /router\.push\(`\/near-you\?\$\{new URLSearchParams\(\{ view: 'grid', q: query \}\)\}`\)/)
  assert.match(nav, /const showSearch = !pathname\.startsWith\('\/near-you'\)/)
  assert.match(nav, /e\.key === '\/'/)
})

test('dark is the only experience — the theme toggle and provider are gone', async () => {
  assert.equal(await exists('components/layout/DarkModeToggle.tsx'), false)
  assert.equal(await exists('components/layout/TopNavbar.tsx'), false)
  assert.equal(await exists('components/providers/ThemeProvider.tsx'), false)

  const providers = await readSource('components/providers/AppProviders.tsx')
  assert.doesNotMatch(providers, /ThemeProvider/)
  assert.match(providers, /appearance=\{clerkAppearance\}/)
})

test('Clerk is dressed in the brand once, for every auth component', async () => {
  const appearance = await readSource('lib/clerkAppearance.ts')

  assert.match(appearance, /colorPrimary: '#d72638'/)
  assert.match(appearance, /colorBackground: '#141819'/)
  assert.match(appearance, /fontWeight: \{ normal: 400, medium: 400, semibold: 400, bold: 400 \}/)
  assert.doesNotMatch(appearance, /!'/)
})

test('Clerk components are sized through appearance, never structural .cl-* CSS', async () => {
  const stylesheets = (await Promise.all(['app/', 'styles/'].map(async (dir) =>
    (await readdir(new URL(`../${dir}`, import.meta.url), { recursive: true }))
      .filter((entry) => entry.endsWith('.css'))
      .map((entry) => `${dir}${entry}`)))).flat()
  assert.ok(stylesheets.includes('styles/auth.css'))

  for (const sheet of stylesheets) {
    const css = (await readSource(sheet)).replace(/\/\*[\s\S]*?\*\//g, '')
    assert.doesNotMatch(css, /\.cl-[\w-]+/, `${sheet} targets Clerk's internal DOM`)
  }
})

test('the image optimizer is not an open proxy', async () => {
  const config = await readSource('next.config.ts')

  assert.doesNotMatch(config, /hostname:\s*['"]\*\*?['"]/)
})
