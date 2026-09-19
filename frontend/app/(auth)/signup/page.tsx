'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { AuthLoading, AuthStage } from '@/components/auth/AuthStage'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'

export default function SignUpPage() {
  const { isAuthenticated, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isAuthenticated) router.replace('/home')
  }, [isLoaded, isAuthenticated, router])

  if (!isLoaded || isAuthenticated) return <AuthLoading label="Opening the door" />

  return (
    <AuthStage lede="Make an account with Google. It takes a minute.">
      <div className="mk-auth-form">
        <GoogleSignIn label="Create account with Google" />
      </div>
      <p className="mk-caption mk-auth-foot">
        <span>Already have an account?</span>
        <Link href="/login" className="mk-btn mk-btn--text">Sign in instead</Link>
      </p>
    </AuthStage>
  )
}
