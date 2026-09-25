# L. Roadmap

From today to Pujo 2027 and beyond.

Numbered sources refer to [`01-research.md`](01-research.md) §9.

Today is Friday 25 September 2026. Mahalaya is Saturday 10 October (15 days). Shashthi is Saturday 17 October (22 days). Dashami is Wednesday 21 October. The last day for immersion is Saturday 24 October.

Assumed team for the launch: a product lead (the founder), two full-stack developers, one designer, one editor-writer plus two temporary editors for tagging, one growth lead, and contracted photographers. Scale the scope, not the dates, if the team is smaller.

---

## 1. The launch MVP

### Must have for Mahalaya (10 Oct)

- Landing page, thirteen questions, the rapid-fire round, the tie-breaker, the reveal.
- The scoring engine ported from `product-design/pujo-personality/model/` into the app (`frontend/lib/pujo-personality/`), driven by the JSON config, with the model tests moved into `frontend/tests/`.
- Nine lore pages and nine public archetype pages.
- The Pujo DNA chart and the "That's me" feedback.
- Share cards in Story, Feed and link-preview formats, with Bengali that renders correctly (client-side canvas and pre-rendered name paths for the server).
- Compare links with a public result page.
- Curated recommendations per archetype: three routes, eight pandals and three plates each, editorially chosen.
- The privacy notice, the age question, the under-18 path, and "Delete my Pujo".
- Analytics events (the list in [`13-product-spec.md`](13-product-spec.md) §24).
- The quiz working offline after first load.

### Should have by Shashthi (17 Oct)

- Squads and Guess my Pujo.
- Personalised ranking over tagged pandals and places (the scoring in [`06-recommendation-graph.md`](06-recommendation-graph.md) §4).
- Pandal pages with the new fields, and the first committee-claimed pages.
- "Tonight's route", daily.
- The Bhog Map, first version.
- Nine editorial playlists; anthem embeds.
- Sign in to save.

### Could have during Pujo

- City and campus pulses, once the thresholds are met.
- Archetype channels.
- **Pujo Wrapped on Dashami** (promote to "should" if the team has the capacity: it is the second share moment).

### Won't have in 2026

- Spotify or any streaming connection.
- Pujo Plans and Pujo Match.
- Paid sponsored cards (one or two pilot collaborations at most).
- A merch store (pre-orders at most).
- A native app.

## 2. Fifteen days to Mahalaya

| Dates | Product and engineering | Design and editorial | Growth |
|---|---|---|---|
| **Fri 25 Sep** | Review this bible. Decide: names, launch date, scope. Fix the Mahalaya date in `frontend/lib/pujo.ts` (it said 11 Oct; the panjika says 10 Oct). **Done, and the build started: see [`14-build-notes.md`](14-build-notes.md).** | | |
| **Sat 26 – Sun 27 Sep** | Port the engine to TypeScript; schema migration (§21 of the spec); quiz shell. | Nine sigils; card templates; quiz screens. Copy sign-off and a native Bengali proofread of every name and line. Kumartuli and food shoots. | Creator long-list (three per archetype). |
| **Mon 28 – Wed 30 Sep** | Quiz flow, reveal, lore pages; client-side card rendering; server previews with pre-rendered Bengali; analytics; privacy and age. | Tag 150 pandals, 150 food places and 27 routes with the rubric. Fashion lookbook and dawn shoots. | Creator outreach; campus ambassadors at three colleges. |
| **Thu 1 – Fri 2 Oct** | Compare links, public pages, curated recommendations; QA; performance on a mid-range Android phone on throttled 3G; accessibility pass. | Final assets; licensing of 2025 pandal-night photography. | Soft-launch invitations. |
| **Sat 3 – Thu 8 Oct** | **Soft launch to about 300 people.** Measure, fix, recalibrate. Build squads, Guess, tonight's route. | Iterate copy from "Not me" feedback. | Measure share rate and invites; brief creators. |
| **Fri 9 Oct** | Freeze. Load test. On-call rota for Pujo. | Embargoed creator kits. | Press notes to the city's features desks. |
| **Sat 10 Oct, 7 am** | **Launch.** | | The Add Yours chain starts. |

## 3. Pujo live operations (10 – 24 Oct)

| Window | Work |
|---|---|
| 10 – 16 Oct | Ship squads, Guess and pandal pages. The Chaturthi Sweep route on 15 Oct. Daily monitoring of the funnel and "That's me" by archetype. |
| 17 – 20 Oct | Tonight's route at 6 pm daily; police diversions loaded each morning; crowd notes; rain mode if needed; moderation on shared names; a one-hour takedown path for anything wrong in a route. |
| 21 Oct | Pujo Wrapped. *Asche bochor abar hobe.* |
| 22 – 24 Oct | Bijoya content; the evolution offers; a first data review. |

**On-call during Pujo:** one developer and one editor on shift each evening until 2 am, and a morning check at 7 am for diversions and route accuracy.

## 4. Decision gates

| Gate | When | Pass | If it fails |
|---|---|---|---|
| **1. Launch** | 8 Oct (soft launch) | "That's me" or "Mostly" ≥ 75%, no archetype below 60%; completion ≥ 65%; median time ≤ 180 s | Fix the weakest archetype's questions and copy (a one-day turnaround is realistic), or launch with the claims toned down |
| **2. Invest** | 24 Oct | Share rate ≥ 20%; measured K ≥ 0.5; ≥ 20% of completers saved or started a route | Rethink the loop before building the 2027 programme |
| **3. Pujo Plans** | Before any public launch | A closed pilot (Christmas week 2026) with reports below 0.5 per 100 participants and a "felt safe" rating of at least 4.5, plus a women's-safety review | Keep Plans closed; improve safety design |
| **4. Pujo Match** | Before any beta | Plans running at scale for a full season with gate 3's metrics met, plus an external safety review | Don't build it |

## 5. After Pujo (late October to December 2026)

- **Research:** twenty interviews across the archetypes, including people who pressed "Not me"; analysis of "That's me" by archetype; model version 2026.2.
- **Kolkata Sound Map v1** (about 300 artists) and the Pujo lineup card.
- **Pandal Diary:** log what you saw; pairwise "this or that" to build your own ranked list (the Beli mechanic).
- **The Pandal Archive:** every 2026 theme and artist, credited.
- **Committee pages** at scale.
- **Merch pilot:** the para tee, the Hunter's map, Bijoya letters, the Adda Deck.
- **Kali Puja (8 Nov) and Jagaddhatri (16 – 19 Nov):** Night Owl and Art Kid content; the Chandannagar lights trip.
- **Christmas week on Park Street:** the closed Pujo Plans pilot (verified, groups only).
- **Design "Your Kolkata":** the year-round identity (§7).

## 6. Winter to spring 2027

- **The Book Fair** (late January to February) and **Saraswati Pujo:** archetype content for Shiulis, Art Kids, Romantics and Dhunuchis.
- **Poila Baishakh** (mid-April): the first non-Pujo season of the identity.
- **Data protection:** the DPDP Rules' main obligations apply from 13 May 2027 [77]. Before then: consent records per purpose, the children's rules (verifiable parental consent, or keeping under-18 data out entirely, as the launch design already does), a retention schedule, breach procedures and a grievance contact.
- **The Sharodiya**, MyKolkata's Pujo annual, commissioned for release before Pujo 2027.

## 7. Pujo 2027

- The full system: personalised recommendations everywhere, squads, Pujo Plans (if gate 3 passed), packaged partnerships, the Sharodiya, merch, archetype channels, Pujo Wrapped.
- Pujo Match beta only if gate 4 passes.
- A streaming connection only if MyKolkata qualifies for Spotify's Extended Quota (250,000 MAU) and has Spotify's written confirmation for the use case ([`05-music-and-spotify.md`](05-music-and-spotify.md) §3).
- The yearly retake at Mahalaya: *Has your Pujo changed?*

## 8. The long-term ecosystem

The same identity, extended one domain at a time: **Pujo → Kolkata → food → fashion → events → music → people**.

| Stage | What the identity does |
|---|---|
| **Pujo** (2026) | Which Pujo is yours; routes, plates, looks, songs |
| **Your Kolkata** (2027) | The same nine, all year: the Night Owl's Park Street, the Shiuli's Book Fair, the Pet Pujari's winter |
| **Food** | Personal rankings, the Bhog Map, legacy eateries, the Pet Pujari's calendar |
| **Fashion** | Looks by archetype, handloom collaborations, draping content |
| **Events** | Archetype events and ticketing partnerships |
| **Music** | The Sound Map, playlists, gigs by archetype |
| **People** | Squads, then Plans, then (carefully) Match |
| **Beyond Kolkata** | Diaspora Pujos (Delhi's CR Park, Bengaluru, London, New Jersey): *Which Pujo are you, from far away?* |

The archetypes become a vocabulary the city uses without thinking, which is the whole ambition: someone says "I'm a Night Owl" and everyone in the room understands.
