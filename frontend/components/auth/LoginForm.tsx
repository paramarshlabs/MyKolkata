'use client'

import { useState } from 'react'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'

/* The one interactive part of /login: which of the two the visitor came for. */
export function LoginForm({ failed, next }: { failed: boolean; next: string }) {
  const [isSignUpMode, setIsSignUpMode] = useState(false)

  return (
    <>
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
    </>
  )
}
