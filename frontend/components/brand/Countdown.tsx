'use client'

import { useEffect, useState } from 'react'
import { MAHALAYA, PUJO_DAYS, formatPujoDate } from '@/lib/pujo'

/* ------------------------------------------------------------- countdown -- */
/*  The homecoming scene. design.md §9.7 — no crimson anywhere in this band;
    the warmth comes from the horizon, not the accent.                         */

/* Deterministic so server and client render the same grass. Never Math.random
   in a component — it desynchronises hydration. */
function seeded(seed: number) {
  let x = seed
  return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648 }
}

type Kaash = { x: number; h: number; lean: number; o: number; front: boolean }

const KAASH: Kaash[] = (() => {
  const r = seeded(20261011)
  return Array.from({ length: 104 }, (_, i) => {
    const x = (i / 103) * 1280 - 40 + (r() - 0.5) * 26
    const h = 74 + r() * 132
    const lean = (r() - 0.5) * 30
    return { x, h, lean, o: 0.24 + r() * 0.5, front: r() > 0.66 }
  })
})()

/* A kaash plume is a dense soft spike, not a fern frond — many short barbs
   angled steeply up the stem, over a faint ellipse of mass. */
function Plume({ k, front }: { k: Kaash; front: boolean }) {
  const tipX = k.x + k.lean
  const tipY = 460 - k.h * (front ? 1.16 : 1)
  const hh = k.h * (front ? 0.5 : 0.44)
  const barbs = []
  const n = 18
  for (let j = 0; j < n; j++) {
    const f = j / (n - 1)
    const py = tipY + f * hh
    const px = tipX - k.lean * f * 0.16
    const bl = (front ? 7.5 : 5.8) * (0.4 + (1 - f) * 0.75)
    barbs.push(
      <path key={`l${j}`} d={`M${px} ${py} Q${px - bl * 0.4} ${py - bl * 0.7} ${px - bl * 0.5} ${py - bl * 1.25}`} />,
      <path key={`r${j}`} d={`M${px} ${py} Q${px + bl * 0.4} ${py - bl * 0.7} ${px + bl * 0.5} ${py - bl * 1.25}`} />
    )
  }
  return (
    <g opacity={front ? Math.min(1, k.o + 0.2) : k.o * 0.66}>
      <ellipse cx={tipX} cy={tipY + hh / 2} rx={front ? 6.5 : 5} ry={hh / 2 + 4}
        transform={`rotate(${k.lean * 1.3} ${tipX} ${tipY + hh / 2})`}
        fill="var(--mk-pearl)" opacity="0.16" />
      <g stroke="var(--mk-pearl)" fill="none" strokeLinecap="round" strokeWidth={front ? 0.75 : 0.55}>
        <path d={`M${k.x} 462 Q${k.x + k.lean * 0.35} ${460 - k.h * 0.6} ${tipX} ${tipY}`}
          strokeWidth={front ? 1.1 : 0.8} />
        {barbs}
      </g>
    </g>
  )
}

const CLOUDS = [
  [180, 128, 210, 26, 0.10], [520, 92, 260, 22, 0.08], [860, 150, 190, 20, 0.09],
  [340, 196, 300, 18, 0.07], [980, 210, 240, 16, 0.06],
]

/* An autumn dusk over kaash phool: Monsoon Teal at the top, Warm Sand at the
   horizon. Drop a photograph in behind this and delete it — the scrim and the
   copy placement stay the same either way. */
function AutumnSky() {
  return (
    <svg className="mk-sky" viewBox="0 0 1200 460" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="mk-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12262A" />
          <stop offset="32%" stopColor="#111517" />
          <stop offset="58%" stopColor="#35131A" />
          <stop offset="78%" stopColor="#6E1520" />
          <stop offset="91%" stopColor="#A5674A" />
          <stop offset="100%" stopColor="#C08A62" />
        </linearGradient>
        <filter id="mk-soft" x="-40%" y="-140%" width="180%" height="380%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="mk-glow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>

      <rect width="1200" height="460" fill="url(#mk-sky)" />

      <circle cx="946" cy="86" r="62" fill="var(--mk-taxi)" opacity="0.13" filter="url(#mk-glow)" />
      <circle cx="946" cy="86" r="21" fill="#F7EBD2" opacity="0.9" />

      <g filter="url(#mk-soft)">
        {CLOUDS.map(([cx, cy, rx, ry, o], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="var(--mk-pearl)" opacity={o} />
        ))}
        <ellipse cx="700" cy="352" rx="460" ry="34" fill="#C08A62" opacity="0.26" />
      </g>

      {KAASH.filter((k) => !k.front).map((k, i) => <Plume key={`b${i}`} k={k} front={false} />)}
      {KAASH.filter((k) => k.front).map((k, i) => <Plume key={`f${i}`} k={k} front />)}
    </svg>
  )
}

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
      <AutumnSky />
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
