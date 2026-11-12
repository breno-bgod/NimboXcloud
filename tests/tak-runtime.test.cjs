// tests/tak-runtime.test.cjs — run: node --test tests/*.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
const start = source.indexOf('  function nxTouchAdaptationHookSnapshot(');
const end = source.indexOf('  function nxConsoleLabCapabilities()', start);
assert.ok(start >= 0 && end > start, 'read-only TAK probe found');
const context = vm.createContext({});
vm.runInContext(source.slice(start, end) + '\nthis.snapshot = nxTouchAdaptationHookSnapshot;', context);
const snapshot = context.snapshot;

test('TAK probe reports a missing hook without claiming the page runtime lacks it', () => {
  const result = snapshot({});
  assert.equal(result.state, 'not-visible-in-userscript-context');
  assert.equal(result.callable, false);
  assert.equal(result.invoked, false);
});

test('TAK probe detects a visible function but never invokes it', () => {
  let calls = 0;
  const target = { testTouchLayout() { calls++; } };
  const result = snapshot(target);
  assert.equal(result.state, 'function-visible');
  assert.equal(result.callable, true);
  assert.equal(result.invoked, false);
  assert.equal(calls, 0);
});

test('TAK probe does not execute accessor properties', () => {
  let getterCalls = 0;
  const target = {};
  Object.defineProperty(target, 'testTouchLayout', {
    configurable: true,
    get() { getterCalls++; throw new Error('getter must not run'); }
  });
  const result = snapshot(target);
  assert.equal(result.state, 'accessor-not-inspected');
  assert.equal(result.callable, false);
  assert.equal(result.invoked, false);
  assert.equal(getterCalls, 0);
});

test('TAK probe rejects a non-function property', () => {
  const result = snapshot({ testTouchLayout: { available: true } });
  assert.equal(result.state, 'property-not-function');
  assert.equal(result.callable, false);
  assert.equal(result.invoked, false);
});

test('TAK probe handles an unavailable scope and descriptor errors', () => {
  assert.equal(snapshot(null).state, 'scope-unavailable');
  const hostile = new Proxy({}, {
    getOwnPropertyDescriptor() { throw new Error('inspection blocked'); }
  });
  assert.equal(snapshot(hostile).state, 'inspection-error');
});
