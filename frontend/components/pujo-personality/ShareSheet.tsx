'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { UiIcon } from '@/components/brand/icons'
import { trackPujo } from '@/lib/pujo-personality/analytics'
import type { CardFormat } from '@/lib/pujo-personality/card'
import { PREFERENCE_FLOW } from '@/lib/pujo-personality/config'
import { aName } from '@/lib/pujo-personality/content'
import { sanitizeName } from '@/lib/pujo-personality/names'
import { encodeCard, type ShareCard } from '@/lib/pujo-personality/token'
import type { DimensionId } from '@/lib/pujo-personality/types'
import styles from '@/styles/PujoPersonality.module.css'

export type ShareMode = 'card' | 'compare' | 'guess'

type ShareSheetProps = {
  mode: ShareMode
  card: ShareCard
  because: DimensionId[]
  age: string | null
  onAge: (band: string) => void
  onClose: () => void
}

const AGE = PREFERENCE_FLOW.find((q) => q.id === 'pref_age')!

type CardModule = typeof import('@/lib/pujo-personality/card')

/* Everything leaves from here, and only after the age question: under 18, the
   card can be saved to the phone and nothing else (09-ux-flow.md §S32). */
export function ShareSheet({ mode, card, because, age, onAge, onClose }: ShareSheetProps) {
  const titleId = useId()
  const nameId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lib = useRef<CardModule | null>(null)
  const [format, setFormat] = useState<CardFormat>('story')
  const [name, setName] = useState('')
  const [note, setNote] = useState<string | null>(null)
  /* only ever mounted in the browser, after a tap */
  const [origin] = useState(() => window.location.origin)
  const minor = age === 'under_18'
  const token = encodeCard(card)
  const cleanName = name.trim() ? sanitizeName(name) : null
  const nameRejected = name.trim() !== '' && !cleanName

  const link = mode === 'guess' ? `${origin}/pujo/guess/${token}` : `${origin}/pujo/you/${token}`
  const defaultText = mode === 'guess'
    ? 'Guess my Pujo. Nine ways to do it. Which one is mine?'
    : mode === 'compare'
      ? `I'm ${aName(card.primary)}. Which Pujo are you? Take it and see how our Pujos fit.`
      : `Turns out I'm ${aName(card.primary)}. Which Pujo are you?`
  const [text, setText] = useState(defaultText)
  const message = `${text} ${link}`

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    trackPujo(mode === 'card' ? 'pujo_share_opened' : 'pujo_invite_created', { kind: mode })
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* the card is drawn on this phone, and redrawn as the name or format changes */
  const drawKey = `${token}|${because.join()}|${format}|${cleanName ?? ''}|${age ?? ''}`
  useEffect(() => {
    if (mode !== 'card' || !age) return
    let cancelled = false
    ;(async () => {
      lib.current ??= await import('@/lib/pujo-personality/card')
      await lib.current.loadCardFonts(cleanName)
      if (cancelled || !canvasRef.current) return
      lib.current.drawCard(canvasRef.current, format, { card, because, name: cleanName, host: window.location.host })
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey])

  async function imageFile(): Promise<File | null> {
    if (!lib.current || !canvasRef.current) return null
    const blob = await lib.current.canvasToBlob(canvasRef.current)
    return blob ? new File([blob], lib.current.cardFileName(card, format), { type: 'image/png' }) : null
  }

  async function shareCard() {
    const file = await imageFile()
    if (!file) return
    const data: ShareData = minor ? { files: [file] } : { files: [file], text: message }
    if (navigator.canShare?.(data)) {
      try {
        await navigator.share(data)
        trackPujo('pujo_share_completed', { format, channel: 'native' })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setNote('That didn’t go through. Save the picture instead.')
      }
    } else {
      await download()
    }
  }

  async function download() {
    const file = await imageFile()
    if (!file) return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    setNote('Saved. Post it wherever your people are.')
    trackPujo('pujo_share_completed', { format, channel: 'download' })
  }

  async function shareLink() {
    const data: ShareData = { text, url: link }
    if (navigator.share) {
      try {
        await navigator.share(data)
        trackPujo('pujo_share_completed', { format: mode, channel: 'native' })
        return
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
      }
    }
    await copy()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setNote('Copied. Paste it anywhere.')
      trackPujo('pujo_share_completed', { format: mode, channel: 'copy' })
    } catch {
      setNote('Your browser would not copy it. Select the link above and copy it by hand.')
    }
  }

  const heading = mode === 'guess' ? 'Guess my Pujo' : mode === 'compare' ? 'Compare with a friend' : 'Share your Pujo'

  return (
    <div className="mk-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`mk-modal ${styles.sheet}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.sheetHead}>
          <h2 id={titleId} className="mk-h3">{heading}</h2>
          <button ref={closeRef} type="button" className="mk-icon-btn mk-icon-btn--bare" onClick={onClose} aria-label="Close">
            <UiIcon name="close" size={20} />
          </button>
        </div>

        {!age ? (
          <div className={styles.sheetBody}>
            <p className="mk-body">One thing first. {AGE.prompt.replace(':', '?')}</p>
            <p className="mk-caption">We ask before anything leaves your phone. Under 18, your Pujo stays on your phone: a picture to keep, and no links.</p>
            <div className="mk-chips" role="group" aria-label="Your age">
              {AGE.options.map((option) => (
                <button key={option.id} type="button" className="mk-chip" onClick={() => onAge(option.id)}>{option.text}</button>
              ))}
            </div>
          </div>
        ) : minor && mode !== 'card' ? (
          <div className={styles.sheetBody}>
            <p className="mk-body">Links are for 18 and over. Save your card to your phone instead, and show it to whoever you like.</p>
          </div>
        ) : mode === 'card' ? (
          <div className={styles.sheetBody}>
            <div className="mk-seg" role="group" aria-label="Card size">
              <button type="button" aria-pressed={format === 'story'} onClick={() => setFormat('story')}>Story</button>
              <button type="button" aria-pressed={format === 'feed'} onClick={() => setFormat('feed')}>Post</button>
            </div>
            <canvas ref={canvasRef} className={`${styles.preview} ${format === 'feed' ? styles.previewFeed : ''}`} role="img" aria-label="Your Pujo card" />

            <div className={styles.sheetActions}>
              <button type="button" className="mk-btn mk-btn--primary" onClick={shareCard}>
                Share <span className="mk-btn-arrow" aria-hidden="true">→</span>
              </button>
              <button type="button" className="mk-btn mk-btn--secondary" onClick={download}>Save the picture</button>
              {!minor && <button type="button" className="mk-btn mk-btn--secondary" onClick={copy}>Copy link</button>}
              {!minor && (
                <a className="mk-btn mk-btn--secondary" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackPujo('pujo_share_completed', { format, channel: 'whatsapp' })}>
                  WhatsApp
                </a>
              )}
            </div>
            <label className="mk-label" htmlFor={nameId} style={{ marginTop: 16 }}>Your first name, on the card (optional)</label>
            <div className="mk-line">
              <input id={nameId} value={name} maxLength={20} autoComplete="given-name" onChange={(e) => setName(e.target.value)} placeholder="Leave it off" />
            </div>
            <p className="mk-meta" style={{ marginTop: 8 }}>
              {nameRejected ? 'That name can’t go on a card. Letters only, up to 20.' : 'It goes on the picture only, never into a link.'}
            </p>

            {!minor && (
              <>
                <label className="mk-label" htmlFor={`${nameId}-text`} style={{ marginTop: 20 }}>Caption</label>
                <textarea id={`${nameId}-text`} className={`mk-field ${styles.caption}`} value={text} onChange={(e) => setText(e.target.value)} rows={2} />
              </>
            )}
          </div>
        ) : (
          <div className={styles.sheetBody}>
            <p className="mk-body">
              {mode === 'guess'
                ? 'Send this to a friend. They pick one of the nine, then find out. They’ll be wrong.'
                : 'Send this to a friend. When they finish theirs, you both see how your Pujos fit.'}
            </p>
            <label className="mk-label" htmlFor={`${nameId}-invite`} style={{ marginTop: 16 }}>Message</label>
            <textarea id={`${nameId}-invite`} className={`mk-field ${styles.caption}`} value={text} onChange={(e) => setText(e.target.value)} rows={2} />
            <p className={styles.linkPreview}>{link}</p>
            <div className={styles.sheetActions}>
              <button type="button" className="mk-btn mk-btn--primary" onClick={shareLink}>
                Send <span className="mk-btn-arrow" aria-hidden="true">→</span>
              </button>
              <button type="button" className="mk-btn mk-btn--secondary" onClick={copy}>Copy</button>
              <a className="mk-btn mk-btn--secondary" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
        )}

        {note && <p className="mk-caption" role="status" style={{ marginTop: 16 }}>{note}</p>}
        {age && !minor && (
          <p className="mk-meta" style={{ marginTop: 16 }}>
            A link carries your archetype and your Pujo DNA, and nothing else: no name, no answers. It is not stored on our side, so it keeps working after you delete your Pujo here.
          </p>
        )}
      </div>
    </div>
  )
}
