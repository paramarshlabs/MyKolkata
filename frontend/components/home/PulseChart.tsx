'use client'

import { useRef, useState, type PointerEvent } from 'react'
import type { TrendPoint } from '@/lib/live/trend'
import { Sprig } from '@/components/brand/kolka'
import styles from '@/styles/Home.module.css'

const W = 1000
const TOP = 14
const BOTTOM = 226
const H = 240

const week = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/* Catmull-Rom through the weekly values, as cubic Béziers: a line drawn by
   hand, the way the alpona rule is, not a jagged polyline. */
function smooth(xy: [number, number][]) {
  if (xy.length < 2) return ''
  let d = `M${xy[0][0].toFixed(1)} ${xy[0][1].toFixed(1)}`
  for (let i = 0; i < xy.length - 1; i++) {
    const [x0, y0] = xy[Math.max(0, i - 1)]
    const [x1, y1] = xy[i]
    const [x2, y2] = xy[i + 1]
    const [x3, y3] = xy[Math.min(xy.length - 1, i + 2)]
    const c1 = [x1 + (x2 - x0) / 6, Math.min(BOTTOM, y1 + (y2 - y0) / 6)]
    const c2 = [x2 - (x3 - x1) / 6, Math.min(BOTTOM, y2 - (y3 - y1) / 6)]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return d
}

/*  One series, so no legend: the title names it. The busiest week of last
    Pujo is marked, and the line ends in a kolka at this week — the alpona rule
    of design.md §6, drawn from data. Pointing anywhere reads that week off. */
export function PulseChart({ points, peakIndex }: { points: TrendPoint[]; peakIndex: number | null }) {
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const n = points.length
  const x = (i: number) => (i / (n - 1)) * W
  const y = (v: number) => BOTTOM - (v / 100) * (BOTTOM - TOP)
  const xy = points.map((p, i) => [x(i), y(p.v)] as [number, number])
  const pct = (i: number) => ({ left: `${(x(i) / W) * 100}%`, top: `${(y(points[i].v) / H) * 100}%` })
  const last = n - 1

  const months = points
    .map((p, i) => ({ i, label: new Date(`${p.d}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }), m: p.d.slice(0, 7) }))
    .filter((p, i, all) => i === 0 || p.m !== all[i - 1].m)
    .slice(1)

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = box.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * last))
  }

  return (
    <div className={styles.pulse}>
      <div className={styles.pulsePlot} ref={box} onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={styles.pulseSvg}>
          <line x1="0" x2={W} y1={BOTTOM} y2={BOTTOM} className={styles.pulseBase} vectorEffect="non-scaling-stroke" />
          <path d={smooth(xy)} className={styles.pulseLine} vectorEffect="non-scaling-stroke" />
          {hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={TOP} y2={BOTTOM} className={styles.pulseCross} vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {peakIndex != null && (
          <span className={styles.pulsePeak} style={pct(peakIndex)} data-edge={x(peakIndex) < W * 0.12 ? 'start' : x(peakIndex) > W * 0.88 ? 'end' : undefined}>
            <span className={styles.pulseLabel}>Pujo {points[peakIndex].d.slice(0, 4)}, {points[peakIndex].v}</span>
          </span>
        )}

        <span className={styles.pulseNow} style={pct(last)}>
          <span className={styles.pulseNowLabel}>This week, {points[last].v}</span>
          <Sprig size={30} />
        </span>

        {hover != null && (
          <span className={styles.pulseTip} style={{ ...pct(hover), transform: `translate(${hover > last * 0.8 ? '-100%' : '0'}, -130%)` }}>
            Week of {week(points[hover].d)}: <span className="mk-tabular">{points[hover].v}</span>
          </span>
        )}
      </div>
      <ol className={styles.pulseMonths} aria-hidden="true">
        {months.map((m) => <li key={m.m} style={{ left: `${(x(m.i) / W) * 100}%` }}>{m.label}</li>)}
      </ol>
    </div>
  )
}
