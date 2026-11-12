'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('MEDIA-001: stream video replacement restores previous inline filter', () => {
  assert.match(src, /if \(video !== lastAdjustedVideo\)/);
  assert.match(src, /restoreVideoAdjustments\(lastAdjustedVideo\)/);
  assert.match(src, /lastAdjustedVideo = video/);
});

test('MEDIA-002: visual bypass restores the host filter without overwriting host changes', () => {
  const a = src.indexOf('  const nxVideoFilters = new WeakMap();');
  const b = src.indexOf('  const nxVideoFits = new WeakMap();', a);
  assert.ok(a >= 0 && b > a);
  const block = src.slice(a, b);
  assert.match(block, /function restoreVideoAdjustments\(video\)/);
  assert.match(block, /if \(video\.style\.filter === state\.applied\)/);
  assert.match(block, /video\.style\.setProperty\('filter', state\.original, state\.priority\)/);
  assert.match(block, /video\.style\.removeProperty\('filter'\)/);
  assert.match(block, /nxVideoFilters\.delete\(video\)/);
  assert.match(src, /video\.style\.getPropertyValue\('filter'\)/);
});

test('MEDIA-003: visual presets are selectable and legacy preferences remain readable', () => {
  assert.match(src, /const LS_VIDEO_PROFILE = 'xcu\.videoProfile\.v1'/);
  for (const name of ['original', 'balanced', 'vivid', 'custom']) {
    assert.match(src, new RegExp("k:\\s*'" + name + "'"));
  }
  assert.match(src, /getPref\(LS_VIDEO_PROFILE,'original'\)/);
  assert.match(src, /setPref\(LS_VIDEO_PROFILE,'custom'\)/);
  assert.match(src, /getPref\(LS_VIDEO_COLOR, '0'\)/);
  assert.match(src, /getPref\(LS_SHARPNESS, '0'\)/);
  assert.match(src, /setPref\(LS_VIDEO_BRIGHTNESS,String\(base\.brightness\)\)/);
  assert.match(src, /setPref\(LS_VIDEO_CONTRAST,String\(base\.contrast\)\)/);
  assert.match(src, /setPref\(LS_VIDEO_SATURATION,String\(base\.saturation\)\)/);
});

test('MEDIA-004: fullscreen requires user action and video fit is reversible', () => {
  assert.match(src, /actBtn\('Entrar \/ Sair', nxConsoleLabFullScreen/);
  assert.match(src, /function applyVideoFit\(video\)/);
  assert.match(src, /function restoreVideoFit\(video\)/);
  assert.match(src, /video\.style\.removeProperty\('object-fit'\)/);
  assert.match(src, /restoreVideoFit\(lastAdjustedVideo\)/);
});

test('MEDIA-006: hidden-tab eco mode restores filters when visibility changes', () => {
  assert.match(src, /const LS_VIDEO_ECO = 'xcu\.videoEco\.v1'/);
  assert.match(src, /document\.visibilityState === 'hidden'/);
  assert.match(src, /document\.addEventListener\('visibilitychange', function \(\) \{/);
  assert.match(src, /restoreVideoAdjustments\(video\)/);
});
