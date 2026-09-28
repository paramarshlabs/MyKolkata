import type { MetadataRoute } from 'next'
import { ARCHETYPE_IDS } from '@/lib/pujo-personality/config'
import { LEGAL_UPDATED, SITE_URL } from '@/lib/site/site'

/* The pages anyone can open without signing in. The (main) pages ask for a
   session, so a crawler would only ever see the sign-in page there. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], lastModified: Date = now) =>
    ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority })

  return [
    page('/', 1, 'weekly'),
    page('/pujo/personality', 0.9, 'weekly'),
    page('/pujo/archetypes', 0.8, 'monthly'),
    ...ARCHETYPE_IDS.map((id) => page(`/pujo/archetypes/${id}`, 0.7, 'monthly')),
    page('/kaash-phool', 0.5, 'yearly'),
    page('/privacy', 0.3, 'yearly', new Date(LEGAL_UPDATED)),
    page('/terms', 0.3, 'yearly', new Date(LEGAL_UPDATED)),
  ]
}
