import { QUESTION_INDEX } from '@/lib/pujo-personality/config'
import { CONTENT, becauseLine } from '@/lib/pujo-personality/content'
import { RECOMMENDATIONS, listenUrl } from '@/lib/pujo-personality/recommendations'
import { quoteFor, type Saved } from '@/lib/pujo-personality/session'
import type { PujoResult } from '@/lib/pujo-personality/types'
import { SceneCarousel } from './SceneCarousel'
import { SCENES, storyScenesFor } from './resultScenes'
import styles from '@/styles/ResultGlimpse.module.css'

const SOUNDTRACK_LEADS: Record<string, string> = {
  a: 'Mahishasuramardini',
  b: 'Fossils',
  c: 'Amake Amar Moto Thakte Dao, Anupam Roy',
  d: 'Dola Re Dola',
  e: 'Cizzy',
  f: 'Coffee House, Manna Dey',
}

export function ResultGlimpse({ result, saved }: { result: PujoResult; saved: Saved }) {
  const id = result.primary
  const scene = SCENES[id]
  const frames = storyScenesFor(id)
  const picks = RECOMMENDATIONS[id].playlist
  const soundtrackQuestion = QUESTION_INDEX.get('q_soundtrack')
  const soundtrackChoices = (saved.answers.q_soundtrack ?? [])
    .map((choice) => soundtrackQuestion?.options.find((option) => option.id === choice)?.text)
    .filter((choice): choice is string => Boolean(choice))
  const tracks = [...(saved.answers.q_soundtrack ?? []).map((choice) => SOUNDTRACK_LEADS[choice]).filter(Boolean), ...picks.anchors]
    .filter((anchor, index, all) => all.indexOf(anchor) === index)
    .slice(0, 3)
  const observations = result.because.slice(0, 3)
  const firstQuote = observations
    .map((item) => quoteFor(item.dim, item.value, saved.answers))
    .find(Boolean)?.trim()

  return (
    <section className={styles.section} aria-labelledby="glimpse-title">
      <div className={`mk-wrap ${styles.inner}`}>
        <SceneCarousel frames={frames} name={CONTENT[id].name} />
        <div className={styles.copy}>
          <p className={styles.eyebrow}>A glimpse of your Pujo</p>
          <h2 id="glimpse-title" className={styles.title}>{scene.line}</h2>
          <p className={styles.intro}>{CONTENT[id].oneLine}</p>
          <div className={styles.evidence} aria-label="What in your answers led here">
            <p className={styles.evidenceTitle}>We saw it in your answers</p>
            <ul>
              {observations.map((item) => <li key={item.dim}>{becauseLine(item.dim, item.value)}</li>)}
            </ul>
            {firstQuote && <p className={styles.quote}>You said “{firstQuote}”</p>}
          </div>
          <p className={styles.note}>A playful Pujo identity, not a psychological test.</p>
          <a className={styles.planLink} href="#yours-title">See your Pujo plan <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      <div className={`mk-wrap ${styles.soundWrap}`}>
        <div className={styles.soundHeading}>
          <div>
            <p className={styles.soundLabel}>For your walk</p>
            <h3>{picks.name}</h3>
          </div>
        </div>
        <div className={styles.soundContent}>
          {soundtrackChoices.length > 0 && <p className={styles.yourPick}>Your quiz picks: {soundtrackChoices.join(' / ')}</p>}
          <ul className={styles.tracks}>
            {tracks.map((anchor) => (
              <li key={anchor}><a href={listenUrl(anchor)} target="_blank" rel="noopener noreferrer">{anchor}<span aria-hidden="true" /></a></li>
            ))}
          </ul>
          <p className={styles.listenNote}>Editorial picks. Each opens a YouTube Music search.</p>
        </div>
      </div>
    </section>
  )
}
