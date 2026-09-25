import { CALIBRATION, QUESTION_INDEX } from './config'
import { RAPID_BADGES, STATUSES, type Badge, type Status } from './content'
import { balancedEvidence, evaluate } from './scoring'
import { readRaw, readStored, removeStored, writeStored } from './storage'
import type { ShareCard } from './token'
import type { Answer, ArchetypeId, DimensionId, PujoResult } from './types'

/*
 * One person's Pujo, as the phone keeps it. The answers are the record; the
 * result is recomputed from them, so a model update re-scores a saved Pujo
 * instead of leaving a stale one behind.
 */

export type AnswerMap = Record<string, string[]>
export type Prefs = Record<string, string>
export type FeedbackValue = 'yes' | 'mostly' | 'no'
export type Feedback = { value: FeedbackValue; pick?: ArchetypeId }

export type Saved = {
  v: 1
  answers: AnswerMap
  prefs: Prefs
  feedback?: Feedback
  revealedAt: number
}

export type Stage = 'quiz' | 'rapid' | 'tiebreak'

export type Progress = {
  v: 1
  stage: Stage
  index: number
  answers: AnswerMap
  tiebreak?: string | null
  startedAt: number
}

export const toAnswers = (map: AnswerMap): Answer[] =>
  Object.entries(map).map(([questionId, optionIds]) => ({ questionId, optionIds }))

export function scoreAnswers(map: AnswerMap): PujoResult {
  return evaluate(toAnswers(map))
}

export function badgesFrom(map: AnswerMap): Badge[] {
  return Object.entries(RAPID_BADGES).flatMap(([questionId, options]) => {
    const badge = options[map[questionId]?.[0] ?? '']
    return badge ? [badge] : []
  })
}

export function statusFrom(prefs: Prefs): Status | null {
  const value = prefs.pref_status as Status | undefined
  return value && (STATUSES as readonly string[]).includes(value) ? value : null
}

export const isMinor = (prefs: Prefs) => prefs.pref_age === 'under_18'

export function shareCardFrom(result: PujoResult, saved: Pick<Saved, 'answers' | 'prefs'>): ShareCard {
  return {
    primary: result.primary,
    secondary: result.secondary,
    band: result.band,
    vector: result.vector,
    badges: badgesFrom(saved.answers),
    status: statusFrom(saved.prefs),
  }
}

/* ------------------------------------------------------------ storage -- */

export function loadSaved(): Saved | null {
  return parseSaved(savedSnapshot())
}

/* For useSyncExternalStore: the stored result as its raw string, which stays
   the same value until the result changes, and a subscription to other tabs. */
export const savedSnapshot = () => readRaw('local', 'result') ?? readRaw('session', 'result')
export const noSnapshot = () => null
export function subscribeSaved(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

export function parseSaved(raw: string | null): Saved | null {
  try {
    const saved = raw ? (JSON.parse(raw) as Saved) : null
    return saved?.v === 1 && saved.answers ? { ...saved, prefs: saved.prefs ?? {} } : null
  } catch {
    return null
  }
}

/* Under 18, the result lasts as long as the tab and never reaches localStorage. */
export function persistSaved(saved: Saved) {
  if (isMinor(saved.prefs)) {
    removeStored('local', 'result')
    writeStored('session', 'result', saved)
  } else {
    writeStored('local', 'result', saved)
    removeStored('session', 'result')
  }
}

export const loadProgress = () => {
  const progress = readStored<Progress>('session', 'progress')
  return progress?.v === 1 ? progress : null
}
export const saveProgress = (progress: Progress) => writeStored('session', 'progress', progress)
export const clearProgress = () => removeStored('session', 'progress')

/* a friend's card from a compare link, kept for this visit */
export const loadFriend = () => readStored<string>('session', 'friend')
export const saveFriend = (token: string) => writeStored('session', 'friend', token)

/* -------------------------------------------------- why you got this -- */

/* The answer that pushed hardest along a dimension, in the direction the
   person landed: "You said: ...". Core questions only; the rapid round is
   for badges. */
export function quoteFor(dim: DimensionId, value: number, map: AnswerMap): string | null {
  const direction = value >= (CALIBRATION.neutral[dim]?.mean ?? 0.5) ? 1 : -1
  let best: string | null = null
  let strongest = 0.02
  for (const [questionId, optionIds] of Object.entries(map)) {
    const question = QUESTION_INDEX.get(questionId)
    if (!question || question.block !== 'core') continue
    const table = balancedEvidence(question)
    for (const optionId of optionIds) {
      const evidence = table[optionId]?.[dim]
      if (!evidence) continue
      const push = (evidence[0] - 0.5) * evidence[1] * direction
      if (push > strongest) {
        strongest = push
        best = question.options.find((o) => o.id === optionId)?.text ?? null
      }
    }
  }
  return best
}
