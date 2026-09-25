'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { UiIcon } from '@/components/brand/icons'
import { CORE_FLOW, QUESTION_INDEX, RAPID_FLOW } from '@/lib/pujo-personality/config'
import type { AnswerMap } from '@/lib/pujo-personality/session'
import type { Question } from '@/lib/pujo-personality/types'
import styles from '@/styles/PujoPersonality.module.css'

/* long enough to read the reaction line, short enough to keep moving */
const REACTION_MS = 1000

/* Progress as an alpona rule, one segment per question. No "3 of 13". */
function Progress({ index, total }: { index: number; total: number }) {
  return (
    <div className={styles.progress} role="progressbar" aria-label="Questions" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`${styles.progressStep} ${i < index ? styles.progressDone : ''} ${i === index ? styles.progressNow : ''}`} />
      ))}
    </div>
  )
}

/* --------------------------------------------------------- questions -- */

type QuestionProps = {
  index: number
  answers: AnswerMap
  onAnswer: (question: Question, optionIds: string[], ms: number) => void
  onNext: () => void
  onBack: () => void
}

export function QuestionScreen({ index, answers, onAnswer, onNext, onBack }: QuestionProps) {
  const question = CORE_FLOW[index]
  return (
    <section className={styles.quiz} aria-labelledby="question">
      <div className={styles.quizTop}>
        <button type="button" className="mk-icon-btn mk-icon-btn--bare" onClick={onBack} aria-label={index === 0 ? 'Back to the start' : 'Previous question'}>
          <UiIcon name="back" size={22} />
        </button>
        <Progress index={index} total={CORE_FLOW.length} />
      </div>
      {/* keyed, so every question starts with fresh state */}
      <QuestionCard key={question.id} question={question} initial={answers[question.id] ?? []} onAnswer={onAnswer} onNext={onNext} />
    </section>
  )
}

type CardProps = {
  question: Question
  initial: string[]
  onAnswer: QuestionProps['onAnswer']
  onNext: () => void
}

function QuestionCard({ question, initial, onAnswer, onNext }: CardProps) {
  const multi = question.type === 'multi'
  const [picked, setPicked] = useState<string[]>(initial)
  const [reaction, setReaction] = useState<string | null>(null)
  const shownAt = useRef(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const timer = useRef<number | undefined>(undefined)

  /* the heading takes focus, so a screen reader hears the question first */
  useEffect(() => {
    shownAt.current = performance.now()
    headingRef.current?.focus({ preventScroll: true })
    return () => window.clearTimeout(timer.current)
  }, [])

  /* event timestamps share performance.now()'s clock */
  const settle = (optionIds: string[], at: number) => {
    const last = question.options.find((o) => o.id === optionIds[optionIds.length - 1])
    onAnswer(question, optionIds, at - shownAt.current)
    setReaction(last?.reaction ?? null)
    timer.current = window.setTimeout(onNext, last?.reaction ? REACTION_MS : 240)
  }

  const choose = (optionId: string, at: number) => {
    if (multi) {
      const max = question.maxSelect ?? 2
      setPicked((was) => was.includes(optionId)
        ? was.filter((id) => id !== optionId)
        : [...was, optionId].slice(-max))
      return
    }
    if (reaction) return
    setPicked([optionId])
    settle([optionId], at)
  }

  const grid = question.type === 'image'

  return (
    <div className={styles.card}>
      <h2 id="question" ref={headingRef} tabIndex={-1} className={`mk-h2 ${styles.prompt}`}>{question.prompt}</h2>
      {multi && <p className={styles.hint}>Pick up to {question.maxSelect ?? 2}.</p>}

      <div className={styles.reaction} aria-live="polite">
        {reaction && (
          <p className={`mk-capdev ${styles.reactionLine}`}>
            <span className="mk-capdev-tick" aria-hidden="true" />
            <span>{reaction}</span>
          </p>
        )}
      </div>

      <ul className={`${styles.options} ${grid ? styles.optionsGrid : ''}`}>
        {question.options.map((option) => {
          const on = picked.includes(option.id)
          return (
            <li key={option.id}>
              <button
                type="button"
                className={`${styles.option} ${on ? styles.optionOn : ''}`}
                aria-pressed={on}
                onClick={(e) => choose(option.id, e.timeStamp)}
              >
                {option.text}
              </button>
            </li>
          )
        })}
      </ul>

      {multi && (
        <button type="button" className="mk-btn mk-btn--primary" onClick={(e) => settle(picked, e.timeStamp)} disabled={!picked.length || Boolean(reaction)} style={{ marginTop: 24 }}>
          Next <span className="mk-btn-arrow" aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}

/* -------------------------------------------------------- rapid-fire -- */

type RapidProps = {
  onAnswer: (question: Question, optionId: string) => void
  onDone: (skipped: boolean) => void
}

/* Five quick either-ors, for badges. Swipe, tap or use the arrow keys. */
export function RapidFire({ onAnswer, onDone }: RapidProps) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const start = useRef<number | null>(null)
  /* a swipe ends with a pointerup over a button; its click must not count twice */
  const swiped = useRef(false)
  const question = RAPID_FLOW[index]
  const [left, right] = question.options

  const pick = (optionId: string) => {
    onAnswer(question, optionId)
    setDrag(0)
    if (index === RAPID_FLOW.length - 1) onDone(false)
    else setIndex(index + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') pick(left.id)
      if (e.key === 'ArrowRight') pick(right.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const down = (e: PointerEvent<HTMLDivElement>) => { start.current = e.clientX }
  const move = (e: PointerEvent<HTMLDivElement>) => { if (start.current !== null) setDrag(e.clientX - start.current) }
  const up = () => {
    if (start.current === null) return
    start.current = null
    if (Math.abs(drag) > 70) {
      swiped.current = true
      window.setTimeout(() => { swiped.current = false }, 400)
      pick(drag < 0 ? left.id : right.id)
    } else {
      setDrag(0)
    }
  }
  const tap = (optionId: string) => {
    if (swiped.current) { swiped.current = false; return }
    pick(optionId)
  }

  return (
    <section className={styles.quiz} aria-labelledby="rapid">
      <div className={styles.rapidHead}>
        <h2 id="rapid" className="mk-h3">Quick. Don&apos;t think.</h2>
        <button type="button" className="mk-btn mk-btn--text" onClick={() => onDone(true)}>Skip</button>
      </div>
      <div
        key={question.id}
        className={styles.swipe}
        style={{ transform: `translateX(${drag * 0.6}px) rotate(${drag * 0.02}deg)` }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      >
        <p className={`mk-h2 ${styles.swipePrompt}`}>{question.prompt}</p>
        <div className={styles.swipeChoices}>
          <button type="button" className={`${styles.swipeChoice} ${drag < -40 ? styles.swipeLean : ''}`} onClick={() => tap(left.id)}>
            <UiIcon name="back" size={18} /> {left.text}
          </button>
          <button type="button" className={`${styles.swipeChoice} ${drag > 40 ? styles.swipeLean : ''}`} onClick={() => tap(right.id)}>
            {right.text} <UiIcon name="back" size={18} className={styles.flip} />
          </button>
        </div>
      </div>
      <div className={styles.dots} aria-hidden="true">
        {RAPID_FLOW.map((q, i) => <span key={q.id} className={i <= index ? styles.dotOn : ''} />)}
      </div>
    </section>
  )
}

/* -------------------------------------------------------- tie-breaker -- */

export function Tiebreaker({ questionId, onAnswer }: { questionId: string; onAnswer: (question: Question, optionId: string) => void }) {
  const question = QUESTION_INDEX.get(questionId)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [])
  if (!question) return null
  return (
    <section className={styles.quiz} aria-labelledby="tiebreak">
      <p className={styles.kicker}>It&apos;s close. One more.</p>
      <h2 id="tiebreak" ref={headingRef} tabIndex={-1} className={`mk-h2 ${styles.prompt}`}>{question.prompt}</h2>
      <div className={styles.tiebreak}>
        {question.options.map((option) => (
          <button key={option.id} type="button" className={styles.tiebreakChoice} onClick={() => onAnswer(question, option.id)}>
            {option.text}
          </button>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------ reading your Pujo -- */

const READING = ['Checking your roll-to-pandal ratio', 'Asking the dhaakis', 'Counting your plastic chairs']

/* A drumroll, not a pretend computation: the scoring took milliseconds. The
   alpona line draws itself once, across the pause. */
export function Reading() {
  const [line, setLine] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setLine((n) => Math.min(n + 1, READING.length - 1)), 650)
    return () => window.clearInterval(id)
  }, [])
  return (
    <section className={styles.reading} aria-live="polite" aria-busy="true">
      <svg viewBox="0 0 120 34" className={styles.readingArt} aria-hidden="true">
        <path className={styles.readingPath} pathLength="100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
          d="M4 17 C18 4 30 4 40 17 C50 30 62 30 72 17 C82 4 94 4 104 17 C108 22 112 22 116 17" />
      </svg>
      <p className={styles.readingLine}>{READING[line]}…</p>
    </section>
  )
}
