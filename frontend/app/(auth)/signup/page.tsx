'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignUp, useAuth } from '@clerk/nextjs'
import { virtualRouting } from '@/lib/clerkAppearance'
import { AuthLoading, AuthStage } from '@/components/auth/AuthStage'

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/home')
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isSignedIn) return <AuthLoading label="Opening the door" />

  return (
    <AuthStage lede="Make an account with your email, your phone, or Google. It takes a minute.">
      <div className="mk-auth-form">
        <SignUp {...virtualRouting} signInUrl="/login" fallbackRedirectUrl="/home" />
      </div>
      <p className="mk-caption mk-auth-foot">
        <span>Already have an account?</span>
        <Link href="/login" className="mk-btn mk-btn--text">Sign in instead</Link>
      </p>
    </AuthStage>
  )
}
