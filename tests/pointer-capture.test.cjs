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
 const context={document,window:{NimboTouch:{inputModeStatus:()=>({connected:options.connected!==false,mode:options.actualMode||'keyboard-mouse'})},addEventListener(name,fn){listeners[name]=fn;}},
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
