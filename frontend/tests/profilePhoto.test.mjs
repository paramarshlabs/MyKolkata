import assert from 'node:assert/strict'
import test from 'node:test'
import { firstName, googlePhotoAt, isPhotoKey, photoSrc } from '../lib/profile/photo.ts'

test('Google photos are asked for at card size, and only from Google', () => {
  assert.equal(googlePhotoAt('https://lh3.googleusercontent.com/a/ACg8abc=s96-c'), 'https://lh3.googleusercontent.com/a/ACg8abc=s512-c')
  assert.equal(googlePhotoAt('https://lh3.googleusercontent.com/a/ACg8abc'), 'https://lh3.googleusercontent.com/a/ACg8abc=s512-c')
  assert.equal(googlePhotoAt('https://evil.example.com/a.jpg'), null)
  assert.equal(googlePhotoAt('https://googleusercontent.com.evil.com/a'), null)
  assert.equal(googlePhotoAt('http://lh3.googleusercontent.com/a/x'), null)
  assert.equal(googlePhotoAt(undefined), null)
})

test('a photo of your own takes the place of Google’s', () => {
  const key = '0f8fad5b-d9cb-469f-a165-70867728950e.jpg'
  assert.ok(isPhotoKey(key))
  assert.ok(!isPhotoKey('../other-user.jpg'))
  assert.equal(photoSrc(key, 'https://lh3.googleusercontent.com/a/x'), '/api/profile/photo?v=0f8fad5b-d9cb-469f-a165-70867728950e')
  assert.equal(photoSrc(null, 'https://lh3.googleusercontent.com/a/x'), 'https://lh3.googleusercontent.com/a/x')
  assert.equal(photoSrc(null, null), null)
})

test('the card starts with the first word of the account name', () => {
  assert.equal(firstName('Rajarshi Datta'), 'Rajarshi')
  assert.equal(firstName('  Mou  '), 'Mou')
  assert.equal(firstName(null), '')
})
