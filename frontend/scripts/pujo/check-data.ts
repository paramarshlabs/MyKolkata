/*
 * Re-check lib/pujo/curation.ts against the live kolkata_puja_* tables, after
 * the scraper runs again: slugs the fixes name that have gone, and new rows
 * that look like a pujo already listed. Read-only.
 *
 *   npm run pujo:check
 */
import { PrismaClient } from '@prisma/client'
import { loadEnvFile } from '../lib/load-env.mjs'
import { buildIndex, isRoutable } from '../../lib/pujo/build'
import { curatedSlugs, DUPLICATES } from '../../lib/pujo/curation'
import { straightKm } from '../../lib/pujo/geo'
import { FILLER, fold } from '../../lib/pujo/normalise'
import { shortName } from '../../lib/pujo/names'

loadEnvFile()
const prisma = new PrismaClient()

async function main() {
  const [pandals, pois] = await Promise.all([
    prisma.kolkata_puja_pandals.findMany({
      select: {
        slug: true, name: true, zone: true, locality: true, address: true, pincode: true, lat: true, lng: true,
        is_hidden: true, is_featured: true, red_road_carnival_rank: true, carnival_awards: true,
      },
    }),
    prisma.kolkata_puja_pois.findMany({ select: { id: true, name: true, category: true, address: true, lat: true, lng: true } }),
  ])
  const index = buildIndex({ pandals, pois })
  const slugs = new Set(pandals.map((row) => row.slug))

  console.log(`${pandals.length} rows → ${index.pujos.length} pujos, ${index.pujos.filter(isRoutable).length} on the map, ${index.pujos.filter((p) => p.famous).length} famous`)
  const gone = [...new Set(curatedSlugs())].filter((slug) => !slugs.has(slug))
  console.log(gone.length ? `Curated slugs no longer in the table:\n  ${gone.join('\n  ')}` : 'Every curated slug is still in the table.')

  /* pujos that fold to the same name within 150 m, not merged yet */
  const merged = new Set([...Object.keys(DUPLICATES), ...Object.values(DUPLICATES).flat()])
  const key = (name: string) => fold(shortName(name)).filter((word) => !FILLER.has(word)).join(' ')
  const visible = pandals.filter((row) => !row.is_hidden && !merged.has(row.slug))
  const suspects: string[] = []
  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      const [a, b] = [visible[i], visible[j]]
      const close = a.lat !== null && a.lng !== null && b.lat !== null && b.lng !== null
        && straightKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) < 0.15
      if (close && key(a.name) === key(b.name)) suspects.push(`${a.slug} ≈ ${b.slug}`)
    }
  }
  console.log(suspects.length ? `Possible duplicates to add to DUPLICATES:\n  ${suspects.join('\n  ')}` : 'No new duplicates.')
  const empty = index.areas.filter((area) => area.count === 0).map((area) => area.name)
  if (empty.length) console.log(`Areas with no pujos: ${empty.join(', ')}`)
}

main().finally(() => prisma.$disconnect())
