import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'

export const metadata: Metadata = pageMetadata({
  title: 'Sign in',
  description: 'Sign in to My Kolkata with Google: places, Pujo, transport and stories from the city.',
})

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
