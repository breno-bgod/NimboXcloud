'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const moduleSource=fs.readFileSync('modules/NimboXcloud-Touch-HUD.user.js','utf8');
const main=fs.readFileSync('NimboXcloud.user.js','utf8');
function settings(host){
 const events=[],ctx={window:{NimboInputHost:host?{openSettings:()=>events.push('NX')}:{}},touchPanel:{close:()=>events.push('close old'),open:()=>events.push('old')}};
 vm.createContext(ctx);const begin=moduleSource.indexOf('function nimboOpenSettings(){'),end=moduleSource.indexOf('const touchPanel=',begin);
 vm.runInContext(moduleSource.slice(begin,end),ctx);return {ctx,events};
}
test('HUD settings return to NX and close the legacy panel when host exists',()=>{
 const h=settings(true);assert.equal(h.ctx.nimboOpenSettings(),true);assert.deepEqual(h.events,['close old','NX']);
});
test('standalone HUD retains its own settings when NX is unavailable',()=>{
 const h=settings(false);assert.equal(h.ctx.nimboOpenSettings(),false);assert.deepEqual(h.events,['old']);
});
function editor(host){
 const h=settings(host),calls=[];
 h.ctx.Base=class{finishEditing(cancel,returnToSettings){calls.push({cancel,returnToSettings});this.editingHud=false;}};
 const begin=moduleSource.indexOf('  finishEditing(cancel,returnToSettings=true){',moduleSource.indexOf('class BxTouchpadOverlay'));
 const end=moduleSource.indexOf('\n}\n\nclass BxTouchpadExclusive',begin);
 assert.ok(begin>0&&end>begin);
 vm.runInContext('globalThis.Editor=class extends Base {'+moduleSource.slice(begin,end)+'}',h.ctx);
 const ui=new h.ctx.Editor();Object.assign(ui,{editingHud:true,openTouchSettings:()=>h.ctx.nimboOpenSettings(),start:()=>{calls.push('start');return Promise.resolve();}});
 return {...h,ui,calls};
}
for(const cancel of [false,true])test('finishing HUD '+(cancel?'cancel':'save')+' restores NX without starting a second settings flow',()=>{
 const h=editor(true);h.ui.finishEditing(cancel);assert.deepEqual(h.events,['close old','NX']);assert.equal(h.calls.length,1);assert.equal(h.calls[0].cancel,cancel);assert.equal(h.calls[0].returnToSettings,false);
});
test('internal mode switching closes editing without reopening any panel',()=>{
 const h=editor(true);h.ui.finishEditing(true,false);assert.deepEqual(h.events,[]);assert.equal(h.calls.length,1);
});
test('NX return explicitly selects Inputs and opens rather than toggles the panel',()=>{
 const calls=[],ctx={setTab:id=>calls.push(id),setOpen:(...args)=>calls.push(args)};
 const begin=main.indexOf('      openSettings: function(){'),end=main.indexOf('\n',begin);
 assert.ok(begin>=0);vm.runInNewContext('globalThis.host={'+main.slice(begin,end)+'};',ctx);ctx.host.openSettings();assert.deepEqual(calls,['inputs',[true,true]]);
});
