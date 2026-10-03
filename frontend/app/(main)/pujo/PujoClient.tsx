'use client'

import { useState, type ReactNode } from 'react'
import { SectionHead } from '@/components/brand/SectionHead'
import { CountdownScene } from '@/components/brand/Countdown'
import { AlponaRule } from '@/components/brand/Alpona'
import { UiIcon } from '@/components/brand/icons'
import { PujoCalendar } from '@/components/pujo/PujoCalendar'
import { PujoExplore } from '@/components/pujo/PujoExplore'
import { PujoProvider } from '@/components/pujo/PujoProvider'
import type { ClientIndex } from '@/lib/pujo/client'
import styles from '@/styles/Pujo.module.css'
import { RouteSearch } from './RouteSearch'

const MAHALAYA_VIDEO_ID = 'YQFNRoi7rEc'
const MAHALAYA_EMBED_URL = `https://www.youtube-nocookie.com/embed/${MAHALAYA_VIDEO_ID}?autoplay=1&controls=0&disablekb=1&playsinline=1&rel=0&loop=1&playlist=${MAHALAYA_VIDEO_ID}`

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
        {playing ? (
          <UiIcon name="volume" size={19} />
        ) : (
          <svg className={styles.playIcon} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M8 4.8c0-1.2 1.3-1.9 2.3-1.3l10.2 6.2c1 .6 1 2 0 2.6l-10.2 6.2c-1 .6-2.3-.1-2.3-1.3Z" fill="currentColor" />
          </svg>
        )}
        <span>{playing ? 'Mahalaya Playing' : 'Play Mahalaya'}</span>
      </button>
    </div>
  )
}

/* `children` closes the page: server-rendered bands, like the quiz's way in.
   `index` is every pujo, or null when the scraper's tables couldn't be read. */
function Pujo({ index, children }: { index: ClientIndex | null; children?: ReactNode }) {
  return (
    <main className="mk-page">
      {/* the homecoming — no crimson anywhere in this band. design.md §9.7 */}
      <section className={styles.scene} aria-labelledby="pujo-title">
        <h1 id="pujo-title" className="sr-only">Durga Pujo</h1>
        <CountdownScene>
          <MahalayaPlayer />
        </CountdownScene>
        <div className="mk-wrap">
          <PujoCalendar className={styles.days} />
        </div>
      </section>

      <AlponaRule className="mk-wrap" />

      {index ? (
        <PujoProvider index={index}>
          <PujoExplore />
        </PujoProvider>
      ) : (
        <section className="mk-band" aria-labelledby="pujos-missing">
          <div className="mk-wrap">
            <div className={`mk-panel mk-empty ${styles.state}`} role="status">
              <h2 id="pujos-missing" className="mk-h3">The pujos didn&apos;t load.</h2>
              <p className="mk-body">Check your connection, then refresh the page.</p>
            </div>
          </div>
        </section>
      )}

      <section className="mk-band" aria-labelledby="routes-title">
        <div className="mk-wrap">
          <SectionHead
            id="routes-title"
            title="Ready-made routes"
            lede="Nights written for each kind of Pujo-goer. North keeps the old rituals, the south builds the art, and the centre goes big."
          />
          <RouteSearch />
        </div>
      </section>
      {children}
    </main>
  )
}

export default Pujo
