'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { clerkAppearance, clerkLocalization } from '@/lib/clerkAppearance'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance} localization={clerkLocalization}>
      <AuthProvider>{children}</AuthProvider>
    </ClerkProvider>
  )
}
