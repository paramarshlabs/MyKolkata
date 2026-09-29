'use client'

import { useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { PublicCard } from '@/lib/ashtami-date/profile'
import styles from '@/styles/AshtamiDate.module.css'
import { ShiuliGlyph, Sticker } from './marks'
import { useSwipe } from './useSwipe'

export type CardHandle = { throwOut: (direction: 1 | -1) => void }

type Props = {
  card: PublicCard
  /* the card on top takes the drag; the one behind waits */
  top: boolean
  /* let go for good: the swipe goes to the server while the card is still flying */
  onLeave: (direction: 1 | -1) => void
  onCommit: (direction: 1 | -1) => void
  ref?: Ref<CardHandle>
}

/* One person, photo first. A tap on the left or right of the photo steps through the photos. */
export function DeckCard({ card, top, onLeave, onCommit, ref }: Props) {
  const [index, setIndex] = useState(0)
  const photos = card.photos
  const frame = useRef<HTMLDivElement>(null)
  const { ref: surface, handlers, throwOut } = useSwipe<HTMLElement>({
    onLeave,
    onCommit,
    disabled: !top,
    /* measured across the photo, which on a desktop is only the left of the card */
    onTap: (_, clientX) => {
      const box = frame.current?.getBoundingClientRect()
      if (photos.length < 2 || !box || clientX > box.right) return
      const x = (clientX - box.left) / Math.max(1, box.width)
      setIndex((i) => (x < 0.35 ? Math.max(0, i - 1) : Math.min(photos.length - 1, i + 1)))
    },
  })
  useImperativeHandle(ref, () => ({ throwOut: (direction) => throwOut(direction) }), [throwOut])

  return (
    <article
      ref={surface}
      className={`${styles.card} ${top ? styles.cardTop : styles.cardNext}`}
      aria-hidden={!top}
      aria-label={top ? `${card.firstName}, ${card.age}, ${card.area}` : undefined}
      {...(top ? handlers : {})}
    >
      <div ref={frame} className={styles.cardPhotos}>
        {photos.length ? photos.map((url, i) => (
          // Signed, short-lived links to a private bucket: straight from Supabase, never
          // through the image optimiser, which would cache a private photo on our server.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={`${card.firstName}, photo ${i + 1} of ${photos.length}`}
            className={i === index ? styles.photoOn : styles.photoOff}
            draggable={false}
            decoding="async"
            loading={top || i === 0 ? 'eager' : 'lazy'}
          />
        )) : (
          <div className={styles.photoMissing} aria-hidden="true">{card.firstName.slice(0, 1)}</div>
        )}

        {photos.length > 1 && (
          <div className={styles.cardBars} aria-hidden="true">
            {photos.map((url, i) => <span key={url} className={i === index ? styles.barOn : undefined} />)}
          </div>
        )}

        <div className={styles.cardStickers}>
          {card.pick && (
            <Sticker tone="taxi" tilt={-9} className={styles.pickSticker}>
              <span lang="bn" className={styles.stickerBn}>আজকের স্পেশাল</span>
              <span className={styles.stickerSmall}>today&apos;s pick</span>
            </Sticker>
          )}
          {card.shiuliFromThem && (
            <span className={styles.shiuliTag}><ShiuliGlyph size={18} /> sent you a shiuli</span>
          )}
        </div>

        <span className={`${styles.stamp} ${styles.stampLike}`} aria-hidden="true">for me</span>
        <span className={`${styles.stamp} ${styles.stampPass}`} aria-hidden="true">not for me</span>
      </div>

      <div className={styles.cardInfo}>
        <h2 className={styles.cardName}>
          {card.firstName}<span className={styles.cardAge}>{card.age}</span>
        </h2>
        <p className={styles.cardArea}>{card.area}{card.archetype ? `, ${card.archetype}` : ''}</p>
        <p className={styles.cardPromptLabel}>{card.prompt.text}</p>
        <p className={styles.cardPrompt}>{card.prompt.answer}</p>
        <ul className={styles.cardChips} aria-label="their vibe and plan">
          <li className={styles.planChip}>{card.plan}</li>
          {card.vibes.map((vibe) => <li key={vibe}>{vibe}</li>)}
        </ul>
        <p className={styles.cardReason}><span className={styles.tick} aria-hidden="true" /><span>{card.reason}</span></p>
      </div>
    </article>
  )
}
