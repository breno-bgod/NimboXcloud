'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
function part(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
class Style {
 constructor(){this.values={};this.priorities={};}
 setProperty(key,value,priority=''){
  // Model CSSOM decimal serialization rather than echoing the input string.
  this.values[key]=String(value).replace(/(\d*\.\d+)/g,n=>String(Number(n)));this.priorities[key]=priority;
 }
 getPropertyValue(key){return this.values[key]||'';}
 getPropertyPriority(key){return this.priorities[key]||'';}
 removeProperty(key){delete this.values[key];delete this.priorities[key];}
 get filter(){return this.getPropertyValue('filter');}set filter(value){this.setProperty('filter',value);}
 get opacity(){return this.getPropertyValue('opacity');}set opacity(value){this.setProperty('opacity',value);}
 get objectFit(){return this.getPropertyValue('object-fit');}set objectFit(value){this.setProperty('object-fit',value);}
}
function harness(options={}){
 const prefs={profile:'custom',brightness:'115',contrast:'110',saturation:'90',gpu:'1',...options.prefs};
 const calls=[],messages=[],frames=new Map(),timers=new Map(),canvases=[];let next=1;
 const video={style:new Style(),videoWidth:2560,videoHeight:1440,readyState:4,paused:false,isConnected:true,
  getBoundingClientRect:()=>({left:120,top:30,width:1280,height:720}),
  srcObject:{getVideoTracks:()=>[{readyState:'live'}]}};
 const gl={NO_ERROR:0,TEXTURE0:1,TEXTURE_2D:2,LINK_STATUS:3,COMPILE_STATUS:4,
  VERTEX_SHADER:5,FRAGMENT_SHADER:6,RGBA:7,UNSIGNED_BYTE:8,TRIANGLE_STRIP:9,
  createShader:()=>({shader:true}),shaderSource(){},compileShader(){},getShaderParameter:()=>options.compileFailure!==true,
  getShaderInfoLog:()=> 'shader recusado',deleteShader(){},createProgram:()=>({program:true}),attachShader(){},linkProgram(){},
  getProgramParameter:()=>true,deleteProgram:()=>calls.push(['delete-program']),
  createBuffer:()=>({buffer:true}),bindBuffer(){},bufferData(){},deleteBuffer(){},
  useProgram(){},getAttribLocation:()=>0,enableVertexAttribArray(){},vertexAttribPointer(){},
  activeTexture(){},createTexture:()=>({texture:true}),bindTexture(){},texParameteri(){},deleteTexture(){},
  getUniformLocation:(program,key)=>key,uniform1i:(key,value)=>calls.push([key,value]),uniform1f:(key,value)=>calls.push([key,value]),
  uniform3f:(key,...values)=>calls.push([key,...values]),viewport:(...values)=>calls.push(['viewport',...values]),
  texImage2D:(...args)=>{calls.push(['upload',args.at(-1)]);if(options.uploadFailure)throw Error('upload bloqueado');},
  drawArrays:()=>calls.push(['draw']),getError:()=>options.glError||0};
 const body={appendChild(node){node.parentElement=this;calls.push(['append',node]);}};
 const context2d={filter:'',drawImage:(...args)=>calls.push(['draw-2d',...args])};
 const document={visibilityState:'visible',body,createElement(tag){
  if(tag==='canvas'){
   const canvas={style:new Style(),width:300,height:150,handlers:{},setAttribute(){},
    getContext(kind){if(options.contextThrows)throw Error('contexto bloqueado');return kind==='2d'?context2d:options.noWebgl?null:gl;},
    addEventListener(type,fn){this.handlers[type]=fn;},remove(){this.removed=true;},
    toBlob(fn){calls.push(['to-blob',this]);fn(options.nullBlob?null:{type:'image/png',canvas:this});}};
   canvases.push(canvas);return canvas;
  }
  return {click(){calls.push(['download',this]);},remove(){this.removed=true;}};
 }};
 const ctx={document,S:{},getPref:(key,fallback)=>prefs[key]??fallback,setPref:(key,value)=>{prefs[key]=value;},
  LS_VIDEO_PROFILE:'profile',LS_VIDEO_BRIGHTNESS:'brightness',LS_VIDEO_CONTRAST:'contrast',LS_VIDEO_SATURATION:'saturation',
  LS_VIDEO_FIT:'fit',LS_NX_GPU:'gpu',LS_NX_SHADOWS:'shadows',LS_NX_HIGHLIGHTS:'highlights',LS_VIDEO_COLOR:'old-color',LS_SHARPNESS:'old-sharpness',LS_VISUAL_ACTIVE:'active',
  activeStreamVideo:()=>video,fullscreenHost:()=>null,
  getComputedStyle:node=>({filter:node.style.filter||'none',objectFit:node.style.objectFit||'contain',objectPosition:'50% 50%'}),
  toast:message=>messages.push(message),renderBody(){},
  requestAnimationFrame:callback=>{const id=next++;frames.set(id,callback);return id;},cancelAnimationFrame:id=>frames.delete(id),
  setTimeout:(fn,delay)=>{const id=next++;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),
  URL:{createObjectURL:()=> 'blob:test',revokeObjectURL:()=>calls.push(['revoke'])}};
 vm.createContext(ctx);
 vm.runInContext(part('  const nxVideoFilters = new WeakMap();','  function cycleSharpness()')+
  part('  let nxCaptureBusy=false;','  let nxAudioGraph')+
  '\nglobalThis.inspect=()=>({gpu:nxGpu,diagnostic:{...nxGpuDiagnostics}});',ctx);
 function frame(){const entry=frames.entries().next().value;assert.ok(entry,'scheduled frame exists');frames.delete(entry[0]);entry[1]();}
 return {ctx,prefs,video,gl,calls,messages,frames,timers,canvases,context2d,frame};
}

test('GPU reports actual first-frame rendering, uploads the live video, and uses native dimensions above 1080p',()=>{
 const h=harness();h.ctx.nxGpuStart(h.video);
 assert.match(h.ctx.nxGpuStatus(),/primeiro quadro/);assert.notEqual(h.video.style.opacity,'0');
 h.frame();const state=h.ctx.inspect();
 assert.equal(state.gpu.frames,1);assert.equal(h.video.style.opacity,'0');
 assert.match(h.ctx.nxGpuStatus(),/2560 × 1440/);
 assert.equal(h.canvases[0].width,2560);assert.equal(h.canvases[0].height,1440);
 assert.equal(h.calls.find(c=>c[0]==='upload')[1],h.video);
 assert.deepEqual(h.calls.find(c=>c[0]==='u_adjust'),['u_adjust',1.15,1.1,.9]);
 assert.equal(h.canvases[0].style.objectFit,'contain');assert.equal(h.canvases[0].style.left,'120px');
});

test('manual brightness and sharpness changes reach the running shader on the next frame',()=>{
 const h=harness();h.ctx.nxGpuStart(h.video);h.frame();
 h.prefs.brightness='85';h.prefs['nx.gpu.clarity.mode.v1']='cas';h.prefs['nx.gpu.clarity.strength.v1']='100';
 h.prefs.shadows='.6';h.frame();
 assert.deepEqual(h.calls.filter(c=>c[0]==='u_adjust').at(-1),['u_adjust',.85,1.1,.9]);
 assert.deepEqual(h.calls.filter(c=>c[0]==='u_clarityMode').at(-1),['u_clarityMode',2]);
 assert.deepEqual(h.calls.filter(c=>c[0]==='u_clarityStrength').at(-1),['u_clarityStrength',1]);
 assert.deepEqual(h.calls.filter(c=>c[0]==='u_shadows').at(-1),['u_shadows',.6]);
});

test('a rejected GPU resize returns to visible video instead of hiding a changed-resolution stream',()=>{
 const options={},h=harness(options);h.ctx.nxGpuStart(h.video);h.frame();
 options.glError=1282;h.video.videoWidth=3840;h.video.videoHeight=2160;h.frame();
 assert.equal(h.ctx.inspect().gpu,null);assert.equal(h.prefs.gpu,'0');assert.notEqual(h.video.style.opacity,'0');
});

for(const options of [{noWebgl:true},{contextThrows:true},{compileFailure:true},{uploadFailure:true},{glError:1282}])
 test('GPU failure returns to visible native video and reports a user-facing error: '+Object.keys(options)[0],()=>{
  const h=harness(options);h.ctx.nxGpuStart(h.video);if(h.frames.size)h.frame();
  assert.equal(h.prefs.gpu,'0');assert.equal(h.ctx.inspect().gpu,null);
  assert.notEqual(h.video.style.opacity,'0');assert.match(h.ctx.nxGpuStatus(),/indisponível/);
  assert.match(h.video.style.filter,/brightness\(1.15\)/);assert.ok(h.messages.length>0);
  const count=h.canvases.length;h.ctx.nxGpuStart(h.video);assert.equal(h.canvases.length,count,'failed GPU is not retried by polling');
 });

test('context loss releases GPU resources and restores the original video opacity',()=>{
 const h=harness();h.video.style.setProperty('opacity','.8','important');h.ctx.nxGpuStart(h.video);h.frame();
 h.canvases[0].handlers.webglcontextlost({preventDefault(){}});
 assert.equal(h.video.style.opacity,'0.8');assert.equal(h.video.style.getPropertyPriority('opacity'),'important');
 assert.equal(h.frames.size,0);assert.ok(h.canvases[0].removed);assert.ok(h.calls.some(c=>c[0]==='delete-program'));
});

test('a failed GPU remains paused when storage cannot persist the disabled preference',()=>{
 const h=harness({noWebgl:true});h.ctx.setPref=()=>{};h.ctx.nxGpuStart(h.video);
 assert.equal(h.prefs.gpu,'1');const count=h.canvases.length;
 h.ctx.nxGpuStart(h.video);h.ctx.nxGpuStart(h.video);
 assert.equal(h.canvases.length,count);assert.equal(h.messages.length,1);
});

test('GPU is paused automatically in the background and resumes without changing the preference',()=>{
 const h=harness();h.ctx.nxGpuStart(h.video);h.frame();h.ctx.document.visibilityState='hidden';h.frame();
 assert.equal(h.ctx.inspect().gpu,null);assert.notEqual(h.video.style.opacity,'0');assert.equal(h.prefs.gpu,'1');
 const count=h.canvases.length;h.ctx.nxGpuStart(h.video);assert.equal(h.canvases.length,count);
 h.ctx.document.visibilityState='visible';h.ctx.nxGpuSync();h.frame();assert.equal(h.ctx.inspect().gpu.frames,1);
});

test('CSS serialization does not cause stacked filters and preserves the original priority on reset',()=>{
 const h=harness({prefs:{gpu:'0'}});h.video.style.setProperty('filter','sepia(0.200)','important');
 for(let i=0;i<5;i++)h.ctx.applyVideoAdjustments(h.video);
 assert.equal(h.video.style.filter,'sepia(0.2) brightness(1.15) contrast(1.1) saturate(0.9)');
 assert.equal(h.video.style.getPropertyPriority('filter'),'important');
 h.ctx.restoreVideoAdjustments(h.video);assert.equal(h.video.style.filter,'sepia(0.2)');
 assert.equal(h.video.style.getPropertyPriority('filter'),'important');
});

test('a host style reset is rebased and current manual values are reapplied without waiting for legacy keys',()=>{
 const h=harness({prefs:{gpu:'0'}});h.ctx.applyVideoAdjustments(h.video);
 h.video.style.filter='hue-rotate(2deg)';h.ctx.applyVideoAdjustments(h.video);
 assert.match(h.video.style.filter,/^hue-rotate\(2deg\) brightness/);
 h.ctx.restoreVideoAdjustments(h.video);assert.equal(h.video.style.filter,'hue-rotate(2deg)');
 assert.doesNotMatch(part('    let lastVolumeAudio = null','    document.addEventListener(\'visibilitychange\''),/LS_VIDEO_COLOR|LS_SHARPNESS/);
});

test('fit choices use an owned important style, reach the GPU canvas and restore the host preference',()=>{
 const h=harness({prefs:{fit:'cover'}});h.video.style.setProperty('object-fit','contain','important');
 h.ctx.applyVideoFit(h.video);assert.equal(h.video.style.objectFit,'cover');
 h.ctx.nxGpuStart(h.video);h.frame();assert.equal(h.canvases[0].style.objectFit,'cover');
 h.prefs.fit='original';h.ctx.applyVideoFit(h.video);assert.equal(h.video.style.objectFit,'contain');
 assert.equal(h.video.style.getPropertyPriority('object-fit'),'important');
});

test('one visual reset clears CSS/GPU/fit settings without deleting the saved library, input mode or requested quality',()=>{
 const h=harness({prefs:{fit:'cover',library:'24 saved profiles',quality:'hq',input:'virtual-gamepad'}});
 h.ctx.applyVideoFit(h.video);h.ctx.nxGpuStart(h.video);h.frame();h.ctx.nxResetVisualSettings();
 assert.equal(h.prefs.profile,'original');assert.equal(h.prefs.gpu,'0');assert.equal(h.prefs.fit,'original');
 assert.equal(h.prefs.brightness,'100');assert.equal(h.prefs['nx.gpu.clarity.mode.v1'],'off');
 assert.equal(h.prefs.library,'24 saved profiles');assert.equal(h.prefs.quality,'hq');assert.equal(h.prefs.input,'virtual-gamepad');
 assert.equal(h.ctx.inspect().gpu,null);assert.equal(h.video.style.filter,'');assert.equal(h.video.style.objectFit,'');
});

test('native screenshot copies the displayed CSS filter and downloads only after a blob exists',async()=>{
 const h=harness({prefs:{gpu:'0'}});h.ctx.applyVideoAdjustments(h.video);
 assert.equal(await h.ctx.captureStreamFrame(),true);
 assert.equal(h.context2d.filter,h.video.style.filter);
 assert.equal(h.calls.find(c=>c[0]==='draw-2d')[1],h.video);
 const save=h.calls.find(c=>c[0]==='download');assert.ok(save);assert.equal(save[1].parentElement,h.ctx.document.body);
});

test('GPU screenshot waits for the next rendered frame and uses its processed canvas',async()=>{
 const h=harness();h.ctx.nxGpuStart(h.video);h.frame();
 const result=h.ctx.captureStreamFrame();assert.ok(h.ctx.inspect().gpu.capture);
 assert.equal(h.calls.some(c=>c[0]==='download'),false);h.frame();assert.equal(await result,true);
 assert.equal(h.calls.find(c=>c[0]==='to-blob')[1],h.canvases[0]);
 assert.equal(h.calls.some(c=>c[0]==='draw-2d'),false);
});

test('GPU screenshot teardown rejects the pending request and releases capture ownership',async()=>{
 const h=harness();h.ctx.nxGpuStart(h.video);h.frame();
 const result=h.ctx.captureStreamFrame();h.ctx.nxGpuStop();assert.equal(await result,false);
 assert.equal(h.calls.some(c=>c[0]==='download'),false);
 h.prefs.gpu='0';assert.equal(await h.ctx.captureStreamFrame(),true);
});

test('an unavailable GPU frame times out visibly instead of leaving capture permanently busy',async()=>{
 const h=harness();h.ctx.nxGpuStart(h.video);
 const result=h.ctx.captureStreamFrame();const timeout=Array.from(h.timers.values()).find(t=>t.delay===3000);timeout.fn();
 assert.equal(await result,false);assert.match(h.messages.at(-1),/Nenhum quadro/);
 h.ctx.nxGpuStop();h.prefs.gpu='0';assert.equal(await h.ctx.captureStreamFrame(),true);
});

test('null screenshot blobs report failure without attempting a download',async()=>{
 const h=harness({prefs:{gpu:'0'},nullBlob:true});assert.equal(await h.ctx.captureStreamFrame(),false);
 assert.equal(h.calls.some(c=>c[0]==='download'),false);assert.match(h.messages.at(-1),/Captura/);
});

test('stream selection prefers live gameplay to a playing blob preview and excludes audio-only streams',()=>{
 const trailer={currentSrc:'blob:preview',readyState:4,paused:false,videoWidth:1920,videoHeight:1080};
 const game={srcObject:{getVideoTracks:()=>[{readyState:'live'}]},readyState:4,paused:false,videoWidth:1920,videoHeight:1080};
 const audio={srcObject:{getVideoTracks:()=>[]},readyState:4,paused:false};
 const ctx={document:{querySelectorAll:()=>[trailer,audio,game]}};
 vm.runInNewContext(part('  function activeStreamVideo() {','  function adjustVolume(')+'\nglobalThis.select=activeStreamVideo;',ctx);
 assert.equal(ctx.select(),game);game.isConnected=false;assert.equal(ctx.select(),trailer);
});

test('quality selection no longer resets a separately chosen bitrate limit',()=>{
 const calls=[],prefs={bitrate:'b12'},modes={hq:{},auto:{}};
 const node=()=>({style:{},children:[],setAttribute(){},appendChild(child){this.children.push(child);},addEventListener(type,fn){this[type]=fn;}});
 const ctx={PRESETS:[{name:'Máximo',res:'hq',sub:'HQ'},{name:'Padrão',res:'auto',sub:'1080p'}],RES_MODES:modes,
  resCfg:()=>modes.hq,LS_RES:'resolution',setPref:(key,value)=>{prefs[key]=value;},S:{},
  group:()=>{const root=node(),card=node();root.appendChild(card);return{root,card};},mk:node,
  C:{accent:'green',line:'grey',text:'white',dim:'grey'},stopEv(){},renderBody(){},toast(){},pushLog:(...args)=>calls.push(args)};
 vm.runInNewContext(part('  function nxQualityPresets(root){','  TAB_BUILDERS.advanced=')+'\nglobalThis.build=nxQualityPresets;',ctx);
 const root=node();ctx.build(root);const standard=root.children[0].children[0].children[0].children[1];
 standard.click({stopPropagation(){},preventDefault(){}});
 assert.equal(prefs.resolution,'auto');assert.equal(prefs.bitrate,'b12');
});

test('capture and fullscreen shortcuts live outside the page scroll area and use existing handlers',()=>{
 const actions=[];
 const ctx={C:{line:'grey'},mk:()=>({setAttribute(){},appendChild(node){actions.push(node);}}),
  actBtn:(label,handler)=>({label,handler}),nxConsoleLabFullScreen:()=> 'fullscreen',captureStreamFrame:()=> 'capture'};
 vm.runInNewContext(part('  function nxBuildVisualActions(root) {','  function nxBuildSettingsSearch(')+'\nglobalThis.build=nxBuildVisualActions;',ctx);
 ctx.build({appendChild(){}});assert.equal(actions[0].handler(), 'fullscreen');assert.equal(actions[1].handler(),'capture');
 assert.ok(source.indexOf('nxBuildVisualActions(content)')<source.indexOf('content.appendChild(el.body)'));
});
