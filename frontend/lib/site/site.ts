/*
 * The site's public identity, in one place: the canonical origin (for the
 * sitemap, robots.txt and link previews), the operator and the contact
 * address the legal pages name. NEXT_PUBLIC_SITE_URL overrides the origin,
 * so a custom domain needs no code change.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mykolkata.vercel.app').replace(/\/+$/, '')
export const SITE_NAME = 'My Kolkata'
export const SITE_DESCRIPTION = 'A city, shot like a film. Paras, pandals, food and the long way home.'
export const OPERATOR = 'Paramarsh Labs'
export const CONTACT_EMAIL = 'paramarshlabs@gmail.com'
/* the date the Privacy Policy and Terms last changed; bump it with them */
export const LEGAL_UPDATED = '2026-09-29'

/* app/opengraph-image.tsx. Named here because a page that sets openGraph no
   longer inherits the root's file-based image. A route with an
   opengraph-image file of its own passes ownImage, or this would replace it. */
const SITE_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'My Kolkata: a yellow Ambassador taxi and a blue bus on a rain-wet street by the Hooghly at dusk, Howrah Bridge and the Victoria Memorial behind them.',
}

type PageMeta = { title: string; description: string; path?: string; noindex?: boolean; ownImage?: boolean }

/* A page's title and description, carried into its link previews too. The
   root layout's openGraph and twitter objects are inherited whole by any page
   that doesn't set its own (they are merged shallowly), so without this every
   shared link would read "My Kolkata" and the site tagline. */
export function pageMetadata({ title, description, path, noindex, ownImage }: PageMeta) {
  const full = `${title} — ${SITE_NAME}`
  const images = ownImage ? {} : { images: [SITE_IMAGE] }
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: { type: 'website' as const, siteName: SITE_NAME, locale: 'en_IN', title: full, description, ...images, ...(path ? { url: path } : {}) },
    twitter: { card: 'summary_large_image' as const, title: full, description, ...images },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
