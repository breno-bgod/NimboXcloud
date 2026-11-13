'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('NimboXcloud.user.js','utf8');
function boot(options={}) {
 const listeners={},messages=[],prefs={},calls={request:0,exit:0,close:0};
 const video={requestPointerLock(){calls.request++;if(options.reject)return Promise.reject(Error('denied'));if(options.throws)throw Error('denied');}};
 const document={pointerLockElement:null,addEventListener(name,fn){listeners[name]=fn;},exitPointerLock(){calls.exit++;document.pointerLockElement=null;}};
 const context={document,window:{NimboTouch:{physicalMouseInput:()=>true,physicalKeyboardInput:()=>true,releasePhysicalInput(){},inputModeStatus:()=>({connected:options.connected!==false,mode:options.actualMode||'keyboard-mouse'})},addEventListener(name,fn){listeners[name]=fn;}},
  activeStreamVideo:()=>options.noVideo?null:video,nxSelectedInputMode:()=>options.mode||'keyboard-mouse',
  getPref:(key,fallback)=>prefs[key]??fallback,nxKeyBinding:()=>options.binding||null,
  toast:message=>messages.push(message),setOpen:()=>calls.close++,openUI:false,nxCaptureKeys:null};
 vm.createContext(context);
 const start=source.indexOf('  const NX_POINTER_KEY =');
 const end=source.indexOf('  function nxBindControls(',start);
 vm.runInContext(source.slice(start,end),context);
 const event=(code='F8',extra={})=>({code,isTrusted:true,repeat:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra});
 return {context,listeners,messages,prefs,video,document,calls,event};
}
test('explicit physical mouse action requests the stream element and closes the panel in the gesture',()=>{
 const h=boot();assert.equal(h.context.nxTogglePointer(),true);assert.equal(h.calls.request,1);assert.equal(h.calls.close,1);
});
for(const options of [{mode:'virtual-keyboard-mouse'},{mode:'gamepad'},{mode:'native-touch'},{connected:false},{actualMode:'virtual-keyboard-mouse'},{noVideo:true}])
 test('capture refuses unavailable or different input: '+JSON.stringify(options),()=>{
  const h=boot(options);assert.equal(h.context.nxTogglePointer(),false);assert.equal(h.calls.request,0);assert.equal(h.messages.length,1);
 });
test('F8 captures and consumes its matching release; unrelated keys and F9 remain native',()=>{
 const h=boot(),down=h.event();h.listeners.keydown(down);assert.equal(h.calls.request,1);assert.equal(down.prevented,true);
 const repeated=h.event('F8',{repeat:true});h.listeners.keydown(repeated);assert.equal(repeated.prevented,true);assert.equal(h.calls.request,1);
 const up=h.event();h.listeners.keyup(up);assert.equal(up.prevented,true);
 for(const code of ['F9','Escape','KeyW']){const e=h.event(code);h.listeners.keydown(e);h.listeners.keyup(e);assert.equal(e.prevented,undefined);}
 assert.equal(h.calls.request,1);
});
test('trusted key, text fields, panel recording, modifiers and panel combination are respected',()=>{
 for(const extra of [{isTrusted:false},{repeat:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{metaKey:true},{target:{tagName:'INPUT'}},{target:{isContentEditable:true}}]){
  const h=boot(),e=h.event('F8',extra);h.listeners.keydown(e);assert.equal(h.calls.request,0);assert.equal(e.prevented,undefined);
 }
 for(const state of ['openUI','nxCaptureKeys']){const h=boot();h.context[state]=true;h.listeners.keydown(h.event());assert.equal(h.calls.request,0);}
 const h=boot({binding:['F8','KeyP']});h.listeners.keydown(h.event());assert.equal(h.calls.request,0);
});
test('capture shortcut can be changed or disabled without disabling the explicit action',()=>{
 const h=boot();h.prefs['nx.pointerCapture.key.v1']='F2';h.listeners.keydown(h.event());assert.equal(h.calls.request,0);
 h.listeners.keydown(h.event('F2'));assert.equal(h.calls.request,1);
 h.prefs['nx.pointerCapture.key.v1']='off';h.listeners.keydown(h.event('F2'));assert.equal(h.calls.request,1);
 h.context.nxTogglePointer();assert.equal(h.calls.request,2);
});
test('releasing own capture does not request again or steal another element capture',()=>{
 const h=boot();h.document.pointerLockElement=h.video;assert.equal(h.context.nxTogglePointer(),true);assert.equal(h.calls.exit,1);assert.equal(h.calls.request,0);
 h.document.pointerLockElement={};assert.equal(h.context.nxTogglePointer(),false);assert.equal(h.calls.exit,1);
});
test('unsupported API and rejected capture provide feedback without recapture',async()=>{
 const h=boot();delete h.video.requestPointerLock;assert.equal(h.context.nxTogglePointer(),false);assert.equal(h.messages.length,1);
 const rejected=boot({reject:true});rejected.context.nxTogglePointer();await Promise.resolve();assert.equal(rejected.messages.length,1);assert.equal(rejected.calls.request,1);
 const thrown=boot({throws:true});assert.equal(thrown.context.nxTogglePointer(),false);assert.equal(thrown.messages.length,1);
});

function connectedRelay() {
 const h=boot(),frames=[],keys=[];
 const raw={connectionState:'Connected',isShutdown:false,configuration:{inputConfiguration:{enableKeyboardInput:true,enableMouseInput:true,enableTouchInput:true}},
  onVirtualMouseInput:reading=>frames.push(JSON.parse(JSON.stringify(reading))),
  updateInputConfigurationAsync(options){Object.assign(this.configuration.inputConfiguration,options);return Promise.resolve();},
  stream:{inputManager:{getKeyboardReading:event=>({windowsKey:event.code==='KeyW'?87:65,reportType:0,isPressed:event.type==='keydown'})},
   inputChannel:{sendKeyboardInput:reading=>keys.push(JSON.parse(JSON.stringify(reading)))}}};
 const touch=fs.readFileSync('modules/NimboXcloud-Touch-HUD.user.js','utf8');
 const start=touch.indexOf('class NimboXboxTransport {'),end=touch.indexOf('\nfunction nimboApplyInput',start);
 Object.assign(h.context,{setTimeout,clearTimeout,nimboApplyInput:(raw,options)=>raw.updateInputConfigurationAsync(options)});
 vm.runInContext(touch.slice(start,end)+'\nglobalThis.makeTransport=raw=>new NimboXboxTransport(raw);',h.context);
 const transport=h.context.makeTransport(raw);transport.exclusiveMode='keyboard-mouse';
 Object.assign(h.context.window.NimboTouch,{
  physicalMouseInput:reading=>transport.physicalMouse(reading),
  physicalKeyboardInput:event=>transport.physicalKeyboard(event),
  releasePhysicalInput:()=>transport.release()
 });
 h.context.nxTogglePointer();h.document.pointerLockElement=h.video;
 h.listeners.pointerlockchange();
 const emit=(type,extra={})=>{const e=h.event('',{type,cancelable:true,...extra});h.listeners[type](e);return e;};
 return {...h,raw,transport,frames,keys,emit};
}
test('regression: F8 capture forwards relative movement to the real transport instead of just hiding the cursor',()=>{
 const h=connectedRelay();const event=h.emit('mousemove',{movementX:14,movementY:-9,buttons:0});
 assert.deepEqual(h.frames.at(-1),{Type:0,X:14,Y:-9,Buttons:0,WheelX:0,WheelY:0});
 assert.equal(event.stopped,true);assert.equal(event.prevented,true);h.transport.release();
});
test('captured physical buttons, wheel units and keyboard reach the SDK once',()=>{
 const h=connectedRelay();h.emit('mousedown',{buttons:1,movementX:50});assert.equal(h.frames.at(-1).Buttons,1);assert.equal(h.frames.at(-1).X,0);
 h.emit('wheel',{deltaX:1,deltaY:-2,deltaMode:1,buttons:1});assert.equal(h.frames.at(-1).WheelX,16);assert.equal(h.frames.at(-1).WheelY,-32);
 h.emit('mouseup',{buttons:0});assert.equal(h.frames.at(-1).Buttons,0);
 const down=h.emit('keydown',{code:'KeyW'});const up=h.emit('keyup',{code:'KeyW'});
 assert.deepEqual(h.keys.map(k=>k.isPressed),[true,false]);assert.equal(down.stopped,true);assert.equal(up.stopped,true);h.transport.release();
});
test('Esc/unlock releases held keys and buttons and later movements cannot reach the old capture',()=>{
 const h=connectedRelay();h.emit('keydown',{code:'KeyW'});h.emit('mousedown',{buttons:1});
 h.document.pointerLockElement=null;h.listeners.pointerlockchange();
 assert.equal(h.keys.at(-1).isPressed,false);assert.equal(h.frames.at(-1).Buttons,0);
 const count=h.frames.length;h.emit('mousemove',{movementX:20,movementY:30});assert.equal(h.frames.length,count);
});
test('capture forwards no synthetic/touch-originated event and reserves panel/recovery keys',()=>{
 const h=connectedRelay();
 for(const extra of [{isTrusted:false},{sourceCapabilities:{firesTouchEvents:true}}])h.emit('mousemove',{movementX:50,...extra});
 assert.equal(h.frames.length,0);
 for(const code of ['F9','Escape']){const e=h.emit('keydown',{code});assert.equal(e.stopped,undefined);}
 h.context.openUI=true;h.emit('mousemove',{movementX:10});assert.equal(h.frames.length,0);h.transport.release();
});
test('other selected transports and disconnected sessions refuse physical injection and report failure',()=>{
 for(const mode of ['virtual-keyboard-mouse','virtual-gamepad','native-touch','gamepad','native']){
  const h=connectedRelay();h.transport.exclusiveMode=mode;
  assert.equal(h.transport.physicalMouse({Type:0,X:1,Y:1,Buttons:0,WheelX:0,WheelY:0}),false);
  h.emit('mousemove',{movementX:8});assert.equal(h.frames.length,0);assert.equal(h.messages.length,1);
 }
 const h=connectedRelay();h.raw.isShutdown=true;h.emit('mousemove',{movementX:8});assert.equal(h.frames.length,0);assert.equal(h.messages.length,1);
});
test('focus loss releases a pressed physical key and prevents further forwarding',()=>{
 const h=connectedRelay();h.emit('keydown',{code:'KeyW'});h.listeners.blur();assert.equal(h.keys.at(-1).isPressed,false);assert.equal(h.document.pointerLockElement,null);
 const count=h.frames.length;h.emit('mousemove',{movementX:1});assert.equal(h.frames.length,count);
});

test('pointer compatibility events do not double-send the physical movement',()=>{
 const h=connectedRelay();const pointer=h.emit('pointermove',{pointerType:'mouse',movementX:7,movementY:3});
 assert.equal(pointer.stopped,true);assert.equal(pointer.prevented,undefined);assert.equal(h.frames.length,0);
 h.emit('mousemove',{movementX:7,movementY:3});assert.equal(h.frames.length,1);h.transport.release();
});

test('an active Remote Play HUD cannot route physical events into the cloud session',()=>{
 const h=connectedRelay();h.context.window.NimboTouch.diagnostic=()=>({remoteActive:true});
 h.emit('mousemove',{movementX:7});assert.equal(h.frames.length,0);h.transport.release();
});

test('old cached HUD module cannot silently capture without a physical transport',()=>{
 const h=boot();delete h.context.window.NimboTouch.physicalMouseInput;
 assert.equal(h.context.nxTogglePointer(),false);assert.equal(h.calls.request,0);assert.match(h.messages[0],/Atualize o módulo/);
});
