'use client'

import { useCallback, type ReactNode } from 'react'
import { SectionHead } from '@/components/brand/SectionHead'
import { FamousPujos } from '@/components/pujo/FamousPujos'
import { InfoSheet } from '@/components/pujo/InfoSheet'
import { MapAndList } from '@/components/pujo/MapAndList'
import { ParaByArea } from '@/components/pujo/ParaByArea'
import { usePujo } from '@/components/pujo/PujoProvider'
import { PujoSearch } from '@/components/pujo/PujoSearch'
import type { ClientPujo } from '@/lib/pujo/client'
import { straightKm } from '@/lib/pujo/geo'

/* ==========================================================================
   /pujo's explore bands, in the order the plan sets: search, the famous ones,
   the map and list, then the para pujos by area. One info sheet serves them
   all. `after` takes the bands that follow (where to eat) without this file
   knowing about them.
   ========================================================================== */

type Props = {
  /* Add to a trip, once groups exist */
  action?: (pujo: ClientPujo) => ReactNode
  /* bands after the para pujos */
  after?: ReactNode
}

function FindPujo({ action }: { action?: Props['action'] }) {
  const { index, nearMe } = usePujo()
  const you = nearMe.status === 'on' ? nearMe.position : null
  const distance = useCallback((point: { lat: number; lng: number }) => (you ? straightKm(you, point) : null), [you])
  return (
    <section className="mk-band" aria-labelledby="find-title">
      <div className="mk-wrap">
        <SectionHead
          id="find-title"
          title="Find a pujo"
          lede={`All ${index.pujos.length} we know of. Type the para, the club, or the nearest Metro station.`}
        />
        <PujoSearch
          distance={distance}
          from={you ? 'you' : null}
          action={action}
          suggestions={['Bagbazar', 'Suruchi', 'Behala', 'Shyambazar metro', '700029']}
        />
      </div>
    </section>
  )
}

export function PujoExplore({ action, after }: Props) {
  return (
    <>
      <FindPujo action={action} />
      <FamousPujos action={action} />
      <MapAndList action={action} />
      <ParaByArea action={action} />
      {after}
      <InfoSheet action={action} />
    </>
  )
}
