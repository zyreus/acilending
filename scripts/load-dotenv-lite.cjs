const fs = require('fs')
const path = require('path')
 
function stripQuotes(v) {
  const s = String(v ?? '').trim()
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1)
  }
  return s
}
 
/**
 * Minimal .env loader (no dependency).
 * - Supports KEY=VALUE lines and ignores blank lines / # comments.
 * - Does not expand variables; intentionally simple.
 * - Does not overwrite existing process.env keys.
 */
function loadDotenvLite(envPath) {
  const resolved = envPath ? path.resolve(envPath) : null
  if (!resolved) return { loaded: false, path: null }
  if (!fs.existsSync(resolved)) return { loaded: false, path: resolved }
 
  const raw = fs.readFileSync(resolved, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = stripQuotes(trimmed.slice(eq + 1))
    if (!key) continue
    if (process.env[key] == null) process.env[key] = val
  }
  return { loaded: true, path: resolved }
}
 
module.exports = { loadDotenvLite }
