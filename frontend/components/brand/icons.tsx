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
