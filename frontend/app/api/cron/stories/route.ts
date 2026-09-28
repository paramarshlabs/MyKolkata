import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/*
 * Stories live for a day. The wall stops showing one the moment it expires;
 * this deletes the row too, so nothing outlives what the Privacy Policy says.
 * Called daily by Vercel Cron (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { count } = await prisma.story.deleteMany({ where: { expiresAt: { lte: new Date() } } })
    return NextResponse.json({ deleted: count })
  } catch (err) {
    console.error('[stories] purge failed', err)
    return NextResponse.json({ message: 'Purge failed' }, { status: 500 })
  }
}
