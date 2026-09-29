import { WireOutOfCredits, WireRateLimited, type ScrapeRun, type WireRun } from './wire'

/* ==========================================================================
   Live feeds for /home. Each feed knows how to fetch itself (through Anakin);
   every one stays fresh for the same interval, LIVE_REFRESH_HOURS. This
   decides which feeds are due, takes a lease on each so two server instances
   never fetch the same one, and stores the result. The page only reads what
   is stored — it never waits on Anakin.
   ========================================================================== */

export type SearchResult = { url?: string; title?: string; snippet?: string; [key: string]: unknown }
export type SearchFn = (prompt: string, options?: { limit?: number }) => Promise<SearchResult[]>

/* `last` is what this feed stored before, for feeds that carry a lookup forward */
export type FeedContext = { wire: WireRun; search: SearchFn | null; scrape?: ScrapeRun | null; now: Date; last: unknown }

export type Feed<T = unknown> = {
  key: string
  /* true when what was stored has stopped being right before the interval is up */
  expired?: (now: Date, last: T | null) => boolean
  /* null when there was nothing worth showing */
  fetch: (ctx: FeedContext) => Promise<T | null>
}

export type LiveRow = { key: string; payload: unknown; fetchedAt: Date | null; attemptedAt: Date | null; error: string | null }

export interface LiveRepository {
  all(): Promise<LiveRow[]>
  /* true when this caller now holds the refresh lease for `key` */
  claim(key: string, now: Date, leaseMs: number): Promise<boolean>
  save(key: string, payload: unknown, now: Date): Promise<void>
  fail(key: string, message: string, now: Date): Promise<void>
}

/* what the page reads: the stored payload and when it was fetched */
export type LiveSnapshot = Record<string, { payload: unknown; fetchedAt: string }>

export const LEASE_MS = 3 * 60_000
/* after a failed or empty fetch, wait this long before trying that feed again */
export const RETRY_MS = 20 * 60_000

/* How long a fetch stays fresh: LIVE_REFRESH_HOURS in .env (fractions work,
   0 refreshes after every view), a day when it is unset or not a number. */
export function refreshIntervalMs(value = process.env.LIVE_REFRESH_HOURS) {
  const hours = value?.trim() ? Number(value) : NaN
  return Number.isFinite(hours) && hours >= 0 ? hours * 3_600_000 : 24 * 3_600_000
}

export function isDue(feed: Feed, row: LiveRow | undefined, now: Date, intervalMs = refreshIntervalMs()) {
  const t = now.getTime()
  const failedRecently = row?.attemptedAt && t - row.attemptedAt.getTime() < RETRY_MS
    && (row.error || !row.fetchedAt || row.attemptedAt > row.fetchedAt)
  if (failedRecently) return false
  if (!row?.fetchedAt) return true
  return t - row.fetchedAt.getTime() >= intervalMs || Boolean(feed.expired?.(now, (row.payload ?? null) as never))
}

export function dueFeeds(feeds: Feed[], rows: LiveRow[], now: Date, intervalMs = refreshIntervalMs()) {
  const byKey = new Map(rows.map((row) => [row.key, row]))
  return feeds
    .filter((feed) => isDue(feed, byKey.get(feed.key), now, intervalMs))
    /* never fetched first, then the stalest */
    .sort((a, b) => (byKey.get(a.key)?.fetchedAt?.getTime() ?? 0) - (byKey.get(b.key)?.fetchedAt?.getTime() ?? 0))
}

export function snapshotOf(rows: LiveRow[]): LiveSnapshot {
  const out: LiveSnapshot = {}
  for (const row of rows) {
    if (row.fetchedAt && row.payload != null) out[row.key] = { payload: row.payload, fetchedAt: row.fetchedAt.toISOString() }
  }
  return out
}

export type RefreshOptions = {
  repository: LiveRepository
  feeds: Feed[]
  wire: WireRun | null
  search?: SearchFn | null
  scrape?: ScrapeRun | null
  now?: Date
  /* at most this many feeds per run */
  max?: number
  /* stop starting new fetches after this long */
  budgetMs?: number
  only?: string[]
  /* a feed is due once its last fetch is this old */
  intervalMs?: number
  /* fetch every feed in `only` (or every feed) now, fresh or not, even while
     another refresh holds its lease: for scripts/live-refresh.ts */
  force?: boolean
  clock?: () => number
}

export type RefreshOutcome = { key: string; status: 'saved' | 'empty' | 'failed' | 'skipped'; error?: string }

export async function refreshLive({
  repository, feeds, wire, search = null, scrape = null, now = new Date(), max = 2, budgetMs = 45_000, only,
  intervalMs = refreshIntervalMs(), force = false, clock = Date.now,
}: RefreshOptions): Promise<RefreshOutcome[]> {
  if (!wire) return []
  const started = clock()
  const candidates = feeds.filter((feed) => !only || only.includes(feed.key))
  const rows = await repository.all()
  const lastOf = new Map(rows.map((row) => [row.key, row.payload]))
  const due = (force ? candidates : dueFeeds(candidates, rows, now, intervalMs)).slice(0, max)
  const outcomes: RefreshOutcome[] = []

  for (const feed of due) {
    if (clock() - started > budgetMs) break
    if (!(await repository.claim(feed.key, now, force ? 0 : LEASE_MS))) {
      outcomes.push({ key: feed.key, status: 'skipped' })
      continue
    }
    try {
      const payload = await feed.fetch({ wire, search, scrape, now, last: lastOf.get(feed.key) ?? null })
      if (payload == null) {
        await repository.fail(feed.key, 'nothing to show', now)
        outcomes.push({ key: feed.key, status: 'empty' })
      } else {
        await repository.save(feed.key, payload, now)
        outcomes.push({ key: feed.key, status: 'saved' })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await repository.fail(feed.key, message.slice(0, 300), now)
      outcomes.push({ key: feed.key, status: 'failed', error: message })
      /* no credits or no quota: every other feed would fail the same way */
      if (err instanceof WireOutOfCredits || err instanceof WireRateLimited) break
    }
  }
  return outcomes
}
