import Link from 'next/link'
import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import { notFound } from 'next/navigation'
import { SectionHead } from '@/components/brand/SectionHead'
import { ArchetypeGrid } from '@/components/pujo-personality/ArchetypeGrid'
import { ArchetypeGlimpse } from '@/components/pujo-personality/ArchetypeGlimpse'
import { ArchetypeHero } from '@/components/pujo-personality/ArchetypeHero'
import { Recommendations } from '@/components/pujo-personality/Recommendations'
import { heroSceneFor } from '@/components/pujo-personality/resultScenes'
import { Sigil } from '@/components/pujo-personality/Sigil'
import { ARCHETYPE_IDS, isArchetypeId } from '@/lib/pujo-personality/config'
import { CONTENT, aName, pairCopy, peopleFor, sentence } from '@/lib/pujo-personality/content'
import styles from '@/styles/PujoPersonality.module.css'

type Params = { params: Promise<{ id: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return ARCHETYPE_IDS.map((id) => ({ id }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  if (!isArchetypeId(id)) return {}
  const content = CONTENT[id]
  return pageMetadata({
    title: `The ${content.name}`,
    description: `${content.tagline} ${content.oneLine}`,
    path: `/experience/archetypes/${id}`,
    ownImage: true,
  })
}

const KINDS = [['kin', 'The same Pujo'], ['complement', 'A good fit'], ['spark', 'The fun kind of opposite']] as const

/* A public page per archetype (09-ux-flow.md §S35): shareable without taking
   the quiz, and the landing page for "tag your Pet Pujari friend". */
export default async function ArchetypePage({ params }: Params) {
  const { id } = await params
  if (!isArchetypeId(id)) notFound()
  const content = CONTENT[id]
  const people = peopleFor(id)

  return (
    <main className="mk-page">
      <ArchetypeHero id={id} photo={heroSceneFor(id)}>
        <Link href="/experience/personality" className="mk-btn mk-btn--primary">
          Take the quiz <span className="mk-btn-arrow" aria-hidden="true">→</span>
        </Link>
        <Link href="/experience/archetypes" className={`mk-btn mk-btn--text ${styles.onGround}`}>All nine</Link>
      </ArchetypeHero>

      <ArchetypeGlimpse id={id} />

      <section className={`${styles.paper} ${styles.resultStory} mk-band`} aria-labelledby="story-title">
        <div className="mk-wrap">
          <div className="mk-measure">
            <h2 id="story-title" className={styles.paperTitle}>The story</h2>
            <p className={styles.paperLede}>{content.philosophy}</p>
            <details className={styles.publicStoryDisclosure}>
              <summary className={styles.storyToggle}>
                <span className={styles.storyShow}>Read the full story</span>
                <span className={styles.storyHide}>Close the story</span>
              </summary>
              {content.lore.map((para) => <p key={para.slice(0, 32)} className={styles.paperBody}>{para}</p>)}
              <div className={styles.lightShadow}>
                <p><span className={styles.paperLabel}>At their best</span>{sentence(content.light)}</p>
                <p><span className={styles.paperLabel}>At their worst</span>{sentence(content.shadow)}</p>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section className="mk-band mk-band--deep" aria-labelledby="people-title">
        <div className="mk-wrap">
          <SectionHead id="people-title" title="Their people" />
          <ul className={styles.people}>
            {KINDS.flatMap(([kind, label]) => people[kind].map((other) => (
              <li key={other}>
                <Link href={`/experience/archetypes/${other}`} className={styles.person}>
                  <Sigil id={other} size={48} />
                  <span>
                    <span className={styles.personKind}>{label}</span>
                    <span className={styles.personName}>{CONTENT[other].name}</span>
                    <span className={styles.personLine}>{pairCopy(id, other).headline}</span>
                  </span>
                </Link>
              </li>
            )))}
          </ul>
        </div>
      </section>

      <section className="mk-band" aria-labelledby="say-title">
        <div className="mk-wrap">
          <SectionHead id="say-title" title="What they'd say" />
          <ul className={styles.says}>
            {content.says.slice(0, 4).map((line) => <li key={line} className="mk-statement">{line}</li>)}
          </ul>
          <p className="mk-note" style={{ marginTop: 40 }}>{content.proud}</p>
        </div>
      </section>

      <section className="mk-band mk-band--closing" aria-labelledby="pujo-title">
        <div className="mk-wrap">
          <SectionHead id="pujo-title" title={`The ${content.name}'s Pujo`} lede={`Three routes, eight pandals and the plates to go with them, picked for ${aName(id)}.`} />
          <Recommendations id={id} voice="they" />
        </div>
      </section>

      <section className="mk-band" aria-labelledby="nine-title">
        <div className="mk-wrap">
          <SectionHead id="nine-title" title="The nine" lede="Which one leads for you?" />
          <ArchetypeGrid highlight={id} />
          <div className="mk-banner-actions">
            <Link href="/experience/personality" className="mk-btn mk-btn--secondary">Take the quiz</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
