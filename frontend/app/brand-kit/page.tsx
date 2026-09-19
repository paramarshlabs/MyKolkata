// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { Medallion, Sprig, NotchWing } from '@/components/brand/kolka'
import { EMBLEMS, EMBLEM_LIST } from '@/components/brand/emblems'
import { ICONS, ICON_LIST } from '@/components/brand/icons'
import { MOTIF_LIB, MOTIF_LIB_LIST } from '@/components/brand/motifs'
import { AlponaRule, LaalPaar } from '@/components/brand/Alpona'
import { CountdownScene, PujoDays } from '@/components/brand/Countdown'

/* ------------------------------------------------------------------ data -- */

const CORE = [
  { token: '--mk-obsidian', name: 'Obsidian', hex: '#0D1012', role: 'Base canvas — a cool rich black, never flat' },
  { token: '--mk-ink', name: 'Ink', hex: '#141819', role: 'Surface 1 — cards, panels' },
  { token: '--mk-slate', name: 'Slate', hex: '#1C2225', role: 'Surface 2 — elevated, hover' },
  { token: '--mk-bordeaux', name: 'Deep Bordeaux', hex: '#3F0D12', role: 'Warm surface, red bands' },
  { token: '--mk-bordeaux-deep', name: 'Bordeaux Deep', hex: '#260A0E', role: 'Cards on a red band — never black-on-red' },
  { token: '--mk-crimson-depth', name: 'Crimson Depth', hex: '#710014', role: 'Deep accent, dramatic grounds' },
  { token: '--mk-ruby', name: 'Ruby Red', hex: '#98111E', role: 'Secondary red, light-mode primary' },
  { token: '--mk-crimson', name: 'Crimson Silk', hex: '#D72638', role: 'The action colour — budgeted' },
  { token: '--mk-taxi', name: 'Taxi Yellow', hex: '#F2B33D', role: 'The Kolkata accent — taxi, protima, diya' },
  { token: '--mk-ash', name: 'Ash', hex: '#AFA2A0', role: 'Muted text, metadata, captions' },
  { token: '--mk-pearl', name: 'Soft Pearl', hex: '#F2F1ED', role: 'Body text, laal-paar white' },
  { token: '--mk-white', name: 'Pop White', hex: '#FCFBF8', role: 'Display, numerals, card titles' },
  { token: '--mk-blush', name: 'Soft Blush', hex: '#FBE4E3', role: 'Rare highlight' },
]

const CONTRAST = [
  { pair: 'Pop White on Obsidian', ratio: '18.5', grade: 'AAA', note: 'Display, numerals' },
  { pair: 'Soft Pearl on Obsidian', ratio: '16.9', grade: 'AAA', note: 'Body text' },
  { pair: 'Soft Pearl on Deep Bordeaux', ratio: '14.5', grade: 'AAA', note: 'Body on red surfaces' },
  { pair: 'Taxi Yellow on Obsidian', ratio: '10.3', grade: 'AAA', note: 'The accent that may carry small text' },
  { pair: 'Obsidian on Taxi Yellow', ratio: '10.3', grade: 'AAA', note: 'Yellow buttons, badges' },
  { pair: 'Ash on Obsidian', ratio: '7.2', grade: 'AA', note: 'Captions, metadata' },
  { pair: 'Soft Pearl on Crimson Silk', ratio: '4.4', grade: 'AA', note: 'Button labels, 16px and up' },
  { pair: 'Crimson Silk on Obsidian', ratio: '3.8', grade: 'Large only', note: 'Never body text — use Taxi instead' },
]

const SCALE = [
  { role: 'Title card', size: 104, lh: 0.95, ls: '-0.04em' },
  { role: 'Display', size: 72, lh: 1.0, ls: '-0.035em' },
  { role: 'H1', size: 52, lh: 1.05, ls: '-0.03em' },
  { role: 'H2', size: 38, lh: 1.1, ls: '-0.02em' },
  { role: 'H3', size: 26, lh: 1.2, ls: '-0.01em' },
]

const CURVES = [
  { name: 'Reveal', css: 'cubic-bezier(0.16, 1, 0.3, 1)', ms: 700, use: 'Entrances, band reveals' },
  { name: 'Move', css: 'cubic-bezier(0.65, 0, 0.35, 1)', ms: 320, use: 'Transitions, opening' },
  { name: 'Draw', css: 'cubic-bezier(0.32, 0.72, 0, 1)', ms: 900, use: 'The kolka, the alpona line' },
]

const NAV = [
  ['Countdown', 'countdown'], ['Mark', 'mark'], ['Colour', 'colour'], ['Type', 'type'],
  ['Motifs', 'motifs'], ['Emblems', 'emblems'], ['Icons', 'icons'], ['Components', 'components'],
]

/*  Emblems, icons, the alpona library, the kolka, the notch wing, laal-paar
    and the alpona rule live in components/brand — the app imports the same
    code, so this page and the product cannot drift apart.                   */

/* ------------------------------------------------------------------ band -- */

function Band({ id, title, bengali, lede, children, tone = 'base' }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <section className={`band band--${tone}`} id={id} ref={ref}>
      <div className="band-inner">
        <header className="band-head">
          <Sprig size={42} />
          <h2 className="band-title">
            {title}
            {/* Bengali only where the English heading is a transliteration of a
                Bengali word — never as a translation of an English one. */}
            {bengali && <span className="band-bn" lang="bn">{bengali}</span>}
          </h2>
        </header>
        {lede && <p className="band-lede">{lede}</p>}
        {children}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ page -- */

export default function BrandKit() {
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(null)
  const [markOpen, setMarkOpen] = useState(false)
  const [wght, setWght] = useState(600)
  const [wdth, setWdth] = useState(100)
  const [play, setPlay] = useState(0)
  const [curve, setCurve] = useState(CURVES[0])
  const [active, setActive] = useState(null)                  /* nav: current section id */
  const [pill, setPill] = useState({ x: 0, w: 0, on: false })  /* nav: active pill geometry */
  const [menuOpen, setMenuOpen] = useState(false)              /* nav: island drawer */
  const tabsRef = useRef(null)
  const tabRefs = useRef({})
  const searchRefs = useRef([])
  const menuId = useId()

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true))
    const onScroll = () => {
      /* scroll-spy: the last section whose top has crossed the nav line is current */
      let cur = null
      for (const [, id] of NAV) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 140) cur = id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(t); window.removeEventListener('scroll', onScroll) }
  }, [])

  /* nav: slide the pill under the current tab. Re-measured on resize and once
     the webfonts land, since both change tab widths. */
  useEffect(() => {
    const place = () => {
      const a = active && tabRefs.current[active]
      if (!a || !tabsRef.current) { setPill((v) => (v.on ? { ...v, on: false } : v)); return }
      setPill({ x: a.offsetLeft, w: a.offsetWidth, on: true })
    }
    place()
    window.addEventListener('resize', place)
    if (document.fonts?.ready) document.fonts.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [active])

  /* nav: "/" focuses whichever search is on screen; Escape clears it and
     closes the island drawer */
  useEffect(() => {
    const onKey = (e) => {
      const input = searchRefs.current.find((el) => el && el.getClientRects().length > 0)
      const typing = /^(input|textarea|select)$/i.test(e.target?.tagName) || e.target?.isContentEditable
      if (e.key === '/' && input && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); input.focus() }
      if (e.key === 'Escape') {
        setMenuOpen(false)
        if (input && document.activeElement === input) { input.value = ''; input.blur() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const copy = useCallback(async (hex) => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(hex)
      setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400)
    } catch { setCopied(null) }
  }, [])

  return (
    <>
<main className="mk">

        {/* ------------------------------------------------- nav: the notch bar -- */}
        {/*  Three notches cut from a Pearl bezel — lockup, sections, search. Below
            1280px they fold into one island with a drawer; below 768px the bezel
            goes and the island sits flush with the top edge.                    */}
        <div className="mk-notchbar">
        <div className="bezel" aria-hidden="true" />
        <div className={`nn-scrim ${menuOpen ? 'is-open' : ''}`} aria-hidden="true" onClick={() => setMenuOpen(false)} />

        {/* desktop — left: lockup */}
        <aside className="nn nn-logo" aria-label="Brand">
          <a className="nn-brand" href="#top" aria-label="My Kolkata — back to top">
            <span className="nn-brand-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/micon.png" alt="" width={28} height={28} />
            </span>
            <span className="nn-brand-text">
              <span className="nn-brand-latin">MY KOLKATA</span>
              <span className="nn-brand-bn" lang="bn">আমার কলকাতা</span>
            </span>
          </a>
          <NotchWing side="right" />
          <NotchWing side="corner-left" />
        </aside>

        {/* desktop — centre: sections */}
        <header className="nn nn-menu">
          <NotchWing side="left" />
          <NotchWing side="right" />
          <nav className="nn-tabs" aria-label="Brand kit sections" ref={tabsRef}>
            <span
              className={`nn-pill ${pill.on ? 'is-on' : ''}`}
              style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
              aria-hidden="true"
            />
            {NAV.map(([label, href]) => (
              <a
                key={href}
                ref={(el) => { tabRefs.current[href] = el }}
                className={`nn-tab ${active === href ? 'is-active' : ''}`}
                href={`#${href}`}
                aria-current={active === href ? 'location' : undefined}
              >{label}</a>
            ))}
          </nav>
        </header>

        {/* desktop — right: search */}
        <aside className="nn nn-right" aria-label="Search">
          <NotchWing side="left" />
          <NotchWing side="corner-right" />
          <label className="nn-search">
            <span className="sr-only">Search the brand kit</span>
            <svg viewBox="0 0 24 24" className="nn-search-icon" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
            </svg>
            <input ref={(el) => { searchRefs.current[0] = el }} type="search" placeholder="Search" autoComplete="off" spellCheck={false} />
            <kbd className="nn-kbd" aria-hidden="true">/</kbd>
          </label>
        </aside>

        {/* below 1280px — one island */}
        <div className="nn nn-island">
          <NotchWing side="left" />
          <NotchWing side="right" />
          <div className="nn-island-row">
            <a className="nn-brand" href="#top" aria-label="My Kolkata — back to top">
              <span className="nn-brand-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/micon.png" alt="" width={28} height={28} />
            </span>
              <span className="nn-brand-text">
                <span className="nn-brand-latin">MY KOLKATA</span>
                <span className="nn-brand-bn" lang="bn">আমার কলকাতা</span>
              </span>
            </a>
            <button
              type="button"
              className={`nn-trigger ${menuOpen ? 'is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label="Choose a section"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span>{NAV.find(([, id]) => id === active)?.[0] ?? 'Brand kit'}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <label className="nn-search nn-search--island">
              <span className="sr-only">Search the brand kit</span>
              <svg viewBox="0 0 24 24" className="nn-search-icon" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
              </svg>
              <input ref={(el) => { searchRefs.current[1] = el }} type="search" placeholder="Search" autoComplete="off" spellCheck={false} />
            </label>
          </div>
          <div className={`nn-drawer ${menuOpen ? 'is-open' : ''}`} id={menuId}>
            <div className="nn-drawer-clip">
              <nav className="nn-drawer-list" aria-label="Brand kit sections">
                {NAV.map(([label, href]) => (
                  <a
                    key={href}
                    className={`nn-option ${active === href ? 'is-active' : ''}`}
                    href={`#${href}`}
                    aria-current={active === href ? 'location' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{label}</span>
                    {active === href && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        </div>

        {/* ---------------------------------------------------------- title card -- */}
        <section className={`title-card ${ready ? 'is-ready' : ''}`} id="top">
          <div className="letterbox letterbox--top" aria-hidden="true" />
          <div className="letterbox letterbox--bottom" aria-hidden="true" />
          <div className="title-inner">
            <Medallion open={ready} size={168} className="title-mark" />
            <h1 className="title-latin"><span>MY</span><span>KOLKATA</span></h1>
            <p className="title-bn" lang="bn">আমার কলকাতা</p>
            <p className="title-sub">
              A city, shot like a film. Every colour, letterform, line and curve the product is
              built from — and the reasons behind each one.
            </p>
          </div>
          <div className="title-meta">
            <span>Version 1.4</span>
            <span className="title-meta-sep" aria-hidden="true" />
            <span>Dark is the primary experience</span>
          </div>
        </section>

        <section className="count" id="countdown">
          <CountdownScene />
          <div className="count-after">
            <PujoDays />
            <p className="count-note">
              A ticking clock is information, not decoration — it and the title sequence are the only
              motion nobody has to ask for. The sky is drawn, not photographed: swap a real kaash-phool
              frame in behind the scrim and nothing else has to change. Every date lives in one constant
              and moves each year with the panjika.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- mark -- */}
        <Band
          id="mark"
          title="The mark"
          bengali="কলকা"
          lede="A crimson disc with petals and dots opening around it, flanked by two spiral volutes — the alpona a Bengali household paints on its floor, drawn as a mark. It is filled rather than outlined, because that is how alpona is actually made."
        >
          <div className="mark-grid">
            <button
              type="button"
              className="mark-stage"
              onMouseEnter={() => setMarkOpen(true)}
              onMouseLeave={() => setMarkOpen(false)}
              onFocus={() => setMarkOpen(true)}
              onBlur={() => setMarkOpen(false)}
              onClick={() => setMarkOpen((v) => !v)}
              aria-pressed={markOpen}
              aria-label="Unfurl the kolka mark"
            >
              <Medallion open={markOpen} size={320} />
              <span className="mark-hint">{markOpen ? 'Unfurled' : 'Hover to unfurl'}</span>
            </button>

            <div className="mark-notes">
              <div className="lockup">
                <Medallion open size={76} />
                <div>
                  <p className="lockup-latin">MY KOLKATA</p>
                  <p className="lockup-bn" lang="bn">আমার কলকাতা</p>
                </div>
              </div>

              <dl className="spec">
                <div><dt>Disc</dt><dd>Crimson, r25 on a 240 grid. It lands first — alpona is painted from the centre out.</dd></div>
                <div><dt>Petals</dt><dd>Ten solid teardrops. The gaps at ±90° are where the volutes sit.</dd></div>
                <div><dt>Volutes</dt><dd>Two spiral scrolls, each with three hanging leaves and a budded stem</dd></div>
                <div><dt>Dots</dt><dd>Two above, two below, descending — the alpona signature</dd></div>
                <div><dt>Bloom</dt><dd>Disc, petals, volutes, leaves, buds, dots — 1.3s, in that order</dd></div>
                <div><dt>Below 56px</dt><dd>It becomes the sprig: one teardrop over two dots</dd></div>
                <div><dt>Never</dt><dd>Outlined, rotated, mirrored on the vertical, or set in gold</dd></div>
              </dl>

              <div className="mark-sizes">
                {[96, 140].map((sz) => (
                  <div className="mark-size" key={sz}>
                    <Medallion open size={sz} />
                    <span>Medallion {sz}px</span>
                  </div>
                ))}
                {[26, 40].map((sz) => (
                  <div className="mark-size" key={`s${sz}`}>
                    <Sprig size={sz} />
                    <span>Sprig {sz}px</span>
                  </div>
                ))}
              </div>
              <p className="note">It replaces every eyebrow label, numbered marker and arrow the system would otherwise need. Where you want to say <span className="em">look here</span>, you use the tick.</p>
            </div>
          </div>
        </Band>

        <AlponaRule />

        {/* -------------------------------------------------------------- colour -- */}
        <Band
          id="colour"
          title="Colour"
          lede="Red is treated as a material, not a hue — silk, hibiscus, pomegranate, sandstone, lac. Every red on screen should look like it has a surface. Select a swatch to copy its value."
        >
          <div className="swatches">
            {CORE.map((c) => (
              <button key={c.token} type="button" className="swatch" onClick={() => copy(c.hex)}
                aria-label={`Copy ${c.name}, ${c.hex}`}>
                <span className="swatch-chip" style={{ background: c.hex }} />
                <span className="swatch-body">
                  <span className="swatch-name">{c.name}</span>
                  <span className="swatch-hex">{copied === c.hex ? 'Copied' : c.hex}</span>
                  <span className="swatch-role">{c.role}</span>
                  <code className="swatch-token">{c.token}</code>
                </span>
              </button>
            ))}
          </div>

          <div className="retired">
            <span className="retired-chip" />
            <div>
              <h3 className="h3">Warm Sand is retired from the interface</h3>
              <p className="body">
                <code className="inline-code">#B38F6F</code> went muddy against Obsidian — it read as
                dust rather than warmth, and it dragged every caption down with it. Muted text is now
                <strong className="strong"> Ash</strong> <code className="inline-code">#AFA2A0</code>,
                a warm rose-grey that keeps the palette's temperature without the tan cast. Warm Sand
                survives only in photography and illustration, where a real surface carries it.
              </p>
            </div>
          </div>

          <div className="grade">
            <div className="grade-chip" />
            <div className="grade-body">
              <h3 className="h3">Monsoon Teal — the grade</h3>
              <p className="body">
                <code className="inline-code">#132A2E</code>. It never appears as a fill, a border or
                a text colour — only inside shadows and background gradients, giving the reds something
                cold to be warm against. If it ever reads as teal on screen, it is being misused.
              </p>
              <pre className="code"><code>box-shadow: 0 24px 60px -20px rgba(19, 42, 46, 0.7);</code></pre>
            </div>
          </div>

          <table className="table">
            <caption className="table-caption">Contrast, measured against the ground each pair actually sits on</caption>
            <thead><tr><th scope="col">Pair</th><th scope="col">Ratio</th><th scope="col">Grade</th><th scope="col">Use</th></tr></thead>
            <tbody>
              {CONTRAST.map((r) => (
                <tr key={r.pair}>
                  <th scope="row">{r.pair}</th>
                  <td className="num">{r.ratio}:1</td>
                  <td><span className={`grade-tag ${r.grade === 'Large only' ? 'is-warn' : ''}`}>{r.grade}</span></td>
                  <td className="muted">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Band>

        {/* ---------------------------------------------------------------- type -- */}
        <Band
          id="type"
          title="Type"
          lede="Clear Sans ships Regular only — there is no bold. Latin hierarchy is built from size, tracking and colour, never weight. Bengali is the family with a live weight axis, so Bengali carries the emphasis Latin cannot."
        >
          <div className="balance">
            <h3 className="h3">Where Bengali is allowed</h3>
            <div className="balance-grid">
              <ul className="rules">
                <li>The wordmark — আমার কলকাতা, set at 38% of the Latin, wght 500, in Ash. A whisper under the title, never a second headline.</li>
                <li>Words with no English equivalent: কলকা, আলপনা, ঢাক, ধুনুচি, কাশফুল, শিউলি, পুষ্পাঞ্জলি.</li>
                <li>Real content — the five days, a greeting, a line someone would actually say.</li>
                <li>Place and para names as people write them.</li>
              </ul>
              <ul className="rules is-dont">
                <li>Never as a translation label under an English heading. This section is called Type; there is no অক্ষর beneath it.</li>
                <li>Never to decorate a section that has no Bengali content.</li>
                <li>Never letter-spaced — it breaks the মাত্রা.</li>
                <li>Never at the same size and weight as the Latin it sits beside. One of the two leads.</li>
              </ul>
            </div>
          </div>

          <div className="specimen">
            <div className="specimen-head">
              <h3 className="h3">Clear Sans Display</h3><span className="muted">Latin headlines · 400 only</span>
            </div>
            {SCALE.map((s) => (
              <div className="row" key={s.role}>
                <span className="row-label">{s.role}<span className="row-spec">{s.size}px · {s.lh} · {s.ls}</span></span>
                <p className="row-sample display"
                  style={{ fontSize: `min(${s.size}px, ${Math.round(s.size / 2.3)}vw)`, lineHeight: s.lh, letterSpacing: s.ls }}>
                  These golden days
                </p>
              </div>
            ))}
          </div>

          <div className="specimen">
            <div className="specimen-head">
              <h3 className="h3">Clear Sans Text</h3><span className="muted">Body and UI · 400 only</span>
            </div>
            <p className="measure body-lg">
              The last week of Ashwin, the light changes. Kaash phool comes up along the tracks at
              Bagbazar, the shiuli drops overnight, and the whole city starts counting backwards.
            </p>
            <p className="measure body">
              Body sets at 16px on a 1.65 line, tracked a touch open at 0.01em, and never runs past
              72 characters. Captions drop to 14px and change colour to Ash rather than changing
              weight — because there is no weight to change to.
            </p>
            <p className="measure caption">Caption. 14px, Ash, 0.015em. This is what secondary information looks like.</p>
          </div>

          <div className="specimen">
            <div className="specimen-head">
              <h3 className="h3">Noto Sans Bengali</h3><span className="muted">Variable · wght 100–900 · wdth 62.5–100</span>
            </div>
            <p className="bengali-stage" lang="bn" style={{ fontVariationSettings: `'wght' ${wght}, 'wdth' ${wdth}` }}>
              আশ্বিনের শারদপ্রাতে
            </p>
            <div className="axes">
              <label className="axis">
                <span className="axis-name">Weight<span className="axis-val">{wght}</span></span>
                <input type="range" min="100" max="900" step="10" value={wght} onChange={(e) => setWght(+e.target.value)} />
              </label>
              <label className="axis">
                <span className="axis-name">Width<span className="axis-val">{wdth}</span></span>
                <input type="range" min="62.5" max="100" step="0.5" value={wdth} onChange={(e) => setWdth(+e.target.value)} />
              </label>
            </div>
            <ul className="rules">
              <li>Line-height 1.5 minimum, against 1.05 for Latin display.</li>
              <li>Set Bengali about 8% larger when it shares a line with Latin at the same rank.</li>
              <li>Compress with the width axis to 85 for tight slots. Below 80 it distorts.</li>
            </ul>
          </div>
        </Band>

        <AlponaRule />

        {/* -------------------------------------------------------------- motifs -- */}
        <Band
          id="motifs"
          title="Motifs"
          lede="Four structural devices, plus a library of six drawn motifs. Together they carry the culture so the interface does not have to shout it — the four shape sections and edges, the six are ornament you place deliberately."
          tone="deep"
        >
          <div className="motif-grid">
            <article className="motif">
              <h3 className="h3">Alpona <span className="motif-bn" lang="bn">আলপনা</span></h3>
              <p className="body">The rule between sections — a hairline that spends its last 90px becoming a curl and ends in a kolka. Draws once on entry.</p>
              <AlponaRule />
            </article>

            <article className="motif">
              <h3 className="h3">Laal-paar</h3>
              <p className="body">The red border of a white saree, reduced to a band edge. Used once or twice a page, never as a frame.</p>
              <div className="motif-art"><LaalPaar height={30} /></div>
            </article>

            <article className="motif">
              <h3 className="h3">Chalchitra</h3>
              <p className="body">The painted arch behind the idol, kept as bare geometry. It shapes feature panels and pandal-style cards.</p>
              <div className="motif-art">
                <svg viewBox="0 0 200 110" fill="none" className="motif-svg" aria-hidden="true">
                  <path d="M14 106 V62 C14 26 50 6 100 6 C150 6 186 26 186 62 V106" stroke="var(--mk-pearl)" strokeWidth="1.6" opacity="0.7" />
                  <path d="M32 106 V64 C32 36 60 20 100 20 C140 20 168 36 168 64 V106" stroke="var(--mk-pearl)" strokeWidth="1.2" opacity="0.4" />
                  {Array.from({ length: 9 }).map((_, i) => {
                    const a = Math.PI * (0.08 + (i * 0.84) / 8)
                    return <line key={i} x1={100 - Math.cos(a) * 60} y1={64 - Math.sin(a) * 44}
                      x2={100 - Math.cos(a) * 78} y2={64 - Math.sin(a) * 58}
                      stroke="var(--mk-pearl)" strokeWidth="1.1" opacity="0.35" />
                  })}
                </svg>
              </div>
            </article>

            <article className="motif">
              <h3 className="h3">Shola</h3>
              <p className="body">White pith filigree from the crown. The only white-on-red ornament in the system, and the only one allowed to be delicate.</p>
              <div className="motif-art">
                <svg viewBox="0 0 200 110" fill="none" className="motif-svg" aria-hidden="true">
                  <g transform="translate(100 58)" stroke="var(--mk-pearl)" strokeWidth="1.2">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
                      <path key={d} transform={`rotate(${d})`} d="M0 0 C-9 -14 -9 -30 0 -40 C9 -30 9 -14 0 0Z" opacity="0.75" />
                    ))}
                    <circle r="8" /><circle r="15" opacity="0.5" />
                  </g>
                </svg>
              </div>
            </article>
          </div>
        
          <h3 className="h3 sub">The alpona library</h3>
          <p className="body measure">
            Six motifs read straight off a sheet of hand-drawn alpona: solid, symmetrical, built
            from teardrops and descending dot runs. They are the vocabulary the kolka is made from,
            available on their own where a full medallion would be too much.
          </p>
          <div className="lib-grid">
            {MOTIF_LIB_LIST.map(([id, name, use]) => (
              <figure className="lib-cell" key={id}>
                <svg viewBox="0 0 64 112" className="lib-art" aria-hidden="true">{MOTIF_LIB[id]}</svg>
                <figcaption>
                  <span className="lib-name">{name}</span>
                  <span className="lib-use">{use}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Band>

        {/* --------------------------------------------------------------- icons -- */}
        <Band
          id="emblems"
          title="Emblems"
          lede="Filled, two-tone cultural marks in the alpona vocabulary — a Pearl body with one Crimson accent, exactly the way an alpona is painted around a red disc. These are not interface icons; they are the brand's cultural voice, used large and used rarely."
        >
          <div className="emblem-grid">
            {EMBLEM_LIST.map(([id, name, bn, use]) => (
              <figure className="emblem" key={id}>
                <svg viewBox="0 0 64 64" className="emblem-art" aria-hidden="true">{EMBLEMS[id]}</svg>
                <figcaption>
                  <span className="emblem-name">{name} <span className="emblem-bn" lang="bn">{bn}</span></span>
                  <span className="emblem-use">{use}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="note">
            A Pearl body with one accent. That accent is Crimson, except where the object itself is
            yellow — the diya's flame, the mukut's gems, the coconut's band — which is where Taxi
            Yellow lives. Never smaller than 40px, never outlined, never a third colour, and never
            used where a UI icon belongs. On paper the Pearl becomes Obsidian.
          </p>
        </Band>

        <Band
          id="icons"
          title="Icons"
          lede="The deliberate opposite of the emblems: line, 32px grid, 1.5px, no fills. Utility work — routes, places, food, night. An icon without a job does not ship, so each one below names something the product actually does."
        >
          <div className="icon-grid">
            {ICON_LIST.map(([id, name, use]) => (
              <figure className="icon-cell" key={id}>
                <svg viewBox="0 0 32 32" className={`icon ${id === 'taxi' ? 'icon--taxi' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  {ICONS[id]}
                </svg>
                <figcaption>
                  <span className="icon-name">{name}</span>
                  <span className="icon-use">{use}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="note">
            Crimson Silk for active states, Soft Pearl on dark, Obsidian on paper. Never two colours
            in one icon, never a filled variant, and never an icon carrying meaning on its own — it
            always sits beside a word.
          </p>
        </Band>

        {/* -------------------------------------------------------------- motion -- */}
        <Band
          id="motion"
          title="Motion"
          lede="Slow to start, decisive to finish. Nothing bounces and nothing spins. A page gets one piece of motion nobody asked for — the title sequence — plus the countdown, which is information."
        >
          <div className="motion-panel">
            <div className="curve-picker" role="group" aria-label="Easing curve">
              {CURVES.map((c) => (
                <button key={c.name} type="button" className={`curve-btn ${curve.name === c.name ? 'is-active' : ''}`}
                  onClick={() => { setCurve(c); setPlay((p) => p + 1) }} aria-pressed={curve.name === c.name}>
                  <span className="curve-name">{c.name}</span>
                  <span className="curve-ms">{c.ms}ms</span>
                </button>
              ))}
            </div>
            <div className="track" key={play}>
              <span className="runner" style={{ animationTimingFunction: curve.css, animationDuration: `${curve.ms}ms` }} />
            </div>
            <div className="motion-meta">
              <code className="inline-code">{curve.css}</code>
              <span className="muted">{curve.use}</span>
              <button type="button" className="btn btn--text" onClick={() => setPlay((p) => p + 1)}>Play again</button>
            </div>
          </div>

          <div className="duration-grid">
            {[['120ms', 'Focus rings, colour-only changes'], ['200ms', 'Hover — the standard'],
              ['320ms', 'Expand, open, reveal'], ['900ms', 'The full kolka unfurl'],
              ['700ms', 'Band entrance'], ['24s', 'Hero image zoom']].map(([d, u]) => (
              <div className="duration" key={d}><span className="duration-val">{d}</span><span className="duration-use">{u}</span></div>
            ))}
          </div>

          <p className="note">
            Banned outright: fade-and-slide-up on every section, hover transitions on every card in a
            grid, parallax on more than one element, particles, floating diyas, rotating chakras, and
            any looping ambient animation. Under <code className="inline-code">prefers-reduced-motion</code> the
            kolka renders fully unfurled, the hero does not zoom, and the alpona is drawn complete.
          </p>
        </Band>

        {/* ---------------------------------------------------------- components -- */}
        <Band
          id="components"
          title="Components"
          lede="The banner takes its scrim discipline and bottom-left anchor from Netflix. The caption device comes straight off a photograph of kaash phool. Neither takes its colour from anyone."
        >
          <h3 className="h3 sub">The banner</h3>
          <div className="banner">
            <div className="banner-img" />
            <div className="banner-scrim" aria-hidden="true" />
            <div className="banner-content">
              <Sprig size={38} />
              <h4 className="banner-title">DURGA PUJA</h4>
              <p className="banner-bn" lang="bn">আশ্বিনের শারদপ্রাতে</p>
              <p className="banner-lede">Five days. One city. Everyone comes home.</p>
              <div className="banner-actions">
                <button type="button" className="btn btn--primary">Explore the Pujo <span className="btn-arrow" aria-hidden="true">→</span></button>
                <button type="button" className="btn btn--secondary">Watch the film</button>
              </div>
            </div>
          </div>

          <h3 className="h3 sub">The film still</h3>
          <p className="body measure">A photograph cropped like a frame, with the title set into the picture rather than under it. Two settings: one word at the centre of the frame, or the same words spread across its width like a credit card. The grade is cool and quiet — the type does the work.</p>
          <div className="stills">
            <figure className="still still--bridge">
              <div className="still-img" />
              <div className="still-scrim" aria-hidden="true" />
              <figcaption className="still-title">
                <p className="still-kicker">ECHOES OF THE</p>
                <p className="still-word">GANGA</p>
              </figcaption>
            </figure>
            <figure className="still still--delta">
              <div className="still-img" />
              <div className="still-scrim" aria-hidden="true" />
              <figcaption className="still-spread" aria-label="Echoes of the Ganga">
                <span>ECHOES</span><span>OF</span><span>THE</span><span>GANGA</span>
              </figcaption>
            </figure>
          </div>

          <h3 className="h3 sub">The caption</h3>
          <p className="body measure">Two lines, a tick, and nothing else. The second line hangs indented from the first — the device is the indent, not an italic, because the type system has no italic to give.</p>
          <div className="capshot">
            <div className="capshot-img" />
            <div className="capshot-scrim" aria-hidden="true" />
            <figure className="capdev">
              <span className="capdev-tick" aria-hidden="true" />
              <div>
                <p className="capdev-1">Happiness is</p>
                <p className="capdev-2">these golden days coming back around.</p>
              </div>
            </figure>
          </div>

          <h3 className="h3 sub">Buttons</h3>
          <div className="btn-row">
            <button type="button" className="btn btn--primary">Save this place <span className="btn-arrow" aria-hidden="true">→</span></button>
            <button type="button" className="btn btn--secondary">Add to my list</button>
            <button type="button" className="btn btn--text">See all pandals</button>
          </div>
          <p className="note">One primary per view. The button does not scale on hover — the arrow moves. Focus is a 2px Crimson Silk ring at 2px offset, on every control, always.</p>

          <h3 className="h3 sub">Cards</h3>
          <div className="cards">
            {[
              { t: 'Kumortuli', s: 'North Kolkata', d: 'Where the goddess is built', img: '/street.jpg', icon: 'rickshaw' },
              { t: 'Bagbazar', s: 'Sarbojanin, est. 1919', d: 'The oldest crowd in the city', img: '/dkt.jpg', icon: 'dhaak' },
              { t: 'College Street', s: 'Boi Para', d: 'Coffee, and a mile of books', img: '/moc.jpg', icon: 'bhaar' },
            ].map((c) => (
              <article className="pcard" key={c.t} tabIndex={0}>
                <div className="pcard-media">
                  <div className="pcard-img" style={{ backgroundImage: `url(${c.img})` }} />
                  <div className="pcard-scrim" aria-hidden="true" />
                  <svg viewBox="0 0 32 32" className="pcard-icon" fill="none" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[c.icon]}</svg>
                </div>
                <div className="pcard-body">
                  <Sprig size={22} />
                  <div>
                    <h4 className="pcard-title">{c.t}</h4>
                    <p className="pcard-sub">{c.s}</p>
                    <p className="pcard-desc">{c.d}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h3 className="h3 sub">Navigation and search</h3>
          <p className="body measure">The bar at the top of this page is the component. Three notches cut from a Pearl bezel — the lockup, the sections, search — joined to the frame by concave wings so they read as part of the screen's edge, not as a bar laid over it.</p>
          <div className="nav-spec">
            <dl className="spec">
              <div><dt>Bezel</dt><dd>8px Pearl frame, 16px inner radius. Notches are 40px (outer) and 44px (centre) with a 24px bottom radius.</dd></div>
              <div><dt>Wordmark</dt><dd>Sprig in a 28px box, then 12.5px Display tracked 0.18em, Bengali beneath at 10px wght 500.</dd></div>
              <div><dt>Sections</dt><dd>Pill tabs, 36px tall, 14px. Muted ink at rest, Obsidian on hover and when current.</dd></div>
              <div><dt>Current</dt><dd>One tonal pill (<code className="inline-code">#e4e2dc</code>) slides between tabs as you scroll — there is no bold; the pill carries the state.</dd></div>
              <div><dt>Search</dt><dd>Icon, field, and a <code className="inline-code">/</code> hint in the right notch. Underline grows on focus.</dd></div>
              <div><dt>Below 1280px</dt><dd>One island: lockup, the current section as a dropdown trigger, search. Below 768px the bezel goes.</dd></div>
              <div><dt>Never</dt><dd>Crimson on the notches — the sprig is the only red — or a shadow under them.</dd></div>
            </dl>
          </div>

          <h3 className="h3 sub">Radius encodes role</h3>
          <div className="radius-row">
            {[['0', 'Bands, full-bleed'], ['8', 'Inputs, chips'], ['12', 'Cards'], ['20', 'Panels, sheets'], ['28', 'Modals']].map(([r, u]) => (
              <div className="radius" key={r}>
                <div className="radius-box" style={{ borderRadius: `${r}px` }} />
                <span className="radius-val">{r}px</span><span className="radius-use">{u}</span>
              </div>
            ))}
          </div>
        </Band>

        {/* --------------------------------------------------------------- voice -- */}
        <Band id="voice" title="Voice"
          lede="Observant, not promotional. Name the place, the para, the time and the price — specificity is the whole tone."
          tone="deep">
          <div className="voice-grid">
            <div>
              <h3 className="h3">Write this</h3>
              <ul className="voice-list is-do">
                <li>Kumortuli, where the goddess is built</li>
                <li>Save this place → Saved</li>
                <li>Nothing saved yet. Start with a pandal near you.</li>
                <li>That address didn't match. Try a landmark or a metro station.</li>
                <li>Bagbazar Sarbojanin, since 1919. Free entry, busiest after 8pm.</li>
              </ul>
            </div>
            <div>
              <h3 className="h3">Not this</h3>
              <ul className="voice-list is-dont">
                <li>Discover the magic of Kolkata!</li>
                <li>Submit → Success</li>
                <li>No items to display.</li>
                <li>Something went wrong. Please try again later.</li>
                <li>Immerse yourself in a vibrant tapestry of culture.</li>
              </ul>
            </div>
          </div>
          <p className="note">Never explain Bengali culture to Bengalis. Write for someone who already belongs, and let the visitor follow.</p>
        </Band>

        <LaalPaar />

        {/* ------------------------------------------------------------- closing -- */}
        <section className="closing">
          <div className="closing-inner">
            <Medallion open size={150} />
            <p className="closing-line">SAME CITY.</p>
            <p className="closing-line">NEW STORIES.</p>
            <p className="closing-bn" lang="bn">পুজো আসছে।</p>
            <p className="closing-note">
              Everything in this system is quiet so that one thing can be loud — the kolka, the
              photograph, or the single crimson button. If two things are shouting on a screen,
              remove one.
            </p>
            <p className="closing-ref">Full specification in <code className="inline-code">/design.md</code></p>
          </div>
        </section>
      </main>

      <style jsx global>{`
        body { background: var(--mk-obsidian); color: var(--mk-pearl); }
      `}</style>

      <style jsx global>{`
        .mk {
          --edge: clamp(20px, 6vw, 80px);
          background: var(--mk-ground);
          color: var(--mk-pearl);
          font-family: var(--mk-text);
          font-weight: 400;
          line-height: 1.5;
          letter-spacing: normal;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }
        .mk *:focus-visible { outline: 2px solid var(--mk-crimson); outline-offset: 2px; border-radius: 2px; }
        .mk .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
        }
        .mk .em { color: var(--mk-pearl); }
        .mk .strong { font-weight: 400; color: var(--mk-blush); }

        /* --------------------------------------------------------- emblems -- */
        .mk .emblem-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--mk-4); }
        .mk .emblem {
          display: flex; gap: var(--mk-5); align-items: center; margin: 0; padding: var(--mk-5);
          border: 1px solid rgba(242,241,237,0.08); border-radius: var(--mk-r-md);
          background: var(--mk-ink); box-shadow: var(--mk-shadow-card);
          transition: border-color var(--mk-t-hover) var(--mk-ease-in-out),
                      background-color var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .emblem:hover { border-color: rgba(242,241,237,0.22); background: rgba(63,13,18,0.55); }
        .mk .emblem-art { width: 54px; height: 54px; flex: none; }
        .mk .emblem-name { display: block; font-size: 16px; }
        .mk .emblem-bn {
          font-family: var(--mk-bengali); font-variation-settings: 'wght' 500;
          font-size: 13px; color: var(--mk-ash); margin-left: var(--mk-1);
        }
        .mk .emblem-use { display: block; margin-top: 4px; font-size: 12.5px; line-height: 1.5; color: var(--mk-ash); }

        /* --------------------------------------------------- alpona library -- */
        .mk .lib-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: var(--mk-4); margin-top: var(--mk-5);
        }
        .mk .lib-cell {
          margin: 0; padding: var(--mk-5) var(--mk-4); text-align: center;
          border: 1px solid rgba(242,241,237,0.1); border-radius: var(--mk-r-md);
          background: var(--mk-bordeaux-deep); box-shadow: var(--mk-shadow-card);
        }
        .mk .lib-art { width: 46px; height: 80px; display: block; margin: 0 auto var(--mk-4); }
        .mk .lib-name { display: block; font-size: 15px; }
        .mk .lib-use { display: block; margin-top: 4px; font-size: 12px; line-height: 1.45; color: var(--mk-ash); }

        /* ------------------------------------------------------- title card -- */
        .mk .title-card {
          position: relative; min-height: 100svh; display: flex; flex-direction: column;
          justify-content: center; padding: var(--mk-11) var(--edge) var(--mk-9); overflow: hidden;
        }
        .mk .letterbox {
          position: absolute; left: 0; right: 0; height: 14vh; background: var(--mk-obsidian);
          z-index: 3; transition: transform 900ms var(--mk-ease-out);
        }
        .mk .letterbox--top { top: 0; }
        .mk .letterbox--bottom { bottom: 0; }
        .mk .title-card.is-ready .letterbox--top { transform: translateY(-100%); }
        .mk .title-card.is-ready .letterbox--bottom { transform: translateY(100%); }
        .mk .title-inner { position: relative; z-index: 2; }
        .mk .title-latin span { display: block; }
        .mk .title-inner > * {
          opacity: 0; transform: translateY(12px);
          transition: opacity var(--mk-t-band) var(--mk-ease-out), transform var(--mk-t-band) var(--mk-ease-out);
        }
        .mk .title-card.is-ready .title-mark { opacity: 1; transform: none; transition-delay: 340ms; }
        .mk .title-card.is-ready .title-latin { opacity: 1; transform: none; transition-delay: 460ms; }
        .mk .title-card.is-ready .title-bn { opacity: 1; transform: none; transition-delay: 580ms; }
        .mk .title-card.is-ready .title-sub { opacity: 1; transform: none; transition-delay: 700ms; }
        .mk .title-latin {
          font-family: var(--mk-display); font-weight: 400; color: var(--mk-white);
          font-size: clamp(44px, 11vw, 104px); line-height: 0.95; letter-spacing: -0.04em;
          margin: var(--mk-4) 0 0;
        }
        /* the wordmark's Bengali sits at ~38% of the Latin — a whisper, not a headline */
        .mk .title-bn {
          font-family: var(--mk-bengali); font-variation-settings: 'wght' 500;
          font-size: clamp(17px, 4.2vw, 40px); line-height: 1.5; color: var(--mk-taxi);
          margin: var(--mk-3) 0 0;
        }
        .mk .title-sub {
          max-width: 46ch; font-size: clamp(15px, 2vw, 19px); line-height: 1.65;
          color: var(--mk-ash); margin: var(--mk-6) 0 0;
        }
        .mk .title-meta {
          position: relative; z-index: 2; display: flex; align-items: center; gap: var(--mk-4);
          margin-top: var(--mk-9); font-size: 13px; letter-spacing: 0.02em; color: var(--mk-ash);
          opacity: 0; transition: opacity 600ms var(--mk-ease-out) 900ms; flex-wrap: wrap;
        }
        .mk .title-card.is-ready .title-meta { opacity: 1; }
        .mk .title-meta > span { white-space: nowrap; }
        .mk .title-meta-sep { width: 28px; height: 1px; background: rgba(175,162,160,0.45); }

        /* -------------------------------------------------------- countdown -- */
        .mk .count { padding: 0 0 clamp(48px, 7vw, 96px); }
        .mk .count-after { max-width: 1440px; margin: 0 auto; padding: clamp(40px, 6vw, 72px) var(--edge) 0; }
        .mk .count-note {
          max-width: 72ch; font-size: 15px; line-height: 1.7; color: var(--mk-ash);
          margin: var(--mk-7) 0 0; padding-left: var(--mk-4);
          border-left: 2px solid rgba(242, 241, 237, 0.16);
        }

        /* ------------------------------------------------------------ bands -- */
        .mk .band { padding: clamp(64px, 10vw, 128px) var(--edge); }
        .mk .band--deep {
          background: radial-gradient(900px 460px at 84% 0%, rgba(113, 0, 20, 0.26), transparent 62%), var(--mk-bordeaux);
        }
        .mk .band-inner { max-width: 1440px; margin: 0 auto; }
        .mk .band-head { display: flex; align-items: center; gap: var(--mk-4); }
        .mk .band-title {
          font-family: var(--mk-display); font-weight: 400; color: var(--mk-white);
          font-size: clamp(30px, 5vw, 52px); line-height: 1.05; letter-spacing: -0.03em;
          margin: 0; display: flex; align-items: baseline; gap: var(--mk-4); flex-wrap: wrap;
        }
        .mk .band-bn {
          font-family: var(--mk-bengali); font-variation-settings: 'wght' 500;
          font-size: 0.46em; line-height: 1.5; color: var(--mk-ash); letter-spacing: 0;
        }
        .mk .band-lede {
          max-width: 68ch; font-size: clamp(16px, 2vw, 19px); line-height: 1.65;
          color: var(--mk-pearl); margin: var(--mk-6) 0 var(--mk-8);
        }
        .mk .h3 {
          font-family: var(--mk-display); font-weight: 400; color: var(--mk-white);
          font-size: clamp(20px, 2.6vw, 26px); line-height: 1.2; letter-spacing: -0.01em;
          margin: 0 0 var(--mk-3);
        }
        .mk .h3.sub { margin-top: var(--mk-9); }
        .mk .motif-bn {
          font-family: var(--mk-bengali); font-variation-settings: 'wght' 500;
          font-size: 0.66em; color: var(--mk-ash); margin-left: var(--mk-2);
        }
        .mk .body { font-size: 16px; line-height: 1.65; letter-spacing: 0.01em; margin: 0 0 var(--mk-4); }
        .mk .body-lg { font-size: 19px; line-height: 1.65; margin: 0 0 var(--mk-5); }
        .mk .caption { font-size: 14px; line-height: 1.5; letter-spacing: 0.015em; color: var(--mk-ash); margin: 0; }
        .mk .measure { max-width: 68ch; }
        .mk .muted { color: var(--mk-ash); font-size: 14px; }
        .mk .note {
          max-width: 72ch; font-size: 15px; line-height: 1.7; color: var(--mk-ash);
          margin: var(--mk-6) 0 0; padding-left: var(--mk-4); border-left: 2px solid rgba(242, 241, 237, 0.16);
        }
        .mk .inline-code {
          font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.9em;
          color: var(--mk-blush); background: rgba(242,241,237,0.06); padding: 1px 5px; border-radius: 4px;
        }
        .mk .code {
          font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 13px; color: var(--mk-ash);
          background: rgba(9, 11, 12, 0.7); border: 1px solid rgba(242,241,237,0.08);
          border-radius: var(--mk-r-sm); padding: var(--mk-4); overflow-x: auto; margin: var(--mk-4) 0 0;
        }

        /* ------------------------------------------------------ alpona rule -- */
        .mk .mk-rule-wrap { max-width: 1440px; margin: 0 auto; padding: 0 var(--edge); }

        /* ------------------------------------------------------------- mark -- */
        .mk .mark-grid { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: var(--mk-8); align-items: start; }
        .mk .mark-stage {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--mk-5); min-height: 420px; width: 100%;
          background: var(--mk-ink); border: 1px solid rgba(242,241,237,0.1);
          border-radius: var(--mk-r-lg); cursor: pointer; color: inherit; font: inherit;
          transition: border-color var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .mark-stage:hover { border-color: rgba(215,38,56,0.45); }
        .mk .mark-hint { font-size: 13px; letter-spacing: 0.02em; color: var(--mk-ash); }
        .mk .lockup { display: flex; align-items: center; gap: var(--mk-4); margin-bottom: var(--mk-7); }
        .mk .lockup-latin { font-family: var(--mk-display); font-size: 28px; letter-spacing: 0.14em; margin: 0; }
        .mk .lockup-bn {
          font-family: var(--mk-bengali); font-variation-settings: 'wght' 500;
          font-size: 14px; line-height: 1.5; color: var(--mk-ash); margin: 3px 0 0;
        }
        .mk .spec { margin: 0; display: grid; gap: var(--mk-3); }
        .mk .spec > div { display: grid; grid-template-columns: 130px minmax(0,1fr); gap: var(--mk-4); align-items: baseline; }
        .mk .spec dt { font-size: 13px; letter-spacing: 0.02em; color: var(--mk-ash); }
        .mk .spec dd { margin: 0; font-size: 15px; line-height: 1.6; }
        .mk .mark-sizes { display: flex; align-items: flex-end; gap: var(--mk-6); margin: var(--mk-7) 0 0; flex-wrap: wrap; }
        .mk .mark-size { display: flex; flex-direction: column; align-items: center; gap: var(--mk-2); }
        .mk .mark-size span { font-size: 12px; color: var(--mk-ash); }

        /* ----------------------------------------------------------- colour -- */
        .mk .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: var(--mk-4); }
        .mk .swatch {
          display: flex; flex-direction: column; text-align: left;
          background: rgba(242,241,237,0.03); border: 1px solid rgba(242,241,237,0.08);
          border-radius: var(--mk-r-md); overflow: hidden; cursor: pointer; color: inherit; font: inherit; padding: 0;
          transition: border-color var(--mk-t-hover) var(--mk-ease-in-out), transform var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .swatch:hover { border-color: rgba(242,241,237,0.24); transform: translateY(-2px); }
        .mk .swatch-chip { display: block; height: 96px; width: 100%; }
        .mk .swatch-body { display: block; padding: var(--mk-4); }
        .mk .swatch-name { display: block; font-size: 16px; }
        .mk .swatch-hex {
          display: block; margin-top: 2px; font-family: ui-monospace, 'SF Mono', Menlo, monospace;
          font-size: 13px; color: var(--mk-ash);
        }
        .mk .swatch-role { display: block; margin-top: var(--mk-3); font-size: 13px; line-height: 1.5; color: var(--mk-ash); }
        .mk .swatch-token {
          display: block; margin-top: var(--mk-2); font-family: ui-monospace, 'SF Mono', Menlo, monospace;
          font-size: 11px; color: rgba(175,162,160,0.7);
        }
        .mk .retired, .mk .grade {
          display: grid; grid-template-columns: 120px minmax(0,1fr); gap: var(--mk-6);
          margin-top: var(--mk-8); padding: var(--mk-6);
          border: 1px solid rgba(242,241,237,0.08); border-radius: var(--mk-r-lg);
        }
        .mk .retired { background: rgba(179,143,111,0.07); }
        .mk .retired-chip {
          border-radius: var(--mk-r-md); background: var(--mk-sand); min-height: 120px;
          position: relative; overflow: hidden;
        }
        .mk .retired-chip::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 47%, rgba(22,22,22,0.75) 47%, rgba(22,22,22,0.75) 53%, transparent 53%);
        }
        .mk .grade { background: linear-gradient(120deg, rgba(19,42,46,0.9), rgba(22,22,22,0.5)); }
        .mk .grade-chip { border-radius: var(--mk-r-md); background: var(--mk-monsoon); box-shadow: var(--mk-shadow-panel); min-height: 120px; }
        .mk .retired p, .mk .grade-body p { max-width: 68ch; }
        .mk .table { width: 100%; border-collapse: collapse; margin-top: var(--mk-8); font-size: 15px; }
        .mk .table-caption { text-align: left; font-size: 14px; color: var(--mk-ash); padding-bottom: var(--mk-4); }
        .mk .table th, .mk .table td {
          text-align: left; padding: var(--mk-3) var(--mk-4) var(--mk-3) 0;
          border-bottom: 1px solid rgba(242,241,237,0.08); font-weight: 400;
        }
        .mk .table thead th { font-size: 13px; letter-spacing: 0.02em; color: var(--mk-ash); }
        .mk .num { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 14px; }
        .mk .grade-tag {
          display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px;
          background: rgba(242,241,237,0.08); color: var(--mk-pearl);
        }
        .mk .grade-tag.is-warn { background: rgba(242,179,61,0.16); color: var(--mk-taxi); }

        /* ------------------------------------------------------------- type -- */
        .mk .balance { margin-bottom: var(--mk-9); }
        .mk .balance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--mk-7); }
        .mk .specimen { padding: var(--mk-6) 0 var(--mk-8); border-top: 1px solid rgba(242,241,237,0.08); }
        .mk .specimen-head { display: flex; align-items: baseline; gap: var(--mk-4); flex-wrap: wrap; margin-bottom: var(--mk-6); }
        .mk .specimen-head .h3 { margin-bottom: 0; }
        .mk .row { padding: var(--mk-4) 0; border-top: 1px solid rgba(242,241,237,0.05); }
        .mk .row-label {
          display: flex; gap: var(--mk-3); align-items: baseline; flex-wrap: wrap;
          font-size: 13px; letter-spacing: 0.02em; color: var(--mk-ash); margin-bottom: var(--mk-2);
        }
        .mk .row-spec { color: rgba(175,162,160,0.8); font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 11px; }
        .mk .row-sample { margin: 0; }
        .mk .display { font-family: var(--mk-display); font-weight: 400; }
        .mk .bengali-stage {
          font-family: var(--mk-bengali); font-size: clamp(30px, 7vw, 68px); line-height: 1.5;
          margin: 0 0 var(--mk-6); color: var(--mk-pearl);
        }
        .mk .axes { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--mk-6); max-width: 640px; }
        .mk .axis { display: block; }
        .mk .axis-name { display: flex; justify-content: space-between; font-size: 13px; letter-spacing: 0.02em; color: var(--mk-ash); margin-bottom: var(--mk-2); }
        .mk .axis-val { font-family: ui-monospace, 'SF Mono', Menlo, monospace; color: var(--mk-taxi); }
        .mk .axis input[type='range'] { width: 100%; appearance: none; height: 2px; background: rgba(242,241,237,0.2); border-radius: 2px; }
        .mk .axis input[type='range']::-webkit-slider-thumb {
          appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--mk-crimson); cursor: pointer; border: 0;
        }
        .mk .axis input[type='range']::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: var(--mk-crimson); cursor: pointer; border: 0;
        }
        .mk .rules, .mk .voice-list { margin: var(--mk-5) 0 0; padding: 0; list-style: none; max-width: 68ch; }
        .mk .rules li {
          position: relative; padding-left: var(--mk-5); margin-bottom: var(--mk-3);
          font-size: 15px; line-height: 1.6;
        }
        .mk .rules li::before {
          content: ''; position: absolute; left: 0; top: 0.45em; width: 2px; height: 14px;
          background: rgba(242, 241, 237, 0.3);
        }
        .mk .rules.is-dont li { color: var(--mk-ash); }
        .mk .rules.is-dont li::before { background: rgba(175,162,160,0.45); }

        /* ----------------------------------------------------------- motifs -- */
        .mk .motif-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--mk-6); }
        .mk .motif {
          padding: var(--mk-6); border: 1px solid rgba(242,241,237,0.1);
          border-radius: var(--mk-r-lg); background: var(--mk-bordeaux-deep);
          box-shadow: var(--mk-shadow-card);
        }
        .mk .motif .mk-rule-wrap { padding: 0; }
        .mk .motif-art { margin-top: var(--mk-4); }
        .mk .motif-svg { width: 100%; height: auto; }

        /* ------------------------------------------------------------ icons -- */
        .mk .iconset + .iconset { margin-top: var(--mk-4); }
        .mk .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: var(--mk-4); }
        .mk .icon-cell {
          display: flex; gap: var(--mk-4); align-items: flex-start; margin: 0;
          padding: var(--mk-4); border: 1px solid rgba(242,241,237,0.08); border-radius: var(--mk-r-md);
          transition: border-color var(--mk-t-hover) var(--mk-ease-in-out), color var(--mk-t-hover) var(--mk-ease-in-out);
          color: var(--mk-pearl);
        }
        .mk .icon-cell:hover { border-color: rgba(242,179,61,0.4); color: var(--mk-taxi); }
        .mk .icon { width: 32px; height: 32px; flex: none; }
        .mk .icon--taxi { color: var(--mk-taxi); }
        .mk .icon-name { display: block; font-size: 15px; color: var(--mk-pearl); }
        .mk .icon-use { display: block; margin-top: 3px; font-size: 12px; line-height: 1.45; color: var(--mk-ash); }

        /* ----------------------------------------------------------- motion -- */
        .mk .motion-panel { padding: var(--mk-6); border: 1px solid rgba(242,241,237,0.1); border-radius: var(--mk-r-lg); background: var(--mk-ink); box-shadow: var(--mk-shadow-card); }
        .mk .curve-picker { display: flex; gap: var(--mk-3); flex-wrap: wrap; }
        .mk .curve-btn {
          display: flex; flex-direction: column; gap: 2px; text-align: left; padding: var(--mk-3) var(--mk-5);
          background: transparent; border: 1px solid rgba(242,241,237,0.16); border-radius: var(--mk-r-sm);
          cursor: pointer; color: var(--mk-ash); font: inherit;
          transition: border-color var(--mk-t-hover) var(--mk-ease-in-out), color var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .curve-btn:hover { color: var(--mk-pearl); border-color: rgba(242,241,237,0.4); }
        .mk .curve-btn.is-active { border-color: var(--mk-taxi); color: var(--mk-white); }
        .mk .curve-name { font-size: 15px; }
        .mk .curve-ms { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 11px; }
        .mk .track { position: relative; height: 2px; margin: var(--mk-8) 0 var(--mk-5); background: rgba(242,241,237,0.14); border-radius: 2px; }
        .mk .runner {
          position: absolute; top: 50%; left: 0; width: 14px; height: 14px; border-radius: 50%;
          background: var(--mk-crimson); transform: translate(0, -50%);
          animation-name: mk-run; animation-fill-mode: both;
        }
        @keyframes mk-run { from { left: 0; } to { left: calc(100% - 14px); } }
        .mk .motion-meta { display: flex; align-items: center; gap: var(--mk-5); flex-wrap: wrap; }
        .mk .duration-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--mk-4); margin-top: var(--mk-7); }
        .mk .duration { padding: var(--mk-4) 0; border-top: 1px solid rgba(242,241,237,0.1); }
        .mk .duration-val { display: block; font-family: var(--mk-display); font-size: 24px; letter-spacing: -0.01em; }
        .mk .duration-use { display: block; margin-top: var(--mk-1); font-size: 13px; line-height: 1.5; color: var(--mk-ash); }

        /* ------------------------------------------------------- components -- */
        .mk .banner {
          position: relative; overflow: hidden; border-radius: var(--mk-r-lg);
          aspect-ratio: 2.39 / 1; min-height: 320px; box-shadow: var(--mk-shadow-panel);
        }
        .mk .banner-img {
          position: absolute; inset: 0;
          background: url('/hero-bg.jpg') center/cover no-repeat, var(--mk-crimson-depth);
          filter: saturate(1.04) contrast(1.16) brightness(1.03);
          transform: scale(1.02); animation: mk-slowzoom 24s var(--mk-ease-in-out) infinite alternate;
        }
        @keyframes mk-slowzoom { from { transform: scale(1.02); } to { transform: scale(1.09); } }
        .mk .banner-scrim, .mk .capshot-scrim {
          position: absolute; inset: 0;
          background:
            linear-gradient(90deg, rgba(10,13,14,0.93) 0%, rgba(10,13,14,0.54) 46%, rgba(10,13,14,0) 78%),
            linear-gradient(0deg, rgba(10,13,14,0.94) 0%, rgba(38,10,14,0.28) 32%, rgba(38,10,14,0) 56%),
            linear-gradient(0deg, rgba(19,42,46,0.26), rgba(19,42,46,0.26));
        }
        .mk .banner-content { position: absolute; left: 0; bottom: 0; padding: clamp(20px, 4vw, 48px); max-width: min(560px, 92%); }
        .mk .banner-title {
          font-family: var(--mk-display); font-weight: 400; font-size: clamp(28px, 5vw, 52px);
          line-height: 1.05; letter-spacing: -0.03em; margin: var(--mk-2) 0 0;
        }
        .mk .banner-bn {
          font-family: var(--mk-bengali); font-variation-settings: 'wght' 500;
          font-size: clamp(14px, 2vw, 19px); line-height: 1.5; color: var(--mk-blush); margin: var(--mk-2) 0 0;
        }
        .mk .banner-lede { font-size: clamp(14px, 1.8vw, 17px); line-height: 1.6; margin: var(--mk-4) 0 0; }
        .mk .banner-actions { display: flex; gap: var(--mk-3); flex-wrap: wrap; margin-top: var(--mk-5); }

        /* --------------------------------------------------------- film still -- */
        /* design/image copy 8.png — the photograph is the frame and the title is
           set into it. A cool monsoon grade, a soft centre scrim, nothing else.   */
        .mk .stills { display: grid; grid-template-columns: 1fr 1fr; gap: var(--mk-3); margin-top: var(--mk-5); }
        .mk .still {
          position: relative; overflow: hidden; margin: 0; border-radius: var(--mk-r-lg);
          aspect-ratio: 16 / 10; background: var(--mk-monsoon); box-shadow: var(--mk-shadow-card);
        }
        .mk .still-img {
          position: absolute; inset: 0; background-position: center; background-size: cover;
          filter: saturate(0.72) contrast(1.06) brightness(0.92);
        }
        .mk .still--bridge .still-img { background-image: url('/hwh.jpg'); }
        .mk .still--delta .still-img { background-image: url('/sundarban.jpg'); background-position: center 40%; }
        .mk .still-scrim {
          position: absolute; inset: 0;
          background:
            radial-gradient(70% 60% at 50% 48%, rgba(10, 13, 14, 0.36), transparent 72%),
            linear-gradient(0deg, rgba(10, 13, 14, 0.5), transparent 42%),
            linear-gradient(0deg, rgba(19, 42, 46, 0.22), rgba(19, 42, 46, 0.22));
        }
        .mk .still-title {
          position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; color: var(--mk-white); padding-bottom: 6%;
        }
        .mk .still-kicker { font-family: var(--mk-display); font-size: clamp(10px, 1.1vw, 13px); letter-spacing: 0.22em; margin: 0 0 4px; }
        .mk .still-word { font-family: var(--mk-display); font-size: clamp(56px, 8.5vw, 124px); line-height: 0.9; letter-spacing: -0.035em; margin: 0; }
        .mk .still-spread {
          position: absolute; left: 0; right: 0; bottom: 20%; margin: 0 auto; width: min(64%, 440px);
          display: flex; justify-content: space-between; color: var(--mk-white);
          font-family: var(--mk-display); font-size: clamp(11px, 1.2vw, 14px); letter-spacing: 0.16em;
        }

        .mk .capshot {
          position: relative; overflow: hidden; border-radius: var(--mk-r-lg);
          aspect-ratio: 2.6 / 1; min-height: 240px; margin-top: var(--mk-5);
        }
        .mk .capshot-img {
          position: absolute; inset: 0;
          background: url('/maidan.jpg') center/cover no-repeat, var(--mk-bordeaux);
          filter: saturate(0.96) contrast(1.14);
        }
        .mk .capdev { position: absolute; left: 0; bottom: 0; display: flex; gap: var(--mk-3); padding: clamp(20px, 4vw, 44px); margin: 0; }
        .mk .capdev-tick { width: 3px; align-self: stretch; background: var(--mk-crimson); flex: none; }
        .mk .capdev-1 { font-size: clamp(16px, 2.2vw, 21px); line-height: 1.4; margin: 0; }
        .mk .capdev-2 {
          font-family: var(--mk-display); font-size: clamp(19px, 3vw, 30px); line-height: 1.3;
          letter-spacing: -0.015em; color: var(--mk-blush); margin: var(--mk-1) 0 0 var(--mk-6);
        }

        .mk .btn-row { display: flex; gap: var(--mk-4); flex-wrap: wrap; align-items: center; }
        .mk .btn {
          display: inline-flex; align-items: center; gap: var(--mk-2); min-height: 44px;
          padding: 12px 26px; border-radius: var(--mk-r-sm); font-family: var(--mk-text);
          font-size: 16px; font-weight: 400; letter-spacing: 0.01em; cursor: pointer; border: 1px solid transparent;
          transition: background-color var(--mk-t-hover) var(--mk-ease-in-out),
                      border-color var(--mk-t-hover) var(--mk-ease-in-out), color var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .btn--primary { background: var(--mk-crimson); color: var(--mk-pearl); }
        .mk .btn--primary:hover { background: var(--mk-ruby); }
        .mk .btn--secondary { background: transparent; border-color: rgba(242,241,237,0.22); color: var(--mk-pearl); }
        .mk .btn--secondary:hover { border-color: rgba(242,241,237,0.45); background: rgba(242,241,237,0.04); }
        .mk .btn--text { position: relative; background: none; padding: 12px 0; color: var(--mk-pearl); }
        .mk .btn--text::after {
          content: ''; position: absolute; left: 0; bottom: 8px; height: 1px; width: 100%;
          background: var(--mk-crimson); transform: scaleX(0); transform-origin: left;
          transition: transform var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .btn--text:hover::after { transform: scaleX(1); }
        .mk .btn-arrow { transition: transform var(--mk-t-hover) var(--mk-ease-in-out); }
        .mk .btn:hover .btn-arrow { transform: translateX(4px); }

        .mk .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--mk-5); }
        .mk .pcard { cursor: pointer; }
                .mk .pcard-media {
          position: relative; overflow: hidden; border-radius: 14px; aspect-ratio: 16 / 10;
          background: var(--mk-ink); box-shadow: var(--mk-shadow-card);
          transition: transform var(--mk-t-hover) var(--mk-ease-out),
                      box-shadow var(--mk-t-hover) var(--mk-ease-out);
        }
        .mk .pcard-img {
          position: absolute; inset: 0; background-size: cover; background-position: center;
          filter: saturate(1.06) contrast(1.18) brightness(1.05);
          transition: transform var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .pcard-scrim {
          position: absolute; inset: 0; opacity: 0.8;
          background: linear-gradient(0deg, rgba(10,13,14,0.82), rgba(38,10,14,0.16) 42%, rgba(10,13,14,0) 66%);
          transition: opacity var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .pcard-icon {
          position: absolute; right: var(--mk-4); top: var(--mk-4); width: 26px; height: 26px;
          color: var(--mk-pearl); opacity: 0.75;
        }
                .mk .pcard:hover .pcard-img, .mk .pcard:focus-visible .pcard-img { transform: scale(1.05); }
        .mk .pcard:hover .pcard-media, .mk .pcard:focus-visible .pcard-media {
          transform: translateY(-4px); box-shadow: 0 30px 58px -24px rgba(0, 0, 0, 1);
        }
        .mk .pcard:hover .pcard-sub, .mk .pcard:focus-visible .pcard-sub { color: var(--mk-taxi); }
        .mk .pcard:hover .pcard-scrim, .mk .pcard:focus-visible .pcard-scrim { opacity: 1; }
        .mk .pcard-body { display: flex; gap: var(--mk-2); align-items: flex-start; margin-top: var(--mk-4); }
        .mk .pcard-title {
          font-family: var(--mk-display); font-weight: 400; color: var(--mk-white);
          font-size: 22px; letter-spacing: -0.01em;
          margin: 0; transition: transform var(--mk-t-hover) var(--mk-ease-in-out);
        }
        .mk .pcard:hover .pcard-title { transform: translateY(-2px); }
        .mk .pcard-sub { font-size: 13px; letter-spacing: 0.02em; color: var(--mk-ash); margin: 2px 0 0;
          transition: color var(--mk-t-hover) var(--mk-ease-in-out); }
        .mk .pcard-desc { font-size: 15px; line-height: 1.55; margin: var(--mk-2) 0 0; }

        .mk .nav-spec { margin-top: var(--mk-5); }
        .mk .radius-row { display: flex; gap: var(--mk-6); flex-wrap: wrap; }
        .mk .radius { display: flex; flex-direction: column; gap: var(--mk-2); }
        .mk .radius-box { width: 84px; height: 60px; background: var(--mk-bordeaux); border: 1px solid rgba(242,241,237,0.14); }
        .mk .radius-val { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 13px; color: var(--mk-ash); }
        .mk .radius-use { font-size: 13px; color: var(--mk-ash); max-width: 12ch; line-height: 1.4; }

        /* ------------------------------------------------------------ voice -- */
        .mk .voice-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--mk-8); }
        .mk .voice-list li { position: relative; padding-left: var(--mk-5); margin-bottom: var(--mk-4); font-size: 16px; line-height: 1.6; }
        .mk .voice-list.is-do li::before {
          content: ''; position: absolute; left: 0; top: 0.4em; width: 2px; height: 16px; background: rgba(242, 241, 237, 0.34);
        }
        .mk .voice-list.is-dont li { color: var(--mk-ash); text-decoration: line-through; text-decoration-color: rgba(175,162,160,0.4); }

        /* ---------------------------------------------------------- closing -- */
        .mk .closing {
          padding: clamp(96px, 14vw, 180px) var(--edge);
          background: radial-gradient(760px 460px at 18% 32%, rgba(113,0,20,0.28), transparent 62%), var(--mk-obsidian);
        }
        .mk .closing-inner { max-width: 1440px; margin: 0 auto; }
        .mk .closing-line {
          font-family: var(--mk-display); font-weight: 400; color: var(--mk-white); font-size: clamp(36px, 8vw, 84px);
          line-height: 1.0; letter-spacing: -0.04em; margin: 0;
        }
        .mk .closing-bn {
          font-family: var(--mk-bengali); font-variation-settings: 'wght' 500;
          font-size: clamp(18px, 3vw, 32px); line-height: 1.5; color: var(--mk-blush); margin: var(--mk-5) 0 0;
        }
        .mk .closing-note { max-width: 56ch; font-size: 17px; line-height: 1.7; color: var(--mk-ash); margin: var(--mk-7) 0 0; }
        .mk .closing-ref { font-size: 14px; color: var(--mk-ash); margin: var(--mk-6) 0 0; }

        /* -------------------------------------------------------- responsive -- */
        @media (max-width: 900px) {
          .mk .mark-grid { grid-template-columns: 1fr; }
          .mk .retired, .mk .grade { grid-template-columns: 1fr; }
          .mk .retired-chip, .mk .grade-chip { min-height: 80px; }
          .mk .spec > div { grid-template-columns: 1fr; gap: 2px; }
          .mk .table { font-size: 14px; display: block; overflow-x: auto; white-space: nowrap; }
          .mk .banner { aspect-ratio: 4 / 5; }
          .mk .banner-content { max-width: 100%; }
          .mk .capshot { aspect-ratio: 3 / 2; }
          .mk .stills { grid-template-columns: 1fr; }
          .mk .still-word { font-size: clamp(56px, 18vw, 96px); }
          .mk .still-kicker, .mk .still-spread { font-size: 11px; }
          .mk .still-spread { width: 72%; }
        }

        /* --------------------------------------------------- reduced motion -- */
        @media (prefers-reduced-motion: reduce) {
          .mk { scroll-behavior: auto; }
          .mk .letterbox { display: none; }
          .mk .title-inner > *, .mk .title-meta { opacity: 1 !important; transform: none !important; transition: none !important; }
          .mk .banner-img { animation: none !important; transform: none !important; }
          .mk .runner { animation-duration: 1ms !important; }
          .mk * { transition-duration: 0.01ms !important; }
        }
      `}</style>
    </>
  )
}
