'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from '@/styles/ResultGlimpse.module.css'

export type SceneFrame = {
  image: string
  alt: string
  caption: string
  position?: string
}

export function SceneCarousel({ frames, name }: { frames: readonly SceneFrame[]; name: string }) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const node = root.current
    if (!node || frames.length < 2) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    let timer: number | undefined
    const sync = () => {
      if (timer !== undefined) window.clearInterval(timer)
      timer = undefined
      if (visible && !paused && !motion.matches && !document.hidden) {
        timer = window.setInterval(() => setActive((current) => (current + 1) % frames.length), 6200)
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    }, { threshold: 0.35 })
    observer.observe(node)
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      if (timer !== undefined) window.clearInterval(timer)
    }
  }, [frames.length, paused])

  const move = (direction: -1 | 1) => {
    const next = (active + direction + frames.length) % frames.length
    setActive(next)
    setAnnouncement(`${frames[next].caption}, scene ${next + 1} of ${frames.length}`)
  }

  return (
    <div ref={root} className={styles.photoColumn} role="region" aria-roledescription="carousel" aria-label={`${name} Pujo scenes`}>
      <div className={styles.photoStage}>
        {frames.map((frame, index) => {
          const position = index === active
            ? styles.photoFront
            : index === (active + 1) % frames.length
              ? styles.photoBackRight
              : styles.photoBackLeft

          return (
            <div key={frame.image} className={`${styles.photoFrame} ${position}`} aria-hidden={index !== active}>
              <Image src={frame.image} alt={frame.alt} fill sizes="(max-width: 760px) 75vw, 345px"
                style={{ objectPosition: frame.position }} loading={index === 0 ? 'eager' : 'lazy'} />
            </div>
          )
        })}
      </div>
      <div className={styles.photoFooter}>
        <p key={active} className={styles.photoCaption}>{frames[active].caption}</p>
        <span className="sr-only" role="status">{announcement}</span>
        <div className={styles.photoControls}>
          <button type="button" onClick={() => move(-1)} aria-label="Previous scene"><span aria-hidden="true">←</span></button>
          <button type="button" className={styles.photoPause} onClick={() => setPaused((current) => !current)} aria-label={paused ? 'Play scenes' : 'Pause scenes'} aria-pressed={paused}>{paused ? 'Play' : 'Pause'}</button>
          <button type="button" onClick={() => move(1)} aria-label="Next scene"><span aria-hidden="true">→</span></button>
        </div>
      </div>
    </div>
  )
}
