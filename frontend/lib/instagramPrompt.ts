/*
 * When the "Follow us on Instagram" card may appear. The rules, so it stays a
 * nudge and never a nag:
 *
 *   - never on arrival: only after a few pages of browsing in this visit;
 *   - at a quiet moment, a few seconds into a page, never while someone is
 *     typing, in a dialog, or has the cookie question still open;
 *   - at most once a visit, at most twice ever, two days apart;
 *   - never again once "Follow" is pressed.
 *
 * Kept in localStorage (the lifetime record) and sessionStorage (this visit).
 * Blocked storage means it never shows, which is the right way to fail.
 */

export const PAGES_BEFORE_PROMPT = 3
export const MAX_SHOWS = 2
export const DAYS_BETWEEN = 2
const DAY_MS = 24 * 60 * 60 * 1000

type Record_ = { followed: boolean; shows: number; lastShownAt: number | null }
const KEY = 'mk.instagram.v1'
const SESSION_KEY = 'mk.instagram.session'

export function readRecord(): Record_ | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Record_>) : {}
    return { followed: parsed.followed === true, shows: Number(parsed.shows) || 0, lastShownAt: Number(parsed.lastShownAt) || null }
  } catch {
    return null
  }
}

function writeRecord(record: Record_) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(record))
  } catch {
    /* nothing remembered: the card won't be asked for again this visit anyway */
  }
}

type Visit = { pages: number; shown: boolean }
function readVisit(): Visit | null {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? '{}') as Partial<Visit>
    return { pages: Number(parsed.pages) || 0, shown: parsed.shown === true }
  } catch {
    return null
  }
}
function writeVisit(visit: Visit) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(visit))
  } catch {
    /* as above */
  }
}

/* Called on every page view in the app; returns this visit's page count. */
export function countPage(): number {
  const visit = readVisit()
  if (!visit) return 0
  const next = { ...visit, pages: visit.pages + 1 }
  writeVisit(next)
  return next.pages
}

/* The pure rule, so it can be tested without a browser. */
export function eligible(record: Record_ | null, visit: Visit | null, now: number): boolean {
  if (!record || !visit) return false
  if (record.followed || record.shows >= MAX_SHOWS || visit.shown) return false
  if (visit.pages < PAGES_BEFORE_PROMPT) return false
  if (record.lastShownAt && now - record.lastShownAt < DAYS_BETWEEN * DAY_MS) return false
  return true
}

export const mayShow = (now = Date.now()) => eligible(readRecord(), readVisit(), now)

export function markShown(now = Date.now()) {
  const record = readRecord()
  const visit = readVisit()
  if (!record || !visit) return
  writeRecord({ ...record, shows: record.shows + 1, lastShownAt: now })
  writeVisit({ ...visit, shown: true })
}

export function markFollowed() {
  const record = readRecord() ?? { followed: false, shows: 0, lastShownAt: null }
  writeRecord({ ...record, followed: true })
}

/* nothing else is asking for attention: no typing, no dialog, no cookie question */
export function quietMoment(): boolean {
  if (document.visibilityState !== 'visible') return false
  const active = document.activeElement
  if (active && (active.matches('input, textarea, select, [contenteditable="true"]'))) return false
  /* the cookie banner is in the page even when it's hidden, so only a visible one counts */
  const busy = document.querySelectorAll('.mk-modal, .mk-backdrop, [role="dialog"][aria-modal="true"], .mk-consent')
  return ![...busy].some((el) => el.getClientRects().length > 0)
}
