import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'

export function MainShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
