/*
 * Cookie consent, as this browser keeps it. Sign-in cookies are strictly
 * necessary and need no consent; analytics (Google Analytics and Vercel Web
 * Analytics) load only after a visitor says yes. The choice is kept in
 * localStorage and can be changed any time from "Cookie settings" in the
 * footer. Storage that throws (private windows, blocked site data) just means
 * the banner asks again, and nothing loads until it is answered.
 */

export type Consent = 'granted' | 'denied'

export const CONSENT_KEY = 'mk.consent.v1'
const KEY = CONSENT_KEY
const CHANGE = 'mk-consent-change'
const OPEN = 'mk-consent-open'

export function readConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function writeConsent(value: Consent) {
  const before = readConsent()
  try {
    window.localStorage.setItem(KEY, value)
  } catch {
    /* remembered for this page view only */
  }
  document.documentElement.dataset.consent = value
  window.dispatchEvent(new Event(CHANGE))
  /* a script already running can't be unloaded: drop its cookies and start clean */
  if (before === 'granted' && value === 'denied') {
    clearAnalyticsCookies()
    window.location.reload()
  }
}

export const analyticsAllowed = () => typeof window !== 'undefined' && readConsent() === 'granted'

/* for useSyncExternalStore */
export function subscribeConsent(onChange: () => void) {
  window.addEventListener(CHANGE, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener('storage', onChange)
  }
}
export const consentSnapshot = () => readConsent()
/* the server can't know, so it renders as undecided and loads nothing */
export const consentServerSnapshot = () => null

/* Runs in <head> before first paint (app/layout.tsx): marks <html> with a
   choice already made, so the server-rendered banner is hidden by CSS before
   it can flash. Plain ES5, no imports: it is inlined as a string. */
export const CONSENT_BOOT = `try{var c=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(c==='granted'||c==='denied')document.documentElement.dataset.consent=c}catch(e){}`

/* "Cookie settings" in the footer reopens the banner */
export const openConsent = () => window.dispatchEvent(new Event(OPEN))
export function subscribeOpenConsent(onOpen: () => void) {
  window.addEventListener(OPEN, onOpen)
  return () => window.removeEventListener(OPEN, onOpen)
}

function clearAnalyticsCookies() {
  const host = window.location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim())) {
    if (!/^_ga|^_gid$|^_gat/.test(name)) continue
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}
