import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Offline only: reads public source files, never connects to an Xbox service.
const directory=process.argv[2];
if(!directory){console.error('Uso: node audit.mjs DIRETORIO_DAS_FONTES');process.exit(2);}
const manifest=JSON.parse(readFileSync(fileURLToPath(new URL('./sources.json',import.meta.url)),'utf8'));
let failed=false;
const results=manifest.sources.map(source=>{
  try{
    const text=readFileSync(join(directory,source.id+'.txt'),'utf8').replace(/\r\n/g,'\n').replace(/\n*$/,'\n');
    const digest=createHash('sha256').update(text).digest('hex');
    if(digest!==source.sha256){failed=true;return {id:source.id,state:'source-mismatch'};}
    const anchors=source.anchors.map(anchor=>{
      const offset=text.indexOf(anchor);
      return {anchor,line:offset<0?null:text.slice(0,offset).split('\n').length};
    });
    if(anchors.some(anchor=>anchor.line===null))failed=true;
    return {id:source.id,commit:source.sha,sourceIntegrity:'matched',anchors};
  }catch{failed=true;return {id:source.id,state:'source-unavailable'};}
});
console.log(JSON.stringify({kind:'static-source-audit',gameplayValidated:false,results},null,2));
if(failed)process.exitCode=1;
