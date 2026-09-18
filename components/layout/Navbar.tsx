'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { NotchWing, Sprig } from '@/components/brand/kolka'
import UserMenu from '@/components/layout/UserMenu'

/*  The notch bar — see /brand-kit and styles/notchbar.css. Three notches cut
    from a Pearl bezel: the lockup, the sections, and search with the account.
    Below 1280px they fold into one island with a drawer.                      */

const SECTIONS = [
  { label: 'Home', href: '/home' },
  { label: 'Explore', href: '/places', also: ['/near-you'] },
  { label: 'Experiences', href: '/tinder' },
  { label: 'Pujo', href: '/pujo' },
  { label: 'Transport', href: '/transport' },
  { label: 'Contribute', href: '/contribute' },
]

function isCurrent(pathname: string, section: (typeof SECTIONS)[number]) {
  return [section.href, ...(section.also ?? [])].some((href) => pathname === href || pathname.startsWith(`${href}/`))
}

function Lockup() {
  return (
    <Link className="nn-brand" href="/home" aria-label="My Kolkata — home">
      <span className="nn-brand-box"><Sprig size={18} /></span>
      <span className="nn-brand-text">
        <span className="nn-brand-latin">MY KOLKATA</span>
        <span className="nn-brand-bn" lang="bn">আমার কলকাতা</span>
      </span>
    </Link>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const menuId = useId()
  const tabsRef = useRef<HTMLElement>(null)
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const searchRefs = useRef<(HTMLInputElement | null)[]>([])
  const [pill, setPill] = useState({ x: 0, w: 0, on: false })
  const [menuOpen, setMenuOpen] = useState(false)

  const current = SECTIONS.find((section) => isCurrent(pathname, section))
  /* Near You has its own search and reads its query once on arrival */
  const showSearch = !pathname.startsWith('/near-you')

  /* slide the pill under the current tab — re-measured on resize and once the
     webfonts land, since both change tab widths */
  useEffect(() => {
    const place = () => {
      const tab = current && tabRefs.current[current.href]
      if (!tab || !tabsRef.current) { setPill((v) => (v.on ? { ...v, on: false } : v)); return }
      setPill({ x: tab.offsetLeft, w: tab.offsetWidth, on: true })
    }
    place()
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [current])

  /* "/" focuses whichever search is on screen; Escape clears it and closes the drawer */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const input = searchRefs.current.find((el) => el && el.getClientRects().length > 0)
      const target = e.target as HTMLElement | null
      const typing = /^(input|textarea|select)$/i.test(target?.tagName ?? '') || target?.isContentEditable
      if (e.key === '/' && input && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); input.focus() }
      if (e.key === 'Escape') {
        setMenuOpen(false)
        if (input && document.activeElement === input) { input.value = ''; input.blur() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = event.currentTarget.elements.namedItem('q') as HTMLInputElement
    const query = input.value.trim()
    if (!query) return
    input.value = ''
    input.blur()
    setMenuOpen(false)
    router.push(`/near-you?${new URLSearchParams({ view: 'grid', q: query })}`)
  }

  const searchField = (index: number, island = false) => (
    <form role="search" onSubmit={search} className={`nn-search ${island ? 'nn-search--island' : ''}`}>
      <label className="sr-only" htmlFor={`${menuId}-q${index}`}>Search a para, a place, a street</label>
      <svg viewBox="0 0 24 24" className="nn-search-icon" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
      </svg>
      <input
        ref={(el) => { searchRefs.current[index] = el }}
        id={`${menuId}-q${index}`}
        name="q"
        type="search"
        placeholder="Search"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      {!island && <kbd className="nn-kbd" aria-hidden="true">/</kbd>}
    </form>
  )

  return (
    <div className="mk-notchbar">
      <div className="bezel" aria-hidden="true" />
      <div className={`nn-scrim ${menuOpen ? 'is-open' : ''}`} aria-hidden="true" onClick={() => setMenuOpen(false)} />

      {/* desktop — left: lockup */}
      <aside className="nn nn-logo" aria-label="Brand">
        <Lockup />
        <NotchWing side="right" />
        <NotchWing side="corner-left" />
      </aside>

      {/* desktop — centre: sections */}
      <header className="nn nn-menu">
        <NotchWing side="left" />
        <NotchWing side="right" />
        <nav className="nn-tabs" aria-label="Main" ref={tabsRef}>
          <span
            className={`nn-pill ${pill.on ? 'is-on' : ''}`}
            style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
            aria-hidden="true"
          />
          {SECTIONS.map((section) => {
            const active = current?.href === section.href
            return (
              <Link
                key={section.href}
                ref={(el) => { tabRefs.current[section.href] = el }}
                className={`nn-tab ${active ? 'is-active' : ''}`}
                href={section.href}
                aria-current={active ? 'page' : undefined}
              >{section.label}</Link>
            )
          })}
        </nav>
      </header>

      {/* desktop — right: search and the account */}
      <aside className="nn nn-right" aria-label="Search and account">
        <NotchWing side="left" />
        <NotchWing side="corner-right" />
        {showSearch && searchField(0)}
        <UserMenu />
      </aside>

      {/* below 1280px — one island */}
      <div className="nn nn-island">
        <NotchWing side="left" />
        <NotchWing side="right" />
        <div className="nn-island-row">
          <Lockup />
          <button
            type="button"
            className={`nn-trigger ${menuOpen ? 'is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label="Choose a section"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span>{current?.label ?? 'Menu'}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {showSearch && searchField(1, true)}
          <UserMenu />
        </div>
        <div className={`nn-drawer ${menuOpen ? 'is-open' : ''}`} id={menuId}>
          <div className="nn-drawer-clip">
            <nav className="nn-drawer-list" aria-label="Main">
              {SECTIONS.map((section) => {
                const active = current?.href === section.href
                return (
                  <Link
                    key={section.href}
                    className={`nn-option ${active ? 'is-active' : ''}`}
                    href={section.href}
                    aria-current={active ? 'page' : undefined}
                    tabIndex={menuOpen ? undefined : -1}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{section.label}</span>
                    {active && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
