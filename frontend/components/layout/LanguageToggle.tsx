'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

/* One letter in the notch: অ reads the site in Bengali, A brings the English back.
   On a phone, where the bar has the room, the whole word: বাংলা, or English. */
export function LanguageToggle() {
  const { lang, toggle } = useLanguage()
  const bn = lang === 'bn'
  return (
    <button
      type="button"
      className="nn-lang"
      data-no-bn
      aria-pressed={bn}
      aria-label={bn ? 'Show in English' : 'বাংলায় দেখুন'}
      title={bn ? 'English' : 'বাংলা'}
      onClick={toggle}
    >
      {bn ? <span className="nn-lang-short">A</span> : <span className="nn-lang-short" lang="bn">অ</span>}
      {bn ? <span className="nn-lang-long">English</span> : <span className="nn-lang-long" lang="bn">বাংলা</span>}
    </button>
  )
}
