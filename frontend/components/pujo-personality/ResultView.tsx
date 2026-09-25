'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { SectionHead } from '@/components/brand/SectionHead'
import { createClient } from '@/lib/supabase/client'
import { trackPujo } from '@/lib/pujo-personality/analytics'
import { ARCHETYPE_IDS, PREFERENCE_FLOW, getDimension } from '@/lib/pujo-personality/config'
import { CONTENT, aName, becauseLine, pairCopy, peopleFor, sentence } from '@/lib/pujo-personality/content'
import { quoteFor, shareCardFrom, type Feedback, type FeedbackValue, type Saved } from '@/lib/pujo-personality/session'
import type { ShareCard } from '@/lib/pujo-personality/token'
import type { ArchetypeId, PujoResult } from '@/lib/pujo-personality/types'
import { ArchetypeHero } from './ArchetypeHero'
import { Compare } from './Compare'
import { DnaChart } from './DnaChart'
import { Recommendations } from './Recommendations'
import { ShareSheet, type ShareMode } from './ShareSheet'
import { Sigil } from './Sigil'
import styles from '@/styles/PujoPersonality.module.css'

/* the only preferences the launch uses: the card's status, the plates' diet, and age */
const TUNE = PREFERENCE_FLOW.filter((q) => ['pref_status', 'pref_diet', 'pref_age'].includes(q.id))

const FEEDBACK: [FeedbackValue, string][] = [['yes', 'That’s literally me'], ['mostly', 'Mostly'], ['no', 'Not me']]

type ResultViewProps = {
  saved: Saved
  result: PujoResult
  fresh: boolean
  friend: ShareCard | null
  onPrefs: (key: string, value: string) => void
  onFeedback: (feedback: Feedback) => void
  onRetake: () => void
  onDelete: () => Promise<void>
}

export function ResultView({ saved, result, fresh, friend, onPrefs, onFeedback, onRetake, onDelete }: ResultViewProps) {
  const id = result.primary
  const content = CONTENT[id]
  const card = useMemo(() => shareCardFrom(result, saved), [result, saved])
  const because = result.because.map((b) => b.dim)
  const people = peopleFor(id)
  const age = saved.prefs.pref_age ?? null
  const minor = age === 'under_18'
  const [sheet, setSheet] = useState<ShareMode | null>(null)
  const loreRef = useRef<HTMLElement>(null)

  useEffect(() => {
    /* the lore is read, not just revealed: count it once it is half on screen */
    const node = loreRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        trackPujo('pujo_lore_viewed', { archetype: id })
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [id])

  return (
    <main className={`mk-page ${styles.result}`}>
      <ArchetypeHero
        id={id}
        reveal={fresh}
        lead="Your Pujo:"
        voice="you"
        card={{ secondary: result.secondary, status: card.status, badges: card.badges, pure: result.pure, close: result.band === 'close' }}
      >
        <button type="button" className="mk-btn mk-btn--primary" onClick={() => setSheet('card')}>
          Share my Pujo <span className="mk-btn-arrow" aria-hidden="true">→</span>
        </button>
        <a href="#story" className={`mk-btn mk-btn--text ${styles.onGround}`}>Read your story</a>
      </ArchetypeHero>

      {friend && !minor && (
        <section className="mk-band" aria-labelledby="compare-title">
          <div className="mk-wrap">
            <SectionHead id="compare-title" title="You and your friend" />
            <div style={{ marginTop: 40 }}><Compare you={card} them={friend} /></div>
          </div>
        </section>
      )}

      <section id="story" ref={loreRef} className={`${styles.paper} mk-band`} aria-labelledby="story-title">
        <div className="mk-wrap">
          <div className="mk-measure">
            <h2 id="story-title" className={styles.paperTitle}>Your story</h2>
            <p className={styles.paperLede}>{content.philosophy}</p>
            {content.lore.map((para) => <p key={para.slice(0, 32)} className={styles.paperBody}>{para}</p>)}
            <div className={styles.lightShadow}>
              <p><span className={styles.paperLabel}>At your best</span>{sentence(content.light)}</p>
              <p><span className={styles.paperLabel}>At your worst</span>{sentence(content.shadow)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-band" aria-labelledby="why-title">
        <div className="mk-wrap">
          <SectionHead id="why-title" title="Why you got this" />
          <ul className={styles.why}>
            {result.because.map((b) => {
              const quote = quoteFor(b.dim, b.value, saved.answers)
              return (
                <li key={b.dim} className={styles.whyItem}>
                  <span className={styles.whyDim}>{getDimension(b.dim).name}</span>
                  <p className="mk-body-lg">{becauseLine(b.dim, b.value)}</p>
                  {quote && <p className={styles.whyQuote}>You said: &ldquo;{quote}&rdquo;</p>}
                </li>
              )
            })}
          </ul>
          {result.secondary && !result.pure && (
            <p className="mk-note" style={{ marginTop: 40 }}>
              {result.band === 'close'
                ? `It was close between the ${content.name} and the ${CONTENT[result.secondary].name}. Your answers leaned this way; you are a good part of both.`
                : `Your streak: ${CONTENT[result.secondary].oneLine}`}
            </p>
          )}
          <p className="mk-caption" style={{ marginTop: 24 }}>A playful Pujo identity built from your answers. Not a psychological test.</p>
        </div>
      </section>

      <section className="mk-band" aria-labelledby="dna-title" style={{ paddingTop: 0 }}>
        <div className="mk-wrap">
          <SectionHead id="dna-title" title="Your Pujo DNA" lede="Fourteen petals, one for each part of your Pujo, drawn against how most people answer." />
          <div style={{ marginTop: 40 }}>
            <DnaChart vector={result.vector} onOpen={(dim) => trackPujo('pujo_dna_opened', { petal: dim })} />
          </div>
        </div>
      </section>

      <section className="mk-band mk-band--deep" aria-labelledby="people-title">
        <div className="mk-wrap">
          <SectionHead id="people-title" title="Your people" lede="Who to go with, and who will make it interesting." />
          <ul className={styles.people}>
            {([['kin', 'The same Pujo'], ['complement', 'A good fit'], ['spark', 'The fun kind of opposite']] as const).flatMap(([kind, label]) =>
              people[kind].map((other) => {
                const pair = pairCopy(id, other)
                return (
                  <li key={other}>
                    <Link href={`/pujo/archetypes/${other}`} className={styles.person}>
                      <Sigil id={other} size={48} />
                      <span>
                        <span className={styles.personKind}>{label}</span>
                        <span className={styles.personName}>{CONTENT[other].name}</span>
                        <span className={styles.personLine}>{pair.headline}</span>
                      </span>
                    </Link>
                  </li>
                )
              }))}
          </ul>
        </div>
      </section>

      <section className="mk-band" aria-labelledby="say-title">
        <div className="mk-wrap">
          <SectionHead id="say-title" title="What you'd say" />
          <ul className={styles.says}>
            {content.says.slice(0, 3).map((line) => <li key={line} className="mk-statement">{line}</li>)}
          </ul>
          <FeedbackBlock primary={id} feedback={saved.feedback} onFeedback={onFeedback} />
        </div>
      </section>

      <section className="mk-band" aria-labelledby="tune-title" style={{ paddingTop: 0 }}>
        <div className="mk-wrap">
          <SectionHead id="tune-title" title="Tune your Pujo" lede="All optional. It stays on your phone." />
          <div className={styles.tune}>
            {TUNE.map((q) => (
              <div key={q.id} className={styles.tuneRow} role="group" aria-labelledby={`${q.id}-label`}>
                <p id={`${q.id}-label`} className="mk-label">{q.prompt.replace(/:$/, '')}</p>
                <div className="mk-chips">
                  {q.options.map((o) => (
                    <button key={o.id} type="button" className="mk-chip" aria-pressed={saved.prefs[q.id] === o.id} onClick={() => onPrefs(q.id, o.id)}>
                      {o.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {minor && (
            <p className="mk-note" style={{ marginTop: 24 }}>
              Here&apos;s your Pujo. Save the card to your phone. When you&apos;re 18, you can keep it here too.
            </p>
          )}
        </div>
      </section>

      <section className="mk-band mk-band--closing" aria-labelledby="yours-title">
        <div className="mk-wrap">
          <SectionHead id="yours-title" title="Your Pujo" lede={`Three routes, eight pandals and the plates to go with them, picked for ${aName(id)}.`} />
          <Recommendations id={id} diet={saved.prefs.pref_diet} />
        </div>
      </section>

      <section className="mk-band" aria-labelledby="invite-title">
        <div className="mk-wrap">
          <SectionHead id="invite-title" title="Bring someone" />
          <div className={styles.invites}>
            <button type="button" className={styles.invite} onClick={() => setSheet('card')}>
              <span className={styles.inviteTitle}>Share your card</span>
              <span className={styles.inviteLine}>For your Story, or the family group.</span>
            </button>
            {!minor && (
              <>
                <button type="button" className={styles.invite} onClick={() => setSheet('compare')}>
                  <span className={styles.inviteTitle}>Compare with a friend</span>
                  <span className={styles.inviteLine}>See how your Pujos fit.</span>
                </button>
                <button type="button" className={styles.invite} onClick={() => setSheet('guess')}>
                  <span className={styles.inviteTitle}>Guess my Pujo</span>
                  <span className={styles.inviteLine}>Make a friend guess. They&apos;ll be wrong.</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mk-band" aria-labelledby="keep-title" style={{ paddingTop: 0 }}>
        <div className="mk-wrap">
          <SectionHead id="keep-title" title="Your answers, your phone" />
          <div className={styles.keep}>
            <p className="mk-body mk-measure">
              Your answers are kept on this phone. Nothing about your Pujo is stored on our side unless you keep it on your account.
              {minor ? ' Under 18, it is kept only until you close this tab.' : ''}
            </p>
            <KeepIt saved={saved} minor={minor} />
            <div className={styles.keepActions}>
              <button type="button" className="mk-btn mk-btn--secondary" onClick={() => { trackPujo('pujo_retake_started'); onRetake() }}>Take it again</button>
              <DeleteButton onDelete={onDelete} />
            </div>
          </div>
        </div>
      </section>

      {sheet && (
        <ShareSheet
          mode={sheet}
          card={card}
          because={because}
          age={age}
          onAge={(band) => onPrefs('pref_age', band)}
          onClose={() => setSheet(null)}
        />
      )}
    </main>
  )
}

/* ---------------------------------------------------------- That's me? -- */

function FeedbackBlock({ primary, feedback, onFeedback }: { primary: ArchetypeId; feedback?: Feedback; onFeedback: (f: Feedback) => void }) {
  const [picking, setPicking] = useState(feedback?.value === 'no' && !feedback.pick)
  return (
    <div className={styles.feedback} role="group" aria-labelledby="feedback-title">
      <p id="feedback-title" className="mk-h3">That&apos;s me?</p>
      <div className="mk-chips" style={{ marginTop: 16 }}>
        {FEEDBACK.map(([value, label]) => (
          <button key={value} type="button" className="mk-chip" aria-pressed={feedback?.value === value}
            onClick={() => { onFeedback({ value }); setPicking(value === 'no') }}>
            {label}
          </button>
        ))}
      </div>
      {picking && (
        <div style={{ marginTop: 20 }}>
          <p className="mk-caption">I&apos;m more of a&hellip;</p>
          <div className="mk-chips" style={{ marginTop: 12 }}>
            {ARCHETYPE_IDS.filter((a) => a !== primary).map((a) => (
              <button key={a} type="button" className="mk-chip" aria-pressed={feedback?.pick === a}
                onClick={() => { onFeedback({ value: 'no', pick: a }); setPicking(false) }}>
                {CONTENT[a].name}
              </button>
            ))}
          </div>
        </div>
      )}
      {feedback && !picking && <p className="mk-caption" style={{ marginTop: 16 }}>Thank you. It helps us tune the nine.</p>}
    </div>
  )
}

/* ------------------------------------------------------------ keep it -- */

type KeepState = 'unknown' | 'none' | 'kept' | 'saving' | 'failed'

function KeepIt({ saved, minor }: { saved: Saved; minor: boolean }) {
  const { user, isLoaded, signInWithGoogle } = useAuth()
  const [state, setState] = useState<KeepState>('unknown')
  const answersKey = JSON.stringify(saved.answers)

  useEffect(() => {
    if (!user || minor) return
    let active = true
    createClient().auth.getUser().then(({ data }) => {
      if (!active) return
      const kept = data.user?.user_metadata?.pujo
      setState(kept && JSON.stringify(kept.answers) === answersKey ? 'kept' : 'none')
    }).catch(() => active && setState('none'))
    return () => { active = false }
  }, [user, minor, answersKey])

  if (minor || !isLoaded) return null

  if (!user) {
    return (
      <button type="button" className="mk-btn mk-btn--secondary" onClick={() => {
        trackPujo('pujo_signup_from_result')
        void signInWithGoogle('/pujo/personality')
      }}>
        Sign in to keep it
      </button>
    )
  }

  const keep = async () => {
    setState('saving')
    const { error } = await createClient().auth.updateUser({
      data: { pujo: { v: 1, answers: saved.answers, savedAt: new Date().toISOString() } },
    })
    setState(error ? 'failed' : 'kept')
  }

  return (
    <div>
      <button type="button" className="mk-btn mk-btn--secondary" onClick={keep} disabled={state === 'saving' || state === 'kept'}>
        {state === 'kept' ? 'Kept on your account' : state === 'saving' ? 'Keeping it' : 'Keep it on your account'}
      </button>
      {state === 'failed' && <p className="mk-caption" role="status" style={{ marginTop: 8 }}>That didn&apos;t save. Try again in a moment.</p>}
    </div>
  )
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) {
    return <button type="button" className="mk-btn mk-btn--text" onClick={() => setConfirming(true)}>Delete my Pujo</button>
  }
  return (
    <span className={styles.confirm} role="group" aria-label="Delete my Pujo">
      <span className="mk-caption">Delete it from this phone and your account?</span>
      <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={() => void onDelete()}>Delete</button>
      <button type="button" className="mk-btn mk-btn--text mk-btn--sm" onClick={() => setConfirming(false)}>Keep it</button>
    </span>
  )
}
