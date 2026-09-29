/*
 * Photos arrive as JPEGs the phone has already redrawn on a canvas, which
 * drops EXIF on its own. The server does not take that on trust: it reads the
 * file's own bytes (never the declared type), keeps only what is needed to
 * decode the picture, and drops every metadata segment: EXIF and GPS (APP1),
 * XMP, ICC and maker notes (APP2–APP13, APP15), thumbnails, and comments.
 * APP14 (Adobe) stays: it says how to decode the colour, and carries nothing
 * about the person.
 */

export type StrippedJpeg = { bytes: Uint8Array; width: number; height: number }

const SOI = 0xd8
const EOI = 0xd9
const SOS = 0xda
const COM = 0xfe
const APP14 = 0xee

/* start-of-frame markers carry the picture's size (not DHT, JPG or DAC) */
const isFrame = (marker: number) => marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
const isMetadata = (marker: number) => (marker >= 0xe0 && marker <= 0xef && marker !== APP14) || marker === COM
/* markers with no length field */
const standalone = (marker: number) => (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01

export const looksLikeJpeg = (bytes: Uint8Array) => bytes.length > 4 && bytes[0] === 0xff && bytes[1] === SOI && bytes[2] === 0xff

export function stripJpegMetadata(input: Uint8Array): StrippedJpeg | null {
  if (!looksLikeJpeg(input)) return null
  const out: Uint8Array[] = [input.subarray(0, 2)]
  let width = 0
  let height = 0
  let ended = false
  let i = 2

  while (i < input.length) {
    /* a marker is 0xFF, any fill bytes of 0xFF, then the code */
    if (input[i] !== 0xff) return null
    while (i < input.length && input[i] === 0xff) i++
    if (i >= input.length) return null
    const marker = input[i]
    const start = i - 1
    i++

    if (marker === EOI) {
      out.push(Uint8Array.of(0xff, EOI))
      ended = true
      break
    }
    if (standalone(marker)) {
      out.push(Uint8Array.of(0xff, marker))
      continue
    }
    if (i + 2 > input.length) return null
    const length = (input[i] << 8) | input[i + 1]
    if (length < 2 || i + length > input.length) return null
    const end = i + length

    if (isFrame(marker)) {
      if (length < 7) return null
      height = (input[i + 3] << 8) | input[i + 4]
      width = (input[i + 5] << 8) | input[i + 6]
    }
    if (marker === SOS) {
      if (!width || !height) return null
      /* The scan's data runs to the next real marker. Inside it, FF 00 is an
         escaped byte and FF D0–D7 a restart marker; both belong to the data.
         A progressive file has several scans, with tables (and, in a crafted
         file, metadata) between them, so the walk carries on after each. */
      let j = end
      while (j + 1 < input.length) {
        if (input[j] === 0xff) {
          const next = input[j + 1]
          if (next !== 0x00 && next !== 0xff && !(next >= 0xd0 && next <= 0xd7)) break
        }
        j++
      }
      /* no marker after the data: the file was cut short */
      if (j + 1 >= input.length) return null
      out.push(input.subarray(start, j))
      i = j
      continue
    }
    if (!isMetadata(marker)) out.push(input.subarray(start, end))
    i = end
  }

  if (!ended || !width || !height) return null
  const size = out.reduce((n, part) => n + part.length, 0)
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const part of out) {
    bytes.set(part, offset)
    offset += part.length
  }
  return { bytes, width, height }
}
