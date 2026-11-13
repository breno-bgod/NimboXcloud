'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('NimboXcloud.user.js','utf8');
function boot(){
 const ctx={};vm.createContext(ctx);const start=source.indexOf('  const nxMonitorHistory='),end=source.indexOf('  function nxTelemetryTick(){',start);
 vm.runInContext(source.slice(start,end)+'\nglobalThis.history=nxMonitorHistory;',ctx);return ctx;
}
test('graphs retain zero FPS and gaps instead of replacing them with fabricated values',()=>{
 const h=boot();h.nxMonitorCollect({decodedFps:0,fps:60,rtt:25,kbps:1500},1000,1);
 assert.equal(h.history.fps[0],0);assert.equal(h.history.bitrate[0],1.5);
 h.nxMonitorCollect({},2000,1);assert.equal(h.history.fps[1],null);
 assert.equal(h.nxMonitorGraphPath([0,null,60]),'M0.0 28.0 M120.0 2.0');
});
test('sample history is bounded and repeated renders cannot inflate it',()=>{
 const h=boot();for(let i=1;i<=80;i++)h.nxMonitorCollect({fps:i},i*1000,1);
 assert.equal(h.history.fps.length,60);assert.equal(h.history.fps[0],21);
 h.nxMonitorCollect({fps:999},80010,1);assert.equal(h.history.fps.length,60);assert.equal(h.history.fps.at(-1),80);
});
test('new sessions discard previous graphs and invalid numbers are absent',()=>{
 const h=boot();h.nxMonitorCollect({fps:60,rtt:20},1000,1);h.nxMonitorCollect({fps:NaN,rtt:-1,kbps:Infinity},2000,2);
 assert.equal(h.history.fps.length,1);assert.equal(h.history.fps[0],null);assert.equal(h.history.rtt[0],null);assert.equal(h.history.bitrate[0],null);
 assert.equal(h.nxMonitorGraphPath([NaN,-1,null]),'');
});
