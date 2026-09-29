'use client'

import Link from 'next/link'
import { useState } from 'react'
import { NIGHT_DAYS, zoneLabel } from '@/lib/ashtami-date/config'
import type { OwnProfile } from '@/lib/ashtami-date/profile'
import styles from '@/styles/AshtamiDate.module.css'
import { api } from './api'
import { Sheet } from './shared'

type Props = {
  profile: OwnProfile
  onEdit: (step: number) => void
  onDeleted: () => void
  onClose: () => void
}

const PARTS: [number, string][] = [
  [2, 'name, and who you see'],
  [3, 'photos'],
  [4, 'your night, area and vibe'],
  [5, 'your line and your handle'],
]

/* "you": your card, the edits, and the way out. */
export function ProfileSheet({ profile, onEdit, onDeleted, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    setBusy(true)
    const res = await api.deleteProfile()
    setBusy(false)
    if (!res.ok) return setError(res.message)
    onDeleted()
  }

  if (confirming) {
    return (
      <Sheet title="delete your dating profile?" onClose={() => setConfirming(false)}>
        <p className={styles.sheetText}>
          this deletes your card, your photos, every swipe, every match and every chat, straight away. it can&apos;t be undone.
          blocks and reports stay, so nobody you blocked can find you again.
        </p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.sheetActions}>
          <button type="button" className="mk-btn mk-btn--primary" disabled={busy} onClick={remove}>{busy ? 'deleting' : 'delete everything'}</button>
          <button type="button" className="mk-btn mk-btn--secondary" onClick={() => setConfirming(false)}>keep it</button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="your card" onClose={onClose}>
      <p className={styles.sheetText}>
        {profile.firstName}, {profile.age}. {profile.zone ? zoneLabel(profile.zone) : ''}{profile.night ? `, ` : ''}
        {profile.night && <><span lang="bn">{NIGHT_DAYS[profile.night].bn}</span> {profile.night}</>}.
      </p>
      {profile.hidden && <p className={styles.sheetText}>your card is paused while a person looks at a report.</p>}
      <ul className={styles.editList}>
        {PARTS.map(([step, label]) => (
          <li key={step}><button type="button" onClick={() => onEdit(step)}>{label}</button></li>
        ))}
      </ul>
      <div className={styles.sheetActions}>
        <button type="button" className="mk-btn mk-btn--secondary" onClick={onClose}>back to the deck</button>
        <button type="button" className={`mk-btn mk-btn--text ${styles.quiet}`} onClick={() => setConfirming(true)}>delete my dating profile</button>
      </div>
      <p className={styles.sheetSmall}><Link href="/privacy#ashtami-date" className={styles.inlineLink}>what we keep, and for how long</Link></p>
    </Sheet>
  )
}
