'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { UiIcon, CityIcon } from '@/components/brand/icons'
import styles from '@/styles/Home.module.css'

export type Stall = {
  id: string
  title: string
  location?: string | null
  price?: string | null
  image?: string | null
  link?: string | null
}

/*  The marketplace as a shelf of stalls that scrolls sideways, ending in a
    way to the markets on the map. The arrows move it a shelf-width at a time;
    nothing moves on its own.                                                */
export function MarketShelf({ stalls, head }: { stalls: Stall[]; head: ReactNode }) {
  const shelf = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = shelf.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const move = (direction: 1 | -1) => {
    const el = shelf.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div>
      <div className={styles.shelfHead}>
        {head}
        <div className={styles.shelfArrows}>
          <button type="button" className="mk-icon-btn" onClick={() => move(-1)} disabled={edges.start} aria-label="Previous stalls">
            <UiIcon name="back" size={20} />
          </button>
          <button type="button" className="mk-icon-btn" onClick={() => move(1)} disabled={edges.end} aria-label="More stalls">
            <UiIcon name="back" size={20} className={styles.flip} />
          </button>
        </div>
      </div>
      <ul className={styles.shelf} ref={shelf} onScroll={measure}>
        {stalls.map((stall) => {
          const inner = (
            <>
              <span className={styles.stallMedia}>
                {stall.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={stall.image} alt="" loading="lazy" decoding="async" />
                ) : (
                  <CityIcon name="signboard" size={36} />
                )}
              </span>
              <span className={styles.stallTitle}>{stall.title}</span>
              {stall.location && <span className={styles.stallWhere}>{stall.location}</span>}
              {stall.price && <span className={styles.stallPrice}>{stall.price}</span>}
            </>
          )
          return (
            <li key={stall.id}>
              {stall.link ? (
                <a className={styles.stall} href={stall.link} target="_blank" rel="noopener noreferrer">
                  {inner}<span className="sr-only">, opens in a new tab</span>
                </a>
              ) : (
                <div className={styles.stall}>{inner}</div>
              )}
            </li>
          )
        })}
        <li>
          <Link className={`${styles.stall} ${styles.stallMore}`} href="/near-you?category=shopping&view=grid">
            <span className={styles.stallMoreArt} aria-hidden="true"><CityIcon name="signboard" size={44} /></span>
            <span className={styles.stallTitle}>Every market on the map</span>
            <span className={styles.stallWhere}>New Market, Gariahat, Hatibagan and the lanes between</span>
          </Link>
        </li>
      </ul>
    </div>
  )
}
