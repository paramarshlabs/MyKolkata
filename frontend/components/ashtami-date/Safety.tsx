'use client'

import { useId, useState } from 'react'
import { LIMITS, REPORT_REASONS } from '@/lib/ashtami-date/config'
import styles from '@/styles/AshtamiDate.module.css'
import { api } from './api'
import { Sheet } from './shared'

export type SafetyDone = 'reported' | 'blocked' | 'unmatched'
type Mode = 'report' | 'block' | 'unmatch' | null

type Props = {
  profileId: string
  name: string
  /* in a chat: unmatch is offered, and a report carries the chat as evidence */
  matchId?: string
  onDone: (done: SafetyDone, message: string) => void
  className?: string
}

/* Report, block and unmatch: always in reach, never more than two taps. */
export function SafetyActions({ profileId, name, matchId, onDone, className = '' }: Props) {
  const [mode, setMode] = useState<Mode>(null)
  return (
    <>
      <div className={`${styles.safety} ${className}`} role="group" aria-label={`safety, for ${name}`}>
        <button type="button" onClick={() => setMode('report')}>report</button>
        <button type="button" onClick={() => setMode('block')}>block</button>
        {matchId && <button type="button" onClick={() => setMode('unmatch')}>unmatch</button>}
      </div>
      {mode === 'report' && <ReportSheet profileId={profileId} name={name} matchId={matchId} onClose={() => setMode(null)} onDone={onDone} />}
      {mode === 'block' && <BlockSheet profileId={profileId} name={name} onClose={() => setMode(null)} onDone={onDone} />}
      {mode === 'unmatch' && matchId && <UnmatchSheet matchId={matchId} name={name} onClose={() => setMode(null)} onDone={onDone} />}
    </>
  )
}

type SheetProps = { profileId: string; name: string; matchId?: string; onClose: () => void; onDone: Props['onDone'] }

function ReportSheet({ profileId, name, matchId, onClose, onDone }: SheetProps) {
  const noteId = useId()
  const [reason, setReason] = useState<string>('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!reason) return setError('pick what went wrong.')
    setBusy(true)
    const res = await api.report(profileId, reason, note, matchId)
    setBusy(false)
    if (!res.ok) return setError(res.message)
    onDone('reported', res.data.message)
  }

  return (
    <Sheet title={`report ${name}`} onClose={onClose}>
      <p className={styles.sheetText}>a person reads every report. we hide {name} from you straight away{matchId ? ', and keep a copy of what they sent you here' : ''}.</p>
      <fieldset className={styles.options}>
        <legend className="sr-only">what went wrong</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r.id} className={styles.option}>
            <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
      <label className={styles.fieldLabel} htmlFor={noteId}>anything else, if you want</label>
      <textarea id={noteId} className={`mk-field ${styles.note}`} rows={3} maxLength={LIMITS.noteMax} value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <p className={styles.sheetText}>in danger right now? call <a href="tel:112" className={styles.inlineLink}>112</a>.</p>
      <div className={styles.sheetActions}>
        <button type="button" className="mk-btn mk-btn--primary" disabled={busy} onClick={submit}>report and block</button>
        <button type="button" className="mk-btn mk-btn--secondary" onClick={onClose}>cancel</button>
      </div>
    </Sheet>
  )
}

function BlockSheet({ profileId, name, onClose, onDone }: SheetProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit() {
    setBusy(true)
    const res = await api.block(profileId)
    setBusy(false)
    if (!res.ok) return setError(res.message)
    onDone('blocked', `${name} is blocked. neither of you will see the other again.`)
  }
  return (
    <Sheet title={`block ${name}?`} onClose={onClose}>
      <p className={styles.sheetText}>you won&apos;t see each other anywhere in ashtami date, and any chat between you ends. {name} isn&apos;t told.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.sheetActions}>
        <button type="button" className="mk-btn mk-btn--primary" disabled={busy} onClick={submit}>block</button>
        <button type="button" className="mk-btn mk-btn--secondary" onClick={onClose}>cancel</button>
      </div>
    </Sheet>
  )
}

function UnmatchSheet({ matchId, name, onClose, onDone }: { matchId: string; name: string; onClose: () => void; onDone: Props['onDone'] }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function submit() {
    setBusy(true)
    const res = await api.unmatch(matchId)
    setBusy(false)
    if (!res.ok) return setError(res.message)
    onDone('unmatched', `unmatched. the chat with ${name} is gone.`)
  }
  return (
    <Sheet title={`unmatch ${name}?`} onClose={onClose}>
      <p className={styles.sheetText}>the chat goes, and you won&apos;t come round in each other&apos;s deck again.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.sheetActions}>
        <button type="button" className="mk-btn mk-btn--primary" disabled={busy} onClick={submit}>unmatch</button>
        <button type="button" className="mk-btn mk-btn--secondary" onClick={onClose}>cancel</button>
      </div>
    </Sheet>
  )
}
