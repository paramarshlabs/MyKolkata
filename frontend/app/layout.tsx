import type { Metadata, Viewport } from 'next'
import { preload } from 'react-dom'
import { AppProviders } from '@/components/providers/AppProviders'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'My Kolkata',
    template: '%s — My Kolkata',
  },
  description: 'A city, shot like a film. Paras, pandals, food and the long way home.',
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
      </body>
    </html>
  )
}
