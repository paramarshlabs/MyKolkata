import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { PHOTOS, RECOMMENDATION_SCENES, SCENES, heroSceneFor, storyScenesFor } from '../components/pujo-personality/resultScenes.ts'

test('all nine personalities have five distinct, sourced visual beats', () => {
  assert.equal(Object.keys(SCENES).length, 9)
  assert.equal(Object.keys(RECOMMENDATION_SCENES).length, 9)
  for (const id of Object.keys(SCENES)) {
    const cover = heroSceneFor(id)
    const story = storyScenesFor(id)
    const recommendation = RECOMMENDATION_SCENES[id]
    assert.equal(story.length, 3, id)
    const recommendationPhoto = PHOTOS[recommendation.photo]
    assert.equal(new Set([cover.image, ...story.map((frame) => frame.image), recommendationPhoto.image]).size, 5, id)
    assert.ok(recommendation.caption && recommendation.pandalIntro && recommendation.plateIntro, `${id}: missing editorial copy`)
    for (const frame of [cover, ...story]) assert.ok(frame.caption, `${id}: missing scene caption`)
    for (const frame of [cover, ...story, recommendationPhoto]) {
      assert.ok(frame.alt, `${id}: missing alt text`)
      assert.ok(existsSync(join(process.cwd(), 'public', frame.image)), `${id}: ${frame.image} missing`)
    }
  }
})
