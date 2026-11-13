import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Modelo offline de paginação. Não chama APIs, resolve direitos ou inicia jogos.
export function inspectPages(pages,follow=true){
  const ids=new Set(),seen=new Set();
  if(!Array.isArray(pages)||!pages.length)return {ids:[],complete:false,reason:'missing-page',pagesRead:0};
  let read=0;
  const result=(complete,reason)=>({ids:[...ids].sort(),complete,reason,pagesRead:read});
  for(const page of pages){
    if(read>=50)return result(false,'page-limit');
    read++;
    if(!page||!Array.isArray(page.results))return result(false,'invalid-page');
    for(const entry of page.results){
      if(typeof entry?.titleId!=='string'||!entry.titleId.trim())return result(false,'invalid-title');
      ids.add(entry.titleId.trim());
    }
    const token=page.continuationToken;
    if(token===undefined||token===null||token==='')return result(true,'end');
    if(typeof token!=='string')return result(false,'invalid-continuation');
    if(!follow)return result(false,'single-page');
    if(seen.has(token))return result(false,'repeated-continuation');
    seen.add(token);
    if(!page.results.length)return result(false,'empty-page-with-continuation');
  }
  return result(false,'missing-next-page');
}

export function compareFixture(pages){
  const single=inspectPages(pages,false),followed=inspectPages(pages,true);
  return {kind:'offline-pagination-model',fixtureOrigin:'synthetic',gameplayValidated:false,
    single,followed,extraIdsInSuppliedPages:followed.ids.filter(id=>!single.ids.includes(id)),
    conclusion:'Resultados de catálogo não comprovam autorização ou execução de jogos.'};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(!process.argv[2]){console.error('Uso: node probe.mjs FIXTURE_JSON');process.exitCode=2;}
  else try{console.log(JSON.stringify(compareFixture(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2));}
  catch{console.error('Fixture ausente ou JSON inválido.');process.exitCode=1;}
}
