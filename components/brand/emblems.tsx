import type { ReactNode } from 'react'
import { petalPath } from './kolka'

/* ================================================================ emblems == */
/*  Filled, two-tone cultural marks in the alpona vocabulary: Pearl body with a
    Crimson accent, exactly as design/kolka_design_2.png does it. 64px grid.
    These are NOT UI icons — see ./icons for those. design.md §7.               */

const P = 'var(--mk-pearl)'
const CR = 'var(--mk-crimson)'
const YL = 'var(--mk-taxi)'

type PetalProps = { x: number; y: number; rot: number; L: number; w: number; fill?: string }

export function EP({ x, y, rot, L, w, fill = P }: PetalProps) {
  return (
    <g transform={`rotate(${rot} ${x} ${y}) translate(${x} ${y})`}>
      <path d={petalPath(L, w)} fill={fill} />
    </g>
  )
}

export const EMBLEMS = {
  eyes: (
    <>
      <path d="M32 2 C37.5 9 37.5 18 32 25 C26.5 18 26.5 9 32 2Z" fill={P} />
      <circle cx="32" cy="14" r="3.4" fill={CR} />
      <path d="M1 31 C10 19 25 18 32 27 C25 23 11 25 1 31Z" fill={P} />
      <path d="M63 31 C54 19 39 18 32 27 C39 23 53 25 63 31Z" fill={P} />
      <path d="M1 47 C10 34 25 33 31 41 C25 52 10 54 1 47Z" fill={P} />
      <circle cx="17" cy="43" r="5.6" fill={CR} />
      <path d="M63 47 C54 34 39 33 33 41 C39 52 54 54 63 47Z" fill={P} />
      <circle cx="47" cy="43" r="5.6" fill={CR} />
      <circle cx="32" cy="58" r="3.2" fill={P} />
    </>
  ),
  mukut: (
    <>
      <path fill={P} d="M8 47 C8 40 10 35 12 31 C14 37 16 40 18 42 C18 33 20 21 24 12 C27 21 29 33 30 42
        C31 31 31 17 32 4 C33 17 33 31 34 42 C35 33 37 21 40 12 C44 21 46 33 46 42
        C48 40 50 37 52 31 C54 35 56 40 56 47Z" />
      <path d="M4 47 L60 47 C60 55 56 58 50 58 L14 58 C8 58 4 55 4 47Z" fill={P} />
      <circle cx="32" cy="52.5" r="4.2" fill={YL} />
      <circle cx="19" cy="52.5" r="2.6" fill={YL} /><circle cx="45" cy="52.5" r="2.6" fill={YL} />
      <circle cx="24" cy="8" r="2.2" fill={P} /><circle cx="40" cy="8" r="2.2" fill={P} />
    </>
  ),
  dhaak: (
    <>
      <EP x={22} y={27} rot={-18} L={16} w={4.2} /><EP x={32} y={25} rot={0} L={19} w={4.8} />
      <EP x={42} y={27} rot={18} L={16} w={4.2} />
      <path d="M12 29 C24 25 40 25 52 29 C56 34 56 48 52 53 C40 57 24 57 12 53 C8 48 8 34 12 29Z" fill={CR} />
      <ellipse cx="12" cy="41" rx="5" ry="14" fill={P} />
      <ellipse cx="52" cy="41" rx="5" ry="14" fill={P} />
      <path d="M18 30 L24 52 M26 29 L32 53 M34 29 L40 53 M42 30 L48 52"
        stroke={P} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  dhunuchi: (
    <>
      <path d="M25 17 C20 10 28 7 24 1" stroke={P} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M32 16 C38 8 29 5 33 0" stroke={P} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M39 17 C44 10 36 7 40 1" stroke={P} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="32" cy="23" rx="18" ry="4" fill={P} />
      <path d="M14 23 C16 37 22 45 32 45 C42 45 48 37 50 23Z" fill={P} />
      <circle cx="25" cy="24" r="3" fill={CR} /><circle cx="32" cy="25" r="3.6" fill={CR} />
      <circle cx="39" cy="24" r="3" fill={CR} />
      <path d="M28 45 L36 45 L35 53 L29 53Z" fill={P} />
      <path d="M19 62 C19 54 25 53 32 53 C39 53 45 54 45 62Z" fill={P} />
    </>
  ),
  shankha: (
    <>
      <path d="M18 50 L3 62 L15 44Z" fill={P} />
      <ellipse cx="35" cy="33" rx="20" ry="26" transform="rotate(-34 35 33)" fill={P} />
      <ellipse cx="27" cy="44" rx="5" ry="13" transform="rotate(-34 27 44)" fill={CR} />
      <path d="M44 12 C50 19 52 28 50 36" stroke={CR} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M37 9 C45 16 48 28 45 38" stroke={CR} strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </>
  ),
  lotus: (
    <>
      <EP x={32} y={46} rot={0} L={40} w={10} /><EP x={32} y={46} rot={-36} L={34} w={9} />
      <EP x={32} y={46} rot={36} L={34} w={9} /><EP x={32} y={46} rot={-70} L={26} w={7.5} />
      <EP x={32} y={46} rot={70} L={26} w={7.5} />
      <path d="M4 48 C14 56 24 58 32 58 C40 58 50 56 60 48 C52 60 40 62 32 62 C24 62 12 60 4 48Z" fill={P} />
      <circle cx="32" cy="45" r="5" fill={CR} />
    </>
  ),
  diya: (
    <>
      <path d="M32 3 C25 16 21 25 21 30 C21 36 26 39 32 39 C38 39 43 36 43 30 C43 25 39 16 32 3Z" fill={YL} />
      <ellipse cx="32" cy="42" rx="26" ry="5" fill={P} />
      <path d="M6 42 C7 53 18 60 32 60 C46 60 57 53 58 42Z" fill={P} />
    </>
  ),
  kalash: (
    <>
      <EP x={19} y={25} rot={-58} L={21} w={5.5} /><EP x={45} y={25} rot={58} L={21} w={5.5} />
      <EP x={25} y={22} rot={-30} L={22} w={5.5} /><EP x={39} y={22} rot={30} L={22} w={5.5} />
      <EP x={32} y={20} rot={0} L={15} w={5} />
      <circle cx="32" cy="11" r="6" fill={P} />
      <path d="M27 11 C29 8 35 8 37 11" stroke={YL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M10 25 L54 25 L51 33 L13 33Z" fill={P} />
      <path d="M15 33 C11 49 19 60 32 60 C45 60 53 49 49 33Z" fill={P} />
      <circle cx="32" cy="46" r="6" fill={CR} />
    </>
  ),
  trishul: (
    <>
      <path d="M32 2 C28.5 11 26.5 17 26.5 22 L37.5 22 C37.5 17 35.5 11 32 2Z" fill={P} />
      <path d="M13 22 C12 13 15 6 20 3 C19 11 20 17 22.5 22Z" fill={P} />
      <path d="M51 22 C52 13 49 6 44 3 C45 11 44 17 41.5 22Z" fill={P} />
      <path d="M11 22 L53 22 L53 28 L11 28Z" fill={P} />
      <path d="M29 28 L35 28 L34 62 L30 62Z" fill={P} />
      <circle cx="32" cy="37" r="4" fill={CR} />
    </>
  ),
  kash: (
    <>
      <path d="M32 33 C21 29 14 16 15 2 C26 7 32 19 32 33Z" fill={P} />
      <path d="M32 33 C43 29 50 16 49 2 C38 7 32 19 32 33Z" fill={P} />
      <path d="M30 62 L30 28 L34 28 L34 62Z" fill={P} />
      <circle cx="32" cy="27" r="3.2" fill={CR} />
    </>
  ),
  shiuli: (
    <>
      {[0, 60, 120, 180, 240, 300].map((d) => <EP key={d} x={32} y={26} rot={d} L={21} w={7.5} />)}
      <circle cx="32" cy="26" r="6" fill={CR} />
      <path d="M30.5 62 L30.5 30 L33.5 30 L33.5 62Z" fill={CR} />
    </>
  ),
} satisfies Record<string, ReactNode>

export type EmblemName = keyof typeof EMBLEMS

export const EMBLEM_LIST: [EmblemName, string, string, string][] = [
  ['eyes', "Durga's eyes", 'চোখ', 'The most recognisable mark in Bengal. Brand moments, splash, empty states.'],
  ['mukut', 'Mukut', 'মুকুট', 'The crown. Premium, featured and awarded states.'],
  ['dhaak', 'Dhaak', 'ঢাক', 'Rhythm and arrival — the sound of the first morning. Live and now-playing.'],
  ['dhunuchi', 'Dhunuchi', 'ধুনুচি', 'Smoke and evening aarti. Atmosphere, ambience, evening listings.'],
  ['shankha', 'Shankha', 'শাঁখ', 'The call. Announcements, notifications, the start of something.'],
  ['lotus', 'Lotus', 'পদ্ম', 'Purity. The recurring secondary symbol beneath the kolka.'],
  ['diya', 'Diya', 'প্রদীপ', 'Hope and a light left on. Saved items, favourites.'],
  ['kalash', 'Kalash', 'কলস', 'Prosperity. Contribution, community funds, giving.'],
  ['trishul', 'Trishul', 'ত্রিশূল', 'Strength and protection. Account security, verified paras.'],
  ['kash', 'Kash phool', 'কাশফুল', 'The season turning. Dates, countdowns, what is coming.'],
  ['shiuli', 'Shiuli', 'শিউলি', 'Morning and the first day. New, unseen, just added.'],
]

/* Never smaller than 40px — the fills collapse below that. design.md §7A */
export function Emblem({ name, size = 56, className = '' }: { name: EmblemName; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={Math.max(40, size)} height={Math.max(40, size)}
      className={`mk-emblem ${className}`} aria-hidden="true">
      {EMBLEMS[name]}
    </svg>
  )
}
