import { NextResponse } from 'next/server'
import { currentUserId } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { toClient } from '@/lib/serialize'

const MAX_FEEDBACK_LEN = 1000
const BASE_WEIGHT = 5

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await currentUserId())) {
    return NextResponse.json(
      { message: 'Sign in to leave feedback' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const { id } = await context.params
  const body = (await request.json().catch(() => null)) as {
    swipeDirection?: string
    feedbackText?: string
    userStars?: number
  } | null

  const parsedStars = Number(body?.userStars)
  const stars = Number.isFinite(parsedStars) ? Math.min(Math.max(parsedStars, 1), 5) : 3
  const text = typeof body?.feedbackText === 'string' ? body.feedbackText.slice(0, MAX_FEEDBACK_LEN) : null
  const direction =
    body?.swipeDirection === 'left' || body?.swipeDirection === 'right' ? body.swipeDirection : null

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ baseStars: number; feedbacks: unknown }>>`
        SELECT "baseStars", "feedbacks" FROM "tinder_profiles" WHERE "id" = ${id} FOR UPDATE
      `
      if (!locked[0]) return null

      const row = locked[0]
      const feedbacks = Array.isArray(row.feedbacks) ? [...row.feedbacks] : []
      feedbacks.push({ swipeDirection: direction, feedbackText: text, stars })

      const sumUserStars = feedbacks.reduce(
        (sum: number, f: { stars?: number }) => sum + (f.stars || 0),
        0,
      )
      const averageStars =
        (row.baseStars * BASE_WEIGHT + sumUserStars) / (BASE_WEIGHT + feedbacks.length)

      return tx.tinderProfile.update({
        where: { id },
        data: { feedbacks, averageStars },
      })
    })

    if (!updated) return NextResponse.json({ message: 'Profile not found' }, { status: 404 })

    return NextResponse.json(
      { stars, averageStars: updated.averageStars, profile: toClient(updated) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
