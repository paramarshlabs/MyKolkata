'use client'

import Link from 'next/link'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { SectionHead } from '@/components/brand/SectionHead'
import { trackPujo } from '@/lib/pujo-personality/analytics'
import { pairCopy } from '@/lib/pujo-personality/content'
import { isMinor, noSnapshot, parseSaved, savedSnapshot, scoreAnswers, shareCardFrom, subscribeSaved } from '@/lib/pujo-personality/session'
import type { ShareCard } from '@/lib/pujo-personality/token'
import { Compare } from './Compare'
import styles from '@/styles/PujoPersonality.module.css'

/* On a friend's card: if this phone already has a Pujo, compare them on the
   spot; if not, the way to find one, carrying the friend along. */
export function FriendCompare({ token, them }: { token: string; them: ShareCard }) {
  /* null on the server and until this phone's storage has been read */
  const raw = useSyncExternalStore(subscribeSaved, savedSnapshot, noSnapshot)
  const you = useMemo(() => {
    const saved = parseSaved(raw)
    return saved && !isMinor(saved.prefs) ? shareCardFrom(scoreAnswers(saved.answers), saved) : null
  }, [raw])

  useEffect(() => { trackPujo('pujo_invite_opened', { kind: 'card' }) }, [])
  useEffect(() => {
    if (you) trackPujo('pujo_compare_viewed', { kind: pairCopy(you.primary, them.primary).kind })
  }, [you, them.primary])

  if (!you) {
    return (
      <section className="mk-band" aria-labelledby="yours-title">
        <div className="mk-wrap">
          <SectionHead id="yours-title" title="What's yours?" lede="Thirteen questions, about two minutes. Then see how your Pujos fit." />
          <div className="mk-banner-actions">
            <Link href={`/pujo/personality?with=${token}`} className="mk-btn mk-btn--primary">
              Discover my Pujo <span className="mk-btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mk-band" aria-labelledby="compare-title">
      <div className="mk-wrap">
        <SectionHead id="compare-title" title="You and them" />
        <div className={styles.compareWrap}>
          <Compare you={you} them={them} themLabel="Them" />
        </div>
        <div className="mk-banner-actions">
          <Link href="/pujo/personality" className="mk-btn mk-btn--secondary">See your Pujo</Link>
        </div>
      </div>
    </section>
  )
}
