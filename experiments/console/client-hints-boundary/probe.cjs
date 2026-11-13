'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const EXPECTED='e83cb1b50b266eaf1f8f5792e03ee24a8ed9588e27c6cb5f527b644068846880';
function loadSpoof(path){
 const source=fs.readFileSync(path,'utf8').trimEnd()+'\n';
 if(crypto.createHash('sha256').update(source).digest('hex')!==EXPECTED)throw Error('reference-hash-mismatch');
 const match=source.match(/    static spoof\(\) \{([\s\S]*)\n    \}\n\}/);
 if(!match)throw Error('reference-method-not-found');
 // Execute the actual method with its external class dependencies supplied.
 // Do not touch the process/browser navigator or create network requests.
 const script=new vm.Script('"use strict";(function(){'+match[1].replaceAll('UserAgent.#config.profile','config.profile')+'})();');
 return (navigator,profile='test-profile')=>{
  let networkCalls=0;
  const context={window:{navigator},config:{profile},UserAgentProfile:{DEFAULT:'default'},
   UserAgent:{get:()=> 'Synthetic-profile-UA'},fetch:()=>{networkCalls++;throw Error('unexpected-network');}};
  let error=null;
  try{script.runInNewContext(context,{timeout:1000});}catch(e){error=e.name==='TypeError'?'TypeError':'other';}
  return {navigator,error,networkCalls};
 };
}
function run(path){
 const spoof=loadSpoof(path),hints={platform:'Android'},prototype={};
 Object.defineProperty(prototype,'userAgent',{get:()=> 'Synthetic-original-UA',configurable:true});
 Object.defineProperty(prototype,'userAgentData',{get:()=>hints,configurable:true});
 const inherited=spoof(Object.create(prototype));
 const own=Object.create(prototype);Object.defineProperty(own,'userAgentData',{value:hints,configurable:true});const ownResult=spoof(own);
 return {schema:'client-hints-boundary-v1',sourceCommit:'ea4d19f2800cee9cfa387a0c9c37b3711cf208c7',
  inheritedProperty:{uaChanged:inherited.navigator.userAgent==='Synthetic-profile-UA',hintsHidden:inherited.navigator.userAgentData===undefined},
  existingOwnProperty:{hintsPreserved:ownResult.navigator.userAgentData===hints},
  networkCalls:inherited.networkCalls+ownResult.networkCalls,httpClientHints:'not-observed',
  serverConsoleRecognition:'not-verified',state:'controlled-simulation',
  limitations:['Synthetic navigator property layouts; no browser or server tested.','JavaScript visibility does not establish HTTP headers, tokens, session classification or authorization.']};
}
module.exports={loadSpoof,run};
if(require.main===module){if(!process.argv[2])throw Error('Pass the pinned external user-agent.ts file');console.log(JSON.stringify(run(process.argv[2]),null,2));}
