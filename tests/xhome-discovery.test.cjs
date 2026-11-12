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
const code = source.slice(start, end) + '\n globalThis.api={state:nxRemotePlay,discover:nxRemoteDiscover,cancel:nxRemoteCancel,stop:nxRemoteStop,retryRelease:nxRemoteRetryRelease,startSession:nxRemoteStartSession};';
function harness(fetchImpl, storageOverride, rtcClass, timerOverrides) {
  const ctx = {
    AbortController, URL, Date,
    setTimeout:timerOverrides&&timerOverrides.setTimeout||setTimeout,
    clearTimeout:timerOverrides&&timerOverrides.clearTimeout||clearTimeout,
    fetch: fetchImpl, tabId: 'other', renderBody() {}, navigator:{language:'pt-BR'},
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
