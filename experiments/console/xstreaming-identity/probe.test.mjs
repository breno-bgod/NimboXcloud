import test from 'node:test';
import assert from 'node:assert/strict';
import {readSources,inspect,payloadFrom} from './probe.mjs';
if(!process.env.XSTREAMING_SOURCES)throw Error('Defina XSTREAMING_SOURCES para os snapshots públicos fixados.');
const [xal,msal]=readSources(process.env.XSTREAMING_SOURCES);
test('objeto XSTS legado real não encaminha DeviceToken e TitleToken fornecidos na fixture',()=>{
 const report=inspect(xal,msal);assert.equal(report.legacy.deviceTokenPresent,false);assert.equal(report.legacy.titleTokenPresent,false);
 assert.deepEqual(report.legacy.propertyNames,['SandboxId','UserTokens']);assert.equal(report.legacy.userTokenCount,1);
});
test('caminho MSAL também constrói XSTS com usuário sem identidade de dispositivo/título explícita',()=>{
 const report=inspect(xal,msal);assert.equal(report.msal.deviceTokenPresent,false);assert.equal(report.msal.titleTokenPresent,false);assert.equal(report.msal.userTokenCount,1);
});
test('requisição local de dispositivo declara Android e relatório não expõe valores de tokens',()=>{
 const report=inspect(xal,msal);assert.equal(report.deviceTypeDeclared,'Android');assert.equal(report.networkExecuted,false);assert.equal(report.serverConsoleRecognitionValidated,false);
 assert.doesNotMatch(JSON.stringify(report),/SYNTHETIC_USER|SYNTHETIC_DEVICE|SYNTHETIC_TITLE|synthetic-x/);
});
test('controle de sensibilidade: propriedades passam a ser detectadas quando comentários são ativados apenas na cópia local',()=>{
 const modified=xal.replace('// DeviceToken: sisuToken.data.DeviceToken,','DeviceToken: sisuToken.data.DeviceToken,').replace('// TitleToken: sisuToken.data.TitleToken.Token,','TitleToken: sisuToken.data.TitleToken.Token,');
 const report=inspect(modified,msal);assert.equal(report.legacy.deviceTokenPresent,true);assert.equal(report.legacy.titleTokenPresent,true);
});
test('snapshot sem método esperado falha explicitamente',()=>{
 assert.throws(()=>payloadFrom('','  doXstsAuthorization(','const body =',{}),/Estrutura/);
});
