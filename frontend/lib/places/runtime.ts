// @ts-nocheck
import { prisma } from '@/lib/db/prisma'
import { OlaPlacesProvider } from './olaPlacesProvider'
import { createPlaceSearchService } from './placeSearchService'
import { FallbackPlaceRepository, FilePlaceRepository } from './filePlaceRepository'
import { PrismaPlaceRepository } from './prismaPlaceRepository'

export const placeRepository = new FallbackPlaceRepository(
  new PrismaPlaceRepository(prisma),
  new FilePlaceRepository()
)

export const placeSearchService = createPlaceSearchService({
  repository: placeRepository,
  provider: new OlaPlacesProvider(),
})
