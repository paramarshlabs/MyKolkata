import Image from 'next/image'
import { optimizable } from '@/lib/images/remote'

/*  A card's photo, filling its (position: relative) frame. Our own files in
    /public, and posters from the few hosts in lib/images/remote.ts, go through
    next/image, so a phone gets a small AVIF/WebP sized to the card. Photos
    from anywhere else stay plain <img>: the optimizer is never an open proxy. */
export function CardImage({ src, sizes, referrerPolicy }: { src: string; sizes: string; referrerPolicy?: 'no-referrer' }) {
  if (optimizable(src)) {
    return <Image src={src} alt="" fill sizes={sizes} referrerPolicy={referrerPolicy} />
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" loading="lazy" decoding="async" referrerPolicy={referrerPolicy} />
}
