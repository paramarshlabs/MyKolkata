import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/db/prisma'
import { listCatalogue } from '@/lib/catalogue/list'
import { getHomeNews, homeNewsCards } from '@/lib/news/home'
import { newsRepository } from '@/lib/news/server'
import { SectionHead } from '@/components/brand/SectionHead'
import { Medallion, Sprig } from '@/components/brand/kolka'
import { LaalPaar } from '@/components/brand/Alpona'
import { PersonalityEntry } from '@/components/pujo-personality/PersonalityEntry'
import { FilmStrip } from './FilmStrip'
import { SeasonLine } from './SeasonLine'
import { NewsBand } from './NewsBand'
import { MarketShelf } from './MarketShelf'

type MarketItem = {
  id: string
  _id?: string
  title: string
  location?: string | null
  price?: string | null
  image?: string | null
  link?: string | null
}

/*  Everything /home shows. The page checks the session and renders this, so
    the view itself reads data and nothing else.                             */
export async function HomeView({ now = new Date() }: { now?: Date } = {}) {
  /* the paper, the city story, the sports story — persisted, never blank */
  const newsPromise = getHomeNews(newsRepository, { now })
  let marketplace: MarketItem[] = []
  let failed = false

  try {
    marketplace = (await listCatalogue(prisma.marketplaceItem, 'marketplace', 20)) as MarketItem[]
  } catch (err) {
    console.error(err)
    failed = true
  }
  const news = homeNewsCards(await newsPromise)

  return (
    <>
      <main className="mk-page" style={{ paddingBottom: 0 }}>
      <section className="mk-banner" aria-labelledby="home-title">
        {/* the page's largest paint: resized per device, served as AVIF or WebP, and preloaded */}
        <Image
          className="mk-banner-img"
          src="/hero-bg.jpg"
          alt="A yellow bus passing under the steel spans of the Howrah Bridge at sunset"
          fill
          sizes="100vw"
          preload
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
          <SeasonLine now={now} />
        </div>
      </section>

      <FilmStrip />

      <PersonalityEntry />

      <section className="mk-band" aria-labelledby="news-title">
        <div className="mk-wrap">
          <SectionHead id="news-title" title="In the news" lede="Papers, fairs and fixtures the city is following." />
          <NewsBand news={news} now={now} />
        </div>
      </section>

      {failed ? (
        <section className="mk-band" style={{ paddingTop: 0 }}>
          <div className="mk-wrap">
            <div className="mk-panel mk-empty" role="status">
              <h2 className="mk-h3">The market didn&apos;t load.</h2>
              <p className="mk-body">The connection to our listings dropped. Refresh the page to try again.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="mk-band" aria-labelledby="market-title" style={{ paddingTop: 0 }}>
            <div className="mk-wrap">
              {marketplace.length ? (
                <MarketShelf
                  head={<SectionHead id="market-title" title="Marketplace" lede="Sarees, sweets and small-batch things, and where to find them." />}
                  stalls={marketplace.map((item) => ({
                    id: item._id || item.id, title: item.title, location: item.location, price: item.price, image: item.image, link: item.link,
                  }))}
                />
              ) : (
                <>
                  <SectionHead id="market-title" title="Marketplace" lede="Sarees, sweets and small-batch things, and where to find them." />
                  <p className="mk-caption" style={{ marginTop: 32 }}>Nothing listed yet. The stalls open soon.</p>
                </>
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
    </>
  )
}
