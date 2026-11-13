'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const main=fs.readFileSync('NimboXcloud.user.js','utf8'),moduleSource=fs.readFileSync('modules/NimboXcloud-Touch-HUD.user.js','utf8');
function setup(){
 let now=1000,mode='virtual-keyboard-mouse',permission=true;const sent=[],listeners={};
 const ctx={window:{NimboTouch:{virtualMouseDelta:(x,y)=>{sent.push([x,y]);return true;}},addEventListener:(k,f)=>listeners[k]=f},
  document:{hidden:false,hasFocus:()=>true,addEventListener:(k,f)=>listeners[k]=f},openUI:false,Date:{now:()=>now},
  nxSelectedInputMode:()=>mode,nxGyroPreview:{enabled:true,permission:'denied'},nxGyroGameEnabled:()=>false,
  async nxStartGyroPreview(){ctx.nxGyroPreview.enabled=permission;return permission;},nxStopGyroPreview(){ctx.nxGyroPreview.enabled=false;},
  toast:()=>{},getPref:(k,d)=>d,setPref:()=>{}};
 vm.createContext(ctx);const start=main.indexOf('  // Giroscópio para mouse virtual:'),end=main.indexOf('  // Leitura compartilhada;',start);assert.ok(start>0&&end>start);vm.runInContext(main.slice(start,end),ctx);
 return {ctx,sent,listeners,sample:(b,g,a=0)=>ctx.nxVirtualGyroSample(b,g,a),time:t=>now=t,mode:m=>mode=m,permission:p=>permission=p};
}
test('botão explícito nas configurações virtuais liga sensor sem recarga e desliga',async()=>{
 assert.match(main,/TAB_BUILDERS\.gyrotouch=function\(root\)\{\s*nxVirtualGyroControls\(root\)/);
 const h=setup();assert.equal(await h.ctx.nxToggleVirtualGyro(),true);h.sample(0,0);h.sample(0,1);assert.deepEqual(h.sent,[[4,0]]);
 assert.equal(await h.ctx.nxToggleVirtualGyro(),true);h.sample(0,2);assert.equal(h.sent.length,1);
});
test('sem permissão, módulo compatível ou modo virtual não habilita saída',async()=>{
 const h=setup();h.permission(false);assert.equal(await h.ctx.nxToggleVirtualGyro(),false);h.sample(0,0);h.sample(0,1);assert.deepEqual(h.sent,[]);
 h.permission(true);h.mode('keyboard-mouse');assert.equal(await h.ctx.nxToggleVirtualGyro(),false);
 h.mode('virtual-keyboard-mouse');delete h.ctx.window.NimboTouch.virtualMouseDelta;assert.equal(await h.ctx.nxToggleVirtualGyro(),false);
});
test('referência inicial e rotação não causam salto; repouso não envia movimento',async()=>{
 const h=setup();await h.ctx.nxToggleVirtualGyro();h.sample(20,10);h.sample(20,10);assert.equal(h.sent.length,0);
 h.sample(20,10,90);assert.equal(h.sent.length,0);h.sample(21,10,90);assert.ok(Math.abs(h.sent[0][0]-4)<1e-8);assert.ok(Math.abs(h.sent[0][1])<1e-8);
});
test('menu, background, perda de foco e troca de entrada não enviam deltas',async()=>{
 const h=setup();await h.ctx.nxToggleVirtualGyro();h.sample(0,0);h.ctx.openUI=true;h.sample(0,5);h.ctx.openUI=false;h.sample(0,10);assert.equal(h.sent.length,0);
 h.listeners.blur();h.sample(0,11);assert.equal(h.sent.length,0);
 h.ctx.document.hidden=true;h.sample(0,12);h.ctx.document.hidden=false;h.sample(0,13);assert.equal(h.sent.length,0);
 h.ctx.document.hasFocus=()=>false;h.sample(0,14);h.ctx.document.hasFocus=()=>true;h.sample(0,15);assert.equal(h.sent.length,0);
 h.mode('virtual-gamepad');h.sample(0,16);assert.equal(h.sent.length,0);
});
test('amostra antiga, salto de sensor, inválida ou transporte pausado não acumula movimento',async()=>{
 const h=setup();await h.ctx.nxToggleVirtualGyro();h.sample(0,0);h.time(2000);h.sample(0,10);h.sample(0,40);h.sample(NaN,40);assert.equal(h.sent.length,0);
 h.ctx.window.NimboTouch.virtualMouseDelta=()=>false;h.sample(0,40);h.sample(0,41);h.ctx.window.NimboTouch.virtualMouseDelta=(x,y)=>{h.sent.push([x,y]);return true;};h.sample(0,42);assert.equal(h.sent.length,0);h.sample(0,43);assert.equal(h.sent.length,1);
});
function transport(){const calls=[];const ui={active:true,wanted:true,move:(...a)=>calls.push(a)};const ctx={ui,touchPanel:{isOpen:false},document:{hidden:false,hasFocus:()=>true}};vm.createContext(ctx);const a=moduleSource.indexOf('function nimboVirtualMouseDelta('),b=moduleSource.indexOf('// Public integration point',a);assert.ok(a>0&&b>a);vm.runInContext(moduleSource.slice(a,b),ctx);return{ctx,calls,ui};}
test('módulo usa o mesmo move do touchpad e não altera botões',()=>{
 const h=transport();h.ui.buttons=1;assert.equal(h.ctx.nimboVirtualMouseDelta(2,-3),true);assert.deepEqual(h.calls,[[2,-3]]);assert.equal(h.ui.buttons,1);
});
test('módulo bloqueia pausa, editor, menu, controle virtual, xHome e dados inválidos',()=>{
 for(const [key,value] of [['active',false],['wanted',false],['editingHud',true],['menuBlocked',true],['remoteMode',true],['virtualGamepad',{enabled:true}]]){const h=transport();h.ui[key]=value;assert.equal(h.ctx.nimboVirtualMouseDelta(1,2),false);assert.equal(h.calls.length,0);}
 const h=transport();assert.equal(h.ctx.nimboVirtualMouseDelta(Infinity,0),false);assert.equal(h.ctx.nimboVirtualMouseDelta(129,0),false);h.ctx.touchPanel.isOpen=true;assert.equal(h.ctx.nimboVirtualMouseDelta(1,0),false);assert.equal(h.calls.length,0);
});
test('erro do transporte informa falha sem propagar exceção',()=>{
 const h=transport();let error;h.ui.move=()=>{throw Error('unavailable');};h.ui.handleInputFailure=e=>error=e;assert.equal(h.ctx.nimboVirtualMouseDelta(1,2),false);assert.equal(error.message,'unavailable');
});
