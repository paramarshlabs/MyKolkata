import type { ReactNode } from 'react'
import Navbar from '@/components/layout/Navbar'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { InstagramPrompt } from '@/components/layout/InstagramPrompt'

export function MainShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <SiteFooter />
      <InstagramPrompt />
    </>
  )
}
