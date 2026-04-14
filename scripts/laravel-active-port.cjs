const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '.laravel-active-port')
const BIND_FILE = path.join(__dirname, '.laravel-bind-port')

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

module.exports = {
  FILE,
  BIND_FILE,
  writeBindPort,
  clearBindPort,
  readBindPort,
  writeActivePort,
  clearActivePort,
  readActivePort,
}
