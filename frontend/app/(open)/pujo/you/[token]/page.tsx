import Link from 'next/link'
import type { Metadata } from 'next'
import { SectionHead } from '@/components/brand/SectionHead'
import { ArchetypeGrid } from '@/components/pujo-personality/ArchetypeGrid'
import { ArchetypeHero } from '@/components/pujo-personality/ArchetypeHero'
import { DnaChart } from '@/components/pujo-personality/DnaChart'
import { FriendCompare } from '@/components/pujo-personality/FriendCompare'
import { CONTENT, aName } from '@/lib/pujo-personality/content'
import { decodeCard } from '@/lib/pujo-personality/token'
import styles from '@/styles/PujoPersonality.module.css'

type Params = { params: Promise<{ token: string }> }

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params
  const card = decodeCard(token)
  /* a card carries no personal data, but there is one per person: keep them out of search */
  const robots = { index: false, follow: true }
  if (!card) return { title: 'A Pujo', robots }
  return {
    title: `${capitalise(aName(card.primary))}'s Pujo`,
    description: `${CONTENT[card.primary].tagline} Which Pujo are you?`,
    robots,
  }
}

/* A shared card (09-ux-flow.md §2): theirs first, then "What's yours?" */
export default async function SharedCardPage({ params }: Params) {
  const { token } = await params
  const card = decodeCard(token)

  if (!card) {
    return (
      <main className="mk-page mk-page-top">
        <div className="mk-wrap">
          <div className="mk-panel mk-empty">
            <h1 className="mk-h3">This link doesn&apos;t open a Pujo.</h1>
            <p className="mk-body">It may have been cut short when it was copied. Want to find yours?</p>
            <Link href="/pujo/personality" className="mk-btn mk-btn--primary">Discover my Pujo</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mk-page">
      <ArchetypeHero id={card.primary} voice="they" note="Someone sent you their Pujo." card={{ secondary: card.secondary, status: card.status, badges: card.badges }}>
        <Link href={`/pujo/personality?with=${token}`} className="mk-btn mk-btn--primary">
          What&apos;s yours? <span className="mk-btn-arrow" aria-hidden="true">→</span>
        </Link>
        <Link href={`/pujo/archetypes/${card.primary}`} className={`mk-btn mk-btn--text ${styles.onGround}`}>
          Read about the {CONTENT[card.primary].name}
        </Link>
      </ArchetypeHero>

      <FriendCompare token={token} them={card} />

      <section className="mk-band" aria-labelledby="dna-title" style={{ paddingTop: 0 }}>
        <div className="mk-wrap">
          <SectionHead id="dna-title" title="Their Pujo DNA" lede="Fourteen petals, one for each part of a Pujo, drawn against how most people answer." />
          <div style={{ marginTop: 40 }}><DnaChart vector={card.vector} /></div>
        </div>
      </section>

      <section className="mk-band" aria-labelledby="nine-title" style={{ paddingTop: 0 }}>
        <div className="mk-wrap">
          <SectionHead id="nine-title" title="The nine" />
          <ArchetypeGrid highlight={card.primary} />
          <p className="mk-caption">A playful Pujo identity from My Kolkata. Not a psychological test.</p>
        </div>
      </section>
    </main>
  )
}
