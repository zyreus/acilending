/**
 * GET /api/v1/health must return JSON { ok: true } for amalgated-lending-api.
 */
const http = require('http')

/** @param {string|number} port @param {string} [host] @returns {Promise<'ok'|'bad'|'down'>} */
function checkAmalgatedHealth(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.get(
      `http://${host}:${port}/api/v1/health`,
      { timeout: 2500 },
      (res) => {
        let body = ''
        res.on('data', (c) => {
          body += c
        })
        res.on('end', () => {
          if (res.statusCode !== 200) return resolve('bad')
          try {
            resolve(JSON.parse(body).ok === true ? 'ok' : 'bad')
          } catch {
            resolve('bad')
          }
        })
      },
    )
    req.on('error', () => resolve('down'))
    req.on('timeout', () => {
      req.destroy()
      resolve('down')
    })
  })
}

module.exports = { checkAmalgatedHealth }
