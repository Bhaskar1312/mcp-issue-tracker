-// polyfill globalThis.crypto.hash when missing (Node 20.x variants may not expose crypto.hash yet)
const fs = require('fs');
const path = require('path');

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {};
}

try {
  const nodeCrypto = require('crypto');
  if (!globalThis.crypto.hash) {
    // Provide a minimal compatible async hash function that matches the WHATWG API
    // crypto.hash(algorithm, data?) -> returns a Hash object with update/digest or promise? Vite expects a function returning a Node crypto.Hash-like object when called with algorithm
    // Implement a simple wrapper that returns an object with update() and digest('hex')
    globalThis.crypto.hash = function (algorithm, data) {
      // Create a Node.js Hash instance
      const h = nodeCrypto.createHash(algorithm);
      if (data) h.update(data);
      // Return an object with update and digest methods
      return {
        update: (d) => { h.update(d); return this; },
        digest: (enc) => h.digest(enc),
      };
    };
  }
} catch (e) {
  // ignore
}

// exec the local vite binary using node
const spawn = require('child_process').spawn;
const viteBin = path.join(__dirname, '..', 'node_modules', '.bin', 'vite');
const cmd = process.platform === 'win32' ? viteBin + '.cmd' : viteBin;

const child = spawn(process.execPath, [cmd], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code));

