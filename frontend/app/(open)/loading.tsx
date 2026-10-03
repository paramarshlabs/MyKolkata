import { AlponaLoader } from '@/components/brand/Alpona'

/* Shown the moment a link is tapped, while the server renders the page, so a
   slow connection gets an answer straight away instead of a frozen screen.
   The layout around it (header, footer) stays put. */
export default function Loading() {
  return (
    <main className="mk-page mk-page-top" aria-busy="true">
      <div className="mk-wrap" style={{ minHeight: '60vh' }}>
        <AlponaLoader label="Loading…" />
      </div>
    </main>
  )
}
