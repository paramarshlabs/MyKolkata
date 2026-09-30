import { redirect } from 'next/navigation'
import { AuthStage } from '@/components/auth/AuthStage'
import { LoginForm } from '@/components/auth/LoginForm'
import { currentUserId } from '@/lib/auth'
import { safeNext } from '@/lib/returnTo'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

/*
 * Decided on the server: a signed-in visitor is redirected before any HTML is
 * sent, and everyone else gets the form in the first paint — no waiting on the
 * client bundle and a browser round trip to Supabase behind a loader.
 */
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  /* where they were going: an invite, a pujo, a group (lib/returnTo.ts) */
  const next = safeNext(params.next)

  if (await currentUserId()) redirect(next)

  return (
    <AuthStage
      lede="Sign in and pick up where you left the city."
      footer={<>Created with &lt;3 by Paramarsh Labs</>}
    >
      {/* /auth/callback sends a failed code exchange back here */}
      <LoginForm failed={params.error === 'oauth'} next={next} />
    </AuthStage>
  )
}
