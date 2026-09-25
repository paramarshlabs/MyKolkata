# H. Visual bible

> Nine films, one city.

The Pujo Personality is not a new brand. It is a chapter of MyKolkata's design system ([`docs/DESIGN.md`](../../docs/DESIGN.md), v1.4), and it follows every rule there. Where this feature needs something the system doesn't yet have, it is listed in §3 as a proposed v1.5 addition for the design owner to approve.

Per-archetype photography boards and prompts are at the end of each character bible in [`archetypes/`](archetypes/). This document covers the system.

---

## 1. The idea

MyKolkata presents the city as a title sequence: cinematic bands, one shot each. The Pujo Personality extends that. **Each archetype is a film with its own hour, grade and material.** The Night Owl's film is sodium light on wet tarmac at 1 am. The Shiuli's is pre-dawn blue with one warm lamp. The Pet Pujari's is flash on steel. Nine films, one city, one design system.

What should never happen: nine colour themes that turn MyKolkata into a festival website. Variety comes from photography, time of day, the Bengali name and the sigil, not from new UI colours.

## 2. Inherited rules (non-negotiable)

From DESIGN.md, applied to this feature:

- **Palette and budgets.** One Crimson Silk moment per viewport; one or two Taxi Yellow elements; no gold; Warm Sand only in photographs; no pure black or white.
- **Type.** Clear Sans Regular only (hierarchy from size, tracking and colour, never weight). Bengali in Noto Sans Bengali, where the weight axis makes Bengali the loud voice. Bengali only in the four permitted places: the archetype names qualify as "real content" and as words with no English equivalent (মনকেমন, আড্ডাবাজ, ধুনুচি, শিউলি).
- **Voice.** Sentence case, no exclamation marks, no emoji in product copy, no ALL-CAPS eyebrows, no middle-dot metadata strings.
- **Motion.** One unrequested motion per page. The reveal is this feature's one moment (§8).
- **Photography.** People over objects, hands over faces where a face would date the image, never stock smiles, never an Instagram preset. **The idol's face is never under UI or text, and never an emblem.**
- **Quality floor.** Works at 360px; 44px touch targets; visible focus rings; AA contrast; reduced motion honoured; Bengali marked `lang="bn"`.

## 3. Proposed v1.5 additions

### 3.1 Nine sigils

Archetype sigils are drawn exactly like DESIGN.md's emblems: filled, never outlined, a Pearl body with one accent (Crimson, or Taxi Yellow where the object itself is yellow), on the 64px grid, never below 40px. On the two paper cards (Art Kid, Shiuli) the body becomes Obsidian and Crimson becomes Ruby, as DESIGN.md §7A specifies for paper. Four sigils reuse existing emblems.

| Archetype | Sigil | Base | Accent |
|---|---|---|---|
| Night Owl | A crescent cradling a single bulb | New | Taxi Yellow (the bulb) |
| Pandal Hunter | A compass rose of alpona teardrops | New, from the alpona library | Crimson (north point) |
| Para Kid | The dhaak with its plume | Existing *Dhaak* emblem | Crimson |
| Pujo Romantic | Two kaash plumes leaning together | Existing *Kash phool*, doubled | Crimson (one thread tying them) |
| Pet Pujari | A sal-leaf plate | New | Taxi Yellow (a piece of beguni) |
| Art Kid | The chalchitra arch | From the *Chalchitra* motif, filled | Crimson (the central disc) |
| Addabaaz | Two bhaar cups touching | New, from the *Cha in a bhaar* icon, filled | Crimson (the steam) |
| Dhunuchi | The dhunuchi, smoke rising | Existing *Dhunuchi* emblem | Crimson (the ember) |
| Shiuli | Five petals, one stem | Existing *Shiuli* emblem | Light-mode Taxi `#C98A1F` (the stem) |

### 3.2 Card grounds and grades

Each archetype card sits on one surface from the existing scale, with one accent and one photographic grade. Three are light (paper) cards, which gives the set rhythm without new colours.

| Archetype | Ground | Accent | Grade | Hour | Material |
|---|---|---|---|---|---|
| Night Owl | Obsidian `#0D1012` | Taxi Yellow | Teal shadows, sodium-amber highlights, deep blacks | 1 am | Wet tarmac, lit bamboo |
| Pandal Hunter | Slate `#1C2225` | Taxi Yellow | Crisp late-morning daylight, true colour | 11 am | Map paper, a Metro card |
| Para Kid | Deep Bordeaux `#3F0D12` | Crimson | Warm tungsten, tarpaulin casts, full reds | 8 am | Tarpaulin, marigold, plastic chairs |
| Pujo Romantic | Bordeaux Deep `#260A0E` | Soft Blush | Soft contrast, warm skin, cool blue dusk | 6 pm | Cotton tant, rain on glass |
| Pet Pujari | Ink `#141819` | Taxi Yellow | Hard flash, glossy, warm reds and yellows | 2 pm | Steel, sal leaf, newspaper |
| Art Kid | Soft Pearl `#F2F1ED` (paper) | Ruby | Natural daylight, clay greys, jute ochre | 4 pm | Clay, jute, film |
| Addabaaz | Ink `#141819` | Crimson | Mixed street light and flash, punchy | 10 pm | Grass, clay cups |
| Dhunuchi | Crimson Depth `#710014` | Pearl | High contrast, backlit smoke | 8 pm | Silk, smoke, brass |
| Shiuli | Soft Blush `#FBE4E3` (paper) | Ruby | Low contrast, pre-dawn blue, one warm lamp | 4 am | Wet grass, lime plaster |

Contrast of the new pairings (computed): Pearl on Crimson Depth 10.9:1, Blush on Bordeaux Deep 15.3:1, Obsidian on Blush 15.7:1, Obsidian on Pearl 16.9:1, Ruby on Pearl 7.6:1 and Ruby on Blush 7.1:1: all AAA for text. Taxi Yellow on Slate (8.7:1) and on Ink (9.6:1) can carry small labels. Crimson on Ink (3.6:1) stays large-type and icons only, as DESIGN.md already rules. The Shiuli's orange stem (`#C98A1F`) on Blush is 2.4:1, so it stays a decorative detail: the sigil must read from the petals alone.

### 3.3 The Pujo DNA chart

The fourteen dimensions drawn as an alpona: fourteen solid teardrop petals around a Crimson disc, grouped in the five families (Clock, Movement, People, Senses, Self) with the ±90° gap preserved, as in the medallion. Petal length comes from `dnaPetals()` in `model/scoring.mjs`, relative to a typical respondent. It is drawn centre-out in the medallion's order, and it is static on share cards. Petals carry labels on tap, never on the chart itself.

### 3.4 Emoji in user captions

Product copy stays emoji-free. Prefilled share captions are product copy too, so they stay emoji-free; people add their own. (The brief's example cards used emoji; this bible rebuilds them with sigils and words.)

## 4. Photography

### 4.1 Portraits

- **Casting:** real Kolkatans of every background the city holds, ages 18 to 30, all genders, cast through colleges, paras and creators, never through stock. Each archetype is shot on at least three people so no single face becomes "the Night Owl".
- **Direction:** environmental portraits in the archetype's hour and place, mostly from behind, in silhouette, or detail-first (hands, feet, jhumkas, a Metro card). The Dhunuchi is the one archetype shot face-forward.
- **Consent:** signed model releases covering social, web and print; releases from bonedi families and committees for any location shoot on their premises; artisans at Kumartuli paid and credited.
- **Never:** the idol's face as a subject under text; AI-generated people presented as real; minors as models.

### 4.2 Pandals

| Approach | Used for |
|---|---|
| Frontal façade typology, late morning, no people | Pandal Hunter |
| Interior raking light at 4 pm, materials in macro | Art Kid |
| Long lanes to a glowing pandal after midnight | Night Owl |
| Arati smoke, backlit, slow shutter | Dhunuchi |
| Thakur dalans and sabeki protimas at dawn, from a respectful distance | Shiuli |
| Para interiors with people, tungsten and flash | Para Kid |

### 4.3 Food

Top-down on steel, sal leaf, marble and newspaper; hard flash at night stalls, window light in cabins; hands always in frame; never styled with fake garnish. The Pet Pujari board is the reference.

### 4.4 Fashion

Street-cast lookbooks in North Kolkata's lanes and doorways (with permission), in the archetype's hour. Textile close-ups: jamdani, Garad, Baluchari, tant, block prints. Every look shot on more than one body type and gender presentation. Saree with sneakers, dhuti with an embroidered panjabi, the committee tee.

### 4.5 Production plan before Mahalaya

No pandal is open before 10 October this year, so launch imagery can't include this year's pandals.

| Shoot now (by 7 Oct) | Source differently |
|---|---|
| Kumartuli (the idols are being made now); kaash fields in Rajarhat; food at the cabins and stalls; fashion lookbooks in North Kolkata lanes; dawn at the ghats; para life and committee preparation; the Metro at night | Pandal night photography: license 2025 work from Kolkata photographers (paid, credited), then shoot 2026 during Pujo for the Dashami recap and next year |

## 5. The profile card (in the app)

- A 4:5 band: the archetype's photograph behind the house scrim (black through Bordeaux, never flat black on red), the sigil at 96px on a flat patch (the medallion rule: never on a photograph directly).
- The Bengali name at the Bengali display size, the Latin name below it, the tagline in the caption device (Pearl line, indented Blush line).
- Streak, badges, hour, and "My Pujo Four" beneath, on the surface scale.
- One Crimson moment: the primary button ("Share my Pujo →").

## 6. Share cards

### 6.1 Formats

| Format | Size | Use |
|---|---|---|
| Story | 1080 × 1920 | Instagram and WhatsApp Status; the default |
| Feed | 1080 × 1350 | Instagram feed and carousels |
| Link preview | 1200 × 630 | WhatsApp, iMessage, X; small file so previews load on congested networks |

Story safe zones: keep the top 220px and bottom 380px free of key content (profile chrome at the top, reply bar and link sticker at the bottom).

### 6.2 Story layout

```
┌──────────────────────────────┐
│  (sprig) MY KOLKATA            │  wordmark, small
│         আমার কলকাতা           │
│                              │
│                              │
│           [sigil 160px]      │
│                              │
│        রাতজাগা               │  Bengali, loud (wght 700)
│        Night Owl             │  Latin, Display
│                              │
│  │ Pujo starts               │  caption device
│       after midnight.        │
│                              │
│  with a Pet Pujari streak     │
│  1 am is my hour              │
│                              │
│  Night drive  Roaming  Food   │  three "because" traits, as words
│                              │
│  Which Pujo are you?          │  the question back
│  (link sticker goes here)     │
└──────────────────────────────┘
```

### 6.3 Variants

| Variant | Content | Moment |
|---|---|---|
| Identity | As above | The reveal |
| Pujo DNA | The alpona chart with three labelled petals | The lore page |
| My Pujo Four | Four chosen pandals, plates or moments | Any time; the Letterboxd move |
| Compare | Two archetypes, the components, a plan | After a friend finishes |
| Squad | Mix, roles, route | When a squad fills |
| Badge | "Team Sabeki", "Last Metro" | The rapid-fire round |
| Pujo Wrapped | The season: pandals saved, routes walked, the hour you were most out, your evolution | Dashami |

**Personal touches, all optional:** first name; para name (Para Kid); squad name (Addabaaz); pandal count (Pandal Hunter); anthem title.

### 6.4 How cards are rendered: a technical warning

Next.js image generation (`next/og`) uses Satori, which does not do full OpenType shaping for complex scripts. Bengali conjuncts and vowel signs are likely to render incorrectly. Verify early, and assume the fix is needed:

- **Client:** draw cards in the browser on a canvas. Browsers shape Bengali correctly, and the card works offline, which matters when mobile networks near big pandals are congested.
- **Server (link previews and fallback):** pre-render the nine Bengali names, and the fixed Bengali lines, as SVG paths at build time with a real shaping engine, then compose them as images in `next/og`.

## 7. Story templates and stickers

- **Add Yours:** "What's your Pujo?", seeded by creators with their own card.
- **Guess my Pujo:** a template with nine small sigils: "Guess mine. Answer in DMs."
- **What's your hour?:** the Pujo Clock as a template.
- **Theme or sabeki?:** a poll sticker, with the badge card as the answer.
- **My Pujo Four:** four empty frames to fill.

## 8. Motion

| Moment | Motion | Timing |
|---|---|---|
| Question to question | Responds to the tap: the card slides and cross-fades | 320ms, `--mk-ease-in-out` |
| Reaction line after a tap | The caption tick draws, the line appears | 200ms |
| Progress | The alpona rule draws itself one segment per question | 320ms, `--mk-ease-draw` |
| "Reading your Pujo" | The alpona line draws itself (the house load state; no spinner) | 2 to 3 s, honest: the scoring takes milliseconds, this is a pause, not a fake computation |
| **The reveal (the one unrequested moment)** | Letterbox bars retract → the Bengali name fades up 12px → the sigil blooms centre-out → the tagline appears | 700ms + 320ms + 1.3s + 320ms |
| Sound | One dhaak strike with the bloom, only if the person turned sound on | Off by default |

Under reduced motion, everything renders in its final state and nothing is lost. Explicitly not used: confetti, particles, floating diyas, spinning sigils, counters ticking up.

A six-second video version of the reveal, for Reels, is a Phase 2 export.

## 9. Mobile UI

- **Question screens:** a 4:5 photograph band at the top with the scrim; the question in H2 (25px mobile); answers as full-width secondary buttons (transparent, 1px Pearl-alpha border, 44px minimum, 16px text), never boxed cards. Image questions use a 2×3 grid (the plate) or a 3×3 grid (the frame), each tile labelled in text.
- **Rapid-fire:** one card and two swipe directions, using the swipe interaction already on the `/tinder` page, with tap alternatives for accessibility.
- **Tie-breaker:** two large buttons and "It's close. One more."
- **Lore:** long-form, so it uses DESIGN.md's light mode (paper), 62 to 72 characters per line.
- **Recommendations:** the house content cards (16:10 media, sprig and title in Pop White, sub-line in Ash, turning Taxi Yellow on hover).

## 10. Bengali typography for the feature

| Name | Bengali | Transliteration |
|---|---|---|
| Night Owl | রাতজাগা | raat-jaga |
| Pandal Hunter | প্যান্ডেল শিকারি | pandal shikari |
| Para Kid | পাড়াতুতো | paratuto |
| Pujo Romantic | মনকেমন | monkemon |
| Pet Pujari | পেটপুজারি | pet pujari |
| Art Kid | থিম-পাগল | theme-pagol |
| Addabaaz | আড্ডাবাজ | addabaaz |
| Dhunuchi | ধুনুচি | dhunuchi |
| Shiuli | শিউলি | shiuli |

Weight 700, width 100 (compress to 85 only for tight slots), line-height 1.5, never letter-spaced, `lang="bn"`, and about 8% larger than Latin when both sit at the same rank. Have a native Bengali typographer proof all nine at card sizes before printing merch; প্যান্ডেল and পাড়াতুতো in particular need checking at small sizes.

## 11. Cultural motifs in this feature

| Motif | Use | Never |
|---|---|---|
| Alpona line | Progress, loading, the DNA chart | As a border on every card |
| Laal-paar edge | Once, on the Romantic and Para Kid cards | As a frame |
| Chalchitra | The Art Kid's sigil and card frame | Behind other archetypes |
| Dhaak, dhunuchi, shiuli, kaash | Sigils only | As decoration |
| Chandannagar lights | Photography for the Night Owl | Drawn as clip-art |
| Para objects (plastic chairs, tarpaulin) | Para Kid photography | As a joke |

## 12. Image-generation prompts (concept and moodboards only)

AI images are for internal moodboards and briefs. Final campaign imagery is real photography of real people and places (§4). Every prompt excludes the idol's face, text and stock aesthetics.

**1. Hero**

> Cinematic editorial photograph, 2.39:1, dusk on the first night of Durga Puja in North Kolkata: a narrow lane of old houses with wooden balconies and green shutters, strings of warm pandal lights overhead, a crowd moving towards a glowing pandal gate in the distance, a yellow Ambassador taxi parked in the foreground, light rain on the road. Teal shadows, warm amber and red highlights, subtle film grain, documentary realism.
> Negative: idol faces, text, signage, neon, fantasy, gold filters, posed people.

**2. Archetype portrait (template)**

> Editorial environmental portrait, {lens}, {hour} during Durga Puja in {location}, Kolkata: a young person {wearing}, {action}, {framing: seen from behind / silhouetted / hands in detail}, {light}. {Grade from §3.2}. Natural, candid, subtle grain, 4:5.
> Negative: idol faces, text, stock smiles, studio lighting, fantasy.
> (Per-archetype fills are in each character bible.)

**3. Profile card (mockup render)**

> A clean mobile app screen mockup, dark cool-black interface: a 4:5 photograph of a narrow Kolkata lane at night at the top with a gradient scrim; beneath it a large filled emblem of a crescent holding a single glowing bulb; large Bengali and English display type (placeholder); a short two-line caption with a thin red bar; a red primary button with an arrow. Minimal, cinematic, premium.
> Negative: gold, emoji, busy decoration, drop shadows on text.

**4. Social share card (mockup)**

> A 9:16 poster on a deep crimson ground: a filled pearl-white emblem of a clay incense burner with smoke rising, centred; very large Bengali display type beneath (placeholder); a smaller English title; a two-line caption; generous empty space at the top and bottom; a faint alpona pattern at 4% opacity. Editorial, cinematic, restrained.
> Negative: gold, glitter, emoji, clip-art diyas, photographs of idols.

**5. Pandal scene**

> Wide editorial photograph, 4 pm side light inside a Kolkata theme pandal built from thousands of clay cups and woven jute, a few visitors small in the frame for scale, warm golden light raking across the textures, deep shadows, natural colour, gallery-documentation style, 16:10.
> Negative: the idol's face, text, crowds pressing the camera, HDR.

**6. Food scene**

> Top-down editorial photograph at a Kolkata street stall during Durga Puja at night: an egg-chicken roll in paper cut in half, a leaf bowl of phuchka, a steel plate of beguni, a clay cup of tea, a hand reaching in; hard on-camera flash, glossy textures, warm reds and yellows, pandal lights blurred behind, unstyled, 4:5.
> Negative: text, logos, studio styling, fake garnish.

**7. Fashion scene**

> Street-style editorial photograph in a North Kolkata lane at golden hour during Pujo: two friends, one in a red-bordered cream jamdani saree with white sneakers and silver jhumkas, one in an embroidered panjabi with a dhuti; peeling pastel walls, a wooden door, a hand-painted sign out of focus; warm light, cool shadows, natural skin, 4:5.
> Negative: idol faces, readable text, studio backdrops, heavy retouching, gold filters.

## 13. Launch asset checklist

| Asset | Count |
|---|---|
| Sigils (SVG, with light and dark variants) | 9 |
| Archetype photographs (hero plus two alternates each) | 27 |
| Question photographs (13 core plus the plate and frame grids) | 13 + 6 + 9 |
| Share-card templates (Story, Feed, link preview) × variants at launch (Identity, Compare, Squad, Badge) | 12 |
| Pre-rendered Bengali name paths for server cards | 9 names + about 20 fixed lines |
| Playlist covers | 9 |
| Motion: the reveal (one component, nine sigils) | 1 |
