'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

/* One letter in the notch: অ reads the site in Bengali, A brings the English back. */
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
      {bn ? <span>A</span> : <span lang="bn">অ</span>}
    </button>
  )
}
