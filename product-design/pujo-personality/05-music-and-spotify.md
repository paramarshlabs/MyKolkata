# E. Music and Spotify

What Spotify's platform actually allows in September 2026, why the launch should not depend on it, and the music system to build instead.

Sources are numbered as in [`01-research.md`](01-research.md) §9. Spotify changes its platform often: re-check every item marked [D] before building anything that depends on it.

---

## 1. The decision

**Do not build Spotify login for Pujo 2026.** Music stays in the product, through the quiz, editorial playlists and embedded anthems, with a signal engine ready for a connected source if one is ever cleared.

Four reasons, each documented:

1. **A new app can have five users.** Since 11 February 2026, a Development Mode app needs its owner on Spotify Premium, allows one Client ID per developer, and serves at most five allow-listed users, on a reduced set of endpoints [1][2][3].
2. **Unlimited access needs 250,000 monthly users first.** Since 15 May 2025, Extended Quota Mode is available only to legally registered organisations running a launched service with at least 250,000 MAU, available in key Spotify markets and commercially viable; review takes up to six weeks [3].
3. **The use case in the brief conflicts with the Developer Policy.** Section III.13 prohibits analysing Spotify content "for any purpose, including… creating new or derived listenership metrics… user metrics, or building profiles of users, including for the purpose of targeting them with advertising" [7]. A personality derived from listening is a profile of the user.
4. **Most of the audience isn't on Spotify anyway.** In India, YouTube (32%) edges Spotify (31%), followed by Amazon Music (17%), JioSaavn (16%), Gaana (11%) and Apple Music (8%) [50]. A Spotify-only signal would miss most people.

---

## 2. The platform in September 2026

### 2.1 Timeline

| Date | Change | Source |
|---|---|---|
| 27 Nov 2024 | New apps lose Related Artists, Recommendations, Audio Features, Audio Analysis, access to algorithmic and Spotify-owned editorial playlists, and 30-second preview URLs in multi-get responses | [10] |
| 15 May 2025 | New Developer Policy takes effect. Extended Quota restricted to established organisations with 250k+ MAU | [3][7] |
| 6 Feb 2026 | Development Mode tightened: Premium owner, one Client ID, five users, fewer endpoints. Rationale: automation and AI have changed the risk profile; Development Mode "should not be relied on as a foundation for building or scaling a business" | [1][9] |
| 11 Feb 2026 | Applies to new Development Mode Client IDs | [1] |
| 9 Mar 2026 | Premium requirement and user cap apply to existing integrations (endpoint changes for existing apps postponed) | [1] |

### 2.2 What changed for Development Mode apps (February 2026 migration guide)

- **Removed:** batch lookups (`GET /tracks`, `/albums`, `/artists` and similar), new releases, browse categories, an artist's top tracks, other users' profiles and playlists, markets [2].
- **Changed:** library actions consolidated into `/me/library` using URIs; playlist `tracks` renamed `items`, and playlist contents are returned only for playlists the user owns or collaborates on [2].
- **Search:** maximum 10 results per request (was 50), default 5 [2].
- **Fields removed:** track `popularity`, `available_markets`, `linked_from`; album `label`, `popularity`; artist `followers`, `popularity`; and from the user profile, `country`, `email`, `explicit_content`, `followers`, `product` [2].
- **Deprecated on artist objects:** `genres`, `popularity`, `followers` [5].

### 2.3 The scopes, and which ones MyKolkata would ever need

| Scope | Unlocks | Would we use it? |
|---|---|---|
| `user-top-read` | Top artists and tracks over ~4 weeks, ~6 months or ~1 year, up to 50 per request [5] | Only this one, only if §3 is resolved |
| `user-read-recently-played` | The last 50 plays with timestamps; no podcasts [6] | **Never.** Timestamps reveal sleep and routine (§4.4) |
| `user-library-read` | Saved items | No |
| `user-follow-read` | Followed artists | No |
| `playlist-read-private` | The user's playlists | No |
| `user-read-email`, `user-read-private` | Email, account details | No (email and plan are removed from the profile in Development Mode anyway [2]) |
| Playback, modify, streaming, upload scopes | Control of the user's player or library | No |

### 2.4 Can the API provide the signals the brief listed?

| Signal | Available? | Notes |
|---|---|---|
| Favourite artists | Yes (`user-top-read`) | The only solid signal. Policy problem in §3. |
| Genres | Effectively no | The artist `genres` field is deprecated [5]. A classification of our own would be needed. |
| Listening history | Partly | The last 50 plays only [6]. Not history. |
| Recent tracks | Yes | Same 50. |
| Music diversity | Computable | From top artists, with our own classification. |
| Bengali music affinity | Not directly | No language field. Needs our own classification. |
| Indie vs mainstream affinity | No | `popularity` is removed or deprecated [2][5]. |
| Dance, party, high energy | No | Audio features were removed for new apps in 2024 [10]. |
| Nostalgic music | Partly | Album release dates remain; "old songs" can be computed. |
| Romantic music | Not directly | Needs our own classification. |
| Late-night listening | Technically | From 50 timestamps. Weak, and we won't use it (§4.4). |

Even with full access, most of what the brief wanted would come from a MyKolkata classification of artists, not from Spotify. That classification (§5.3) is worth building regardless of where the artist list comes from.

---

## 3. The policy problem

### 3.1 The relevant rules

From the Spotify Developer Policy (effective 15 May 2025) [7]:

- **III.13** "Do not analyze the Spotify Content… for any purpose, including without limitation, creating new or derived listenership metrics… user metrics, or building profiles of users, including for the purpose of targeting them with advertising."
- **III.14** "Do not use the Spotify Platform… to train a machine learning or AI model."
- **III.12** "Do not generate news media, or commercial product offers."
- **III.8** "Do not build products and services which are targeted to children"; if you know or suspect a user is a child, block their use of the Spotify Platform.
- **I** Provide a privacy policy, an easy way to disconnect, and delete the user's data on disconnection.
- **II.4** Attribute Spotify content with Spotify's marks and link back to Spotify.

From the Spotify Developer Terms [8]:

- **IV.2.5** Spotify data may not be transferred to, or used with, any ad network, ad exchange, data broker or advertising or monetisation toolset, *even if a user consents*.
- **V.4** Explicit user consent is required to use personal data for anything beyond displaying it back to the user.
- **Appendix A 5.c** Delete a user's data within five days of disconnection.

### 3.2 What that means for each idea

Our interpretation, not legal advice. Have counsel confirm before building anything in this table.

| Idea | Verdict | Why |
|---|---|---|
| Show people their own top Bengali artists on their card | Probably acceptable, with consent and attribution | Displaying data back to the user is the permitted core (V.4, II.4). Still blocked at scale by the five-user cap. |
| Let people pick a "Pujo anthem" to show on their profile | Acceptable, and better done without the API | Use Spotify's own embed from a pasted link (§5.1). No quota, no data. |
| Derive the archetype from listening | **Not without Spotify's written approval** | "Building profiles of users" (III.13). |
| Use listening to recommend pandals, food, events | **Not without written approval** | A profile (III.13), and potentially "commercial product offers" (III.12) once any recommendation is sponsored. |
| Use listening for sponsored or partner targeting | **Prohibited** | IV.2.5 applies even with consent. |
| Publish city statistics ("Kolkata's Pujo anthem") from Spotify data | **Not without written approval** | "Derived listenership metrics" (III.13). |
| Match people by music taste | **Needs a partnership** | Tinder shows Spotify on profiles through an official integration [32]; that is a partnership, not a Development Mode app. |
| Train any model on listening | **Prohibited** | III.14. |
| Offer Spotify connection to under-18s | **Prohibited** | III.8. |

**If music-from-streaming becomes strategic:** once MyKolkata has 250,000 monthly users, apply for Extended Quota and open a partnership conversation that describes the use case in full and asks for written confirmation. Until then, don't build the integration.

---

## 4. Other sources

### 4.1 Apple Music

- [D] The Apple Music API returns a user's recently played items (at most 50, 10 per request) with a Music User Token via MusicKit; developers report the "heavy rotation" endpoint as unreliable [79].
- [I] Needs an Apple Developer Program membership and MusicKit on the web. About 8% of Indian listeners [50]. Review Apple's terms before any profiling. Low priority.

### 4.2 YouTube Music, JioSaavn, Gaana, Amazon Music

- [A] None offers a public API for a user's listening history suited to this. YouTube Music is the largest platform in India [50] and has no listening-history API we could find. Verify before ruling out.

### 4.3 Screenshots and data exports

- [I] Asking people to upload a Wrapped screenshot for text recognition, or their Spotify privacy data export, is technically possible and a poor experience: slow, error-prone, and it feels invasive. Not recommended.

### 4.4 Why listening timestamps are off the table

The brief asked about "late-night listening patterns if legitimately available". Fifty timestamps can be read, but:

- **Weak:** fifty plays cover a day or two, not a pattern.
- **Sensitive:** timestamps describe when a person sleeps, works and is awake: routine and health-adjacent data nobody expects a Pujo quiz to hold.
- **Redundant:** the quiz asks "It's 1:30 am. One last pandal?" and people answer honestly and happily.

The model never uses them, even if a connection is added later.

---

## 5. The Music Signal Engine

Built so that it doesn't care where the list of artists comes from, and so that music can only ever season an identity, never decide it.

### 5.1 Layer 0: launch (Pujo 2026)

1. **The soundtrack question** (`q_soundtrack`, pick up to two): Mahishasuramardini and Rabindrasangeet; loud Bangla band; the Pujo-y prem playlist; dhaak remixes and Bollywood Pujo songs; new Bangla indie and hip-hop; old Pujo songs. It is an ordinary scored question, and it works for every listener on every platform.
2. **A soundtrack line in the reveal**, written from the answer: "Your Pujo sounds like Bangla band at 2 am." Self-reported, specific, shareable.
3. **Nine archetype playlists**, made by MyKolkata's editors and published on Spotify, YouTube Music and JioSaavn as ordinary playlists (*Nabami Nishi*, *Porer Ta*, *Amader Para*, *Ei Path*, *Pet Pujo*, *Placard*, *Maddox O'Clock*, *Dhunuchi*, *Bhor*). Publishing and linking to playlists is content, not an API integration.
4. **A Pujo anthem.** The person pastes a Spotify, YouTube or Apple Music link to one song. The profile shows the platform's official embed, with its attribution. No login, no quota, no stored listening data.

### 5.2 Layer 1: Phase 2 (after Pujo)

**"Your Pujo lineup"**: the person picks up to five artists from MyKolkata's own catalogue (autocomplete over the Sound Map, §5.3), shown as a festival-poster card in the Instafest tradition [19]. The picks become light evidence (§5.4) and better flavour text. Still no API.

### 5.3 The Kolkata Sound Map

A MyKolkata-owned classification of the artists Kolkata actually listens to, grouped into sound families. It replaces the deprecated `genres` field, works for every source, and is a content asset in its own right. Version 1 covers about 300 artists, built by an editor in a week; version 2 about 1,500.

| Sound family | Examples | Leans towards |
|---|---|---|
| Mahalaya and Agamani | *Mahishasuramardini*, Agamani and Bijoya songs | Heritage, Dawn |
| Rabindrasangeet and Nazrulgeeti | Autumn songs, classic and modern recordings | Heritage, Dawn (light), Romance (light) |
| Old Pujo songs and adhunik | Hemanta Mukherjee, Manna Dey, Sandhya Mukherjee, R.D. Burman's Bengali albums | Heritage, Romance |
| Bangla band | Moheener Ghoraguli, Fossils, Chandrabindoo, Cactus, Lakkhichhara, Bhoomi | Squad, Dhaak energy, Night (light) |
| Bengali film romance | Anupam Roy, Arijit Singh's Bangla songs | Romance |
| City songs | Anjan Dutt | Night (light), Heritage (light) |
| Bangla hip-hop | Cizzy, Banglar Thek, MC Headshot, Archiesman Kundu | Night, Art (discovery) |
| Kolkata indie and post-rock | The Ganesh Talkies, Parekh & Singh, Pelican Shuffles, Aswekeepsearching | Art, Night |
| Bollywood party and Pujo songs | *Dola Re Dola*, *Ami Je Tomar* | Dhaak energy, Spotlight, Crowd |
| Bollywood romance | — | Romance |
| Baul and folk | — | Heritage, Art |
| Hindustani classical | Morning ragas, sarod, sitar | Heritage, Dawn, Art (light) |
| Dance and electronic | — | Dhaak energy, Crowd, Night (light) |
| Lo-fi and ambient | — | Night (light), Crowd (low, light) |
| Metal and heavy rock | Kolkata's metal scene | Night (light), Squad (light) |
| Global pop | — | No lean (deliberately neutral) |

Families and weights are editorial judgements, reviewed by at least two people who know the scene, and deliberately gentle. Global pop leans nowhere because a mainstream playlist says almost nothing about how someone does Pujo.

### 5.4 From artists to evidence (Layers 1 and 2)

```
1. Artists, ranked (self-picked or, if ever cleared, a connected source's top artists over ~6 months).
2. Rank weights: w_r = 1 / √rank.  Unknown artists contribute nothing.
3. Family shares: s_f = Σ w_r over the family's artists / Σ w_r over all known artists.
4. Evidence per dimension: e_d = Σ_f s_f · lean_{f,d}   (lean values between 0.3 and 0.9, from the Sound Map)
5. Total music weight capped at 0.6, spread across dimensions in proportion to |e_d − 0.5|.
   (An answer to a core question carries about 1.5 of written evidence, and about 3.8 once the
   "not chosen" signals are counted, so music can never outweigh a single question.)
6. Display-only extras, never stored or scored:
   - Breadth: normalised entropy of family shares ("wide ears")
   - Soundtrack year: the median release year of self-picked songs ("your Pujo soundtrack is 1974")
```

### 5.5 What music is never used for

- **Religion:** devotional listening is read as heritage and dawn, never as faith.
- **Community or ethnicity:** the share of Bengali-language music can appear on the person's own card as a flourish; it is never stored, matched on or targeted.
- **Sexual orientation, politics, mental health** (sad songs are not a diagnosis), **age**, or **sleep**.
- **Partner or sponsored targeting**, from any source.

---

## 6. Privacy for music

- **Layer 0:** the soundtrack answer is an ordinary quiz answer and follows the quiz's rules. A pasted anthem link is stored as a URL on the profile, nothing more.
- **Layer 1:** artist picks are stored as answers, deletable with everything else.
- **Layer 2 (only if ever cleared):** the consent screen says, in plain words, *"We'll read your top artists (not your history, not when you listen) to add a soundtrack to your Pujo. You'll see exactly what we used. Disconnect any time and we delete it within 24 hours."* Store only the derived family shares; delete the raw artist list within 24 hours; encrypt tokens; purge on disconnect within 24 hours (Spotify's own limit is five days); keep Spotify data out of analytics and away from partners; block under-18s from connecting at all.

## 7. What to build, and when

| When | Build | Don't build |
|---|---|---|
| Pujo 2026 | The soundtrack question, the soundtrack line, nine editorial playlists, anthem embeds from a pasted link | Spotify login, any listening-data API, anything using timestamps |
| After Pujo (Phase 2) | The Kolkata Sound Map v1; the Pujo lineup picker and card | Screenshot or data-export uploads |
| Phase 3, only if eligible | Legal review; a Spotify partnership conversation at 250k MAU; a connected source behind the 0.6 cap | Any use of streaming data for partners, city statistics or model training |
