'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'NimboXcloud-Touch-HUD.user.js'), 'utf8');

test('NimboTouch exposes a narrow xHome adapter without replacing its xCloud session attachment', () => {
  assert.match(source, /attachSession:nimboCapture/);
  assert.match(source, /attachRemoteInputAdapter:adapter=>/);
  assert.match(source, /clearRemoteInputAdapter:expected=>/);
  assert.match(source, /startRemote:\(\)=>ui\?\.startRemote/);
  assert.match(source, /stopRemote:\(\)=>ui\?\.stopRemote/);
  assert.match(source, /isRemoteActive:\(\)=>/);
  assert.match(source, /isRemoteEnabled:\(\)=>/);
});

test('NimboTouch routes touch HUD mouse, keyboard, scroll and release through the explicit xHome adapter', () => {
  assert.match(source, /if\(this\.remoteMode\)\{const adapter=this\.remoteAdapter/);
  assert.match(source, /adapter\.sendMouse\(reading\)/);
  assert.match(source, /adapter\.sendKey\(code,pressed,this\.keysDown\)/);
  assert.match(source, /this\.remoteAdapter\?\.release\?\.\(\)/);
  assert.match(source, /this\.send\(0,0,0,steps\*120\)/);
  assert.match(source, /if\(this\.remoteMode\)return this\.startRemote/);
});

test('xHome HUD mode does not install a second Gamepad API hook or alter the xCloud transport', () => {
  assert.doesNotMatch(source, /navigator\.getGamepads\s*=/);
  assert.match(source, /new NimboXboxTransport\(raw\)/);
  assert.match(source, /if\(!remote\)await transport\.activateKeyboardMouse\(\)/);
});


test('xHome resume lifecycle is scoped to the remote adapter, not xCloud stream state', () => {
  const canResume = source.match(/canResume\\(\\)\\{\\s*if\\(this\\.remoteMode\\)\\{([\\s\\S]*?)\\n \\}\\n if\\(!this\\.root/);
  assert.ok(canResume, 'remote canResume branch exists');
  assert.match(canResume[1], /this\\.remoteAdapter!==remoteInputAdapter/);
  assert.match(canResume[1], /this\\.desiredSession!==this\\.remoteAdapter\\.id/);
  assert.match(canResume[1], /this\\.remoteAdapter\\.isReady\\?\\.\\(\\)/);
  assert.doesNotMatch(canResume[1], /api\\.streamSession|STATES\\.isPlaying/);

  const checkResume = source.match(/checkResume\\(\\)\\{\\s*if\\(!this\\.wanted\\|\\|!this\\.root\\)return;\\s*if\\(this\\.remoteMode\\)\\{([\\s\\S]*?)\\n    \\}\\n    const session=api\\?\\.streamSession;/);
  assert.ok(checkResume, 'remote checkResume branch exists');
  assert.match(checkResume[1], /this\\.stopRemote\\(\\)/);
  assert.match(checkResume[1], /this\\.startRemote\\(adapter,true\\)/);
});

test('xHome HUD teardown releases virtual inputs before clearing its adapter', () => {
  assert.match(source, /if\\(this\\.remoteMode\\)try\\{this\\.remoteAdapter\\?\\.release\\?\\.\\(\\);\\}catch\\{\\}/);
  assert.match(source, /stopRemote\\(\\)\\{\\s*if\\(!this\\.remoteMode\\)return false;\\s*this\\.stop\\(\\);\\s*this\\.remoteMode=false;this\\.remoteAdapter=null;/);
});

test('xHome HUD startup selects the remote transport without changing xCloud input configuration', () => {
  assert.match(source, /const remote=this\\.remoteMode===true;\\s*const transport=remote\\?this\\.remoteAdapter:nimboTransport;/);
  assert.match(source, /if\\(!remote\\)await transport\\.activateKeyboardMouse\\(\\);/);
  assert.match(source, /if\\(remote\\)\\{\\s*if\\(!transport\\|\\|transport!==remoteInputAdapter\\|\\|!transport\\.isReady\\?\\.\\(\\)\\)/);
});
