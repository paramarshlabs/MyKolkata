# Product specification: Pujo Personality

The build document. Each section is short and points to the chapter of the bible that holds the detail. Numbered sources refer to [`01-research.md`](01-research.md) §9.

| | |
|---|---|
| Feature | Pujo Personality (working name in the brief: Pandal Pujo Personality) |
| Public name | **তুমি কোন পুজো?** / *What kind of Pujo are you?* |
| Model version | 2026.1 |
| Launch | Saturday 10 October 2026 (Mahalaya), 7 am |
| Status | Design complete; build not started |

---

## 1. Product concept

A cultural identity system for Kolkata, entered through a two-minute quiz. It tells a person which of nine Pujos is theirs (Night Owl, Pandal Hunter, Para Kid, Pujo Romantic, Pet Pujari, Art Kid, Addabaaz, Dhunuchi, Shiuli), gives them a lore, a card and a vocabulary they want to claim, and turns that identity into a real Pujo: routes, pandals, plates, looks, songs, events and, later, people. The identity is the layer; the quiz is only the door.

## 2. Problem

- Kolkata's Pujo is enormous (around 3,000 community pujos in the city [44]) and every existing product answers only "where" (§4.4 of the research). None knows the person, so none can personalise, and none gives anyone a reason to share.
- People already talk about Pujo as identity ("I'm a North person", "I only go at night", "Team Sabeki") without a shared vocabulary.
- MyKolkata has places, maps and a Pujo page, but no reason for someone to tell a friend about it, and no signal about what each person wants.

## 3. Target audience

| Segment | Why they matter | What they need |
|---|---|---|
| **Kolkata, 18 to 30** (primary) | The share-driven core; planners of their own Pujo | An identity worth claiming; routes that fit |
| **Homecomers** | Fly in for Pujo; intense, compressed, emotional | Dense routes; the "Home for Pujo" badge |
| **First-timers** (students and workers from elsewhere, visitors) | Want in, don't know where to start | An archetype that explains Pujo to them in their own terms |
| **The diaspora** | Pujo is global; nostalgia is strong | *Which Pujo are you, from far away?*, playlists, recipes |
| **Under 18** | Will take it anyway | A full, fun, private experience with nothing stored |

Three people to design for:

- **Rimi, 21, Jadavpur.** Reads every placard, shoots film, hates queues. *Art Kid, with a Shiuli streak.*
- **Arjun, 26, a software engineer in Bengaluru, home for five days.** Walks North every night with school friends. *Night Owl, home for Pujo.*
- **Sana, 19, Park Circus.** Knows every kebab stall and every pandal next to one. Doesn't do anjali; does everything else. *Pet Pujari, with an Addabaaz streak.*

## 4. Cultural insight

During Pujo, Kolkata becomes nine cities that share the same streets. Everyone has built their own Pujo from the same rituals, at different hours, in different paras, with different people. The product names those Pujos. And *sarbojanin*, the word on half the city's pandal banners, means "for everyone": the identity system must be claimable by every Kolkatan, whatever their religion or community. ([`02-lore-bible.md`](02-lore-bible.md) §1, §4.)

## 5. Archetype system

Nine archetypes on a Pujo Clock (each owns an hour), with kin, complement and spark relationships, streaks (secondary archetypes), pure results, fourteen squad roles and status badges. ([`02-lore-bible.md`](02-lore-bible.md); config: [`model/archetypes.json`](model/archetypes.json).)

## 6. Lore bible

One character bible per archetype: identity, a 300-word lore, behavioural DNA, aesthetic, language, the cult, the subculture kit and a visual board. ([`archetypes/`](archetypes/).)

## 7. Question bank

Thirteen core questions, five rapid-fire swipes, fourteen tie-breakers, four alternates and six unscored preference chips, each with evidence, rationale and archetype signal. ([`04-question-bank.md`](04-question-bank.md), generated from [`model/questions.json`](model/questions.json).)

## 8. Spotify integration

**Not in 2026.** A new Spotify app is capped at five users and needs 250,000 MAU for unlimited access [1][3]; the Developer Policy forbids building user profiles from listening [7]; most Indian listeners aren't on Spotify [50]. Music comes from the quiz, editorial playlists and anthem embeds; a source-agnostic signal engine is designed and waiting. ([`05-music-and-spotify.md`](05-music-and-spotify.md).)

## 9. Personality algorithm

Answers carry evidence on fourteen dimensions; each question is balanced so that random answering is neutral; the estimate is compared to nine prototypes by weighted distance and centred cosine; a softmax gives probabilities; a neutral-prior calibration keeps random respondents evenly spread; a tie-breaker resolves close calls. Validated in simulation: 98.8% recovery at realistic consistency, 97.5% retest stability, random respondents spread 10.6% to 11.7% per archetype. ([`03-personality-system.md`](03-personality-system.md); code: [`model/scoring.mjs`](model/scoring.mjs).)

## 10. Recommendation architecture

Identity vector blended with a learned taste vector (identity never below 50%), preference filters, context (day, hour, zone, rain, crowd forecast), a scoring function, MMR diversification with streak and wildcard slots, archetype-voiced explanations, and one separate labelled sponsored slot. ([`06-recommendation-graph.md`](06-recommendation-graph.md).)

## 11. Pandal recommendation system

Pandals carry trait vectors and facets (type, theme, artist, hours, arati, public bhog, dhunuchi competition, crowd curve, accessibility, approach safety, committee verification). Nine route templates, one per archetype, re-verified for 2026. Safety rules for night routes and crowd peaks. ([`06-recommendation-graph.md`](06-recommendation-graph.md) §3.1, §4, §7.)

## 12. Food recommendation system

Places carry the same trait vectors plus cuisine family, dishes, diet options, price and hours. Diet is a hard filter; every family has vegetarian routes; bars are 21+ and never a Pujo stop. ([`06-recommendation-graph.md`](06-recommendation-graph.md) §3.2, §8.1.)

## 13. Fashion recommendation system

Content first (looks, draping, where Kolkata shops), organised by seven style families mapped to archetypes; products only later, labelled, through partners. ([`06-recommendation-graph.md`](06-recommendation-graph.md) §8.2.)

## 14. Social graph

Friends through compare links; squads of three to twenty with roles and a squad route; guesses between connected friends. Pulses (city, zone, para, campus) behind thresholds. No contact access. ([`07-pujo-match.md`](07-pujo-match.md) §4–5; [`10-growth.md`](10-growth.md) §4.7.)

## 15. Future dating system

A ladder: Compare → Squad → Pujo Plans (strangers in capped groups on a fixed plan) → Pujo Match (one-to-one, opt-in, verified). Compatibility as "Pujo Sync" in five named components, combined with a geometric mean, shown as words; no percentage next to a stranger. Safety designed from the first rung. ([`07-pujo-match.md`](07-pujo-match.md).)

## 16. Viral loop

Broadcast (Story card and link sticker, Add Yours chains) plus direct (compare, squad, guess). Estimated K ≈ 0.78 before measurement; seeded at Mahalaya with creators and campuses; Pujo Wrapped on Dashami. ([`10-growth.md`](10-growth.md).)

## 17. Partnership model

Native, labelled, relevance-gated formats (sponsored card, presented route, collaborations, merch, affiliate, committee pages, aggregated insights). The identity is never for sale. No streaming data, no Roots or Romance data, no minors. ([`11-partnerships.md`](11-partnerships.md).)

## 18. Visual system

"Nine films, one city", inside MyKolkata's DESIGN.md v1.4: nine sigils, nine card grounds and grades from the existing palette, the Pujo DNA alpona chart, the reveal as the one sanctioned motion, share cards with correctly rendered Bengali. ([`08-visual-bible.md`](08-visual-bible.md).)

## 19. UX flow

Landing → thirteen questions → rapid-fire → tie-breaker if close → reading → reveal → lore and DNA → tune → your Pujo → share, compare, squad → save. Under 2.5 minutes to the reveal; works offline after the first load. ([`09-ux-flow.md`](09-ux-flow.md).)

## 20. Screens

| Screen | Purpose | Ships |
|---|---|---|
| S1 Landing | First tap | Mahalaya |
| S3–S15 Questions | Thirteen decisions | Mahalaya |
| S16 Rapid-fire | Badges, delight | Mahalaya |
| S17 Tie-breaker | Resolve close calls | Mahalaya |
| S18 Reading | The drumroll | Mahalaya |
| S19 Reveal | The moment | Mahalaya |
| S20 Lore, DNA, people, "That's me?" | Belonging and accuracy | Mahalaya |
| S22 Tune | Preferences and age | Mahalaya |
| S23 Your Pujo | Recommendations | Mahalaya (curated), Shashthi (personalised) |
| S24 Share | Distribution | Mahalaya |
| S25–S26 Invite, Compare | Direct loop | Mahalaya |
| S27 Squad | Group loop | Shashthi |
| S28 Explore layer | The map, by archetype | Shashthi |
| S29–S30 Save, Profile | Retention, control | Shashthi |
| S31 Retake, Evolve | Stability | Dashami |
| S32 Under 18 | Safe path | Mahalaya |
| S33 States | Offline, errors, rain | Mahalaya |
| S34 Pujo Wrapped | Second share moment | Dashami |
| S35 Public archetype pages | Search, tagging | Mahalaya |

Full specs: [`09-ux-flow.md`](09-ux-flow.md) §3.

## 21. Data model

> **Launch build:** deferred. At launch a result lives on the phone and a shared card lives in its link; see [`14-build-notes.md`](14-build-notes.md) §3. These tables are the plan for revocable links, squads and server recompute.

Additions to [`frontend/prisma/schema.prisma`](../../frontend/prisma/schema.prisma), following its conventions (cuid ids, snake_case table maps, timestamps). Supabase Auth owns users; `userId` is the Supabase user id.

```prisma
// One revealed identity. Stored only with consent (save, share, or sign-in).
model PujoResult {
  id            String    @id @default(cuid())
  slug          String    @unique              // unguessable public id for /pujo/you/{slug}
  userId        String?                        // Supabase user id, once signed in
  deviceId      String?                        // random httpOnly-cookie id, for ownership before sign-in
  season        Int                            // 2026
  modelVersion  String                         // "2026.1"
  primary       String                         // archetype id
  secondary     String?
  band          String                         // clear | leaning | close
  pure          Boolean   @default(false)
  selfChosen    Boolean   @default(false)      // chose between two on a close call
  probabilities Json                           // { night_owl: 0.44, ... }
  vector        Json                           // fourteen dimensions
  confidence    Json
  answers       Json?                          // [{ questionId, optionIds }]; set to null after 90 days
  badges        String[]  @default([])         // team_sabeki, last_metro, ...
  status        String?                        // local | homecomer | first_pujo | far_away
  displayName   String?                        // optional, filtered
  paraName      String?                        // optional, filtered
  feedback      String?                        // that_is_me | mostly | not_me
  feedbackPick  String?                        // "I'm more of a…"
  isCurrent     Boolean   @default(true)
  isPublic      Boolean   @default(true)
  deletedAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  squads PujoSquadMember[]

  @@index([userId, season, isCurrent])
  @@index([primary, season])
  @@map("pujo_results")
}

model PujoPreference {
  userId    String   @id
  diet      String?
  move      String?
  budget    String?
  turf      String?
  ageBand   String?
  updatedAt DateTime @updatedAt

  @@map("pujo_preferences")
}

// The learned taste vector (03-personality-system.md §10).
model PujoTaste {
  userId    String   @id
  vector    Json
  effective Float    @default(0)               // n_eff
  updatedAt DateTime @updatedAt

  @@map("pujo_tastes")
}

model PujoInvite {
  id           String    @id @default(cuid())
  code         String    @unique
  kind         String                          // compare | squad | guess
  fromResultId String
  guess        String?                         // archetype id, for guesses
  squadName    String?
  expiresAt    DateTime?
  createdAt    DateTime  @default(now())

  members PujoSquadMember[]

  @@index([fromResultId])
  @@map("pujo_invites")
}

model PujoSquadMember {
  inviteId String
  resultId String
  role     String?                             // navigator, lens, ...
  joinedAt DateTime @default(now())

  invite PujoInvite @relation(fields: [inviteId], references: [id], onDelete: Cascade)
  result PujoResult @relation(fields: [resultId], references: [id], onDelete: Cascade)

  @@id([inviteId, resultId])
  @@map("pujo_squad_members")
}

// One row per purpose, per grant or withdrawal (DPDP).
model PujoConsent {
  id            String   @id @default(cuid())
  userId        String?
  deviceId      String?
  purpose       String                         // save_result | personalise | public_card | compare_visible | notifications
  granted       Boolean
  noticeVersion String
  createdAt     DateTime @default(now())

  @@index([userId, purpose])
  @@index([deviceId, purpose])
  @@map("pujo_consents")
}

// Trait vectors for anything recommendable that is a Place (pandals, cafés, cabins, ghats).
model PlaceTrait {
  placeId   String   @id
  vector    Json                               // fourteen dimensions, 0.5 = nothing special
  facets    Json?                              // cuisine, diet, price, late, ...
  taggedBy  String?
  updatedAt DateTime @updatedAt

  @@map("place_traits")
}

// A pandal's season: the parts that change every year.
model PandalSeason {
  id                  String    @id @default(cuid())
  placeId             String
  season              Int
  kind                String                   // sabeki | theme | replica | bonedi | para | community
  theme               String?
  artist              String?
  hours               Json?                    // per Pujo day
  aratiTimes          Json?
  bhog                Json?                    // { public: true, times: [...] }
  dhunuchiAt          DateTime?
  crowdCurve          Json?                    // expected crowd by hour and day
  accessibility       Json?
  approachSafeAtNight Boolean   @default(false)
  photoRules          String?
  awards              String[]  @default([])
  verifiedByCommittee Boolean   @default(false)
  editorialStatus     String    @default("DRAFT")
  updatedAt           DateTime  @updatedAt

  @@unique([placeId, season])
  @@index([season, kind])
  @@map("pandal_seasons")
}
```

Changes to existing models:

- **Pandals become Places.** The current `Pandal` model (name, location, description, image, distance, rating) is too thin and has no coordinates. Store pandals as `Place` rows in a `pandal` category, with `PlaceTrait` and `PandalSeason`; retire `Pandal` after migrating its seed data.
- **Routes are Collections.** Add `archetype String?` and `kind String @default("list")` to `Collection` (routes use `kind = "route"`), and `plannedAt DateTime?` and `dwellMinutes Int?` to `CollectionItem`.
- **Events are Experiences.** Add `traits Json?` and `ageLimit Int?` to `Experience`.
- **Interactions generalise.** Add `entityType String @default("place")`, `entityId String?` and `weight Float?` to `PlaceInteraction`, so saves, route starts and check-ins on experiences and collections feed the taste vector.
- **`TinderProfile`** (places rated with stars) is repurposed as *Swipe the City* for places only. It must never hold people.

Row-level security: all new tables are written only by server routes (Prisma, service role). Public reads go through `/api/pujo/results/{slug}`, which returns only public card fields.

## 22. API

> **Launch build:** no endpoints yet; see [`14-build-notes.md`](14-build-notes.md) §3.

Next.js route handlers under `frontend/app/api/pujo/`.

| Method and path | Purpose | Notes |
|---|---|---|
| `GET /api/pujo/config` | Dimensions, archetypes (public fields), questions, calibration, model version | Static; cached at the edge; used for client-side scoring |
| `POST /api/pujo/results` | Save a result | Body: answers, optional tie-breaker, display and para names, status, consents. The server recomputes; the client result is never trusted. Returns slug. Rate-limited. Refuses if the age band is under 18. |
| `GET /api/pujo/results/{slug}` | A public card | Archetype, streak, band, badges, optional display name. Never answers or vectors. |
| `PATCH /api/pujo/results/{slug}` | Feedback, visibility | Owner only (session or device cookie) |
| `DELETE /api/pujo/results/{slug}` | Delete one result | Owner only; leaves a tombstone for the link |
| `DELETE /api/pujo/me` | Delete everything | Signed-in; results, preferences, taste, invites, consents (except the withdrawal record) |
| `GET /api/pujo/me/export` | Download my Pujo data | JSON |
| `GET /api/pujo/og/{slug}` | Share image (`format=story\|feed\|link`) | Pre-rendered Bengali paths; cached; no personal data beyond the optional display name |
| `POST /api/pujo/invites` | Create a compare, squad or guess link | Returns code and URL |
| `GET /api/pujo/invites/{code}` | Invite state | Kind, sender's archetype, squad progress |
| `POST /api/pujo/invites/{code}/join` | Join with a saved result | Returns the compare payload or squad state |
| `GET /api/pujo/compare/{code}` | Compare payload | Both identities, component words, labelled plan match, pair copy, plan |
| `GET /api/pujo/recommendations` | Ranked items | Query: kind (route, pandal, food, event), day, hour, zone, limit. Each item has a reason and a `sponsored` flag. |
| `POST /api/pujo/events` | Batched interaction events | Session or device id; feeds the taste vector; queued offline by the client |
| `GET /api/pujo/pulse` | City, zone, para or campus distribution | Returns 204 below the thresholds in the growth doc |
| `GET /api/pujo/archetypes/{id}` | Public archetype page data | Static |

Owner verification before sign-in uses a random, httpOnly device cookie set when a result is saved. After sign-in, results are attached to the user id.

## 23. Privacy requirements

Applies India's Digital Personal Data Protection Act 2023 and Rules 2025 (main obligations from 13 May 2027 [77]); the launch meets them now.

| Requirement | Implementation |
|---|---|
| Notice | A short notice in English and Bengali at the save step, listing each purpose. |
| Purpose-specific consent | Separate consents for saving, personalisation, a public card, compare visibility and notifications, each withdrawable in the profile. |
| Minimisation | The quiz scores on the device. Nothing is stored until a person saves, shares or signs in. No contacts, no location history, no streaming data, no free-text answers. |
| Children | Under 18: nothing stored server-side, no tracking or behavioural monitoring, no targeted content, no people features. |
| Retention | Raw answers: 90 days, then deleted (the result stays). Interaction events: 18 months. Pseudonymous analytics: 13 months. Deleted results: a tombstone with no data. Consent records: kept as long as needed to demonstrate consent. |
| Rights | Access (export), correction (retake, edit names), erasure (Delete my Pujo, immediate), a grievance contact with published response times. |
| Sensitive inference | Never infer religion, caste, community, orientation, politics, health or sleep. Roots and Romance never used commercially. |
| Security | Server-only writes; row-level security; unguessable slugs; no personal data in URLs; encrypted at rest (Supabase); least-privilege keys. |
| Processors | Data processing agreements with the hosting, database and analytics providers. |
| Breach | A written breach procedure that meets the DPDP Rules' notification timelines. |

## 24. Analytics events

Pseudonymous (a rotating session id; a stable id only after sign-in with consent). No names, no free text, no precise location. Suppressed entirely for under-18s beyond aggregate counts.

| Event | Properties |
|---|---|
| `pujo_landing_viewed` | source, ref, invite kind |
| `pujo_quiz_started` | source, model version |
| `pujo_question_answered` | question id, option ids, ms to answer, position |
| `pujo_question_back` | question id |
| `pujo_quiz_abandoned` | last question id, elapsed ms |
| `pujo_rapidfire_completed` / `_skipped` | swipes |
| `pujo_tiebreaker_shown` / `_answered` | dimension, option |
| `pujo_result_revealed` | primary, secondary, band, pure, model version, elapsed ms |
| `pujo_result_feedback` | value, picked archetype |
| `pujo_lore_viewed` | archetype, scroll depth |
| `pujo_dna_opened` | petal |
| `pujo_preferences_set` | which facets were set (not values) |
| `pujo_age_band_set` | band |
| `pujo_share_opened` / `_completed` | format, channel |
| `pujo_invite_created` | kind |
| `pujo_invite_opened` / `_accepted` | kind |
| `pujo_compare_viewed` | pair kind |
| `pujo_guess_resolved` | correct (bool) |
| `pujo_squad_created` / `_joined` / `_card_shared` | size |
| `pujo_rec_impression` / `_opened` / `_saved` / `_dismissed` | kind, item id, rank, slot (primary, streak, wildcard, sponsored), reason dimension |
| `pujo_route_started` / `_stop_checked_in` | route id, stop index |
| `pujo_map_filter_used` | filter |
| `pujo_signup_from_result` | — |
| `pujo_retake_started` / `pujo_evolution_offered` / `_chosen` | from, to |
| `pujo_wrapped_viewed` / `_shared` | — |
| `pujo_data_exported` / `pujo_data_deleted` | — |
| `pujo_consent_changed` | purpose, granted |

## 25. MVP (Mahalaya, 10 Oct 2026)

Landing; thirteen questions, rapid-fire, tie-breaker; client-side scoring from config with server recompute; the reveal; nine lore pages; public archetype pages; the DNA; "That's me"; share cards with correct Bengali; compare links and public result pages; curated recommendations (three routes, eight pandals, three plates per archetype); age gate and under-18 path; privacy notice and deletion; analytics; offline quiz. ([`12-roadmap.md`](12-roadmap.md) §1.)

## 26. Phase 2 (Shashthi 2026 to Pujo 2027)

Squads and guesses; personalised ranking over tagged pandals and places; committee-claimed pandal pages; tonight's route; the Bhog Map; playlists and anthems; sign-in and profiles; Pujo Wrapped; pulses; the Sound Map and lineup card; the Pandal Diary and Pandal Archive; merch; the Christmas-week Pujo Plans pilot; "Your Kolkata" year-round content; DPDP programme complete by May 2027.

## 27. Phase 3 (Pujo 2027 onwards)

Pujo Plans (public, if gate 3 passes); packaged partnerships; the Sharodiya annual; archetype communities at scale; Pujo Match beta (only if gate 4 passes); a streaming connection only with Extended Quota and Spotify's written confirmation; diaspora Pujos.

## 28. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Religious offence (trivialising the goddess or ritual) | Medium | High | No deity archetypes or faces; ritual framed as culture; sensitivity review of every line; a takedown path |
| An archetype reads as an insult (class, body, gender) | Medium | High | "What they reject" sections; banned-joke rules; the interview round (A2 in the research); "That's me" per archetype |
| Political sensitivity (a new state government, committees tied to politicians, the DJ ban, the cancelled carnival) | Medium | Medium | Strictly non-partisan; no politician-linked promotion; no commentary on policy |
| Night safety incident linked to a route | Low | Very high | Lit-and-busy routing after 11 pm; share-my-plan; 112; no solo-night glamour; crowd-peak avoidance |
| Crowd crush at a recommended pandal | Low | Very high | Crowd forecasts; no MyKolkata gatherings at peak; never direct everyone to one place at one time |
| Bengali renders wrongly on share cards | High (if unchecked) | Medium | Client canvas rendering; pre-rendered Bengali paths for server images; test on day one |
| Spotify policy or quota blocks music plans | Certain (for 2026) | Low (already designed around) | No Spotify dependency |
| Timeline (fifteen days to launch) | High | High | A ruthless MVP; scope moves, dates don't; soft launch on 3 October |
| Data quality (themes, hours, diversions change yearly and daily) | High | Medium | Editorial tagging; committee claims; daily diversion updates; "suggest a correction" |
| Congested mobile networks near pandals | High | Medium | Offline-first quiz, client-side scoring and cards, queued analytics |
| Results feel generic (Barnum) or flip on retake | Medium | High | Specific lore; tested stability (97.5%); sticky identity; the mirror question |
| Privacy breach or misuse | Low | High | Minimisation, deletion, security, DPDP programme |
| Partner content erodes trust | Medium | Medium | Labels, relevance floor, caps, never on identity cards |
| Pujo Match harms (harassment, catfishing, minors) | Medium if rushed | Very high | The ladder and its gates; verification; groups first; moderation |
| Rain or a cloudburst during Pujo | Medium | Medium | Rain mode; Metro-first routes |
| Novelty fades after Pujo (the BeReal curve) | High | High | Year-round identity, the diary, the archive, seasonal moments, the yearly retake |

## 29. What not to build

- A Spotify login, or any use of listening timestamps.
- A quiz that locks the result behind a share, a sign-up or an invite.
- Swiping on people, star ratings of people, a "people near you" view, live location.
- A compatibility percentage next to a stranger's face.
- Archetypes built on deities, the idol's face on any card, or "Which goddess are you?".
- Sixteen types, or any claim of psychological validity.
- A machine-learning classifier for the identity.
- Public pandal-count leaderboards that reward rushing through crowds.
- City statistics without the data behind them, or animated counters.
- Sponsored logos on identity cards, banners in the quiz, or targeting from Roots, Romance, streaming data or minors.
- Contact-list access, or messages sent on anyone's behalf.
- A native app before the web experience has proven itself.
- Any people-facing feature for under-18s.
