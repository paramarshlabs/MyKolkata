import { OpenHeader } from '@/components/layout/OpenHeader'

/*
 * Public pages: the Pujo Personality and everything a shared link opens.
 * Unlike app/(main), nothing here asks for a session, and nothing here writes:
 * a result lives on the phone, and a shared card lives in its link.
 * tests/pujoPersonality.test.mjs keeps it that way.
 */
export default function OpenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OpenHeader />
      {children}
    </>
  )
}
