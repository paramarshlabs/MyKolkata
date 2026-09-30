import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import { PersonalityEntry } from '@/components/pujo-personality/PersonalityEntry'
import { toClientIndex } from '@/lib/pujo/client'
import { loadPujoIndex } from '@/lib/pujo/pandals'
import PujoClient from './PujoClient'

export const metadata: Metadata = pageMetadata({
  title: 'Pujo',
  description: 'Durga Pujo in Kolkata: the countdown to Mahalaya, every pujo on a map, the famous ones and the para ones, and a plan for the night.',
})

export default async function PujoPage() {
  await requireUser('/pujo')
  /* the pujos come from the scraper's tables; if they can't be read, the rest of the page still stands */
  const index = await loadPujoIndex()
    .then(toClientIndex)
    .catch((error) => {
      console.error('[pujo] the index did not load', error)
      return null
    })

  return (
    <PujoClient index={index}>
      {/* the quiz's way in, moved here from /home */}
      <PersonalityEntry />
    </PujoClient>
  )
}
