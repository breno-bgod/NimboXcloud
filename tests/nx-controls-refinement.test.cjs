'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('NimboXcloud.user.js','utf8');
const part=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
function nativeHandle(){
 const handle={isConnected:true,style:{position:'fixed'},getBoundingClientRect:()=>({left:10,right:50,top:10,bottom:50,width:40,height:40})};
 const ctx={document:{documentElement:{},getElementById:id=>id==='StreamHud'?{querySelector:()=>handle}:null},innerWidth:1280,innerHeight:720,
  fullscreenHost:()=>null,getComputedStyle:()=>({display:'block',visibility:'visible',opacity:1})};
 vm.createContext(ctx);vm.runInContext(part('  function nxButtonActuallyVisible(','  function nxHideDetachedControls(')+part('  function nxNativeStreamHandle(){','  function findInGameToolbar() {'),ctx);
 return {ctx,handle};
}
test('native collapsed handle is discoverable without moving or changing its controls',()=>{
 const h=nativeHandle(),before=JSON.stringify(h.handle.style);assert.equal(h.ctx.nxNativeStreamHandle(),h.handle);assert.equal(JSON.stringify(h.handle.style),before);
});
test('a hidden native handle does not suppress the independent recovery access',()=>{
 const h=nativeHandle();h.ctx.getComputedStyle=()=>({display:'none',visibility:'hidden',opacity:0});assert.equal(h.ctx.nxNativeStreamHandle(),null);
});
test('the Statistics button toggles the existing saved monitor preference without navigating away',()=>{
 let renders=0;const ctx={nxTelemetryEnabled:false,actBtn:(label,action)=>({label,action}),nxTelemetryToggle:value=>ctx.nxTelemetryEnabled=value,renderBody:()=>renders++};
 vm.createContext(ctx);vm.runInContext(part('  function nxMonitorToggleButton(){','  function nxMonitorSettingsGroup(root){'),ctx);
 const activate=ctx.nxMonitorToggleButton();assert.equal(activate.label,'Ativar estatísticas');activate.action();assert.equal(ctx.nxTelemetryEnabled,true);
 const hide=ctx.nxMonitorToggleButton();assert.equal(hide.label,'Ocultar estatísticas');hide.action();assert.equal(ctx.nxTelemetryEnabled,false);assert.equal(renders,2);
});
