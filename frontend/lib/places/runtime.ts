// @ts-nocheck
import { prisma } from '@/lib/db/prisma'
import { OlaPlacesProvider } from './olaPlacesProvider'
import { createPlaceSearchService } from './placeSearchService'
import { createPlaceImageResolver } from './placeImageResolver'
import { WikimediaImageProvider } from './wikimediaImageProvider'
import { FallbackPlaceRepository, FilePlaceRepository } from './filePlaceRepository'
import { PrismaPlaceRepository } from './prismaPlaceRepository'

export const placeRepository = new FallbackPlaceRepository(
  new PrismaPlaceRepository(prisma),
  new FilePlaceRepository()
)

const olaProvider = new OlaPlacesProvider()

export const placeSearchService = createPlaceSearchService({
  repository: placeRepository,
  provider: olaProvider,
  imageResolver: createPlaceImageResolver({
    olaProvider,
    commonsProvider: new WikimediaImageProvider(),
  }),
})
