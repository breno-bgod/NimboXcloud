// tests/xhome-discovery.test.cjs — run: node --test tests/xhome-discovery.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
const start = source.indexOf('function nxRemoteEmptyMediaDiagnostics()');
const end = source.indexOf('  const TAB_BUILDERS =', start);
assert.ok(start >= 0 && end > start, 'xHome discovery section found');
const code = source.slice(start, end) + '\n globalThis.api={state:nxRemotePlay,discover:nxRemoteDiscover,cancel:nxRemoteCancel,stop:nxRemoteStop,retryRelease:nxRemoteRetryRelease,startSession:nxRemoteStartSession,channels:function(){return nxRemoteChannels;},setChannels:function(value){nxRemoteChannels=value;},initChannels:nxRemoteInitDataChannels,resolutionProfile:nxRemoteResolutionProfile,buildDeviceInfo:nxRemoteBuildDeviceInfo,encodeGamepadFrame:nxRemoteEncodeGamepadFrame,normalizeVirtualGamepadState:nxRemoteNormalizeVirtualGamepadState,setVirtualGamepadState:function(state){return nxRemoteSetVirtualGamepadState(state,nxRemotePlay.requestId,nxRemotePlay.peer,nxRemoteChannels);},releaseVirtualGamepad:function(){return nxRemoteReleaseVirtualGamepad(nxRemotePlay.requestId,nxRemotePlay.peer,nxRemoteChannels);},virtualGamepad:function(){return nxRemoteVirtualGamepad;},encodeKeyboardFrame:nxRemoteEncodeKeyboardFrame,encodeMouseFrame:nxRemoteEncodeMouseFrame,virtualKey:nxRemoteVirtualKey,setGamepadSlot:nxRemoteSetGamepadSlot,registeredSlots:function(){return Array.from(nxRemoteRegisteredGamepadSlots);},closeChannels:nxRemoteCloseDataChannels,tickGamepads:nxRemoteGamepadTick,suspendGamepads:nxRemoteGamepadSuspend,ready:nxRemoteGamepadReady,sendKeyboardFrame:nxRemoteSendKeyboardFrame,sendMouseFrame:nxRemoteSendMouseFrame,createTouchAdapter:nxRemoteCreateTouchInputAdapter,attachTouchAdapter:nxRemoteAttachTouchAdapter,detachTouchAdapter:nxRemoteDetachTouchAdapter,touchAdapter:function(){return nxRemoteTouchAdapter;},enableInput:nxRemoteInputCaptureEnable,disableInput:nxRemoteInputCaptureDisable,inputFocus:nxRemoteVideoHasInputFocus,heldKeys:function(){return Array.from(nxRemoteHeldKeys.keys());},mouseButtons:function(){return nxRemoteMouseButtons;},captureEnabled:function(){return !!nxRemoteInputCapture;},browser:{window:window,document:document}};';
function harness(fetchImpl, storageOverride, rtcClass, timerOverrides, mediaStreamClass) {
  let timerId=0;
  const fakeTimers=new Map();
  const browserSetTimeout=(fn,ms)=>{const id=++timerId;fakeTimers.set(id,{fn,ms});return id;};
  const browserClearTimeout=(id)=>fakeTimers.delete(id);
  const fakeWindow=fakeEventTarget();
  fakeWindow.location={host:'play.xbox.com'};
  const fakeDocument=fakeEventTarget();
  fakeDocument.visibilityState='visible';
  fakeDocument.activeElement=null;
  fakeDocument.pointerLockElement=null;
  fakeDocument.exitPointerLock=function(){this.pointerLockElement=null;this.dispatch('pointerlockchange',{});};
  const ctx = {
    AbortController, URL, Date,
    setTimeout:timerOverrides&&timerOverrides.setTimeout||browserSetTimeout,
    clearTimeout:timerOverrides&&timerOverrides.clearTimeout||browserClearTimeout,
    fetch: fetchImpl, tabId: 'other', renderBody() {}, navigator:{language:'pt-BR'},
    window:fakeWindow, document:fakeDocument, performance:{now:()=>123.5},
    localStorage: {
      getItem(k) { return k === 'xboxcom_xbl_user_info' ? JSON.stringify({tokens:{'http://gssv.xboxlive.com/':{token:'TEST_GSSV'}}}) : null; },
      get length() { return 0; }
    }
  };
  if(storageOverride) ctx.localStorage=storageOverride;
  if(rtcClass) ctx.RTCPeerConnection=rtcClass;
  if(mediaStreamClass) ctx.MediaStream=mediaStreamClass;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  ctx.api.browser={window:fakeWindow,document:fakeDocument};
  return ctx.api;
}
const ok = (value) => ({ok:true,status:200,json:async()=>value});
const login = {gsToken:'TEST_BEARER',offeringSettings:{regions:[{name:'test',isDefault:true,baseUri:'https://wus.xboxlive.com'}]}};

function fakeEventTarget() {
  const listeners=new Map();
  return {
    addEventListener(type,listener) {
      if(!listeners.has(type))listeners.set(type,[]);
      listeners.get(type).push(listener);
    },
    removeEventListener(type,listener) {
      const list=listeners.get(type)||[];
      listeners.set(type,list.filter(item=>item!==listener));
    },
    dispatch(type,event) {
      event=event||{};
      event.type=type;
      if(!Object.prototype.hasOwnProperty.call(event,'target'))event.target=this;
      if(typeof event.preventDefault!=='function')event.preventDefault=function(){this.defaultPrevented=true;};
      if(typeof event.stopImmediatePropagation!=='function')event.stopImmediatePropagation=function(){this.immediatePropagationStopped=true;};
      if(typeof event.stopPropagation!=='function')event.stopPropagation=function(){this.propagationStopped=true;};
      for(const listener of [...(listeners.get(type)||[])]) {
        listener.call(this,event);
        if(event.immediatePropagationStopped)break;
      }
      return event;
    },
    listenerCount(type){return (listeners.get(type)||[]).length;},
    listenersFor(type){return (listeners.get(type)||[]).slice();},
    contains(target){return target===this;}
  };
}
function fakeVideo(api) {
  const video=fakeEventTarget();
  video.controls=true;
  video.tabIndex=-1;
  video.clientHeight=720;
  video.paused=true;
  video.readyState=0;
  video.videoWidth=0;
  video.videoHeight=0;
  video.error=null;
  video.play=function(){this.paused=false;return Promise.resolve();};
  video.pause=function(){this.paused=true;};
  video.focus=function(){api.browser.document.activeElement=video;};
  video.requestPointerLock=function(){
    api.browser.document.pointerLockElement=video;
    api.browser.document.dispatch('pointerlockchange',{});
    return Promise.resolve();
  };
  return video;
}
function fakeTrack(id,kind) {
  const track=fakeEventTarget();
  track.id=id;track.kind=kind;track.readyState='live';track.muted=false;
  track.stop=function(){if(this.readyState!=='ended'){this.readyState='ended';this.dispatch('ended',{});}};
  return track;
}
function remoteInputPackets(channel,reportType) {
  return channel.sent.filter(data=>Object.prototype.toString.call(data)==='[object ArrayBuffer]' &&
    data.byteLength>=14 && new DataView(data).getUint16(0,true)===reportType);
}
function trustedEvent(target,extra) {
  return Object.assign({isTrusted:true,target:target},extra||{});
}

test('success: authenticates and lists consoles without exposing tokens', async()=>{
  const calls=[];
  const api=harness(async (url,options)=>{calls.push([url,options]);return calls.length===1?ok(login):ok({results:[{serverId:'server-test',deviceName:'Xbox Test',consoleType:'SeriesX',powerState:'On'}]});});
  await api.discover();
  assert.equal(api.state.consoles.length,1);
  assert.equal(api.state.consoles[0].name,'Xbox Test');
  assert.equal(api.state.busy,false);
  assert.equal(calls[0][1].redirect,'error');
  assert.equal(calls[1][1].redirect,'error');
  assert.ok(!JSON.stringify(api.state).includes('TEST_BEARER'));
});
test('401: stops discovery and clears consoles',async()=>{
  let n=0;
  const api=harness(async()=>++n===1?ok(login):{ok:false,status:401});
  await api.discover();
  assert.equal(n,2);
  assert.equal(api.state.consoles.length,0);
  assert.match(api.state.error,/401/);
});
test('invalid origin: bearer token never reaches foreign host',async()=>{
  let n=0;
  const api=harness(async()=>{n++;return ok({...login,offeringSettings:{regions:[{baseUri:'https://xboxlive.com.attacker.test'}]}});});
  await api.discover();
  assert.equal(n,1);
  assert.equal(api.state.consoles.length,0);
});
test('cancel: late response cannot repopulate consoles',async()=>{
  let resolveLogin;
  const api=harness(()=>new Promise(resolve=>{resolveLogin=resolve;}));
  const pending=api.discover();
  api.cancel();
  resolveLogin(ok(login));
  await pending;
  assert.equal(api.state.status,'Consulta cancelada');
  assert.equal(api.state.consoles.length,0);
  assert.equal(api.state.busy,false);
});
test('timeout: aborted fetch cannot populate consoles',async()=>{
  const api=harness((url,options)=>new Promise(resolve=>{
    options.signal.addEventListener('abort',()=>resolve(ok(login)),{once:true});
  }));
  const pending=api.discover();
  api.state.abortController.abort();
  await pending;
  assert.equal(api.state.consoles.length,0);
  assert.match(api.state.error,/Tempo limite/);
});

test('403: stops discovery without retrying another region',async()=>{
  let n=0;
  const api=harness(async()=>++n===1?ok(login):{ok:false,status:403});
  await api.discover();
  assert.equal(n,2);
  assert.match(api.state.error,/403/);
  assert.equal(api.state.consoles.length,0);
});
test('login request rejects redirects while sending GSSV token',async()=>{
  let options;
  const api=harness(async (_url,opts)=>{options=opts;throw new TypeError('redirect blocked');});
  await api.discover();
  assert.equal(options.redirect,'error');
  assert.equal(api.state.consoles.length,0);
  assert.equal(api.state.status,'Falha na consulta');
});
test('discovery request rejects redirects while sending bearer token',async()=>{
  const calls=[];
  const api=harness(async (url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    throw new TypeError('redirect blocked');
  });
  await api.discover();
  assert.equal(calls.length,2);
  assert.equal(calls[1].opts.redirect,'error');
  assert.equal(api.state.consoles.length,0);
});

test('cancel during region fetch: late console list is ignored',async()=>{
  let resolveRegion;
  let notifyRegion;
  const regionStarted=new Promise(resolve=>{notifyRegion=resolve;});
  let n=0;
  const api=harness(async()=>{
    n++;
    if(n===1)return ok(login);
    notifyRegion();
    return new Promise(resolve=>{resolveRegion=resolve;});
  });
  const pending=api.discover();
  await regionStarted;
  assert.equal(n,2);
  api.cancel();
  resolveRegion(ok({results:[{serverId:'late-console',deviceName:'Late Xbox'}]}));
  await pending;
  assert.equal(api.state.status,'Consulta cancelada');
  assert.equal(api.state.consoles.length,0);
  assert.equal(api.state.region,'');
  assert.equal(api.state.checkedAt,0);
});

test('empty successful region: no consoles is a valid result',async()=>{
  let n=0;
  const api=harness(async()=>++n===1?ok(login):ok({results:[]}));
  await api.discover();
  assert.equal(n,2);
  assert.equal(api.state.status,'Nenhum console vinculado encontrado');
  assert.equal(api.state.error,'');
  assert.equal(api.state.consoles.length,0);
});
test('all regions fail: report failure instead of claiming no linked consoles',async()=>{
  let n=0;
  const api=harness(async()=>++n===1?ok(login):{ok:false,status:503});
  await api.discover();
  assert.equal(api.state.status,'Falha na consulta');
  assert.match(api.state.error,/nenhuma região xHome/i);
  assert.equal(api.state.consoles.length,0);
});
test('malformed region objects: fail gracefully without additional requests',async()=>{
  let n=0;
  const api=harness(async()=>{
    n++;
    return ok({...login,offeringSettings:{regions:[null,{},'not a region']}});
  });
  await api.discover();
  assert.equal(n,1);
  assert.equal(api.state.status,'Falha na consulta');
  assert.equal(api.state.consoles.length,0);
});

test('default region sorts before malformed entries without crashing',async()=>{
  const requests=[];
  const api=harness(async (url)=>{
    requests.push(url);
    if(requests.length===1)return ok({...login,offeringSettings:{regions:[null,{baseUri:'https://wus.xboxlive.com',isDefault:true}]}});
    return ok({results:[]});
  });
  await api.discover();
  assert.equal(requests.length,2);
  assert.equal(api.state.status,'Nenhum console vinculado encontrado');
  assert.equal(api.state.error,'');
});

test('cancel after regional response before JSON: ignore late payload and attempts',async()=>{
  let resolveJson, notifyJson;
  const jsonStarted=new Promise(resolve=>{notifyJson=resolve;});
  let n=0;
  const api=harness(async()=>{
    if(++n===1)return ok(login);
    return {ok:true,status:200,json:()=>{notifyJson();return new Promise(resolve=>{resolveJson=resolve;});}};
  });
  const pending=api.discover();
  await jsonStarted;
  api.cancel();
  resolveJson({results:[{serverId:'stale-console',deviceName:'Stale Xbox'}]});
  await pending;
  assert.equal(api.state.status,'Consulta cancelada');
  assert.equal(api.state.attempts.length,0);
  assert.equal(api.state.consoles.length,0);
  assert.equal(api.state.region,'');
});

test('cancel after login response before JSON: never request a region',async()=>{
  let resolveJson, notifyJson;
  const jsonStarted=new Promise(resolve=>{notifyJson=resolve;});
  let requests=0;
  const api=harness(async()=>{
    requests++;
    return {ok:true,status:200,json:()=>{notifyJson();return new Promise(resolve=>{resolveJson=resolve;});}};
  });
  const pending=api.discover();
  await jsonStarted;
  api.cancel();
  resolveJson(login);
  await pending;
  assert.equal(requests,1);
  assert.equal(api.state.status,'Consulta cancelada');
  assert.equal(api.state.consoles.length,0);
});

test('null xHome login response: fail without requesting region',async()=>{
  let n=0;
  const api=harness(async()=>{n++;return ok(null);});
  await api.discover();
  assert.equal(n,1);
  assert.equal(api.state.status,'Falha na consulta');
  assert.match(api.state.error,/incompleta/);
});
test('expired cached GSSV token: no network request',async()=>{
  let n=0;
  const api=harness(async()=>{n++;throw new Error('network must not be called');},{
    getItem(k){return k==='xboxcom_xbl_user_info'?JSON.stringify({tokens:{'http://gssv.xboxlive.com/':{token:'EXPIRED',expiration:'2020-01-01T00:00:00Z'}}}):null;},
    get length(){return 0;}
  });
  await api.discover();
  assert.equal(n,0);
  assert.match(api.state.error,/GSSV/);
});
test('wrong relyingParty token: do not send token to xHome',async()=>{
  let n=0;
  const api=harness(async()=>{n++;throw new Error('network must not be called');},{
    getItem(){return JSON.stringify({tokens:[{relyingParty:'https://gssv.xboxlive.com.attacker.test',tokenData:{token:'BAD',expiration:'2099-01-01T00:00:00Z'}}]});},
    key(){return 'Auth.User.test';},
    get length(){return 1;}
  });
  await api.discover();
  assert.equal(n,0);
  assert.match(api.state.error,/GSSV/);
});

test('xHome resolution profile maps quality tiers to the browser client descriptor',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  const profile=value=>JSON.parse(JSON.stringify(api.resolutionProfile(value)));
  assert.deepEqual(profile('720p'),{resolution:'720p',osName:'android',width:1280,height:720});
  assert.deepEqual(profile('1080p'),{resolution:'1080p',osName:'windows',width:1920,height:1080});
  assert.deepEqual(profile('1080p-hq'),{resolution:'1080p-hq',osName:'tizen',width:1920,height:1080});
  assert.deepEqual(profile('invalid'),{resolution:'1080p',osName:'windows',width:1920,height:1080});
  const descriptor=JSON.parse(JSON.stringify(api.buildDeviceInfo('1080p-hq')));
  assert.equal(descriptor.appInfo.env.clientAppId,'play.xbox.com');
  assert.equal(descriptor.appInfo.env.clientAppType,'browser');
  assert.equal(descriptor.dev.os.name,'tizen');
  assert.equal(descriptor.dev.hw.model,'unknown');
  assert.equal(descriptor.dev.hw.sdktype,'web');
  assert.equal(descriptor.dev.browser.browserName,'chrome');
  assert.doesNotMatch(JSON.stringify(descriptor),/Surface Pro|Microsoft\\.GamingApp|"clientAppType":"native"/);
});

test('session: valid selected console requests xHome play without leaking bearer in state',async()=>{
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc',state:'Provisioning'});
    return ok({state:'Provisioned'});
  });
  api.state.consoles=[{id:'console-1',name:'Xbox'}];
  api.state.selectedId='console-1';
  api.state.regionShortName='wus';
  api.state.resolution='1080p-hq';
  await api.startSession();
  assert.equal(calls.length,3);
  assert.match(calls[1].url,/^https:\/\/wus\.core\.gssv-play-prodxhome\.xboxlive\.com\/v5\/sessions\/home\/play$/);
  const playBody=JSON.parse(calls[1].opts.body);
  const deviceInfo=JSON.parse(calls[1].opts.headers['X-MS-Device-Info']);
  assert.equal(playBody.serverId,'console-1');
  assert.equal(playBody.settings.osName,'tizen','the session body must match the selected HQ profile');
  assert.equal(deviceInfo.appInfo.env.clientAppType,'browser');
  assert.equal(deviceInfo.dev.os.name,'tizen','the device header must match the selected HQ profile');
  assert.equal(deviceInfo.dev.hw.model,'unknown','do not claim a Surface Pro hardware model');
  assert.equal(calls[1].opts.redirect,'error');
  assert.equal(api.state.sessionStatus,'provisioned');
  assert.ok(!JSON.stringify(api.state).includes('TEST_BEARER'));
});
test('session: invalid region blocks all network requests',async()=>{
  let n=0;
  const api=harness(async()=>{n++;throw Error('unexpected request');});
  api.state.consoles=[{id:'console-1'}];
  api.state.selectedId='console-1';
  api.state.regionShortName='wus.attacker.test';
  await api.startSession();
  assert.equal(n,0);
  assert.match(api.state.error,/Região/);
});
test('session: HTTP rejection never reports created',async()=>{
  let n=0;
  const api=harness(async()=>++n===1?ok(login):{ok:false,status:403});
  api.state.consoles=[{id:'console-1'}];
  api.state.selectedId='console-1';
  api.state.regionShortName='wus';
  await api.startSession();
  assert.equal(n,2);
  assert.equal(api.state.sessionStatus,'failed');
  assert.match(api.state.error,/403/);
});

test('session: terminal provisioning error releases the created session before reporting failure',async()=>{
  let n=0;
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(++n===1)return ok(login);
    if(n===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(n===3)return ok({state:'Failed'});
    return {ok:true,status:204};
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  assert.equal(n,4);
  assert.equal(calls[3].opts.method,'DELETE');
  assert.equal(api.state.sessionId,'');
  assert.equal(api.state.sessionStatus,'failed');
  assert.match(api.state.error,/não provisionada/);
  assert.match(api.state.error,/Sessão remota liberada/);
});

test('session: WebRTC offer is sent and SDP answer is applied',async()=>{
  const calls=[],peers=[];
  class FakePeer{
    constructor(){this.localDescription=null;this.remoteDescription=null;this.closed=false;peers.push(this);}
    addTransceiver(kind,options){assert.equal(options.direction,'recvonly');}
    createDataChannel(){return {};}
    async createOffer(){return {type:'offer',sdp:'v=0\\r\\n'};}
    async setLocalDescription(offer){this.localDescription=offer;}
    async setRemoteDescription(answer){this.remoteDescription=answer;}
    async addIceCandidate(candidate){this.remoteCandidate=candidate;}
    close(){this.closed=true;}
  }
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return ok({state:'Provisioned'});
    if(calls.length===4)return {ok:true,status:204};
    if(calls.length===5)return ok({exchangeResponse:JSON.stringify({sdpType:'answer',sdp:'v=0\\r\\n',status:'success'})});
    return ok({candidates:[]});
  },null,FakePeer);
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  assert.equal(calls.length,6);
  assert.match(calls[3].url,/\/sdp$/);
  assert.equal(calls[3].opts.method,'POST');
  assert.equal(JSON.parse(calls[3].opts.body).messageType,'offer');
  assert.equal(peers.length,1);
  assert.equal(peers[0].remoteDescription.type,'answer');
  assert.equal(api.state.sessionStatus,'ice-pending');
  assert.ok(!JSON.stringify(api.state).includes('TEST_BEARER'));
});

test('session: incoming tracks are deduplicated and media lifecycle diagnostics track audio/video readiness',async()=>{
  const peers=[];
  class FakePeer{
    constructor(){this.localDescription=null;this.remoteDescription=null;peers.push(this);}
    addTransceiver(){}
    createDataChannel(){return {};}
    async createOffer(){return {type:'offer',sdp:'v=0'};}
    async setLocalDescription(value){this.localDescription=value;}
    async setRemoteDescription(value){this.remoteDescription=value;}
    async addIceCandidate(){}
    close(){}
  }
  class FakeMediaStream{
    constructor(){this.tracks=[];}
    getTracks(){return this.tracks.slice();}
    addTrack(track){this.tracks.push(track);}
  }
  let n=0;
  const api=harness(async()=>{
    if(++n===1)return ok(login);
    if(n===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(n===3)return ok({state:'Provisioned'});
    if(n===4)return {ok:true,status:204};
    if(n===5)return ok({exchangeResponse:JSON.stringify({sdpType:'answer',sdp:'v=0'})});
    return ok({candidates:[]});
  },null,FakePeer,null,FakeMediaStream);
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  const video=fakeVideo(api);
  let playCalls=0;
  video.play=()=>{playCalls++;video.paused=false;return Promise.resolve();};
  api.state.videoElement=video;
  await api.startSession();

  const audioTrack=fakeTrack('audio-1','audio');
  const videoTrack=fakeTrack('video-1','video');
  const incoming={getTracks(){return [audioTrack,videoTrack];}};
  peers[0].ontrack({streams:[incoming],track:videoTrack});
  peers[0].ontrack({streams:[incoming],track:videoTrack});
  await Promise.resolve();

  assert.equal(api.state.mediaStream.getTracks().length,2);
  assert.equal(api.state.mediaStream.getTracks()[0],audioTrack);
  assert.equal(api.state.mediaStream.getTracks()[1],videoTrack);
  assert.equal(video.srcObject,api.state.mediaStream);
  assert.equal(playCalls,1,'duplicate ontrack events must not issue duplicate playback requests');
  assert.equal(api.state.mediaDiagnostics.audioTracks,1);
  assert.equal(api.state.mediaDiagnostics.videoTracks,1);
  assert.equal(api.state.mediaDiagnostics.liveAudioTracks,1);
  assert.equal(api.state.mediaDiagnostics.liveVideoTracks,1);

  audioTrack.muted=true;audioTrack.dispatch('mute',{});
  assert.equal(api.state.mediaDiagnostics.mutedAudioTracks,1);
  audioTrack.muted=false;audioTrack.dispatch('unmute',{});
  assert.equal(api.state.mediaDiagnostics.mutedAudioTracks,0);

  video.readyState=1;video.videoWidth=1920;video.videoHeight=1080;video.dispatch('loadedmetadata',{});
  assert.equal(api.state.mediaDiagnostics.videoMetadataReady,true);
  assert.equal(api.state.mediaDiagnostics.videoWidth,1920);
  video.readyState=2;video.dispatch('loadeddata',{});video.dispatch('playing',{});
  assert.equal(api.state.mediaDiagnostics.videoFrameReady,true);
  assert.equal(api.state.mediaDiagnostics.playbackState,'playing');
  videoTrack.readyState='ended';videoTrack.dispatch('ended',{});
  assert.equal(api.state.mediaDiagnostics.endedVideoTracks,1);
  assert.equal(api.state.mediaDiagnostics.liveVideoTracks,0);
  assert.equal(api.state.sessionStatus,'ice-pending');
});

test('session: autoplay rejection is diagnosed and Stop clears media listeners, tracks and stale callbacks',async()=>{
  const peers=[];
  class FakePeer{
    constructor(){this.localDescription=null;this.remoteDescription=null;this.closed=false;peers.push(this);}
    addTransceiver(){}
    createDataChannel(){return {};}
    async createOffer(){return {type:'offer',sdp:'v=0'};}
    async setLocalDescription(value){this.localDescription=value;}
    async setRemoteDescription(value){this.remoteDescription=value;}
    async addIceCandidate(){}
    close(){this.closed=true;}
  }
  class FakeMediaStream{
    constructor(){this.tracks=[];}
    getTracks(){return this.tracks.slice();}
    addTrack(track){this.tracks.push(track);}
  }
  let n=0;
  const api=harness(async(_url,opts)=>{
    if(++n===1)return ok(login);
    if(n===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(n===3)return ok({state:'Provisioned'});
    if(n===4)return {ok:true,status:204};
    if(n===5)return ok({exchangeResponse:JSON.stringify({sdpType:'answer',sdp:'v=0'})});
    if(opts && opts.method==='DELETE')return {ok:true,status:204};
    return ok({candidates:[]});
  },null,FakePeer,null,FakeMediaStream);
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  const video=fakeVideo(api);
  video.play=()=>Promise.reject(Object.assign(new Error('autoplay denied'),{name:'NotAllowedError'}));
  api.state.videoElement=video;
  await api.startSession();
  const audioTrack=fakeTrack('audio-stop','audio');
  const videoTrack=fakeTrack('video-stop','video');
  const incoming={getTracks(){return [audioTrack,videoTrack];}};
  peers[0].ontrack({streams:[incoming],track:videoTrack});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(api.state.mediaDiagnostics.playbackState,'blocked');
  assert.equal(api.state.mediaDiagnostics.playbackError,'NotAllowedError');
  assert.equal(audioTrack.listenerCount('mute'),1);
  assert.equal(video.listenerCount('playing'),1);
  const staleMute=audioTrack.listenersFor('mute')[0];
  const stalePlaying=video.listenersFor('playing')[0];

  await api.stop();
  assert.equal(peers[0].closed,true);
  assert.equal(api.state.mediaStream,null);
  assert.equal(video.srcObject,null);
  assert.equal(audioTrack.readyState,'ended');
  assert.equal(videoTrack.readyState,'ended');
  assert.equal(audioTrack.listenerCount('mute'),0);
  assert.equal(video.listenerCount('playing'),0);
  assert.equal(api.state.mediaDiagnostics.audioTracks,0);
  assert.equal(api.state.mediaDiagnostics.videoTracks,0);
  assert.equal(api.state.mediaDiagnostics.playbackState,'not-attempted');

  staleMute();stalePlaying();
  assert.equal(api.state.mediaDiagnostics.audioTracks,0);
  assert.equal(api.state.mediaDiagnostics.videoTracks,0);
  assert.equal(api.state.mediaDiagnostics.playbackState,'not-attempted');
});
test('session: remote ICE candidates are added to peer',async()=>{
  const peers=[];
  class FakePeer{
    constructor(){this.remoteCandidates=[];peers.push(this);}
    addTransceiver(){}
    createDataChannel(){return {};}
    async createOffer(){return {type:'offer',sdp:'v=0'};}
    async setLocalDescription(v){this.localDescription=v;}
    async setRemoteDescription(v){this.remoteDescription=v;}
    async addIceCandidate(v){this.remoteCandidates.push(v);}
    close(){}
  }
  let n=0;
  const api=harness(async()=>{
    if(++n===1)return ok(login);
    if(n===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(n===3)return ok({state:'Provisioned'});
    if(n===4)return {ok:true,status:204};
    if(n===5)return ok({exchangeResponse:JSON.stringify({sdpType:'answer',sdp:'v=0'})});
    return ok({candidates:[{candidate:'candidate:1 1 udp 1 127.0.0.1 9999 typ host',sdpMid:'0',sdpMLineIndex:0}]});
  },null,FakePeer);
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  assert.equal(n,6);
  assert.equal(peers[0].remoteCandidates.length,1);
  assert.equal(api.state.sessionStatus,'ice-pending');
});

test('session: negotiates xHome data channels and initializes protocol bootstrap after HandshakeAck',async()=>{
  const peers=[];
  class FakeChannel{
    constructor(label,options){this.label=label;this.protocol=options.protocol;this.ordered=options.ordered;this.readyState='open';this.sent=[];peers[0].channels[label]=this;}
    send(data){this.sent.push(data);}
    close(){this.readyState='closed';}
  }
  class FakePeer{
    constructor(){this.channels={};this.connectionState='new';this.signalingState='stable';peers.push(this);}
    createDataChannel(label,options){return new FakeChannel(label,options);}
    addTransceiver(){}
    async createOffer(){return {type:'offer',sdp:'v=0\\r\\n'};}
    async setLocalDescription(offer){this.localDescription=offer;}
    async setRemoteDescription(answer){this.remoteDescription=answer;}
    async addIceCandidate(candidate){this.remoteCandidate=candidate;}
    close(){this.connectionState='closed';}
  }
  let n=0;
  const api=harness(async(url,opts)=>{
    n++;
    if(n===1)return ok(login);
    if(n===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(n===3)return ok({state:'Provisioned'});
    if(n===4)return {ok:true,status:204};
    if(n===5)return ok({exchangeResponse:JSON.stringify({sdpType:'answer',sdp:'v=0'})});
    if(n===6)return ok({candidates:[]});
    if(opts.method==='DELETE')return {ok:true,status:204};
    throw new Error('unexpected request '+url);
  },null,FakePeer);
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  api.state.resolution='720p';
  await api.startSession();
  const channels=api.channels();
  assert.deepEqual(Object.keys(channels).sort(),['chat','control','input','message']);
  assert.deepEqual(Object.values(channels).map(c=>[c.label,c.protocol,c.ordered]).sort((a,b)=>a[0].localeCompare(b[0])),[
    ['chat','chatV1',true],['control','controlV1',true],['input','1.0',true],['message','messageV1',true]
  ]);
  assert.equal(api.state.dataChannelsReady,false);
  for(const name of ['chat','control','input','message'])channels[name].onopen();
  assert.equal(JSON.parse(channels.message.sent[0]).type,'Handshake');
  assert.equal(channels.control.sent.length,0,'control authorization waits for message HandshakeAck');
  channels.message.onmessage({data:JSON.stringify({type:'HandshakeAck'})});
  assert.equal(api.state.dataChannelsReady,true);
  const control=channels.control.sent.map(JSON.parse);
  assert.equal(control[0].message,'authorizationRequest');
  assert.equal(control[1].message,'gamepadChanged');
  assert.equal(control[1].wasAdded,true);
  assert.equal(control[2].wasAdded,false);
  assert.equal(channels.input.sent.length,1);
  const metadata=new DataView(channels.input.sent[0]);
  assert.equal(channels.input.sent[0].byteLength,15);
  assert.equal(metadata.getUint16(0,true),8);
  assert.equal(metadata.getUint32(2,true),0);
  assert.equal(metadata.getUint8(14),1);
  const messages=channels.message.sent.slice(1).map(JSON.parse);
  assert.equal(messages.length,6);
  assert.equal(messages[0].target,'/streaming/systemUi/configuration');
  assert.equal(messages[3].target,'/streaming/characteristics/touchinputenabledchanged');
  const dimensions=JSON.parse(messages[5].content);
  assert.equal(messages[5].target,'/streaming/characteristics/dimensionschanged');
  assert.equal(dimensions.horizontal,1280);
  assert.equal(dimensions.vertical,720);
  assert.equal(api.state.status.includes('gamepad físico encaminhado quando detectado'),true);
  assert.equal(JSON.stringify(channels).includes('TEST_BEARER'),false);
  await api.stop();
  for(const name of ['chat','control','input','message'])assert.equal(channels[name].readyState,'closed');
  assert.equal(api.state.dataChannelsReady,false);
});
 
test('stop: closes local resources even when remote auth context is unavailable',async()=>{
  const api=harness(async()=>{throw Error('unexpected fetch');});
  let closed=0;
  api.state.busy=false;
  api.state.peer={close(){closed++;}};
  api.state.sessionId='12345678-1234-1234-1234-123456789abc';
  api.state.sessionStatus='connected';
  await api.stop();
  assert.equal(closed,1);
  assert.equal(api.state.peer,null);
  assert.equal(api.state.sessionId,'');
  assert.equal(api.state.sessionStatus,'stopped-local-only');
  assert.match(api.state.error,/região inválida/);
});


test('stop: sends authenticated regional DELETE and keeps the bearer out of UI state',async()=>{
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return ok({state:'Provisioned'});
    return {ok:true,status:204};
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  assert.equal(api.state.sessionStatus,'provisioned');
  assert.ok(!JSON.stringify(api.state).includes('TEST_BEARER'));
  await api.stop();
  assert.equal(calls.length,4);
  assert.equal(calls[3].url,'https://wus.core.gssv-play-prodxhome.xboxlive.com/v5/sessions/home/12345678-1234-1234-1234-123456789abc');
  assert.equal(calls[3].opts.method,'DELETE');
  assert.equal(calls[3].opts.headers.Authorization,'Bearer TEST_BEARER');
  assert.equal(calls[3].opts.redirect,'error');
  assert.equal(api.state.sessionId,'');
  assert.equal(api.state.sessionStatus,'stopped');
  assert.ok(!JSON.stringify(api.state).includes('TEST_BEARER'));
});

test('stop: HTTP rejection preserves local cleanup and offers an in-memory retry',async()=>{
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return ok({state:'Provisioned'});
    if(calls.length===4)return {ok:false,status:401};
    return {ok:true,status:204};
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  await api.stop();
  assert.equal(api.state.sessionId,'');
  assert.equal(api.state.sessionStatus,'stopped-local-only');
  assert.match(api.state.error,/HTTP 401/);
  const before=calls.length;
  await api.discover();
  assert.equal(calls.length,before,'discovery is blocked while remote release is pending');
  await api.retryRelease();
  assert.equal(calls.length,before+1);
  assert.equal(calls.at(-1).opts.method,'DELETE');
  assert.equal(api.state.sessionStatus,'stopped');
  assert.equal(api.state.error,'');
});

test('stop: timeout is bounded and local media resources are still released',async()=>{
  const calls=[];
  const marker={immediate:true};
  const timers={
    setTimeout(fn,ms){if(ms===8000){fn();return marker;}return setTimeout(fn,ms);},
    clearTimeout(id){if(id!==marker)clearTimeout(id);}
  };
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return ok({state:'Provisioned'});
    if(opts.method==='DELETE'){
      assert.equal(opts.signal.aborted,true);
      const error=new Error('aborted');error.name='AbortError';throw error;
    }
    throw new Error('unexpected request');
  },null,null,timers);
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  let stopped=0;
  api.state.mediaStream={getTracks(){return [{stop(){stopped++;}}];}};
  await api.stop();
  assert.equal(stopped,1);
  assert.equal(api.state.sessionId,'');
  assert.equal(api.state.sessionStatus,'stopped-local-only');
  assert.match(api.state.error,/timeout/);
});

test('cancel during session creation waits for the response and then DELETEs the created session',async()=>{
  let resolvePlay,notifyPlay;
  const playStarted=new Promise(resolve=>{notifyPlay=resolve;});
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2){notifyPlay();return new Promise(resolve=>{resolvePlay=resolve;});}
    return {ok:true,status:204};
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  const pending=api.startSession();
  await playStarted;
  assert.equal(api.state.createPending,true);
  api.cancel();
  assert.equal(api.state.cancelAfterCreate,true);
  resolvePlay(ok({sessionId:'12345678-1234-1234-1234-123456789abc'}));
  await pending;
  assert.equal(calls.length,3);
  assert.equal(calls[2].opts.method,'DELETE');
  assert.equal(api.state.sessionId,'');
  assert.equal(api.state.sessionStatus,'stopped');
});

test('session failure after server creation attempts remote DELETE before reporting failure',async()=>{
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return {ok:false,status:503};
    return {ok:true,status:204};
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  assert.equal(calls.length,4);
  assert.equal(calls[3].opts.method,'DELETE');
  assert.equal(api.state.sessionId,'');
  assert.equal(api.state.sessionStatus,'failed');
  assert.match(api.state.error,/HTTP 503/);
  assert.match(api.state.error,/Sessão remota liberada/);
});

for (const status of [403, 500]) {
  test(`stop: HTTP ${status} preserves remote release and retry remains available`, async () => {
    const calls=[];
    const api=harness(async(url,opts)=>{
      calls.push({url,opts});
      if(calls.length===1)return ok(login);
      if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
      if(calls.length===3)return ok({state:'Provisioned'});
      if(calls.length===4)return {ok:false,status};
      return {ok:true,status:204};
    });
    api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
    await api.startSession();
    let peerClosed=0,trackStopped=0;
    api.state.peer={close(){peerClosed++;}};
    api.state.mediaStream={getTracks(){return [{stop(){trackStopped++;}}];}};
    await api.stop();
    assert.equal(calls.length,4);
    assert.equal(api.state.sessionStatus,'stopped-local-only');
    assert.match(api.state.error,new RegExp('HTTP '+status));
    assert.equal(peerClosed,1);
    assert.equal(trackStopped,1);
    await api.discover();
    await api.startSession();
    assert.equal(calls.length,4,'new discovery and start stay blocked while release is pending');
    await api.retryRelease();
    assert.equal(calls.length,5);
    assert.equal(calls[4].opts.method,'DELETE');
    assert.equal(api.state.sessionStatus,'stopped');
    assert.equal(api.state.error,'');
  });
}

for (const status of [404, 410]) {
  test(`stop: HTTP ${status} is idempotent and does not create a retry`, async () => {
    const calls=[];
    const api=harness(async(url,opts)=>{
      calls.push({url,opts});
      if(calls.length===1)return ok(login);
      if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
      if(calls.length===3)return ok({state:'Provisioned'});
      return {ok:false,status};
    });
    api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
    await api.startSession();
    await api.stop();
    assert.equal(api.state.sessionStatus,'stopped');
    assert.match(api.state.status,/já estava encerrada/i);
    await api.stop();
    await api.retryRelease();
    assert.equal(calls.length,4,'404/410 must not be retried as pending releases');
    assert.equal(api.state.sessionStatus,'stopped');
  });
}

test('stop: network failure keeps the release pending and retry succeeds',async()=>{
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return ok({state:'Provisioned'});
    if(calls.length===4)throw new TypeError('network offline');
    return {ok:true,status:204};
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  await api.stop();
  assert.equal(api.state.sessionStatus,'stopped-local-only');
  assert.match(api.state.error,/falha de rede/i);
  await api.retryRelease();
  assert.equal(calls.length,5);
  assert.equal(calls[4].opts.method,'DELETE');
  assert.equal(api.state.sessionStatus,'stopped');
});

test('stop: repeated Stop while remote release is pending preserves status and sends no duplicate DELETE',async()=>{
  const calls=[];
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return ok({state:'Provisioned'});
    if(calls.length===4)return {ok:false,status:503};
    return {ok:true,status:204};
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  await api.stop();
  const pendingStatus=api.state.status;
  const pendingError=api.state.error;
  await api.stop();
  assert.equal(calls.length,4,'repeated Stop must not issue a second DELETE');
  assert.equal(api.state.sessionStatus,'stopped-local-only');
  assert.equal(api.state.status,pendingStatus);
  assert.equal(api.state.error,pendingError);
  await api.retryRelease();
  assert.equal(calls.length,5);
  assert.equal(api.state.sessionStatus,'stopped');
});

test('stop: repeated retry while DELETE is in flight sends only one request',async()=>{
  const calls=[];
  let resolveRetry,notifyRetry;
  const retryStarted=new Promise(resolve=>{notifyRetry=resolve;});
  const api=harness(async(url,opts)=>{
    calls.push({url,opts});
    if(calls.length===1)return ok(login);
    if(calls.length===2)return ok({sessionId:'12345678-1234-1234-1234-123456789abc'});
    if(calls.length===3)return ok({state:'Provisioned'});
    if(calls.length===4)return {ok:false,status:401};
    notifyRetry();
    return new Promise(resolve=>{resolveRetry=resolve;});
  });
  api.state.consoles=[{id:'console-1'}];api.state.selectedId='console-1';api.state.regionShortName='wus';
  await api.startSession();
  await api.stop();
  const first=api.retryRelease();
  await retryStarted;
  await api.retryRelease();
  assert.equal(calls.length,5,'only the first retry may issue DELETE');
  resolveRetry({ok:true,status:204});
  await first;
  assert.equal(api.state.sessionStatus,'stopped');
  assert.equal(calls.length,5);
});


test('data channels: handshake timeout closes channels and releases the local session', async () => {
  const scheduled = new Map();
  let nextId = 0;
  const timers = {
    setTimeout(fn, ms) { const id = ++nextId; scheduled.set(id, { fn, ms }); return id; },
    clearTimeout(id) { scheduled.delete(id); }
  };
  class FakeChannel {
    constructor(label) { this.label = label; this.readyState = 'connecting'; this.sent = []; }
    send(data) { this.sent.push(data); }
    close() { this.readyState = 'closed'; }
  }
  class FakePeer {
    constructor() { this.channels = {}; this.closed = false; }
    createDataChannel(label) { return (this.channels[label] = new FakeChannel(label)); }
    close() { this.closed = true; }
  }
  const api = harness(async () => { throw new Error('unexpected network'); }, null, null, timers);
  const peer = new FakePeer();
  api.state.peer = peer;
  api.initChannels(peer, api.state.requestId, new AbortController().signal);
  const timer = Array.from(scheduled.values()).find(item => item.ms === 12000);
  assert.ok(timer, '12-second handshake timeout is scheduled');
  timer.fn();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(api.state.sessionStatus, 'stopped');
  assert.match(api.state.status, /tempo limite de 12 segundos/i);
  assert.equal(api.state.dataChannelsReady, false);
  assert.equal(api.state.channelTimer, null);
  assert.equal(peer.closed, true);
  assert.ok(Object.values(peer.channels).every(channel => channel.readyState === 'closed'));
});

test('data channels: unexpected close after HandshakeAck tears down the xHome session', async () => {
  const scheduled = new Map();
  let nextId = 0;
  const timers = {
    setTimeout(fn, ms) { const id = ++nextId; scheduled.set(id, { fn, ms }); return id; },
    clearTimeout(id) { scheduled.delete(id); }
  };
  class FakeChannel {
    constructor(label) { this.label = label; this.readyState = 'open'; this.sent = []; }
    send(data) { this.sent.push(data); }
    close() { this.readyState = 'closed'; }
  }
  class FakePeer {
    constructor() { this.channels = {}; this.closed = false; }
    createDataChannel(label) { return (this.channels[label] = new FakeChannel(label)); }
    close() { this.closed = true; }
  }
  const api = harness(async () => { throw new Error('unexpected network'); }, null, null, timers);
  const peer = new FakePeer();
  api.state.peer = peer;
  api.initChannels(peer, api.state.requestId, new AbortController().signal);
  const channels = api.channels();
  for (const name of ['chat', 'control', 'input', 'message']) channels[name].onopen();
  channels.message.onmessage({ data: JSON.stringify({ type: 'HandshakeAck' }) });
  assert.equal(api.state.dataChannelsReady, true);
  assert.equal(api.state.channelTimer, null);
  assert.equal(scheduled.size, 0, 'successful handshake cancels the timeout');
  channels.input.readyState = 'closed';
  channels.input.onclose();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(api.state.dataChannelsReady, false);
  assert.equal(api.state.sessionStatus, 'stopped');
  assert.match(api.state.status, /canal input fechado inesperadamente/i);
  assert.equal(peer.closed, true);
  assert.ok(Object.values(channels).every(channel => channel.readyState === 'closed'));
});


test('gamepad encoder: serializes standard controls into the 38-byte xHome packet', () => {
  const api=harness(async()=>{throw new Error('unexpected network');});
  const buttons=Array.from({length:17},()=>({pressed:false,value:0}));
  for(const index of [0,1,2,3,4,5,8,9,10,11,12,13,14,15,16]) buttons[index]={pressed:true,value:1};
  buttons[6]={pressed:true,value:0.25};
  buttons[7]={pressed:true,value:0.75};
  const packet=api.encodeGamepadFrame({mapping:'standard',buttons,axes:[1,-1,0.5,-0.5]},2,0x01020304,123.5);
  assert.equal(Object.prototype.toString.call(packet),'[object ArrayBuffer]');
  assert.equal(packet.byteLength,38);
  const view=new DataView(packet);
  assert.equal(view.getUint16(0,true),2);
  assert.equal(view.getUint32(2,true),0x01020304);
  assert.equal(view.getFloat64(6,true),123.5);
  assert.equal(view.getUint8(14),1);
  assert.equal(view.getUint8(15),2);
  assert.equal(view.getUint16(16,true),0xfffe);
  assert.equal(view.getInt16(18,true),32767);
  assert.equal(view.getInt16(20,true),32767);
  assert.equal(view.getInt16(22,true),16383);
  assert.equal(view.getInt16(24,true),16383);
  assert.equal(view.getUint16(26,true),16383);
  assert.equal(view.getUint16(28,true),49151);
  assert.equal(view.getUint32(30,true),1);
  assert.equal(view.getUint32(34,false),1);
});

test('gamepad encoder: clamps analog values, wraps sequence and rejects unsupported mapping or slot', () => {
  const api=harness(async()=>{throw new Error('unexpected network');});
  const buttons=Array.from({length:17},()=>({pressed:false,value:0}));
  buttons[6]={value:2};buttons[7]={value:-1};
  const pad={mapping:'standard',buttons,axes:[2,NaN,-2,Infinity]};
  const packet=api.encodeGamepadFrame(pad,0,-1,10);
  const view=new DataView(packet);
  assert.equal(view.getUint32(2,true),0xffffffff);
  assert.equal(view.getInt16(18,true),32767);
  assert.equal(view.getInt16(20,true),0);
  assert.equal(view.getInt16(22,true),-32767);
  assert.equal(view.getInt16(24,true),0);
  assert.equal(view.getUint16(26,true),65535);
  assert.equal(view.getUint16(28,true),0);
  assert.equal(api.encodeGamepadFrame({...pad,mapping:'custom'},0,0,0),null);
  assert.equal(api.encodeGamepadFrame(pad,4,0,0),null);
  assert.equal(api.encodeGamepadFrame(null,0,0,0),null);
});

test('gamepad slots: registration is gated, idempotent and released before channel teardown', () => {
  const timers={
    setTimeout(){return 1;},
    clearTimeout(){}
  };
  class FakeChannel {
    constructor(label){this.label=label;this.readyState='open';this.sent=[];}
    send(data){this.sent.push(data);}
    close(){this.readyState='closed';}
  }
  class FakePeer {
    constructor(){this.channels={};}
    createDataChannel(label){return (this.channels[label]=new FakeChannel(label));}
    close(){}
  }
  const api=harness(async()=>{throw new Error('unexpected network');},null,null,timers);
  const peer=new FakePeer();
  api.state.peer=peer;
  api.initChannels(peer,api.state.requestId,new AbortController().signal);
  const channels=api.channels();
  assert.equal(api.setGamepadSlot(0,true),false,'slot registration waits for completed handshake');
  for(const name of ['chat','control','input','message'])channels[name].onopen();
  channels.message.onmessage({data:JSON.stringify({type:'HandshakeAck'})});
  assert.equal(api.state.dataChannelsReady,true);
  const initialCount=channels.control.sent.length;
  assert.equal(api.setGamepadSlot(0,true),true);
  assert.equal(api.setGamepadSlot(0,true),true);
  assert.equal(channels.control.sent.length,initialCount+1,'duplicate add is suppressed');
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);
  assert.equal(api.setGamepadSlot(0,false),true);
  assert.equal(api.setGamepadSlot(0,false),true);
  assert.equal(channels.control.sent.length,initialCount+2,'duplicate remove is suppressed');
  assert.deepEqual(Array.from(api.registeredSlots()),[]);
  assert.equal(api.setGamepadSlot(1,true),true);
  api.closeChannels();
  assert.deepEqual(Array.from(api.registeredSlots()),[]);
  const release=JSON.parse(channels.control.sent.at(-1));
  assert.deepEqual(release,{message:'gamepadChanged',gamepadIndex:1,wasAdded:false});
  const neutralFrames=channels.input.sent.filter(data=>Object.prototype.toString.call(data)==='[object ArrayBuffer]'&&data.byteLength===38);
  assert.equal(neutralFrames.length,1,'teardown sends one neutral gamepad frame before closing input');
  const neutralView=new DataView(neutralFrames[0]);
  assert.equal(neutralView.getUint16(16,true),0);
  assert.equal(neutralView.getInt16(18,true),0);
  assert.equal(neutralView.getInt16(20,true),0);
  assert.equal(neutralView.getInt16(22,true),0);
  assert.equal(neutralView.getInt16(24,true),0);
  assert.equal(neutralView.getUint16(26,true),0);
  assert.equal(neutralView.getUint16(28,true),0);
  assert.ok(Object.values(channels).every(channel=>channel.readyState==='closed'));
});


function readyInputHarness() {
  const events=[];
  class FakeChannel {
    constructor(label){this.label=label;this.readyState='open';this.sent=[];this.bufferedAmount=0;}
    send(data){if(this.failSend){this.failSend=false;throw new Error('simulated send failure');}this.sent.push(data);events.push({channel:this.label,data});}
    close(){this.readyState='closed';}
  }
  class FakePeer {
    constructor(){this.channels={};this.connectionState='connected';this.closed=false;}
    createDataChannel(label){return (this.channels[label]=new FakeChannel(label));}
    close(){this.closed=true;}
  }
  const api=harness(async()=>{throw new Error('unexpected network');});
  const peer=new FakePeer();
  api.state.peer=peer;
  api.initChannels(peer,api.state.requestId,new AbortController().signal);
  const channels=api.channels();
  for(const name of ['chat','control','input','message'])channels[name].onopen();
  channels.message.onmessage({data:JSON.stringify({type:'HandshakeAck'})});
  api.state.sessionStatus='connected';
  return {api,channels,events};
}
function standardPad(index) {
  return {
    index:index,
    connected:true,
    mapping:'standard',
    buttons:Array.from({length:17},()=>({pressed:false,value:0})),
    axes:[0,0,0,0]
  };
}
function xhomeFrames(channel) {
  return channel.sent.filter(data=>Object.prototype.toString.call(data)==='[object ArrayBuffer]'&&data.byteLength===38);
}
function gamepadEvents(channel) {
  return channel.sent.filter(data=>typeof data==='string').map(data=>JSON.parse(data)).filter(data=>data.message==='gamepadChanged');
}

test('gamepad scheduler: sends frames only after peer, channels and handshake are ready',()=>{
  const {api,channels}=readyInputHarness();
  const pad=standardPad(0);
  pad.buttons[0]={pressed:true,value:1};
  assert.equal(api.ready(),true);
  api.state.dataChannelsReady=false;
  api.tickGamepads([pad],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[]);
  assert.equal(xhomeFrames(channels.input).length,0);
  api.state.dataChannelsReady=true;
  api.tickGamepads([pad],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);
  assert.equal(xhomeFrames(channels.input).length,1);
  assert.equal(new DataView(xhomeFrames(channels.input)[0]).getUint16(16,true),16);
});

test('gamepad scheduler: keeps stable slots, registers once and neutralizes before disconnect',()=>{
  const {api,channels,events}=readyInputHarness();
  const pad=standardPad(2);
  pad.buttons[0]={pressed:true,value:1};
  pad.axes[0]=0.5;
  api.tickGamepads([pad],true);
  api.tickGamepads([pad],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[2]);
  assert.equal(gamepadEvents(channels.control).filter(message=>message.gamepadIndex===2&&message.wasAdded===true).length,1);
  assert.equal(xhomeFrames(channels.input).length,2);
  const active=new DataView(xhomeFrames(channels.input)[1]);
  assert.equal(active.getUint8(15),2);
  assert.equal(active.getUint16(16,true),16);
  assert.equal(active.getInt16(18,true),16383);
  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[]);
  assert.equal(gamepadEvents(channels.control).filter(message=>message.gamepadIndex===2&&message.wasAdded===false).length,1);
  const neutral=new DataView(xhomeFrames(channels.input).at(-1));
  assert.equal(neutral.getUint16(16,true),0);
  assert.equal(neutral.getInt16(18,true),0);
  assert.equal(neutral.getUint16(26,true),0);
  const neutralIndex=events.findLastIndex(event=>event.channel==='input'&&Object.prototype.toString.call(event.data)==='[object ArrayBuffer]'&&event.data.byteLength===38);
  const releaseIndex=events.findLastIndex(event=>event.channel==='control'&&typeof event.data==='string'&&JSON.parse(event.data).message==='gamepadChanged'&&JSON.parse(event.data).gamepadIndex===2);
  assert.ok(neutralIndex>=0&&releaseIndex>neutralIndex,'neutral frame must precede gamepadChanged(false)');
});

test('gamepad scheduler: blur or panel suspension sends one neutral frame and resumes cleanly',()=>{
  const {api,channels}=readyInputHarness();
  const pad=standardPad(0);
  pad.buttons[1]={pressed:true,value:1};
  api.tickGamepads([pad],true);
  const before=xhomeFrames(channels.input).length;
  api.suspendGamepads();
  api.suspendGamepads();
  api.tickGamepads([pad],false);
  assert.equal(xhomeFrames(channels.input).length,before+1);
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);
  api.tickGamepads([pad],true);
  assert.equal(xhomeFrames(channels.input).length,before+2);
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);
});

test('gamepad scheduler: backpressure bounds input queue and resumes with current state',()=>{
  const {api,channels}=readyInputHarness();
  const pad=standardPad(1);
  pad.buttons[4]={pressed:true,value:1};
  channels.input.bufferedAmount=4097;
  api.tickGamepads([pad],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[1]);
  assert.equal(xhomeFrames(channels.input).length,0);
  channels.input.bufferedAmount=0;
  api.tickGamepads([pad],true);
  assert.equal(xhomeFrames(channels.input).length,1);
  assert.equal(new DataView(xhomeFrames(channels.input)[0]).getUint16(16,true),4096);
});

test('gamepad encoder: pressed digital button falls back when value is zero',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  const buttons=Array.from({length:17},()=>({pressed:false,value:0}));
  buttons[0]={pressed:true,value:0};
  const packet=api.encodeGamepadFrame({mapping:'standard',buttons,axes:[0,0,0,0]},0,1,10);
  assert.equal(new DataView(packet).getUint16(16,true),16);
});


test('gamepad scheduler: retries neutralization when the data channel rejects a release frame',()=>{
  const {api,channels}=readyInputHarness();
  const pad=standardPad(0);
  pad.buttons[0]={pressed:true,value:1};
  api.tickGamepads([pad],true);
  const before=xhomeFrames(channels.input).length;
  channels.input.failSend=true;
  api.suspendGamepads();
  assert.equal(xhomeFrames(channels.input).length,before);
  api.suspendGamepads();
  assert.equal(xhomeFrames(channels.input).length,before+1);
  api.tickGamepads([pad],true);
  assert.equal(xhomeFrames(channels.input).length,before+2);
});

test('gamepad scheduler: keeps a slot registered until a disconnect neutral frame is accepted',()=>{
  const {api,channels}=readyInputHarness();
  const pad=standardPad(1);
  pad.buttons[1]={pressed:true,value:1};
  api.tickGamepads([pad],true);
  channels.input.failSend=true;
  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[1]);
  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[]);
  assert.equal(gamepadEvents(channels.control).filter(message=>message.gamepadIndex===1&&message.wasAdded===false).length,1);
});



test('virtual gamepad normalization: applies radial deadzone, circular clamp and standard button values',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  const buttons=Array(17).fill(false);buttons[0]=true;buttons[6]=0.5;
  const pad=api.normalizeVirtualGamepadState({axes:[0.5,0.5,0.04,0],buttons,deadzone:0.1});
  assert.ok(pad);
  assert.equal(pad.mapping,'standard');
  assert.ok(Math.abs(Math.hypot(pad.axes[0],pad.axes[1])-((Math.SQRT1_2-0.1)/0.9))<1e-9);
  assert.equal(pad.axes[2],0);
  assert.equal(pad.axes[3],0);
  assert.equal(pad.buttons[0].pressed,true);
  assert.equal(pad.buttons[0].value,1);
  assert.equal(pad.buttons[6].pressed,true);
  assert.equal(pad.buttons[6].value,0.5);
  assert.ok(Math.hypot(pad.axes[0],pad.axes[1])<=1);
  assert.equal(api.normalizeVirtualGamepadState({}),null);
});

test('xHome touch gamepad adapter: registers once and sends normalized analog, trigger and button frames',()=>{
  const {api,channels}=readyInputHarness();
  const adapter=api.createTouchAdapter(api.state.requestId,api.state.peer,channels);
  const bootstrapAdds=gamepadEvents(channels.control).filter(message=>message.gamepadIndex===0&&message.wasAdded===true).length;
  const buttons=Array(17).fill(false);buttons[0]=true;buttons[6]=0.5;
  const state={axes:[0.5,0.5,0,0],buttons};
  const normalized=api.normalizeVirtualGamepadState(state);
  assert.equal(adapter.sendGamepad(state),true);
  api.tickGamepads([],true);
  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);
  assert.equal(gamepadEvents(channels.control).filter(message=>message.gamepadIndex===0&&message.wasAdded===true).length,bootstrapAdds+1);
  const frames=xhomeFrames(channels.input);
  assert.equal(frames.length,2);
  const view=new DataView(frames[0]);
  assert.equal(view.getUint8(15),0);
  assert.equal(view.getUint16(16,true),16);
  assert.equal(view.getInt16(18,true),Math.trunc(normalized.axes[0]*32767));
  assert.equal(view.getInt16(20,true),Math.trunc(-normalized.axes[1]*32767));
  assert.equal(view.getUint16(26,true),Math.trunc(0.5*65535));
  assert.equal(adapter.isReady(),true);
});

test('xHome virtual touch gamepad: suspension clears held state and requires fresh input after resume',()=>{
  const {api,channels}=readyInputHarness();
  const adapter=api.createTouchAdapter(api.state.requestId,api.state.peer,channels);
  const state={axes:[0.75,0,0,0],buttons:[true]};
  assert.equal(adapter.sendGamepad(state),true);
  api.tickGamepads([],true);
  assert.ok(api.virtualGamepad());
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);

  const beforeSuspend=xhomeFrames(channels.input).length;
  api.suspendGamepads();
  assert.equal(api.virtualGamepad(),null,'suspension discards touch-held state');
  assert.equal(xhomeFrames(channels.input).length,beforeSuspend+1,'suspension sends one neutral frame');
  api.suspendGamepads();
  assert.equal(xhomeFrames(channels.input).length,beforeSuspend+1,'repeated suspension does not flood neutral frames');
  assert.equal(adapter.sendGamepad(state),false,'stale touch updates are rejected while suspended');

  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[],'old virtual slot is unregistered on resume');
  assert.equal(adapter.sendGamepad(state),true,'fresh touch input is accepted after scheduler resumes');
  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);
  const active=new DataView(xhomeFrames(channels.input).at(-1));
  assert.equal(active.getUint16(16,true),16);
  assert.ok(active.getInt16(18,true)>0);
});

test('xHome virtual touch gamepad: empty shared snapshot resumes input without Gamepad API',()=>{
  const {api,channels}=readyInputHarness();
  const adapter=api.createTouchAdapter(api.state.requestId,api.state.peer,channels);
  const state={axes:[0.6,0,0,0],buttons:[true]};
  api.suspendGamepads();
  assert.equal(adapter.sendGamepad(state),false,'touch input remains blocked while suspended');
  // nxGamepadUiTick supplies [] when Gamepad API is absent; the shared scheduler must still run.
  api.tickGamepads([],true);
  assert.equal(adapter.sendGamepad(state),true,'empty-snapshot scheduler tick reopens virtual input');
  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[0]);
  const frame=new DataView(xhomeFrames(channels.input).at(-1));
  assert.equal(frame.getUint16(16,true),16);
  assert.ok(frame.getInt16(18,true)>0);
});

test('xHome touch gamepad adapter: reserves a free slot beside physical pads without replacing them',()=>{
  const {api,channels}=readyInputHarness();
  const adapter=api.createTouchAdapter(api.state.requestId,api.state.peer,channels);
  assert.equal(adapter.sendGamepad({axes:[0.25,0,0,0],buttons:[]}),true);
  const first=standardPad(0);
  api.tickGamepads([first],true);
  assert.equal(api.virtualGamepad().slot,1);
  const second=standardPad(1);
  api.tickGamepads([first,second],true);
  assert.equal(api.virtualGamepad().slot,2);
  assert.deepEqual(Array.from(api.registeredSlots()),[0,1,2]);
  const lastSlots=xhomeFrames(channels.input).slice(-3).map(frame=>new DataView(frame).getUint8(15));
  assert.deepEqual(lastSlots,[0,1,2]);
});

test('xHome touch gamepad adapter: release neutralizes before unregister and stale sessions cannot send',()=>{
  const {api,channels}=readyInputHarness();
  const adapter=api.createTouchAdapter(api.state.requestId,api.state.peer,channels);
  const bootstrapRemoves=gamepadEvents(channels.control).filter(message=>message.gamepadIndex===0&&message.wasAdded===false).length;
  assert.equal(adapter.sendGamepad({axes:[0.5,0,0,0],buttons:[true]}),true);
  api.tickGamepads([],true);
  const before=xhomeFrames(channels.input).length;
  assert.equal(adapter.releaseGamepad(),true);
  assert.equal(xhomeFrames(channels.input).length,before+1);
  assert.equal(new DataView(xhomeFrames(channels.input).at(-1)).getUint16(16,true),0);
  api.tickGamepads([],true);
  assert.deepEqual(Array.from(api.registeredSlots()),[]);
  assert.equal(gamepadEvents(channels.control).filter(message=>message.gamepadIndex===0&&message.wasAdded===false).length,bootstrapRemoves+1);

  const stale=api.createTouchAdapter(api.state.requestId,api.state.peer,channels);
  assert.equal(stale.sendGamepad({axes:[0,0,0,0],buttons:[true]}),true);
  api.tickGamepads([],true);
  api.state.requestId++;
  assert.equal(stale.sendGamepad({axes:[1,0,0,0],buttons:[true]}),false);
  assert.equal(stale.releaseGamepad(),true);
  api.tickGamepads([],true);
  assert.equal(api.virtualGamepad(),null);
  assert.deepEqual(Array.from(api.registeredSlots()),[]);
});

test('keyboard encoder: writes the VKey report, one-frame count, state and virtual key code',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  const packet=api.encodeKeyboardFrame({code:'KeyA',keyCode:0,pressed:true},0x100000002,12.5);
  assert.equal(packet.byteLength,18);
  const view=new DataView(packet);
  assert.equal(view.getUint16(0,true),64,'ReportTypes.Keyboard');
  assert.equal(view.getUint32(2,true),2,'sequence wraps to uint32');
  assert.equal(view.getFloat64(6,true),12.5);
  assert.equal(view.getUint8(14),1,'one keyboard frame');
  assert.equal(view.getUint8(15),2,'VKey frame type');
  assert.equal(view.getUint8(16),1,'keydown');
  assert.equal(view.getUint8(17),65,'KeyA virtual key');
  const release=api.encodeKeyboardFrame({code:'KeyA',keyCode:65,pressed:false},3,13);
  const releaseView=new DataView(release);
  assert.equal(releaseView.getUint8(16),0,'keyup');
  assert.equal(releaseView.getUint8(17),65);
});

test('keyboard virtual-key mapping: handles physical codes, function keys and legacy fallback',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  assert.equal(api.virtualKey('KeyZ',0),0x5A);
  assert.equal(api.virtualKey('Digit7',0),0x37);
  assert.equal(api.virtualKey('Numpad3',0),0x63);
  assert.equal(api.virtualKey('ArrowUp',0),0x26);
  assert.equal(api.virtualKey('F12',0),0x7B);
  assert.equal(api.virtualKey('ShiftLeft',0),0xA0);
  assert.equal(api.virtualKey('Unidentified',13),13);
  assert.equal(api.virtualKey('Unidentified',0),null);
  assert.equal(api.encodeKeyboardFrame({code:'Unidentified',keyCode:0,pressed:true},0,1),null);
  assert.equal(api.encodeKeyboardFrame({code:'KeyA',keyCode:0,pressed:1},0,1),null);
});

test('mouse encoder: writes signed relative movement, wheel deltas and button mask',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  const packet=api.encodeMouseFrame({X:-12,Y:345,WheelX:-120,WheelY:240,Buttons:5,Relative:0},7,33.25);
  assert.equal(packet.byteLength,33);
  const view=new DataView(packet);
  assert.equal(view.getUint16(0,true),32,'ReportTypes.Mouse');
  assert.equal(view.getUint32(2,true),7);
  assert.equal(view.getFloat64(6,true),33.25);
  assert.equal(view.getUint8(14),1,'one mouse frame');
  assert.equal(view.getInt32(15,true),-12);
  assert.equal(view.getInt32(19,true),345);
  assert.equal(view.getInt32(23,true),-120);
  assert.equal(view.getInt32(27,true),240);
  assert.equal(view.getUint8(31),5,'left and middle button bitmask');
  assert.equal(view.getUint8(32),0,'relative pointer mode');
});

test('mouse encoder: clamps integer fields and rejects invalid pointer mode',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  const packet=api.encodeMouseFrame({X:1e20,Y:-1e20,WheelX:NaN,WheelY:2.9,Buttons:999,Relative:1},8,34);
  const view=new DataView(packet);
  assert.equal(view.getInt32(15,true),2147483647);
  assert.equal(view.getInt32(19,true),-2147483648);
  assert.equal(view.getInt32(23,true),0);
  assert.equal(view.getInt32(27,true),2);
  assert.equal(view.getUint8(31),255);
  assert.equal(view.getUint8(32),1,'absolute pointer mode');
  assert.equal(api.encodeMouseFrame({X:0,Y:0,Relative:2},0,0),null);
});

test('xHome input: metadata sequence zero is followed by one shared keyboard, mouse and gamepad sequence',()=>{
  const {api,channels}=readyInputHarness();
  const metadata=remoteInputPackets(channels.input,8);
  assert.equal(metadata.length,1);
  assert.equal(new DataView(metadata[0]).getUint32(2,true),0);
  assert.equal(api.sendKeyboardFrame({code:'KeyA',keyCode:65,pressed:true},false),true);
  assert.equal(api.sendMouseFrame({X:1,Y:2,WheelX:0,WheelY:0,Buttons:0,Relative:0},false),true);
  api.tickGamepads([standardPad(0)],true);
  const reports=channels.input.sent.filter(data=>Object.prototype.toString.call(data)==='[object ArrayBuffer]' &&
    data.byteLength>=14 && [2,32,64].includes(new DataView(data).getUint16(0,true)));
  assert.deepEqual(reports.map(data=>new DataView(data).getUint32(2,true)),[1,2,3]);
});

test('xHome keyboard capture: sends trusted keydown and keyup once and preserves NX shortcuts',()=>{
  const {api,channels}=readyInputHarness();
  const video=fakeVideo(api);api.state.videoElement=video;
  const button={textContent:''},status={textContent:''};
  assert.equal(api.enableInput(video,button,status),true);
  assert.equal(video.controls,false);
  assert.equal(api.inputFocus(),true);
  const down=trustedEvent(video,{code:'KeyA',keyCode:65,repeat:false,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false});
  api.browser.window.dispatch('keydown',down);
  assert.equal(down.defaultPrevented,true);
  assert.deepEqual(Array.from(api.heldKeys()),['KeyA']);
  let packets=remoteInputPackets(channels.input,64);
  assert.equal(packets.length,1);
  let view=new DataView(packets[0]);
  assert.equal(view.getUint8(15),2);
  assert.equal(view.getUint8(16),1);
  assert.equal(view.getUint8(17),65);
  api.browser.window.dispatch('keydown',trustedEvent(video,{code:'KeyA',keyCode:65,repeat:true,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false}));
  assert.equal(remoteInputPackets(channels.input,64).length,1,'auto-repeat does not duplicate keydown');
  const shortcut=trustedEvent(video,{code:'Digit1',keyCode:49,repeat:false,ctrlKey:true,shiftKey:true,altKey:false,metaKey:false});
  api.browser.window.dispatch('keydown',shortcut);
  assert.equal(shortcut.immediatePropagationStopped,undefined,'Ctrl+Shift shortcuts remain available to NX');
  api.browser.window.dispatch('keyup',trustedEvent(video,{code:'KeyA',keyCode:65,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false}));
  packets=remoteInputPackets(channels.input,64);
  assert.equal(packets.length,2);
  assert.equal(new DataView(packets[1]).getUint8(16),0);
  assert.deepEqual(Array.from(api.heldKeys()),[]);
  api.disableInput(false);
  assert.equal(api.captureEnabled(),false);
  assert.equal(video.controls,true);
  assert.equal(api.browser.document.activeElement,video);
  assert.equal(button.textContent,'Ativar teclado/mouse');
});

test('xHome mouse capture: forwards relative movement, button transitions and wheel deltas',()=>{
  const {api,channels}=readyInputHarness();
  const video=fakeVideo(api);api.state.videoElement=video;
  assert.equal(api.enableInput(video),true);
  video.dispatch('pointermove',trustedEvent(video,{pointerType:'mouse',movementX:4,movementY:-3,buttons:0}));
  video.dispatch('pointerdown',trustedEvent(video,{pointerType:'mouse',movementX:0,movementY:0,buttons:1,button:0}));
  video.dispatch('wheel',trustedEvent(video,{deltaX:-2,deltaY:120,deltaMode:0}));
  video.dispatch('pointerup',trustedEvent(video,{pointerType:'mouse',movementX:0,movementY:0,buttons:0,button:0}));
  const packets=remoteInputPackets(channels.input,32);
  assert.equal(packets.length,4);
  let view=new DataView(packets[0]);
  assert.equal(view.getInt32(15,true),8);
  assert.equal(view.getInt32(19,true),-6);
  view=new DataView(packets[1]);
  assert.equal(view.getUint8(31),1);
  view=new DataView(packets[2]);
  assert.equal(view.getInt32(23,true),-2);
  assert.equal(view.getInt32(27,true),120);
  view=new DataView(packets[3]);
  assert.equal(view.getUint8(31),0);
  assert.equal(api.mouseButtons(),0);
});

test('xHome input capture: ignores touch pointers and synthetic keyboard events',()=>{
  const {api,channels}=readyInputHarness();
  const video=fakeVideo(api);api.state.videoElement=video;
  assert.equal(api.enableInput(video),true);
  const before=channels.input.sent.length;
  video.dispatch('pointermove',trustedEvent(video,{pointerType:'touch',movementX:50,movementY:50,buttons:1}));
  api.browser.window.dispatch('keydown',trustedEvent(video,{isTrusted:false,code:'KeyB',keyCode:66,repeat:false,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false}));
  assert.equal(channels.input.sent.length,before);
  assert.deepEqual(Array.from(api.heldKeys()),[]);
});

test('xHome input capture: blur releases held keys and mouse buttons and detaches listeners',()=>{
  const {api,channels}=readyInputHarness();
  const video=fakeVideo(api);api.state.videoElement=video;
  assert.equal(api.enableInput(video),true);
  api.browser.window.dispatch('keydown',trustedEvent(video,{code:'KeyB',keyCode:66,repeat:false,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false}));
  video.dispatch('pointerdown',trustedEvent(video,{pointerType:'mouse',movementX:0,movementY:0,buttons:1,button:0}));
  api.browser.window.dispatch('blur',{});
  assert.equal(api.captureEnabled(),false);
  assert.deepEqual(Array.from(api.heldKeys()),[]);
  assert.equal(api.mouseButtons(),0);
  assert.equal(video.controls,true);
  const keys=remoteInputPackets(channels.input,64);
  assert.equal(new DataView(keys.at(-1)).getUint8(16),0,'blur sends keyup');
  const mouse=remoteInputPackets(channels.input,32);
  assert.equal(new DataView(mouse.at(-1)).getUint8(31),0,'blur releases mouse buttons');
  assert.equal(api.browser.window.listenerCount('keydown'),0);
  assert.equal(video.listenerCount('pointermove'),0);
});

test('xHome input capture: Stop releases input before closing data channels',()=>{
  const {api,channels}=readyInputHarness();
  const video=fakeVideo(api);api.state.videoElement=video;
  assert.equal(api.enableInput(video),true);
  api.browser.window.dispatch('keydown',trustedEvent(video,{code:'KeyC',keyCode:67,repeat:false,ctrlKey:false,shiftKey:false,altKey:false,metaKey:false}));
  video.dispatch('pointerdown',trustedEvent(video,{pointerType:'mouse',movementX:0,movementY:0,buttons:1,button:0}));
  api.closeChannels();
  assert.equal(channels.input.readyState,'closed');
  assert.equal(api.captureEnabled(),false);
  assert.deepEqual(Array.from(api.heldKeys()),[]);
  assert.equal(api.mouseButtons(),0);
  const keys=remoteInputPackets(channels.input,64);
  assert.equal(new DataView(keys.at(-1)).getUint8(16),0,'keyup is sent before channel close');
  const mouse=remoteInputPackets(channels.input,32);
  assert.equal(new DataView(mouse.at(-1)).getUint8(31),0,'neutral mouse state is sent before channel close');
  assert.equal(api.browser.window.listenerCount('keydown'),0);
});

test('xHome gamepad routing: video focus grants input while the NX panel is open',()=>{
  const api=harness(async()=>{throw new Error('unexpected network');});
  const video=fakeVideo(api);api.state.videoElement=video;
  assert.equal(api.inputFocus(),false);
  api.browser.document.activeElement=video;
  assert.equal(api.inputFocus(),true);
  api.browser.document.activeElement=null;
  api.browser.document.pointerLockElement=video;
  assert.equal(api.inputFocus(),false,'xHome capture does not request or depend on pointer lock');
  api.browser.document.pointerLockElement=null;
  assert.equal(api.inputFocus(),false);
  assert.match(source,/const allowInput=!nxCapturePad && nxRemoteGamepadWindowFocused && \(!openUI \|\| remoteVideoFocused\);/);
  assert.match(source,/if \(remoteVideoFocused\) return;/);
  assert.match(source,/const fast=nxRemoteGamepadReady\(\) && \(!openUI \|\| nxRemoteVideoHasInputFocus\(\)\)/);
});


test('xHome touch adapter: attaches explicitly and forwards mouse and keyboard through the shared input sequence',()=>{
  const api=harness(async()=>ok({}));
  const sent=[];
  const channels={input:{readyState:'open',bufferedAmount:0,send(payload){sent.push(payload.slice(0));}},
    control:{readyState:'open',send(){}},message:{readyState:'open',send(){}},chat:{readyState:'open',send(){}}};
  const peer={connectionState:'connected'};
  api.state.peer=peer;api.state.sessionStatus='connected';api.state.dataChannelsReady=true;api.setChannels(channels);
  let attached=null;
  api.browser.window.NimboTouch={attachRemoteInputAdapter(adapter){attached=adapter;return true;},clearRemoteInputAdapter(adapter){adapter.dispose();return true;}};
  assert.equal(api.attachTouchAdapter(api.state.requestId,peer,channels),true);
  assert.ok(attached);
  assert.equal(attached.isReady(),true);
  assert.equal(attached.sendKey('KeyW',true),true);
  assert.equal(attached.sendMouse({Type:0,X:14,Y:-7,WheelX:0,WheelY:0,Buttons:1}),true);
  assert.equal(attached.sendKey('KeyW',false),true);
  assert.equal(sent.length,3);
  const packets=sent.map(buffer=>new DataView(buffer));
  assert.deepEqual(packets.map(view=>view.getUint16(0,true)),[64,32,64]);
  assert.deepEqual(packets.map(view=>view.getUint32(2,true)),[1,2,3]);
  assert.equal(packets[0].getUint8(15),2);
  assert.equal(packets[0].getUint8(16),1);
  assert.equal(packets[0].getUint8(17),0x57);
  assert.equal(packets[1].getInt32(15,true),14);
  assert.equal(packets[1].getInt32(19,true),-7);
  assert.equal(packets[1].getUint8(31),1);
  assert.equal(packets[2].getUint8(16),0);
});

test('xHome touch adapter: release sends key-up and neutral mouse before adapter disposal',()=>{
  const api=harness(async()=>ok({}));
  const sent=[];
  const channels={input:{readyState:'open',bufferedAmount:0,send(payload){sent.push(payload.slice(0));}},
    control:{readyState:'open',send(){}},message:{readyState:'open',send(){}},chat:{readyState:'open',send(){}}};
  const peer={connectionState:'connected'};
  api.state.peer=peer;api.state.sessionStatus='connected';api.state.dataChannelsReady=true;api.setChannels(channels);
  const adapter=api.createTouchAdapter(api.state.requestId,peer,channels);
  assert.equal(adapter.sendKey('Space',true),true);
  assert.equal(adapter.sendMouse({Type:0,X:0,Y:0,WheelX:0,WheelY:0,Buttons:3}),true);
  assert.equal(adapter.release(),true);
  const packets=sent.map(buffer=>new DataView(buffer));
  assert.deepEqual(packets.map(view=>view.getUint16(0,true)),[64,32,64,32]);
  assert.equal(packets[2].getUint8(16),0);
  assert.equal(packets[3].getUint8(31),0);
  assert.equal(adapter.dispose(),true);
  assert.equal(adapter.isReady(),false);
});

test('xHome touch adapter: backpressure and stale sessions reject new touch input',()=>{
  const api=harness(async()=>ok({}));
  const sent=[];
  const input={readyState:'open',bufferedAmount:5000,send(payload){sent.push(payload.slice(0));}};
  const channels={input,control:{readyState:'open',send(){}},message:{readyState:'open',send(){}},chat:{readyState:'open',send(){}}};
  const peer={connectionState:'connected'};
  api.state.peer=peer;api.state.sessionStatus='connected';api.state.dataChannelsReady=true;api.setChannels(channels);
  const adapter=api.createTouchAdapter(api.state.requestId,peer,channels);
  assert.equal(adapter.sendKey('KeyA',true),false);
  assert.equal(sent.length,0);
  input.bufferedAmount=0;
  assert.equal(adapter.sendKey('KeyA',true),true);
  api.state.requestId++;
  assert.equal(adapter.isReady(),false);
  assert.equal(adapter.sendMouse({Type:0,X:1,Y:1,WheelX:0,WheelY:0,Buttons:0}),false);
  assert.equal(sent.length,1);
  assert.equal(adapter.dispose(),true);
  assert.equal(sent.length,2);
  assert.equal(new DataView(sent[1]).getUint8(16),0);
});


test('reconnect: Stop releases the old xHome session before Start and ignores late peer callbacks',async()=>{
  const calls=[],peers=[];
  class FakeChannel{
    constructor(label,options){this.label=label;this.protocol=options.protocol;this.ordered=options.ordered;this.readyState='open';this.sent=[];}
    send(data){this.sent.push(data);}
    close(){this.readyState='closed';}
  }
  class FakePeer{
    constructor(){this.channels={};this.connectionState='new';this.signalingState='stable';this.remoteCandidates=[];this.closed=false;peers.push(this);}
    createDataChannel(label,options){const channel=new FakeChannel(label,options);this.channels[label]=channel;return channel;}
    addTransceiver(){}
    async createOffer(){return {type:'offer',sdp:'v=0'};}
    async setLocalDescription(value){this.localDescription=value;}
    async setRemoteDescription(value){this.remoteDescription=value;}
    async addIceCandidate(value){this.remoteCandidates.push(value);}
    close(){this.closed=true;this.connectionState='closed';this.signalingState='closed';}
  }
  class FakeMediaStream{
    constructor(){this.tracks=[];}
    getTracks(){return this.tracks.slice();}
    addTrack(track){this.tracks.push(track);}
  }
  const sessionIds=[
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  ];
  let sessionIndex=0;
  const api=harness(async(url,opts)=>{
    const method=opts&&opts.method||'GET';
    calls.push({url,opts:opts||{}});
    if(url.endsWith('/v2/login/user'))return ok(login);
    if(url.endsWith('/v5/sessions/home/play'))return ok({sessionId:sessionIds[sessionIndex++]});
    if(url.endsWith('/state'))return ok({state:'Provisioned'});
    if(url.endsWith('/sdp')&&method==='POST')return {ok:true,status:204};
    if(url.endsWith('/sdp')&&method==='GET')return ok({exchangeResponse:JSON.stringify({sdpType:'answer',sdp:'v=0'})});
    if(url.endsWith('/ice')&&method==='GET')return ok({candidates:[]});
    if(method==='DELETE')return {ok:true,status:204};
    throw new Error('unexpected request '+method+' '+url);
  },null,FakePeer,null,FakeMediaStream);
  api.state.consoles=[{id:'console-1'}];
  api.state.selectedId='console-1';
  api.state.regionShortName='wus';
  const video=fakeVideo(api);
  api.state.videoElement=video;

  await api.startSession();
  const oldPeer=peers[0],oldChannels=api.channels(),oldStream=api.state.mediaStream;
  const oldRequestId=api.state.requestId,oldSessionId=api.state.sessionId;
  assert.equal(oldSessionId,sessionIds[0]);
  assert.ok(oldStream);
  for(const name of ['chat','control','input','message'])oldChannels[name].onopen();
  oldChannels.message.onmessage({data:JSON.stringify({type:'HandshakeAck'})});
  oldPeer.connectionState='connected';
  oldPeer.onconnectionstatechange();
  assert.equal(api.state.sessionStatus,'connected');
  const oldAdapter=api.createTouchAdapter(oldRequestId,oldPeer,oldChannels);
  assert.ok(oldAdapter);
  assert.equal(oldAdapter.sendKey('KeyW',true),true);

  const oldTrack=fakeTrack('old-video','video');
  oldPeer.ontrack({streams:[{getTracks(){return [oldTrack];}}],track:oldTrack});
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(oldStream.getTracks(),[oldTrack]);
  assert.equal(video.srcObject,oldStream);

  await api.stop();
  assert.equal(oldPeer.closed,true);
  assert.equal(oldTrack.readyState,'ended');
  assert.equal(api.state.sessionStatus,'stopped');
  assert.equal(api.state.peer,null);
  assert.equal(api.state.mediaStream,null);
  assert.equal(api.state.dataChannelsReady,false);
  assert.ok(Object.values(oldChannels).every(channel=>channel.readyState==='closed'));
  assert.equal(oldAdapter.sendKey('KeyW',false),false,'an adapter from the stopped session cannot send input');

  const deleteIndex=calls.findIndex(call=>call.opts.method==='DELETE');
  assert.ok(deleteIndex>=0,'the old session must be released remotely');
  const stoppedRequestId=api.state.requestId;
  await api.startSession();

  const newPeer=peers[1],newChannels=api.channels(),newStream=api.state.mediaStream;
  const newRequestId=api.state.requestId,newSessionId=api.state.sessionId;
  assert.ok(newRequestId>oldRequestId);
  assert.ok(newRequestId>stoppedRequestId);
  assert.equal(newSessionId,sessionIds[1]);
  assert.ok(newPeer&&newPeer!==oldPeer);
  assert.ok(newStream&&newStream!==oldStream);
  const secondPlayIndex=calls.findIndex((call,index)=>index>deleteIndex&&call.url.endsWith('/v5/sessions/home/play')&&call.opts.method==='POST');
  assert.ok(secondPlayIndex>deleteIndex,'the new session POST must happen only after the old DELETE completes');

  for(const name of ['chat','control','input','message'])newChannels[name].onopen();
  newChannels.message.onmessage({data:JSON.stringify({type:'HandshakeAck'})});
  newPeer.connectionState='connected';
  newPeer.onconnectionstatechange();
  assert.equal(api.state.sessionStatus,'connected');
  const newTrack=fakeTrack('new-video','video');
  newPeer.ontrack({streams:[{getTracks(){return [newTrack];}}],track:newTrack});
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(api.state.mediaDiagnostics.playbackState,'playing');
  assert.deepEqual(newStream.getTracks(),[newTrack]);
  assert.equal(video.srcObject,newStream);
  const activeStatus=api.state.status;
  const activeDiagnostics=JSON.stringify(api.state.mediaDiagnostics);
  const callsBeforeStaleCallbacks=calls.length;

  const lateTrack=fakeTrack('late-old-video','video');
  oldPeer.ontrack({streams:[{getTracks(){return [lateTrack];}}],track:lateTrack});
  oldPeer.onicecandidate({candidate:{candidate:'candidate:stale 1 udp 1 127.0.0.1 9999 typ host',sdpMid:'0',sdpMLineIndex:0}});
  oldPeer.connectionState='failed';
  oldPeer.onconnectionstatechange();
  oldChannels.input.onclose();
  oldChannels.message.onmessage({data:JSON.stringify({type:'HandshakeAck'})});

  assert.equal(oldAdapter.sendKey('KeyW',true),false);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls.length,callsBeforeStaleCallbacks,'late ICE from the old peer must not reach the server');
  assert.equal(api.state.requestId,newRequestId);
  assert.equal(api.state.peer,newPeer);
  assert.equal(api.state.sessionId,newSessionId);
  assert.equal(api.state.sessionStatus,'connected');
  assert.equal(api.state.status,activeStatus);
  assert.equal(api.state.mediaStream,newStream);
  assert.deepEqual(newStream.getTracks(),[newTrack]);
  assert.equal(newTrack.readyState,'live');
  assert.equal(lateTrack.readyState,'live','a stale ontrack callback must not attach or stop its track');
  assert.equal(api.state.mediaDiagnostics.videoTracks,1);
  assert.equal(JSON.stringify(api.state.mediaDiagnostics),activeDiagnostics);
  assert.ok(!JSON.stringify(api.state).includes('TEST_BEARER'));
  assert.ok(!JSON.stringify(api.state).includes('TEST_GSSV'));

  await api.stop();
});
