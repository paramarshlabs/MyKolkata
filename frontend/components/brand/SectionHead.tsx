import type { ReactNode } from 'react'
import { Sprig } from './kolka'

type SectionHeadProps = {
  title: ReactNode
  id?: string
  /* Bengali only where the English heading is a transliteration of it. §4.3 */
  bengali?: string
  lede?: ReactNode
  action?: ReactNode
  /* 3: a section inside one of /home's parts of the day — a size down */
  level?: 1 | 2 | 3
  className?: string
}

/* The sprig does the job an eyebrow label would — there are no ALL-CAPS kickers. */
export function SectionHead({ title, id, bengali, lede, action, level = 2, className = '' }: SectionHeadProps) {
  const Heading = level === 1 ? 'h1' : level === 3 ? 'h3' : 'h2'
  return (
    <header className={className}>
      <div className="mk-band-head mk-band-head--split">
        <div className="mk-band-head-title">
          <Sprig size={level === 1 ? 46 : level === 3 ? 30 : 38} />
          <Heading id={id} className={level === 3 ? 'mk-h2' : 'mk-h1'}>
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
