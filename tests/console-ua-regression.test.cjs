// Xbox UA regression: Node.js built-in test runner.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
const branch = source.match(/: nxConsoleLabProfile === 'xbox'\s*\?\s*\(function \(\) \{([\s\S]*?)\}\)\(\)/);
test('Xbox profile uses platform-comment token rather than trailing suffix', () => {
  assert.ok(branch, 'Xbox profile branch exists');
  assert.match(branch[1], /match\[1\] \+ '\(' \+ platform \+ '; Xbox\)' \+ match\[3\]/);
  assert.doesNotMatch(branch[1], /\+ ' Xbox;'/);
});
test('default and Xbox One profiles remain independently selectable', () => {
  assert.match(source, /\['off','xbox','windows','smarttv','xboxone'\]/);
  assert.match(source, /nxConsoleLabProfile === 'xboxone'/);
});
