'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { trackPujo } from '@/lib/pujo-personality/analytics'
import { ARCHETYPE_IDS } from '@/lib/pujo-personality/config'
import { CONTENT, aName } from '@/lib/pujo-personality/content'
import { decodeCard } from '@/lib/pujo-personality/token'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { ArchetypeHero } from './ArchetypeHero'
import { Sigil } from './Sigil'
import styles from '@/styles/PujoPersonality.module.css'

/* Guess my Pujo: the answer is read from the link only after a guess, so the
   page itself never gives it away. */
export function GuessGame({ token }: { token: string }) {
  const [guess, setGuess] = useState<ArchetypeId | null>(null)
  const answerRef = useRef<HTMLElement>(null)
  const card = guess ? decodeCard(token) : null

  useEffect(() => { trackPujo('pujo_invite_opened', { kind: 'guess' }) }, [])
  useEffect(() => { if (guess) answerRef.current?.focus() }, [guess])

  const choose = (id: ArchetypeId) => {
    setGuess(id)
    trackPujo('pujo_guess_resolved', { correct: decodeCard(token)?.primary === id })
  }

  if (!guess || !card) {
    return (
      <main className="mk-page mk-page-top">
        <div className="mk-wrap">
          <h1 className="mk-display">Guess their Pujo.</h1>
          <p className="mk-lede">Nine ways to do Pujo in this city. Your friend is one of them. Which?</p>
          <ul className={styles.guessGrid}>
            {ARCHETYPE_IDS.map((id) => (
              <li key={id}>
                <button type="button" className={styles.guessItem} onClick={() => choose(id)}>
                  <Sigil id={id} size={56} />
                  <span className={styles.grid9Name}>{CONTENT[id].name}</span>
                  <span className={styles.grid9Line}>{CONTENT[id].tagline}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    )
  }

  const verdict = guess === card.primary
    ? `Correct. They\u2019re ${aName(card.primary)}.`
    : `You said ${CONTENT[guess].name}. They\u2019re ${aName(card.primary)}.`
  return (
    <main className="mk-page" ref={answerRef} tabIndex={-1} aria-label={verdict}>
      <ArchetypeHero id={card.primary} voice="they" note={verdict} card={{ secondary: card.secondary, status: card.status, badges: card.badges }}>
        <Link href={`/pujo/personality?with=${token}`} className="mk-btn mk-btn--primary">
          What&apos;s yours? <span className="mk-btn-arrow" aria-hidden="true">→</span>
        </Link>
        <Link href={`/pujo/archetypes/${card.primary}`} className={`mk-btn mk-btn--text ${styles.onGround}`}>Read about the {CONTENT[card.primary].name}</Link>
      </ArchetypeHero>
    </main>
  )
}

