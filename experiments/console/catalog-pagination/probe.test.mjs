import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPages,compareFixture} from './probe.mjs';

test('jogo na segunda página falta no modelo de leitura única sem alterar direitos',()=>{
 const pages=[{results:[{titleId:'a'}],continuationToken:'next'},{results:[{titleId:'b'}]}];
 const result=compareFixture(pages);
 assert.deepEqual(result.extraIdsInSuppliedPages,['b']);
 assert.equal(result.single.complete,false);assert.equal(result.followed.complete,true);
 assert.equal(result.gameplayValidated,false);
});
test('resposta sem paginação não cria diferença entre estratégias',()=>{
 const result=compareFixture([{results:[{titleId:'a'}]}]);
 assert.deepEqual(result.single.ids,result.followed.ids);assert.deepEqual(result.extraIdsInSuppliedPages,[]);
 assert.equal(result.single.complete,true);
});
test('página seguinte ausente ou vazia com cursor nunca é tratada como catálogo completo',()=>{
 assert.equal(inspectPages([{results:[{titleId:'a'}],continuationToken:'n'}]).reason,'missing-next-page');
 const empty=inspectPages([{results:[],continuationToken:'n'}]);assert.equal(empty.complete,false);assert.equal(empty.reason,'empty-page-with-continuation');
});
test('cursor repetido, ciclo e limite de páginas interrompem sem falso sucesso',()=>{
 const page=n=>({results:[{titleId:String(n)}],continuationToken:String(n)});
 assert.equal(inspectPages([page(1),page(1)]).reason,'repeated-continuation');
 assert.equal(inspectPages([page(1),page(2),page(1)]).complete,false);
 const capped=inspectPages(Array.from({length:51},(_,i)=>page(i)));
 assert.equal(capped.reason,'page-limit');assert.equal(capped.pagesRead,50);
});
test('dados malformados e duplicados não produzem título inventado nem completude falsa',()=>{
 for(const pages of [null,[],[{}],[{results:[{}]}],[{results:[],continuationToken:2}]])assert.equal(inspectPages(pages).complete,false);
 const result=inspectPages([{results:[{titleId:'a'},{titleId:'a'}]}]);assert.deepEqual(result.ids,['a']);assert.equal(result.complete,true);
});
