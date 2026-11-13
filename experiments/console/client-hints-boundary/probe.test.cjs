'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {loadSpoof,run}=require('./probe.cjs');
const reference=process.env.BX_USER_AGENT_SOURCE;
if(!reference)throw Error('BX_USER_AGENT_SOURCE is required; no silently skipped reference tests');
test('real method hides inherited hints, changes JS UA and never promotes network/server evidence',()=>{
 const r=run(reference);assert.equal(r.inheritedProperty.uaChanged,true);assert.equal(r.inheritedProperty.hintsHidden,true);assert.equal(r.networkCalls,0);assert.equal(r.httpClientHints,'not-observed');assert.equal(r.serverConsoleRecognition,'not-verified');
});
test('existing own hint property is retained by an empty descriptor',()=>{
 assert.equal(run(reference).existingOwnProperty.hintsPreserved,true);
});
test('default profile leaves navigator unchanged',()=>{
 const nav={userAgent:'before',userAgentData:{platform:'Android'}};const result=loadSpoof(reference)(nav,'default');assert.equal(result.error,null);assert.equal(nav.userAgent,'before');assert.equal(Object.hasOwn(nav,'orgUserAgentData'),false);
});
test('nonconfigurable UA produces partial mutation instead of confirmed success',()=>{
 const nav={};Object.defineProperty(nav,'userAgent',{value:'locked'});Object.setPrototypeOf(nav,{userAgentData:{platform:'Android'}});
 const r=loadSpoof(reference)(nav);assert.equal(r.error,'TypeError');assert.equal(nav.userAgent,'locked');assert.equal(nav.userAgentData,undefined);
});
test('modified reference rejected before evaluation',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nx-hints-'));try{const file=path.join(dir,'changed.ts');fs.writeFileSync(file,fs.readFileSync(reference,'utf8')+'\n// changed\n');assert.throws(()=>loadSpoof(file),/reference-hash-mismatch/);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
