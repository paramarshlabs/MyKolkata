I want you to make the `/home` "In the news" section a properly working persistent editorial news system.

IMPORTANT:
Before changing anything, inspect the existing implementation and reuse the existing architecture.

Relevant existing pieces include:
- `frontend/app/(main)/home/`
- `frontend/app/api/news/`
- `frontend/prisma/schema.prisma`
- `frontend/prisma/seed.js`
- existing `News` model
- existing Anakin integration
- existing image discovery/enrichment utilities
- existing cache utilities

Do NOT rebuild the entire Home page.
Do NOT change the visual design.
Do NOT touch unrelated sections.

The current UI has exactly 3 news cards.

==================================================
HOME NEWS SECTION
==================================================

The three cards have different purposes:

CARD 1 — NEWSPAPER
--------------------------------
Keep the existing Anandabazar Patrika card.

For now this card remains as it currently works.

Do not change its UI or behavior.

It represents:
"Anandabazar Patrika today"


CARD 2 — KOLKATA / CITY NEWS
--------------------------------
This must become a dynamic current Kolkata news card.

It should show the most relevant current story about Kolkata.

Examples:

- major Kolkata city news
- Kolkata cultural events
- Kolkata government/civic developments
- Kolkata Metro/transport developments
- major Kolkata announcements
- major Kolkata festivals
- Durga Puja developments
- major events happening in Kolkata
- important local stories

Use Anakin to discover current stories.

Do NOT hardcode one particular story.

The story should naturally change as new important Kolkata news appears.


CARD 3 — KOLKATA SPORTS
--------------------------------
This must become a dynamic Kolkata sports news card.

Search for current sports stories relevant to Kolkata.

Prioritize:

- East Bengal
- Mohun Bagan
- Mohammedan Sporting
- Kolkata football
- ISL
- Calcutta Football League
- IFA
- Kolkata cricket
- Bengal cricket
- Eden Gardens
- major cricket matches/events in Kolkata
- major sporting events happening in Kolkata

Do NOT hardcode:

"Kolkata Derby: EB vs MB"

That is only one possible story.

If the biggest current Kolkata sports story is football, show football.

If it is cricket, show cricket.

If another major Kolkata sport becomes relevant, show that instead.

The card should represent:

"Kolkata sports — what is happening right now?"


==================================================
DATABASE IS THE SOURCE OF TRUTH
==================================================

Do NOT make the browser call Anakin.

Do NOT make `/home` depend on Anakin being available.

Architecture:

Anakin
   ↓
background ingestion
   ↓
PostgreSQL / Prisma
   ↓
/api/news
   ↓
Home page


The Home page should only consume persisted news.

If Anakin is down, `/home` must still work.


==================================================
NEWS MODEL
==================================================

Inspect the existing `News` model first.

Extend it rather than creating a duplicate news system.

The model should support at minimum:

- id
- title
- description
- url
- imageUrl
- sourceName
- sourceDomain
- publishedAt
- discoveredAt
- category
- type
- eventSlug
- eventPhase
- score
- isActive
- featuredAt
- cooldownUntil
- expiresAt
- contentHash
- createdAt
- updatedAt

Use the existing project's naming conventions.

`type` should distinguish at least:

- CITY
- SPORTS

Do not mix city and sports stories when selecting cards.


==================================================
ANAKIN INGESTION
==================================================

Use the existing Anakin integration if present.

If there is already an Anakin utility, extend it instead of creating another client.

Anakin should search for two independent feeds:

CITY:

"Kolkata latest news today"
"Kolkata city news today"
"Kolkata events today"
"Kolkata latest events"
"Kolkata culture news"
"Kolkata important news"

SPORTS:

"Kolkata sports news today"
"Kolkata football today"
"East Bengal latest"
"Mohun Bagan latest"
"Mohammedan Sporting latest"
"Kolkata cricket latest"
"Eden Gardens latest"
"Bengal cricket latest"

Queries should be generated dynamically where possible.

Do not make one giant hardcoded query.


==================================================
SOURCE QUALITY
==================================================

Do not blindly accept the first Anakin result.

Prefer:

1. official sources
2. reputable Kolkata/Bengal publications
3. established national publications
4. official sports/event organizations
5. other credible sources

Every story should preserve:

sourceName
sourceDomain
sourceUrl


==================================================
KOLKATA RELEVANCE
==================================================

A story should actually be relevant to Kolkata.

Do not select a generic India story just because the article mentions Kolkata once.

Examples:

GOOD:

"Kolkata Metro announces new service"

"Kolkata Puja committee announces theme"

"East Bengal signs new player"

"India vs England at Eden Gardens"

BAD:

"India economy grows..."

where Kolkata is only mentioned once.

Create a clear relevance score/function.


==================================================
SPORTS RELEVANCE
==================================================

Sports stories should have a meaningful Kolkata connection.

Prioritize:

Kolkata clubs
Kolkata venues
Bengal teams
Bengal players when the story is locally relevant
matches/events taking place in Kolkata
major sports developments affecting Kolkata


==================================================
EVENT CONTEXT
==================================================

This is important.

The system must understand that some stories belong to events lasting multiple days.

For example:

International Kolkata Book Fair
Durga Puja
Christmas
New Year
Kolkata International Film Festival
major sporting tournaments
etc.

An event can remain relevant for several days.

BUT:

The same article should NOT necessarily remain on the Home page for the entire event.

The EVENT persists.

The STORIES rotate.


Example:

BOOK FAIR

Day 1:
Book Fair opening

Day 2:
Major author appearance

Day 3:
Crowd/attendance story

Day 4:
New book launch

Day 5:
Special cultural event

All are:

eventSlug = "kolkata-book-fair"

but they are different news stories.


==================================================
FESTIVAL CONTEXT
==================================================

Durga Puja should work particularly well.

The system should support phases such as:

Mahalaya
Shashthi
Saptami
Ashtami
Navami
Dashami
Immersion
Bijoya

When a phase is active, Anakin searches should become more relevant to that phase.

For example:

Mahalaya:
- Mahalaya Kolkata
- Durga Puja preparations Kolkata

Saptami:
- Maha Saptami Kolkata
- Kolkata pandal news
- Puja crowd updates

Ashtami:
- Maha Ashtami Kolkata
- Sandhi Puja Kolkata
- Ashtami pandal news

Dashami:
- Vijaya Dashami Kolkata
- Durga Puja immersion Kolkata
- Sindoor Khela Kolkata

Do not put this logic inside the Home React component.

Create a separate event/context utility.


==================================================
ORDINARY DAYS
==================================================

On ordinary days:

Card 2:
select the best fresh CITY story.

Card 3:
select the best fresh SPORTS story.

Prefer stories from the last 24–48 hours.

Freshness should strongly affect ranking.


==================================================
STORY ROTATION
==================================================

A story should not remain on Home forever.

When a story is displayed:

store:

featuredAt
cooldownUntil

Apply a cooldown so another fresh story can replace it the following day.

However, if there is genuinely only one major story available, it may remain temporarily.

Do not artificially remove important breaking news just because 24 hours passed.


==================================================
MULTI-DAY EVENT ROTATION
==================================================

Example:

Durga Puja lasts several days.

The Home page can continue showing Puja-related news throughout the event.

But:

Day 1:
"Puja preparations begin"

Day 2:
"Major pandal opens"

Day 3:
"Ashtami celebrations"

Day 4:
"Dashami immersion"

Do not show the same article every day simply because the event is still active.


==================================================
DEDUPLICATION
==================================================

The same article may appear from multiple Anakin searches.

Prevent duplicates.

Prefer canonical URL.

Fallback:

normalized title + source.

Fallback:

content hash.

The database must not contain ten copies of the same article.


==================================================
IMAGE HANDLING
==================================================

Every dynamic story should attempt to get a relevant image.

Priority:

1. article's official OG image
2. article image
3. official event image
4. Anakin image discovery
5. trusted fallback

Do NOT use an unrelated image merely because the keyword matches.

Store image metadata where useful:

imageUrl
imageSource
imageSourceUrl


==================================================
RANKING
==================================================

Create a readable ranking function.

Conceptually:

score =
    freshness
  + Kolkata relevance
  + source quality
  + event relevance
  + importance
  + category relevance
  - duplicate penalty
  - stale penalty
  - recently-featured penalty


For Card 2:

score CITY stories only.

For Card 3:

score SPORTS stories only.

Do not use arbitrary magic numbers without explaining them in code.


==================================================
API
==================================================

Keep:

GET /api/news

but make it return the appropriate Home selection.

The API should conceptually provide:

{
  city: {...},
  sports: {...}
}

The existing UI can map these to cards.

Do not put ranking/search/event logic inside the React component.


==================================================
HOME UI
==================================================

Preserve the current design EXACTLY.

Do not change:

- section heading
- subtitle
- card dimensions
- card spacing
- typography
- red accent
- image aspect ratio
- hover behavior
- dark theme
- responsive layout
- navigation
- existing Card component styling

Only the data should become dynamic.

The section should continue looking like:

In the news

Papers, fairs and fixtures the city is following.

[ Anandabazar ]
[ Dynamic Kolkata News ]
[ Dynamic Kolkata Sports ]


==================================================
FAILSAFE
==================================================

This is mandatory.

If Anakin fails:

DO NOT break `/home`.

Use the latest persisted stories.

If there are no stories from today:

use recent active stories.

If the database is temporarily unavailable:

use the existing seeded fallback if possible.

Never render a blank card because an external search failed.


==================================================
INGESTION
==================================================

Create a server-side ingestion function.

Something conceptually like:

ingestKolkataNews()

It should:

1. Determine current Kolkata date/time.
2. Determine active event/phase.
3. Generate CITY queries.
4. Generate SPORTS queries.
5. Search Anakin.
6. Extract candidates.
7. Validate sources.
8. Extract images.
9. Deduplicate.
10. Classify CITY vs SPORTS.
11. Calculate scores.
12. Persist stories.
13. Mark stale stories.
14. Update Home eligibility.

Make this idempotent.

Running ingestion twice must not create duplicate records.


==================================================
CRON
==================================================

If the project already uses Vercel deployment,
implement the ingestion as a server-side cron-compatible route.

Run it periodically.

At minimum support daily updates.

The architecture should also support more frequent updates during major events.

Use CRON_SECRET to protect the endpoint.

Do not make the Home page trigger ingestion.


==================================================
CACHE
==================================================

Use the existing caching/revalidation infrastructure.

The Home page should be fast.

A user opening `/home` should NOT wait for Anakin.

After ingestion completes, revalidate the relevant Home/news cache.


==================================================
DEBUGGING
==================================================

Add useful server logs for:

- query
- number of search results
- accepted stories
- rejected stories
- duplicate stories
- selected CITY story
- selected SPORTS story
- image found/not found
- active event/phase

Never log API secrets.


==================================================
TESTS
==================================================

Add tests for:

1. CITY and SPORTS stories remain separated.
2. duplicate articles are rejected.
3. stale stories lose priority.
4. fresh stories rank higher.
5. recently-featured stories receive a cooldown.
6. multi-day events remain relevant.
7. event stories can rotate.
8. Anakin failure does not break Home.
9. missing images do not break Home.
10. ingestion is idempotent.
11. sports card never accidentally selects a generic CITY article.
12. city card never accidentally selects a sports-only article.


==================================================
IMPORTANT IMPLEMENTATION RULE
==================================================

Do NOT overengineer this into a full CMS.

The immediate goal is:

PERSISTENT + DYNAMIC + RELIABLE

not:

complex admin dashboard.

Build on the existing News model and API.

Keep the implementation modular so we can add more editorial categories later.


==================================================
FINAL EXPECTED BEHAVIOUR
==================================================

Every time I open `/home`:

CARD 1:
Anandabazar Patrika remains as the newspaper card.

CARD 2:
Shows the most relevant current Kolkata/city story from persisted news.

CARD 3:
Shows the most relevant current Kolkata sports story from persisted news.

Tomorrow:

CARD 2 can change to a new Kolkata story.

CARD 3 can change to a new sports story.

During a major event:

The event can remain relevant for several days,
but the individual stories should rotate.

During Durga Puja:

The system becomes increasingly Puja-aware
and searches for the current Puja phase.

During Christmas:

Christmas/Kolkata stories become relevant.

During New Year:

New Year/Kolkata stories become relevant.

During a major Kolkata sports event:

The sports card prioritizes that event.

If nothing major happens:

fresh ordinary Kolkata news fills the cards.

If Anakin fails:

the previously persisted news continues showing.

The `/home` page should NEVER depend on live Anakin availability.

Most importantly:

DO NOT change the visual design of `/home`.
Only make the underlying news data intelligent, persistent, dynamic, and reliable.