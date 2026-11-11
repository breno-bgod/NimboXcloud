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
const code = source.slice(start, end) + '\n globalThis.api={state:nxRemotePlay,discover:nxRemoteDiscover,cancel:nxRemoteCancel};';
function harness(fetchImpl) {
  const ctx = {
    AbortController, URL, Date, setTimeout, clearTimeout,
    fetch: fetchImpl, tabId: 'other', renderBody() {},
    localStorage: {
      getItem(k) { return k === 'xboxcom_xbl_user_info' ? JSON.stringify({tokens:{'http://gssv.xboxlive.com/':{token:'TEST_GSSV'}}}) : null; },
      get length() { return 0; }
    }
  };
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
