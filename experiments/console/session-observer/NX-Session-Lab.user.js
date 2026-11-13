// ==UserScript==
// @name         NX — Laboratório passivo de sessão (experimental)
// @namespace    https://github.com/breno-bgod/NimboXcloud/experiments
// @version      0.1.1
// @description  Observação opt-in de sessão, sem alterar identidade ou autenticação.
// @license      GPL-3.0-or-later
// @match        https://play.xbox.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(function(root){
  'use strict';
  function createLab(env){
    let running=false,epoch=0,original=null,wrapper=null,timer=null,sequence=0;
    let events=[],lastVideo=null,lastFrames=null;
    let lifecycle={state:'not-started',startAttempts:0,startedAt:null,stoppedAt:null,stopReason:null};
    let observedFetchCalls=0,mediaSampledAt=null;
    let media={liveVideo:false,decodedFramesAdvancing:false,audioTrackPresent:false};
    let manual={heardAudio:false,controlsResponded:false};
    let notify=()=>{};
    const emit=()=>{try{notify();}catch(_){}};
    function classify(input,init){
      try{
        const request=env.Request&&input instanceof env.Request;
        const url=new URL(request?input.url:String(input),env.location.href);
        if(url.protocol!=='https:'||!/(^|\.)gssv-play-prod(?:z|xhome)?\.xboxlive\.com$/i.test(url.hostname))return null;
        const method=String(init?.method||(request?input.method:'GET')).toUpperCase();
        if(method!=='POST')return null;
        let stage;
        if(/^\/v2\/login\/user\/?$/.test(url.pathname))stage='login';
        else if(/^\/v5\/sessions\/(cloud|home)\/play\/?$/.test(url.pathname))stage=url.pathname.includes('/home/')?'play-home':'play-cloud';
        else return null;
        const hostOffering=url.hostname.split('.')[0];
        const offering=stage==='login'?(['xgpuweb','xgpuwebf2p','xhome'].includes(hostOffering)?hostOffering:'other'):'not-observed';
        const headers=init?.headers!==undefined?init.headers:(request?input.headers:undefined);
        let raw=null;
        if(env.Headers&&headers instanceof env.Headers)raw=headers.get('x-ms-device-info');
        else if(Array.isArray(headers)){
          const pair=headers.find(p=>Array.isArray(p)&&typeof p[0]==='string'&&p[0].toLowerCase()==='x-ms-device-info');
          if(pair)raw=pair[1];
        }else if(headers&&typeof headers==='object'){
          const key=Object.keys(headers).find(k=>k.toLowerCase()==='x-ms-device-info');if(key)raw=headers[key];
        }
        let descriptor={present:raw!==null};
        if(raw!==null){
          if(typeof raw!=='string')descriptor.parse='invalid';
          else if(raw.length>8192)descriptor.parse='too-large';
          else try{
            const d=JSON.parse(raw),type=d?.appInfo?.env?.clientAppType,sdk=d?.dev?.hw?.sdktype??d?.dev?.hw?.sdkType;
            const os=typeof d?.dev?.os?.name==='string'?d.dev.os.name.toLowerCase():'';
            descriptor={present:true,parse:'valid',clientAppType:['browser','native'].includes(type)?type:'other',
              sdkType:['web','native'].includes(sdk)?sdk:'other',
              os:['android','ios','windows','windows 11','tizen'].includes(os)?os:os.startsWith('xbox')?'xbox-declared':'other'};
          }catch(_){descriptor.parse='invalid';}
        }
        return {stage,offering,descriptor};
      }catch(_){return null;}
    }
    function sample(){
      if(!running)return;
      mediaSampledAt=new Date().toISOString();
      try{
        const video=Array.from(env.document.querySelectorAll('video')).find(v=>v.srcObject?.getVideoTracks?.().some(t=>t.readyState==='live'));
        if(!video){lastVideo=null;lastFrames=null;media={liveVideo:false,decodedFramesAdvancing:false,audioTrackPresent:false};emit();return;}
        let frames=null;try{const value=video.getVideoPlaybackQuality?.().totalVideoFrames;if(Number.isFinite(value))frames=value;}catch(_){}
        const ready=video.readyState>=2&&video.videoWidth>0&&video.videoHeight>0&&!video.paused;
        media={liveVideo:true,decodedFramesAdvancing:!!(ready&&video===lastVideo&&frames!==null&&lastFrames!==null&&frames>lastFrames),
          audioTrackPresent:!!video.srcObject?.getAudioTracks?.().some(t=>t.readyState==='live')};
        lastVideo=video;lastFrames=frames;
      }catch(_){media={liveVideo:false,decodedFramesAdvancing:false,audioTrackPresent:false};}
      emit();
    }
    function start(){
      if(running)return;
      lifecycle.startAttempts++;
      if(typeof env.fetch!=='function'){lifecycle.state='start-failed';lifecycle.stopReason='fetch-unavailable';emit();throw Error('Fetch indisponível.');}
      running=true;lifecycle.state='observing';lifecycle.startedAt=new Date().toISOString();lifecycle.stoppedAt=null;lifecycle.stopReason=null;observedFetchCalls=0;mediaSampledAt=null;const session=++epoch;events=[];sequence=0;lastVideo=null;lastFrames=null;
      media={liveVideo:false,decodedFramesAdvancing:false,audioTrackPresent:false};manual={heardAudio:false,controlsResponded:false};
      original=env.fetch;const delegate=original;
      wrapper=function(...args){
        let item=null;
        if(running&&epoch===session){
          observedFetchCalls++;
          const info=classify(args[0],args[1]);
          if(info){
            item={request:++sequence,...info,status:'pending'};events.push(item);if(events.length>24)events.shift();
            if(info.stage.startsWith('play-')){lastVideo=null;lastFrames=null;manual={heardAudio:false,controlsResponded:false};media={liveVideo:false,decodedFramesAdvancing:false,audioTrackPresent:false};}
            emit();
          }
        }
        let result;
        try{result=Reflect.apply(delegate,this,args);}catch(error){if(item&&running&&epoch===session){item.status='fetch-threw';emit();}throw error;}
        if(item)Promise.resolve(result).then(response=>{
          if(running&&epoch===session){item.status=Number.isInteger(response?.status)?response.status:'unknown';emit();}
        },()=>{if(running&&epoch===session){item.status='network-error';emit();}});
        return result;
      };
      try{env.fetch=wrapper;if(env.fetch!==wrapper)throw Error('Fetch não substituível.');timer=env.setInterval(sample,1000);sample();emit();}
      catch(error){running=false;lifecycle.state='start-failed';lifecycle.stoppedAt=new Date().toISOString();lifecycle.stopReason='hook-installation-failed';epoch++;if(env.fetch===wrapper)env.fetch=original;if(timer!==null)env.clearInterval(timer);timer=null;emit();throw error;}
    }
    function stop(){
      if(!running)return;
      running=false;lifecycle.state='stopped';lifecycle.stoppedAt=new Date().toISOString();lifecycle.stopReason='explicit-stop';epoch++;
      if(env.fetch===wrapper)env.fetch=original;
      if(timer!==null)env.clearInterval(timer);timer=null;emit();
    }
    function report(){return JSON.parse(JSON.stringify({schema:'nx-session-observer-v1',capturedAt:new Date().toISOString(),running,events,media,
      diagnostics:{lifecycle,observedFetchCalls,recognizedRequests:sequence,fetchHook:running?(env.fetch===wrapper?'installed':'replaced-or-wrapped'):'inactive',mediaSampledAt,mediaIsHistorical:!running&&mediaSampledAt!==null},
      manualConfirmation:manual,serverConsoleRecognition:'not-verified',mediaBindingToObservedRequest:'not-verified',
      limitations:['Somente fetch observado após ativação; não cobre referências salvas, XHR, workers ou tráfego nativo.',
        'Descritor é declaração do cliente; status HTTP não comprova identidade Xbox.',
        'Trilha de áudio não comprova som audível; comandos e áudio exigem confirmação manual.',
        'Após parar, mídia e confirmações são amostras históricas; relatório exibido é um snapshot e deve ser gerado novamente.']}));}
    return {start,stop,sample,report,subscribe:fn=>{notify=typeof fn==='function'?fn:()=>{};},
      confirm:(key,value)=>{if(running&&Object.hasOwn(manual,key)){manual[key]=value===true;emit();}}};
  }
  function mount(env,lab){
    const panel=env.document.createElement('details');panel.id='nx-session-lab';
    panel.style.cssText='position:fixed;bottom:max(8px,env(safe-area-inset-bottom));right:max(8px,env(safe-area-inset-right));z-index:2147483646;max-width:min(350px,calc(100vw - 16px));max-height:75dvh;overflow:auto;background:#10161ff2;color:#edf4fc;border:1px solid #ffffff40;border-radius:12px;padding:10px;font:13px/1.45 system-ui;pointer-events:auto';
    const summary=env.document.createElement('summary');summary.textContent='Laboratório de sessão · experimental';panel.appendChild(summary);
    const status=env.document.createElement('pre');status.style.cssText='white-space:pre-wrap;font:inherit';panel.appendChild(status);
    const button=(label,action)=>{const b=env.document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:8px;margin:4px;border-radius:6px;cursor:pointer';b.addEventListener('click',action);panel.appendChild(b);return b;};
    const start=button('Iniciar observação',()=>{try{lab.start();}catch(_){status.textContent='Não foi possível ativar a observação neste navegador. Nenhuma sessão foi iniciada pelo laboratório.';}}),stop=button('Parar observação',()=>lab.stop());
    const checks=[];
    for(const [key,label]of [['heardAudio','Confirmei: ouvi áudio do jogo'],['controlsResponded','Confirmei: comandos responderam no jogo']]){
      const row=env.document.createElement('label'),check=env.document.createElement('input');check.type='checkbox';
      check.addEventListener('change',()=>lab.confirm(key,check.checked));row.appendChild(check);row.appendChild(env.document.createTextNode(label));row.style.display='block';panel.appendChild(row);checks.push([key,check]);
    }
    const output=env.document.createElement('textarea');output.readOnly=true;output.hidden=true;output.setAttribute('aria-label','Relatório sanitizado');output.style.cssText='width:95%;height:120px';
    button('Mostrar relatório',()=>{output.value=JSON.stringify(lab.report(),null,2);output.hidden=false;output.focus();output.select();});panel.appendChild(output);
    const render=()=>{
      const r=lab.report();start.disabled=r.running;stop.disabled=!r.running;
      for(const [key,check]of checks){check.disabled=!r.running;check.checked=r.manualConfirmation[key];}
      status.textContent=(r.running?'Observando':'Observação parada')+' · '+r.diagnostics.lifecycle.state+'\nChamadas fetch observadas: '+r.diagnostics.observedFetchCalls+'\nMotivo de parada: '+(r.diagnostics.lifecycle.stopReason||'nenhum')+'\nIdentidade Xbox: NÃO CONFIRMADA\n'+
        'Vídeo com trilha viva: '+(r.media.liveVideo?'sim':'não observado')+'\nQuadros avançando: '+(r.media.decodedFramesAdvancing?'sim':'não observado')+'\nTrilha de áudio: '+(r.media.audioTrackPresent?'presente':'não observada')+'\n'+
        r.events.slice(-6).map(e=>'#'+e.request+' '+e.stage+' · '+e.status+' · '+(e.descriptor.clientAppType||'descritor não observado')).join('\n');
    };
    const place=()=>{const fs=env.document.fullscreenElement||env.document.webkitFullscreenElement;
      const host=fs&&fs.tagName!=='VIDEO'?fs:(env.document.body||env.document.documentElement);
      if(panel.parentNode!==host)host.appendChild(panel);};
    lab.subscribe(render);place();render();
    env.document.addEventListener('fullscreenchange',place);env.document.addEventListener('webkitfullscreenchange',place);
  }
  if(typeof module==='object'&&module.exports){module.exports={createLab};return;}
  if(!root.document||root.NXSessionLab)return;
  root.NXSessionLab=createLab(root);mount(root,root.NXSessionLab);
})(typeof window==='undefined'?globalThis:window);
