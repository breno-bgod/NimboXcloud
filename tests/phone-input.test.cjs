'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('NimboXcloud.user.js','utf8');
function setup(){
 let now=1000,angle=90,mode='gamepad',allow=true;const events={},prefs=new Map(),announcements=[];
 const ctx={innerWidth:1000,innerHeight:500,openUI:false,Date:{now:()=>now},Event:class{constructor(type){this.type=type;}},
  window:{addEventListener:(k,f)=>events[k]=f,dispatchEvent:e=>announcements.push(e.type),NimboTouch:{diagnostic:()=>({editing:false}),isRemoteActive:()=>false}},
  document:{hidden:false,hasFocus:()=>true,addEventListener:(k,f)=>events['doc:'+k]=f,documentElement:{classList:{contains:()=>false}}},
  isInGame:()=>allow,nxLoadingBusy:()=>false,nxScreenAngle:()=>angle,nxSelectedInputMode:()=>mode,nxNativeGetGamepads:()=>[],
  nxNeutralVirtualPad:()=>({id:'neutral',index:0,mapping:'standard',connected:true,timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false,touched:false}))}),
  getPref:(k,d)=>prefs.get(k)??d,setPref:(k,v)=>prefs.set(k,v),NX_GYRO_GAME_KEY:'legacy',nxGyroPreview:{permission:'denied'},
  nxStartGyroPreview:async()=>true,nxStopGyroPreview:()=>{},nxInstallInputBridge:()=>{},setInterval:()=>{},toast:()=>{},
  navigator:{getGamepads:()=>[]},nxInputBridge:{installed:true}};
 ctx.nxInputBridge.wrapper=ctx.navigator.getGamepads;
 vm.createContext(ctx);const a=source.indexOf('  // BEGIN PHONE INPUT:'),b=source.indexOf('  // END PHONE INPUT',a);assert.ok(a>0&&b>a);vm.runInContext(source.slice(a,b),ctx);
 return {ctx,prefs,events,announcements,state:()=>vm.runInContext('nxPhone',ctx),time:v=>now=v,angle:v=>angle=v,mode:v=>mode=v,allow:v=>allow=v,
  sample:(alpha,beta,gamma)=>ctx.nxPhoneOnOrientation({alpha,beta,gamma}),pad:()=>ctx.nxNeutralVirtualPad(),event:(extra={})=>({pointerType:'touch',isPrimary:true,pointerId:1,clientX:0,clientY:0,target:{closest:()=>null},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra})};
}
test('FPS lê as duas paisagens, soma no stick direito e para em repouso',async()=>{
 for(const [angle,beta] of [[90,9],[270,-9]]){const h=setup();h.angle(angle);await h.ctx.nxPhoneSetProfile('fps');h.sample(0,0,0);h.time(1100);h.sample(0,beta,0);
 const pad=h.pad();pad.axes=[.2,-.3,.25,.1];const out=h.ctx.nxPhoneApply([pad])[0];assert.ok(Math.abs(out.axes[2]-.75)<1e-8);assert.equal(out.axes[0],.2);assert.equal(out.buttons,pad.buttons);assert.equal(pad.axes[2],.25);
 h.time(1200);h.sample(0,beta,0);assert.ok(Math.abs(h.ctx.nxPhoneApply([pad])[0].axes[2]-.25)<1e-8);}
});
test('FPS vertical usa a base da tela, não a de retrato',async()=>{
 for(const [angle,gamma] of [[90,9],[270,-9]]){const h=setup();h.angle(angle);await h.ctx.nxPhoneSetProfile('fps');h.sample(0,0,0);h.time(1100);h.sample(0,0,gamma);assert.ok(Math.abs(h.ctx.nxPhoneApply([])[0].axes[3]-.5)<1e-8);}
});
test('Corrida é volante absoluto, somente eixo esquerdo horizontal',async()=>{
 const h=setup();await h.ctx.nxPhoneSetProfile('racing');h.sample(0,0,0);h.time(1100);h.sample(-22.5,0,0);const pad=h.pad();pad.axes=[.2,.4,-.3,.6];const out=h.ctx.nxPhoneApply([pad])[0];assert.ok(Math.abs(out.axes[0]-.7)<1e-8);assert.deepEqual(Array.from(out.axes.slice(1)),[.4,-.3,.6]);
 h.time(1200);h.sample(-22.5,0,0);assert.ok(Math.abs(h.ctx.nxPhoneApply([pad])[0].axes[0]-.7)<1e-8);
});
test('retrato, rotação, gap, blur, menu e dados inválidos não provocam salto',async()=>{
 const h=setup();await h.ctx.nxPhoneSetProfile('fps');h.sample(0,0,0);h.angle(0);h.sample(0,30,0);assert.equal(h.state().lastAt,0);
 h.angle(90);h.sample(0,30,0);assert.deepEqual(Array.from(h.ctx.nxPhoneApply([])[0].axes),[0,0,0,0]);
 h.time(2000);h.sample(0,60,0);assert.deepEqual(Array.from(h.state().axes),[0,0,0,0]);h.events.blur();assert.equal(h.state().center,null);
 h.ctx.openUI=true;h.sample(0,70,0);assert.equal(h.state().center,null);h.ctx.openUI=false;h.sample(NaN,0,0);assert.equal(h.state().lastAt,0);
});
test('off remove apenas a contribuição e não troca o modo nem botões',async()=>{
 const h=setup();await h.ctx.nxPhoneSetProfile('fps');h.sample(0,0,0);h.time(1100);h.sample(0,9,0);const pad=h.pad();pad.axes[2]=.8;assert.equal(h.ctx.nxPhoneApply([pad])[0].axes[2],1);
 await h.ctx.nxPhoneSetProfile('off');const pads=[pad];assert.equal(h.ctx.nxPhoneApply(pads),pads);assert.equal(h.ctx.nxSelectedInputMode(),'gamepad');
});
test('sem controle físico contribui por gamepad complementar em modos de teclado/toque',async()=>{
 for(const mode of ['keyboard-mouse','virtual-keyboard-mouse','native-touch','native','virtual-gamepad']){const h=setup();h.mode(mode);await h.ctx.nxPhoneSetProfile('fps');h.sample(0,0,0);h.time(1100);h.sample(0,9,0);const out=h.ctx.nxPhoneApply([])[0];assert.equal(out.mapping,'standard');assert.ok(out.axes[2]>.49);assert.ok(out.buttons.every(b=>b.value===0));}
 assert.match(source,/nxPhoneApply\(routed\)/);
});
test('permissão negada ou cancelada não liga perfil',async()=>{
 const h=setup();h.ctx.nxStartGyroPreview=async()=>false;assert.equal(await h.ctx.nxPhoneSetProfile('fps'),false);assert.equal(h.state().profile,'off');
 let resolve;h.ctx.nxStartGyroPreview=()=>new Promise(r=>resolve=r);const pending=h.ctx.nxPhoneSetProfile('fps');await h.ctx.nxPhoneSetProfile('off');resolve(true);assert.equal(await pending,false);assert.equal(h.state().profile,'off');
});
test('touchpad físico usa tela do jogo, preserva analógico e solta em up/cancel/TTL',()=>{
 const h=setup();h.state().touchEnabled=true;h.events.pointerdown(h.event());h.events.pointermove(h.event({clientX:17.5,clientY:-7}));const pad=h.pad();pad.axes[2]=.1;pad.axes[3]=.2;const out=h.ctx.nxPhoneApply([pad])[0];assert.ok(Math.abs(out.axes[2]-.6)<1e-8);assert.ok(Math.abs(out.axes[3])<1e-8);
 h.time(1091);assert.equal(h.ctx.nxPhoneApply([pad])[0].axes[2],.1);h.events.pointercancel(h.event());assert.equal(h.state().touch,null);
});
test('touchpad respeita menus, controles do HUD, gesto desligado e outros pointers',()=>{
 const h=setup();const off=h.event();h.events.pointerdown(off);assert.ok(!off.prevented);h.state().touchEnabled=true;
 const button=h.event({target:{closest:()=>({})}});h.events.pointerdown(button);assert.ok(!button.prevented);
 h.events.pointerdown(h.event());h.events.pointerup(h.event({pointerId:2}));assert.ok(h.state().touch);h.events.pointerup(h.event());assert.equal(h.state().touch,null);
 h.ctx.openUI=true;const menu=h.event();h.events.pointerdown(menu);assert.ok(!menu.prevented);
});
test('controle virtual aceita touchpad dedicado, sem capturar botões do controle',()=>{
 const h=setup();h.mode('virtual-gamepad');h.state().touchEnabled=true;
 const ordinary=h.event();h.events.pointerdown(ordinary);assert.ok(!ordinary.prevented);
 const pad=h.event({target:{closest:s=>s==='#nx-phone-touchpad'?{}:null}});h.events.pointerdown(pad);assert.equal(pad.prevented,true);
});
test('não sobrescreve controle de mapeamento desconhecido ou slot cheio',async()=>{
 const h=setup();await h.ctx.nxPhoneSetProfile('fps');const unknown={...h.pad(),id:'custom',mapping:'',axes:[1,0,0,0]};
 const result=h.ctx.nxPhoneApply([unknown]);assert.equal(result[0],unknown);assert.equal(result[1].index,1);
 const full=[unknown,unknown,unknown,unknown];assert.equal(h.ctx.nxPhoneApply(full),full);
});
test('touchpad do controle reutiliza sensibilidade existente e não captura touch de outro alvo',()=>{
 const h=setup();h.state().touchEnabled=true;h.ctx.window.NimboTouch.touchpadSettings=()=>({sensitivity:2,gainX:2,gainY:.5});
 const target={closest:()=>null};h.events.pointerdown(h.event({target}));h.events.pointermove(h.event({clientX:3.5,clientY:7,target}));
 const axes=h.ctx.nxPhoneApply([])[0].axes;assert.ok(Math.abs(axes[2]-.4)<1e-8);assert.ok(Math.abs(axes[3]-.2)<1e-8);
 const own=h.event({target});h.events.touchstart(own);assert.equal(own.prevented,true);
 const other=h.event();h.events.touchstart(other);assert.ok(!other.prevented);
});
test('ponte substituída por outro script impede ativação em vez de anunciar sucesso',async()=>{
 const h=setup();h.ctx.navigator.getGamepads=()=>[];assert.equal(await h.ctx.nxPhoneSetProfile('fps'),false);assert.equal(h.state().profile,'off');assert.equal(h.state().lastAt,0);
});
test('barra Xbox e coordenada inválida não se tornam movimento do touchpad',()=>{
 const h=setup();h.state().touchEnabled=true;
 const native=h.event({target:{closest:s=>s.includes('#StreamHud')?{}:null}});h.events.pointerdown(native);assert.ok(!native.prevented);
 h.events.pointerdown(h.event({clientX:NaN}));assert.equal(h.state().touch,null);
 h.events.pointerdown(h.event());h.events.pointermove(h.event({clientY:NaN}));assert.equal(h.state().touch,null);assert.ok(h.ctx.nxPhoneApply([])[0].axes.every(Number.isFinite));
});
