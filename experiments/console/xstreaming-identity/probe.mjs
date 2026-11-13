import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';

// Executa somente a construção local do objeto payload, nunca o método de autenticação.
export function payloadFrom(source,method,endMarker,context){
  const methodAt=source.indexOf(method);
  const start=source.indexOf('const payload = {',methodAt);
  const end=source.indexOf(endMarker,start);
  if(methodAt<0||start<methodAt||end<start)throw Error('Estrutura do snapshot mudou; revisar o extrator.');
  const sandbox=vm.createContext({...context});
  new vm.Script(source.slice(start,end)+'\nglobalThis.extracted=payload;').runInContext(sandbox,{timeout:100});
  return JSON.parse(JSON.stringify(sandbox.extracted));
}

export function inspect(xal,msal){
  const context={userTokenValue:'SYNTHETIC_USER',userToken:'SYNTHETIC_USER',relyingParty:'http://gssv.xboxlive.com/',
    sisuToken:{data:{DeviceToken:'SYNTHETIC_DEVICE',TitleToken:{Token:'SYNTHETIC_TITLE'}}}};
  const legacy=payloadFrom(xal,'  doXstsAuthorization(',"      const body =",context);
  const modern=payloadFrom(msal,'  async doXstsAuthorization(',"      const url =",context);
  const device=payloadFrom(xal,'  getDeviceToken():',"      const body =",{XalManager:{nextUUID:()=> 'synthetic-id',getKeyX:()=> 'synthetic-x',getKeyY:()=> 'synthetic-y'}});
  const summarize=p=>({propertyNames:Object.keys(p.Properties).sort(),
    deviceTokenPresent:Object.hasOwn(p.Properties,'DeviceToken'),titleTokenPresent:Object.hasOwn(p.Properties,'TitleToken'),
    userTokenCount:Array.isArray(p.Properties.UserTokens)?p.Properties.UserTokens.length:0});
  return {kind:'isolated-payload-construction',input:'public-pinned-source-and-synthetic-values',
    deviceTypeDeclared:device.Properties.DeviceType,legacy:summarize(legacy),msal:summarize(modern),
    networkExecuted:false,serverConsoleRecognitionValidated:false};
}

export function readSources(directory){
  const manifest=JSON.parse(readFileSync(new URL('./sources.json',import.meta.url),'utf8'));
  return manifest.sources.map(source=>{
    const text=readFileSync(join(directory,source.file),'utf8').replace(/\r\n/g,'\n').replace(/\n*$/,'\n');
    if(createHash('sha256').update(text).digest('hex')!==source.sha256)throw Error('Snapshot diferente: '+source.file);
    return text;
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{if(!process.argv[2])throw Error('Informe diretório das fontes públicas.');
    console.log(JSON.stringify(inspect(...readSources(process.argv[2])),null,2));
  }catch(e){console.error(e.message);process.exitCode=1;}
}
