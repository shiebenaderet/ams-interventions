'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Runs a browser-style script (one that assigns to `window.X`) in an
// isolated context and returns that global. Lets node read the same
// files the browser loads, with no bundler and no dependencies.
function loadBrowserGlobal(relPath, globalName) {
  const abs = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(abs)) {
    throw new Error('Missing file: ' + relPath);
  }
  const src = fs.readFileSync(abs, 'utf8');
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.runInNewContext(src, sandbox);
  if (!(globalName in sandbox)) {
    throw new Error(relPath + ' did not define window.' + globalName);
  }
  return sandbox[globalName];
}

module.exports = { loadBrowserGlobal };
