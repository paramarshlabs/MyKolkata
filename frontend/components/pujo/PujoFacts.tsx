import type { ReactNode } from 'react'
import { LineMark } from '@/components/pujo/bits'
import { formatKm, walkMinutes, WALK_FACTOR } from '@/lib/pujo/geo'
import { lineLabel, whereLine } from '@/lib/pujo/format'
import type { Station } from '@/lib/pujo/pois'
import type { ZoneId } from '@/lib/pujo/sectors'
import styles from '@/styles/PujoExplore.module.css'

/* ==========================================================================
   What we know about a pujo, all of it real: where it is, the nearest Metro
   and the pujos around it. The info sheet and the pujo's own page both show
   this. Ratings, crowd levels and themes from the scraper are made up and
   never appear.
   ========================================================================== */

export type NearbyPujo = { slug: string; name: string; famous: boolean; minutes: number }

type Props = {
  pujo: {
    zone: ZoneId
    place: string | null
    pincode: string | null
    lat: number | null
    metro: { id: string; km: number } | null
    awards: string[]
  }
  areaName: string | null
  station: Station | null | undefined
  address?: string | null
  nearby: NearbyPujo[]
  /* how a nearby pujo opens: a button in the sheet, a link on the page */
  nearbyItem: (pujo: NearbyPujo, children: ReactNode) => ReactNode
  headingLevel?: 'h2' | 'h3'
}

export function PujoFacts({ pujo, areaName, station, address, nearby, nearbyItem, headingLevel = 'h3' }: Props) {
  const Heading = headingLevel
  const walk = pujo.metro ? pujo.metro.km * WALK_FACTOR : null
  const fullAddress = address && pujo.pincode && !address.includes(pujo.pincode) ? `${address}, ${pujo.pincode}` : address

  return (
    <div className={styles.facts}>
      {pujo.awards.length > 0 && (
        <p className={styles.awards}>{pujo.awards.join(', ')}</p>
      )}
      <dl className={styles.factList}>
        <div>
          <dt>Where</dt>
          <dd>
            {whereLine(areaName, pujo.zone)}
            {pujo.place && <span className={styles.factSub}>{pujo.place}</span>}
          </dd>
        </div>
        {fullAddress && (
          <div>
            <dt>Address</dt>
            <dd>{fullAddress}</dd>
          </div>
        )}
        <div>
          <dt>Nearest Metro</dt>
          <dd>
            {station && walk !== null ? (
              <>
                <span className={styles.metroName}><LineMark station={station} />{station.name}</span>
                <span className={styles.factSub}>{lineLabel(station)}, {formatKm(walk)} on foot, about {walkMinutes(walk)} min</span>
              </>
            ) : pujo.lat === null ? 'Not known until the pujo has a place on the map.' : 'None within a walk. A cab or an auto is quicker.'}
          </dd>
        </div>
      </dl>

      {nearby.length > 0 && (
        <section className={styles.nearby} aria-label="Nearby pujos">
          <Heading className={styles.factHeading}>Nearby pujos</Heading>
          <ol className={styles.nearbyList}>
            {nearby.map((item) => (
              <li key={item.slug}>
                {nearbyItem(item, (
                  <>
                    <span className={styles.nearbyName}>
                      {item.name}
                      {item.famous && <span className={styles.famousTag}>Famous</span>}
                    </span>
                    <span className={styles.nearbyTime}>{item.minutes} min walk</span>
                  </>
                ))}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
