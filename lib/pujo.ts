/* ==========================================================================
   Durga Puja 2026.
   These Gregorian dates shift every year with the lunar calendar — confirm
   against the panjika before each season. This is the only place they live.
   ========================================================================== */
export const MAHALAYA = '2026-10-11T00:00:00+05:30'

export const PUJO_DAYS = [
  { bn: 'ষষ্ঠী', en: 'Shashthi', iso: '2026-10-17T00:00:00+05:30' },
  { bn: 'সপ্তমী', en: 'Saptami', iso: '2026-10-18T00:00:00+05:30' },
  { bn: 'অষ্টমী', en: 'Ashtami', iso: '2026-10-19T00:00:00+05:30' },
  { bn: 'নবমী', en: 'Navami', iso: '2026-10-20T00:00:00+05:30' },
  { bn: 'দশমী', en: 'Dashami', iso: '2026-10-21T00:00:00+05:30' },
] as const

export function formatPujoDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}
