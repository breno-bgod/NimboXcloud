import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';

export function readSources(directory){
 const manifest=JSON.parse(readFileSync(new URL('./sources.json',import.meta.url),'utf8'));
 return Object.fromEntries(manifest.sources.map(source=>{
  const text=readFileSync(join(directory,source.file),'utf8').replace(/\r\n/g,'\n').replace(/\n*$/,'\n');
  if(createHash('sha256').update(text).digest('hex')!==source.sha256)throw Error('Snapshot divergente: '+source.file);
  return [source.file,text];
 }));
}

export function harness(sources,response={ok:true,status:200,json:{sessionPath:'/synthetic-session'}}){
 const calls=[];
 const root={innerWidth:1280,innerHeight:720,XC:{Log:{make:()=>({info(){},warn(){}})},Http:{
  join:(base,path)=>base.replace(/\/$/,'')+'/'+path.replace(/^\//,''),
  post:(url,body,options)=>{calls.push({url,body,options});return Promise.resolve(response);}
 }}};
 const ctx=vm.createContext({window:root});
 new vm.Script(sources['config.js']).runInContext(ctx,{timeout:100});
 new vm.Script(sources['streaming.js']).runInContext(ctx,{timeout:100});
 return {api:root.XC.Api.Stream,config:root.XC.CONFIG,calls};
}

export async function inspect(sources){
 const h=harness(sources),cases=[];
 for(const settings of [undefined,{osName:'windows'},{osName:'android'}]){
  await h.api.play({baseUri:'https://example.invalid'},'SYNTHETIC_UNUSABLE_TOKEN','synthetic-title',settings);
  const call=h.calls.at(-1),descriptor=JSON.parse(call.options.headers['X-MS-Device-Info']);
  cases.push({requestedOs:call.body.settings.osName,sessionSdk:call.body.settings.sdkType,
   declaredOs:descriptor.dev.os.name,declaredAppType:descriptor.appInfo.env.clientAppType,
   declaredSdk:descriptor.dev.hw.sdktype,declaredModel:descriptor.dev.hw.model,
   osFieldsEqual:call.body.settings.osName===descriptor.dev.os.name});
 }
 return {kind:'real-source-offline-request-construction',backendSimulated:true,
  configuredOffering:h.config.GSSV_OFFERING,cases,
  widgetPolicyDeclared:{externalAccess:/<access\s+origin="\*"/.test(sources['config.xml']),
   internetPrivilege:sources['config.xml'].includes('http://tizen.org/privilege/internet')},
  networkExecuted:false,serverClientClassification:'not-observed',browserCorsValidated:false,gameplayValidated:false};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{if(!process.argv[2])throw Error('Informe diretório dos snapshots públicos.');
  console.log(JSON.stringify(await inspect(readSources(process.argv[2])),null,2));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
