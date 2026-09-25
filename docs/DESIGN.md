# My Kolkata — Design System

> **আমার কলকাতা**
> A city, shot like a film.

This is the design bible for My Kolkata. It supersedes the previous visual language entirely.
It absorbs `design/self.md`, takes cinematic structure from `design/netflix.md`, surface
discipline from `design/spotify.md`, and its atmosphere from the four moodboard images in `design/`.

**Live reference:** [`/brand-kit`](src/pages/brand-kit.jsx) — every token, motif, icon and motion
curve in this document is rendered and interactive there: the medallion blooms, the Bengali weight and
width axes are draggable, the easing curves play, and the Pujo countdown runs. When the two
disagree, the brand kit is right.

**Version 1.5** — the Pujo Personality: nine archetype **sigils** drawn in the emblem language
(§7C), archetype card grounds, the Pujo DNA chart and share cards (§9.8). Full rationale in
[`product-design/pujo-personality/08-visual-bible.md`](../product-design/pujo-personality/08-visual-bible.md).

**Version 1.4** — the flat black replaced with a cool three-step surface scale (§3.1); **Taxi
Yellow** introduced as the warm accent Warm Sand's retirement had left missing (§3.1, §3.7); cards,
photography and whites pushed for contrast (§9.3); the navigation rebuilt as floating glass (§9.4);
the countdown's tiles removed (§9.7).

**Version 1.3** — the countdown rebuilt as a homecoming scene with a drawn autumn dusk (§9.7);
a hard crimson budget written and enforced after red had crept onto every label and bullet (§3.6).

**Version 1.2** — the mark rebuilt as a filled alpona medallion from the kolka references (§5);
a six-motif alpona library added (§6); iconography split into filled cultural **emblems** and line
**utility icons** (§7).

**Version 1.1** — Warm Sand retired from the interface in favour of Ash (§3.1); the mark rebuilt as
a kolka (§5); motifs, iconography and the countdown added (§6, §7, §9.7); navigation and
inputs rebuilt as lines rather than boxes (§9.4, §9.5); and a hard rule written for where Bengali is
allowed to appear (§4.3).

---

## 1. The idea

**My Kolkata is not a festival website. It is a title sequence for a city.**

Two of the four moodboards are literally three-panel film strips — kaash phool under a monsoon
sky, the Setu through rain-flecked glass. The city is already being seen letterboxed. So the
product is built the same way: **cinematic bands, stacked, each one a shot.**

Durga Puja is the emotional centre, not the decoration. The Puja is *when* the city is most
itself; the site is about the city all year.

**Keywords:** `Cinematic` · `Premium` · `Editorial` · `Rooted` · `Restrained` · `Warm`

### The ratio

- **70%** modern digital product
- **30%** Bengali cultural expression

Tradition arrives through photography, Bengali type, the alpona line, and timing — never
through clip-art, never through gold gradients, never through a border made of diyas.

### The one-line test

> "This feels like Kolkata — and I have never seen it presented like this before."

---

## 2. What the moodboards actually said

Recording this so future decisions can be traced back to evidence rather than taste.

| Image | What it contributes |
|---|---|
| **Red Inferno pantone board** | Red is a *material*, not a hue — silk, hibiscus, pomegranate, sandstone, lac bangles. Every red in the UI should feel like it has a surface. |
| **Kaash phool / idol / shiuli / pandal street** | The film-strip stack. The thin crimson tick before a caption. The cool-blue dusk of pre-Puja Kolkata against warm pandal light. |
| **"The Art of Noticing"** | Type as image. A quiet, lowercase caption doing more work than a loud one. The product's voice: observant, not promotional. |
| **Monsoon Setu / Anandamela** | The colour grade. Teal-cold shadows, warm skin and crimson highlights. Nostalgia rendered as *contrast*, not sepia. |

Two things in that list are not in `self.md` and are deliberate additions: the **film-strip band**
as a layout primitive, and **Monsoon Teal** as a shadow grade (§3.2).

---

## 3. Colour

### 3.1 Core palette

**The black is a scale, not a colour.** A flat `#161616` was the single biggest thing holding the
interface back: whites went grey on it, reds went muddy, and cards stopped reading as objects.
The black is now cool-tinted — it carries a whisper of the Monsoon Teal that lives in the shadows —
and it comes in three steps so surfaces can actually sit on top of one another.

| Token | Name | HEX | Role |
|---|---|---|---|
| `--mk-obsidian` | Obsidian | `#0D1012` | Base canvas — a cool rich black, never flat |
| `--mk-ink` | Ink | `#141819` | Surface 1 — cards, panels |
| `--mk-slate` | Slate | `#1C2225` | Surface 2 — elevated, hover |
| `--mk-bordeaux` | Deep Bordeaux | `#3F0D12` | Warm surface, red bands |
| `--mk-bordeaux-deep` | Bordeaux Deep | `#260A0E` | Cards on a red band — never black-on-red |
| `--mk-crimson-depth` | Crimson Depth | `#710014` | Deep accent, dramatic grounds |
| `--mk-ruby` | Ruby Red | `#98111E` | Secondary red, light-mode primary |
| `--mk-crimson` | Crimson Silk | `#D72638` | **The action colour.** Budgeted — §3.5 |
| `--mk-taxi` | Taxi Yellow | `#F2B33D` | **The Kolkata accent.** Budgeted — §3.7 |
| `--mk-ash` | Ash | `#AFA2A0` | Muted text, metadata, captions |
| `--mk-pearl` | Soft Pearl | `#F2F1ED` | Body text, laal-paar white |
| `--mk-white` | Pop White | `#FCFBF8` | Display, numerals, card titles |
| `--mk-blush` | Soft Blush | `#FBE4E3` | Rare highlight |
| `--mk-sand` | Warm Sand | `#B38F6F` | **Retired from the interface.** Photography and illustration only |

### Why Warm Sand was retired, and what replaced it

`#B38F6F` went muddy against the ground — it read as dust rather than warmth, and it dragged every
caption down with it. Muted text became **Ash**. But retiring it left the palette with no warm
accent at all, which is what made the whole thing feel like red-on-black and nothing else.

**Taxi Yellow `#F2B33D` is the replacement** — and it is not a "festival gold". It is the specific
yellow of a Kolkata Ambassador taxi and of Durga's protima. It earns its place twice over:

- It is the only accent in the palette that **passes AAA on the canvas** (10.3:1), so it can carry
  small text and fine detail where Crimson Silk (3.8:1) legally cannot.
- Black, white, red and a little yellow is the actual colour of the city — a yellow cab against
  red brick under a dark sky.

### 3.2 The grade (addition)

| Token | Name | HEX | Role |
|---|---|---|---|
| `--mk-monsoon` | Monsoon Teal | `#132A2E` | **Shadow grade only.** Never a fill, never a text colour, never a border. |

Monsoon Teal exists because a red-on-black interface goes flat fast. Real cinema puts a cold
tone in the shadows so the warm tones have something to be warm *against* — which is exactly
what the Setu image does. It appears only inside gradients and shadows, at low opacity:

```css
/* the house shadow — cold, not grey */
box-shadow: 0 24px 60px -20px rgba(19, 42, 46, 0.7);

/* the house background */
background:
  radial-gradient(1200px 600px at 72% 12%, rgba(152, 17, 30, 0.20), transparent 60%),
  radial-gradient(900px 500px at 10% 88%, rgba(19, 42, 46, 0.55), transparent 60%),
  var(--mk-obsidian);
```

`self.md` rules out "random greens." This is not a green — it is a shadow temperature, and it is
never seen as a colour in its own right. If it ever reads as teal on screen, it is being misused.

### 3.3 Hierarchy

**Dark (primary experience)**

```
canvas      #0D1012          the cool rich black
surface 1   #141819          cards, panels
surface 2   #1C2225          elevated, hover
warm        #3F0D12          red bands
warm deep   #260A0E          cards sitting on a red band
primary     #D72638          one per viewport
accent      #F2B33D          small, warm, legible
display     #FCFBF8          headlines, numerals, card titles
body        #F2F1ED
muted       #AFA2A0
shadow      #000 / #132A2E   cold, never grey
```

**Light (long-form only — Stories, Culture, articles)**

```
paper       #F2F1ED
card        #FBE4E3
text        #0D1012
primary     #98111E          the deeper red reads better on paper
accent      #C98A1F          Taxi darkened, so it holds on white
cta         #D72638
muted       #AFA2A0
```

### 3.4 Rules

- **Red is a material.** It should look like silk or sandstone, never like a notification badge.
- **One Crimson Silk moment per viewport.** If two things are `#D72638`, one of them is wrong.
- Never place `#D72638` on `#98111E`. The two reds must be separated by a neutral or a gap.
- Depth comes from the **surface scale** `#0D1012 → #141819 → #1C2225`, and from Bordeaux for warm
  surfaces. Never from grey, and never from tinting the air with a gradient.
- **Never lay flat black alpha over red.** It goes muddy every time. A scrim over a red or warm
  ground passes *through Bordeaux* on its way to black —
  `linear-gradient(0deg, rgba(10,13,14,0.86), rgba(38,10,14,0.3) 34%, transparent 58%)`.
- Never a flat black canvas. If a screen looks dead, the black is doing nothing — give it the
  cool tint and the surface steps.
- Never introduce gold, and never reach for Warm Sand as a substitute for it.
- Warm Sand never sets type and never becomes a background. It belongs to photographs.
- No pure `#000` and no pure `#FFF` anywhere in the UI.

### 3.5 The crimson budget

The rule in §3.4 — *one Crimson Silk moment per viewport* — is easy to write and easy to break. It
was broken badly in v1.2: spec labels, list bullets, hex values, axis readouts, radius labels and
every quote border were crimson, which put roughly seventeen red elements on a single screen and
flattened the whole palette into one loud note.

**Crimson Silk `#D72638` is permitted on exactly these things, and nothing else:**

- Primary buttons
- The active navigation item, and the nav's laal-paar edge
- Focus rings
- The medallion disc and the sprig
- The caption tick
- Live form-control accents — slider thumbs, a focused input's border
- A single hovered element's accent

**It is not permitted on:** metadata, labels, definition terms, list bullets, hex values, table
values, captions, quote borders, or any text smaller than 24px.

Those all take **Ash**, or Pearl at low emphasis. Structural marks — bullets, rules, quote borders —
take a neutral `rgba(242, 241, 237, 0.16–0.30)`.

**Red washes are capped.** A background gradient of Ruby or Crimson Depth never exceeds **0.30
alpha**, and never appears on more than one band in a row. Depth comes from the Bordeaux and
Obsidian *surfaces*, not from tinting the air.

If a screen looks red, count the crimson elements. The answer should be one.

### 3.6 Contrast

Measured against Obsidian `#0D1012` unless stated.

| Pair | Ratio | Verdict |
|---|---|---|
| Pop White `#FCFBF8` on Obsidian | 18.5:1 | AAA — display, numerals |
| Soft Pearl `#F2F1ED` on Obsidian | 16.9:1 | AAA — body text |
| Soft Pearl on Deep Bordeaux `#3F0D12` | 14.5:1 | AAA — body on red surfaces |
| **Taxi Yellow `#F2B33D` on Obsidian** | **10.3:1** | **AAA — the accent that may carry small text** |
| Obsidian on Taxi Yellow | 10.3:1 | AAA — yellow badges, yellow buttons |
| Ash `#AFA2A0` on Obsidian | 7.2:1 | AA — captions, metadata ✓ |
| Soft Pearl on Crimson Silk `#D72638` | 4.4:1 | AA — button labels, ≥16px |
| Crimson Silk on Obsidian | 3.8:1 | **Large text ≥24px, icons and rules only** |

The deeper black lifted every ratio. It also sharpens the working rule: **where you want a small
coloured thing to be read, it is yellow, not red.**

### 3.7 The yellow budget

Taxi Yellow gets a budget for the same reason Crimson does — an accent used everywhere is not an
accent. Roughly **one or two yellow elements per viewport**.

**Permitted:**

- Countdown unit labels, and other small data labels that need to lift off the ground
- Live values a person is changing — a variable-font axis readout, a slider's current number
- The Ambassador taxi icon, which is literally that yellow
- Emblem accents where the object itself is yellow: the **diya flame**, the **mukut** gems,
  the **kalash** coconut band
- Caution and "large text only" badges
- The moon in the countdown sky
- One hover accent per component

**Not permitted:**

- Body text, headings, or anything Pearl already does well
- As a second action colour — buttons are Crimson, always
- Large fills, gradients, or backgrounds. Yellow is a spark, not a surface.
- Beside Crimson at the same size in the same element — pick one

## 4. Typography

### 4.1 The families

| Family | File | Use |
|---|---|---|
| **Clear Sans Display** | `/fonts/clear-sans-display.woff2` | Latin headlines, display, numerals |
| **Clear Sans Text** | `/fonts/clear-sans-text.woff2` | Latin body, UI, captions |
| **Noto Sans Bengali** | `/fonts/noto-sans-bengali-variable.woff2` | All Bengali. Variable: `wght` 100–900, `wdth` 62.5–100 |

### 4.2 The constraint that shapes everything

**Clear Sans ships Regular only. There is no bold.**

This is the single most defining fact about the type system, and it is treated as an asset:

> **Latin hierarchy is built from size, tracking and colour. Never from weight.**

Consequences, all enforced:

- Never set `font-weight` above 400 on Latin text. The browser will synthesise a fake bold and
  it looks broken at display sizes.
- Contrast between a headline and its caption comes from a **4× size jump minimum**, plus a
  tracking shift, plus a colour shift Pearl → Ash.
- Display type tightens: `letter-spacing: -0.035em` at 72px+. Body opens slightly: `0.01em`.
- Where a design truly needs a heavier Latin voice, it gets **larger**, not heavier.

If bold Latin is ever required, the correct fix is to add the real Clear Sans Bold and Medium
files — never `font-weight: 700` on the Regular.

### 4.3 The balance between Bengali and Latin

Bengali is the only family with a live weight axis, so **Bengali is where the type gets loud.**
This inversion is the point: Bengali is the emphatic voice, Latin the quiet one.

But an emphatic voice used constantly stops being emphasis. Bengali appears in **four places, and
nowhere else**:

1. **The wordmark** — আমার কলকাতা, set at **38% of the Latin size**, `wght 500`, in Ash. A whisper
   under the title, never a second headline.
2. **Words with no English equivalent** — কলকা, আলপনা, ঢাক, ধুনুচি, কাশফুল, শিউলি, পুষ্পাঞ্জলি.
   A section heading may carry its Bengali *only when the English heading is a transliteration of
   that Bengali word*.
3. **Real content** — the five days, a greeting, a line someone would actually say.
4. **Place and para names** as people write them.

**Never:**

- As a translation label under an English heading. The section called Type has no অক্ষর beneath it;
  Colour has no রঙ; Motion has no গতি. That is decoration, and decoration is exactly what this
  system spends its restraint avoiding.
- To fill a section that has no Bengali content.
- Letter-spaced — it breaks the মাত্রা.
- At the same size *and* weight as the Latin beside it. One of the two leads; the other follows.

### Setting Bengali

```css
.mk-bengali-display {
  font-family: 'Noto Sans Bengali', sans-serif;
  font-variation-settings: 'wght' 600, 'wdth' 100;
  line-height: 1.5;              /* headroom for the matra */
  letter-spacing: 0;             /* never track Bengali */
}
```

- Line-height minimum `1.5`, against `1.05` for Latin display — Bengali has tall ascenders and deep
  descenders and will collide otherwise.
- Bengali reads smaller than Latin at the same px. When the two sit on one line **at the same rank**,
  set Bengali ~8% larger. When Bengali is subordinate, size it well below and let it recede.
- Compress with `wdth` to 85 for tight slots. Below 80 it distorts.

### 4.4 Scale

Desktop. Every size is Clear Sans unless noted.

| Role | Size | LH | Tracking | Family | Colour |
|---|---|---|---|---|---|
| Title card | 104px | 0.95 | −0.04em | Display | Pearl |
| Display | 72px | 1.0 | −0.035em | Display | Pearl |
| H1 | 52px | 1.05 | −0.03em | Display | Pearl |
| H2 | 38px | 1.1 | −0.02em | Display | Pearl |
| H3 | 26px | 1.2 | −0.01em | Display | Pearl |
| Statement | 30px | 1.4 | 0 | Display | Pearl / Blush |
| Bengali display | 44px | 1.5 | 0 | Bengali `wght 700` | Crimson / Pearl |
| Bengali body | 19px | 1.75 | 0 | Bengali `wght 400` | Pearl |
| Body large | 19px | 1.65 | 0.005em | Text | Pearl |
| Body | 16px | 1.65 | 0.01em | Text | Pearl |
| Caption | 14px | 1.5 | 0.015em | Text | Ash |
| Metadata | 13px | 1.4 | 0.02em | Text | Ash |
| Nav | 15px | 1 | 0.01em | Text | Pearl / Ash |

**Mobile:** title card 46px, display 36px, H1 30px, H2 25px, H3 20px, body 16px.
Tracking relaxes by roughly `0.01em` as sizes drop — tight tracking only works big.

### 4.5 Measure

- Latin body: **62–72 characters.** Hard cap 78.
- Bengali body: **50–58 characters** — Bengali conjuncts are wider and tire the eye sooner.
- Captions: 40–50.

### 4.6 Banned typographic moves

These are house rules, and they are absolute:

- **No ALL-CAPS eyebrow labels** above headings. The tick (§5) does that job.
- **No `01 / 02 / 03` markers** unless the content is genuinely a sequence.
- **No middle-dot meta strings** (`Kolkata · 7pm · Free`). Use spacing or the tick.
- **No accenting one word** of a headline in a different colour or italic.
- **No monospace** for labels or metadata. Monospace is permitted for exactly one thing:
  hex values in the brand kit, where it is real data.
- **No `→` glyph appended to text links.** The arrow belongs to primary buttons only, where
  it is a moving object, not punctuation (§9.1).
- No more than **two** type sizes in any single component.

---

## 5. The mark — কলকা

**This is the brand's signature. Everything else stays quiet so this one thing can be intricate.**

Built from `design/kolka_design.png` and `design/kolka_design_2.png`: a solid red disc with petals
and dots opening around it, flanked by two spiral volutes carrying leaves and budded stems. It is
the alpona a Bengali household paints on its floor, drawn as a mark.

**It is filled, not outlined.** That is the single most important thing about it — alpona is made
with a fingertip and rice paste, not a pen. An outlined version of this mark is wrong.

### Two forms

| Form | Size | Where |
|---|---|---|
| **Medallion** | 96px and up | Hero, mark stage, closing, logo lockup. One per viewport. |
| **Sprig** | below 56px | Section headings, nav, card bullets, list markers. A teardrop over two dots. |

There is no third form. Below ~20px the sprig stops being legible; use nothing rather than a smudge.

### Medallion construction

On a `240 × 240` grid, centre `(120, 116)`, disc radius `25`:

| Part | Spec |
|---|---|
| Disc | Crimson Silk, r25. The only crimson in the mark. |
| Petals | Ten solid teardrops at 0, ±34, ±66, ±110, ±143, 180 degrees. Lengths 30–58. |
| The ±90° gap | Deliberately empty — it is where the volutes attach |
| Volutes | Two mirrored spiral scrolls, 4.5px stroke, each with three hanging leaves and a budded stem |
| Dots | Two above, two below on the vertical axis, descending in size — the alpona signature |
| Colour | Soft Pearl body, Crimson Silk disc. On paper: Obsidian body, Ruby Red disc. |

### The bloom

The mark animates in the order alpona is actually painted — **centre first, then outward**:

```
disc  →  petals  →  volutes  →  leaves  →  buds  →  dots
0ms      140ms      420ms       760ms      980ms   1120ms
```

Total 1.3s. It is one of only two unrequested animations on a page (§11.3).

### Rules

- One medallion per viewport. Headings get the sprig.
- Never outlined, never rotated, never mirrored on the vertical axis, never set in gold.
- The disc is never any colour but Crimson Silk (Ruby Red on paper).
- Never place the medallion on a photograph — it needs a flat ground to read.

### Logo lockup

```
(medallion) MY KOLKATA
            আমার কলকাতা
```

Medallion at 76px, then Latin at 28px tracked `0.14em`, then Bengali at 14px `wght 500` in Ash.
Clear space on all sides equals the cap-height of the Latin.

## 6. Motifs

Four structural devices, plus a library of six drawn motifs. The four shape sections and edges;
the six are ornament you place deliberately.

### Alpona — আলপনা

A single continuous line, used three ways and no others:

1. **The rule.** A hairline in Ash at 40% opacity that spends its last 90px becoming a curl and
   terminates in a kolka. Draws itself once when it enters the viewport.
2. **The ground.** A large alpona figure at **3–5% opacity** in Crimson Depth behind a full-bleed
   band. If a viewer can describe it, it is too strong.
3. **The load state.** The line drawing itself is the loading indicator. There are no spinners.

### Laal-paar

The red border of a white saree, reduced to a band edge: a Pearl ground, two Ruby rules, and a row
of small arches. **22px tall, tiled at a fixed size** — build it with an SVG `<pattern>` in px
units, never a stretched `viewBox`. Once or twice a page, as an edge. Never as a frame.

### Chalchitra

The painted arch behind the idol, kept as bare geometry — two concentric arcs with radiating
spokes. It shapes feature panels and pandal-style cards. A silhouette, not a painting.

### Shola

White pith filigree from the crown: an eight-petal rosette in Pearl. **The only white-on-red
ornament in the system, and the only one allowed to be delicate.** Reserve it for ceremony.

### The alpona library

Six motifs read straight off a sheet of hand-drawn alpona — solid, symmetrical, built from
teardrops and descending dot runs. They are the vocabulary the medallion is made from, available
on their own where a full medallion would be too much.

| Motif | Job |
|---|---|
| Finial | Section openers, the top of a feature panel |
| Flame | Celebration — a completed contribution, a milestone |
| Rosette | Avatars, para badges, category markers |
| Star flower | Ratings, highlights, editor picks |
| Bead run | Vertical dividers, timeline nodes |
| Curl | Quote marks, pull-quotes, end-of-article marks |

**Library rules**

- Filled, never outlined. Pearl body, at most one Crimson accent.
- Vertical symmetry always. Never rotate one onto its side.
- One motif per component. They do not stack or combine.
- They never replace an icon, and never carry meaning on their own.

## 7. Emblems and icons

Two sets, deliberately opposite, so they can never be confused.

### 7A. Emblems — filled, cultural

Two-tone marks in the alpona vocabulary: **a Pearl body with one Crimson accent**, exactly the way
an alpona is painted around a red disc. Drawn on a 64px grid. These are the brand's cultural voice —
used large, used rarely.

| Emblem | Bengali | Job |
|---|---|---|
| Durga's eyes | চোখ | The most recognisable mark in Bengal. Brand moments, splash, empty states. |
| Mukut | মুকুট | The crown. Premium, featured and awarded states. |
| Dhaak | ঢাক | Rhythm and arrival. Live and now-playing. |
| Dhunuchi | ধুনুচি | Smoke and evening aarti. Atmosphere, evening listings. |
| Shankha | শাঁখ | The call. Announcements, notifications. |
| Lotus | পদ্ম | Purity. The recurring secondary symbol beneath the kolka. |
| Diya | প্রদীপ | Hope, a light left on. Saved items, favourites. |
| Kalash | কলস | Prosperity. Contribution, community funds. |
| Trishul | ত্রিশূল | Strength and protection. Account security, verified paras. |
| Kash phool | কাশফুল | The season turning. Dates, countdowns. |
| Shiuli | শিউলি | Morning, the first day. New, unseen, just added. |

**Emblem rules**

- Never smaller than **40px** — the fills collapse below that.
- A Pearl body with **one** accent. That accent is Crimson Silk, except where the object itself is
  yellow — the diya's flame, the mukut's gems, the kalash's coconut band — which is where Taxi
  Yellow lives (§3.7). Never a third colour in one emblem.
- Never outlined.
- On paper the Pearl becomes Obsidian and the Crimson becomes Ruby Red.
- Never used where a UI icon belongs. An emblem is a statement, not a control.
- The idol's face is never an emblem. The eyes are as close as the system goes.

### 7B. Icons — line, utility

The deliberate opposite: **32px grid, 1.5px stroke, no fills, rounded joins.** Utility work only.

| Icon | Job |
|---|---|
| Howrah Bridge | The city itself — map and location states |
| Tram | Transport, routes, getting there |
| Ambassador taxi | Rides, directions, distance |
| Hand-pulled rickshaw | North Kolkata, heritage walks |
| Victoria Memorial | Landmarks, monuments, guided routes |
| North Kolkata balcony | Neighbourhoods, paras, old houses |
| Hooghly boat | The river, the ghats, crossings |
| Cha in a bhaar | Food and drink, adda, places to sit |
| Phuchka | Street food, markets, Gariahat |
| College Street | Stories, long-form, the archive |
| Hand-painted signage | Listings, names, para clubs |
| Street lamp | Night mode, after-dark listings |

**Icon rules**

- Crimson Silk for active states, Soft Pearl on dark, Obsidian on paper.
- Never two colours in one icon. Never a filled variant — filling one turns it into an emblem.
- **An icon without a job does not ship.**
- An icon never carries meaning alone; it always sits beside a word.

### 7C. Archetype sigils — v1.5

The nine Pujo Personality archetypes each have a sigil, drawn **exactly like an emblem**: filled,
never outlined, on the 64px grid, never below 40px, a Pearl body with one accent. The accent is
Crimson, or Taxi Yellow where the object itself is yellow (the Night Owl's bulb, the Pet Pujari's
beguni). On paper the body becomes Obsidian and the accent Ruby, as for every emblem.

| Archetype | Sigil | Accent |
|---|---|---|
| Night Owl | A crescent cradling one Chandannagar bulb | Taxi Yellow |
| Pandal Hunter | A compass rose of alpona teardrops | Crimson, the north point |
| Para Kid | The dhaak with its plume (the *Dhaak* emblem) | Crimson |
| Pujo Romantic | Two kaash plumes tied with one thread | Crimson, the thread |
| Pet Pujari | A sal-leaf plate, khichuri heaped on it | Taxi Yellow, the beguni |
| Art Kid | The chalchitra arch | Crimson, the central disc |
| Addabaaz | Two bhaar cups touching | Crimson, the steam |
| Dhunuchi | The dhunuchi, smoke rising (the *Dhunuchi* emblem) | Crimson, the embers; Taxi Yellow on its own Crimson Depth card |
| Shiuli | Five petals and one stem (the *Shiuli* emblem) | Taxi Yellow, the stem |

- One source: the shapes live as data in `frontend/lib/pujo-personality/sigils.ts`, so the page,
  the share-card canvas and the link previews all draw the same sigil.
- A sigil blooms once, part by part, in the reveal. That is the page's one moment (§11.3).
  Everywhere else it is still.
- A sigil is an identity, never a control, and never sits directly on a photograph.

## 8. Layout — the band

### 8.1 The primitive

The page is a stack of **bands**. A band is full-bleed, has one job, and is separated from its
neighbours by black — the letterbox.

```
┌──────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓ letterbox #161616 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
├──────────────────────────────────────────────┤
│                                              │
│   full-bleed image, 2.39:1                   │
│   gradient scrim from bottom-left             │
│                                              │
│  │ Kumortuli                                 │
│    Where the goddess is built                │
│                                              │
├──────────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────┘
```

Cinematic bands use **2.39:1** on desktop and **4:5** on mobile — the crop changes, the
composition does not.

### 8.2 Grid

**Desktop** — 12 columns, 28px gutters, 80px outer margin, max content width 1440px.
**Tablet** — 8 columns, 24px gutters, 40px margin.
**Mobile** — 4 columns, 16px gutters, 20px margin.

### 8.3 Alignment

**Left, always.** Content hangs on the left edge with a deliberately deep right margin —
title-card composition. Text blocks occupy columns 1–7 of 12 and the remaining space is
left empty on purpose; do not fill it.

Centred text is permitted in exactly one place: the title card at the top of a page.
Never centre body copy. Never justify anything.

### 8.4 Spacing

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160`

Band padding: `128px` desktop, `96px` tablet, `64px` mobile.
Within a band, related items sit at `16–24px`; a heading is `32px` from its body;
unrelated groups are `64px+` apart. Space carries the hierarchy — never a divider line.

### 8.5 Radius

Radius encodes role. Never apply one radius to everything.

```
0px      full-bleed bands, letterbox edges, images that touch the viewport
8px      inputs, chips, small controls
12px     content cards
20px     feature panels, sheets
28px     modals, the hero card
999px    avatars only
```

---

## 9. Components

### 9.1 Buttons

**Primary** — `#D72638` fill, `#F2F1ED` label at 16px, 14px × 28px padding, radius 8px.
Carries a `→`. On hover: background → `#98111E`, arrow translates `4px`, 200ms.
The button does not scale. The arrow moves.

**Secondary** — transparent, 1px `rgba(242,241,237,0.22)` border, Pearl label.
On hover: border → `rgba(242,241,237,0.45)`, background → `rgba(242,241,237,0.04)`.

**Text** — Pearl label, 1px Crimson underline that grows from the left on hover, 200ms.
No arrow.

**Rules:** one primary per view. Minimum target 44×44px. Focus is a 2px Crimson Silk ring at
2px offset — visible on every control, always. No bounce, no scale, no shadow on press.

### 9.2 The banner (Netflix, adapted)

The hero band of any landing or detail page.

```
full-bleed 2.39:1 image, slow 12s zoom to 1.06
scrim: linear-gradient(90deg, rgba(22,22,22,.92) 0%, rgba(22,22,22,.55) 45%, transparent 78%)
       plus linear-gradient(0deg, #161616 0%, transparent 40%)
content sits bottom-left, columns 1–6
```

```
│ DURGA PUJA
  আশ্বিনের শারদপ্রাতে

  Five days. One city. Everyone comes home.

  [ Explore the Pujo → ]   [ Watch the film ]
```

Netflix's contribution is the **scrim discipline and the bottom-left anchor** — content never
floats in the middle of an image, and the image is never darkened uniformly. The gradient does
the work so the photograph keeps its highlights.

### 9.3 Content card

Cards are objects. They sit **on** the canvas, not in it — which only works because the black
underneath them is a real surface scale (§3.1).

```
┌────────────────────┐
│                    │   image 16:10, radius 14px, card shadow
│                    │
└────────────────────┘
(sprig) Kumortuli        ← sprig + title in Pop White, Display 22px
        North Kolkata    ← Ash 13px, goes Taxi Yellow on hover
        Where the goddess is built
```

| Part | Spec |
|---|---|
| Media | `16 / 10`, radius 14px, `--mk-ink` behind, `0 18px 40px -20px rgba(0,0,0,0.85)` |
| Image | `saturate(1.06) contrast(1.18) brightness(1.05)` — vibrant, not washed |
| Scrim | Black **through Bordeaux**, never flat black on the image |
| Title | Pop White, so it lifts off the ground |

**Hover:** the media lifts `4px`, its shadow deepens, the image scales `1.05`, the title lifts
`2px`, and the sub-line goes Taxi Yellow. 220ms. The sprig does **not** animate — a grid of
blooming marks is the wallpaper §5 forbids.

Earlier versions desaturated card images to `0.82` and gave them no shadow. That is why they sat
flat and dead on the page. Photography is the strongest asset the brand has; do not mute it.

**Rows** scroll horizontally on mobile with `scroll-snap-type: x mandatory`.

### 9.4 Navigation

**A floating glass bar.** Not a full-bleed strip with a hairline — that read as flat chrome and
looked like every other admin template.

```css
position: fixed;
top: clamp(10px, 1.5vw, 18px);
left: clamp(12px, 3vw, 40px); right: clamp(12px, 3vw, 40px);
border-radius: 18px;
background: linear-gradient(180deg, rgba(36,43,47,0.52), rgba(13,16,18,0.34));
backdrop-filter: blur(26px) saturate(180%);
border: 1px solid rgba(242,241,237,0.13);
box-shadow: 0 20px 44px -22px rgba(0,0,0,0.9),
            inset 0 1px 0 rgba(242,241,237,0.16);
```

The two details that make it read as glass rather than as a grey box: the **saturate(180%)**, which
lets colour from whatever is behind it bleed through, and the **inset top highlight**, which is the
lit edge of a pane. Without those it is just a translucent rectangle.

After 80px of scroll the fill deepens and the border brightens. That is the whole state change.

| Part | Spec |
|---|---|
| Wordmark Latin | 13px Display, tracked `0.18em`, Pop White |
| Wordmark Bengali | 11px, `wght 500`, Ash — beneath the Latin, never beside it |
| Links | 14.5px Ash → Pop White on hover, 120ms |
| Hover / active | A 14px Crimson bar under the link, scaling from the centre |
| Search underline | Goes **Taxi Yellow** on focus, growing from the left |
| Below 900px | Links collapse; wordmark and search remain |

Never: pill backgrounds behind links, a bordered box around the search, or an opaque bar.

### 9.5 Inputs

**The line input is the house input.** Transparent, no radius, no fill — a 1px bottom rule in
`rgba(242,241,237,0.18)` that goes Crimson Silk and grows from the left on focus, 200ms.
Placeholder in Ash. Used for search, filters, and anything inline.

```
(o) Search a para, a pandal, a street
─────────────────────────────────────
```

**The field input** is the only boxed variant, and only for real forms — sign-up, contribute,
profile. `rgba(242,241,237,0.05)` fill, 1px `rgba(242,241,237,0.14)` border, radius 8px,
14px × 16px padding, Pearl text, Ash placeholder. Focus takes a Crimson border plus a 2px ring at
20% opacity. No glow, no inner shadow.

### 9.6 The caption

Straight off the kaash-phool photograph: two lines, a tick, nothing else.

```
| Happiness is
      these golden days coming back around.
```

- A 3px Crimson bar, full height of the block.
- First line 21px Text in Pearl.
- Second line 30px Display in Soft Blush, **indented `32px` from the first**.
- The device is the indent. Not an italic — the type system has no italic to give, and a synthetic
  oblique on a Regular-only face looks broken.

Sits bottom-left over a photograph, inside the same scrim discipline as the banner.

### 9.7 The countdown

Durga Puja is the emotional centre of the product, so the wait for it is the product's warmest
moment — not a widget. It is a **homecoming**, and it says so.

```
┌───────────────────────────────────────────────────────┐
│  autumn dusk, kaash phool, a low moon                 │
│                                                       │
│                                                       │
│  পুজোয় বাড়ি ফিরছ তো?                                  │
│  Welcome home.                                        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                          │
│  │ 29 │ │ 21 │ │ 08 │ │ 05 │                          │
│  │days│ │hrs │ │mins│ │secs│                          │
│  └────┘ └────┘ └────┘ └────┘                          │
│  till Mahalaya, 10 October.                           │
└───────────────────────────────────────────────────────┘
```

**The scene.** A 21:9 band (4:5 on mobile) holding an autumn dusk: Monsoon Teal at the top of the
sky grading through Bordeaux to a **Warm Sand horizon glow**, a low pale moon, soft cloud bands, and
a field of kaash phool. It is drawn rather than photographed — deliberately, because it lets the sky
use the two most neglected colours in the palette instead of adding more red.

A kaash plume is a **dense soft spike**: a stem with roughly eighteen short barbs angled steeply
upward over a faint ellipse of mass. Long, widely spaced barbs turn it into a fern frond.

Everything is generated from a **fixed seed**. Never `Math.random()` in the component — the server
and the client must draw the same grass or hydration desynchronises.

To swap in a photograph, put it behind the scrim and delete the drawn sky. Nothing else changes.

**The clock — no boxes.** An earlier version put each number in a keycap tile. It was chunky, but it
was chrome: four boxes competing with the photograph behind them. The numerals now carry their own
weight, which is more elegant and reads better over an image.

| Part | Spec |
|---|---|
| Numeral | Display up to 84px, `line-height 0.86`, `-0.05em`, Pop White |
| Weight | `text-shadow: 0 14px 34px rgba(0,0,0,0.6)` — the numerals sit *on* the sky |
| Numerals | **`font-variant-numeric: tabular-nums`**, always |
| Label | 11px **Taxi Yellow**, tracked `0.14em`, lowercase |
| Gap | `clamp(16px, 3.2vw, 44px)` — all four units stay on one line to 1440px |

**Copy.** Bengali leads, because the greeting *is* Bengali — case 3 of §4.3, not decoration.
পুজোয় বাড়ি ফিরছ তো? then *Welcome home.* then the count, then the date. Warm, second person,
and never "Don't miss out".

**Rules**

- Tabular numerals are mandatory; without them the seconds column jitters every tick.
- Render `--` until the client has mounted, or SSR produces a hydration mismatch and a visible flash.
- **Every date lives in one constant** and moves each year with the panjika. Confirm before each season.
- The clock is information, so it keeps ticking under `prefers-reduced-motion` (§11.3).
- No crimson in this band at all. The warmth comes from the horizon, not the accent.

### 9.8 The Pujo Personality — v1.5

A chapter of this system, not a new brand: variety comes from the archetype's ground, hour,
Bengali name and sigil, never from new UI colours.

**Card grounds.** Each archetype owns one surface from the existing scale and one accent for
small labels such as its hour. Sigil accents follow §7C.

| Archetype | Ground | Label accent |
|---|---|---|
| Night Owl | Obsidian | Taxi Yellow |
| Pandal Hunter | Slate | Taxi Yellow |
| Para Kid | Deep Bordeaux | Taxi Yellow |
| Pujo Romantic | Bordeaux Deep | Soft Blush |
| Pet Pujari | Ink | Taxi Yellow |
| Art Kid | Soft Pearl (paper) | Ruby |
| Addabaaz | Ink | Taxi Yellow |
| Dhunuchi | Crimson Depth | Soft Pearl (Crimson disappears on it: the tick is Pearl, and the sigil's embers Taxi Yellow) |
| Shiuli | Soft Blush (paper) | Ruby |

**The profile band.** The sigil, then the Bengali name leading at `wght 700`, the Latin name
following in Display, the tagline in the caption device (§9.6). The one Crimson moment is the
primary button, *Share my Pujo →*.

**The Pujo DNA chart.** Fourteen filled teardrops around a Crimson disc, one per dimension,
grouped by family, with the medallion's gaps at ±90°. Petal length is relative to how most
people answer; a dashed ring marks typical. Petals are labelled on tap, never on the chart, and a
list beneath says the same in words. Static on share cards.

**Share cards** are drawn on the phone, on a canvas: Story 1080 × 1920 (key content clear of the
top 220px and bottom 380px) and Post 1080 × 1350. Link previews (1200 × 630) are built on the
server from **pre-shaped outlines**, because the image renderer cannot shape Bengali and the
house Latin faces are licensed web fonts that stay in `public/fonts`. A first name may go on a
card image; it never goes into a link. Prefilled captions are product copy: no emoji.

**The reveal**, the one unrequested moment: letterbox bars retract (700ms), the Bengali name
rises 12px (320ms), the sigil blooms part by part (~1.3s), the tagline appears (320ms). Under
reduced motion it renders in its final state.

## 10. Photography

The strongest asset the brand has. Everything above exists to get out of its way.

**Grade** — this is the Setu image, specified:

- Shadows lifted slightly and pushed **cold** toward Monsoon Teal
- Highlights warm — lamp light, skin, brass
- Overall saturation slightly down, **except** the reds, which stay full
- Strong contrast, deep blacks that are not crushed
- Subtle grain
- Soft vignette

**Subjects** — hands, sindoor, silk, dhak, kumortuli clay, shiuli on wet grass, kaash phool
against grey sky, tram wires, pandal light tunnels, rain on glass, crowds at night, North
Kolkata balconies, para life.

**Rules**

- Not every image is red. Red should arrive from the subject — silk, flowers, sindoor, sandstone.
- People over objects. Hands over faces where a face would date the image.
- Never a stock-looking smiling group.
- Never a filter that reads as Instagram-preset.
- The idol's face is used sparingly and never cropped awkwardly or overlaid with UI. Respect
  is a design constraint here, not a nicety.

---

## 11. Motion

Motion is cinematic: **slow to start, decisive to finish.** Nothing bounces. Nothing spins.

### 11.1 Curves

```css
--mk-ease-out:   cubic-bezier(0.16, 1, 0.3, 1);      /* reveals, entrances */
--mk-ease-in-out:cubic-bezier(0.65, 0, 0.35, 1);     /* moves, transitions */
--mk-ease-draw:  cubic-bezier(0.32, 0.72, 0, 1);     /* the alpona line */
```

### 11.2 Durations

```
120ms   focus rings, colour-only changes
200ms   hover — the standard
320ms   expand, open, reveal
1.3s    the medallion bloom (disc → petals → volutes → leaves → buds → dots)
700ms   band entrance
12s     hero image zoom
```

### 11.3 The one moment

**A page gets exactly one piece of motion the user did not ask for.**

The countdown (§9.7) is the single sanctioned exception: a ticking clock is *information*, not
decoration, and it keeps ticking under `prefers-reduced-motion`.
 On My Kolkata, that is the
title sequence: the letterbox bars retract from the top and bottom, the title fades up 12px, and
the medallion blooms. Once, on load, and never again.

Everything else responds to a person: hover, click, expand, drag, scroll-snap.

**Explicitly banned:** fade-and-slide-up on every section as it enters, hover transitions on
every card in a grid, parallax on more than one element per page, particles, floating diyas,
rotating chakras, counters that tick up, and any looping ambient animation.

### 11.4 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Under reduced motion the medallion renders **fully bloomed** at rest, the hero image does not zoom,
and the alpona rule is drawn complete. Nothing is lost — only the timing.

---

## 12. Voice

Observant, not promotional. The "Art of Noticing" register.

**Do**

- Short sentences. Plain verbs. Sentence case.
- Say the specific thing: "Kumortuli, where the goddess is built" — not "Explore our heritage."
- Name places, paras, times, prices. Specificity is the tone.
- Bengali where Bengali is what someone would actually say — আড্ডা, পুজো, ঠাকুর দেখা.
- Buttons name their outcome: "Save this place," then a toast that says "Saved."
- Empty states invite: "Nothing saved yet. Start with a pandal near you."
- Errors state the fix: "That address didn't match. Try a landmark or a metro station."

**Don't**

- No "Discover the magic of…", no "Immerse yourself in…", no "vibrant tapestry."
- No exclamation marks.
- No "Submit." No "Learn more."
- Never explain Bengali culture *to* Bengalis. Write for someone who already belongs, and let
  the visitor follow.
- No emoji in product copy.

**Sample closing statement**

```
│ SAME CITY.
  NEW STORIES.

  পুজো আসছে।

  [ Explore the Pujo → ]
```

---

## 13. Tokens

Implemented in [`src/styles/brand-tokens.css`](src/styles/brand-tokens.css).

```css
:root {
  /* colour */
  --mk-obsidian:      #161616;
  --mk-bordeaux:      #3F0D12;
  --mk-crimson-depth: #710014;
  --mk-ruby:          #98111E;
  --mk-crimson:       #D72638;
  --mk-ash:           #AFA2A0;   /* muted UI text */
  --mk-sand:          #B38F6F;   /* photography only — never type */
  --mk-pearl:         #F2F1ED;
  --mk-blush:         #FBE4E3;
  --mk-monsoon:       #132A2E;   /* shadow grade only */

  /* type */
  --mk-display: 'Clear Sans Display', system-ui, sans-serif;
  --mk-text:    'Clear Sans Text', system-ui, sans-serif;
  --mk-bengali: 'Noto Sans Bengali', system-ui, sans-serif;

  /* space */
  --mk-1: 4px;   --mk-2: 8px;   --mk-3: 12px;  --mk-4: 16px;
  --mk-5: 24px;  --mk-6: 32px;  --mk-7: 48px;  --mk-8: 64px;
  --mk-9: 96px;  --mk-10: 128px; --mk-11: 160px;

  /* radius */
  --mk-r-sm: 8px;  --mk-r-md: 12px; --mk-r-lg: 20px; --mk-r-xl: 28px;

  /* motion */
  --mk-ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --mk-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --mk-ease-draw:   cubic-bezier(0.32, 0.72, 0, 1);
  --mk-t-fast:   120ms;
  --mk-t-hover:  200ms;
  --mk-t-reveal: 320ms;
  --mk-t-bloom:  1300ms;
  --mk-t-band:   700ms;

  /* elevation — cold shadows */
  --mk-shadow-card:  0 12px 32px -12px rgba(19, 42, 46, 0.55);
  --mk-shadow-panel: 0 24px 60px -20px rgba(19, 42, 46, 0.70);
}
```

---

## 14. Quality floor

Non-negotiable on every screen shipped:

- Works at 360px wide with no horizontal scroll.
- Every interactive element has a visible focus ring — 2px Crimson Silk, 2px offset.
- Body text meets AA. Crimson Silk never carries text below 24px on dark.
- `prefers-reduced-motion` respected.
- Touch targets ≥ 44×44px.
- Images have real alt text describing the moment, not the file.
- Bengali is marked `lang="bn"` so screen readers pronounce it.
- Fonts are self-hosted, `font-display: swap`, preloaded for the two Latin faces.
- Colour is never the only carrier of meaning.

---

## 15. The formula

```
CINEMATIC BANDS
      +
BENGALI TYPE THAT CARRIES THE WEIGHT
      +
ONE CRIMSON MARK
      +
PHOTOGRAPHY, COLD SHADOW / WARM LIGHT
      +
SILENCE AROUND ALL OF IT
      =
MY KOLKATA
```

Everything in this system is quiet so that one thing can be loud: the tick, the photograph, or
the single Crimson button. If two things are shouting on a screen, remove one.
