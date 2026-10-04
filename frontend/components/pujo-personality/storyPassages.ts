import type { ArchetypeId } from '@/lib/pujo-personality/types'
import photos from './storyPhotos.json'

export type StoryPhoto = {
  image: string
  alt: string
  caption: string
  position: string
  fit: string
  shape: string
  aspect: number
  compact: boolean
  wide?: boolean
  source: string
  title: string
  author: string
  license: string
  licenseUrl: string
  paragraphHash: string
  publicationPermissionRequired?: boolean
}

// Each record is curated against one specific lore paragraph, including its
// subject, crop and attribution. Do not fall back to the shared hero photo pool.
export const STORY_PASSAGES: Record<ArchetypeId, readonly StoryPhoto[]> = photos
