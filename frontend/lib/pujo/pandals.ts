import 'server-only'
import { cached } from '@/lib/cache'
import { prisma } from '@/lib/db/prisma'
import { buildIndex, type PujoIndex } from './build'

/* ==========================================================================
   The pandal loader: the scraper's tables, read, curated (build.ts) and kept
   in memory for half an hour. The scraper owns kolkata_puja_*; nothing here
   writes to them. Only the columns that hold real data are selected, so the
   synthetic ones (rating, view_count, crowd_level and the rest) never leave
   the database.
   ========================================================================== */

const TTL_MS = 30 * 60 * 1000
export const PUJO_INDEX_KEY = 'pujo:index'

/* the POIs the app uses: Metro, landmarks, and where to find help */
const POI_CATEGORIES = ['metro-station', 'popular-landmark', 'police-station', 'hospital', 'help-desk']

export function loadPujoIndex(): Promise<PujoIndex> {
  return cached(PUJO_INDEX_KEY, TTL_MS, async () => {
    const [pandals, pois] = await Promise.all([
      prisma.kolkata_puja_pandals.findMany({
        select: {
          slug: true,
          name: true,
          zone: true,
          locality: true,
          address: true,
          pincode: true,
          lat: true,
          lng: true,
          is_hidden: true,
          is_featured: true,
          red_road_carnival_rank: true,
          carnival_awards: true,
        },
      }),
      prisma.kolkata_puja_pois.findMany({
        where: { category: { in: POI_CATEGORIES } },
        select: { id: true, name: true, category: true, address: true, lat: true, lng: true },
      }),
    ])
    return buildIndex({ pandals, pois })
  })
}
