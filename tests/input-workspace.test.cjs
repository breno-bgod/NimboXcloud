'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const main=fs.readFileSync('NimboXcloud.user.js','utf8');
const touch=fs.readFileSync('modules/NimboXcloud-Touch-HUD.user.js','utf8');
function section(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a);return source.slice(a,b);
}
class Node{
 constructor(tag,text=''){this.tagName=tag;this.text=text;this.children=[];this.style={};this.attrs={};}
 appendChild(node){this.children.push(node);return node;}
 append(...nodes){this.children.push(...nodes);}
 setAttribute(key,value){this.attrs[key]=value;}
 get textContent(){return this.text+this.children.map(node=>node.textContent).join(' ');}
}
function workspace(){
 const calls=[],ctx={C:{dim:'#aaa',accent:'#0f0',line:'#333'},liveFns:[],
  document:{createElement:tag=>new Node(tag)},mk:(tag,style,text)=>new Node(tag,text),
  group:title=>{const root=new Node('section',title);return {root,add:node=>root.appendChild(node)};},
  actBtn:(label,action)=>Object.assign(new Node('button',label),{action}),
  setRow:(label,hint,control)=>{const row=new Node('div',label+hint);row.appendChild(control);return row;},
  nxSelectedInputMode:()=> 'gamepad',nxInputModeLabel:mode=>mode,nxInputSelectionSummary:()=> 'waiting',
  nxInputSelection:{busy:false},nxChooseInputMode:async mode=>{calls.push(mode);return false;},
  el:{body:{querySelector:()=>null}},renderBody:()=>calls.push('render'),setOpen:()=>calls.push('close'),
  window:{NimboTouch:{editHud:()=>calls.push('edit')}}};
 vm.createContext(ctx);
 vm.runInContext(section(main,'  const NX_INPUT_MODES = [','  const nxInputSelection = ')+
  section(main,"  let nxInputWorkspaceFamily = '';","  function nxTouchpadSettings(root) {"),ctx);
 return {ctx,calls,build:()=>{const root=new Node('div');ctx.nxInputModePage(root);return root;}};
}
function buttons(node){return node.children.flatMap(child=>[...(child.tagName==='button'?[child]:[]),...buttons(child)]);}
test('browsing device families never activates an input mode',()=>{
 const h=workspace();let root=h.build();
 assert.match(root.textContent,/Controle físico/);assert.doesNotMatch(root.textContent,/Toque nativo do jogo/);
 buttons(root).find(node=>node.attrs['data-nx-device']==='mobile').action();
 assert.deepEqual(h.calls,['render']);
 root=h.build();assert.match(root.textContent,/Toque nativo do jogo|Layouts de HUD/);
 assert.doesNotMatch(root.textContent,/Controle físico/);
 assert.equal(buttons(root).find(node=>node.attrs['data-nx-device']==='mobile').attrs['aria-pressed'],'true');
});
test('HUD editing waits for successful activation',async()=>{
 const h=workspace();
 buttons(h.build()).find(node=>node.attrs['data-nx-device']==='mobile').action();
 h.calls.length=0;
 await buttons(h.build()).find(node=>node.text==='Editar HUD').action();
 assert.deepEqual(h.calls,['virtual-gamepad']);
});
test('touchpad settings validate before mutation and preserve old values on storage failure',()=>{
 const ui={sensitivity:1,gainX:1,gainY:1},writes=[];
 const ctx={ui,localStorage:{setItem:(key,value)=>writes.push([key,JSON.parse(value)])}};
 vm.createContext(ctx);
 vm.runInContext(section(touch,'function nimboTouchpadSettings(){','window.NimboTouch=Object.freeze({'),ctx);
 ctx.nimboSetTouchpadSettings({gainX:2.3});
 assert.equal(ui.gainX,2.3);assert.equal(ui.gainY,1);
 assert.deepEqual(writes[0],['BxTouchpad.motion.v7',{version:1,touchGain:1,touchX:2.3,touchY:1}]);
 assert.throws(()=>ctx.nimboSetTouchpadSettings({gainX:NaN}));
 assert.throws(()=>ctx.nimboSetTouchpadSettings({gainY:8}));
 ctx.localStorage.setItem=()=>{throw Error('quota');};
 assert.throws(()=>ctx.nimboSetTouchpadSettings({sensitivity:4}),/quota/);
 assert.equal(ui.sensitivity,1);
});
