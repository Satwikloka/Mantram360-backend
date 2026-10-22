// cPanel Passenger entry point
// CPANEL_NODE_PATH env var overrides the wrong path cPanel sometimes injects
if (process.env.CPANEL_NODE_PATH) {
  process.env.NODE_PATH = process.env.CPANEL_NODE_PATH
  require('module').Module._initPaths()
}

// Suppress WebAssembly OOM on CloudLinux LVE (Node 18+ undici HTTP parser)
const _wi = WebAssembly.instantiate
WebAssembly.instantiate = async function (s, i) {
  try { return await _wi.call(this, s, i) }
  catch (e) {
    if (e instanceof RangeError && e.message.includes('Out of memory'))
      return { instance: { exports: new Proxy({}, { get: () => () => 0 }) }, module: s }
    throw e
  }
}

require('./dist/server')
