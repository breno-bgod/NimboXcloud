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
test('Pointer Lock policy is native and does not claim browser validation', () => {
  assert.match(src, /touchFullscreenPolicy\.mode='native-unmodified'/);
  assert.match(src, /requestsBlockedByNimbo:\s*false/);
  assert.doesNotMatch(src, /Element\.prototype\.requestPointerLock\s*=/);
});
test.todo('CORE-001.F01: native pointer relock after ESC/focus loss (real browser)');
test.todo('INPUT-004: touch and physical controller coexistence (real browser)');
test.todo('HUD-007: native HUD interaction and multitouch (real xCloud session)');
test('CORE-005: Pointer Lock and F9 remain browser-native', () => {
  assert.doesNotMatch(src, /\bnxPointerLockLegacyF9\b|nx\.pointerLockLegacyF9/);
  assert.doesNotMatch(src, /e\.code\s*===\s*['"]F9['"]|e\.key\s*===\s*['"]F9['"]/);
  assert.match(src, /document\.addEventListener\('pointerlockchange'/);
  assert.match(src, /document\.exitPointerLock\(\)/);
});
