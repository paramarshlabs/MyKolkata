'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

/* One letter: ব reads the site in Bengali, A brings the English back. Beside the
   account in the desktop notch, and floating over the page on a phone. */
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
      {bn ? <span className="nn-lang-short">A</span> : <span className="nn-lang-short" lang="bn">ব</span>}
    </button>
  )
}
