'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
test('JavaScript syntax', () => assert.doesNotThrow(() => new vm.Script(src)));
test('userscript target', () => assert.match(src, /\/\/ @match\s+https:\/\/play\.xbox\.com\/\*/));
test('early initialization', () => assert.match(src, /\/\/ @run-at\s+document-start/));
test('metadata and runtime versions agree', () => {
  const a = src.match(/^\/\/ @version\s+(\S+)/m);
  const b = src.match(/\bconst VER = ['"]([^'"]+)['"]/);
  assert.ok(a && b);
  assert.equal(a[1], b[1]);
});
test('known Pointer Lock interception tracked CORE-001.F01', () => {
  assert.match(src, /Element\.prototype\.requestPointerLock\s*=\s*function/);
});
