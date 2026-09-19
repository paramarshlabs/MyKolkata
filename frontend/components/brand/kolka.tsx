/* ============================================================== the kolka == */
/*  Built from design/kolka_design.png and kolka_design_2.png: solid filled
    petals and dots radiating from a red disc, flanked by two spiral volutes
    with hanging leaves and budded stems. Filled, not stroked — see design.md §5.

    Two forms:
      Medallion — the full motif. Hero, mark stage, closing. One per viewport.
      Sprig     — a filled teardrop over two dots. Headings, nav, bullets.

    No hooks here, so both render from Server Components. The bloom is driven by
    the `open` prop; MedallionBloom (./MedallionBloom) opens it once on mount.   */

const KC = 120, KCY = 116, KR = 25          /* centre and disc radius */

export const petalPath = (L: number, w: number) =>
  `M0 0 C${-w} ${-0.34 * L} ${-w} ${-0.72 * L} 0 ${-L} C${w} ${-0.72 * L} ${w} ${-0.34 * L} 0 0 Z`

/* [angle from vertical, length, half-width] — the gap at ±90° is where the volutes sit */
const K_PETALS = [
  [0, 58, 10], [34, 44, 9], [-34, 44, 9], [66, 34, 7.5], [-66, 34, 7.5],
  [180, 48, 10], [143, 38, 8], [-143, 38, 8], [110, 30, 7], [-110, 30, 7],
]

const K_DOTS = [[120, 20, 6, 0], [120, 5, 4, 1], [120, 204, 6, 0], [120, 221, 4, 1]]

type LeafProps = { x: number; y: number; rot: number; L: number; w: number; delay: number }

function Leaf({ x, y, rot, L, w, delay }: LeafProps) {
  return (
    <g transform={`rotate(${rot} ${x} ${y}) translate(${x} ${y})`}>
      <g className="k-grow" style={{ transitionDelay: `${delay}ms` }}>
        <path d={petalPath(L, w)} fill="currentColor" />
      </g>
    </g>
  )
}

function Volute() {
  return (
    <g className="k-volute">
      <path className="k-curl" pathLength="100" fill="none" stroke="currentColor"
        strokeWidth="4.5" strokeLinecap="round"
        d="M160 128 C182 140 202 140 213 128 C224 116 220 99 206 98 C195 97 189 107 196 113 C203 119 211 113 209 106" />
      <g className="k-pop" style={{ transitionDelay: '980ms' }}>
        <circle cx="205" cy="107" r="4.5" fill="currentColor" />
      </g>
      <path className="k-curl k-curl--stem" pathLength="100" fill="none" stroke="currentColor"
        strokeWidth="3.5" strokeLinecap="round" d="M215 118 C226 112 233 100 233 88" />
      <g className="k-pop" style={{ transitionDelay: '1060ms' }}>
        <circle cx="233" cy="82" r="6.5" fill="currentColor" />
      </g>
      <Leaf x={170} y={136} rot={200} L={30} w={7.5} delay={760} />
      <Leaf x={192} y={144} rot={218} L={28} w={7} delay={820} />
      <Leaf x={212} y={138} rot={236} L={26} w={6.5} delay={880} />
    </g>
  )
}

type MedallionProps = { open?: boolean; size?: number; className?: string }

export function Medallion({ open = true, size = 160, className = '' }: MedallionProps) {
  return (
    <svg className={`mk-kolka mk-medallion ${open ? 'is-open' : ''} ${className}`}
      viewBox="0 0 240 240" width={size} height={size} aria-hidden="true">
      <g className="k-pearl">
        {K_PETALS.map(([a, L, w], i) => (
          <g key={i} transform={`rotate(${a} ${KC} ${KCY}) translate(${KC} ${KCY - KR})`}>
            <g className="k-petal" style={{ transitionDelay: `${140 + i * 38}ms` }}>
              <path d={petalPath(L, w)} fill="currentColor" />
            </g>
          </g>
        ))}
        <Volute />
        <g transform="translate(240 0) scale(-1 1)"><Volute /></g>
        {K_DOTS.map(([cx, cy, r, j], i) => (
          <g className="k-pop" key={i} style={{ transitionDelay: `${1120 + j * 90}ms` }}>
            <circle cx={cx} cy={cy} r={r} fill="currentColor" />
          </g>
        ))}
      </g>
      <g className="k-disc">
        <circle cx={KC} cy={KCY} r={KR} fill="var(--mk-crimson)" />
      </g>
    </svg>
  )
}

type SprigProps = { size?: number; color?: string; className?: string }

export function Sprig({ size = 32, color = 'var(--mk-crimson)', className = '' }: SprigProps) {
  return (
    <svg className={`mk-sprig ${className}`} viewBox="0 0 40 104"
      width={size * (40 / 104)} height={size} aria-hidden="true" fill={color}>
      <path d="M20 4 C13 22 8 34 8 43 C8 51 13 56 20 56 C27 56 32 51 32 43 C32 34 27 22 20 4 Z" />
      <circle cx="20" cy="74" r="5.5" /><circle cx="20" cy="92" r="3.5" />
    </svg>
  )
}

/* ---------------------------------------------------------- notch wing -- */
/*  The concave fillets that let a notch flow into the bezel instead of sitting
    on it. 'left' and 'right' sit beside a notch at the top edge; the two
    'corner' wings fill the gap where the outer notches meet the viewport's own
    rounded corner.                                                            */

const WING = {
  left: 'M 0 0 C 11.046 0 20 8.954 20 20 H 21 V -1 H 0 Z',
  right: 'M 20 0 C 8.954 0 0 8.954 0 20 H -1 V -1 H 20 Z',
  'corner-left': 'M 0 0 H 20 C 8.954 0 0 8.954 0 20 V 0 Z',
  'corner-right': 'M 20 0 H 0 C 11.046 0 20 8.954 20 20 V 0 Z',
}

export function NotchWing({ side }: { side: keyof typeof WING }) {
  return (
    <svg className={`nn-wing nn-wing--${side}`} viewBox="0 0 20 20" aria-hidden="true">
      <path d={WING[side]} fill="currentColor" />
    </svg>
  )
}
