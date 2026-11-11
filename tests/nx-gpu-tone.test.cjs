'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
test('GPU pipeline is opt-in and uses WebGL2',()=>{
 assert.match(src,/const LS_NX_GPU='nx\.visual\.gpu\.v1'/);
 assert.match(src,/getPref\(LS_NX_GPU,'0'\)/);
 assert.match(src,/getContext\('webgl2'/);
});
test('GPU handles lost context and capture failures',()=>{
 assert.match(src,/webglcontextlost/);
 assert.match(src,/gl\.texImage2D\(gl\.TEXTURE_2D,0,gl\.RGBA,gl\.RGBA,gl\.UNSIGNED_BYTE,video\)/);
 assert.match(src,/setPref\(LS_NX_GPU,'0'\);nxGpuStop\(\)/);
});
test('GPU does not stack with CSS and can restore native video',()=>{
 assert.match(src,/restoreVideoAdjustments\(video\); \/\/ GPU substitui CSS/);
 assert.match(src,/function nxGpuStop\(\)/);
 assert.match(src,/state\.video\.style\.removeProperty\('opacity'\)/);
 assert.match(src,/pointer-events:none/);
});
test('GPU shader includes independent shadow and highlight controls',()=>{
 assert.match(src,/uniform float u_shadows;uniform float u_highlights/);
 assert.match(src,/gpuToneSlider\('Sombras',LS_NX_SHADOWS\)/);
 assert.match(src,/gpuToneSlider\('Realces',LS_NX_HIGHLIGHTS\)/);
});
