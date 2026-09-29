/*
 * Fetches /home's live feeds from Anakin now, into the same live_feeds table
 * the page reads, to check a feed works. Every fetch spends Anakin credits.
 *
 *   npm run live:refresh                         every feed, fresh or not
 *   npm run live:refresh -- youtube tonight      only these (youtube,tonight works too)
 *   npm run live:refresh -- --due                only the stale ones, as /home and the cron would
 *   npm run live:refresh -- --list [feeds]       when each was fetched and whether it is due; fetches nothing
 *
 * Feeds: sky, tonight, searching, adda, youtube, cricket, on-this-day.
 * Without --due it fetches even a fresh feed, and even while another refresh
 * holds its lease. Reads .env.local: DATABASE_URL, ANAKIN_API_KEY and
 * LIVE_REFRESH_HOURS (how long a fetch stays fresh, 24 when unset).
 */
import { FEEDS } from '../lib/live/feeds'
import { isDue, refreshIntervalMs, RETRY_MS, type Feed } from '../lib/live/refresh'
import { loadEnvFile } from './lib/load-env.mjs'

loadEnvFile()

/* after the env is loaded, so Prisma sees DATABASE_URL */
const { liveRepository, runLiveRefresh } = await import('../lib/live/store')
const { prisma } = await import('../lib/db/prisma')

const HOUR = 3_600_000
const USAGE = 'Usage: npm run live:refresh -- [--due | --list] [feed ...]'

const args = process.argv.slice(2)
const flags = args.filter((arg) => arg.startsWith('-') && !arg.startsWith('--only'))
const names = args
  .flatMap((arg) => (arg.startsWith('--only=') ? [arg.slice(7)] : arg.startsWith('-') ? [] : [arg]))
  .flatMap((arg) => arg.split(','))
  .map((name) => name.trim())
  .filter(Boolean)

function stop(message: string): never {
  console.error(message)
  process.exit(1)
}

if (flags.includes('--help') || flags.includes('-h')) {
  console.log(`${USAGE}\nFeeds: ${FEEDS.map((feed) => feed.key).join(', ')}`)
  process.exit(0)
}
const unknownFlag = flags.find((flag) => !['--due', '--list'].includes(flag))
if (unknownFlag) stop(`Unknown option ${unknownFlag}.\n${USAGE}`)
const unknown = names.filter((name) => !FEEDS.some((feed) => feed.key === name))
if (unknown.length) stop(`No feed called ${unknown.join(', ')}. Feeds: ${FEEDS.map((feed) => feed.key).join(', ')}`)

const selected = names.length ? FEEDS.filter((feed) => names.includes(feed.key)) : FEEDS
const width = Math.max(...selected.map((feed) => feed.key.length))

/* 40 min, 5 h, 3 d */
const span = (ms: number) => (ms < HOUR ? `${Math.round(ms / 60_000)} min` : ms < 48 * HOUR ? `${Math.round(ms / HOUR)} h` : `${Math.round(ms / (24 * HOUR))} d`)

/* what was stored, briefly: "videos 9", "rising 10, derby, pulse none" */
function describe(payload: unknown) {
  if (!payload || typeof payload !== 'object') return String(payload)
  return Object.entries(payload).map(([key, value]) => {
    if (Array.isArray(value)) return `${key} ${value.length}`
    if (value == null) return `${key} none`
    return typeof value === 'object' ? key : `${key} ${String(value).slice(0, 30)}`
  }).join(', ')
}

async function list() {
  const now = new Date()
  const rows = new Map((await liveRepository.all()).map((row) => [row.key, row]))
  const setting = process.env.LIVE_REFRESH_HOURS?.trim()
  console.log(`A fetch stays fresh for ${span(refreshIntervalMs())} (LIVE_REFRESH_HOURS ${setting ? `is ${setting}` : 'is unset'}).`)
  for (const feed of selected) {
    const row = rows.get(feed.key)
    const fetched = row?.fetchedAt ? `fetched ${span(now.getTime() - row.fetchedAt.getTime())} ago` : 'never fetched'
    const sinceTry = row?.attemptedAt ? now.getTime() - row.attemptedAt.getTime() : Infinity
    const state = isDue(feed, row, now) ? 'due' : row?.error && sinceTry < RETRY_MS ? `retry in ${span(RETRY_MS - sinceTry)}` : 'not due'
    console.log(`  ${feed.key.padEnd(width)}  ${fetched.padEnd(20)}  ${state.padEnd(15)}  ${row?.error ? `last try: ${row.error}` : ''}`.trimEnd())
  }
}

async function refresh(dueOnly: boolean) {
  if (!process.env.ANAKIN_API_KEY) stop('ANAKIN_API_KEY is not set in .env.local; nothing can be fetched.')
  console.log(`${dueOnly ? 'Refreshing whichever are due of' : 'Refreshing'} ${selected.map((feed) => feed.key).join(', ')}.`)
  console.log('Wire jobs are polled and limited to nine a minute, so this can take a few minutes.\n')

  const took = new Map<string, number>()
  const timed: Feed[] = selected.map((feed) => ({
    ...feed,
    async fetch(ctx) {
      console.log(`  fetching ${feed.key}…`)
      const started = Date.now()
      try {
        return await feed.fetch(ctx)
      } finally {
        took.set(feed.key, Date.now() - started)
      }
    },
  }))
  const outcomes = await runLiveRefresh({ feeds: timed, force: !dueOnly, max: Infinity, budgetMs: Infinity })

  const rows = new Map((await liveRepository.all()).map((row) => [row.key, row]))
  console.log('')
  for (const feed of selected) {
    const outcome = outcomes.find((o) => o.key === feed.key)
    const status = outcome?.status ?? (dueOnly ? 'not due' : 'not reached')
    const detail = {
      saved: () => describe(rows.get(feed.key)?.payload),
      empty: () => 'nothing worth showing came back; the page keeps what it had',
      failed: () => outcome?.error ?? '',
      skipped: () => 'another refresh is fetching it',
      'not due': () => 'still fresh',
      'not reached': () => 'the run stopped first (out of credits or rate limited)',
    }[status]()
    const seconds = took.has(feed.key) ? `${(took.get(feed.key)! / 1000).toFixed(1)}s` : ''
    console.log(`  ${feed.key.padEnd(width)}  ${status.padEnd(11)}  ${seconds.padStart(6)}  ${detail}`)
  }
  if (outcomes.some((outcome) => outcome.status === 'saved')) console.log('\nReload /home to see it.')
  if (outcomes.some((outcome) => outcome.status === 'failed')) process.exitCode = 1
}

try {
  if (flags.includes('--list')) await list()
  else await refresh(flags.includes('--due'))
} finally {
  await prisma.$disconnect()
}
