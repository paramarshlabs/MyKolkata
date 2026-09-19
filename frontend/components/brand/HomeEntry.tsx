'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = 'mk-entry-film-9'

export function HomeEntry() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [show, setShow] = useState(false)
  const [out, setOut] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)

  const dismiss = useCallback(() => {
    sessionStorage.setItem(KEY, '1')
    setOut(true)
  }, [])

  const playWithSound = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.volume = 1
    video.play().then(() => setNeedsTap(false)).catch(() => setNeedsTap(true))
  }, [])

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return
    setShow(true)
  }, [])

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    playWithSound()
    return () => window.removeEventListener('keydown', onKey)
  }, [show, dismiss, playWithSound])

  if (!show) return null

  return (
    <div
      className={`mk-entry${out ? ' is-out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to My Kolkata"
      onTransitionEnd={(e) => {
        if (e.target === e.currentTarget && out) setShow(false)
      }}
    >
      <div className="mk-entry-stage" onClick={needsTap ? playWithSound : undefined}>
        <video
          ref={videoRef}
          className="mk-entry-video"
          src="/entry1.mp4"
          playsInline
          preload="auto"
          onEnded={dismiss}
        />
        {needsTap ? <span className="mk-entry-play">Play</span> : null}
      </div>
    </div>
  )
}
