'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const s=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
test('audio source prefers live audio tracks',()=>{
 assert.match(s,/getAudioTracks\(\)\.some\(function\(t\)\{return t\.readyState==='live';\}\)/);
 assert.match(s,/const playable=candidates\.filter/);
});
test('audio context can be resumed by direct user action',()=>{
 assert.match(s,/actBtn\('Ativar processamento',function\(\)/);
 assert.match(s,/nxAudioGraph\.ctx\.resume\(\)/);
 assert.match(s,/AudioContext\.resume/);
});
test('audio diagnostics report actual context state',()=>{
 assert.match(s,/nxAudioGraph\.ctx\.state/);
 assert.match(s,/Web Audio desconectado/);
});
test('source changes restore neutral path for previous media',()=>{
 assert.match(s,/previous\.bypass\.gain\.value=1/);
 assert.match(s,/previous\.filters\.forEach/);
});
