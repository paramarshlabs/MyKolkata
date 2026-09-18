import { createPlacesRouteHandler, parseNearbyQuery } from '@/lib/places/request'
import { placeSearchService } from '@/lib/places/runtime'

export const GET = createPlacesRouteHandler({
  parse: parseNearbyQuery,
  service: (params) => placeSearchService.nearby(params),
})
