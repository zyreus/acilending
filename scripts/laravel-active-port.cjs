const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '.laravel-active-port')
const BIND_FILE = path.join(__dirname, '.laravel-bind-port')
const STATUS_FILE = path.join(__dirname, '.laravel-start-status.json')

function writeBindPort(port) {
  fs.writeFileSync(BIND_FILE, String(port), 'utf8')
}

function clearBindPort() {
  try {
    fs.unlinkSync(BIND_FILE)
  } catch {
    /* ignore */
  }
}

function readBindPort() {
  try {
    const v = fs.readFileSync(BIND_FILE, 'utf8').trim()
    if (/^\d+$/.test(v)) return v
  } catch {
    /* ignore */
  }
  return null
}

function writeActivePort(port) {
  fs.writeFileSync(FILE, String(port), 'utf8')
}

function clearActivePort() {
  try {
    fs.unlinkSync(FILE)
  } catch {
    /* ignore */
  }
}

function readActivePort() {
  try {
    const v = fs.readFileSync(FILE, 'utf8').trim()
    if (/^\d+$/.test(v)) return v
  } catch {
    /* ignore */
  }
  return null
}

function clearStartStatus() {
  try {
    fs.unlinkSync(STATUS_FILE)
  } catch {
    /* ignore */
  }
}

function writeStartStatus(status) {
  const payload = {
    state: 'starting',
    at: new Date().toISOString(),
    ...(status || {}),
  }
  fs.writeFileSync(STATUS_FILE, JSON.stringify(payload, null, 2), 'utf8')
}

function readStartStatus() {
  try {
    const raw = fs.readFileSync(STATUS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

module.exports = {
  FILE,
  BIND_FILE,
  STATUS_FILE,
  writeBindPort,
  clearBindPort,
  readBindPort,
  writeActivePort,
  clearActivePort,
  readActivePort,
  clearStartStatus,
  writeStartStatus,
  readStartStatus,
}
