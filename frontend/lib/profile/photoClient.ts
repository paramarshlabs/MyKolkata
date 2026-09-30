import { PHOTO_LIMITS, PHOTO_ROUTE } from './photo'

/*
 * A new profile photo, redrawn on this phone before it goes anywhere: turned
 * the right way up, cut to a centred square, and saved as a fresh JPEG, which
 * drops EXIF, GPS and the rest. The server strips again anyway.
 */
async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') && file.type !== '') throw new Error('That isn’t a photo.')
  let source: ImageBitmap
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('That photo didn’t open here. Try a JPEG or a screenshot of it.')
  }
  const side = Math.min(source.width, source.height)
  if (side < PHOTO_LIMITS.minEdge) {
    source.close()
    throw new Error('That photo’s too small. Try a bigger one.')
  }
  const edge = Math.min(PHOTO_LIMITS.edge, side)
  const canvas = document.createElement('canvas')
  canvas.width = edge
  canvas.height = edge
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Your browser wouldn’t draw that photo.')
  ctx.drawImage(source, (source.width - side) / 2, (source.height - side) / 2, side, side, 0, 0, edge, edge)
  source.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', PHOTO_LIMITS.quality))
  if (!blob) throw new Error('Your browser wouldn’t save that photo.')
  if (blob.size > PHOTO_LIMITS.maxBytes) throw new Error('That photo’s too big. Try another.')
  return blob
}

async function failure(res: Response) {
  const body = await res.json().catch(() => null)
  return new Error(body?.error || 'That didn’t go through. Try again.')
}

export async function uploadPhoto(file: File): Promise<void> {
  const form = new FormData()
  form.append('photo', await preparePhoto(file), 'photo.jpg')
  const res = await fetch(PHOTO_ROUTE, { method: 'POST', body: form })
  if (!res.ok) throw await failure(res)
}

export async function resetPhoto(): Promise<void> {
  const res = await fetch(PHOTO_ROUTE, { method: 'DELETE' })
  if (!res.ok) throw await failure(res)
}

/* Your photo, ready to draw on a canvas; null if there isn't one or it won't load.
   Google's photo comes through our own route too: drawn straight from Google,
   it would taint the canvas and the card couldn't be saved. */
export async function loadPhotoBitmap(src: string): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(src.startsWith(PHOTO_ROUTE) ? src : PHOTO_ROUTE)
    if (!res.ok) return null
    return await createImageBitmap(await res.blob())
  } catch {
    return null
  }
}
