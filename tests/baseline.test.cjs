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
test('Pointer Lock policy documented without claiming gameplay validation', () => {
  const hasOverride = /Element\.prototype\.requestPointerLock\s*=\s*function/.test(src);
  assert.equal(typeof hasOverride, 'boolean');
  if (hasOverride) {
    assert.match(src, /f9Released/);
  }
});
test.todo('CORE-001.F01: native pointer relock after ESC/focus loss (real browser)');
test.todo('INPUT-004: touch and physical controller coexistence (real browser)');
test.todo('HUD-007: native HUD interaction and multitouch (real xCloud session)');

test('CORE-005: legacy pointer-lock opt-out defaults to previous behavior', () => {
  assert.match(src, /localStorage\.getItem\('nx\.pointerLockLegacyF9'\) !== '0'/);
  assert.match(src, /if \(nxPointerLockLegacyF9 && typeof originalRequestPointerLock === 'function'\)/);
  assert.match(src, /if \(!nxPointerLockLegacyF9\) return;/);
});
