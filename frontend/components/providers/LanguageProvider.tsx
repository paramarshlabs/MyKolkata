'use client'

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { BN } from '@/lib/i18n/bn'

/*  Bengali as a switch, not a rewrite. The components keep rendering English;
    when the switch is on, this swaps the words in the DOM as they appear and
    swaps them back when it goes off. Text it has no Bengali for stays English.
    Anything inside [data-no-bn] is left alone.                               */

export type Lang = 'en' | 'bn'

const STORAGE_KEY = 'mk.lang'
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'])

const norm = (s: string) => s.replace(/\s+/g, ' ').replace(/[‘’]/g, "'").trim()
const EXACT = new Map<string, string>()
const LOWER = new Map<string, string>()
for (const [en, bn] of Object.entries(BN)) {
  EXACT.set(norm(en), bn)
  if (!LOWER.has(norm(en).toLowerCase())) LOWER.set(norm(en).toLowerCase(), bn)
}

function lookup(value: string): string | null {
  const key = norm(value)
  if (!key || !/[a-z]/i.test(key)) return null
  const bn = EXACT.get(key) ?? LOWER.get(key.toLowerCase())
  if (!bn) return null
  const [, lead, , trail] = value.match(/^(\s*)([\s\S]*?)(\s*)$/)!
  return lead + bn + trail
}

/* what each node said before we touched it, and what we wrote over it */
const texts = new WeakMap<Text, { en: string; bn: string }>()
const attrs = new WeakMap<Element, Map<string, { en: string; bn: string }>>()

function skipped(el: Element | null) {
  return !el || SKIP.has(el.tagName) || !!el.closest('[data-no-bn]') || (el as HTMLElement).isContentEditable
}

function translateText(node: Text) {
  const current = node.nodeValue ?? ''
  const seen = texts.get(node)
  if (seen && current === seen.bn) return
  if (skipped(node.parentElement)) return
  const bn = lookup(current)
  if (bn == null) { texts.delete(node); return }
  texts.set(node, { en: current, bn })
  node.nodeValue = bn
  node.parentElement?.setAttribute('data-bn', '')
}

function translateAttr(el: Element, name: string) {
  const current = el.getAttribute(name)
  if (current == null) return
  const map = attrs.get(el) ?? new Map<string, { en: string; bn: string }>()
  const seen = map.get(name)
  if (seen && current === seen.bn) return
  if (skipped(el)) return
  const bn = lookup(current)
  if (bn == null) { map.delete(name); return }
  map.set(name, { en: current, bn })
  attrs.set(el, map)
  el.setAttribute(name, bn)
}

function translateTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { translateText(root as Text); return }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => n.nodeType === Node.ELEMENT_NODE && skipped(n as Element)
      ? NodeFilter.FILTER_REJECT
      : NodeFilter.FILTER_ACCEPT,
  })
  if (root.nodeType === Node.ELEMENT_NODE && !skipped(root as Element)) {
    for (const name of ATTRS) translateAttr(root as Element, name)
  }
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text)
    else for (const name of ATTRS) translateAttr(n as Element, name)
  }
}

function restoreTree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) {
      const seen = texts.get(n as Text)
      if (seen && n.nodeValue === seen.bn) n.nodeValue = seen.en
      texts.delete(n as Text)
    } else {
      const el = n as Element
      el.removeAttribute('data-bn')
      const map = attrs.get(el)
      if (!map) continue
      for (const [name, seen] of map) if (el.getAttribute(name) === seen.bn) el.setAttribute(name, seen.en)
      attrs.delete(el)
    }
  }
}

/* tab widths change with the words; the notch bar re-measures its pill on resize */
const remeasure = () => requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))

/* the choice lives in localStorage; the server (and hydration) always sees English */
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
const readLang = (): Lang => { try { return localStorage.getItem(STORAGE_KEY) === 'bn' ? 'bn' : 'en' } catch { return 'en' } }
const serverLang = (): Lang => 'en'
function toggle() {
  try { localStorage.setItem(STORAGE_KEY, readLang() === 'bn' ? 'en' : 'bn') } catch {}
  listeners.forEach((fn) => fn())
}

const LanguageContext = createContext<{ lang: Lang; toggle: () => void }>({ lang: 'en', toggle })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, serverLang)

  useEffect(() => {
    const html = document.documentElement
    if (lang !== 'bn') return
    html.setAttribute('data-lang', 'bn')
    html.lang = 'bn'
    translateTree(document.body)
    remeasure()

    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'characterData') translateText(r.target as Text)
        else if (r.type === 'attributes' && r.attributeName) translateAttr(r.target as Element, r.attributeName)
        else r.addedNodes.forEach(translateTree)
      }
    })
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: [...ATTRS],
    })

    return () => {
      observer.disconnect()
      restoreTree(document.body)
      html.removeAttribute('data-lang')
      html.lang = 'en'
      remeasure()
    }
  }, [lang])

  return <LanguageContext.Provider value={{ lang, toggle }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => useContext(LanguageContext)
