'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

function boot(flagValue) {
  const begin = src.indexOf('  const touchFullscreenPolicy = {');
  const end = src.indexOf('  // Aviso F9:', begin);
  assert.ok(begin >= 0 && end > begin, 'Pointer Lock policy boundaries changed');
  const listeners = {};
  let nativeCalls = 0;
  function Element() {}
  Element.prototype.requestPointerLock = function () {
    nativeCalls++;
    doc.pointerLockElement = this;
    listeners.pointerlockchange();
    return Promise.resolve();
  };
  const target = new Element();
  target.isConnected = true;
  const doc = {
    pointerLockElement: null,
    fullscreenElement: target,
    activeElement: null,
    addEventListener(name, cb) { listeners[name] = cb; },
    querySelector() { return null; },
    exitPointerLock() { this.pointerLockElement = null; listeners.pointerlockchange(); }
  };
  const ctx = {
    Element, document: doc, Promise, DOMException,
    localStorage: { getItem: () => flagValue }
  };
  vm.runInNewContext(src.slice(begin, end) + '\n globalThis.__nxTestPolicy = touchFullscreenPolicy;', ctx, { timeout: 1000 });
  return { target, doc, listeners, policy: ctx.__nxTestPolicy, nativeCalls: () => nativeCalls };
}

test('legacy default blocks automatic relock after native lock is lost', async () => {
  const app = boot(null);
  await app.target.requestPointerLock();
  app.doc.exitPointerLock();
  await assert.rejects(app.target.requestPointerLock(), { name: 'NotAllowedError' });
  assert.equal(app.nativeCalls(), 1);
});

test('opt-out allows native relock after lock is lost', async () => {
  const app = boot('0');
  await app.target.requestPointerLock();
  app.doc.exitPointerLock();
  await app.target.requestPointerLock();
  assert.equal(app.nativeCalls(), 2);
});

test('opt-out does not consume F9 keyboard event', () => {
  const app = boot('0');
  let prevented = false;
  let stopped = false;
  app.listeners.keydown({
    isTrusted: true, code: 'F9', repeat: false,
    altKey: false, ctrlKey: false, metaKey: false, shiftKey: false,
    preventDefault() { prevented = true; },
    stopImmediatePropagation() { stopped = true; }
  });
  assert.equal(prevented, false);
  assert.equal(stopped, false);
});

test('opt-out diagnostics report native release without F9 requirement', async () => {
  const app = boot('0');
  await app.target.requestPointerLock();
  assert.equal(app.policy.lastReason, 'native pointer lock active');
  app.doc.exitPointerLock();
  assert.equal(app.policy.lastReason, 'native pointer lock released');
  assert.equal(app.policy.requestsBlockedByNimbo, false);
});
