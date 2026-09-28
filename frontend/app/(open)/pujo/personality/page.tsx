import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import PujoPersonality from '@/components/pujo-personality/PujoPersonality'

export const metadata: Metadata = pageMetadata({
  title: 'What kind of Pujo are you?',
  description: 'Thirteen questions, nine ways to do Pujo in Kolkata. A playful Pujo identity, with the routes, pandals and plates to match.',
  path: '/pujo/personality',
  ownImage: true,
})

export default function PujoPersonalityPage() {
  return <PujoPersonality />
}
