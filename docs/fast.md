TL;DR — the real culprits
The app is architecturally well-built (server components where it matters, lazy map SDK, in-memory caching, consent-gated analytics). But almost nothing is cacheable at the CDN, so under a crowd every page view becomes a cold serverless render — middleware auth check + serverless invocation + DB queries. On low network that's a slow first byte and it's what blows your Vercel function/DB budget before anything else.
The top 5 in priority order:
1. Every (main) page is dynamic & uncacheable (auth cookie read + middleware on every request)
2. A Supabase round-trip from the browser on every page load (AuthProvider)
3. ~114 KB Bengali dictionary shipped to every client (even for pure-English users)
4. Oversized unoptimized assets (2 MB PNGs, 895 KB auto-playing video, raw <img>)
5. Per-instance in-memory caches + external Ola API calls with Cache-Control: private
1. Nothing is cacheable — the #1 scaling killer
Evidence
- app/(main)/layout.tsx → every page in the product (home, pujo, places, near-you, experience, community, profile) starts with await requireUser(...).
- lib/auth.ts → currentUserId() calls createClient() → lib/supabase/server.ts → cookies().
Reading cookies() opts the whole route into dynamic rendering, so no page under (main) can be statically served or CDN-cached.
- app/(main)/home/page.tsx:7 adds export const dynamic = 'force-dynamic' on top.
- proxy.ts has a matcher covering all HTML + API routes and runs supabase.auth.getClaims() on every one → an extra auth round-trip (or JWKS verify) added to every request's TTFB, including the static (open) share pages.
- Greps for revalidate/unstable_cache/use cache: none exist. The only Cache-Control headers in the whole app are on /api/explore/* (and those are private, max-age=0).
Impact: With 1,000 concurrent visitors on /home, that's 1,000 edge-middleware invocations + 1,000 Node serverless invocations + 1,000 auth verifies + N thousand Prisma queries — none of it served from Vercel's CDN. Static pages (/experience/personality, /privacy, /terms, /kaash-phool) could be prerendered but still pay the middleware + client-auth cost.
Fix direction: keep auth-gated chrome as a client/shell concern and let content pages be static or s-maxage cached; tighten the middleware matcher to only the paths that truly need a session refresh; add Cache-Control: s-maxage=…, stale-while-revalidate=… (or Next 16 cacheComponents/use cache) to the public content pages.
2. Browser→Supabase call on every page load
Evidence: components/providers/AuthProvider.tsx:54-70 runs supabase.auth.getUser() in an effect. AuthProvider is mounted in the root layout (AppProviders) so this fires on every route, including the public viral share pages. OpenHeader/Navbar/UserMenu all key their UI off isAuthenticated, which stays undefined until that fetch returns → header flashes/withholds on low network.
The middleware already refreshes the session server-side (lib/supabase/proxy.ts), so this client round-trip is largely duplicate work.
Fix: read the user from the server (the proxy already has it) and pass it down as an initial value; only call getUser() where it's genuinely needed. This removes one blocking network hop per page view.
3. ~114 KB dictionary on every route
Evidence: lib/i18n/bn.ts is 113.8 KB / 1,152 lines, imported at module scope by LanguageProvider (components/providers/LanguageProvider.tsx:4,18-23), which is a 'use client' component inside the root AppProviders. It builds two Maps over ~1,000 entries at load — on the client, on every page, for every user, whether or not they ever toggle Bengali.
Fix: const { BN } = await import('@/lib/i18n/bn') inside toggle()/the bn effect, or fetch it as JSON on demand. English users (the majority) then ship zero of it.
4. Oversized assets (worst under low bandwidth)
Public dir is 14.85 MB total. Biggest offenders:
File	Size	Used by
pers_map.png	2.3 MB	/experience card (next/image source)
spotify.png	2.13 MB	/experience card
ashtami.png	2.13 MB	/experience card
banner.jpg	1.19 MB	marketing
entry1.mp4	895 KB	/home, preload="auto"
- components/brand/HomeEntry.tsx:87-94 starts downloading an 895 KB video immediately on /home (preload="auto") for a splash most returning visitors skip (it's even gated by sessionStorage). → preload="metadata" or a poster + click.
- The /experience cards (app/(main)/experience/page.tsx:110) use next/image (good) but the sources are multi‑MB PNGs, so the Vercel optimizer must download a 2 MB image to produce each variant — slow cold, and billed/cached per size. Re-encode the sources to WebP/AVIF at card dimensions (a 340 px card never needs a 2 MB asset).
- Raw <img> bypasses all optimization in the busiest home components: NewsBand.tsx:40, Tonight.tsx:13, MarketShelf.tsx:63, OnYouTube.tsx:30, plus Card.tsx, Navbar.tsx, OpenHeader.tsx. These ship full-size JPEGs (hwh.jpg ~236 KB, maidan.jpg ~236 KB) with no sizes/responsive variants.
Fonts are fine — self-hosted, font-display: swap, only 33 KB of Latin preloaded, Bengali has unicode-range so it never downloads for English users. Good.
5. Caches are per-instance; live/external calls aren't shared
- lib/cache.ts is a plain in-memory Map. On Vercel every serverless instance has its own cache, so getHomeNews (30 s TTL), listCatalogue (30 s), and loadPujoIndex (30 min) all go cold independently under load → many redundant DB hits.
- lib/live/server.ts → loadLive() reads the DB on every /home request with no cache at all (and can kick off a 40 s after() refresh per instance).
- app/api/explore/* (lib/places/request.ts:124) return private, max-age=0, must-revalidate, and lib/places/placeSearchService.ts calls the external Ola API (providerFallback) whenever local results are thin. So a burst of Explore traffic = a burst of uncached external API calls (rate-limit + cost + latency risk).
Fix: move these to Next's shared data cache (unstable_cache/use cache with tags) or set CDN s-maxage on the route handlers; give loadLive a short TTL; cache the explore responses at the edge.
6. No loading.tsx / Suspense → blank wait on navigation
There are zero loading.tsx, error.tsx, or template.tsx files under app/. Only /near-you wraps its client in <Suspense> (app/(main)/near-you/page.tsx:17). So tapping a nav tab on a slow connection shows nothing until the server finishes auth + DB. Add route-level loading.tsx skeletons so perceived latency drops even when real latency doesn't.
7. Client polling (concurrency amplifier)
- app/(main)/experience/swipe/matches/[id]/ChatClient.tsx:15 polls every 4 s while the tab is visible (POLL_MS = 4000). Many concurrent chats = a steady function-invocation stream. (Supabase Realtime would replace this.)
- MatchesClient.tsx, Deck.tsx re-fetch matches on mount and on tab focus.
- Countdown.tsx:25 ticks every 1 s (cheap, but it's a client component).
8. Smaller items worth doing
- Vercel region is not pinned. No regions in vercel.json/next.config.ts. Functions run in the project's default region (usually US-East) → ~200-300 ms extra RTT per uncached request for a Kolkata audience. Set regions: ['bom1'] (Mumbai).
- OG image routes (app/opengraph-image.tsx, app/(open)/experience/**/opengraph-image.tsx) render via ImageResponse on demand. They do set Cache-Control: max-age=86400, immutable (good), but the root one re-reads + re-encodes a JPEG from disk — confirm it's edge-cached, since share links are your viral path.
- /pujo ships ~35 KB of client index (documented in lib/pujo/client.ts) on every request — fine once the page is cacheable.
- Tailwind is scoped hard (@theme resets every namespace) — nice, that keeps CSS small.
- HomeView.tsx awaits loadLive only after the marketplace/news awaits, so the live read isn't overlapped with the others (minor serialization).
Suggested remediation sequence
Phase 1 — biggest win, lowest risk (CDN + round-trips)
1. Pin regions: ['bom1'].
2. Stop the client getUser() on every load (pass server-known user down).
3. Lazy-load bn.ts.
4. Add loading.tsx for the route groups.
Phase 2 — assets
5. entry1.mp4: preload="metadata" (or click-to-play poster).
6. Re-encode the big PNG/JPG sources and swap raw <img> on home/experience to next/image with sizes.
Phase 3 — caching architecture (the scalable fix)
7. Make public content pages cacheable; tighten the middleware matcher; move hot reads to the shared data cache (unstable_cache/use cache).
8. Edge-cache /api/explore/* and add a small TTL to loadLive.
9. Replace chat polling with Realtime (or a longer interval + backoff).
Approximate expected effect: cached HTML + a smaller shared bundle + no per-page auth hop should cut TTFB on low network from multiple round-trips to essentially one CDN hit, and drop per-visitor function invocations and DB queries by an order of magnitude under a crowd — which is exactly what keeps you inside Vercel's limits.