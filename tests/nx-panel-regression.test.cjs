'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');

test('launcher fallback remains visible when the integrated toolbar button is clipped',()=>{
 assert.match(src,/function nxButtonActuallyVisible\(button, host\)/);
 assert.match(src,/const integratedVisible = expanded && nxButtonActuallyVisible\(nxLibraryButton, fullscreenHost\(\)\)/);
 assert.match(src,/if \(!integratedVisible\) \{\s*nxLibraryButton\.style\.display = 'none';\s*if \(nxKeyboardMouseButton\) nxKeyboardMouseButton\.style\.display = 'none';\s*\}/);
 assert.match(src,/pillEl\.style\.display = openUI \|\| integratedVisible \? 'none' : 'inline-flex'/);
 assert.match(src,/wrap\.style\.right = '12px';\s*wrap\.style\.top = '12px';/);
 assert.match(src,/pillEl\.style\.display = integratedVisible \? 'none' : 'inline-flex'/);
});

test('F9 and requestPointerLock remain native',()=>{
 assert.doesNotMatch(src,/Element\.prototype\.requestPointerLock\s*=/);
 assert.doesNotMatch(src,/e\.code\s*===\s*['"]F9['"]|e\.key\s*===\s*['"]F9['"]/);
 assert.match(src,/document\.addEventListener\('pointerlockchange'/);
 assert.match(src,/document\.exitPointerLock\(\)/);
});

test('NX is an overlay and native xCloud menus take priority over touch HUD hit targets',()=>{
 assert.match(src,/wrap\.style\.pointerEvents='none';cardEl\.style\.pointerEvents='auto'/);
 assert.match(src,/document\.documentElement\.classList\.toggle\('nx-native-menu-expanded',!!parent\)/);
 assert.match(src,/\.nx-native-menu-expanded #nimbo-touch-root \.hud-button[\s\S]*?pointer-events:none!important/);
 assert.match(src,/window\.NimboTouch\?\.setMenuBlocked\?\.\(!!nativeOpen\|\|openUI\)/);
});

test('fullscreen and recovery shortcut are present',()=>{
 assert.match(src,/\['fullscreenchange', 'webkitfullscreenchange'\]/);
 assert.match(src,/e\.code === 'KeyN'/);
 assert.match(src,/if \(!cardEl\) buildUI\(\)/);
});
