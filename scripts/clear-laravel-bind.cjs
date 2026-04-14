/** Removes stale bind file so wait-laravel does not trust a port from a previous run. */
const { clearBindPort } = require('./laravel-active-port.cjs')
clearBindPort()
