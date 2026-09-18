'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignIn, SignUp, useAuth } from '@clerk/nextjs'
import { virtualRouting } from '@/lib/clerkAppearance'
import { AuthLoading, AuthStage } from '@/components/auth/AuthStage'

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/home')
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isSignedIn) return <AuthLoading label="Opening the door" />

  return (
    <AuthStage lede={isSignUpMode ? 'Make an account and keep the city close.' : 'Sign in and pick up where you left the city.'}>
      <div className="mk-seg mk-auth-switch" role="group" aria-label="Sign in or create an account">
        <button type="button" aria-pressed={!isSignUpMode} onClick={() => setIsSignUpMode(false)}>Sign in</button>
        <button type="button" aria-pressed={isSignUpMode} onClick={() => setIsSignUpMode(true)}>Create account</button>
      </div>

      <div className="mk-auth-form">
        {isSignUpMode ? (
          <SignUp {...virtualRouting} signInUrl="/login" fallbackRedirectUrl="/home" />
        ) : (
          <SignIn {...virtualRouting} signUpUrl="/signup" fallbackRedirectUrl="/home" />
        )}
      </div>
    </AuthStage>
  )
}
