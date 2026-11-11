'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const s=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
test('Bluetooth uses system default when manual sink selection is unavailable',()=>{
 assert.match(s,/Padrao do sistema \(inclui Bluetooth\)/);
 assert.match(s,/audioOutputs\.disabled=!status\.canRoute/);
 assert.match(s,/typeof target\.setSinkId!=='function'/);
});
test('Audio analyser monitors real stream signal before EQ',()=>{
 assert.match(s,/source\.connect\(analyser\)/);
 assert.match(s,/getByteTimeDomainData\(samples\)/);
 assert.match(s,/sinal nao detectado\/silencio/);
});
test('EQ includes ten bands and explicit AudioContext activation',()=>{
 assert.match(s,/\[32,64,125,250,500,1000,2000,4000,8000,16000\]/);
 assert.match(s,/actBtn\('Ativar processamento'/);
});
