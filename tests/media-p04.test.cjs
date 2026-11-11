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
test('MEDIA-002: visual bypass restores the host filter', () => {
  const a = src.indexOf('  function restoreVideoAdjustments(');
  const b = src.indexOf('  function cycleSharpness()', a);
  assert.ok(a > 0 && b > a);
  const block = src.slice(a,b);
  assert.match(block, /const nxVideoFilters = new WeakMap\(\)/);
  assert.match(block, /if \(!color && !sharp\)/);
  assert.match(block, /video\.style\.removeProperty\('filter'\)/);
  assert.match(block, /video\.style\.getPropertyValue\('filter'\)/);
  assert.match(block, /video\.style\.filter !== state\.applied/);
});
