'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createLab}=require('./NX-Session-Lab.user.js');
const fs=require('node:fs'),vm=require('node:vm');
const play='https://uks.core.gssv-play-prod.xboxlive.com/v5/sessions/cloud/play';
function setup(fetch){
 const calls=[];let cleared=0,videos=[];
 const env={Headers,Request,location:{href:'https://play.xbox.com/'},document:{querySelectorAll:()=>videos},
  setInterval:()=>1,clearInterval:()=>cleared++};
 const original=fetch||function(...args){calls.push({self:this,args});return Promise.resolve({status:200});};env.fetch=original;
 const lab=createLab(env);return {env,lab,original,calls,cleared:()=>cleared,videos:v=>videos=v};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('opt-in e transparência: argumentos, this, promise e resposta permanecem originais',async()=>{
 const response={status:200},promise=Promise.resolve(response);let received;
 const h=setup(function(...args){received={self:this,args};return promise;});assert.equal(h.env.fetch,h.original);assert.equal(h.lab.report().events.length,0);
 h.lab.start();const init={method:'POST',headers:{'X-MS-Device-Info':JSON.stringify({appInfo:{env:{clientAppType:'browser'}},dev:{hw:{sdktype:'web'},os:{name:'android'}}})}};
 Object.defineProperty(init,'body',{get(){throw Error('Corpo não deve ser lido pelo observador');}});
 const result=h.env.fetch.call(h.env,play,init);assert.equal(result,promise);assert.equal(await result,response);await flush();
 assert.equal(received.self,h.env);assert.equal(received.args[0],play);assert.equal(received.args[1],init);
 const event=h.lab.report().events[0];assert.equal(event.status,200);assert.equal(event.descriptor.clientAppType,'browser');assert.equal(event.descriptor.os,'android');
 h.lab.stop();assert.equal(h.env.fetch,h.original);assert.equal(h.cleared(),1);
});
test('relatório não contém tokens, IDs de dispositivo, URLs, query nem corpo',async()=>{
 const h=setup();h.lab.start();
 await h.env.fetch(play+'?secret=SYNTHETIC_QUERY',{method:'POST',body:'SYNTHETIC_BODY',headers:{Authorization:'Bearer SYNTHETIC_AUTH',
 'X-MS-Device-Info':JSON.stringify({appInfo:{env:{clientAppId:'SYNTHETIC_ID',clientAppType:'SYNTHETIC_PRIVATE'}},dev:{hw:{model:'SYNTHETIC_MODEL'},os:{name:'SYNTHETIC_OS'}}})}});await flush();
 const text=JSON.stringify(h.lab.report());assert.doesNotMatch(text,/SYNTHETIC_|Authorization|xboxlive\.com|secret=/);assert.equal(h.lab.report().serverConsoleRecognition,'not-verified');
});
test('HTTP 200, descritor Xbox e confirmação manual não promovem reconhecimento no servidor',async()=>{
 const h=setup();h.lab.start();await h.env.fetch(play,{method:'POST',headers:{'X-MS-Device-Info':JSON.stringify({dev:{os:{name:'Xbox'}}})}});await flush();
 h.lab.confirm('heardAudio',true);h.lab.confirm('controlsResponded',true);
 const r=h.lab.report();assert.equal(r.events[0].descriptor.os,'xbox-declared');assert.equal(r.serverConsoleRecognition,'not-verified');assert.equal(r.mediaBindingToObservedRequest,'not-verified');assert.equal(r.manualConfirmation.controlsResponded,true);
 await h.env.fetch(play,{method:'POST'});assert.equal(h.lab.report().manualConfirmation.controlsResponded,false);
});
test('Request é observado sem consumir corpo e somente rotas GSSV conhecidas entram no relatório',async()=>{
 const h=setup();h.lab.start();const request=new Request(play,{method:'POST',body:'synthetic'});
 await h.env.fetch(request);assert.equal(request.bodyUsed,false);
 await h.env.fetch('https://xgpuweb.gssv-play-prod.xboxlive.com/v2/login/user',{method:'POST'});
 await h.env.fetch('https://evil.invalid/v5/sessions/cloud/play',{method:'POST'});
 await h.env.fetch(play,{method:'GET'});await flush();assert.equal(h.lab.report().events.length,2);assert.equal(h.lab.report().events[1].offering,'xgpuweb');
});
test('respostas tardias após stop/restart não alteram uma nova observação',async()=>{
 let finish;const promise=new Promise(resolve=>finish=resolve),h=setup(()=>promise);h.lab.start();h.env.fetch(play,{method:'POST'});h.lab.stop();h.lab.start();
 finish({status:403});await flush();assert.equal(h.lab.report().events.length,0);
});
test('restauração não sobrescreve outro wrapper e rastros são limitados',async()=>{
 const h=setup();h.lab.start();const own=h.env.fetch;const other=(...args)=>own(...args);h.env.fetch=other;h.lab.stop();assert.equal(h.env.fetch,other);
 h.lab.start();for(let i=0;i<30;i++)await h.env.fetch(play,{method:'POST'});await flush();assert.equal(h.lab.report().events.length,24);assert.equal(h.calls.length,30);
});
test('mídia exige trilha viva e quadros crescentes; trailer e trilha áudio não comprovam gameplay',()=>{
 const h=setup();let frames=1;h.videos([{src:'trailer',readyState:4,videoWidth:1920,videoHeight:1080,paused:false}]);h.lab.start();assert.equal(h.lab.report().media.liveVideo,false);
 const video={srcObject:{getVideoTracks:()=>[{readyState:'live'}],getAudioTracks:()=>[{readyState:'live'}]},readyState:4,videoWidth:1920,videoHeight:1080,paused:false,getVideoPlaybackQuality:()=>({totalVideoFrames:frames})};
 h.videos([video]);h.lab.sample();assert.equal(h.lab.report().media.decodedFramesAdvancing,false);frames++;h.lab.sample();assert.equal(h.lab.report().media.decodedFramesAdvancing,true);assert.equal(h.lab.report().manualConfirmation.heardAudio,false);
 h.lab.sample();assert.equal(h.lab.report().media.decodedFramesAdvancing,false);
});
test('erros e descritores inválidos não quebram a chamada ou expõem conteúdo',async()=>{
 const error=Error('synthetic');const h=setup(()=>Promise.reject(error));h.lab.start();await assert.rejects(h.env.fetch(play,{method:'POST',headers:{'X-MS-Device-Info':'not-json'}}),e=>e===error);await flush();assert.equal(h.lab.report().events[0].status,'network-error');assert.equal(h.lab.report().events[0].descriptor.parse,'invalid');
 const sync=setup(()=>{throw error;});sync.lab.start();assert.throws(()=>sync.env.fetch(play,{method:'POST'}),e=>e===error);
});
test('interface real monta recolhida sem observar, inicia por botão e move apenas seu próprio painel em fullscreen',()=>{
 class Node{
  constructor(tag){this.tagName=tag.toUpperCase();this.style={};this.children=[];this.listeners={};this.parentNode=null;this.textContent='';}
  appendChild(child){if(child.parentNode)child.parentNode.children.splice(child.parentNode.children.indexOf(child),1);this.children.push(child);child.parentNode=this;return child;}
  addEventListener(type,fn){this.listeners[type]=fn;}setAttribute(name,value){this[name]=value;}focus(){}select(){}
 }
 const h=setup(),body=new Node('body'),hud=body.appendChild(new Node('native-hud')),listeners={};
 Object.assign(h.env.document,{body,documentElement:body,createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text}),addEventListener:(type,fn)=>listeners[type]=fn});
 const ctx={window:h.env,URL};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('./NX-Session-Lab.user.js'),'utf8'),ctx);
 const panel=body.children.find(n=>n.id==='nx-session-lab');assert.ok(panel);assert.notEqual(panel.open,true);assert.equal(h.env.fetch,h.original);
 const start=panel.children.find(n=>n.textContent==='Iniciar observação'),stop=panel.children.find(n=>n.textContent==='Parar observação');
 start.listeners.click();assert.equal(h.env.NXSessionLab.report().running,true);assert.equal(start.disabled,true);
 const fullscreen=body.appendChild(new Node('div'));h.env.document.fullscreenElement=fullscreen;listeners.fullscreenchange();assert.equal(panel.parentNode,fullscreen);assert.equal(hud.parentNode,body);
 stop.listeners.click();assert.equal(h.env.NXSessionLab.report().running,false);assert.equal(h.env.fetch,h.original);
});
test('falha ao instalar observador não deixa estado ativo ou temporizador pendente',()=>{
 const h=setup();Object.defineProperty(h.env,'fetch',{value:h.original,writable:false});assert.throws(()=>h.lab.start());assert.equal(h.lab.report().running,false);assert.equal(h.env.fetch,h.original);
});
test('somente o header permitido é lido; Authorization não é copiado ou avaliado',async()=>{
 const h=setup();h.lab.start();const headers={'X-MS-Device-Info':'{}'};
 Object.defineProperty(headers,'Authorization',{enumerable:true,get(){throw Error('Authorization foi lido');}});
 await h.env.fetch(play,{method:'POST',headers});await flush();assert.equal(h.lab.report().events[0].descriptor.parse,'valid');
 await h.env.fetch(play,{method:'POST',headers:[['x-ms-device-info','{}'],['Authorization','SYNTHETIC_PRIVATE']]});await flush();assert.equal(h.lab.report().events[1].descriptor.parse,'valid');assert.doesNotMatch(JSON.stringify(h.lab.report()),/SYNTHETIC_PRIVATE/);
});

test('diagnóstico distingue não iniciado, captura sem rotas reconhecidas e mídia histórica após parada',async()=>{
 const h=setup();assert.equal(h.lab.report().diagnostics.lifecycle.state,'not-started');
 h.lab.start();await h.env.fetch('https://example.invalid/synthetic');
 let r=h.lab.report();assert.equal(r.running,true);assert.equal(r.diagnostics.fetchHook,'installed');assert.equal(r.diagnostics.observedFetchCalls,1);assert.equal(r.events.length,0);
 h.lab.stop();r=h.lab.report();assert.equal(r.diagnostics.lifecycle.stopReason,'explicit-stop');assert.equal(r.diagnostics.mediaIsHistorical,true);assert.ok(r.diagnostics.mediaSampledAt);
 h.lab.start();r=h.lab.report();assert.equal(r.diagnostics.lifecycle.startAttempts,2);assert.equal(r.diagnostics.lifecycle.stopReason,null);assert.equal(r.diagnostics.observedFetchCalls,0);assert.equal(r.diagnostics.mediaIsHistorical,false);
});
test('falha de instalação e substituição do hook ficam explícitas sem expor mensagens de erro',()=>{
 const h=setup();Object.defineProperty(h.env,'fetch',{value:h.original,writable:false});assert.throws(()=>h.lab.start());
 assert.equal(h.lab.report().diagnostics.lifecycle.state,'start-failed');assert.equal(h.lab.report().diagnostics.lifecycle.stopReason,'hook-installation-failed');
 const other=setup();other.lab.start();other.env.fetch=other.original;assert.equal(other.lab.report().diagnostics.fetchHook,'replaced-or-wrapped');
});

test('chamadas ignoradas usam categorias fixas sem URL, ID, parâmetros, método arbitrário ou corpo',async()=>{
 const h=setup();h.lab.start();
 for(const url of ['https://play.xbox.com/private/SYNTHETIC_ID?token=SYNTHETIC_TOKEN','https://other.invalid/SYNTHETIC_PATH','https://uks.core.gssv-play-prod.xboxlive.com/v6/sessions/cloud/play'])await h.env.fetch(url,{method:'POST'});
 await h.env.fetch('https://a.xboxlive.com/private',{method:'SYNTHETIC_METHOD'});
 await flush();const r=h.lab.report();assert.equal(r.diagnostics.unmatchedCategories['gssv:POST:play-suffix'],1);assert.equal(r.diagnostics.unmatchedCategories['page-origin:POST:other-route'],1);assert.equal(r.diagnostics.unmatchedCategories['xboxlive-other:OTHER:other-route'],1);
 assert.doesNotMatch(JSON.stringify(r),/SYNTHETIC_|other.invalid|private/);assert.equal(r.events.length,0);assert.equal(r.serverConsoleRecognition,'not-verified');
 h.lab.stop();h.lab.start();assert.deepEqual(h.lab.report().diagnostics.unmatchedCategories,{});
});
