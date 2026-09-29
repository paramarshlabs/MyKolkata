// The Instagram card's rules: never on arrival, at most twice, never after "Follow".
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAYS_BETWEEN, MAX_SHOWS, PAGES_BEFORE_PROMPT, eligible } from '../lib/instagramPrompt.ts'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse('2026-10-01T12:00:00+05:30')
const fresh = { followed: false, shows: 0, lastShownAt: null }
const browsed = { pages: PAGES_BEFORE_PROMPT, shown: false }

test('never on arrival: only after a few pages of this visit', () => {
  for (let pages = 0; pages < PAGES_BEFORE_PROMPT; pages++) assert.equal(eligible(fresh, { pages, shown: false }, NOW), false, `${pages} pages`)
  assert.equal(eligible(fresh, browsed, NOW), true)
})

test('once a visit', () => {
  assert.equal(eligible(fresh, { ...browsed, shown: true }, NOW), false)
})

test('twice ever, and the second time days after the first', () => {
  const once = { followed: false, shows: 1, lastShownAt: NOW - DAY }
  assert.equal(eligible(once, browsed, NOW), false, 'a day later is too soon')
  assert.equal(eligible({ ...once, lastShownAt: NOW - DAYS_BETWEEN * DAY - 1 }, browsed, NOW), true)
  assert.equal(eligible({ followed: false, shows: MAX_SHOWS, lastShownAt: NOW - 30 * DAY }, browsed, NOW), false, 'never a third time')
})

test('never again after Follow', () => {
  assert.equal(eligible({ ...fresh, followed: true }, browsed, NOW), false)
})

test('blocked storage means it never shows', () => {
  assert.equal(eligible(null, browsed, NOW), false)
  assert.equal(eligible(fresh, null, NOW), false)
})
