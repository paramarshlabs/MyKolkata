import type { ReactNode } from 'react'
import { Sprig } from './kolka'

type SectionHeadProps = {
  title: ReactNode
  id?: string
  /* Bengali only where the English heading is a transliteration of it. §4.3 */
  bengali?: string
  lede?: ReactNode
  action?: ReactNode
  level?: 1 | 2
  className?: string
}

/* The sprig does the job an eyebrow label would — there are no ALL-CAPS kickers. */
export function SectionHead({ title, id, bengali, lede, action, level = 2, className = '' }: SectionHeadProps) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <header className={className}>
      <div className="mk-band-head mk-band-head--split">
        <div className="mk-band-head-title">
          <Sprig size={level === 1 ? 46 : 38} />
          <Heading id={id} className="mk-h1">
            {title}
            {bengali && <span className="mk-bn" lang="bn" style={{ fontSize: '0.46em', marginLeft: 16 }}>{bengali}</span>}
          </Heading>
        </div>
        {action}
      </div>
      {lede && <p className="mk-lede">{lede}</p>}
    </header>
  )
}
