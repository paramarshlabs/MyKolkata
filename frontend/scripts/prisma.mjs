import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './lib/load-env.mjs'

loadEnvFile()

for (const name of ['DATABASE_URL', 'DIRECT_URL']) {
  if (!process.env[name]) {
    console.error(
      `${name} is missing. Paste it into .env.local from Supabase Dashboard → Connect.`,
    )
    process.exit(1)
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const prisma = join(root, 'node_modules', 'prisma', 'build', 'index.js')

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [prisma, ...args], { stdio: 'inherit' })
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

const args = process.argv.slice(2)
let code = await run(args)

/* db push can't express Row Level Security, so every push is followed by the
   lock-down that keeps private tables out of reach of Supabase's Data API. */
if (code === 0 && args[0] === 'db' && args[1] === 'push') {
  console.log('Locking down private tables (prisma/rls-lockdown.sql)…')
  code = await run(['db', 'execute', '--url', process.env.DIRECT_URL, '--file', join(root, 'prisma', 'rls-lockdown.sql')])
}

process.exit(code)
