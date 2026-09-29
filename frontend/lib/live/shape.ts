/* ==========================================================================
   Reading what a Wire action returns. Each action wraps a different site, and
   the wrappers are free to nest the site's own JSON under data/result/items
   or hand it back as a string. These helpers find the part a feed needs
   without assuming one exact shape, so a feed survives a harmless change in
   nesting and fails closed (null, empty) on anything it can't read.
   ========================================================================== */

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Obj = Record<string, unknown>

export const isObj = (value: unknown): value is Obj => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/* JSON handed back as a string is parsed; anything else passes through */
export function parseMaybe(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text.startsWith('{') && !text.startsWith('[')) return value
  try {
    return JSON.parse(text)
  } catch {
    return value
  }
}

/* Depth-first, the first value (object or array) that `test` accepts. */
export function findDeep(root: unknown, test: (value: unknown) => boolean, maxDepth = 7): unknown {
  const seen = new Set<unknown>()
  const walk = (value: unknown, depth: number): unknown => {
    value = parseMaybe(value)
    if (!value || typeof value !== 'object' || seen.has(value) || depth > maxDepth) return undefined
    seen.add(value)
    if (test(value)) return value
    const children = Array.isArray(value) ? value : Object.values(value)
    for (const child of children) {
      const found = walk(child, depth + 1)
      if (found !== undefined) return found
    }
    return undefined
  }
  return walk(root, 0)
}

/* The first array of objects in which most items have `test` true. */
export function findList(root: unknown, test: (item: Obj) => boolean, minItems = 1): Obj[] {
  const found = findDeep(root, (value) => {
    if (!Array.isArray(value) || value.length < minItems) return false
    const objects = value.filter(isObj)
    return objects.length >= minItems && objects.filter(test).length >= Math.ceil(objects.length * 0.6)
  })
  return Array.isArray(found) ? found.filter(isObj) : []
}

/* The first non-empty string among `keys`, looking one level into nested objects too. */
export function str(item: unknown, ...keys: string[]): string | null {
  if (!isObj(item)) return null
  for (const key of keys) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.replace(/\s+/g, ' ').trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  for (const key of keys) {
    const value = item[key]
    if (isObj(value)) {
      const nested = str(value, 'text', 'name', 'title', 'url', 'value', 'simpleText')
      if (nested) return nested
    }
  }
  return null
}

export function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s]/g, '').match(/^-?\d+(\.\d+)?/)
    return cleaned ? Number(cleaned[0]) : null
  }
  if (Array.isArray(value) && value.length === 1) return num(value[0])
  return null
}

export function httpsUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString().replace(/^http:/, 'https:') : null
  } catch {
    return null
  }
}

export const clip = (text: string | null, max: number) =>
  !text ? null : text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
