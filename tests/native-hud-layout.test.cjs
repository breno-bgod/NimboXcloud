'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.NX_UI_SOURCE||'NimboXcloud.user.js','utf8');
function part(a,b){const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start,a);return source.slice(start,end);}
function game(video){
 const ctx={activeStreamVideo:()=>video,document:{fullscreenElement:null,webkitFullscreenElement:null,querySelector:()=>null},S:{pcs:0,qosAt:0}};
 vm.createContext(ctx);vm.runInContext(part('  function isInGame() {','  function nxViewportMode(){'),ctx);return ctx;
}
test('live srcObject session is recognized without intercepted RTC stats or blob attributes',()=>{
 const video={srcObject:{getVideoTracks:()=>[{readyState:'live'}]}};assert.equal(game(video).isInGame(),true);
});
test('a trailer or ended media track does not turn the library into gameplay',()=>{
 assert.equal(game({src:'blob:trailer'}).isInGame(),false);
 assert.equal(game({srcObject:{getVideoTracks:()=>[{readyState:'ended'}]}}).isInGame(),false);
});
class Element{
 constructor(id,tag='DIV',label=''){this.id=id;this.tagName=tag;this.label=label;this.children=[];this.parentElement=null;this.style={position:'relative'};this.visible=true;this.onclick=()=>id;}
 appendChild(n){if(n.parentElement){const list=n.parentElement.children;list.splice(list.indexOf(n),1);}n.parentElement=this;this.children.push(n);return n;}
 after(n){if(n.parentElement){const list=n.parentElement.children;list.splice(list.indexOf(n),1);}const p=this.parentElement;n.parentElement=p;p.children.splice(p.children.indexOf(this)+1,0,n);}
 get previousElementSibling(){return this.parentElement?.children[this.parentElement.children.indexOf(this)-1]||null;}
 querySelectorAll(){return this.children.flatMap(n=>[...(n.tagName==='BUTTON'?[n]:[]),...n.querySelectorAll()]);}
 closest(selector){for(let n=this;n;n=n.parentElement){if(selector==='#StreamHud'&&n.id==='StreamHud')return n;if(selector.includes('#__xcu_panel__')&&n.id==='__xcu_panel__')return n;}return null;}
 getAttribute(name){return name==='aria-label'?this.label:null;}
 setAttribute(){}addEventListener(){}
 getBoundingClientRect(){return {width:40,height:40,left:20,right:60,top:20,bottom:60};}
}
function toolbar(){
 const body=new Element('body'),hud=body.appendChild(new Element('StreamHud')),row=hud.appendChild(new Element('native-row'));
 const padSlot=row.appendChild(new Element('pad-slot')),xboxSlot=row.appendChild(new Element('xbox-slot')),gripSlot=row.appendChild(new Element('grip-slot'));
 const pad=padSlot.appendChild(new Element('pad','BUTTON','Controle'));
 const xbox=xboxSlot.appendChild(new Element('xbox','BUTTON','Abrir guia Xbox'));
 const grip=gripSlot.appendChild(new Element('grip','BUTTON','Expandir barra'));
 const ctx={document:{body,createElement:tag=>new Element('',tag.toUpperCase())},innerWidth:400,innerHeight:800,
  nxLibraryButton:null,fullscreenHost:()=>hud,nxButtonActuallyVisible:b=>b.visible,
  getComputedStyle:b=>({display:b.visible?'block':'none',visibility:'visible',opacity:1}),
  buildLibraryButton:()=>new Element('nimboxcloud-library-button','BUTTON','NX'),ico:()=>new Element('icon'),ICONS:{gyrotouch:''},nxUpdateNativeTouchButton(){}};
 vm.createContext(ctx);vm.runInContext(part('  function nxNativeButtons(parent){','  function nxUpdateNativeTouchButton(){')+
  part('  function nxNativeToolbarOpen(anchor) {','  function toolbarExpanded(anchor) {'),ctx);
 return {ctx,row,xboxSlot,gripSlot,pad,xbox,grip};
}
test('NX attaches beside Xbox at the native row level, outside clipped individual button wrappers',()=>{
 const h=toolbar();h.ctx.nxMountNativeActions(h.grip,true);
 assert.deepEqual(h.row.children.map(n=>n.id),['pad-slot','xbox-slot','nimboxcloud-library-button','nimboxcloud-native-keyboard-mouse','grip-slot']);
 assert.equal(h.ctx.nxLibraryButton.parentElement,h.row);assert.equal(h.xboxSlot.children.length,1);assert.equal(h.gripSlot.children.length,1);
});
test('portrait, landscape and repeated reconciliation preserve native controls and avoid duplicate NX buttons',()=>{
 const h=toolbar(),xboxClick=h.xbox.onclick,gripClick=h.grip.onclick,before=JSON.stringify(h.xbox.style);
 for(const [width,height]of [[400,800],[1280,600],[400,800]]){
  h.ctx.innerWidth=width;h.ctx.innerHeight=height;assert.equal(h.ctx.nxNativeToolbarOpen(h.xbox),true);h.ctx.nxMountNativeActions(h.grip,true);
 }
 assert.equal(h.row.children.filter(n=>n.id==='nimboxcloud-library-button').length,1);assert.equal(h.xbox.onclick,xboxClick);assert.equal(h.grip.onclick,gripClick);assert.equal(JSON.stringify(h.xbox.style),before);
});
test('a collapsed row is not misreported as expanded because the NX controls are present',()=>{
 const h=toolbar();h.ctx.nxMountNativeActions(h.grip,true);h.pad.visible=false;h.xbox.visible=false;
 assert.equal(h.ctx.nxNativeToolbarOpen(h.grip),false);
});
test('independent recovery access stays on the left in both orientations and never changes an open NX panel',()=>{
 const ctx={openUI:false,isInGame:()=>true,wrap:{style:{}},pillEl:{style:{display:'inline-flex'}},pillTxt:{style:{}},dotEl:{style:{}}};
 vm.createContext(ctx);vm.runInContext(part('  function nxAlignClosedGameAccess(){','  function syncNXPlacement() {'),ctx);
 ctx.nxAlignClosedGameAccess();assert.equal(ctx.wrap.style.right,'auto');assert.match(ctx.wrap.style.left,/64px/);assert.equal(ctx.pillTxt.style.display,'none');
 ctx.wrap.style.left='panel';ctx.openUI=true;ctx.nxAlignClosedGameAccess();assert.equal(ctx.wrap.style.left,'panel');
});


test('diagnostics distinguish a native HUD outside the actual fullscreen subtree without moving it',()=>{
 const hud={},fullscreen={tagName:'DIV',contains:node=>false};const ctx={document:{fullscreenElement:fullscreen,getElementById:()=>hud},isInGame:()=>true,
  nxNativeStreamHandle:()=>null,nxButtonActuallyVisible:()=>false,fullscreenHost:()=>fullscreen,nxLibraryButton:null,pillEl:{style:{display:'inline-flex'}},wrap:{style:{right:'auto'}}};
 vm.createContext(ctx);vm.runInContext(part('  function nxNativeUiSnapshot(){','  function nxAlignClosedGameAccess(){'),ctx);
 const report=ctx.nxNativeUiSnapshot();assert.equal(report.nativeHudInsideFullscreen,false);assert.equal(report.recoverySide,'left');
 fullscreen.contains=node=>node===hud;assert.equal(ctx.nxNativeUiSnapshot().nativeHudInsideFullscreen,true);
});
