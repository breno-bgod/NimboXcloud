'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'..','NimboXcloud.user.js'),'utf8');
function selector(media){const a=src.indexOf('  function activeStreamAudio()'),b=src.indexOf('  function activeStreamVideo()',a);const ctx={document:{querySelectorAll:()=>media}};vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);return ctx.activeStreamAudio();}
const element=(extra={})=>({srcObject:{getAudioTracks:()=>[{readyState:'live'}]},paused:false,ended:false,readyState:4,isConnected:true,muted:false,volume:1,...extra});
test('EQ seleciona áudio audível em vez de vídeo mudo que aparece antes no DOM',()=>{
 const video=element({muted:true}),audio=element();assert.equal(selector([video,audio]),audio);
});
test('fontes desconectadas, sem áudio ou encerradas não vencem reprodução audível',()=>{
 const gone=element({isConnected:false}),dead=element({srcObject:{getAudioTracks:()=>[{readyState:'ended'}]}}),audio=element();assert.equal(selector([gone,dead,audio]),audio);
});
test('sem fonte audível preserva fallback para permitir recuperação do volume',()=>{
 const audio=element({muted:true,volume:0});assert.equal(selector([audio]),audio);assert.equal(selector([]),null);
});
function microphone(){
 const prefs={enabled:'1',mute:'1'},track={readyState:'live',enabled:true,addEventListener:()=>{},getSettings:()=>({})};
 const stream={getAudioTracks:()=>[track]},promise=Promise.resolve(stream),requests=[];
 const media={getUserMedia:c=>{requests.push(c);return promise;}};
 const ctx={navigator:{mediaDevices:media},document:{addEventListener:()=>{}},window:{addEventListener:()=>{}},S:{},
  LS_MIC_ENABLED:'enabled',LS_MIC_MUTE:'mute',LS_MIC_PTT:'ptt',LS_MIC_DEVICE:'device',LS_MIC_NOISE:'noise',LS_MIC_ECHO:'echo',LS_MIC_AGC:'agc',getPref:(k,d)=>prefs[k]??d};
 vm.createContext(ctx);const a=src.indexOf('  const nxVoiceTracks ='),b=src.indexOf('  let micTestStream',a);vm.runInContext(src.slice(a,b),ctx);
 return {ctx,prefs,track,stream,promise,requests,media};
}
test('desativar ajustes NX restaura mute aplicado pelo NX e deixa o chat sob controle do site',async()=>{
 const h=microphone();assert.equal(h.requests.length,0);await h.media.getUserMedia({audio:true});assert.equal(h.track.enabled,false);
 h.prefs.enabled='0';h.ctx.applyVoiceMute();assert.equal(h.track.enabled,true);h.track.enabled=false;h.ctx.applyVoiceMute();assert.equal(h.track.enabled,false);
});
test('microfone NX desativado preserva constraints e promise nativos sem pedir captura própria',()=>{
 const h=microphone();h.prefs.enabled='0';const constraints={audio:{echoCancellation:false},video:false};assert.equal(h.media.getUserMedia(constraints),h.promise);assert.equal(h.requests[0],constraints);
});
test('restauração do NX não sobrescreve alteração posterior do cliente',async()=>{
 const h=microphone();h.prefs.mute='0';await h.media.getUserMedia({audio:true});h.track.enabled=false;h.prefs.enabled='0';h.ctx.applyVoiceMute();assert.equal(h.track.enabled,false);
});
