import Image from 'next/image'
import type { CSSProperties, Ref } from 'react'
import { Motif } from '@/components/brand/motifs'
import { CONTENT, sentence } from '@/lib/pujo-personality/content'
import type { ArchetypeId } from '@/lib/pujo-personality/types'
import { STORY_PASSAGES } from './storyPassages'
import styles from './IllustratedStory.module.css'

const paperMarks = {
  '--mk-pearl': 'var(--mk-obsidian)',
  '--mk-crimson': 'var(--mk-ruby)',
} as CSSProperties

export function IllustratedStory({ id, personal = false, headingRef }: {
  id: ArchetypeId
  personal?: boolean
  headingRef?: Ref<HTMLElement>
}) {
  const content = CONTENT[id]
  return (
    <section id="story" className={styles.story} aria-labelledby="story-title">
      <div className={styles.spread}>
        <header ref={headingRef} className={styles.heading}>
          <h2 id="story-title">{personal ? 'Your story' : 'The story'}</h2>
          <p className={styles.philosophy}>{content.philosophy}</p>
          <div className={styles.ornament} style={paperMarks}><Motif name="star" height={42} /></div>
        </header>
        <div className={styles.passages}>
          {content.lore.map((paragraph, index) => {
            const visual = STORY_PASSAGES[id][index]
            return (
              <div key={`${id}-${index}`} className={`${styles.passage} ${index % 2 ? styles.right : styles.left} ${visual.compact ? styles.compact : ''} ${visual.wide ? styles.wide : ''}`}>
                <p className={styles.prose}>{paragraph}</p>
                <figure className={`${styles.figure} ${visual.shape === 'landscape' ? styles.landscape : ''}`} style={{ '--story-aspect': visual.aspect } as CSSProperties}>
                  <div className={`${styles.frame} ${visual.fit === 'contain' ? styles.diagram : ''}`}>
                    <Image src={visual.image} alt={visual.alt} fill sizes={visual.wide ? '(max-width: 700px) 85vw, (max-width: 1000px) 240px, 340px' : '(max-width: 700px) 85vw, 260px'} style={{ objectPosition: visual.position, objectFit: visual.fit === 'contain' ? 'contain' : 'cover' }} />
                  </div>
                  <figcaption>{visual.caption}</figcaption>
                </figure>
              </div>
            )
          })}
        </div>
        <footer className={styles.coda}>
          <div className={styles.ornament} style={paperMarks}><Motif name="beadrun" height={42} /></div>
          <div className={styles.reflections}>
            <p><span>{personal ? 'At your best' : 'At their best'}</span>{sentence(content.light)}</p>
            <p><span>{personal ? 'At your worst' : 'At their worst'}</span>{sentence(content.shadow)}</p>
          </div>
          <details className={styles.credits}>
            <summary>Photo credits</summary>
            <p>Resized to WebP; displayed crops vary by device. Each image retains its source license.</p>
            <ol>
              {STORY_PASSAGES[id].map((visual) => (
                <li key={visual.image}>
                  <a href={visual.source} target="_blank" rel="noopener noreferrer">{visual.caption}</a>
                  {' — '}{visual.author}{' · '}
                  <a href={visual.licenseUrl} target="_blank" rel="noopener noreferrer">{visual.license}</a>
                </li>
              ))}
            </ol>
          </details>
        </footer>
      </div>
    </section>
  )
}
