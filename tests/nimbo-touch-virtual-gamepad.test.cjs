'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const moduleSource = fs.readFileSync(path.join(__dirname, '..', 'modules', 'NimboXcloud-Touch-HUD.user.js'), 'utf8');
const hostSource = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
const helperStart = moduleSource.indexOf('class NimboTouchVirtualGamepad {');
const helperEnd = moduleSource.indexOf('\nclass NimboPlayControls extends', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart);
const VirtualGamepad = vm.runInNewContext(moduleSource.slice(helperStart, helperEnd) + '\nNimboTouchVirtualGamepad;', { Map, Number, Math, Array });
function create() {
  const sent=[], releases=[];
  const pad=new VirtualGamepad(state=>{sent.push(JSON.parse(JSON.stringify(state)));return true;},()=>{releases.push(true);return true;});
  pad.setEnabled(true);return {pad,sent,releases};
}
test('independent sticks clamp diagonals and release only their own axes',()=>{
  const {pad,sent}=create();assert.equal(pad.beginStick(10,0),true);assert.equal(pad.beginStick(11,2),true);
  assert.equal(pad.updateStick(10,1,1),true);assert.equal(pad.updateStick(11,-1,0),true);
  assert.ok(Math.abs(Math.hypot(sent.at(-1).axes[0],sent.at(-1).axes[1])-1)<1e-9);
  pad.endPointer(10);assert.deepEqual(sent.at(-1).axes.slice(0,2),[0,0]);assert.deepEqual(sent.at(-1).axes.slice(2),[-1,0]);
});
test('shared button ownership survives one pointer release',()=>{
  const {pad,sent}=create();assert.equal(pad.beginButton(20,0,1),true);assert.equal(pad.beginButton(21,0,1),true);
  pad.endPointer(20);assert.equal(sent.at(-1).buttons[0].value,1);pad.endPointer(21);assert.equal(sent.at(-1).buttons[0].value,0);
});
test('analog triggers retain pressure and clamp values',()=>{
  const {pad,sent}=create();assert.equal(pad.beginButton(30,6,.2),true);assert.equal(pad.updateButton(30,.82),true);
  assert.equal(sent.at(-1).buttons[6].value,.82);pad.endPointer(30);assert.equal(sent.at(-1).buttons[6].value,0);
  assert.equal(pad.beginButton(31,7,1.4),true);assert.equal(sent.at(-1).buttons[7].value,1);
});
test('pointer cancellation clears state and stale pointer IDs are ignored',()=>{
  const {pad,sent}=create();assert.equal(pad.beginStick(40,0),true);assert.equal(pad.updateStick(40,.5,-.5),true);
  assert.equal(pad.endPointer(40),true);assert.equal(pad.endPointer(40),false);assert.equal(pad.updateStick(999,1,1),false);
  assert.deepEqual(sent.at(-1).axes.slice(0,2),[0,0]);
});
test('suspension releases the remote slot and requires fresh input after resume',()=>{
  const {pad,sent,releases}=create();assert.equal(pad.beginButton(50,1,1),true);assert.equal(pad.suspend(),true);
  assert.equal(pad.enabled,true);assert.equal(pad.pointers.size,0);assert.deepEqual(Array.from(pad.axes),[0,0,0,0]);
  assert.equal(pad.buttons[1],0);assert.equal(releases.length,1);assert.equal(pad.beginButton(51,1,1),true);
  assert.equal(sent.at(-1).buttons[1].value,1);pad.setEnabled(false);assert.equal(releases.length,2);assert.equal(pad.beginButton(52,1,1),false);
});
test('virtual HUD is xHome-only and does not patch the browser Gamepad API',()=>{
  assert.match(moduleSource,/renderVirtualGamepadControls\(\)\s*\{\s*if\(!this\.mapped\|\|!this\.remoteMode\)return;/);
  assert.match(moduleSource,/this\.remoteAdapter\?\.sendGamepad\?\.\(state\)===true/);
  assert.match(moduleSource,/this\.virtualGamepad\.suspend\(\)/);
  assert.match(moduleSource,/this\.virtualToggle=button\('Ativar controle virtual'/);
  assert.match(moduleSource,/this\.virtualToggle\.hidden=!virtualAvailable/);
  assert.match(moduleSource,/'vpad-left-stick'/);assert.match(moduleSource,/'vpad-home'/);
  assert.doesNotMatch(moduleSource,/navigator\.getGamepads\s*=/);
  assert.match(moduleSource,/if\(!remote\)await transport\.activateKeyboardMouse\(\)/);
  assert.match(hostSource,/function nxRemoteSetVirtualGamepadState\(/);
});
