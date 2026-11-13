'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const main=fs.readFileSync(path.join(root,'NimboXcloud.user.js'),'utf8');
const touch=fs.readFileSync(path.join(root,'modules/NimboXcloud-Touch-HUD.user.js'),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function section(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
function harness({pads=[],connected=true,touchEnabled=true}={}){
 const prefs={},events=[],calls=[],nativePads=pads;
 const config={enableKeyboardInput:true,enableMouseInput:true,enableAbsoluteMouse:true,enableTouchInput:touchEnabled,maxTouchPoints:10};
 const raw={connectionState:connected?'Connected':'Disconnected',configuration:{inputConfiguration:config},isShutdown:false,
  onVirtualMouseInput(reading){calls.push(['mouse',plain(reading)]);},
  updateInputConfigurationAsync(options){calls.push(['config',plain(options)]);Object.assign(config,options);return Promise.resolve();}};
 const ctx={navigator:{maxTouchPoints:10,getGamepads:()=>nativePads},setTimeout,clearTimeout,
  getPref:(key,fallback)=>prefs[key]??fallback,setPref:(key,value)=>{prefs[key]=value;},
  nxGyroPreview:{enabled:false},nxGyroPreviewState:()=>({calibrated:false}),nxPreviewAxis:v=>v,
  document:{hidden:false,documentElement:{classList:{contains:()=>false}}},openUI:false,Event,
  api:{streamSession:{}},syncTouchVisibility(){},touchPanel:{refresh(){}},
  nimboPhysicalPreference:()=> 'native'};
 vm.createContext(ctx);
 vm.runInContext(section(main,'  const nxInputRoute = ','  // Telemetria agregada de fontes de entrada;')+
  '\nglobalThis.route=nxSetInputRoute;globalThis.send=nxSendVirtualPad;globalThis.release=nxReleaseVirtualPad;globalThis.bridge=nxInputBridge;globalThis.gate=nxGateGameInput;globalThis.restoreAxes=nxRestoreNativeGamepads;globalThis.routeState=nxInputRoute;',ctx);
 ctx.window={localStorage:{getItem:key=>prefs[key]??null},dispatchEvent:event=>events.push(event),NimboInputHost:{
  setMode:ctx.route,sendGamepad:ctx.send,releaseGamepad:ctx.release,readPhysicalGamepads:()=>nativePads,heldKeys:()=>[]}};
 vm.runInContext(section(touch,'class NimboXboxTransport {','\nfunction nimboApplyInput')+
  '\nfunction nimboApplyInput(raw,options){return raw.updateInputConfigurationAsync(options);}\n'+
  section(touch,'class NimboTouchVirtualGamepad {','\nclass NimboPlayControls extends')+
  '\nglobalThis.transport=raw=>new NimboXboxTransport(raw);globalThis.makePad=(send,release)=>new NimboTouchVirtualGamepad(send,release);',ctx);
 ctx.nimboTransport=ctx.transport(raw);
 ctx.ui={remoteMode:false,active:false,wanted:false,editingHud:false,
  stop(){calls.push(['stop']);this.virtualGamepad.suspend();this.active=false;this.wanted=false;},
  renderMappedButtons(){},applyAllGeometry(){},ensureResumeWatch(){},
  async start(){calls.push(['start']);this.active=!this.menuBlocked;},
  finishEditing(){this.editingHud=false;calls.push(['finish-edit']);}};
 ctx.ui.virtualGamepad=ctx.makePad(state=>ctx.ui.active&&ctx.send(state),ctx.release);
 ctx.nimboHasPhysicalGamepad=()=>nativePads.some(p=>p&&p.connected!==false);
 vm.runInContext(section(touch,'const NIMBO_INPUT_MODES=','const touchPanel=')+
  '\nglobalThis.select=nimboSetInputMode;globalThis.status=nimboInputModeStatus;',ctx);
 ctx.window.NimboTouch={inputModeStatus:ctx.status};
 return {ctx,raw,config,calls,prefs,events,pads:nativePads,ui:ctx.ui,select:ctx.select,status:ctx.status,poll:()=>ctx.navigator.getGamepads()};
}
const physical={id:'USB controller',index:0,connected:true,mapping:'standard',axes:[.4,0,0,0],buttons:[]};

test('the five modes configure native inputs and expose only the selected controller',async()=>{
 const h=harness({pads:[physical]});
 await h.select('keyboard-mouse');
 assert.equal(h.config.enableKeyboardInput,true);assert.equal(h.config.enableMouseInput,true);assert.equal(h.config.enableTouchInput,false);
 assert.equal(h.poll()[0],null);assert.equal(h.ui.wanted,false);
 await h.select('gamepad');
 assert.equal(h.poll()[0],physical);assert.equal(h.config.enableKeyboardInput,false);assert.equal(h.config.enableMouseInput,false);
 await h.select('virtual-keyboard-mouse');
 assert.equal(h.config.enableKeyboardInput,false);assert.equal(h.config.enableMouseInput,true);assert.equal(h.poll()[0],null);assert.equal(h.ui.active,true);
 await h.select('virtual-gamepad');
 assert.equal(h.config.enableMouseInput,false);assert.equal(h.ui.virtualGamepad.enabled,true);
 assert.equal(h.poll()[0].id,'NimboXcloud Virtual Controller');
 await h.select('native-touch');
 assert.equal(h.config.enableTouchInput,true);assert.equal(h.config.enableKeyboardInput,false);assert.equal(h.config.enableMouseInput,false);
 assert.equal(h.ui.wanted,false);assert.equal(h.poll()[0],null);
 await h.select('native');
 assert.deepEqual(h.config,{enableKeyboardInput:true,enableMouseInput:true,enableAbsoluteMouse:true,enableTouchInput:true,maxTouchPoints:10});
 assert.equal(h.poll()[0],physical);
});

test('existing virtual HUD forwards sticks, A and analog triggers to the xCloud Gamepad API without xHome',async()=>{
 const h=harness();await h.select('virtual-gamepad');
 const pad=h.ui.virtualGamepad;
 assert.equal(h.ui.remoteMode,false);
 pad.beginStick(1,0);pad.updateStick(1,.8,-.2);pad.beginButton(2,0,1);pad.beginButton(3,6,.35);
 const output=h.poll()[0];assert.deepEqual(plain(output.axes),[.8,-.2,0,0]);assert.equal(output.buttons[0].pressed,true);assert.equal(output.buttons[6].value,.35);
 assert.equal(h.events.filter(e=>e.type==='gamepadconnected').length,1);
 await h.select('keyboard-mouse');
 assert.ok(Array.from(h.poll()).every(p=>p==null));assert.equal(pad.pointers.size,0);assert.equal(pad.enabled,false);
 assert.equal(h.events.at(-1).type,'gamepaddisconnected');
 assert.ok(h.calls.findIndex(c=>c[0]==='stop')<h.calls.findIndex(c=>c[0]==='config'));
});

test('menu and hidden document return a neutral virtual pad, never a physical controller',async()=>{
 const h=harness({pads:[physical]});await h.select('virtual-gamepad');h.ui.virtualGamepad.beginButton(1,0,1);
 h.ctx.openUI=true;assert.equal(h.poll()[0].buttons[0].value,0);assert.equal(h.poll()[0].id,'NimboXcloud Virtual Controller');
 h.ctx.openUI=false;h.ctx.document.hidden=true;assert.equal(h.poll()[0].buttons[0].value,0);
 h.ctx.release();h.ctx.document.hidden=false;assert.equal(h.poll()[0].buttons[0].value,0);
});

test('no hardware gamepad cannot masquerade as a connected physical controller',async()=>{
 const h=harness();await h.select('virtual-gamepad');
 await assert.rejects(h.select('gamepad'),/Conecte um controle físico/);
 assert.equal(h.status().mode,'virtual-gamepad');assert.equal(h.ui.active,true);
});

test('unsupported native touch rejects before stopping the current mode',async()=>{
 const h=harness({touchEnabled:false});await h.select('virtual-keyboard-mouse');
 const before=h.calls.length;
 await assert.rejects(h.select('native-touch'),/não está disponível/);
 assert.equal(h.calls.length,before);assert.equal(h.ui.active,true);assert.equal(h.status().mode,'virtual-keyboard-mouse');
});

test('SDK failure rolls back to the working HUD, native configuration and route',async()=>{
 const h=harness();await h.select('virtual-gamepad');
 const original=h.raw.updateInputConfigurationAsync;let fail=true;
 h.raw.updateInputConfigurationAsync=options=>{Object.assign(h.config,options);if(fail){fail=false;return Promise.reject(Error('SDK rejeitou'));}return original(options);};
 await assert.rejects(h.select('keyboard-mouse'),/SDK rejeitou/);
 assert.equal(h.status().mode,'virtual-gamepad');assert.equal(h.poll()[0].id,'NimboXcloud Virtual Controller');
 assert.equal(h.config.enableKeyboardInput,false);assert.equal(h.config.enableMouseInput,false);assert.equal(h.ui.active,true);
});

test('simultaneous choices serialize SDK changes and finish in the last requested mode',async()=>{
 const h=harness({pads:[physical]});await Promise.all([h.select('virtual-gamepad'),h.select('keyboard-mouse'),h.select('gamepad')]);
 assert.equal(h.status().mode,'gamepad');assert.equal(h.poll()[0],physical);assert.equal(h.ui.virtualGamepad.enabled,false);
});

test('offline selection waits without claiming gameplay activation and reapplies after connection',async()=>{
 const h=harness({connected:false});const status=await h.select('virtual-gamepad');
 assert.equal(status.state,'waiting');assert.equal(h.ui.active,false);
 assert.equal(h.calls.some(c=>c[0]==='config'),false);
 h.raw.connectionState='Connected';await h.select('virtual-gamepad');
 assert.equal(h.status().connected,true);assert.equal(h.ui.active,true);assert.equal(h.config.enableTouchInput,false);
});

test('foreign Gamepad API ownership prevents a new exclusive mode and retains the working input',async()=>{
 const h=harness();const foreign=()=>[];h.ctx.navigator.getGamepads=foreign;
 // First install must also detect a replacement after the original was captured.
 await assert.rejects(h.select('virtual-gamepad'),/isolar|outro script/i);
 assert.equal(h.ctx.navigator.getGamepads,foreign);
});

test('disabling axis processing preserves the chosen input route',async()=>{
 const h=harness();await h.select('virtual-gamepad');h.ctx.restoreAxes('restaurar perfil');
 assert.equal(h.poll()[0].id,'NimboXcloud Virtual Controller');assert.equal(h.status().mode,'virtual-gamepad');
});

test('an SDK that cached the boot function sees later mode changes without reloading',async()=>{
 const h=harness({pads:[physical]});const cached=h.ctx.navigator.getGamepads;
 assert.equal(cached()[0],physical);
 await h.select('virtual-gamepad');assert.equal(cached()[0].id,'NimboXcloud Virtual Controller');
 await h.select('keyboard-mouse');assert.equal(cached()[0],null);
 await h.select('native');assert.equal(cached()[0],physical);
});

test('an explicit route can be selected after manual native API restoration',async()=>{
 const h=harness();h.ctx.restoreAxes('manual');await h.select('virtual-gamepad');
 assert.equal(h.poll()[0].id,'NimboXcloud Virtual Controller');
});

test('native touch accepts touch and blocks mouse; physical keyboard/mouse accepts mouse and blocks touch',async()=>{
 const h=harness();
 const make=pointerType=>({type:'pointerdown',pointerType,target:{closest:selector=>selector.startsWith('#game-stream')?{}:null},cancelable:true,
  preventDefault(){},stopImmediatePropagation(){this.blocked=true;}});
 await h.select('native-touch');const touch=make('touch'),mouse=make('mouse');h.ctx.gate(touch);h.ctx.gate(mouse);
 assert.equal(touch.blocked,undefined);assert.equal(mouse.blocked,true);
 await h.select('keyboard-mouse');const touch2=make('touch'),mouse2=make('mouse');h.ctx.gate(touch2);h.ctx.gate(mouse2);
 assert.equal(touch2.blocked,true);assert.equal(mouse2.blocked,undefined);
});

test('mode switching exits HUD editing without saving a half-finished edit',async()=>{
 const h=harness();await h.select('virtual-gamepad');h.ui.editingHud=true;
 await h.select('keyboard-mouse');assert.equal(h.ui.editingHud,false);assert.ok(h.calls.some(c=>c[0]==='finish-edit'));
});

test('disposal restores the original SDK flags owned by exclusive selection',async()=>{
 const h=harness();await h.select('virtual-gamepad');await h.ctx.nimboTransport.dispose();
 assert.equal(h.config.enableKeyboardInput,true);assert.equal(h.config.enableMouseInput,true);assert.equal(h.config.enableTouchInput,true);
});

test('native SDK changes are preserved instead of blindly restoring old fields',async()=>{
 const h=harness();await h.select('keyboard-mouse');h.config.enableTouchInput=true;h.config.enableAbsoluteMouse=true;
 await h.select('native');assert.equal(h.config.enableTouchInput,true);assert.equal(h.config.enableAbsoluteMouse,true);
});

test('a replaced session rejects an old transaction and releases routing without starting a HUD on the new owner',async()=>{
 const h=harness();let unblock,started;
 const entered=new Promise(resolve=>{started=resolve;});
 h.raw.updateInputConfigurationAsync=()=>{started();return new Promise(resolve=>{unblock=resolve;});};
 const result=h.select('virtual-gamepad');await entered;
 h.ctx.nimboTransport=h.ctx.transport({...h.raw,configuration:{inputConfiguration:{...h.config}}});
 unblock();await assert.rejects(result,/sessão mudou/);
 assert.equal(h.ui.active,false);assert.equal(h.ctx.routeState.mode,'native');assert.equal(h.status().state,'waiting');
});

test('held physical keys and mouse buttons are released through the SDK before changing its configuration',async()=>{
 const h=harness();await h.select('keyboard-mouse');h.calls.length=0;
 h.ctx.KeyboardEvent=class{constructor(type,options){this.type=type;Object.assign(this,options);}};
 h.ctx.window.NimboInputHost.heldKeys=()=>['KeyW'];
 h.raw.stream={inputManager:{getKeyboardReading:event=>({windowsKey:87,reportType:0,isPressed:event.type==='keydown'})},
  inputChannel:{sendKeyboardInput:reading=>h.calls.push(['keyboard',plain(reading)])}};
 await h.select('virtual-gamepad');
 const release=h.calls.findIndex(c=>c[0]==='keyboard'&&c[1].isPressed===false);
 const config=h.calls.findIndex(c=>c[0]==='config');assert.ok(release>=0&&release<config);
 assert.ok(h.calls.slice(0,config).some(c=>c[0]==='mouse'&&c[1].Buttons===0));
});

test('DOM input gate blocks competing gameplay mouse while preserving HUD, menus and recovery keys',async()=>{
 const h=harness();await h.select('virtual-keyboard-mouse');
 const make=(overrides={})=>({type:'pointermove',pointerType:'mouse',target:{closest:selector=>selector.startsWith('#game-stream')?{}:null},cancelable:true,
  preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...overrides});
 const mouse=make();h.ctx.gate(mouse);assert.equal(mouse.stopped,true);
 const hud=make({target:{closest:()=>({})}});h.ctx.gate(hud);assert.equal(hud.stopped,undefined);
 const escape=make({type:'keydown',code:'Escape'});h.ctx.gate(escape);assert.equal(escape.stopped,undefined);
 const f9=make({type:'keydown',code:'F9'});h.ctx.gate(f9);assert.equal(f9.stopped,undefined);
 h.ctx.openUI=true;const menu=make();h.ctx.gate(menu);assert.equal(menu.stopped,undefined);
});

test('selection persistence happens only after successful activation and storage failure restores the previous mode',async()=>{
 let mode='native',fail=false;const prefs={},calls=[];
 const ctx={NX_INPUT_MODE_KEY:'mode',NX_INPUT_MODES:[{id:'virtual-gamepad',label:'Controle virtual'}],nxInputSelection:{busy:false,message:''},
  getPref:(key,fallback)=>prefs[key]??fallback,setPref:(key,value)=>{if(!fail)prefs[key]=value;},
  nxSelectedInputMode:()=>prefs.mode??'native',nxInputModeLabel:m=>m,renderBody(){},toast(){},
  window:{NimboTouch:{async setInputMode(next){calls.push(next);mode=next;}}}};
 vm.runInNewContext(section(main,'  async function nxChooseInputMode(','  function nxInputModePage(')+'\nglobalThis.choose=nxChooseInputMode;',ctx);
 assert.equal(await ctx.choose('virtual-gamepad'),true);assert.equal(prefs.mode,'virtual-gamepad');
 fail=true;assert.equal(await ctx.choose('native'),false);assert.equal(mode,'virtual-gamepad');assert.equal(prefs.mode,'virtual-gamepad');
});

test('settings search finds accent-insensitive destinations and matches multiple words',()=>{
 const ctx={TABS:[{id:'inputs',label:'Entradas',desc:'Como jogar'},{id:'audio',label:'Áudio',desc:'Som'},{id:'statistics',label:'Estatísticas',desc:'Monitor'},{id:'gamepad',label:'Gamepad',desc:'Controles físicos'}]};
 vm.runInNewContext(section(main,'  function nxSettingsSearch(','  function nxBuildSettingsSearch(')+'\nglobalThis.search=nxSettingsSearch;',ctx);
 assert.equal(ctx.search('audio')[0].id,'audio');assert.equal(ctx.search('controle virtual')[0]?.id,'inputs');
 assert.equal(ctx.search('zona morta')[0].id,'gamepad');assert.equal(ctx.search('fps')[0].id,'statistics');assert.equal(ctx.search('desconhecido').length,0);
});
