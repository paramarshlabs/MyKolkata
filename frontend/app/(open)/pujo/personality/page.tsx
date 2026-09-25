import type { Metadata } from 'next'
import PujoPersonality from '@/components/pujo-personality/PujoPersonality'

export const metadata: Metadata = {
  title: 'What kind of Pujo are you?',
  description: 'Thirteen questions, nine ways to do Pujo in Kolkata. A playful Pujo identity, with the routes, pandals and plates to match.',
  alternates: { canonical: '/pujo/personality' },
}

export default function PujoPersonalityPage() {
  return <PujoPersonality />
}
