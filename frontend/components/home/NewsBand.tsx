import type { HomeNewsCard } from '@/lib/news/home'
import { CityIcon } from '@/components/brand/icons'
import { CardImage } from '@/components/brand/CardImage'
import styles from '@/styles/Home.module.css'

const KIND: Record<HomeNewsCard['type'], string> = {
  NEWSPAPER: "Today's paper",
  CITY: 'The city',
  SPORTS: 'Sport',
}

const BENGALI = /[ঀ-৿]/
const DAY_MS = 86_400_000

/* "Today", "Yesterday", "3 days ago", then the date — Kolkata time */
export function newsAge(iso: string | null, now: Date) {
  if (!iso) return null
  const day = (d: Date) => new Date(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })).getTime()
  const diff = Math.round((day(now) - day(new Date(iso))) / DAY_MS)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}

function Meta({ item, now }: { item: HomeNewsCard; now: Date }) {
  const age = newsAge(item.publishedAt, now)
  return (
    <p className={styles.newsMeta}>
      <span>{item.sourceName || KIND[item.type]}</span>
      {age && <span className={styles.newsAge}>{age}</span>}
    </p>
  )
}

function Media({ item, className, sizes }: { item: HomeNewsCard; className: string; sizes: string }) {
  return (
    <div className={className}>
      {item.image ? (
        <CardImage src={item.image} sizes={sizes} />
      ) : (
        <span className={styles.newsFallback}><CityIcon name="book" size={36} /></span>
      )}
    </div>
  )
}

function Story({ item, lead, now }: { item: HomeNewsCard; lead?: boolean; now: Date }) {
  const body = (
    <>
      <Media item={item} className={lead ? styles.newsLeadMedia : styles.newsItemMedia} sizes={lead ? '(max-width: 900px) 100vw, 60vw' : '(max-width: 900px) 45vw, 22vw'} />
      <div className={styles.newsText}>
        <Meta item={item} now={now} />
        <h3 className={lead ? styles.newsLeadTitle : styles.newsItemTitle}>{item.title}</h3>
        {item.description && (
          <p className={styles.newsDesc} lang={BENGALI.test(item.description) ? 'bn' : undefined}>{item.description}</p>
        )}
      </div>
    </>
  )
  const className = lead ? styles.newsLead : styles.newsItem
  return item.link ? (
    <a className={className} href={item.link} target="_blank" rel="noopener noreferrer">
      {body}<span className="sr-only">, opens in a new tab</span>
    </a>
  ) : (
    <article className={className}>{body}</article>
  )
}

/*  The morning paper and two stories: one lead, two beside it. The paper
    leads because it is the thing the city reads first.                     */
export function NewsBand({ news, now }: { news: HomeNewsCard[]; now: Date }) {
  if (!news.length) return <p className="mk-caption">Nothing in the news yet. Check back this evening.</p>
  const [lead, ...rest] = news
  return (
    <div className={styles.news}>
      <Story item={lead} lead now={now} />
      <div className={styles.newsSide}>
        {rest.map((item) => <Story key={item.id} item={item} now={now} />)}
      </div>
    </div>
  )
}
