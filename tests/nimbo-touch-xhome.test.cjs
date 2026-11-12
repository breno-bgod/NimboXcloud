'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'modules', 'NimboXcloud-Touch-HUD.user.js'), 'utf8');
const hostSource = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

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
  const canResumeStart = source.indexOf('canResume(){\n if(this.remoteMode){');
  const cloudBranch = source.indexOf('\n if(!this.root', canResumeStart);
  assert.ok(canResumeStart >= 0 && cloudBranch > canResumeStart, 'remote canResume branch exists');
  const remoteGate = source.slice(canResumeStart, cloudBranch);
  assert.ok(remoteGate.includes('this.remoteAdapter!==remoteInputAdapter'));
  assert.ok(remoteGate.includes('this.desiredSession!==this.remoteAdapter.id'));
  assert.ok(remoteGate.includes('this.remoteAdapter.isReady?.()'));
  assert.doesNotMatch(remoteGate, /api\.streamSession|STATES\.isPlaying/);

  const resumeStart = source.indexOf('checkResume(){\n    if(!this.wanted||!this.root)return;\n    if(this.remoteMode){');
  const cloudResume = source.indexOf('\n    const session=api?.streamSession;', resumeStart);
  assert.ok(resumeStart >= 0 && cloudResume > resumeStart, 'remote checkResume branch exists');
  const remoteResume = source.slice(resumeStart, cloudResume);
  assert.ok(remoteResume.includes('this.stopRemote()'));
  assert.ok(remoteResume.includes('this.startRemote(adapter,true)'));
});

test('xHome HUD teardown releases virtual inputs before clearing its adapter', () => {
  const stopStart = source.indexOf('stop() {\n    ++this.epoch;\n    this.releaseKeys();');
  const stopEnd = source.indexOf('\n  bindSurface', stopStart);
  assert.ok(stopStart >= 0 && stopEnd > stopStart, 'base HUD stop method exists');
  const stopBlock = source.slice(stopStart, stopEnd);
  assert.ok(stopBlock.indexOf('this.releaseKeys()') < stopBlock.indexOf('this.remoteAdapter?.release?.()'));
  assert.ok(stopBlock.indexOf('this.remoteAdapter?.release?.()') < stopBlock.indexOf('this.active = false'));

  const remoteStopStart = source.indexOf('stopRemote(){');
  const remoteStopEnd = source.indexOf('\n  setMenuBlocked', remoteStopStart);
  assert.ok(remoteStopStart >= 0 && remoteStopEnd > remoteStopStart, 'remote stop method exists');
  const remoteStop = source.slice(remoteStopStart, remoteStopEnd);
  assert.ok(remoteStop.indexOf('this.stop()') < remoteStop.indexOf('this.remoteMode=false'));
  assert.ok(remoteStop.indexOf('this.remoteMode=false') < remoteStop.indexOf('this.remoteAdapter=null'));
});

test('xHome HUD startup selects the remote transport without changing xCloud input configuration', () => {
  assert.ok(source.includes('const remote=this.remoteMode===true;\n    const transport=remote?this.remoteAdapter:nimboTransport;'));
  assert.ok(source.includes('if(!remote)await transport.activateKeyboardMouse();'));
  assert.ok(source.includes("if(remote){\n      if(!transport||transport!==remoteInputAdapter||!transport.isReady?.())"));
});

test('NimboTouch exposes a narrow xHome virtual-gamepad forwarding contract', () => {
  assert.match(source, /sendRemoteGamepadState:state=>/);
  assert.match(source, /adapter\.sendGamepad\(state\)===true/);
  assert.match(source, /releaseRemoteGamepad:\(\)=>/);
  assert.match(source, /adapter\.releaseGamepad\(\)===true/);
});

test('xHome virtual gamepad can use the shared input loop without the browser Gamepad API', () => {
  const start = hostSource.indexOf('function nxGamepadUiTick()');
  const end = hostSource.indexOf('let nxGamepadLoopTimer', start);
  assert.ok(start >= 0 && end > start, 'shared gamepad loop exists');
  const block = hostSource.slice(start, end);
  assert.match(block, /if \(document\.visibilityState === 'hidden'\)/);
  assert.match(block, /typeof navigator\.getGamepads==='function'/);
  assert.match(block, /else if\(!nxRemoteVirtualGamepad\)/);
  assert.match(block, /nxRemoteGamepadTick\(pads,allowInput\)/);
});
