/* ==========================================================================
   Anakin Wire: pre-built actions for sites like BookMyShow, Google Trends and
   Reddit. A task is submitted, runs as a job, and is polled until it finishes.

     POST /v1/wire/task      { action_id, params }  → { job_id, status }
     GET  /v1/wire/jobs/:id                          → { status, data }

   Only server code calls this (lib/live/refresh.ts), and the page never waits
   on it. Submissions are spaced to stay under the rate limit (10 requests a
   minute); running out of credits or hitting the limit anyway stops the
   whole refresh run rather than failing feed by feed.
   ========================================================================== */

const BASE = 'https://api.anakin.io/v1/wire'

export class WireOutOfCredits extends Error {
  constructor(message = 'Anakin has no credits left') { super(message); this.name = 'WireOutOfCredits' }
}

export class WireRateLimited extends Error {
  retryAfterMs: number
  constructor(retryAfterMs: number) { super('Anakin rate limit reached'); this.name = 'WireRateLimited'; this.retryAfterMs = retryAfterMs }
}

export type WireRun = (actionId: string, params?: Record<string, unknown>, options?: { timeoutMs?: number }) => Promise<unknown>

/* For a call a feed can do without: an ordinary failure is null, but no
   credits or no quota still stops the run. */
export function optional<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((err) => {
    if (err instanceof WireOutOfCredits || err instanceof WireRateLimited) throw err
    return null
  })
}

type Options = {
  apiKey?: string
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  /* gaps between polls; the last one repeats */
  pollMs?: number[]
  /* task submissions allowed in any sixty seconds, one under Wire's limit */
  perMinute?: number
  clock?: () => number
}

const TERMINAL = new Set(['completed', 'failed', 'error', 'cancelled'])

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function raise(status: number, body: { error?: { code?: string; retry_after_seconds?: number; message?: string } } | null): never {
  const code = body?.error?.code
  if (status === 402 || code === 'INSUFFICIENT_CREDITS') throw new WireOutOfCredits(body?.error?.message)
  if (status === 429 || code === 'RATE_LIMIT_EXCEEDED') throw new WireRateLimited((body?.error?.retry_after_seconds ?? 60) * 1000)
  throw new Error(`Anakin Wire request failed (${status}${code ? ` ${code}` : ''})`)
}

/* The job's result. Wire has returned it as `data`; `result` and `output` are
   accepted too, so a renamed field doesn't blank every feed. */
export function jobResult(job: Record<string, unknown> | null) {
  if (!job) return null
  return job.data ?? job.result ?? job.output ?? null
}

export function createWire({
  apiKey = process.env.ANAKIN_API_KEY,
  fetchImpl = globalThis.fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  pollMs = [4000, 4000, 6000, 8000],
  perMinute = 9,
  clock = Date.now,
}: Options = {}): WireRun | null {
  if (!apiKey) return null
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${apiKey}`, 'X-API-Key': apiKey }

  /* when each recent task went in; a full cron run would otherwise trip the limit */
  const submitted: number[] = []
  async function slot() {
    for (;;) {
      const now = clock()
      while (submitted.length && now - submitted[0] >= 60_000) submitted.shift()
      if (submitted.length < perMinute) {
        submitted.push(now)
        return
      }
      await sleep(60_000 - (now - submitted[0]) + 50)
    }
  }

  return async function run(actionId, params = {}, { timeoutMs = 60_000 } = {}) {
    await slot()
    const started = clock()
    const submit = await fetchImpl(`${BASE}/task`, { method: 'POST', headers, body: JSON.stringify({ action_id: actionId, params }) })
    let job = await readJson(submit) as Record<string, unknown> | null
    if (!submit.ok) raise(submit.status, job as never)

    const id = (job?.job_id ?? job?.id) as string | undefined
    for (let poll = 0; !TERMINAL.has(String(job?.status)); poll++) {
      if (!id) throw new Error(`Anakin Wire returned no job id for ${actionId}`)
      if (clock() - started > timeoutMs) throw new Error(`Anakin Wire job ${actionId} timed out`)
      await sleep(pollMs[Math.min(poll, pollMs.length - 1)])
      const response = await fetchImpl(`${BASE}/jobs/${encodeURIComponent(id)}`, { headers })
      job = await readJson(response) as Record<string, unknown> | null
      if (!response.ok) raise(response.status, job as never)
    }
    if (job?.status !== 'completed') throw new Error(`Anakin Wire job ${actionId} ${String(job?.status)}`)
    return jobResult(job)
  }
}
