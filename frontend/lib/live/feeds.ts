import type { Feed } from './refresh'
import { skyFeed } from './sky'

/* ==========================================================================
   Every live feed /home shows, refreshed by lib/live/server.ts and
   /api/cron/live. Each feed lives in its own module with its normalizer, so
   the shape it reads from Anakin is tested next to it.
   ========================================================================== */

export const FEEDS: Feed[] = [
  skyFeed as Feed,
]
