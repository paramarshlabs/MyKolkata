'use client'

import { useEffect, useState } from 'react'
import { MAHALAYA, PUJO_DAYS, formatPujoDate } from '@/lib/pujo'
import { KaashPhoolScene } from '@/components/brand/KaashPhool'

type Left = { d: number; h: number; m: number; s: number; done: boolean }

export function useCountdown(iso: string) {
  const [left, setLeft] = useState<Left | null>(null)   /* null until mounted — keeps SSR stable */
  useEffect(() => {
    const target = new Date(iso).getTime()
    const tick = () => {
      const ms = target - Date.now()
      if (ms <= 0) return setLeft({ d: 0, h: 0, m: 0, s: 0, done: true })
      setLeft({
        d: Math.floor(ms / 86400000),
        h: Math.floor(ms / 3600000) % 24,
        m: Math.floor(ms / 60000) % 60,
        s: Math.floor(ms / 1000) % 60,
        done: false,
      })
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [iso])
  return left
}

export function CountdownScene() {
  const left = useCountdown(MAHALAYA)
  const pad = (n: number) => String(n).padStart(2, '0')
  const units = left
    ? [[String(left.d), 'days'], [pad(left.h), 'hours'], [pad(left.m), 'minutes'], [pad(left.s), 'seconds']]
    : [['--', 'days'], ['--', 'hours'], ['--', 'minutes'], ['--', 'seconds']]

  return (
    <div className="mk-count-scene">
      <KaashPhoolScene />
      <div className="mk-count-scrim" aria-hidden="true" />
      <div className="mk-count-copy">
        <p className="mk-count-bn" lang="bn">পুজোয় বাড়ি ফিরছ তো?</p>
        <p className="mk-count-home">Welcome home.</p>
        <div className="mk-count-clock" role="timer" aria-live="off">
          {units.map(([v, label]) => (
            <div className="mk-unit" key={label}>
              <span className="mk-unit-num">{v}</span>
              <span className="mk-unit-label">{label}</span>
            </div>
          ))}
        </div>
        <p className="mk-count-sub">
          {left?.done
            ? 'Mahalaya has come. The city is ready.'
            : 'till Mahalaya, 11 October. The city has already started getting ready.'}
        </p>
      </div>
    </div>
  )
}

export function PujoDays({ className = '' }: { className?: string }) {
  return (
    <ol className={`mk-count-days ${className}`}>
      {PUJO_DAYS.map((d) => (
        <li className="mk-count-day" key={d.en}>
          <span className="mk-count-day-bn" lang="bn">{d.bn}</span>
          <span className="mk-count-day-en">{d.en}</span>
          <span className="mk-count-day-date">{formatPujoDate(d.iso)}</span>
        </li>
      ))}
    </ol>
  )
}
