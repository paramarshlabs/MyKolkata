import Link from 'next/link'
import type { Metadata } from 'next'
import { Sticker } from '@/components/ashtami-date/marks'
import { NIGHT_DAYS, vibeLabel, zoneLabel } from '@/lib/ashtami-date/config'
import { nightLine } from '@/lib/ashtami-date/og-lines'
import { decodeMatchCard } from '@/lib/ashtami-date/token'
import { pageMetadata } from '@/lib/site/site'
import styles from '@/styles/AshtamiDate.module.css'

type Params = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params
  const card = decodeMatchCard(token)
  /* one per match, and nothing to find: kept out of search */
  const robots = { index: false, follow: true }
  return {
    ...pageMetadata({
      title: card ? `An Ashtami date, ${card.night} night` : 'Find your Ashtami date',
      description: 'Someone found their Ashtami date on My Kolkata. Who are you queueing with?',
      ownImage: true,
    }),
    robots,
  }
}

/* A shared match card. It carries the night, the area and two vibes, and nobody in it. */
export default async function SharedMatchPage({ params }: Params) {
  const { token } = await params
  const card = decodeMatchCard(token)

  return (
    <main className={styles.page}>
      <section className={styles.landing} aria-labelledby="shared-title">
        <Sticker tone="taxi" tilt={10} className={styles.landingSticker}>18+</Sticker>
        {card ? (
          <>
            <p lang="bn" className={styles.landingBn}>{NIGHT_DAYS[card.night].bn}</p>
            <h1 id="shared-title" className={styles.landingTitle}>
              it&apos;s a match.
              <span className={styles.landingTitleTwo}>someone found their ashtami date.</span>
            </h1>
            <p className={styles.sharedPlan}>{nightLine(card.night)}, {zoneLabel(card.zone)}.</p>
            {card.vibes.length > 0 && (
              <ul className={styles.sharedChips} aria-label="what they both said">
                {card.vibes.map((vibe) => <li key={vibe}>{vibeLabel(vibe)}</li>)}
              </ul>
            )}
          </>
        ) : (
          <h1 id="shared-title" className={styles.landingTitle}>
            ashtami is coming.
            <span className={styles.landingTitleTwo}>who are you queueing with?</span>
          </h1>
        )}
        <Link href="/experience/swipe" className={`mk-btn mk-btn--primary ${styles.landingCta}`}>
          find yours <span className="mk-btn-arrow" aria-hidden="true">→</span>
        </Link>
        <p className={styles.landingSmall}>18 and over. no bio, one photo, one line, one plan.</p>
      </section>
    </main>
  )
}
