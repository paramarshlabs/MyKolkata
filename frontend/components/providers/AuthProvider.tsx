'use client'

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { isPhotoKey, photoSrc } from '@/lib/profile/photo'
import { createClient } from '@/lib/supabase/client'

/* The account as the UI reads it — Google fills these through user_metadata;
   a photo of their own (app_metadata.photo) takes the place of Google's. */
export type AuthUser = {
  id: string
  fullName: string | null
  email: string | null
  emailVerified: boolean
  imageUrl: string | null
  hasOwnPhoto: boolean
  createdAt: string
}

type AuthContextValue = {
  isLoaded: boolean
  isAuthenticated: boolean | undefined
  user: AuthUser | null
  signInWithGoogle: (next?: string) => Promise<void>
  /* re-reads the account after the server changed it (a new photo) */
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const own = isPhotoKey(user.app_metadata?.photo) ? user.app_metadata.photo : null
  return {
    id: user.id,
    fullName: meta.full_name || meta.name || null,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    imageUrl: photoSrc(own, meta.avatar_url || meta.picture || null),
    hasOwnPhoto: Boolean(own),
    createdAt: user.created_at,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(createClient)
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    /* INITIAL_SESSION comes from the cookie, with no trip to Supabase unless the
       token needs refreshing — on a slow line, a getUser() here held the header
       back on every page. The cookie only drives what the UI shows; the server
       verifies the JWT itself before anything is read or written (lib/auth.ts). */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user ?? null))
      setIsLoaded(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const signInWithGoogle = async (next = '/home') => {
    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('next', next)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo.toString() },
    })
    if (error) throw error
  }

  /* app_metadata travels in the session token, so a fresh token carries the change */
  const refresh = async () => {
    const { data } = await supabase.auth.refreshSession()
    if (data.user) setUser(toAuthUser(data.user))
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isAuthenticated: isLoaded ? Boolean(user) : undefined,
        user,
        signInWithGoogle,
        refresh,
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
