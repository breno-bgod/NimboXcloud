'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','modules','NimboXcloud-Touch-HUD.user.js'),'utf8');
test('NimboTouch exposes one opt-in xHome adapter while preserving the Cloud Gaming transport',()=>{
  assert.match(source,/function remoteInputRequested\(\)/);
  assert.match(source,/function remoteInputAvailable\(\)/);
  assert.match(source,/remoteInputAdapter\.sendKey\(code,!!pressed,'touch'\)/);
  assert.match(source,/remoteInputAdapter\.sendMouse\(\{X:x,Y:y,Buttons:this\.buttons,WheelX:0,WheelY:0,Relative:1\},'touch',neutral\)/);
  assert.match(source,/setRemoteInputAdapter/);
  assert.match(source,/hasCloudSession:\(\)=>!!\(STATES\.isPlaying\|\|nimboTransport\?\.connected\(\)\|\|/);
  assert.match(source,/isPanelOpen:\(\)=>!!touchPanel\.isOpen/);
  assert.match(source,/nimboTransport\.sendKey\(code,pressed,this\.keysDown\)/);
  assert.match(source,/channel\.queueMouseInput\(\{Type: 0, X: x, Y: y, Buttons: this\.buttons, WheelX: 0, WheelY: 0\}\)/);
  assert.match(source,/if\(pressed&&!ready&&remoteInputRequested\(\)\)throw Error\('Sessão xHome indisponível\.'/);
  assert.match(source,/if\(remoteInputRequested\(\)\)\{\s*const ready=remoteInputReady\(\)/);
});
test('NimboTouch remote resume requires host readiness and respects the NX menu block',()=>{
  assert.match(source,/if\(remoteInputRequested\(\)\)return this\.desiredSession==='xhome'&&remoteInputReady\(\)&&!nativeDialogVisible\(\)/);
  assert.match(source,/touchPanel\.isOpen\|\|this\.menuBlocked/);
  assert.match(source,/remoteInputAdapter\.isTransportReady\(\)/);
});
