import { MAHALAYA, PUJO_DAYS, formatPujoDate } from '@/lib/pujo'
import { kolkataDay } from '@/lib/news/events'

/* ==========================================================================
   The season line: where today sits between the build-up, Mahalaya and the
   five days. Pure date arithmetic on the Kolkata calendar, so the server
   renders it and nothing ticks on the client.

   The build-up is three weeks long and the five days are four, so a linear
   scale would crush the days into a sliver. The line is drawn in three
   stretches instead, each with its own scale:
     start → Mahalaya       the first 52%
     Mahalaya → Shashthi    the next 14%
     Shashthi → Dashami     the last 34%, one step per day
   ========================================================================== */

const BUILD_UP_DAYS = 21
const STRETCH = [0.52, 0.14, 0.34] as const

export type SeasonNode = {
  key: string
  bn: string
  en: string
  date: string
  /* 0–1 along the line */
  at: number
  past: boolean
  today: boolean
}

export type SeasonLine = {
  nodes: SeasonNode[]
  /* where today's marker stands, 0–1 */
  todayAt: number
  todayLabel: string
  /* what the marker says next: "11 days to Mahalaya", "Ashtami today" */
  status: string
}

const epochOf = (iso: string) => kolkataDay(new Date(iso)).epochDay

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function seasonLine(now: Date = new Date()): SeasonLine | null {
  const today = kolkataDay(now).epochDay
  const mahalaya = epochOf(MAHALAYA)
  const days = PUJO_DAYS.map((d) => ({ ...d, epoch: epochOf(d.iso) }))
  const shashthi = days[0].epoch
  const dashami = days[days.length - 1].epoch
  const start = mahalaya - BUILD_UP_DAYS

  /* before the build-up and after Dashami there is no season to draw */
  if (today < start || today > dashami) return null

  const position = (epoch: number) => {
    if (epoch <= mahalaya) return ((epoch - start) / (mahalaya - start)) * STRETCH[0]
    if (epoch <= shashthi) return STRETCH[0] + ((epoch - mahalaya) / (shashthi - mahalaya)) * STRETCH[1]
    return STRETCH[0] + STRETCH[1] + ((epoch - shashthi) / (dashami - shashthi)) * STRETCH[2]
  }

  const nodes: SeasonNode[] = [
    { key: 'mahalaya', bn: 'মহালয়া', en: 'Mahalaya', date: formatPujoDate(MAHALAYA), epoch: mahalaya },
    ...days.map((d) => ({ key: d.en.toLowerCase(), bn: d.bn, en: d.en, date: formatPujoDate(d.iso), epoch: d.epoch })),
  ].map(({ epoch, ...node }) => ({ ...node, at: position(epoch), past: epoch < today, today: epoch === today }))

  let status: string
  const onDay = days.find((d) => d.epoch === today)
  if (today === mahalaya) status = 'Mahalaya today'
  else if (onDay) status = `${onDay.en} today`
  else if (today < mahalaya) status = `${plural(mahalaya - today, 'day')} to Mahalaya`
  else status = `${plural(shashthi - today, 'day')} to Shashthi`

  const todayLabel = new Date(now).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })

  return { nodes, todayAt: position(today), todayLabel, status }
}
