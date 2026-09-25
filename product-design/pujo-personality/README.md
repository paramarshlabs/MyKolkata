# The Pujo Personality Bible

> **তুমি কোন পুজো?**
> *What kind of Pujo are you?*

MyKolkata's cultural identity system for Durga Puja: nine Pujos, a lore people want to claim, a model that assigns them honestly, and a recommendation graph that turns an identity into a real night in the city. Written for the founder, product designers, developers, brand designers and the growth team, to build from directly.

Prepared on 25 September 2026: fifteen days before Mahalaya.

---

## The idea

During Pujo, Kolkata becomes nine cities that share the same streets. The same lane in Ahiritola belongs to a Shiuli at 5 am, to a bhog queue at 2 pm and to two Night Owls at 3 am. Everyone has built their own Pujo from the same rituals, at different hours, with different people. This feature names those Pujos, lets people claim one, and then gives them more of it. The quiz is only the door; the identity is the product.

## The nine

| | বাংলা | Tagline | Hour |
|---|---|---|---|
| [**Night Owl**](archetypes/01-night-owl.md) | রাতজাগা | Pujo starts after midnight. | 1 am |
| [**Pandal Hunter**](archetypes/02-pandal-hunter.md) | প্যান্ডেল শিকারি | Every pandal. On purpose. | 11 am |
| [**Para Kid**](archetypes/03-para-kid.md) | পাড়াতুতো | Every road leads back to the para. | 8 am |
| [**Pujo Romantic**](archetypes/04-pujo-romantic.md) | মনকেমন | Pujo is a love story. You're in it. | 6 pm |
| [**Pet Pujari**](archetypes/05-pet-pujari.md) | পেটপুজারি | Thakur dekha is the excuse. | 2 pm |
| [**Art Kid**](archetypes/06-art-kid.md) | থিম-পাগল | Every pandal is a gallery if you look long enough. | 4 pm |
| [**Addabaaz**](archetypes/07-addabaaz.md) | আড্ডাবাজ | The pandal is just the venue. | 10 pm |
| [**Dhunuchi**](archetypes/08-dhunuchi.md) | ধুনুচি | When the dhaak starts, so do you. | 8 pm |
| [**Shiuli**](archetypes/09-shiuli.md) | শিউলি | Pujo is a morning thing. | 4 am |

Each owns an hour on the **Pujo Clock** and hands the city on to the next. The Night Owl and the Shiuli pass each other on the Bagbazar ghat steps at 4 am: the only two people who have seen that pandal empty.

## Five decisions that shape everything

1. **Nine archetypes, rooted in Kolkata.** The brief's "Socialite" became the **Addabaaz** (a Bengali word for a Bengali institution, without the class coding), "Main Character" became the **Dhunuchi** (the same energy, from a real Pujo moment), and the **Shiuli** was added so the dawn, heritage and quiet half of Pujo has a home. Reasons in [`02-lore-bible.md`](02-lore-bible.md) §3.
2. **No Spotify at launch.** Since February 2026 a new Spotify app is capped at five users; unlimited access requires 250,000 monthly users; the Developer Policy forbids building user profiles from listening; and about two in three Indian listeners use other platforms. Music comes from the quiz itself, editorial playlists and anthem embeds, through a signal engine that is ready if a source is ever cleared. [`05-music-and-spotify.md`](05-music-and-spotify.md).
3. **An interpretable model, validated before launch.** Fourteen behavioural dimensions, balanced questions, nine prototypes, distance plus centred cosine, a tie-breaker. In simulation: 98.8% of in-character respondents recovered, 97.5% get the same result on retake, and random tapping spreads 10.6% to 11.7% across all nine. [`03-personality-system.md`](03-personality-system.md), [`model/`](model/).
4. **Plans before people.** Compare with friends and squads now; strangers in capped groups on a fixed plan later; one-to-one matching only after that, behind safety gates. No compatibility score next to a stranger, because the science says it would be fiction. [`07-pujo-match.md`](07-pujo-match.md).
5. **Launch on Mahalaya, 10 October 2026, with a ruthless MVP.** Soft launch on 3 October, public at 7 am on Mahalaya, Pujo Wrapped on Dashami. [`12-roadmap.md`](12-roadmap.md).

## What's in this folder

| Deliverable | Document |
|---|---|
| **A.** Research: products, Kolkata, science, 80 sources | [`01-research.md`](01-research.md) |
| **B.** Lore bible: the universe, the clock, the rules | [`02-lore-bible.md`](02-lore-bible.md) |
| **B.** Nine character bibles: identity, lore, DNA, aesthetic, language, the cult, the subculture kit, a visual board | [`archetypes/`](archetypes/) |
| **C.** Personality system: dimensions and the scoring model | [`03-personality-system.md`](03-personality-system.md) |
| **D.** Question bank (generated from the model) | [`04-question-bank.md`](04-question-bank.md) |
| **E.** Music and Spotify | [`05-music-and-spotify.md`](05-music-and-spotify.md) |
| **F.** Recommendation graph | [`06-recommendation-graph.md`](06-recommendation-graph.md) |
| **G.** Social and dating: Pujo Match | [`07-pujo-match.md`](07-pujo-match.md) |
| **H.** Visual bible and image prompts | [`08-visual-bible.md`](08-visual-bible.md) |
| **I.** UX journey and screen specifications | [`09-ux-flow.md`](09-ux-flow.md) |
| **J.** Growth | [`10-growth.md`](10-growth.md) |
| **K.** Partnerships | [`11-partnerships.md`](11-partnerships.md) |
| **L.** Roadmap | [`12-roadmap.md`](12-roadmap.md) |
| The product specification (all 29 sections) | [`13-product-spec.md`](13-product-spec.md) |
| The runnable model, tests and simulation | [`model/`](model/README.md) |
| **M.** Build notes: what shipped for Mahalaya, and where it departs from this bible | [`14-build-notes.md`](14-build-notes.md) |

## Where to start, by role

| Role | Read |
|---|---|
| **Founder** | This page → [`12-roadmap.md`](12-roadmap.md) → [`13-product-spec.md`](13-product-spec.md) §28 (risks) → [`05-music-and-spotify.md`](05-music-and-spotify.md) §1 |
| **Product designer** | [`02-lore-bible.md`](02-lore-bible.md) → any two [archetypes](archetypes/) → [`09-ux-flow.md`](09-ux-flow.md) → [`04-question-bank.md`](04-question-bank.md) |
| **Developer** | [`14-build-notes.md`](14-build-notes.md) → [`13-product-spec.md`](13-product-spec.md) §21 to §24 → [`model/README.md`](model/README.md) → [`03-personality-system.md`](03-personality-system.md) → [`06-recommendation-graph.md`](06-recommendation-graph.md) §4 |
| **Brand designer** | [`08-visual-bible.md`](08-visual-bible.md) → the aesthetic and visual board of each archetype → [`02-lore-bible.md`](02-lore-bible.md) §8 |
| **Growth** | [`10-growth.md`](10-growth.md) → [`07-pujo-match.md`](07-pujo-match.md) §4 to §6 → [`11-partnerships.md`](11-partnerships.md) |

## Pujo 2026

| | Date |
|---|---|
| Mahalaya | Saturday 10 October (no pandal opens before this, by this year's rule) |
| Chaturthi | Thursday 15 October |
| Shashthi | Saturday 17 October |
| Saptami | Sunday 18 October |
| Ashtami | Monday 19 October |
| Navami | Tuesday 20 October |
| Dashami | Wednesday 21 October |
| Last day for immersion | Saturday 24 October |
| Kali Puja | Sunday 8 November |
| Jagaddhatri Puja | 16 to 19 November |

**Fixed in the app:** `frontend/lib/pujo.ts` had Mahalaya on 11 October 2026. The Bisuddha Siddhanta panjika gives Saturday 10 October, and the constant now says so.

## Decisions (all approved on 25 September 2026)

1. **Names.** Approve the nine, subject to the interview round in week one (research §8, A2). "Pet Pujari" and "Dhunuchi" in particular need a sensitivity check with people outside the core team.
2. **Design system.** Approve the proposed DESIGN.md v1.5 additions: nine sigils, card grounds and grades, the DNA chart ([`08-visual-bible.md`](08-visual-bible.md) §3).
3. **Capacity.** Confirm the team for the fifteen-day plan, or cut scope (never the date).
4. **Share-link domain** for cards and QR codes. The build uses the site's own domain (`/pujo/you/{card}`), so a separate domain is optional.
5. **Partnerships in 2026:** none, or one or two labelled pilot collaborations.
6. **Legal review** of the privacy notice and of the Spotify policy interpretation. Approved as a step; still to happen before the soft launch.

## How this was verified

- **Research:** web research on 25 September 2026, with sources and dates in [`01-research.md`](01-research.md) §9. Anything that changes often (Spotify's platform, government Pujo rules, app features, pandal themes) must be re-checked before building on it.
- **Model:** 17 tests pass (`node --test "product-design/pujo-personality/model/*.test.mjs"`); the full simulation report is in [`model/SIMULATION.md`](model/SIMULATION.md). Simulations use synthetic respondents: they show the model is coherent, not that real people feel seen. That is what the soft launch and the "That's me" button measure.
- **Data model:** the Prisma additions in the product spec validate against the app's existing `schema.prisma` with the Prisma CLI.
- **Not yet done:** interviews with real people. The first week of the roadmap schedules them.
