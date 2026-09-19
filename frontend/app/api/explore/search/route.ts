import { createPlacesRouteHandler, parseSearchQuery } from '@/lib/places/request'
import { placeSearchService } from '@/lib/places/runtime'

export const GET = createPlacesRouteHandler({
  parse: parseSearchQuery,
  service: (params) => placeSearchService.search(params),
})
