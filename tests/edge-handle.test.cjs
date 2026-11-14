'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('NimboXcloud.user.js','utf8');
function harness(saved=null){
 const handlers={},store=new Map(saved===null?[]:[['nx.panel.edgePosition.v1',saved]]);
 const node={style:{},setAttribute(){},addEventListener:(name,fn)=>handlers[name]=fn,setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}};
 let busy=false,opens=0,native=true,expanded=false,game=true;const mounts=[];
 const ctx={innerHeight:800,openUI:false,wrap:{isConnected:true,style:{}},pillEl:node,dotEl:{style:{}},pillTxt:{style:{}},
 localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)},nxLoadingBusy:()=>busy,
 nxPanelPalette:()=>({background:'theme',line:'border'}),setOpen:()=>opens++,nxViewportMode(){},
 nxLibraryButton:null,nxKeyboardMouseButton:null,isInGame:()=>game,findInGameToolbar:()=>native?{}:null,nxControllerAnchor:()=>native?{}:null,
 nxHideDetachedControls(){node.style.display='none';},nxMountNativeActions:(anchor,expanded,preferXbox)=>mounts.push({anchor,expanded,preferXbox}),
 toolbarExpanded:()=>true,nxNativeToolbarOpen:()=>expanded,nxNativeMenuPriority(){},nxDockPanel:()=>ctx.wrap.style.top='0'};
 vm.createContext(ctx);const a=source.indexOf("  const NX_EDGE_POSITION_KEY="),b=source.indexOf('  // ---------- 13b.',a);vm.runInContext(source.slice(a,b),ctx);ctx.nxBindEdgeHandle(node);
 function emit(type,y=100,extra={}){handlers[type]({type,clientY:y,pointerId:1,button:0,detail:1,preventDefault(){},stopPropagation(){},...extra});}
 return {ctx,node,store,emit,opens:()=>opens,busy:v=>busy=v,native:v=>native=v,expanded:v=>expanded=v,game:v=>game=v,mounts};
}
test('catalog mounts NX by controller; gameplay follows expanded and collapsed native toolbar',()=>{
 const h=harness();h.game(false);h.ctx.syncNXPlacement();assert.equal(h.mounts.at(-1).expanded,true);assert.equal(h.mounts.at(-1).preferXbox,false);assert.equal(h.ctx.wrap.style.display,'none');
 h.game(true);h.expanded(true);h.ctx.syncNXPlacement();assert.equal(h.mounts.at(-1).expanded,true);assert.equal(h.mounts.at(-1).preferXbox,true);
 h.expanded(false);h.ctx.syncNXPlacement();assert.equal(h.mounts.at(-1).expanded,false);assert.equal(h.node.style.display,'none');
});
test('missing native toolbar uses fixed top recovery without left draggable tab',()=>{
 const h=harness();h.native(false);h.ctx.syncNXPlacement();assert.equal(h.node.style.display,'inline-flex');assert.equal(h.ctx.wrap.style.left,'auto');assert.match(h.ctx.wrap.style.right,/safe-area-inset-right/);assert.match(h.ctx.wrap.style.top,/safe-area-inset-top/);
 h.emit('pointerdown');h.emit('pointermove',400);assert.equal(h.store.size,0);
});
test('saved height survives recreation and clamps invalid or out-of-range storage',()=>{
 for(const value of ['null','"0.8"','{}','broken'])assert.equal(harness(value).ctx.nxEdgeRatio(),.32);
 assert.equal(harness('5').ctx.nxEdgeRatio(),1);assert.equal(harness('-2').ctx.nxEdgeRatio(),0);
 const h=harness();h.ctx.nxAlignClosedGameAccess();h.emit('pointerdown');h.emit('pointermove',300);assert.match(h.ctx.wrap.style.top,/446/);
 h.emit('pointerup',300);const saved=h.store.get('nx.panel.edgePosition.v1');assert.ok(Number(saved)>.32);assert.equal(harness(saved).ctx.nxEdgeRatio(),Number(saved));
});
test('drag does not open panel, tap and keyboard click do; cancellation does not persist',()=>{
 const h=harness();h.ctx.nxAlignClosedGameAccess();h.emit('pointerdown');h.emit('pointermove',180);h.emit('pointerup',180);h.emit('click');assert.equal(h.opens(),0);
 h.emit('pointerdown');h.emit('pointerup');h.emit('click');assert.equal(h.opens(),1);
 h.emit('click',100,{detail:0});assert.equal(h.opens(),2);
 const saved=h.store.get('nx.panel.edgePosition.v1');h.emit('pointerdown');h.emit('pointermove',400);h.emit('pointercancel',400);assert.equal(h.store.get('nx.panel.edgePosition.v1'),saved);
});
test('unrelated pointers do not move or complete drag, and viewport rotation keeps handle bounded',()=>{
 const h=harness();h.emit('pointerdown');h.emit('pointermove',600,{pointerId:2});h.emit('pointerup',600,{pointerId:2});assert.equal(h.store.size,0);
 h.emit('pointerup');for(const height of [300,600,1200]){h.ctx.innerHeight=height;const top=h.ctx.nxEdgeTop(1);assert.ok(top+44<=height);assert.ok(h.ctx.nxEdgeTop(0)>=0);}
});
test('loading blocks settings access and open panel is not repositioned as a closed tab',()=>{
 const h=harness();h.busy(true);h.ctx.syncNXPlacement();assert.equal(h.ctx.wrap.style.display,'none');
 h.busy(false);h.ctx.openUI=true;h.ctx.syncNXPlacement();assert.equal(h.ctx.wrap.style.top,'0');
});

