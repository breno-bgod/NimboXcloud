'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
function section(start,end){const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return src.slice(a,b);}
// Minimal DOM semantics used by the real composition helpers: moving a node must
// remove it from its original group, or a duplicated/missing setting is concealed.
class Node {
 constructor(tag='div',text=''){this.tagName=tag;this.children=[];this.parentElement=null;this._text=text;this.style={};this.listeners={};this.attrs={};}
 get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 set textContent(value){for(const n of this.children)n.parentElement=null;this.children=[];this._text=value;}
 get firstElementChild(){return this.children[0]||null;}
 get options(){return this.children.filter(n=>n.tagName==='option');}
 appendChild(node){node.remove();this.children.push(node);node.parentElement=this;return node;}
 append(...nodes){for(const n of nodes)this.appendChild(n);}
 replaceChildren(...nodes){this.textContent='';this.append(...nodes);}
 remove(){if(this.parentElement){const a=this.parentElement.children;a.splice(a.indexOf(this),1);this.parentElement=null;}}
 setAttribute(key,value){this.attrs[key]=value;}
 addEventListener(type,listener){this.listeners[type]=listener;}
 querySelectorAll(tag){return this.children.flatMap(n=>[...(n.tagName===tag?[n]:[]),...n.querySelectorAll(tag)]);}
}
function harness(){
 const ctx={document:{createElement:tag=>new Node(tag)},C:{dim:'#888',line:'#333',panel:'#111',accent:'#0f0',text:'#fff'},
  mk:(tag,style,text)=>{const n=new Node(tag,text||'');n.style.cssText=style;return n;},
  liveFns:[],getPref:(key,fallback)=>fallback,stopEv(){},
  PRESETS:[{name:'Máximo',res:'hq',sub:'1080p HQ'},{name:'Padrão',res:'auto',sub:'1080p'}],
  RES_MODES:{hq:{},auto:{}},resCfg:()=>({}),
  nxVisualStatus:()=> 'Filtros padrão',nxGpuStatus:()=> 'Desligada',nxResetVisualSettings(){},
  actBtn:(label,callback)=>{const n=new Node('button',label);n.action=callback;return n;},
  note:message=>new Node('p',message),nxBindControls:(root,category)=>root.appendChild(new Node('div','Atalho '+category)),
  nxPointerControls:root=>root.appendChild(new Node('div','CAPTURA DO MOUSE FÍSICO')),
  nxInputModePage:root=>root.appendChild(new Node('div','SELETOR ÚNICO')),
  nxPanelSettingsPage:root=>root.appendChild(new Node('div','APARÊNCIA DO PAINEL')),
  nxMonitorSettingsPage:root=>root.appendChild(new Node('div','APARÊNCIA DO MONITOR')),
  chips:()=>new Node('div'),toggle:()=>new Node('div'),getAudioBands:()=>Array(10).fill(0),
  nxVideoCalibration:()=>({brightness:100,contrast:100,saturation:100}),nxVisualLibrary:()=>[{name:'Local'}],
  LS_VIDEO_PROFILE:'profile',LS_VIDEO_FIT:'fit',LS_VIDEO_ECO:'eco',LS_VIDEO_BRIGHTNESS:'brightness',LS_VIDEO_CONTRAST:'contrast',LS_VIDEO_SATURATION:'saturation',
  LS_AUDIO_OUTPUT:'output',LS_AUDIO_FX:'audiofx',LS_AUDIO_BALANCE:'balance',LS_AUDIO_COMP:'compressor',LS_AUDIO_NORMAL:'normal',LS_AUDIO_LIMIT:'limit',LS_AUDIO_DIALOG:'dialog',LS_AUDIO_MONO:'mono',LS_AUDIO_PRESET:'preset',
  LS_NX_GPU:'gpu',LS_NX_SHADOWS:'shadows',LS_NX_HIGHLIGHTS:'highlights',
  nxAudioOutputSupport:()=>({canRoute:false}),
  nxConsoleLabFullScreen(){},activeStreamAudio:()=>null,sliderDragging:false,S:{},tabId:'video'};
 vm.createContext(ctx);
 vm.runInContext(section('  function group(title, hint) {','  function liveDesc(')+section('  function liveDesc(row, getter) {','  function chips('),ctx);
 const group=(title,rows=[])=>{const g=ctx.group(title);for(const name of rows)g.add(ctx.setRow(name,'',new Node('button',name+' action')));return g.root;};
 const controls=root=>[
  group('Dispositivo',['Experiência','Dispositivo detectado']),
  group('Entradas detectadas',['Controles conectados','Controles com atividade','Última alteração de conexão','Falhas de leitura']),
  group('Acessórios',['Microfone','Vibração']),group('Teclado e mouse',['Módulo','Configurar teclado e mouse']),
  group('Perfis de analógico',['Perfil esquerdo','Perfil direito']),group('Giroscópio',['Calibração','Amostras recebidas']),
  group('Coordenação de entradas — diagnóstico',['Fontes observadas']),group('Editor de HUD — prévia arrastável',['Prévia'])
 ].forEach(n=>root.appendChild(n));
 const system=root=>['Desempenho','Detalhes do link','Rede','Compatibilidade','Sistema','Ferramentas','Rodapé'].forEach(t=>root.appendChild(group(t)));
 const mediaBody=section('    media: function (root, category) {','    controls: function (root, category) {');
 const literal=mediaBody.slice(mediaBody.indexOf('function'),mediaBody.lastIndexOf('},')+1);
 const actualMedia=vm.runInContext('('+literal+')',ctx);
 ctx.TAB_BUILDERS={advanced:system,region:()=>{throw Error('A região antiga não deve ser montada');},
  controls,media:actualMedia,stream:root=>root.appendChild(group('Monitor de transmissão'))};
 vm.runInContext(section('  // Categorias organizadas por responsabilidade;','  function setTab(id) {'),ctx);
 const titles=root=>root.children.map(n=>ctx.nxGroupTitle(n));
 return {ctx,Node,group,titles,build:id=>{const n=new Node();ctx.TAB_BUILDERS[id](n);return n;}};
}

test('video uses the real media builder and places requested quality and framing above image controls',()=>{
 const h=harness(),root=h.build('video');const titles=h.titles(root);
 assert.deepEqual(titles.slice(0,6),['Qualidade do streaming','Qualidade recebida','Dispositivo','Ajuste à tela','Imagem','Perfis de imagem']);
 const presentation=root.children[3],image=root.children[4];
 assert.match(presentation.textContent,/Enquadramento/);assert.doesNotMatch(root.textContent,/Economia de recursos/);
 assert.doesNotMatch(image.textContent,/Enquadramento|Tela cheia|Economia de recursos/);
 assert.match(image.textContent,/Brilho/);assert.match(root.textContent,/Salvar perfil/);
 assert.doesNotMatch(root.textContent,/Importar JSON|Exportar JSON/);
 assert.match(root.textContent,/Restaurar configurações visuais/);
 assert.doesNotMatch(root.textContent,/Restaurar GPU|Restaurar imagem/);
});

test('audio/voice composition puts only microphone above the playback settings',()=>{
 const h=harness(),root=h.build('audio');
 assert.equal(h.titles(root)[0],'Microfone e entrada de voz');assert.equal(h.titles(root)[1],'Áudio');
 assert.doesNotMatch(root.children[0].textContent,/Vibração/);
 assert.match(root.children[1].textContent,/Volume|Equalizador/);
});

test('system includes compatibility and keeps technical input diagnostics out of device tuning',()=>{
 const h=harness(),system=h.build('advanced');
 assert.deepEqual(h.titles(system).slice(0,4),['Compatibilidade','Sistema','Ferramentas','Rodapé']);
 assert.match(system.textContent,/Diagnóstico técnico de entradas/);
 assert.match(system.textContent,/Fontes observadas/);
 const pad=h.build('gamepad'),keyboard=h.build('gyrotouch');
 assert.doesNotMatch(pad.textContent,/Fontes observadas|Última alteração de conexão|Falhas de leitura/);
 assert.doesNotMatch(keyboard.textContent,/Módulo|Dispositivo detectado|Ativação|Toque e mouse detectados/);
 assert.match(keyboard.textContent,/CAPTURA DO MOUSE FÍSICO/);
 assert.doesNotMatch(keyboard.textContent,/Configurar teclado e mouse/);
});

test('one input page embeds both device builders without duplicated activation',()=>{
 const h=harness(),root=h.build('inputs');
 assert.equal(root.textContent.split('SELETOR ÚNICO').length-1,1);
 assert.match(root.textContent,/Ajustes do controle físico/);assert.match(root.textContent,/Ajustes de teclado e mouse/);
 assert.match(root.textContent,/Atalho gamepad/);assert.match(root.textContent,/Atalho keyboard/);
 assert.doesNotMatch(root.textContent,/Escolher entrada|Ativar HUD/);
 assert.equal(root.children[1].tagName,'details');assert.equal(root.children[1].open,undefined);
});

test('interface contains both appearance systems while statistics retains metrics and a link',()=>{
 const h=harness();
 vm.runInContext(section('  TAB_BUILDERS.personalize=function(root){','  TAB_BUILDERS.overview=function(root){'),h.ctx);
 const ui=h.build('personalize');assert.equal(ui.textContent,'APARÊNCIA DO PAINELAPARÊNCIA DO MONITOR');
 const stats=h.build('statistics');assert.match(stats.textContent,/Monitor de transmissão|Desempenho/);
 assert.doesNotMatch(stats.textContent,/APARÊNCIA DO MONITOR|APARÊNCIA DO PAINEL/);
});

test('old destinations resolve to the merged pages, including a retired store-region destination',()=>{
 const h=harness();
 for(const [old,destination]of Object.entries({images:'video',voice:'audio',compatibility:'advanced',region:'stream',gamepad:'inputs',gyrotouch:'inputs'}))
  assert.equal(h.ctx.nxCanonicalTab(old),destination);
});

test('vertical monitor creates real line breaks',()=>{
 const monitor=new Node();
 const ctx={nxTelemetryEnabled:true,document:{hidden:false},streaming:()=>true,nxTelemetryEnsure:()=>monitor,
  nxMonitorCollect(){},nxLaunch:{startedAt:0},mountTarget:()=>null,nxMonitor:{layout:'vertical',fields:['fps','rtt'],scale:100,opacity:45,color:'white'},
  S:{qos:{fps:60,rtt:25}},fmtN:(n,unit='')=>n+unit,curLoss:()=>0,nxMonitorPlace(){}};
 vm.runInNewContext(section('  function nxTelemetryTick(){','  setInterval(nxTelemetryTick,')+'\nglobalThis.tick=nxTelemetryTick;',ctx);
 ctx.tick();assert.equal(monitor.textContent,'FPS 60\nRTT 25 ms');
});

test('restoration actions are actually moved after normal settings while retaining their handlers',()=>{
 const h=harness(),row=h.ctx.setRow('Restaurar imagem','',new Node('button','Restaurar'));
 row.children[1].action=()=>42;
 const original=h.ctx.group('Imagem');original.add(h.ctx.setRow('Brilho','',new Node()));original.add(row);
 const root=new Node();root.appendChild(original.root);
 vm.runInContext(section('  function nxMoveRecoveryActionsToEnd(root) {','  function renderBody('),h.ctx);
 h.ctx.nxMoveRecoveryActionsToEnd(root);
 assert.equal(root.children.length,2);assert.equal(h.ctx.nxGroupTitle(root.children[1]),'Restaurar e limpar');
 assert.equal(row.parentElement,root.children[1].children[1]);assert.equal(row.children[1].action(),42);
});

test('GPU brightness and contrast follow the same order as CSS over shadows, midtones and highlights',()=>{
 const tone=section(' float shadows=',' float grey=');
 const code=tone.split('\n').filter(line=>/c=/.test(line)&&/u_adjust/.test(line)).join('\n')
  .replaceAll('u_adjust.x','brightness').replaceAll('u_adjust.y','contrast');
 const gpu=vm.runInNewContext('(function(c,brightness,contrast){'+code+';return c;})',{clamp:(x,min,max)=>Math.max(min,Math.min(max,x))});
 const clamp=x=>Math.max(0,Math.min(1,x));
 for(const x of [0,.1,.5,.9,1])for(const brightness of [.85,1,1.15])for(const contrast of [.85,1,1.15]){
  const css=clamp((clamp(x*brightness)-.5)*contrast+.5);
  assert.ok(Math.abs(gpu(x,brightness,contrast)-css)<1e-12);
 }
});


test('monitor preserves Remote Play after a cloud session and rejects metrics from another peer',()=>{
 const monitor=new Node(),peer={};const ctx={nxTelemetryEnabled:true,document:{hidden:false},streaming:()=>true,nxTelemetryEnsure:()=>monitor,
  nxMonitorCollect(){},nxLaunch:{startedAt:100,phase:'idle'},nxRemotePlay:{peer,requestId:2,sessionStatus:'connected'},
  mountTarget:()=>null,nxMonitor:{layout:'vertical',fields:['server','fps'],scale:100,opacity:45,color:'white'},
  S:{qos:{fps:60},qosAt:200,lastPc:peer},fmtN:n=>String(n),curLoss:()=>0,nxMonitorPlace(){}};
 vm.runInNewContext(section('  function nxTelemetryTick(){','  setInterval(nxTelemetryTick,')+'\nglobalThis.tick=nxTelemetryTick;',ctx);
 ctx.tick();assert.match(monitor.textContent,/Remote Play/);assert.match(monitor.textContent,/FPS 60/);assert.doesNotMatch(monitor.textContent,/Servidor não identificado/);
 ctx.nxTelemetryEl=monitor;ctx.S.lastPc={};ctx.tick();assert.equal(monitor.style.display,'none');
});
