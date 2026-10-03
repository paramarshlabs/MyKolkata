'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { CALENDAR_DAYS, PUJO_SCHEDULE, formatPujoDate, formatPujoDay } from '@/lib/pujo'
import styles from '@/styles/PujoCalendar.module.css'

/* the Kolkata date as "2026-10-19", so the comparison ignores the viewer's timezone */
const kolkataDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/* The day to open on, by the Kolkata calendar: today's day while Pujo is on,
   Panchami before it, Dashami after. "2026-10-17" strings compare as dates. */
function todaysDay() {
  const today = kolkataDate(new Date())
  const last = CALENDAR_DAYS.length - 1
  const i = CALENDAR_DAYS.findIndex((d) =>
    today <= kolkataDate(new Date(d.lastIso ?? d.iso)))
  return i >= 0 ? i : last
}
const noSubscribe = () => () => {}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/* Panchami and the five days as tabs: choose a day, see what happens on it */
export function PujoCalendar({ className = '' }: { className?: string }) {
  /* the page is cached, so the server always renders Panchami and the browser moves to today */
  const today = useSyncExternalStore(noSubscribe, todaysDay, () => 0)
  const [picked, setActive] = useState<number | null>(null)
  const active = picked ?? today
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const mounted = useRef(false)

  /* slide the underline under the chosen tab, and centre that tab in the rail */
  const place = useCallback((smooth: boolean) => {
    const rail = railRef.current
    const tab = tabRefs.current[active]
    if (!rail || !tab) return
    setBar({ x: tab.offsetLeft, w: tab.offsetWidth })
    const offset = tab.getBoundingClientRect().left - rail.getBoundingClientRect().left
    const left = rail.scrollLeft + offset - (rail.clientWidth - tab.offsetWidth) / 2
    rail.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' })
  }, [active])

  useIsoLayoutEffect(() => {
    place(mounted.current)
    mounted.current = true
  }, [place])

  useEffect(() => {
    const onResize = () => place(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [place])

  /* arrow keys move between days, as a tablist should */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = CALENDAR_DAYS.length - 1
    const next =
      e.key === 'ArrowRight' ? Math.min(active + 1, last)
      : e.key === 'ArrowLeft' ? Math.max(active - 1, 0)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  const day = CALENDAR_DAYS[active]
  const sittings = PUJO_SCHEDULE[day.en] ?? []

  return (
    <div className={`${styles.calendar} ${className}`}>
      <div ref={railRef} className={styles.rail}>
        <div className={styles.tabs} role="tablist" aria-label="Pujo days" onKeyDown={onKeyDown}>
          {CALENDAR_DAYS.map((d, i) => (
            <button
              key={d.en}
              ref={(el) => { tabRefs.current[i] = el }}
              type="button"
              role="tab"
              id={`pujo-day-${d.en}`}
              aria-selected={i === active}
              aria-controls="pujo-day-panel"
              tabIndex={i === active ? 0 : -1}
              className={styles.tab}
              onClick={() => setActive(i)}
            >
              <span className="mk-count-day-bn" lang="bn">{d.bn}</span>
              <span className="mk-count-day-en">{d.en}</span>
              <span className="mk-count-day-date">{formatPujoDay(d)}</span>
            </button>
          ))}
          <span
            className={styles.bar}
            aria-hidden="true"
            style={bar ? { transform: `translateX(${bar.x}px)`, width: bar.w } : { opacity: 0 }}
          />
        </div>
      </div>

      <div
        key={day.en}
        id="pujo-day-panel"
        role="tabpanel"
        aria-labelledby={`pujo-day-${day.en}`}
        className={styles.panel}
      >
        <p className={styles.eyebrow}>
          {formatPujoDay(day)} · {day.en}
        </p>
        {sittings.length > 0 ? (
          sittings.map((sitting) => (
            <div key={sitting.iso} className={styles.sitting}>
              {/* a day over two dates names each one */}
              {sittings.length > 1 && <p className={styles.date}>{formatPujoDate(sitting.iso)}</p>}
              <ol className={styles.moments}>
                {sitting.moments.map((m) => (
                  <li key={m.name} className={`${styles.moment} ${m.key ? styles.key : ''}`}>
                    <span className={styles.name}>{m.name}</span>
                    {m.time && <span className={styles.time}>{m.time}</span>}
                    {m.note && <span className={styles.note}>{m.note}</span>}
                  </li>
                ))}
              </ol>
            </div>
          ))
        ) : (
          <p className={styles.coming}>The {day.en} timings from the panjika are on their way.</p>
        )}
      </div>
    </div>
  )
}
