import { existsSync, readFileSync } from 'node:fs'

export function loadEnvFile(path) {
  const candidates = path ? [path] : ['.env.local', '.env']
  const resolved = candidates.find((candidate) => existsSync(candidate))
  if (!resolved) return
  for (const line of readFileSync(resolved, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const separator = trimmed.indexOf('=')
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}
