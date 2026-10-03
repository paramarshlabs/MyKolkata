import type { ReactNode } from 'react'

/* ================================================================== icons == */
/*  UI utility. Line, 32px grid, 1.5px, no fills — the deliberate opposite of
    the emblems, so the two can never be confused. design.md §7B.

    Crimson Silk for active states, Soft Pearl on dark. Never two colours in one
    icon, never a filled variant, and an icon never carries meaning alone — it
    always sits beside a word, or carries an aria-label on an icon-only control. */

export const ICONS = {
  howrah: (
    <>
      <path d="M1 24h30" /><path d="M7 24V6M25 24V6" /><path d="M7 6h18" />
      <path d="M7 6q9 8 18 0" /><path d="M7 14h18" />
      <path d="M1 24 7 19M31 24 25 19" /><path d="M11 14v10M16 14v10M21 14v10" />
    </>
  ),
  tram: (
    <>
      <rect x="5" y="9" width="22" height="14" rx="2" /><path d="M5 14h22" />
      <circle cx="10" cy="26" r="2.2" /><circle cx="22" cy="26" r="2.2" />
      <path d="M16 9V5l5-2" /><path d="M9 18h4M19 18h4" />
    </>
  ),
  taxi: (
    <>
      <path d="M3 22v-3q0-3 3-3l2.5-5q.7-1.5 2.5-1.5h10q1.8 0 2.5 1.5L26 16q3 0 3 3v3Z" />
      <path d="M8.5 16h15" /><circle cx="9" cy="22" r="2.4" /><circle cx="23" cy="22" r="2.4" />
      <rect x="13" y="4" width="6" height="3.5" rx="1" />
    </>
  ),
  rickshaw: (
    <>
      <circle cx="11" cy="22" r="6" /><circle cx="11" cy="22" r="1.5" />
      <path d="M7 16h11l2-7H10Z" /><path d="M10 9q1-5 6-5t5 5" />
      <path d="M20 11 30 6M18 16l10-4" />
    </>
  ),
  victoria: (
    <>
      <path d="M2 28h28" /><path d="M4 25v-7h24v7" />
      <path d="M11 18q0-6 5-6t5 6" /><path d="M16 12V8" />
      <path d="M5 18q0-3.5 3-3.5M27 18q0-3.5-3-3.5" /><path d="M11 25v-4M21 25v-4" />
    </>
  ),
  bhaar: (
    <>
      <path d="M10.5 13 12.5 25q.3 1.5 3.5 1.5t3.5-1.5L21.5 13Z" /><path d="M9 13h14" />
      <path d="M13.5 9q1.5-2 0-4M18.5 9q1.5-2 0-4" />
    </>
  ),
  phuchka: (
    <>
      <circle cx="16" cy="18" r="9" /><path d="M10 13q6-4 12 0" />
      <path d="M13 9.5q3-2 6 0" /><circle cx="13" cy="20" r="1" /><circle cx="19" cy="21" r="1" />
    </>
  ),
  lamp: (
    <>
      <path d="M16 29V13" /><path d="M11.5 29h9" />
      <path d="M12 13l2-6h4l2 6Z" /><path d="M16 7V4" /><circle cx="16" cy="2.5" r="1.2" />
      <path d="M12.5 15q-4 0-4 3M19.5 15q4 0 4 3" />
    </>
  ),
  boat: (
    <>
      <path d="M3 19h26l-3.5 6H6.5Z" /><path d="M16 19V4" /><path d="M16 6l8 5-8 3.5" />
      <path d="M2 29q3-2.5 6 0t6 0 6 0 6 0" />
    </>
  ),
  balcony: (
    <>
      <path d="M7 3h18v17H7Z" /><path d="M7 9h18M7 14h18" /><path d="M3 20h26" />
      <path d="M6 20v7M11 20v7M16 20v7M21 20v7M26 20v7" /><path d="M3 27h26" />
    </>
  ),
  book: (
    <>
      <path d="M16 8q-4-3-11-2v18q7-1 11 2Z" /><path d="M16 8q4-3 11-2v18q-7-1-11 2Z" />
      <path d="M16 8v18" />
    </>
  ),
  signboard: (
    <>
      <rect x="4" y="5" width="24" height="14" rx="1.5" /><path d="M16 19v6" /><path d="M10 28h12" />
      <path d="M8 10h16M8 14.5h9" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type CityIconName = keyof typeof ICONS

export const ICON_LIST: [CityIconName, string, string][] = [
  ['howrah', 'Howrah Bridge', 'The city itself — map and location states'],
  ['tram', 'Tram', 'Transport, routes, getting there'],
  ['taxi', 'Ambassador taxi', 'Rides, directions, distance'],
  ['rickshaw', 'Hand-pulled rickshaw', 'North Kolkata, heritage walks'],
  ['victoria', 'Victoria Memorial', 'Landmarks, monuments, guided routes'],
  ['balcony', 'North Kolkata balcony', 'Neighbourhoods, paras, old houses'],
  ['boat', 'Hooghly boat', 'The river, the ghats, crossings'],
  ['bhaar', 'Cha in a bhaar', 'Food and drink, adda, places to sit'],
  ['phuchka', 'Phuchka', 'Street food, markets, Gariahat'],
  ['book', 'College Street', 'Stories, long-form, the archive'],
  ['signboard', 'Hand-painted signage', 'Listings, names, para clubs'],
  ['lamp', 'Street lamp', 'Night mode, after-dark listings'],
]

type IconProps = { name: CityIconName; size?: number; className?: string }

export function CityIcon({ name, size = 32, className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`mk-icon ${className}`}
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

/* --------------------------------------------------------------- controls -- */
/*  The small controls the city set has no drawing for — search, close, the
    view switcher. Same line language as the navigation's search glyph: 24px
    grid, 1.75 stroke, round joins, no fills.                                  */

const UI = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12l5 5L20 7" />,
  back: <path d="M15 5l-7 7 7 7" />,
  locate: <><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="1.6" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /></>,
  filter: <path d="M4 7h16M7 12h10M10 17h4" />,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
  list: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  volume: <><path d="M5 10v4h3l4 3V7l-4 3Z" /><path d="M15 9q3 3 0 6M18 6q6 6 0 12" /></>,
  volumeOff: <><path d="M5 10v4h3l4 3V7l-4 3Z" /><path d="M16 9l5 6M21 9l-5 6" /></>,
  /* the Pujo trip planner's controls */
  share: <><path d="M12 15V4" /><path d="M8 8l4-4 4 4" /><path d="M6 12v6.5q0 1.5 1.5 1.5h9q1.5 0 1.5-1.5V12" /></>,
  directions: <><path d="M12 3 21 12 12 21 3 12Z" /><path d="M9.5 14v-2.5q0-1 1-1h4" /><path d="M13 8.5l2 2-2 2" /></>,
  pin: <><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  grip: <><circle cx="9" cy="7" r=".6" /><circle cx="15" cy="7" r=".6" /><circle cx="9" cy="12" r=".6" /><circle cx="15" cy="12" r=".6" /><circle cx="9" cy="17" r=".6" /><circle cx="15" cy="17" r=".6" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5q1.5 3.5 5 5l1.5-2 4 1.5v3q0 2-2 2Q10 18 5.5 7.5q0-4 1-4Z" />,
  people: <><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19q.5-5 5.5-5t5.5 5" /><circle cx="17" cy="9.5" r="2.3" /><path d="M16 14.2q4 .3 4.5 4.8" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7" /><path d="M6.5 7l1 12.5h9l1-12.5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" /></>,
  /* the phone tab bar (components/layout/Navbar.tsx) */
  home: <><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9v10.5h4.5V15h3v4.5H18V9" /></>,
  diya: <><path d="M12 4.5q2.2 2.6 0 5-2.2-2.4 0-5Z" /><path d="M3.5 13h17q-1 5.5-8.5 5.5T3.5 13Z" /><path d="M9 21h6" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>,
  sparkle: <><path d="M10 4q.8 5.2 6 6-5.2.8-6 6-.8-5.2-6-6 5.2-.8 6-6Z" /><path d="M18 14.5q.4 2.6 2.5 3-2.1.4-2.5 3-.4-2.6-2.5-3 2.1-.4 2.5-3Z" /><path d="M17.5 3.5v3M16 5h3" /></>,
} satisfies Record<string, ReactNode>

export type UiIconName = keyof typeof UI

export function UiIcon({ name, size = 18, className = '' }: { name: UiIconName; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={`mk-ui-icon ${className}`}
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {UI[name]}
    </svg>
  )
}
