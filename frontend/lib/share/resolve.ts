/* ==========================================================================
   A shared Instagram post → the place in the app it's about: a pandal on
   /pujo, or a place on the Explore map. Strict on purpose: a wrong place is
   worse than "we couldn't place this", which still offers the search with
   the names filled in. The fetching and the data come in from outside
   (lib/share/server.ts), so the tests run this on fixtures.
   ========================================================================== */

import { FILLER, fold } from '@/lib/pujo/normalise'
import { pujoPath } from '@/lib/pujo/links'
import { aboutPujo, captionFrom, metaContent, placeCandidates, type InstagramPost } from './instagram'

export type SharedPujo = { slug: string; name: string; fullName: string; famous: boolean; aliases?: string[] }
export type SharedPlace = { id: string; name: string }

export type Resolution =
  | { kind: 'pujo'; href: string; name: string; from: string }
  | { kind: 'place'; href: string; name: string; from: string }
  | { kind: 'none'; guesses: string[] }

export type ShareResolverDeps = {
  /* the post page's HTML as a link preview sees it, or null when Instagram won't say */
  fetchPostHtml: (post: InstagramPost) => Promise<string | null>
  pujos: () => Promise<readonly SharedPujo[]>
  searchPlaces: (query: string) => Promise<readonly SharedPlace[]>
  /* where a place opens: the live map, searched and with it selected */
  placeHref: (query: string, place: SharedPlace) => string
}

const compact = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '')
const meaningful = (text: string) => fold(text).filter((word) => !FILLER.has(word))

/* every word of the name it was called by, whole, in the pujo's name; or the
   tag run together ("#bagbazarsarbojanin") is the start of the name */
export function matchPujo(candidate: string, pujos: readonly SharedPujo[]): SharedPujo | null {
  const typed = meaningful(candidate)
  const key = compact(candidate)
  const hits = pujos.filter((pujo) => {
    const names = [pujo.name, pujo.fullName]
    if (typed.length && names.some((name) => {
      const words = new Set(fold(name))
      return typed.every((word) => words.has(word))
    })) return true
    return key.length >= 6 && [...names, ...(pujo.aliases ?? [])].some((name) => compact(name).startsWith(key))
  })
  /* "Bagbazar" names one pujo first: the famous one, then the shortest name */
  hits.sort((a, b) => Number(b.famous) - Number(a.famous) || a.name.length - b.name.length)
  return hits[0] ?? null
}

/* the name, not just the address, says what was written: "Peter Cat" for
   "Peter Cat" or "Peter Cat, Park Street", never a café on Peter Cat Lane */
export function matchPlace(candidate: string, places: readonly SharedPlace[]): SharedPlace | null {
  const typed = compact(candidate)
  return places.find((place) => {
    const name = compact(place.name)
    if (name.length < 3) return false
    return name === typed || (typed.length >= 5 && name.startsWith(typed)) || (name.length >= 5 && typed.startsWith(name))
  }) ?? null
}

export function createShareResolver(deps: ShareResolverDeps) {
  async function tryPujos(candidates: string[]): Promise<Resolution | null> {
    const pujos = await deps.pujos().catch(() => [] as SharedPujo[])
    for (const candidate of candidates) {
      const pujo = matchPujo(candidate, pujos)
      if (pujo) return { kind: 'pujo', href: pujoPath(pujo.slug), name: pujo.name, from: candidate }
    }
    return null
  }

  async function tryPlaces(candidates: string[]): Promise<Resolution | null> {
    for (const candidate of candidates) {
      const places = await deps.searchPlaces(candidate).catch(() => [] as SharedPlace[])
      const place = matchPlace(candidate, places)
      if (place) return { kind: 'place', href: deps.placeHref(candidate, place), name: place.name, from: candidate }
    }
    return null
  }

  return async function resolve(post: InstagramPost, shared: { text?: string | null; title?: string | null } = {}): Promise<Resolution> {
    const html = await deps.fetchPostHtml(post).catch(() => null)
    const { author, caption } = captionFrom(html ? metaContent(html, 'og:description') : null)
    /* without the caption, whatever the share sheet sent along is all there is */
    const text = caption || [shared.text, shared.title].filter(Boolean).join('\n')
    const candidates = placeCandidates({ caption: text, author, title: shared.title })
    if (!candidates.length) return { kind: 'none', guesses: [] }

    const order = aboutPujo(text) ? [tryPujos, tryPlaces] : [tryPlaces, tryPujos]
    for (const attempt of order) {
      const found = await attempt(candidates)
      if (found) return found
    }
    return { kind: 'none', guesses: candidates.slice(0, 3) }
  }
}
