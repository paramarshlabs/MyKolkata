'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { AlponaLoader } from '@/components/brand/Alpona'
import { api, type ChatMessage } from '@/components/ashtami-date/api'
import { SafetyActions } from '@/components/ashtami-date/Safety'
import { firstMoveLine } from '@/components/ashtami-date/shared'
import { LIMITS, NIGHT_DAYS } from '@/lib/ashtami-date/config'
import type { MatchView } from '@/lib/ashtami-date/profile'
import { socialUrl } from '@/lib/ashtami-date/text'
import { CHAT_EVENT, chatTopic } from '@/lib/realtime/chat'
import { createClient } from '@/lib/supabase/client'
import styles from '@/styles/AshtamiDate.module.css'

/* A new message arrives as a Realtime nudge (lib/realtime/chat.ts), and the
   chat then fetches it. While the nudges are flowing the chat only checks in
   once a minute, in case one was missed. Without them (Realtime down or
   blocked) it asks while on screen: every few seconds while messages are
   arriving, backing off to half a minute when the conversation goes quiet.
   Sending or coming back resets it. */
const POLL_MS = 4000
const POLL_MAX_MS = 30_000
const POLL_LIVE_MS = 60_000

const clock = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).toLowerCase()

type Pending = ChatMessage & { pending: true }

export default function ChatClient({ matchId }: { matchId: string }) {
  const draftId = useId()
  const [match, setMatch] = useState<MatchView | null>(null)
  const [messages, setMessages] = useState<(ChatMessage | Pending)[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'gone'>('loading')
  const [draft, setDraft] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const list = useRef<HTMLOListElement>(null)
  const sending = useRef(false)
  const delay = useRef(POLL_MS)
  const lastSeen = useRef<string | null>(null)
  const live = useRef(false)

  const load = useCallback(async () => {
    const res = await api.chat(matchId)
    setNow(Date.now())
    if (res.ok) {
      const newest = res.data.messages.at(-1)?.id ?? null
      delay.current = live.current
        ? POLL_LIVE_MS
        : newest !== lastSeen.current ? POLL_MS : Math.min(delay.current * 1.5, POLL_MAX_MS)
      lastSeen.current = newest
      setMatch(res.data.match)
      setMessages((current) => [...res.data.messages, ...current.filter((m) => 'pending' in m)])
      setState('ready')
      return
    }
    if (res.status === 404 || res.status === 410) setState('gone')
    else setProblem(res.message)
  }, [matchId])

  useEffect(() => {
    let timer = 0
    let active = true
    const tick = async () => {
      window.clearTimeout(timer)
      if (document.visibilityState === 'visible') await load().catch(() => {})
      /* a tick from coming back may overlap this one: keep a single timer */
      window.clearTimeout(timer)
      if (active) timer = window.setTimeout(tick, delay.current)
    }
    void tick()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      delay.current = POLL_MS
      void tick()
    }

    const supabase = createClient()
    const channel = supabase
      .channel(chatTopic(matchId))
      .on('broadcast', { event: CHAT_EVENT }, () => { void load().catch(() => {}) })
      .subscribe((status) => {
        live.current = status === 'SUBSCRIBED'
        if (!live.current) delay.current = POLL_MS
      })
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      live.current = false
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      void supabase.removeChannel(channel)
    }
  }, [load, matchId])

  /* new messages scroll into view */
  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const body = draft.trim()
    if (!body || sending.current || !match?.canWrite) return
    sending.current = true
    setProblem(null)
    const temp: Pending = { id: `pending-${Date.now()}`, mine: true, body, sentAt: new Date().toISOString(), expiresAt: '', pending: true }
    setMessages((m) => [...m, temp])
    setDraft('')
    const res = await api.write(matchId, body)
    sending.current = false
    setMessages((m) => m.filter((x) => x.id !== temp.id))
    if (!res.ok) {
      setDraft(body)
      setProblem(res.message)
      return
    }
    setMessages((m) => [...m.filter((x) => x.id !== res.data.message.id), res.data.message])
    if (res.data.match) setMatch(res.data.match)
    /* a reply is likeliest now */
    if (!live.current) delay.current = POLL_MS
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send()
    }
  }

  async function extend() {
    const res = await api.extend(matchId)
    if (res.ok && res.data.match) setMatch(res.data.match)
    else if (!res.ok) setProblem(res.message)
  }

  /* Share my date: the plan and a first name, to a friend, from this phone. Never through us. */
  async function tellAFriend() {
    if (!match) return
    const text = `going to ${match.plan.pandal} on ${match.plan.night}, ${match.plan.time}, with ${match.them.firstName}, a match from ashtami date on my kolkata. if you don't hear from me by 11, call me.`
    try {
      if (navigator.share) return void (await navigator.share({ text }))
      await navigator.clipboard.writeText(text)
      setNote('copied. paste it to a friend.')
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setNote('that didn’t go. screenshot the plan instead.')
    }
  }

  async function copyHandle(handle: string) {
    try {
      await navigator.clipboard.writeText(handle)
      setNote('handle copied.')
    } catch {
      setNote('select the handle and copy it by hand.')
    }
  }

  if (done) {
    return (
      <main className={styles.page}>
        <section className={styles.listStage}>
          <p className={styles.emptyTitle} role="status">{done}</p>
          <Link href="/experience/swipe/matches" className="mk-btn mk-btn--secondary">back to your matches</Link>
        </section>
      </main>
    )
  }

  if (state === 'gone') {
    return (
      <main className={styles.page}>
        <section className={styles.listStage}>
          <Link href="/experience/swipe/matches" className={styles.backLink}><span aria-hidden="true">←</span> your matches</Link>
          <h1 className={styles.listTitle}>this chat is gone.</h1>
          <p className={styles.onboardSub}>it faded before anyone wrote, or one of you ended it.</p>
          <Link href="/experience/swipe" className="mk-btn mk-btn--secondary">back to the deck</Link>
        </section>
      </main>
    )
  }

  if (!match) {
    return (
      <main className={styles.page}>
        <div className={styles.center}>{problem ? <p className={styles.error} role="alert">{problem}</p> : <AlponaLoader label="opening the chat" />}</div>
      </main>
    )
  }

  const theirs = match.handles.theirs
  const blockedLine = match.writeBlocked === 'their-move'
    ? `${match.them.firstName} makes the first move here. you'll see it when it comes.`
    : match.writeBlocked === 'expired' ? 'this match faded before anyone wrote.' : match.writeBlocked === 'closed' ? 'pujo’s over, and so is the chat.' : null

  return (
    <main className={styles.page}>
      <section className={styles.chatStage} aria-labelledby="chat-title">
        <header className={styles.chatHead}>
          <Link href="/experience/swipe/matches" className={styles.backLink}><span aria-hidden="true">←</span> matches</Link>
          <div className={styles.chatWho}>
            <span className={styles.matchFace} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element -- a signed, private link, see DeckCard */}
              {match.them.photo ? <img src={match.them.photo} alt="" /> : match.them.firstName.slice(0, 1)}
            </span>
            <div>
              <h1 id="chat-title" className={styles.chatName}>{match.them.firstName}{match.them.age ? `, ${match.them.age}` : ''}</h1>
              <p className={styles.chatMeta}>{match.them.area}{match.them.archetype ? `, ${match.them.archetype}` : ''}</p>
            </div>
          </div>
          <SafetyActions profileId={match.them.id} name={match.them.firstName} matchId={match.id} onDone={(_, message) => setDone(message)} />
        </header>

        <div className={styles.planCard}>
          <p className={styles.planLabel}>the plan</p>
          <p className={styles.planPandal}>{match.plan.pandal}</p>
          <p className={styles.planWhen}><span lang="bn" className={styles.planBn}>{NIGHT_DAYS[match.plan.night].bn}</span> {match.plan.night}, {match.plan.time}</p>
          <p className={styles.planNote}>{match.plan.note} {match.plan.areaLabel}.</p>
          <button type="button" className={`mk-btn mk-btn--text ${styles.quiet}`} onClick={tellAFriend}>tell a friend where you&apos;ll be</button>
        </div>

        {theirs ? (
          <div className={styles.handleCard}>
            <p className={styles.planLabel}>take it to {theirs.kind}</p>
            <p className={styles.handleName}>@{theirs.handle}</p>
            <div className={styles.handleActions}>
              <a className="mk-btn mk-btn--secondary mk-btn--sm" href={socialUrl(theirs.kind, theirs.handle)} target="_blank" rel="noopener noreferrer">open {theirs.kind}</a>
              <button type="button" className="mk-btn mk-btn--text mk-btn--sm" onClick={() => void copyHandle(theirs.handle)}>copy</button>
            </div>
          </div>
        ) : match.handles.locked ? (
          <p className={styles.chatHint}>handles unlock with the first message.</p>
        ) : null}

        <p className={styles.chatHint} role="status">{firstMoveLine(match, now)}</p>
        {match.canExtend && (
          <button type="button" className="mk-btn mk-btn--secondary mk-btn--sm" onClick={extend}>give it one more day</button>
        )}

        <ol ref={list} className={styles.messages} aria-label={`messages with ${match.them.firstName}`}>
          {messages.map((m) => (
            <li key={m.id} className={`${styles.bubble} ${m.mine ? styles.mine : styles.theirs} ${'pending' in m ? styles.pending : ''}`}>
              <span className="sr-only">{m.mine ? 'you' : match.them.firstName}: </span>
              <span className={styles.bubbleText}>{m.body}</span>
              <span className={styles.bubbleTime}>{'pending' in m ? 'sending' : clock(m.sentAt)}</span>
            </li>
          ))}
        </ol>

        {problem && <p className={styles.error} role="alert">{problem}</p>}
        {match.canWrite ? (
          <form className={styles.composer} onSubmit={send}>
            <label className="sr-only" htmlFor={draftId}>message {match.them.firstName}</label>
            <textarea
              id={draftId}
              className={styles.draft}
              rows={1}
              maxLength={LIMITS.messageMax}
              placeholder={match.status === 'waiting' ? 'say something specific. the plan is right there.' : 'text only. no links.'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
            />
            <button type="submit" className="mk-btn mk-btn--primary" disabled={!draft.trim()}>send</button>
          </form>
        ) : blockedLine ? <p className={styles.composerNote}>{blockedLine}</p> : null}
        <p className="sr-only" aria-live="polite">{note}</p>
        {note && <p className={styles.chatHint} aria-hidden="true">{note}</p>}
      </section>
    </main>
  )
}
