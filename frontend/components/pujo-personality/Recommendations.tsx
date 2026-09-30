import { PUJO_DAYS } from '@/lib/pujo'
import { listenUrl, mapsUrl, RECOMMENDATIONS, type Diet, type Pick, type Route } from '@/lib/pujo-personality/recommendations'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { UiIcon } from '@/components/brand/icons'
import Image from 'next/image'
import { PHOTOS, RECOMMENDATION_SCENES } from './resultScenes'
import styles from '@/styles/PujoPersonality.module.css'

const DIET_LABEL: Record<Diet, string> = { veg: 'Veg', egg: 'Egg', nonveg: 'Non-veg' }

/* what each diet answer can eat */
const ALLOWED: Record<string, Diet[]> = {
  veg: ['veg'],
  jain: ['veg'],
  egg: ['veg', 'egg'],
}

const ROUTE_OPENERS: Record<ArchetypeId, string> = {
  night_owl: 'First night',
  pandal_hunter: 'First day',
  para_kid: 'Start at home',
  pujo_romantic: 'First evening',
  pet_pujari: 'From lunch onward',
  art_kid: 'First afternoon',
  addabaaz: 'First night',
  dhunuchi: 'First evening',
  shiuli: 'First morning',
}

/* Keep the first-route label true to each archetype's time of day. */
export function routeMoment(now: Date, id: ArchetypeId): string {
  const last = new Date(PUJO_DAYS[PUJO_DAYS.length - 1].iso).getTime() + 30 * 3600 * 1000
  return now.getTime() < last ? ROUTE_OPENERS[id] : 'For next Pujo'
}

function RouteStops({ route }: { route: Route }) {
  return (
    <ol className={styles.stops} aria-label={`${route.title} stops in order`}>
      {route.stops.map((stop, index) => (
        <li key={stop.name} className={styles.stop}>
          <span className={styles.stopNumber} aria-hidden="true">{index + 1}</span>
          <div className={styles.stopContent}>
            {(index === 0 || index === route.stops.length - 1) && (
              <span className={styles.stopStage}>{index === 0 ? 'Start here' : 'Finish here'}</span>
            )}
            <a href={mapsUrl(stop.name, stop.area)} target="_blank" rel="noopener noreferrer" className={styles.stopLink}>
              <span className={styles.stopName}>{stop.name}</span>
              <span className={styles.stopArea}>{stop.area}</span>
            </a>
            <span className={styles.stopNote}>{stop.note}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function PandalPick({ pick, onRoute, your }: { pick: Pick; onRoute: boolean; your: string }) {
  return (
    <li>
      <a href={mapsUrl(pick.name, pick.area)} target="_blank" rel="noopener noreferrer" className={styles.pick}>
        {onRoute && <span className={styles.pickContext}>On {your} first route</span>}
        <span className={styles.pickName}>{pick.name}</span>
        <span className={styles.pickArea}>{pick.area}</span>
        <span className={styles.pickNote}>{pick.note}</span>
      </a>
    </li>
  )
}

type Props = {
  id: ArchetypeId
  diet?: string
  now?: Date
  voice?: 'you' | 'they'
  showPlaylist?: boolean
}

/* The curated launch recommendations for one archetype: three routes, eight
   pandals, three plates, a few things to try, and the playlist. */
export function Recommendations({ id, diet, now = new Date(), voice = 'you', showPlaylist = true }: Props) {
  const recs = RECOMMENDATIONS[id]
  const [first, ...rest] = recs.routes
  const allowed = diet ? ALLOWED[diet] : undefined
  const plates = recs.plates.filter((p) => !allowed || allowed.includes(p.diet)).slice(0, 3)
  const your = voice === 'you' ? 'your' : 'their'
  const firstRouteNames = new Set(first.stops.map((stop) => stop.name.toLocaleLowerCase('en-IN')))
  const pandals = [...recs.pandals].sort((a, b) =>
    Number(firstRouteNames.has(a.name.toLocaleLowerCase('en-IN'))) - Number(firstRouteNames.has(b.name.toLocaleLowerCase('en-IN'))))
  const onRoute = (pick: Pick) => firstRouteNames.has(pick.name.toLocaleLowerCase('en-IN'))
  const firstThree = pandals.slice(0, 3)
  const otherIdeas = recs.alsoTry.filter((item) => !item.practical)
  const practicalIdeas = recs.alsoTry.filter((item) => item.practical)
  const pickScene = RECOMMENDATION_SCENES[id]
  const pickPhoto = PHOTOS[pickScene.photo]

  return (
    <div className={styles.recs}>
      <section className={styles.recBlock} aria-labelledby={`route-${first.id}`}>
        <div className={styles.routeFeature}>
          <div className={styles.routeIntro}>
            <p className={styles.kicker}>{routeMoment(now, id)}</p>
            <h3 id={`route-${first.id}`} className="mk-h2">{first.title}</h3>
            <p className={styles.routeTime}>{first.when}</p>
            <p className={styles.routeWhy}>{first.why}</p>
            <p className={styles.routeCount}>{first.stops.length} stops, in the order we would walk them.</p>
          </div>
          <div className={styles.routeJourney}>
            <p className={styles.journeyLabel}>The route, stop by stop</p>
            <RouteStops route={first} />
            <p className={styles.routeCaption}>Stop order, not travel times. Open any place in Maps.</p>
          </div>
        </div>
        <p className={styles.safety}>Walk it together. Share your plan. 112 if you need it.</p>
        <div className={styles.alternateRoutes}>
          <p className={styles.alternateLabel}>{id === 'night_owl' || id === 'addabaaz'
            ? 'Another night?'
            : id === 'shiuli' ? 'Another morning?' : 'Another route?'}</p>
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
        </div>
      </section>

      <section className={styles.recBlock} aria-labelledby={`pandals-${id}`}>
        <div className={styles.pandalFeature}>
          <div className={styles.pandalEditorial}>
            <h3 id={`pandals-${id}`} className="mk-h3">Pandals for {voice === 'you' ? 'you' : 'them'}</h3>
            <p className={styles.recIntro}>{pickScene.pandalIntro}</p>
            <figure className={styles.pandalScene}>
              <Image src={pickPhoto.image} alt={pickPhoto.alt} width={960} height={1200} sizes="(max-width: 900px) 100vw, 40vw" style={{ objectPosition: 'position' in pickPhoto ? pickPhoto.position : 'center 55%' }} />
              <figcaption>{pickScene.caption}</figcaption>
            </figure>
          </div>
          <div className={styles.pandalChoices}>
            <ul className={styles.picks}>
              {firstThree.map((pick) => <PandalPick key={pick.name} pick={pick} onRoute={onRoute(pick)} your={your} />)}
            </ul>
            <details className={styles.morePicks}>
              <summary>See the other {pandals.length - 3} pandals <UiIcon name="chevron" size={18} /></summary>
              <ul className={styles.picks}>
                {pandals.slice(3).map((pick) => <PandalPick key={pick.name} pick={pick} onRoute={onRoute(pick)} your={your} />)}
              </ul>
            </details>
          </div>
        </div>
      </section>

      <section className={styles.recBlock} aria-labelledby={`plates-${id}`}>
        <h3 id={`plates-${id}`} className="mk-h3">Plates for {voice === 'you' ? 'you' : 'them'}</h3>
        <p className={styles.recIntro}>{id === 'night_owl' && !plates.some((plate) => plate.moment === '2 am')
          ? 'A warm cup, then breakfast as the city wakes.'
          : pickScene.plateIntro}</p>
        {plates.length ? (
          <ul className={styles.plates}>
            {plates.map((plate) => (
              <li key={plate.name} className={styles.plate}>
                <span className={styles.plateTop}>
                  <span className={styles.plateMoment}>{plate.moment}</span>
                  <span className={styles.plateKind}>{DIET_LABEL[plate.diet]}</span>
                </span>
                <span className={styles.pickName}>{plate.name}</span>
                <span className={styles.pickArea}>{plate.area}</span>
                <span className={styles.pickNote}>{plate.note}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mk-caption">Nothing on this list fits how you eat yet. The bhog line is always veg.</p>
        )}
      </section>

      {otherIdeas.length > 0 && <section className={`${styles.recBlock} ${styles.recAside}`} aria-labelledby={`more-${id}`}>
        <h3 id={`more-${id}`} className={styles.asideTitle}>Beyond the route</h3>
        <ul className={styles.alsoList}>
          {otherIdeas.map((item) => <li key={item.text}>{item.text}</li>)}
        </ul>
      </section>}

      {practicalIdeas.length > 0 && <div className={styles.practicalNote}>
        <span>Before you go</span>
        <ul>{practicalIdeas.map((item) => <li key={item.text}>{item.text}</li>)}</ul>
      </div>}

      {showPlaylist && <section className={styles.recBlock} aria-labelledby={`playlist-${id}`}>
        <h3 id={`playlist-${id}`} className="mk-h3">The playlist: {recs.playlist.name}</h3>
        <ul className="mk-chips" style={{ marginTop: 16 }}>
          {recs.playlist.anchors.map((anchor) => (
            <li key={anchor}>
              <a className="mk-chip" href={listenUrl(anchor)} target="_blank" rel="noopener noreferrer">{anchor}</a>
            </li>
          ))}
        </ul>
      </section>}

      <p className={`mk-note ${styles.recNote}`}>
        Picked by our editors, not by an algorithm. Pujo 2026 themes and timings are announced pandal by pandal,
        so check before you go. Every stop opens in Google Maps.
      </p>
    </div>
  )
}
