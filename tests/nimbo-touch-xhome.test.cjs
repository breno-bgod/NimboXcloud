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
