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

test('HUD-005 preview scale is bounded and persisted independently from positions', () => {
  const start = src.indexOf("  const NX_HUD_PREVIEW_SCALE_KEY = ");
  const end = src.indexOf('  function nxHudEditor() {', start);
  assert.ok(start > 0 && end > start);
  const data = {};
  const ctx = {
    Number, Math, String,
    getPref: (key, fallback) => Object.hasOwn(data, key) ? data[key] : fallback,
    localStorage: { setItem: (k, v) => { data[k] = v; }, getItem: k => data[k] ?? null }
  };
  vm.runInNewContext(src.slice(start, end) +
    '\n globalThis.readScale = nxHudPreviewScale; globalThis.saveScale = nxHudSavePreviewScale;', ctx);
  assert.equal(ctx.readScale(), 100);
  assert.equal(ctx.saveScale(125), true);
  assert.equal(ctx.readScale(), 125);
  assert.equal(ctx.saveScale(200), false);
  assert.equal(ctx.readScale(), 125);
  data['nx.hud.editor.previewScale.v1'] = 'not-a-number';
  assert.equal(ctx.readScale(), 100);
});

test('HUD-003 native positioning is opt-in, reversible and rejects duplicate labels', () => {
  const start = src.indexOf("  const NX_HUD_NATIVE_KEY = ");
  const end = src.indexOf("  const NX_HUD_PREVIEW_SCALE_KEY = ", start);
  assert.ok(start > 0 && end > start);
  const native = src.slice(start, end);
  assert.match(native, /getPref\(NX_HUD_NATIVE_KEY, '0'\) === '1'/);
  assert.match(native, /const duplicates = new Set\(\);/);
  assert.match(native, /if \(duplicates\.has\(id\)\) return;/);
  assert.match(native, /nxHudNativeOriginal\.clear\(\);/);
  assert.doesNotMatch(native, /dispatchEvent\(/);
});

test('HUD-006 native sync is tied to route monitoring and detects remounted nodes', () => {
  assert.match(src, /function nxHudRouteMonitor\(\) \{[\s\S]*?nxHudAutoLoadGame\(\);\s*nxHudNativeSync\(\);/);
  const start = src.indexOf('  function nxHudNativeSync() {');
  const end = src.indexOf('  function nxHudNativeSetEnabled(', start);
  assert.ok(start > 0 && end > start);
  const sync = src.slice(start, end);
  assert.match(sync, /nxHudNativeCandidates\(\)/);
  assert.match(sync, /nxHudReadLayout\(\)/);
  assert.match(sync, /nxHudPreviewScale\(\)/);
  assert.match(sync, /nxHudCurrentGameId\(\)/);
  assert.match(sync, /nxHudNativeNodes\[id\]/);
  assert.match(sync, /nxHudNativeApply\(\)/);
});
