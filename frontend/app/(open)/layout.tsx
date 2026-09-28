import { OpenHeader } from '@/components/layout/OpenHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

/*
 * Public pages: the Pujo Personality, everything a shared link opens, and
 * the Privacy Policy and Terms.
 * Unlike app/(main), nothing here asks for a session, and nothing here writes:
 * a result lives on the phone, and a shared card lives in its link.
 * tests/pujoPersonality.test.mjs keeps it that way.
 */
export default function OpenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OpenHeader />
      {children}
      <SiteFooter />
    </>
  )
}
