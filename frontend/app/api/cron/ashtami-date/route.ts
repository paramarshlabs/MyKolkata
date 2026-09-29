import { NextResponse } from 'next/server'
import { sweep } from '@/lib/ashtami-date/server'

export const dynamic = 'force-dynamic'

/*
 * Find your Ashtami date keeps chats for 24 hours. Chat requests already sweep
 * every few minutes; this daily run catches the rest, clears matches nobody
 * wrote in, and a week after Dashami deletes the season (see lib/ashtami-date/server.ts).
 * Called by Vercel Cron (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json(await sweep())
  } catch (err) {
    console.error('[ashtami-date] sweep failed', err)
    return NextResponse.json({ message: 'Sweep failed' }, { status: 500 })
  }
}
