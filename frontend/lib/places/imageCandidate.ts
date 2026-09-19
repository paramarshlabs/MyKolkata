// @ts-nocheck
const REUSABLE_LICENSE = /\b(cc0|public domain|cc by(?:-sa)?(?:\s|$)|creative commons attribution)\b/i

export function isReusableLicense(value) {
  return REUSABLE_LICENSE.test(String(value || ''))
}

export function imageCandidateFromWikimedia(result) {
  if (!result?.image || !result?.imageSourceUrl) return null
  const confidence = Math.max(0, Math.min(1, Number(result.imageMatchConfidence) || 0))
  return {
    url: result.image,
    sourceUrl: result.imageSourceUrl,
    provider: result.imageProvider || 'wikimedia-commons',
    attribution: result.imageAttribution || 'Wikimedia Commons contributor',
    license: result.imageLicense || null,
    confidence,
    verification: confidence >= 0.75 && isReusableLicense(result.imageLicense) ? 'VERIFIED' : 'CANDIDATE',
    kind: 'PHOTO',
  }
}
