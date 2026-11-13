'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('NimboXcloud.user.js','utf8');
function boot(){
 const nodes=new Map(),classes=new Map();
 class Node{
  constructor(tag){this.tagName=tag;this.style={};this.children=[];this.isConnected=true;this.attributes={};this.textContent='';this.hidden=false;}
  addEventListener(type,fn){this['on'+type]=fn;}
  setAttribute(key,value){this.attributes[key]=value;}
  append(...nodes){nodes.forEach(n=>this.appendChild(n));}
  appendChild(node){node.parentNode=this;this.children.push(node);if(node.id)nodes.set(node.id,node);}
 }
 const host=new Node('main');const prefs={};
 const ctx={nxLaunch:{phase:'loading',startedAt:Date.now(),stage:'Aguardando vaga',server:'',wait:null},nxLaunchRefresh(){},nxLaunchEstimate:()=> 'Estimativa indisponível',nxLoadingBusy:()=>ctx.nxLaunch.phase==='loading',
  document:{hidden:false,head:host,documentElement:{classList:{toggle:(key,value)=>classes.set(key,value)}},getElementById:id=>nodes.get(id),createElement:tag=>new Node(tag)},
  mountTarget:()=>host,NX_LOADING_DETAILS:'details',getPref:(key,fallback)=>prefs[key]??fallback,
  S:{qos:{fps:999,kbps:900000},qosAt:1},srvBtnLabel:()=> 'Índia',resCfg:()=>({label:'1080p HQ'}),fmtN:n=>String(n),
  openUI:true,setOpen(value){ctx.openUI=value;},wrap:new Node('div'),nxLibraryButton:new Node('button'),pillEl:new Node('button')};
 vm.createContext(ctx);const a=source.indexOf('  let nxLoadingEl = null;'),b=source.indexOf('  // Fim do painel de preparação.',a);vm.runInContext(source.slice(a,b),ctx);
 return {ctx,prefs,nodes,host,classes,tick:()=>ctx.nxLoadingTick()};
}
test('estimate remains visible when optional loading details are hidden and stale stats are excluded',()=>{
 const h=boot();h.prefs.details='0';h.tick();const panel=h.nodes.get('nx-loading-overlay');
 assert.equal(panel.hidden,false);assert.match(panel.time.textContent,/Estimativa indisponível/);assert.match(panel.time.textContent,/Tempo decorrido/);
 assert.equal(panel.detail.hidden,true);assert.equal(panel.toggle.hidden,true);assert.doesNotMatch(panel.detail.textContent,/999|900000/);assert.match(panel.detail.textContent,/Qualidade solicitada/);
 assert.equal(h.ctx.openUI,false);assert.equal(h.classes.get('nx-session-loading'),true);
});
test('optional technical data reappears without changing the estimate or creating another panel',()=>{
 const h=boot();h.tick();const panel=h.nodes.get('nx-loading-overlay');assert.equal(panel.detail.hidden,true);panel.toggle.onclick({stopPropagation(){}});assert.equal(panel.detail.hidden,false);
 h.prefs.details='0';h.tick();h.prefs.details='1';h.tick();assert.equal(h.nodes.get('nx-loading-overlay'),panel);assert.equal(panel.detail.hidden,false);
 assert.equal(h.host.children.filter(n=>n.id==='nx-loading-overlay').length,1);
});
test('failure and video-ready states remove loading presentation and release its CSS gate',()=>{
 const h=boot();h.tick();const panel=h.nodes.get('nx-loading-overlay');
 for(const phase of ['failed','cancelled','idle','playing']){h.ctx.nxLaunch.phase=phase;h.tick();assert.equal(panel.hidden,true);assert.equal(h.classes.get('nx-session-loading'),false);}
});


test('NX disclosure only toggles technical details and keeps the estimate and loading gate visible',()=>{
 const h=boot();h.tick();const panel=h.nodes.get('nx-loading-overlay'),time=panel.time.textContent;
 assert.equal(panel.detail.hidden,true);assert.equal(panel.toggle.attributes['aria-expanded'],'false');
 panel.toggle.onclick({stopPropagation(){}});assert.equal(panel.detail.hidden,false);assert.equal(panel.toggle.attributes['aria-expanded'],'true');
 panel.toggle.onclick({stopPropagation(){}});assert.equal(panel.detail.hidden,true);assert.equal(panel.hidden,false);assert.equal(panel.time.textContent,time);
 assert.equal(h.classes.get('nx-session-loading'),true);assert.equal(h.ctx.openUI,false);
});
