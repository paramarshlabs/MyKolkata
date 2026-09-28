'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { noSnapshot, savedSnapshot, subscribeSaved } from '@/lib/pujo-personality/session'

/* "Take the quiz" until there is a saved Pujo on this phone, then "Show my Pujo".
   The server render has no storage, so it always starts from the quiz. */
export function PersonalityCta() {
  const saved = useSyncExternalStore(subscribeSaved, savedSnapshot, noSnapshot) !== null

  return (
    <Link href="/experience/personality" className="mk-btn mk-btn--primary">
      {saved ? 'Show my Pujo' : 'Take the quiz'} <span className="mk-btn-arrow" aria-hidden="true">→</span>
    </Link>
  )
}
