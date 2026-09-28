import { networkInterfaces } from 'node:os'
import type { NextConfig } from 'next'

/*
 * The dev server only serves HMR and dev assets to localhost. Also allow this
 * machine's LAN addresses — the "Network:" URL that next dev prints — so the app
 * can be opened from a phone on the same Wi-Fi, plus any hostnames listed in
 * DEV_ALLOWED_ORIGINS (comma-separated, e.g. "*.ngrok-free.app"). Detected on
 * each start, so a new DHCP lease needs no edit. Ignored by production builds.
 */
function devOrigins(): string[] {
  const lan = Object.values(networkInterfaces())
    .flatMap((addresses) => addresses ?? [])
    .filter((address) => address.family === 'IPv4' && !address.internal)
    .map((address) => address.address)
  const extra = (process.env.DEV_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
  return [...new Set(['127.0.0.1', ...lan, ...extra])]
}

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    '/api/explore/*': ['./data/explore/catalog/**/*'],
  },
  allowedDevOrigins: devOrigins(),
  images: {
    formats: ['image/avif', 'image/webp'],
    /* next/image serves the local hero photos only, so the optimizer fetches
       from no remote host — a wildcard here would let anyone use /_next/image
       as an open image proxy. localPatterns keeps it to files in /public with
       no query string. */
    remotePatterns: [],
    localPatterns: [{ pathname: '/**', search: '' }],
  },
  async redirects() {
    return [
      /* Experiences used to live at /tinder; keep old links and bookmarks working */
      { source: '/tinder', destination: '/experience', permanent: true },
      /* re-encoded as JPEG (3 MB to 0.3 MB); rows seeded before that still say .png */
      { source: '/southkol.png', destination: '/southkol.jpg', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig
