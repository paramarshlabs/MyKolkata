import { createPlacesRouteHandler, parseBoundsQuery } from '@/lib/places/request'
import { placeSearchService } from '@/lib/places/runtime'

export const GET = createPlacesRouteHandler({
  parse: parseBoundsQuery,
  service: (params) => placeSearchService.withinBounds(params),
})
