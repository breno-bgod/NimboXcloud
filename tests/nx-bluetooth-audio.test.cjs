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

test('Audio analyser samples the stream before the EQ chain and reports RMS state',()=>{
 assert.match(s,/source\.connect\(analyser\);\s*let prev = analyser;/);
 assert.match(s,/g\.analyser\.getByteTimeDomainData\(samples\)/);
 assert.match(s,/rms>0\.002\?'detectado':'nao detectado\/silencio'/);
 assert.match(s,/const analyser=ctx\.createAnalyser\(\);analyser\.fftSize=1024/);
});

test('EQ includes ten bands and explicit AudioContext activation',()=>{
 assert.match(s,/\[32,64,125,250,500,1000,2000,4000,8000,16000\]/);
 assert.match(s,/actBtn\('Ativar processamento'/);
});
