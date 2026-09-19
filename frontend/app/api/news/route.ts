import { NextResponse } from 'next/server'
import { CATALOGUE_CACHE_CONTROL } from '@/lib/catalogue/list'
import { getHomeNews } from '@/lib/news/home'
import { newsRepository } from '@/lib/news/server'

/* The Home "In the news" selection: { newspaper, city, sports }. Read from the
   database only (with a seeded fallback), so it never waits on Anakin. */
export async function GET() {
  const news = await getHomeNews(newsRepository)
  return NextResponse.json(news, { headers: { 'Cache-Control': CATALOGUE_CACHE_CONTROL } })
}
