// ==UserScript==
// @name         NimboXcloud — HUD Teclado e Mouse (Experimental)
// @namespace    https://github.com/breno-bgod/NimboXcloud/touch
// @version      1.1.7
// @description  Módulo opcional NimboXcloud: mouse relativo, WASD e HUD editável. Experimental; requer suporte K/M do jogo e do SDK.
// @author       KReight / NimboPlay contributors
// @license      MIT
// @match        https://play.xbox.com/*
// @run-at       document-start
// @grant        none
// @supportURL   https://github.com/breno-bgod/NimboXcloud/issues
// ==/UserScript==
/* Extraído do módulo de HUD NimboPlay. Origem do projeto: Better xCloud (redphx, MIT)
   e Even Better xCloud (Endymi0n74). Não inclui seus serviços de entrada ou renderização. */
(function(){'use strict';
/*
NimboPlay is a fork of Better xCloud by redphx.
Original project: https://github.com/redphx/better-xcloud
The upstream authorship and MIT license are retained.

MIT License

Copyright (c) redphx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
const VERSION='1.1.7';
if(window.NimboTouch){console.warn('[NimboXcloud Touch] Outra instância de Nimbo Touch está ativa; evitando duplicação.');return;}
const finite=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
// Separate namespace; read existing HUD data once, without overwriting the fork.
const localStorage={
 getItem(key){try{return window.localStorage.getItem('NimboTouch.'+key)??window.localStorage.getItem(key);}catch{return null;}},
 setItem(key,value){window.localStorage.setItem('NimboTouch.'+key,value);},
 removeItem(key){window.localStorage.removeItem('NimboTouch.'+key);}
};
const errors=[];
const NimboDiag={add(scope,message,detail){errors.push({scope,message,detail:String(detail||''),at:Date.now()});if(errors.length>20)errors.shift();console.warn('[Nimbo Touch]',message,detail||'');},check(){return [];}};
const NimboStore={writeDebounced(key,value){localStorage.setItem(key,value);}};
function eventBus(){const listeners=new Map();return {on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},emit(name,data){for(const fn of listeners.get(name)||[])fn(data);}};}
const BxEventBus={Script:eventBus(),Stream:eventBus()};
const BxEvent={XCLOUD_POLLING_MODE_CHANGED:'nimbo-touch-unused-polling'};
const STATES={isPlaying:false};
const api={streamSession:null,inputChannel:null};
let ui=null,nimboTransport=null,nimboCandidate=null,nimboGameStream=null;
let nimboFiberRoot=null,nimboFiberQueue=[],nimboFiberIndex=0;
const nimboModules=new Set();
let remoteInputAdapter=null;
function remoteInputRequested(){try{return !!(remoteInputAdapter&&typeof remoteInputAdapter.isEnabled==='function'&&remoteInputAdapter.isEnabled());}catch{return false;}}
function remoteInputReady(){try{return remoteInputRequested()&&typeof remoteInputAdapter.isReady==='function'&&remoteInputAdapter.isReady();}catch{return false;}}
function remoteInputAvailable(){try{return remoteInputRequested()&&typeof remoteInputAdapter.isTransportReady==='function'&&remoteInputAdapter.isTransportReady();}catch{return false;}}
function nativeDialogVisible(){
 for(const node of document.querySelectorAll('#dialog-root [role="dialog"],#game-stream [role="dialog"],#gamepass-dialog-root [role="dialog"]')){
  let hidden=false;
  for(let p=node;p;p=p.parentElement){const c=getComputedStyle(p);if(p.hidden||p.getAttribute('aria-hidden')==='true'||c.display==='none'||c.visibility==='hidden'||c.opacity==='0'){hidden=true;break;}}
  if(!hidden){const r=node.getBoundingClientRect();if(r.width>0&&r.height>0)return true;}
 }
 return false;
}
function nimboCapture(raw){
 if(!raw||raw.isShutdown||typeof raw.onVirtualMouseInput!=='function'||typeof raw.updateInputConfigurationAsync!=='function')return false;
 nimboCandidate=raw;
 if(raw.connectionState!=='Connected')return false;
 if(nimboTransport?.raw===raw)return true;
 const old=nimboTransport;
 // Preserve activation intent across a replaced xCloud streaming session.
 const resumeWanted=!!ui?.wanted;
 if(ui)ui.stop(); // Releases held keys and mouse buttons safely.
 if(old)old.dispose().catch(e=>NimboDiag.add('sessão','Falha ao finalizar entrada',e.message));
 nimboTransport=new NimboXboxTransport(raw);
 api.streamSession=nimboTransport.facade;api.inputChannel=nimboTransport.channel;
 STATES.isPlaying=true;
 if(ui){
  ui.mount();
  if(resumeWanted){
   ui.wanted=true;
   ui.desiredSession=api.streamSession;
   ui.retryAt=0;
   ui.ensureResumeWatch();
  }
  touchPanel.refresh();
 }
 return true;
}


class NimboXboxTransport {
  constructor(raw) {
    this.raw=raw;this.previous=null;this.applied=null;this.queue=Promise.resolve();this.buttons=0;
    this.hasInput=false;this.held=new Map();this.flushTimer=null;this.disposed=false;
    this.channel={
      queueMouseInput:reading=>this.mouse(reading),
      sendKeyboardInput:reading=>this.keyboard(reading)
    };
    const service=this;
    this.facade=new Proxy(raw,{get(target,key){
      if(key==='updateInputConfigurationAsync')return options=>service.configure(options);
      const value=Reflect.get(target,key,target);
      return typeof value==='function'?value.bind(target):value;
    }});
  }
  connected(){return !this.disposed&&!this.raw.isShutdown&&this.raw.connectionState==='Connected';}
  assertConnected(){if(!this.connected())throw Error('A sessão não está conectada.');}
  serialize(task){const result=this.queue.catch(()=>{}).then(task);this.queue=result;return result;}
  configure(options){
    return this.serialize(async()=>{
      this.assertConnected();
      // As opções nativas não são convertidas em toque forçado.
      const restore=options.enableKeyboardInput===false&&options.enableMouseInput===false&&options.enableTouchInput===true;
      if(restore&&this.previous)return this.restoreNow();
      const activating=options.enableMouseInput===true&&options.enableKeyboardInput===true;
      if(activating&&!this.previous){
        const config=this.raw.configuration.inputConfiguration;
        this.previous=Object.fromEntries(['enableMouseInput','enableKeyboardInput','enableTouchInput','enableAbsoluteMouse'].map(key=>[key,config[key]]));
      }
      // Keyboard packets are translated directly, never dispatched to the page.
      // Keep the native physical-keyboard configuration at its original value.
      const applied={...options};
      if(activating){
        applied.enableKeyboardInput=this.previous.enableKeyboardInput;
        // O toque nativo permanece como o Xbox o deixou. Desligá-lo deixava a sessão sem
        // nenhuma entrada por toque quando a HUD do Nimbo não estava visível.
        applied.enableTouchInput=typeof this.previous.enableTouchInput==='boolean'?this.previous.enableTouchInput:true;
        this.applied={...applied};
      }
      try{return await nimboApplyInput(this.raw,applied);}
      catch(error){if(activating)try{await this.restoreNow();}catch{}throw error;}
    });
  }
  async restoreNow(){
    if(!this.previous)return;
    const saved=this.previous,applied=this.applied||{},current=this.raw.configuration?.inputConfiguration||{},restore={};
    this.release();
    // Se o Xbox mudou um campo enquanto a HUD estava ativa, respeita a mudança.
    for(const key of Object.keys(saved))if(Object.hasOwn(applied,key)&&Object.is(current[key],applied[key]))restore[key]=saved[key];
    if(!this.raw.isShutdown&&Object.keys(restore).length)await nimboApplyInput(this.raw,restore);
    this.previous=null;this.applied=null;
  }
  restore(){return this.serialize(()=>this.restoreNow());}
  mouse(reading){
    this.assertConnected();
    for(const key of ['X','Y','WheelX','WheelY','Buttons'])if(!Number.isFinite(reading[key]))throw Error('Leitura de mouse inválida.');
    if(reading.Type!==0)throw Error('Este adaptador usa somente mouse relativo.');
    this.hasInput=true;this.buttons=reading.Buttons&31;
    this.raw.onVirtualMouseInput({...reading,Buttons:this.buttons});
  }
  nativeChannel(){return this.raw.stream?.inputChannel;}
  keyboard(reading){
    this.assertConnected();const channel=this.nativeChannel();
    if(typeof channel?.sendKeyboardInput!=='function')throw Error('Canal de teclado indisponível nesta sessão.');
    if(!reading||!Number.isFinite(reading.windowsKey)||!Number.isFinite(reading.reportType))throw Error('O SDK não traduziu esta tecla.');
    channel.sendKeyboardInput(reading);this.hasInput=true;
    if(reading.isPressed)this.held.set(reading.windowsKey,{...reading});else this.held.delete(reading.windowsKey);
    // V2 updates keyboard state without flushing; flush via the official mouse
    // path after its minimum frame interval, preserving held mouse buttons.
    this.flushKeyboard();
  }
  flushKeyboard(){
    if(this.flushTimer!==null)return;
    this.flushTimer=setTimeout(()=>{this.flushTimer=null;if(this.connected())try{
      this.raw.onVirtualMouseInput({Type:0,X:0,Y:0,Buttons:this.buttons,WheelX:0,WheelY:0});
    }catch{}},Math.max(9,Math.min(100,this.raw.configuration?.inputConfiguration?.minTimeBetweenInputFramesMs||9)));
  }
  sendKey(code,pressed,keysDown){
    const manager=this.raw.stream?.inputManager;
    if(typeof manager?.getKeyboardReading!=='function')throw Error('Tradutor de teclado do SDK indisponível.');
    const special={Space:' ',ShiftLeft:'Shift',ControlLeft:'Control',AltLeft:'Alt',Tab:'Tab',Enter:'Enter',Escape:'Escape',Backspace:'Backspace',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
    const key=special[code]??(/^Key[A-Z]$/.test(code)?code.slice(3).toLowerCase():/^Digit[0-9]$/.test(code)?code.slice(5):/^F(?:[1-9]|1[0-2])$/.test(code)?code:null);
    if(key===null)throw Error('Tecla inválida.');
    const event=new KeyboardEvent(pressed?'keydown':'keyup',{code,key,shiftKey:keysDown.has('ShiftLeft'),ctrlKey:keysDown.has('ControlLeft'),altKey:keysDown.has('AltLeft'),repeat:false});
    // Construct and translate only: no synthetic keyboard events reach the DOM.
    this.keyboard(manager.getKeyboardReading(event));
  }
  release(){
    clearTimeout(this.flushTimer);this.flushTimer=null;
    if(!this.hasInput&&!this.held.size&&!this.buttons)return;
    const channel=this.nativeChannel();
    for(const reading of this.held.values())try{channel?.sendKeyboardInput({...reading,isPressed:false});}catch{}
    this.held.clear();this.buttons=0;this.hasInput=false;
    if(!this.raw.isShutdown)try{this.raw.onVirtualMouseInput({Type:0,X:0,Y:0,Buttons:0,WheelX:0,WheelY:0});}catch{}
  }
  async dispose(){if(this.disposed)return;try{await this.restore();}finally{this.release();this.disposed=true;}}
}
function nimboApplyInput(raw,options){return raw.updateInputConfigurationAsync(options);}


const touchPanel={isOpen:false,element:null,launcher:null,quickToggle:null,nxAccess:null,
 mount(){
  if(this.element)return;
  const style=document.createElement('style');style.textContent=`
#nimbo-touch-panel,#nimbo-touch-launcher{font:14px system-ui,sans-serif;box-sizing:border-box;color:#f4f4f4}
#nimbo-touch-launcher{position:fixed;top:8px;right:8px;z-index:10000;border:1px solid #f3cf55;border-radius:12px;background:#202126;padding:10px 14px;touch-action:manipulation;cursor:pointer}
#nimbo-touch-panel{position:fixed;inset:12px;max-width:620px;max-height:calc(100dvh - 24px);margin:auto;overflow:auto;z-index:10010;background:#181b20f5;border:1px solid #66604a;border-radius:16px;padding:18px;overscroll-behavior:contain}
html:has(#__xcu_panel__) #nimbo-touch-launcher{display:none!important}\n#nimbo-touch-panel[hidden]{display:none!important}#nimbo-touch-panel h2{margin:0;font-size:20px}#nimbo-touch-panel p{line-height:1.5;color:#cdd0d5}
#nimbo-touch-panel button,#nimbo-touch-panel select{min-height:44px;border:1px solid #555b66;background:#292d35;color:#fff;border-radius:8px;padding:8px 12px;font:inherit}
#nimbo-touch-panel .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0}#nimbo-touch-panel label{display:block;margin:12px 0}#nimbo-touch-panel input[type=range]{width:100%;accent-color:#ffd43b}
#nimbo-touch-panel .primary{background:#ffd43b;color:#171a20;border-color:#ffd43b}#nimbo-touch-panel pre{white-space:pre-wrap;font-size:12px;max-height:120px;overflow:auto}
#nimbo-touch-root button{font-family:system-ui,sans-serif}#nimbo-touch-root .forma-save{background:#ffd43b;color:#171a20}
#nimbo-touch-root [hidden]{display:none!important}
`;document.documentElement.append(style);
  this.quickToggle=document.createElement('button');this.quickToggle.type='button';this.quickToggle.id='nimbo-touch-quick-toggle';this.quickToggle.setAttribute('aria-label','Alternar NimboTouch');this.quickToggle.style.cssText='position:fixed;left:8px;top:8px;z-index:10002;border:1px solid #7b8998;border-radius:10px;background:rgba(18,23,31,.86);color:white;font:600 12px system-ui;padding:9px 12px;touch-action:manipulation;cursor:pointer';this.quickToggle.onclick=()=>this.toggle.click();document.documentElement.append(this.quickToggle);
  this.nxAccess=document.createElement('button');this.nxAccess.type='button';this.nxAccess.id='nimbo-touch-nx-access';this.nxAccess.textContent='NX';this.nxAccess.setAttribute('aria-label','Abrir ou fechar painel NimboXcloud');this.nxAccess.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483000;border:1px solid #7b8998;border-radius:12px;background:rgba(18,23,31,.92);color:white;font:700 13px system-ui;min-width:46px;min-height:42px;touch-action:manipulation;cursor:pointer';this.nxAccess.addEventListener('pointerdown',e=>{e.stopPropagation();});this.nxAccess.onclick=e=>{e.preventDefault();e.stopPropagation();const shell=document.getElementById('__xcu_panel__');const pill=shell?.firstElementChild;if(pill&&typeof pill.click==='function')pill.click();else{this.status.textContent='Painel NX ainda não disponível.';this.open();}};document.documentElement.append(this.nxAccess);
  this.launcher=document.createElement('button');this.launcher.id='nimbo-touch-launcher';this.launcher.textContent='Nimbo Touch';this.launcher.type='button';this.launcher.onclick=()=>this.isOpen?this.close():this.open();
  this.element=document.createElement('section');this.element.id='nimbo-touch-panel';this.element.hidden=true;this.element.setAttribute('role','dialog');this.element.setAttribute('aria-label','Nimbo Touch — touchpad e HUD');
  const h=document.createElement('h2');h.textContent='Nimbo Touch';this.element.append(h);
  this.status=document.createElement('p');this.status.setAttribute('role','status');this.element.append(this.status);
  const row=document.createElement('div');row.className='row';
  const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;row.append(b);return b;};
  this.toggle=button('Ativar touchpad',async()=>{let remote=remoteInputRequested();if(ui.wanted){ui.stop();if(!remote&&nimboTransport)try{await nimboTransport.restore();}catch(e){NimboDiag.add('entrada','Falha ao restaurar toque nativo',e.message);this.status.textContent='Não foi possível restaurar o toque nativo: '+e.message;return;}this.refresh();return;}if(remote&&!remoteInputAvailable()){if(remoteInputRequested()){this.status.textContent='Sessão xHome ou vídeo indisponível. Aguarde a conexão.';return;}remote=false;}if(!remote&&!nimboTransport?.connected()){this.status.textContent='Sessão ainda não encontrada. Abra um jogo e aguarde.';return;}this.close();await ui.start();this.refresh();});this.toggle.className='primary';
  button('Editar HUD',()=>{this.close();ui.mount();ui.editHud();});
  button('Fechar',()=>this.close());this.element.append(row);
  const profileLabel=document.createElement('label');profileLabel.textContent='Perfil da HUD';this.profiles=document.createElement('select');this.profiles.style.cssText='display:block;width:100%;margin-top:8px';this.profiles.onchange=()=>{ui.switchProfile(this.profiles.value);this.refresh();};profileLabel.append(this.profiles);this.element.append(profileLabel);
  const duplicate=document.createElement('button');duplicate.textContent='Duplicar perfil';duplicate.onclick=()=>{const name=prompt('Nome do novo perfil:');if(name?.trim()){ui.duplicateProfile(name.trim().slice(0,60));this.refresh();}};this.element.append(duplicate);
  for(const [key,title,min,max]of [['sensitivity','Velocidade do touchpad',.05,50],['gainX','Sensibilidade horizontal',.1,5],['gainY','Sensibilidade vertical',.1,5]]){
   const label=document.createElement('label'),caption=document.createElement('span'),slider=document.createElement('input');slider.type='range';slider.min=min;slider.max=max;slider.step=key==='sensitivity'?'.05':'.1';slider.value=ui[key];caption.textContent=title+': '+Number(ui[key]).toFixed(1);slider.setAttribute('aria-label',title);
   slider.oninput=()=>{ui[key]=Number(slider.value);caption.textContent=title+': '+ui[key].toFixed(1);};
   slider.onchange=()=>{try{localStorage.setItem('BxTouchpad.motion.v7',JSON.stringify({version:1,touchGain:ui.sensitivity,touchX:ui.gainX,touchY:ui.gainY}));}catch(e){NimboDiag.add('dados','Não foi possível salvar sensibilidade',e.message);}};label.append(caption,slider);this.element.append(label);
  }
  const recoilBox=document.createElement('section');recoilBox.style.cssText='border:1px solid #555b66;border-radius:10px;padding:12px;margin:12px 0';const recoilTitle=document.createElement('strong');recoilTitle.textContent='Compensação vertical · modo casual';recoilBox.append(recoilTitle);
  const recoilEnabled=document.createElement('label');const recoilCheck=document.createElement('input');recoilCheck.type='checkbox';recoilCheck.checked=!!ui.recoilConfig?.enabled;recoilEnabled.append(recoilCheck,document.createTextNode(' Ativar durante o disparo virtual (desligado por padrão)'));recoilBox.append(recoilEnabled);
  const recoilSlider=(name,key,min,max,step)=>{const label=document.createElement('label'),caption=document.createElement('span'),slider=document.createElement('input');slider.type='range';slider.min=min;slider.max=max;slider.step=step;slider.value=ui.recoilConfig?.[key]??min;const refresh=()=>caption.textContent=name+': '+slider.value+(key==='delay'?' ms':' unidades/passo');refresh();slider.oninput=()=>{refresh();ui.setRecoilConfig({[key]:Number(slider.value)});};label.append(caption,slider);recoilBox.append(label);return slider;};
  recoilCheck.onchange=()=>ui.setRecoilConfig({enabled:recoilCheck.checked});recoilSlider('Intensidade','strength',0,8,.25);recoilSlider('Atraso','delay',0,300,25);const recoilNote=document.createElement('p');recoilNote.textContent='Aplica pequenos movimentos relativos para baixo somente enquanto o botão virtual de disparo estiver pressionado. Não detecta alvos; ajuste conforme a sensibilidade do jogo.';recoilBox.append(recoilNote);this.element.append(recoilBox);
  const note=document.createElement('p');note.textContent='No editor, arraste os controles, adicione uma tecla vazia e escolha seu comando, tamanho e opacidade. O joystick envia WASD. O jogo precisa aceitar mouse e teclado.';this.element.append(note);
  const diag=document.createElement('button');diag.textContent='Mostrar diagnóstico';this.report=document.createElement('pre');this.report.hidden=true;diag.onclick=()=>{this.report.hidden=!this.report.hidden;this.report.textContent=JSON.stringify(diagnostic(),null,2);};this.element.append(diag,this.report);
  this.reparent();this.refresh();
 },
 reparent(){const host=document.fullscreenElement||document.documentElement;for(const el of [this.element,this.launcher,this.quickToggle,this.nxAccess])if(el&&el.parentElement!==host)host.append(el);},
 open(){if(!ui||ui.editingHud)return;this.mount();this.isOpen=true;ui.pause('Configurações do touchpad');this.element.hidden=false;this.reparent();this.refresh();},
 close(){this.isOpen=false;if(this.element)this.element.hidden=true;ui?.ensureResumeWatch();},
 refresh(){if(!ui||!this.element)return;this.status.textContent=remoteInputRequested()?(remoteInputAvailable()?(ui.wanted?'xHome conectado · HUD ligada'+(ui.active?'':' · pausada temporariamente'):'xHome conectado · HUD desligada'):'Aguardando sessão xHome e vídeo ativo.'):nimboTransport?.connected()?(ui.wanted?'Touchpad ligado'+(ui.active?'':' · pausado enquanto o painel estiver aberto'):'Sessão conectada · touchpad desligado'):'Aguardando sessão do xCloud. Você já pode editar a HUD.';this.toggle.textContent=ui.wanted?'Desativar touchpad':'Ativar touchpad';this.launcher.textContent=ui.wanted?'Touchpad ligado':'Nimbo Touch';if(this.quickToggle){this.quickToggle.textContent=ui.wanted?'Touch: ON':'Touch: OFF';this.quickToggle.hidden=true;this.quickToggle.setAttribute('aria-pressed',String(!!ui.wanted));}if(this.nxAccess)this.nxAccess.hidden=true;
 const signature=JSON.stringify(ui.profileStore?.profiles.map(p=>[p.id,p.name]));if(signature!==this.signature){this.signature=signature;this.profiles.replaceChildren();for(const p of ui.profileStore?.profiles||[]){const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name;this.profiles.append(opt);}}this.profiles.value=ui.profileStore?.activeId||'';
 }
};
function diagnostic(){return {version:VERSION,connected:!!nimboTransport?.connected(),remoteInput:remoteInputRequested(),remoteInputReady:remoteInputReady(),wanted:!!ui?.wanted,active:!!ui?.active,editing:!!ui?.editingHud,hidden:document.hidden,pointerLock:!!document.pointerLockElement,lastTouch:ui?.lastTouchEvent,viewport:[innerWidth,innerHeight],errors:errors.map(e=>({...e,detail:e.detail.replace(/https?:\/\/\S+/g,'[URL]')}))};}


class BxTouchpad {
  constructor() {
    this.active = false;
    this.loadBindings();
    this.busy = false;
    this.epoch = 0;
    this.buttons = 0;
    this.pointers = new Map();
    this.remainder = [0, 0];
    this.sensitivity = 1;
    try { const n = Number(localStorage.getItem('BxTouchpad.sensitivity')); if (n >= .1 && n <= 5) this.sensitivity = n; } catch {}
    BxEventBus.Stream.on('state.playing', () => this.mount());
    BxEventBus.Stream.on('state.stopped', () => this.destroy());
    BxEventBus.Script.on('dialog.shown', () => this.pause('Painel aberto'));
    window.addEventListener('blur', () => this.pause('Janela sem foco'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause('Página oculta'); });
    document.addEventListener('fullscreenchange', () => this.reparent());
  }
  static keyOptions() {
    const codes = ['Mouse0','Mouse2','Space','ShiftLeft','ControlLeft','AltLeft','Tab','Enter','Escape','Backspace', 'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    for (let i = 65; i <= 90; i++) codes.push('Key' + String.fromCharCode(i));
    for (let i = 0; i <= 9; i++) codes.push('Digit' + i);
    for (let i = 1; i <= 12; i++) codes.push('F' + i);
    return codes;
  }
  loadBindings() {
    this.keysDown = new Set();
    this.buttonPage = 0;
    this.bindings = [
      {label:'W', code:'KeyW', slot:'w'}, {label:'A',code:'KeyA',slot:'a'},
      {label:'S',code:'KeyS',slot:'s'}, {label:'D',code:'KeyD',slot:'d'},
      {label:'Atirar',code:'Mouse0',slot:'fire'}, {label:'Mirar',code:'Mouse2',slot:'aim'},
      {label:'Pular',code:'Space'}, {label:'Correr',code:'ShiftLeft'},
      {label:'Agachar',code:'ControlLeft'}, {label:'Recarregar',code:'KeyR'},
      {label:'Interagir',code:'KeyF'}, {label:'Trocar arma',code:'Digit2'},
      {label:'Granada',code:'KeyG'}, {label:'Mapa',code:'Tab'}
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('BxTouchpad.bindings.v2') || 'null');
      const slots = ['w','a','s','d','fire','aim'];
      if (Array.isArray(saved) && saved.length >= 6 && saved.length <= 26 &&
          saved.every(b => b && typeof b.label === 'string' && b.label.length <= 24 && BxTouchpad.keyOptions().includes(b.code)) &&
          slots.every(slot => saved.filter(b => b.slot === slot).length === 1) &&
          saved.every(b => !b.slot || slots.includes(b.slot))) this.bindings = saved;
    } catch {}
  }
  // Feed the SDK's own DOM keyboard translator; do not guess its wire format.
  // Observe the exposed channel to detect synchronous forwarding, and stop with
  // an explicit error when the client rejects synthetic keys.
  sendKey(code,pressed){
    if(remoteInputRequested()){
      const ready=remoteInputReady();
      if(pressed&&!ready&&remoteInputRequested())throw Error('Sessão xHome indisponível.');
      if(remoteInputRequested()){
        if(remoteInputAdapter.sendKey(code,!!pressed,'touch')===false)throw Error('Canal de entrada xHome indisponível.');
        return;
      }
    }
    if(!nimboTransport)throw Error('Sessão não encontrada');
    nimboTransport.sendKey(code,pressed,this.keysDown);
  }
  syncKeys(wanted) {
    // Releases first, presses second; shared mappings stay held until all fingers lift.
    const old = new Set(this.keysDown);
    this.keysDown = new Set(wanted);
    try {
      for (const code of old) if (!wanted.has(code)) this.sendKey(code, false);
      for (const code of wanted) if (!old.has(code)) this.sendKey(code, true);
    } catch (error) {
      // Include previous and newly requested keys in cleanup after partial failure.
      this.keysDown = new Set([...old, ...wanted]);
      throw error;
    }
  }
  releaseKeys() {
    const held = [...this.keysDown]; this.keysDown.clear();
    for (const code of held) try { this.sendKey(code, false); } catch (error) { console.warn('[BxTouchpad] Key release:',code,error.message); }
  }
  renderMappedButtons() {
    if (!this.mapped) return;
    this.mapped.replaceChildren();
    const extras = this.bindings.filter(b => !b.slot);
    const pages = Math.max(1, Math.ceil(extras.length / 4));
    this.buttonPage %= pages;
    if (this.pageButton) this.pageButton.textContent = `Botões ${this.buttonPage + 1}/${pages}`;
    for (const binding of this.bindings) {
      const index = extras.indexOf(binding);
      if (!binding.slot && Math.floor(index / 4) !== this.buttonPage) continue;
      const button = document.createElement('button'); button.className = 'mapped-button';
      button.textContent = binding.label; button.title = binding.code;
      if (binding.slot) button.dataset.slot = binding.slot;
      this.bindSurface(button, 'binding', binding.code);
      this.mapped.appendChild(button);
    }
  }
  editBindings() {
    this.stop();
    if (this.editor) return;
    const panel = this.editor = document.createElement('div'); panel.className = 'mapping-editor';
    const title = document.createElement('h3'); title.textContent = 'Mapear botões';
    const note = document.createElement('p'); note.textContent = 'Segure para manter a tecla pressionada. Ajuste as teclas conforme as configurações do jogo. As alterações ficam salvas neste navegador.';
    const rows = document.createElement('div');
    let draft = this.bindings.map(b => ({...b}));
    const draw = () => {
      rows.replaceChildren();
      draft.forEach((binding, index) => {
        const row = document.createElement('div'); row.className = 'mapping-row';
        const name = document.createElement('input'); name.type = 'text'; name.maxLength = 24; name.value = binding.label; name.setAttribute('aria-label','Nome do botão');
        name.oninput = () => { binding.label = name.value; };
        const select = document.createElement('select'); select.setAttribute('aria-label','Tecla de ' + binding.label);
        for (const code of BxTouchpad.keyOptions()) { const option = document.createElement('option'); option.value = code; option.textContent = code; select.append(option); }
        select.value = binding.code; select.onchange = () => { binding.code = select.value; };
        row.append(name,select);
        if (!binding.slot) { const remove = document.createElement('button'); remove.textContent = 'Remover'; remove.onclick = () => { draft.splice(index,1); draw(); }; row.append(remove); }
        rows.append(row);
      });
    };
    draw();
    const add = document.createElement('button'); add.textContent = '+ Botão'; add.onclick = () => { if (draft.length < 26) { draft.push({label:'Novo botão',code:'KeyE'}); draw(); } };
    const save = document.createElement('button'); save.textContent = 'Salvar'; save.onclick = () => {
      draft = draft.map(b => ({...b,label:b.label.trim() || b.code}));
      try { localStorage.setItem('BxTouchpad.bindings.v2',JSON.stringify(draft)); }
      catch { note.textContent = 'Não foi possível salvar. Libere o armazenamento do navegador e tente novamente.'; return; }
      this.bindings = draft; this.renderMappedButtons(); panel.remove(); this.editor = null;
    };
    const cancel = document.createElement('button'); cancel.textContent = 'Cancelar'; cancel.onclick = () => { panel.remove(); this.editor = null; };
    panel.append(title,note,rows,add,save,cancel); this.root.append(panel);
  }

  send(x = 0, y = 0) {
    if(remoteInputRequested()){
      const neutral=!x&&!y&&!this.buttons,ready=remoteInputReady();
      if(!neutral&&!ready&&remoteInputRequested())throw Error('Sessão xHome indisponível.');
      if(remoteInputRequested()){
        if(remoteInputAdapter.sendMouse({X:x,Y:y,Buttons:this.buttons,WheelX:0,WheelY:0,Relative:1},'touch',neutral)===false)throw Error('Canal de mouse xHome indisponível.');
        return;
      }
    }
    const channel = api?.inputChannel;
    if (typeof channel?.queueMouseInput !== 'function') throw Error('Canal de mouse indisponível. Os patches podem estar incompatíveis com o site.');
    channel.queueMouseInput({Type: 0, X: x, Y: y, Buttons: this.buttons, WheelX: 0, WheelY: 0});
  }
  move(dx, dy) {
    this.remainder[0] += dx * this.sensitivity;
    this.remainder[1] += dy * this.sensitivity;
    const x = Math.trunc(this.remainder[0]), y = Math.trunc(this.remainder[1]);
    this.remainder[0] -= x; this.remainder[1] -= y;
    // Split large movements rather than silently dropping distance.
    let rx = x, ry = y;
    while (rx || ry) { const sx = Math.max(-32767, Math.min(32767, rx)), sy = Math.max(-32767, Math.min(32767, ry)); this.send(sx, sy); rx -= sx; ry -= sy; }
  }
  async start() {
    if (this.busy || this.active) return;
    const remote=remoteInputRequested();
    if(remote&&!remoteInputReady()) { this.status.textContent='Aguardando sessão xHome conectada e vídeo ativo.'; return; }
    if(!remote&&!nimboTransport?.connected()) { this.status.textContent='Abra um jogo; aguardando a conexão com a sessão.'; return; }
    if(!remote&&(typeof api.inputChannel?.queueMouseInput !== 'function' || typeof api.streamSession?.updateInputConfigurationAsync !== 'function')) { this.status.textContent='Canal indisponível; verifique a compatibilidade dos patches.'; return; }
    this.busy = true;
    const epoch = ++this.epoch;
    const session = remote?null:api.streamSession;
    try {
      if(!remote) await session.updateInputConfigurationAsync({enableKeyboardInput: true, enableMouseInput: true, enableAbsoluteMouse: false, enableTouchInput: false});
      if (epoch !== this.epoch || !this.root) return;
      this.active = true; this.buttons = 0; this.remainder = [0, 0]; this.send();
      this.pad.hidden = false; this.mapped.hidden = false;
      this.toggle.textContent = 'Pausar touchpad';
      this.status.textContent = remote?'Ativo — NimboTouch encaminhando comandos ao Xbox via xHome.':'Ativo — WASD à esquerda; arraste à direita. Teclado virtual experimental.';
    } catch (error) { this.handleInputFailure(error); if (this.status) this.status.textContent = 'Falha temporária: ' + error.message; }
    finally { this.busy = false; }
  }
  stop() {
    ++this.epoch;
    this.releaseKeys();
    if (this.active) { this.buttons = 0; try { this.send(); } catch {} }
    this.active = false; this.pointers.clear(); this.remainder = [0, 0];
    if (this.pad) { this.pad.hidden = true; this.mapped.hidden = true; this.toggle.textContent = 'Ativar touchpad'; this.status.textContent = 'Pausado — comandos de mouse soltos.'; }
    // stop() releases virtual inputs immediately. The transport restores the
    // original Xbox input configuration on explicit stop; pause() retains it
    // temporarily for editor, focus and fullscreen transitions.
  }
  bindSurface(element, kind, code = null) {
    element.addEventListener('pointerdown', e => {
      if (!this.active || e.pointerType !== 'touch') return;
      e.preventDefault(); e.stopPropagation();
      if (kind === 'pad' && [...this.pointers.values()].some(p => p.kind === 'pad')) return;
      element.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, {kind, code, x: e.clientX, y: e.clientY});
      this.updateButtons();
    });
    element.addEventListener('pointermove', e => {
      const p = this.pointers.get(e.pointerId); if (!p || !this.active) return;
      e.preventDefault(); e.stopPropagation();
      try { if (p.kind === 'pad') this.move(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY; }
      catch (error) { this.stop(); this.status.textContent = error.message; }
    });
    const release = e => { if (!this.pointers.delete(e.pointerId)) return; e.stopPropagation(); this.updateButtons(); };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(type, release);
    element.addEventListener('contextmenu', e => e.preventDefault());
  }
  updateButtons() {
    let buttons = 0; const wanted = new Set();
    for (const p of this.pointers.values()) {
      if (p.code === 'Mouse0') buttons |= 1;
      else if (p.code === 'Mouse2') buttons |= 2;
      else if (p.kind === 'binding') wanted.add(p.code);
    }
    this.buttons = buttons;
    if (this.active) try { this.send(); this.syncKeys(wanted); }
    catch (error) { this.stop(); this.status.textContent = error.message; }
  }
  reparent() { if (this.root) (document.fullscreenElement || document.documentElement).appendChild(this.root); }
  mount() {
    if (this.root) return;
    const root = this.root = document.createElement('div'); root.id = 'nimbo-touch-root';
    const style = document.createElement('style');
    style.textContent = `#nimbo-touch-root{position:fixed;inset:0;z-index:2500;pointer-events:none;font:12px Arial;color:white}#nimbo-touch-root [hidden]{display:none!important}#nimbo-touch-root button,#nimbo-touch-root input{pointer-events:auto}#nimbo-touch-root button{background:#143c29e8;color:white;border:1px solid #ffffff88;border-radius:9px;padding:10px;min-height:44px}#nimbo-touch-root .toolbar{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:#111d;padding:6px;border-radius:8px;max-width:65vw;pointer-events:auto}#nimbo-touch-root .status{display:block;max-width:360px;margin-top:4px}#nimbo-touch-root .pad{position:absolute;right:0;top:24%;bottom:86px;width:56%;pointer-events:auto;touch-action:none;user-select:none;background:transparent;border:0;box-sizing:border-box}#nimbo-touch-root.hud-editing .pad{border:1px dashed #ffffff80}#nimbo-touch-root .pad span{position:absolute;bottom:12px;right:12px;opacity:.5}#nimbo-touch-root .action{position:absolute;bottom:18px;touch-action:none;user-select:none;width:80px;height:64px}#nimbo-touch-root .fire{left:18px}#nimbo-touch-root .aim{left:110px}`;
    style.textContent += `#nimbo-touch-root .mapped{position:absolute;inset:0;pointer-events:none}#nimbo-touch-root .mapped-button{pointer-events:auto;touch-action:none;user-select:none;min-width:54px;min-height:54px}#nimbo-touch-root .mapped-button[data-slot]{position:absolute}#nimbo-touch-root [data-slot=w]{left:76px;bottom:168px}#nimbo-touch-root [data-slot=a]{left:16px;bottom:108px}#nimbo-touch-root [data-slot=s]{left:76px;bottom:108px}#nimbo-touch-root [data-slot=d]{left:136px;bottom:108px}#nimbo-touch-root [data-slot=fire]{left:16px;bottom:18px}#nimbo-touch-root [data-slot=aim]{left:106px;bottom:18px}#nimbo-touch-root .mapped{display:flex;justify-content:flex-end;align-items:flex-end;gap:6px;padding:8px 8px 12px 205px;box-sizing:border-box;overflow-x:auto}#nimbo-touch-root .mapped-button:not([data-slot]){flex-shrink:0;max-width:100px;padding:6px}#nimbo-touch-root .mapping-editor{position:absolute;inset:8px 5%;background:#161b20;color:white;padding:12px;overflow:auto;pointer-events:auto;border:1px solid #888;border-radius:12px}#nimbo-touch-root .mapping-row{display:flex;gap:6px;margin:8px 0}#nimbo-touch-root .mapping-row input{width:40%;min-width:0}#nimbo-touch-root select{pointer-events:auto;background:white;color:black;min-height:44px}#nimbo-touch-root .mapping-editor button{margin:4px}#nimbo-touch-root .toolbar input[type=range]{max-width:100px}`;
    const toolbar = document.createElement('div'); toolbar.className = 'toolbar';
    this.toggle = document.createElement('button'); this.toggle.textContent = 'Ativar touchpad';
    this.toggle.onclick = () => this.active ? this.stop() : this.start();
    const label = document.createElement('label'); label.textContent = ' Sensibilidade ';
    const slider = document.createElement('input'); slider.type = 'range'; slider.min = '.1'; slider.max = '5'; slider.step = '.1'; slider.value = String(this.sensitivity); slider.setAttribute('aria-label', 'Sensibilidade do touchpad');
    const value = document.createElement('span'); value.textContent = this.sensitivity.toFixed(1);
    slider.oninput = () => { this.sensitivity = Number(slider.value); value.textContent = this.sensitivity.toFixed(1); NimboStore.writeDebounced('BxTouchpad.sensitivity', String(this.sensitivity)); };
    this.status = document.createElement('span'); this.status.className = 'status'; this.status.textContent = 'Mouse por toque experimental. Ative durante a partida.';
    const map = document.createElement('button'); map.textContent = 'Mapear botões'; map.onclick = () => this.editBindings();
    this.pageButton = document.createElement('button'); this.pageButton.onclick = () => { this.stop(); this.buttonPage++; this.renderMappedButtons(); };
    label.append(slider, value); toolbar.append(this.toggle, map, this.pageButton, label, this.status);
    this.pad = document.createElement('div'); this.pad.className = 'pad'; this.pad.hidden = true;
    const hint = document.createElement('span'); hint.textContent = 'Arraste para mover a mira'; this.pad.append(hint);
    this.mapped = document.createElement('div'); this.mapped.className = 'mapped'; this.mapped.hidden = true;
    this.renderMappedButtons(); this.bindSurface(this.pad, 'pad');
    root.append(style, this.pad, this.mapped, toolbar); this.reparent();
  }
  destroy() { this.stop(); this.root?.remove(); this.root = null; this.editor = null; }
}

class BxTouchpadHud extends BxTouchpad {
  constructor() {
    super();
    this.hud = this.readHud();
    this.editingHud = false;
    this.elements = new Map();
    
    window.addEventListener('resize', () => {
      // A resized viewport changes touch geometry; never keep a direction held.
      if (this.active || this.wanted) this.pause('Mudança do tamanho da tela');
      this.applyAllGeometry();
    });
  }
  readHud() {
    try {
      const data = JSON.parse(localStorage.getItem('BxTouchpad.hud.v4') || 'null');
      if (data?.version === 1 && data.items && typeof data.items === 'object' && !Array.isArray(data.items)) {
        const items = Object.create(null);
        for (const [id, item] of Object.entries(data.items)) {
          if (!item || !['x','y','size','opacity'].every(k => Number.isFinite(item[k]))) continue;
          items[id] = {x: Math.max(0,Math.min(1,item.x)), y: Math.max(0,Math.min(1,item.y)), size: Math.max(32,Math.min(200,item.size)), opacity:Math.max(0,Math.min(1,item.opacity)), visible:item.visible !== false};
          if (Number.isFinite(item.w)) items[id].w = Math.max(.1,Math.min(1,item.w));
          if (Number.isFinite(item.h)) items[id].h = Math.max(.1,Math.min(1,item.h));
        }
        return {version:1,items};
      }
    } catch {}
    return {version:1,items:Object.create(null)};
  }
  normalizeIds() {
    const used = new Set(['joystick','pad']);
    this.bindings.forEach((b,index) => {
      let id = b.slot || (typeof b.id === 'string' && /^[\w-]{1,60}$/.test(b.id) ? b.id : 'extra-' + index);
      while (used.has(id)) id += '-x';
      b.id = id; used.add(id);
    });
  }
  defaultGeometry(id) {
    if (id === 'joystick') return {x:.15,y:.73,size:112,opacity:.5,visible:true};
    if (id === 'pad') return {x:.70,y:.49,size:60,w:.59,h:.86,opacity:.3,visible:true};
    if (id === 'fire') return {x:.12,y:.23,size:56,opacity:.5,visible:true};
    if (id === 'aim') return {x:.87,y:.23,size:56,opacity:.5,visible:true};
    const index = Math.max(0,this.bindings.filter(b=>!['w','a','s','d','fire','aim'].includes(b.slot)).findIndex(b=>b.id === id));
    const positions = [[.92,.57],[.32,.78],[.91,.77],[.80,.88],[.70,.88],[.60,.88],[.74,.64],[.48,.89]];
    const pos = positions[index] || [.40 + ((index-8)%5)*.11,.38-Math.floor((index-8)/5)*.1];
    return {x:pos[0],y:pos[1],size:46,opacity:.45,visible:true};
  }
  geometry(id) {
    const g = this.hud.items[id] || (this.hud.items[id] = this.defaultGeometry(id));
    if (id === 'pad') {if (!Number.isFinite(g.w)) g.w=.59;if (!Number.isFinite(g.h)) g.h=.86;}
    return g;
  }
  viewport() {
    const rect = this.root?.getBoundingClientRect();
    return {width:rect?.width || window.innerWidth,height:rect?.height || window.innerHeight};
  }
  applyGeometry(id, element) {
    const g = this.geometry(id), v = this.viewport();
    const w = id === 'pad' ? g.w * v.width : Math.min(g.size,v.width,v.height);
    const h = id === 'pad' ? g.h * v.height : Math.min(g.size,v.width,v.height);
    // Store relative centers; clamp only the displayed coordinates on rotation.
    const x = Math.max(w/2,Math.min(v.width-w/2,g.x*v.width));
    const y = Math.max(h/2,Math.min(v.height-h/2,g.y*v.height));
    Object.assign(element.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px',opacity:String(this.editingHud ? Math.max(.4,g.opacity) : g.opacity)});
    element.hidden = !this.editingHud && (!this.active || !g.visible);
    element.classList.toggle('hud-selected',this.editingHud && this.selectedId === id);
  }
  applyAllGeometry() {
    if (!this.elements) return;
    for (const [id,element] of this.elements) this.applyGeometry(id,element);
  }
  register(id, element, label) {
    element.dataset.hudId = id; element.setAttribute('aria-label',label);
    this.elements.set(id,element);
    this.registeredElements ||= new WeakSet();
    if (this.registeredElements.has(element)) {this.applyGeometry(id,element);return;}
    this.registeredElements.add(element);
    // Capture phase: editing must never send game input.
    element.addEventListener('pointerdown',e => {
      if (!this.editingHud) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (this.drag) return;
      this.selectHud(id);
      element.setPointerCapture(e.pointerId);
      const rect = element.getBoundingClientRect();
      this.drag = {id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,cx:rect.left+rect.width/2,cy:rect.top+rect.height/2};
    },true);
    element.addEventListener('pointermove',e => {
      if (!this.editingHud || this.drag?.pointerId !== e.pointerId) return;
      e.preventDefault();e.stopImmediatePropagation();
      const v = this.viewport(), g = this.geometry(id), r = this.root.getBoundingClientRect();
      g.x = Math.max(0,Math.min(1,(this.drag.cx + e.clientX-this.drag.x-r.left)/v.width));
      g.y = Math.max(0,Math.min(1,(this.drag.cy + e.clientY-this.drag.y-r.top)/v.height));
      this.applyGeometry(id,element);
    },true);
    const finish = e => {
      if (!this.editingHud) return;
      e.stopImmediatePropagation();
      if (this.drag?.pointerId === e.pointerId) this.drag = null;
    };
    for (const type of ['pointerup','pointercancel','lostpointercapture']) element.addEventListener(type,finish,true);
    this.applyGeometry(id,element);
  }
  renderMappedButtons() {
    if (!this.mapped) return;
    this.normalizeIds();
    this.mapped.replaceChildren();
    this.elements = new Map();
    if (this.pad) this.register('pad',this.pad,'Área de mira');
    const stick = this.stick = document.createElement('div'); stick.className = 'hud-stick';
    stick.setAttribute('role','group');
    this.knob = document.createElement('span'); this.knob.className = 'hud-stick-knob';
    const hint = document.createElement('span'); hint.className = 'hud-stick-label'; hint.textContent = 'WASD';
    stick.append(this.knob,hint); this.mapped.append(stick); this.register('joystick',stick,'Joystick que envia WASD');
    this.bindJoystick(stick);
    for (const binding of this.bindings) {
      if (['w','a','s','d'].includes(binding.slot)) continue;
      const button = document.createElement('button');button.type = 'button';button.className = 'hud-button';
      button.textContent = binding.label;button.title = binding.code;
      this.mapped.append(button);this.register(binding.id,button,binding.label);
      this.bindSurface(button,'binding',binding.code);
    }
    if (this.pageButton) this.pageButton.hidden = true;
    this.applyAllGeometry();
  }
  static stickDirections(x,y) {
    if (Math.hypot(x,y) < .24) return [];
    const result = [];
    // Digital 8-way movement: no analog/gamepad commands are emitted.
    if (x < -.38) result.push('a');
    if (x > .38) result.push('d');
    if (y < -.38) result.push('w');
    if (y > .38) result.push('s');
    return result;
  }
  bindJoystick(element) {
    const update = e => {
      const p = this.pointers.get(e.pointerId);if (!p || p.kind !== 'joystick') return;
      const r = element.getBoundingClientRect(), radius = r.width/2;
      let x = (e.clientX-r.left-radius)/radius, y = (e.clientY-r.top-r.height/2)/(r.height/2);
      const length = Math.hypot(x,y);if (length > 1) {x/=length;y/=length;}
      p.codes = BxTouchpadHud.stickDirections(x,y).map(slot=>this.bindings.find(b=>b.slot===slot)?.code).filter(Boolean);
      this.knob.style.transform = `translate(${x*radius*.5}px,${y*radius*.5}px)`;
      this.updateButtons();
    };
    element.addEventListener('pointerdown',e => {
      if (!this.active || this.editingHud || e.pointerType !== 'touch') return;
      e.preventDefault();e.stopPropagation();
      if ([...this.pointers.values()].some(p=>p.kind==='joystick')) return;
      element.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId,{kind:'joystick',codes:[]}); update(e);
    });
    element.addEventListener('pointermove',e => {if (this.pointers.get(e.pointerId)?.kind !== 'joystick') return;e.preventDefault();e.stopPropagation();update(e);});
    const release = e => {
      if (this.pointers.get(e.pointerId)?.kind !== 'joystick') return;
      this.pointers.delete(e.pointerId);this.knob.style.transform = 'translate(0,0)';e.stopPropagation();this.updateButtons();
    };
    for (const type of ['pointerup','pointercancel','lostpointercapture']) element.addEventListener(type,release);
    element.addEventListener('contextmenu',e=>e.preventDefault());
  }
  updateButtons() {
    let buttons = 0; const wanted = new Set();
    for (const p of this.pointers.values()) {
      const codes = p.kind === 'joystick' ? p.codes : p.kind === 'binding' ? [p.code] : [];
      for (const code of codes) {
        if (code === 'Mouse0') buttons |= 1;
        else if (code === 'Mouse2') buttons |= 2;
        else wanted.add(code);
      }
    }
    this.buttons = buttons;
    if (this.active) try { this.send();this.syncKeys(wanted); }
    catch (error) {this.stop();this.status.textContent = error.message;this.showMenu(true);}
  }
  
  openTouchSettings(){touchPanel.open();}
  showMenu(show) {
    if (!this.toolbar) return;
    this.toolbar.hidden = !show;
  }
  async start() {
    if (this.editingHud || this.editor) return;
    await super.start();
    if (this.active) {this.applyAllGeometry();this.showMenu(false);}
  }
  stop() {
    super.stop();
    if (this.knob) this.knob.style.transform = 'translate(0,0)';
    if (this.toolbar) this.showMenu(true);
  }
  selectHud(id) {
    this.selectedId = id;
    this.applyAllGeometry();
    if (!this.properties) return;
    const g = this.geometry(id);
    const binding = this.bindings.find(b=>b.id===id);
    this.properties.options.value = id;
    this.properties.title.textContent = id==='joystick'?'Joystick WASD':id==='pad'?'Área de mira':binding?.label || id;
    this.properties.size.value = g.size;this.properties.size.disabled = id==='pad';
    this.properties.opacity.value = Math.round(g.opacity*100);
    this.properties.visible.checked = g.visible;
    this.properties.w.value = Math.round((g.w || .59)*100);
    this.properties.h.value = Math.round((g.h || .86)*100);
    this.properties.area.hidden = id!=='pad';
    this.properties.sizeText.textContent = g.size+' px';this.properties.opacityText.textContent = Math.round(g.opacity*100)+'%';
    this.properties.wText.textContent = Math.round((g.w || .59)*100)+'%';this.properties.hText.textContent = Math.round((g.h || .86)*100)+'%';
  }
  editHud() {
    this.stop();if (this.editingHud || this.editor) return;
    this.snapshot = JSON.stringify(this.hud);this.editingHud = true;this.showMenu(false);
    this.mapped.hidden = false;this.pad.hidden = false;this.root.classList.add('hud-editing');
    const panel = this.hudPanel = document.createElement('div');panel.className = 'hud-properties';
    const title = document.createElement('strong');
    const note = document.createElement('span');note.textContent = 'Arraste os controles. Toque para ajustar.';
    const options = document.createElement('select');options.setAttribute('aria-label','Selecionar controle');
    for (const [id,el] of this.elements) {const option=document.createElement('option');option.value=id;option.textContent=el.getAttribute('aria-label');options.append(option);}
    options.onchange=()=>this.selectHud(options.value);
    const range = (name,min,max) => {
      const label=document.createElement('label');label.textContent=name+' ';
      const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.setAttribute('aria-label',name);
      const value=document.createElement('span');label.append(input,value);return {label,input,value};
    };
    const size=range('Tamanho',32,200),opacity=range('Opacidade',0,100),w=range('Largura da mira',10,100),h=range('Altura da mira',10,100);
    const area=document.createElement('div');area.append(w.label,h.label);
    const visibleLabel=document.createElement('label'),visible=document.createElement('input');visible.type='checkbox';visibleLabel.append(visible,document.createTextNode(' Mostrar no jogo'));
    this.properties={options,title,size:size.input,sizeText:size.value,opacity:opacity.input,opacityText:opacity.value,visible,w:w.input,wText:w.value,h:h.input,hText:h.value,area};
    const change = () => {
      const g=this.geometry(this.selectedId);g.size=Number(size.input.value);g.opacity=Number(opacity.input.value)/100;g.visible=visible.checked;
      if (this.selectedId==='pad') {g.w=Number(w.input.value)/100;g.h=Number(h.input.value)/100;}
      this.selectHud(this.selectedId);options.value=this.selectedId;
    };
    for (const input of [size.input,opacity.input,visible,w.input,h.input]) input.oninput=change;
    const actions=document.createElement('div');actions.className='hud-editor-actions';
    const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;return b;};
    actions.append(button('Salvar HUD',()=>{
      try {
        // Persist stable button identifiers as well as their geometry.
        localStorage.setItem('BxTouchpad.bindings.v2',JSON.stringify(this.bindings));
        localStorage.setItem('BxTouchpad.hud.v4',JSON.stringify(this.hud));
      } catch {note.textContent='Não foi possível salvar no navegador. Tente novamente.';return;}
      this.closeHudEditor();
    }),button('Cancelar',()=>{this.hud=JSON.parse(this.snapshot);this.closeHudEditor();}),button('Restaurar padrão',()=>{this.hud={version:1,items:Object.create(null)};this.applyAllGeometry();this.selectHud(this.selectedId);}));
    // The property panel can be collapsed so it never prevents moving a control beneath it.
    const body=document.createElement('div');body.append(note,options,title,size.label,opacity.label,visibleLabel,area,actions);
    const collapse=button('Recolher ajustes',()=>{body.hidden=!body.hidden;collapse.textContent=body.hidden?'Abrir ajustes':'Recolher ajustes';});
    panel.append(collapse,body);this.root.append(panel);this.selectHud('joystick');options.value='joystick';
  }
  closeHudEditor() {
    this.editingHud=false;this.drag=null;this.hudPanel?.remove();this.hudPanel=null;this.properties=null;
    this.root.classList.remove('hud-editing');this.mapped.hidden=true;this.pad.hidden=true;
    this.applyAllGeometry();this.showMenu(true);
  }
  editBindings() {
    if (this.editingHud) return;
    super.editBindings();
  }
  openMenu() {
    this.mount();
    if (!this.editingHud && !this.editor) this.showMenu(true);
  }
  mount() {
    if (this.root) return;
    super.mount();
    this.toolbar=this.root.querySelector('.toolbar');
    const style=document.createElement('style');style.textContent=`
#nimbo-touch-root{font:12px Arial!important}
#nimbo-touch-root .toolbar{top:8px;left:50%;max-width:min(75vw,440px);padding:8px;display:flex;flex-wrap:wrap;gap:6px;z-index:30;box-sizing:border-box}
#nimbo-touch-root .toolbar button{font:12px Arial!important;padding:7px 10px;min-height:36px}
#nimbo-touch-root .toolbar .status{font:11px Arial;flex-basis:100%}
#nimbo-touch-root .mapped{display:block;position:absolute;inset:0;overflow:visible;padding:0;z-index:2;pointer-events:none}
#nimbo-touch-root .hud-button,#nimbo-touch-root .hud-stick,#nimbo-touch-root .pad{position:absolute;transform:translate(-50%,-50%);box-sizing:border-box;touch-action:none;user-select:none;-webkit-user-select:none;pointer-events:auto;min-width:0;min-height:0;right:auto;bottom:auto;margin:0}
#nimbo-touch-root .hud-button{line-height:1.1;border-radius:50%;z-index:3;max-width:none}
#nimbo-touch-root .hud-stick{border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(20,40,36,.52);border:2px solid rgba(188,239,218,.85);box-sizing:border-box}
#nimbo-touch-root .hud-stick-knob{display:block;width:38%;height:38%;border-radius:50%;background:rgba(210,245,229,.6);border:1px solid rgba(255,255,255,.7);pointer-events:none}
#nimbo-touch-root .hud-stick-label{position:absolute;bottom:10%;pointer-events:none}
#nimbo-touch-root .pad{z-index:1}
#nimbo-touch-root .pad span{display:none}
#nimbo-touch-root.hud-editing .pad:after{position:absolute;pointer-events:none}
#nimbo-touch-root .hud-properties{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:min(440px,80vw);max-height:85vh;overflow:auto;background:#14201ff5;border:1px solid #68c8a5;border-radius:10px;padding:8px;box-sizing:border-box;pointer-events:auto;z-index:40;font:12px Arial;color:#fff}
#nimbo-touch-root .hud-properties button{font:12px Arial!important;padding:6px;min-height:32px;margin:2px}
#nimbo-touch-root .hud-properties strong,#nimbo-touch-root .hud-properties label,#nimbo-touch-root .hud-properties span{display:block;margin:4px 0}
#nimbo-touch-root .hud-properties label span{display:inline}
#nimbo-touch-root .hud-properties input[type=range]{width:55%;vertical-align:middle}
#nimbo-touch-root .hud-properties select{font:12px Arial;min-height:32px;max-width:100%}
#nimbo-touch-root .mapping-editor{z-index:50;font:12px Arial}
#nimbo-touch-root .mapping-editor input,#nimbo-touch-root .mapping-editor select{font:12px Arial!important}
`;
    this.root.append(style);
    const edit=document.createElement('button');edit.type='button';edit.textContent='Editar HUD';edit.onclick=()=>this.editHud();
    const hide=document.createElement('button');hide.type='button';hide.textContent='Recolher menu';hide.onclick=()=>this.showMenu(false);
    const better=document.createElement('button');better.type='button';better.textContent='NimboPlay';better.onclick=()=>this.openTouchSettings();
    this.toolbar.prepend(edit);this.toolbar.append(better,hide);
    this.applyAllGeometry();
  }
  destroy() {
    if (this.editingHud) this.hud=JSON.parse(this.snapshot);
    this.editingHud=false;this.drag=null;this.hudPanel=null;this.properties=null;
    super.destroy();this.toolbar=null;this.elements.clear();
  }
}

class BxTouchpadUnified extends BxTouchpadHud {
  constructor() {
    super();this.nativeSections=new Set();
  }
  static keyLabel(code) {
    const labels={Mouse0:'Mouse 1',Mouse2:'Mouse 2',Space:'Espaço',ShiftLeft:'Shift',ControlLeft:'Ctrl',AltLeft:'Alt',Backspace:'⌫',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Escape:'Esc'};
    return labels[code] || (/^Key[A-Z]$/.test(code)?code.slice(3):/^Digit\d$/.test(code)?code.slice(5):code);
  }
  itemLabel(id) {
    if(id==='pad')return 'Área do mouse';
    if(id==='joystick')return 'Joystick WASD';
    return BxTouchpadUnified.keyLabel(this.bindings.find(b=>b.id===id)?.code || id);
  }
  renderMappedButtons() {
    super.renderMappedButtons();
    if(!this.elements)return;
    for(const [id,el] of this.elements){
      if(id!=='pad'&&id!=='joystick')el.textContent=this.itemLabel(id);
      el.setAttribute('aria-label',this.itemLabel(id));
    }
  }
  // All activation/configuration entry points live in the original settings dialog.
  showMenu() {if(this.toolbar)this.toolbar.hidden=true;}
  mount() {
    if(this.root)return;
    super.mount();
    this.toolbar.hidden=true;
    const style=document.createElement('style');style.textContent=`
#nimbo-touch-root .toolbar{display:none!important}
#nimbo-touch-root .hud-properties{width:min(390px,82vw);font:12px Arial!important}
#nimbo-touch-root .hud-properties select,#nimbo-touch-root .hud-properties button{font:12px Arial!important;line-height:1.2!important;min-height:32px!important}
#nimbo-touch-root .hud-properties .unified-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0}
#nimbo-touch-root .hud-properties .unified-row label{display:flex;align-items:center;gap:6px;margin:0}
#nimbo-touch-root .hud-properties .direction-keys{display:flex;flex-wrap:wrap;gap:4px}
#nimbo-touch-root .hud-properties .direction-keys label{display:flex;align-items:center;gap:3px}
#nimbo-touch-root .hud-properties .direction-keys select{max-width:100px}
#nimbo-touch-root .hud-button{white-space:normal}
`;
    this.root.append(style);this.refreshNativeSections();
  }
  openMenu(){this.openTouchSettings();}
  async start(){await super.start();this.refreshNativeSections();}
  stop(){super.stop();this.refreshNativeSections();}
  refreshNativeSections(){
    if(!this.nativeSections)return;
    for(const section of this.nativeSections){
      section.toggle.textContent=this.active?'Desativar controles na tela':'Ativar controles na tela';
      section.state.textContent=this.active?'Ativo. Abra este mesmo painel para desativar.':'Desativado. Configure sua HUD ou ative durante o jogo.';
    }
  }
  
  refreshEditorOptions(){
    if(!this.properties)return;
    const select=this.properties.options;select.replaceChildren();
    for(const [id] of this.elements){const option=document.createElement('option');option.value=id;option.textContent=this.itemLabel(id);select.append(option);}
    select.value=this.selectedId;
  }
  selectHud(id){
    if(!this.elements.has(id))id='joystick';
    super.selectHud(id);
    if(!this.properties)return;
    const binding=this.bindings.find(b=>b.id===id);
    const p=this.properties;p.title.textContent=this.itemLabel(id);
    p.keyRow.hidden=!binding;p.key.value=binding?.code || 'KeyE';
    p.remove.hidden=!binding;
    p.directions.hidden=id!=='joystick';
    for(const [slot,select]of Object.entries(p.directionSelects))select.value=this.bindings.find(b=>b.slot===slot)?.code || 'KeyW';
  }
  addKey(code){
    if(!this.editingHud||!BxTouchpad.keyOptions().includes(code))return;
    if(this.bindings.length>=46){this.properties.note.textContent='Limite de 42 botões na HUD.';return;}
    const id='key-'+Date.now()+'-'+(this.nextId=(this.nextId||0)+1);
    this.bindings.push({id,label:BxTouchpadUnified.keyLabel(code),code});
    this.hud.items[id]={x:.5,y:.6,size:48,opacity:.5,visible:true};
    this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(id);
  }
  changeKey(id,code){
    if(!this.editingHud||!BxTouchpad.keyOptions().includes(code))return;
    const b=this.bindings.find(b=>b.id===id);if(!b)return;
    b.code=code;b.label=BxTouchpadUnified.keyLabel(code);
    this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(id);
  }
  removeKey(id){
    if(!this.editingHud)return;
    const b=this.bindings.find(b=>b.id===id);if(!b)return;
    this.bindings=this.bindings.filter(b=>b!==b);delete this.hud.items[id];
    this.renderMappedButtons();this.refreshEditorOptions();this.selectHud('joystick');
  }
  clearKeys(){
    if(!this.editingHud)return;
    const keep=new Set(['w','a','s','d']);
    for(const b of this.bindings)if(!keep.has(b.slot))delete this.hud.items[b.id];
    this.bindings=this.bindings.filter(b=>keep.has(b.slot));
    this.renderMappedButtons();this.refreshEditorOptions();this.selectHud('joystick');
  }
  editBindings(){this.editHud();}
  editHud(){
    this.stop();if(this.editingHud)return;
    this.mount();
    this.snapshot=JSON.stringify(this.hud);this.bindingSnapshot=JSON.stringify(this.bindings);
    this.editingHud=true;this.mapped.hidden=false;this.pad.hidden=false;this.root.classList.add('hud-editing');
    const panel=this.hudPanel=document.createElement('div');panel.className='hud-properties';
    const body=document.createElement('div');
    const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b;};
    const collapse=button('Recolher editor',()=>{body.hidden=!body.hidden;collapse.textContent=body.hidden?'Abrir editor':'Recolher editor';});
    const title=document.createElement('strong'),note=document.createElement('span');note.textContent='Escolha a tecla, adicione e arraste. Toque em um controle para ajustar.';
    const options=document.createElement('select');options.setAttribute('aria-label','Selecionar controle');options.onchange=()=>this.selectHud(options.value);
    const keys=()=>{const select=document.createElement('select');for(const code of BxTouchpad.keyOptions()){const o=document.createElement('option');o.value=code;o.textContent=BxTouchpadUnified.keyLabel(code);select.append(o);}return select;};
    const addRow=document.createElement('div');addRow.className='unified-row';const addSelect=keys();addSelect.value='KeyE';addSelect.setAttribute('aria-label','Nova tecla');
    addRow.append(addSelect,button('+ Adicionar tecla',()=>this.addKey(addSelect.value)),button('Limpar botões',()=>this.clearKeys()));
    const keyRow=document.createElement('label');keyRow.textContent='Tecla ';const key=keys();key.setAttribute('aria-label','Tecla do botão selecionado');key.onchange=()=>this.changeKey(this.selectedId,key.value);keyRow.append(key);
    const remove=button('Remover tecla',()=>this.removeKey(this.selectedId));
    const directions=document.createElement('div');directions.className='direction-keys';const directionSelects={};
    for(const [slot,arrow]of Object.entries({w:'↑',a:'←',s:'↓',d:'→'})){const row=document.createElement('label');row.textContent=arrow;const select=keys();select.setAttribute('aria-label','Tecla da direção '+arrow);select.onchange=()=>{const b=this.bindings.find(b=>b.slot===slot);if(b){b.code=select.value;b.label=BxTouchpadUnified.keyLabel(select.value);this.renderMappedButtons();this.refreshEditorOptions();this.selectHud('joystick');}};directionSelects[slot]=select;row.append(select);directions.append(row);}
    const range=(name,min,max)=>{const label=document.createElement('label');label.textContent=name+' ';const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.setAttribute('aria-label',name);const value=document.createElement('span');label.append(input,value);return{label,input,value};};
    const size=range('Tamanho',32,200),opacity=range('Opacidade',0,100),w=range('Largura do mouse',10,100),h=range('Altura do mouse',10,100);
    const visibleLabel=document.createElement('label'),visible=document.createElement('input');visible.type='checkbox';visibleLabel.append(visible,document.createTextNode(' Mostrar no jogo'));
    const area=document.createElement('div');area.append(w.label,h.label);
    this.properties={options,title,note,key,keyRow,remove,directions,directionSelects,size:size.input,sizeText:size.value,opacity:opacity.input,opacityText:opacity.value,visible,w:w.input,wText:w.value,h:h.input,hText:h.value,area};
    const change=()=>{const g=this.geometry(this.selectedId);g.size=Number(size.input.value);g.opacity=Number(opacity.input.value)/100;g.visible=visible.checked;if(this.selectedId==='pad'){g.w=Number(w.input.value)/100;g.h=Number(h.input.value)/100;}this.selectHud(this.selectedId);};
    for(const input of[size.input,opacity.input,visible,w.input,h.input])input.oninput=change;
    const actions=document.createElement('div');actions.className='hud-editor-actions';
    actions.append(button('Salvar HUD',()=>{
      try{
        const saved=JSON.stringify({version:1,bindings:this.bindings,hud:this.hud});
        // One authoritative write prevents half-saved layouts/key lists.
        localStorage.setItem('BxTouchpad.unified.v6',saved);
      }catch{note.textContent='Não foi possível salvar. Sua edição continua aberta.';return;}
      this.finishEditing(false);
    }),button('Cancelar',()=>this.finishEditing(true)),button('Restaurar posições',()=>{this.hud={version:1,items:Object.create(null)};this.applyAllGeometry();this.selectHud(this.selectedId);}));
    body.append(note,addRow,options,title,keyRow,remove,directions,size.label,opacity.label,visibleLabel,area,actions);panel.append(collapse,body);this.root.append(panel);
    this.refreshEditorOptions();this.selectHud('joystick');
  }
  finishEditing(cancel,returnToSettings=true){
    if(!this.editingHud)return;
    if(cancel){this.bindings=JSON.parse(this.bindingSnapshot);this.hud=JSON.parse(this.snapshot);}
    this.editingHud=false;this.drag=null;this.hudPanel?.remove();this.hudPanel=null;this.properties=null;
    this.root.classList.remove('hud-editing');this.renderMappedButtons();this.mapped.hidden=true;this.pad.hidden=true;
    if(returnToSettings){this.openTouchSettings();}
  }
  loadUnified(){
    try{
      const saved=JSON.parse(localStorage.getItem('BxTouchpad.unified.v6')||'null');
      if(saved?.version!==1||!Array.isArray(saved.bindings)||saved.bindings.length<4||saved.bindings.length>46)return;
      const slots=['w','a','s','d'];
      if(!slots.every(slot=>saved.bindings.filter(b=>b.slot===slot).length===1))return;
      if(!saved.bindings.every(b=>b&&typeof b.id==='string'&&/^[\w-]{1,60}$/.test(b.id)&&BxTouchpad.keyOptions().includes(b.code)))return;
      if(new Set(saved.bindings.map(b=>b.id)).size!==saved.bindings.length)return;
      if(!saved.hud||saved.hud.version!==1||!saved.hud.items||typeof saved.hud.items!=='object')return;
      this.bindings=saved.bindings.map(b=>({...b,label:BxTouchpadUnified.keyLabel(b.code)}));
      const items=Object.create(null);
      for(const[id,g]of Object.entries(saved.hud.items)){
        if(!g||!['x','y','size','opacity'].every(k=>Number.isFinite(g[k])))continue;
        items[id]={x:Math.max(0,Math.min(1,g.x)),y:Math.max(0,Math.min(1,g.y)),size:Math.max(32,Math.min(200,g.size)),opacity:Math.max(0,Math.min(1,g.opacity)),visible:g.visible!==false};
        if(Number.isFinite(g.w))items[id].w=Math.max(.1,Math.min(1,g.w));if(Number.isFinite(g.h))items[id].h=Math.max(.1,Math.min(1,g.h));
      }
      this.hud={version:1,items};
    }catch(error){console.warn('[BxTouchpad] HUD salva inválida:',error.message);}
  }
  destroy(){
    if(this.editingHud)this.finishEditing(true,false);
    super.destroy();
  }
}

class BxTouchpadGain extends BxTouchpadUnified {
 constructor(){super();this.gainX=1;this.gainY=1;try{const c=JSON.parse(localStorage.getItem('BxTouchpad.motion.v7')||'{}');this.sensitivity=finite(c.touchGain,.05,50,this.sensitivity);this.gainX=finite(c.touchX,.1,5,1);this.gainY=finite(c.touchY,.1,5,1);}catch{}}
 move(dx,dy){return super.move(dx*this.gainX,dy*this.gainY);}
}
class BxTouchpadProfiles extends BxTouchpadGain {
  constructor(){
    super();this.profilePanels=new Set();this.tapToPlace=null;this.placeBlank=false;
  }
  static copy(value){return JSON.parse(JSON.stringify(value));}
  static validLayout(data){
    if(!data||!Array.isArray(data.bindings)||data.bindings.length<4||data.bindings.length>46)return false;
    const slots=['w','a','s','d'];
    if(!slots.every(slot=>data.bindings.filter(b=>b?.slot===slot).length===1))return false;
    if(!data.bindings.every(b=>b&&typeof b.id==='string'&&/^[\w-]{1,60}$/.test(b.id)&&
      (BxTouchpad.keyOptions().includes(b.code)||(!slots.includes(b.slot)&&b.code===null))))return false;
    if(new Set(data.bindings.map(b=>b.id)).size!==data.bindings.length)return false;
    if(data.bindings.some(b=>b.slot&&!['w','a','s','d','fire','aim'].includes(b.slot)))return false;
    return !!data.hud&&data.hud.version===1&&!!data.hud.items&&typeof data.hud.items==='object'&&!Array.isArray(data.hud.items);
  }
  static cleanHud(hud){
    const items=Object.create(null);
    for(const[id,g]of Object.entries(hud.items)){
      if(!g||!['x','y','size','opacity'].every(k=>Number.isFinite(g[k])))continue;
      items[id]={x:Math.max(0,Math.min(1,g.x)),y:Math.max(0,Math.min(1,g.y)),size:Math.max(32,Math.min(200,g.size)),opacity:Math.max(0,Math.min(1,g.opacity)),visible:g.visible!==false};
      if(id==='joystick'){items[id].sprintEnabled=g.sprintEnabled===true;items[id].sprintCode=BxTouchpad.keyOptions().includes(g.sprintCode)&&!g.sprintCode.startsWith('Mouse')?g.sprintCode:'ShiftLeft';}
      if(Number.isFinite(g.w))items[id].w=Math.max(.1,Math.min(1,g.w));if(Number.isFinite(g.h))items[id].h=Math.max(.1,Math.min(1,g.h));
    }
    return {version:1,items};
  }
  static starter(id,name,codes){
    const bindings=[{id:'w',slot:'w',code:'KeyW',label:'W'},{id:'a',slot:'a',code:'KeyA',label:'A'},{id:'s',slot:'s',code:'KeyS',label:'S'},{id:'d',slot:'d',code:'KeyD',label:'D'}];
    codes.forEach((code,i)=>bindings.push({id:'preset-'+i,code,label:BxTouchpadUnified.keyLabel(code)}));
    const items={joystick:{x:.14,y:.73,size:110,opacity:.5,visible:true},pad:{x:.70,y:.49,size:60,w:.59,h:.86,opacity:.3,visible:true}};
    bindings.slice(4).forEach((b,i)=>{
      const pos=i===0?[.12,.22]:i===1?[.87,.22]:[.94-((i-2)%5)*.095,.89-Math.floor((i-2)/5)*.15];
      items[b.id]={x:pos[0],y:pos[1],size:i<2?56:44,opacity:.5,visible:true};
    });
    return {id,name,bindings,hud:{version:1,items}};
  }
  loadProfiles(){
    this.normalizeIds();
    const personal={id:'personal',name:'Minha HUD atual',bindings:BxTouchpadProfiles.copy(this.bindings),hud:BxTouchpadProfiles.copy(this.hud)};
    let profiles=null,activeId='personal';
    let priorRaw=null;
    try{
      priorRaw=localStorage.getItem('BxTouchpad.profiles.v8');
      const saved=JSON.parse(priorRaw||'null');
      if(saved?.version===1&&Array.isArray(saved.profiles)&&saved.profiles.length>0&&saved.profiles.length<=32&&
        saved.profiles.every(p=>p&&typeof p.id==='string'&&/^[\w-]{1,60}$/.test(p.id)&&typeof p.name==='string'&&p.name.trim()&&p.name.length<=60&&BxTouchpadProfiles.validLayout(p))&&
        new Set(saved.profiles.map(p=>p.id)).size===saved.profiles.length){
        profiles=saved.profiles.map(p=>({...p,bindings:BxTouchpadProfiles.copy(p.bindings),hud:BxTouchpadProfiles.cleanHud(p.hud)}));
        activeId=profiles.some(p=>p.id===saved.activeId)?saved.activeId:profiles[0].id;
      }
    }catch(error){console.warn('[BxTouchpad] Perfis inválidos:',error.message);}
    if(!profiles){
      if(priorRaw){try{localStorage.setItem('BxTouchpad.profiles.v8.recovery',priorRaw);}catch{this.profileStorageError='Não foi possível guardar uma cópia de recuperação dos perfis anteriores.';}}
      profiles=[personal,
        BxTouchpadProfiles.starter('fortnite','Fortnite — base editável',['Mouse0','Mouse2','Space','ShiftLeft','ControlLeft','KeyR','KeyE','Digit1','Digit2','Digit3','Digit4','Digit5','Tab','KeyM','KeyQ']),
        BxTouchpadProfiles.starter('battlefield','Battlefield — base editável',['Mouse0','Mouse2','Space','ShiftLeft','ControlLeft','KeyR','KeyE','KeyF','KeyG','Digit1','Digit2','Digit3','Digit4','KeyQ','KeyM','Tab']),
        BxTouchpadProfiles.starter('cod','Call of Duty — base editável',['Mouse0','Mouse2','Space','ShiftLeft','ControlLeft','KeyR','KeyF','KeyC','KeyG','KeyQ','Digit1','Digit2','Digit4','KeyB','Tab','KeyM'])];
    }
    this.profileStore={version:1,activeId,profiles};
    this.activateProfileData(profiles.find(p=>p.id===activeId));
    // Commit migration once, keeping all old v6/v7 keys as a recovery copy.
    try{if(!priorRaw||!this.profileStorageError)localStorage.setItem('BxTouchpad.profiles.v8',JSON.stringify(this.profileStore));}catch{this.profileStorageError='Não foi possível salvar os perfis neste navegador.';}
  }
  activateProfileData(profile){
    this.bindings=BxTouchpadProfiles.copy(profile.bindings);this.hud=BxTouchpadProfiles.copy(profile.hud);
    this.activeProfileId=profile.id;this.profileStore.activeId=profile.id;
    if(this.root){this.renderMappedButtons();this.mapped.hidden=true;this.pad.hidden=true;}
  }
  currentProfile(){return this.profileStore?.profiles.find(p=>p.id===this.activeProfileId);}
  persistProfiles(store){localStorage.setItem('BxTouchpad.profiles.v8',JSON.stringify(store));this.profileStore=store;this.profileStorageError='';}
  switchProfile(id){
    if(this.editingHud||!this.profileStore)return false;
    const profile=this.profileStore.profiles.find(p=>p.id===id);if(!profile)return false;
    this.stop();
    const store=BxTouchpadProfiles.copy(this.profileStore);store.activeId=id;
    try{this.persistProfiles(store);}catch{this.profileStorageError='Não foi possível salvar a troca de perfil.';this.refreshProfilePanels();return false;}
    this.activateProfileData(profile);this.refreshProfilePanels();return true;
  }
  duplicateProfile(name,empty=false){
    if(this.editingHud||!this.profileStore||this.profileStore.profiles.length>=32)return false;
    name=String(name||'').trim().slice(0,60);if(!name)return false;
    const id='profile-'+Date.now()+'-'+(this.profileCounter=(this.profileCounter||0)+1);
    const profile=empty?BxTouchpadProfiles.starter(id,name,[]):{id,name,bindings:BxTouchpadProfiles.copy(this.bindings),hud:BxTouchpadProfiles.copy(this.hud)};
    const store=BxTouchpadProfiles.copy(this.profileStore);store.profiles.push(profile);store.activeId=id;
    try{this.persistProfiles(store);}catch{this.profileStorageError='Não foi possível salvar o novo perfil.';this.refreshProfilePanels();return false;}
    this.stop();this.activateProfileData(profile);this.refreshProfilePanels();return true;
  }
  refreshProfilePanels(){
    if(!this.profilePanels||!this.profileStore)return;
    for(const panel of this.profilePanels){
      panel.select.replaceChildren();for(const p of this.profileStore.profiles){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;panel.select.append(option);}
      panel.select.value=this.activeProfileId;panel.status.textContent=this.profileStorageError||'Cada perfil mantém suas próprias teclas e posições. Mouse e giroscópio mantêm seus ajustes gerais.';
    }
  }
  
  itemLabel(id){
    const b=this.bindings.find(b=>b.id===id);
    if(b&&b.code===null)return 'Botão vazio';
    return super.itemLabel(id);
  }
  renderMappedButtons(){
    if(!this.mapped)return;
    this.normalizeIds();this.mapped.replaceChildren();this.elements=new Map();
    if(this.pad)this.register('pad',this.pad,'Área do mouse');
    const stick=this.stick=document.createElement('div');stick.className='hud-stick';stick.setAttribute('role','group');
    this.knob=document.createElement('span');this.knob.className='hud-stick-knob';const hint=document.createElement('span');hint.className='hud-stick-label';hint.textContent='WASD';stick.append(this.knob,hint);
    this.mapped.append(stick);this.register('joystick',stick,'Joystick WASD');this.bindJoystick(stick);
    for(const b of this.bindings){
      if(['w','a','s','d'].includes(b.slot))continue;
      const el=document.createElement('button');el.type='button';el.className='hud-button'+(b.code===null?' hud-unassigned':'');el.textContent=b.code===null?'':BxTouchpadUnified.keyLabel(b.code);
      this.mapped.append(el);this.register(b.id,el,this.itemLabel(b.id));
      // Empty placeholders have no input handler and never send a null key.
      if(b.code!==null)this.bindSurface(el,'binding',b.code);
    }
    if(this.pageButton)this.pageButton.hidden=true;
    this.applyAllGeometry();this.positionDeleteBadge();
  }
  applyGeometry(id,element){
    super.applyGeometry(id,element);
    if(!this.editingHud&&this.bindings.find(b=>b.id===id)?.code===null)element.hidden=true;
    if(this.selectedId===id)this.positionDeleteBadge();
  }
  mount(){
    if(this.root)return;
    super.mount();
    const style=document.createElement('style');style.textContent=`
#nimbo-touch-root.hud-editing{pointer-events:auto}
#nimbo-touch-root .hud-delete-one{position:absolute;transform:translate(-50%,-50%);width:30px;height:30px;min-width:30px;min-height:30px;padding:0;border-radius:50%;border:2px solid white;background:#c62828;color:white;font:bold 19px Arial!important;line-height:26px!important;pointer-events:auto;touch-action:manipulation;z-index:32}
#nimbo-touch-root .hud-properties{width:min(360px,82vw)}
#nimbo-touch-root .hud-properties .hud-profile-name{font-weight:bold;color:#bcecff;margin:4px 0}
`;
    this.root.append(style);
    this.deleteBadge=document.createElement('button');this.deleteBadge.type='button';this.deleteBadge.className='hud-delete-one';this.deleteBadge.dataset.editorAction='true';this.deleteBadge.textContent='×';this.deleteBadge.setAttribute('aria-label','Excluir somente o botão selecionado');this.deleteBadge.hidden=true;
    this.deleteBadge.addEventListener('pointerdown',e=>e.stopPropagation());
    this.deleteBadge.onclick=e=>{e?.preventDefault();e?.stopPropagation();if(this.editingHud)this.removeKey(this.selectedId);};this.root.append(this.deleteBadge);
    this.bindBackgroundPlacement();
  }
  positionDeleteBadge(){
    if(!this.deleteBadge)return;
    const b=this.bindings.find(b=>b.id===this.selectedId),el=this.elements?.get(this.selectedId);
    this.deleteBadge.hidden=!this.editingHud||!b||['w','a','s','d'].includes(b.slot)||!el;
    if(this.deleteBadge.hidden)return;
    const r=el.getBoundingClientRect(),root=this.root.getBoundingClientRect(),v=this.viewport();
    this.deleteBadge.style.left=Math.max(16,Math.min(v.width-16,r.right-root.left+2))+'px';this.deleteBadge.style.top=Math.max(16,Math.min(v.height-16,r.top-root.top-2))+'px';
  }
  selectHud(id){
    super.selectHud(id);
    if(this.properties){const b=this.bindings.find(b=>b.id===this.selectedId);this.properties.key.value=b?.code??'';this.properties.remove.hidden=true;}
    this.positionDeleteBadge();
  }
  addBlank(clientX,clientY){
    if(!this.editingHud)return;
    if(this.bindings.length>=46){this.properties.note.textContent='Limite de 42 botões neste perfil.';return;}
    const id='blank-'+Date.now()+'-'+(this.nextId=(this.nextId||0)+1),root=this.root.getBoundingClientRect(),v=this.viewport();
    this.bindings.push({id,label:'',code:null});this.hud.items[id]={x:Math.max(0,Math.min(1,(clientX-root.left)/v.width)),y:Math.max(0,Math.min(1,(clientY-root.top)/v.height)),size:48,opacity:.5,visible:true};
    this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(id);this.placeBlank=false;
    this.properties.note.textContent='Botão vazio criado. Escolha a tecla abaixo quando quiser.';
  }
  removeKey(id){
    if(!this.editingHud)return;
    const b=this.bindings.find(b=>b.id===id);if(!b||['w','a','s','d'].includes(b.slot))return;
    const index=this.bindings.indexOf(b);this.bindings.splice(index,1);delete this.hud.items[id];
    this.renderMappedButtons();this.refreshEditorOptions();
    const next=this.bindings.slice(index).find(b=>!['w','a','s','d'].includes(b.slot))||this.bindings.find(b=>!['w','a','s','d'].includes(b.slot));this.selectHud(next?.id||'joystick');
    this.properties.note.textContent='Somente o botão selecionado foi excluído. Os demais ajustes foram mantidos.';
  }
  // Bulk deletion is deliberately disabled in this editor.
  clearKeys(){if(this.editingHud)this.properties.note.textContent='Selecione um botão e use o X vermelho para excluí-lo individualmente.';}
  bindBackgroundPlacement(){
    this.root.addEventListener('pointerdown',e=>{
      if(!this.editingHud||this.tapToPlace||this.drag)return;
      let control=null;
      for(let node=e.target;node&&node!==this.root;node=node.parentElement){
        if(node===this.hudPanel||node.dataset?.editorAction)return;
        if(node.dataset?.hudId)control=node.dataset.hudId;
      }
      if(control&&control!=='pad')return;
      if(control==='pad'&&this.selectedId==='pad'&&!this.placeBlank)return;
      e.preventDefault();e.stopImmediatePropagation();this.root.setPointerCapture(e.pointerId);this.tapToPlace={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    },true);
    this.root.addEventListener('pointermove',e=>{
      if(!this.tapToPlace||this.tapToPlace.id!==e.pointerId)return;
      e.preventDefault();e.stopImmediatePropagation();if(Math.hypot(e.clientX-this.tapToPlace.x,e.clientY-this.tapToPlace.y)>8)this.tapToPlace.moved=true;
    },true);
    const finish=(e,cancel)=>{
      if(!this.tapToPlace||this.tapToPlace.id!==e.pointerId)return;
      e.preventDefault();e.stopImmediatePropagation();const tap=this.tapToPlace;this.tapToPlace=null;
      if(!cancel&&!tap.moved&&this.editingHud)this.addBlank(e.clientX,e.clientY);
    };
    this.root.addEventListener('pointerup',e=>finish(e,false),true);this.root.addEventListener('pointercancel',e=>finish(e,true),true);this.root.addEventListener('lostpointercapture',e=>finish(e,true),true);
  }
  editHud(){
    this.stop();if(this.editingHud)return;this.mount();
    this.snapshot=JSON.stringify(this.hud);this.bindingSnapshot=JSON.stringify(this.bindings);this.editingHud=true;this.placeBlank=false;this.tapToPlace=null;
    this.mapped.hidden=false;this.pad.hidden=false;this.root.classList.add('hud-editing');
    const panel=this.hudPanel=document.createElement('div');panel.className='hud-properties';const body=document.createElement('div');
    const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b;};
    const collapse=button('Recolher editor',()=>{body.hidden=!body.hidden;collapse.textContent=body.hidden?'Abrir editor':'Recolher editor';});
    const profileName=document.createElement('div');profileName.className='hud-profile-name';profileName.textContent='Perfil: '+(this.currentProfile()?.name||'Minha HUD');
    const title=document.createElement('strong'),note=document.createElement('span');note.textContent='Toque numa área livre para criar um botão vazio. Selecione um botão para ajustar; o X vermelho exclui só ele.';
    const options=document.createElement('select');options.setAttribute('aria-label','Selecionar controle');options.onchange=()=>this.selectHud(options.value);
    const keys=()=>{const select=document.createElement('select');for(const[code,text]of[['','Sem tecla (vazio)'],...BxTouchpad.keyOptions().map(k=>[k,BxTouchpadUnified.keyLabel(k)])]){const o=document.createElement('option');o.value=code;o.textContent=text;select.append(o);}return select;};
    const add=button('Adicionar botão vazio',()=>{this.placeBlank=true;note.textContent='Toque na posição onde quer criar o botão vazio.';body.hidden=true;collapse.textContent='Abrir editor';});
    const keyRow=document.createElement('label');keyRow.textContent='Tecla ';const key=keys();key.setAttribute('aria-label','Tecla do botão selecionado');key.onchange=()=>{
      if(key.value){this.changeKey(this.selectedId,key.value);}else{const b=this.bindings.find(b=>b.id===this.selectedId);if(b){b.code=null;b.label='';this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(b.id);}}
    };keyRow.append(key);
    const remove=document.createElement('button');remove.hidden=true;
    const directions=document.createElement('div');directions.className='direction-keys';const directionSelects={};
    for(const[slot,arrow]of Object.entries({w:'↑',a:'←',s:'↓',d:'→'})){
      const row=document.createElement('label');row.textContent=arrow;const select=keys();select.children[0].remove();select.setAttribute('aria-label','Tecla da direção '+arrow);select.onchange=()=>{const b=this.bindings.find(b=>b.slot===slot);if(b){b.code=select.value;b.label=BxTouchpadUnified.keyLabel(select.value);this.renderMappedButtons();this.refreshEditorOptions();this.selectHud('joystick');}};directionSelects[slot]=select;row.append(select);directions.append(row);
    }
    const range=(name,min,max)=>{const label=document.createElement('label');label.textContent=name+' ';const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.setAttribute('aria-label',name);const value=document.createElement('span');label.append(input,value);return{label,input,value};};
    const size=range('Tamanho',32,200),opacity=range('Opacidade',0,100),w=range('Largura do mouse',10,100),h=range('Altura do mouse',10,100);
    const visibleLabel=document.createElement('label'),visible=document.createElement('input');visible.type='checkbox';visibleLabel.append(visible,document.createTextNode(' Mostrar no jogo'));
    const area=document.createElement('div');area.append(w.label,h.label);
    this.properties={options,title,note,key,keyRow,remove,directions,directionSelects,size:size.input,sizeText:size.value,opacity:opacity.input,opacityText:opacity.value,visible,w:w.input,wText:w.value,h:h.input,hText:h.value,area};
    const change=()=>{const g=this.geometry(this.selectedId);g.size=Number(size.input.value);g.opacity=Number(opacity.input.value)/100;g.visible=visible.checked;if(this.selectedId==='pad'){g.w=Number(w.input.value)/100;g.h=Number(h.input.value)/100;}this.selectHud(this.selectedId);};
    for(const input of[size.input,opacity.input,visible,w.input,h.input])input.oninput=change;
    const actions=document.createElement('div');actions.className='hud-editor-actions';
    actions.append(button('Salvar perfil',()=>{
      const store=BxTouchpadProfiles.copy(this.profileStore),index=store.profiles.findIndex(p=>p.id===this.activeProfileId);
      if(index<0){note.textContent='Perfil atual não encontrado.';return;}
      store.profiles[index]={...store.profiles[index],bindings:BxTouchpadProfiles.copy(this.bindings),hud:BxTouchpadProfiles.copy(this.hud)};
      try{this.persistProfiles(store);}catch{note.textContent='Não foi possível salvar. A edição continua aberta.';return;}
      this.finishEditing(false);
    }),button('Cancelar',()=>this.finishEditing(true)));
    body.append(profileName,note,add,options,title,keyRow,directions,size.label,opacity.label,visibleLabel,area,actions);panel.append(collapse,body);this.root.append(panel);
    this.refreshEditorOptions();this.selectHud('joystick');this.applyAllGeometry();
  }
  finishEditing(cancel,returnToSettings=true){
    this.tapToPlace=null;this.placeBlank=false;
    super.finishEditing(cancel,returnToSettings);if(this.deleteBadge)this.deleteBadge.hidden=true;this.refreshProfilePanels();
  }
}

class BxTouchpadOverlay extends BxTouchpadProfiles {
  constructor(){
    super();this.undoPast=[];this.undoFuture=[];this.historyBusy=false;
    window.addEventListener('resize',()=>{this.editorPointerHistory=null;if(this.editingHud)this.dockInspector();});
    document.addEventListener('fullscreenchange',()=>{if(this.editingHud){this.reparent();this.dockInspector();this.updateFullscreenButton();}});
  }
  editorState(){return JSON.stringify({bindings:this.bindings,hud:this.hud});}
  recordEditor(before){
    if(!this.editingHud||this.historyBusy||before===this.editorState())return;
    this.undoPast.push(before);if(this.undoPast.length>60)this.undoPast.shift();this.undoFuture=[];this.updateHistoryButtons();
  }
  editorChange(action){
    if(!this.editingHud||this.historyBusy)return action();
    const before=this.editorState();this.historyBusy=true;
    try{return action();}finally{this.historyBusy=false;this.recordEditor(before);}
  }
  addBlank(x,y){return this.editorChange(()=>super.addBlank(x,y));}
  removeKey(id){return this.editorChange(()=>super.removeKey(id));}
  changeKey(id,code){return this.editorChange(()=>super.changeKey(id,code));}
  updateHistoryButtons(){if(this.undoButton)this.undoButton.disabled=!this.undoPast.length;if(this.redoButton)this.redoButton.disabled=!this.undoFuture.length;}
  restoreEditorHistory(redo=false){
    if(!this.editingHud)return;const from=redo?this.undoFuture:this.undoPast,to=redo?this.undoPast:this.undoFuture;if(!from.length)return;
    to.push(this.editorState());const state=JSON.parse(from.pop());this.bindings=state.bindings;this.hud=state.hud;this.drag=null;this.tapToPlace=null;this.editorPointerHistory=null;
    this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(this.selectedId);this.updateHistoryButtons();
  }
  mount(){
    if(this.root)return;super.mount();
    const style=document.createElement('style');style.textContent=`
#nimbo-touch-root.hud-editing{background:transparent!important;inset:0!important;isolation:isolate;z-index:2147483000!important}
#nimbo-touch-root .hud-properties{top:76px;right:max(12px,env(safe-area-inset-right));left:auto;transform:none;width:264px;max-width:calc(100vw - 24px);max-height:calc(100% - 90px);padding:0;border:1px solid #41544c;background:#182124f5;border-radius:12px;box-shadow:0 12px 36px #0004;color:#eef2ee;overscroll-behavior:contain;font:12px system-ui!important}
#nimbo-touch-root .hud-properties[data-dock=left]{right:auto;left:max(12px,env(safe-area-inset-left))}
#nimbo-touch-root .hud-properties .forma-property-head{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #35423e;gap:8px}
#nimbo-touch-root .hud-properties .forma-property-head span{margin:0;font:11px system-ui!important;letter-spacing:.5px}
#nimbo-touch-root .hud-properties .forma-property-head button{min-width:44px!important;min-height:44px!important;padding:5px!important;margin:0!important}
#nimbo-touch-root .hud-properties .forma-property-body{padding:14px}
#nimbo-touch-root .hud-properties .forma-property-body>strong{font:600 17px system-ui!important;margin:14px 0 16px;color:#b8edcf}
#nimbo-touch-root .hud-properties label{font:12px system-ui!important;margin:12px 0 4px}
#nimbo-touch-root .hud-properties select{width:100%;background:#252d30;color:#eef2ee;border:1px solid #53635d;border-radius:7px;padding:6px;min-height:40px!important;font:12px system-ui!important}
#nimbo-touch-root .hud-properties input[type=range]{width:100%;accent-color:#b8edcf;min-height:32px;margin:4px 0}
#nimbo-touch-root .hud-properties input[type=checkbox]{accent-color:#b8edcf}
#nimbo-touch-root .hud-properties label span{color:#b8edcf;font:11px ui-monospace,monospace!important}
#nimbo-touch-root .hud-properties .direction-keys label{flex:1 1 40%;min-width:0;margin:3px 0}
#nimbo-touch-root .hud-properties .direction-keys select{min-width:0;max-width:90px}
#nimbo-touch-root .hud-properties[data-collapsed=true]{top:auto;bottom:max(12px,env(safe-area-inset-bottom));width:210px}
#nimbo-touch-root .hud-properties[data-collapsed=true] .forma-property-head{border-bottom:0}
#nimbo-touch-root .forma-editor-bar{position:absolute;top:max(10px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:50;pointer-events:auto;background:#111c20ed;border:1px solid #3d514a;border-radius:10px;padding:6px 8px;box-sizing:border-box;color:#eef2ee;font:12px system-ui!important}
#nimbo-touch-root .forma-editor-bar .forma-caption{min-width:0;max-width:28%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.4}
#nimbo-touch-root .forma-caption strong{display:block;font-size:12px;font-weight:600;color:#e0f2e6}
#nimbo-touch-root .forma-caption small{font-size:10px;color:#aabbb2}
#nimbo-touch-root .forma-actions{display:flex;align-items:center;gap:5px;flex-shrink:0}
#nimbo-touch-root .forma-editor-bar button,#nimbo-touch-root .forma-property-head button{background:#24312c;color:#eef2ee;border:1px solid #496055;border-radius:7px;min-height:40px;padding:8px 11px;font:12px system-ui!important;line-height:1.2!important;margin:0;touch-action:manipulation}
#nimbo-touch-root .forma-editor-bar button:disabled{opacity:.35}
#nimbo-touch-root .forma-editor-bar .forma-save{background:#b8edcf;color:#16392b;border-color:#b8edcf;font-weight:600!important}
#nimbo-touch-root .forma-editor-bar button:focus-visible,#nimbo-touch-root .hud-properties button:focus-visible,#nimbo-touch-root .hud-properties select:focus-visible{outline:2px solid #b8edcf;outline-offset:2px}
#nimbo-touch-root .forma-editor-note{position:absolute;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);max-width:46%;padding:7px 11px;border-radius:7px;color:#e0eee5;background:#122018ce;pointer-events:none;z-index:40;font:11px system-ui!important;text-align:center;line-height:1.4!important}
@media(max-height:540px){#nimbo-touch-root .hud-properties{top:70px;width:225px;max-height:calc(100% - 84px)}#nimbo-touch-root .forma-property-body{padding:10px}#nimbo-touch-root .hud-properties .forma-property-body>strong{font-size:14px!important;margin:10px 0}#nimbo-touch-root .hud-properties label{margin-top:8px}#nimbo-touch-root .forma-editor-note{font-size:10px!important;max-width:43%}}
@media(max-width:760px){#nimbo-touch-root .forma-caption{display:none}#nimbo-touch-root .forma-editor-bar{justify-content:center;gap:4px}#nimbo-touch-root .forma-actions{gap:3px}#nimbo-touch-root .forma-editor-bar button{padding:7px 8px;font-size:11px!important}}
@media(orientation:portrait) and (max-width:600px){#nimbo-touch-root .forma-editor-bar{flex-wrap:wrap}#nimbo-touch-root .hud-properties{top:112px;max-height:calc(100% - 180px)}#nimbo-touch-root .forma-editor-note{max-width:90%}}
`;this.root.append(style);
    this.root.addEventListener('pointerdown',e=>{
      if(!this.editingHud||this.editorPointerHistory)return;let node=e.target;
      while(node&&node!==this.root){if(node.dataset?.editorAction)return;if(node.dataset?.hudId){this.editorPointerHistory={id:e.pointerId,state:this.editorState()};return;}node=node.parentElement;}
    },true);
    const finish=e=>{if(this.editorPointerHistory?.id!==e.pointerId)return;const before=this.editorPointerHistory.state;this.editorPointerHistory=null;this.recordEditor(before);};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])this.root.addEventListener(type,finish,true);
    // Keep editor interactions inside the overlay; the stream itself remains live.
    for(const type of ['pointerdown','pointermove','pointerup','click','keydown','keyup','wheel'])this.root.addEventListener(type,e=>{if(this.editingHud)e.stopPropagation();});
  }
  selectHud(id){super.selectHud(id);if(this.editingHud)this.dockInspector();}
  dockInspector(){
    if(!this.hudPanel)return;const g=this.geometry(this.selectedId||'joystick');
    this.hudPanel.dataset.dock=g.x>.5?'left':'right';
    if(this.propertyCaption)this.propertyCaption.textContent=this.itemLabel(this.selectedId||'joystick')+' · ajustes';
  }
  setInspectorCollapsed(collapsed){
    if(!this.propertyBody||!this.hudPanel)return;this.propertyBody.hidden=collapsed;this.hudPanel.dataset.collapsed=String(collapsed);
    this.collapseButton.textContent=collapsed?'⌃':'⌄';this.collapseButton.setAttribute('aria-expanded',String(!collapsed));this.collapseButton.setAttribute('aria-label',collapsed?'Abrir propriedades':'Recolher propriedades');
  }
  updateFullscreenButton(){if(this.fullscreenButton){this.fullscreenButton.disabled=!!document.fullscreenElement;this.fullscreenButton.textContent=document.fullscreenElement?'Tela cheia ✓':'Tela cheia';}}
  requestEditorFullscreen(){
    if(document.fullscreenElement){this.reparent();this.updateFullscreenButton();return;}
    const request=document.documentElement.requestFullscreen;
    if(!request){if(this.properties)this.properties.note.textContent='Use a opção de tela cheia do navegador. O editor continua sobre o jogo.';return;}
    try{Promise.resolve(request.call(document.documentElement)).then(()=>{if(!this.editingHud)return;this.reparent();this.applyAllGeometry();this.updateFullscreenButton();}).catch(()=>{if(this.properties)this.properties.note.textContent='O navegador não permitiu tela cheia. Toque em Tela cheia para tentar novamente.';});}
    catch{if(this.properties)this.properties.note.textContent='Use a opção de tela cheia do navegador.';}
  }
  editHud(){
    if(this.editingHud)return;
    touchPanel.close();
    
    super.editHud();if(!this.editingHud)return;
    this.reparent();this.undoPast=[];this.undoFuture=[];this.editorPointerHistory=null;
    const panel=this.hudPanel,collapse=panel.children[0],body=panel.children[1];
    const profileName=body.children[0],add=body.children[2],actions=panel.querySelector('.hud-editor-actions');
    const save=actions.children[0],cancel=actions.children[1];
    this.propertyBody=body;this.collapseButton=collapse;body.className='forma-property-body';panel.dataset.editorAction='true';
    const head=document.createElement('div');head.className='forma-property-head';this.propertyCaption=document.createElement('span');head.append(this.propertyCaption,collapse);panel.prepend(head);
    collapse.onclick=()=>this.setInspectorCollapsed(!body.hidden);this.setInspectorCollapsed(false);
    const bar=this.editorBar=document.createElement('div');bar.className='forma-editor-bar';bar.dataset.editorAction='true';
    const caption=document.createElement('div');caption.className='forma-caption';const title=document.createElement('strong');title.textContent='Editar HUD';const sub=document.createElement('small');sub.textContent=this.currentProfile()?.name||'Meu perfil';caption.append(title,sub);bar.append(caption);profileName.remove();
    const tools=document.createElement('div');tools.className='forma-actions';
    const button=(text,label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.title=label;b.onclick=action;return b;};
    add.textContent='+ Tecla';add.setAttribute('aria-label','Adicionar tecla vazia');add.onclick=()=>{this.placeBlank=true;this.properties.note.textContent='Toque no jogo onde a nova tecla deve ficar.';this.setInspectorCollapsed(true);};
    this.undoButton=button('↶','Desfazer',()=>this.restoreEditorHistory());this.redoButton=button('↷','Refazer',()=>this.restoreEditorHistory(true));
    this.fullscreenButton=button('Tela cheia','Entrar em tela cheia',()=>this.requestEditorFullscreen());tools.append(add,this.undoButton,this.redoButton,this.fullscreenButton);
    const end=document.createElement('div');end.className='forma-actions';save.textContent='Salvar e jogar';save.className='forma-save';end.append(cancel,save);actions.remove();bar.append(tools,end);this.root.append(bar);
    this.properties.note.className='forma-editor-note';this.properties.note.textContent='Edição: os toques ajustam a HUD. O jogo continua rodando.';this.root.append(this.properties.note);
    // Existing validated editor handlers remain responsible for data mutations.
    for(const input of [this.properties.size,this.properties.opacity,this.properties.visible,this.properties.w,this.properties.h]){const original=input.oninput;input.oninput=()=>this.editorChange(()=>original());}
    for(const input of [this.properties.key,...Object.values(this.properties.directionSelects)]){const original=input.onchange;input.onchange=()=>this.editorChange(()=>original());}
    this.updateHistoryButtons();this.dockInspector();this.requestEditorFullscreen();this.applyAllGeometry();
  }
  finishEditing(cancel,returnToSettings=true){
    if(!this.editingHud)return;this.editorBar?.remove();this.properties?.note?.remove();
    this.editorBar=null;this.propertyBody=null;this.propertyCaption=null;this.undoButton=null;this.redoButton=null;this.fullscreenButton=null;this.editorPointerHistory=null;
    super.finishEditing(cancel,false);
    if(!returnToSettings)return;
    if(cancel){this.openTouchSettings();return;}
    // Saved HUD returns to play; start() retains all native support checks.
    this.start().then(()=>{if(!this.active){const message=this.status?.textContent;this.openTouchSettings();for(const section of this.nativeSections)section.state.textContent=message||'HUD salva. Ative os controles quando o jogo estiver pronto.';}});
  }
}

class BxTouchpadExclusive extends BxTouchpadOverlay {
  syncNativeTouchVisibility(){
    // Native xCloud touch must coexist with Bluetooth mouse, keyboard and gamepad.
    // Never hide the native touch surface just because the custom HUD is active.
    document.documentElement.classList.remove('nimbo-touch-exclusive');
  }
  mount(){
    if(this.root)return;
    super.mount();
    const style=document.createElement('style');style.dataset.bxTouchpadExclusive='true';
    // These IDs are the native touch surface used by NimboPlay's TouchController.
    // Deliberately do not match all canvases, the video renderer, #StreamHud or Guide.
    // CSS also applies if Xbox inserts/replaces its touch surface after activation.
    style.textContent = '/* Native Xbox touch remains enabled alongside NimboTouch. */';

  }
  async start(){
    try{await super.start();}
    finally{this.syncNativeTouchVisibility();}
  }
  stop(){
    super.stop();this.syncNativeTouchVisibility();
  }
  editHud(){
    try{super.editHud();}
    finally{this.syncNativeTouchVisibility();}
  }
  finishEditing(cancel,returnToSettings=true){
    try{super.finishEditing(cancel,returnToSettings);}
    finally{this.syncNativeTouchVisibility();}
  }
  destroy(){
    try{super.destroy();}
    finally{document.documentElement.classList.remove('nimbo-touch-exclusive');}
  }
}

class BxTouchpadSession extends BxTouchpadExclusive {
  constructor(){
    super();this.wanted=false;this.desiredSession=null;this.focused=true;this.resumeTimer=null;this.latched=new Set();this.rawTouches=new Set();this.touchPeak=0;this.touchCancels=0;this.lastTouchEvent='—';this.showTouchDiagnostics=false;
    window.addEventListener('focus',()=>{this.focused=true;this.retryAt=0;this.ensureResumeWatch();});
    window.addEventListener('blur',()=>{this.focused=false;this.pause('Janela sem foco');});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){this.focused=true;this.retryAt=0;this.ensureResumeWatch();}});
    document.addEventListener('fullscreenchange',()=>{this.pause('Mudança de tela cheia');this.ensureResumeWatch();});
    BxEventBus.Script.on('dialog.dismissed',()=>this.ensureResumeWatch());
    window.addEventListener(BxEvent.XCLOUD_POLLING_MODE_CHANGED,()=>this.checkResume());
    for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>this.observeTouch(e),true);
  }
  pause(reason='Pausa temporária'){
    this.pauseReason=reason;this.latched?.clear();super.stop();if(this.editingHud){this.mapped.hidden=false;this.pad.hidden=false;}this.rawTouches?.clear();this.refreshInputVisuals();this.refreshNativeSections();this.ensureResumeWatch();
  }
  stop(){
    this.wanted=false;this.desiredSession=null;this.latched?.clear();clearTimeout(this.resumeTimer);this.resumeTimer=null;
    super.stop();this.rawTouches?.clear();this.refreshInputVisuals();this.refreshNativeSections();
  }
  canResume(){
 if(!this.root||this.editingHud||this.editor||document.hidden||touchPanel.isOpen||this.menuBlocked)return false;
 if(remoteInputRequested())return this.desiredSession==='xhome'&&remoteInputReady()&&!nativeDialogVisible();
 if(!STATES.isPlaying)return false;
 if(!this.desiredSession||api.streamSession!==this.desiredSession)return false;
 return !nativeDialogVisible();
}
  ensureResumeWatch(){
    if(!this.wanted||this.resumeTimer)return;
    this.resumeTimer=window.setTimeout(()=>{this.resumeTimer=null;this.checkResume();},200);
  }
  checkResume(){
    if(!this.wanted)return;
    if(remoteInputRequested()){
      if(this.desiredSession!=='xhome')this.desiredSession='xhome';
      if(this.canResume()){if(!this.active&&!this.busy)this.start(true);}
      else if(this.active)this.pause('Menu ou página temporariamente indisponível');
      this.ensureResumeWatch();return;
    }
    if(this.desiredSession==='xhome'){this.stop();return;}
    if(api?.streamSession!==this.desiredSession){this.stop();return;}
    if(this.canResume()){if(!this.active&&!this.busy)this.start(true);}
    else if(this.active)this.pause('Menu ou página temporariamente indisponível');
    this.ensureResumeWatch();
  }
  async start(automatic=false){
    if(!automatic){
      if(remoteInputRequested()){
        this.wanted=true;this.desiredSession='xhome';
      }else{
        if(!STATES.isPlaying||!api?.streamSession){this.stop();if(this.status)this.status.textContent='Abra uma sessão de jogo antes de ativar os controles.';return;}
        this.wanted=true;this.desiredSession=api.streamSession;
      }
    }
    if(!this.wanted)return;
    if(!this.canResume()){this.refreshNativeSections();this.ensureResumeWatch();return;}
    if(this.busy||this.active){this.ensureResumeWatch();return;}
    const pending=super.start(),attemptEpoch=this.epoch;
    await pending;
    // A canceled attempt keeps user intent. A failed supported attempt does not loop forever.
    if(!this.active&&this.epoch===attemptEpoch){this.wanted=false;this.desiredSession=null;}
    this.refreshNativeSections();this.ensureResumeWatch();
  }
  openTouchSettings(){const wanted=this.wanted,session=this.desiredSession;super.openTouchSettings();this.wanted=wanted;this.desiredSession=session;this.refreshNativeSections();this.ensureResumeWatch();}
  editHud(){
    const wanted=this.wanted,session=this.desiredSession;
    super.editHud();this.wanted=wanted;this.desiredSession=session;
    if(!this.editingHud||!this.properties)return;
    this.properties.opacity.min='0';
    const addButton=this.editorBar?.children[1]?.children[0];if(addButton){const add=addButton.onclick;addButton.onclick=()=>{this.libraryChoice=null;add();};}
    const box=document.createElement('div');box.className='bx-action-options';
    const label=document.createElement('label');label.textContent='Comportamento';
    const behavior=document.createElement('select');behavior.setAttribute('aria-label','Comportamento do botão');
    for(const [value,text]of [['hold','Segurar'],['toggle','Trava de mira: tocar liga/desliga'],['aim-fire','Mirar + atirar enquanto segura']]){const option=document.createElement('option');option.value=value;option.textContent=text;behavior.append(option);}
    behavior.onchange=()=>this.editorChange(()=>{const b=this.bindings.find(b=>b.id===this.selectedId);if(!b)return;b.behavior=behavior.value;this.renderMappedButtons();this.selectHud(b.id);});label.append(behavior);
    const visualLabel=document.createElement('label');visualLabel.textContent='Visual';const visual=document.createElement('select');visual.setAttribute('aria-label','Visual do botão');
    for(const [value,text]of [['key','Somente tecla'],['both','Ícone + tecla'],['icon','Somente ícone']]){const o=document.createElement('option');o.value=value;o.textContent=text;visual.append(o);}visual.onchange=()=>this.editorChange(()=>{const b=this.bindings.find(b=>b.id===this.selectedId);if(b){b.visual=visual.value;this.renderMappedButtons();this.selectHud(b.id);}});visualLabel.append(visual);
    box.append(label,visualLabel);this.propertyBody.append(box);this.actionProperties={box,behavior,visual};
    const library=document.createElement('label');library.textContent='Biblioteca de controles';const select=document.createElement('select');select.setAttribute('aria-label','Biblioteca de controles');
    for(const [value,text]of [['','Escolher…'],['blank','+ Tecla vazia'],['fire','◉ Disparo · Mouse 1'],['aim','⊕ Mira · Mouse 2'],['combo','⊕ Mirar + atirar'],['stick','✥ Joystick WASD existente']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);}
    select.onchange=()=>{const value=select.value;select.value='';if(!value)return;if(value==='stick'){this.selectHud('joystick');return;}this.libraryChoice=value;this.placeBlank=true;this.properties.note.textContent='Toque onde deseja colocar o controle escolhido.';this.setInspectorCollapsed(true);};library.append(select);this.propertyBody.prepend(library);
    this.selectHud(this.selectedId);this.ensureResumeWatch();
  }
  finishEditing(cancel,returnToSettings=true){
    this.actionProperties=null;this.libraryChoice=null;super.finishEditing(cancel,returnToSettings);this.ensureResumeWatch();
  }
  addBlank(x,y){
    this.editorChange(()=>{
      const count=this.bindings.length;super.addBlank(x,y);if(this.bindings.length===count)return;
      const b=this.bindings.find(b=>b.id===this.selectedId),choice=this.libraryChoice;this.libraryChoice=null;
      if(choice&&choice!=='blank'){b.code=choice==='aim'?'Mouse2':'Mouse0';b.icon=choice==='aim'?'aim':'fire';b.visual='both';b.behavior=choice==='combo'?'aim-fire':'hold';this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(b.id);}
    });
  }
  behaviorOf(b){return b?.behavior==='toggle'&&b.code==='Mouse2'?'toggle':b?.behavior==='aim-fire'&&b.code==='Mouse0'?'aim-fire':'hold';}
  codesOf(b){return this.behaviorOf(b)==='aim-fire'?['Mouse2','Mouse0']:b?.code?[b.code]:[];}
  selectHud(id){
    super.selectHud(id);const p=this.actionProperties;if(!p)return;const b=this.bindings.find(b=>b.id===this.selectedId);p.box.hidden=!b;if(!b)return;
    p.behavior.value=this.behaviorOf(b);p.behavior.children[1].disabled=b.code!=='Mouse2';p.behavior.children[2].disabled=b.code!=='Mouse0';p.visual.value=['both','icon'].includes(b.visual)?b.visual:'key';
  }
  renderMappedButtons(){
    super.renderMappedButtons();if(!this.elements)return;
    for(const b of this.bindings){const node=this.elements.get(b.id);if(!node||!b.code||['w','a','s','d'].includes(b.slot))continue;
      const combined=this.behaviorOf(b)==='aim-fire',text=combined?'M1 + M2':BxTouchpadUnified.keyLabel(b.code);
      node.textContent=text;node.setAttribute('aria-label',text+(this.behaviorOf(b)==='toggle'?' · trava de mira':''));
      if(['both','icon'].includes(b.visual)){
        const mark=document.createElement('span');mark.className='bx-control-symbol';
        // Static, local icon shapes; never interpolate stored user content into markup.
        mark.innerHTML=b.code==='Mouse2'?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 1v6m0 10v6M1 12h6m10 0h6"/><circle cx="12" cy="12" r="1"/></svg>':b.code==='Mouse0'?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 17V9l3-4 3 4v8ZM9 13h6"/></svg>':'';
        if(mark.innerHTML){node.textContent='';node.append(mark);if(b.visual==='both'){const caption=document.createElement('span');caption.textContent=text;caption.className='bx-control-caption';node.append(caption);}}
      }
    }
    this.refreshInputVisuals();
  }
  bindSurface(element,kind,code=null){
    element.addEventListener('pointerdown',e=>{
      if(!this.active||this.editingHud||e.pointerType!=='touch'||this.pointers.has(e.pointerId))return;
      e.preventDefault();e.stopPropagation();
      if(kind==='pad'&&[...this.pointers.values()].some(p=>p.kind==='pad'))return;
      const b=this.bindings.find(b=>b.id===element.dataset.hudId);
      element.setPointerCapture(e.pointerId);
      if(kind==='binding'&&this.behaviorOf(b)==='toggle'){
        if([...this.pointers.values()].some(p=>p.controlId===b.id))return;
        this.latched.has(b.id)?this.latched.delete(b.id):this.latched.add(b.id);
        this.pointers.set(e.pointerId,{kind:'toggle',controlId:b.id,x:e.clientX,y:e.clientY});
      }else this.pointers.set(e.pointerId,{kind,code,controlId:b?.id,codes:kind==='binding'?this.codesOf(b):[],x:e.clientX,y:e.clientY});
      this.updateButtons();
    });
    element.addEventListener('pointermove',e=>{const p=this.pointers.get(e.pointerId);if(!p||!this.active)return;e.preventDefault();e.stopPropagation();try{if(p.kind==='pad')this.move(e.clientX-p.x,e.clientY-p.y);p.x=e.clientX;p.y=e.clientY;}catch(error){this.stop();this.status.textContent=error.message;}});
    const release=e=>{const p=this.pointers.get(e.pointerId);if(!p)return;this.pointers.delete(e.pointerId);if(e.type!=='pointerup'&&p.kind==='toggle')this.latched.delete(p.controlId);e.stopPropagation();this.updateButtons();};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,release);
    element.addEventListener('contextmenu',e=>e.preventDefault());
  }
  updateButtons(){
    let buttons=0;const wanted=new Set();const accept=code=>{if(code==='Mouse0')buttons|=1;else if(code==='Mouse2')buttons|=2;else if(code)wanted.add(code);};
    for(const p of this.pointers.values())for(const code of p.codes||[])accept(code);
    for(const id of this.latched||[]){const b=this.bindings.find(b=>b.id===id);if(this.behaviorOf(b)==='toggle')for(const code of this.codesOf(b))accept(code);}
    this.buttons=buttons;
    if(this.active)try{this.send();this.syncKeys(wanted);}catch(error){this.stop();this.status.textContent=error.message;}
    this.refreshInputVisuals();
  }
  refreshInputVisuals(){
    for(const [id,node]of this.elements||[])node.dataset.latched=String(!!this.latched?.has(id));
    if(this.diagnosticLabel){this.diagnosticLabel.hidden=!this.showTouchDiagnostics||!this.wanted;this.diagnosticLabel.textContent=`Toques recebidos: ${this.rawTouches?.size||0} · pico ${this.touchPeak||0} · controles ${this.pointers.size} · cancelados ${this.touchCancels||0} · ${this.lastTouchEvent||'—'}`;}
  }
  observeTouch(e){
    if(!this.wanted||e.pointerType!=='touch')return;
    if(e.type==='pointerdown'){this.rawTouches.add(e.pointerId);this.touchPeak=Math.max(this.touchPeak,this.rawTouches.size);}
    else if(e.type==='pointerup'||e.type==='pointercancel'){const had=this.rawTouches.delete(e.pointerId);if(had&&e.type==='pointercancel')this.touchCancels++;}
    this.lastTouchEvent=e.type.replace('pointer','');this.refreshInputVisuals();
  }
  refreshNativeSections(){
    super.refreshNativeSections();for(const panel of this.nativeSections||[]){panel.toggle.textContent=this.wanted?'Desativar controles na tela':'Ativar controles na tela';if(this.wanted&&!this.active)panel.state.textContent='Pausado temporariamente. Os controles retomam ao voltar ao jogo; nenhum botão permanece pressionado.';}
  }
  
  mount(){
    if(this.root)return;super.mount();const style=document.createElement('style');style.textContent=`
#nimbo-touch-root{touch-action:none;overscroll-behavior:contain}
#nimbo-touch-root .hud-button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
#nimbo-touch-root .bx-control-symbol{display:block;width:40%;height:40%;pointer-events:none}
#nimbo-touch-root .bx-control-symbol svg{display:block;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.5}
#nimbo-touch-root .bx-control-caption{font:10px system-ui;pointer-events:none}
#nimbo-touch-root .bx-touch-diagnostic{position:absolute;top:4px;left:50%;transform:translateX(-50%);z-index:55;pointer-events:none;background:#101c20df;color:#dcf8e6;padding:5px 8px;border-radius:6px;font:11px system-ui;max-width:90vw}
`;this.root.append(style);this.diagnosticLabel=document.createElement('div');this.diagnosticLabel.className='bx-touch-diagnostic';this.diagnosticLabel.hidden=true;this.root.append(this.diagnosticLabel);
  }
  destroy(){this.stop();super.destroy();this.diagnosticLabel=null;this.rawTouches?.clear();}
}

class BxTouchpadToolkit extends BxTouchpadSession {
  constructor(){super();this.sprintLatched=false;this.hudHidden=false;this.retryAt=0;this.retryDelay=1000;}
  handleInputFailure(error){
    this.retryAt=performance.now()+this.retryDelay;this.retryDelay=Math.min(10000,this.retryDelay*2);
    this.pause('Entrada temporariamente indisponível');
    if(this.status)this.status.textContent='Controles ligados, aguardando a entrada: '+String(error?.message||error);
    this.refreshNativeSections();
  }
  async start(automatic=false){
    if(!automatic){this.wanted=true;this.retryAt=0;this.retryDelay=1000;if(STATES.isPlaying)this.desiredSession=api?.streamSession;}
    if(!this.wanted)return;
    if(!this.canResume()||performance.now()<this.retryAt||this.busy||this.active){this.refreshNativeSections();this.ensureResumeWatch();return;}
    const epochBefore=this.epoch;
    try{await BxTouchpadExclusive.prototype.start.call(this);}catch(error){this.handleInputFailure(error);}
    if(this.active){this.retryDelay=1000;this.retryAt=0;}
    else if(this.wanted&&this.root&&this.epoch>=epochBefore){this.retryAt=Math.max(this.retryAt,performance.now()+this.retryDelay);this.retryDelay=Math.min(10000,this.retryDelay*2);}
    this.refreshNativeSections();this.ensureResumeWatch();
  }
  canResume(){
 if(!this.root||this.editingHud||this.editor||document.hidden||touchPanel.isOpen||!STATES.isPlaying)return false;
 if(!this.desiredSession||api.streamSession!==this.desiredSession)return false;
 return !nativeDialogVisible();
}
  ensureResumeWatch(){if(!this.root||!this.wanted)return;super.ensureResumeWatch();}
  checkResume(){
    if(!this.wanted||!this.root)return;
    const session=api?.streamSession;
    if(!STATES.isPlaying||!session){if(this.active)this.pause('Aguardando a sessão');this.ensureResumeWatch();return;}
    if(session!==this.desiredSession){this.pause('Reconectando à sessão');this.desiredSession=session;this.retryAt=0;}
    if(this.canResume()){if(!this.active&&!this.busy&&performance.now()>=this.retryAt)this.start(true);}
    else if(this.active)this.pause('Menu ou página temporariamente indisponível');
    this.ensureResumeWatch();
  }
  pause(reason){this.sprintLatched=false;super.pause(reason);}
  stop(){this.sprintLatched=false;super.stop();this.updateShortcut();}
  destroy(){const wanted=this.wanted;super.destroy();this.wanted=wanted;this.desiredSession=null;this.hudHidden=false;this.sprintLatched=false;this.updateShortcut();}
  switchProfile(id){const wanted=this.wanted,session=this.desiredSession;const result=super.switchProfile(id);this.wanted=wanted;this.desiredSession=session;this.hudHidden=false;this.refreshNativeSections();this.ensureResumeWatch();return result;}
  duplicateProfile(name,empty=false){const wanted=this.wanted,session=this.desiredSession;const result=super.duplicateProfile(name,empty);this.wanted=wanted;this.desiredSession=session;this.refreshNativeSections();this.ensureResumeWatch();return result;}
  combination(b){return Array.isArray(b?.combo)?[...new Set(b.combo.filter(c=>BxTouchpad.keyOptions().includes(c)))].slice(0,8):[];}
  behaviorOf(b){if(b?.action==='hud-visibility')return 'hud-visibility';if(b?.behavior==='multi')return 'multi';return super.behaviorOf(b);}
  codesOf(b){if(b?.action==='hud-visibility')return [];if(this.behaviorOf(b)==='multi')return this.combination(b);return super.codesOf(b);}
  clearAimLatch(){for(const id of this.latched||[]){const b=this.bindings.find(b=>b.id===id);if(this.behaviorOf(b)==='toggle'&&b.code==='Mouse2')this.latched.delete(id);}}
  bindSurface(element,kind,code=null){
    element.addEventListener('pointerdown',e=>{
      if(!this.active||this.editingHud||e.pointerType!=='touch'||this.pointers.has(e.pointerId))return;
      e.preventDefault();e.stopPropagation();
      if(kind==='pad'&&[...this.pointers.values()].some(p=>p.kind==='pad'))return;
      const b=this.bindings.find(b=>b.id===element.dataset.hudId),behavior=this.behaviorOf(b);
      if(behavior==='hud-visibility'){this.toggleHudVisibility();return;}
      if(behavior==='toggle'&&[...this.pointers.values()].some(p=>p.controlId===b.id))return;
      try{element.setPointerCapture(e.pointerId);}catch(error){NimboDiag.add('input','Não foi possível capturar o toque.',error.message);return;}
      if(behavior==='aim-fire')this.clearAimLatch();
      if(kind==='binding'&&behavior==='toggle'){
        // A held combined-fire button owns aiming until its release.
        if(![...this.pointers.values()].some(p=>p.combined))this.latched.has(b.id)?this.latched.delete(b.id):this.latched.add(b.id);
        this.pointers.set(e.pointerId,{kind:'toggle',controlId:b.id,x:e.clientX,y:e.clientY});
      }else this.pointers.set(e.pointerId,{kind,code,controlId:b?.id,combined:behavior==='aim-fire',codes:kind==='binding'?this.codesOf(b):[],x:e.clientX,y:e.clientY});
      this.updateButtons();
    });
    element.addEventListener('pointermove',e=>{const p=this.pointers.get(e.pointerId);if(!p||!this.active)return;e.preventDefault();e.stopPropagation();try{if(p.kind==='pad')this.move(e.clientX-p.x,e.clientY-p.y);p.x=e.clientX;p.y=e.clientY;}catch(error){this.handleInputFailure(error);}});
    const release=e=>{const p=this.pointers.get(e.pointerId);if(!p)return;this.pointers.delete(e.pointerId);if(p.combined)this.clearAimLatch();if(e.type!=='pointerup'&&p.kind==='toggle')this.latched.delete(p.controlId);e.stopPropagation();this.updateButtons();};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,release);
    element.addEventListener('contextmenu',e=>e.preventDefault());
  }
  bindJoystick(element){
    const update=e=>{
      const p=this.pointers.get(e.pointerId);if(p?.kind!=='joystick')return;
      const r=element.getBoundingClientRect(),g=this.geometry('joystick'),rx=r.width/2,ry=r.height/2;
      let x=(e.clientX-r.left-rx)/rx,y=(e.clientY-r.top-ry)/ry;
      p.sprintArmed=!!g.sprintEnabled&&y<=-1.3&&Math.abs(x)<.8;
      const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}
      p.codes=p.sprintArmed?this.sprintCodes():BxTouchpadHud.stickDirections(x,y).map(slot=>this.bindings.find(b=>b.slot===slot)?.code).filter(Boolean);
      this.knob.style.transform=`translate(${x*rx*.5}px,${y*ry*.5}px)`;element.dataset.sprintArmed=String(p.sprintArmed);this.updateButtons();
    };
    element.addEventListener('pointerdown',e=>{
      if(!this.active||this.editingHud||e.pointerType!=='touch')return;e.preventDefault();e.stopPropagation();
      if([...this.pointers.values()].some(p=>p.kind==='joystick'))return;
      this.sprintLatched=false;try{element.setPointerCapture(e.pointerId);}catch(error){NimboDiag.add('input','Não foi possível capturar o toque.',error.message);return;}this.pointers.set(e.pointerId,{kind:'joystick',codes:[],sprintArmed:false});update(e);
    });
    element.addEventListener('pointermove',e=>{if(this.pointers.get(e.pointerId)?.kind!=='joystick')return;e.preventDefault();e.stopPropagation();update(e);});
    const release=e=>{const p=this.pointers.get(e.pointerId);if(p?.kind!=='joystick')return;
      this.sprintLatched=e.type==='pointerup'&&p.sprintArmed&&!!this.geometry('joystick').sprintEnabled;
      this.pointers.delete(e.pointerId);this.knob.style.transform='translate(0,0)';element.dataset.sprintArmed='false';e.stopPropagation();this.updateButtons();
    };
    for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,release);
    element.addEventListener('contextmenu',e=>e.preventDefault());
  }
  sprintCodes(){const code=this.geometry('joystick').sprintCode;return [this.bindings.find(b=>b.slot==='w')?.code||'KeyW',BxTouchpad.keyOptions().includes(code)?code:'ShiftLeft'];}
  updateButtons(){
    let buttons=0;const wanted=new Set();const accept=code=>{if(code==='Mouse0')buttons|=1;else if(code==='Mouse2')buttons|=2;else if(code)wanted.add(code);};
    for(const p of this.pointers.values())for(const code of p.codes||[])accept(code);
    for(const id of this.latched||[]){const b=this.bindings.find(b=>b.id===id);if(this.behaviorOf(b)==='toggle')this.codesOf(b).forEach(accept);}
    if(this.sprintLatched&&this.geometry('joystick').sprintEnabled)this.sprintCodes().forEach(accept);
    const releasedMouse=(this.buttons&~buttons)!==0;this.buttons=buttons;
    const modifiers=['ControlLeft','ShiftLeft','AltLeft'];
    const ordered=new Set([...wanted].sort((a,b)=>Number(modifiers.includes(b))-Number(modifiers.includes(a))));
    if(this.active)try{if(releasedMouse)this.send();this.syncKeys(ordered);if(!releasedMouse)this.send();}catch(error){this.handleInputFailure(error);}
    this.refreshInputVisuals();
  }
  toggleHudVisibility(){this.hudHidden=!this.hudHidden;this.applyAllGeometry();this.refreshInputVisuals();}
  applyGeometry(id,element){
    super.applyGeometry(id,element);const b=this.bindings.find(b=>b.id===id);
    if(b?.action==='hud-visibility'){element.hidden=!this.editingHud&&(!this.active||!this.geometry(id).visible);element.style.opacity=String(Math.max(.4,this.geometry(id).opacity));}
    else if(this.hudHidden&&!this.editingHud)element.style.opacity='0';
  }
  renderMappedButtons(){
    super.renderMappedButtons();if(!this.elements)return;
    for(const b of this.bindings){const node=this.elements.get(b.id);if(!node)continue;
      if(b.action==='hud-visibility'){
        node.classList.remove('hud-unassigned');node.classList.add('bx-eye-control');node.textContent='';const glyph=document.createElement('span');glyph.className='bx-control-symbol';glyph.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path class="bx-eye-slash" d="m3 3 18 18"/></svg>';node.append(glyph);
        if(b.code===null){node.addEventListener('pointerdown',e=>{if(!this.active||this.editingHud)return;e.preventDefault();e.stopPropagation();this.toggleHudVisibility();});}
      }else if(this.behaviorOf(b)==='multi'){node.textContent=this.combination(b).map(BxTouchpadUnified.keyLabel).join(' + ')||'Combinação vazia';node.setAttribute('aria-label',node.textContent);}
    }
    if(this.stick&&this.geometry('joystick').sprintEnabled){const zone=document.createElement('span');zone.className='bx-sprint-zone';zone.setAttribute('aria-hidden','true');zone.innerHTML='<svg viewBox="0 0 24 24"><circle cx="15" cy="4" r="2"/><path d="m12 8 3 4 5 1M6 11l5-4 4 2-4 6-5 6m5-6 5 3-1 4"/></svg>';this.stick.append(zone);}
    this.applyAllGeometry();this.refreshInputVisuals();
  }
  refreshInputVisuals(){
    super.refreshInputVisuals();if(this.stick)this.stick.dataset.sprinting=String(!!this.sprintLatched);
    for(const b of this.bindings||[])if(b.action==='hud-visibility'){const node=this.elements?.get(b.id);if(node){node.dataset.hiddenHud=String(!!this.hudHidden);node.setAttribute('aria-label',this.hudHidden?'Mostrar HUD':'Ocultar HUD');}}
  }
  itemLabel(id){const b=this.bindings.find(b=>b.id===id);return b?.action==='hud-visibility'?'Olho · mostrar/ocultar HUD':this.behaviorOf(b)==='multi'?'Combinação: '+(this.combination(b).map(BxTouchpadUnified.keyLabel).join(' + ')||'vazia'):super.itemLabel(id);}
  editHud(){
    this.hudHidden=false;this.sprintLatched=false;super.editHud();if(!this.editingHud)return;
    const behavior=this.actionProperties.behavior,option=document.createElement('option');option.value='multi';option.textContent='Combinação: segurar múltiplas teclas';behavior.append(option);
    const oldChange=behavior.onchange;behavior.onchange=()=>{if(behavior.value==='multi')this.editorChange(()=>{const b=this.bindings.find(b=>b.id===this.selectedId);if(b){b.behavior='multi';b.combo=this.combination(b);if(!b.combo.length&&b.code)b.combo=[b.code];this.renderMappedButtons();this.selectHud(b.id);}});else oldChange();};
    const box=document.createElement('div');box.className='bx-combo-editor';const info=document.createElement('p');info.textContent='Até 8 comandos simultâneos. Todos soltam ao levantar o dedo.';
    const command=document.createElement('select');command.setAttribute('aria-label','Comando para a combinação');for(const code of BxTouchpad.keyOptions()){const o=document.createElement('option');o.value=code;o.textContent=BxTouchpadUnified.keyLabel(code);command.append(o);}
    const add=document.createElement('button');add.type='button';add.textContent='+ Comando';add.onclick=()=>this.editorChange(()=>{const b=this.bindings.find(b=>b.id===this.selectedId);if(!b)return;const combo=this.combination(b);if(combo.length<8&&!combo.includes(command.value))combo.push(command.value);b.combo=combo;b.code=combo[0]||null;this.renderMappedButtons();this.selectHud(b.id);});
    const chips=document.createElement('div');box.append(info,command,add,chips);this.propertyBody.append(box);this.comboEditor={box,chips};
    const sprintBox=document.createElement('div');const label=document.createElement('label'),enabled=document.createElement('input');enabled.type='checkbox';label.append(enabled,document.createTextNode(' Arrastar para travar corrida'));
    const key=document.createElement('select');key.setAttribute('aria-label','Tecla para correr');for(const code of BxTouchpad.keyOptions().filter(c=>!c.startsWith('Mouse'))){const o=document.createElement('option');o.value=code;o.textContent=BxTouchpadUnified.keyLabel(code);key.append(o);}
    const hint=document.createElement('p');hint.textContent='Arraste para o corredor acima do analógico e solte. Mantém a direção para frente e a tecla de corrida. Toque no analógico para parar.';
    enabled.onchange=()=>this.editorChange(()=>{this.geometry('joystick').sprintEnabled=enabled.checked;this.renderMappedButtons();this.selectHud('joystick');});key.onchange=()=>this.editorChange(()=>{this.geometry('joystick').sprintCode=key.value;});sprintBox.append(label,key,hint);this.propertyBody.append(sprintBox);this.sprintEditor={box:sprintBox,enabled,key};
    const library=this.propertyBody.querySelector('[aria-label="Biblioteca de controles"]');if(library){for(const [value,text]of [['visibility','Olho · mostrar/ocultar HUD'],['multi','Combinação de teclas']]){const o=document.createElement('option');o.value=value;o.textContent=text;library.append(o);}}
    this.selectHud(this.selectedId);
  }
  addBlank(x,y){
    const choice=this.libraryChoice;
    if(!['visibility','multi'].includes(choice)){super.addBlank(x,y);return;}
    this.editorChange(()=>{this.libraryChoice='blank';const count=this.bindings.length;super.addBlank(x,y);if(this.bindings.length===count)return;const b=this.bindings.find(b=>b.id===this.selectedId);if(choice==='visibility'){b.action='hud-visibility';b.code=null;}else{b.behavior='multi';b.combo=[];b.code=null;}this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(b.id);});
  }
  selectHud(id){
    super.selectHud(id);const b=this.bindings.find(b=>b.id===this.selectedId);
    if(this.actionProperties&&b?.action==='hud-visibility'){this.actionProperties.box.hidden=true;this.properties.keyRow.hidden=true;}
    if(this.comboEditor){const {box,chips}=this.comboEditor;box.hidden=this.behaviorOf(b)!=='multi';chips.replaceChildren();if(b)for(const code of this.combination(b)){const chip=document.createElement('button');chip.type='button';chip.textContent=BxTouchpadUnified.keyLabel(code)+' ×';chip.setAttribute('aria-label','Remover '+BxTouchpadUnified.keyLabel(code)+' da combinação');chip.onclick=()=>this.editorChange(()=>{b.combo=this.combination(b).filter(c=>c!==code);b.code=b.combo[0]||null;this.renderMappedButtons();this.selectHud(b.id);});chips.append(chip);}if(this.behaviorOf(b)==='multi')this.properties.keyRow.hidden=true;}
    if(this.sprintEditor){const p=this.sprintEditor;p.box.hidden=this.selectedId!=='joystick';p.enabled.checked=!!this.geometry('joystick').sprintEnabled;p.key.value=this.geometry('joystick').sprintCode||'ShiftLeft';}
  }
  finishEditing(cancel,returnToSettings=true){this.comboEditor=null;this.sprintEditor=null;super.finishEditing(cancel,returnToSettings);}
  refreshNativeSections(){super.refreshNativeSections();if(this.wanted&&!this.active)for(const panel of this.nativeSections||[])panel.state.textContent='Ligado · pausado enquanto houver menu, falta de foco ou indisponibilidade da sessão. Retoma automaticamente; Desativar desliga a escolha.';this.updateShortcut();}
  updateShortcut(){touchPanel.refresh();}
  
  mount(){
    const hadRoot=!!this.root;super.mount();if(!hadRoot&&this.root){const style=document.createElement('style');style.textContent=`
#nimbo-touch-root .bx-eye-control .bx-control-symbol{width:65%;height:65%}
#nimbo-touch-root .bx-eye-slash{display:none}
#nimbo-touch-root .bx-eye-control[data-hidden-hud=true] .bx-eye-slash{display:block}
#nimbo-touch-root .bx-sprint-zone{position:absolute;left:50%;top:-64px;transform:translateX(-50%);width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:1px dashed #c9e4d2aa;border-radius:50%;background:#18312488;pointer-events:none;color:#e4f7eb}
#nimbo-touch-root .bx-sprint-zone svg{width:27px;height:27px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
#nimbo-touch-root .hud-stick[data-sprinting=true] .bx-sprint-zone,#nimbo-touch-root .hud-stick[data-sprint-armed=true] .bx-sprint-zone{background:#b8edcf;color:#143124;border-style:solid}
#nimbo-touch-root .bx-combo-editor button{margin:3px;min-height:40px}
#StreamHud .bx-touchpad-shortcut-on{box-shadow:inset 0 -3px 0 #b8edcf}
`;this.root.append(style);}
    if(this.wanted&&STATES.isPlaying){this.desiredSession=api?.streamSession;this.retryAt=0;this.ensureResumeWatch();}
  }
}

class BxTouchpadSettings extends BxTouchpadToolkit {
  openInputSettings(){
    this.openTouchSettings();
    
  }
  updateShortcut(){touchPanel.refresh();}
  
}

class NimboPlayControls extends BxTouchpadSettings {
  constructor(){super();this.menuBlocked=false;this.recoilTimer=null;this.recoilStartedAt=0;this.recoilRemainder=0;this.recoilConfig={enabled:false,strength:1,delay:100};try{const data=JSON.parse(localStorage.getItem('NimboTouch.recoil.v1')||'{}');this.recoilConfig={enabled:data.enabled===true,strength:Number.isFinite(data.strength)?Math.max(0,Math.min(8,data.strength)):1,delay:Number.isFinite(data.delay)?Math.max(0,Math.min(300,data.delay)):100};}catch{}}
  setMenuBlocked(blocked){const next=!!blocked;if(this.menuBlocked===next)return;this.menuBlocked=next;if(next){this.stopRecoil();if(this.active)this.pause('Menu NX/xCloud aberto');}else if(this.wanted){this.retryAt=0;this.ensureResumeWatch();this.checkResume();}}
  setRecoilConfig(patch){this.recoilConfig={...this.recoilConfig,...patch};try{localStorage.setItem('NimboTouch.recoil.v1',JSON.stringify(this.recoilConfig));}catch(e){NimboDiag.add('dados','Não foi possível salvar compensação',String(e));}this.syncRecoil();}
  syncRecoil(){
    const firing=this.active&&!this.editingHud&&this.recoilConfig.enabled&&this.recoilConfig.strength>0&&(this.buttons&1)!==0&&!document.hidden&&document.hasFocus()&&!touchPanel.isOpen&&!this.menuBlocked;
    if(!firing){if(this.recoilTimer!==null){clearInterval(this.recoilTimer);this.recoilTimer=null;}this.recoilStartedAt=0;this.recoilRemainder=0;return;}
    if(this.recoilTimer!==null)return;
    this.recoilStartedAt=performance.now();const epoch=this.epoch;
    this.recoilTimer=setInterval(()=>{
      if(epoch!==this.epoch||!this.active||!this.recoilConfig.enabled||!(this.buttons&1)||this.editingHud||document.hidden||!document.hasFocus()||touchPanel.isOpen||this.menuBlocked){this.syncRecoil();return;}
      if(performance.now()-this.recoilStartedAt<this.recoilConfig.delay)return;
      this.recoilRemainder+=this.recoilConfig.strength;const dy=Math.trunc(this.recoilRemainder);this.recoilRemainder-=dy;
      if(dy>0)try{this.send(0,dy);}catch(e){this.syncRecoil();this.handleInputFailure(e);}
    },40);
  }
  updateButtons(){super.updateButtons();this.syncRecoil();}
  pause(reason){this.stopRecoil();super.pause(reason);}
  stop(){this.stopRecoil();super.stop();}
  stopRecoil(){if(this.recoilTimer!==null)clearInterval(this.recoilTimer);this.recoilTimer=null;this.recoilStartedAt=0;this.recoilRemainder=0;}
  static actions={'hud-visibility':'Ocultar/mostrar HUD','scroll-up':'Scroll ↑ · um passo','scroll-down':'Scroll ↓ · um passo','scroll-drag':'Scroll ↕ · deslizar'};
  special(b){return !!b&&!b.slot&&Object.hasOwn(NimboPlayControls.actions,b.action);}
  itemLabel(id){const b=this.bindings.find(b=>b.id===id);return this.special(b)?NimboPlayControls.actions[b.action]:super.itemLabel(id);}
  codesOf(b){return this.special(b)?[]:super.codesOf(b);}
  setAction(id,action){
    this.editorChange(()=>{const b=this.bindings.find(b=>b.id===id);if(!b||b.slot)return;
      delete b.behavior;delete b.combo;delete b.icon;b.code=null;b.action=action;
      this.renderMappedButtons();this.refreshEditorOptions();this.selectHud(id);
    });
  }
  selectHud(id){
    super.selectHud(id);const b=this.bindings.find(b=>b.id===this.selectedId);
    if(this.properties&&b&&!b.slot){this.properties.keyRow.hidden=false;this.properties.key.value=this.special(b)?'action:'+b.action:(b.code||'');}
    if(this.special(b)&&this.actionProperties)this.actionProperties.box.hidden=true;
    if(this.scrollSettings){this.scrollSettings.row.hidden=b?.action!=='scroll-drag';this.scrollSettings.input.value=String(this.scrollStep(b));}
  }
  scrollStep(b){return Number.isFinite(b?.scrollStep)?Math.min(100,Math.max(4,b.scrollStep)):20;}
  editHud(){
    super.editHud();if(!this.properties)return;
    const keys=this.properties.key;
    for(const [action,label]of Object.entries(NimboPlayControls.actions)){const o=document.createElement('option');o.value='action:'+action;o.textContent=label;keys.append(o);}
    const old=keys.onchange;
    keys.onchange=()=>{const value=keys.value;if(value.startsWith('action:')){this.setAction(this.selectedId,value.slice(7));return;}
      this.editorChange(()=>{const b=this.bindings.find(b=>b.id===this.selectedId);if(b)delete b.action;old();});};
    const library=this.propertyBody.querySelector('[aria-label="Biblioteca de controles"]');
    if(library){for(const [value,label]of Object.entries(NimboPlayControls.actions)){if(value==='hud-visibility')continue;const o=document.createElement('option');o.value=value;o.textContent=label;library.append(o);}
      const original=library.onchange;library.onchange=()=>{const value=library.value;
        if(value==='visibility'||Object.hasOwn(NimboPlayControls.actions,value)){
          library.value='';this.libraryChoice=value;this.addBlank(window.innerWidth/2,window.innerHeight/2);this.setInspectorCollapsed(false);
          this.properties.note.textContent='Controle adicionado. Arraste para posicionar; não é necessário vincular uma tecla.';
        }else original();};
    }
    const row=document.createElement('label');row.textContent='Distância por passo do scroll (px) ';
    const input=document.createElement('input');input.type='range';input.min='4';input.max='100';input.step='1';input.setAttribute('aria-label','Distância por passo do scroll');
    input.oninput=()=>this.editorChange(()=>{const b=this.bindings.find(b=>b.id===this.selectedId);if(b)b.scrollStep=Number(input.value);});
    row.append(input);this.propertyBody.append(row);this.scrollSettings={row,input};this.selectHud(this.selectedId);
  }
  addBlank(x,y){
    const choice=this.libraryChoice,action=choice==='visibility'?'hud-visibility':choice;
    if(!Object.hasOwn(NimboPlayControls.actions,action)){super.addBlank(x,y);return;}
    this.editorChange(()=>{this.libraryChoice='blank';const count=this.bindings.length;super.addBlank(x,y);this.libraryChoice=null;
      if(this.bindings.length>count)this.setAction(this.selectedId,action);
    });
  }
  applyGeometry(id,element){
    super.applyGeometry(id,element);const b=this.bindings.find(b=>b.id===id);
    if(this.special(b)){element.hidden=!this.editingHud&&(!this.active||!this.geometry(id).visible);element.classList.remove('hud-unassigned');}
  }
  wheel(steps){
    if(!this.active||this.editingHud||!steps)return;
    try{
      if(remoteInputRequested()){
        const ready=remoteInputReady();
        if(!ready&&remoteInputRequested())return;
        if(remoteInputRequested()){
          if(remoteInputAdapter.sendMouse({X:0,Y:0,Buttons:this.buttons,WheelX:0,WheelY:steps*120,Relative:1},'touch',false)===false)throw Error('Canal de scroll xHome indisponível');
          return;
        }
      }
      const channel=api?.inputChannel;if(typeof channel?.queueMouseInput!=='function')throw Error('Canal de scroll indisponível');
      // Same sign as WheelEvent.deltaY: negative up, positive down.
      channel.queueMouseInput({Type:0,X:0,Y:0,Buttons:this.buttons,WheelX:0,WheelY:steps*120});
    }catch(e){this.handleInputFailure(e);}
  }
  renderMappedButtons(){
    super.renderMappedButtons();
    for(const b of this.bindings||[]){if(!b.action?.startsWith('scroll-'))continue;const node=this.elements?.get(b.id);if(!node)continue;
      node.textContent=b.action==='scroll-up'?'↟':b.action==='scroll-down'?'↡':'↕';node.setAttribute('aria-label',this.itemLabel(b.id));
      let pointer=null,lastY=0,remainder=0,epoch=0;
      node.addEventListener('pointerdown',e=>{if(!this.active||this.editingHud||pointer!==null)return;e.preventDefault();e.stopPropagation();pointer=e.pointerId;epoch=this.epoch;lastY=e.clientY;remainder=0;node.setPointerCapture(pointer);
        if(b.action!=='scroll-drag')this.wheel(b.action==='scroll-up'?-1:1);
      });
      node.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!this.active||this.editingHud||epoch!==this.epoch||b.action!=='scroll-drag')return;e.preventDefault();e.stopPropagation();
        const delta=e.clientY-lastY;lastY=e.clientY;if(!Number.isFinite(delta))return;
        if(remainder&&Math.sign(delta)!==Math.sign(remainder))remainder=0;
        remainder+=delta;const step=this.scrollStep(b),count=Math.trunc(remainder/step);if(count){remainder-=count*step;this.wheel(count);}
      });
      const end=e=>{if(e.pointerId!==pointer)return;e.stopPropagation();pointer=null;remainder=0;};
      for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,end);
    }
    this.applyAllGeometry();
  }
  
}



function nimboFindReactSession(){
  const root=document.getElementById('root')||document.body;if(!root)return;
  const key=Object.keys(root).find(k=>k.startsWith('__reactFiber$')||k.startsWith('__reactContainer$'));
  if(!key)return;const first=root[key]?.current||root[key];
  if(first!==nimboFiberRoot||nimboFiberIndex>=nimboFiberQueue.length){nimboFiberRoot=first;nimboFiberQueue=[first];nimboFiberIndex=0;}
  const start=performance.now();let steps=0;
  while(nimboFiberIndex<nimboFiberQueue.length&&nimboFiberQueue.length<40000){
    if((steps++&63)===0&&performance.now()-start>5)return;
    const fiber=nimboFiberQueue[nimboFiberIndex++];if(!fiber)continue;
    let state=fiber.memoizedState;
    for(let depth=0;state&&depth<10;depth++,state=state.next){
      const candidate=state.memoizedState?.data?._session;
      if(candidate&&!candidate.isShutdown&&typeof candidate.onVirtualMouseInput==='function'&&typeof candidate.updateInputConfigurationAsync==='function'){
        nimboCapture(candidate);nimboFiberQueue=[];nimboFiberIndex=0;return;
      }
    }
    if(fiber.child)nimboFiberQueue.push(fiber.child);if(fiber.sibling)nimboFiberQueue.push(fiber.sibling);
  }
}


// Only explicit stop restores configuration. Opening the HUD editor temporarily pauses input.
const stop= NimboPlayControls.prototype.stop;
NimboPlayControls.prototype.stop=function(...args){
 const owner=nimboTransport;
 try{return stop.apply(this,args);}finally{
  queueMicrotask(()=>{if(this.wanted||!owner)return;owner.restore().catch(e=>NimboDiag.add('entrada','Falha ao restaurar a sessão',e.message));});
 }
};
const start=NimboPlayControls.prototype.start;
NimboPlayControls.prototype.start=async function(...args){
 const result=await start.apply(this,args);
 if(this.active){this.reparent();this.applyAllGeometry();requestAnimationFrame(()=>{if(this.active)this.applyAllGeometry();});}
 return result;
};
function pollSession(){
 try{
  if(nimboGameStream?.session)nimboCapture(nimboGameStream.session);
  if(nimboCandidate&&!nimboCandidate.isShutdown&&nimboCandidate.connectionState==='Connected')nimboCapture(nimboCandidate);
  if(nimboTransport&&!nimboTransport.connected()){
   ui?.stop();const old=nimboTransport;nimboTransport=null;api.streamSession=null;api.inputChannel=null;STATES.isPlaying=false;old.dispose().catch(()=>{});
  }
  // Bounded React traversal is a fallback for sessions created before the module hook.
  if(!nimboTransport?.connected())nimboFindReactSession();
  syncTouchVisibility();touchPanel.refresh();
 }catch(e){NimboDiag.add('sessão','Não foi possível localizar a sessão',e.message);}
}
function boot(){
 if(!document.documentElement||!document.body)return;
 try{
  ui=new NimboPlayControls();ui.loadUnified();ui.loadProfiles();ui.mount();syncTouchVisibility();touchPanel.mount();
  document.addEventListener('fullscreenchange',()=>{touchPanel.reparent();ui.reparent();ui.applyAllGeometry();});
  window.addEventListener('resize',()=>{if(ui.root)ui.applyAllGeometry();});
  document.addEventListener('pointerdown',()=>{if(ui.wanted&&!ui.active&&!ui.busy&&!document.hidden){ui.focused=true;ui.retryAt=0;ui.ensureResumeWatch();}},true);
  window.addEventListener('pagehide',()=>ui.stop());
  pollSession();setInterval(pollSession,1500);
 }catch(e){NimboDiag.add('inicialização','Falha ao iniciar Nimbo Touch',e.message);const notice=document.createElement('div');notice.textContent='Nimbo Touch não iniciou: '+e.message;notice.style.cssText='position:fixed;top:8px;left:8px;z-index:2147483647;background:#331a1a;color:white;padding:12px';document.documentElement.append(notice);}
}
// Public integration point: a host may route virtual controls to an alternate authorized session.
function setRemoteInputAdapter(adapter){
 if(adapter===null){remoteInputAdapter=null;if(ui?.desiredSession==='xhome')ui.stop();return true;}
 if(!adapter||typeof adapter.isEnabled!=='function'||typeof adapter.isReady!=='function'||typeof adapter.isTransportReady!=='function'||typeof adapter.sendKey!=='function'||typeof adapter.sendMouse!=='function')return false;
 remoteInputAdapter=adapter;
 if(ui?.wanted){if(remoteInputRequested())ui.desiredSession='xhome';ui.retryAt=0;ui.checkResume();}
 return true;
}
function refreshRemoteInput(){
 if(!ui)return;
 if(remoteInputRequested()){if(ui.wanted){ui.desiredSession='xhome';ui.retryAt=0;ui.checkResume();}}
 else if(ui.desiredSession==='xhome')ui.stop();
}
window.NimboTouch=Object.freeze({version:VERSION,attachSession:nimboCapture,open:()=>{remoteInputAdapter?.releaseAll?.();touchPanel.open();},stop:()=>ui?.stop(),diagnostic,isEnabled:()=>!!ui?.wanted,toggle:()=>{remoteInputAdapter?.releaseAll?.();touchPanel.mount();touchPanel.toggle.click();},setMenuBlocked:blocked=>ui?.setMenuBlocked(blocked),setRemoteInputAdapter,refreshRemoteInput,hasCloudSession:()=>!!(STATES.isPlaying||nimboTransport?.connected()||(nimboCandidate&&nimboCandidate.connectionState==='Connected')),isPanelOpen:()=>!!touchPanel.isOpen,isRemoteInputActive:()=>remoteInputRequested()});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

function syncTouchVisibility(){
 if(ui?.root)ui.root.hidden=!(ui.active||ui.editingHud);
}
for(const method of ['start','stop','pause','editHud','finishEditing']){
 const original=NimboPlayControls.prototype[method];
 NimboPlayControls.prototype[method]=function(...args){
  try{const result=original.apply(this,args);if(result?.then)return result.finally(syncTouchVisibility);return result;}
  finally{syncTouchVisibility();}
 };
}

})();