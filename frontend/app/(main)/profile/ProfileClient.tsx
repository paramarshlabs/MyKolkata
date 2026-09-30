'use client'

import { useRef, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { resetPhoto, uploadPhoto } from '@/lib/profile/photoClient'
import { Sprig } from '@/components/brand/kolka'
import { Motif } from '@/components/brand/motifs'
import { AlponaLoader } from '@/components/brand/Alpona'
import styles from '@/styles/Profile.module.css'
import { ProfilePujo } from './ProfilePujo'

export default function Profile() {
  const { user, isLoaded, logout, refresh } = useAuth()
  const [now] = useState(() => Date.now())
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [photoNote, setPhotoNote] = useState<string | null>(null)

  async function changePhoto(action: () => Promise<void>, done: string) {
    setBusy(true)
    setPhotoNote(null)
    try {
      await action()
      await refresh()
      setPhotoNote(done)
    } catch (error) {
      setPhotoNote((error as Error).message)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!isLoaded) {
    return <main className="mk-page mk-page-top mk-wrap"><AlponaLoader label="Opening your profile" /></main>
  }

  const emailCount = user?.email ? 1 : 0
  const daysWithUs = user?.createdAt
    ? Math.floor((now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <header className={styles.header}>
          <div className={styles.photo}>
            <div className={styles.avatar}>
              {user?.imageUrl
                /* eslint-disable-next-line @next/next/no-img-element */
                ? <img src={user.imageUrl} alt={user.fullName ? `${user.fullName}'s profile photo` : 'Your profile photo'} referrerPolicy="no-referrer" />
                /* the rosette stands in for a face that hasn't been added yet */
                : <Motif name="rosette" height={72} />}
            </div>
            <input
              ref={fileRef} type="file" accept="image/*" hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void changePhoto(() => uploadPhoto(file), 'New photo in. It goes on your Pujo card too.')
              }}
            />
            <div className={styles.photoActions}>
              <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? 'Saving…' : 'Change photo'}
              </button>
              {user?.hasOwnPhoto && (
                <button type="button" className="mk-btn mk-btn--text" disabled={busy}
                  onClick={() => void changePhoto(resetPhoto, 'Back to your Google photo.')}>
                  Use Google photo
                </button>
              )}
            </div>
            {photoNote && <p className="mk-meta" role="status">{photoNote}</p>}
          </div>
          <div className={styles.identity}>
            <div className="mk-band-head">
              <Sprig size={40} />
              <h1 className="mk-h1">{user?.fullName || 'Your profile'}</h1>
            </div>
            <p className="mk-body-lg" style={{ color: 'var(--mk-ash)', marginTop: 8 }}>
              {user?.email || 'Kolkata explorer'}
            </p>
            <div className={styles.tags}>
              {user?.emailVerified && <span className="mk-tag">Email verified</span>}
              <span className="mk-tag">Kolkata explorer</span>
            </div>
          </div>
        </header>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt className="mk-meta">Days with us</dt>
            <dd className={styles.statValue}>{daysWithUs}</dd>
          </div>
          <div className={styles.stat}>
            <dt className="mk-meta">Ways to reach you</dt>
            <dd className={styles.statValue}>{emailCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt className="mk-meta">Account</dt>
            <dd className={styles.statValue}>Active</dd>
          </div>
        </dl>

        <ProfilePujo />

        <section className={styles.manage} aria-labelledby="manage-title">
          <h2 id="manage-title" className="mk-h2">Your account</h2>
          <p className="mk-body" style={{ color: 'var(--mk-ash)', marginTop: 12 }}>
            Your name comes from your Google account. So does your photo, until you put up one of your own above. Either way, it goes on the Pujo card you share.
          </p>
          <div className={styles.account}>
            <dl className={styles.accountRows}>
              <dt className="mk-meta">Signed in with</dt>
              <dd className="mk-body">Google</dd>
              {user?.email && (
                <>
                  <dt className="mk-meta">Email</dt>
                  <dd className="mk-body">{user.email}</dd>
                </>
              )}
            </dl>
            <button type="button" className="mk-btn mk-btn--secondary" onClick={() => void logout()}>Sign out</button>
          </div>
        </section>
      </div>
    </main>
  )
}
