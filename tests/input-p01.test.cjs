'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('INPUT-001 passive diagnostics have an idempotent initialization guard', () => {
  assert.match(src, /let nxInputDiagnosticsStarted = false;/);
  assert.match(src, /function startInputDiagnostics\(\) \{\s*\/\/[^\n]*\n\s*if \(nxInputDiagnosticsStarted\) return;\s*nxInputDiagnosticsStarted = true;/);
});
test('INPUT-003 relative mouse sampling ignores synthetic and non-mouse events', () => {
  const start = src.indexOf('  const nxRelativeMouse = ');
  const end = src.indexOf('  function nxRecordInputSource(name)', start);
  assert.ok(start > 0 && end > start);
  const context = { Date, Number, Math };
  vm.runInNewContext(src.slice(start, end) + '\n globalThis.sample = nxObserveRelativeMouse; globalThis.state = nxRelativeMouse;', context);
  const sample = context.sample, state = context.state;
  sample({ isTrusted: false, pointerType: 'mouse', movementX: 10, movementY: 0 });
  sample({ isTrusted: true, pointerType: 'touch', movementX: 10, movementY: 0 });
  assert.equal(state.samples, 0);
  sample({ isTrusted: true, pointerType: 'mouse', movementX: 3, movementY: 4 });
  assert.equal(state.samples, 1);
  assert.equal(state.distance, 5);
  sample({ isTrusted: true, pointerType: 'mouse', movementX: NaN, movementY: 1 });
  assert.equal(state.invalid, 1);
  sample({ isTrusted: true, pointerType: 'mouse' });
  assert.equal(state.invalid, 2);
});
test('INPUT-004 physical gamepad wrapper remains explicitly opt-in', () => {
  assert.match(src, /function nxGameBridgeRequested\(\) \{ return nxInputEnabled\(\) \|\| nxGyroGameEnabled\(\); \}/);
  assert.match(src, /if \(!nxInputBridge.enabled \|\| !nxNativeGetGamepads\) return;/);
});
test('INPUT-005 diagnostics do not record keyboard text or codes', () => {
  assert.match(src, /diagLog\('keydown', \{ trusted: e\.isTrusted, repeat: e\.repeat \}\)/);
});

test('INPUT-004 keyboard activity is not classified as touch/mouse overlap', () => {
  const start = src.indexOf('  const nxInputSources = ');
  const end = src.indexOf('  const NX_INPUT_COORD_KEY = ', start);
  assert.ok(start > 0 && end > start);
  let now = 10000;
  const events = [];
  class Clock extends Date { static now() { return now; } }
  const ctx = { Date: Clock, Number, Math, Object, nxInputEvent: (...args) => events.push(args) };
  vm.runInNewContext(src.slice(start, end) + '\n globalThis.record = nxRecordInputSource; globalThis.sources = nxInputSources;', ctx);
  ctx.record('keyboard');
  assert.equal(ctx.sources.simultaneous, 0);
  now += 120;
  ctx.record('touch');
  assert.equal(ctx.sources.simultaneous, 0);
  now += 120;
  ctx.record('mouse');
  assert.equal(ctx.sources.simultaneous, 1);
});

test('INPUT-006 polling errors clear stale gamepad snapshots before retry', () => {
  const start = src.indexOf('  function nxSampleGamepads() {');
  const end = src.indexOf('  let nxInputDiagnosticsStarted = ', start);
  assert.ok(start > 0 && end > start);
  const code = src.slice(start, end);
  assert.match(code, /catch \(err\) \{\s*nxGamepadMonitor\.errors\+\+;\s*nxGamepadMonitor\.connected = 0;/);
  assert.match(code, /nxGamepadMonitor\.snapshots = \[\];\s*nxGamepadMonitor\.lastSignature = undefined;/);
});
