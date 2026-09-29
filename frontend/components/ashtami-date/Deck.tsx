'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlponaLoader } from '@/components/brand/Alpona'
import { useCountdown } from '@/components/brand/Countdown'
import { ASHTAMI_ISO, LIMITS } from '@/lib/ashtami-date/config'
import type { MatchView, OwnProfile, PublicCard } from '@/lib/ashtami-date/profile'
import styles from '@/styles/AshtamiDate.module.css'
import { api, type Deck as DeckData, type Result } from './api'
import { DeckCard, type CardHandle } from './DeckCard'
import { CrossGlyph, ShiuliGlyph, SprigGlyph } from './marks'
import { MatchMoment } from './MatchMoment'
import { SafetyActions } from './Safety'

type Status = 'loading' | 'ready' | 'error' | 'closed' | 'paused'

/* how often the matches pill asks, while the page is on screen */
const MATCHES_EVERY_MS = 15_000

type Props = { me: OwnProfile; onOpenProfile: () => void }

export function Deck({ me, onOpenProfile }: Props) {
  const [queue, setQueue] = useState<PublicCard[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [problem, setProblem] = useState<string | null>(null)
  const [said, setSaid] = useState('')
  const [shiuliLeft, setShiuliLeft] = useState(0)
  const [match, setMatch] = useState<MatchView | null>(null)
  const [matches, setMatches] = useState<number | null>(null)
  const [exhausted, setExhausted] = useState(false)
  /* likes sent and not yet answered: one of them may be a match */
  const [waiting, setWaiting] = useState(0)
  const [unread, setUnread] = useState(false)
  const [bump, setBump] = useState(0)
  const swiped = useRef(new Set<string>())
  /* cards let go and still flying, each with what to call once it has left */
  const flying = useRef(new Map<string, () => void>())
  /* the matches already known here, so only a new one gets its moment */
  const known = useRef<Set<string> | null>(null)
  /* changes each time a match is made here, so an answer asked for before it can't undo it */
  const version = useRef(0)
  const queued = useRef<PublicCard[]>([])
  const fetching = useRef(false)
  const shiuliNext = useRef(false)
  const topCard = useRef<CardHandle>(null)
  const left = useCountdown(ASHTAMI_ISO)

  /* the server's answer, applied; only ever called from a fetch's callback */
  const apply = useCallback((res: Result<DeckData>, fresh: boolean) => {
    if (!res.ok) {
      if (fresh) setStatus('error')
      setProblem(res.message)
      return
    }
    setShiuliLeft(res.data.shiuliLeft)
    if (res.data.closed) return setStatus('closed')
    if (res.data.paused) return setStatus('paused')
    /* cards swiped here may not have reached the server yet: never show one twice */
    const unseen = res.data.cards.filter((c) => !swiped.current.has(c.id))
    const have = new Set(queued.current.map((c) => c.id))
    const incoming = unseen.filter((c) => !have.has(c.id))
    /* a short batch means the server has nobody else right now */
    setExhausted(res.data.cards.length < LIMITS.deckSize || (!fresh && incoming.length === 0))
    setQueue((current) => (fresh ? unseen : [...current, ...incoming.filter((c) => !current.some((x) => x.id === c.id))]))
    setProblem(null)
    setStatus('ready')
  }, [])

  const load = useCallback((fresh: boolean) => {
    if (fetching.current) return
    fetching.current = true
    void api.deck().then((res) => {
      fetching.current = false
      apply(res, fresh)
    })
  }, [apply])

  useEffect(() => { queued.current = queue }, [queue])

  useEffect(() => {
    /* the deck's first fetch; later ones follow the queue running low */
    load(true)
  }, [load])

  /* The matches pill keeps up on its own: someone you said "for me" to earlier can say it back
     while you're here, and that match gets its moment too, not just a number on the next visit. */
  const refreshMatches = useCallback(() => {
    const asked = version.current
    void api.matches().then((res) => {
      if (!res.ok || asked !== version.current) return
      const list = res.data.matches
      const seen = known.current
      const fresh = seen ? list.filter((m) => !seen.has(m.id)) : []
      known.current = new Set(list.map((m) => m.id))
      setMatches(list.length)
      setUnread(list.some((m) => m.unread))
      /* the pill bumps when the moment is closed, so it's seen */
      if (fresh[0]) setMatch((current) => current ?? fresh[0])
    })
  }, [])

  useEffect(() => {
    refreshMatches()
    const ask = () => { if (document.visibilityState === 'visible') refreshMatches() }
    const timer = window.setInterval(ask, MATCHES_EVERY_MS)
    document.addEventListener('visibilitychange', ask)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', ask)
    }
  }, [refreshMatches])

  /* a few cards before the end, fetch the next few */
  useEffect(() => {
    if (status === 'ready' && queue.length <= 3 && !exhausted) load(false)
  }, [queue.length, status, exhausted, load])

  const top = queue[0]

  const decide = useCallback((liked: boolean, shiuli = false) => {
    if (!top || match) return
    shiuliNext.current = liked && shiuli
    topCard.current?.throwOut(liked ? 1 : -1)
  }, [top, match])

  /* ← not for me, → for me, whenever nothing else is being typed in or looked at */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); decide(false) }
      if (e.key === 'ArrowRight') { e.preventDefault(); decide(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [decide])

  /* The card has been let go: the swipe goes now, while it's still flying, so a match can
     land the moment the card has gone rather than a round trip after. */
  function send(card: PublicCard, direction: 1 | -1) {
    const liked = direction === 1
    const shiuli = liked && shiuliNext.current
    shiuliNext.current = false
    swiped.current.add(card.id)
    setSaid(liked ? (shiuli ? `shiuli sent to ${card.firstName}.` : `for me: ${card.firstName}.`) : `not for me: ${card.firstName}.`)
    const gone = new Promise<void>((resolve) => flying.current.set(card.id, resolve))
    void settle(card, liked, shiuli, gone)
  }

  /* off the screen: out of the queue */
  function drop(card: PublicCard) {
    setQueue((q) => q.filter((c) => c.id !== card.id))
    flying.current.get(card.id)?.()
    flying.current.delete(card.id)
  }

  async function settle(card: PublicCard, liked: boolean, shiuli: boolean, gone: Promise<void>) {
    if (liked) setWaiting((n) => n + 1)
    const res = await api.swipe(card.id, liked, shiuli)
    if (res.ok) {
      setShiuliLeft(res.data.shiuliLeft)
      if (res.data.match && res.data.created) {
        await gone
        celebrate(res.data.match)
      }
    } else {
      if (typeof res.data.shiuliLeft === 'number') setShiuliLeft(res.data.shiuliLeft)
      /* gone means gone; anything else puts the card back on top, once it has finished leaving */
      if (res.status !== 404) {
        await gone
        swiped.current.delete(card.id)
        setQueue((q) => [card, ...q.filter((c) => c.id !== card.id)])
        setSaid(res.message)
      }
    }
    if (liked) setWaiting((n) => n - 1)
  }

  function celebrate(made: MatchView) {
    version.current += 1
    /* a poll can get there first; then it's already counted */
    const counted = known.current?.has(made.id) ?? false
    known.current?.add(made.id)
    setMatch(made)
    if (!counted) setMatches((n) => (n ?? 0) + 1)
    /* felt as well as seen, on a phone that can buzz */
    navigator.vibrate?.([24, 60, 40])
  }

  function afterSafety(card: PublicCard, message: string) {
    swiped.current.add(card.id)
    setQueue((q) => q.filter((c) => c.id !== card.id))
    setSaid(message)
  }

  const days = left ? left.d : null

  return (
    <section className={styles.deckStage} aria-labelledby="deck-title">
      <header className={styles.deckHead}>
        <div className={styles.deckTitleWrap}>
          <h1 id="deck-title" className={styles.deckTitle}>ashtami date</h1>
          <p className={styles.deckCount} aria-live="off">
            {left?.done ? <>it&apos;s <span lang="bn">অষ্টমী</span></> : days === null ? '\u00a0' : <>{days} days to <span lang="bn">অষ্টমী</span></>}
          </p>
        </div>
        <nav className={styles.deckNav} aria-label="ashtami date">
          <Link
            href="/experience/swipe/matches"
            className={styles.navPill}
            aria-label={`matches${matches ? `, ${matches}` : ''}${unread ? ', new messages' : ''}`}
          >
            matches
            {matches ? <span key={bump} className={`${styles.count} ${bump ? styles.countBump : ''}`}>{matches}</span> : null}
            {unread && <span className={styles.unreadDot} aria-hidden="true" />}
          </Link>
          <button type="button" className={styles.navPill} onClick={onOpenProfile}>you</button>
        </nav>
      </header>

      <div className={styles.deckArea}>
        {status === 'loading' && <AlponaLoader label="finding people for ashtami" />}

        {status === 'error' && (
          <div className={styles.empty} role="alert">
            <p className={styles.emptyTitle}>the deck didn&apos;t load.</p>
            <p className={styles.emptyText}>{problem}</p>
            <button type="button" className="mk-btn mk-btn--secondary" onClick={() => { setStatus('loading'); load(true) }}>try again</button>
          </div>
        )}

        {status === 'closed' && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>that&apos;s pujo, done.</p>
            <p className={styles.emptyText}>the deck closed after dashami. your matches stay for a week, then everything here is deleted.</p>
            <Link href="/experience/swipe/matches" className="mk-btn mk-btn--secondary">your matches</Link>
          </div>
        )}

        {status === 'paused' && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>your card is paused.</p>
            <p className={styles.emptyText}>a few people reported it, so a person is taking a look. if you think it&apos;s a mistake, write to us from the privacy page.</p>
          </div>
        )}

        {/* the last card's "for me" is still being answered: it may be a match, so no "that's everyone" yet */}
        {status === 'ready' && !top && waiting > 0 && <AlponaLoader label="one sec" />}

        {status === 'ready' && !top && waiting === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>that&apos;s everyone, for now.</p>
            <p className={styles.emptyText}>more people join every day till ashtami. go get a cha and look again.</p>
            <div className={styles.emptyActions}>
              <button type="button" className="mk-btn mk-btn--secondary" onClick={() => { setExhausted(false); load(false) }}>look again</button>
              {matches ? <Link href="/experience/swipe/matches" className="mk-btn mk-btn--text">your matches</Link> : null}
            </div>
          </div>
        )}

        {status === 'ready' && queue.slice(0, 2).reverse().map((card) => (
          <DeckCard
            key={card.id}
            card={card}
            top={card.id === top?.id}
            ref={card.id === top?.id ? topCard : undefined}
            onLeave={(direction) => send(card, direction)}
            onCommit={() => drop(card)}
          />
        ))}
      </div>

      {status === 'ready' && top && (
        <>
          <div className={styles.controls}>
            <button type="button" className={styles.pass} onClick={() => decide(false)} aria-label={`not for me: ${top.firstName}`}>
              <CrossGlyph /> <span>not for me</span>
            </button>
            <button
              type="button"
              className={styles.shiuli}
              onClick={() => decide(true, true)}
              disabled={shiuliLeft < 1}
              aria-label={shiuliLeft ? `send ${top.firstName} your shiuli, ${shiuliLeft} left today` : 'no shiuli left today'}
            >
              <ShiuliGlyph /> <span>{shiuliLeft ? 'shiuli' : 'shiuli spent'}</span>
            </button>
            <button type="button" className={styles.like} onClick={() => decide(true)} aria-label={`for me: ${top.firstName}`}>
              <SprigGlyph /> <span>for me</span>
            </button>
          </div>
          <div className={styles.deckFoot}>
            <p className={styles.keysHint}><span className={styles.keysOnly}>drag, tap, or use ← and →. </span>one shiuli a day, and they&apos;ll know.</p>
            <SafetyActions
              key={top.id}
              profileId={top.id}
              name={top.firstName}
              className={styles.deckSafety}
              onDone={(_, message) => afterSafety(top, message)}
            />
          </div>
        </>
      )}

      <p className="sr-only" aria-live="polite">{said}</p>
      {match && (
        <MatchMoment
          key={match.id}
          match={match}
          myPhoto={me.photos[0]?.url ?? null}
          onClose={() => { setMatch(null); setBump((b) => b + 1) }}
        />
      )}
    </section>
  )
}
