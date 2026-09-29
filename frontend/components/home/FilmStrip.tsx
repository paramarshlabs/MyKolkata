import Image from 'next/image'
import Link from 'next/link'
import styles from '@/styles/Home.module.css'

/*  The film strip — the three-panel strip from the kaash-phool moodboard,
    taken to four frames, one per way into the city. design.md §2, §8.1.
    Each frame is a photograph with the caption device on it; the frame a
    person points at opens wider. Nothing moves until someone asks it to.     */

const FRAMES = [
  {
    href: '/pujo',
    image: '/home/pujo.jpg',
    alt: 'Lanterns and a lit pandal at dusk, with Victoria Memorial across the water',
    position: '50% 40%',
    line1: 'Pandals near you',
    line2: 'Lights on at eight',
  },
  {
    href: '/near-you?category=food&view=grid',
    image: '/moc.jpg',
    alt: 'Diners under orange lamps in an old Park Street restaurant',
    position: '42% 50%',
    line1: 'Eat tonight',
    line2: 'Park Street is still open',
  },
  {
    href: '/transport',
    image: '/login-bg.jpg',
    alt: 'Howrah Bridge above the river and the rooftops on a grey monsoon afternoon',
    position: '62% 50%',
    line1: 'Get around',
    line2: 'Metro, tram, ferry, taxi',
  },
  {
    href: '/community',
    image: '/southkol.jpg',
    alt: 'A crowded South Kolkata food street in the evening',
    position: '38% 50%',
    line1: 'The paras are saying',
    line2: 'Stories that last a day',
  },
] as const

export function FilmStrip() {
  return (
    <nav className={styles.strip} aria-label="Around the city">
      {FRAMES.map((frame) => (
        <Link key={frame.href} href={frame.href} className={styles.frame}>
          <Image
            className={styles.frameImg}
            src={frame.image}
            alt={frame.alt}
            fill
            sizes="(max-width: 900px) 78vw, 34vw"
            style={{ objectPosition: frame.position }}
          />
          <span className={styles.frameScrim} aria-hidden="true" />
          <span className={styles.frameCap}>
            <span className={styles.frameTick} aria-hidden="true" />
            <span className={styles.frameText}>
              <span className={styles.frameLine1}>{frame.line1}</span>
              <span className={styles.frameLine2}>{frame.line2}</span>
            </span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
