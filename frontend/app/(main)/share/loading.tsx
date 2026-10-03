import { AlponaLoader } from '@/components/brand/Alpona'

/* while the post is read and the place looked up: a second or two */
export default function Loading() {
  return (
    <main className="mk-page mk-page-top" aria-busy="true">
      <div className="mk-wrap" style={{ minHeight: '60vh' }}>
        <AlponaLoader label="Finding that place…" />
      </div>
    </main>
  )
}
