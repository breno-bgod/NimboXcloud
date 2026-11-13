'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('NimboXcloud.user.js','utf8');
const cut=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function boot(){
 let now=1000,video=null;const location={pathname:'/play/launch/fortnite/game'};
 class Clock extends Date{static now(){return now;}}
 const ctx={Date:Clock,location,activeStreamVideo:()=>video,S:{serverActual:'SOUTHINDIA'}};
 vm.createContext(ctx);vm.runInContext(cut('  // Preparação observada:','  // Fim preparação observada.')+'\nglobalThis.state=nxLaunch;',ctx);
 const response=(json={},ok=true)=>({ok,status:ok?200:503,clone:()=>({json:()=>Promise.resolve(json)})});
 const request=(kind,promise=Promise.resolve(response()))=>{
  const paths={play:'/v5/sessions/cloud/play',wait:'/v1/waittime/1234',state:'/v5/sessions/cloud/session/state',cancel:'/v5/sessions/cloud/session',connect:'/v5/sessions/cloud/session/sdp'};
  return ctx.nxObserveLaunchFetch(new URL('https://region.xboxservices.com'+paths[kind]),kind==='play'?'POST':kind==='cancel'?'DELETE':'GET',promise,null,kind==='play'?{body:JSON.stringify({titleId:'1234'})}:undefined);
 };
 return {ctx,state:ctx.state,request,response,location,advance:ms=>now+=ms,setVideo:v=>video=v};
}
const ready=()=>({readyState:2,videoWidth:1920,videoHeight:1080,paused:false,srcObject:{getVideoTracks:()=>[]}});
const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
test('loading follows the real play request without modifying its response',async()=>{
 const h=boot(),response=h.response();const result=h.request('play',Promise.resolve(response));assert.equal(h.ctx.nxLoadingBusy(),true);
 assert.equal(await result,response);assert.equal(h.state.server,'SOUTHINDIA');assert.equal(h.ctx.nxLaunchEstimate(),'Previsão do serviço indisponível');
});
test('wait estimates are strictly numeric and do not invent a countdown',async()=>{
 const h=boot();await h.request('play');await h.request('wait',Promise.resolve(h.response({estimatedTotalWaitTimeInSeconds:600})));await settle();
 assert.equal(h.state.wait,600);assert.equal(h.ctx.nxLaunchEstimate(),'Previsão do serviço: cerca de 10 min (pode variar)');
 h.advance(600001);assert.match(h.ctx.nxLaunchEstimate(),/Previsão ultrapassada/);
 for(const value of [null,'600',-1,Infinity,NaN,86401])assert.equal(h.ctx.nxLaunchWait({estimatedTotalWaitTimeInSeconds:value}),null);
 assert.equal(h.ctx.nxLaunchWait({estimatedAllocationTimeInSeconds:0}),0);
});
test('a wait lookup before play on the same launch keeps its pending estimate',async()=>{
 const h=boot();let resolve;const json=new Promise(r=>resolve=r);
 await h.request('wait',Promise.resolve({ok:true,clone:()=>({json:()=>json})}));const epoch=h.state.epoch;
 await h.request('play');assert.equal(h.state.epoch,epoch);resolve({estimatedTotalWaitTimeInSeconds:120});await settle();assert.equal(h.state.wait,120);
});
test('late JSON from an old play attempt cannot replace the new estimate',async()=>{
 const h=boot();await h.request('play');let resolve;
 await h.request('wait',Promise.resolve({ok:true,clone:()=>({json:()=>new Promise(r=>resolve=r)})}));
 await h.request('play');resolve({estimatedTotalWaitTimeInSeconds:900});await settle();assert.equal(h.state.wait,null);
});
test('old rejection preserves the error and does not fail a newer session',async()=>{
 const h=boot();let reject;const failure=Error('old failure');const old=h.request('play',new Promise((_,r)=>reject=r));
 await h.request('play');reject(failure);await assert.rejects(old,error=>error===failure);assert.equal(h.ctx.nxLoadingBusy(),true);
});
test('cancel, HTTP rejection and aborted play all unlock settings',async()=>{
 const h=boot();await h.request('play');await h.request('cancel');assert.equal(h.ctx.nxLoadingBusy(),false);assert.equal(h.state.phase,'cancelled');
 await h.request('play',Promise.resolve(h.response({},false)));assert.equal(h.state.phase,'failed');
 const aborted=Object.assign(Error('aborted'),{name:'AbortError'});await assert.rejects(h.request('play',Promise.reject(aborted)));assert.equal(h.state.phase,'cancelled');
});
test('malformed clone leaves native playback response intact',async()=>{
 const h=boot();await h.request('play');const response={ok:true,clone:()=>({json:()=>Promise.reject(Error('not JSON'))})};
 assert.equal(await h.request('wait',Promise.resolve(response)),response);await settle();assert.equal(h.state.wait,null);assert.equal(h.ctx.nxLoadingBusy(),true);
});
test('old video and stale FPS do not unlock a new session; new video does',async()=>{
 const h=boot(),old=ready();h.setVideo(old);h.ctx.S.qos={fps:60};await h.request('play');h.ctx.nxLaunchRefresh();assert.equal(h.ctx.nxLoadingBusy(),true);
 h.setVideo(ready());h.ctx.nxLaunchRefresh();assert.equal(h.state.phase,'playing');assert.equal(h.ctx.nxLoadingBusy(),false);
});
test('a reused blank video becoming ready unlocks settings',async()=>{
 const h=boot(),video={readyState:0,videoWidth:0,videoHeight:0,paused:true};h.setVideo(video);await h.request('play');Object.assign(video,ready());h.ctx.nxLaunchRefresh();assert.equal(h.state.phase,'playing');
});
test('route exit and missing progress cannot leave NX locked forever',async()=>{
 const h=boot();await h.request('play');h.location.pathname='/play';h.ctx.nxLaunchRefresh();assert.equal(h.state.phase,'idle');
 await h.request('play');h.advance(180001);h.ctx.nxLaunchRefresh();assert.equal(h.state.phase,'stalled');assert.equal(h.ctx.nxLoadingBusy(),false);
 h.setVideo(ready());h.ctx.nxLaunchRefresh();assert.equal(h.state.phase,'playing');
});
test('queue estimate extends the guard while an observed connection stage cannot imply gameplay',async()=>{
 const h=boot();await h.request('play');await h.request('wait',Promise.resolve(h.response({estimatedTotalWaitTimeInSeconds:600})));await settle();
 h.advance(240000);await h.request('connect');h.ctx.nxLaunchRefresh();assert.equal(h.ctx.nxLoadingBusy(),true);assert.equal(h.state.stage,'Preparando a transmissão');assert.equal(h.state.wait,null);
});
test('library wait lookups, xHome and untrusted domains do not trigger a loading lock',async()=>{
 const h=boot();h.location.pathname='/play';await h.request('wait',Promise.resolve(h.response({estimatedTotalWaitTimeInSeconds:300})));assert.equal(h.state.phase,'idle');
 for(const url of ['https://evilxboxservices.com/v5/sessions/cloud/play','https://region.xboxservices.com/v5/sessions/home/play','http://region.xboxservices.com/v5/sessions/cloud/play']){
  const promise=Promise.resolve(h.response());assert.equal(h.ctx.nxObserveLaunchFetch(new URL(url),'POST',promise),promise);
 }
 assert.equal(h.state.phase,'idle');
});
test('the actual panel entry point blocks opening while loading, allows closing and recovers afterwards',()=>{
 let busy=true;const ctx={nxLoadingBusy:()=>busy,openUI:false,userTouched:false,cardEl:{style:{},hasAttribute:()=>true},wrap:{style:{}},nxShellEnabled:false,
  nxSyncTouchMenuBlock(){},document:{documentElement:{classList:{contains:()=>false}},activeElement:null},syncNXPlacement(){},renderBody(){},update(){}};
 vm.createContext(ctx);vm.runInContext(cut('  function setOpen(v, byUser) {','  const NX_PAD_BIND_KEY='),ctx);
 assert.equal(ctx.setOpen(true,true),false);assert.equal(ctx.openUI,false);
 busy=false;ctx.setOpen(true,true);assert.equal(ctx.openUI,true);
 busy=true;ctx.setOpen(false,true);assert.equal(ctx.openUI,false);assert.equal(ctx.cardEl.style.display,'none');
});

test('failed preflight lookup unlocks without treating a running play wait lookup as terminal',async()=>{
 const h=boot();await h.request('wait',Promise.resolve(h.response({},false)));assert.equal(h.state.phase,'failed');
 await h.request('play');await h.request('wait',Promise.resolve(h.response({},false)));assert.equal(h.ctx.nxLoadingBusy(),true);
});

test('the monitor session ends when a running game route is left',async()=>{
 const h=boot();await h.request('play');h.setVideo(ready());h.ctx.nxLaunchRefresh();assert.equal(h.state.phase,'playing');
 h.location.pathname='/play';h.ctx.nxLaunchRefresh();assert.equal(h.state.phase,'idle');
});


test('an explicit zero allocation wait overrides a misleading large total estimate',()=>{
 const h=boot();assert.equal(h.ctx.nxLaunchWait({estimatedAllocationTimeInSeconds:0,estimatedTotalWaitTimeInSeconds:3420}),0);
 assert.equal(h.ctx.nxLaunchWait({estimatedAllocationTimeInSeconds:20,estimatedTotalWaitTimeInSeconds:10}),20);
});

test('wait estimates from another title or region cannot be displayed for the current play',async()=>{
 const h=boot();await h.request('play');
 for(const url of ['https://region.xboxservices.com/v1/waittime/another-title','https://other.xboxservices.com/v1/waittime/1234']){
  await h.ctx.nxObserveLaunchFetch(new URL(url),'GET',Promise.resolve(h.response({estimatedTotalWaitTimeInSeconds:3420})));await settle();assert.equal(h.state.wait,null);
 }
 await h.request('wait',Promise.resolve(h.response({estimatedTotalWaitTimeInSeconds:60})));await settle();assert.equal(h.state.wait,60);
});

test('unknown play title does not inherit an unrelated preflight forecast',async()=>{
 const h=boot();await h.request('wait',Promise.resolve(h.response({estimatedTotalWaitTimeInSeconds:3420})));await settle();assert.equal(h.state.wait,null);
 await h.ctx.nxObserveLaunchFetch(new URL('https://region.xboxservices.com/v5/sessions/cloud/play'),'POST',Promise.resolve(h.response()));assert.equal(h.state.wait,null);
});

test('allocation progress clears a forecast and delayed queue JSON cannot restore it',async()=>{
 const h=boot();await h.request('play');let resolve;
 await h.request('wait',Promise.resolve({ok:true,clone:()=>({json:()=>new Promise(r=>resolve=r)})}));
 await h.request('connect');resolve({estimatedTotalWaitTimeInSeconds:3420});await settle();assert.equal(h.state.wait,null);assert.match(h.ctx.nxLaunchEstimate(),/Fila encerrada/);
});

test('play title is read from a clone without consuming or changing the native request',async()=>{
 const h=boot();h.ctx.Request=Request;
 const input=new Request('https://region.xboxservices.com/v5/sessions/cloud/play',{method:'POST',body:JSON.stringify({titleId:'1234',settings:{osName:'windows'}})});
 await h.ctx.nxObserveLaunchFetch(new URL(input.url),'POST',Promise.resolve(h.response()),input);await settle();
 const body=await input.json();assert.equal(body.titleId,'1234');assert.equal(body.settings.osName,'windows');assert.equal(h.state.title,'1234');
});
