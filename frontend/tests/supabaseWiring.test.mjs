import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('prisma still splits pooled runtime URL from migrate URL', async () => {
  const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
  assert.match(schema, /url\s+=\s+env\("DATABASE_URL"\)/)
  assert.match(schema, /directUrl\s+=\s+env\("DIRECT_URL"\)/)
  assert.match(schema, /provider\s+=\s+"postgresql"/)
  assert.doesNotMatch(schema, /neon/i)
})

test('supabase browser client uses the publishable key, not a secret key', async () => {
  const source = await readFile(new URL('../lib/db/supabase.ts', import.meta.url), 'utf8')
  assert.match(source, /@supabase\/supabase-js/)
  assert.match(source, /NEXT_PUBLIC_SUPABASE_URL/)
  assert.match(source, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/)
  assert.doesNotMatch(source, /SERVICE_ROLE|service_role|SUPABASE_SECRET_KEY/)
})

test('root db folder holds the supabase schema SQL', async () => {
  const sql = await readFile(new URL('../../db/schema.sql', import.meta.url), 'utf8')
  assert.match(sql, /CREATE EXTENSION IF NOT EXISTS postgis/)
  assert.match(sql, /USING GIST \("geo"\)/)
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/)
  assert.match(sql, /CREATE TABLE "places"/)
})

test('seed no longer mentions Neon', async () => {
  const seed = await readFile(new URL('../prisma/seed.js', import.meta.url), 'utf8')
  assert.match(seed, /Supabase seed complete/)
  assert.doesNotMatch(seed, /Neon/)
})

test('db:push loads .env.local instead of relying on Prisma finding .env', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const script = await readFile(new URL('../scripts/prisma.mjs', import.meta.url), 'utf8')
  assert.equal(pkg.scripts['db:push'], 'node scripts/prisma.mjs db push')
  assert.match(script, /loadEnvFile/)
  assert.match(script, /DIRECT_URL/)
})

test('prisma seed lives in prisma.config.ts, not package.json', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const config = await readFile(new URL('../prisma.config.ts', import.meta.url), 'utf8')
  assert.equal(pkg.prisma, undefined)
  assert.match(config, /seed:\s*'node prisma\/seed\.js'/)
})
