'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

/* The account, as an avatar in the notch and a small Pearl sheet beneath it. */
export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const sheetId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const name = user?.fullName || user?.email || ''
  const contact = user?.email || ''
  const initial = (name.trim()[0] || '·').toUpperCase()

  return (
    <div className="nn-account" ref={rootRef}>
      <button
        type="button"
        className="nn-avatar"
        aria-label="Your account"
        aria-expanded={open}
        aria-controls={sheetId}
        onClick={() => setOpen((value) => !value)}
      >
        {user?.imageUrl
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={user.imageUrl} alt="" referrerPolicy="no-referrer" />
          : <span className="nn-avatar-initial" aria-hidden="true">{initial}</span>}
      </button>

      {open && (
        <div className="nn-sheet" id={sheetId}>
          {name && (
            <div className="nn-sheet-head">
              <span className="nn-sheet-name">{name}</span>
              {contact && contact !== name && <span className="nn-sheet-mail">{contact}</span>}
            </div>
          )}
          <Link className="nn-option" href="/profile" onClick={() => setOpen(false)}>Profile</Link>
          <Link className="nn-option" href="/about-creator" onClick={() => setOpen(false)}>About the creator</Link>
          <button type="button" className="nn-option" onClick={() => { setOpen(false); void logout() }}>Sign out</button>
        </div>
      )}
    </div>
  )
}
