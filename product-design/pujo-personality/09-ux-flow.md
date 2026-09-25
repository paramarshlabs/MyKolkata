# I. UX: the journey and every screen

A cultural identity reveal, not a survey. Target: reveal in under two and a half minutes, on a mid-range Android phone, on congested mobile data near a big pandal.

---

## 1. The journey

```
Entry (home band, Pujo page, a friend's link, a Story sticker, a QR poster)
  │
  ▼
S1  Landing ─ "What kind of Pujo are you?"                         ~10 s
  │
  ▼
S3–S15  Thirteen questions, one per screen, with a reaction line    ~2 min
  │       (the soundtrack question sits at number nine)
  ▼
S16  Rapid-fire: five swipes (skippable)                            ~15 s
  │
  ├─► S17  Tie-breaker, only if it's close                           ~3 s
  ▼
S18  Reading your Pujo (the alpona draws)                           ~2 s
  │
  ▼
S19  The reveal                                                     ~3 s
  │
  ▼
S20  Lore, Pujo DNA, your people, "That's me?"
  │
  ▼
S22  Tune it (preferences and age; optional)                        ~15 s
  │
  ├─► S23  Your Pujo: tonight's route, pandals, plates, an event, a playlist
  ├─► S24  Share (Story, feed, link)
  ├─► S25  Compare, Squad, Guess my Pujo
  └─► S29  Save it (sign in)  ──►  S30  Profile
                                        │
Later:  Pujo days (tonight's route, crowd-aware)  ─►  Dashami: Pujo Wrapped (S34)
        ─►  next Mahalaya: "Has your Pujo changed?" (S31)
```

The brief's proposed flow included a Spotify connection and a permission screen. Both are gone for launch ([`05-music-and-spotify.md`](05-music-and-spotify.md)); the soundtrack question does that job for every listener, and the only "permission" is a single line on the landing page about where answers are kept.

## 2. Entry points and links

| Entry | Lands on |
|---|---|
| Home page band ("তুমি কোন পুজো?") and the Pujo page | `/pujo/personality` |
| A friend's result | `/pujo/you/{slug}`: their card, then "What's yours?" |
| Compare, squad, guess invites | `/pujo/compare/{code}`, `/pujo/squad/{code}`, `/pujo/guess/{code}` |
| Instagram link sticker, creator Add Yours chains | `/pujo/personality?ref={code}` |
| QR posters (campuses, partner cafés) | `/pujo/personality?src={place}` |
| Search and people browsing the lore | `/pujo/archetypes/{id}`: a public page per archetype |
| The personal hub, after the reveal | `/pujo/for-you` |

## 3. Screens

Each spec lists purpose, layout, copy, interactions, states and the analytics events it fires (the full event list is in [`13-product-spec.md`](13-product-spec.md) §24).

### S1. Landing

- **Purpose:** turn curiosity into the first tap.
- **Layout:** the house title card. A full-bleed 4:5 photograph (a lane at dusk, pandal light at the end), the scrim, content bottom-left.
- **Copy:**
  - Bengali lead: **তুমি কোন পুজো?**
  - Title: **What kind of Pujo are you?**
  - Lede: *Your playlists know your music. We want to know your Kolkata.*
  - Button: **Discover my Pujo →**
  - Under the button, in Ash: *Thirteen questions, about two minutes. No sign-up. Your answers stay on your phone until you choose to save or share.*
  - Arriving from a friend: *{Name} is a Night Owl. What's your Pujo?*
- **Also on the page, below the fold:** the nine sigils and names in a 3×3 grid (tappable, each opens its public archetype page), and the line *A playful Pujo identity built from your answers. Not a psychological test.*
- **Events:** `pujo_landing_viewed`, `pujo_quiz_started`.

### S3–S15. The questions

- **Purpose:** thirteen quick, enjoyable decisions that each reveal behaviour.
- **Layout:** photograph band at the top (4:5, the question's visual), the question as H2, answers stacked below as full-width secondary buttons (44px minimum, 16px text, left-aligned). Image questions (the plate, the frame) use a 2×3 or 3×3 grid of labelled tiles.
- **Progress:** the alpona rule along the top, one segment drawn per question. No "3 of 13" counter.
- **Interaction:** a tap selects, the reaction line appears under the question for about 700ms (for example *"Correct. The lights look better now anyway."*), then the next card slides in. The soundtrack question allows two picks and a **Next** button. Back is always allowed and changing an answer simply recomputes.
- **Order:** as in [`04-question-bank.md`](04-question-bank.md): the 1:30 am dilemma first, love and Dashami near the end, the mirror last.
- **Focus management:** focus moves to the new question heading on each card, so screen readers hear the question first.
- **Resume:** answers are kept in `sessionStorage`; a refresh continues where the person left off.
- **Events:** `pujo_question_answered` (question, option, time taken), `pujo_question_back`, `pujo_quiz_abandoned` (last question seen).

### S16. Rapid-fire

- **Purpose:** thirty seconds of fun, five shareable badges. (It barely moves accuracy; see the question bank.)
- **Layout:** one card, two sides ("Last Metro" / "First Metro"), swipe or tap. Reuses the swipe interaction from `/tinder`.
- **Copy:** *Quick. Don't think.* A **Skip** link.
- **Events:** `pujo_rapidfire_completed` or `pujo_rapidfire_skipped`.

### S17. Tie-breaker (only when it's close)

- **Layout:** two large buttons, nothing else.
- **Copy:** *It's close. One more.* Then the chosen tie-breaker (for example *"Read the placard, or skip it?"*).
- **Events:** `pujo_tiebreaker_shown`, `pujo_tiebreaker_answered`.

### S18. Reading your Pujo

- **Layout:** obsidian screen, the alpona line drawing itself.
- **Copy:** rotating lines, about 700ms each: *Checking your roll-to-pandal ratio…*, *Asking the dhaakis…*, *Counting your plastic chairs…*
- **Honesty rule:** the scoring takes milliseconds, so this lasts at most two seconds. It is a drumroll, not a pretend computation.

### S19. The reveal

- **Purpose:** the single moment the feature is built around.
- **Sequence:** letterbox bars retract; the Bengali name rises 12px into place; the sigil blooms; the tagline appears in the caption device; below it, the streak line and the hour. An optional single dhaak strike if sound is on.
- **Copy (Night Owl with a Pet Pujari streak):**
  - **রাতজাগা**
  - **Night Owl**
  - *Pujo starts / after midnight.*
  - *with a Pet Pujari streak. 1 am is your hour.*
- **Buttons:** **Share my Pujo →** (primary) and *Read your story* (text button).
- **Events:** `pujo_result_revealed` (primary, streak, band, model version).

### S20. Lore, Pujo DNA and your people

- **Layout:** long-form in light mode (paper), per DESIGN.md.
- **Sections:**
  1. The lore (200 to 400 words, second person).
  2. **Why you got this:** three sentences from the "because" dimensions, quoting their own answers ("You said 1:30 am is when the night gets started.").
  3. **Your Pujo DNA:** the alpona chart. Tapping a petal names it and shows the low and high anchors.
  4. **Your streak:** two lines on the secondary archetype.
  5. **Your people:** kin, complement and spark archetypes, each with its one-line pair copy.
  6. **What you'd say:** three of the archetype's phrases.
  7. **"That's me?"** Three buttons: *That's literally me*, *Mostly*, *Not me*. "Not me" opens an optional picker: *I'm more of a…* (the nine).
- **Events:** `pujo_lore_viewed` (scroll depth), `pujo_dna_opened`, `pujo_result_feedback`.

### S22. Tune it

- **Purpose:** the facts recommendations need, asked after the person already has their identity.
- **Layout:** a chip sheet.
- **Copy:** *Tune your Pujo. All optional.* Then the six preference questions (status, diet, getting around, budget, side of the city, age).
- **Age:** asked before anything is saved or shared. Under 18 goes to S32.
- **Events:** `pujo_preferences_set`, `pujo_age_band_set`.

### S23. Your Pujo

- **Purpose:** turn the identity into a night.
- **Layout:** cinematic bands.
  1. **Tonight** (or "Your first night", before Shashthi): the archetype's route with times, the reason for each stop, crowd notes, and the **Start** button.
  2. **Pandals for you:** eight cards, including one from the streak and one wildcard.
  3. **Plates for you:** three, filtered by diet.
  4. **One event.**
  5. **Your playlist** (the archetype's editorial playlist, as an embed).
  6. **Sponsored** (optional, one card, labelled; see [`11-partnerships.md`](11-partnerships.md)).
- **Copy example:** *Nabami Nishi, North. 11:30 pm to 5:30 am. Six stops, the ghat at sunrise.*
- **Safety line on every night route:** *Walk it together. Share your plan. 112 if you need it.*
- **Events:** `pujo_rec_impression`, `pujo_rec_opened`, `pujo_rec_saved`, `pujo_route_started`, `pujo_rec_dismissed`.

### S24. Share

- **Layout:** a sheet with three previews (Story, Feed, Link) and optional touches (first name, para, squad, count, anthem).
- **Action:** the native share sheet with the image file (the Web Share API with files, on Android and iOS), so Instagram Stories and WhatsApp appear as targets. Fallbacks: **Download** and **Copy link**.
- **Suggested caption** (editable, no emoji): *Turns out I'm a Night Owl. Which Pujo are you? {link}*
- **Never:** gating any part of the result behind sharing.
- **Events:** `pujo_share_opened`, `pujo_share_completed` (channel, format).

### S25. Invite

Three cards:

- **Compare with a friend:** *See how your Pujos fit.*
- **Start a squad:** *Find your group's Pujo. Roles included.*
- **Guess my Pujo:** *Make a friend guess. They'll be wrong.*

Each makes a link and opens the share sheet. **Events:** `pujo_invite_created` (type).

### S26. Compare result

The compare card ([`07-pujo-match.md`](07-pujo-match.md) §3.4): both identities, the five components in words, the plan match (labelled), the pair headline and a suggested plan. For a guess: *"You said Pandal Hunter. They're an Art Kid."* **Events:** `pujo_compare_viewed`, `pujo_guess_resolved`.

### S27. Squad

The squad's archetype, the mix (percentages from five members), each member's role and line, the squad route, the squad card, and *waiting for 3 more*. **Events:** `pujo_squad_created`, `pujo_squad_joined`, `pujo_squad_card_shared`.

### S28. Explore

The existing Near You map, with an archetype layer: pins ranked for the person, filters for *open now*, *open late*, *public bhog*, *quiet now*, and the Bhog Map. **Events:** `pujo_map_filter_used`.

### S29 and S30. Save and profile

- **Save:** *Keep your Pujo. Sign in to save it, get tonight's route each day, and find your squad.* Google sign-in (already in the app). Nothing is stored before this unless the person shared a card.
- **Profile:** the identity card, the DNA, *My Pujo Four*, badges, history (private), the anthem, and privacy controls: who can see what, compare visibility, and **Delete my Pujo** (everything, immediately).
- **Events:** `pujo_signup_from_result`, `pujo_data_deleted`.

### S31. Retake and evolve

- Retake: *Has your Pujo changed?* If the result matches: *Still a Night Owl.* If not: *Last time: Night Owl. Now: Pet Pujari. Keep which?*
- Evolution offer (end of season, only after thirty meaningful actions pointing elsewhere): *You came in a Night Owl. You ate like a Pet Pujari. Keep, switch, or wear both?*
- **Events:** `pujo_retake_started`, `pujo_evolution_offered`, `pujo_evolution_chosen`.

### S32. Under 18

- Full quiz, full reveal, full lore, the DNA, and a downloadable card generated on the phone.
- No account, no stored result, no share link, no compare or squad links, no personalised recommendations beyond the archetype's general route, no Pujo Match, no partner content.
- **Copy:** *Here's your Pujo. Save the card to your phone. When you're 18, you can keep it here too.*

### S33. Errors, offline and empty states

| State | Copy |
|---|---|
| Offline mid-quiz | *No signal. Keep going; we'll catch up when you're back.* (Everything works offline after the first load.) |
| Offline at share | *Your card is ready. It'll post when you're back online.* |
| A result link that was deleted | *This Pujo has been taken back. Want to find yours?* |
| No recommendations nearby | *Nothing close yet. Here's the best of your side of the city.* |
| Rain | *It's pouring. Here's the Metro-first version, with the pandals that look best wet.* |

### S34. Pujo Wrapped (Dashami)

A short Story sequence: your archetype, the pandals you saved and started, the hour you were most active in the app, your squad's Pujo, and, if it applies, your evolution. It closes on **আসছে বছর আবার হবে** (*asche bochor abar hobe*) and a reminder to come back at Mahalaya. **Events:** `pujo_wrapped_viewed`, `pujo_wrapped_shared`.

### S35. Public archetype pages

One page per archetype: the name, tagline, lore, the vibe, the playlist, what they'd say, and **Take the quiz**. Search-friendly, shareable without taking the quiz, and the landing target for "Tag your Pet Pujari friend" posts.

## 4. Copy rules for this feature

- Second person, present tense, sentence case, no exclamation marks, no emoji.
- Specific over generic: name the lane, the dish, the hour.
- Bengali where it is what someone would actually say.
- Never explain Bengali culture to Bengalis; let the visitor follow.
- Claims: always "a playful Pujo identity". Never "science", "accurate", "psychology" or "personality test" in marketing.

## 5. Performance and resilience

Mobile networks around the big pandals are notoriously congested during Pujo, so the feature is built to work on bad connections:

- **Offline after first load:** quiz content, images and the scoring engine are precached (a PWA; the app already ships a manifest).
- **Budgets:** under 150 KB of compressed JavaScript for the quiz route; question images as AVIF or WebP at 4:5, about 40 KB each; largest contentful paint under 2.5 s on 4G.
- **Client-side scoring**, with the server recomputing when a result is saved.
- **Client-side share cards** on a canvas, which also shapes Bengali correctly (see the visual bible §6.4).
- **Analytics queued offline** and sent when the connection returns.

## 6. Accessibility

- Every image question has text labels; the grid is also a list for screen readers.
- Swipes always have tap equivalents.
- Reduced motion: the reveal renders in its final state.
- Bengali text is marked `lang="bn"`.
- Focus moves to each new question; the reveal announces the archetype name.
- Text scales to 200% without losing content.
- Colour is never the only carrier of meaning (the DNA petals are labelled on tap).

## 7. Edge cases

| Case | Behaviour |
|---|---|
| Someone taps through at random | The model lands them somewhere near neutral and usually triggers the tie-breaker; the "close" copy invites them to choose. |
| Offensive text in names (para, squad, first name) | Length limits, a profanity filter in English and Bengali, and a report link on public cards. |
| Two devices | Sign-in merges results; the most recent reveal wins, the earlier one goes to history. |
| A shared link is opened by a minor | The public card is fine to view; taking the quiz follows S32. |
| A committee disputes a pandal's details | A "suggest a correction" link on every pandal card, and claimed pages for committees. |
