import Link from 'next/link'
import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { listCatalogue } from '@/lib/catalogue/list'
import { Card } from '@/components/brand/Card'
import { SectionHead } from '@/components/brand/SectionHead'
import { Medallion, Sprig } from '@/components/brand/kolka'
import { LaalPaar } from '@/components/brand/Alpona'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Home' }

type NewsItem = {
  id: string
  _id?: string
  title: string
  description?: string | null
  image?: string | null
  link?: string | null
}

type MarketItem = {
  id: string
  _id?: string
  title: string
  location?: string | null
  price?: string | null
  image?: string | null
  link?: string | null
}

export default async function HomePage() {
  await requireUser()

  let news: NewsItem[] = []
  let marketplace: MarketItem[] = []
  let failed = false

  try {
    ;[news, marketplace] = (await Promise.all([
      listCatalogue(prisma.news, 'news', 20),
      listCatalogue(prisma.marketplaceItem, 'marketplace', 20),
    ])) as [NewsItem[], MarketItem[]]
  } catch (err) {
    console.error(err)
    failed = true
  }

  return (
    <main className="mk-page" style={{ paddingBottom: 0 }}>
      <section className="mk-banner" aria-labelledby="home-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mk-banner-img"
          src="/hero-bg.jpg"
          alt="A yellow bus passing under the steel spans of the Howrah Bridge at sunset"
          style={{ objectPosition: '50% 64%' }}
        />
        <div className="mk-banner-scrim" aria-hidden="true" />
        <div className="mk-banner-content">
          <div className="mk-banner-copy">
            <Sprig size={38} />
            <h1 id="home-title" className="mk-display" style={{ marginTop: 8 }}>The city, this week.</h1>
            <p className="mk-banner-bn" lang="bn">চলো, একটু ঘুরে আসি।</p>
            <p className="mk-banner-lede">
              What the paras are talking about, what is for sale down the lane, and every place
              worth the walk.
            </p>
            <div className="mk-banner-actions">
              <Link href="/places" className="mk-btn mk-btn--primary">
                Explore the city <span className="mk-btn-arrow" aria-hidden="true">→</span>
              </Link>
              <Link href="/pujo" className="mk-btn mk-btn--secondary">Count down to Pujo</Link>
            </div>
          </div>
        </div>
      </section>

      {failed ? (
        <section className="mk-band">
          <div className="mk-wrap">
            <div className="mk-panel mk-empty" role="status">
              <h2 className="mk-h3">The news and the market didn&apos;t load.</h2>
              <p className="mk-body">The connection to our listings dropped. Refresh the page to try again.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="mk-band" aria-labelledby="news-title">
            <div className="mk-wrap">
              <SectionHead id="news-title" title="In the news" lede="Papers, fairs and fixtures the city is following." />
              <div className="mk-row" style={{ marginTop: 48 }}>
                {news.length ? news.map((item) => (
                  <Card
                    key={item._id || item.id}
                    href={item.link || undefined}
                    external
                    image={item.image}
                    title={item.title}
                    desc={item.description}
                    icon="book"
                    ariaLabel={item.link ? `${item.title}, opens in a new tab` : undefined}
                  />
                )) : (
                  <p className="mk-caption">Nothing in the news yet. Check back this evening.</p>
                )}
              </div>
            </div>
          </section>

          <section className="mk-band" aria-labelledby="market-title" style={{ paddingTop: 0 }}>
            <div className="mk-wrap">
              <SectionHead id="market-title" title="Marketplace" lede="Sarees, sweets and small-batch things, and where to find them." />
              {marketplace.length ? (
                <div className="mk-grid" style={{ marginTop: 48 }}>
                  {marketplace.map((item) => (
                    <Card
                      key={item._id || item.id}
                      href={item.link || undefined}
                      external
                      image={item.image}
                      title={item.title}
                      sub={item.location}
                      desc={item.price}
                      icon="signboard"
                      ariaLabel={item.link ? `${item.title}, ${item.location ?? ''}, opens in a new tab` : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="mk-caption" style={{ marginTop: 32 }}>Nothing listed yet. The stalls open soon.</p>
              )}
            </div>
          </section>
        </>
      )}

      <LaalPaar />

      <section className="mk-band mk-band--closing" aria-labelledby="closing-title">
        <div className="mk-wrap">
          <Medallion size={132} />
          <h2 id="closing-title" className="mk-display" style={{ marginTop: 24 }}>
            <span className="block">SAME CITY.</span>
            <span className="block">NEW STORIES.</span>
          </h2>
          <p className="mk-banner-bn" lang="bn" style={{ fontSize: 'clamp(18px, 3vw, 32px)' }}>পুজো আসছে।</p>
          <div className="mk-banner-actions">
            <Link href="/pujo" className="mk-btn mk-btn--primary">
              Explore the Pujo <span className="mk-btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
