import { cached } from '@/lib/cache'
import { activeEvents } from './events'
import { TRUSTED_FALLBACK_IMAGE } from './images'
import { MAX_AGE_HOURS, selectHomeStory } from './ranking'
import type { NewsRecord, NewsRepository } from './repository'

/* ==========================================================================
   The Home "In the news" selection, read from the database only. Anakin is
   never called here — if ingestion has been failing, the cards simply keep
   showing the last persisted stories.

   Fallback chain, per card:
     current selection → newest active story → newest story of any age
     → the seeded fallback below (also used when the database is down)
   ========================================================================== */

export type HomeNewsCard = {
  id: string
  type: 'NEWSPAPER' | 'CITY' | 'SPORTS'
  title: string
  description: string | null
  image: string | null
  link: string | null
  sourceName: string | null
  publishedAt: string | null
}

export type HomeNews = { newspaper: HomeNewsCard; city: HomeNewsCard; sports: HomeNewsCard }

/* Mirrors the news rows in prisma/seed.js — keep them in step. */
export const FALLBACK_HOME_NEWS: HomeNews = {
  newspaper: {
    id: 'fallback-newspaper',
    type: 'NEWSPAPER',
    title: 'Anandabazar Patrika today',
    description: 'এগিয়ে থাকে,এগিয়ে রাখে।',
    image: '/ana.jpg',
    link: 'https://epaper.anandabazar.com/',
    sourceName: 'Anandabazar Patrika',
    publishedAt: null,
  },
  city: {
    id: 'fallback-city',
    type: 'CITY',
    title: "International Book Fair '25",
    description: 'The biggest literary event of the year! This year was great!',
    image: '/bkf.avif',
    link: 'https://kolkatabookfair.net/download-ikbf-app',
    sourceName: null,
    publishedAt: null,
  },
  sports: {
    id: 'fallback-sports',
    type: 'SPORTS',
    title: 'Kolkata Derby: EB vs MB',
    description: "The age-old rivalry continues! Don't miss the epic clash this weekend.",
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    link: 'https://www.google.com/search?q=east+bengal+vs+mohun+bagan',
    sourceName: null,
    publishedAt: null,
  },
}

const HOME_NEWS_TTL_MS = 30_000
const HOUR_MS = 3_600_000

function toCard(row: NewsRecord, type: HomeNewsCard['type']): HomeNewsCard {
  return {
    id: row.id,
    type,
    title: row.title,
    description: row.description,
    /* a story without a photograph still gets a picture of the city */
    image: row.image || (type === 'NEWSPAPER' ? null : TRUSTED_FALLBACK_IMAGE[type]),
    link: row.link,
    sourceName: row.sourceName,
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
  }
}

async function pick(repository: NewsRepository, type: 'CITY' | 'SPORTS', rows: NewsRecord[], now: Date) {
  const selected = selectHomeStory(rows, type, { now, events: activeEvents(now) })
  if (selected) return toCard(selected, type)
  const recent = await repository.latestOfType(type, { activeOnly: true })
    ?? await repository.latestOfType(type)
  return recent ? toCard(recent, type) : FALLBACK_HOME_NEWS[type === 'CITY' ? 'city' : 'sports']
}

/* The selection itself; throws if the database does. */
export async function selectHomeNews(repository: NewsRepository, now: Date = new Date()): Promise<HomeNews> {
  const [rows, newspaper] = await Promise.all([
    repository.listRecent(['CITY', 'SPORTS'], new Date(now.getTime() - MAX_AGE_HOURS * HOUR_MS)),
    repository.latestOfType('NEWSPAPER'),
  ])
  const [city, sports] = await Promise.all([
    pick(repository, 'CITY', rows, now),
    pick(repository, 'SPORTS', rows, now),
  ])
  return { newspaper: newspaper ? toCard(newspaper, 'NEWSPAPER') : FALLBACK_HOME_NEWS.newspaper, city, sports }
}

export const HOME_NEWS_CACHE_KEY = 'news:home'

/* What the Home page and GET /api/news use. Never throws: a database outage
   serves the last cached selection, or the seeded fallback. */
export async function getHomeNews(repository: NewsRepository, { now, useCache = true }: { now?: Date; useCache?: boolean } = {}) {
  try {
    return useCache
      ? await cached(HOME_NEWS_CACHE_KEY, HOME_NEWS_TTL_MS, () => selectHomeNews(repository, now))
      : await selectHomeNews(repository, now)
  } catch (err) {
    console.error('[news] Home selection failed; serving fallback', err)
    return FALLBACK_HOME_NEWS
  }
}

export function homeNewsCards(news: HomeNews) {
  return [news.newspaper, news.city, news.sports]
}
