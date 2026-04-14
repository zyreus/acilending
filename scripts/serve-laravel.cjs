/**
 * Launches Laravel API with a cwd that does not depend on shell `cd` (Windows-safe).
 * API lives at: amalgated-lending/amalgated-lending-api (relative to this repo root).
 *
 * Skips ports where something else answers (GET /api/v1/health is not this app) and
 * binds the next free port in range so duplicate `php artisan serve` on 8000 does not block dev.
 */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const { getLaravelPort } = require('./laravel-dev-port.cjs')
const { checkAmalgatedHealth } = require('./laravel-health.cjs')
const { writeBindPort, clearBindPort } = require('./laravel-active-port.cjs')

const apiDir = path.resolve(__dirname, '..', 'amalgated-lending-api')
const artisan = path.join(apiDir, 'artisan')

if (!fs.existsSync(artisan)) {
  process.stderr.write(
    `Laravel not found. Expected artisan at:\n  ${artisan}\n`,
  )
  process.exit(1)
}

const RANGE = 40

async function main() {
  clearBindPort()
  const php = process.env.PHP_BINARY || 'php'
  const memoryLimit = process.env.LARAVEL_PHP_MEMORY_LIMIT || '256M'
  const preferred = Math.max(8000, parseInt(getLaravelPort(), 10) || 8000)
  const end = preferred + RANGE

  for (let p = preferred; p <= end; p++) {
    const st = await checkAmalgatedHealth(p)
    if (st === 'ok') {
      writeBindPort(p)
      process.stderr.write(
        `Laravel amalgated-lending-api already healthy on http://127.0.0.1:${p} — skipping duplicate php artisan serve.\n`,
      )
      process.exit(0)
    }
    if (st === 'bad') {
      process.stderr.write(
        `Port ${p} is in use by another app (health check failed); trying next port…\n`,
      )
      continue
    }
    writeBindPort(p)
    process.stderr.write(
      `Laravel dev server → http://127.0.0.1:${p} (set LARAVEL_PORT in .env to change the start of the scan)\n`,
    )
    const child = spawn(
      php,
      ['-d', `memory_limit=${memoryLimit}`, 'artisan', 'serve', '--host=127.0.0.1', `--port=${p}`],
      { cwd: apiDir, stdio: 'inherit', shell: false },
    )
    child.on('exit', (code) => process.exit(code ?? 1))
    return
  }

  process.stderr.write(
    `No free port found from ${preferred} to ${end} (all in use or wrong app). Stop other servers or set LARAVEL_PORT.\n`,
  )
  process.exit(1)
}

main().catch((err) => {
  process.stderr.write(String(err && err.stack ? err.stack : err) + '\n')
  process.exit(1)
})
