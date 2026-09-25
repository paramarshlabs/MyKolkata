'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/brand/Card'
import { SectionHead } from '@/components/brand/SectionHead'
import { CountdownScene, PujoDays } from '@/components/brand/Countdown'
import { AlponaLoader, AlponaRule } from '@/components/brand/Alpona'
import { CityIcon, UiIcon } from '@/components/brand/icons'
import { PersonalityEntry } from '@/components/pujo-personality/PersonalityEntry'
import styles from '@/styles/Pujo.module.css'

const NEARBY_PANDALS = [
  { name: 'Bagbazar Sarbojanin', distance: '1.2 km' },
  { name: 'College Square', distance: '2.5 km' },
]

const REGION_ORDER = ['North Kolkata', 'South Kolkata', 'Central Kolkata', 'New Kolkata']
const MAHALAYA_VIDEO_ID = 'YQFNRoi7rEc'
const MAHALAYA_EMBED_URL = `https://www.youtube-nocookie.com/embed/${MAHALAYA_VIDEO_ID}?autoplay=1&controls=0&disablekb=1&playsinline=1&rel=0&loop=1&playlist=${MAHALAYA_VIDEO_ID}`

type Region = {
  _id: string
  name: string
  description: string | null
  image: string | null
}

function orderRegions(regions: Region[]) {
  return REGION_ORDER
    .map((name) => regions.find((region) => region.name === name))
    .filter((region): region is Region => Boolean(region))
}

function MahalayaPlayer() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className={styles.soundtrack}>
      {playing && (
        <div className={styles.hiddenPlayer} aria-hidden="true">
          <iframe
            src={MAHALAYA_EMBED_URL}
            title="Mahalaya background music"
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
      <button
        type="button"
        className={`${styles.soundTrigger} ${playing ? styles.soundPlaying : ''}`}
        aria-label={playing ? 'Stop Mahalaya' : 'Play Mahalaya'}
        aria-pressed={playing}
        onClick={() => setPlaying((current) => !current)}
      >
        {playing ? <UiIcon name="volume" size={19} /> : null}
        <span>{playing ? 'Mahalaya Playing' : 'Play Mahalaya'}</span>
      </button>
    </div>
  )
}

function Pujo() {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    /* aborted on unmount — and on React's dev-only second mount, so one request lands */
    const controller = new AbortController()
    async function fetchRegions() {
      try {
        const res = await fetch('/api/regions', { signal: controller.signal })
        if (!res.ok) throw new Error('Failed to fetch regions')
        const data = await res.json() as Region[]
        setRegions(data)
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    fetchRegions()
    return () => controller.abort()
  }, [])

  return (
    <main className="mk-page">
      {/* the homecoming — no crimson anywhere in this band. design.md §9.7 */}
      <section className={styles.scene} aria-labelledby="pujo-title">
        <h1 id="pujo-title" className="sr-only">Durga Pujo</h1>
        <CountdownScene>
          <MahalayaPlayer />
        </CountdownScene>
        <div className="mk-wrap">
          <PujoDays className={styles.days} />
        </div>
      </section>

      <PersonalityEntry />

      <AlponaRule className="mk-wrap" />

      <section className="mk-band" aria-labelledby="regions-title">
        <div className="mk-wrap">
          <SectionHead
            id="regions-title"
            title="Where to go"
            lede="North keeps the old rituals, the south builds the art, and the centre goes big. Pick a side of the city."
          />
          {loading ? (
            <AlponaLoader label="Finding the paras" className={styles.state} />
          ) : failed ? (
            <div className={`mk-panel mk-empty ${styles.state}`} role="status">
              <h3 className="mk-h3">The paras didn&apos;t load.</h3>
              <p className="mk-body">Check your connection, then refresh the page.</p>
            </div>
          ) : regions.length ? (
            <div className={styles.regions}>
              {orderRegions(regions).map((region) => (
                <Card
                  key={region._id}
                  href={`/near-you?${new URLSearchParams({ view: 'grid', q: region.name })}`}
                  ariaLabel={`Explore ${region.name}`}
                  image={region.name === 'South Kolkata' ? '/southkol.png' : region.image}
                  icon="balcony"
                  title={region.name}
                  sub="Explore the para"
                  desc={region.description}
                />
              ))}
            </div>
          ) : (
            <p className={`mk-caption ${styles.state}`}>No regions listed yet. The pandals are still going up.</p>
          )}
        </div>
      </section>

      <section className={`mk-band ${styles.nearSection}`} aria-labelledby="near-title">
        <div className="mk-wrap">
          <div className={styles.nearGrid}>
            <div>
              <SectionHead id="near-title" title="Pandals near you" lede="The closest ones first. Go after 8pm, when the lights come on." />
              <ul className={styles.nearList}>
                {NEARBY_PANDALS.map((pandal) => (
                  <li key={pandal.name} className={styles.nearItem}>
                    <span className={styles.nearName}>{pandal.name}</span>
                    <span className={styles.nearDistance}>
                      <CityIcon name="taxi" size={20} />
                      {pandal.distance}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.mapFrame}>
              <iframe
                title="Map of Kolkata"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117925.35231272197!2d88.26495595!3d22.5354273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f882db4908f667%3A0x43e330e68f6c2cbc!2sKolkata%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1659822244751!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Pujo
