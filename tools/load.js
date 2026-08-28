'use strict';
const fs = require('fs');
const path = require('path');

// Runs a browser-style script (one that assigns to `window.X`) in the host realm.
// Arrays, objects, and other values it creates compare correctly with assert.deepStrictEqual
// in tests — they share the host realm's prototypes. This is a dev-only loader for this repo's
// own files, not a security sandbox. Lets node read the same files the browser loads,
// with no bundler and no dependencies.
function loadBrowserGlobal(relPath, globalName) {
  const abs = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(abs)) {
    throw new Error('Missing file: ' + relPath);
  }
  const src = fs.readFileSync(abs, 'utf8');
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  new Function('window', 'self', src)(sandbox, sandbox);
  if (!(globalName in sandbox)) {
    throw new Error(relPath + ' did not define window.' + globalName);
  }
  return sandbox[globalName];
}

module.exports = { loadBrowserGlobal };
