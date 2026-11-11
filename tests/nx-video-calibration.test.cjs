'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
test('image calibration has safe bounded controls',()=>{
  assert.match(source,/brightness:clamp\(LS_VIDEO_BRIGHTNESS,85,115,100\)/);
  assert.match(source,/contrast:clamp\(LS_VIDEO_CONTRAST,85,115,100\)/);
  assert.match(source,/saturation:clamp\(LS_VIDEO_SATURATION,75,125,100\)/);
});
test('visual preset changes do not accumulate CSS filters',()=>{
  const start=source.indexOf('  function applyVideoAdjustments(video)');
  const end=source.indexOf('  function cycleSharpness()',start);
  assert.ok(start>=0&&end>start);
  const code=source.slice(start,end);
  assert.match(code,/state\.applied=\(state\.original/);
  assert.doesNotMatch(code,/state\.applied\s*\+=/);
  assert.match(code,/restoreVideoAdjustments\(video\)/);
});
test('manual edits preserve preset baseline',()=>{
  assert.match(source,/if\(getPref\(LS_VIDEO_PROFILE,'original'\)!=='custom'\)/);
  assert.match(source,/setPref\(LS_VIDEO_BRIGHTNESS,String\(base\.brightness\)\)/);
  assert.match(source,/setPref\(LS_VIDEO_SATURATION,String\(base\.saturation\)\)/);
});
