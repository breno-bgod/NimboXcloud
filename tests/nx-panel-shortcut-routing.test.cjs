'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
let src=fs.readFileSync(path.join(__dirname,'..','NimboXcloud.user.js'),'utf8');
if(process.env.NX_SHORTCUT_BASELINE==='1')src=src.replace("window.addEventListener('keydown',function(e){\n      if(!e.isTrusted||e.repeat)return;","document.addEventListener('keydown',function(e){\n      if(!e.isTrusted||e.repeat)return;").replace("window.addEventListener('keyup',function(e){\n      nxKeysHeld.delete(e.code);","document.addEventListener('keyup',function(e){\n      nxKeysHeld.delete(e.code);");
function setup(){
 const handlers={window:{},document:{}};const target={tagName:'BODY'},held=new Set();let opened=false,changes=0,combo=['Backquote'];
 const eventTarget=name=>({addEventListener:(type,fn)=>(handlers[name][type]??=[]).push(fn)});
 const ctx={window:eventTarget('window'),document:eventTarget('document'),openUI:false,wrap:{contains:()=>false},nxCaptureKeys:null,nxKeysHeld:held,nxKeyboardComboActive:false,
  nxKeyBinding:()=>combo,getPref:(k,d)=>d,LS_NX_SHORTCUT:'shortcut',NX_KEY_BIND_KEY:'binding',setPref:()=>{},renderBody:()=>{},nxBindingLabel:a=>a.join('+'),
  setOpen:v=>{opened=v;ctx.openUI=v;changes++;}};vm.createContext(ctx);
 const guardStart=src.indexOf("  document.addEventListener('keydown',function(e){\n    if(!openUI)return;");
 const guardEnd=src.indexOf('  // Gerenciamento de foco',guardStart);
 const manager=src.match(/    (?:document|window)\.addEventListener\('keydown',function\(e\)\{\n      if\(!e\.isTrusted\|\|e\.repeat\)return;[\s\S]*?window\.addEventListener\('blur',function\(\)\{nxKeysHeld.clear\(\);nxKeyboardComboActive=false;\}\);/);
 assert.ok(guardStart>=0&&guardEnd>guardStart&&manager);vm.runInContext(src.slice(guardStart,guardEnd)+'\n'+manager[0],ctx);
 function dispatch(type,code,extra={}){let stopped=false;const e={type,code,target,isTrusted:true,repeat:false,ctrlKey:false,shiftKey:false,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){stopped=true;},...extra};for(const scope of ['window','document'])for(const fn of handlers[scope][type]||[]){if(stopped)break;fn(e);}return e;}
 return {dispatch,ctx,held,opened:()=>opened,changes:()=>changes,combo:v=>combo=v,blur:()=>handlers.window.blur.forEach(fn=>fn())};
}
test('atalho personalizado abre e fecha com foco fora do painel; keyup não fica retido',()=>{
 const h=setup();h.dispatch('keydown','Backquote');assert.equal(h.opened(),true);h.dispatch('keyup','Backquote');assert.equal(h.held.size,0);h.dispatch('keydown','Backquote');assert.equal(h.opened(),false);assert.equal(h.changes(),2);
});
test('combinação mantém estado correto, ignora repetição e neutraliza em blur',()=>{
 const h=setup();h.combo(['ControlLeft','KeyH']);h.dispatch('keydown','ControlLeft');h.dispatch('keydown','KeyH');assert.equal(h.changes(),1);h.dispatch('keydown','KeyH',{repeat:true});assert.equal(h.changes(),1);h.blur();assert.equal(h.held.size,0);h.dispatch('keydown','ControlLeft');h.dispatch('keydown','KeyH');assert.equal(h.opened(),false);
});
test('campo editável e evento não confiável não acionam atalho; Escape fecha sem alterar captura nativa',()=>{
 const h=setup();h.dispatch('keydown','Backquote',{target:{tagName:'INPUT'}});h.dispatch('keydown','Backquote',{isTrusted:false});assert.equal(h.changes(),0);h.dispatch('keydown','Backquote');h.dispatch('keyup','Backquote');h.dispatch('keydown','Escape');assert.equal(h.opened(),false);
});
