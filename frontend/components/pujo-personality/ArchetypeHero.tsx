import type { CSSProperties, ReactNode } from 'react'
import { CONTENT, PALETTES, TAGLINE_LINES, BADGE_LABELS, STATUS_LABELS, streakLine, type Palette } from '@/lib/pujo-personality/content'
import type { ShareCard } from '@/lib/pujo-personality/token'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { Sigil } from './Sigil'
import styles from '@/styles/PujoPersonality.module.css'

/* An archetype's palette as custom properties, for the band it owns. */
export function paletteStyle(palette: Palette): CSSProperties {
  return {
    '--pp-ground': palette.ground,
    '--pp-text': palette.text,
    '--pp-body': palette.body,
    '--pp-muted': palette.muted,
    '--pp-accent': palette.accent,
    '--pp-tick': palette.tick,
    '--pp-second': palette.second,
  } as CSSProperties
}

/* The house caption device: a tick, a quiet line, an indented display line. DESIGN.md §9.6 */
export function Tagline({ id, className = '' }: { id: ArchetypeId; className?: string }) {
  const [first, second] = TAGLINE_LINES[id]
  return (
    <div className={`mk-capdev ${styles.tagline} ${className}`}>
      <span className="mk-capdev-tick" aria-hidden="true" />
      <div>
        <p className="mk-capdev-1">{first}</p>
        <p className="mk-capdev-2">{second}</p>
      </div>
    </div>
  )
}

type HeroProps = {
  id: ArchetypeId
  level?: 1 | 2
  /* the one unrequested moment: letterbox, name, bloom, tagline */
  reveal?: boolean
  /* shown before the name, for screen readers: "Your Pujo:" */
  lead?: string
  card?: Pick<ShareCard, 'secondary' | 'status' | 'badges'> & { pure?: boolean; close?: boolean }
  voice?: 'you' | 'they' | 'none'
  /* a quiet line above the sigil: "Someone sent you their Pujo." */
  note?: string
  children?: ReactNode
}

/* The profile card as a band (08-visual-bible.md §5): the archetype's ground,
   the sigil, the Bengali name leading, the Latin name following, the tagline. */
export function ArchetypeHero({ id, level = 1, reveal = false, lead, card, voice = 'none', note, children }: HeroProps) {
  const content = CONTENT[id]
  const palette = PALETTES[id]
  const Heading = level === 1 ? 'h1' : 'h2'
  const hourLine = voice === 'you' ? `${content.hour} is your hour.` : voice === 'they' ? `${content.hour} is their hour.` : `${content.hour} is the hour.`

  return (
    <section
      className={`${styles.hero} ${palette.tone === 'paper' ? styles.paperTone : ''} ${reveal ? styles.revealing : ''}`}
      style={paletteStyle(palette)}
      aria-labelledby={`hero-${id}`}
    >
      {reveal && <span className={styles.letterboxTop} aria-hidden="true" />}
      {reveal && <span className={styles.letterboxBottom} aria-hidden="true" />}
      <div className={`mk-wrap ${styles.heroInner}`}>
        {note && <p className={styles.heroNote}>{note}</p>}
        <Sigil id={id} size={120} colours={palette.sigil} bloom={reveal} className={styles.heroSigil} />
        <p className={styles.heroBn} lang="bn">{content.bn}</p>
        <Heading id={`hero-${id}`} className={styles.heroName}>
          {lead && <span className="sr-only">{lead} </span>}
          {content.name}
        </Heading>
        <Tagline id={id} className={styles.heroTagline} />
        <div className={styles.heroMeta}>
          {card?.secondary && !card.pure && (
            <p>{card.close ? `Close to the ${CONTENT[card.secondary].name}, too.` : `${streakLine(card.secondary).replace(/^w/, 'W')}.`}</p>
          )}
          {card?.pure && <p>{`A pure ${content.name}. No streak.`}</p>}
          <p><span className={styles.heroHour}>{content.hour}</span>{hourLine.slice(content.hour.length)}</p>
          {card?.status && <p className={styles.heroStatus}>{STATUS_LABELS[card.status]}</p>}
        </div>
        {card && card.badges.length > 0 && (
          <ul className={styles.badges} aria-label="Badges">
            {card.badges.map((b) => <li key={b} className={styles.badge}>{BADGE_LABELS[b]}</li>)}
          </ul>
        )}
        {children && <div className={styles.heroActions}>{children}</div>}
      </div>
    </section>
  )
}
