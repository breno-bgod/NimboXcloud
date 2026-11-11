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
