'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { UiIcon } from '@/components/brand/icons'
import { ShareButton } from '@/components/pujo/bits'
import { PujoFacts } from '@/components/pujo/PujoFacts'
import { usePujo } from '@/components/pujo/PujoProvider'
import { nearestPujos, type ClientPujo } from '@/lib/pujo/client'
import { tierText } from '@/lib/pujo/format'
import { directionsUrl, pujoPath } from '@/lib/pujo/links'
import styles from '@/styles/PujoExplore.module.css'

/* ==========================================================================
   A pujo's page in a sheet, so people can read about it without losing their
   place: a bottom sheet on a phone, a panel on the right on a desktop. The
   same facts, the same Add button, and Share.
   ========================================================================== */

type Props = {
  /* Add to a trip, when the screen offers it */
  action?: (pujo: ClientPujo) => ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

export function InfoSheet({ action }: Props) {
  const { selected, pujo, station, area, close, open, index } = usePujo()
  const current = pujo(selected)
  const titleId = useId()
  const sheetRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const drag = useRef<{ startY: number; dy: number } | null>(null)
  const [offset, setOffset] = useState(0)
  const [tall, setTall] = useState(false)

  /* a new pujo in the sheet: focus its name, and start at the top */
  useEffect(() => {
    if (!current) return
    headingRef.current?.focus({ preventScroll: true })
    sheetRef.current?.scrollTo({ top: 0 })
  }, [current])

  useEffect(() => {
    if (!current) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      /* keep Tab inside the sheet while it's open */
      if (event.key !== 'Tab' || !sheetRef.current) return
      const items = [...sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close, current])

  if (!current) return null

  const areaName = area(current.area)?.name ?? null
  const stationFor = station(current.metro?.id)
  const nearby = current.lat !== null && current.lng !== null
    ? nearestPujos(index.pujos, { lat: current.lat, lng: current.lng }, { exclude: [current.slug], limit: 5 })
      .map(({ pujo: near, minutes }) => ({ slug: near.slug, name: near.name, famous: near.famous, minutes }))
    : []

  /* the handle: drag down to close, up for the full sheet */
  const onPointerDown = (event: React.PointerEvent) => {
    drag.current = { startY: event.clientY, dy: 0 }
    ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current) return
    drag.current.dy = event.clientY - drag.current.startY
    setOffset(Math.max(drag.current.dy, tall ? 0 : -120))
  }
  const onPointerUp = () => {
    const dy = drag.current?.dy ?? 0
    drag.current = null
    setOffset(0)
    if (dy > 90) {
      setTall(false)
      close()
    } else if (dy < -40) {
      setTall(true)
    } else if (dy > 40) {
      setTall(false)
    }
  }

  return (
    <div className={styles.sheetLayer}>
      <button type="button" className={styles.sheetScrim} aria-label="Close" tabIndex={-1} onClick={close} />
      <aside
        ref={sheetRef}
        className={`${styles.sheet} ${tall ? styles.sheetTall : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={offset ? { transform: `translateY(${offset}px)`, transition: 'none' } : undefined}
      >
        <div
          className={styles.sheetHandle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-hidden="true"
        >
          <span />
        </div>
        <header className={styles.sheetHead}>
          <div className={styles.sheetTitles}>
            <p className={styles.tier}>{tierText(current)}</p>
            <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.sheetName}>{current.name}</h2>
            {current.fullName !== current.name && <p className={styles.fullName}>{current.fullName}</p>}
          </div>
          <button type="button" className="mk-icon-btn" onClick={close} aria-label="Close">
            <UiIcon name="close" />
          </button>
        </header>

        <PujoFacts
          pujo={current}
          areaName={areaName}
          station={stationFor}
          nearby={nearby}
          nearbyItem={(item, children) => (
            <button type="button" className={styles.nearbyLink} onClick={() => open(item.slug)}>{children}</button>
          )}
        />

        <div className={styles.sheetActions}>
          {action?.(current)}
          {current.lat !== null && current.lng !== null ? (
            <a
              className="mk-btn mk-btn--secondary mk-btn--sm"
              href={directionsUrl({ lat: current.lat, lng: current.lng })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <UiIcon name="directions" size={16} />
              Directions
            </a>
          ) : (
            <p className="mk-meta">No map location yet.</p>
          )}
          <ShareButton title={current.name} text={`${current.name}, ${areaName ?? 'Kolkata'}`} url={pujoPath(current.slug)} />        </div>
      </aside>
    </div>
  )
}
