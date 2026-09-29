'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Sigil } from '@/components/pujo-personality/Sigil'
import { createClient } from '@/lib/supabase/client'
import { CONTENT, streakLine } from '@/lib/pujo-personality/content'
import { noSnapshot, parseSaved, savedSnapshot, scoreAnswers, subscribeSaved, type AnswerMap } from '@/lib/pujo-personality/session'
import styles from '@/styles/Profile.module.css'

type Source = 'device' | 'account'

/* Your Pujo, on your profile: the result from this phone if you took the quiz
   here, or the one you kept on your account if you took it somewhere else.
   Nothing new is saved from here; keeping it on the account stays a choice
   made on the result itself (and never for under-18s). */
export function ProfilePujo() {
  const raw = useSyncExternalStore(subscribeSaved, savedSnapshot, noSnapshot)
  const local = useMemo(() => parseSaved(raw), [raw])
  const [account, setAccount] = useState<AnswerMap | null | undefined>(undefined)

  useEffect(() => {
    if (local) return
    let active = true
    createClient().auth.getUser()
      .then(({ data }) => {
        const kept = data.user?.user_metadata?.pujo
        if (active) setAccount(kept?.answers && typeof kept.answers === 'object' ? (kept.answers as AnswerMap) : null)
      })
      .catch(() => active && setAccount(null))
    return () => { active = false }
  }, [local])

  const answers: AnswerMap | null = local?.answers ?? account ?? null
  const source: Source | null = local ? 'device' : account ? 'account' : null
  const result = useMemo(() => (answers ? scoreAnswers(answers) : null), [answers])

  /* still asking the account */
  if (!local && account === undefined) return null

  return (
    <section className={styles.pujo} aria-labelledby="pujo-title">
      <h2 id="pujo-title" className="mk-h2">Your Pujo</h2>

      {result ? (
        <div className={`mk-panel ${styles.pujoCard}`}>
          <Sigil id={result.primary} size={88} className={styles.pujoSigil} />
          <div className={styles.pujoCopy}>
            <p className={styles.pujoBn} lang="bn">{CONTENT[result.primary].bn}</p>
            <p className={styles.pujoName}>{CONTENT[result.primary].name}</p>
            <p className="mk-body" style={{ marginTop: 8 }}>
              {CONTENT[result.primary].tagline}
              {result.secondary && <span style={{ color: 'var(--mk-ash)' }}> {capitalise(streakLine(result.secondary))}.</span>}
            </p>
            <div className="mk-banner-actions" style={{ marginTop: 16 }}>
              <Link href="/experience/personality" className="mk-btn mk-btn--primary">
                See your Pujo <span className="mk-btn-arrow" aria-hidden="true">→</span>
              </Link>
              <Link href={`/experience/archetypes/${result.primary}`} className="mk-btn mk-btn--text">
                About the {CONTENT[result.primary].name}
              </Link>
            </div>
            <p className="mk-meta" style={{ marginTop: 12 }}>
              {source === 'account'
                ? 'Kept on your account.'
                : 'On this device. To see it on your other devices, choose Keep it on your account on your result.'}
            </p>
          </div>
        </div>
      ) : (
        <div className={`mk-panel ${styles.pujoCard} ${styles.pujoEmpty}`}>
          <div className={styles.pujoCopy}>
            <p className={styles.pujoBn} lang="bn">তুমি কোন পুজো?</p>
            <p className="mk-body" style={{ marginTop: 8 }}>
              Thirteen questions, nine ways to do Pujo. Take the quiz and your Pujo shows up here.
            </p>
            <div className="mk-banner-actions" style={{ marginTop: 16 }}>
              <Link href="/experience/personality" className="mk-btn mk-btn--primary">
                Take the quiz <span className="mk-btn-arrow" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
