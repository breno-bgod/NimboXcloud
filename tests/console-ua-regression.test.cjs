'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('legacy Xbox profiles migrate to the native automatic profile', () => {
  assert.match(source, /if \(p === 'xboxone' \|\| p === 'xboxseries' \|\| p === 'xbox'\) \{\s*localStorage\.setItem\(LS_CONSOLE_LAB, 'off'\); return 'off'; \}/);
  assert.match(source, /preferências históricas não alteram a identidade ativa/);
  assert.match(source, /nxConsoleLabState\.applied = false/);
});

test('platform preferences do not spoof browser UA or grant Xbox authorization', () => {
  assert.match(source, /const nxConsoleNativeUA = navigator\.userAgent/);
  assert.match(source, /nxConsoleLabState\.applied = false/);
  assert.doesNotMatch(source, /Object\.defineProperty\(navigator,\s*['"]userAgent['"]/);
  assert.doesNotMatch(source, /navigator\\.userAgent\\s*=(?!=)/);
});


test('suspended identity selector cannot leave a stored Mobile/Desktop profile active', () => {
  const begin=source.indexOf('  const nxConsoleLabProfile =');
  const end=source.indexOf('  const nxConsoleLabState =',begin);
  const read=new Function('localStorage','LS_CONSOLE_LAB',source.slice(begin,end)+';return nxConsoleLabProfile;');
  for(const stored of ['off','android','windows','xboxone','xboxseries','smarttv',null]) {
    assert.equal(read({getItem:()=>stored,setItem(){}},'profile'),'off');
  }
});

test('suspended Client Hints experiment preserves the native API even with old preferences', () => {
  const native={platform:'Android'};
  const navigator={userAgentData:native};
  const begin=source.indexOf('  const nxClientHintsMode =');
  const end=source.indexOf('  const nxConsoleLabEvents',begin);
  const read=new Function('navigator','localStorage',source.slice(begin,end)+';return [nxClientHintsMode,nxClientHintsApplied];');
  assert.deepEqual(read(navigator,{getItem:()=> '1'}),[false,false]);
  assert.equal(navigator.userAgentData,native);
});
