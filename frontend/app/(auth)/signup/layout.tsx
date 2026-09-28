import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'

export const metadata: Metadata = pageMetadata({
  title: 'Join',
  description: 'Join My Kolkata with Google: places, Pujo, transport and stories from the city.',
})

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children
}
