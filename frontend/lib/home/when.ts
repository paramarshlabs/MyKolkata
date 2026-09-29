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

/* "Today", "Yesterday", "3 days ago" — on the Kolkata calendar */
export function daysAgo(iso: string, now: Date) {
  const days = Math.round((Date.parse(kolkataDate(now)) - Date.parse(kolkataDate(new Date(iso)))) / DAY_MS)
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
}

/* "Just now", "40 minutes ago", "5 hours ago", then the day */
export function ago(iso: string, now: Date) {
  const minutes = Math.round((now.getTime() - Date.parse(iso)) / 60_000)
  if (minutes < 2) return 'Just now'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  return daysAgo(iso, now)
}
