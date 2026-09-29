/* Times as people say them, on the Kolkata clock. */

const DAY_MS = 86_400_000
const kolkataDate = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

/* "Tonight, 7:30 pm", "Tomorrow, 11 am", "Sat 3 Oct, 6 pm" — Kolkata time */
export function showWhen(iso: string | null, now: Date) {
  if (!iso) return 'Showing this week'
  const date = new Date(iso)
  const time = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    .replace(':00', '').replace(/\s?(am|pm)/i, (m) => ` ${m.trim().toLowerCase()}`)
  const days = Math.round((Date.parse(kolkataDate(date)) - Date.parse(kolkataDate(now))) / DAY_MS)
  const hour = Number(date.toLocaleTimeString('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Kolkata' }))
  if (days === 0) return `${hour >= 17 ? 'Tonight' : 'Today'}, ${time}`
  if (days === 1) return `Tomorrow, ${time}`
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
  return `${day}, ${time}`
}
