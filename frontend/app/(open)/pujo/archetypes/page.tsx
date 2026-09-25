import Link from 'next/link'
import type { Metadata } from 'next'
import { SectionHead } from '@/components/brand/SectionHead'
import { ArchetypeGrid } from '@/components/pujo-personality/ArchetypeGrid'

export const metadata: Metadata = {
  title: 'The nine Pujo personalities',
  description: 'Night Owl, Pandal Hunter, Para Kid, Pujo Romantic, Pet Pujari, Art Kid, Addabaaz, Dhunuchi and Shiuli: nine ways to do Pujo in Kolkata.',
  alternates: { canonical: '/pujo/archetypes' },
}

export default function ArchetypesPage() {
  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <SectionHead
          level={1}
          title="The nine"
          lede="Nine ways to do Pujo in this city: when you go out, where you go, who you go with, and what makes you stop. Everyone is a little of all nine. Which one leads?"
        />
        <ArchetypeGrid />
        <div className="mk-banner-actions">
          <Link href="/pujo/personality" className="mk-btn mk-btn--primary">
            Find yours <span className="mk-btn-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="mk-caption" style={{ marginTop: 24 }}>A playful Pujo identity built from your answers. Not a psychological test.</p>
      </div>
    </main>
  )
}
