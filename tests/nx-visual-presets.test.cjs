'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
const a=source.indexOf('  const NX_VISUAL_FORMAT=');
const b=source.indexOf('  function nxVideoCalibration()',a);
assert.ok(a>0&&b>a);
function library(){
 const ctx={};
 vm.createContext(ctx);
 vm.runInContext(source.slice(a,source.indexOf('  function nxVisualLibrary()',a))+'\n globalThis.sanitize=nxVisualSanitize;',ctx);
 return ctx.sanitize;
}
test('valid portable preset accepted',()=>{
 const result=library()({format:'nx-visual-preset',version:1,name:'Cinematic',author:'User',settings:{brightness:100,contrast:105,saturation:108}});
 assert.equal(result.settings.contrast,105);
 assert.equal(result.version,1);
});
test('reject malformed and excessive settings',()=>{
 const validate=library();
 for(const settings of [{brightness:999,contrast:100,saturation:100},{brightness:'100',contrast:100,saturation:100},{brightness:100,contrast:100,saturation:NaN}]){
  assert.throws(()=>validate({format:'nx-visual-preset',version:1,name:'Test',settings}));
 }
 assert.throws(()=>validate({format:'evil',version:1,name:'Test',settings:{brightness:100,contrast:100,saturation:100}}));
});
test('profile engine uses fixed settings rather than concatenated CSS',()=>{
 assert.match(source,/state\.applied=\(state\.original/);
 assert.match(source,/function nxVisualApply\(preset\)/);
 assert.match(source,/function nxVisualImport\(file\)/);
 assert.match(source,/file\.size>16384/);
});
