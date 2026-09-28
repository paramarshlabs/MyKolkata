import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'

/* an internal reference, not a page for search */
export const metadata: Metadata = pageMetadata({
  title: 'Brand kit',
  description: 'The My Kolkata brand: colour, type, motion and the pieces the product is built from.',
  noindex: true,
})

export default function BrandKitLayout({ children }: { children: React.ReactNode }) {
  return children
}
