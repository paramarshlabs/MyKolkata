'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AlponaLoader } from '@/components/brand/Alpona'
import { api } from '@/components/ashtami-date/api'
import { firstMoveLine } from '@/components/ashtami-date/shared'
import type { MatchView } from '@/lib/ashtami-date/profile'
import styles from '@/styles/AshtamiDate.module.css'

/* Your matches, newest conversation first, each with its plan and whose move it is. */
export default function MatchesClient() {
  const [matches, setMatches] = useState<MatchView[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const res = await api.matches()
      if (cancelled) return
      if (res.ok) {
        setMatches(res.data.matches)
        setProblem(null)
      } else {
        setProblem(res.message)
      }
      setNow(Date.now())
    }
    void load()
    /* a new match or message shows up without a refresh, and straight away when you come back to the tab */
    const ask = () => { if (document.visibilityState === 'visible') void load() }
    const timer = window.setInterval(ask, 10_000)
    document.addEventListener('visibilitychange', ask)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', ask)
    }
  }, [])

  return (
    <main className={styles.page}>
      <section className={styles.listStage} aria-labelledby="matches-title">
        <Link href="/experience/swipe" className={styles.backLink}><span aria-hidden="true">←</span> the deck</Link>
        <h1 id="matches-title" className={styles.listTitle}>your matches.</h1>
        <p className={styles.onboardSub}>a match with no first message fades after 24 hours. chats go 24 hours after they&apos;re sent.</p>

        {!matches && !problem && <AlponaLoader label="finding your matches" />}
        {problem && <p className={styles.error} role="alert">{problem}</p>}

        {matches && !matches.length && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>no matches yet.</p>
            <p className={styles.emptyText}>the deck is where it starts. say &ldquo;for me&rdquo; to a few people and see who says it back.</p>
            <Link href="/experience/swipe" className="mk-btn mk-btn--secondary">back to the deck</Link>
          </div>
        )}

        {matches && matches.length > 0 && (
          <ul className={styles.matchList}>
            {matches.map((m) => (
              <li key={m.id}>
                <Link href={`/experience/swipe/matches/${encodeURIComponent(m.id)}`} className={styles.matchRow}>
                  <span className={styles.matchFace} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a signed, private link, see DeckCard */}
                    {m.them.photo ? <img src={m.them.photo} alt="" /> : m.them.firstName.slice(0, 1)}
                  </span>
                  <span className={styles.matchText}>
                    <span className={styles.matchName}>
                      {m.them.firstName}{m.them.age ? `, ${m.them.age}` : ''}
                      {m.unread && <span className={styles.newTag}>new</span>}
                    </span>
                    <span className={styles.matchPlan}>{m.plan.pandal}, {m.plan.night}</span>
                    <span className={styles.matchStatus}>
                      {m.lastMessage ? `${m.lastMessage.mine ? 'you: ' : ''}${m.lastMessage.body}` : firstMoveLine(m, now)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
