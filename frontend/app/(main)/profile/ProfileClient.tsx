'use client'

import { useState } from 'react'
import { UserProfile, useUser } from '@clerk/nextjs'
import { virtualRouting } from '@/lib/clerkAppearance'
import { Sprig } from '@/components/brand/kolka'
import { Motif } from '@/components/brand/motifs'
import { AlponaLoader } from '@/components/brand/Alpona'
import styles from '@/styles/Profile.module.css'

export default function Profile() {
  const { user, isLoaded } = useUser()
  const [now] = useState(() => Date.now())

  if (!isLoaded) {
    return <main className="mk-page mk-page-top mk-wrap"><AlponaLoader label="Opening your profile" /></main>
  }

  const emailCount = user?.emailAddresses?.length ?? 0
  const phoneCount = user?.phoneNumbers?.length ?? 0
  const daysWithUs = user?.createdAt
    ? Math.floor((now - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <header className={styles.header}>
          <div className={styles.avatar}>
            {user?.hasImage
              /* eslint-disable-next-line @next/next/no-img-element */
              ? <img src={user.imageUrl} alt={user.fullName ? `${user.fullName}'s profile photo` : 'Your profile photo'} />
              /* the rosette stands in for a face that hasn't been added yet */
              : <Motif name="rosette" height={72} />}
          </div>
          <div className={styles.identity}>
            <div className="mk-band-head">
              <Sprig size={40} />
              <h1 className="mk-h1">{user?.fullName || 'Your profile'}</h1>
            </div>
            <p className="mk-body-lg" style={{ color: 'var(--mk-ash)', marginTop: 8 }}>
              {user?.primaryEmailAddress?.emailAddress || user?.primaryPhoneNumber?.phoneNumber || 'Kolkata explorer'}
            </p>
            <div className={styles.tags}>
              {emailCount > 0 && <span className="mk-tag">Email verified</span>}
              {phoneCount > 0 && <span className="mk-tag">Phone verified</span>}
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
            <dd className={styles.statValue}>{emailCount + phoneCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt className="mk-meta">Account</dt>
            <dd className={styles.statValue}>Active</dd>
          </div>
        </dl>

        <section className={styles.manage} aria-labelledby="manage-title">
          <h2 id="manage-title" className="mk-h2">Your account</h2>
          <p className="mk-body" style={{ color: 'var(--mk-ash)', marginTop: 12 }}>
            Your name, photo, sign-in methods and security.
          </p>
          <div className={styles.clerk}>
            <UserProfile {...virtualRouting} />
          </div>
        </section>
      </div>
    </main>
  )
}
