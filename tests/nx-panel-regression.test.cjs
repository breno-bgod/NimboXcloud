'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
test('launcher stays visible across game and library screens',()=>{
 assert.match(src,/wrap\.style\.display = 'flex';\s*if \(pillEl\) pillEl\.style\.display = expanded \? 'none' : 'inline-flex';/);
 assert.match(src,/wrap\.style\.display = 'flex';\s*if \(pillEl\) pillEl\.style\.display = 'inline-flex';/);
 assert.doesNotMatch(src,/wrap\.style\.display = openUI \? 'flex' : 'none'/);
});
test('F9 and requestPointerLock remain native',()=>{
 assert.doesNotMatch(src,/Element\.prototype\.requestPointerLock\s*=/);
 assert.doesNotMatch(src,/e\.code\s*!==\s*'F9'/);
 assert.match(src,/document\.exitPointerLock\(\)/);
});
test('NX blocks gameplay pointer input while open',()=>{
 assert.match(src,/\['pointerup','mousedown','mouseup','click','wheel','touchstart','touchmove','touchend'\]/);
 assert.match(src,/e\.stopImmediatePropagation\(\)/);
});
test('fullscreen and recovery shortcut are present',()=>{
 assert.match(src,/\['fullscreenchange', 'webkitfullscreenchange'\]/);
 assert.match(src,/e\.code === 'KeyN'/);
 assert.match(src,/if \(!cardEl\) buildUI\(\)/);
});
