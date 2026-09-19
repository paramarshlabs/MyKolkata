'use client'

import { useEffect, useState } from 'react'
import { Medallion } from './kolka'

/* The title sequence's bloom — once, on load, and never again. Under reduced
   motion the CSS renders it fully bloomed at rest. design.md §11.3 */
export function MedallionBloom({ size = 120, className = '' }: { size?: number; className?: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return <Medallion open={open} size={size} className={className} />
}
