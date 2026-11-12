'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('legacy Xbox profiles migrate to the native automatic profile', () => {
  assert.match(source, /if \(p === 'xboxone' \|\| p === 'xboxseries' \|\| p === 'xbox'\) \{\s*localStorage\.setItem\(LS_CONSOLE_LAB, 'off'\); return 'off'; \}/);
  assert.match(source, /return \['off','android','windows'\]\.includes\(p\) \? p : 'off'/);
  assert.match(source, /nxConsoleLabState\.applied = false/);
});

test('platform preferences do not spoof browser UA or grant Xbox authorization', () => {
  assert.match(source, /const nxConsoleNativeUA = navigator\.userAgent/);
  assert.match(source, /nxConsoleLabState\.applied = false/);
  assert.doesNotMatch(source, /Object\.defineProperty\(navigator,\s*['"]userAgent['"]/);
  assert.doesNotMatch(source, /navigator\\.userAgent\\s*=(?!=)/);
});
