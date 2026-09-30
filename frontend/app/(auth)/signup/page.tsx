import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthStage } from '@/components/auth/AuthStage'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'
import { currentUserId } from '@/lib/auth'
import { DEFAULT_AFTER_SIGN_IN } from '@/lib/returnTo'

export default async function SignUpPage() {
  /* checked on the server, so the form is in the first paint (see login/page.tsx) */
  if (await currentUserId()) redirect(DEFAULT_AFTER_SIGN_IN)

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
