'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('legacy Pointer Lock preference is no longer referenced', () => {
  assert.doesNotMatch(src, /nx\.pointerLockLegacyF9|nxPointerLockLegacyF9/);
});

test('NimboXcloud does not patch the native Pointer Lock API', () => {
  assert.doesNotMatch(src, /Element\.prototype\.requestPointerLock\s*=/);
  assert.match(src, /touchFullscreenPolicy\.mode='native-unmodified'/);
  assert.match(src, /requestsBlockedByNimbo:\s*false/);
});

test('F9 is not intercepted by a userscript keyboard handler', () => {
  assert.doesNotMatch(src, /e\.code\s*===\s*['"]F9['"]|e\.key\s*===\s*['"]F9['"]/);
  assert.match(src, /Nao substituir requestPointerLock nem interceptar F9/);
});

test('opening the NX panel releases an existing lock but never requests it again', () => {
  assert.match(src, /if\(document\.pointerLockElement\)\{\s*try\{document\.exitPointerLock\(\);\}catch\(_\)\{\}\s*\}/);
  assert.equal((src.match(/\.requestPointerLock\s*\(/g) || []).length, 1, 'only the explicit mouse action may request capture');
});

