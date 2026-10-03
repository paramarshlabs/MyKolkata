/* The only other sites whose photos go through our image optimizer: the
   posters and thumbnails the home page shows (lib/live/tonight.ts,
   lib/live/youtube.ts). Named hosts, never a wildcard, so /_next/image can't
   be used as an open proxy. next.config.ts builds remotePatterns from this. */
export const OPTIMIZED_HOSTS = ['i.ytimg.com', 'assets-in.bmscdn.com', 'secure.meetupstatic.com'] as const

export function optimizable(src: string): boolean {
  if (src.startsWith('/')) return !src.startsWith('//') && !src.includes('?')
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && (OPTIMIZED_HOSTS as readonly string[]).includes(url.hostname)
  } catch {
    return false
  }
}
