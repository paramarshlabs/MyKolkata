'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs'

type AuthContextValue = {
  isAuthenticated: boolean | undefined
  user: ReturnType<typeof useUser>['user']
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, signOut } = useClerkAuth()
  const { user } = useUser()
  const router = useRouter()

  const logout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isSignedIn,
        user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
