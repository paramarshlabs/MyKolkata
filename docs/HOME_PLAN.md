# /home redesign: handoff plan

Branch: `home-redesign`. Read the code under `frontend/`; this file only says what's done, what's wrong, and what's next.

## Direction (from the owner)

- **The app is My Kolkata, not My Pujo.** Home should be about the city. Pujo should show up because the live data says so (news, searches, Reddit, events), never because home hardcodes it.
- **Anakin (sponsored scraping) is the point.** Put effort into live, scraped data. Don't add typographic or structural decoration.
- Don't reuse /pujo visuals on home (the kaash-phool scene was rejected and removed).
- Rejected and reverted: the সকাল/দুপুর/বিকেল "day in Kolkata" chapter headers.

## Fix first (owner feedback on what's already built)

1. **The hero is cluttered.** Take the season line off the hero (`components/home/SeasonLine.tsx`, `lib/home/season.ts`). It's Pujo-specific and its count disagrees with /pujo: it counts calendar days ("11 days") while /pujo counts down to the Mahalaya instant ("10 days …"). Delete it or move it to /pujo.
2. **The moon's position looks bad.** The sky readout sits top-right (`components/home/SkyReadout.tsx`, `.sky` in `styles/Home.module.css`). Keep the weather sentence if it can sit cleanly, maybe as one quiet line. Rethink or drop the moon glyph. Sentence logic: `lib/home/sky.ts`. Sun and moon maths: `lib/home/astro.ts`.
3. **The four-panel film strip looks bad.** `components/home/FilmStrip.tsx`, `.strip`/`.frame` styles, `public/home/pujo.jpg`. Remove or redesign it; the first panel is also Pujo-led.
4. **Too much Pujo on home.** Revisit `PersonalityEntry` (Bordeaux band) and `PujoPulse` (the "Durga Puja" search chart). Either make the chart's keyword data-driven (for example, the top rising Kolkata query) or move it to /pujo.

## Done (kept)

- `components/home/HomeView.tsx`: the page body. `app/(main)/home/page.tsx` does auth, the entry film, and `maxDuration`.
- News as one lead plus two, with titles cleaned of site suffixes: `components/home/NewsBand.tsx`, `displayTitle` in `lib/news/home.ts`.
- Marketplace shelf: `components/home/MarketShelf.tsx`.
- The entry film plays muted when sound is blocked: `components/brand/HomeEntry.tsx`.
- **The live feed pipeline (Anakin Wire):**
  - `lib/live/wire.ts`: client (POST `/v1/wire/task`, poll `/v1/wire/jobs/:id`).
  - `lib/live/refresh.ts`: which feeds are due, per-feed leases, the refresh loop.
  - `lib/live/server.ts`: Prisma store; `loadLive()` refreshes stale feeds via `after()`.
  - `lib/live/shape.ts`: tolerant JSON helpers.
  - `lib/live/feeds.ts`: the registry.
  - `app/api/cron/live/route.ts`: daily cron (in `vercel.json`); `?only=` limits it to named feeds. It takes anything due within 90 minutes, since Vercel fires a daily cron anywhere in its hour.
  - Every feed stays fresh for `LIVE_REFRESH_HOURS` (`.env.local`, 24 when unset); `on-this-day` is also fetched again when the date changes. The sections don't say when they were fetched.
  - `npm run live:refresh -- youtube tonight` (in `frontend/`) fetches those feeds now, fresh or not; no names means every feed, `--due` only the stale ones, `--list` shows each feed's state without fetching (`scripts/live-refresh.ts`).
  - Table: `LiveFeed` in `prisma/schema.prisma`, migration `prisma/migrations/20260929180000_live_feeds`.
- **Feeds built:**
  - `sky`: Open-Meteo weather and air quality (`lib/live/sky.ts`).
  - `tonight`: BookMyShow's Kolkata events page (Anakin's crawl held to one page, `createScraper` in `lib/live/wire.ts`; the URL scraper got BookMyShow's region picker instead) and in-person Meetup events, shown as ticket stubs (`lib/live/tonight.ts`, `components/home/Tonight.tsx`). Both readers were checked against real responses on 30 Sep 2026. BookMyShow's date is read from the text printed on each poster, and only the first rows of cards carry a poster, so undated events are left out. Wire's `bms_discover_home` (section headings only) and Luma (no Kolkata place) were dropped. About 2 credits a fetch.
  - `pujo-trend`: Google Trends (`lib/live/trend.ts`, `PujoPulse`/`PulseChart`).
  - `searching`: rising "Kolkata" queries and the derby share (`lib/live/searching.ts`, `components/home/Searching.tsx`).
- Tests: `tests/home.test.mjs`, `tests/liveFeeds.test.mjs`.

## Blockers

- **The Anakin account has 0 credits.** Every Wire call returns 402 `INSUFFICIENT_CREDITS`. Home's news is stale for the same reason (`app/api/cron/news`). Top up before anything else.
- **The Wire response shapes are unverified.** The normalizers were written blind, as tolerant guesses. Once credits exist, run `GET /api/cron/live?only=sky` with `Authorization: Bearer $CRON_SECRET`, inspect the `live_feeds` rows (or log the raw job output), and fix each normalizer. Action IDs and parameters come from `GET https://api.anakin.io/v1/wire/catalog/<slug>`.
- **The `live_feeds` migration hasn't been applied anywhere.** Without it, home shows no live sections and logs one warning. The local `.env.local` DB is an old dev DB that is also missing `stories` and `experiences`.
- The Wire rate limit is 10 requests a minute. The Vercel cron is daily (the Hobby plan limit); freshness comes from `after()` refreshes on page views.

## Next: Anakin features, in priority order

Each feed goes in its own module in `lib/live/`, is registered in `feeds.ts`, gets a section component in `components/home/`, and gets a test in `tests/liveFeeds.test.mjs`. A section renders nothing without data.

1. **Adda, "what the paras are saying".** Reddit r/kolkata top posts this week (`rt_subreddit_posts`), mixed with the site's own community stories (`prisma.story`, active only; reuse `lib/stories/*`). Titles only, linking out, with NSFW and stickied posts filtered. This delivers the hero's "what the paras are talking about".
2. **Kolkata on YouTube this week** (`yt_search`). A city query, seasonal only when the data says so.
3. **Match strip** (`act_espncricinfo_live_matches_listing` or `cricbuzz.com`). Shows only when a Kolkata, Bengal or India match is live or within 24 hours.
4. **On this day** (`wp_on_this_day`). Filter to Kolkata, Calcutta and Bengal.
5. **Instagram, picked by hand.** Done: `lib/home/instagram_feed.ts` is a hand-curated list of post and reel links, and /home shows the first three as Instagram's own embeds. Nothing is fetched or added automatically; the Graph API hashtag feed and the community-story links were removed on 30 Sep 2026.
6. Place-scoped news or "what's new in the city" via Anakin search or scrape, fed into the news section so seasonal topics surface naturally.
7. Lower priority, and Pujo-only if kept: pandal theme reveals (Anakin search plus `generateJson`), pandals near you (the `Pandal` model has no coordinates), a Pujo passport, a personalised home from the quiz result.

## Working notes

- **Local preview without auth:** `frontend/app/dev-home/` is git-excluded via `.git/info/exclude` and exists only on this machine. `/dev-home?live=1` uses fixtures from `app/dev-home/fixtures.ts`; `&at=<ISO>` renders as of that moment; `&film=1` plays the entry film. Screenshots: `playwright-core` plus `/usr/bin/google-chrome` in headless mode.
- **Tests:** run all except `tests/ashtamiDate.test.mjs` (another session's work in progress). Two failures predate this branch: an emoji in `app/(main)/about-creator`, and the missing `.env.example`.
- **Another session edits the same tree** (Ashtami Date: `prisma/schema.prisma`, `vercel.json`, `lib/ashtami-date`, and others). Stage only your own hunks.
- House rules are enforced by `tests/brandCompliance.test.mjs`. The design bible is `docs/DESIGN.md`.
