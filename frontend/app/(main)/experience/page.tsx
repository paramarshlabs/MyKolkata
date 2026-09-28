import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { pageMetadata } from '@/lib/site/site'
import { requireUser } from '@/lib/auth'
import { Sprig } from '@/components/brand/kolka'
import styles from '@/styles/Experiences.module.css'

export const metadata: Metadata = pageMetadata({
  title: 'Experiences',
  description: 'Discover your Pujo personality and its map, find the Pujo day and time that fits you, and what is coming next: Kolkata Wrapped, the Kolkata Personality Test and Bengalis near you.',
})

type Feature = {
  title: string
  kicker: string
  description: string
  /* no href: the feature isn't built yet, and the card says so instead of linking */
  href?: string
  image: string
  alt: string
  /* the two facts in the card's foot, as the swipe card shows its ratings */
  facts: [label: string, value: string][]
  badge?: string
}

/* Live features link to what exists today; the rest are shown as coming soon. */
const FEATURES: Feature[] = [
  {
    title: 'Pujo Personality Map',
    kicker: 'Thirteen questions',
    description: 'Discover your Pujo personality, see your personalized map, and share it with friends.',
    href: '/pujo/personality',
    image: '/durgaeyes.png',
    alt: 'The eyes of Durga, drawn in red, white and black',
    facts: [['How', 'Quiz'], ['Then', 'Your map']],
    badge: 'New for Pujo',
  },
  {
    title: 'Find Your Ashtami Date',
    kicker: 'One card at a time',
    description: 'Find the Pujo day and time that fits you best.',
    href: '/experience/swipe',
    image: '/maidan.jpg',
    alt: 'The Victoria Memorial across the Maidan in evening light, a horse grazing on the grass',
    facts: [['How', 'Swipe'], ['Takes', '2 minutes']],
  },
  {
    title: 'Find Your Pujo',
    kicker: 'Spotify or your personality',
    description: 'Discover your ideal Pujo date using Spotify or your Pujo personality.',
    image: '/sare.jpg',
    alt: 'A folded blue and grey saree with a block-printed blouse piece',
    facts: [['With', 'Spotify'], ['Or', 'Your personality']],
  },
  {
    title: 'Kolkata Wrapped',
    kicker: 'Your month, your year',
    description: 'Get your monthly/yearly Kolkata recap of places, spending, people, and personality.',
    image: '/street.jpg',
    alt: 'A café counter under red banners, tiled walls and a chequered floor',
    facts: [['Every', 'Month or year'], ['Covers', 'Places, people']],
  },
  {
    title: 'Kolkata Personality Test',
    kicker: 'Your city archetype',
    description: 'Discover your Kolkata archetype and get a personalized city map and route.',
    image: '/hwh.jpg',
    alt: 'The Howrah Bridge in black and white, its steel spans against a clouded sky',
    facts: [['How', 'Quiz'], ['Then', 'Your route']],
  },
  {
    title: 'Bari Firte Paroni Toh Ki?',
    kicker: 'Kolkata, wherever you are',
    description: 'Find Bengalis near you and celebrate Kolkata together, wherever you are.',
    image: '/hero-bg.jpg',
    alt: 'A yellow bus passing under the steel spans of the Howrah Bridge at sunset',
    facts: [['Finds', 'Bengalis near you'], ['Where', 'Anywhere']],
  },
]

export default async function ExperiencePage() {
  await requireUser()

  return (
    <main className="mk-page mk-page-top">
      <div className="mk-wrap">
        <header>
          <div className="mk-band-head">
            <Sprig size={38} />
            <h1 className="mk-h2">Experiences</h1>
          </div>
          <p className="mk-caption" style={{ marginTop: 8, maxWidth: '52ch' }}>
            Different ways into the city. Pick one to start; more are on the way.
          </p>
        </header>

        <ul className={styles.grid}>
          {FEATURES.map((feature, i) => {
            const card = (
              <>
                <div className={styles.cardMedia}>
                  <Image src={feature.image} alt={feature.alt} fill sizes="(max-width: 640px) 50vw, 380px" preload={i < 3} />
                  <div className={styles.cardScrim} aria-hidden="true" />
                  {(feature.badge || !feature.href) && (
                    <span className={styles.badge}>{feature.href ? feature.badge : 'Coming soon'}</span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{feature.title}</h2>
                  <p className={styles.cardAge}>{feature.kicker}</p>
                  <p className={styles.cardBio}>{feature.description}</p>
                  <div className={styles.ratings}>
                    {feature.facts.map(([label, value]) => (
                      <span key={label}>{label} <span className={styles.ratingValue}>{value}</span></span>
                    ))}
                    {feature.href && <span className={styles.go} aria-hidden="true">→</span>}
                  </div>
                </div>
              </>
            )
            return (
              <li key={feature.title}>
                {feature.href
                  ? <Link href={feature.href} className={styles.feature}>{card}</Link>
                  : <article className={`${styles.feature} ${styles.soon}`} aria-label={`${feature.title}, coming soon`}>{card}</article>}
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
