'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
if(!process.env.NX_IDENTITY_SOURCE)throw Error('Defina NX_IDENTITY_SOURCE para o snapshot público do userscript indicado no README.');
const source=fs.readFileSync(process.env.NX_IDENTITY_SOURCE,'utf8');
function part(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,'símbolos esperados ausentes; revisar snapshot');return source.slice(a,b);}
function patchContext(osName){
 const ctx={Request,Headers,URL,location:{href:'https://play.xbox.com/'},resCfg:()=>({osName,label:'research-profile'}),
  nxProfileSessionState:{attempted:0,patched:0},nxConsoleLabProfile:'off',S:{playPatched:0},inspectInputNegotiation(){},addCap(){},nowStr:()=>''};
 vm.createContext(ctx);vm.runInContext(part('  function patchPlayRequest(input, init) {','  // Preparação observada:'),ctx);return ctx;
}
test('patch real altera perfil de mídia sem substituir o descritor de dispositivo ou entradas',async()=>{
 const device=JSON.stringify({appInfo:{env:{clientAppType:'browser',clientAppId:'play.xbox.com'}},dev:{os:{name:'android'},hw:{sdktype:'web'}}});
 const body={titleId:'synthetic-title',settings:{sdkType:'web',osName:'android',inputConfiguration:{enableTouchInput:true}}};
 for(const os of ['windows','tizen']){
  const ctx=patchContext(os),init={method:'POST',headers:{'X-MS-Device-Info':device,'X-Research-Marker':'unchanged'},body:JSON.stringify(body)};
  const result=await ctx.patchPlayRequest('https://example.invalid/v5/sessions/cloud/play',init);
  const parsed=JSON.parse(result.init.body);
  assert.equal(parsed.settings.osName,os);assert.equal(parsed.settings.sdkType,'web');
  assert.deepEqual(parsed.settings.inputConfiguration,body.settings.inputConfiguration);
  assert.equal(result.init.headers.get('X-MS-Device-Info'),device);assert.equal(result.init.headers.get('X-Research-Marker'),'unchanged');
  assert.equal(JSON.parse(init.body).settings.osName,'android');
 }
});
test('requisição abortada não é reconstruída pelo patch de qualidade',async()=>{
 const controller=new AbortController();controller.abort();
 const ctx=patchContext('windows'),init={method:'POST',signal:controller.signal,body:'{}'};
 const result=await ctx.patchPlayRequest('https://example.invalid/play',init);
 assert.equal(result.init,init);assert.equal(ctx.nxProfileSessionState.patched,0);
});
test('preferências históricas Xbox são desativadas e não ativam identidade console',()=>{
 for(const saved of ['xbox','xboxone','xboxseries','off']){
  let stored=saved;const ctx={LS_CONSOLE_LAB:'synthetic-key',localStorage:{getItem:()=>stored,setItem:(_,v)=>stored=v}};
  vm.createContext(ctx);vm.runInContext(part('  const nxConsoleLabProfile =','  const nxConsoleLabState')+'\nglobalThis.result=nxConsoleLabProfile;',ctx);
  assert.equal(ctx.result,'off');assert.equal(stored,'off');
 }
});
test('descritor xHome do Nimbo declara browser/web nos três perfis de mídia',()=>{
 const ctx={window:{location:{host:'play.xbox.com'}}};vm.createContext(ctx);
 vm.runInContext(part('  function nxRemoteResolutionProfile(resolution) {','  async function nxRemoteStartSession() {'),ctx);
 for(const quality of ['720p','1080p','1080p-hq']){
  const info=ctx.nxRemoteBuildDeviceInfo(quality);
  assert.equal(info.appInfo.env.clientAppType,'browser');assert.equal(info.dev.hw.sdktype,'web');assert.equal(info.dev.hw.model,'unknown');
 }
});
