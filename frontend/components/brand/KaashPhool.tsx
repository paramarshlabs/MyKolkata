'use client'

import { CloudShader } from '@/components/ui/cloud-shader'

/*
 * The kaash-phool still — drawn, not photographed.
 * Composition from the monsoon-field frame. Colour, caption, and band
 * from DESIGN.md §§3, 8, 9.6, 9.7, 10. Fixed seed so SSR matches the client.
 * Sky and clouds: CloudShader.
 */

function seeded(seed: number) {
  let x = seed
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648
    return x / 2147483648
  }
}

type PlumeT = { x: number; h: number; lean: number; o: number; ground: number; front: boolean }

const HERO: PlumeT[] = [
  { x: 40, h: 460, lean: 132, o: 0.94, ground: 900, front: true },
  { x: 110, h: 500, lean: 150, o: 0.96, ground: 910, front: true },
  { x: 190, h: 430, lean: 118, o: 0.9, ground: 898, front: true },
  { x: 270, h: 520, lean: 162, o: 0.98, ground: 918, front: true },
  { x: 360, h: 470, lean: 140, o: 0.93, ground: 904, front: true },
  { x: 450, h: 400, lean: 114, o: 0.88, ground: 892, front: true },
  { x: 530, h: 350, lean: 98, o: 0.82, ground: 886, front: true },
  { x: 610, h: 290, lean: 86, o: 0.74, ground: 878, front: true },
  { x: 1180, h: 230, lean: 78, o: 0.76, ground: 872, front: true },
  { x: 1280, h: 270, lean: 94, o: 0.82, ground: 888, front: true },
  { x: 1385, h: 205, lean: 70, o: 0.7, ground: 868, front: true },
  { x: 1488, h: 248, lean: 82, o: 0.78, ground: 882, front: true },
]

const FIELD: PlumeT[] = (() => {
  const r = seeded(20141002)
  const out: PlumeT[] = []
  for (let i = 0; i < 96; i++) {
    const roll = r()
    const x = roll < 0.64 ? r() * 940 : roll < 0.8 ? 940 + r() * 260 : 1200 + r() * 380
    const left = x < 920
    const front = r() > (left ? 0.48 : 0.7)
    const ground = front ? 868 + r() * 40 : 628 + r() * 110
    out.push({
      x,
      h: (front ? 120 : 64) + r() * (left ? 210 : 88),
      lean: 24 + r() * 92 + (left ? 18 : 0),
      o: Math.min(1, (front ? 0.5 : 0.2) + r() * 0.42),
      ground,
      front,
    })
  }
  return out
})()

const GRASS = (() => {
  const r = seeded(20141003)
  return Array.from({ length: 110 }, () => ({
    x: r() * 1600,
    h: 18 + r() * 48,
    lean: 10 + r() * 32,
    o: 0.22 + r() * 0.5,
    ground: 810 + r() * 90,
  }))
})()

const PLUMES = [...FIELD, ...HERO]

/* A kaash plume is a dense soft spike — filled teardrops, not a fern of long barbs. */
function Plume({ k }: { k: PlumeT }) {
  const tipX = k.x + k.lean
  const tipY = k.ground - k.h
  const hh = k.h * (k.front ? 0.6 : 0.5)
  const n = k.front && k.h > 260 ? 5 : 0
  const petals = []
  for (let j = 0; j < n; j++) {
    const f = (j / (n - 1)) * 0.22
    const py = tipY + f * hh
    const px = tipX - k.lean * f * 0.18
    const L = 26 * (0.7 + (1 - j / (n - 1)) * 0.35)
    const w = L * 0.4
    petals.push(
      <path
        key={`l${j}`}
        d={`M${px} ${py} C${px - w} ${py - L * 0.28}, ${px - w * 0.55} ${py - L * 0.78}, ${px} ${py - L} C${px - w * 0.12} ${py - L * 0.45}, ${px - w * 0.08} ${py - L * 0.18}, ${px} ${py}Z`}
        fill="#FCFBF8"
        opacity={0.42 + (1 - f) * 0.28}
      />,
      <path
        key={`r${j}`}
        d={`M${px} ${py} C${px + w} ${py - L * 0.28}, ${px + w * 0.55} ${py - L * 0.78}, ${px} ${py - L} C${px + w * 0.12} ${py - L * 0.45}, ${px + w * 0.08} ${py - L * 0.18}, ${px} ${py}Z`}
        fill="#F2F1ED"
        opacity={0.38 + (1 - f) * 0.3}
      />,
    )
  }
  const cx = tipX
  const cy = tipY + hh * 0.46
  const rot = k.lean * 0.18
  return (
    <g opacity={k.front ? Math.min(1, k.o + 0.08) : k.o * 0.75}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={k.front ? 28 : 16}
        ry={hh * 0.4}
        transform={`rotate(${rot} ${cx} ${cy})`}
        fill="#FCFBF8"
        opacity={k.front ? 0.62 : 0.28}
      />
      <ellipse
        cx={cx + (k.front ? 5 : 3)}
        cy={cy + 6}
        rx={k.front ? 14 : 9}
        ry={hh * 0.34}
        transform={`rotate(${rot + 6} ${cx} ${cy})`}
        fill="#F2F1ED"
        opacity={k.front ? 0.4 : 0.18}
      />
      <path
        d={`M${k.x} ${k.ground} Q${k.x + k.lean * 0.36} ${k.ground - k.h * 0.56} ${tipX} ${tipY + hh * 0.2}`}
        fill="none"
        stroke={k.front ? '#3A5234' : '#2A3A2E'}
        strokeLinecap="round"
        strokeWidth={k.front ? 1.45 : 0.9}
      />
      {petals}
    </g>
  )
}

export function KaashPhoolScene() {
  return (
    <>
      <div className="mk-sky-frame">
        <div className="mk-sky-fit">
      <div className="mk-sky-shader">
      <CloudShader
        skyTopColor="#1E6FB8"
        skyBottomColor="#7AB8E0"
        cloudColor="#F2F1ED"
        count={6}
        speed={0.7}
      />
      </div>
      <svg className="mk-sky" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="kp-field" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5A7A42" />
            <stop offset="42%" stopColor="#3D5C32" />
            <stop offset="100%" stopColor="#1A2E1C" />
          </linearGradient>
          <radialGradient id="kp-sunlit" cx="76%" cy="64%" r="28%">
            <stop offset="0%" stopColor="#7A9A52" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7A9A52" stopOpacity="0" />
          </radialGradient>
          <filter id="kp-soft" x="-20%" y="-80%" width="140%" height="260%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="kp-plume" x="-30%" y="-40%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id="kp-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="19" result="n" />
            <feColorMatrix in="n" type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.08" />
            </feComponentTransfer>
          </filter>
          <radialGradient id="kp-vignette" cx="50%" cy="42%" r="72%">
            <stop offset="55%" stopColor="#132A2E" stopOpacity="0" />
            <stop offset="100%" stopColor="#132A2E" stopOpacity="0.32" />
          </radialGradient>
        </defs>

        <g transform="translate(0 80)">
        <rect x="0" y="500" width="1600" height="400" fill="url(#kp-field)" />
        <rect x="0" y="500" width="1600" height="400" fill="url(#kp-sunlit)" />
      <path
        d="M0 524 C90 506, 170 518, 260 502 C350 484, 450 516, 560 498 C670 476, 790 518, 920 500 C1060 480, 1200 516, 1360 502 C1480 492, 1560 514, 1600 508 L1600 536 L0 536 Z"
        fill="#132A2E"
        opacity="0.22"
      />
      <g className="mk-sky-kaash-back" filter="url(#kp-soft)" fill="#FCFBF8">
        <ellipse cx="260" cy="640" rx="210" ry="78" transform="rotate(-20 260 640)" opacity="0.22" />
        <ellipse cx="430" cy="660" rx="180" ry="70" transform="rotate(-24 430 660)" opacity="0.2" />
        <ellipse cx="580" cy="680" rx="140" ry="58" transform="rotate(-18 580 680)" opacity="0.16" />
      </g>

      <g className="mk-sky-kaash-back" filter="url(#kp-plume)">
        {PLUMES.filter((k) => !k.front).map((k, i) => <Plume key={`b${i}`} k={k} />)}
      </g>
      <g fill="none" stroke="#3A5234" strokeLinecap="round">
        {GRASS.map((g, i) => (
          <path
            key={i}
            d={`M${g.x} ${g.ground} Q${g.x + g.lean * 0.35} ${g.ground - g.h * 0.5} ${g.x + g.lean * 0.7} ${g.ground - g.h * 0.72}`}
            strokeWidth="1.1"
            opacity={g.o * 0.7}
          />
        ))}
      </g>
      <g className="mk-sky-kaash-front">
        {PLUMES.filter((k) => k.front).map((k, i) => <Plume key={`f${i}`} k={k} />)}
      </g>

      <rect x="0" y="500" width="1600" height="400" filter="url(#kp-grain)" opacity="0.55" />
        </g>
      <rect width="1600" height="900" fill="url(#kp-vignette)" />
    </svg>
        </div>
      </div>
    <img className="mk-sky-eyes" src="/durgaeyes.png" alt="" aria-hidden="true" />
    </>
  )
}

export default function KaashPhool() {
  return (
    <main className="kp-page">
      <style>{`
        .kp-page {
          min-height: 100svh;
          background: #0D1012;
          display: flex;
          align-items: center;
        }
        .kp {
          position: relative;
          overflow: hidden;
          width: 100%;
          aspect-ratio: 2.39 / 1;
          min-height: 420px;
          margin: 0;
        }
        .kp-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background:
            linear-gradient(90deg, rgba(13,16,18,0.78) 0%, rgba(13,16,18,0.32) 36%, rgba(13,16,18,0) 62%),
            linear-gradient(0deg, rgba(13,16,18,0.62) 0%, rgba(38,10,14,0.18) 28%, rgba(38,10,14,0) 48%);
        }
        .kp .mk-capdev {
          position: absolute;
          left: 0; bottom: 0;
          padding: clamp(24px, 5vw, 64px);
          max-width: min(760px, 94%);
        }
        @media (max-width: 720px) {
          .kp { aspect-ratio: 4 / 5; min-height: 100svh; }
        }
      `}</style>
      <figure className="kp">
        <KaashPhoolScene />
        <div className="kp-scrim" aria-hidden="true" />
        <figcaption className="mk-capdev">
          <span className="mk-capdev-tick" aria-hidden="true" />
          <div>
          </div>
        </figcaption>
      </figure>
    </main>
  )
}
