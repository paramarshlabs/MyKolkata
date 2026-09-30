'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useMemo, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { PujoMap, type MapPujo } from '@/components/pujo/PujoMap'
import { pujoPath } from '@/lib/pujo/links'
import { NOTE_MAX } from '@/lib/pujo/pins'
import { loginPath } from '@/lib/returnTo'
import styles from '@/styles/PujoPage.module.css'

/* ==========================================================================
   The interactive parts of a pujo's public page: a small map of it and its
   neighbours, and "Pin in the wrong place?".
   ========================================================================== */

export function PandalMap({ pujo, nearby }: { pujo: MapPujo; nearby: MapPujo[] }) {
  const router = useRouter()
  const pujos = useMemo(() => [pujo, ...nearby], [pujo, nearby])
  const frame = useMemo(() => ({
    key: pujo.slug,
    points: pujos.flatMap((p) => (p.lat !== null && p.lng !== null ? [{ lat: p.lat, lng: p.lng }] : [])),
    maxZoom: 16,
  }), [pujo.slug, pujos])
  return (
    <PujoMap
      pujos={pujos}
      selected={pujo.slug}
      onSelect={(slug) => { if (slug !== pujo.slug) router.push(pujoPath(slug)) }}
      frame={frame}
      label={`Map of ${pujo.name} and the pujos around it`}
      className={styles.map}
    />
  )
}

export function PinReport({ slug, name }: { slug: string; name: string }) {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'sent' | 'failed'; message?: string }>({ status: 'idle' })
  const id = useId()

  if (state.status === 'sent') return <p className={`mk-caption ${styles.pinSaid}`} role="status">{state.message}</p>

  if (!open) {
    return (
      <p className={styles.pinAsk}>
        <span className="mk-meta">Pin in the wrong place?</span>{' '}
        {isAuthenticated === false ? (
          <Link className={styles.pinLink} href={loginPath(pujoPath(slug))}>Sign in to tell us</Link>
        ) : (
          <button type="button" className={styles.pinLink} onClick={() => setOpen(true)} disabled={isAuthenticated === undefined}>Tell us where it is</button>
        )}
      </p>
    )
  }

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    setState({ status: 'sending' })
    try {
      const res = await fetch('/api/pujo/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, note }),
      })
      const body = await res.json().catch(() => ({}))
      setState({ status: res.ok ? 'sent' : 'failed', message: body.message ?? 'That didn’t send. Try again in a moment.' })
    } catch {
      setState({ status: 'failed', message: 'No signal. Try again when you have a bar or two.' })
    }
  }

  return (
    <form className={styles.pinForm} onSubmit={send}>
      <label className="mk-label" htmlFor={id}>Where is {name} really?</label>
      <div className={styles.pinRow}>
        <input
          id={id}
          className="mk-field"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={NOTE_MAX}
          placeholder="A street, a landmark, a lane: behind the park on Raja Rammohan Sarani"
          autoFocus
          required
          minLength={3}
        />
        <button type="submit" className="mk-btn mk-btn--secondary" disabled={state.status === 'sending'}>
          {state.status === 'sending' ? 'Sending' : 'Send'}
        </button>
      </div>
      {state.status === 'failed' && <p className="mk-caption" role="alert">{state.message}</p>}
    </form>
  )
}
