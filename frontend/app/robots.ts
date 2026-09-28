import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site/site'

/* Everything public is crawlable; the API and the auth plumbing are not.
   Shared Pujo cards stay crawlable so link-preview bots can read them: they
   keep themselves out of search with a noindex of their own. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
