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

const prisma = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'prisma', 'build', 'index.js')
const child = spawn(process.execPath, [prisma, ...process.argv.slice(2)], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 1))
