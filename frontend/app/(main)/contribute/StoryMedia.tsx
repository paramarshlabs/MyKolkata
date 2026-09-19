'use client'

import { useEffect, useRef, useState } from 'react'
import { EMBED_ORIGIN, embedHeight, resolveStoryMedia } from '@/lib/stories/media'
import styles from '@/styles/Contribute.module.css'

/*  A story's link, shown straight from its provider. Images load from the
    original host (never stored or proxied here); Instagram and X use their own
    embed pages, on hardcoded domains, sized to the post they report. Anything
    that fails, or that we do not know how to show, is an ordinary link.     */
export function StoryMedia({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const [height, setHeight] = useState<number | null>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const media = resolveStoryMedia(url)
  const embedKind = media?.kind === 'x' || media?.kind === 'instagram' ? media.kind : null

  useEffect(() => {
    if (!embedKind) return
    function onMessage(event: MessageEvent) {
      /* only this post's own frame, from the provider's own domain */
      if (event.origin !== EMBED_ORIGIN[embedKind!] || event.source !== frame.current?.contentWindow) return
      const next = embedHeight(event.data)
      if (next) setHeight(next)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [embedKind])

  if (!media) return null

  const link = (label: string) => (
    <a className={styles.mediaLink} href={media.url} target="_blank" rel="noopener noreferrer nofollow ugc">
      {label}<span className="sr-only">, opens in a new tab</span>
    </a>
  )

  if (media.kind === 'link' || failed) return <div className={styles.media}>{link('View link')}</div>

  return (
    <div className={styles.media}>
      {media.kind === 'image' || media.kind === 'drive' ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          className={styles.mediaImg}
          src={media.src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <iframe
          ref={frame}
          className={`${styles.embed} ${media.kind === 'instagram' ? styles.embedInstagram : styles.embedX} ${height ? styles.embedSized : ''}`}
          style={height ? { height } : undefined}
          src={media.embedUrl}
          title={media.kind === 'instagram' ? 'Instagram post' : 'Post on X'}
          loading="lazy"
          scrolling={height ? 'no' : undefined}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      )}
      {link('Open original')}
    </div>
  )
}
