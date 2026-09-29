'use client'

import { useEffect, useState } from 'react'
import { AlponaLoader } from '@/components/brand/Alpona'
import { api } from '@/components/ashtami-date/api'
import { Deck } from '@/components/ashtami-date/Deck'
import { Landing, UnderAge } from '@/components/ashtami-date/Landing'
import { Onboarding } from '@/components/ashtami-date/Onboarding'
import { ProfileSheet } from '@/components/ashtami-date/ProfileSheet'
import type { OwnProfile } from '@/lib/ashtami-date/profile'
import styles from '@/styles/AshtamiDate.module.css'

type View =
  | { kind: 'loading' }
  | { kind: 'problem'; message: string }
  | { kind: 'landing' }
  | { kind: 'onboarding'; only?: number }
  | { kind: 'underage' }
  | { kind: 'deck' }

/* undefined: the server couldn't load the profile, so the page asks for it itself */
type Props = { initialProfile: OwnProfile | null | undefined }

const viewFor = (profile: OwnProfile | null): View =>
  !profile ? { kind: 'landing' } : profile.complete ? { kind: 'deck' } : { kind: 'onboarding' }

/* Find your Ashtami date: the landing, the five steps, and the deck, on one page. */
export default function AshtamiDateClient({ initialProfile }: Props) {
  const [profile, setProfile] = useState<OwnProfile | null>(initialProfile ?? null)
  const [view, setView] = useState<View>(() => (initialProfile === undefined ? { kind: 'loading' } : viewFor(initialProfile)))
  const [sheet, setSheet] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (initialProfile !== undefined) return
    void api.me().then((res) => {
      if (!res.ok) return setView({ kind: 'problem', message: res.message })
      setProfile(res.data.profile)
      setView(viewFor(res.data.profile))
    })
  }, [initialProfile])

  /* each screen starts at the top, on a phone that was scrolled down the last one */
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view.kind])

  return (
    <main className={styles.page} data-view={view.kind}>
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      {view.kind === 'loading' && <div className={styles.center}><AlponaLoader label="opening ashtami date" /></div>}

      {view.kind === 'problem' && (
        <div className={styles.center}>
          <div className={styles.empty} role="alert">
            <p className={styles.emptyTitle}>ashtami date didn&apos;t open.</p>
            <p className={styles.emptyText}>{view.message}</p>
            <button type="button" className="mk-btn mk-btn--secondary" onClick={() => window.location.reload()}>try again</button>
          </div>
        </div>
      )}

      {view.kind === 'landing' && <Landing onStart={() => { setNotice(null); setView({ kind: 'onboarding' }) }} />}

      {view.kind === 'underage' && <UnderAge />}

      {view.kind === 'onboarding' && (
        <Onboarding
          key={view.only ?? 'all'}
          profile={profile}
          only={view.only}
          onProfile={setProfile}
          onUnderAge={() => setView({ kind: 'underage' })}
          onCancel={() => setView({ kind: 'deck' })}
          onFinish={() => setView({ kind: 'deck' })}
        />
      )}

      {view.kind === 'deck' && profile && <Deck me={profile} onOpenProfile={() => setSheet(true)} />}

      {sheet && profile && (
        <ProfileSheet
          profile={profile}
          onClose={() => setSheet(false)}
          onEdit={(step) => { setSheet(false); setView({ kind: 'onboarding', only: step }) }}
          onDeleted={() => {
            setSheet(false)
            setProfile(null)
            setNotice('your dating profile is gone, and everything with it.')
            setView({ kind: 'landing' })
          }}
        />
      )}
    </main>
  )
}
