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
const code = source.slice(start, end) + '\n globalThis.api={state:nxRemotePlay,discover:nxRemoteDiscover,cancel:nxRemoteCancel,startSession:nxRemoteStartSession};';
function harness(fetchImpl, storageOverride) {
  const ctx = {
    AbortController, URL, Date, setTimeout, clearTimeout,
    fetch: fetchImpl, tabId: 'other', renderBody() {}, navigator:{language:'pt-BR'},
    localStorage: {
      getItem(k) { return k === 'xboxcom_xbl_user_info' ? JSON.stringify({tokens:{'http://gssv.xboxlive.com/':{token:'TEST_GSSV'}}}) : null; },
      get length() { return 0; }
    }
  };
  if(storageOverride) ctx.localStorage=storageOverride;
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
    return ok({sessionId:'12345678-1234-1234-1234-123456789abc',state:'Provisioning'});
  });
  api.state.consoles=[{id:'console-1',name:'Xbox'}];
  api.state.selectedId='console-1';
  api.state.regionShortName='wus';
  await api.startSession();
  assert.equal(calls.length,2);
  assert.match(calls[1].url,/^https:\/\/wus\.core\.gssv-play-prodxhome\.xboxlive\.com\/v5\/sessions\/home\/play$/);
  assert.equal(JSON.parse(calls[1].opts.body).serverId,'console-1');
  assert.equal(calls[1].opts.redirect,'error');
  assert.equal(api.state.sessionStatus,'created');
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
