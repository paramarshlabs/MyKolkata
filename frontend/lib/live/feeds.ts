import type { Feed } from './refresh'
import { skyFeed } from './sky'
import { tonightFeed } from './tonight'
import { searchingFeed } from './searching'
import { addaFeed } from './adda'
import { youtubeFeed } from './youtube'
import { cricketFeed } from './cricket'
import { onThisDayFeed } from './onthisday'
import { createInstagramFeed, instagramConfig } from './instagram'

/* ==========================================================================
   Every live feed /home shows, refreshed by lib/live/server.ts and
   /api/cron/live. Each feed lives in its own module with its normalizer, so
   the shape it reads from Anakin is tested next to it. Instagram is the one
   feed not on Anakin, and it is on only when its Graph API keys are set.
   ========================================================================== */

const instagram = instagramConfig()

export const FEEDS: Feed[] = [
  skyFeed as Feed,
  tonightFeed as Feed,
  searchingFeed as Feed,
  addaFeed as Feed,
  youtubeFeed as Feed,
  cricketFeed as Feed,
  onThisDayFeed as Feed,
  ...(instagram ? [createInstagramFeed(instagram) as Feed] : []),
]
