import { CONTENT } from '@/lib/pujo-personality/content'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { SceneCarousel } from './SceneCarousel'
import { SCENES, storyScenesFor } from './resultScenes'
import styles from '@/styles/ResultGlimpse.module.css'

export function ArchetypeGlimpse({ id }: { id: ArchetypeId }) {
  return (
    <section className={styles.section} aria-labelledby="glimpse-title">
      <div className={`mk-wrap ${styles.inner}`}>
        <SceneCarousel frames={storyScenesFor(id)} name={CONTENT[id].name} />
        <div className={styles.copy}>
          <p className={styles.eyebrow}>A glimpse of their Pujo</p>
          <h2 id="glimpse-title" className={styles.title}>{SCENES[id].line}</h2>
          <p className={styles.intro}>{CONTENT[id].oneLine}</p>
          <p className={styles.note}>A playful Pujo identity, not a psychological test.</p>
          <a className={styles.planLink} href="#pujo-title">Explore their Pujo plan <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  )
}
