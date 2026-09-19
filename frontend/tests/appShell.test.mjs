import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
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
  assert.match(providers, /<AuthProvider>/)
})

test('Google is the only way in, through Supabase OAuth', async () => {
  const provider = await readSource('components/providers/AuthProvider.tsx')
  const button = await readSource('components/auth/GoogleSignIn.tsx')

  assert.match(provider, /signInWithOAuth\(\{\s*provider: 'google'/)
  assert.match(provider, /\/auth\/callback/)
  assert.doesNotMatch(provider, /signInWithPassword|signInWithOtp|signUp\(/)
  assert.match(button, /signInWithGoogle/)
})

test('auth screens are styled by the brand sheet, with no third-party widget', async () => {
  const css = await readSource('styles/auth.css')

  assert.match(css, /\.mk-auth-card/)
  assert.match(css, /\.mk-auth-error \{[^}]*var\(--mk-taxi\)/)
})

test('home plays the entry film as a 4:5 post on the door screen', async () => {
  const page = await readSource('app/(main)/home/page.tsx')
  const entry = await readSource('components/brand/HomeEntry.tsx')
  const css = await readSource('styles/brand.css')

  assert.match(page, /<HomeEntry/)
  assert.match(entry, /\/entry1\.mp4/)
  assert.match(entry, /sessionStorage/)
  assert.match(entry, /video\.muted = false/)
  assert.doesNotMatch(entry, /entry-splash/)
  assert.match(entry, /className="mk-entry-skip" onClick=\{dismiss\}/)
  assert.match(entry, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(css, /entry-splash/)
  assert.doesNotMatch(css, /\.mk-entry-video[^{]*\{[^}]*border-radius/)
  assert.match(css, /object-fit: contain/)
  assert.match(css, /mask-composite: intersect/)
  assert.match(css, /linear-gradient\(to right/)
  assert.match(css, /linear-gradient\(to bottom/)
})

test('the image optimizer is not an open proxy', async () => {
  const config = await readSource('next.config.ts')

  assert.doesNotMatch(config, /hostname:\s*['"]\*\*?['"]/)
})
