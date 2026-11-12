'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

function boot() {
  const begin = src.indexOf('  const touchFullscreenPolicy = {');
  const end = src.indexOf('  // Aviso F9:', begin);
  assert.ok(begin >= 0 && end > begin, 'Native Pointer Lock policy boundaries changed');
  const listeners = {};
  const document = {
    pointerLockElement: null,
    addEventListener(name, callback, capture) {
      listeners[name] = callback;
      if (name === 'pointerlockchange') assert.equal(capture, true);
    }
  };
  const policy = new Function('document', src.slice(begin, end) + '\nreturn touchFullscreenPolicy;')(document);
  return {document, listeners, policy};
}

test('native Pointer Lock policy never blocks requests', () => {
  const app = boot();
  assert.equal(app.policy.enabled, false);
  assert.equal(app.policy.mode, 'native-unmodified');
  assert.equal(app.policy.requestsBlockedByNimbo, false);
  assert.equal(app.policy.suppressed, 0);
});

test('diagnostics follow native pointerlockchange events', () => {
  const app = boot();
  app.document.pointerLockElement = {};
  app.listeners.pointerlockchange();
  assert.equal(app.policy.lastReason, 'native pointer lock active');
  app.document.pointerLockElement = null;
  app.listeners.pointerlockchange();
  assert.equal(app.policy.lastReason, 'native pointer lock released');
});

test('policy registers no keyboard handler and does not intercept F9', () => {
  const app = boot();
  assert.equal(app.listeners.keydown, undefined);
  assert.equal(app.listeners.keyup, undefined);
  assert.doesNotMatch(src, /e\.code\s*===\s*['"]F9['"]|e\.key\s*===\s*['"]F9['"]/);
});

test('native pointer lock implementation remains untouched', () => {
  assert.doesNotMatch(src, /Element\.prototype\.requestPointerLock\s*=/);
  assert.doesNotMatch(src, /\.requestPointerLock\s*\(/);
});
