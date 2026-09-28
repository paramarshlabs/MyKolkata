'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { silencePujoAnalytics, trackPujo } from '@/lib/pujo-personality/analytics'
import { CORE_FLOW, MODEL_VERSION } from '@/lib/pujo-personality/config'
import {
  clearProgress, isMinor, loadFriend, loadProgress, loadSaved, persistSaved, saveFriend, saveProgress, scoreAnswers,
  type Feedback, type Progress, type Saved,
} from '@/lib/pujo-personality/session'
import { clearAllStored } from '@/lib/pujo-personality/storage'
import { decodeCard, type ShareCard } from '@/lib/pujo-personality/token'
import type { Question } from '@/lib/pujo-personality/types'
import { QuestionScreen, RapidFire, Reading, Tiebreaker } from './Quiz'
import { ResultView } from './ResultView'
import styles from '@/styles/PujoPersonality.module.css'

type Phase = 'arriving' | 'quiz' | 'rapid' | 'tiebreak' | 'reading' | 'result'

/* the drumroll: at most two seconds, because the scoring takes milliseconds */
const READING_MS = 1950

/*
 * The Pujo Personality: thirteen questions, the rapid round, the
 * tie-breaker when it is close, the reveal, and everything after it.
 * Everything is scored on the phone, and kept there (lib/pujo-personality/session.ts).
 */
export default function PujoPersonality() {
  const { user } = useAuth()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('arriving')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [fresh, setFresh] = useState(false)
  const [friend, setFriend] = useState<ShareCard | null>(null)
  const [ready, setReady] = useState(false)
  /* the latest progress and result, for callbacks that outlive a render (the reaction delay) */
  const progressRef = useRef<Progress | null>(null)
  const savedRef = useRef<Saved | null>(null)
  const answers = saved?.answers
  const result = useMemo(() => (answers ? scoreAnswers(answers) : null), [answers])

  const commit = (next: Progress | null) => {
    progressRef.current = next
    if (next) saveProgress(next)
    else clearProgress()
    setProgress(next)
  }

  const keep = (next: Saved | null) => {
    savedRef.current = next
    if (next) persistSaved(next)
    setSaved(next)
  }

  const go = (next: Phase) => {
    setPhase(next)
    window.scrollTo({ top: 0 })
  }

  /* arrival: a friend's card, then a saved Pujo, a quiz in progress, or a
     fresh quiz. There is no landing here (the nine live at /pujo/archetypes):
     the phone's storage is read once, after hydration, and the state machine
     starts from what it holds. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const withToken = params.get('with')
    if (withToken && decodeCard(withToken)) saveFriend(withToken)
    const friendCard = decodeCard(withToken ?? loadFriend())
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one read of external storage after hydration
    setFriend(friendCard)

    const stored = loadSaved()
    const inProgress = loadProgress()
    if (stored) {
      silencePujoAnalytics(isMinor(stored.prefs))
      savedRef.current = stored
      setSaved(stored)
      setPhase('result')
    } else if (inProgress) {
      progressRef.current = inProgress
      setProgress(inProgress)
      setPhase(inProgress.stage)
    } else {
      trackPujo('pujo_landing_viewed', { source: params.get('src'), ref: params.get('ref'), invite: friendCard ? 'compare' : null })
      start()
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- arrival runs once; start() only touches state setters and refs
  }, [])

  /* signed in with a Pujo kept on the account, and nothing on this phone:
     bring it back, as long as the fresh quiz has not been started on */
  const untouched = () => Object.keys(progressRef.current?.answers ?? {}).length === 0
  useEffect(() => {
    if (!ready || !user || savedRef.current || phase !== 'quiz' || !untouched()) return
    let active = true
    createClient().auth.getUser().then(({ data }) => {
      const kept = data.user?.user_metadata?.pujo
      if (!active || savedRef.current || !untouched() || !kept?.answers) return
      keep({ v: 1, answers: kept.answers, prefs: {}, revealedAt: Date.parse(kept.savedAt) || Date.now() })
      commit(null)
      setPhase('result')
    }).catch(() => {})
    return () => { active = false }
  }, [ready, user, phase])

  /* leaving mid-quiz */
  useEffect(() => {
    const onHide = () => {
      const p = progressRef.current
      if (!p || savedRef.current) return
      const last = p.stage === 'quiz' ? CORE_FLOW[p.index]?.id : p.stage
      trackPujo('pujo_quiz_abandoned', { last, ms: Date.now() - p.startedAt })
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [])

  function start() {
    commit({ v: 1, stage: 'quiz', index: 0, answers: {}, startedAt: Date.now() })
    setFresh(false)
    go('quiz')
    trackPujo('pujo_quiz_started', { model: MODEL_VERSION })
  }

  function answer(question: Question, optionIds: string[], ms: number) {
    const p = progressRef.current
    if (!p) return
    commit({ ...p, answers: { ...p.answers, [question.id]: optionIds } })
    trackPujo('pujo_question_answered', { question: question.id, options: optionIds.join('+'), ms: Math.round(ms), position: p.index + 1 })
  }

  function next() {
    const p = progressRef.current
    if (!p) return
    if (p.index < CORE_FLOW.length - 1) {
      commit({ ...p, index: p.index + 1 })
      window.scrollTo({ top: 0 })
    } else {
      commit({ ...p, stage: 'rapid', index: 0 })
      go('rapid')
    }
  }

  function back() {
    const p = progressRef.current
    if (!p) return
    trackPujo('pujo_question_back', { question: CORE_FLOW[p.index].id })
    if (p.index === 0) {
      if (savedRef.current) go('result')
      else router.push('/pujo')
    }
    else commit({ ...p, index: p.index - 1 })
  }

  function rapidAnswer(question: Question, optionId: string) {
    const p = progressRef.current
    if (p) commit({ ...p, answers: { ...p.answers, [question.id]: [optionId] } })
  }

  function rapidDone(skipped: boolean) {
    const p = progressRef.current
    if (!p) return
    const swipes = Object.keys(p.answers).filter((id) => id.startsWith('rf_')).length
    trackPujo(skipped ? 'pujo_rapidfire_skipped' : 'pujo_rapidfire_completed', { swipes })
    const scored = scoreAnswers(p.answers)
    if (scored.needsTiebreak && scored.tiebreak) {
      commit({ ...p, stage: 'tiebreak', tiebreak: scored.tiebreak.questionId })
      go('tiebreak')
      trackPujo('pujo_tiebreaker_shown', { dimension: scored.tiebreak.dim })
    } else {
      reveal(p)
    }
  }

  function tiebreakAnswer(question: Question, optionId: string) {
    const p = progressRef.current
    if (!p) return
    const nextProgress = { ...p, answers: { ...p.answers, [question.id]: [optionId] } }
    commit(nextProgress)
    trackPujo('pujo_tiebreaker_answered', { dimension: question.dim ?? null, option: optionId })
    reveal(nextProgress)
  }

  function reveal(p: Progress) {
    go('reading')
    window.setTimeout(() => {
      const nextSaved: Saved = { v: 1, answers: p.answers, prefs: savedRef.current?.prefs ?? {}, revealedAt: Date.now() }
      keep(nextSaved)
      commit(null)
      setFresh(true)
      go('result')
      const scored = scoreAnswers(nextSaved.answers)
      trackPujo('pujo_result_revealed', {
        primary: scored.primary, secondary: scored.secondary, band: scored.band, pure: scored.pure,
        model: scored.modelVersion, ms: Date.now() - p.startedAt,
      })
    }, READING_MS)
  }

  function setPref(key: string, value: string) {
    const s = savedRef.current
    if (!s) return
    keep({ ...s, prefs: { ...s.prefs, [key]: value } })
    if (key === 'pref_age') {
      /* the band is counted once, then nothing more is sent for under-18s */
      trackPujo('pujo_age_band_set', { band: value })
      silencePujoAnalytics(value === 'under_18')
      if (value === 'under_18' && user) void createClient().auth.updateUser({ data: { pujo: null } }).catch(() => {})
    } else {
      trackPujo('pujo_preferences_set', { facet: key })
    }
  }

  function setFeedback(feedback: Feedback) {
    const s = savedRef.current
    if (!s) return
    keep({ ...s, feedback })
    trackPujo('pujo_result_feedback', { value: feedback.value, picked: feedback.pick ?? null })
  }

  async function remove() {
    trackPujo('pujo_data_deleted')
    clearAllStored()
    commit(null)
    savedRef.current = null
    setSaved(null)
    setFriend(null)
    setFresh(false)
    if (user) {
      try {
        await createClient().auth.updateUser({ data: { pujo: null } })
      } catch {
        /* the phone copy is gone either way; the account copy can be removed from here again */
      }
    }
    router.push('/pujo')
  }

  if (phase === 'result' && saved && result) {
    return (
      <ResultView
        saved={saved}
        result={result}
        fresh={fresh}
        friend={friend}
        onPrefs={setPref}
        onFeedback={setFeedback}
        onRetake={start}
        onDelete={remove}
      />
    )
  }

  if (phase === 'reading') return <main className={`mk-page ${styles.stage}`}><Reading /></main>

  if (progress && (phase === 'quiz' || phase === 'rapid' || phase === 'tiebreak')) {
    return (
      <main className={`mk-page ${styles.stage}`}>
        <div className="mk-wrap">
          {phase === 'quiz' && <QuestionScreen index={progress.index} answers={progress.answers} onAnswer={answer} onNext={next} onBack={back} />}
          {phase === 'rapid' && <RapidFire onAnswer={rapidAnswer} onDone={rapidDone} />}
          {phase === 'tiebreak' && progress.tiebreak && <Tiebreaker questionId={progress.tiebreak} onAnswer={tiebreakAnswer} />}
        </div>
      </main>
    )
  }

  /* the server render and the first client frame, before storage is read */
  return <main className={`mk-page ${styles.stage}`} aria-busy="true" />
}
