import test from 'node:test';
import assert from 'node:assert/strict';
import {readSources,harness,inspect} from './probe.mjs';
if(!process.env.TIZEN_SOURCES)throw Error('Defina TIZEN_SOURCES para snapshots públicos fixados.');
const sources=readSources(process.env.TIZEN_SOURCES);
test('configuração e construtor reais declaram oferta web, browser e sdk web',async()=>{
 const report=await inspect(sources);assert.equal(report.configuredOffering,'xgpuweb');
 for(const item of report.cases){assert.equal(item.declaredAppType,'browser');assert.equal(item.declaredSdk,'web');assert.equal(item.sessionSdk,'web');}
});
test('perfil de mídia Android não altera descritor Windows no construtor real',async()=>{
 const report=await inspect(sources),android=report.cases.find(x=>x.requestedOs==='android');assert.equal(android.declaredOs,'windows');assert.equal(android.osFieldsEqual,false);
 assert.equal(report.cases[0].osFieldsEqual,true);assert.equal(report.serverClientClassification,'not-observed');
});
test('resposta sintética rejeitada pelo serviço não é convertida em sessão criada',async()=>{
 const h=harness(sources,{ok:false,status:403,json:{}});
 await assert.rejects(h.api.play({baseUri:'https://example.invalid'},'SYNTHETIC_UNUSABLE_TOKEN','synthetic-title'),e=>e.status===403);
 assert.equal(h.calls.length,1);
});
test('HTTP 200 sem sessionPath também falha no construtor original',async()=>{
 const h=harness(sources,{ok:true,status:200,json:{}});
 await assert.rejects(h.api.play({baseUri:'https://example.invalid'},'SYNTHETIC_UNUSABLE_TOKEN','synthetic-title'),/play HTTP 200/);
});
test('permissões declaradas do widget e relatório não viram validação CORS/identidade nem expõem token',async()=>{
 const report=await inspect(sources);assert.equal(report.widgetPolicyDeclared.externalAccess,true);assert.equal(report.widgetPolicyDeclared.internetPrivilege,true);
 assert.equal(report.browserCorsValidated,false);assert.equal(report.networkExecuted,false);assert.equal(report.gameplayValidated,false);
 assert.doesNotMatch(JSON.stringify(report),/SYNTHETIC_UNUSABLE_TOKEN|Authorization|synthetic-title|synthetic-session/);
});
