'use client'

import { useId, useState } from 'react'
import { DIMENSION_FAMILIES, getDimension } from '@/lib/pujo-personality/config'
import { dnaWord, sentence } from '@/lib/pujo-personality/content'
import { DNA_BOX, DNA_CENTRE, DNA_DISC, DNA_TYPICAL_RADIUS, dnaShapes } from '@/lib/pujo-personality/dna'
import { dnaPetals } from '@/lib/pujo-personality/scoring'
import type { DimensionId, Vector } from '@/lib/pujo-personality/types'
import styles from '@/styles/PujoPersonality.module.css'

type DnaChartProps = {
  vector: Vector
  tone?: 'dark' | 'paper'
  onOpen?: (dim: DimensionId) => void
}

/* The Pujo DNA as an alpona (08-visual-bible.md §3.3). Petals are labelled on
   tap, never on the chart; the list beneath says the same in words, so colour
   and length are never the only carriers of meaning. */
export function DnaChart({ vector, tone = 'dark', onOpen }: DnaChartProps) {
  const petals = dnaPetals(vector)
  const shapes = dnaShapes(petals)
  const [open, setOpen] = useState<DimensionId | null>(null)
  const listId = useId()
  const current = open ? getDimension(open) : null

  const choose = (dim: DimensionId) => {
    setOpen((was) => (was === dim ? null : dim))
    onOpen?.(dim)
  }

  return (
    <div className={`${styles.dna} ${tone === 'paper' ? styles.dnaPaper : ''}`}>
      <div className={styles.dnaFigure}>
        <svg viewBox={`0 0 ${DNA_BOX} ${DNA_BOX}`} className={styles.dnaArt} role="img"
          aria-label="Your Pujo DNA: fourteen petals, one for each part of your Pujo. The list below says what each petal means.">
          <circle cx={DNA_CENTRE} cy={DNA_CENTRE} r={DNA_TYPICAL_RADIUS} className={styles.dnaRing} />
          {shapes.map((shape) => (
            <path
              key={shape.dim}
              d={shape.d}
              transform={shape.transform}
              className={`${styles.dnaPetal} ${open === shape.dim ? styles.dnaPetalOn : ''}`}
              onClick={() => choose(shape.dim)}
            />
          ))}
          <circle cx={DNA_CENTRE} cy={DNA_CENTRE} r={DNA_DISC} className={styles.dnaDisc} />
        </svg>
        <p className={styles.dnaReadout} aria-live="polite">
          {current && open ? (
            <>
              <span className={styles.dnaReadoutName}>{current.name}</span>
              <span>{sentence(dnaWord(petals[open]))}. {petals[open] >= 0.5 ? current.high : current.low}</span>
            </>
          ) : (
            <span>Tap a petal. The dashed ring is where most people land.</span>
          )}
        </p>
      </div>

      <ul className={styles.dnaList} id={listId}>
        {DIMENSION_FAMILIES.flatMap((family) => family.dims).map((dim) => (
          <li key={dim}>
            <button type="button" className={styles.dnaItem} aria-pressed={open === dim} onClick={() => choose(dim)}>
              <span className={styles.dnaItemName}>{getDimension(dim).name}</span>
              <span className={styles.dnaItemWord}>{dnaWord(petals[dim])}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
