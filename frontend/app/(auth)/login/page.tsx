'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { AuthLoading, AuthStage } from '@/components/auth/AuthStage'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'
import { safeNext } from '@/lib/returnTo'

function Login() {
  const { isAuthenticated, isLoaded } = useAuth()
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  /* /auth/callback sends a failed code exchange back here */
  const failed = searchParams.get('error') === 'oauth'
  /* where they were going: an invite, a pujo, a group (lib/returnTo.ts) */
  const next = safeNext(searchParams.get('next'))

  useEffect(() => {
    if (isLoaded && isAuthenticated) router.replace(next)
  }, [isLoaded, isAuthenticated, router, next])

  if (!isLoaded || isAuthenticated) return <AuthLoading label="Opening the door" />

  return (
    <AuthStage
      lede={isSignUpMode ? 'Make an account and keep the city close.' : 'Sign in and pick up where you left the city.'}
      footer={<>Created with &lt;3 by Paramarsh Labs</>}
    >
      <div className="mk-seg mk-auth-switch" role="group" aria-label="Sign in or create an account">
        <button type="button" aria-pressed={!isSignUpMode} onClick={() => setIsSignUpMode(false)}>Sign in</button>
        <button type="button" aria-pressed={isSignUpMode} onClick={() => setIsSignUpMode(true)}>Create account</button>
      </div>

      <div className="mk-auth-form">
        <GoogleSignIn
          label={isSignUpMode ? 'Create account with Google' : 'Sign in with Google'}
          initialError={failed ? 'That sign-in did not go through. Try again.' : null}
          next={next}
        />
      </div>
    </AuthStage>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading label="Opening the door" />}>
      <Login />
    </Suspense>
  )
}
