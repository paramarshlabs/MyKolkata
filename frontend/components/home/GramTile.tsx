'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { EMBED_ORIGIN, embedHeight } from '@/lib/stories/media'
import styles from '@/styles/Home.module.css'

/* Instagram's embed, measured: a 54px header (account, "View profile"),
   the media, then 154px of links, likes and "Add a comment". Those two
   stay fixed at every width; only the media grows with it.                 */
const HEADER = 54
const FOOTER = 154
const TILE = 5 / 4 /* the tile's height over its width: Instagram's portrait */

/*  One hand-picked post as a card like the YouTube ones: Instagram's own
    embed cropped to its picture, the title under it. The picture is the
    embed itself, so a reel plays in place when clicked (with sound; it has
    no control bar to crop away, clicking again pauses it). The title and
    the line under it are the link that opens the post on Instagram.

    A 4:5 post fills the tile as it comes (reels arrive letterboxed to 4:5).
    A squarer one would leave Instagram's white footer showing under it, so
    once the embed reports its height the frame zooms in to cover the tile,
    as object-fit: cover would. A smaller footer (likes hidden) only zooms a
    little further; it never uncovers white.                                */
export function GramTile({ url, embedUrl, title, reel }: { url: string; embedUrl: string; title: string; reel: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== EMBED_ORIGIN.instagram || event.source !== frame.current?.contentWindow) return
      const height = embedHeight(event.data)
      const width = frame.current?.offsetWidth
      if (!height || !width) return
      const media = (height - HEADER - FOOTER) / width
      if (media >= 0.4 && media <= TILE) setZoom(TILE / media)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div>
      <span className={`${styles.videoThumb} ${styles.gramFrame}`}>
        <iframe
          ref={frame}
          src={embedUrl}
          title={title || (reel ? 'A reel on Instagram' : 'A post on Instagram')}
          style={{ '--gram-zoom': zoom, '--gram-head': `${HEADER}px` } as CSSProperties}
          loading="lazy"
          scrolling="no"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </span>
      <a className={styles.video} href={url} target="_blank" rel="noopener noreferrer">
        {title && <span className={styles.videoTitle}>{title}</span>}
        <span className={styles.videoMeta}>{reel ? 'Reel' : 'Post'} on Instagram</span>
        <span className="sr-only">, opens in a new tab</span>
      </a>
    </div>
  )
}
