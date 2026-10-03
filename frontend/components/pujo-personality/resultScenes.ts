import type { ArchetypeId } from '@/lib/pujo-personality/types'
import storyPhotos from './storyPhotos.json'

export const PHOTOS = {
  lane: { image: '/personality-story/night-lane.jpg', alt: 'A quiet Kolkata lane lit for Durga Puja after dark', position: 'center 42%' },
  pandal: { image: '/personality-story/pandal-hunter.avif', alt: 'An illuminated festival entrance on a city street' },
  tea: { image: '/personality-story/para-kid.avif', alt: 'Two hands holding clay cups of tea together' },
  river: { image: '/personality-story/hooghly-river.jpg', alt: 'People beside the Hooghly in the evening' },
  food: { image: '/personality-story/street-food.avif', alt: 'People ordering from a Kolkata street-food cart' },
  craft: { image: '/personality-story/art-kid.avif', alt: 'An artisan sculpting clay figures in a Kolkata workshop' },
  adda: { image: '/personality-story/addabaaz.avif', alt: 'Friends playing cards together on a Kolkata street', position: 'center 70%' },
  dance: { image: '/personality-story/dhunuchi.jpg', alt: 'Dancers lifting smoking dhunuchi during Durga Puja' },
  flowers: { image: '/personality-story/shiuli.avif', alt: 'White shiuli flowers with orange stems scattered across a table' },
  lights: { image: '/personality-story/pujo-lights.jpg', alt: 'Festival lights hanging above a Kolkata street at night' },
  morning: { image: '/personality-story/morning-lane.avif', alt: 'Sunlight falling into a quiet Kolkata lane in the morning' },
} satisfies Record<string, { image: string; alt: string; position?: string }>

type PhotoKey = keyof typeof PHOTOS
type Scene = { line: string; photos: readonly [PhotoKey, PhotoKey, PhotoKey, PhotoKey]; beats: readonly [string, string, string, string] }

/* A fifth frame is reserved for the recommendation chapter, never repeated from
   the cover or story deck on the same result. It suggests a mood, not a stop. */
export const RECOMMENDATION_SCENES: Record<ArchetypeId, { photo: PhotoKey; caption: string; pandalIntro: string; plateIntro: string }> = {
  night_owl: { photo: 'pandal', caption: 'The city is still lit when you arrive', pandalIntro: 'The lights worth staying awake for.', plateIntro: 'A bite, a cup, then breakfast as the city wakes.' },
  pandal_hunter: { photo: 'lights', caption: 'Every lit street suggests another turn', pandalIntro: 'Keep these three on your radar before the queues form.', plateIntro: 'Small stops that keep the next stop possible.' },
  para_kid: { photo: 'flowers', caption: 'A familiar Pujo morning begins close to home', pandalIntro: 'The home para comes first. These are the neighbours worth visiting.', plateIntro: 'The food tastes better when someone familiar serves it.' },
  pujo_romantic: { photo: 'pandal', caption: 'Take the longer, brighter way back', pandalIntro: 'Places to walk through together, without rushing.', plateIntro: 'A pause for two between the walks.' },
  pet_pujari: { photo: 'lane', caption: 'Follow the lights to the next food stop', pandalIntro: 'Good pandals, with room in the plan for a proper food stop.', plateIntro: 'Make the meal part of the route, not an afterthought.' },
  art_kid: { photo: 'lights', caption: 'Light is part of the artwork too', pandalIntro: 'Look past the crowd. These are made to be studied.', plateIntro: 'Something to eat between looking closer and looking again.' },
  addabaaz: { photo: 'pandal', caption: 'The walk between two long conversations', pandalIntro: 'Meet here, then let the conversation choose the next stop.', plateIntro: 'Order enough for the table. Nobody is leaving yet.' },
  dhunuchi: { photo: 'lane', caption: 'The street is still alive after the dance', pandalIntro: 'Follow the sound, then stay for the lights.', plateIntro: 'Eat when the beat finally lets you take a break.' },
  shiuli: { photo: 'morning', caption: 'Before the city finds its voice', pandalIntro: 'Quiet places to visit while the city is still waking.', plateIntro: 'Something warm after the first walk of the day.' },
}

/* The first frame is the result cover; the next three belong to the story deck. */
export const SCENES: Record<ArchetypeId, Scene> = {
  night_owl: { line: 'When the queues disappear, you arrive.', photos: ['lane', 'river', 'tea', 'food'], beats: ['The late lane', 'At the river', 'The first cha', 'One more stop'] },
  pandal_hunter: { line: 'One more lane. One more pandal.', photos: ['pandal', 'lane', 'craft', 'river'], beats: ['The entrance', 'The next lane', 'Where it began', 'The long way home'] },
  para_kid: { line: 'Every road home is part of Pujo.', photos: ['tea', 'adda', 'pandal', 'lane'], beats: ['Cha together', 'The familiar faces', 'The neighbourhood Pujo', 'The way back'] },
  pujo_romantic: { line: 'The city leaves room for two.', photos: ['river', 'tea', 'lane', 'flowers'], beats: ['By the river', 'One cup each', 'The long way back', 'A little before dawn'] },
  pet_pujari: { line: 'The next stop smells too good to skip.', photos: ['food', 'tea', 'adda', 'pandal'], beats: ['The first stop', 'Cha in between', 'Stay a little longer', 'One more lane'] },
  art_kid: { line: 'You stop where everyone else walks past.', photos: ['craft', 'pandal', 'lane', 'flowers'], beats: ['Hands at work', 'The finished light', 'Look closer', 'The quiet detail'] },
  addabaaz: { line: 'The plan was always to stay and talk.', photos: ['adda', 'tea', 'food', 'lane'], beats: ['The adda', 'Cha in hand', 'The next stop', 'The walk after'] },
  dhunuchi: { line: 'The beat finds you before the crowd does.', photos: ['dance', 'pandal', 'adda', 'food'], beats: ['The circle', 'The lights', 'Your people', 'After the dance'] },
  shiuli: { line: 'You see the city before it wakes.', photos: ['flowers', 'river', 'craft', 'tea'], beats: ['Before dawn', 'At the river', 'Made by hand', 'The first cha'] },
}

export function heroSceneFor(id: ArchetypeId) {
  if (id === 'pujo_romantic') {
    const couple = storyPhotos.pujo_romantic[2]
    return { image: couple.image, alt: couple.alt, position: 'center 60%', caption: 'A moment for two' }
  }
  const scene = SCENES[id]
  return { ...PHOTOS[scene.photos[0]], caption: scene.beats[0] }
}

export function storyScenesFor(id: ArchetypeId) {
  const scene = SCENES[id]
  return scene.photos.slice(1).map((photo, index) => ({ ...PHOTOS[photo], caption: scene.beats[index + 1] }))
}
