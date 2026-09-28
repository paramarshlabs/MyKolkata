# Durga Puja — Website Design System

## 1. Design Direction

### Core idea

**Contemporary Durga Puja: cinematic, premium, cultural, and digital-first.**

The website should feel closer to a premium entertainment platform or modern music product than a conventional festival website. The visual language takes inspiration from the clarity, confidence, and immersive presentation of platforms such as Netflix and Spotify, while maintaining a distinctly Bengali and Durga Puja identity.

**Keywords:**
`Cinematic` · `Premium` · `Modern` · `Editorial` · `Cultural` · `Immersive` · `Confident` · `Minimal`

### The balance

Use approximately:

- **70% modern digital design**
- **30% traditional cultural expression**

Tradition should come through photography, symbolism, texture, typography details, and motion — not through excessive decorative elements.

---

## 2. Color System

The palette is intentionally centered around rich reds and dark neutrals, supported by soft warm tones.

### Primary palette

| Name | HEX | Usage |
|---|---|---|
| Soft Blush | `#FBE4E3` | Soft backgrounds, highlights, subtle cards |
| Crimson Silk | `#D72638` | Primary CTA, active states, key accents |
| Ruby Red | `#98111E` | Secondary brand red, gradients, sections |
| Deep Bordeaux | `#3F0D12` | Rich surfaces, overlays, atmospheric backgrounds |
| Crimson Depth | `#710014` | Deep red accents and dramatic backgrounds |
| Warm Sand | `#B38F6F` | Secondary neutral, photography accents |
| Soft Pearl | `#F2F1ED` | Primary light surface and light-mode text |
| Obsidian Black | `#161616` | Main dark background and dark UI |

### Recommended hierarchy

**Dark experience**

- Background: `#161616`
- Secondary surface: `#3F0D12`
- Primary red: `#D72638`
- Secondary red: `#98111E`
- Light text: `#F2F1ED`
- Muted text: `#B38F6F`
- Occasional highlight: `#FBE4E3`

**Light experience**

- Background: `#F2F1ED`
- Primary text: `#161616`
- Primary red: `#98111E`
- CTA: `#D72638`
- Secondary neutral: `#B38F6F`
- Soft accent: `#FBE4E3`

### Color rules

- Red should feel **rich and intentional**, never neon.
- Avoid using all reds at equal intensity.
- Use `#D72638` sparingly for actions and moments that need attention.
- Use `#3F0D12` and `#161616` to create depth.
- Use `#F2F1ED` for breathing room and readability.
- Warm Sand should remain a supporting color rather than becoming dominant.
- Do not introduce random greens, bright yellows, or generic festival golds.

---

## 3. Brand Personality

The website should communicate:

### Faith

Quiet, powerful, respectful.

### Culture

Rooted in Bengal and Durga Puja without feeling old-fashioned.

### Community

Warm, human, inclusive, and energetic.

### Modernity

Confident, digital, clean, and highly polished.

### Emotion

Nostalgia, belonging, anticipation, celebration.

The brand should feel like:

> **A cultural experience built for the modern web.**

---

## 4. Typography

### Primary display type

Use a bold, modern sans-serif for major headlines.

Recommended:

- Sora
- Inter Tight
- Manrope
- Neue Haas Grotesk
- Helvetica Neue

#### Headline characteristics

- Large
- Bold
- Tight line-height
- Strong contrast
- Minimal decoration

Example:

```text
DURGA
PUJA
```

or:

```text
THE FESTIVAL
THAT BRINGS
US HOME.
```

### Secondary typography

Use a clean neutral sans-serif for navigation, body text, metadata, and UI.

Recommended:

- Inter
- Geist
- DM Sans
- IBM Plex Sans

### Editorial accent

A refined serif or italic serif can occasionally be used for emotional statements.

Examples:

```text
Tradition looks good
on the future.
```

or:

```text
Some things change.
Some things bring us home.
```

Do not use the serif for the entire interface.

---

## 5. Typography Scale

Recommended desktop scale:

| Element | Size | Weight |
|---|---|---|
| Hero display | 80–120px | 700–800 |
| H1 | 56–72px | 700 |
| H2 | 40–52px | 700 |
| H3 | 28–36px | 600–700 |
| Large statement | 32–48px | 500–600 |
| Body | 16–18px | 400 |
| Small body | 14px | 400 |
| Navigation | 14–16px | 500–600 |
| Eyebrow | 10–12px | 600 |

Mobile typography should scale down aggressively while preserving the visual hierarchy.

---

## 6. Layout Philosophy

### Grid

Use a modern editorial grid.

**Desktop:**

- 12-column grid
- 24–32px gutters
- Large outer margins
- Full-bleed photography where appropriate

**Mobile:**

- 4-column grid
- 16–20px margins
- 12–16px gutters

### Spacing

Favor generous spacing.

Suggested spacing scale:

```text
4
8
12
16
24
32
48
64
80
96
128
160
```

Large sections should feel spacious rather than packed.

---

## 7. Navigation

The navigation should feel like a premium digital product.

### Desktop

Logo on the left.

Navigation:

```text
Home
Discover
Events
Puja
Gallery
Stories
About
```

Right side:

```text
Search
Menu / Profile
```

### Behavior

- Transparent over the hero.
- Becomes a dark/solid surface after scrolling.
- Subtle backdrop blur.
- Minimal borders.
- Active navigation uses Crimson Silk.

Example:

```text
DURGA PUJA     Home   Discover   Events   Gallery   Stories
                                           ─────
```

Avoid traditional decorative navigation bars.

---

## 8. Hero Section

The hero is the most important visual moment.

### Recommended composition

Full-screen cinematic image or video.

Use:

- Durga idol close-up
- Red silk
- Dhunuchi smoke
- Sindoor
- Dramatic architectural lighting
- Bengali cultural details

Overlay a subtle black/burgundy gradient.

### Hero content

Example:

```text
DURGA PUJA

Faith. Culture. Community.

More than a festival.
A feeling that brings us home.

[ Explore Events → ]
```

### Hero rules

- Photography should carry most of the emotional weight.
- Text should remain minimal.
- Avoid putting too many UI elements over the image.
- Use large typography.
- Use one dominant CTA.

---

## 9. Cards

Cards should feel closer to streaming-platform content cards than traditional festival tiles.

### Event card

```text
[ IMAGE ]

NORTH KOLKATA
Pujo Walk

28 SEPTEMBER
7:00 PM

Explore →
```

### Card behavior

On hover:

- Image gently scales to 1.03–1.05x
- Overlay becomes slightly darker
- Title moves upward subtly
- CTA appears or becomes brighter

Use 12–20px border radius depending on the section.

Avoid excessive borders.

---

## 10. Buttons

Buttons should be bold and simple.

### Primary

Background: `#D72638`

Text: `#F2F1ED`

Example:

```text
Explore Events  →
```

### Secondary

Transparent or dark surface with a thin border.

```text
Get Involved
```

### Text button

```text
Learn More  →
```

### Interaction

Transitions should be approximately 180–250ms.

Use:

- subtle scale
- background transition
- arrow movement

Avoid bounce animations.

---

## 11. Imagery Direction

Photography is one of the strongest brand assets.

### Photography should feel

- Cinematic
- Rich
- Textural
- Human
- Intimate
- Slightly dramatic
- Editorial

### Subject matter

**People**

- Sindoor
- Traditional clothing
- Jewellery
- Families
- Friends
- Devotees
- Volunteers
- Artists

**Atmosphere**

- Dhunuchi smoke
- Dhak
- Candlelight
- Incense
- Night streets
- Warm lights
- Rain
- Crowd movement

**Architecture**

- Kolkata heritage buildings
- Puja pandals
- Temple-inspired structures
- Architectural details

**Objects**

- Dhak
- Conch
- Diya
- Lotus
- Trishul
- Kalash
- Red flowers
- Silk
- Alpona

---

## 12. Image Treatment

Images should generally use:

- Deep shadows
- Warm highlights
- Rich reds
- Slightly reduced saturation outside the main subject
- Strong contrast
- Subtle film grain
- Soft vignettes

Do not make every image red.

The red should emerge naturally from:

- clothing
- flowers
- sindoor
- lighting
- silk
- architecture

---

## 13. Iconography

Icons should be minimal and geometric.

Core icon set:

```text
Lotus       → Purity
Dhak        → Rhythm
Conch       → Awakening
Trishul     → Strength
Diya        → Hope
Alpona      → Heritage
Kalash      → Prosperity
```

### Icon style

- 1.5–2px strokes
- Rounded or refined geometric construction
- Mostly monochrome
- Crimson for active states
- Soft Pearl for dark backgrounds
- Obsidian for light backgrounds

Avoid cartoon-like illustrations.

---

## 14. Cultural Motifs

Use cultural motifs as subtle visual systems.

### Alpona

Use simplified line patterns rather than complex traditional artwork.

Applications:

- Section dividers
- Background textures
- Loading animations
- Image overlays

### Architectural motifs

Use simplified arches and pandal-inspired geometry.

### Lotus

Use as the primary recurring symbol.

Keep it minimal.

A small lotus can become the brand's visual signature.

---

## 15. Motion Design

Motion should feel cinematic, not playful.

### Page entrance

- Fade
- Slight upward movement
- 400–700ms

### Image reveal

Use slow clipping/masking transitions.

### Hover

- 180–250ms
- Image scale: 1.03–1.05
- Slight text movement

### Hero

Optional:

- Slow image zoom
- Subtle smoke movement
- Gentle light movement

### Scroll

Use subtle parallax.

Avoid:

- Excessive particles
- Bouncy animations
- Spinning religious symbols
- Overly flashy transitions

---

## 16. Website Sections

Recommended homepage structure:

### 01 — Hero

Immersive Durga Puja introduction.

### 02 — Discover

Featured events and experiences.

```text
Discover Durga Puja
```

Large editorial cards.

### 03 — The Experience

A cinematic story about the festival.

Use large imagery + short copy.

### 04 — Events

Filterable event discovery.

```text
All
Pandals
Food
Music
Culture
Community
```

### 05 — Stories

Human stories from the community.

### 06 — Gallery

Immersive masonry or editorial image grid.

### 07 — Culture

Explain traditions through modern visual storytelling.

### 08 — Community

Volunteer, participate, connect, or share a story.

### 09 — Final CTA

Large emotional closing statement.

Example:

```text
SAME ROOTS.
NEW STORIES.

Come celebrate with us.

[ Explore Durga Puja → ]
```

---

## 17. Dark Mode

Dark mode should be the primary visual experience.

### Background layers

```text
#161616
↓
#3F0D12
↓
#710014
```

Use gradients very subtly.

Example:

```css
background:
  radial-gradient(
    circle at 70% 20%,
    rgba(152, 17, 30, 0.22),
    transparent 40%
  ),
  #161616;
```

The interface should feel deep and cinematic rather than simply black.

---

## 18. Light Mode

Light mode should feel like warm editorial paper.

- Primary surface: `#F2F1ED`
- Secondary surface: `#FBE4E3`
- Text: `#161616`
- Accent: `#98111E`

This mode is useful for:

- Articles
- Stories
- Cultural information
- Long-form content

---

## 19. Design Tokens

```css
:root {
  --color-blush: #FBE4E3;
  --color-crimson-silk: #D72638;
  --color-ruby-red: #98111E;
  --color-deep-bordeaux: #3F0D12;
  --color-crimson-depth: #710014;
  --color-warm-sand: #B38F6F;
  --color-soft-pearl: #F2F1ED;
  --color-obsidian: #161616;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;
  --space-5xl: 128px;

  --transition-fast: 180ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 600ms ease;
}
```

---

## 20. UI Principles

### Do

- Use large photography.
- Use strong typography.
- Keep layouts clean.
- Use red strategically.
- Use negative space.
- Use subtle cultural motifs.
- Make interactions feel deliberate.
- Let photography tell the story.

### Don't

- Overuse gold.
- Use generic festival clipart.
- Use excessive gradients.
- Fill every empty space.
- Use too many fonts.
- Use bright yellow/gold festival colors.
- Make everything ornate.
- Turn the interface into a traditional poster.

---

## 21. Brand Formula

The visual identity can be summarized as:

```text
MODERN DIGITAL DESIGN
        +
BENGALI CULTURAL DNA
        +
CINEMATIC PHOTOGRAPHY
        +
RICH CRIMSON PALETTE
        +
MINIMAL UI
        =
PREMIUM DURGA PUJA
```

### Final feeling

The website should make someone think:

> “This feels like Durga Puja — but I've never seen it presented like this before.”

It should feel premium enough for a global digital brand, emotionally authentic enough for someone who grew up with Puja, and modern enough to belong on today's web.
