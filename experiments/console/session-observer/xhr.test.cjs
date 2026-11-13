'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createLab}=require('./NX-Session-Lab.user.js');
const play='https://uks.core.gssv-play-prod.xboxlive.com/v5/sessions/cloud/play';
function setup(){
 class Xhr{
  constructor(){this.listeners=new Set();this.calls=[];this.status=0;}
  open(...args){this.calls.push(['open',args]);if(args[1]==='throw')throw Error('open failed');return 'open-result';}
  send(...args){this.calls.push(['send',args]);if(this.fail)throw this.fail;return 'send-result';}
  addEventListener(type,fn){assert.equal(type,'loadend');this.listeners.add(fn);}
  removeEventListener(type,fn){this.listeners.delete(fn);}
  complete(status){this.status=status;for(const fn of [...this.listeners])fn();}
  get responseText(){throw Error('response body read');}
 }
 const env={XMLHttpRequest:Xhr,fetch:()=>Promise.resolve({status:200}),location:{href:'https://play.xbox.com/'},document:{querySelectorAll:()=>[]},setInterval:()=>1,clearInterval:()=>{}};
 return {env,lab:createLab(env),Xhr,open:Xhr.prototype.open,send:Xhr.prototype.send};
}
test('XHR preserva argumentos, retorno e captura status sem headers/corpos',()=>{
 const h=setup(),x=new h.Xhr();assert.equal(h.Xhr.prototype.open,h.open);h.lab.start();
 const secret={toString(){throw Error('body consumed');}};
 assert.equal(x.open('POST',play+'?token=SYNTHETIC_PRIVATE',true,'SYNTHETIC_USER','SYNTHETIC_PASSWORD'),'open-result');
 assert.equal(x.send(secret),'send-result');assert.equal(x.calls[1][1][0],secret);x.complete(200);
 const r=h.lab.report();assert.equal(r.events[0].transport,'xhr');assert.equal(r.events[0].status,200);assert.equal(r.events[0].descriptor.observation,'not-captured');assert.equal(r.diagnostics.observedXhrCalls,1);assert.doesNotMatch(JSON.stringify(r),/SYNTHETIC_|token=|xboxlive.com/);assert.equal(r.serverConsoleRecognition,'not-verified');
 h.lab.stop();assert.equal(h.Xhr.prototype.open,h.open);assert.equal(h.Xhr.prototype.send,h.send);assert.equal(x.listeners.size,0);
});
test('stop/restart descarta callbacks antigos e preserva wrapper concorrente',()=>{
 const h=setup();h.lab.start();const x=new h.Xhr();x.open('POST',play);x.send();const stale=[...x.listeners][0],own=h.Xhr.prototype.send;
 const other=function(...args){return Reflect.apply(own,this,args);};h.Xhr.prototype.send=other;h.lab.stop();assert.equal(h.Xhr.prototype.send,other);assert.equal(x.listeners.size,0);
 h.lab.start();x.status=403;stale();assert.equal(h.lab.report().events.length,0);h.lab.stop();
});
test('XHR reaberto, abortado e send que lança não criam falso sucesso',()=>{
 const h=setup();h.lab.start();const x=new h.Xhr();x.open('POST',play);x.send();x.open('POST',play);assert.equal(x.listeners.size,0);x.send();x.complete(0);assert.equal(h.lab.report().events[1].status,0);
 x.open('POST',play);const error=Error('synthetic');x.fail=error;assert.throws(()=>x.send(),e=>e===error);assert.equal(x.listeners.size,0);assert.equal(h.lab.report().events[2].status,'xhr-threw');
});
test('sem XHR e instalação parcial bloqueada mantêm fetch e restauram protótipo',()=>{
 const h=setup();Object.defineProperty(h.Xhr.prototype,'send',{value:h.send,writable:false});h.lab.start();assert.equal(h.lab.report().diagnostics.xhrHook,'installation-failed');assert.equal(h.Xhr.prototype.open,h.open);assert.equal(h.lab.report().running,true);h.lab.stop();
 const no=setup();delete no.env.XMLHttpRequest;no.lab.start();assert.equal(no.lab.report().diagnostics.xhrHook,'unavailable');no.lab.stop();
});
test('rastros e listeners XHR são limitados; chamadas alheias só deixam categorias',()=>{
 const h=setup();h.lab.start();const all=[];for(let i=0;i<30;i++){const x=new h.Xhr();all.push(x);x.open('POST',play);x.send();}
 assert.equal(h.lab.report().events.length,24);assert.equal(all.reduce((n,x)=>n+x.listeners.size,0),24);
 const x=new h.Xhr();x.open('GET','https://example.invalid/SYNTHETIC_PRIVATE');x.send();assert.equal(h.lab.report().diagnostics.unmatchedCategories['xhr:other:GET:other-route'],1);h.lab.stop();assert.equal(all.reduce((n,x)=>n+x.listeners.size,0),0);
});
