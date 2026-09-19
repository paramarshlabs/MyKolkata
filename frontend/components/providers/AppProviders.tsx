'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
