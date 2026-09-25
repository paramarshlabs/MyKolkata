import { PUJO_DAYS } from '@/lib/pujo'
import { listenUrl, mapsUrl, RECOMMENDATIONS, type Diet, type Route } from '@/lib/pujo-personality/recommendations'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { UiIcon } from '@/components/brand/icons'
import styles from '@/styles/PujoPersonality.module.css'

const DIET_LABEL: Record<Diet, string> = { veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg' }

/* what each diet answer can eat */
const ALLOWED: Record<string, Diet[]> = {
  veg: ['veg'],
  jain: ['veg'],
  egg: ['veg', 'egg'],
}

/* "Your first night" before Shashthi, "Tonight" during Pujo, then next year */
export function routeMoment(now: Date): string {
  const first = new Date(PUJO_DAYS[0].iso).getTime()
  const last = new Date(PUJO_DAYS[PUJO_DAYS.length - 1].iso).getTime() + 30 * 3600 * 1000
  if (now.getTime() < first) return 'Your first night'
  if (now.getTime() < last) return 'Tonight'
  return 'For next Pujo'
}

function RouteStops({ route }: { route: Route }) {
  return (
    <ol className={styles.stops}>
      {route.stops.map((stop) => (
        <li key={stop.name} className={styles.stop}>
          <a href={mapsUrl(stop.name, stop.area)} target="_blank" rel="noopener noreferrer" className={styles.stopLink}>
            <span className={styles.stopName}>{stop.name}</span>
            <span className={styles.stopArea}>{stop.area}</span>
          </a>
          <span className={styles.stopNote}>{stop.note}</span>
        </li>
      ))}
    </ol>
  )
}

type Props = {
  id: ArchetypeId
  diet?: string
  now?: Date
  voice?: 'you' | 'they'
}

/* The curated launch recommendations for one archetype: three routes, eight
   pandals, three plates, a few things to try, and the playlist. */
export function Recommendations({ id, diet, now = new Date(), voice = 'you' }: Props) {
  const recs = RECOMMENDATIONS[id]
  const [first, ...rest] = recs.routes
  const allowed = diet ? ALLOWED[diet] : undefined
  const plates = recs.plates.filter((p) => !allowed || allowed.includes(p.diet)).slice(0, 3)
  const your = voice === 'you' ? 'your' : 'their'

  return (
    <div className={styles.recs}>
      <section className={styles.recBlock} aria-labelledby={`route-${first.id}`}>
        <p className={styles.kicker}>{routeMoment(now)}</p>
        <h3 id={`route-${first.id}`} className="mk-h2">{first.title}</h3>
        <p className={styles.routeWhen}>{first.when}. {first.why}</p>
        <RouteStops route={first} />
        <p className={styles.safety}>Walk it together. Share your plan. 112 if you need it.</p>
        {rest.map((route) => (
          <details key={route.id} className={styles.moreRoute}>
            <summary>
              <span className={styles.moreRouteTitle}>{route.title}</span>
              <span className={styles.moreRouteWhen}>{route.when}</span>
              <UiIcon name="chevron" size={18} className={styles.moreRouteIcon} />
            </summary>
            <p className={styles.routeWhen}>{route.why}</p>
            <RouteStops route={route} />
          </details>
        ))}
      </section>

      <section className={styles.recBlock} aria-labelledby={`pandals-${id}`}>
        <h3 id={`pandals-${id}`} className="mk-h3">Pandals for {voice === 'you' ? 'you' : 'them'}</h3>
        <ul className={styles.picks}>
          {recs.pandals.map((pick) => (
            <li key={pick.name}>
              <a href={mapsUrl(pick.name, pick.area)} target="_blank" rel="noopener noreferrer" className={styles.pick}>
                <span className={styles.pickName}>{pick.name}</span>
                <span className={styles.pickArea}>{pick.area}</span>
                <span className={styles.pickNote}>{pick.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.recBlock} aria-labelledby={`plates-${id}`}>
        <h3 id={`plates-${id}`} className="mk-h3">Plates for {voice === 'you' ? 'you' : 'them'}</h3>
        {plates.length ? (
          <ul className={styles.picks}>
            {plates.map((plate) => (
              <li key={plate.name} className={styles.pick}>
                <span className={styles.pickName}>{plate.name}</span>
                <span className={styles.pickArea}>{plate.area}</span>
                <span className={styles.pickNote}>{plate.note} <span className="mk-tag">{DIET_LABEL[plate.diet]}</span></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mk-caption">Nothing on this list fits how you eat yet. The bhog line is always veg.</p>
        )}
      </section>

      <section className={styles.recBlock} aria-labelledby={`more-${id}`}>
        <h3 id={`more-${id}`} className="mk-h3">Also on {your} list</h3>
        <ul className={styles.alsoList}>
          {recs.alsoTry.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className={styles.recBlock} aria-labelledby={`playlist-${id}`}>
        <h3 id={`playlist-${id}`} className="mk-h3">The playlist: {recs.playlist.name}</h3>
        <ul className="mk-chips" style={{ marginTop: 16 }}>
          {recs.playlist.anchors.map((anchor) => (
            <li key={anchor}>
              <a className="mk-chip" href={listenUrl(anchor)} target="_blank" rel="noopener noreferrer">{anchor}</a>
            </li>
          ))}
        </ul>
      </section>

      <p className={`mk-note ${styles.recNote}`}>
        Picked by our editors, not by an algorithm. Pujo 2026 themes and timings are announced pandal by pandal,
        so check before you go. Every stop opens in Google Maps.
      </p>
    </div>
  )
}
