'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('HUD-006 auto-load retries when a previous load did not succeed', () => {
  const begin = src.indexOf('  function nxHudAutoLoadGame() {');
  const end = src.indexOf('  function nxHudRouteMonitor()', begin);
  assert.ok(begin > 0 && end > begin);
  let loads = 0;
  const context = {
    nxHudAutoEnabled: () => true,
    nxHudCurrentGameId: () => '9abcdef123456',
    nxHudGameBindings: () => ({ '9abcdef123456': 'FPS' }),
    nxHudProfileLoad: () => ++loads > 1,
    nxHudLastRoute: null,
    nxHudLastAppliedProfile: ''
  };
  vm.runInNewContext(src.slice(begin, end) +
    '\n globalThis.autoload = nxHudAutoLoadGame; globalThis.last = () => nxHudLastAppliedProfile;', context);
  assert.equal(context.autoload(), false);
  assert.equal(context.autoload(), true);
  assert.equal(context.last(), 'FPS');
  assert.equal(context.autoload(), false);
  assert.equal(loads, 2);
});

test('HUD-006 imported backup rejects prototype-related keys', () => {
  assert.match(src, /key !== '__proto__' && key !== 'constructor' && key !== 'prototype'/);
});

test('HUD-002 DOM discovery remains passive', () => {
  const begin = src.indexOf('  function nxHudDomProbe() {');
  const end = src.indexOf('  function ', begin + 12);
  assert.ok(begin > 0 && end > begin);
  const probe = src.slice(begin, end);
  assert.doesNotMatch(probe, /\.style\.[a-z]+\s*=/);
  assert.doesNotMatch(probe, /\.dispatchEvent\(/);
});

test('HUD-005 drag events are owned by one pointer and released before capture loss', () => {
  const begin = src.indexOf('  function nxHudEditor() {');
  const end = src.indexOf('  // Aplica somente a prévia local', begin);
  assert.ok(begin > 0 && end > begin);
  const editor = src.slice(begin, end);
  assert.match(editor, /let activePointerId = null;/);
  assert.match(editor, /if \(!e\.isPrimary \|\| activePointerId !== null\) return;/);
  assert.match(editor, /activePointerId = e\.pointerId;/);
  assert.match(editor, /if \(activePointerId !== e\.pointerId \|\| !node\.hasPointerCapture\(e\.pointerId\)\) return;/);
  assert.match(editor, /activePointerId = null;\s*if \(node\.hasPointerCapture\(e\.pointerId\)\) node\.releasePointerCapture/);
});

test('HUD-006 profile names reject prototype-related keys', () => {
  const begin = src.indexOf('  function nxHudProfileName(name) {');
  const end = src.indexOf('  function nxHudProfilesRead()', begin);
  assert.ok(begin > 0 && end > begin);
  const context = {};
  vm.runInNewContext(src.slice(begin, end) + '\n globalThis.validate = nxHudProfileName;', context);
  for (const name of ['__proto__', 'constructor', 'prototype', 'CONSTRUCTOR']) {
    assert.equal(context.validate(name), '');
  }
  assert.equal(context.validate('FPS 1'), 'FPS 1');
});

test('HUD-006 binding changes invalidate the current autoload route', () => {
  const begin = src.indexOf('  function nxHudBindGame(gameId, profileName) {');
  const end = src.indexOf('  const NX_HUD_AUTO_KEY = ', begin);
  assert.ok(begin > 0 && end > begin);
  const code = src.slice(begin, end);
  assert.equal((code.match(/if \(saved\) \{ nxHudLastRoute = null; nxHudLastAppliedProfile = ''; \}/g) || []).length, 2);
});
