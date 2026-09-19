import type { Metadata } from 'next'
import { SectionHead } from '@/components/brand/SectionHead'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'About the creator' }

export default async function AboutCreator() {
  await requireUser()

  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <SectionHead
          level={1}
          title="About the creator"
          lede="My Kolkata is a community-built guide to the city — its places, its transport, its news and its markets, gathered in one place."
        />

        <div className="mk-measure" style={{ marginTop: 64, display: 'grid', gap: 48 }}>
          <section>
            <h2 className="mk-h3">Why it exists</h2>
            <p className="mk-body" style={{ marginTop: 12 }}>
              To make Kolkata easier to find your way around, and more fun to wander — and to bring the
              city&apos;s useful resources together, so no one has to keep twelve tabs open to plan an
              evening.
            </p>
          </section>
          <section>
            <h2 className="mk-h3">How it&apos;s built</h2>
            <p className="mk-body" style={{ marginTop: 12 }}>
              React, Next.js and Tailwind CSS, with a design system of its own: Clear Sans and Noto
              Sans Bengali, a cool rich black, one crimson mark, and the alpona line.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
