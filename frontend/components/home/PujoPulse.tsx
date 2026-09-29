import { readTrend, type PujoTrend } from '@/lib/live/trend'
import { SectionHead } from '@/components/brand/SectionHead'
import { PulseChart } from './PulseChart'
import styles from '@/styles/Home.module.css'

const week = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/*  The city counting down, in its own searches: West Bengal's interest in
    "Durga Puja" over a year, last Pujo's peak on the left, this year's climb
    on the right. Renders nothing without the feed.                          */
export function PujoPulse({ trend }: { trend: PujoTrend | null }) {
  if (!trend) return null
  const reading = readTrend(trend)
  const summary = reading.ofPeak != null
    ? `This week searches are at ${reading.ofPeak}% of last Pujo's peak${reading.rising ? ', and climbing' : ''}.`
    : `This week searches are at ${reading.current.v} of 100${reading.rising ? ', and climbing' : ''}.`

  return (
    <section className="mk-band" aria-labelledby="pulse-title">
      <div className="mk-wrap">
        <SectionHead
          id="pulse-title"
          title="The city is counting down"
          lede="How much West Bengal searched for Durga Puja over the past year. Last Pujo's peak is on the left; the line on the right is this year."
        />
        <p className={styles.pulseSummary}>{summary}</p>
        <PulseChart
          points={trend.points}
          peakIndex={reading.peakIndex}
          peakLabel={reading.peakIndex != null ? `Pujo ${trend.points[reading.peakIndex].d.slice(0, 4)}, ${trend.points[reading.peakIndex].v}` : ''}
          nowLabel={`This week, ${reading.current.v}`}
        />
        <p className="mk-meta" style={{ marginTop: 16 }}>Google Trends, weekly. 100 is the busiest week of the year.</p>
        <table className="sr-only">
          <caption>Weekly search interest in Durga Puja, West Bengal, 0 to 100</caption>
          <thead><tr><th scope="col">Week of</th><th scope="col">Interest</th></tr></thead>
          <tbody>
            {trend.points.map((point) => <tr key={point.d}><td>{week(point.d)}</td><td>{point.v}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  )
}
