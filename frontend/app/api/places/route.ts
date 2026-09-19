import { prisma } from '@/lib/db/prisma'
import { catalogueJsonResponse } from '@/lib/catalogue/list'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return catalogueJsonResponse(prisma.place, 'places', searchParams)
}
