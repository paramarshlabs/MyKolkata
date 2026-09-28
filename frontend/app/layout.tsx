import type { Metadata, Viewport } from 'next'
import { preload } from 'react-dom'
import { AppProviders } from '@/components/providers/AppProviders'
import { SiteAnalytics } from '@/components/providers/SiteAnalytics'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site/site'
import './globals.css'

/* Every page inherits these; a page sets its own title and description, and
   app/opengraph-image.tsx is the preview for any page without its own. */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: '%s — My Kolkata',
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [{ url: '/micon.png', type: 'image/png' }],
    apple: '/micon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0d1012',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /* Self-hosted, font-display: swap, and preloaded for the two Latin faces. design.md §14 */
  preload('/fonts/clear-sans-text.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' })
  preload('/fonts/clear-sans-display.woff2', { as: 'font', type: 'font/woff2', crossOrigin: '' })

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
        <CookieBanner />
        {/* analytics load only after consent: see lib/consent.ts */}
        <SiteAnalytics />
      </body>
    </html>
  )
}
