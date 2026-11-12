// tests/xhome-discovery.test.cjs — run: node --test tests/xhome-discovery.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
const start = source.indexOf('const nxRemotePlay =');
const end = source.indexOf('  const TAB_BUILDERS =', start);
assert.ok(start >= 0 && end > start, 'xHome discovery section found');
const code = source.slice(start, end) + '\n globalThis.api={state:nxRemotePlay,discover:nxRemoteDiscover,cancel:nxRemoteCancel,stop:nxRemoteStop,retryRelease:nxRemoteRetryRelease,startSession:nxRemoteStartSession,channels:function(){return nxRemoteChannels;},initChannels:nxRemoteInitDataChannels,encodeGamepadFrame:nxRemoteEncodeGamepadFrame,encodeKeyboardFrame:nxRemoteEncodeKeyboardFrame,encodeMouseFrame:nxRemoteEncodeMouseFrame,virtualKey:nxRemoteVirtualKey,setGamepadSlot:nxRemoteSetGamepadSlot,registeredSlots:function(){return Array.from(nxRemoteRegisteredGamepadSlots);},gamepadSlots:function(){return Array.from(nxRemoteGamepadIndexSlots.entries());},mkbSlot:function(){return nxRemoteMkbSlot;},pressedKeys:function(){return Array.from(nxRemotePressedKeys.entries());},mouseButtons:function(){return nxRemoteMouseButtons;},inputSequence:function(){return nxRemoteInputSequence;},enableKeyboardMouse:nxRemoteKeyboardMouseEnable,disableKeyboardMouse:nxRemoteKeyboardMouseDisable,dispatchKey:nxRemoteKeyboardMouseDispatchKey,dispatchPointer:nxRemoteKeyboardMouseDispatchPointer,dispatchWheel:nxRemoteKeyboardMouseDispatchWheel,shouldForwardGamepad:nxRemoteShouldForwardGamepad,setDocumentState:function(active,locked,visibility){document.activeElement=active;document.pointerLockElement=locked;document.visibilityState=visibility||\"visible\";},setTouch:function(value){window.NimboTouch=value;},setWindowFocus:function(value){nxRemoteGamepadWindowFocused=!!value;},closeChannels:nxRemoteCloseDataChannels,tickGamepads:nxRemoteGamepadTick,suspendGamepads:nxRemoteGamepadSuspend,ready:nxRemoteGamepadReady};';
function harness(fetchImpl, storageOverride, rtcClass, timerOverrides) {
  let timerId=0;
  const fakeTimers=new Map();
  const browserSetTimeout=(fn,ms)=>{const id=++timerId;fakeTimers.set(id,{fn,ms});return id;};
  const browserClearTimeout=(id)=>fakeTimers.delete(id);
  const ctx = {
    AbortController, URL, Date,
    setTimeout:timerOverrides&&timerOverrides.setTimeout||browserSetTimeout,
    clearTimeout:timerOverrides&&timerOverrides.clearTimeout||browserClearTimeout,
    fetch: fetchImpl, tabId: 'remote', openUI:true, renderBody() {}, window:{NimboTouch:null},
    document:{visibilityState:'visible',activeElement:null,pointerLockElement:null},
    navigator:{language:'pt-BR'},
    localStorage: {
      getItem(k) { return k === 'xboxcom_xbl_user_info' ? JSON.stringify({tokens:{'http://gssv.xboxlive.com/':{token:'TEST_GSSV'}}}) : null; },
      get length() { return 0; }
    }
  };
  if(storageOverride) ctx.localStorage=storageOverride;
  if(rtcClass) ctx.RTCPeerConnection=rtcClass;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.api;
}
const ok = (value) => ({ok:true,status:200,json:async()=>value});
const login = {gsToken:'TEST_BEARER',offeringSettings:{regions:[{name:'test',isDefault:true,baseUri:'https://wus.xboxlive.com'}]}};
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
  await api.startSession();
  assert.equal(calls.length,3);
  assert.match(calls[1].url,/^https:\/\/wus\.core\.gssv-play-prodxhome\.xboxlive\.com\/v5\/sessions\/home\/play$/);
  assert.equal(JSON.parse(calls[1].opts.body).serverId,'console-1');
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
function xhomePackets(channel) {
  return channel.sent.filter(data=>Object.prototype.toString.call(data)==='[object ArrayBuffer]');
}
function attachRemoteVideo(api) {
  const video={isConnected:true,videoWidth:1920,videoHeight:1080,clientHeight:540,
    focus(){api.setDocumentState(video,null,'visible');},
    getBoundingClientRect(){return {left:100,top:50,width:960,height:540};},
    setPointerCapture(){},requestPointerLock(){return undefined;}};
  api.state.videoElement=video;api.setDocumentState(video,null,'visible');return video;
}
function inputEvent(extra) {
  return Object.assign({isTrusted:true,prevented:false,stopped:false,
    preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}},extra||{});
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


test('xHome input sequence: metadata reserves zero and all report types share one monotonic sequence',()=>{
 const {api,channels}=readyInputHarness();assert.equal(api.inputSequence(),1);
 const video=attachRemoteVideo(api);assert.equal(api.enableKeyboardMouse(),true);
 api.dispatchKey(inputEvent({target:video,code:'KeyA',keyCode:65}),true);
 let p=xhomePackets(channels.input).at(-1);assert.equal(new DataView(p).getUint16(0,true),64);assert.equal(new DataView(p).getUint32(2,true),1);
 api.tickGamepads([standardPad(0)],true);p=xhomeFrames(channels.input).at(-1);assert.equal(new DataView(p).getUint32(2,true),2);
 api.dispatchKey(inputEvent({target:video,code:'KeyA',keyCode:65}),false);
 assert.equal(new DataView(xhomePackets(channels.input).at(-1)).getUint32(2,true),3);
});

test('xHome keyboard dispatcher: tracks simultaneous keys, ignores repeats and releases all on disable',()=>{
 const {api,channels}=readyInputHarness(),video=attachRemoteVideo(api);assert.equal(api.enableKeyboardMouse(),true);
 assert.equal(api.dispatchKey(inputEvent({target:video,code:'KeyA',keyCode:65}),true),true);
 assert.equal(api.dispatchKey(inputEvent({target:video,code:'ShiftLeft',keyCode:16}),true),true);
 assert.equal(api.dispatchKey(inputEvent({target:video,code:'KeyA',keyCode:65,repeat:true}),true),true);
 assert.equal(api.pressedKeys().length,2);
 assert.equal(xhomePackets(channels.input).filter(p=>new DataView(p).getUint16(0,true)===64).length,2);
 assert.equal(api.disableKeyboardMouse('teste'),true);
 const packets=xhomePackets(channels.input).filter(p=>new DataView(p).getUint16(0,true)===64);
 assert.equal(packets.length,4);assert.equal(new DataView(packets[2]).getUint8(16),0);assert.equal(new DataView(packets[3]).getUint8(16),0);
 assert.equal(api.pressedKeys().length,0);assert.equal(api.mkbSlot(),null);
 const changes=gamepadEvents(channels.control);assert.equal(changes.filter(e=>e.wasAdded===true).length,1);assert.equal(changes.filter(e=>e.wasAdded===false).length,1);
});

test('xHome keyboard dispatcher: requires focused trusted video events and preserves browser-reserved shortcuts',()=>{
 const {api,channels}=readyInputHarness(),video=attachRemoteVideo(api);assert.equal(api.enableKeyboardMouse(),true);
 api.setDocumentState(null,null,'visible');
 const unfocused=inputEvent({target:{},code:'KeyW',keyCode:87});assert.equal(api.dispatchKey(unfocused,true),false);assert.equal(unfocused.prevented,false);
 api.setDocumentState(video,null,'visible');
 assert.equal(api.dispatchKey(inputEvent({target:video,code:'KeyW',keyCode:87,isTrusted:false}),true),false);
 assert.equal(api.dispatchKey(inputEvent({target:video,code:'Escape',keyCode:27}),true),false);
 assert.equal(xhomePackets(channels.input).length,0);
});

test('xHome keyboard/mouse capture: refuses to compete with enabled NimboTouch',()=>{
 const {api,channels}=readyInputHarness();attachRemoteVideo(api);api.setTouch({isEnabled:()=>true,diagnostic:()=>({active:true})});
 assert.equal(api.enableKeyboardMouse(),false);assert.equal(api.state.keyboardMouseEnabled,false);
 assert.match(api.state.keyboardMouseStatus,/NimboTouch/);
 assert.equal(gamepadEvents(channels.control).filter(e=>e.wasAdded===true).length,0);assert.equal(xhomePackets(channels.input).length,0);
});

test('xHome mouse dispatcher: absolute coordinates, relative Pointer Lock, wheel and button release are ordered',()=>{
 const {api,channels}=readyInputHarness(),video=attachRemoteVideo(api);assert.equal(api.enableKeyboardMouse(),true);
 const down=inputEvent({target:video,pointerType:'mouse',pointerId:7,button:0,buttons:1,clientX:580,clientY:320});
 assert.equal(api.dispatchPointer(down,'down'),true);assert.equal(down.prevented,true);assert.equal(api.mouseButtons(),1);
 let p=new DataView(xhomePackets(channels.input).at(-1));
 assert.equal(p.getUint16(0,true),32);assert.equal(p.getInt32(15,true),960);assert.equal(p.getInt32(19,true),540);assert.equal(p.getUint8(32),1);
 api.setDocumentState(video,video,'visible');
 assert.equal(api.dispatchPointer(inputEvent({target:video,pointerType:'mouse',pointerId:7,buttons:1,movementX:4,movementY:-3}),'move'),true);
 p=new DataView(xhomePackets(channels.input).at(-1));assert.equal(p.getInt32(15,true),8);assert.equal(p.getInt32(19,true),-6);assert.equal(p.getUint8(32),0);
 assert.equal(api.dispatchWheel(inputEvent({target:video,deltaX:1,deltaY:2,deltaMode:1,clientX:580,clientY:320})),true);
 p=new DataView(xhomePackets(channels.input).at(-1));assert.equal(p.getInt32(23,true),16);assert.equal(p.getInt32(27,true),32);
 assert.equal(api.dispatchPointer(inputEvent({target:video,pointerType:'mouse',pointerId:7,button:0,buttons:0,movementX:0,movementY:0}),'up'),true);
 assert.equal(api.mouseButtons(),0);assert.equal(new DataView(xhomePackets(channels.input).at(-1)).getUint8(31),0);
 assert.equal(api.disableKeyboardMouse('teste'),true);
});

test('xHome cleanup: blur-style teardown releases keys and mouse buttons before unregistering the slot',()=>{
 const {api,channels,events}=readyInputHarness(),video=attachRemoteVideo(api);assert.equal(api.enableKeyboardMouse(),true);
 api.dispatchKey(inputEvent({target:video,code:'KeyW',keyCode:87}),true);
 api.dispatchPointer(inputEvent({target:video,pointerType:'mouse',pointerId:4,buttons:1,clientX:200,clientY:150}),'down');
 assert.equal(api.disableKeyboardMouse('blur'),true);
 const keyUps=xhomePackets(channels.input).filter(p=>new DataView(p).getUint16(0,true)===64&&new DataView(p).getUint8(16)===0);
 const mouseFrames=xhomePackets(channels.input).filter(p=>new DataView(p).getUint16(0,true)===32);
 assert.equal(keyUps.length,1);assert.equal(new DataView(mouseFrames.at(-1)).getUint8(31),0);
 const releaseIndex=events.findLastIndex(e=>e.channel==='control'&&typeof e.data==='string'&&JSON.parse(e.data).wasAdded===false);
 const lastNeutralIndex=events.findLastIndex(e=>e.channel==='input'&&e.data instanceof ArrayBuffer&&e.data.byteLength===33);
 assert.ok(lastNeutralIndex>=0&&releaseIndex>lastNeutralIndex);
});

test('xHome gamepad allocator: preserves free physical indices and avoids the reserved keyboard/mouse slot',()=>{
 const {api}=readyInputHarness();attachRemoteVideo(api);assert.equal(api.enableKeyboardMouse(),true);assert.equal(api.mkbSlot(),0);
 api.tickGamepads([standardPad(0),standardPad(2)],true);assert.deepEqual(Array.from(api.registeredSlots()).sort(),[1,2]);
 const slots=()=>Array.from(api.gamepadSlots(),entry=>Array.from(entry)).sort((a,b)=>a[0]-b[0]);
 assert.deepEqual(slots(),[[0,1],[2,2]]);api.tickGamepads([standardPad(0),standardPad(2)],true);assert.deepEqual(slots(),[[0,1],[2,2]]);
 assert.equal(api.disableKeyboardMouse('teste'),true);
});

test('xHome gamepad routing: input is forwarded only while Remote Play is visible and focused',()=>{
 const {api}=readyInputHarness();
 assert.equal(api.shouldForwardGamepad(false,false,false,true),false);
 assert.equal(api.shouldForwardGamepad(true,false,false,true),false);
 assert.equal(api.shouldForwardGamepad(true,true,false,true),true);
 assert.equal(api.shouldForwardGamepad(true,true,true,true),false);
 assert.equal(api.shouldForwardGamepad(true,true,false,false),false);
});
