'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

function extractFlagExpression() {
  const start = src.indexOf('const nxPointerLockLegacyF9 = (function () {');
  const end = src.indexOf('\n  })();', start);
  assert.ok(start >= 0 && end > start, 'Pointer Lock flag initializer must exist');
  return src.slice(start, end + '\n  })();'.length);
}
function evaluateFlag(getItem) {
  const context = { localStorage: { getItem } };
  vm.runInNewContext(extractFlagExpression().replace(/^const /, 'var '), context, { timeout: 1000 });
  return context.nxPointerLockLegacyF9;
}
test('CORE-005: missing setting preserves legacy F9 behavior', () => {
  assert.equal(evaluateFlag(() => null), true);
});
test('CORE-005: value 0 disables legacy F9 interception', () => {
  assert.equal(evaluateFlag(key => key === 'nx.pointerLockLegacyF9' ? '0' : null), false);
});
test('CORE-005: unexpected values fail back to previous behavior', () => {
  assert.equal(evaluateFlag(() => 'invalid'), true);
});
test('CORE-005: blocked storage preserves previous behavior', () => {
  assert.equal(evaluateFlag(() => { throw new Error('SecurityError'); }), true);
});
test('CORE-005: flag guards override and F9 handler', () => {
  assert.match(src, /if \(nxPointerLockLegacyF9 && typeof originalRequestPointerLock === 'function'\)/);
  assert.match(src, /if \(!nxPointerLockLegacyF9\) return;/);
});
