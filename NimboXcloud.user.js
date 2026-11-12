// ==UserScript==
// @name         NimboXcloud | Região, Streaming e Diagnóstico
// @namespace    https://github.com/breno-bgod/NimboXcloud
// @version      4.12.72
// @description  NimboXcloud: streaming, painel NX, diagnóstico e NimboTouch integrado (HUD editável, teclado/mouse virtual, macros e compensação opcional de recoil).
// @author       KReight
// @license      MIT
// @match        https://play.xbox.com/*
// @run-at       document-start
// @grant        none
// @require      https://raw.githubusercontent.com/breno-bgod/NimboXcloud/main/modules/NimboXcloud-Touch-HUD.user.js?nx_version=4.12.72
// @supportURL   https://github.com/breno-bgod/NimboXcloud/issues
// @updateURL    https://raw.githubusercontent.com/breno-bgod/NimboXcloud/main/NimboXcloud.user.js
// @downloadURL  https://raw.githubusercontent.com/breno-bgod/NimboXcloud/main/NimboXcloud.user.js
// ==/UserScript==

/*
 * Funcionalidades
 *   1. Desbloqueio de região: reescreve a resposta de experimentation de gears / xboxcomfd
 *      (trafficFilters.territory, market) e ajusta o cookie territory para a região escolhida,
 *      evitando que a página de reprodução classifique o IP de saída atual como "mercado não suportado".
 *   2. Link de streaming: permite fixar o data center (reescreve isDefault e a ordem de
 *      offeringSettings.regions), remove candidatos IPv6 do ICE (força IPv4) e escolhe a faixa
 *      de qualidade conforme settings.osName, com HQ como padrao independente da tela.
 *   3. Medidor de status: um único botão com o ícone NX (ao lado do controle, no topo da
 *      biblioteca; flutuante durante a partida) mostra a perda de pacotes em tempo real;
 *      ao expandir, mostra RTT / taxa de bits / resolução / quadros descartados e permite
 *      alterar as configurações acima.
 *
 * Como funciona
 *   A própria página faz estas requisições; o script apenas reescreve respostas e corpos de
 *   requisição na camada fetch / XHR, sem modificar o código da página:
 *     GET  gears.xboxservices.com/.../experimentation            → define marketAccessContext.physicalMarket
 *     POST cloudgaming.gssv-play-*.xboxlive.com/v2/login/user    → define os data centers de streaming disponíveis
 *     POST <dc>.core.gssv-play-*.xboxlive.com/v5/sessions/cloud/play → cria a sessão
 *     GET  <dc>.core.../configuration, /ice                      → endereço do servidor de mídia e candidatos ICE
 *
 * Privacidade
 *   · Todas as reescritas acontecem no navegador local; o script não envia nenhum dado para fora.
 *   · O "Copiar relatório" do painel contém apenas versão, configuração de região, estatísticas
 *     do link e mensagens de erro recentes; não inclui conteúdo da página, corpos de resposta
 *     da API nem informações de conta.
 *
 * Autoria e licenciamento
 *   · Desenvolvimento e manutenção do NimboXcloud: KReight.
 *   · Base derivada de RoyLiu04/xbox-cloud-unlock (MIT); copyright e licença
 *     originais preservados no arquivo LICENSE deste repositório.
 *
 * Projetos de referência
 *   · redphx/better-xcloud — https://github.com/redphx/better-xcloud
 *     (reescrita da ordem de regions, faixas de qualidade por osName, disfarce de dispositivo
 *      x-ms-device-info, método de interceptação do gssv)
 *   · darkchaox/xbox-cloud-gaming-optimizer — https://github.com/darkchaox/xbox-cloud-gaming-optimizer
 *     (ideia de desbloqueio de região em versões antigas da página; este projeto partiu daí)
 *
 * Aviso legal
 *   Apenas para estudo e pesquisa. Contornar restrições regionais pode violar os termos de
 *   serviço; o uso é por conta e risco do usuário.
 */

(function () {
  'use strict';

  if (window.__XCU__) return;

  const VER = '4.12.72';
  const LS_KEY = 'xcu.region';       // região de desbloqueio (IP)
  const LS_SRV = 'xcu.streamRegion'; // data center de streaming
  const LS_V4 = 'xcu.forceIPv4';     // forçar IPv4
  const LS_RES = 'xcu.resolution';   // faixa de qualidade
  const LS_BITRATE = 'xcu.maxBitrateMbps'; // limite opcional de bitrate SDP
  const LS_VOLUME = 'xcu.volume'; // volume local do elemento de video
  const LS_AUTO_BEST = 'xcu.autoBestMeasured';
  const LS_NX_DIAG = 'xcu.diagnostics';
  const LS_DEVICE_PROFILE = 'xcu.deviceProfile';
  const LS_CONSOLE_LAB = 'xcu.consoleLab.profile.v1';
  const LS_CONSOLE_NOTES = 'xcu.consoleLab.notes.v1';
  const LS_FORTNITE_CONSOLE = 'nx.fortnite.consoleExperience.v1';
  const nxFortniteConsoleEnabled = (function () { try { return localStorage.getItem(LS_FORTNITE_CONSOLE) === '1'; } catch (_) { return false; } })();
  const nxFortniteConsoleState = { enabled: nxFortniteConsoleEnabled, matched: false, inspected: 0, patched: 0, previousTouch: null, note: 'Experimental: sinalização de toque na configuração da sessão; não emula hardware Xbox.' };
  function nxIsFortniteRoute() { return /(?:^|\/)(?:fortnite)(?:\/|$)/i.test(location.pathname); }

  const LS_NX_SHORTCUT = 'xcu.nxShortcut';
  const LS_RTT_HISTORY = 'xcu.rttHistory.v1';
  const LS_VIBRATION = 'xcu.vibrationLevel';
  const LS_MIC_ENABLED = 'xcu.microphoneDesired';
  const LS_MIC_DEVICE = 'xcu.micDevice';
  const LS_MIC_GAIN = 'xcu.micGain';
  const LS_MIC_BASS = 'xcu.micBass';
  const LS_MIC_TREBLE = 'xcu.micTreble';
  const LS_MIC_NOISE = 'xcu.micNoise';
  const LS_MIC_ECHO = 'xcu.micEcho';
  const LS_MIC_AGC = 'xcu.micAgc';
  const LS_MIC_MUTE = 'xcu.micMute';
  const LS_MIC_PTT = 'xcu.micPtt';
  const LS_MIC_GATE = 'xcu.micGate';
  const LS_AUDIO_OUTPUT = 'xcu.audioOutput';
  const LS_AUDIO_BASS = 'xcu.audioBass';
  const LS_AUDIO_MID = 'xcu.audioMid';
  const LS_AUDIO_TREBLE = 'xcu.audioTreble';
  const LS_AUDIO_COMP = 'xcu.audioCompressor';
  const LS_AUDIO_FX = 'xcu.audioFx';
  const LS_AUDIO_BANDS = 'xcu.audioBands10';
  const LS_AUDIO_PRESET = 'xcu.audioPreset';
  const LS_AUDIO_LIMIT = 'xcu.audioLimit';
  const LS_AUDIO_NORMAL = 'xcu.audioNormal';
  const LS_AUDIO_DIALOG = 'xcu.audioDialog';
  const LS_AUDIO_MONO = 'xcu.audioMono';
  const LS_AUDIO_BALANCE = 'xcu.audioBalance';
  const LS_SHARPNESS = 'xcu.sharpness';
  const LS_VIDEO_COLOR = 'xcu.videoColor';
  const LS_VIDEO_PROFILE = 'xcu.videoProfile.v1';
  const LS_VIDEO_FIT = 'xcu.videoFit.v1';
  const LS_VIDEO_ECO = 'xcu.videoEco.v1';
  const LS_VIDEO_BRIGHTNESS='xcu.videoBrightness.v2';
  const LS_VIDEO_CONTRAST='xcu.videoContrast.v2';
  const LS_VIDEO_SATURATION='xcu.videoSaturation.v2';
  const LS_VISUAL_LIBRARY='nx.visual.library.v1';
  const LS_VISUAL_ACTIVE='nx.visual.active.v1';
  const LS_NX_GPU='nx.visual.gpu.v1';
  const LS_NX_SHADOWS='nx.visual.shadows.v1';
  const LS_NX_HIGHLIGHTS='nx.visual.highlights.v1';

  // Laboratório Xbox: experimental, desativado por padrão. Apenas identidade JS local;
  // não altera cabeçalhos HTTP, autenticação, tokens, gamepad ou autorização do servidor.
  const nxConsoleNativeUA = navigator.userAgent;
  const nxConsoleLabProfile = (function () {
    try { const p = localStorage.getItem(LS_CONSOLE_LAB) || 'off';
      // Xbox One / Series permanecem no código para pesquisa futura, mas estão suspensos.
      // Sessões antigas migram para o perfil genérico sem expor seletores específicos.
      if (p === 'xboxone' || p === 'xboxseries' || p === 'xbox') { localStorage.setItem(LS_CONSOLE_LAB, 'off'); return 'off'; }
      // Smart TV foi descontinuado: voltar à identificação nativa automática.
      if (p === 'smarttv') { localStorage.setItem(LS_CONSOLE_LAB, 'off'); return 'off'; }
      return ['off','android','windows'].includes(p) ? p : 'off'; }
    catch (_) { return 'off'; }
  })();
  const nxConsoleLabState = { profile: nxConsoleLabProfile, applied: false, error: '', nativeUA: nxConsoleNativeUA, startedAt: new Date().toISOString() };
  // Compatibilidade conservadora: perfis Xbox/TV não falsificam UA.
  // A interface mantém o perfil escolhido, mas o navegador negocia como dispositivo real.
  const nxCompatibilityProfiles = ['xbox', 'xboxone', 'xboxseries'];
  const nxCompatibilityMode = nxCompatibilityProfiles.includes(nxConsoleLabProfile);
  nxConsoleLabState.identityMode = nxCompatibilityMode ? 'native-compatible' : 'legacy-profile';
  nxConsoleLabState.applied = false; // Seleção não comprova identidade Xbox.
  if (nxCompatibilityMode) {
    nxConsoleLabState.note = 'Perfil de experiência ativo; identidade nativa preservada para compatibilidade de sessão';
  } else if (nxConsoleLabProfile !== 'off') {
    try {
      // Nunca mascarar a identidade real do navegador: mobile deve permanecer mobile.
      // A seleção é preferência de interface, não um spoof de User-Agent.
      nxConsoleLabState.applied = false;
    } catch (err) { nxConsoleLabState.error = String(err && err.message || err); }
  }
  // Perfil central de experiência: apenas ajustes suportados pelo userscript.
  // A seleção não altera TLS, headers UA/CH nativos, hardware nem permissões do xCloud.
  const nxPlatformProfile = Object.freeze({
    off: { label: 'Automático', sessionOs: null, input: 'native' },
    android: { label: 'Android Mobile', sessionOs: 'android', input: 'touch-preferred' },
    windows: { label: 'Desktop', sessionOs: 'windows', input: 'keyboard-mouse-preferred' },
    smarttv: { label: 'Smart TV compatível', sessionOs: null, input: 'gamepad-preferred' },
    xbox: { label: 'Xbox compatível (experimental)', sessionOs: null, input: 'gamepad-preferred' },
    xboxone: { label: 'Xbox One compatível (experimental)', sessionOs: null, input: 'gamepad-preferred' },
    xboxseries: { label: 'Xbox Series X|S compatível (experimental)', sessionOs: null, input: 'gamepad-preferred' }
  }[nxConsoleLabProfile]);
  const nxProfileSessionState = { attempted: 0, patched: 0, lastRequestedOs: null, lastOutcome: 'not-observed' };
  // Diagnóstico passivo inspirado no XFly: não lê tokens, payloads ou identificadores.
  const nxSessionTrace = [];
  function nxSessionHealth() {
    const attempts = nxSessionTrace.filter(function (x) { return x.stage === 'play'; });
    const last = attempts.length ? attempts[attempts.length - 1] : null;
    const lastAny = nxSessionTrace.length ? nxSessionTrace[nxSessionTrace.length - 1] : null;
    const q = typeof S !== 'undefined' ? S.qos : null;
    if (q && (q.decodedFps > 0 || q.fps > 0)) return { state: 'streaming', explanation: 'Quadros de vídeo observados no WebRTC' };
    if (!last) return { state: 'not-observed', explanation: 'Nenhuma tentativa de criação de sessão capturada; verificar se o jogo foi iniciado' };
    if (last.status === 0) return { state: 'network-error', explanation: 'Falha de rede ao criar a sessão' };
    if (last.status === 401 || last.status === 403) return { state: 'access-rejected', explanation: 'Servidor rejeitou a requisição; causa não determinada' };
    if (last.status === 429) return { state: 'rate-limited', explanation: 'Servidor limitou as requisições; evitar tentativas repetidas' };
    if (last.status >= 500) return { state: 'server-error', explanation: 'Erro HTTP no servidor durante criação de sessão' };
    if (last.status >= 400) return { state: 'request-rejected', explanation: 'Criação de sessão rejeitada com HTTP ' + last.status };
    if (last.status >= 200 && last.status < 300) return { state: 'session-accepted', explanation: 'Criação de sessão aceita; última etapa: ' + (lastAny ? lastAny.stage : 'play') + '. Não comprova reprodução de vídeo' };
    return { state: 'pending', explanation: 'Tentativa sem resultado conclusivo' };
  }
  function nxSessionRecord(item) {
    nxSessionTrace.push(item);
    if (nxSessionTrace.length > 35) nxSessionTrace.shift();
  }
  const nxClientHintsMode = (function () {
    try { return localStorage.getItem('nx.consoleLab.hideClientHints.v1') === '1'; } catch (_) { return false; }
  })();
  let nxClientHintsApplied = false;
  if (nxClientHintsMode && nxConsoleLabProfile !== 'off' && !nxCompatibilityMode) {
    try {
      Object.defineProperty(navigator, 'userAgentData', { configurable: true, get: function () { return undefined; } });
      nxClientHintsApplied = typeof navigator.userAgentData === 'undefined';
    } catch (err) { nxConsoleLabState.error += ' ClientHints: ' + String(err && err.message || err); }
  }
  const nxConsoleLabEvents = [];
  function nxConsoleLabEvent(type, detail) {
    const entry = { time: new Date().toISOString(), type: type, detail: String(detail || '').slice(0, 180) };
    if (nxConsoleLabEvents.length && nxConsoleLabEvents[nxConsoleLabEvents.length - 1].type === type &&
        nxConsoleLabEvents[nxConsoleLabEvents.length - 1].detail === entry.detail) return;
    nxConsoleLabEvents.push(entry);
    if (nxConsoleLabEvents.length > 35) nxConsoleLabEvents.shift();
  }
  const nxConsoleLabWarnings = [
    'não há suporte para streaming nesse dispositivo',
    'nao ha suporte para streaming nesse dispositivo',
    'streaming is not supported on this device',
    'device is not supported for streaming'
  ];
  function nxConsoleLabWarning() {
    // Detecta avisos visíveis mesmo quando a interface não usa ARIA dialog.
    const nodes = document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="alert"], dialog, h1, h2, h3, p');
    for (const node of nodes) {
      if (node.childElementCount > 4 || node.closest('[id^="nx-"]')) continue;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) continue;
      const value = (node.textContent || '').toLowerCase().replace(/\s+/g, ' ').slice(0, 350);
      if (nxConsoleLabWarnings.some(function (w) { return value.includes(w); })) return true;
    }
    return false;
  }
  // Read-only probe: inspect only the own-property descriptor; never invoke the page hook.
  // A missing property in this window does not prove that the page runtime lacks the hook.
  function nxTouchAdaptationHookSnapshot(scope) {
    const base = { hook: 'testTouchLayout', scope: 'window-own-property', state: 'not-visible-in-userscript-context', callable: false, invoked: false };
    if (!scope || (typeof scope !== 'object' && typeof scope !== 'function')) {
      return Object.assign({}, base, { state: 'scope-unavailable' });
    }
    try {
      const descriptor = Object.getOwnPropertyDescriptor(scope, 'testTouchLayout');
      if (!descriptor) return base;
      if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        return Object.assign({}, base, { state: 'accessor-not-inspected' });
      }
      if (typeof descriptor.value !== 'function') {
        return Object.assign({}, base, { state: 'property-not-function' });
      }
      return Object.assign({}, base, { state: 'function-visible', callable: true });
    } catch (_) {
      return Object.assign({}, base, { state: 'inspection-error' });
    }
  }
  function nxConsoleLabCapabilities() {
    let codecs = null;
    try { codecs = typeof RTCRtpReceiver !== 'undefined' && RTCRtpReceiver.getCapabilities ?
      RTCRtpReceiver.getCapabilities('video').codecs.map(function (c) { return c.mimeType; }).filter(function (v,i,a) { return a.indexOf(v) === i; }) : null; } catch (_) {}
    let mse = null;
    try { mse = typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"'); } catch (_) {}
    return {
      secureContext: window.isSecureContext, webRTC: typeof RTCPeerConnection === 'function',
      mediaSourceH264: mse, webCodecs: typeof VideoDecoder !== 'undefined',
      videoCodecs: codecs, touchPoints: navigator.maxTouchPoints || 0,
      pointerFine: !!(window.matchMedia && matchMedia('(any-pointer:fine)').matches),
      fullscreenSupported: !!document.fullscreenEnabled,
      userAgentDataPlatform: navigator.userAgentData ? navigator.userAgentData.platform : null,
      identityConsistency: { uaContainsXboxOne: navigator.userAgent.includes('Xbox One'), uaContainsXbox: navigator.userAgent.includes('Xbox;'), platformReportsWindows: /Win/.test(navigator.platform || ''), clientHintsPlatform: navigator.userAgentData ? navigator.userAgentData.platform : null },
      platform: navigator.platform || null, language: navigator.language || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      mediaDevices: !!navigator.mediaDevices, mediaCapabilities: !!navigator.mediaCapabilities,
      h264Decode: document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"'),
      screen: {width: screen.width, height: screen.height, dpr: devicePixelRatio},
      gamepadAPI: typeof navigator.getGamepads === 'function',
      touchLayoutTestHook: nxTouchAdaptationHookSnapshot(window)
    };
  }
  function nxConsoleLabFullScreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) Promise.resolve(exit.call(document)).catch(function (e) { nxConsoleLabEvent('fullscreen-error', e.message); });
      return;
    }
    // A página inteira mantém controles e diálogos visíveis; não força orientação nem imita Xbox OS.
    const target = document.documentElement;
    const request = target.requestFullscreen || target.webkitRequestFullscreen;
    if (!request) { nxConsoleLabEvent('fullscreen-unavailable', 'Fullscreen API indisponível'); toast('Tela cheia indisponível neste navegador'); return; }
    try { Promise.resolve(request.call(target)).then(function () { nxConsoleLabEvent('fullscreen', 'ativado'); if (nxCompatibilityMode && screen.orientation && screen.orientation.lock) Promise.resolve(screen.orientation.lock('landscape')).catch(function (e) { nxConsoleLabEvent('orientation-lock-unavailable', String(e && e.message || e)); }); }).catch(function (e) { nxConsoleLabEvent('fullscreen-error', e.message); toast('Navegador bloqueou tela cheia'); }); }
    catch (e) { nxConsoleLabEvent('fullscreen-error', e.message); toast('Navegador bloqueou tela cheia'); }
  }
  // Diagnóstico passivo: sem acesso a tokens, corpo ou headers.
  const nxOfferingTrace = [];
  function nxObserveOffering(u, method, promise) {
    if (!u || !/^[a-z0-9-]+\.gssv-play-prod[z]?\.xboxlive\.com$/i.test(u.hostname) || !/^\/v2\/login\/user\/?$/i.test(u.pathname)) return promise;
    const offering = u.hostname.split('.')[0].toLowerCase(), started = Date.now();
    return promise.then(function (res) {
      nxOfferingTrace.push({at:new Date().toISOString(),offering:offering,method:method,status:res.status,elapsedMs:Date.now()-started});
      if (nxOfferingTrace.length > 24) nxOfferingTrace.shift();
      return res;
    }, function (err) {
      nxOfferingTrace.push({at:new Date().toISOString(),offering:offering,method:method,status:0,reason:err && err.name === 'AbortError' ? 'cancelled' : 'network-error'});
      if (nxOfferingTrace.length > 24) nxOfferingTrace.shift();
      throw err;
    });
  }
  function nxCompatibilityVerdict() {
    const health = nxSessionHealth();
    const video = typeof activeStreamVideo === 'function' ? activeStreamVideo() : null;
    const playing = !!(video && video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2 && !video.paused);
    const offers = Array.from(new Set(nxOfferingTrace.map(function (e) { return e.offering; })));
    let state = 'waiting', label = 'Aguardando teste', detail = 'Inicie um jogo para avaliar a conexão.';
    if (playing || health.state === 'streaming') {
      state = 'streaming'; label = 'Streaming observado';
      detail = 'Vídeo detectado. Isso não comprova autorização como console.';
    } else if (['access-rejected','request-rejected','network-error','rate-limited','server-error'].includes(health.state)) {
      state = 'failed'; label = 'Falha detectada'; detail = health.explanation;
    } else if (health.state === 'session-accepted') {
      state = 'accepted'; label = 'Sessão aceita'; detail = 'Aguardando evidência de vídeo reproduzido.';
    } else if (health.state === 'pending') {
      state = 'pending'; label = 'Conexão iniciada'; detail = health.explanation;
    }
    return {state:state,label:label,detail:detail,consoleCompatibility:'não comprovada',offerings:offers,
      sessionState:health.state,videoPlaying:playing,observedAt:new Date().toISOString()};
  }
  // Matriz de evidências: separa observação local, modificação e confirmação remota.
  function nxProtocolEvidence() {
    const nav = navigator, hints = nav.userAgentData || null;
    const safeHints = hints ? {brands:Array.isArray(hints.brands) ? hints.brands.map(function(b){return {brand:String(b.brand).slice(0,60),version:String(b.version).slice(0,20)};}) : [],
      mobile:typeof hints.mobile === 'boolean' ? hints.mobile : null,platform:hints.platform || null} : null;
    const offer = nxOfferingTrace.length ? nxOfferingTrace[nxOfferingTrace.length-1] : null;
    const play = nxSessionTrace.filter(function(x){return x.stage==='play';}).slice(-1)[0] || null;
    const video = typeof activeStreamVideo === 'function' ? activeStreamVideo() : null;
    return {
      schema:'nx-protocol-evidence-v1',
      observed:{
        javascriptIdentity:{userAgent:nav.userAgent,platform:nav.platform || null,vendor:nav.vendor || null,
          clientHints:safeHints,maxTouchPoints:nav.maxTouchPoints || 0,language:nav.language || null},
        capabilities:{webRTC:typeof RTCPeerConnection === 'function',gamepadAPI:typeof nav.getGamepads === 'function',
          videoDecoder:typeof VideoDecoder !== 'undefined',secureContext:!!window.isSecureContext,
          touchLayoutTestHook:nxTouchAdaptationHookSnapshot(window)},
        authOffering:offer ? {hostOffering:offer.offering,status:offer.status,at:offer.at} : null,
        sessionPlay:play ? {status:play.status,method:play.method,at:play.time,elapsedMs:play.ms} : null,
        video:video ? {readyState:video.readyState,width:video.videoWidth,height:video.videoHeight,paused:video.paused} : null
      },
      configured:{profile:nxConsoleLabProfile,identityMode:nxConsoleLabState.identityMode,
        jsUserAgentChanged:nav.userAgent !== nxConsoleNativeUA,sessionOsRewriteDisabled:nxCompatibilityMode},
      notObservableFromUserscript:[
        'HTTP User-Agent e Sec-CH-UA realmente transmitidos pelo navegador',
        'TLS ClientHello e fingerprint de rede',
        'Identidade do hardware/firmware Xbox validada pelo servidor',
        'Reconhecimento ou autorização de catálogo exclusivo de console'
      ],
      limitations:'Um nome de modelo ou User-Agent JavaScript nao equivale a identidade de hardware; verificar headers efetivos no DevTools.'
    };
  }
  // Referências de hardware não verificadas; preserva autenticação e capacidades nativas.
  const nxConsoleProfileManifest = Object.freeze({
    xboxone: Object.freeze({id:'xboxone',label:'Xbox One',referenceVerified:false}),
    xboxseries: Object.freeze({id:'xboxseries',label:'Xbox Series X|S',referenceVerified:false})
  });
  function nxConsoleProfileValidation() {
    const manifest=nxConsoleProfileManifest[nxConsoleLabProfile] || null;
    const evidence=nxProtocolEvidence();
    const js=evidence.observed.javascriptIdentity;
    const native=js.userAgent===nxConsoleNativeUA;
    return {
      selected:nxConsoleLabProfile,manifest:manifest,
      state:manifest ? (native?'selected-native-preserved':'modified-unverified') : (nxConsoleLabProfile==='off'?'off':'other-profile'),
      identity:{jsUserAgentChanged:!native,platform:js.platform,clientHintsPlatform:js.clientHints?js.clientHints.platform:null,touchPoints:js.maxTouchPoints},
      layers:{javascript:native?'native-preserved':'modified-local',httpHeaders:'not-observable',
        deviceCapabilities:'native-preserved',input:'native-preserved',session:nxSessionHealth().state,consoleAuthorization:'not-verified'},
      warningsObserved:nxConsoleLabEvents.filter(function(e){return e.type==='unsupported-device-warning';}).length,
      note:'Perfil nao comprova identidade Xbox. HTTP e TLS requerem verificacao externa.'
    };
  }
  function nxConsoleLabReport() {
    const video = typeof activeStreamVideo === 'function' ? activeStreamVideo() : null;
    const note = (function () { try { return localStorage.getItem(LS_CONSOLE_NOTES) || ''; } catch (_) { return ''; } })();
    return {
      version: VER, experiment: 'console-compatibility', profile: nxConsoleLabState.profile,
      applied: nxConsoleLabState.applied, error: nxConsoleLabState.error,
      nativeUserAgent: nxConsoleLabState.nativeUA, pageUserAgent: navigator.userAgent,
      note: note.slice(0, 500), startedAt: nxConsoleLabState.startedAt,
      unsupportedDeviceDialogDetected: nxConsoleLabWarning(),
      unsupportedDeviceWarningsObserved: nxConsoleLabEvents.filter(function (e) { return e.type === 'unsupported-device-warning'; }).length,
      platformExperience: nxPlatformProfile, profileSession: Object.assign({}, nxProfileSessionState),
       compatibility: { enabled: nxCompatibilityMode, identityMode: nxConsoleLabState.identityMode, nativeUserAgentPreserved: navigator.userAgent === nxConsoleNativeUA, sessionOsRewriteDisabled: nxCompatibilityMode, clientHintsOverrideDisabled: nxCompatibilityMode },
       clientHintsExperiment: { enabled: nxClientHintsMode, applied: nxClientHintsApplied, note: 'Somente navigator.userAgentData JS; nao altera cabecalhos HTTP' },
      protocolEvidence: nxProtocolEvidence(), consoleProfileValidation: nxConsoleProfileValidation(),
      fortniteConsoleExperience: Object.assign({}, nxFortniteConsoleState),
      offeringTrace: nxOfferingTrace.slice(), offeringTraceNotice: 'Somente host, metodo, status e duracao; sem credenciais.',
       sessionTrace: nxSessionTrace.slice(),
      sessionHealth: nxSessionHealth(), compatibilityVerdict: nxCompatibilityVerdict(),
      capabilities: nxConsoleLabCapabilities(),
      events: nxConsoleLabEvents.slice(),
      fullscreenActive: !!(document.fullscreenElement || document.webkitFullscreenElement),
      capturedAt: new Date().toISOString(), page: location.origin + location.pathname,
      touchPoints: navigator.maxTouchPoints || 0, controllerCount: navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean).length : null,
      videoPresent: !!video, videoReadyState: video ? video.readyState : null,
      videoWidth: video ? video.videoWidth : null, videoHeight: video ? video.videoHeight : null,
      noteOnLimits: 'User-Agent JS nao altera headers de rede nem prova autorizacao de console.'
    };
  }
  function nxConsoleLabSetProfile(profile) {
    if (!['off','android','windows'].includes(profile)) return;
    try { localStorage.setItem(LS_CONSOLE_LAB, profile); } catch (_) {}
    // Reiniciar a página é necessário para negociar desde o document-start.
    location.reload();
  }

  // Ícone da marca (caveira N em chamas, branco, fundo transparente). Usado pelo único botão do NX.
  const BRAND_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAnTUlEQVR42u1de5gkVXX/3erumWXZZR+4LAqKiCDyRkQQJCLGlaj4QI1EjagQJYooiSCiCGgkQUV5qUFAwAQF35oEoyEoDyWsD0AeBoGAAgossIvrujvT3XXyxznnm+P1VtWtR/fM7HR9X387O9NdXXXr3PP8nd9xRITRMTqm60hGSzA6RgI4Oubs0R4twYw+nPmZRgI4OgYpaPaVyotGGnB0DFLo1AXqZwjbmLyWAHgEwPqRAI6OJgSvBaAngqfPYScAewF4JoAdAWwJYBGA5QAuBfBBABs2NnPsRmmYoQZ8zgjdGIDnAzgEwAtE6EIK4b0AzhiZ4NFR19Sq4G0D4A0AXg9gZ++9qhXbANYBOAzAd+TztDH6hCMNONijZQTvaQCOBfBGAIuNwJG8zxkBWwfgZQCuAdAB0B1pwNFRVestAnAcgHd6gpeI4JHx60h+f/hcEL6RAA7O10tF+F4F4HQA28vfuiJ0LS/9QiKUHQAfBfCNuSB8IxM8OJO7AMAnALxdfj8pm936cs4IYV8+ewOA58nfR3nA0VF6LXsAdgXwBQB7GP+v46VPbIUjNcnn98k5WnNB+Ea14GY1X09SKleL8HVlfYvWuC/vuVI+ayPmkQCOjijN1wdwpPhuS0wqxT8o5xmcG9COIwEcHVFm990Azjf+XBIBLlDz2wJwL4CrzO9GAjg6ooXvbQDOlJ/LrCkZYfsfcO5vzvh+IwFsxud7NYDzROu5GvCpm+ei+R0JYPU16wPYDcDnjRZLPOErEiYrsPduzJi/kQCicYDoQgCXA9hMBLCs8Pnn+8MIkj86ylQ5zgSjV7qmqkEFwkc5v+uMBHB0xFY5XgngrSZhnBXhUkEEbNEty0Y+4OgoMpUEzvGdaTSd8wTN5QhcngnebaQBR0eM6T0OjOfrmbVzNftAAOA5c60CMgIjlBM+ArA1gFskAMnSdmUXkwxK5jly/lEpbnQEze97wNi+foE/V/bcfQDjAN5cMoIeacA5JHxLAfxCgoW0xsalDOF14K63XQCsMuiYkQacA6jllhfNhtbnVQC2KKjzljW7vhZcBuBkg4oemeCN9H5bpuaqyOV+gbC8LsPMUo3Aw2/T7AM4Ctwh18McwWrOBRPsTCBhzdo8AE8ENwttAYZSbQiY3y3F/C42n3clTCwifTtFxtwNYF8Aj86F8lwyB5LHJNolBbADgHcA+AoYAHATGAi6HAybTwJrs6cIXwzgwEXCsPJqzNsBuMCYYjeC5M/e1EkfXOZ6Bbh6cSCATbz3fhKcXE48DakPfg+joZIC8iBXsSZsr7sr13uq+IRtA/UqU1+mkQBOfy/uawC8H8Cz8KfN3x0AtwI4UT6TZvh3Ty8Z1cZqvazPKtTrQwBuBPBN755ig5zWbMgnJhup8O0A4Ntiap8lD7RrmsDb8vCPBzCRoTH0/0/IESjnBSdUkXrNfyaqjS8Cgx5iom893xYANjefSUYCOFzhex2A68ENQj1MgQY6pgmoBaa8+G6EphjPgdPbh6z+Wi8SCVMkTKn4nhfLNbgS9eVvAniToXlrjQRwOML3fgCXgRPHKnhJBlzq7MhzTwRMZt9o0i6A38gLGdAqVyFP2JJz7wPglAgtSHI9DwH4MYBLAHwJXLvuz1QhTDYi4TsJwGkmr9fKCBRaAG4D8H2PrSpLaFZ5PRypPOhfADhGouRdwVWMfeXBuxzOvyr39l4Az44QJO0xPh8Mcj0M3G/ycvPZmRVVE9FsfrXk3zcTH5NElJpX3/v/pLzvVPlcO+fc+rdjzbl78vMniGhBzmffIe/zv7/KqyvnukbuNylYEyevH8n1pvL5D3l/nxHPMNkIejN2BfDpDBPlMvKCV0b4ZhoVX238uhaY4eq9AH5v6DacqWi0AXwGwL95yBYqgZQORcUHADg0wqfTe7xBfp6Uz5wK7mFpzSTQw2w3wYn4cvNN4jarZKZ//w2An0f04Ko5uxnAT8W3+5jkDDsm4EjN+ftG8D/XYJJa3/N3GSmjkEDfaARSr/Ut4iOPzRQEdjKL/b4UwEvByWVbO82qt+pDuwPA40ZYY7TsRQDuAtPktgyvX5bgknzPhhxtVQbCpdexD4D9IwEL93ipItWGrxY/FTOh0jJbBVBNyHsDObiidMX9JXa/arQviiPfLSE4mgJyGe93JR4+GY386oJnp9/1KP4Yua0R+qQEJ2fPhOh4NgqgJml3AbCfV3qL6UB7tMJ3rpWotwxObwG47EcRDUuxxOYA8FwTZecJcNdsAHjVr0kAR4PRN73pFMLZKoD6INoBkABFPmhXEVETC7l6ukmjUE7zUtnjqeBqR9G1jBtfLwv+dQaA3adTEyazYJxB1rFzyXKX/rxlBS1EJRHKBMb1weugQ8VI2L5vkQhgkSAvCvSXkGcx5kvE3p4u8MJMFMDEg1FlPaynVASCbjdAyLuedz6YZBwRmoVK+oJjYCxj0TPdJnB+5wVyXXFj/nq6SnbJDBM8y6+8FYAjxOSEYEbzS2gQ+xB2MedMBoQ/PATAthF+Wqw5Jg+utSHivftFuiEk0f0CE+jMKQF0Jq2SSqrhPHC5bDGA+zL8r15gIfMeiObC5oMTuk33Xug1jAP4QI2hhEV/fxxTdWfKSAONATgo5xn7kK2ngaFrQ+9HmW4BtMDRPQF8FcCPwJx7nxYnmTKAousqJnQJXMNd0nBFQAOivwdXZ/oF6Gk/WKKMa/Xff4dE8qFNpyb0eciHcbmAVTl8OoCsyQxIJs8Dgwj+R3JcCXhGxgcLnOPfRTKKuoCP9hQAHzZUunWFUEcqHAhGrvQiqDpcBHeMC5QGryrwLQk8k8RF4BStxttPArt0mHKRTDOCZRdwrfX95iH2AJxgtEJW38VjNRqUepIHe5t8Z7viWjhz3buBy1xtbxImGmjdTI2G/XrGxtM1PQAM6e9H0oc4uf4xAC8Ztlwk00jq/SoA14EpKSbMoJarwYDSIoqKtd49UIn0hiZyzwNXU7rmISeRgqfauQvgzwH8F7i5qd9Aictl1KWvBDdS+f0r6sosAPDPJQEHVgu+GH9cAdroBNDyKn9dclU92X0qLN8u0CBlivpFsHcC8HEA/2JIh1IP2dIyP9thMxrQnAjgCtO43qrhS+VtmJ6Y91A6RV2Lz4LHvvYKgg9k+I57gBvkh4aWSaZB+I40vMr2gSmY4Bbk11t1cZaXrHxknasLHiD4M1MZ0MCoZ66zZwR0C/AUpJ+AR2u1TEmrTldayA9UoMXnxE+2aJiWub5PyX10c/xaV4D+2VwCqKHJRnvIpN6HykL2Azepi7M+ooGbJMpDiWpD0cZYCoY7vUuE8ccSca6S8y+U/OGzwYOll3mDZpIMp58K0ht52iYVt+Qu0bSJ0dDaDrBA1vSvDGMrRXyPP7VJg4+9JdBxG4sA6i7dS0ydP6TPdpa1RBBcgcZeLucL7VTyzp33oJ0XkasfuI+8UIB2QUDrOSMoPdMjkkZoJb/LLgFD698o+b8xo4VT8T3PkACoZ/xSqhh1QyzA0NIxyRCSzKloi8vEZ+oH8lC2NPYSI4yhiDMFsxsszjB7LnLBsyJk1WpdY3b9V+qRGvnaRLViBwxm/UygWy5LS1mNmYCrQTdgauhhKr7axRL47GbGgrnIfuQ88//0SLTNrBBANUsXyI11C5ioUkmI7i6LbQMASLR8ELift19ByGIRMokXgPgvV4AhbIEh+8dJlL+ZaK+0RP33D2JWL5Pr2QrcankFgJWyTlZr+xuBSjInqCw80ZBwzmoTrKb3WEyBOds5D0AFcIFEwm8H8J9esvcw8Ey1eYGHSQ0U/akm5W7XaL0jwHD+54sJjc3Lqfa7TgThQolsnwGu3lgXwOWkfFwJCg/noWiWgBP9btCmeFDsWCpMu0vk1gn4fUUsUQDwQwC/BNdXdwdn6sl7mBRxXqqo8csIpFZV/kM011r5vq+BmfXLAD8pww3pmv5fFzD9VIMWRAV/ElwWvT2Qb5wVAmh35bXgXtmYxQ+VjpIM81b1SI3pTio0jLuCTfNdcBViQv6/NRhUMb+AHRUGuJqYe0zNuiQRApsawXUVmVpTifRvGoYAtgfYLnl0CeFDADHcM0lqa9bXSqqmn1PrtB1yiZxjUzHdSYYZo4iSVZ7w3QKmBZmU75uUKHVTbwi1y9hUbe+cG7yOuyyB0eBsPOfeUILVa6jdcu0Bmd6twX2oaUmwpQtMD/o1mMXgOtEmD4p/4vfbUoZfk4jgbQYGIewNrpf+mcEU9kqaZz9dssGkSizXzIE5U5RSE+wAjAL6gfiP90gQ0s3QQORZm3mSaXiGbPoXyTOAl5imHE3ovJwgZiMzgjIVnJPBVJD36hsWACKi7xHR64ho0YC68rcXtoD7zHf2Mq6riLXgFI9NQZkHbsg4b9f8/hIi2rfhe1tKRO8korvM9/Qj1p+IaL2sDSJYGGq/mjxZIgu/AxGtkxvqRzzE1CwQyUNbERDstqGmSAzFROwrMeexC7uMiD5MRGu9TUMR15wS0b1EtKl3TSCi+UT0y4AAKr3HSiLaz6PU8O+xzKtlXnrOxUT0aUMT0su4L/u3B4loc28jzQpqDgv2nG/Mr4uMegnMCPo8AN/zcm5973xV4f4w51LztwpMBvlcMfMdk1+LcRkuAINjfdR2J0Dtpr7ghZKe+ZFh8CKvRJl465f1Ssza902Q1QawBowNPKoEh+GD8rlZZYJ1p2xORA95GiLrRd6uW+FpPBf4uUlXwXmaB0TUIaKz5Jq6OZpbf7+OiJ5mNKxdi3meBlSze1qAAMkVECWVsUKJd28d+fkNnjnuZ7gFXx2W+SWixoIQBRu8DIwU6RUgdp2J/u6Vz90mWqPnaQLd0fsBeCGAZ4rDnUQwl2py+GEAd4KR1td6EWJqrqUH4N3y3nNMFJqVM7sRwP95pUR9/wQYOr+9XMM8SaKfaDCRPa9u3BZN/BwwPGyhRzlCXqDQF411m+RM7/EAFmSS45fKtZzsFQX8wOYmL6CcFRpQd8u/md2U5/up5nuIiHYKUKVZX+rlRHQ9NXfcLPRpHS9w8jXRkZ7vZO9HtcXpGTRv+v8Ljba/0vhqzvvuNhEdTUQ/r3FfjxPRpUS0h/dMnOdfXudZn9RoRDKWqDUMDdik+V1GRI9E8OLpA91ARM83ps+eT2/+Y2aBNUqu8pqUf3vmfD80D8sXIL2etxpzbLn2VADfnPGw9P9/Ke9bRUTbeoLRMtH41ea6lMdwMnD9oZ8nDe+hRrF/G7gu/Xl/LyruewrhCd5zdYM0x02mXl4UGfLrwzs+IHz2fNYX63oCXIf4sU9EE3LutZLqCWlgva63eD6h1R5Z2kIf3qZEtJqIjvO+Qx/oTkR0v4m+uxXure9pZt0k7/auzQrSVd49TcjnvpWj/dxMjYLVJ9m1APdmm2tWgnFsLQ+mpEncN0g0PemVpuoAT0ONRAvAPMqvNT6YM75TG0zNdpTB2tn7W1vg564DI8AvMn5vYsiLviwol65B37iS9WK7Hm25vi54/skLAnTFTvxBv+TpwKSaflL6qaYG3zh6qskTbleAvrVpgA8FKhnqyG8qVZRQTbMM1q1orlvbpFv+Fdwk5c9o0/+fJ6ielnH+4bEzZAnh18CTMC3OTxlLd5ZN1i7JD4MM3KOdrpTIJh/zSnrKEPu4udc2gNVGAC3Ubb5slC0HIYRJQ1x98AhzQqPsVaC+b/J8/QB28GAR5pjZGBRBRpRVPrPv6QC4XKJxP0LUoTZngnGIbXPdT4rsOLNlwZ5EuEd5WD5XYQBOVnlNN8qekm8krxb9a0zRzXXlc98FM+z7LLOPSubh8xV4DYcqgOORwM8LCwrgB0eQQIZgSLF4wJDGUEG4HAx49c2x/v/j4IZ5xSNuF5lo99E9h3jJeuQwuqICkMN+7yGesKqA3eV9/oIcXu1VAP5CrEC/SS3YpA/Yy9mpWu1YLRow1Huq/39mRGN3SHirkAD5PSGbgIe8HOiZYzJ4v48C+Ae5vr1KUrelBqRAqE9aVLThnemd8XkU75N/x8ANWD8wgu88E7xQfn+KbLrG2BOatOerI97zUwC/DZStLLHP8grcea4BLa5J74UAvgVuSupmCOFJkqheAUYQp5EbQLvcntmQKcujJdZnu0zW1V/Hh81nzzGazbcmW8rG1LX5xyb7hpvUgPdHMBTcWvC9nQxWzyJib6rxACnAFrWZOOTPCmhCNdfHSIDx+pJruUCEtqmGdRT0e2wmgR0CFodE+30lg20BUj2xn3mNQNkaYVVt0ge8NUcbkcH21YXENwmW9MESljtmGYB/l0jVCqFFVR8J5qhplzDDSYUH5ypGyDDpndB1OMlITOT0f+wdKAWe1FTrZpMCeHNOSkEXZE2NhacSdGeoAdknU0t9Inio4Q4BTQgwaPTykmO5qIFrLWMF0oxJ708Cc/D8ZyAjoTnLcdF2duP0Jb+4TxOsqklDD82BR83fUsBo5WrsdldSOPMeEhVoRDJJ8ieLED7VA1lQRRqOKm4EVeDBCfmHNmBKwW0TeS2ae4i/mgYCyrfNpCBEd8ZXM1R56s3eLWtGYqK9Mr+LFRzVhE8Dd7s9qQECoti8ZV23o6iH5UIwBQlyYP+v9ehALJHRK8RNqdXA3pQA6g18CVPgzBCAdMcGHpxDcz5TTGVFOVh2EiF8Qk0HPI2YH4cGmbUoQyHcVZCDXCoBFgU2Sg9MZHRwJBH7UASwBeBXmOrkD7EA7GUQxyjZuY9pnMqkmnAPEcKlNRKyMWjrOoj0MqTtlEO0foT4wP2cwPJldZ9VMoDxWR8Fd61Zx7ZlNOB2kTXFsjQbVadRxjr3OmvtOZKiWVAxITsoAfRdDKpwr6o4tgQzhaU5s/ecrMWmdcxwkwKoD+MeMOdz4k2P1B7fFZHfTQ35UGU0gyvQyMpOtR+4YrKgQoE+jSQqalIYXcm22tNECNOMzIMmrJ8MbgXFTBBAa4rPAFPtjgVKbm8sGDlaJr1CNZAjVU2casIXStDVKSmEaWBNXIk1KOPrlbEm6mYcAh7r2jcNU6FMg/59t5kkgGSK94eDyz1t0/vQB9M+HFgih1QlOiQMrsOfDJ7wxWAoV6vE96U5E6AoosJRpUacRvb0bA/GLlLBWtpr3XEmCaAfkPwlmEYj8W7kGAyel7BqTi7WTOvUydeCiTfTSHb81AvQigAVRUMOCfVgUqoYlgP4hkS3aQQYRL9r2zpuxKD4AVU9X21CeavKXyIRcSiSdBXAp3VLcVWFV7v4DgNwfmTvctnBh67i1M8YwXSGG9qWHZMS67xsJgqgpSv7pvh9qQlG2gD+psD/oQEjYJrSsjr070hw22XRmAaqEAW7AWxAFcz5YFDFszPaNV0EuKIyn8ygGVJV2C4D8FbzYFJwJn1pgOuvySRsE/VViqyYdMEsBB8zFsBF+nrUoJsR6/9qxKssDZM5BOdFrghm8pgGTb98ATwRSR/WlmAWp7rajEqW7cqmYGLBruoTHoepcV1FYxuogoajCqMeskqnR4j70DMkolUs3YwTQBdg9mwD+Ccwsfa46f+oE8FShGNep4RVVpg14j8ZPDGzl6EJqQLWrwzNcN7vVPNtA24xKBqqWPQ9G2ZaFJwUoFM+IJrCgZtmWjV2kUN9/7AM+iZmJKziCf8BXE3waUpcTYg9appevY+TMDUxNInc0KHjsTqylAxoAubLMdUx5rzI+MfgDiyASRSf2CDKuQ5GkBoy9YnJq50B7n5TE5cEHHY3ABBqXqmtD4ZYvcGkW6jCtehn/m+maEDVZC8XH2hVTq7rS/L/JWCoU1X1j5LDWJpyKyjie1UTfhZTUzk7XhTs0DwsP68Up8/7b8Cdff0K0Df//DfOhDSM7qwnSbBxj4mqEEAcX48pFvnlDeXvBhGE1KkGJSbtdJ6kaSZKRppNVXXIBISbgpvwEUgXUYlIW0uSK2eCAOp0yQvADTe3FZiFB8CVEpjZF66GRqAh5wrLjEFVp/98TM0LaQ9gTESM70gA9geju9OaSXiAEfB3VuhjbpSkvGVY8f9CLm51wYV3jfO6SYMVDYocRUBDTGRbDsJL5LvX10xAuxob5iCvUFAn9fV1c57edAigLu5WYK4TTTz/LuIzaxtOKpOps7oMoEMTqJiyWstn7L8Y3MxUdaCMq+kz7l0zzaWafS0YiFGLVT9pCIV7PLiq0fUuKM8c/CHAqEA1H3xLHP02muk+q2L+XUF6qgXu1aWSbA5pRvddmYalBSboq9LaYBm+Pg9us23VEcB2A4HHUwC82UDXganm8rzwfcwTVleS4yW0K38IppjYEwx4SBuikWhizhxl0KpRJM9Ly6s+JBWgWkvAU0arWgG9jofBRYXas+TaDZjfI2RHd/HHA+9cAbJjqfy7LmIn541hVR/kiwD+2gj02wCcDa66dCPulSq2hLoa7FYxyWbNIf4B3MW2vWQO+l5EHSNQ8wPM/WU2oTKFHQvmpm5NVylO0wvjYMyf3+Syc0H/6yYm/bI6Ag1T1GJ4G3i6pkKkWuAp4ivAidJOBAx+UDnDquadjPD9DNwGcAAYxnZdiYfvGkLT6LV8RjZ7beGrK4CQxXiG8W1UyxwATnT6mkDTEjtiCsi4oUbXv577WPB8XoVGqVa8Rq7lKtONV7U6Uqc1oKypTw2T64VgBPnNck8PgAEED0WmP8jLPvQrXHdXXKYrALynSQb9pObnDjKOqZ2Zu63BAI6Z3oKWGUrdkc+tiYA+uQwURgIeu/BfpvIAbyjMb8Cgh7MCUyjL1F4dBsvO5Y+v6IKR40dKxNkyWugBMOAhTxBCpn6dlwJyJdBM/w4mJuo1GeAlNRvRn50T7f0TmF1qwkwnmpTgQM3lZANTec6PENKu7NyjjGD2K9RSm8IZugyiIE1j3QOetHmOIcrse4MVLwHPUu5EaGpngAMPl7g/9fkuAnCoCG+jQ6yTiuZXNci2gfOoY7y5mL4PSu5pX3DP8NfEPCuJ95octHAeSFTHbH2nIBdl84LnyYO91yRP3TQgrimjRNkRTbOfaHY7cMaP+Ddgimy8H9HQpKb0nsjcndLQnQoGE/fqVDwGkQfcxESyLmMS0iIAHwFwA7j+e6IIX88EIL8v2YRjQZA3gzmMXYSPpn7hteIXXm2CExogAttFaBn1jU8Bt0U+GJggENpU3/NSNDEBx00l0i0nyDW1SjyboQngvBwySWfyhF1PCOxNPCI7OSnha1lhuyOn6pHlz7TAZJorJKLrVMjmu4b7Zh4Co4hONcLYj/AZ7wgQi1NB598PPLYKymgoOx/A6Yb7cBB0eLUEMInsO2jngDofjeD9s79Lvev+VYWFUI0zCe7heIfZ8T0MjiQoTyPvD6b7aJdoWnJiQe4rCcq4QT6TBNJnms24EwymTUpyHw5VACcDu5RK7o5VNZtz1qMep2ELjNdbAS4rdRoQQhdJYdKWyPyFYG7FVgl3gHKG5VBOHrAtLs9VGcTyet5PyvuSQZNE1RHA9cZ/KwMHt++5v8TnQu9bWFNTqRb6PnhO8TUmPZTW0HRZaQp1AdaCy5fvERclqZDUJcOrjQKycv85X+aZYUs7shrcSuuaSDQPQgDtGNTf1vQHHqj4eX3/MxrwR1Qo7hNNeK5JfaQ52tmVrD5oDu8mMO3tJaZhKa0IAhkHtzTECqDez/cB3O4BCfT+rpcgyA2DIq9uIvqumgLwcEUYuJ1P10RqwPqF75I8ZdfLF7oMRz8WPNEBo8UPECFs1/CvnOF53hrFfSBtL002Acby+dUXf14wZqoA6gL8rKKZSjwBLNsLop/fCVMz6pKGWF61jvznohVdgOaiLPfMOhHsw03JsNdAALiXmeGRpalbnpnWv1/hTU6CCeyGdtSthFxvEpZUouFatc2jFcm9tew2D3/KPYMG/MJxcMH/wor+mY9RPFpMe6ch30rX4k0Rz9IfC2E13d3eVHqAhxgOjaE2aWA2yF0ZwwmLjscNEoYqjmwgcHltceS0orLd/rtHoHFiGtvvahAkq27B3uAadxrhjyaBTbEe3CLrX+vkbNCAWgqbwFSPb1k/bG2gClJ2tFYqTvgHvMmTqImR7IH5j1+ZwwWtucM8WJKuyTEFZb8q3YCnmTqwy0Ght3IIh25tmmpjmGkYvdFLzcOgEuZ7dQ4YNTYI0Wj878AlrK7n71QVvu0xNT0ylKdMTUXlTs8FIa9TsA/mEHx7g9d3rPiolgTJ5aBgkoxn99uMrMCsEED1G1aCofBlo9FHG7gGZxzyf5UIU9HPScl1sDNBrgADZtNAmVAf+rfFRO8CHuCXZFDv6u/PBncNVr0+hWi9CcAnvBJn1R7qxwK/m5gtAmihV+dUIM1Z0xAMSq9hMzCS5LUiSKmZk+Y/BGc0VMsQh68A10qfHiBqtAiRX4Lh/4/J+04EJ2+zZsYpe9ZX5XM9z4THXF8fnLi+2JjWJMKvzJtNNxGQhTWzSQDVP/omeBRrO8eHcIFSXhmi7bzcmx21+mWJXreXB93PaATSiLcPhpV9Bjw37ckFg2hSMae/MwlrB+BvweCKJBAYOIMg+oK4LTuY7y+6vl1EeD8VMKtlqk/+e8c8Tb3eAwjPeAG0ftgJJekl0hpM7y6jtqua4q2So/w8GAC7lSy2nn8eOIl7iAjrjSJACAQd5KFEPidasm0EvAWuHhyfo5VsNeL1AH4i16dETuPmc+Nyza8QgV0J4NWBFlZXk8p4qfeeR4xrNBQBbDfIB30luFnl9TmUZOR1aIXOtS6n8F7UbeYMsngBeNzAW2RXPyAmcwzcnvgE8wAs0jjJKHtpP8YHAv6ersFFYmJfEOjEI6+ha6G5vtVgWJWig5YB2MLQliCwprFVIwpEyPq3bbzf3yfpMTebBNAKxt+D+0SWR/TjbhGI1FJwD4dFjbic3U6B6gQZv0k142JM9cOGhjYXzfBVrXiWCHErB7l9GriJKMnZMP71LfGEzY9IE5NlcCVIOrUdYSJDcHcOcL1QUx1vw54Vl4gZeqcxh3n9CdtI4OBj/G4pOYo0z3y3PG6WnjGbqXmwLiLnmUp03DY+U8tEtPrgVkp6oxXhUhRdXyvi+oqo1X7vmVWN5OeDe3bs2l8zbAL4ZACs+F8HE3V3MnaRPqytzTh4q/K/EzHEJobPzgWYSxPz0F0F/OAyIyRWaFLz/83FvFLJqZ2JEbikxAjaoij4fq/kqefeXYIvbTxaBy4/YoCz7AbOkKq+0PvBCN+Ox5jgv+8Az/wmokF+klMzpZJcJmUpbvPYHM4V87pcItP3gWH0e8nv9pCgZqHJk7oBs/y7AsFcafxHmyx/hanJk2i/XzfZ8xt18UQ0KO68hWDk7V4eO6itJFwLHhEAz/d4JXhqTzdggpqmVovhdHGB9saFpqqhlHSLKhBQ1rnOvN/pGr8Y3Lxk/dYF4DLcU0QAx8B93JfWoVqbKSTlugC/k132C6MJbcDQB/BcEVArfJpXvDwDIu8aZhd1Jea29cwwZ72nSZPSaA1wEqaLvC9brbkRDD51Xrn0NSJ8qhjuBvCtYaGghzGmQW/2AXD5yQoheT7jCRnR29sluT2WsSPLzMOlhsxay5v31va66kK+6zAnOvkMY8cZyL9e4zi4lmyVxVnD6gEZ9qguHVr4IvHrrE+oVZNDwY05PtvT45JEvtaY736JB+sGxOmSBUp1Q+ikiyFrSmW9Tgbw38ayqAl+NxhJPiGb+3aDe0wx5GMQPmAWfm0xOKt/iPHtdBPcAp6+PemRfKfg8tWHZeE6psM/D53sGuRdpojIu8o4VWpwQpQVPEgW4n1G6NQEbydmeb6Jfg8CV3Zawza/w8L9q1+3RoKLT5mZGUpBtisY0JB6jTpanzwOTFfxJTCOsGOABokRxCTinlwD5pgyhKiJATl5WtzSEPuwrw6YduONInz+xPqWidCV7eqU6RS+YWnA0GIeDuBM0YoT8rcxMI/MRwOgBruY24pf+XxwJn9Lieo6Ofi3shuGAslsqqC5+gFBabLXOJUc3+2SNfiCROOJx6HTkw1+tGzoTcCtmX9ltCRt7ALo4+N2lLzaCzEFDRoHN++cG1iYJBCltcElvaXy2VR294fAsKxuhXKjy0lElzGfroFpTBqofUoEZoGpxEyKn/wAuI7suzzOROUngDGLKnzfEOHrDphLG8OqBVdpBv9fCU6OEYd5ifztLPn5I96CpgFKkB64dvwbhPuNUaHb7jIw3m9czv8mcNWGIul41X99BIx2URq6HWVTpJGlRXgcOCsjNjZ5aJ6eWJWPGH/6c+ByaW+YoIPslSearldCRE5+3o6ILiCi9TR1/AsRbSZ/b8n7/XM4eSXyGpN/Py3nmCSiNPLVl8/s633HtfL7bsFn9eeuvP927zwr5Pe9iHPoa1I+8y5Zg3H5t2XWxK4jiKhtfj7drOcaIjrGWzdM9yuZRtlPjY9yN5gJdB8wK9Nj4kzfAuClRgO6DACCrcVW7Y5TTbCZXNO4CXRQYqSpnQmyiQmYFlWY6uQ8y+G/Ui9roFpvKzC49nj52zfA/IxnNzAcfNZFwYigxtBC/M/B7PZ7geHnj4Bh9v8hUTCVbHxChbZPi0rpRTKcZrGz9gzcvz9Ael+95wWSZL5D0isXg7GJh4rLM60Bx0zwAYsERv27e8UXPAtc9D8YTObzZ7Kzby2gtUgzKgSugvA2lcNLC4AOVa9JaT/2B5c+F8km/m8TnCTT0XI5mwQQgaE1GsHdiqn+1cWSRKWK5bWybFZlKxGhsl1MJYZqjFJQF+QOMAppfeAaZpzgzVQBhDcjA97EyTWI69rq18xTNmEq8wC5sQlsF3k/PZMJaHmjvWb00cbMP9LAhPEiIVlbEr7uTPXl8YzUSAxeMC+hPVFDmNdEBj80G4RupgUhgyjc31lC+PyusF9laFMXOQPOh27BsE51SyJO9L13D3FYzkgAG/AhrwbDi0LUankm+0eSArLJ7ke9vt0YAnUC94WQSRLfKVE+IlNFWs34pfjAbrYK2VwTwBYYWn6+obNII9JAAHMj+8L6k4Imq6yy3c+8c3UBfDzSr+sbATwDU5MERgI4S4QwAXCSpGzGDc7Qdp31DcdyC5w/uzZQ+vsKuJQWo4FSU+v+shcMJGCU9ydNgptMvtAmlzURfi6YJKk123y72VCKG+RLy0wdIjqBiO6l8NEnoh8S0cGm5GfPo/8/2bx/Qsppfe/fSVOGOz1wPmfKiYcR0U2UfdxGREd697JRvoaNhsE0wNMBLq/tCSY1XyJa5kFwqe8mrzMvq4n8FMmzdQo04MflfVkDuJ0Zy7UnGFK2TL5nFXj07E9LaN3Z/ZA2YgH0E9qIQG0X5QefBabe2AeMkFHEzH3gATBflH+LBCfGpG68ZncOCWCIptYFgAwo0Vqgx6ZmGvvawCT5Mr0lLjCydm48mDkigE0GbVnjq9qBpPnoGAngwFsMMFe0FeZoKW42V2RGxxzMA46OkQCOjtERd/w/5zKwr5CST4wAAAAASUVORK5CYII=';

  // IP de saída → região desejada. Os IPs abaixo são apenas exemplos comuns em projetos públicos;
  // troque pelo endereço de saída que você realmente usa (também dá para escolher no painel,
  // ou gravar direto em xcu.region no localStorage).
  const REGIONS = {
    jp: { ip: '138.199.21.239', territory: 'JP', name: 'Japão' },
    us: { ip: '143.244.47.65', territory: 'US', name: 'EUA' },
    kr: { ip: '121.125.60.151', territory: 'KR', name: 'Coreia' },
    pl: { ip: '45.134.212.66', territory: 'PL', name: 'Polônia' },
    br: { ip: '169.150.198.66', territory: 'BR', name: 'Brasil' }
  };
  const DEFAULT_REGION = 'jp';

  // Data centers de streaming: name deve ser idêntico a offeringSettings.regions[].name do servidor.
  // O /v2/login/user retorna na prática 19 regiões; na Ásia só Tóquio e Seul são opções reais.
  const SERVERS = {
    auto: { name: '', label: 'Auto' },
    ejp: { name: 'JAPANEAST', label: 'Tóquio' },
    ckr: { name: 'KOREACENTRAL', label: 'Seul' },
    eus: { name: 'EASTUS', label: 'Leste EUA' },
    weu: { name: 'WESTEUROPE', label: 'Europa Ocid.' }
  };

  // A qualidade e independente de viewport, DeX, tela cheia e perifericos.
  // Perfis osName dizem respeito apenas a negociacao do streaming; nao sao um
  // mecanismo de selecao de teclado/mouse, controle ou touchscreen.
  // Auto usa perfil desktop Windows para nao anunciar uma Smart TV ao xCloud.
  // HQ/Tizen permanece opcional: pode interferir na negociacao do controle virtual.
  // O perfil solicitado NAO comprova resolucao/bitrate entregues; medir via WebRTC.
  // O servidor ainda pode negociar uma resolucao inferior.
  const RES_MODES = {
    auto: { osName: 'windows', label: '1080p' },
    hq: { osName: 'tizen', label: '1080p HQ' },
  };
  const BITRATE_MODES = {
    auto: { mbps: 0, label: 'Auto' },
    b5: { mbps: 5, label: '5 Mbps' },
    b8: { mbps: 8, label: '8 Mbps' },
    b10: { mbps: 10, label: '10 Mbps' },
    b12: { mbps: 12, label: '12 Mbps' },
    b15: { mbps: 15, label: '15 Mbps' },
    b20: { mbps: 20, label: '20 Mbps (limite)' },
    b30: { mbps: 30, label: '30 Mbps (limite)' },
    b40: { mbps: 40, label: '40 Mbps (limite)' },
    b50: { mbps: 50, label: '50 Mbps (limite)' }
  };
  function bitrateCfg() {
    // Sem teto artificial de bitrate: WebRTC e servidor negociam a taxa real.
    return BITRATE_MODES.auto;
  }

  const GSSV_RE = /(^|\.)gssv-play-[a-z0-9-]*\.xboxlive\.com$/i;
  const GEARS_RE = /^gears(-staging)?\.xboxservices\.com$/i;
  const EXP_PATH_RE = /(\/Assignments\/experimentation|\/xboxcomfd\/experimentation)/i;
  const CAP_RE = /contentaccess|storepages|catalog\.gamepass|titlehub|emerald|gssv-play|gears/i;
  const MAX_CAP = 40;

  const S = {
    v: VER,
    all: 0,
    gssv: 0,
    inj: 0,
    caps: [],
    logs: [],
    env: {},
    territoryBefore: '',
    territoryNow: '',
    expHits: 0,
    expBefore: '(não passou)',
    expAfter: '(não passou)',
    cacheCleared: 0,
    denied: 0,
    // v2.2
    serverPin: '',
    serverActual: '',
    v6dropped: 0,
    resApplied: '',
    playPatched: 0,
    pcs: 0,
    qos: null,
    qosAt: 0,
    latencyByServer: Object.create(null),
    nxRecoveries: 0,
    qosHistory: [],
    lastDiagnosis: 'Aguardando amostras',
    deviceDetected: '',
    diagnosticsWarnings: [],
    micStatus: 'Não verificado',
    vibrationStatus: 'Não verificado',
    remotePlayStatus: 'Sem integração de protocolo',
    serverProbeStatus: 'Sem endpoints verificados para sondagem',
    hist: [],
    histMin: null,
    startedAt: Date.now(),
    lastErr: ''
  };
  window.__XCU__ = S;
  // Amostras de sessões anteriores têm validade limitada e não equivalem a ping ativo.
  try {
    const saved = JSON.parse(localStorage.getItem(LS_RTT_HISTORY) || '{}');
    const now = Date.now();
    Object.keys(saved).forEach(function (name) {
      const item = saved[name];
      if (/^[A-Z][A-Z0-9]{2,30}$/.test(name) && item && Number.isFinite(item.avg) && item.avg >= 0 && item.avg < 5000 && Number.isInteger(item.samples) && item.samples >= 1 && item.samples <= 100000 && Number.isFinite(item.at) && now - item.at >= 0 && now - item.at < 24 * 3600 * 1000) {
        S.latencyByServer[name] = { avg: item.avg, samples: item.samples, at: item.at };
      }
    });
  } catch (e) { /* armazenamento indisponível */ }
  let lastRttSave = 0;

  // ---------- Configuração ----------
  function cfg() {
    let v = DEFAULT_REGION;
    try { v = localStorage.getItem(LS_KEY) || DEFAULT_REGION; } catch (e) { }
    if (v === 'off' || v === '0') return { key: 'off', ip: null, territory: null, name: 'Desligado' };
    if (REGIONS[v]) return Object.assign({ key: v }, REGIONS[v]);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) {
      return { key: 'custom', ip: v, territory: REGIONS[DEFAULT_REGION].territory, name: 'Personalizado' };
    }
    return Object.assign({ key: DEFAULT_REGION }, REGIONS[DEFAULT_REGION]);
  }

  function getPref(k, def) {
    try { return localStorage.getItem(k) || def; } catch (e) { return def; }
  }
  function setPref(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { }
  }

  function srvCfg() {
    const k = getPref(LS_SRV, 'auto');
    if (k === 'auto' && getPref(LS_AUTO_BEST, '0') === '1') {
      const entries = Object.keys(S.latencyByServer).filter(function (name) {
        const sample = S.latencyByServer[name];
        if (!sample.at || Date.now() - sample.at > 24 * 3600 * 1000) return false;
        return S.latencyByServer[name].samples >= 5 && Object.keys(SERVERS).some(function (id) { return SERVERS[id].name === name; });
      });
      if (entries.length) {
        entries.sort(function (a, b) { return S.latencyByServer[a].avg - S.latencyByServer[b].avg; });
        return { name: entries[0], label: 'Medido: ' + entries[0] };
      }
    }
    if (SERVERS[k]) return SERVERS[k];
    if (/^[A-Z]{3,}$/.test(k)) return { name: k, label: k };
    return SERVERS.auto;
  }
  function resCfg() {
    // HQ/Tizen solicitado em toda sessao, independente de viewport e preferencias legadas.
    // O servidor controla a resolucao real; nenhuma alteracao nos controles ou touch.
    return RES_MODES.hq;
  }
  function v4on() { return getPref(LS_V4, '1') !== '0'; }

  // Nos botões, não mostrar apenas "Auto" — exibir o valor realmente escolhido pelo automático
  //   Data center: no modo automático, o servidor atribuído pelo backend (CKR/EJP…), só se sabe ao entrar numa partida
  //   Qualidade: Auto solicita sempre HQ; a resolucao efetiva aparece nas estatisticas WebRTC
  function srvBtnLabel() {
    const c = srvCfg();
    if (c.name) return c.label;
    const a = S.serverActual;
    if (!a) return 'Auto';
    return 'Auto·' + a;
  }

  function resBtnLabel() {
    const r = resCfg();
    if (r.osName) return r.label;
    const q = S.qos;
    if (q && q.h) return 'Auto·' + q.h + 'p';
    return 'Auto';
  }

  function getCookie(n) {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  // ---------- 1. Limpar cache de experimentos (deve ocorrer antes de a página ler) ----------
  (function clearExpCache() {
    try {
      const kill = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && /^experimentationInfo/i.test(k)) kill.push(k);
      }
      kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
      S.cacheCleared = kill.length;
    } catch (e) { }
  })();

  // ---------- 2. territory ----------
  (function syncTerritory() {
    const c = cfg();
    S.territoryBefore = getCookie('territory') || '(nenhum)';
    if (!c.territory) { S.territoryNow = S.territoryBefore; return; }
    if (S.territoryBefore === c.territory) { S.territoryNow = c.territory; return; }
    try {
      document.cookie = 'territory=' + encodeURIComponent(c.territory) + '; path=/; max-age=31536000; SameSite=Lax';
    } catch (e) { }
    S.territoryNow = getCookie('territory') || '(falha ao gravar)';
  })();

  // ---------- 3. Ambiente ----------
  try {
    S.env = {
      rtc: !!window.RTCPeerConnection,
      audio: !!(window.AudioContext || window.webkitAudioContext),
      online: navigator.onLine
    };
  } catch (e) { }

  function injectable(path) {
    return /\/v2\/login\/user$/i.test(path) || /\/sessions\//i.test(path);
  }

  function pushLog(kind, msg) {
    const s = String(msg);
    if (/Access to the streaming offering is denied/i.test(s)) S.denied++;
    S.logs.push({ t: new Date().toISOString().slice(11, 19), kind: kind, msg: s.slice(0, 400) });
    if (S.logs.length > 40) S.logs.shift();
    schedule();
  }

  function addCap(rec) {
    S.caps.push(rec);
    if (S.caps.length > MAX_CAP) S.caps.shift();
    schedule();
  }

  function nowStr() { return new Date().toISOString().slice(11, 19); }

  // ---------- 4. Reescrita genérica de resposta JSON ----------
  function rewriteJson(res, fn) {
    let copy;
    try { copy = res.clone(); } catch (e) { return Promise.resolve(res); }
    return copy.text().then(function (txt) {
      let j;
      try { j = JSON.parse(txt); } catch (e) { return res; }
      let changed = false;
      try { changed = fn(j) === true; } catch (e) { S.lastErr = String(e && e.message || e); return res; }
      if (!changed) return res;
      const h = new Headers(res.headers);
      h.delete('content-length');
      h.delete('content-encoding');
      h.set('content-type', 'application/json; charset=utf-8');
      try {
        return new Response(JSON.stringify(j), {
          status: res.status, statusText: res.statusText, headers: h
        });
      } catch (e) { return res; }
    }, function () { return res; });
  }

  // ---------- 5. Desbloqueio: reescrita da API de experimentos (physicalMarket) ----------
  function rewriteExp(res, u) {
    if (!res || !res.status || res.status < 200 || res.status >= 300) return Promise.resolve(res);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.indexOf('json') < 0) return Promise.resolve(res);
    const c = cfg();
    if (!c.territory) return Promise.resolve(res);

    return rewriteJson(res, function (j) {
      const holder = (j && typeof j === 'object' && j.exp && typeof j.exp === 'object') ? j.exp : j;
      if (!holder || typeof holder !== 'object') return false;
      const tf = holder.trafficFilters;
      if (!tf || typeof tf !== 'object') return false;

      const before = String(tf.territory == null ? '(vazio)' : tf.territory);
      S.expHits++;
      S.expBefore = before;
      S.expAfter = c.territory;

      tf.territory = c.territory;
      if (Object.prototype.hasOwnProperty.call(tf, 'market')) tf.market = c.territory;

      addCap({
        at: nowStr(), method: 'REWRITE', host: u.host,
        path: u.pathname + (u.search || ''), status: res.status,
        type: 'patched', body: 'physicalMarket: ' + before + ' -> ' + c.territory
      });
      return true;
    });
  }

  // ---------- 6. Fixar data center: reescrever offeringSettings.regions ----------
  function rewriteRegions(res, u) {
    const want = srvCfg();
    if (!want.name) return Promise.resolve(res);

    return rewriteJson(res, function (j) {
      const os = j && j.offeringSettings;
      if (!os || !Array.isArray(os.regions) || !os.regions.length) return false;

      const hit = os.regions.filter(function (r) {
        return String(r && r.name).toUpperCase() === want.name;
      })[0];
      if (!hit) {
        // The server's original ordering remains authoritative on fallback.
        S.serverPin = '';
        S.serverActual = 'região indisponível';
        addCap({
          at: nowStr(), host: u.host, path: u.pathname, status: res.status,
          type: 'patched', body: 'Região alvo ' + want.name + ' não está na lista (disponíveis: ' +
            os.regions.map(function (r) { return r.name; }).join(',') + ')'
        });
        return false;
      }

      const rest = os.regions.filter(function (r) { return r !== hit; });
      // Lógica do cliente: o que tem isDefault vai para o início com unshift, depois pega regions[0].
      // Assim fixa a região sem perder as alternativas de reserva.
      if (os.regions[0] === hit && hit.isDefault === true &&
          rest.every(function (r) { return r.isDefault !== true; })) {
        S.serverPin = want.name;
        return false;
      }
      hit.isDefault = true;
      rest.forEach(function (r) { r.isDefault = false; });
      os.regions = [hit].concat(rest);

      S.serverPin = want.name;
      S.serverActual = want.name;
      addCap({
        at: nowStr(), host: u.host, path: u.pathname, status: res.status,
        type: 'patched', body: 'streamRegion -> ' + want.name + ' (' + want.label + ')'
      });
      return true;
    });
  }

  // ---------- 7. Forçar IPv4: remover candidatos ICE IPv6 ----------
  function isV6Candidate(cand) {
    // Formato "a=candidate:1 1 UDP 100 192.0.2.10 1040 typ host"; o 5º campo é o endereço
    const parts = String(cand).trim().split(/\s+/);
    const ip = parts[4] || '';
    return ip.indexOf(':') >= 0;
  }

  function rewriteIce(res, u, isSdp) {
    if (!res || !res.status || res.status < 200 || res.status >= 300) return Promise.resolve(res);
    if (!v4on()) return Promise.resolve(res);

    return rewriteJson(res, function (j) {
      const raw = j && j.exchangeResponse;
      if (typeof raw !== 'string' || !raw) return false;
      let inner;
      try { inner = JSON.parse(raw); } catch (e) { return false; }
      let dropped = 0;

      if (isSdp) {
        const sdp = inner && inner.sdp;
        if (typeof sdp !== 'string') return false;
        const lines = sdp.split(/\r\n|\n/);
        const keep = lines.filter(function (ln) {
          if (/^a=candidate:/i.test(ln) && isV6Candidate(ln.replace(/^a=/, ''))) { dropped++; return false; }
          return true;
        });
        if (!dropped) return false;
        // Never strip every usable candidate: this would make the session impossible.
        if (!keep.some(function (ln) { return /^a=candidate:/i.test(ln); })) return false;
        inner.sdp = keep.join('\r\n');
      } else {
        if (!Array.isArray(inner)) return false;
        const keep = inner.filter(function (c) {
          const s = c && (c.candidate || '');
          if (/end-of-candidates/i.test(s)) return true;
          if (s && isV6Candidate(s)) { dropped++; return false; }
          return true;
        });
        if (!dropped) return false;
        // End-of-candidates is not a viable transport candidate.
        if (!keep.some(function (item) { return item && typeof item.candidate === 'string' &&
          /^candidate:/i.test(item.candidate.trim()); })) return false;
        inner = keep;
      }

      S.v6dropped += dropped;
      j.exchangeResponse = JSON.stringify(inner);
      addCap({
        at: nowStr(), host: u.host, path: u.pathname, status: res.status,
        type: 'patched', body: 'Removidos ' + dropped + ' candidatos IPv6 (total ' + S.v6dropped + ')'
      });
      return true;
    });
  }

  // ---------- 8. Faixa de qualidade: reescrever o corpo de /sessions/cloud/play ----------
  // O perfil HQ usa tizen apenas na negociacao do stream. 1440p real nao e garantido.
  // Diagnóstico sanitizado da negociação de entrada: somente nomes de campos e booleanos.
  // Nunca registrar tokens, IDs de sessão ou corpo integral da requisição.
  let lastInputNegotiation = null;
  function inspectInputNegotiation(payload) {
    try {
      const settings = payload && payload.settings;
      const input = (settings && settings.inputConfiguration) ||
        (payload && payload.inputConfiguration);
      const summary = {
        settingsKeys: settings && typeof settings === 'object' ? Object.keys(settings).filter(k => /input|touch|mouse|keyboard|osName/i.test(k)) : [],
        inputConfigurationPresent: !!input && typeof input === 'object',
        inputConfigurationKeys: input && typeof input === 'object' ? Object.keys(input) : [],
        enableTouchInput: input && typeof input.enableTouchInput === 'boolean' ? input.enableTouchInput : null,
        enableMouseInput: input && typeof input.enableMouseInput === 'boolean' ? input.enableMouseInput : null,
        enableKeyboardInput: input && typeof input.enableKeyboardInput === 'boolean' ? input.enableKeyboardInput : null,
        maxTouchPoints: input && typeof input.maxTouchPoints === 'number' ? input.maxTouchPoints : null
      };
      lastInputNegotiation = summary;
    } catch (e) {}
  }

  function patchPlayRequest(input, init) {
    const r = resCfg();
    // Perfil desktop de streaming, sem mascarar o navegador ou remover suporte touch.
    const effectiveOs = r.osName;
    // Console: não enviar osName Windows/Tizen de qualidade como se fosse identidade Xbox.
    if (!effectiveOs) return Promise.resolve({ input: input, init: init });
    // An aborted request must not be parsed/rebuilt before reaching native fetch.
    if ((init && init.signal && init.signal.aborted) ||
        (input instanceof Request && input.signal.aborted)) {
      return Promise.resolve({ input: input, init: init });
    }
    try {
      const raw = typeof input === 'string' ? input
        : (input instanceof URL ? input.href : (input && input.url) || '');
      const abs = new URL(raw, location.href);
      const req = new Request((input instanceof Request) ? input : abs.href, init);
      if (!/^POST$/i.test(req.method)) return Promise.resolve({ input: input, init: init });
      return req.clone().text().then(function (txt) {
        let j;
        try { j = JSON.parse(txt); } catch (e) { return { input: input, init: init }; }
        if (!j || !j.settings || typeof j.settings !== 'object') {
          return { input: input, init: init };
        }
        inspectInputNegotiation(j);
        // Qualidade prevalece sobre identidade de interface; o touch nativo permanece.
        j.settings.osName = effectiveOs;
        nxProfileSessionState.attempted++;
        nxProfileSessionState.patched++;
        nxProfileSessionState.lastRequestedOs = effectiveOs;
        nxProfileSessionState.lastOutcome = 'request-rewritten';
        const h = new Headers(req.headers);
        h.delete('content-length');
        // Preserve x-ms-device-info original: o dispositivo e suas capacidades
        // (incluindo toque) nao podem ser mascarados como Tizen/Windows.
        S.resApplied = r.label;
        S.playPatched++;
        addCap({
          at: nowStr(), method: 'PATCH', host: abs.host, path: abs.pathname, status: 0,
          type: 'patched', body: 'settings.osName -> ' + effectiveOs + ' (plataforma: ' + nxConsoleLabProfile + ', vídeo: ' + r.label + ')'
        });
        return {
          input: abs.href,
          init: {
            method: req.method,
            headers: h,
            body: JSON.stringify(j),
            mode: req.mode, credentials: req.credentials, cache: req.cache,
            redirect: req.redirect, referrer: req.referrer, integrity: req.integrity,
            signal: req.signal, referrerPolicy: req.referrerPolicy, keepalive: req.keepalive
          }
        };
      }).catch(function () { return { input: input, init: init }; });
    } catch (e) {
      return Promise.resolve({ input: input, init: init });
    }
  }

  // ---------- 9. Hook do fetch ----------
  const nativeFetch = window.fetch;
  if (typeof nativeFetch === 'function') {
    window.fetch = function (input, init) {
      let u = null;
      try {
        const raw = typeof input === 'string'
          ? input
          : (input instanceof URL ? input.href : (input && input.url) || '');
        if (raw) {
          u = new URL(raw, location.href);
          S.all++;

          if (GSSV_RE.test(u.host)) {
            S.gssv++;
            const c = cfg();
            if (c.ip && injectable(u.pathname) && u.protocol === 'https:') {
              if (input instanceof Request) {
                const h = new Headers(input.headers);
                if (!h.has('X-Forwarded-For')) {
                  h.set('X-Forwarded-For', c.ip);
                  input = new Request(input, { headers: h });
                  S.inj++;
                }
              } else {
                const h = new Headers((init && init.headers) || {});
                if (!h.has('X-Forwarded-For')) {
                  h.set('X-Forwarded-For', c.ip);
                  init = Object.assign({}, init, { headers: h });
                  S.inj++;
                }
              }
            }
          }
          schedule();
        }
      } catch (e) { S.lastErr = String((e && e.message) || e); }

      const isPlay = !!(u && GSSV_RE.test(u.host) && /\/v5\/sessions\/cloud\/play$/i.test(u.pathname));
      if (isPlay) {
        const m = /^([a-z0-9]+)\.core\./i.exec(u.host);
        if (m) S.serverActual = m[1].toUpperCase();
      }

      const go = isPlay
        ? patchPlayRequest(input, init).then(function (x) { return nativeFetch.call(this, x.input, x.init); }.bind(this))
        : nativeFetch.call(this, input, init);

      const offeringMethod = String((init && init.method) || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      let p = nxObserveOffering(u, offeringMethod, go);
      // Monitoramento somente de status e etapa da sessão; nunca armazena headers ou corpo.
      if (u && /xboxservices\.com$/i.test(u.hostname) &&
          /\/sessions\/cloud\/(?:play|[^/]+\/(?:state|connect|configuration|sdp|ice|keepalive))\/?$/i.test(u.pathname)) {
        const stage = /\/sessions\/cloud\/play\/?$/i.test(u.pathname) ? 'play' :
          (u.pathname.match(/\/(state|connect|configuration|sdp|ice|keepalive)\/?$/i) || [,'other'])[1].toLowerCase();
        const started = Date.now();
        const method = String((init && init.method) || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        p = p.then(function (res) {
          nxSessionRecord({ time: new Date().toISOString(), stage: stage, method: method,
            status: res.status, ms: Date.now() - started, ok: res.ok });
          return res;
        }, function (err) {
          nxSessionRecord({ time: new Date().toISOString(), stage: stage, method: method,
            status: 0, ms: Date.now() - started,
            error: err && err.name === 'AbortError' ? 'cancelled' : 'network-failure' });
          throw err;
        });
      }

      const isExp = !!(u && GEARS_RE.test(u.host) && EXP_PATH_RE.test(u.pathname));
      const isExp2 = !!(u && EXP_PATH_RE.test(u.pathname) && /xboxservices\.com$/i.test(u.host));

      if (isExp || isExp2) {
        p = p.then(function (res) { return rewriteExp(res, u); }, function (err) { throw err; });
      }

      if (u && GSSV_RE.test(u.host) && /\/v2\/login\/user$/i.test(u.pathname)) {
        p = p.then(function (res) {
          if (res.status !== 200) return res;
          return rewriteRegions(res, u);
        }, function (err) { throw err; });
      }

      if (u && GSSV_RE.test(u.host) && u.pathname.includes('/sessions/cloud/') && u.pathname.endsWith('/configuration')) {
        p = p.then(function (res) { return patchTouchSessionConfiguration(res); });
      }

      if (u && GSSV_RE.test(u.host) && /\/sdp$/i.test(u.pathname)) {
        p = p.then(function (res) { return rewriteIce(res, u, true); }, function (err) { throw err; });
      }
      if (u && GSSV_RE.test(u.host) && /\/ice$/i.test(u.pathname)) {
        p = p.then(function (res) { return rewriteIce(res, u, false); }, function (err) { throw err; });
      }

      if (u && CAP_RE.test(u.host) && !isExp && !isExp2) {
        p.then(function (res) {
          const rec = {
            at: nowStr(),
            method: (init && init.method) || (input instanceof Request ? input.method : 'GET'),
            host: u.host,
            path: u.pathname,
            status: res.status,
            type: res.type
          };
          addCap(rec);
        }, function (err) {
          addCap({
            at: nowStr(), host: u.host, path: u.pathname,
            status: 0, type: 'failed', note: 'network-failure'
          });
        });
      }

      return p;
    };
  }

  // Limite máximo negociado por SDP; não aumenta o bitrate do servidor.
  // A configuração é capturada ao criar a sessão WebRTC.
  (function hookBitrate() {
    try {
      const original = RTCPeerConnection.prototype.setLocalDescription;
      if (typeof original !== 'function') return;
      RTCPeerConnection.prototype.setLocalDescription = function(description) {
        const limit = bitrateCfg().mbps;
        if (!limit || !description || typeof description.sdp !== 'string' ||
            !/^(?:offer|answer)$/i.test(description.type || '')) {
          return original.apply(this, arguments);
        }
        try {
          const lines = description.sdp.split(/\r?\n/);
          let video = false, inserted = false;
          const out = [];
          for (const line of lines) {
            if (line.startsWith('m=')) {
              if (video && !inserted) out.push('b=AS:' + Math.round(limit * 1000));
              // Rejected (port 0) video sections must not be rewritten.
              video = /^m=video\s+(?!0(?:\s|$))\d+/i.test(line);
              inserted = false;
            }
            if (video && /^b=(AS|TIAS):/.test(line)) continue;
            if (video && !inserted && /^a=/.test(line)) {
              out.push('b=AS:' + Math.round(limit * 1000));
              inserted = true;
            }
            out.push(line);
          }
          if (video && !inserted) out.push('b=AS:' + Math.round(limit * 1000));
          const patchedSdp = out.join('\r\n');
          // Keep original newline convention to avoid rewriting SDP unnecessarily.
          const normalizedSdp = description.sdp.indexOf('\r\n') >= 0
            ? patchedSdp : patchedSdp.replace(/\r\n/g, '\n');
          if (normalizedSdp === description.sdp) return original.apply(this, arguments);
          const patched = { type: description.type, sdp: normalizedSdp };
          return original.call(this, patched);
        } catch (e) { S.lastErr = 'Bitrate SDP: ' + String(e); }
        return original.apply(this, arguments);
      };
    } catch (e) { S.lastErr = 'Bitrate hook: ' + String(e); }
  })();

  // ---------- 10. Amostragem de QoS (envolve o RTCPeerConnection) ----------
  (function hookRtc() {
    try {
      const OPC = window.RTCPeerConnection;
      if (typeof OPC !== 'function') return;

      const W = function () {
        const pc = new OPC(...arguments);
        try {
          S.pcs++; S.lastPc = pc;
          // Nova sessão: zera a base de amostragem da partida anterior
          if (S.pcs > 1) { prevSnap = null; S.hist = []; S.histMin = null; S.qos = null; }
        } catch (e) { }
        return pc;
      };
      W.prototype = OPC.prototype;
      ['generateCertificate', 'getStats'].forEach(function (k) {
        if (OPC[k]) W[k] = OPC[k];
      });
      window.RTCPeerConnection = W;
      if (window.webkitRTCPeerConnection === OPC) window.webkitRTCPeerConnection = W;
    } catch (e) { }
  })();

  let qosBusy = false, prevSnap = null;

  function diagnoseQos(q) {
    if (!q) return 'Aguardando amostras';
    const loss = q.instLoss == null ? q.loss : q.instLoss;
    if (Number.isFinite(loss) && loss >= 5) return 'Perda de pacotes elevada: verificar Wi-Fi, rede e servidor';
    if (Number.isFinite(q.rtt) && q.rtt >= 160) return 'RTT WebRTC elevado: comparar data centers';
    if (Number.isFinite(q.dropRate) && q.dropRate > 5) return 'Quadros descartados neste intervalo: investigar decodificação local';
    if (Number.isFinite(q.jitter) && q.jitter > 40) return 'Jitter elevado: conexão instável';
    return 'Sem alerta pelos limiares locais (não garante ausência de problemas)';
  }

  function pumpQos() {
    const pc = S.lastPc;
    if (!pc || pc.connectionState === 'closed' || pc.signalingState === 'closed') {
      if (S.qos) { S.qos = null; S.lastDiagnosis = 'Sessão WebRTC encerrada'; schedule(); }
      prevSnap = null;
      return;
    }
    if (qosBusy || typeof pc.getStats !== 'function') return;
    qosBusy = true;
    PCQos(pc).then(function (q) {
      if (q && S.lastPc === pc && pc.connectionState !== 'closed' && pc.signalingState !== 'closed') {
        S.qos = q; S.qosAt = Date.now();
        S.qosHistory.push({ at: Date.now(), fps: q.fps || q.decodedFps || 0, kbps: q.kbps || 0, rtt: q.rtt, loss: q.instLoss == null ? q.loss : q.instLoss, dropped: q.dropped || 0, dropRate: q.dropRate == null ? null : q.dropRate });
        if (S.qosHistory.length > 90) S.qosHistory.shift();
        S.lastDiagnosis = diagnoseQos(q);
        // Comparacao somente entre data centers efetivamente usados em partidas.
        // Nao confundir RTT WebRTC com ping do jogo nem sondar endpoints arbitrarios.
        const server = S.serverActual;
        if (server && Object.keys(SERVERS).some(function (id) { return SERVERS[id].name === server; }) && Number.isFinite(q.rtt) && q.rtt >= 0) {
          const prev = S.latencyByServer[server] || { avg: q.rtt, samples: 0 };
          prev.avg = prev.samples ? prev.avg * 0.8 + q.rtt * 0.2 : q.rtt;
          prev.samples++;
          prev.at = Date.now();
          S.latencyByServer[server] = prev;
          if (Date.now() - lastRttSave > 15000) {
            lastRttSave = Date.now();
            try { localStorage.setItem(LS_RTT_HISTORY, JSON.stringify(S.latencyByServer)); } catch (e) { }
          }
        }
        schedule();
      }
    }).catch(function (err) {
      S.lastErr = 'QoS: ' + String(err && err.message || err);
      schedule();
    }).then(function () { qosBusy = false; }, function () { qosBusy = false; });
  }

  function PCQos(pc) {
    let stats;
    try { stats = pc.getStats(); } catch (e) { return Promise.resolve(null); }
    return Promise.resolve(stats).then(function (rep) {
      const out = {};
      let video = null, pair = null, pairId = null;

      rep.forEach(function (r) {
        if (r.type === 'inbound-rtp' && (r.kind === 'video' || r.mediaType === 'video') &&
            !r.isRemote && (!video || (r.bytesReceived || 0) > (video.bytesReceived || 0))) video = r;
        if (r.type === 'transport' && r.selectedCandidatePairId) pairId = r.selectedCandidatePairId;
        if (r.type === 'candidate-pair' && (r.nominated || r.selected) && r.state === 'succeeded' &&
            (!pair || (r.bytesReceived || 0) > (pair.bytesReceived || 0))) pair = r;
      });
      if (pairId && rep.get) {
        const p2 = rep.get(pairId);
        if (p2 && p2.type === 'candidate-pair' && p2.state === 'succeeded') pair = p2;
      }
      if (!video && !pair) return null;

      if (video) {
        const recv = video.packetsReceived || 0;
        const lost = video.packetsLost || 0;
        out.loss = (recv + lost) > 0 ? (lost / (recv + lost) * 100) : 0;
        out.recv = recv;
        out.lost = lost;
        out.w = video.frameWidth || 0;
        out.h = video.frameHeight || 0;
        out.fps = Math.round(video.framesPerSecond || 0);
        out.jitter = video.jitter != null ? Math.round(video.jitter * 1000) : null;
        out.bytes = video.bytesReceived || 0;
        out.ts = video.timestamp || Date.now();
        // Métricas do lado do decodificador: distinguem "perda de pacotes na rede" de "decodificação/renderização local não acompanha"
        out.dropped = video.framesDropped || 0;
        out.freeze = video.freezeCount || 0;
        out.freezeDur = Math.round(video.totalFreezesDuration || 0);
        out.decoded = video.framesDecoded || 0;
        out.decodeMs = video.totalDecodeTime != null && out.decoded > 0 ? Math.round(video.totalDecodeTime / out.decoded * 10000) / 10 : null;
        out.keyFrames = video.keyFramesDecoded != null ? video.keyFramesDecoded : null;
        out.pli = video.pliCount != null ? video.pliCount : null;
        if (video.codecId && rep.get) {
          const cc = rep.get(video.codecId);
          if (cc && cc.mimeType) out.codec = String(cc.mimeType).replace(/^video\//i, '').toUpperCase();
        }
        if (video.jitterBufferDelay != null && video.jitterBufferEmittedCount) {
          out.bufMs = Math.round(video.jitterBufferDelay / video.jitterBufferEmittedCount * 1000);
        }

        if (prevSnap && prevSnap.bytes != null && prevSnap.pc === pc && prevSnap.inboundId === video.id) {
          const dB = out.bytes - prevSnap.bytes;
          const dT = (out.ts - prevSnap.ts) / 1000;
          if (dT > 0.5 && dB >= 0) out.kbps = Math.round(dB * 8 / dT / 1000);
          if (dT > 0.5 && out.decoded >= (prevSnap.decoded || 0)) out.decodedFps = Math.round((out.decoded - (prevSnap.decoded || 0)) / dT);
          const dDropped = out.dropped - (prevSnap.dropped || 0);
          const dDecoded = out.decoded - (prevSnap.decoded || 0);
          if (dT > 0.5 && dDropped >= 0 && dDecoded >= 0 && dDropped + dDecoded > 0) out.dropRate = dDropped / (dDropped + dDecoded) * 100;

          // Perda instantânea: conta só este intervalo de amostragem; o valor acumulado esconderia melhorias
          const dRecv = recv - prevSnap.recv;
          const dLost = lost - prevSnap.lost;
          if (dRecv + dLost > 20 && dRecv >= 0 && dLost >= 0) {
            out.instLoss = dLost / (dRecv + dLost) * 100;
            S.hist.push(Math.round(out.instLoss * 10) / 10);
            if (S.hist.length > 12) S.hist.shift();
            S.histMin = S.histMin == null ? out.instLoss : Math.min(S.histMin, out.instLoss);
            out.hist = S.hist.slice(-6);
            out.histMin = Math.round(S.histMin * 10) / 10;
          }
        }
        prevSnap = { bytes: out.bytes, ts: out.ts, recv: recv, lost: lost, decoded: out.decoded, dropped: out.dropped, pc: pc, inboundId: video.id };
      }

      if (pair) {
        out.rtt = pair.currentRoundTripTime != null ? Math.round(pair.currentRoundTripTime * 1000) : null;
        out.lostReq = pair.requestsFailed || 0;
        const rc = rep.get ? rep.get(pair.remoteCandidateId) : null;
        if (rc) {
          out.remote = rc.address || '';
          out.port = rc.port || '';
          out.family = (out.remote.indexOf(':') >= 0) ? 'IPv6' : 'IPv4';
          out.ctype = rc.candidateType || rc.type || '';
        }
        // Candidato local: se for um IP público fora do lado do proxy de saída, o fluxo de mídia não passou pelo proxy (vazamento WebRTC / conexão direta)
        const lc = rep.get ? rep.get(pair.localCandidateId) : null;
        if (lc) {
          out.local = lc.address || '';
          out.ltype = lc.candidateType || lc.type || '';
          out.lproto = lc.protocol || '';
          out.lport = lc.port || '';
        }
        out.proto = pair.protocol || (lc && lc.protocol) || '';
      }
      return out;
    }, function () { return null; });
  }


  // Configuracao independente de toque, inspirada no Better xCloud.
  let touchSessionDiagnostics = { inspected: false, applied: false };
  function patchTouchSessionConfiguration(response) {
    // A negociação e a execução dos controles touch pertencem ao xCloud.
    // Alterar enableTouchInput/maxTouchPoints na resposta pode exibir botões
    // sem que a sessão tenha sido preparada para transmitir seus comandos.
    // Não modificar a resposta: preservar a configuração original do serviço.
    touchSessionDiagnostics = {
      inspected: false,
      applied: false,
      reason: 'native-xcloud-touch-negotiation-preserved'
    };
    return Promise.resolve(response);
  }

  // Pointer Lock pertence ao xCloud e ao navegador. Nao simular F9 nem
  // substituir requestPointerLock: bloquear chamadas em fullscreen impedia
  // o mouse fisico no Fortnite (41 tentativas suprimidas em 3.6.8).
  // O suporte real depende do navegador e da sessao xCloud.
  const touchFullscreenPolicy = {
    enabled: false,
    suppressed: 0,
    lastReason: 'native pointer lock preserved',
    mode: 'native',
    f9Observed: 0,
    requestsBlockedByNimbo: false
  };
  // O navegador e o xCloud gerenciam o Pointer Lock nativamente.
  // Nao substituir requestPointerLock nem interceptar F9: isso provocava
  // dialogos de recaptura repetidos e impedia restaurar o mouse.
  touchFullscreenPolicy.mode='native-unmodified';
  touchFullscreenPolicy.lastReason='NX does not override pointer lock or F9';
  document.addEventListener('pointerlockchange',function(){
    touchFullscreenPolicy.lastReason=document.pointerLockElement?'native pointer lock active':'native pointer lock released';
  },true);

  // Aviso F9: temporariamente desativado para preservar o DOM do xCloud.
  // A versao anterior reconstruia elementos da pagina e podia afetar o boot.
  // O atalho F9 e a protecao contra recaptura continuam independentes.

  // ---------- 10b. Entradas nativas ----------
  // Nao interceptar requestPointerLock, teclado/mouse/toque ou Gamepad API.
  // Nao emular gamepad. O xCloud gerencia os perifericos nativamente.

  // ---------- 11. XHR ----------
  try {
    const oSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
      const xhr = this;
      xhr.addEventListener('loadend', function () {
        try {
          const u = new URL(xhr.responseURL || '', location.href);
          if (!CAP_RE.test(u.host)) return;
          addCap({
            at: nowStr(), method: 'XHR', host: u.host,
            path: u.pathname, status: xhr.status, type: 'xhr'
          });
        } catch (e) { }
      });
      return oSend.apply(xhr, arguments);
    };
  } catch (e) { }

  // ---------- 12. Registro de exceções (só a mensagem, sem conteúdo da página) ----------
  try {
    window.addEventListener('error', function (e) {
      pushLog('error', (e.message || '') + ' @ linha ' + (e.lineno || 0));
    }, true);
    window.addEventListener('unhandledrejection', function (e) {
      const r = e.reason;
      pushLog('reject', (r && (r.message || r)) || '');
    });
  } catch (e) { }

  // ---------- 13. Interface: um único botão + cartão recolhível ----------
  // Desde a v3.6.37 existe UM ponto de acesso por contexto:
  //   · Biblioteca: só o ícone NX (branco, fundo transparente), logo à direita do ícone de
  //     controle no topo da página, com um pontinho de status no canto. A pílula flutuante
  //     fica oculta.
  //   · Durante a partida (a barra do site não existe): só a pílula flutuante, no canto
  //     superior direito, com ícone + perda de pacotes.
  // O contêiner externo tem pointer-events:none; só o botão/cartão recebem cliques.
  const LS_POS = 'xcu.pos';
  const ZBASE = 2147483000;
  const MONO = 'ui-monospace,Menlo,Consolas,monospace';

  let wrap = null, pillEl = null, cardEl = null, dotEl = null, pillTxt = null, pickEl = null;
  let openUI = false, userTouched = false, autoFolded = false, pending = false;
  let nxLibraryButton = null, nxLibraryDot = null, nxLibraryAnchor = null, nxMode = '';
  const el = {};

  // Xbox Shell experimental: apresentação independente da identidade de rede.
  const LS_NX_SHELL = 'nx.xboxShell.enabled.v1';
  const nxShellEnabled = ['xbox','xboxone','xboxseries'].includes(nxConsoleLabProfile) && (function () { try { return localStorage.getItem(LS_NX_SHELL) !== '0'; } catch (_) { return true; } })();
  let nxShellLastInput = 0, nxShellPrevButtons = [], nxShellPrevAxis = 0, nxShellHeldSince = 0, nxShellNeedsRelease = true;
  const nxShellStats = { moves: 0, actions: 0, errors: 0, lastError: '' };
  function nxShellError(e) { nxShellStats.errors++; nxShellStats.lastError = String(e && e.message || e); }
  function nxShellInstall() {
    if (!nxShellEnabled || document.getElementById('nx-console-shell-css')) return;
    const css = document.createElement('style');
    css.id = 'nx-console-shell-css';
    css.textContent = [
      '#__xcu_panel__.nx-console-shell.nx-shell-open{left:auto!important;right:12px!important;top:12px!important;transform:none!important;width:min(380px,calc(100vw - 24px))!important;max-width:calc(100vw - 24px)!important;align-items:stretch!important}',
      '#__xcu_panel__.nx-console-shell.nx-shell-open [aria-label="Painel NimboXcloud"]{width:100%!important;max-height:calc(100dvh - 28px)!important;border-radius:18px!important;box-shadow:0 22px 90px #000b!important}',
      '#__xcu_panel__.nx-console-shell button:focus-visible,#__xcu_panel__.nx-console-shell select:focus-visible,#__xcu_panel__.nx-console-shell input:focus-visible{outline:3px solid #80dfff!important;outline-offset:2px!important}',
      '#__xcu_panel__.nx-console-shell button{min-height:34px}',
      '@media (orientation:landscape) and (min-width:700px){#__xcu_panel__.nx-console-shell.nx-shell-open [aria-label="Painel NimboXcloud"]{max-height:calc(100dvh - 20px)!important}}'
    ].join('');
    // @run-at document-start: documentElement/head may not exist yet.
    const host = document.head || document.documentElement;
    if (host) host.appendChild(css);
    else document.addEventListener('DOMContentLoaded', function () {
      if (!document.getElementById('nx-console-shell-css')) {
        const readyHost = document.head || document.documentElement;
        if (readyHost) readyHost.appendChild(css);
      }
    }, { once: true });
  }
  function nxShellFocusable() {
    if (!cardEl || !openUI) return [];
    return Array.from(cardEl.querySelectorAll('button,select,input:not([type="hidden"]),textarea,[role="button"],[tabindex]'))
      .filter(function (n) { return !n.disabled && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden'; });
  }
  function nxShellMove(direction) {
    const nodes = nxShellFocusable();
    if (!nodes.length) return;
    const active = document.activeElement;
    const index = nodes.indexOf(active);
    const next = nodes[(index < 0 ? (direction > 0 ? 0 : nodes.length - 1) : (index + direction + nodes.length) % nodes.length)];
    if (next) { next.focus({preventScroll:true}); next.scrollIntoView({block:'nearest',behavior:'auto'}); nxShellStats.moves++; }
  }
  // Menu + View por 0,7s: abre o painel sem depender do toque.
  let nxShellShortcutSince = 0, nxShellShortcutLatched = false;
  let nxSticksShortcutSince = 0, nxSticksShortcutLatched = false;
  const NX_STICKS_SHORTCUT_KEY = 'nx.access.sticksShortcut.v1';
  function nxSticksShortcutEnabled() { try { return localStorage.getItem(NX_STICKS_SHORTCUT_KEY) !== '0'; } catch (_) { return true; } }
  function nxShellGamepadPoll() {
    if (!cardEl || !cardEl.isConnected || document.hidden || !navigator.getGamepads) {
      nxShellPrevButtons = []; nxShellPrevAxis = 0; nxShellHeldSince = 0; nxShellNeedsRelease = true; return;
    }
    try {
      const pad = Array.from(navigator.getGamepads()).filter(Boolean)[0];
      if (!pad) { nxShellPrevButtons = []; nxShellPrevAxis = 0; nxShellNeedsRelease = true; return; }
      const pressed = (pad.buttons || []).map(function (b) { return !!(b && b.pressed); });
      const shortcut = pressed[8] && pressed[9];
      const sticksShortcut = nxSticksShortcutEnabled() && pressed[10] && pressed[11];
      if (sticksShortcut) {
        if (!nxSticksShortcutSince) nxSticksShortcutSince = Date.now();
        if (!nxSticksShortcutLatched && Date.now() - nxSticksShortcutSince >= 850) {
          nxSticksShortcutLatched = true;
          setOpen(!openUI, true);
          nxShellNeedsRelease = true;
        }
      } else { nxSticksShortcutSince = 0; nxSticksShortcutLatched = false; }
      if (shortcut) {
        if (!nxShellShortcutSince) nxShellShortcutSince = Date.now();
        if (!nxShellShortcutLatched && Date.now() - nxShellShortcutSince >= 700) {
          nxShellShortcutLatched = true;
          setOpen(!openUI, true);
          nxShellNeedsRelease = true;
        }
      } else { nxShellShortcutSince = 0; nxShellShortcutLatched = false; }
      if (!openUI || !nxShellEnabled) { nxShellPrevButtons = pressed; nxShellPrevAxis = 0; return; }
      const axis = pad.axes && Math.abs(pad.axes[1] || 0) > .65 ? Math.sign(pad.axes[1]) : 0;
      // Avoid a held gamepad button opening the panel and immediately activating a control.
      const anyInput = pressed.some(Boolean) || (pad.axes || []).some(function (v) { return Math.abs(v || 0) > .65; });
      if (nxShellNeedsRelease) {
        nxShellPrevButtons = pressed; nxShellPrevAxis = 0;
        if (!anyInput) nxShellNeedsRelease = false;
        return;
      }
      const edge = function (i) { return pressed[i] && !nxShellPrevButtons[i]; };
      const now = Date.now();
      const direction = pressed[12] ? -1 : pressed[13] ? 1 : axis;
      const previous = nxShellPrevButtons[12] ? -1 : nxShellPrevButtons[13] ? 1 : nxShellPrevAxis;
      if (!direction) nxShellHeldSince = 0;
      else if (direction !== previous) nxShellHeldSince = now;
      const repeat = direction && direction === previous && nxShellHeldSince && now - nxShellHeldSince > 420 && now - nxShellLastInput > 160;
      if (now - nxShellLastInput > 130) {
        if (direction && (direction !== previous || repeat)) {
          nxShellMove(direction); nxShellLastInput = now;
        } else if (edge(0)) {
          const active = document.activeElement;
          if (cardEl.contains(active)) {
            if (active.matches('button,[role="button"]')) { active.click(); nxShellStats.actions++; }
            else if (active.matches('input[type="checkbox"],input[type="radio"]')) { active.click(); nxShellStats.actions++; }
            else if (active.matches('select')) { active.focus(); }
            else nxShellMove(1);
          } else nxShellMove(1);
          nxShellLastInput = now;
        } else if (edge(1)) {
          if (tabId !== 'overview') setTab('overview'); else setOpen(false,true);
          nxShellLastInput = now;
        } else if (edge(14) || edge(15)) {
          const active = document.activeElement;
          if (cardEl.contains(active) && active.matches('input[type="range"]')) {
            const step = Number(active.step) || 1;
            const min = Number(active.min) || 0;
            const max = Number(active.max) || 100;
            active.value = String(Math.min(max,Math.max(min,Number(active.value) + (edge(15) ? step : -step))));
            active.dispatchEvent(new Event('input',{bubbles:true}));
            active.dispatchEvent(new Event('change',{bubbles:true}));
            nxShellLastInput = now;
          }
        }
      }
      nxShellPrevButtons = pressed;
      nxShellPrevAxis = axis;
    } catch (err) { nxShellError(err); }
  }

  if (nxShellEnabled) nxShellInstall();
  // Atalhos disponíveis em todos os perfis, inclusive quando o Xbox Shell não está ativo.
  setInterval(nxShellGamepadPoll, 90);

  function readPos() {
    try {
      const p = JSON.parse(localStorage.getItem(LS_POS) || 'null');
      if (p && typeof p.x === 'number' && typeof p.y === 'number') return p;
    } catch (e) { }
    return null;
  }

  function resetPos() {
    try { localStorage.removeItem(LS_POS); } catch (e) { }
    if (!wrap) return;
    wrap.style.transform = 'none';
    wrap.style.left = 'auto';
    wrap.style.right = '12px';
    wrap.style.top = '12px';
  }

  function mk(tag, css, text) {
    const n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (text != null) n.textContent = text;
    return n;
  }

  function bindDrag(node, onTap) {
    let lastTap = 0;
    node.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0) return;
      // Deslocamento do ponto de pegada em relação ao canto superior esquerdo do "contêiner".
      // O contêiner é centralizado por padrão com left:50% + translateX(-50%), então aqui é
      // preciso usar o rect do contêiner e não o do próprio nó, senão ele "pula" ao arrastar.
      const wr = wrap.getBoundingClientRect();
      const offX = ev.clientX - wr.left;
      const offY = ev.clientY - wr.top;
      let moved = false;
      function mv(e2) {
        if (!moved && Math.abs(e2.clientX - ev.clientX) + Math.abs(e2.clientY - ev.clientY) < 3) return;
        moved = true;
        const w = wr.width, h = wr.height;
        const x = Math.max(4, Math.min(Math.max(4, window.innerWidth - w - 4), e2.clientX - offX));
        const y = Math.max(4, Math.min(Math.max(4, window.innerHeight - h - 4), e2.clientY - offY));
        wrap.style.transform = 'none';
        wrap.style.left = x + 'px';
        wrap.style.top = y + 'px';
      }
      function up() {
        window.removeEventListener('pointermove', mv, true);
        window.removeEventListener('pointerup', up, true);
        if (moved) {
          try {
            localStorage.setItem(LS_POS, JSON.stringify({
              x: parseFloat(wrap.style.left), y: parseFloat(wrap.style.top)
            }));
          } catch (e) { }
        } else if (onTap) {
          const t = Date.now();
          if (t - lastTap < 320) { lastTap = 0; resetPos(); }
          else { lastTap = t; onTap(); }
        }
      }
      window.addEventListener('pointermove', mv, true);
      window.addEventListener('pointerup', up, true);
      ev.stopPropagation();
    });
  }

  function pillBtn(text, fn) {
    const b = mk('button', [
      'all:unset', 'cursor:pointer', 'padding:3px 8px', 'border-radius:6px',
      'border:1px solid #30363d', 'background:#161b22', 'color:#c9d1d9',
      'font:11px/1.2 ' + MONO, 'white-space:nowrap'
    ].join(';'), text);
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); fn(); });
    return b;
  }

  function isInGame() {
    if (document.fullscreenElement || document.webkitFullscreenElement) return true;
    if (S.pcs > 0 && S.qosAt && Date.now() - S.qosAt < 15000) return true;
    // O video do stream nao e o mesmo que os trailers da biblioteca.
    return !!document.querySelector('video[src^="blob:"][autoplay], video[data-testid*="stream"]');
  }

  function nxViewportMode(){
    const orientation=(innerWidth>innerHeight?'landscape':'portrait');
    const fullscreen=!!(document.fullscreenElement||document.webkitFullscreenElement);
    const mode=orientation+'-'+(fullscreen?'fullscreen':'window');
    document.documentElement.dataset.nxViewportMode=mode;
    return {orientation,fullscreen,mode};
  }
  function nxControllerAnchor(){
    const nodes=document.querySelectorAll('header button,header [role="button"],header a,[role="banner"] button,[role="banner"] [role="button"],[data-testid*="header"] button,[class*="Header"] button,[class*="header"] button');
    for(const n of nodes){
      if(n.id==='nimboxcloud-library-button'||n.id==='nimboxcloud-native-keyboard-mouse'||n.closest('#__xcu_panel__'))continue;
      const r=n.getBoundingClientRect();
      if(r.width<18||r.height<18||r.top<0||r.top>Math.min(160,innerHeight*.25)||r.left<0||r.right>innerWidth)continue;
      const label=[n.getAttribute('aria-label'),n.title,n.getAttribute('data-testid'),n.getAttribute('data-tooltip'),n.querySelector('[aria-label]')?.getAttribute('aria-label'),n.querySelector('svg title')?.textContent].filter(Boolean).join(' ').toLowerCase();
      if(/controller|gamepad|controle|joystick|disconnected|desconectado|connected controller|controle conectado/.test(label))return n;
    }
    return null;
  }
  function nxButtonActuallyVisible(button, host) {
    if (!button || !button.isConnected) return false;
    const r = button.getBoundingClientRect();
    if (r.width < 18 || r.height < 18 || r.right <= 0 || r.bottom <= 0 ||
        r.left >= innerWidth || r.top >= innerHeight) return false;
    if (host && !host.contains(button)) return false;
    for (let n = button; n && n !== document.documentElement; n = n.parentElement) {
      const st = getComputedStyle(n);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) < 0.15) return false;
    }
    return true;
  }
  function nxHideDetachedControls(){
    if(nxLibraryButton)nxLibraryButton.style.display='none';
    if(nxKeyboardMouseButton)nxKeyboardMouseButton.style.display='none';
    if(pillEl)pillEl.style.display='none';
  }
  function nxMountControllerActions(){
    const anchor=nxControllerAnchor();
    if(!anchor?.parentElement)return false;
    nxMountNativeActions(anchor,true);
    nxLibraryButton.title='NimboXcloud — painel NX';
    return true;
  }
  function findProfileAnchor() {
    // O novo xCloud pode usar header, banner ou uma barra sem semantica HTML.
    // Priorizar o indicador de controle mostrado ao lado das notificacoes/perfil.
    const selectors = [
      'header button','header a','header [role="button"]',
      '[role="banner"] button','[role="banner"] a','[role="banner"] [role="button"]',
      '[data-testid*="header"] button','[data-testid*="header"] [role="button"]',
      '[class*="header"] button','[class*="Header"] button'
    ].join(',');
    const nodes = Array.from(new Set(document.querySelectorAll(selectors)))
      .filter(function (n) {
        if (n.id === 'nimboxcloud-library-button' || n.closest('#__xcu_panel__')) return false;
        const r = n.getBoundingClientRect();
        return r.width > 8 && r.height > 8 && r.top >= 0 && r.top < Math.min(150, innerHeight * .20);
      });
    const desc = function (n) {
      return [n.getAttribute('aria-label'),n.getAttribute('title'),
        n.getAttribute('data-testid'),n.getAttribute('data-state'),
        n.textContent && n.textContent.trim().slice(0,80)].filter(Boolean).join(' ').toLowerCase();
    };
    const controller = nxControllerAnchor();
    if (controller) return { node: controller, position: 'after' };
    // Fallback conservador: nao anexar em um elemento arbitrario da barra.
    return null;
  }

  // Botão minimalista da biblioteca: só o ícone branco sobre fundo transparente + pontinho de status.
  function buildLibraryButton() {
    const b = document.createElement('button');
    b.id = 'nimboxcloud-library-button';
    b.type = 'button';
    b.setAttribute('aria-label', 'Abrir painel NimboXcloud');
    b.title = 'NimboXcloud — configurações antes de jogar';
    b.style.cssText = [
      'all:unset', 'position:relative', 'display:inline-flex', 'align-items:center',
      'justify-content:center', 'box-sizing:border-box', 'width:40px', 'height:40px',
      'min-width:40px', 'margin:0 2px', 'border-radius:50%', 'background:transparent',
      'border:0', 'cursor:pointer', 'flex-shrink:0', 'opacity:1',
      'transition:opacity .15s ease,transform .15s ease',
      '-webkit-tap-highlight-color:transparent', 'z-index:' + ZBASE
    ].join(';');

    const icon = document.createElement('img');
    icon.src = BRAND_ICON;
    icon.alt = '';
    icon.draggable = false;
    icon.style.cssText = 'display:block;width:30px;height:30px;object-fit:contain;' +
      'pointer-events:none;filter:drop-shadow(0 0 3px rgba(0,0,0,.7))';
    b.appendChild(icon);

    nxLibraryDot = document.createElement('span');
    nxLibraryDot.style.cssText = 'position:absolute;right:3px;bottom:3px;width:8px;height:7px;' +
      'border-radius:50%;background:#8b949e;box-shadow:0 0 0 1.5px rgba(0,0,0,.6);pointer-events:none';
    b.appendChild(nxLibraryDot);

    b.addEventListener('pointerenter', function () { b.style.opacity = '1'; b.style.transform = 'scale(1.08)'; });
    b.addEventListener('pointerleave', function () { b.style.opacity = '1'; b.style.transform = 'none'; });
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); setOpen(!openUI, true);
    });
    return b;
  }

  let nxKeyboardMouseButton=null;
  function nxMountNativeActions(anchor,expanded){
    if(!anchor?.parentElement)return;
    const parent=anchor.parentElement;
    if(!nxLibraryButton)nxLibraryButton=buildLibraryButton();
    if(!nxKeyboardMouseButton){
      const b=document.createElement('button');b.id='nimboxcloud-native-keyboard-mouse';b.type='button';
      b.setAttribute('aria-label','Ativar ou desativar teclado e mouse NimboXcloud');
      b.title='Teclado e mouse NimboTouch';
      b.style.cssText='all:unset;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:40px;height:40px;min-width:40px;flex-shrink:0;cursor:pointer;border-radius:50%;color:white;position:relative;z-index:2147483000';
      b.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="pointer-events:none"><rect x="2" y="5" width="13" height="10" rx="2"/><path d="M4 9h9M5 12h7M7 18h6"/><rect x="17" y="4" width="5" height="12" rx="2.5"/><path d="M19.5 4v5"/></svg>';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const api=window.NimboTouch;if(!api?.toggle){toast('NimboTouch indisponível nesta sessão');return;}api.toggle();nxUpdateNativeTouchButton();});
      nxKeyboardMouseButton=b;
    }
    if(nxLibraryButton.parentElement!==parent||nxLibraryButton.previousElementSibling!==anchor)anchor.after(nxLibraryButton);
    if(nxKeyboardMouseButton.parentElement!==parent||nxKeyboardMouseButton.previousElementSibling!==nxLibraryButton)nxLibraryButton.after(nxKeyboardMouseButton);
    nxLibraryButton.style.display=expanded?'inline-flex':'none';
    nxKeyboardMouseButton.style.display=expanded?'inline-flex':'none';
    nxUpdateNativeTouchButton();
  }
  function nxUpdateNativeTouchButton(){
    if(!nxKeyboardMouseButton)return;
    const on=!!window.NimboTouch?.isEnabled?.();
    nxKeyboardMouseButton.setAttribute('aria-pressed',String(on));
    nxKeyboardMouseButton.style.background=on?'rgba(60,185,125,.28)':'transparent';
    nxKeyboardMouseButton.style.color=on?'#a4ffd0':'white';
    nxKeyboardMouseButton.title=on?'Desativar teclado e mouse':'Ativar teclado e mouse';
  }

  // Encontra a faixa compacta de controles do xCloud no canto superior esquerdo.
  // Não altera botões nativos: só acrescenta o acesso NX quando a estrutura é reconhecível.
  function findInGameToolbar() {
    // Detectar grupos nativos sem depender de coordenadas fixas no viewport.
    const candidates=[];
    for(const node of document.querySelectorAll('button,[role="button"]')){
      if(node.id==='nimboxcloud-library-button'||node.id==='nimboxcloud-native-keyboard-mouse'||node.closest('#__xcu_panel__')||node.closest('#nimbo-touch-root'))continue;
      const r=node.getBoundingClientRect();
      if(r.width<20||r.width>110||r.height<20||r.height>110||r.top<0||r.top>Math.min(155,innerHeight*.30)||r.left<0||r.right>innerWidth)continue;
      for(let p=node.parentElement,depth=0;p&&depth<4&&p!==document.body;depth++,p=p.parentElement){
        const pr=p.getBoundingClientRect();
        if(pr.width<65||pr.width>Math.min(innerWidth,800)||pr.height<25||pr.height>155||pr.top<0||pr.top>Math.min(150,innerHeight*.30))continue;
        const buttons=Array.from(p.querySelectorAll('button,[role="button"]')).filter(b=>{
          if(b.id==='nimboxcloud-library-button'||b.id==='nimboxcloud-native-keyboard-mouse'||b.closest('#__xcu_panel__'))return false;
          const br=b.getBoundingClientRect(),st=getComputedStyle(b);
          return br.width>=20&&br.height>=20&&br.top>=0&&br.right<=innerWidth&&st.display!=='none'&&st.visibility!=='hidden';
        });
        if(buttons.length<2||buttons.length>9)continue;
        const labels=buttons.map(b=>[b.getAttribute('aria-label'),b.title,b.getAttribute('data-testid')].filter(Boolean).join(' ').toLowerCase()).join(' ');
        const icons=buttons.filter(b=>b.querySelector('svg,img')).length;
        if(icons<2&&!/xbox|guide|guia|menu|more|mais|controle|controller/.test(labels))continue;
        const score=(/xbox|guide|guia/.test(labels)?6:0)+icons-Math.abs(buttons.length-4)-depth;
        candidates.push({node:buttons[buttons.length-1],score});
      }
    }
    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0]?.node||null;
  }

  function nxNativeToolbarOpen(anchor) {
    if (!anchor || !anchor.parentElement) return false;
    // O menu compacto pode manter um botão visível enquanto oculta o resto da barra.
    // Exigir pelo menos dois controles NATIVOS visíveis no mesmo grupo.
    const parent = anchor.parentElement;
    const buttons = Array.from(parent.querySelectorAll('button,[role="button"]')).filter(function (b) {
      if (b === nxLibraryButton || b === nxKeyboardMouseButton || b.id === 'nimboxcloud-library-button' || b.id === 'nimboxcloud-native-keyboard-mouse' || b.closest('#__xcu_panel__')) return false;
      const r = b.getBoundingClientRect();
      if (r.width < 20 || r.height < 20 || r.left < 0 || r.right > innerWidth ||
          r.top < 0 || r.bottom > innerHeight) return false;
      const st = getComputedStyle(b);
      return st.display !== 'none' && st.visibility !== 'hidden' && Number(st.opacity) >= 0.15;
    });
    return buttons.length >= 2;
  }
  function toolbarExpanded(anchor) {
    if (!anchor || !anchor.isConnected) return false;
    let n = anchor;
    for (let i = 0; n && i < 5; i++, n = n.parentElement) {
      const st = getComputedStyle(n);
      if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) < 0.15) return false;
      if (n !== anchor && st.pointerEvents === 'none') return false;
    }
    const r = anchor.getBoundingClientRect();
    return r.width >= 20 && r.height >= 20 && r.top >= 0 && r.left >= 0 && r.right <= innerWidth;
  }
  function positionNXCard(anchor) {
    if (!wrap || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const width = Math.min(380, Math.max(240, innerWidth - 16));
    const left = Math.max(8, Math.min(innerWidth - width - 8, r.left));
    const below = r.bottom + 10;
    const above = r.top - 10;
    const spaceBelow = innerHeight - below - 8;
    const useBelow = spaceBelow >= 280 || spaceBelow >= above - 8;
    wrap.style.width = width + 'px';
    wrap.style.left = left + 'px';
    wrap.style.right = 'auto';
    wrap.style.top = (useBelow ? Math.max(8, below) : 8) + 'px';
    wrap.style.bottom = 'auto';
    wrap.style.alignItems = 'stretch';
    if (cardEl) {
      cardEl.style.marginTop = '0';
      cardEl.style.maxHeight = Math.max(160, Math.min(640, useBelow ? spaceBelow : above - 16)) + 'px';
    }
  }

  // Drawer lateral mobile: mantém a maior parte do jogo visível.
  function nxCompactMobile() { return innerWidth <= 950 && (navigator.maxTouchPoints || 0) > 0; }
  // Mobile: o acesso fechado e apenas um icone compacto, nunca uma barra horizontal.
  // Posicionamento independente da orientacao e do tamanho do viewport.
  function nxPositionMobileDrawer() {
    if (!wrap) return;
    wrap.style.position='fixed';wrap.style.transform='none';
    wrap.style.left='auto';wrap.style.right='max(8px,env(safe-area-inset-right,8px))';
    wrap.style.top='auto';wrap.style.bottom='max(64px,env(safe-area-inset-bottom,8px))';
    wrap.style.width='44px';wrap.style.maxWidth='44px';wrap.style.height='auto';
    wrap.style.alignItems='flex-end';wrap.style.display='flex';
    wrap.style.pointerEvents='none';
    if(pillEl){
      pillEl.style.display='inline-flex';pillEl.style.boxSizing='border-box';
      pillEl.style.width='44px';pillEl.style.minWidth='44px';pillEl.style.maxWidth='44px';
      pillEl.style.height='44px';pillEl.style.padding='0';pillEl.style.margin='0';
      pillEl.style.justifyContent='center';pillEl.style.borderRadius='14px';
      pillEl.setAttribute('aria-label','Abrir painel NX');
    }
    if(dotEl)dotEl.style.display='none';
    if(pillTxt)pillTxt.style.display='none';
    if(nxLibraryButton)nxLibraryButton.style.display='none';
    if(nxKeyboardMouseButton)nxKeyboardMouseButton.style.display='none';
    if(pillEl)pillEl.style.display='none';
  }
  function nxDockPanel() {
    if (!wrap || !cardEl) return;
    const isMobile = /Android|iPhone|iPad/i.test(nxConsoleNativeUA) && !(window.matchMedia && matchMedia('(pointer:fine) and (min-width:1000px)').matches);
    const width = isMobile ? Math.min(520, Math.round(innerWidth * .94)) : Math.min(640, Math.max(400, Math.round(innerWidth * .43)));
    wrap.style.left='auto';wrap.style.right='0';wrap.style.top='0';wrap.style.bottom='0';
    wrap.style.width=Math.min(innerWidth,width)+'px';wrap.style.maxWidth='100vw';wrap.style.height='100dvh';
    wrap.style.alignItems='stretch';wrap.style.display='flex';
    cardEl.style.maxWidth='100%';cardEl.style.maxHeight='100dvh';cardEl.style.height='100dvh';
    // Overlay: o painel flutua sobre o jogo e nunca redimensiona o vídeo.
    wrap.style.pointerEvents='none';cardEl.style.pointerEvents='auto';
    cardEl.style.marginTop='0';cardEl.style.borderRadius='0';
    if(pillEl)pillEl.style.display='none';
    if(nxLibraryButton)nxLibraryButton.style.display='none';
  }
  // Native xCloud navigation always wins over the editable touch HUD.
  // Disable touch hit targets while its toolbar is expanded, without changing
  // the NimboTouch activation state or the saved HUD layout.
  let nxNativeMenuParent=null;
  function nxNativeMenuPriority(expanded,anchor){
    const parent=expanded&&anchor?.parentElement||null;
    if(nxNativeMenuParent&&nxNativeMenuParent!==parent){
      nxNativeMenuParent.classList.remove('nx-native-menu-priority');
    }
    nxNativeMenuParent=parent;
    if(parent)parent.classList.add('nx-native-menu-priority');
    document.documentElement.classList.toggle('nx-native-menu-expanded',!!parent);
    nxSyncTouchMenuBlock(!!parent);
  }
  (function(){
    const css=document.createElement('style');css.id='nx-native-menu-priority-style';
    css.textContent=[
      '.nx-native-menu-priority{position:relative!important;z-index:2147483100!important;isolation:isolate!important}',
      'html.nx-native-menu-expanded #nimbo-touch-root .hud-button,html.nx-native-menu-expanded #nimbo-touch-root .hud-stick,html.nx-native-menu-expanded #nimbo-touch-root .pad{pointer-events:none!important}',
      'html.nx-native-menu-expanded #nimbo-touch-root .mapped{pointer-events:none!important}'
    ].join('');
    (document.head||document.documentElement).appendChild(css);
  })();
  function nxSyncTouchMenuBlock(nativeOpen){
    try{window.NimboTouch?.setMenuBlocked?.(!!nativeOpen||openUI);}catch(e){S.lastErr='NX touch menu: '+String(e?.message||e);}
  }
  function syncNXPlacement() {
    nxViewportMode();
    if (!wrap || !wrap.isConnected) return;
    if (openUI) { nxNativeMenuPriority(false,null); nxDockPanel(); return; }
    const playing = isInGame();
    const mode = playing ? 'game' : 'library';
    if (nxMode !== mode) {
      nxMode = mode;
      // A navegação do xCloud não deve cancelar uma abertura solicitada pelo jogador.
      if (!userTouched) { openUI = false; if (cardEl) cardEl.style.display = 'none'; }
      if (pickEl) pickEl.style.display = 'none';
    }
    if (playing) {
      const nativeAnchor=findInGameToolbar();
      nxNativeMenuPriority(!!nativeAnchor&&toolbarExpanded(nativeAnchor)&&nxNativeToolbarOpen(nativeAnchor),nativeAnchor);
      if (nxCompactMobile()) {
        if (micTestStream) stopMicrophoneTest();
        const expanded = !!nativeAnchor && toolbarExpanded(nativeAnchor) && nxNativeToolbarOpen(nativeAnchor);
        if (expanded) nxMountNativeActions(nativeAnchor, true);
        else nxHideDetachedControls();

        // Em telas móveis (retrato/paisagem), nunca confiar apenas no estado
        // "expanded" da barra: o botão pode estar fora da viewport, recortado
        // por um ancestral ou fora do elemento real de tela cheia.
        const fsHost = fullscreenHost();
        const integratedVisible = expanded && nxButtonActuallyVisible(nxLibraryButton, fsHost);
        if (!integratedVisible) {
          if (nxLibraryButton) nxLibraryButton.style.display = 'none';
          if (nxKeyboardMouseButton) nxKeyboardMouseButton.style.display = 'none';
        }
        if (!openUI && wrap) {
          wrap.style.display = 'flex';
          wrap.style.position = 'fixed';
          wrap.style.transform = 'none';
          wrap.style.left = 'auto';
          wrap.style.right = 'max(12px, env(safe-area-inset-right, 12px))';
          wrap.style.top = 'max(12px, env(safe-area-inset-top, 12px))';
          wrap.style.bottom = 'auto';
          wrap.style.width = '44px';
          wrap.style.maxWidth = '44px';
          wrap.style.alignItems = 'flex-end';
          if (pillEl) {
            pillEl.style.display = integratedVisible ? 'none' : 'inline-flex';
            pillEl.style.width = '44px';
            pillEl.style.minWidth = '44px';
            pillEl.style.maxWidth = '44px';
            pillEl.style.height = '44px';
            pillEl.style.padding = '0';
            pillEl.style.gap = '0';
            pillEl.style.justifyContent = 'center';
            pillEl.style.borderRadius = '14px';
          }
          if (!integratedVisible) {
            if (dotEl) dotEl.style.display = 'none';
            if (pillTxt) pillTxt.style.display = 'none';
          }
        }
        return;
      }
      if (micTestStream) stopMicrophoneTest(); // Nunca manter a captura de diagnóstico durante a sessão.
      const gameAnchor = findInGameToolbar();
      if (gameAnchor && gameAnchor.parentElement) {
        const expanded = toolbarExpanded(gameAnchor) && nxNativeToolbarOpen(gameAnchor);
        nxMountNativeActions(gameAnchor,expanded);
        nxLibraryButton.title = 'Abrir NimboXcloud durante a partida';
        // Só esconder a pílula quando o botão integrado estiver realmente renderizado.
        // Em layout desktop/janela o shell pode ser detectado, mas estar recortado ou oculto.
        const integratedVisible = expanded && nxButtonActuallyVisible(nxLibraryButton, fullscreenHost());
        if (!integratedVisible) {
          nxLibraryButton.style.display = 'none';
          if (nxKeyboardMouseButton) nxKeyboardMouseButton.style.display = 'none';
        }
        wrap.style.display = 'flex';
        if (pillEl) pillEl.style.display = openUI || integratedVisible ? 'none' : 'inline-flex';
        if (!openUI && !integratedVisible) {
          wrap.style.position = 'fixed';
          wrap.style.transform = 'none';
          wrap.style.left = 'auto';
          wrap.style.right = '12px';
          wrap.style.top = '12px';
          wrap.style.bottom = 'auto';
          wrap.style.width = '360px';
          wrap.style.maxWidth = 'calc(100vw - 16px)';
          wrap.style.alignItems = 'flex-end';
        }
        if (openUI) {
          if (integratedVisible) positionNXCard(nxLibraryButton);
          else { wrap.style.left='8px'; wrap.style.right='auto'; wrap.style.top='58px'; wrap.style.width=Math.min(380,innerWidth-16)+'px'; }
        }
      } else {
        // Quando a barra nativa não é reconhecida, manter acesso NX independente.
        if (nxLibraryButton) nxLibraryButton.style.display = 'none';
        if (pillEl) pillEl.style.display = openUI ? 'none' : 'inline-flex';
        wrap.style.display = 'flex';
        if (openUI) {
          wrap.style.left = '8px'; wrap.style.right = 'auto'; wrap.style.top = '58px';
          wrap.style.width = Math.min(380, innerWidth - 16) + 'px';
          wrap.style.alignItems = 'stretch';
          if (cardEl) cardEl.style.maxHeight = Math.max(160, innerHeight - 70) + 'px';
        }
      }
      return;
    }
    nxNativeMenuPriority(false,null);
    const placement = findProfileAnchor();
    const anchor = placement && placement.node;
    // Em Fullscreen API, somente os descendentes do elemento fullscreen são renderizados.
    // O header do xCloud pode continuar no body; nesse caso o botão integrado fica invisível.
    // Use a pílula NX, que já está montada dentro do fullscreenHost, como acesso confiável.
    const fsHost = fullscreenHost();
    const anchorInsideFullscreen = !!(fsHost && anchor && (fsHost === anchor || fsHost.contains(anchor)));
    if (fsHost && anchor && !anchorInsideFullscreen) {
      if (nxLibraryButton) nxLibraryButton.style.display = 'none';
      if (nxKeyboardMouseButton) nxKeyboardMouseButton.style.display = 'none';
      wrap.style.display = 'flex';
      wrap.style.position = 'fixed';
      wrap.style.transform = 'none';
      wrap.style.left = 'auto';
      wrap.style.right = 'max(12px, env(safe-area-inset-right, 12px))';
      wrap.style.top = 'max(12px, env(safe-area-inset-top, 12px))';
      wrap.style.bottom = 'auto';
      wrap.style.width = '44px';
      wrap.style.maxWidth = '44px';
      wrap.style.alignItems = 'flex-end';
      if (pillEl) {
        pillEl.style.display = 'inline-flex';
        pillEl.style.width = '44px';
        pillEl.style.height = '44px';
        pillEl.style.padding = '0';
        pillEl.style.gap = '0';
        pillEl.style.justifyContent = 'center';
        pillEl.style.borderRadius = '14px';
      }
      if (dotEl) dotEl.style.display = 'none';
      if (pillTxt) pillTxt.style.display = 'none';
      return;
    }
    if (anchor && anchor.parentElement) {
      if (!nxLibraryButton) nxLibraryButton = buildLibraryButton();
      if (placement.position === 'after') {
        if (nxLibraryButton.parentElement !== anchor.parentElement || nxLibraryButton.previousElementSibling !== anchor) anchor.after(nxLibraryButton);
      } else {
        if (nxLibraryButton.parentElement !== anchor.parentElement || nxLibraryButton.nextElementSibling !== anchor) anchor.before(nxLibraryButton);
      }
      nxLibraryButton.style.display = 'inline-flex';
      // Biblioteca: somente NX. Teclado/mouse e um controle exclusivo da partida.
      if(nxKeyboardMouseButton)nxKeyboardMouseButton.style.display='none';
      nxLibraryAnchor = anchor;
      wrap.style.display = 'flex';
      wrap.style.position = 'fixed';
      wrap.style.transform = 'none';
      wrap.style.left = 'auto';
      wrap.style.right = '12px';
      const ar = nxLibraryButton.getBoundingClientRect();
      wrap.style.top = Math.min(innerHeight - 48, Math.max(44, ar.bottom + 8)) + 'px';
      wrap.style.alignItems = 'flex-end';
      // Um único acesso: o botão da barra substitui a pílula flutuante.
      // Se o botão integrado estiver recortado/invisível, preservar o fallback.
      const buttonRect = nxLibraryButton.getBoundingClientRect();
      let buttonVisible = buttonRect.width >= 18 && buttonRect.height >= 18 &&
        buttonRect.top >= 0 && buttonRect.bottom <= innerHeight &&
        buttonRect.left >= 0 && buttonRect.right <= innerWidth;
      // A geometria do botão pode existir mesmo quando um ancestral o oculta
      // (display/visibility/opacity) durante fullscreen, rotação ou transição do shell.
      for (let n = nxLibraryButton; buttonVisible && n && n !== document.documentElement; n = n.parentElement) {
        const st = getComputedStyle(n);
        if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) < 0.15) buttonVisible = false;
      }
      if (fsHost && !fsHost.contains(nxLibraryButton)) buttonVisible = false;
      if (pillEl) {
        pillEl.style.display = buttonVisible ? 'none' : 'inline-flex';
        if (!buttonVisible) {
          pillEl.style.width = '44px';
          pillEl.style.height = '44px';
          pillEl.style.padding = '0';
          pillEl.style.gap = '0';
          pillEl.style.justifyContent = 'center';
          pillEl.style.borderRadius = '14px';
          if (dotEl) dotEl.style.display = 'none';
          if (pillTxt) pillTxt.style.display = 'none';
          wrap.style.width = '44px';
          wrap.style.maxWidth = '44px';
          wrap.style.right = 'max(12px, env(safe-area-inset-right, 12px))';
          wrap.style.top = 'max(12px, env(safe-area-inset-top, 12px))';
        } else {
          pillEl.style.width = '';
          pillEl.style.height = '';
          pillEl.style.padding = '';
          pillEl.style.gap = '';
          pillEl.style.justifyContent = '';
          pillEl.style.borderRadius = '';
          if (dotEl) dotEl.style.display = '';
          if (pillTxt) pillTxt.style.display = '';
          wrap.style.width = '360px';
          wrap.style.maxWidth = 'calc(100vw - 16px)';
        }
      }
    } else {
      // Barra do site ainda não carregou: fallback temporário com a pílula.
      nxHideDetachedControls();
      wrap.style.display = 'flex';
      wrap.style.position = 'fixed';
      wrap.style.transform = 'none';
      wrap.style.left = 'auto';
      wrap.style.right = '12px';
      wrap.style.top = '12px';
      wrap.style.alignItems = 'flex-end';
      if (pillEl) pillEl.style.display = 'inline-flex';
    }
  }

  // ---------- 13b. Painel profissional: abas por categoria ----------
  // Categorias: Geral · Streaming · Mídia · Controles · Região · Avançado.
  // As abas são renderizadas sob demanda; os valores ao vivo são atualizados por liveFns,
  // sem reconstruir o DOM (mantém rolagem, foco e slider durante a atualização).
  const UI_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
  const C = {
    bg: 'rgba(12,16,22,.97)', panel: 'rgba(255,255,255,.045)', line: 'rgba(255,255,255,.09)',
    text: '#e8edf3', dim: '#8b96a5', accent: '#4ade80', good: '#3fb950', warn: '#d29922', bad: '#f85149'
  };
  const NS = 'http://www.w3.org/2000/svg';
  const ICONS = {
    overview: 'M22 12h-4l-3 9L9 3l-3 9H2',
    stream: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    media: 'M11 5L6 9H2v6h4l5 4V5z M15.5 8.5a5 5 0 0 1 0 7 M19 5a10 10 0 0 1 0 14',
    audio: 'M11 5L6 9H2v6h4l5 4V5z M15.5 8.5a5 5 0 0 1 0 7 M19 5a10 10 0 0 1 0 14',
    voice: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3 M8 22h8',
    controls: 'M6 12h4 M8 10v4 M15 13h.01 M18 11h.01 M17.3 5H6.7a4 4 0 0 0-3.9 3.3L1.5 15a3 3 0 0 0 5.3 2L8 15h8l1.2 2a3 3 0 0 0 5.3-2l-1.3-6.7A4 4 0 0 0 17.3 5z',
    region: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
    advanced: 'M9 2h6v4H9z M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2 M8 12h8 M8 16h5',
    close: 'M18 6L6 18 M6 6l12 12'
  };
  const TABS = [
    { id: 'overview', label: 'Início', desc: 'Resumo da sessão e acesso rápido' },
    { id: 'stream', label: 'Streaming', desc: 'Qualidade, conexão e imagem' },
    { id: 'audio', label: 'Áudio', desc: 'Volume, equalizador e reprodução' },
    { id: 'voice', label: 'Voz e acessórios', desc: 'Microfone e vibração' },
    { id: 'controls', label: 'Controles', desc: 'Entrada, gamepad e toque' },
    { id: 'region', label: 'Rede e região', desc: 'Servidores e disponibilidade' },
    { id: 'advanced', label: 'Sistema', desc: 'Diagnóstico e manutenção' }
  ];
  const PRESETS = [
    { name: 'Máximo', res: 'hq', br: 'auto', sub: 'Melhor imagem' },
    { name: 'Equilibrado', res: 'auto', br: 'auto', sub: '1080p · bitrate automático' },
    { name: 'Compatível', res: 'auto', br: 'auto', sub: '1080p · perfil desktop' }
  ];

  let tabId = 'overview';
  let liveFns = [];
  let toastTimer = 0;
  let sliderDragging = false;
  window.addEventListener('pointerup', function () { sliderDragging = false; }, true);
  window.addEventListener('pointercancel', function () { sliderDragging = false; }, true);

  function ico(d, size) {
    const s = document.createElement('span');
    s.style.cssText = 'display:inline-flex;width:' + (size || 18) + 'px;height:' + (size || 18) + 'px;flex:0 0 auto;pointer-events:none';
    s.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
    return s;
  }

  function stopEv(e) { e.stopPropagation(); }
  function fmtN(v, unit, d) {
    return v == null || !Number.isFinite(Number(v)) ? '—' : Number(v).toFixed(d || 0) + (unit || '');
  }
  function curLoss() {
    const q = S.qos;
    return q ? (q.instLoss != null ? q.instLoss : (q.loss || 0)) : null;
  }
  function lossColor(l) { return l == null ? C.dim : (l < 2 ? C.good : (l < 5 ? C.warn : C.bad)); }
  function runLive() {
    for (let i = 0; i < liveFns.length; i++) { try { liveFns[i](); } catch (e) { } }
  }
  function streaming() { return !!(S.qosAt && Date.now() - S.qosAt < 8000 && S.qos); }

  function linkState() {
    const q = S.qos;
    if (!streaming()) return { text: 'Sem partida em andamento', sub: 'Os ajustes valem na próxima partida, sem recarregar.', color: C.dim };
    const loss = curLoss();
    const rtt = q.rtt;
    if (loss >= 5 || (rtt != null && rtt >= 160)) return { text: 'Conexão instável', sub: S.lastDiagnosis, color: C.bad };
    if (loss >= 2 || (rtt != null && rtt >= 100)) return { text: 'Conexão regular', sub: S.lastDiagnosis, color: C.warn };
    return { text: 'Conexão estável', sub: S.lastDiagnosis, color: C.good };
  }

  function regionDiffs() {
    const c = cfg();
    const wantT = String(c.territory || '').toUpperCase();
    const curT = String(getCookie('territory') || '').toUpperCase();
    const expRaw = String(S.expAfter || '').toUpperCase();
    const expT = /^[A-Z]{2}$/.test(expRaw) ? expRaw : '';
    const d = [];
    if (wantT) {
      if (!curT) d.push('Cookie de território ausente');
      else if (curT !== wantT) d.push('Território real ' + curT + ', configurado ' + wantT);
      if (expT && expT !== wantT) d.push('IP detectado como ' + expT + ', não foi alterado para ' + wantT);
    }
    return d;
  }

  function hintOne(q, loss) {
    if (!q) return '';
    if (loss != null && loss > 5) {
      if (!v4on()) return 'Perda alta: ative "Forçar IPv4" em Streaming';
      if (srvCfg().name !== 'JAPANEAST') return 'Perda de ' + loss.toFixed(1) + '%: em Streaming, escolha Tóquio e compare outra partida';
      return 'Tóquio também perde ' + loss.toFixed(1) + '% → problema de linha, não de qualidade nem de data center';
    }
    if (q.decoded || q.dropped) {
      const dr = q.dropped / ((q.decoded + q.dropped) || 1) * 100;
      if (dr > 5 && (loss == null || loss < 3)) return 'Quadros descartados ' + dr.toFixed(1) + '% mas perda baixa → a decodificação local não acompanha';
    }
    if (q.family === 'IPv6') return 'Usando IPv6; ative "Forçar IPv4" em Streaming para comparar';
    return '';
  }

  // ----- Componentes -----
  function group(title, hint) {
    const root = mk('div', 'margin-top:14px');
    root.appendChild(mk('div', 'color:' + C.dim + ';font-size:10.5px;font-weight:700;letter-spacing:.08em;' +
      'text-transform:uppercase;margin:0 2px 6px', title));
    const card = mk('div', 'background:' + C.panel + ';border:1px solid ' + C.line + ';border-radius:12px;padding:2px 12px');
    root.appendChild(card);
    if (hint) root.appendChild(mk('div', 'color:' + C.dim + ';font-size:11px;line-height:1.4;margin:6px 2px 0', hint));
    return {
      root: root, card: card,
      add: function (n) {
        if (card.children.length) n.style.borderTop = '1px solid ' + C.line;
        card.appendChild(n);
        return n;
      }
    };
  }

  function setRow(label, desc, ctrl, stacked) {
    const r = mk('div', 'padding:12px 0;display:flex;flex-direction:column;gap:9px;align-items:stretch;justify-content:flex-start;min-width:0');
    const t = mk('div', 'min-width:0;width:100%;flex:0 0 auto');
    t.appendChild(mk('div', 'font-size:13px;font-weight:600;color:' + C.text, label));
    const d = mk('div', 'font-size:11px;color:' + C.dim + ';margin-top:2px;line-height:1.4;word-break:break-word', desc || '');
    if (!desc) d.style.display = 'none';
    t.appendChild(d);
    r.appendChild(t);
    if (ctrl) { ctrl.style.maxWidth='100%';ctrl.style.minWidth='0';ctrl.style.alignSelf='flex-start';r.appendChild(ctrl); }
    r._desc = d;
    return r;
  }

  function liveDesc(row, getter) {
    liveFns.push(function () {
      const v = getter();
      row._desc.textContent = v;
      row._desc.style.display = v ? 'block' : 'none';
    });
  }

  function infoRow(label, getter, desc) {
    const v = mk('div', 'font-size:12.5px;font-weight:600;color:' + C.text + ';text-align:left;max-width:100%;' +
      'word-break:break-word;font-variant-numeric:tabular-nums', '—');
    liveFns.push(function () { v.textContent = String(getter()); });
    return setRow(label, desc, v);
  }

  function chips(opts, cur, pick) {
    const w = mk('div', 'display:flex;flex-wrap:wrap;gap:6px');
    w.setAttribute('role', 'radiogroup');
    opts.forEach(function (o) {
      const on = o.k === cur;
      const b = mk('button', 'all:unset;box-sizing:border-box;display:inline-flex;align-items:center;cursor:pointer;' +
        'padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;line-height:1.2;white-space:nowrap;' +
        'border:1px solid ' + (on ? C.accent : C.line) + ';background:' + (on ? 'rgba(74,222,128,.14)' : 'transparent') +
        ';color:' + (on ? C.accent : C.text) + ';-webkit-tap-highlight-color:transparent', o.label);
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.addEventListener('pointerdown', stopEv);
      b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); pick(o.k); });
      w.appendChild(b);
    });
    return w;
  }

  function toggle(on, fn, label) {
    const b = mk('button', 'all:unset;position:relative;display:block;box-sizing:border-box;cursor:pointer;width:44px;height:26px;' +
      'border-radius:13px;flex:0 0 auto;background:' + (on ? C.accent : 'rgba(255,255,255,.18)') +
      ';transition:background .15s;-webkit-tap-highlight-color:transparent');
    b.appendChild(mk('span', 'position:absolute;top:3px;left:' + (on ? '21px' : '3px') +
      ';width:20px;height:20px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.45)'));
    b.setAttribute('role', 'switch');
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    if (label) b.setAttribute('aria-label', label);
    b.addEventListener('pointerdown', stopEv);
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); fn(); });
    return b;
  }

  function actBtn(label, fn, kind) {
    const styles = {
      primary: 'background:' + C.accent + ';color:#06210f;border:1px solid ' + C.accent,
      danger: 'background:rgba(248,81,73,.12);color:#ff7b72;border:1px solid rgba(248,81,73,.4)',
      ghost: 'background:transparent;color:' + C.text + ';border:1px solid ' + C.line
    };
    const b = mk('button', 'all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;' +
      'cursor:pointer;padding:8px 14px;border-radius:9px;font-size:12px;font-weight:700;line-height:1.2;text-align:center;' +
      '-webkit-tap-highlight-color:transparent;' + styles[kind || 'ghost'], label);
    b.setAttribute('role', 'button');
    b.addEventListener('pointerdown', stopEv);
    b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); fn(); });
    return b;
  }

  function note(text, tone) {
    const warn = tone === 'warn';
    return mk('div', 'margin-bottom:2px;padding:9px 11px;border-radius:10px;font-size:11.5px;line-height:1.45;border:1px solid ' +
      (warn ? 'rgba(210,153,34,.35)' : C.line) + ';background:' + (warn ? 'rgba(210,153,34,.1)' : C.panel) +
      ';color:' + (warn ? '#e3b341' : C.dim), text);
  }

  function statTile(label, getter) {
    const box = mk('div', 'background:' + C.panel + ';border:1px solid ' + C.line + ';border-radius:10px;padding:8px 10px;min-width:0');
    box.appendChild(mk('div', 'color:' + C.dim + ';font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase', label));
    const val = mk('div', 'font-size:17px;font-weight:700;margin-top:3px;font-variant-numeric:tabular-nums;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis', '—');
    box.appendChild(val);
    liveFns.push(function () { const r = getter(); val.textContent = r.text; val.style.color = r.color || C.text; });
    return box;
  }

  function spark(label, key, color, unit, floorMax) {
    const box = mk('div', 'padding:11px 0');
    const head = mk('div', 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px');
    head.appendChild(mk('span', 'font-size:13px;font-weight:600', label));
    const val = mk('span', 'font-size:12px;color:' + C.dim + ';font-variant-numeric:tabular-nums', '—');
    head.appendChild(val);
    box.appendChild(head);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 300 46');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '46');
    svg.style.cssText = 'display:block;background:rgba(255,255,255,.03);border-radius:8px';
    const base = document.createElementNS(NS, 'line');
    base.setAttribute('x1', '0'); base.setAttribute('x2', '300'); base.setAttribute('y1', '45'); base.setAttribute('y2', '45');
    base.setAttribute('stroke', 'rgba(255,255,255,.12)'); base.setAttribute('stroke-width', '1');
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', color); line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linejoin', 'round'); line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(base); svg.appendChild(line);
    box.appendChild(svg);
    liveFns.push(function () {
      const vals = S.qosHistory.slice(-45).map(function (p) { return Number(p[key]); }).filter(Number.isFinite);
      if (vals.length < 2) { line.setAttribute('points', ''); val.textContent = '—'; return; }
      const max = Math.max(floorMax, Math.max.apply(null, vals));
      line.setAttribute('points', vals.map(function (v, i) {
        return (i * 300 / (vals.length - 1)).toFixed(1) + ',' + (42 - Math.max(0, v) / max * 38).toFixed(1);
      }).join(' '));
      val.textContent = vals[vals.length - 1].toFixed(0) + unit;
    });
    return box;
  }

  function toast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.style.opacity = '1';
    el.toast.style.transform = 'translate(-50%,0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.style.opacity = '0';
      el.toast.style.transform = 'translate(-50%,6px)';
    }, 2300);
  }

  function copyText(text, tag, okMsg) {
    const fail = function () { toast('Cópia bloqueada; diagnóstico não exibido no console por privacidade'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fail);
        return;
      }
    } catch (e) { }
    fail();
  }
  function nxUnifiedReport() {
    let general = {};
    try { general = JSON.parse(buildReport()); } catch (e) { general = { error: String(e) }; }
    const full = {
      schema: 'nimboxcloud-unified-v1', version: VER, capturedAt: new Date().toISOString(),
      consoleLab: nxConsoleLabReport(), gameAndInput: general,
      sessionHealth: nxSessionHealth(),
      system: { server: srvCfg().name || 'auto', quality: resCfg().label,
        bitrate: bitrateCfg().mbps || 'auto', qos: S.qos, latencyByServer: S.latencyByServer,
        recoveries: S.nxRecoveries, warnings: S.diagnosticsWarnings,
        micStatus: S.micStatus, vibrationStatus: S.vibrationStatus,
        remotePlayStatus: S.remotePlayStatus, lastError: S.lastErr },
      history: { samples: S.qosHistory, diagnosis: S.lastDiagnosis }
    };
    function sanitize(v, key, depth) {
      if (depth > 15) return '[limit]';
      if (/token|authorization|cookie|secret|credential|xuid|user.?id|account|email|session.?id|subscriptionContext/i.test(key)) return '[redacted]';
      if (typeof v === 'string') {
        let value = v.replace(/xuid\(\d+\)/gi, 'xuid([redacted])')
          .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
          .replace(/([?&](?:token|sig|auth|code|key|id)=)[^&\s]+/gi, '$1[redacted]');
        if (value.includes('?')) value = value.split('?')[0] + '?[query-redacted]';
        return value.slice(0, 1000);
      }
      if (Array.isArray(v)) return v.slice(0, 110).map(function (x) { return sanitize(x, key, depth + 1); });
      if (v && typeof v === 'object') {
        const out = {};
        Object.keys(v).slice(0, 90).forEach(function (k) { out[k] = sanitize(v[k], k, depth + 1); });
        return out;
      }
      return v;
    }
    return sanitize(full, '', 0);
  }
  function copyUnifiedReport() {
    copyText(JSON.stringify(nxUnifiedReport(), null, 2), '[NX unified]', 'Diagnóstico completo copiado');
  }
  function copyReport() { copyUnifiedReport(); }
  function copyHistory() {
    copyText(JSON.stringify(nxUnifiedReport().history, null, 2), '[NX history]', 'Histórico copiado');
  }
  function copyDiag() {
    // Compartilha a sanitização do relatório unificado, sem caminhos alternativos não filtrados.
    copyText(JSON.stringify(nxUnifiedReport(), null, 2), '[NX diagnostic]', 'Diagnóstico copiado');
  }

  // ----- Abas -----
  // Editor de layout local: não cria botões de gameplay nem modifica o HUD nativo.
  const NX_HUD_LAYOUT_KEY = 'nx.hud.editor.layout.v1';
  const NX_HUD_DEFAULT = Object.freeze({
    stickL: [17, 65], stickR: [80, 65], a: [88, 42], b: [74, 45],
    x: [78, 28], y: [91, 25], lt: [12, 16], rt: [88, 16]
  });
  function nxHudValidateLayout(value) {
    const result = {};
    Object.keys(NX_HUD_DEFAULT).forEach(function (id) {
      const pos = value && Object.prototype.hasOwnProperty.call(value, id) ? value[id] : null;
      result[id] = Array.isArray(pos) && pos.length === 2 && pos.every(Number.isFinite) ?
        pos.map(function (n) { return Math.max(5, Math.min(95, Math.round(n))); }) :
        NX_HUD_DEFAULT[id].slice();
    });
    return result;
  }
  const NX_HUD_PROFILES_KEY = 'nx.hud.editor.profiles.v1';
  function nxHudProfileName(name) {
    if (typeof name !== 'string') return '';
    const clean = name.trim();
    if (['__proto__', 'constructor', 'prototype'].includes(clean.toLowerCase())) return '';
    return /^[A-Za-zÀ-ÿ0-9 _-]{1,32}$/u.test(clean) ? clean : '';
  }
  function nxHudProfilesRead() {
    try {
      const parsed = JSON.parse(getPref(NX_HUD_PROFILES_KEY, '{}'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      const result = {};
      Object.keys(parsed).slice(0, 20).forEach(function (name) {
        const clean = nxHudProfileName(name);
        if (clean && parsed[name] && typeof parsed[name] === 'object' && !Array.isArray(parsed[name]))
          result[clean] = nxHudValidateLayout(parsed[name]);
      });
      return result;
    } catch (_) { return {}; }
  }
  function nxHudProfileSave(name) {
    const clean = nxHudProfileName(name);
    if (!clean) return false;
    const profiles = nxHudProfilesRead();
    if (!Object.prototype.hasOwnProperty.call(profiles, clean) && Object.keys(profiles).length >= 20) return false;
    profiles[clean] = nxHudReadLayout();
    const value = JSON.stringify(profiles);
    try {
      localStorage.setItem(NX_HUD_PROFILES_KEY, value);
      return localStorage.getItem(NX_HUD_PROFILES_KEY) === value;
    } catch (_) { return false; }
  }
  function nxHudProfileLoad(name) {
    const profiles = nxHudProfilesRead();
    if (!Object.prototype.hasOwnProperty.call(profiles, name)) return false;
    const value = JSON.stringify(nxHudValidateLayout(profiles[name]));
    try {
      localStorage.setItem(NX_HUD_LAYOUT_KEY, value);
      return localStorage.getItem(NX_HUD_LAYOUT_KEY) === value;
    } catch (_) { return false; }
  }
  function nxHudProfileDelete(name) {
    // Remoção transacional de melhor esforço: perfis e associações devem permanecer coerentes.
    const profiles = nxHudProfilesRead();
    if (!Object.prototype.hasOwnProperty.call(profiles, name)) return false;
    const bindings = nxHudGameBindings();
    delete profiles[name];
    Object.keys(bindings).forEach(function (id) {
      if (bindings[id] === name) delete bindings[id];
    });
    const writes = [
      [NX_HUD_PROFILES_KEY, JSON.stringify(profiles)],
      [NX_HUD_GAME_BINDINGS_KEY, JSON.stringify(bindings)]
    ];
    const previous = [];
    try {
      writes.forEach(function (pair) { previous.push([pair[0], localStorage.getItem(pair[0])]); });
      writes.forEach(function (pair) {
        localStorage.setItem(pair[0], pair[1]);
        if (localStorage.getItem(pair[0]) !== pair[1])
          throw new Error('HUD storage write verification failed');
      });
    } catch (_) {
      previous.forEach(function (pair) {
        try {
          if (pair[1] === null) localStorage.removeItem(pair[0]);
          else localStorage.setItem(pair[0], pair[1]);
        } catch (_) {}
      });
      return false;
    }
    nxHudLastRoute = null;
    nxHudLastAppliedProfile = '';
    return true;
  }
  const NX_HUD_GAME_BINDINGS_KEY = 'nx.hud.editor.gameBindings.v1';
  function nxHudGameId(raw) {
    if (typeof raw !== 'string') return '';
    const value = raw.trim().toLowerCase();
    return /^[a-z0-9_-]{2,64}$/.test(value) ? value : '';
  }
  function nxHudCurrentGameId() {
    try {
      const parts = new URL(location.href).pathname.split('/').filter(Boolean);
      const index = parts.indexOf('play');
      if (index < 0) return '';
      const candidates = parts.slice(index + 1);
      if (candidates[0] === 'games') candidates.shift();
      if (!candidates.length) return '';
      const candidate = candidates[candidates.length - 1];
      if (['home', 'search', 'library', 'settings', 'social', 'friends', 'profile', 'games',
        'all', 'recent', 'categories', 'collections', 'cloud', 'browse'].includes(candidate.toLowerCase())) return '';
      // Apenas caminhos que indicam uma página de jogo, nunca páginas genéricas do catálogo.
      if (candidates.length === 1 && !/^[0-9a-f]{8,}$/i.test(candidate) &&
          !/^9[a-z0-9]{10,}$/i.test(candidate)) return '';
      return nxHudGameId(candidate);
    } catch (_) { return ''; }
  }
  function nxHudGameBindings() {
    try {
      const value = JSON.parse(getPref(NX_HUD_GAME_BINDINGS_KEY, '{}'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      const result = {}, profiles = nxHudProfilesRead();
      Object.keys(value).slice(0, 100).forEach(function (key) {
        const id = nxHudGameId(key), profile = nxHudProfileName(value[key]);
        if (id && profile && Object.prototype.hasOwnProperty.call(profiles, profile))
          result[id] = profile;
      });
      return result;
    } catch (_) { return {}; }
  }
  function nxHudBindGame(gameId, profileName) {
    const id = nxHudGameId(gameId);
    if (!id || !Object.prototype.hasOwnProperty.call(nxHudProfilesRead(), profileName)) return false;
    const bindings = nxHudGameBindings();
    if (!Object.prototype.hasOwnProperty.call(bindings, id) && Object.keys(bindings).length >= 100) return false;
    bindings[id] = profileName;
    const value = JSON.stringify(bindings);
    try {
      localStorage.setItem(NX_HUD_GAME_BINDINGS_KEY, value);
      const saved = localStorage.getItem(NX_HUD_GAME_BINDINGS_KEY) === value;
      if (saved) { nxHudLastRoute = null; nxHudLastAppliedProfile = ''; }
      return saved;
    } catch (_) { return false; }
  }
  function nxHudUnbindGame(gameId) {
    const id = nxHudGameId(gameId), bindings = nxHudGameBindings();
    if (!id || !Object.prototype.hasOwnProperty.call(bindings, id)) return false;
    delete bindings[id];
    const value = JSON.stringify(bindings);
    try {
      localStorage.setItem(NX_HUD_GAME_BINDINGS_KEY, value);
      const saved = localStorage.getItem(NX_HUD_GAME_BINDINGS_KEY) === value;
      if (saved) { nxHudLastRoute = null; nxHudLastAppliedProfile = ''; }
      return saved;
    } catch (_) { return false; }
  }
  const NX_HUD_AUTO_KEY = 'nx.hud.editor.autoLoad.v1';
  function nxHudAutoEnabled() { return getPref(NX_HUD_AUTO_KEY, '0') === '1'; }
  function nxHudSetAutoEnabled(enabled) {
    setPref(NX_HUD_AUTO_KEY, enabled ? '1' : '0');
    nxHudLastRoute = null;
    nxHudLastAppliedProfile = '';
    if (enabled) nxHudAutoLoadGame();
  }
  let nxHudLastRoute = null;
  let nxHudLastAppliedProfile = '';
  function nxHudAutoLoadGame() {
    if (!nxHudAutoEnabled()) return false;
    const id = nxHudCurrentGameId();
    if (id === nxHudLastRoute && nxHudLastAppliedProfile) return false;
    nxHudLastRoute = id;
    nxHudLastAppliedProfile = '';
    if (!id) return false;
    const name = nxHudGameBindings()[id];
    if (!name || !nxHudProfileLoad(name)) return false;
    nxHudLastAppliedProfile = name;
    return true;
  }
  function nxHudRouteMonitor() {
    // SPA: observa a URL sem substituir history.pushState, replaceState ou hooks de terceiros.
    if (document.visibilityState === 'hidden') return;
    nxHudAutoLoadGame();
    nxHudNativeSync();
  }
  window.addEventListener('popstate', nxHudRouteMonitor, { passive: true });
  window.addEventListener('hashchange', nxHudRouteMonitor, { passive: true });
  window.setInterval(nxHudRouteMonitor, 1500);
  function nxHudExportBackup() {
    return JSON.stringify({ format: 'nimboxcloud-hud-backup-v1',
      layout: nxHudReadLayout(), profiles: nxHudProfilesRead(),
      gameBindings: nxHudGameBindings() }, null, 2);
  }
  function nxHudImportBackup(raw) {
    if (typeof raw !== 'string' || raw.length > 65536) return false;
    let data;
    try { data = JSON.parse(raw); } catch (_) { return false; }
    if (!data || data.format !== 'nimboxcloud-hud-backup-v1' ||
        !data.layout || typeof data.layout !== 'object' || Array.isArray(data.layout) ||
        !data.profiles || typeof data.profiles !== 'object' || Array.isArray(data.profiles) ||
        !data.gameBindings || typeof data.gameBindings !== 'object' || Array.isArray(data.gameBindings)) return false;
    const ids = Object.keys(NX_HUD_DEFAULT);
    function validLayout(layout) {
      return layout && typeof layout === 'object' && !Array.isArray(layout) &&
        Object.keys(layout).length === ids.length && ids.every(function (id) {
          const p = layout[id];
          return Array.isArray(p) && p.length === 2 && p.every(function (v) {
            return Number.isFinite(v) && v >= 5 && v <= 95;
          });
        });
    }
    const names = Object.keys(data.profiles), gameIds = Object.keys(data.gameBindings);
    // Não aceitar chaves especiais que possam interferir em objetos comuns.
    const safeKey = function (key) { return key !== '__proto__' && key !== 'constructor' && key !== 'prototype'; };
    if (!validLayout(data.layout) || names.length > 20 || gameIds.length > 100 ||
        !names.every(safeKey) || !gameIds.every(safeKey) ||
        !names.every(function (name) {
          return nxHudProfileName(name) === name && validLayout(data.profiles[name]);
        }) || !gameIds.every(function (id) {
          return nxHudGameId(id) === id && typeof data.gameBindings[id] === 'string' &&
            Object.prototype.hasOwnProperty.call(data.profiles, data.gameBindings[id]);
        })) return false;
    // A validação ocorre antes de qualquer escrita. Se o armazenamento falhar,
    // restauramos os valores anteriores, inclusive quando a quota estiver esgotada.
    const writes = [
      [NX_HUD_PROFILES_KEY, JSON.stringify(data.profiles)],
      [NX_HUD_GAME_BINDINGS_KEY, JSON.stringify(data.gameBindings)],
      [NX_HUD_LAYOUT_KEY, JSON.stringify(data.layout)]
    ];
    const previous = [];
    try {
      writes.forEach(function (pair) {
        previous.push([pair[0], localStorage.getItem(pair[0])]);
      });
      writes.forEach(function (pair) {
        localStorage.setItem(pair[0], pair[1]);
        if (localStorage.getItem(pair[0]) !== pair[1])
          throw new Error('HUD storage write verification failed');
      });
    } catch (_) {
      previous.forEach(function (pair) {
        try {
          if (pair[1] === null) localStorage.removeItem(pair[0]);
          else localStorage.setItem(pair[0], pair[1]);
        } catch (_) {}
      });
      return false;
    }
    nxHudLastRoute = null;
    nxHudLastAppliedProfile = '';
    return true;
  }
  function nxHudReadLayout() {
    try { return nxHudValidateLayout(JSON.parse(getPref(NX_HUD_LAYOUT_KEY, '{}'))); }
    catch (_) { return nxHudValidateLayout(null); }
  }
  function nxHudExportLayout() {
    return JSON.stringify({ format: 'nimboxcloud-hud-v1', layout: nxHudReadLayout() }, null, 2);
  }
  function nxHudImportLayout(raw) {
    if (typeof raw !== 'string' || raw.length > 4096) return false;
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) { return false; }
    if (!parsed || parsed.format !== 'nimboxcloud-hud-v1' ||
        !parsed.layout || typeof parsed.layout !== 'object' || Array.isArray(parsed.layout)) return false;
    const ids = Object.keys(NX_HUD_DEFAULT);
    if (Object.keys(parsed.layout).length !== ids.length ||
        !ids.every(function (id) {
          const pos = parsed.layout[id];
          return Array.isArray(pos) && pos.length === 2 && pos.every(function (n) {
            return Number.isFinite(n) && n >= 0 && n <= 100;
          });
        })) return false;
    // Importação deve informar falha se o armazenamento recusar ou descartar a gravação.
    const value = JSON.stringify(nxHudValidateLayout(parsed.layout));
    try {
      localStorage.setItem(NX_HUD_LAYOUT_KEY, value);
      return localStorage.getItem(NX_HUD_LAYOUT_KEY) === value;
    } catch (_) { return false; }
  }
  function nxHudSaveLayout(layout) {
    const clean = nxHudValidateLayout(layout);
    const value = JSON.stringify(clean);
    try {
      localStorage.setItem(NX_HUD_LAYOUT_KEY, value);
      return localStorage.getItem(NX_HUD_LAYOUT_KEY) === value;
    } catch (_) { return false; }
  }
  function nxHudNudge(layout, id, dx, dy) {
    if (!layout || !Object.prototype.hasOwnProperty.call(NX_HUD_DEFAULT, id) ||
        !Array.isArray(layout[id]) || !Number.isFinite(dx) || !Number.isFinite(dy)) return false;
    const x = Math.max(5, Math.min(95, layout[id][0] + dx));
    const y = Math.max(5, Math.min(95, layout[id][1] + dy));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    layout[id] = [x, y];
    return true;
  }
  // Read-only discovery: accessibility labels are hints, not verified gameplay controls.
  // Never reposition, intercept events, or retain DOM references from this probe.
  function nxHudDomProbe() {
    const result = { scanned: 0, candidates: 0, interactive: 0, visible: 0,
      shadowRoots: 0, inaccessibleFrames: 0, truncated: false };
    const pending = [document];
    const pattern = /\b(?:left stick|right stick|joystick|thumbstick|d[\s-]?pad|trigger|bumper|touch control|virtual controller)\b/i;
    // Walk incrementally: avoid querySelectorAll('*') allocating a full DOM snapshot.
    while (pending.length && result.scanned < 1500) {
      const root = pending.shift();
      let walker;
      try { walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT); }
      catch (_) { continue; }
      let el;
      while (result.scanned < 1500 && (el = walker.nextNode())) {
        result.scanned++;
        if (el.shadowRoot) { result.shadowRoots++; pending.push(el.shadowRoot); }
        if (el.tagName === 'IFRAME') {
          try { if (el.contentDocument) pending.push(el.contentDocument); else result.inaccessibleFrames++; }
          catch (_) { result.inaccessibleFrames++; }
        }
        // Ignore NimboXcloud's own controls; these are not native xCloud HUD elements.
        if (el.closest && el.closest('#__xcu_panel__')) continue;
        const label = (el.getAttribute('aria-label') || el.getAttribute('data-testid') || '').slice(0, 100);
        if (!pattern.test(label)) continue;
        result.candidates++;
        const role = (el.getAttribute('role') || '').toLowerCase();
        if (/^(?:button|slider|application|joystick)$/.test(role) ||
            /^(?:BUTTON|INPUT)$/.test(el.tagName) || el.hasAttribute('tabindex'))
          result.interactive++;
        try {
          const box = el.getBoundingClientRect();
          if (box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden')
            result.visible++;
        } catch (_) { /* Cross-document layout may be unavailable. */ }
      }
    }
    result.truncated = result.scanned >= 1500;
    return result;
  }
  // HUD nativo: aplicação conservadora, reversível e estritamente opt-in.
  // Elementos sem rótulo inequívoco não são alterados.
  const NX_HUD_NATIVE_KEY = 'nx.hud.native.enabled.v1';
  const nxHudNativeOriginal = new Map();
  const NX_HUD_NATIVE_LABELS = Object.freeze({
    stickL: /^(?:left stick|left joystick|left thumbstick)$/i,
    stickR: /^(?:right stick|right joystick|right thumbstick)$/i,
    a: /^(?:a button|button a)$/i,
    b: /^(?:b button|button b)$/i,
    x: /^(?:x button|button x)$/i,
    y: /^(?:y button|button y)$/i,
    lt: /^(?:left trigger|lt button|button lt)$/i,
    rt: /^(?:right trigger|rt button|button rt)$/i
  });
  function nxHudNativeEnabled() { return getPref(NX_HUD_NATIVE_KEY, '0') === '1'; }
  function nxHudNativeRestore() {
    nxHudNativeOriginal.forEach(function (style, node) {
      try {
        if (node && node.style) {
          // Preserve changes made by the game or other scripts after our transform.
          if (node.style.transform === style.appliedTransform &&
              node.style.transformOrigin === style.appliedTransformOrigin) {
            node.style.transform = style.transform;
            node.style.transformOrigin = style.transformOrigin;
          }
        }
      } catch (_) {}
    });
    nxHudNativeOriginal.clear();
  }
  function nxHudNativeCandidates() {
    const found = Object.create(null);
    const duplicates = new Set();
    const roots = [document];
    let scanned = 0;
    while (roots.length && scanned < 1800) {
      const root = roots.shift();
      let walker;
      try { walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT); }
      catch (_) { continue; }
      let node;
      while ((node = walker.nextNode()) && scanned++ < 1800) {
        if (node.shadowRoot) roots.push(node.shadowRoot);
        if (node.closest && node.closest('#__xcu_panel__')) continue;
        const label = (node.getAttribute('aria-label') || '').trim();
        if (!label || label.length > 60) continue;
        Object.keys(NX_HUD_NATIVE_LABELS).forEach(function (id) {
          if (!NX_HUD_NATIVE_LABELS[id].test(label)) return;
          // Rejeitar identificadores duplicados; não há destino inequívoco.
          if (duplicates.has(id)) return;
          if (Object.prototype.hasOwnProperty.call(found, id)) {
            found[id] = null;
            duplicates.add(id);
          } else found[id] = node;
        });
      }
    }
    return found;
  }
  function nxHudNativeApply() {
    nxHudNativeRestore();
    if (!nxHudNativeEnabled() || !isInGame()) return { applied: 0, reason: 'inactive' };
    const candidates = nxHudNativeCandidates();
    const layout = nxHudReadLayout();
    const scale = nxHudPreviewScale() / 100;
    let applied = 0;
    Object.keys(layout).forEach(function (id) {
      const node = candidates[id];
      if (!node || !node.style || !node.isConnected) return;
      try {
        const rect = node.getBoundingClientRect();
        const viewportW = Math.max(1, window.innerWidth);
        const viewportH = Math.max(1, window.innerHeight);
        if (!rect.width || !rect.height) return;
        // CSS transform desloca também a área de hit-test; não sintetiza eventos.
        const dx = viewportW * layout[id][0] / 100 - (rect.left + rect.width / 2);
        const dy = viewportH * layout[id][1] / 100 - (rect.top + rect.height / 2);
        nxHudNativeOriginal.set(node, {
          transform: node.style.transform, transformOrigin: node.style.transformOrigin
        });
        node.style.transformOrigin = 'center center';
        node.style.transform = 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) +
          'px) scale(' + scale + ') ' + (nxHudNativeOriginal.get(node).transform || '');
        const owned = nxHudNativeOriginal.get(node);
        owned.appliedTransform = node.style.transform;
        owned.appliedTransformOrigin = node.style.transformOrigin;
        applied++;
      } catch (_) {}
    });
    return { applied: applied, reason: applied ? 'mapped' : 'no-safe-match' };
  }
  // Reutiliza o monitor de rota existente (1,5 s): sem MutationObserver global.
  // Reaplica apenas quando o perfil, a escala ou os elementos nativos mudam.
  let nxHudNativeSignature = '';
  let nxHudNativeNodes = Object.create(null);
  function nxHudNativeSync() {
    if (!nxHudNativeEnabled() || !isInGame()) {
      if (nxHudNativeOriginal.size) nxHudNativeRestore();
      nxHudNativeSignature = '';
      nxHudNativeNodes = Object.create(null);
      return;
    }
    const candidates = nxHudNativeCandidates();
    const layout = nxHudReadLayout();
    const signature = JSON.stringify([layout, nxHudPreviewScale(), nxHudCurrentGameId()]);
    const ids = Object.keys(layout);
    const changed = signature !== nxHudNativeSignature || ids.some(function (id) {
      return (nxHudNativeNodes[id] || null) !== (candidates[id] || null);
    });
    if (!changed) return;
    nxHudNativeSignature = signature;
    nxHudNativeNodes = candidates;
    nxHudNativeApply();
  }
  function nxHudNativeSetEnabled(enabled) {
    try {
      setPref(NX_HUD_NATIVE_KEY, enabled ? '1' : '0');
      nxHudNativeSignature = '';
      if (!enabled) {
        nxHudNativeRestore();
        nxHudNativeNodes = Object.create(null);
      } else nxHudNativeSync();
      return nxHudNativeEnabled() === !!enabled;
    } catch (_) { nxHudNativeRestore(); return false; }
  }
  const NX_HUD_PREVIEW_SCALE_KEY = 'nx.hud.editor.previewScale.v1';
  function nxHudPreviewScale() {
    const value = Number(getPref(NX_HUD_PREVIEW_SCALE_KEY, '100'));
    return Number.isFinite(value) ? Math.max(60, Math.min(160, Math.round(value))) : 100;
  }
  function nxHudSavePreviewScale(value) {
    const scale = Number(value);
    if (!Number.isFinite(scale) || scale < 60 || scale > 160) return false;
    const stored = String(Math.round(scale));
    try {
      localStorage.setItem(NX_HUD_PREVIEW_SCALE_KEY, stored);
      return localStorage.getItem(NX_HUD_PREVIEW_SCALE_KEY) === stored;
    } catch (_) { return false; }
  }
  function nxHudEditor() {
    const layout = nxHudReadLayout();
    const outer = mk('div', 'display:flex;flex-direction:column;gap:8px;width:100%');
    const stage = mk('div', 'position:relative;width:100%;aspect-ratio:16/9;min-height:175px;touch-action:none;user-select:none;overflow:hidden;border-radius:10px;border:1px solid ' + C.line + ';background:rgba(80,120,130,.12)');
    const scaleRow = mk('div', 'display:flex;align-items:center;gap:10px;flex-wrap:wrap');
    const scaleLabel = mk('label', 'font-size:12px;color:' + C.dim, 'Tamanho da prévia: ' + nxHudPreviewScale() + '%');
    const scaleInput = document.createElement('input');
    scaleInput.type = 'range';
    scaleInput.min = '60';
    scaleInput.max = '160';
    scaleInput.step = '5';
    scaleInput.value = String(nxHudPreviewScale());
    scaleInput.setAttribute('aria-label', 'Tamanho dos botões na prévia');
    scaleRow.appendChild(scaleLabel);
    scaleRow.appendChild(scaleInput);
    outer.appendChild(scaleRow);
    const previewNodes = [];
    scaleInput.addEventListener('change', function () {
      if (!nxHudSavePreviewScale(scaleInput.value)) {
        scaleInput.value = String(nxHudPreviewScale());
        toast('Não foi possível salvar o tamanho da prévia');
      }
      const scale = nxHudPreviewScale();
      scaleLabel.textContent = 'Tamanho da prévia: ' + scale + '%';
      previewNodes.forEach(function (node) {
        node.style.width = Math.round(35 * scale / 100) + 'px';
        node.style.height = Math.round(35 * scale / 100) + 'px';
      });
    });
    const labels = { stickL:'L', stickR:'R', a:'A', b:'B', x:'X', y:'Y', lt:'LT', rt:'RT' };
    Object.keys(layout).forEach(function (id) {
      const node = mk('button', 'position:absolute;transform:translate(-50%,-50%);min-width:35px;height:35px;border-radius:50%;border:1px solid ' + C.accent + ';background:rgba(15,28,30,.85);color:' + C.text + ';font-size:11px;font-weight:700;touch-action:none;cursor:grab', labels[id]);
      node.type = 'button';
      node.style.width = Math.round(35 * nxHudPreviewScale() / 100) + 'px';
      node.style.height = Math.round(35 * nxHudPreviewScale() / 100) + 'px';
      previewNodes.push(node);
      node.style.left = layout[id][0] + '%';
      node.style.top = layout[id][1] + '%';
      node.setAttribute('aria-label', 'Mover ' + labels[id] + ' com as setas do teclado');
      node.setAttribute('title', 'Setas: 1% | Shift + setas: 5%');
      let dragStart = null;
      let pointerStart = null;
      let activePointerId = null;
      node.addEventListener('keydown', function (e) {
        const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0],
          ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (!Object.prototype.hasOwnProperty.call(moves, e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        const step = e.shiftKey ? 5 : 1;
        const delta = moves[e.key];
        const previousPosition = layout[id].slice();
        if (nxHudNudge(layout, id, delta[0] * step, delta[1] * step)) {
          node.style.left = layout[id][0] + '%';
          node.style.top = layout[id][1] + '%';
          if (!nxHudSaveLayout(layout)) {
            layout[id] = previousPosition;
            node.style.left = previousPosition[0] + '%';
            node.style.top = previousPosition[1] + '%';
            toast('Não foi possível salvar a posição do HUD');
          }
        }
      });
      node.addEventListener('pointerdown', function (e) {
        if (!e.isPrimary || activePointerId !== null) return;
        e.stopPropagation();
        e.preventDefault();
        dragStart = layout[id].slice();
        pointerStart = [e.clientX, e.clientY];
        try { node.setPointerCapture(e.pointerId); }
        catch (_) {
          // A captura pode falhar quando o navegador cancela o gesto.
          dragStart = null;
          pointerStart = null;
          return;
        }
        activePointerId = e.pointerId;
        node.style.cursor = 'grabbing';
      });
      node.addEventListener('pointermove', function (e) {
        if (activePointerId !== e.pointerId || !node.hasPointerCapture(e.pointerId)) return;
        const bounds = stage.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        // Move relative to the initial pointer position, preserving the button's grab offset.
        if (!dragStart || !pointerStart) return;
        const x = Math.max(5, Math.min(95, Math.round(dragStart[0] + (e.clientX - pointerStart[0]) / bounds.width * 100)));
        const y = Math.max(5, Math.min(95, Math.round(dragStart[1] + (e.clientY - pointerStart[1]) / bounds.height * 100)));
        layout[id] = [x, y];
        node.style.left = x + '%';
        node.style.top = y + '%';
      });
      function finish(e) {
        if (activePointerId !== e.pointerId) return;
        // Finaliza o estado antes de liberar a captura: lostpointercapture pode disparar logo depois.
        activePointerId = null;
        if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
        node.style.cursor = 'grab';
        if (e.type === 'pointercancel' && dragStart) {
          layout[id] = dragStart;
          node.style.left = dragStart[0] + '%';
          node.style.top = dragStart[1] + '%';
        } else if (!nxHudSaveLayout(layout)) {
          // Do not leave an unsaved position visible or available for profile export.
          const saved = nxHudReadLayout()[id];
          layout[id] = saved.slice();
          node.style.left = saved[0] + '%';
          node.style.top = saved[1] + '%';
          toast('Não foi possível salvar a posição do HUD');
        }
        dragStart = null;
        pointerStart = null;
      }
      node.addEventListener('pointerup', finish);
      node.addEventListener('pointercancel', finish);
      node.addEventListener('lostpointercapture', function () {
        // Perda inesperada de captura não deve persistir um arrasto incompleto.
        if (!dragStart || activePointerId === null) return;
        activePointerId = null;
        layout[id] = dragStart.slice();
        node.style.left = dragStart[0] + '%';
        node.style.top = dragStart[1] + '%';
        node.style.cursor = 'grab';
        dragStart = null;
        pointerStart = null;
      });
      stage.appendChild(node);
    });
    outer.appendChild(mk('div', 'font-size:11px;color:' + C.dim,
      'EDITOR DE PRÉVIA — as posições abaixo ainda não movem os botões reais do Xbox Cloud Gaming.'));
    outer.appendChild(stage);
    const nativeStatus = mk('div', 'font-size:11px;color:' + C.dim,
      'HUD nativo: integração experimental por rótulos de acessibilidade. Sem correspondência segura, nenhum botão será alterado.');
    outer.appendChild(nativeStatus);
    outer.appendChild(actBtn(nxHudNativeEnabled() ? 'Desativar integração nativa' : 'Ativar integração nativa (experimental)', function () {
      const next = !nxHudNativeEnabled();
      if (next && !window.confirm('Ativar reposicionamento experimental dos botões nativos identificados? A opção pode ser desativada para restaurar o layout original.')) return;
      if (!nxHudNativeSetEnabled(next)) { toast('Falha ao alterar integração nativa'); return; }
      const status = next ? nxHudNativeApply() : { applied: 0, reason: 'inactive' };
      toast(next ? 'HUD nativo: ' + status.applied + ' controles identificados' : 'HUD nativo restaurado');
      renderBody();
    }, 'ghost'));
    if (nxHudNativeEnabled()) outer.appendChild(actBtn('Aplicar posições ao HUD nativo', function () {
      const status = nxHudNativeApply();
      toast(status.applied ? status.applied + ' controles reposicionados' : 'Nenhum controle nativo identificado com segurança');
    }, 'ghost'));
    outer.appendChild(mk('div', 'font-size:11px;color:' + C.dim,
      'Acessibilidade: selecione um botão e use as setas para mover 1%; Shift + setas move 5%. Arrastos cancelados são revertidos.'));
    const reset = actBtn('Restaurar posições', function () {
      if (!nxHudSaveLayout(NX_HUD_DEFAULT)) { toast('Não foi possível restaurar o layout'); return; }
      renderBody();
      toast('Layout de prévia restaurado');
    }, 'ghost');
    outer.appendChild(reset);
    outer.appendChild(actBtn('Salvar perfil', function () {
      const name = window.prompt('Nome do perfil de HUD (até 32 caracteres):');
      if (name === null) return;
      toast(nxHudProfileSave(name) ? 'Perfil salvo' : 'Nome inválido ou limite de 20 perfis atingido');
      renderBody();
    }));
    const profiles = nxHudProfilesRead();
    const names = Object.keys(profiles).sort();
    const gameId = nxHudCurrentGameId();
    outer.appendChild(mk('div', 'font-size:11px;color:' + C.dim,
      gameId ? 'Jogo identificado na URL: ' + gameId :
        'Jogo não identificado na URL. Associação automática indisponível nesta página.'));
    if (names.length) {
      const selection = mk('select', 'width:100%;padding:9px;border-radius:8px;background:' + C.panel + ';color:' + C.text + ';border:1px solid ' + C.line);
      names.forEach(function (name) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selection.appendChild(option);
      });
      outer.appendChild(selection);
      if (gameId) {
        outer.appendChild(actBtn('Associar ao jogo atual', function () {
          toast(nxHudBindGame(gameId, selection.value) ?
            'Perfil associado a este jogo (prévia)' : 'Não foi possível associar o perfil');
        }));
        outer.appendChild(actBtn('Remover associação do jogo', function () {
          toast(nxHudUnbindGame(gameId) ? 'Associação removida' : 'Sem associação para este jogo');
        }));
      }
      outer.appendChild(actBtn('Carregar perfil', function () {
        if (nxHudProfileLoad(selection.value)) { renderBody(); toast('Perfil carregado'); }
      }));
      outer.appendChild(actBtn('Excluir perfil', function () {
        if (!window.confirm('Excluir o perfil "' + selection.value + '"?')) return;
        if (nxHudProfileDelete(selection.value)) { renderBody(); toast('Perfil excluído'); }
      }, 'danger'));
    }
    outer.appendChild(actBtn('Exportar backup completo', function () {
      const value = nxHudExportBackup();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          toast('Backup de HUD copiado');
        }).catch(function () { window.prompt('Copie o backup JSON:', value); });
      } else window.prompt('Copie o backup JSON:', value);
    }));
    outer.appendChild(actBtn('Restaurar backup completo', function () {
      const value = window.prompt('Cole o backup JSON de HUD (substitui layout, perfis e associações):');
      if (value === null) return;
      if (!window.confirm('Substituir todos os perfis, associações e posições atuais de HUD?')) return;
      if (!nxHudImportBackup(value)) { toast('Backup inválido; nenhuma alteração realizada'); return; }
      renderBody();
      toast('Backup de HUD restaurado');
    }, 'danger'));
    const exportButton = actBtn('Exportar layout', function () {
      const value = nxHudExportLayout();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () {
          toast('Layout copiado para a área de transferência');
        }).catch(function () { window.prompt('Copie o layout JSON:', value); });
      } else window.prompt('Copie o layout JSON:', value);
    });
    outer.appendChild(exportButton);
    outer.appendChild(actBtn('Importar layout', function () {
      const value = window.prompt('Cole o layout JSON exportado:');
      if (value === null) return;
      if (!nxHudImportLayout(value)) { toast('Layout inválido; nenhuma alteração realizada'); return; }
      renderBody();
      toast('Layout importado');
    }));
    return outer;
  }
  // Aplica somente a prévia local, nunca os botões reais do xCloud.
  nxHudAutoLoadGame();
  // Descoberta xHome: utiliza somente credenciais locais da sessão Xbox autenticada.
  // Não substitui a negociação WebRTC/ICE nem cria uma sessão Remote Play.
  const nxRemotePlay = {busy:false, consoles:[], status:'Aguardando consulta', error:'', region:'', checkedAt:0, attempts:[], selectedId:'', resolution:'1080p', abortController:null, requestId:0, regionShortName:'', sessionStatus:'idle', sessionId:'', peer:null, mediaStream:null, videoElement:null, iceTimer:null, channelTimer:null, createPending:false, cancelAfterCreate:false, dataChannelsReady:false};
  // O token de sessão permanece somente em memória e nunca integra o estado exportável.
  let nxRemoteSessionToken='';
  let nxRemotePendingRelease=null;
  function nxRemoteGssvToken() {
    try { const v=JSON.parse(localStorage.getItem('xboxcom_xbl_user_info')||'null');
      const t=v && v.tokens && v.tokens['http://gssv.xboxlive.com/'];
      if(t && typeof t.token==='string' && t.token && (!t.expiration || Date.parse(t.expiration)>Date.now())) return t.token; } catch (_) {}
    try { for(let i=0;i<localStorage.length;i++) { const k=localStorage.key(i);
      if(!k || !k.startsWith('Auth.User.')) continue;
      const u=JSON.parse(localStorage.getItem(k)||'null');
      for(const t of (u && Array.isArray(u.tokens)?u.tokens:[])) {
        if(!/^https?:\/\/gssv\.xboxlive\.com\/?$/i.test(String(t.relyingParty||''))) continue;
        if(t.tokenData && t.tokenData.token && new Date(t.tokenData.expiration)>new Date()) return t.tokenData.token;
      }
    }} catch (_) {} return '';
  }
  // Data-channel bootstrap uses the xHome channels controlV1, input 1.0, messageV1 and chatV1.
  // Input packet fields are cross-checked against the MIT-licensed unknownskl/greenlight player package.
  // Gamepad and opt-in physical keyboard/mouse capture share one ordered input sequence.
  let nxRemoteChannels=null;
  function nxRemoteUuid() {
    try { if(typeof crypto!=='undefined' && typeof crypto.randomUUID==='function') return crypto.randomUUID(); } catch (_) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
      const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);
    });
  }
  function nxRemoteChannelSend(channel,payload) {
    if(!channel || channel.readyState!=='open') return false;
    try { channel.send(payload);return true; } catch (_) { return false; }
  }
  // Binary input packet follows the MIT-licensed Greenlight InputPacket field layout.
  // Encoders remain pure: they do not read browser input, schedule polling, or send frames.
  function nxRemotePadButtonValue(pad,index) {
    const button=pad && pad.buttons && pad.buttons[index];
    if(typeof button==='number') return Math.max(0,Math.min(1,button));
    if(!button) return 0;
    const value=Number(button.value);
    if(Number.isFinite(value)) {
      const normalized=Math.max(0,Math.min(1,value));
      return normalized>0?normalized:(button.pressed?1:0);
    }
    return button.pressed?1:0;
  }
  function nxRemoteCreateInputPacket(reportType,frameSize,sequence,timestamp) {
    if(!Number.isInteger(reportType) || reportType<0 || reportType>65535 ||
      !Number.isInteger(frameSize) || frameSize<0 || frameSize>65520) return null;
    const frameSequence=Number.isFinite(sequence)?(Math.trunc(sequence)>>>0):0;
    const frameTime=Number.isFinite(timestamp)?timestamp:
      ((typeof performance!=='undefined' && performance.now)?performance.now():Date.now());
    const buffer=new ArrayBuffer(15+frameSize),view=new DataView(buffer);
    view.setUint16(0,reportType,true);
    view.setUint32(2,frameSequence,true);
    view.setFloat64(6,frameTime,true);
    view.setUint8(14,1);
    return {buffer:buffer,view:view,offset:15};
  }
  function nxRemoteEncodeGamepadFrame(pad,remoteIndex,sequence,timestamp) {
    if(!pad || pad.mapping!=='standard' || !Number.isInteger(remoteIndex) || remoteIndex<0 || remoteIndex>3) return null;
    const packet=nxRemoteCreateInputPacket(2,23,sequence,timestamp);
    if(!packet) return null;
    const buffer=packet.buffer,view=packet.view;
    const buttonValue=function(index){return nxRemotePadButtonValue(pad,index);};
    const maskMap=[[16,2],[9,4],[8,8],[0,16],[1,32],[2,64],[3,128],[12,256],[13,512],[14,1024],[15,2048],[4,4096],[5,8192],[10,16384],[11,32768]];
    let buttonMask=0;
    for(const item of maskMap) if(buttonValue(item[0])>0) buttonMask|=item[1];
    const axes=pad.axes||[];
    const axisValue=function(index,invert) {
      let value=Number(axes[index]);
      if(!Number.isFinite(value)) value=0;
      if(invert) value=-value;
      return Math.trunc(Math.max(-1,Math.min(1,value))*32767);
    };
    const triggerValue=function(index){return Math.trunc(buttonValue(index)*65535);};
    view.setUint8(15,remoteIndex);
    view.setUint16(16,buttonMask,true);
    view.setInt16(18,axisValue(0,false),true);
    view.setInt16(20,axisValue(1,true),true);
    view.setInt16(22,axisValue(2,false),true);
    view.setInt16(24,axisValue(3,true),true);
    view.setUint16(26,triggerValue(6),true);
    view.setUint16(28,triggerValue(7),true);
    view.setUint32(30,1,true);  // PhysicalPhysicality
    view.setUint32(34,1,false); // VirtualPhysicality (big-endian in MIT reference)
    return buffer;
  }
  const NX_REMOTE_VIRTUAL_KEYS=Object.freeze({
    Backspace:0x08,Tab:0x09,Enter:0x0D,NumpadEnter:0x0D,
    Pause:0x13,CapsLock:0x14,Escape:0x1B,Space:0x20,
    PageUp:0x21,PageDown:0x22,End:0x23,Home:0x24,
    ArrowLeft:0x25,ArrowUp:0x26,ArrowRight:0x27,ArrowDown:0x28,
    PrintScreen:0x2C,Insert:0x2D,Delete:0x2E,
    MetaLeft:0x5B,MetaRight:0x5C,ContextMenu:0x5D,
    NumpadMultiply:0x6A,NumpadAdd:0x6B,NumpadComma:0x6C,
    NumpadSubtract:0x6D,NumpadDecimal:0x6E,NumpadDivide:0x6F,
    NumLock:0x90,ScrollLock:0x91,
    ShiftLeft:0xA0,ShiftRight:0xA1,ControlLeft:0xA2,ControlRight:0xA3,
    AltLeft:0xA4,AltRight:0xA5,
    Backquote:0xC0,Minus:0xBD,Equal:0xBB,BracketLeft:0xDB,
    BracketRight:0xDD,Backslash:0xDC,IntlBackslash:0xE2,
    Semicolon:0xBA,Quote:0xDE,Comma:0xBC,Period:0xBE,Slash:0xBF
  });
  function nxRemoteVirtualKey(code,keyCode) {
    const legacy=Number(keyCode);
    if(Number.isInteger(legacy) && legacy>0 && legacy<=255) return legacy;
    if(typeof code!=='string') return null;
    if(/^Key[A-Z]$/.test(code)) return code.charCodeAt(3);
    if(/^Digit[0-9]$/.test(code)) return code.charCodeAt(5);
    if(/^Numpad[0-9]$/.test(code)) return 0x60+Number(code.slice(6));
    const functionKey=/^F([1-9]|1[0-9]|2[0-4])$/.exec(code);
    if(functionKey) return 0x6F+Number(functionKey[1]);
    return Object.prototype.hasOwnProperty.call(NX_REMOTE_VIRTUAL_KEYS,code)
      ? NX_REMOTE_VIRTUAL_KEYS[code] : null;
  }
  function nxRemoteEncodeKeyboardFrame(frame,sequence,timestamp) {
    if(!frame || typeof frame!=='object' || typeof frame.pressed!=='boolean') return null;
    const keyCode=nxRemoteVirtualKey(frame.code,frame.keyCode);
    if(keyCode===null) return null;
    const packet=nxRemoteCreateInputPacket(64,3,sequence,timestamp);
    if(!packet) return null;
    const view=packet.view,offset=packet.offset;
    view.setUint8(offset,2); // 1=Known, 2=VKey, 3=AppCommand, 0=Unknown
    view.setUint8(offset+1,frame.pressed?1:0);
    view.setUint8(offset+2,keyCode);
    return packet.buffer;
  }
  function nxRemoteInt32(value) {
    const number=Number(value);
    if(!Number.isFinite(number)) return 0;
    return Math.max(-2147483648,Math.min(2147483647,Math.trunc(number)));
  }
  function nxRemoteByte(value) {
    const number=Number(value);
    if(!Number.isFinite(number)) return 0;
    return Math.max(0,Math.min(255,Math.trunc(number)));
  }
  function nxRemoteEncodeMouseFrame(frame,sequence,timestamp) {
    if(!frame || typeof frame!=='object') return null;
    const relative=frame.Relative===undefined?0:Number(frame.Relative);
    if(relative!==0 && relative!==1) return null;
    const packet=nxRemoteCreateInputPacket(32,18,sequence,timestamp);
    if(!packet) return null;
    const view=packet.view,offset=packet.offset;
    view.setInt32(offset,nxRemoteInt32(frame.X),true);
    view.setInt32(offset+4,nxRemoteInt32(frame.Y),true);
    view.setInt32(offset+8,nxRemoteInt32(frame.WheelX),true);
    view.setInt32(offset+12,nxRemoteInt32(frame.WheelY),true);
    view.setUint8(offset+16,nxRemoteByte(frame.Buttons));
    view.setUint8(offset+17,relative);
    return packet.buffer;
  }
  const nxRemoteRegisteredGamepadSlots=new Set();
  let nxRemoteInputSequence=1;
  let nxRemoteGamepadPaused=false;
  let nxRemoteGamepadWindowFocused=true;
  const nxRemoteNeutralGamepad={mapping:'standard',buttons:[],axes:[]};
  function nxRemoteGamepadReady() {
    const peer=nxRemotePlay.peer;
    const channel=nxRemoteChannels && nxRemoteChannels.input;
    const peerState=peer && (peer.connectionState || peer.iceConnectionState);
    return !!(nxRemotePlay.dataChannelsReady && nxRemotePlay.sessionStatus==='connected' &&
      peer && peerState==='connected' && channel && channel.readyState==='open');
  }
  function nxRemoteVideoHasInputFocus() {
    const video=nxRemotePlay.videoElement;
    return !!(video && document.activeElement===video);
  }
  let nxRemoteInputCapture=null;
  const nxRemoteHeldKeys=new Map();
  let nxRemoteMouseButtons=0;
  function nxRemoteSendInputPacket(packet,force,channelsOverride) {
    const channels=channelsOverride || nxRemoteChannels;
    const channel=channels && channels.input;
    if(!channel || channel.readyState!=='open') return false;
    if(!force && Number(channel.bufferedAmount)>4096) return false;
    try {
      channel.send(packet);
      nxRemoteInputSequence=(nxRemoteInputSequence+1)>>>0;
      return true;
    } catch (_) { return false; }
  }
  function nxRemoteSendKeyboardFrame(frame,force) {
    if(force!==true && !nxRemoteGamepadReady()) return false;
    const packet=nxRemoteEncodeKeyboardFrame(frame,nxRemoteInputSequence>>>0,
      (typeof performance!=='undefined' && performance.now)?performance.now():Date.now());
    return packet ? nxRemoteSendInputPacket(packet,force===true) : false;
  }
  function nxRemoteSendMouseFrame(frame,force) {
    if(force!==true && !nxRemoteGamepadReady()) return false;
    const packet=nxRemoteEncodeMouseFrame(frame,nxRemoteInputSequence>>>0,
      (typeof performance!=='undefined' && performance.now)?performance.now():Date.now());
    return packet ? nxRemoteSendInputPacket(packet,force===true) : false;
  }
  function nxRemoteInputRelease() {
    let complete=true;
    Array.from(nxRemoteHeldKeys.entries()).forEach(function(entry) {
      if(nxRemoteSendKeyboardFrame({code:entry[0],keyCode:entry[1],pressed:false},true))
        nxRemoteHeldKeys.delete(entry[0]);
      else complete=false;
    });
    if(nxRemoteMouseButtons!==0) {
      if(nxRemoteSendMouseFrame({X:0,Y:0,WheelX:0,WheelY:0,Buttons:0,Relative:0},true))
        nxRemoteMouseButtons=0;
      else complete=false;
    }
    return complete;
  }
  function nxRemoteInputConsume(event,preventDefault) {
    if(preventDefault!==false && event && typeof event.preventDefault==='function') event.preventDefault();
    if(event && typeof event.stopImmediatePropagation==='function') event.stopImmediatePropagation();
    else if(event && typeof event.stopPropagation==='function') event.stopPropagation();
  }
  function nxRemoteInputEditableTarget(target) {
    if(!target || nxRemoteInputCapture && target===nxRemoteInputCapture.video) return false;
    return !!(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(String(target.tagName||'').toUpperCase()));
  }
  function nxRemoteInputReservedShortcut(event) {
    const code=String(event.code||'');
    if(event.metaKey) return true;
    if(event.ctrlKey && /^(KeyW|KeyR|KeyT|KeyN|KeyL|KeyP|KeyS|KeyO|KeyD|KeyJ|KeyU|KeyF)$/.test(code)) return true;
    if(event.altKey && !/^Alt/.test(code)) return true;
    return code==='F5' || code==='F11' || code==='F12';
  }
  function nxRemoteInputKeyDown(event) {
    const state=nxRemoteInputCapture;
    if(!state || !event || !event.isTrusted || !nxRemoteVideoHasInputFocus()) return;
    if(nxRemoteInputEditableTarget(event.target)) return;
    const code=String(event.code||'');
    if(event.ctrlKey && event.shiftKey) return; // preserve NX keyboard shortcuts
    if(code==='KeyV' && getPref(LS_MIC_PTT,'0')==='1') return; // preserve push-to-talk
    if(code==='Escape') {
      nxRemoteInputConsume(event,false);
      nxRemoteInputCaptureDisable(false,'Captura desativada com Escape; o ponteiro foi liberado.');
      return;
    }
    if(nxRemoteInputReservedShortcut(event)) {
      nxRemoteInputConsume(event,true);
      return;
    }
    if(!nxRemoteGamepadReady()) {
      nxRemoteInputCaptureDisable(false,'Sessão xHome desconectada; captura pausada.');
      return;
    }
    const keyCode=nxRemoteVirtualKey(code,event.keyCode);
    if(keyCode===null) return;
    if(event.repeat || nxRemoteHeldKeys.has(code)) {
      nxRemoteInputConsume(event,true);
      return;
    }
    if(nxRemoteSendKeyboardFrame({code:code,keyCode:keyCode,pressed:true},false))
      nxRemoteHeldKeys.set(code,keyCode);
    nxRemoteInputConsume(event,true);
  }
  function nxRemoteInputKeyUp(event) {
    const state=nxRemoteInputCapture;
    if(!state || !event || !event.isTrusted) return;
    const code=String(event.code||'');
    if(nxRemoteHeldKeys.has(code)) {
      const keyCode=nxRemoteHeldKeys.get(code);
      if(nxRemoteSendKeyboardFrame({code:code,keyCode:keyCode,pressed:false},true))
        nxRemoteHeldKeys.delete(code);
      nxRemoteInputConsume(event,true);
      return;
    }
    if(!nxRemoteVideoHasInputFocus() || nxRemoteInputEditableTarget(event.target)) return;
    if(event.ctrlKey && event.shiftKey) return;
    if(code==='KeyV' && getPref(LS_MIC_PTT,'0')==='1') return;
    if(nxRemoteVirtualKey(code,event.keyCode)!==null) nxRemoteInputConsume(event,true);
  }
  function nxRemoteInputSendMouseEvent(event,force) {
    if(!nxRemoteInputCapture || !event || !event.isTrusted || event.pointerType!=='mouse') return false;
    const buttons=event.buttons===undefined ? nxRemoteMouseButtons : (nxRemoteByte(event.buttons)&31);
    const x=nxRemoteInt32((Number(event.movementX)||0)*2);
    const y=nxRemoteInt32((Number(event.movementY)||0)*2);
    if(!force && !x && !y && buttons===nxRemoteMouseButtons) return false;
    const sent=nxRemoteSendMouseFrame({X:x,Y:y,WheelX:0,WheelY:0,Buttons:buttons,Relative:0},
      force===true || buttons!==nxRemoteMouseButtons);
    if(sent) nxRemoteMouseButtons=buttons;
    return sent;
  }
  function nxRemoteInputPointerMove(event) {
    const state=nxRemoteInputCapture;
    if(!state || !event || !event.isTrusted || event.pointerType!=='mouse') return;
    if(!nxRemoteGamepadReady()) {
      nxRemoteInputCaptureDisable(false,'Sessão xHome desconectada; captura pausada.');
      return;
    }
    const buttons=event.buttons===undefined ? nxRemoteMouseButtons : (nxRemoteByte(event.buttons)&31);
    const x=Number(event.movementX)||0,y=Number(event.movementY)||0;
    if(!x && !y && buttons===nxRemoteMouseButtons) return;
    nxRemoteInputSendMouseEvent(event,false);
    nxRemoteInputConsume(event,true);
  }
  function nxRemoteInputPointer(event) {
    if(!nxRemoteInputCapture || !event || !event.isTrusted || event.pointerType!=='mouse') return;
    if(!nxRemoteGamepadReady()) {
      nxRemoteInputCaptureDisable(false,'Sessão xHome desconectada; captura pausada.');
      return;
    }
    nxRemoteInputSendMouseEvent(event,true);
    nxRemoteInputConsume(event,true);
  }
  function nxRemoteInputWindowPointerUp(event) {
    const state=nxRemoteInputCapture;
    if(!state || !event || !event.isTrusted || event.pointerType!=='mouse') return;
    if(state.video.contains && state.video.contains(event.target)) return;
    if(!nxRemoteGamepadReady()) {
      nxRemoteInputCaptureDisable(false,'Sessão xHome desconectada; captura pausada.');
      return;
    }
    nxRemoteInputSendMouseEvent(event,true);
    nxRemoteInputConsume(event,true);
  }
  function nxRemoteInputWheel(event) {
    const state=nxRemoteInputCapture;
    if(!state || !event || !event.isTrusted || !nxRemoteGamepadReady()) return;
    const unit=event.deltaMode===1?16:event.deltaMode===2?Math.max(1,Number(state.video.clientHeight)||720):1;
    const wheelX=nxRemoteInt32((Number(event.deltaX)||0)*unit);
    const wheelY=nxRemoteInt32((Number(event.deltaY)||0)*unit);
    if(!wheelX && !wheelY) return;
    nxRemoteSendMouseFrame({X:0,Y:0,WheelX:wheelX,WheelY:wheelY,Buttons:nxRemoteMouseButtons,Relative:0},false);
    nxRemoteInputConsume(event,true);
  }
  function nxRemoteInputCaptureEnable(video,button,statusNode) {
    if(nxRemoteInputCapture) return true;
    if(!video || typeof video.addEventListener!=='function' || !nxRemoteGamepadReady()) return false;
    if(!nxRemoteInputRelease()) return false;
    nxRemotePlay.videoElement=video;
    const state={
      video:video,button:button||null,status:statusNode||null,
      previousControls:video.controls,previousTabIndex:video.tabIndex
    };
    state.onKeyDown=nxRemoteInputKeyDown;
    state.onKeyUp=nxRemoteInputKeyUp;
    state.onPointerMove=nxRemoteInputPointerMove;
    state.onPointerDown=nxRemoteInputPointer;
    state.onPointerUp=nxRemoteInputPointer;
    state.onWindowPointerUp=nxRemoteInputWindowPointerUp;
    state.onWheel=nxRemoteInputWheel;
    state.onClick=function(event) {
      if(state===nxRemoteInputCapture && event && event.isTrusted && typeof video.focus==='function')
        video.focus();
    };
    state.onContextMenu=function(event) {
      if(state===nxRemoteInputCapture) nxRemoteInputConsume(event,true);
    };
    state.onBlur=function() {
      if(state===nxRemoteInputCapture)
        nxRemoteInputCaptureDisable(false,'Captura pausada por perda de foco; ative novamente ao voltar.');
    };
    state.onVisibility=function() {
      if(state===nxRemoteInputCapture && document.visibilityState==='hidden')
        nxRemoteInputCaptureDisable(false,'Captura pausada porque a página ficou oculta.');
    };
    state.onPageHide=function() {
      if(state===nxRemoteInputCapture)
        nxRemoteInputCaptureDisable(true,'Página encerrada; entradas remotas liberadas.');
    };
    nxRemoteInputCapture=state;
    try { video.controls=false;video.tabIndex=0; } catch (_) {}
    window.addEventListener('keydown',state.onKeyDown,true);
    window.addEventListener('keyup',state.onKeyUp,true);
    window.addEventListener('pointerup',state.onWindowPointerUp,true);
    window.addEventListener('blur',state.onBlur,true);
    window.addEventListener('pagehide',state.onPageHide,true);
    document.addEventListener('visibilitychange',state.onVisibility,true);
    video.addEventListener('pointermove',state.onPointerMove,true);
    video.addEventListener('pointerdown',state.onPointerDown,true);
    video.addEventListener('pointerup',state.onPointerUp,true);
    video.addEventListener('wheel',state.onWheel,{capture:true,passive:false});
    video.addEventListener('click',state.onClick,true);
    video.addEventListener('contextmenu',state.onContextMenu,true);
    try { if(typeof video.focus==='function') video.focus(); } catch (_) {}
    if(button) button.textContent='Desativar teclado/mouse';
    if(statusNode) statusNode.textContent='Captura ativa. Mova o mouse dentro do vídeo; Escape encerra a captura.';
    return true;
  }
  function nxRemoteInputCaptureDisable(clearState,message) {
    const state=nxRemoteInputCapture;
    const released=nxRemoteInputRelease();
    if(state) {
      nxRemoteInputCapture=null;
      window.removeEventListener('keydown',state.onKeyDown,true);
      window.removeEventListener('keyup',state.onKeyUp,true);
      window.removeEventListener('pointerup',state.onWindowPointerUp,true);
      window.removeEventListener('blur',state.onBlur,true);
      window.removeEventListener('pagehide',state.onPageHide,true);
      document.removeEventListener('visibilitychange',state.onVisibility,true);
      state.video.removeEventListener('pointermove',state.onPointerMove,true);
      state.video.removeEventListener('pointerdown',state.onPointerDown,true);
      state.video.removeEventListener('pointerup',state.onPointerUp,true);
      state.video.removeEventListener('wheel',state.onWheel,true);
      state.video.removeEventListener('click',state.onClick,true);
      state.video.removeEventListener('contextmenu',state.onContextMenu,true);
      try { state.video.controls=state.previousControls;state.video.tabIndex=state.previousTabIndex; } catch (_) {}
      if(state.button) state.button.textContent='Ativar teclado/mouse';
      if(state.status) state.status.textContent=message||'Captura desativada; entradas remotas liberadas.';
    }
    if(clearState===true) {
      nxRemoteHeldKeys.clear();
      nxRemoteMouseButtons=0;
    }
    return released;
  }
  function nxRemoteSendGamepadFrame(pad,slot,force,channelsOverride) {
    const sequence=nxRemoteInputSequence>>>0;
    const timestamp=(typeof performance!=='undefined' && performance.now)?performance.now():Date.now();
    const packet=nxRemoteEncodeGamepadFrame(pad,slot,sequence,timestamp);
    return packet ? nxRemoteSendInputPacket(packet,force===true,channelsOverride) : false;
  }
  function nxRemoteSendNeutralGamepad(slot,channelsOverride) {
    return nxRemoteSendGamepadFrame(nxRemoteNeutralGamepad,slot,true,channelsOverride);
  }
  function nxRemoteGamepadSuspend() {
    if(nxRemoteGamepadPaused) return;
    let complete=true;
    Array.from(nxRemoteRegisteredGamepadSlots).forEach(function(slot){
      if(!nxRemoteSendNeutralGamepad(slot)) complete=false;
    });
    nxRemoteGamepadPaused=complete;
  }
  function nxRemoteSetGamepadSlot(slot,wasAdded) {
    if(!Number.isInteger(slot) || slot<0 || slot>3 || typeof wasAdded!=='boolean') return false;
    const channel=nxRemoteChannels && nxRemoteChannels.control;
    if(!nxRemotePlay.dataChannelsReady || !channel || channel.readyState!=='open') return false;
    const registered=nxRemoteRegisteredGamepadSlots.has(slot);
    if(registered===wasAdded) return true;
    const payload=JSON.stringify({message:'gamepadChanged',gamepadIndex:slot,wasAdded:wasAdded});
    if(!nxRemoteChannelSend(channel,payload)) return false;
    if(wasAdded) nxRemoteRegisteredGamepadSlots.add(slot);
    else nxRemoteRegisteredGamepadSlots.delete(slot);
    return true;
  }
  function nxRemoteReleaseGamepadSlots(channels) {
    const input=channels && channels.input;
    const control=channels && channels.control;
    Array.from(nxRemoteRegisteredGamepadSlots).forEach(function(slot) {
      if(input && input.readyState==='open') nxRemoteSendNeutralGamepad(slot,channels);
      if(control && control.readyState==='open')
        nxRemoteChannelSend(control,JSON.stringify({message:'gamepadChanged',gamepadIndex:slot,wasAdded:false}));
    });
    nxRemoteRegisteredGamepadSlots.clear();
    nxRemoteGamepadPaused=false;
  }
  function nxRemoteGamepadTick(pads,allowInput) {
    if(!nxRemoteGamepadReady()) {
      if(nxRemoteRegisteredGamepadSlots.size) nxRemoteReleaseGamepadSlots(nxRemoteChannels);
      nxRemoteGamepadPaused=false;
      return 0;
    }
    const active=new Map();
    const source=Array.isArray(pads)?pads:[];
    for(let i=0;i<source.length;i++) {
      const pad=source[i];
      if(!pad || pad.connected===false || pad.mapping!=='standard') continue;
      const slot=Number.isInteger(pad.index)?pad.index:i;
      if(slot<0 || slot>3 || active.has(slot)) continue;
      active.set(slot,pad);
    }
    Array.from(nxRemoteRegisteredGamepadSlots).forEach(function(slot) {
      if(active.has(slot)) return;
      if(nxRemoteSendNeutralGamepad(slot)) nxRemoteSetGamepadSlot(slot,false);
    });
    if(allowInput!==true) {
      nxRemoteGamepadSuspend();
      return active.size;
    }
    nxRemoteGamepadPaused=false;
    active.forEach(function(pad,slot) {
      if(!nxRemoteRegisteredGamepadSlots.has(slot) && !nxRemoteSetGamepadSlot(slot,true)) return;
      nxRemoteSendGamepadFrame(pad,slot,false);
    });
    return active.size;
  }
  function nxRemoteCloseDataChannels() {
    const channels=nxRemoteChannels;
    nxRemoteInputCaptureDisable(true,'Sessão xHome encerrada; entradas remotas liberadas.');
    nxRemoteReleaseGamepadSlots(channels);
    nxRemoteChannels=null;
    nxRemotePlay.dataChannelsReady=false;
    nxRemoteGamepadPaused=false;
    if(nxRemotePlay.channelTimer!==null){clearTimeout(nxRemotePlay.channelTimer);nxRemotePlay.channelTimer=null;}
    if(!channels)return;
    Object.keys(channels).forEach(function(name){
      const channel=channels[name];
      try { if(channel && channel.readyState!=='closed') channel.close(); } catch (_) {}
    });
  }
  function nxRemoteInitDataChannels(peer,requestId,signal) {
    const channels={
      chat:peer.createDataChannel('chat',{ordered:true,protocol:'chatV1'}),
      control:peer.createDataChannel('control',{ordered:true,protocol:'controlV1'}),
      input:peer.createDataChannel('input',{ordered:true,protocol:'1.0'}),
      message:peer.createDataChannel('message',{ordered:true,protocol:'messageV1'})
    };
    nxRemoteChannels=channels;
    nxRemoteInputSequence=1; // ClientMetadata uses sequence 0; first input frame starts at 1.
    let handshakeAck=false,initialized=false;
    const isCurrent=function(){
      return requestId===nxRemotePlay.requestId && !signal.aborted && nxRemotePlay.peer===peer && nxRemoteChannels===channels;
    };
    let failureHandled=false;
    const fail=function(reason){
      if(failureHandled || !isCurrent())return;
      failureHandled=true;
      nxRemotePlay.dataChannelsReady=false;
      const message='Falha nos canais de dados xHome: '+String(reason||'erro').slice(0,140)+'.';
      const failureRequestId=requestId;
      Promise.resolve(nxRemoteStop()).then(function(){
        if(nxRemotePlay.requestId!==failureRequestId+1)return;
        nxRemotePlay.status=message;
        if(tabId==='remote')renderBody();
      }).catch(function(){
        if(nxRemotePlay.requestId!==failureRequestId+1)return;
        nxRemotePlay.status=message;
        if(tabId==='remote')renderBody();
      });
    };
    nxRemotePlay.channelTimer=setTimeout(function(){
      if(!initialized)fail('tempo limite de 12 segundos aguardando abertura dos canais e HandshakeAck');
    },12000);
    const sendMessage=function(target,data){
      return nxRemoteChannelSend(channels.message,JSON.stringify({
        type:'Message',content:JSON.stringify(data),id:nxRemoteUuid(),target:target,cv:''
      }));
    };
    const initialize=function(){
      if(!isCurrent() || initialized || !handshakeAck ||
        !Object.keys(channels).every(function(name){return channels[name] && channels[name].readyState==='open';})) return;
      initialized=true;
      if(nxRemotePlay.channelTimer!==null){clearTimeout(nxRemotePlay.channelTimer);nxRemotePlay.channelTimer=null;}
      try {
        // Public controlV1 bootstrap key used by the MIT reference client; it is not a user credential.
        const controlMessages=[
          {message:'authorizationRequest',accessKey:'4BDB3609-C1F1-4195-9B37-FEFF45DA8B8E'},
          {message:'gamepadChanged',gamepadIndex:0,wasAdded:true},
          {message:'gamepadChanged',gamepadIndex:0,wasAdded:false}
        ];
        for(const item of controlMessages) if(!nxRemoteChannelSend(channels.control,JSON.stringify(item))) throw new Error('canal control indisponível');
        const metadata=new ArrayBuffer(15),view=new DataView(metadata);
        view.setUint16(0,8,true);
        view.setUint32(2,0,true);
        view.setFloat64(6,(typeof performance!=='undefined' && performance.now)?performance.now():Date.now(),true);
        view.setUint8(14,Math.max(1,Number(navigator.maxTouchPoints)||1));
        if(!nxRemoteChannelSend(channels.input,metadata)) throw new Error('canal input indisponível');
        const dimensions=nxRemotePlay.resolution==='720p'?{width:1280,height:720}:{width:1920,height:1080};
        const configs=[
          ['/streaming/systemUi/configuration',{version:[0,2,0],systemUis:[]}],
          ['/streaming/properties/clientappinstallidchanged',{clientAppInstallId:nxRemoteUuid()}],
          ['/streaming/characteristics/orientationchanged',{orientation:0}],
          ['/streaming/characteristics/touchinputenabledchanged',{touchInputEnabled:false}],
          ['/streaming/characteristics/clientdevicecapabilities',{}],
          ['/streaming/characteristics/dimensionschanged',{
            horizontal:dimensions.width,vertical:dimensions.height,
            preferredWidth:dimensions.width,preferredHeight:dimensions.height,
            safeAreaLeft:0,safeAreaTop:0,safeAreaRight:dimensions.width,safeAreaBottom:dimensions.height,
            supportsCustomResolution:true
          }]
        ];
        for(const item of configs) if(!sendMessage(item[0],item[1])) throw new Error('canal message indisponível');
        nxRemotePlay.dataChannelsReady=true;
        nxRemotePlay.status='Canais de dados xHome prontos; gamepad físico encaminhado quando detectado.';
      } catch(e) {
        fail('falha ao inicializar: '+String(e && e.message||'erro'));
      }
      if(tabId==='remote')renderBody();
    };
    Object.keys(channels).forEach(function(name){
      channels[name].onopen=function(){
        if(!isCurrent())return;
        if(name==='message'){
          const sent=nxRemoteChannelSend(channels.message,JSON.stringify({
            type:'Handshake',version:'messageV1',id:'be0bfc6d-1e83-4c8a-90ed-fa8601c5a179',cv:'0'
          }));
          if(!sent){fail('não foi possível enviar o handshake messageV1');return;}
        }
        initialize();
      };
      channels[name].onclose=function(){if(isCurrent())fail('canal '+name+' fechado inesperadamente');};
      channels[name].onerror=function(){if(isCurrent())fail('erro no canal '+name);};
    });
    channels.message.onmessage=function(event){
      if(!isCurrent() || handshakeAck || !event || typeof event.data!=='string')return;
      let message;
      try { message=JSON.parse(event.data); } catch (_) { return; }
      if(message && message.type==='HandshakeAck'){handshakeAck=true;initialize();}
    };
    return channels;
  }
  async function nxRemoteDeleteSession(sessionId,region,token) {
    if(typeof sessionId!=='string' || !/^[a-z0-9-]{8,80}$/i.test(sessionId))return {ok:false,reason:'identificador de sessão inválido'};
    if(typeof region!=='string' || !/^[a-z0-9]{2,12}$/.test(region))return {ok:false,reason:'região inválida'};
    if(typeof token!=='string' || !token)return {ok:false,reason:'credencial de sessão indisponível'};
    const controller=new AbortController();
    const timeout=setTimeout(function(){controller.abort();},8000);
    try {
      const url='https://'+region+'.core.gssv-play-prodxhome.xboxlive.com/v5/sessions/home/'+encodeURIComponent(sessionId);
      const response=await fetch(url,{method:'DELETE',redirect:'error',signal:controller.signal,headers:{Authorization:'Bearer '+token}});
      if(response.status===404 || response.status===410)return {ok:true,alreadyClosed:true,status:response.status};
      if(!response.ok)return {ok:false,reason:'HTTP '+response.status};
      return {ok:true,status:response.status};
    } catch(e) {
      return {ok:false,reason:controller.signal.aborted?'timeout':'falha de rede'};
    } finally {clearTimeout(timeout);}
  }
  async function nxRemoteStop() {
    if(nxRemotePlay.sessionStatus==='stopping')return;
    // A sessão já foi encerrada localmente e aguarda liberação remota: preserve o retry pendente.
    // Um segundo Stop não deve apagar o aviso nem substituir o estado de liberação.
    if(nxRemotePendingRelease){if(tabId==='remote')renderBody();return;}
    const release={sessionId:nxRemotePlay.sessionId,region:nxRemotePlay.regionShortName,token:nxRemoteSessionToken};
    const stopRequestId=++nxRemotePlay.requestId;
    if(nxRemotePlay.abortController)nxRemotePlay.abortController.abort();
    nxRemotePlay.abortController=null;nxRemotePlay.busy=false;
    nxRemoteCloseDataChannels();
    nxRemotePlay.createPending=false;nxRemotePlay.cancelAfterCreate=false;
    if(nxRemotePlay.iceTimer){clearTimeout(nxRemotePlay.iceTimer);nxRemotePlay.iceTimer=null;}
    if(nxRemotePlay.peer){try{nxRemotePlay.peer.close();}catch(_){}nxRemotePlay.peer=null;}
    if(nxRemotePlay.videoElement){try{nxRemotePlay.videoElement.pause();nxRemotePlay.videoElement.srcObject=null;}catch(_){}}
    if(nxRemotePlay.mediaStream){try{nxRemotePlay.mediaStream.getTracks().forEach(function(t){t.stop();});}catch(_){}nxRemotePlay.mediaStream=null;}
    if(!release.sessionId){
      nxRemoteSessionToken='';
      nxRemotePlay.sessionId='';nxRemotePlay.sessionStatus='stopped';
      nxRemotePlay.status='Reprodução local encerrada';nxRemotePlay.error='';
      if(tabId==='remote')renderBody();
      return;
    }
    nxRemotePlay.sessionStatus='stopping';
    nxRemotePlay.status='Encerrando sessão no Xbox…';nxRemotePlay.error='';
    if(tabId==='remote')renderBody();
    const result=await nxRemoteDeleteSession(release.sessionId,release.region,release.token);
    if(stopRequestId!==nxRemotePlay.requestId)return;
    nxRemotePlay.sessionId='';
    nxRemoteSessionToken='';
    if(result.ok){
      nxRemotePendingRelease=null;
      nxRemotePlay.sessionStatus='stopped';nxRemotePlay.error='';
      nxRemotePlay.status=result.alreadyClosed?'Sessão remota já estava encerrada; recursos locais liberados.':'Sessão xHome encerrada no servidor e localmente.';
    }else{
      nxRemotePendingRelease={sessionId:release.sessionId,region:release.region,token:release.token,retrying:false};
      nxRemotePlay.sessionStatus='stopped-local-only';
      nxRemotePlay.error='DELETE xHome não confirmado: '+result.reason+'.';
      nxRemotePlay.status='Reprodução local encerrada; liberação remota pendente.';
    }
    if(tabId==='remote')renderBody();
  }
  async function nxRemoteRetryRelease() {
    const pending=nxRemotePendingRelease;
    if(!pending || pending.retrying)return;
    pending.retrying=true;
    nxRemotePlay.status='Tentando liberar a sessão remota…';nxRemotePlay.error='';
    if(tabId==='remote')renderBody();
    const result=await nxRemoteDeleteSession(pending.sessionId,pending.region,pending.token);
    if(nxRemotePendingRelease!==pending)return;
    pending.retrying=false;
    if(result.ok){
      nxRemotePendingRelease=null;
      nxRemotePlay.sessionStatus='stopped';nxRemotePlay.error='';
      nxRemotePlay.status=result.alreadyClosed?'Sessão remota já estava encerrada.':'Sessão remota liberada com sucesso.';
    }else{
      nxRemotePlay.sessionStatus='stopped-local-only';
      nxRemotePlay.error='DELETE xHome não confirmado: '+result.reason+'.';
      nxRemotePlay.status='Liberação remota ainda pendente.';
    }
    if(tabId==='remote')renderBody();
  }
  function nxRemoteCancel() {
    if(!nxRemotePlay.busy)return;
    if(nxRemotePlay.sessionId)return nxRemoteStop();
    if(nxRemotePlay.createPending){
      nxRemotePlay.cancelAfterCreate=true;
      nxRemotePlay.status='Cancelamento solicitado; aguardando o identificador para liberar o console…';
      if(tabId==='remote')renderBody();
      return;
    }
    nxRemotePlay.requestId++;
    if(nxRemotePlay.abortController)nxRemotePlay.abortController.abort();
    nxRemotePlay.abortController=null;nxRemotePlay.busy=false;
    nxRemoteCloseDataChannels();
    nxRemoteSessionToken='';
    nxRemotePlay.consoles=[];nxRemotePlay.selectedId='';nxRemotePlay.region='';nxRemotePlay.regionShortName='';nxRemotePlay.checkedAt=0;nxRemotePlay.attempts=[];
    if(nxRemotePlay.iceTimer){clearTimeout(nxRemotePlay.iceTimer);nxRemotePlay.iceTimer=null;}
    if(nxRemotePlay.peer){try{nxRemotePlay.peer.close();}catch(_){}nxRemotePlay.peer=null;}
    if(nxRemotePlay.videoElement){try{nxRemotePlay.videoElement.pause();nxRemotePlay.videoElement.srcObject=null;}catch(_){}}
    if(nxRemotePlay.mediaStream){try{nxRemotePlay.mediaStream.getTracks().forEach(function(t){t.stop();});}catch(_){}nxRemotePlay.mediaStream=null;}
    nxRemotePlay.createPending=false;nxRemotePlay.cancelAfterCreate=false;
    nxRemotePlay.status=nxRemotePlay.sessionStatus==='authenticating'||nxRemotePlay.sessionStatus==='requesting'?'Operação cancelada':'Consulta cancelada';nxRemotePlay.error='';nxRemotePlay.sessionStatus='cancelled';nxRemotePlay.sessionId='';
    if(tabId==='remote')renderBody();
  }
  async function nxRemoteDiscover() {
    if(nxRemotePlay.busy || nxRemotePlay.sessionId || nxRemotePlay.peer || nxRemotePlay.mediaStream || nxRemotePendingRelease) return;
    const requestId=++nxRemotePlay.requestId;
    const controller=new AbortController();
    nxRemotePlay.abortController=controller;
    const timeout=setTimeout(function(){controller.abort();},15000);
    nxRemotePlay.busy=true;nxRemotePlay.error='';nxRemotePlay.attempts=[];nxRemotePlay.region='';nxRemotePlay.regionShortName='';
    // Invalidate stale consoles before any authentication/network request.
    nxRemotePlay.consoles=[];nxRemotePlay.selectedId='';nxRemotePlay.checkedAt=0;
    nxRemotePlay.status='Consultando consoles vinculados…';
    if(tabId==='remote') renderBody();
    try {
      const token=nxRemoteGssvToken();
      if(!token) throw new Error('Credencial Xbox GSSV não encontrada. Entre na sua conta Xbox e recarregue.');
      const auth=await fetch('https://xhome.gssv-play-prod.xboxlive.com/v2/login/user',{
        method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},
        body:JSON.stringify({offeringId:'xhome',token:token}),signal:controller.signal,redirect:'error'});
      if(requestId!==nxRemotePlay.requestId || controller.signal.aborted) throw new Error('Consulta encerrada antes da conclusão.');
      if(!auth.ok) throw new Error('Login xHome recusado (HTTP '+auth.status+').');
      const login=await auth.json();
      if(requestId!==nxRemotePlay.requestId || controller.signal.aborted) throw new Error('Consulta encerrada antes da conclusão.');
      if(!login || typeof login.gsToken!=='string' || !login.gsToken || !login.offeringSettings || !Array.isArray(login.offeringSettings.regions))
        throw new Error('Resposta xHome incompleta.');
      const regions=login.offeringSettings.regions.slice().sort(function(a,b){return Number(!!(b && b.isDefault))-Number(!!(a && a.isDefault));});
      let found=[];
      let successfulRegions=0;
      for(const region of regions) {
        if(requestId!==nxRemotePlay.requestId || controller.signal.aborted) throw new Error('Consulta encerrada antes da conclusão.');
        if(!region || typeof region.baseUri!=='string') {nxRemotePlay.attempts.push('Região ignorada: configuração inválida');continue;}
        // Do not send the xHome bearer token to an untrusted origin from a malformed region response.
        let regionOrigin;
        try { const u=new URL(region.baseUri);if(u.protocol!=='https:' || u.username || u.password || !/(^|\.)xboxlive\.com$/i.test(u.hostname)) {nxRemotePlay.attempts.push('Região ignorada: origem não autorizada');continue;}regionOrigin=u.origin; }
        catch (_) {nxRemotePlay.attempts.push('Região ignorada: endereço inválido');continue;}
        try { const res=await fetch(regionOrigin+'/v6/servers/home?mr=50',{
          headers:{Authorization:'Bearer '+login.gsToken},signal:controller.signal,redirect:'error'});
          if(requestId!==nxRemotePlay.requestId || controller.signal.aborted) throw new Error('Consulta encerrada antes da conclusão.');
          if(res.status===401 || res.status===403) throw new Error('Acesso xHome negado (HTTP '+res.status+'). Faça login novamente na conta Xbox.');
          if(!res.ok) {nxRemotePlay.attempts.push('Região '+String(region.name||region.shortName||'padrão')+': HTTP '+res.status);continue;}
          const json=await res.json();
          if(requestId!==nxRemotePlay.requestId || controller.signal.aborted) throw new Error('Consulta encerrada antes da conclusão.');
          if(!json || !Array.isArray(json.results)) {nxRemotePlay.attempts.push('Resposta sem lista de consoles');continue;}
          successfulRegions++;
          nxRemotePlay.attempts.push('Região '+String(region.name||region.shortName||'padrão')+': '+json.results.length+' console(s)');
          if(json.results.length){found=json.results;nxRemotePlay.region=String(region.name||region.shortName||region.baseUri);nxRemotePlay.regionShortName=String(region.shortName||'').toLowerCase();break;}
        } catch (e) {if(requestId!==nxRemotePlay.requestId || controller.signal.aborted || (e && /^Acesso xHome negado/.test(String(e.message)))) throw e;nxRemotePlay.attempts.push('Região indisponível: '+String(e && e.name||'erro'));}
      }
      if(requestId!==nxRemotePlay.requestId || controller.signal.aborted) throw new Error('Consulta encerrada antes da conclusão.');
      if(!successfulRegions) throw new Error('Não foi possível consultar nenhuma região xHome. Verifique conexão, CORS e autenticação.');
      nxRemotePlay.consoles=found.filter(function(c){return c && typeof c.serverId==='string' && c.serverId.length>0;}).map(function(c){return {id:c.serverId,name:String(c.deviceName||c.name||c.serverName||'Xbox'),type:String(c.consoleType||'Xbox'),state:String(c.powerState||c.state||'Unknown')};});
      nxRemotePlay.status=nxRemotePlay.consoles.length?nxRemotePlay.consoles.length+' console(s) encontrado(s)':'Nenhum console vinculado encontrado';
      if(!nxRemotePlay.consoles.some(function(c){return c.id===nxRemotePlay.selectedId;})) nxRemotePlay.selectedId='';
      nxRemotePlay.checkedAt=Date.now();
    } catch(e) {
      if(requestId!==nxRemotePlay.requestId) return;
      // Never retain a previously discovered console after an auth or network failure.
      nxRemotePlay.consoles=[];nxRemotePlay.selectedId='';nxRemotePlay.region='';
      nxRemotePlay.error=controller.signal.aborted?'Tempo limite de 15 segundos excedido.':String(e && e.message||e);nxRemotePlay.status='Falha na consulta';
    }
    finally {clearTimeout(timeout);if(requestId===nxRemotePlay.requestId){nxRemotePlay.busy=false;nxRemotePlay.abortController=null;if(tabId==='remote')renderBody();}}
  }
  // xHome session bootstrap: explicit user action, no persistent tokens or SDP logging.
  async function nxRemoteStartSession() {
    if(nxRemotePlay.busy || nxRemotePlay.sessionId || nxRemotePlay.peer || nxRemotePendingRelease || !nxRemotePlay.selectedId) return;
    const serverId=nxRemotePlay.selectedId;
    if(!nxRemotePlay.consoles.some(function(c){return c.id===serverId;})) return;
    const region=nxRemotePlay.regionShortName;
    if(!/^[a-z0-9]{2,12}$/.test(region)) {
      nxRemotePlay.error='Região xHome sem identificador confiável. Atualize a lista de consoles.';
      if(tabId==='remote')renderBody();
      return;
    }
    const controller=new AbortController(), requestId=++nxRemotePlay.requestId;
    nxRemotePlay.busy=true;nxRemotePlay.abortController=controller;
    nxRemoteSessionToken='';nxRemotePlay.createPending=false;nxRemotePlay.cancelAfterCreate=false;
    nxRemotePlay.error='';nxRemotePlay.sessionStatus='authenticating';nxRemotePlay.sessionId='';
    nxRemotePlay.status='Autenticando sessão xHome…';
    const timeout=setTimeout(function(){controller.abort();},20000);
    const check=function(){if(requestId!==nxRemotePlay.requestId || controller.signal.aborted)throw new Error('Operação cancelada');};
    try {
      const token=nxRemoteGssvToken();
      if(!token)throw new Error('Credencial GSSV ausente ou expirada.');
      const auth=await fetch('https://xhome.gssv-play-prod.xboxlive.com/v2/login/user',{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({offeringId:'xhome',token:token}),signal:controller.signal,redirect:'error'
      });
      check();
      if(!auth.ok)throw new Error('Login xHome HTTP '+auth.status);
      const login=await auth.json();check();
      if(!login || typeof login.gsToken!=='string' || !login.gsToken)throw new Error('Credencial de sessão xHome inválida.');
      nxRemoteSessionToken=login.gsToken;
      const base='https://'+region+'.core.gssv-play-prodxhome.xboxlive.com';
      const deviceInfo=JSON.stringify({
        appInfo:{env:{clientAppId:'Microsoft.GamingApp',clientAppType:'native',clientAppVersion:'2203.1001.4.0',clientSdkVersion:'8.5.2',httpEnvironment:'prod',sdkInstallId:''}},
        dev:{hw:{make:'Microsoft',model:'Surface Pro',sdktype:'native'},os:{name:'Windows 11',ver:'22631.2715',platform:'desktop'},displayInfo:{dimensions:{widthInPixels:1920,heightInPixels:1080},pixelDensity:{dpiX:1,dpiY:1}}}
      });
      nxRemotePlay.sessionStatus='requesting';nxRemotePlay.status='Solicitando sessão ao console…';
      if(tabId==='remote')renderBody();
      nxRemotePlay.createPending=true;
      const play=await fetch(base+'/v5/sessions/home/play',{
        method:'POST',redirect:'error',signal:controller.signal,
        headers:{'Content-Type':'application/json','X-MS-Device-Info':deviceInfo,Authorization:'Bearer '+login.gsToken},
        body:JSON.stringify({clientSessionId:'',titleId:'',systemUpdateGroup:'',settings:{nanoVersion:'V3;WebrtcTransport.dll',enableTextToSpeech:false,highContrast:0,locale:navigator.language||'pt-BR',useIceConnection:false,timezoneOffsetMinutes:new Date().getTimezoneOffset(),sdkType:'web',osName:'windows'},serverId:serverId,fallbackRegionNames:[]})
      });
      check();
      if(!play.ok)throw new Error('Criação de sessão recusada (HTTP '+play.status+').');
      const response=await play.json();
      nxRemotePlay.createPending=false;
      check();
      if(!response || typeof response.sessionId!=='string' || !/^[a-z0-9-]{8,80}$/i.test(response.sessionId))throw new Error('Resposta de sessão inválida.');
      nxRemotePlay.sessionId=response.sessionId;
      if(nxRemotePlay.cancelAfterCreate){nxRemotePlay.cancelAfterCreate=false;await nxRemoteStop();return;}
      nxRemotePlay.sessionStatus='provisioning';
      nxRemotePlay.status='Aguardando provisionamento do Xbox…';
      if(tabId==='remote')renderBody();
      const sessionUrl=base+'/v5/sessions/home/'+encodeURIComponent(response.sessionId);
      let ready=false;
      for(let attempt=0;attempt<12;attempt++){
        check();
        const stateResponse=await fetch(sessionUrl+'/state',{method:'GET',redirect:'error',signal:controller.signal,headers:{Authorization:'Bearer '+login.gsToken}});
        check();
        if(!stateResponse.ok)throw new Error('Consulta de estado xHome recusada (HTTP '+stateResponse.status+').');
        const state=await stateResponse.json();check();
        if(state && state.state==='Provisioned'){ready=true;break;}
        if(!state || state.state!=='Provisioning')throw new Error('Sessão xHome não provisionada: '+String(state && state.state||'resposta inválida').slice(0,80));
        await new Promise(function(resolve,reject){
          const timer=setTimeout(function(){controller.signal.removeEventListener('abort',onAbort);resolve();},1000);
          function onAbort(){clearTimeout(timer);reject(new Error('Operação cancelada'));}
          controller.signal.addEventListener('abort',onAbort,{once:true});
          if(controller.signal.aborted)onAbort();
        });
      }
      check();
      if(!ready)throw new Error('Xbox não ficou pronto após 12 consultas de estado.');
      nxRemotePlay.sessionStatus='provisioned';
      nxRemotePlay.status='Xbox provisionado. Preparando negociação WebRTC…';
      if(typeof RTCPeerConnection==='function'){
        const peer=new RTCPeerConnection();
        nxRemotePlay.peer=peer;
        if(typeof MediaStream==='function'){
          const stream=new MediaStream();
          nxRemotePlay.mediaStream=stream;
          peer.ontrack=function(event){
            if(requestId!==nxRemotePlay.requestId)return;
            const tracks=event.streams&&event.streams[0]?event.streams[0].getTracks():[event.track];
            for(const track of tracks)if(track && !stream.getTracks().some(function(t){return t.id===track.id;}))stream.addTrack(track);
            if(nxRemotePlay.videoElement){
              nxRemotePlay.videoElement.srcObject=stream;
              nxRemotePlay.videoElement.play().catch(function(){});
            }
            if(tabId==='remote')renderBody();
          };
        }
        const localIceCandidates=[];
        let iceSend=null;
        let iceSendChain=Promise.resolve();
        peer.onicecandidate=function(event){
          if(!event || !event.candidate || requestId!==nxRemotePlay.requestId || controller.signal.aborted)return;
          const c=event.candidate;
          const candidate={candidate:c.candidate,sdpMid:c.sdpMid,sdpMLineIndex:c.sdpMLineIndex};
          if(iceSend){
            iceSendChain=iceSendChain.then(function(){return iceSend(candidate);}).catch(function(){
              if(requestId===nxRemotePlay.requestId){nxRemotePlay.status='Falha no envio de candidato ICE';if(tabId==='remote')renderBody();}
            });
          }else localIceCandidates.push(candidate);
        };
        peer.addTransceiver('audio',{direction:'recvonly'});
        peer.addTransceiver('video',{direction:'recvonly'});
        nxRemoteInitDataChannels(peer,requestId,controller.signal);
        const offer=await peer.createOffer();check();
        await peer.setLocalDescription(offer);check();
        const exchange=await fetch(sessionUrl+'/sdp',{
          method:'POST',redirect:'error',signal:controller.signal,
          headers:{'Accept':'application/json','Content-Type':'application/json',Authorization:'Bearer '+login.gsToken},
          body:JSON.stringify({messageType:'offer',sdp:peer.localDescription.sdp,configuration:{
            chatConfiguration:{bytesPerSample:2,expectedClipDurationMs:20,format:{codec:'opus',container:'webm'},numChannels:1,sampleFrequencyHz:24000},
            chat:{minVersion:1,maxVersion:1},control:{minVersion:1,maxVersion:3},input:{minVersion:1,maxVersion:8},message:{minVersion:1,maxVersion:1}
          }})
        });check();
        if(!exchange.ok)throw new Error('Envio SDP xHome recusado (HTTP '+exchange.status+').');
        nxRemotePlay.sessionStatus='negotiating';
        nxRemotePlay.status='Aguardando resposta SDP do Xbox…';
        if(tabId==='remote')renderBody();
        let answer=null;
        for(let attempt=0;attempt<8;attempt++){
          check();
          const res=await fetch(sessionUrl+'/sdp',{method:'GET',redirect:'error',signal:controller.signal,headers:{Authorization:'Bearer '+login.gsToken}});check();
          if(!res.ok)throw new Error('Consulta SDP recusada (HTTP '+res.status+').');
          const payload=await res.json();check();
          if(payload && typeof payload.exchangeResponse==='string' && payload.exchangeResponse){
            let parsed;
            try{parsed=JSON.parse(payload.exchangeResponse);}catch(_){throw new Error('Resposta SDP inválida.');}
            if(parsed && parsed.sdpType==='answer' && typeof parsed.sdp==='string' && parsed.sdp){answer=parsed.sdp;break;}
            if(parsed && parsed.status==='failed')throw new Error('Negociação SDP recusada pelo Xbox.');
          }
          await new Promise(function(resolve,reject){
            const timer=setTimeout(function(){controller.signal.removeEventListener('abort',onAbort);resolve();},500);
            function onAbort(){clearTimeout(timer);reject(new Error('Operação cancelada'));}
            controller.signal.addEventListener('abort',onAbort,{once:true});
            if(controller.signal.aborted)onAbort();
          });
        }
        check();
        if(!answer)throw new Error('Resposta SDP não recebida.');
        await peer.setRemoteDescription({type:'answer',sdp:answer});check();
        nxRemotePlay.sessionStatus='sdp-ready';
        nxRemotePlay.status='SDP negociado. Preparando candidatos ICE…';
        // ICE candidates may arrive before or after the SDP answer.
        iceSend=async function(candidate){
          check();
          const res=await fetch(sessionUrl+'/ice',{
            method:'POST',redirect:'error',signal:controller.signal,
            headers:{'Content-Type':'application/json',Authorization:'Bearer '+login.gsToken},
            body:JSON.stringify({candidate:JSON.stringify(candidate)})
          });check();
          if(!res.ok)throw new Error('Envio ICE recusado (HTTP '+res.status+').');
        };
        // Remote candidates are accepted only as valid candidate objects.
        const iceRes=await fetch(sessionUrl+'/ice',{method:'GET',redirect:'error',signal:controller.signal,headers:{Authorization:'Bearer '+login.gsToken}});check();
        if(!iceRes.ok)throw new Error('Consulta ICE recusada (HTTP '+iceRes.status+').');
        const iceData=await iceRes.json();check();
        const remoteList=Array.isArray(iceData)?iceData:Array.isArray(iceData&&iceData.candidates)?iceData.candidates:[];
        for(const entry of remoteList){
          check();
          let candidate=entry;
          if(typeof candidate==='string'){try{candidate=JSON.parse(candidate);}catch(_){continue;}}
          if(candidate && typeof candidate.candidate==='string' && candidate.candidate.length<8192){
            await peer.addIceCandidate(candidate);check();
          }
        }
        for(const candidate of localIceCandidates){await iceSend(candidate);}
        localIceCandidates.length=0;
        const remoteSeen=new Set(remoteList.map(function(c){return JSON.stringify(c);}));
        let icePollCount=0;
        const pollIce=async function(){
          if(requestId!==nxRemotePlay.requestId || controller.signal.aborted || nxRemotePlay.peer!==peer || peer.connectionState==='closed' || peer.connectionState==='failed' || peer.connectionState==='connected' || icePollCount++>=30)return;
          try{
            const res=await fetch(sessionUrl+'/ice',{method:'GET',redirect:'error',signal:controller.signal,headers:{Authorization:'Bearer '+login.gsToken}});
            if(requestId!==nxRemotePlay.requestId || controller.signal.aborted)return;
            if(!res.ok)throw new Error('HTTP '+res.status);
            const payload=await res.json();
            if(requestId!==nxRemotePlay.requestId || controller.signal.aborted)return;
            const entries=Array.isArray(payload)?payload:Array.isArray(payload&&payload.candidates)?payload.candidates:[];
            for(const entry of entries){
              const key=JSON.stringify(entry);
              if(remoteSeen.has(key))continue;
              remoteSeen.add(key);
              let c=entry;
              if(typeof c==='string'){try{c=JSON.parse(c);}catch(_){continue;}}
              if(requestId!==nxRemotePlay.requestId || controller.signal.aborted || peer.signalingState==='closed')return;
              if(c && typeof c.candidate==='string' && c.candidate.length<8192)await peer.addIceCandidate(c);
              if(requestId!==nxRemotePlay.requestId || controller.signal.aborted)return;
            }
          }catch(e){
            if(requestId===nxRemotePlay.requestId && !controller.signal.aborted){nxRemotePlay.status='ICE: '+String(e&&e.message||e);if(tabId==='remote')renderBody();}
          }
          if(requestId===nxRemotePlay.requestId && !controller.signal.aborted && (peer.connectionState==='new'||peer.connectionState==='connecting'))nxRemotePlay.iceTimer=setTimeout(pollIce,1000);
        };
        if(peer.connectionState==='new'||peer.connectionState==='connecting')nxRemotePlay.iceTimer=setTimeout(pollIce,1000);
        nxRemotePlay.sessionStatus='ice-pending';
        nxRemotePlay.status='Candidatos ICE processados; aguardando conexão WebRTC.';
        peer.onconnectionstatechange=function(){
          if(requestId!==nxRemotePlay.requestId)return;
          const connectionState=peer.connectionState||peer.iceConnectionState;
          if(connectionState==='connected'){
            nxRemotePlay.sessionStatus='connected';
            nxRemotePlay.status='WebRTC conectado; gamepad e teclado/mouse físico usam o canal input experimental. Mídia ainda aguarda validação.';
            if(nxRemotePlay.iceTimer){clearTimeout(nxRemotePlay.iceTimer);nxRemotePlay.iceTimer=null;}
          }else if(connectionState==='disconnected'||connectionState==='failed'||connectionState==='closed'){
            nxRemoteInputCaptureDisable(false,'Conexão WebRTC perdida; captura pausada e entradas liberadas.');
            nxRemoteGamepadSuspend();
            nxRemotePlay.sessionStatus='disconnected';
            nxRemotePlay.status='Conexão WebRTC '+connectionState+'.';
          }
          if(tabId==='remote')renderBody();
        };
        // O estado pode ter mudado antes da instalação do listener; reconciliar sem aguardar outro evento.
        if(peer.connectionState==='connected'||peer.iceConnectionState==='connected')peer.onconnectionstatechange();
      }else{
        nxRemotePlay.status='Xbox provisionado; WebRTC indisponível neste navegador.';
      }
    }catch(e){
      if(requestId!==nxRemotePlay.requestId)return;
      nxRemotePlay.createPending=false;nxRemotePlay.cancelAfterCreate=false;
      const failure=controller.signal.aborted?'Tempo limite da sessão (20 s).':String(e && e.message||e);
      if(nxRemotePlay.sessionId){
        await nxRemoteStop();
        nxRemotePlay.sessionStatus='failed';
        nxRemotePlay.error=failure+(nxRemotePendingRelease?' Liberação remota pendente.':' Sessão remota liberada.');
        nxRemotePlay.status='Falha ao criar sessão';
        if(tabId==='remote')renderBody();
      }else{
        nxRemoteCloseDataChannels();
        if(nxRemotePlay.iceTimer){clearTimeout(nxRemotePlay.iceTimer);nxRemotePlay.iceTimer=null;}
        if(nxRemotePlay.peer){try{nxRemotePlay.peer.close();}catch(_){}nxRemotePlay.peer=null;}
        if(nxRemotePlay.videoElement){try{nxRemotePlay.videoElement.pause();nxRemotePlay.videoElement.srcObject=null;}catch(_){}}
        if(nxRemotePlay.mediaStream){try{nxRemotePlay.mediaStream.getTracks().forEach(function(t){t.stop();});}catch(_){}}
        nxRemotePlay.mediaStream=null;nxRemotePlay.sessionId='';nxRemoteSessionToken='';
        nxRemotePlay.sessionStatus='failed';nxRemotePlay.error=failure;nxRemotePlay.status='Falha ao criar sessão';
      }
    }finally{
      clearTimeout(timeout);
      if(requestId===nxRemotePlay.requestId){nxRemotePlay.busy=false;nxRemotePlay.abortController=null;if(tabId==='remote')renderBody();}
    }
  }
  const TAB_BUILDERS = {
    remote: function(root) {
      root.appendChild(mk('div','font-size:19px;font-weight:750;margin-bottom:6px','Remote Play · Xbox em casa'));
      root.appendChild(mk('div','font-size:12px;color:'+C.dim+';margin-bottom:14px','Descoberta e negociação WebRTC experimentais. Gamepad e teclado/mouse físicos têm encaminhamento experimental; toque e mídia ainda dependem de validação real com Xbox.'));
      const btn=mk('button','cursor:pointer;padding:10px 14px;border-radius:9px;border:1px solid '+C.line+';background:'+C.panel+';color:'+C.text,nxRemotePlay.busy?'Consultando…':'Buscar meus consoles');
      btn.disabled=nxRemotePlay.busy || !!nxRemotePlay.sessionId || !!nxRemotePlay.peer || !!nxRemotePlay.mediaStream || !!nxRemotePendingRelease;btn.addEventListener('click',function(e){e.stopPropagation();nxRemoteDiscover();});root.appendChild(btn);
      if(nxRemotePlay.busy){const cancel=mk('button','cursor:pointer;padding:10px 14px;margin-left:8px;border-radius:9px;border:1px solid '+C.line+';background:'+C.panel+';color:'+C.text,nxRemotePlay.cancelAfterCreate?'Aguardando ID…':'Cancelar');cancel.disabled=nxRemotePlay.cancelAfterCreate;cancel.addEventListener('click',function(e){e.stopPropagation();nxRemoteCancel();});root.appendChild(cancel);}
      if(nxRemotePendingRelease){const retry=mk('button','cursor:pointer;padding:9px 12px;margin:6px 0;border:1px solid '+C.line+';border-radius:8px;background:'+C.panel+';color:'+C.text,nxRemotePendingRelease.retrying?'Tentando liberar…':'Tentar liberar sessão remota');retry.disabled=nxRemotePendingRelease.retrying;retry.addEventListener('click',function(e){e.stopPropagation();nxRemoteRetryRelease();});root.appendChild(retry);}
      root.appendChild(mk('div','font-size:12px;margin:12px 0;color:'+(nxRemotePlay.error?C.bad:C.dim),nxRemotePlay.error||nxRemotePlay.status));
      if(nxRemotePlay.region) root.appendChild(mk('div','font-size:11px;color:'+C.dim+';margin-bottom:5px','Região xHome: '+nxRemotePlay.region));
      if(nxRemotePlay.checkedAt) root.appendChild(mk('div','font-size:10px;color:'+C.dim+';margin-bottom:8px','Última consulta: '+new Date(nxRemotePlay.checkedAt).toLocaleTimeString()));
      if(nxRemotePlay.attempts.length) {const details=mk('details','font-size:11px;color:'+C.dim+';margin-bottom:10px');details.appendChild(mk('summary','cursor:pointer','Diagnóstico da descoberta'));nxRemotePlay.attempts.forEach(function(a){details.appendChild(mk('div','padding:3px 0',a));});root.appendChild(details);}
      if(nxRemotePlay.consoles.length){
        const quality=mk('select','padding:8px;border-radius:8px;background:'+C.panel+';color:'+C.text+';border:1px solid '+C.line+';margin-bottom:9px');
        ['720p','1080p','1080p-hq'].forEach(function(q){const o=document.createElement('option');o.value=q;o.textContent=q==='1080p-hq'?'1080p (HQ)':q;quality.appendChild(o);});
        quality.value=nxRemotePlay.resolution;quality.addEventListener('change',function(){nxRemotePlay.resolution=quality.value;});
        root.appendChild(mk('div','font-size:11px;color:'+C.dim+';margin-bottom:5px','Qualidade desejada (para futura sessão)'));root.appendChild(quality);
      }
      nxRemotePlay.consoles.forEach(function(c){const box=mk('div','padding:10px;margin-bottom:7px;border-radius:9px;border:1px solid '+C.line);
        box.appendChild(mk('div','font-weight:700',c.name));box.appendChild(mk('div','font-size:11px;color:'+C.dim,'Modelo: '+c.type+' · Estado: '+c.state));
        const select=mk('button','cursor:pointer;padding:8px 12px;margin-top:7px;border-radius:8px;border:1px solid '+C.line+';background:'+C.panel+';color:'+C.text,nxRemotePlay.selectedId===c.id?'Selecionado':'Selecionar console');
        select.addEventListener('click',function(e){e.stopPropagation();nxRemotePlay.selectedId=c.id;renderBody();});box.appendChild(select);root.appendChild(box);});
      if(nxRemotePlay.mediaStream){
        if(!nxRemotePlay.videoElement){
          const video=document.createElement('video');
          video.autoplay=true;video.playsInline=true;video.controls=true;video.tabIndex=0;video.style.cssText='display:block;width:100%;max-height:48vh;margin-top:12px;background:#000;border-radius:10px';
          nxRemotePlay.videoElement=video;
        }
        nxRemotePlay.videoElement.srcObject=nxRemotePlay.mediaStream;
        root.appendChild(nxRemotePlay.videoElement);
        if(nxRemoteGamepadReady()) {
          const inputButton=mk('button','cursor:pointer;padding:9px 12px;margin-top:8px;border:1px solid '+C.line+';border-radius:8px;background:'+C.panel+';color:'+C.text,
            nxRemoteInputCapture?'Desativar teclado/mouse':'Ativar teclado/mouse');
          const inputStatus=mk('div','font-size:11px;color:'+C.dim+';margin-top:6px',
            nxRemoteInputCapture?'Captura ativa. Escape encerra a captura.':'Entrada física opcional; mouse relativo dentro do vídeo. O HUD de toque ainda não está conectado ao canal xHome.');
          if(nxRemoteInputCapture){nxRemoteInputCapture.button=inputButton;nxRemoteInputCapture.status=inputStatus;}
          inputButton.addEventListener('click',function(e){
            e.stopPropagation();
            if(nxRemoteInputCapture) nxRemoteInputCaptureDisable(false,'Captura desativada manualmente.');
            else if(!nxRemoteInputCaptureEnable(nxRemotePlay.videoElement,inputButton,inputStatus))
              inputStatus.textContent='Não foi possível ativar: verifique a conexão WebRTC e os canais xHome.';
            inputButton.textContent=nxRemoteInputCapture?'Desativar teclado/mouse':'Ativar teclado/mouse';
          });
          root.appendChild(inputButton);
          root.appendChild(inputStatus);
        }
      }
      if(nxRemotePlay.sessionId || nxRemotePlay.peer || nxRemotePlay.mediaStream){
        const stop=mk('button','cursor:pointer;padding:9px 12px;margin-top:8px;border:1px solid '+C.line+';border-radius:8px;background:'+C.panel+';color:'+C.text,nxRemotePlay.sessionStatus==='stopping'?'Encerrando…':'Encerrar sessão');
        stop.disabled=nxRemotePlay.sessionStatus==='stopping';
        stop.addEventListener('click',function(e){e.stopPropagation();nxRemoteStop();});root.appendChild(stop);
      }
      if(nxRemotePlay.selectedId) {
        const start=mk('button','cursor:pointer;padding:10px 14px;margin-top:10px;border-radius:9px;border:1px solid '+C.line+';background:'+C.panel+';color:'+C.text,'Iniciar sessão xHome (experimental)');
        start.disabled=nxRemotePlay.busy || !!nxRemotePlay.sessionId || !!nxRemotePlay.peer || !!nxRemotePendingRelease;
        start.addEventListener('click',function(e){e.stopPropagation();nxRemoteStartSession();});
        root.appendChild(start);
        root.appendChild(mk('div','font-size:11px;color:'+C.dim+';margin-top:8px','A transmissão e o protocolo de entrada ainda não foram homologados em Xbox físico.'));
        if(nxRemotePlay.sessionStatus==='provisioned')root.appendChild(mk('div','font-size:11px;color:'+C.dim,'Xbox provisionado; aguardando negociação WebRTC.'));
      }
    },
    overview: function (root) {
      const intro = mk('div','font-size:19px;font-weight:750;letter-spacing:-.025em;margin:0 0 3px','Central de controle');
      root.appendChild(intro);
      root.appendChild(mk('div','font-size:12px;color:'+C.dim+';margin-bottom:12px','Status e ajustes rápidos primeiro. Todas as configurações continuam acessíveis abaixo.'));
      // Navegação compacta: opções existentes, sem duplicar gerenciadores ou controles.
      const touchQuick = mk('button','cursor:pointer;width:100%;text-align:left;padding:12px;margin:4px 0 12px;border-radius:10px;border:1px solid '+C.line+';background:'+C.panel+';color:'+C.text,'HUD teclado e mouse por toque  ›');
      touchQuick.addEventListener('click',function(e){
        e.stopPropagation();
        if(!window.NimboTouch || typeof window.NimboTouch.open!=='function'){toast('Touch HUD indisponível. Atualize o Tampermonkey.');return;}
        setOpen(false,true);window.NimboTouch.open();
      });
      root.appendChild(touchQuick);
      const nav = mk('div','display:flex;flex-direction:column;gap:5px;margin:12px 0');
      const navGroups = [
        { title: 'Jogo e controles', ids: ['controls','stream'] },
        { title: 'Áudio e acessórios', ids: ['audio','voice'] },
        { title: 'Conexão e sistema', ids: ['region','remote','advanced'] }
      ];
      navGroups.forEach(function (g) {
        nav.appendChild(mk('div','font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:'+C.dim+';margin:8px 0 2px',g.title));
        g.ids.forEach(function (id) {
          const t = TABS.find(function (item) { return item.id === id; });
          if (!t) return;
          const btn = mk('button','all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;padding:9px 11px;min-height:44px;border-radius:9px;background:rgba(255,255,255,.035);border:1px solid '+C.line+';color:'+C.text);
          btn.setAttribute('aria-label','Abrir '+t.label);
          btn.appendChild(ico(ICONS[t.id] || ICONS.advanced,17));
          const labels = mk('span','flex:1;min-width:0;display:flex;flex-direction:column');
          labels.appendChild(mk('span','font-size:12px;font-weight:650',t.label));
          labels.appendChild(mk('span','font-size:10px;color:'+C.dim,t.desc));
          btn.appendChild(labels);
          btn.appendChild(mk('span','font-size:16px;color:'+C.dim,'›'));
          btn.addEventListener('click',function (e) { e.stopPropagation(); setTab(t.id); });
          nav.appendChild(btn);
        });
      });
      const ban = mk('div', 'display:flex;align-items:center;gap:11px;padding:12px;border-radius:12px;border:1px solid ' + C.line + ';background:' + C.panel);
      const bdot = mk('span', 'width:10px;height:10px;border-radius:50%;flex:0 0 auto');
      const btxt = mk('div', 'min-width:0;flex:1');
      const bt = mk('div', 'font-size:14px;font-weight:700');
      const bs = mk('div', 'font-size:11px;color:' + C.dim + ';margin-top:2px;line-height:1.4');
      btxt.appendChild(bt); btxt.appendChild(bs);
      ban.appendChild(bdot); ban.appendChild(btxt);
      root.appendChild(ban);
      liveFns.push(function () {
        const s = linkState();
        bdot.style.background = s.color;
        bdot.style.boxShadow = '0 0 0 4px ' + (s.color.charAt(0) === '#' ? s.color + '33' : 'transparent');
        bt.textContent = s.text;
        bs.textContent = s.sub;
      });

      const grid = mk('div', 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px');
      grid.appendChild(statTile('Perda', function () {
        const l = curLoss();
        return { text: fmtN(l, '%', 1), color: lossColor(l) };
      }));
      grid.appendChild(statTile('RTT', function () {
        const r = S.qos && S.qos.rtt;
        return { text: fmtN(r, ' ms'), color: r == null ? C.dim : (r < 100 ? C.text : (r < 160 ? C.warn : C.bad)) };
      }));
      grid.appendChild(statTile('FPS', function () {
        const q = S.qos;
        return { text: fmtN(q && (q.fps > 0 ? q.fps : q.decodedFps)), color: q ? C.text : C.dim };
      }));
      grid.appendChild(statTile('Bitrate', function () {
        const q = S.qos;
        return { text: q && q.kbps != null ? fmtN(q.kbps / 1000, ' Mb', 1) : '—', color: q ? C.text : C.dim };
      }));
      grid.appendChild(statTile('Resolução', function () {
        const q = S.qos;
        return { text: q && q.h ? q.h + 'p' : '—', color: q ? C.text : C.dim };
      }));
      grid.appendChild(statTile('Jitter', function () {
        const q = S.qos;
        return { text: fmtN(q && q.jitter, ' ms'), color: q ? C.text : C.dim };
      }));
      root.appendChild(grid);

      const al = mk('div', 'display:none;margin-top:10px;white-space:pre-line;padding:9px 11px;border-radius:10px;font-size:11.5px;' +
        'line-height:1.5;border:1px solid rgba(210,153,34,.35);background:rgba(210,153,34,.1);color:#e3b341');
      root.appendChild(al);
      liveFns.push(function () {
        const msgs = regionDiffs();
        const h = hintOne(S.qos, curLoss());
        if (h) msgs.push(h);
        al.textContent = msgs.map(function (m) { return '⚠ ' + m; }).join('\n');
        al.style.display = msgs.length ? 'block' : 'none';
      });

      const pg = group('Perfis rápidos', 'Qualidade máxima automática; sem limite manual de bitrate.');
      const row = mk('div', 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px 0');
      PRESETS.forEach(function (p) {
        const on = getPref(LS_RES, 'auto') === p.res && getPref(LS_BITRATE, 'auto') === p.br;
        const b = mk('button', 'all:unset;box-sizing:border-box;cursor:pointer;text-align:center;padding:9px 4px;border-radius:10px;' +
          'border:1px solid ' + (on ? C.accent : C.line) + ';background:' + (on ? 'rgba(74,222,128,.12)' : 'transparent') +
          ';-webkit-tap-highlight-color:transparent');
        b.appendChild(mk('div', 'font-size:12.5px;font-weight:700;color:' + (on ? C.accent : C.text), p.name));
        b.appendChild(mk('div', 'font-size:10px;color:' + C.dim + ';margin-top:2px', p.sub));
        b.setAttribute('role', 'button');
        b.addEventListener('pointerdown', stopEv);
        b.addEventListener('click', function (e) {
          e.stopPropagation(); e.preventDefault();
          setPref(LS_RES, p.res); setPref(LS_BITRATE, p.br);
          S.lastPreset = p.name;
          pushLog('quality', 'Perfil ' + p.name + ' selecionado; aplicar na próxima partida');
          renderBody();
          toast('Perfil ' + p.name + ' · vale na próxima partida');
        });
        row.appendChild(b);
      });
      pg.card.appendChild(row);
      // Presets antigos mantidos apenas como código legado; não exibir escolhas que reduzam a qualidade.
      // root.appendChild(pg.root);

      const cg = group('Configuração atual');
      cg.add(infoRow('Data center', function () { return srvBtnLabel(); }));
      cg.add(infoRow('Qualidade', function () { return resCfg().label; }));
      cg.add(infoRow('Bitrate recebido', function () { return S.qos && Number.isFinite(S.qos.kbps) ? (S.qos.kbps / 1000).toFixed(1) + ' Mbps' : 'Aguardando transmissão'; }));
      cg.add(infoRow('Rede', function () { return v4on() ? 'IPv4 forçado' : 'IPv4 + IPv6'; }));
      cg.add(infoRow('Região da loja', function () { return cfg().name; }));
      root.appendChild(cg.root);
      root.appendChild(nav);
    },

    stream: function (root) {
      const healthGroup = group('Monitor de transmissão', 'Métricas reais do WebRTC e etapa de criação da sessão. Atualiza enquanto o painel estiver aberto.');
      healthGroup.add(infoRow('Estado da sessão', function () {
        const h = nxSessionHealth();
        const labels = { streaming:'Recebendo vídeo', 'not-observed':'Sem tentativa capturada',
          'network-error':'Falha de rede', 'access-rejected':'Acesso rejeitado',
          'rate-limited':'Limite de requisições', 'server-error':'Erro do servidor',
          'request-rejected':'Requisição rejeitada', 'session-accepted':'Sessão aceita', pending:'Aguardando' };
        return labels[h.state] || h.state;
      }));
      const healthDetail = setRow('Diagnóstico', '', null, true);
      healthGroup.add(healthDetail);
      liveDesc(healthDetail, function () { return nxSessionHealth().explanation; });
      healthGroup.add(infoRow('FPS recebido', function () {
        const q = S.qos;
        return q && (q.decodedFps != null || q.fps != null) ? String(q.decodedFps || q.fps || 0) : '—';
      }));
      healthGroup.add(infoRow('Bitrate recebido', function () {
        const q = S.qos;
        return q && Number.isFinite(q.kbps) ? (q.kbps / 1000).toFixed(2) + ' Mbps' : '—';
      }));
      healthGroup.add(infoRow('RTT WebRTC', function () {
        return S.qos && Number.isFinite(S.qos.rtt) ? S.qos.rtt + ' ms' : '—';
      }, 'Não equivale ao ping interno do jogo.'));
      healthGroup.add(infoRow('Jitter', function () {
        return S.qos && Number.isFinite(S.qos.jitter) ? S.qos.jitter + ' ms' : '—';
      }));
      healthGroup.add(infoRow('Perda de pacotes', function () {
        const q = S.qos;
        const n = q && (Number.isFinite(q.instLoss) ? q.instLoss : q.loss);
        return Number.isFinite(n) ? n.toFixed(1) + '%' : '—';
      }));
      healthGroup.add(infoRow('Decodificação', function () {
        return S.qos && Number.isFinite(S.qos.decodeMs) ? S.qos.decodeMs + ' ms/quadro' : '—';
      }));
      healthGroup.add(infoRow('Quadros descartados', function () {
        return S.qos && Number.isFinite(S.qos.dropped) ? String(S.qos.dropped) : '—';
      }));
      healthGroup.add(infoRow('Codec', function () { return S.qos && S.qos.codec || '—'; }));
      root.appendChild(healthGroup.root);
      root.appendChild(note('Alterações valem na próxima partida — não é preciso recarregar a página.'));

      const g1 = group('Data center');
      const srvOpts = Object.keys(SERVERS).map(function (k) {
        return { k: k, label: SERVERS[k].label + (k === 'auto' && S.serverActual ? ' · ' + S.serverActual : '') };
      });
      const rs = setRow('Servidor de streaming', 'Fixa o data center usado ao iniciar o jogo.',
        chips(srvOpts, getPref(LS_SRV, 'auto'), function (k) {
          setPref(LS_SRV, k);
          S.serverActual = '';
          S.serverPin = SERVERS[k].name;
          renderBody();
        }), true);
      g1.add(rs);
      g1.add(setRow('Escolher o mais rápido', 'No modo Auto, usa o data center com menor RTT medido nas últimas 24 h (mínimo 5 amostras).',
        toggle(getPref(LS_AUTO_BEST, '0') === '1', function () {
          const enabled = getPref(LS_AUTO_BEST, '0') === '1';
          setPref(LS_AUTO_BEST, enabled ? '0' : '1');
          pushLog('region', 'Auto RTT ' + (enabled ? 'desativado' : 'ativado'));
          renderBody();
        }, 'Escolher o data center mais rápido')));
      root.appendChild(g1.root);

      const g2 = group('Qualidade de vídeo');
      g2.add(infoRow('Qualidade solicitada', function () { return '1080p (máxima disponível)'; }, 'A resolução efetiva depende da negociação com o servidor.'));
      g2.add(infoRow('Bitrate recebido', function () { return S.qos && Number.isFinite(S.qos.kbps) ? (S.qos.kbps / 1000).toFixed(1) + ' Mbps' : 'Aguardando transmissão'; }, 'Valor medido, não um limite.'));
      root.appendChild(g2.root);

      const g3 = group('Rede');
      g3.add(setRow('Forçar IPv4', 'Remove candidatos IPv6 do ICE. Útil quando há perda alta ou rota instável.',
        toggle(v4on(), function () { toggleV4(); renderBody(); }, 'Forçar IPv4')));
      root.appendChild(g3.root);
    },

    media: function (root) {
      const g1 = group('Áudio');
      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = '0'; sl.max = '100'; sl.step = '5'; sl.value = '100';
      sl.setAttribute('aria-label', 'Volume do streaming');
      sl.style.cssText = 'width:100%;accent-color:' + C.accent + ';margin:0;height:28px';
      sl.addEventListener('pointerdown', function (e) { e.stopPropagation(); sliderDragging = true; });
      sl.addEventListener('input', function () {
        const v = activeStreamAudio();
        if (!v) return;
        const n = Number(sl.value) / 100;
        v.volume = n; v.muted = false;
        setPref(LS_VOLUME, String(n));
        pct.textContent = sl.value + '%';
      });
      const pct = mk('span', 'font-size:12px;font-weight:600;min-width:38px;text-align:right;font-variant-numeric:tabular-nums', '—');
      const ctl = mk('div', 'display:flex;align-items:center;gap:10px');
      ctl.appendChild(sl); ctl.appendChild(pct);
      const volRow = setRow('Volume do jogo', '', ctl, true);
      g1.add(volRow);
      liveDesc(volRow, function () { return activeStreamAudio() ? '' : 'Saída de áudio do streaming não encontrada; confira volume do sistema e do xCloud.'; });
      liveFns.push(function () {
        const v = activeStreamAudio();
        sl.disabled = !v;
        sl.style.opacity = v ? '1' : '.45';
        if (v && !sliderDragging) {
          sl.value = String(v.muted ? 0 : Math.round(v.volume * 100));
          pct.textContent = sl.value + '%';
        } else if (!v) pct.textContent = '—';
      });
      const muteLbl = mk('span', '', 'Silenciar');
      const muteBtn = actBtn('Silenciar', function () { toggleMute(); }, 'ghost');
      g1.add(setRow('Mudo', 'Silencia ou reativa o áudio do streaming.', muteBtn));
      liveFns.push(function () {
        const v = activeStreamAudio();
        muteBtn.textContent = v && v.muted ? 'Reativar som' : 'Silenciar';
        muteBtn.style.opacity = v ? '1' : '.45';
      });
      const audioOutputs=document.createElement('select');
      audioOutputs.setAttribute('aria-label','Dispositivo de saida');
      audioOutputs.style.cssText='width:100%;background:#161b22;color:#e8edf3;border:1px solid #30363d;border-radius:6px;padding:7px';
      const outputStatus=mk('span','font-size:11px','');
      const refreshOutputs=async function(){
        audioOutputs.replaceChildren();
        const def=document.createElement('option');def.value='';def.textContent='Padrao do sistema (inclui Bluetooth)';audioOutputs.appendChild(def);
        const status=nxAudioOutputSupport();
        audioOutputs.disabled=!status.canRoute;
        outputStatus.textContent=status.canRoute
          ? 'Selecao manual disponivel. O fone Bluetooth pode aparecer apenas como saida padrao.'
          : 'Saida controlada pelo sistema operacional. No Android, selecione o fone Bluetooth nas configuracoes do celular.';
        if(status.canRoute && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices){
          try{
            const devices=await navigator.mediaDevices.enumerateDevices();
            devices.filter(function(d){return d.kind==='audiooutput'&&d.deviceId;}).forEach(function(d,i){
              const opt=document.createElement('option');opt.value=d.deviceId;opt.textContent=d.label||('Saida '+(i+1));audioOutputs.appendChild(opt);
            });
          }catch(e){S.lastErr='Listar saidas: '+String(e&&e.name||e);}
        }
        const stored=getPref(LS_AUDIO_OUTPUT,'');
        audioOutputs.value=Array.from(audioOutputs.options).some(function(o){return o.value===stored;})?stored:'';
      };
      audioOutputs.addEventListener('change',function(){setPref(LS_AUDIO_OUTPUT,audioOutputs.value);applyAudioOutput();});
      g1.add(setRow('Saida de audio','No Android, fones Bluetooth normalmente usam a saida padrao do sistema.',audioOutputs,true));
      g1.add(setRow('Roteamento', 'Status de selecao de dispositivo.',outputStatus,true));
      g1.add(setRow('Dispositivos','Atualiza saidas disponibilizadas pelo navegador.',actBtn('Atualizar saidas',refreshOutputs,'ghost')));
      refreshOutputs();
            const presets = {
        original: [0,0,0,0,0,0,0,0,0,0], fps: [-3,-2,-1,0,1,2,3,3,1,0],
        corrida: [3,2,1,0,0,0,1,1,1,0], cinema: [3,2,1,0,0,1,2,2,1,1],
        musica: [2,1,0,0,0,0,0,1,1,2], dialogos: [-3,-2,-1,0,2,3,3,2,0,-1]
      };
      const fx = document.createElement('input'); fx.type = 'checkbox'; fx.checked = getPref(LS_AUDIO_FX, '0') === '1';
      fx.addEventListener('change', function () { setPref(LS_AUDIO_FX, fx.checked ? '1' : '0'); applyAudioProcessing(); });
      g1.add(setRow('Processamento', 'Desligado por padrão. Habilita os efeitos locais.', fx));
      const profile = document.createElement('select'); profile.style.cssText = 'width:100%;background:#161b22;color:#e8edf3;border:1px solid #30363d;border-radius:6px;padding:7px';
      Object.keys(presets).concat(['personalizado']).forEach(function (k) { const o = document.createElement('option'); o.value = k; o.textContent = k[0].toUpperCase() + k.slice(1); profile.appendChild(o); });
      profile.value = getPref(LS_AUDIO_PRESET, 'original');
      profile.addEventListener('change', function () {
        setPref(LS_AUDIO_PRESET, profile.value);
        if (presets[profile.value]) setPref(LS_AUDIO_BANDS, JSON.stringify(presets[profile.value]));
        setPref(LS_AUDIO_FX, profile.value === 'original' ? '0' : '1'); applyAudioProcessing(); renderBody();
      });
      g1.add(setRow('Perfil de áudio', 'FPS, corrida, cinema, música, diálogos e personalizado.', profile, true));
      g1.add(setRow('Ativar audio','Executa AudioContext.resume por clique direto. Necessario em navegadores com bloqueio de reproducao automatica.',
        actBtn('Ativar processamento',function(){
          setPref(LS_AUDIO_FX,'1');
          applyAudioProcessing();
          if(nxAudioGraph){
            Promise.resolve(nxAudioGraph.ctx.resume()).then(function(){
              toast(nxAudioGraph.ctx.state==='running'?'Audio ativo':'Audio ainda suspenso');
              renderBody();
            }).catch(function(e){S.lastErr='Audio: '+String(e&&e.message||e);renderBody();});
          }else{toast('Fluxo de audio indisponivel');renderBody();}
        },'ghost')));

      const eq = mk('div', 'display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;width:100%');
      const values = getAudioBands();
      [32,64,125,250,500,1000,2000,4000,8000,16000].forEach(function (hz,i) {
        const label = mk('label', 'display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10px');
        label.appendChild(mk('span','',hz >= 1000 ? hz / 1000 + 'k' : String(hz)));
        const range = document.createElement('input'); range.type = 'range'; range.min = '-12'; range.max = '12'; range.step = '1'; range.value = String(values[i]); range.style.width = '100%';
        const value = mk('span','',range.value + 'dB');
        range.addEventListener('input',function () { values[i] = Number(range.value); value.textContent = range.value + 'dB'; setPref(LS_AUDIO_BANDS,JSON.stringify(values)); setPref(LS_AUDIO_PRESET,'personalizado'); setPref(LS_AUDIO_FX,'1'); applyAudioProcessing(); });
        label.appendChild(range); label.appendChild(value); eq.appendChild(label);
      });
      g1.add(setRow('Equalizador 10 bandas','32 Hz a 16 kHz; -12 a +12 dB.',eq,true));
      [['Compressor',LS_AUDIO_COMP,'Reduz a dinâmica de volume.'],['Normalização',LS_AUDIO_NORMAL,'Compressão leve para suavizar diferenças de volume.'],
       ['Limitador',LS_AUDIO_LIMIT,'Reduz picos, sem garantir um limite absoluto.'],['Destacar diálogos',LS_AUDIO_DIALOG,'Realça frequências de voz, sem isolar falas.'],
       ['Mono',LS_AUDIO_MONO,'Combina os canais esquerdo e direito.']].forEach(function (cfg) {
        const check = document.createElement('input'); check.type = 'checkbox'; check.checked = getPref(cfg[1],'0') === '1';
        check.addEventListener('change',function () { setPref(cfg[1],check.checked ? '1' : '0'); setPref(LS_AUDIO_FX,'1'); applyAudioProcessing(); });
        g1.add(setRow(cfg[0],cfg[2],check));
      });
      const balance = document.createElement('input'); balance.type = 'range'; balance.min = '-100'; balance.max = '100'; balance.step = '5'; balance.value = getPref(LS_AUDIO_BALANCE,'0'); balance.style.width = '100%';
      balance.addEventListener('input',function () { setPref(LS_AUDIO_BALANCE,balance.value); setPref(LS_AUDIO_FX,'1'); applyAudioProcessing(); });
      g1.add(setRow('Balanço L/R','Esquerda (-100), centro (0), direita (+100).',balance,true));
      g1.add(setRow('Áudio original','Desativa os efeitos e mantém a reprodução sem equalização.',actBtn('Restaurar áudio original',function () { setPref(LS_AUDIO_FX,'0'); setPref(LS_AUDIO_PRESET,'original'); applyAudioProcessing(); renderBody(); },'ghost')));
      const diagnosis = setRow('Diagnóstico','Estado da reprodução e do processamento.',mk('span','font-size:11px','Áudio local'));
      g1.add(diagnosis); liveDesc(diagnosis,function () { const m = activeStreamAudio(); return !m ? 'Fluxo não detectado' : (m.paused ? 'Pausado' : 'Reproduzindo') + ' · ' + (m.muted ? 'Mudo' : Math.round(m.volume*100)+'%') + ' · ' + (nxAudioGraph && nxAudioGraph.media === m ? 'Web Audio: '+nxAudioGraph.ctx.state+(getPref(LS_AUDIO_FX,'0')==='1'?' · EQ ligado':' · bypass') : 'Web Audio desconectado'); });
      const signalRow=setRow('Sinal do equalizador','Mede o audio recebido pelo Web Audio, sem depender do nome do fone Bluetooth.',mk('span','font-size:11px','Monitoramento local'));
      g1.add(signalRow);
      liveDesc(signalRow,function(){return nxAudioSignalStatus();});
      g1.add(setRow('Áudio espacial','Depende do jogo, sistema e dispositivo; sem controle universal.',mk('span','font-size:11px','Sistema / jogo')));
      g1.add(setRow('Chat x jogo','Controle independente exige fluxos separados do xCloud.',mk('span','font-size:11px','Não disponível em fluxo misto')));
      root.appendChild(g1.root);

      const g2 = group('Imagem', 'Calibracao local por filtro CSS unico. Ajustes moderados para preservar sombras e realces.');
      g2.add(setRow('Perfil visual', 'Original restaura o video; os demais perfis substituem o filtro, sem acumular efeitos.',
        chips([{k:'original',label:'Original'},{k:'balanced',label:'Equilibrado'},{k:'vivid',label:'Vivido'},{k:'custom',label:'Manual'}],
          getPref(LS_VIDEO_PROFILE,'original'),function(k){
            setPref(LS_VIDEO_PROFILE,k);applyVideoAdjustments(activeStreamVideo());renderBody();
          }),true));
      const cal=nxVideoCalibration();
      function calibrationSlider(label,key,value,min,max,help){
        const control=mk('div','display:flex;align-items:center;gap:10px;min-width:150px');
        const slider=mk('input','flex:1;min-width:90px;accent-color:'+C.accent);
        slider.type='range';slider.min=String(min);slider.max=String(max);slider.step='1';slider.value=String(value);
        const readout=mk('span','font-variant-numeric:tabular-nums;min-width:40px;text-align:right',String(value)+'%');
        slider.addEventListener('input',function(){
          readout.textContent=slider.value+'%';
          if(getPref(LS_VIDEO_PROFILE,'original')!=='custom'){
            const base=nxVideoCalibration();
            setPref(LS_VIDEO_BRIGHTNESS,String(base.brightness));
            setPref(LS_VIDEO_CONTRAST,String(base.contrast));
            setPref(LS_VIDEO_SATURATION,String(base.saturation));
          }
          setPref(LS_VIDEO_PROFILE,'custom');
          setPref(key,slider.value);
          applyVideoAdjustments(activeStreamVideo());
        });
        slider.addEventListener('change',function(){renderBody();});
        control.appendChild(slider);control.appendChild(readout);
        g2.add(setRow(label,help,control,true));
      }
      calibrationSlider('Brilho',LS_VIDEO_BRIGHTNESS,cal.brightness,85,115,'Controla a luminosidade geral. Nao recupera detalhes ja perdidos no stream.');
      calibrationSlider('Contraste',LS_VIDEO_CONTRAST,cal.contrast,85,115,'Ajusta a separacao de claros e escuros. Evite extremos para nao estourar brancos ou fechar pretos.');
      calibrationSlider('Saturacao',LS_VIDEO_SATURATION,cal.saturation,75,125,'Ajusta a intensidade das cores sem alterar a resolucao.');
      g2.add(setRow('Restaurar imagem','Remove apenas o filtro NX e volta a configuracao original.',
        actBtn('Restaurar original',function(){
          setPref(LS_VIDEO_PROFILE,'original');applyVideoAdjustments(activeStreamVideo());renderBody();
        },'ghost')));
      const gpuGroup=group('Clarity Boost experimental','WebGL2: curvas simples de sombras e realces. Pode aumentar consumo e latencia; se falhar, retorna ao video nativo.');
      gpuGroup.add(setRow('Processamento GPU','Desativado por padrao. Ative somente durante uma partida.',
        chips([{k:'0',label:'Desligado'},{k:'1',label:'WebGL2'}],getPref(LS_NX_GPU,'0'),function(k){
          setPref(LS_NX_GPU,k);nxGpuSync();renderBody();
        }),true));
      gpuGroup.add(setRow('Nitidez','Ative WebGL2. Escolha o filtro de nitidez local.',
        chips([{k:'off',label:'Original'},{k:'usm',label:'Unsharp'},{k:'cas',label:'CAS'}],getPref('nx.gpu.clarity.mode.v1','off'),function(k){setPref('nx.gpu.clarity.mode.v1',k);renderBody();}),true));
      const clarityRow=mk('div','display:flex;align-items:center;gap:8px');
      const claritySlider=mk('input','flex:1;accent-color:'+C.accent);claritySlider.type='range';claritySlider.min='0';claritySlider.max='100';claritySlider.step='5';
      claritySlider.value=getPref('nx.gpu.clarity.strength.v1','35');
      const clarityLabel=mk('span','min-width:38px;text-align:right',claritySlider.value+'%');
      claritySlider.addEventListener('input',function(){clarityLabel.textContent=claritySlider.value+'%';setPref('nx.gpu.clarity.strength.v1',claritySlider.value);});
      clarityRow.appendChild(claritySlider);clarityRow.appendChild(clarityLabel);
      gpuGroup.add(setRow('Intensidade','Comece em 20–40%; excesso pode criar halos.',clarityRow,true));
      function gpuToneSlider(label,key){
        const row=mk('div','display:flex;align-items:center;gap:8px');
        const slider=mk('input','flex:1;accent-color:'+C.accent);slider.type='range';slider.min='-100';slider.max='100';slider.step='1';
        slider.value=String(Math.round((Number(getPref(key,'0'))||0)*100));
        const value=mk('span','min-width:35px;text-align:right',slider.value);
        slider.addEventListener('input',function(){value.textContent=slider.value;setPref(key,String(Number(slider.value)/100));});
        row.appendChild(slider);row.appendChild(value);
        gpuGroup.add(setRow(label,'Curva tonal local, sem alterar o stream original.',row,true));
      }
      gpuToneSlider('Sombras',LS_NX_SHADOWS);
      gpuToneSlider('Realces',LS_NX_HIGHLIGHTS);
      gpuGroup.add(setRow('Restaurar GPU','Desativa shader e remove a camada de apresentacao.',
        actBtn('Desativar GPU',function(){setPref(LS_NX_GPU,'0');nxGpuSync();renderBody();},'ghost')));
      root.appendChild(gpuGroup.root);
      const gVisual=group('Biblioteca de perfis', 'Compartilhe ajustes NX em JSON. Importacao validada e limitada a 16 KB; nenhuma instrucao de codigo e executada.');
      gVisual.add(setRow('Salvar configuracao','Armazena ate 24 perfis neste navegador.',
        actBtn('Salvar perfil',function(){
          const name=prompt('Nome do perfil visual (ate 64 caracteres):','Meu perfil NX');
          if(name===null)return;
          try{nxVisualSave(name);toast('Perfil salvo');renderBody();}
          catch(e){toast(String(e.message||e));}
        },'ghost')));
      gVisual.add(setRow('Exportar configuracao','Gera um arquivo JSON portatil.',
        actBtn('Exportar JSON',function(){
          const cal=nxVideoCalibration();
          nxVisualExport({format:NX_VISUAL_FORMAT,version:1,name:getPref(LS_VISUAL_ACTIVE,'Meu perfil NX'),
            author:'Local',settings:{brightness:cal.brightness,contrast:cal.contrast,saturation:cal.saturation}});
        },'ghost')));
      const importInput=mk('input','max-width:100%;font-size:11px');
      importInput.type='file';importInput.accept='.json,application/json';
      importInput.addEventListener('change',function(){if(importInput.files&&importInput.files[0])nxVisualImport(importInput.files[0]);});
      gVisual.add(setRow('Importar JSON','Aceita apenas perfis NX v1, sem scripts nem URLs externas.',importInput,true));
      const saved=nxVisualLibrary();
      if(saved.length){
        const options=saved.map(function(p,i){return {k:String(i),label:p.name};});
        gVisual.add(setRow('Perfis salvos','Selecione um perfil local para aplicar.',
          chips(options,'',function(k){nxVisualApply(saved[Number(k)]);renderBody();}),true));
      }
      root.appendChild(gVisual.root);
      g2.add(setRow('Enquadramento', 'Original preserva o site; Conter evita cortes; Preencher ocupa a tela, podendo cortar bordas.',
        chips([{ k: 'original', label: 'Original' }, { k: 'contain', label: 'Conter' }, { k: 'cover', label: 'Preencher' }], getPref(LS_VIDEO_FIT, 'original'), function (k) {
          setPref(LS_VIDEO_FIT, k); applyVideoFit(activeStreamVideo()); renderBody();
        }), true));
      g2.add(setRow('Tela cheia', 'Solicita a Fullscreen API apenas por ação do usuário.',
        actBtn('Entrar / Sair', nxConsoleLabFullScreen, 'ghost')));
      g2.add(setRow('Economia de recursos', 'Desativa filtros visuais locais enquanto a aba estiver oculta; não altera o stream ou FPS do servidor.',
        chips([{ k: '1', label: 'Ativa' }, { k: '0', label: 'Desativada' }], getPref(LS_VIDEO_ECO, '1'), function (k) {
          setPref(LS_VIDEO_ECO, k); applyVideoAdjustments(activeStreamVideo()); renderBody();
        }), true));
      root.appendChild(g2.root);

      const g3 = group('Captura');
      g3.add(setRow('Capturar quadro', 'Salva o quadro atual do jogo como imagem PNG.',
        actBtn('Capturar', function () { captureStreamFrame(); }, 'primary')));
      root.appendChild(g3.root);
    },

    controls: function (root) {
      const g1 = group('Dispositivo');
      const r1 = setRow('Perfil do dispositivo', '', chips([
        { k: 'auto', label: 'Auto' }, { k: 'desktop', label: 'Desktop' }, { k: 'mobile', label: 'Celular' }, { k: 'dex', label: 'DeX' }
      ], getPref(LS_DEVICE_PROFILE, 'auto'), function (k) {
        setPref(LS_DEVICE_PROFILE, k);
        pushLog('device', 'Perfil local ' + k + ' (não altera User-Agent nem controles)');
        renderBody();
      }), true);
      g1.add(r1);
      liveDesc(r1, function () { return 'Detectado: ' + S.deviceDetected + '. Não altera o User-Agent nem os controles.'; });
      g1.add(infoRow('Dispositivo detectado', function () { return detectedDeviceProfile(); },
        'Seleção automática. Não reduz qualidade ou bitrate.'));
      root.appendChild(g1.root);

      const g2 = group('Entradas detectadas');
      g2.add(infoRow('Tela de toque', function () {
        const c = inputCapabilities();
        return (c.touch ? 'Sim' : 'Não') + ' · ' + c.maxTouchPoints + ' pontos';
      }));
      g2.add(infoRow('Controles conectados', function () { return inputCapabilities().gamepadsConnected; }));
      g2.add(infoRow('Mouse capturado', function () { return document.pointerLockElement ? 'Sim' : 'Não'; },
        'Com teclado físico, F9 libera ou recaptura o mouse durante a partida.'));
      g2.add(infoRow('Controles com atividade', function () {
        return nxGamepadMonitor.active + ' / ' + nxGamepadMonitor.connected;
      }, 'Leitura de botões e eixos sem alterar entradas enviadas ao jogo.'));
      g2.add(infoRow('Última alteração de conexão', function () {
        return nxGamepadMonitor.lastChange ? new Date(nxGamepadMonitor.lastChange).toLocaleTimeString() : '—';
      }));
      g2.add(infoRow('Falhas de leitura', function () { return String(nxGamepadMonitor.errors); }));
      g2.add(infoRow('Fontes ativas (2 s)', function () {
        const r = nxInputSourcesReport();
        return r.recent.length ? r.recent.join(', ') : 'Nenhuma';
      }, 'Observação passiva de toque, mouse, teclado e controle.'));
      g2.add(infoRow('Sobreposições toque/mouse', function () {
        return String(nxInputSources.simultaneous);
      }, 'Toques podem gerar eventos de mouse sintéticos; não indica necessariamente um problema.'));
      root.appendChild(g2.root);

      const coordination = group('Coordenação de entradas — diagnóstico',
        'Prioridade visual das fontes. Não bloqueia toque, mouse, teclado ou controle.');
      coordination.add(setRow('Preferência de fonte', 'Automático sugere a fonte com atividade mais recente nos últimos 2 segundos.',
        chips(Object.keys(nxCoordModes).map(function (k) {
          return { k: k, label: nxCoordModes[k] };
        }), nxCoordMode(), function (k) {
          setPref(NX_INPUT_COORD_KEY, k);
          renderBody();
        }), true));
      coordination.add(infoRow('Fonte sugerida', function () {
        const state = nxCoordState();
        return nxCoordModes[state.suggested] || 'Nenhuma';
      }));
      coordination.add(infoRow('Fontes simultâneas', function () {
        return nxCoordState().mixed ? nxCoordState().activeSources.join(' + ') : 'Não detectadas';
      }, 'Janela de observação de 2 segundos; uso simultâneo pode ser intencional.'));
      coordination.add(infoRow('Fontes virtuais registradas', function () {
        const v = nxVirtualInputState();
        return v.count ? v.kinds.join(', ') : 'Nenhuma';
      }, 'Registro interno preparado para HUD, giroscópio e teclado/mouse virtuais. Ainda não controla o jogo.'));
      coordination.add(infoRow('Interferência no jogo', function () { return 'Nenhuma (somente diagnóstico)'; }));
      coordination.add(infoRow('Autoteste de entradas', function () {
        const result = nxInputSelfCheck();
        return result.passed + '/' + result.total + ' verificações';
      }, 'Testes matemáticos e estruturais locais; não valida uma partida real.'));
      coordination.add(infoRow('Eventos recentes', function () { return String(nxInputEvents.length); },
        'Histórico limitado aos 30 eventos mais recentes, sem registrar teclas ou coordenadas.'));
      coordination.add(setRow('Limpar diagnóstico de entradas', 'Zera contadores e histórico desta sessão.',
        actBtn('Limpar', function () {
          nxResetInputDiagnostics();
          nxSampleGamepads();
          renderBody();
          toast('Diagnóstico de entradas limpo');
        }, 'ghost')));
      root.appendChild(coordination.root);

      // Touch HUD é carregado pelo @require oficial: um único módulo e nenhuma instalação separada.
      const nxTouchGroup = group('HUD de teclado e mouse por toque',
        'Mouse relativo pelo dedo, joystick WASD, botões configuráveis e editor próprio. Requer suporte de teclado/mouse no jogo e na sessão.');
      nxTouchGroup.add(infoRow('Módulo', function () {
        return window.NimboTouch ? 'Carregado · v' + window.NimboTouch.version : 'Indisponível';
      }, 'Integração experimental: não converte mouse em analógico e não garante compatibilidade com todos os jogos.'));
      nxTouchGroup.add(setRow('Configurar teclado e mouse',
        'Abre o editor e a ativação do touchpad. Ao abrir, o painel NX é recolhido.',
        actBtn('Abrir Touch HUD', function () {
          if (!window.NimboTouch || typeof window.NimboTouch.open !== 'function') {
            toast('Touch HUD indisponível; atualize o userscript'); return;
          }
          setOpen(false, true);
          window.NimboTouch.open();
        }, 'primary')));
      root.appendChild(nxTouchGroup.root);

      const hudEditorGroup = group('Editor de HUD — prévia arrastável',
        'Arraste os botões para montar um layout e salve perfis locais por jogo. Ainda não altera o HUD do xCloud.');
      hudEditorGroup.add(infoRow('Sinais de controles na página', function () {
        const probe = nxHudDomProbe();
        return probe.candidates + ' candidatos (' + probe.interactive + ' interativos, ' +
          probe.visible + ' visíveis) / ' + probe.scanned + ' examinados' +
          (probe.truncated ? ' [limite atingido]' : '');
      }, 'Inspeção somente leitura de rótulos de acessibilidade; não confirma controles reais nem altera o HUD. Limite de 1500 elementos.'));
      hudEditorGroup.add(setRow('Carregar perfil automaticamente',
        'Desativado por padrão: evita substituir posições editadas quando você navega entre jogos. Afeta apenas a prévia.',
        toggle(nxHudAutoEnabled(), function () {
          nxHudSetAutoEnabled(!nxHudAutoEnabled());
          renderBody();
        }, 'Carregar perfil de HUD automaticamente')));
      hudEditorGroup.add(setRow('Posições dos botões', 'Toque ou use o mouse para arrastar os elementos da prévia.',
        nxHudEditor(), true));
      root.appendChild(hudEditorGroup.root);

      const gyroGroup = group('Giroscópio — calibração experimental',
        'Leitura e calibração dos sensores. A integração com a câmera é experimental e precisa ser ativada separadamente.');
      gyroGroup.add(infoRow('Orientação da tela', function () {
        const g = nxGyroPreviewState();
        return g.screenAngle === null ? 'Aguardando sensor' : g.screenAngle + '°';
      }, 'Ao girar o aparelho, o centro é redefinido e precisa ser calibrado novamente.'));
      gyroGroup.add(infoRow('Mudanças de orientação', function () {
        return String(nxGyroPreviewState().orientationChanges);
      }));
      gyroGroup.add(infoRow('Amostras recebidas', function () {
        return String(nxGyroPreviewState().samples);
      }));
      gyroGroup.add(infoRow('Sensor', function () {
        const g = nxGyroPreviewState();
        return g.enabled ? (g.receiving ? 'Recebendo dados' : 'Aguardando movimento') : g.permission;
      }));
      gyroGroup.add(infoRow('Inclinação horizontal', function () {
        const x = nxGyroPreviewState().tiltX;
        return x === null ? 'Calibre após ativar' : x + '°';
      }));
      gyroGroup.add(infoRow('Inclinação vertical', function () {
        const y = nxGyroPreviewState().tiltY;
        return y === null ? 'Calibre após ativar' : y + '°';
      }));
      gyroGroup.add(setRow('Inverter eixo horizontal', 'Apenas visualização; não afeta o jogo.',
        toggle(nxGyroInvertX(), function () {
          setPref(NX_GYRO_INVERT_X_KEY, nxGyroInvertX() ? '0' : '1');
          renderBody();
        }, 'Inverter eixo horizontal')));
      gyroGroup.add(setRow('Inverter eixo vertical', 'Apenas visualização; não afeta o jogo.',
        toggle(nxGyroInvertY(), function () {
          setPref(NX_GYRO_INVERT_Y_KEY, nxGyroInvertY() ? '0' : '1');
          renderBody();
        }, 'Inverter eixo vertical')));
      gyroGroup.add(setRow('Enviar giroscópio ao jogo (experimental)',
        'Desativado por padrão. Exige controle físico padrão e sensor calibrado. Recarrega a página; ative novamente a leitura do sensor após recarregar.',
        toggle(nxGyroGameEnabled(), function () {
          setPref(NX_GYRO_GAME_KEY, nxGyroGameEnabled() ? '0' : '1');
          location.reload();
        }, 'Ativar giroscópio experimental no jogo')));
      gyroGroup.add(setRow('Controle que recebe o giroscópio',
        'Evita movimentar todos os controles conectados. Índice 0 é o padrão.',
        chips([{ k: '0', label: 'Controle 1' }, { k: '1', label: 'Controle 2' },
          { k: '2', label: 'Controle 3' }, { k: '3', label: 'Controle 4' }],
          String(nxGyroTargetIndex()), function (k) {
            setPref(NX_GYRO_TARGET_KEY, k);
            renderBody();
          }), true));
      gyroGroup.add(setRow('Intensidade da contribuição no jogo',
        'Limita a força adicionada ao analógico direito. Comece em 25% para evitar movimentos bruscos.',
        chips([{ k: '0.25', label: '25%' }, { k: '0.5', label: '50%' }, { k: '1', label: '100%' }],
          getPref(NX_GYRO_BLEND_KEY, '0.5'), function (k) {
            setPref(NX_GYRO_BLEND_KEY, k);
            renderBody();
          }), true));
      gyroGroup.add(setRow('Ativação da mira por giroscópio',
        'LT (gatilho esquerdo) é o padrão; Sempre ativo exige controle físico conectado.',
        chips([{ k: 'lt', label: 'Segurar LT' }, { k: 'always', label: 'Sempre ativo' }],
          nxGyroActivationMode(), function (k) {
            setPref(NX_GYRO_TRIGGER_KEY, k);
            renderBody();
          }), true));
      gyroGroup.add(infoRow('Saída ao jogo', function () {
        if (!nxGyroGameEnabled()) return 'Desativada';
        if (!nxInputBridge.installed) return 'Aguardando ponte experimental';
        const g = nxGyroPreviewState();
        return g.enabled && g.calibrated && g.receiving ? 'Pronta (controle padrão)' : 'Aguardando sensor e calibração';
      }));
      gyroGroup.add(infoRow('Eixos virtuais simulados', function () {
        const g = nxGyroPreviewState();
        return g.axisX.toFixed(2) + ' / ' + g.axisY.toFixed(2);
      }, 'Valores normalizados entre -1 e 1; não enviados ao jogo.'));
      gyroGroup.add(setRow('Sensibilidade da prévia', 'Somente simulação dos eixos; não modifica o controle físico.',
        chips([{ k: '0.5', label: 'Baixa' }, { k: '1', label: 'Normal' }, { k: '2', label: 'Alta' }],
          getPref(NX_GYRO_SENS_KEY, '1'), function (k) {
            setPref(NX_GYRO_SENS_KEY, k);
            renderBody();
          }), true));
      gyroGroup.add(setRow('Zona morta da prévia', 'Ignora pequenas inclinações para reduzir tremores.',
        chips([{ k: '0', label: 'Nenhuma' }, { k: '0.04', label: 'Normal' }, { k: '0.1', label: 'Alta' }],
          getPref(NX_GYRO_DEADZONE_KEY, '0.04'), function (k) {
            setPref(NX_GYRO_DEADZONE_KEY, k);
            renderBody();
          }), true));
      gyroGroup.add(setRow('Suavização da leitura', 'Afeta apenas a prévia local. Não modifica a mira.',
        chips([{ k: '0.1', label: 'Suave' }, { k: '0.25', label: 'Equilibrada' }, { k: '0.7', label: 'Rápida' }],
          getPref(NX_GYRO_SMOOTH_KEY, '0.25'), function (k) {
            setPref(NX_GYRO_SMOOTH_KEY, k);
            renderBody();
          }), true));
      gyroGroup.add(setRow('Leitura de sensores', 'Solicita permissão apenas após toque no botão.',
        actBtn(nxGyroPreview.enabled ? 'Desativar' : 'Ativar', function () {
          if (nxGyroPreview.enabled) {
            nxStopGyroPreview();
            renderBody();
            return;
          }
          nxStartGyroPreview().then(function (ok) {
            renderBody();
            toast(ok ? 'Sensor ativado; mova o aparelho e calibre' : 'Sensor indisponível ou permissão negada');
          });
        }, 'primary')));
      gyroGroup.add(setRow('Reiniciar calibração', 'Apaga o centro atual, sem alterar configurações salvas.',
        actBtn('Reiniciar', function () {
          nxResetGyroCalibration();
          renderBody();
          toast('Calibração reiniciada');
        })));
      gyroGroup.add(setRow('Definir posição central', 'Mantenha o aparelho na posição de jogo antes de calibrar.',
        actBtn('Calibrar', function () {
          const ok = nxCalibrateGyroPreview();
          renderBody();
          toast(ok ? 'Centro do sensor definido' : 'Ative o sensor e aguarde uma leitura');
        })));
      root.appendChild(gyroGroup.root);

      /* NX_FROZEN_ANALOG_UI_START
      const inputPreview = group('Perfis de analógico',
        'Simulação por padrão. Aplicação experimental opcional com recarregamento e retorno imediato ao modo nativo.');
      inputPreview.add(setRow('Aplicar curvas ao jogo (experimental)',
        'Desativado por padrão. Altera somente os eixos lidos pela Gamepad API; não altera botões. Requer recarregar a página.',
        toggle(nxInputEnabled(), function () {
          setPref(NX_INPUT_APPLY_KEY, nxInputEnabled() ? '0' : '1');
          location.reload();
        }, 'Ativar processamento experimental de eixos')));
      inputPreview.add(setRow('Restaurar controle nativo',
        'Desativa o processamento experimental imediatamente, sem precisar recarregar.',
        actBtn('Restaurar', function () {
          nxRestoreNativeGamepads('Restauração solicitada pelo usuário');
          nxSampleGamepads();
          renderBody();
          toast('Leitura nativa restaurada');
        }, 'ghost')));
      inputPreview.add(infoRow('Integridade da Gamepad API', function () {
        nxInputBridgeStatus();
        if (nxInputBridge.foreignOverride) return 'Outro script assumiu o controle';
        if (nxInputBridge.installed && navigator.getGamepads !== nxInputBridge.wrapper) return 'Alterada por outro script';
        return nxInputBridge.installed ? 'Ponte experimental ativa' : 'API nativa';
      }));
      inputPreview.add(infoRow('Recuperações automáticas', function () {
        return String(nxInputBridge.fallbacks);
      }));
      inputPreview.add(infoRow('Processamento de entradas', function () {
        return nxInputBridgeStatus();
      }));
      inputPreview.add(setRow('Analógico esquerdo', 'Curva dos eixos 0 e 1 (movimentação, conforme o jogo).',
        chips(Object.keys(nxInputProfiles).map(function (k) { return { k: k, label: nxInputProfiles[k].label }; }),
          nxInputProfileName(), function (k) {
            setPref(NX_INPUT_PROFILE_KEY, k);
            nxSampleGamepads();
            renderBody();
          }), true));
      inputPreview.add(setRow('Analógico direito', 'Curva dos eixos 2 e 3 (câmera, conforme o jogo).',
        chips(Object.keys(nxInputProfiles).map(function (k) { return { k: k, label: nxInputProfiles[k].label }; }),
          nxRightStickProfileName(), function (k) {
            setPref(NX_RIGHT_STICK_PROFILE_KEY, k);
            nxSampleGamepads();
            renderBody();
          }), true));
      inputPreview.add(infoRow('Zona morta', function () {
        return Math.round(nxInputProfiles[nxInputProfileName()].deadzone * 100) + '%';
      }));
      inputPreview.add(infoRow('Curva', function () {
        return String(nxInputProfiles[nxInputProfileName()].curve);
      }));
      inputPreview.add(infoRow('Eixos simulados (até 4)', function () {
        return nxGamepadMonitor.snapshots.length ?
          nxGamepadMonitor.snapshots.map(function (p) {
            return '#' + p.index + ': ' + p.axisPreview.map(function (v) { return v.toFixed(2); }).join(', ');
          }).join(' | ') : 'Conecte e mova um controle';
      }, 'Valores normalizados de -1 a 1. Não afeta o jogo.'));
      root.appendChild(inputPreview.root);
      NX_FROZEN_ANALOG_UI_END */

      const g3 = group('Acessórios');
      const micButtons = mk('div', 'display:flex;gap:6px;flex-wrap:wrap');
      const micToggle = actBtn(getPref(LS_MIC_ENABLED, '0') === '1' ? 'Microfone: ativado' : 'Microfone: desativado', function () {
        const enabled = getPref(LS_MIC_ENABLED, '0') !== '1';
        setPref(LS_MIC_ENABLED, enabled ? '1' : '0');
        if (!enabled) stopMicrophoneTest();
        S.micStatus = enabled ? 'Preferência ativa. Teste a entrada; a voz no jogo depende do xCloud.' : 'Microfone desativado nas preferências NX.';
        renderBody(); update();
      }, 'ghost');
      micButtons.appendChild(micToggle);
      micButtons.appendChild(actBtn('Testar microfone', function () { inspectMicrophone(); }, 'ghost'));
      micButtons.appendChild(actBtn('Parar teste', function () { stopMicrophoneTest(); }, 'ghost'));
      micButtons.appendChild(actBtn('Atualizar dispositivos', function () { refreshMicDevices(); }, 'ghost'));
      const micDevice = document.createElement('select');
      micDevice.setAttribute('aria-label', 'Dispositivo de entrada de voz');
      micDevice.style.cssText = 'width:100%;max-width:100%;background:#161b22;color:#e8edf3;border:1px solid #30363d;border-radius:6px;padding:7px';
      const defaultMic = document.createElement('option'); defaultMic.value = ''; defaultMic.textContent = 'Microfone padrão do sistema'; micDevice.appendChild(defaultMic);
      micDevice.value = getPref(LS_MIC_DEVICE, '');
      micDevice.addEventListener('change', function () { setPref(LS_MIC_DEVICE, micDevice.value); if (micTestStream) inspectMicrophone(); });
      micDeviceControl = micDevice;
      micButtons.appendChild(micDevice);
      [['Redução de ruído', LS_MIC_NOISE], ['Cancelamento de eco', LS_MIC_ECHO],
        ['Ganho automático', LS_MIC_AGC], ['Silenciar voz enviada', LS_MIC_MUTE],
        ['Apertar V para falar (teclado)', LS_MIC_PTT]].forEach(function (cfg) {
        const label = document.createElement('label'); label.style.cssText = 'display:flex;gap:7px;align-items:center;width:100%;font-size:12px';
        const check = document.createElement('input'); check.type = 'checkbox';
        check.checked = getPref(cfg[1], cfg[1] === LS_MIC_MUTE || cfg[1] === LS_MIC_PTT ? '0' : '1') === '1';
        check.addEventListener('change', function () { setPref(cfg[1], check.checked ? '1' : '0'); applyVoiceMute(); });
        label.appendChild(check); label.appendChild(document.createTextNode(cfg[0])); micButtons.appendChild(label);
      });
      const micMeter = document.createElement('progress'); micMeter.max = 100; micMeter.value = 0;
      micMeter.style.cssText = 'width:100%;height:12px'; micMeter.setAttribute('aria-label', 'Nível de entrada do microfone');
      micLevelControl = micMeter; micButtons.appendChild(micMeter);
      refreshMicDevices();
      const mic = setRow('Microfone', 'Escolha o microfone para as próximas solicitações de captura do xCloud. O jogo precisa oferecer chat de voz.', micButtons);
      g3.add(mic);
      liveDesc(mic, function () { return S.micStatus; });
      const vibControls = mk('div', 'display:flex;gap:6px;flex-wrap:wrap;align-items:center');
      const vibLevel = document.createElement('select');
      vibLevel.setAttribute('aria-label', 'Intensidade do teste de vibração');
      vibLevel.style.cssText = 'background:#161b22;color:#e8edf3;border:1px solid #30363d;border-radius:6px;padding:6px';
      [0,25,50,75,100].forEach(function (v) {
        const opt = document.createElement('option'); opt.value = String(v); opt.textContent = v + '%';
        vibLevel.appendChild(opt);
      });
      vibLevel.value = String(Math.round(Number(getPref(LS_VIBRATION, '0.5')) * 100));
      vibLevel.addEventListener('change', function () { setPref(LS_VIBRATION, String(Number(vibLevel.value) / 100)); S.vibrationStatus = 'Intensidade salva para testes: ' + vibLevel.value + '%. Ajuste automático durante a partida ainda não integrado.'; update(); });
      vibControls.appendChild(vibLevel);
      vibControls.appendChild(actBtn('Testar controle', function () { testVibration(); }, 'ghost'));
      vibControls.appendChild(actBtn('Testar celular', function () { testPhoneVibration(); }, 'ghost'));
      const vib = setRow('Vibração', 'Teste local do motor do controle ou do celular. Não altera automaticamente a vibração enviada pelo xCloud.', vibControls);
      g3.add(vib);
      liveDesc(vib, function () { return S.vibrationStatus; });
      root.appendChild(g3.root);

      nxBindControls(root);
    },

    region: function (root) {
      root.appendChild(note('Ao trocar a região da loja, a página recarrega uma vez para aplicar.'));
      const g1 = group('Região da loja');
      const opts = Object.keys(REGIONS).map(function (k) { return { k: k, label: REGIONS[k].name }; });
      opts.push({ k: 'off', label: 'Desligado' });
      g1.add(setRow('Desbloqueio de região', 'Reescreve a verificação de mercado para a região escolhida.',
        chips(opts, cfg().key, function (k) {
          pickApply('region', k);
          location.reload();
        }), true));
      root.appendChild(g1.root);

      const al = mk('div', 'display:none;margin-top:12px;white-space:pre-line;padding:9px 11px;border-radius:10px;font-size:11.5px;' +
        'line-height:1.5;border:1px solid rgba(210,153,34,.35);background:rgba(210,153,34,.1);color:#e3b341');
      root.appendChild(al);
      liveFns.push(function () {
        const d = regionDiffs();
        al.textContent = d.map(function (m) { return '⚠ ' + m; }).join('\n');
        al.style.display = d.length ? 'block' : 'none';
      });

      const g2 = group('Estado');
      g2.add(infoRow('Região configurada', function () { return cfg().name + (cfg().territory ? ' (' + cfg().territory + ')' : ''); }));
      g2.add(infoRow('Cookie de território', function () { return getCookie('territory') || '(nenhum)'; }));
      g2.add(infoRow('Experimentos reescritos', function () {
        return S.expHits ? S.expHits + '× · ' + S.expBefore + ' → ' + S.expAfter : 'Nenhum ainda';
      }));
      g2.add(infoRow('Requisições com cabeçalho', function () { return S.inj; }));
      g2.add(infoRow('Acesso negado (erros)', function () { return S.denied; }));
      root.appendChild(g2.root);
    },

    advanced: function (root) {
      inspectRemotePlay();
      inspectServerMeasurements();

      const g1 = group('Desempenho');
      g1.add(spark('FPS recebidos', 'fps', C.accent, ' FPS', 60));
      g1.add(spark('RTT WebRTC', 'rtt', '#58a6ff', ' ms', 100));
      g1.add(spark('Perda de pacotes', 'loss', '#f0883e', '%', 5));
      root.appendChild(g1.root);

      const g2 = group('Detalhes do link', 'Métricas do navegador; o RTT não representa a latência interna do jogo. Valores ausentes não são estimados.');
      g2.add(infoRow('Codec', function () { return (S.qos && S.qos.codec) || 'Indisponível'; }));
      g2.add(infoRow('Transporte', function () {
        const q = S.qos;
        return q ? ([q.family, q.proto].filter(Boolean).join(' / ') || 'Indisponível') : 'Indisponível';
      }));
      g2.add(infoRow('Servidor', function () { return S.serverActual || 'Automático / não identificado'; }));
      g2.add(infoRow('Buffer de jitter', function () { return fmtN(S.qos && S.qos.bufMs, ' ms'); }));
      g2.add(infoRow('Decodificação média', function () { return fmtN(S.qos && S.qos.decodeMs, ' ms', 1); }));
      g2.add(infoRow('Quadros descartados', function () {
        const q = S.qos;
        if (!q || !(q.decoded || q.dropped)) return '—';
        return fmtN(q.dropped / ((q.decoded + q.dropped) || 1) * 100, '%', 1) + ' (' + q.dropped + ')';
      }));
      g2.add(infoRow('Congelamentos', function () {
        const q = S.qos;
        return q ? fmtN(q.freeze) + ' · ' + fmtN(q.freezeDur, ' s') : '—';
      }));
      g2.add(infoRow('Diagnóstico automático', function () { return S.lastDiagnosis; }));
      root.appendChild(g2.root);

      const g3 = group('Servidores medidos');
      g3.add(infoRow('RTT por data center', function () {
        const keys = Object.keys(S.latencyByServer);
        return keys.length ? keys.map(function (k) { return k + ': ' + Math.round(S.latencyByServer[k].avg) + ' ms'; }).join('\n') : 'Aguardando amostras';
      }, 'Medido apenas em partidas reais (não é sondagem ativa).'));
      g3.add(setRow('Limpar medições', 'Apaga o histórico de RTT salvo neste navegador.',
        actBtn('Limpar', function () {
          S.latencyByServer = Object.create(null);
          try { localStorage.removeItem(LS_RTT_HISTORY); } catch (e) { }
          pushLog('region', 'Histórico RTT local apagado');
          renderBody();
          toast('Medições apagadas');
        }, 'ghost')));
      root.appendChild(g3.root);

      const lab = group('Compatibilidade de dispositivo', 'Console congelado: o navegador não pode comprovar identidade Xbox. Mobile e Desktop são opções experimentais; Automático preserva a identidade nativa.');
      lab.add(infoRow('Identidade observada', function () { const e=nxProtocolEvidence(); return e.observed.javascriptIdentity.platform+' · '+(e.configured.jsUserAgentChanged?'UA JS alterado':'UA JS nativo'); }));
      lab.add(infoRow('Client Hints', function () { const h=nxProtocolEvidence().observed.javascriptIdentity.clientHints; return h ? (h.platform || 'sem plataforma')+' · '+(h.mobile?'mobile':'desktop') : 'Não disponível via JavaScript'; }));
      lab.add(infoRow('TAK · testTouchLayout', function () {
        const tak = nxTouchAdaptationHookSnapshot(window);
        if (tak.state === 'function-visible') return 'Função visível · não invocada';
        if (tak.state === 'not-visible-in-userscript-context') return 'Não visível no contexto do userscript';
        if (tak.state === 'accessor-not-inspected') return 'Acessor detectado · não executado';
        if (tak.state === 'property-not-function') return 'Propriedade presente · não é função';
        return tak.state;
      }, 'Sondagem passiva. Não executa o hook nem altera layout, sessão ou controles; ausência aqui não prova ausência no contexto da página.'));
      lab.add(infoRow('Modelo de hardware Xbox', function () { return 'Não verificável por userscript'; }));
      lab.add(setRow('Copiar diagnóstico de protocolo', 'Relatório estruturado de identidade, autenticação e sessão. Revise os dados antes de compartilhar.',
        actBtn('Copiar', function(){copyText(JSON.stringify(nxProtocolEvidence(),null,2),'[NX protocol]','Diagnóstico de protocolo copiado');},'ghost')));
      lab.add(infoRow('Resultado do teste', function () { return nxCompatibilityVerdict().label; }));
      lab.add(infoRow('Detalhes do teste', function () { return nxCompatibilityVerdict().detail; }));
      lab.add(infoRow('Compatibilidade de console', function () { return nxCompatibilityVerdict().consoleCompatibility; }));
      lab.add(setRow('Verificar conexão agora', 'Avalia os eventos de sessão e o vídeo disponíveis. Não envia requisições extras nem altera autenticação.',
        actBtn('Verificar', function () {
          const v = nxCompatibilityVerdict();
          nxConsoleLabEvent('compatibility-check', v.state + ': ' + v.detail);
          toast(v.label);
          renderBody();
        }, 'primary')));
      lab.add(setRow('Telemetria sobre o jogo', 'Exibe FPS, RTT, perda, servidor e etapas de carregamento fora do painel. Tempo exibido é decorrido, não estimativa.',
        chips([{k:'on',label:'Ativar'},{k:'off',label:'Desativar'}], nxTelemetryEnabled?'on':'off', function(k){nxTelemetryToggle(k==='on');renderBody();}),true));
      lab.add(infoRow('Atalho do controle', function(){return nxShellEnabled?'View + Menu (segurar 0,7 s)':'Disponível no perfil Xbox';}));
      lab.add(infoRow('Entrada preferencial', function () { return nxPlatformProfile.input; }));
      lab.add(infoRow('Oferta xCloud observada', function () { const e = nxOfferingTrace[nxOfferingTrace.length-1]; return e ? e.offering + ' · HTTP ' + e.status : 'Aguardando autenticação'; }));
      lab.add(infoRow('Ofertas observadas', function () { return nxOfferingTrace.length ? Array.from(new Set(nxOfferingTrace.map(function(e){return e.offering;}))).join(', ') : 'Nenhuma'; }));
       lab.add(infoRow('Xbox Shell', function () { return nxShellEnabled ? 'Ativo · ' + nxShellStats.moves + ' movimentos · ' + nxShellStats.errors + ' erros' : 'Desativado'; }));
       if (nxConsoleLabProfile === 'xbox') lab.add(setRow('Interface Xbox Shell', 'Desative para recuperar imediatamente a interface original do painel. A alteração não modifica o streaming.', chips([{k:'on',label:'Ativar'},{k:'off',label:'Desativar'}],nxShellEnabled ? 'on' : 'off',function(k){try{localStorage.setItem(LS_NX_SHELL,k === 'on' ? '1' : '0');}catch(_){} location.reload();}),true));
       if (nxShellEnabled) lab.add(infoRow('Último erro Xbox Shell', function () { return nxShellStats.lastError || 'Nenhum'; }));
       lab.add(infoRow('SO da sessão solicitado', function () { return nxProfileSessionState.lastRequestedOs || 'Original / não observado'; }));
       lab.add(infoRow('Perfil desta sessão', function () { return nxConsoleLabState.profile + ' · ' + nxConsoleProfileValidation().state; }));
      lab.add(infoRow('Identidade contém Xbox;', function () { return navigator.userAgent.includes('Xbox;') ? 'Sim' : 'Não'; }));
      lab.add(infoRow('Erro de identidade', function () { return nxConsoleLabState.error || 'Nenhum'; }));
      lab.add(infoRow('Aviso de incompatibilidade', function () { return nxConsoleLabWarning() ? 'Detectado' : 'Não detectado'; }));
      lab.add(infoRow('WebRTC / H.264 MSE', function () { const c = nxConsoleLabCapabilities(); return (c.webRTC ? 'Sim' : 'Não') + ' / ' + (c.mediaSourceH264 === null ? 'Indefinido' : c.mediaSourceH264 ? 'Sim' : 'Não'); }));
      lab.add(infoRow('Tela cheia', function () { return document.fullscreenElement || document.webkitFullscreenElement ? 'Ativa' : 'Desativada'; }));
      lab.add(setRow('Tela cheia e horizontal', 'O navegador exige um toque ou clique para entrar em tela cheia; a orientação horizontal é solicitada quando suportada.',
        actBtn('Entrar / Sair', nxConsoleLabFullScreen, 'primary')));
      lab.add(setRow('Identidade experimental (avançado)', 'Não é o perfil do aparelho: altera a identidade JS/experiência solicitada ao serviço. Automático preserva o navegador nativo. Pode causar incompatibilidades.',
        chips([{k:'off',label:'Automático'},{k:'android',label:'Mobile'},{k:'windows',label:'Desktop'}],
          nxConsoleLabState.profile, function (k) { nxConsoleLabSetProfile(k); }), true));
      lab.add(setRow('Fortnite: experiência de console (experimental)',
        'Inspirado no Better xCloud: desativa a sinalização de toque na configuração da sessão do Fortnite. Não muda User-Agent, não emula Xbox e pode não alterar a experiência no cliente novo. Requer reiniciar a sessão.',
        chips([{k:'off',label:'Desligado'},{k:'on',label:'Ativar'}],
          nxFortniteConsoleEnabled ? 'on' : 'off', function (k) {
            try { localStorage.setItem(LS_FORTNITE_CONSOLE, k === 'on' ? '1' : '0'); } catch (_) {}
            location.reload();
          }), true));
      lab.add(infoRow('Fortnite: aplicação', function () { return nxFortniteConsoleState.patched ? 'Configuração de toque modificada' : (nxFortniteConsoleEnabled ? 'Aguardando configuração da sessão' : 'Desligado'); }));
      lab.add(setRow('Client Hints (avançado)',
        'Ocultar navigator.userAgentData apenas no JavaScript, conforme Xperience XCloud. Não altera headers e pode prejudicar compatibilidade.',
        chips([{k:'off',label:'Normal'},{k:'on',label:'Ocultar JS'}],
          nxClientHintsMode ? 'on' : 'off', function (k) {
            try { localStorage.setItem('nx.consoleLab.hideClientHints.v1', k === 'on' ? '1' : '0'); } catch (_) {}
            location.reload();
          }), true));
      lab.add(setRow('Registrar observação', 'Anote o jogo, se apareceu no catálogo, se iniciou e eventuais mensagens de erro.',
        actBtn('Anotar', function () {
          let old = ''; try { old = localStorage.getItem(LS_CONSOLE_NOTES) || ''; } catch (_) {}
          const value = window.prompt('Resultado do teste (sem dados pessoais ou tokens):', old);
          if (value === null) return;
          try { localStorage.setItem(LS_CONSOLE_NOTES, value.slice(0, 500)); } catch (_) {}
          toast('Observação salva');
        }, 'ghost')));
      lab.add(setRow('Diagnóstico completo', 'Copia todos os registros em um JSON, ocultando identificadores sensíveis.',
        actBtn('Copiar tudo', copyUnifiedReport, 'primary')));
      root.appendChild(lab.root);

      const g4 = group('Sistema');
      g4.add(infoRow('Remote Play', function () { return S.remotePlayStatus; }));
      g4.add(infoRow('Recuperações do painel', function () { return S.nxRecoveries; }));
      g4.add(infoRow('Histórico de QoS', function () { return S.qosHistory.length + ' amostras'; }));
      g4.add(infoRow('Último erro', function () { return S.lastErr || 'Nenhum'; }));
      root.appendChild(g4.root);

      const g5 = group('Ferramentas');
      const tools = mk('div', 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px 0');
      tools.appendChild(actBtn('Copiar tudo', copyUnifiedReport, 'primary'));
      tools.appendChild(actBtn('Limpar cache', hardReload, 'danger'));
      g5.card.appendChild(tools);
      root.appendChild(g5.root);

      root.appendChild(mk('div', 'text-align:center;color:' + C.dim + ';font-size:10.5px;margin:14px 0 2px', 'NimboXcloud v' + VER + ' · por KReight'));
    }
  };

  // NX categorias v2: cada função pertence ao contexto onde será utilizada.
  // Preserva os construtores originais e suas ações, mas distribui seus grupos.
  const nxLegacySystemBuilder = TAB_BUILDERS.advanced;
  const nxLegacyRegionBuilder = TAB_BUILDERS.region;
  function nxLegacySystemGroups() {
    const temp = document.createElement('div');
    nxLegacySystemBuilder(temp);
    return Array.from(temp.children);
  }
  // Grupos originais: 0 desempenho, 1 link, 2 servidores, 3 plataforma,
  // 4 sistema, 5 ferramentas, 6 créditos.
  TAB_BUILDERS.advanced = function(root) {
    const groups=nxLegacySystemGroups();
    [4,5,6].forEach(function(i){if(groups[i])root.appendChild(groups[i]);});
  };
  TAB_BUILDERS.compatibility = function(root) {
    const groups=nxLegacySystemGroups();
    if(groups[3])root.appendChild(groups[3]);
  };
  TAB_BUILDERS.region = function(root) {
    nxLegacyRegionBuilder(root);
    const groups=nxLegacySystemGroups();
    if(groups[2])root.appendChild(groups[2]);
  };
  const nxOriginalStreamBuilder = TAB_BUILDERS.stream;
  TAB_BUILDERS.stream = function(root) {
    nxOriginalStreamBuilder(root);
    const groups=nxLegacySystemGroups();
    [0,1].forEach(function(i){if(groups[i])root.appendChild(groups[i]);});
  };
  TABS.push({id:'compatibility',label:'Compatibilidade',desc:'Identidade, plataforma e testes de console'});

  // Páginas temáticas reutilizam os controles originais sem duplicar suas rotinas.
  const buildLegacyMedia = TAB_BUILDERS.media;
  const buildLegacyControls = TAB_BUILDERS.controls;
  TAB_BUILDERS.audio = function (root) {
    const temp = document.createElement('div'); buildLegacyMedia(temp);
    if (temp.firstElementChild) root.appendChild(temp.firstElementChild);
  };
  TAB_BUILDERS.voice = function (root) {
    const temp = document.createElement('div'); buildLegacyControls(temp);
    if (temp.children[2]) root.appendChild(temp.children[2]);
  };
  TAB_BUILDERS.video = function(root) {
    const temp=document.createElement('div');buildLegacyMedia(temp);
    Array.from(temp.children).slice(1).forEach(function(node){root.appendChild(node);});
  };
  TABS.push({id:'video',label:'Vídeo',desc:'Filtros, renderização e ajustes locais'});
  TAB_BUILDERS.controls = function (root) {
    const temp = document.createElement('div'); buildLegacyControls(temp);
    Array.from(temp.children).forEach(function (node) { root.appendChild(node); });
  };

  function setTab(id) {
    if (!TAB_BUILDERS[id]) id = 'overview';
    tabId = id;
    renderBody(true);
  }

  function renderTabs() {
    if (!el.navTitle) return;
    const current = TABS.find(function (t) { return t.id === tabId; }) || TABS[0];
    el.navTitle.textContent = current.label;
    if (el.navBack) el.navBack.style.visibility = tabId === 'overview' ? 'hidden' : 'visible';
    if(el.nxRailButtons)el.nxRailButtons.forEach(function(item){const active=item.id===tabId;
      item.button.style.color=active?C.text:C.dim;
      item.button.style.background=active?'rgba(255,255,255,.13)':'transparent';
      item.button.style.boxShadow=active?'inset 3px 0 '+C.accent:'none';});
  }

  // Ações destrutivas/de restauração ficam após os ajustes da página.
  function nxMoveRecoveryActionsToEnd(root) {
    if (!root || tabId==='overview') return;
    const rows=[];
    root.querySelectorAll('div').forEach(function(node){
      if (!node._desc || !node.parentElement) return;
      const label=node.firstElementChild && node.firstElementChild.firstElementChild;
      const name=label ? (label.textContent||'').trim() : '';
      if (/^(restaurar|redefinir|resetar|limpar|excluir|apagar|remover)\\b/i.test(name)) rows.push(node);
    });
    if (!rows.length) return;
    const section=group('Restaurar e limpar','Ações para desfazer ajustes ou limpar dados. Use somente quando necessário.');
    rows.forEach(function(node){node.remove();section.add(node);});
    root.appendChild(section.root);
  }

  function renderBody(resetScroll) {
    if (!el.body) return;
    const keep = el.body.scrollTop;
    liveFns = [];
    el.body.textContent = '';
    const title=TABS.find(function(t){return t.id===tabId;});
    el.body.appendChild(mk('div','font-size:16px;font-weight:750;margin:0 0 14px',title?title.label:'Início'));
    try { TAB_BUILDERS[tabId](el.body); nxMoveRecoveryActionsToEnd(el.body); }
    catch (err) {
      S.lastErr = 'Painel: ' + String(err && err.message || err);
      el.body.appendChild(mk('div', 'color:' + C.bad + ';font-size:12px;padding:8px', 'Erro ao montar esta aba: ' + S.lastErr));
    }
    renderTabs();
    runLive();
    el.body.scrollTop = resetScroll ? 0 : keep;
  }

  function fitCard() {
    if (!wrap || !cardEl) return;
    const wr = wrap.getBoundingClientRect();
    const used = pillEl && pillEl.offsetHeight ? pillEl.offsetHeight + 6 : 0;
    cardEl.style.maxHeight = Math.max(260, Math.min(640, innerHeight - (wr.top + used) - 14)) + 'px';
  }

  function buildUI() {
    if (wrap && wrap.isConnected) return wrap;
    if (wrap && !wrap.isConnected) {
      const target = mountTarget();
      if (target) { target.appendChild(wrap); return wrap; }
    }
    const host = mountTarget() || document.documentElement;
    if (!host) return null;

    wrap = mk('div', [
      'position:fixed', 'right:12px', 'top:12px',
      'z-index:' + ZBASE, 'pointer-events:none',
      'width:360px', 'max-width:calc(100vw - 16px)',
      'display:flex', 'flex-direction:column', 'align-items:flex-end',
      'font:12px/1.5 ' + UI_FONT, 'color:' + C.text, 'text-align:left'
    ].join(';'));
    wrap.id = '__xcu_panel__';
    if (nxShellEnabled) wrap.classList.add('nx-console-shell');

    // Pílula flutuante (usada só durante a partida): ícone + pontinho + perda de pacotes
    pillEl = mk('div', [
      'pointer-events:auto', 'display:inline-flex', 'align-items:center', 'gap:6px',
      'padding:3px 10px 3px 7px', 'height:28px', 'box-sizing:border-box', 'border-radius:14px',
      'background:rgba(0,0,0,.38)', 'border:1px solid rgba(255,255,255,.14)', 'cursor:pointer',
      '-webkit-backdrop-filter:blur(6px)', 'backdrop-filter:blur(6px)',
      'user-select:none', 'white-space:nowrap'
    ].join(';'));
    dotEl = mk('span', 'width:7px;height:7px;border-radius:50%;background:#8b949e;flex:0 0 auto');
    pillTxt = mk('span', 'color:#e6edf3;font-weight:600;font-size:11px', '');
    pillEl.title = 'NimboXcloud — toque para abrir o painel';
    const brandIcon = mk('img', 'width:20px;height:20px;display:block;flex:0 0 auto;object-fit:contain');
    brandIcon.src = BRAND_ICON;
    brandIcon.alt = 'NimboXcloud';
    brandIcon.draggable = false;
    pillEl.appendChild(brandIcon);
    pillEl.appendChild(dotEl);
    pillEl.appendChild(pillTxt);
    wrap.appendChild(pillEl);
    pillEl.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!openUI, true); });

    // Cartão do painel
    cardEl = mk('div', [
      'pointer-events:auto', 'display:none', 'flex-direction:column', 'position:relative', 'margin-top:6px',
      'width:100%', 'box-sizing:border-box', 'overflow:hidden',
      'background:' + C.bg, 'border:1px solid rgba(255,255,255,.10)', 'border-radius:16px',
      'box-shadow:0 20px 56px rgba(0,0,0,.65)',
      '-webkit-backdrop-filter:blur(14px)', 'backdrop-filter:blur(14px)'
    ].join(';'));
    cardEl.style.maxWidth='min(360px,calc(100vw - 16px))';
    nxPanelApply();
    cardEl.setAttribute('role', 'dialog');
    cardEl.setAttribute('aria-label', 'Painel NimboXcloud');
    cardEl.addEventListener('pointerdown', stopEv);

    // Cabeçalho
    const head = mk('div', 'display:flex;align-items:center;gap:10px;padding:12px 12px 11px 14px;border-bottom:1px solid ' + C.line + ';flex:0 0 auto');
    const logo = mk('img', 'width:28px;height:28px;object-fit:contain;flex:0 0 auto');
    logo.src = BRAND_ICON; logo.alt = ''; logo.draggable = false;
    head.appendChild(logo);
    const ttl = mk('div', 'min-width:0;flex:1');
    ttl.appendChild(mk('div', 'font-size:14px;font-weight:700;letter-spacing:.01em', 'NimboXcloud'));
    ttl.appendChild(mk('div', 'font-size:10.5px;color:' + C.dim, 'Xbox Cloud · v' + VER));
    head.appendChild(ttl);
    el.hdrChip = mk('div', 'display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;' +
      'background:' + C.panel + ';border:1px solid ' + C.line + ';font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums');
    el.hdrDot = mk('span', 'width:7px;height:7px;border-radius:50%;background:' + C.dim);
    el.hdrTxt = mk('span', '', 'Offline');
    el.hdrChip.appendChild(el.hdrDot); el.hdrChip.appendChild(el.hdrTxt);
    head.appendChild(el.hdrChip);
    const closeBtn = mk('button', 'all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
      'width:30px;height:30px;border-radius:8px;color:' + C.dim + ';-webkit-tap-highlight-color:transparent');
    closeBtn.appendChild(ico(ICONS.close, 18));
    closeBtn.setAttribute('aria-label', 'Fechar painel');
    closeBtn.title = 'Fechar';
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(false, true); });
    head.appendChild(closeBtn);
    head.style.display='none';
    cardEl.appendChild(head);

    // Corpo (rolável)
    el.body = mk('div', 'flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 14px 16px;' +
      'overscroll-behavior:contain;-webkit-overflow-scrolling:touch');
    cardEl.appendChild(el.body);

    // Aviso temporário
    el.toast = mk('div', 'position:absolute;left:50%;bottom:66px;transform:translate(-50%,6px);opacity:0;pointer-events:none;' +
      'background:#e8edf3;color:#0d1117;font-size:12px;font-weight:600;padding:7px 13px;border-radius:999px;white-space:nowrap;' +
      'max-width:90%;overflow:hidden;text-overflow:ellipsis;transition:opacity .18s,transform .18s;box-shadow:0 6px 18px rgba(0,0,0,.5)');
    cardEl.appendChild(el.toast);

    // Navegação contextual: título e retorno ao início, sem seis abas comprimidas.
    const navBar = mk('div','display:flex;align-items:center;gap:10px;padding:9px 13px;border-bottom:1px solid '+C.line+';background:rgba(255,255,255,.025);flex:0 0 auto');
    el.navBack = mk('button','all:unset;cursor:pointer;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.055);color:'+C.text);
    el.navBack.setAttribute('aria-label','Voltar ao início'); el.navBack.appendChild(ico('M15 18l-6-6 6-6',18));
    el.navBack.addEventListener('click',function (e) { e.stopPropagation(); setTab('overview'); });
    el.navTitle = mk('span','font-size:13px;font-weight:700;flex:1','Início');
    navBar.appendChild(el.navBack); navBar.appendChild(el.navTitle);
    const home = mk('button','all:unset;cursor:pointer;display:flex;align-items:center;justify-content:center;width:34px;height:34px;color:'+C.dim);
    home.title = 'Central de controle'; home.setAttribute('aria-label','Central de controle'); home.appendChild(ico('M3 10l9-7 9 7 M5 9v12h14V9 M9 21v-8h6v8',18));
    home.addEventListener('click',function (e) { e.stopPropagation(); setTab('overview'); }); navBar.appendChild(home);
    navBar.style.display='none';
    cardEl.insertBefore(navBar,el.body);
    const rail=mk('div','flex:0 0 48px;display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 4px;background:#101419;border-right:1px solid '+C.line+';overflow-y:auto');
    el.nxRailButtons=[];
    [['overview','Início'],['video','Vídeo'],['stream','Streaming'],['audio','Áudio'],['controls','Controles'],['voice','Voz'],['region','Servidores'],['personalize','Personalizar'],['compatibility','Compatibilidade'],['advanced','Sistema']].forEach(function(item){
      const btn=mk('button','all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 42px;width:40px;border-radius:8px;color:'+C.dim);
      btn.title=item[1];btn.setAttribute('aria-label',item[1]);btn.appendChild(ico(ICONS[item[0]]||ICONS.overview,22));
      btn.addEventListener('click',function(e){e.stopPropagation();setTab(item[0]);});rail.appendChild(btn);
      el.nxRailButtons.push({id:item[0],button:btn});
    });
    const closeRail=mk('button','all:unset;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;margin-top:auto;color:'+C.dim);
    closeRail.title='Fechar';closeRail.setAttribute('aria-label','Fechar painel');closeRail.appendChild(ico(ICONS.close,22));
    closeRail.addEventListener('click',function(e){e.stopPropagation();setOpen(false,true);});rail.appendChild(closeRail);
    const content=mk('div','display:flex;flex-direction:column;flex:1;min-width:0;min-height:0');
    content.appendChild(navBar);content.appendChild(el.body);
    cardEl.appendChild(rail);cardEl.appendChild(content);cardEl.style.flexDirection='row';

    wrap.appendChild(cardEl);
    host.appendChild(wrap);
    return wrap;
  }

  // HUD independente do painel, sem interferir com o fluxo do jogo.
  const NX_TELEMETRY_KEY = 'nx.telemetry.overlay.v1';
  let nxTelemetryEnabled = (function(){try{return localStorage.getItem(NX_TELEMETRY_KEY)==='1';}catch(_){return false;}})();
  let nxTelemetryEl = null, nxLoadingStarted = 0, nxLoadingLastStage = '';
  function nxTelemetryEnsure() {
    if (nxTelemetryEl && nxTelemetryEl.isConnected) return nxTelemetryEl;
    const host = mountTarget();
    if (!host) return null;
    nxTelemetryEl = document.createElement('div');
    nxTelemetryEl.id = 'nx-telemetry-overlay';
    nxTelemetryEl.setAttribute('aria-label','Telemetria NimboXcloud');
    nxTelemetryEl.style.cssText = 'position:fixed;left:12px;top:12px;z-index:2147483000;pointer-events:none;background:rgba(9,14,23,.83);color:#eaf4ff;border:1px solid rgba(130,177,230,.3);border-radius:10px;padding:9px 12px;font:12px/1.6 system-ui,sans-serif;white-space:pre-line;max-width:min(390px,calc(100vw - 24px));box-shadow:0 4px 22px #0007';
    host.appendChild(nxTelemetryEl);
    nxTelemetryEl.setAttribute('title','Arraste para mover o NX Stream Monitor');
    nxTelemetryEl.addEventListener('pointerdown',nxMonitorDrag);
    return nxTelemetryEl;
  }
  // NX Stream Monitor: métricas WebRTC existentes, sem sondagens paralelas.
  const NX_MONITOR_SETTINGS='nx.monitor.settings.v1';
  const nxMonitorDefaults={layout:'auto',opacity:45,color:'white',scale:100,position:'top-left',x:null,y:null,fields:['server','fps','rtt','bitrate','loss']};
  function nxMonitorLoad(){try{const p=JSON.parse(localStorage.getItem(NX_MONITOR_SETTINGS)||'{}');return Object.assign({},nxMonitorDefaults,p,{fields:Array.isArray(p.fields)?p.fields:nxMonitorDefaults.fields});}catch(_){return Object.assign({},nxMonitorDefaults);}}
  let nxMonitor=nxMonitorLoad();
  function nxMonitorSave(){try{localStorage.setItem(NX_MONITOR_SETTINGS,JSON.stringify(nxMonitor));}catch(_){}nxTelemetryTick();}
  function nxMonitorPlace(){
    if(!nxTelemetryEl)return;
    const n=nxTelemetryEl,p=nxMonitor;
    const x=Number.isFinite(p.x)?p.x:(p.position.endsWith('right')?innerWidth-n.offsetWidth-12:12);
    const y=Number.isFinite(p.y)?p.y:(p.position.startsWith('bottom')?innerHeight-n.offsetHeight-12:12);
    n.style.left=Math.max(0,Math.min(innerWidth-n.offsetWidth,x))+'px';
    n.style.top=Math.max(0,Math.min(innerHeight-n.offsetHeight,y))+'px';
    n.style.right='auto';n.style.bottom='auto';
  }
  function nxMonitorDrag(e){
    if(e.button!=null&&e.button!==0)return;
    const n=nxTelemetryEl,r=n.getBoundingClientRect(),dx=e.clientX-r.left,dy=e.clientY-r.top;
    try{n.setPointerCapture(e.pointerId);}catch(_){}
    const move=function(v){if(v.pointerId!==e.pointerId)return;nxMonitor.x=v.clientX-dx;nxMonitor.y=v.clientY-dy;nxMonitorPlace();};
    const stop=function(v){if(v.pointerId!==e.pointerId)return;n.removeEventListener('pointermove',move);n.removeEventListener('pointerup',stop);n.removeEventListener('pointercancel',stop);nxMonitorSave();};
    n.addEventListener('pointermove',move);n.addEventListener('pointerup',stop);n.addEventListener('pointercancel',stop);e.stopPropagation();
  }
  function nxTelemetryTick(){
    if(!nxTelemetryEnabled||document.hidden||!streaming()){if(nxTelemetryEl)nxTelemetryEl.style.display='none';return;}
    const n=nxTelemetryEnsure();if(!n)return;
    const host=mountTarget();if(host&&n.parentNode!==host)host.appendChild(n);
    const q=S.qos||{},p=nxMonitor;
    const flags={JAPANEAST:'🇯🇵',KOREACENTRAL:'🇰🇷',EASTUS:'🇺🇸',WESTEUROPE:'🇪🇺',BRAZILSOUTH:'🇧🇷'};
    const srv=String(S.serverActual||'').toUpperCase();
    const vals={server:(flags[srv]||'◈')+' '+(srv||'Servidor não identificado'),fps:'FPS '+fmtN(q.decodedFps||q.fps),rtt:'RTT '+fmtN(q.rtt,' ms'),bitrate:'BR '+(Number.isFinite(q.kbps)?fmtN(q.kbps/1000,' Mbps',1):'—'),loss:'Perda '+fmtN(curLoss(),'% ',1),resolution:'Res '+(q.h?q.h+'p':'—'),jitter:'Jitter '+fmtN(q.jitter,' ms')};
    const keys=p.layout==='compact'?['server','fps','rtt']:p.fields;
    const layout=p.layout==='auto'?(innerWidth<700?'vertical':'horizontal'):p.layout;
    n.textContent=keys.filter(function(k){return Object.prototype.hasOwnProperty.call(vals,k);}).map(function(k){return vals[k];}).join(layout==='vertical'?'\\n':'  ·  ');
    n.style.cssText='position:fixed;z-index:2147483000;display:block;pointer-events:auto;touch-action:none;user-select:none;cursor:move;box-sizing:border-box;border-radius:7px;padding:5px 8px;max-width:calc(100vw - 24px);white-space:pre-line;font-family:ui-monospace,Consolas,monospace;font-weight:600;line-height:1.5';
    n.style.fontSize=(11*Math.max(60,Math.min(140,Number(p.scale)||100))/100)+'px';
    n.style.background='rgba(0,0,0,'+(Math.max(0,Math.min(100,Number(p.opacity)||0))/100)+')';
    n.style.color=({white:'#fff',black:'#000',blue:'#65b8ff',green:'#80e5a4'})[p.color]||'#fff';
    nxMonitorPlace();
  }
  setInterval(nxTelemetryTick, 1000);
  function nxTelemetryToggle(enabled) {
    nxTelemetryEnabled = !!enabled;
    try { localStorage.setItem(NX_TELEMETRY_KEY,enabled?'1':'0'); } catch (_) {}
    nxTelemetryTick();
  }
  // Configurações no início: o monitor funciona mesmo com o painel recolhido.
  const nxOverviewOriginal=TAB_BUILDERS.overview;
  TAB_BUILDERS.overview=function(root){
    const section=mk('div','border:1px solid '+C.line+';border-radius:12px;padding:12px;margin-bottom:12px');
    section.appendChild(mk('div','font-weight:700;font-size:14px;margin-bottom:5px','NX Stream Monitor'));
    section.appendChild(mk('div','font-size:11px;color:'+C.dim+';margin-bottom:10px','Informações mínimas durante a partida; arraste o monitor para reposicionar.'));
    section.appendChild(actBtn(nxTelemetryEnabled?'Ocultar monitor':'Ativar monitor',function(){nxTelemetryToggle(!nxTelemetryEnabled);renderBody();},'ghost'));
    function option(label,key,choices){
      const row=mk('label','display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:9px;font-size:12px');
      row.appendChild(mk('span','',label));
      const sel=mk('select','background:#18212b;color:white;border:1px solid '+C.line+';border-radius:7px;padding:6px;max-width:60%');
      choices.forEach(function(o){const opt=document.createElement('option');opt.value=o[0];opt.textContent=o[1];sel.appendChild(opt);});
      sel.value=String(nxMonitor[key]);sel.addEventListener('change',function(){nxMonitor[key]=['opacity','scale'].includes(key)?Number(sel.value):sel.value;if(key==='position'){nxMonitor.x=null;nxMonitor.y=null;}nxMonitorSave();});
      row.appendChild(sel);section.appendChild(row);
    }
    option('Layout','layout',[['auto','Automático'],['horizontal','Horizontal'],['vertical','Vertical'],['compact','Compacto']]);
    option('Posição','position',[['top-left','Superior esquerdo'],['top-right','Superior direito'],['bottom-left','Inferior esquerdo'],['bottom-right','Inferior direito']]);
    option('Fundo','opacity',[['0','Transparente'],['25','25%'],['45','45%'],['65','65%'],['85','85%'],['100','Preto']]);
    option('Texto','color',[['white','Branco'],['black','Preto'],['blue','Azul'],['green','Verde']]);
    option('Escala','scale',[['60','60%'],['80','80%'],['100','100%'],['120','120%'],['140','140%']]);
    const fields=mk('div','display:flex;flex-wrap:wrap;gap:8px;margin-top:10px');
    [['server','Servidor'],['fps','FPS'],['rtt','RTT'],['bitrate','Bitrate'],['loss','Perda'],['resolution','Resolução'],['jitter','Jitter']].forEach(function(item){
      const label=mk('label','display:inline-flex;align-items:center;gap:4px;font-size:11px');
      const check=document.createElement('input');check.type='checkbox';check.checked=nxMonitor.fields.includes(item[0]);
      check.addEventListener('change',function(){nxMonitor.fields=check.checked?Array.from(new Set(nxMonitor.fields.concat(item[0]))):nxMonitor.fields.filter(function(k){return k!==item[0];});nxMonitorSave();});
      label.appendChild(check);label.appendChild(mk('span','',item[1]));fields.appendChild(label);
    });
    section.appendChild(fields);root.appendChild(section);nxOverviewOriginal(root);
  };
    // NX UI v2: início minimalista com quatro grupos; páginas legadas preservadas.
  const nxMonitorSettingsPage=TAB_BUILDERS.overview;
  TABS.push({id:'personalize',label:'Personalização',desc:'Monitor, aparência e posição'});
  TABS.push({id:'dashboard',label:'Dashboard',desc:'Gráficos e indicadores detalhados'});
  // Aparência independente do NX Stream Monitor; persistência local.
  const NX_PANEL_APPEARANCE='nx.panel.appearance.v1';
  const nxPanelDefaults={opacity:90,tone:'dark',text:'default',icons:'default'};
  const nxPanelColors={default:null,white:'#f5f7fb',gray:'#b5bfcb',green:'#80e5a4',blue:'#75c3ff',amber:'#ffd184'};
  function nxPanelLoad(){
    try {const o=JSON.parse(localStorage.getItem(NX_PANEL_APPEARANCE)||'{}');
      return {opacity:Number.isFinite(Number(o.opacity))?Math.max(15,Math.min(100,Number(o.opacity))):90,
        tone:['dark','black','slate'].includes(o.tone)?o.tone:'dark',
        text:Object.prototype.hasOwnProperty.call(nxPanelColors,o.text)?o.text:'default',
        icons:Object.prototype.hasOwnProperty.call(nxPanelColors,o.icons)?o.icons:'default'};
    }catch(_){return Object.assign({},nxPanelDefaults);}
  }
  let nxPanelAppearance=nxPanelLoad();
  function nxPanelApply(){
    if(!cardEl)return;
    const p=nxPanelAppearance;
    const rgb=({dark:'12,16,22',black:'0,0,0',slate:'32,42,55'})[p.tone]||'12,16,22';
    cardEl.style.background='rgba('+rgb+','+(p.opacity/100)+')';
    cardEl.style.setProperty('--nx-panel-text',nxPanelColors[p.text]||C.text);
    cardEl.style.setProperty('--nx-panel-icon',nxPanelColors[p.icons]||C.dim);
    cardEl.dataset.nxPanelText=p.text==='default'?'default':'custom';
    cardEl.dataset.nxPanelIcons=p.icons==='default'?'default':'custom';
    if(!document.getElementById('nx-panel-appearance-style')){
      const st=document.createElement('style');st.id='nx-panel-appearance-style';
      st.textContent='#__xcu_panel__ [data-nx-panel-text="custom"] :is(div,span,p,label,button){color:var(--nx-panel-text)!important}'+
        '#__xcu_panel__ [data-nx-panel-icons="custom"] svg{color:var(--nx-panel-icon)!important;stroke:currentColor!important}';
      (document.head||document.documentElement).appendChild(st);
    }
  }
  function nxPanelSettingsPage(root){
    const g=group('Aparência do painel NX','Essas opções modificam somente o painel de configurações. O NX Stream Monitor mantém seus próprios ajustes.');
    const slider=document.createElement('input');slider.type='range';slider.min='15';slider.max='100';slider.step='5';
    slider.value=String(nxPanelAppearance.opacity);slider.style.cssText='width:100%;max-width:280px;accent-color:'+C.accent;
    const percent=mk('span','font-size:12px;color:'+C.dim,nxPanelAppearance.opacity+'%');
    const controls=mk('div','display:flex;align-items:center;gap:12px;max-width:100%');controls.appendChild(slider);controls.appendChild(percent);
    slider.addEventListener('input',function(){nxPanelAppearance.opacity=Number(slider.value);percent.textContent=slider.value+'%';nxPanelApply();});
    slider.addEventListener('change',function(){nxPanelSave();});
    g.add(setRow('Transparência do fundo','15% deixa o jogo mais visível; 100% cria um fundo opaco.',controls));
    function choice(title,key,opts){
      g.add(setRow(title,'',chips(opts,nxPanelAppearance[key],function(value){nxPanelAppearance[key]=value;nxPanelSave();renderBody();}),true));
    }
    choice('Cor do fundo','tone',[{k:'dark',label:'Escuro'},{k:'black',label:'Preto'},{k:'slate',label:'Cinza azulado'}]);
    const colors=[{k:'default',label:'Original'},{k:'white',label:'Branco'},{k:'gray',label:'Cinza'},{k:'green',label:'Verde'},{k:'blue',label:'Azul'},{k:'amber',label:'Âmbar'}];
    choice('Cor dos textos','text',colors);
    choice('Cor dos ícones','icons',colors);
    root.appendChild(g.root);
    const reset=group('Restaurar aparência');
    reset.add(setRow('Voltar à aparência original','Não altera as configurações de vídeo nem do monitor.',actBtn('Restaurar painel',function(){nxPanelAppearance=Object.assign({},nxPanelDefaults);nxPanelSave();renderBody();},'ghost')));
    root.appendChild(reset.root);
  }
  function nxPanelSave(){try{localStorage.setItem(NX_PANEL_APPEARANCE,JSON.stringify(nxPanelAppearance));}catch(_){}nxPanelApply();}
  TAB_BUILDERS.personalize=function(root){
    nxPanelSettingsPage(root);
    const temp=document.createElement('div');
    nxMonitorSettingsPage(temp);
    if(temp.firstElementChild)root.appendChild(temp.firstElementChild);
    root.appendChild(mk('div','font-size:11px;color:'+C.dim+';line-height:1.5;margin-top:12px','As opções de monitor são independentes do painel. A posição também pode ser alterada arrastando o monitor durante uma transmissão.'));
  };
  TAB_BUILDERS.dashboard=function(root){
    nxOverviewOriginal(root);
  };
  TAB_BUILDERS.overview=function(root){
    root.appendChild(mk('div','font-size:18px;font-weight:750;letter-spacing:-.02em;margin-bottom:4px','NX · Central'));
    root.appendChild(mk('div','font-size:11px;color:'+C.dim+';line-height:1.5;margin-bottom:12px','Ajustes organizados. O painel pode ser fechado a qualquer momento.'));
    const status=mk('div','padding:10px 12px;border-radius:10px;background:'+C.panel+';border:1px solid '+C.line+';margin-bottom:10px');
    const state=mk('div','font-size:12px;font-weight:700');
    const metrics=mk('div','font-size:11px;color:'+C.dim+';margin-top:4px;line-height:1.5');
    status.appendChild(state);status.appendChild(metrics);root.appendChild(status);
    liveFns.push(function(){
      state.textContent=linkState().text;
      const q=S.qos||{};
      metrics.textContent='FPS '+fmtN(q.decodedFps||q.fps)+'  ·  RTT '+fmtN(q.rtt,' ms')+'  ·  '+(S.serverActual||'Servidor automático');
    });
    const groups=[
      {title:'Transmissão',sub:'Vídeo, qualidade, servidores e estatísticas',icon:ICONS.stream,links:[['video','Imagem e filtros'],['stream','Streaming e WebRTC'],['region','Servidores e regiões'],['dashboard','Dashboard e gráficos']]},
      {title:'Controles',sub:'Gamepad, teclado, mouse e HUD',icon:ICONS.controls,links:[['controls','Gamepad e HUD'],['audio','Áudio'],['voice','Voz e acessórios']]},
      {title:'Personalização',sub:'Monitor, transparência e layout',icon:ICONS.overview,links:[['personalize','Configurar NX Stream Monitor']]},
      {title:'Sistema',sub:'Diagnósticos e manutenção',icon:ICONS.advanced,links:[['compatibility','Compatibilidade e identidade'],['advanced','Diagnósticos do sistema']]}
    ];
    groups.forEach(function(g){
      const section=mk('div','margin-bottom:8px;border:1px solid '+C.line+';border-radius:11px;overflow:hidden;background:'+C.panel);
      const button=mk('button','all:unset;box-sizing:border-box;cursor:pointer;width:100%;display:flex;align-items:center;gap:11px;padding:12px;color:'+C.text+';text-align:left');
      button.setAttribute('aria-expanded','false');
      button.appendChild(ico(g.icon,19));
      const titles=mk('span','display:flex;flex-direction:column;gap:3px;min-width:0;flex:1');
      titles.appendChild(mk('span','font-size:13px;font-weight:700',g.title));
      titles.appendChild(mk('span','font-size:10.5px;color:'+C.dim,g.sub));
      button.appendChild(titles);
      button.appendChild(ico('M6 9l6 6 6-6',15));
      const details=mk('div','display:none;padding:0 8px 8px');
      g.links.forEach(function(link){
        const entry=mk('button','all:unset;box-sizing:border-box;display:block;cursor:pointer;width:100%;text-align:left;font-size:12px;color:'+C.text+';padding:11px 12px;border-top:1px solid '+C.line,link[1]);
        entry.addEventListener('click',function(e){e.stopPropagation();setTab(link[0]);});
        details.appendChild(entry);
      });
      button.addEventListener('click',function(e){
        e.stopPropagation();
        const open=details.style.display==='none';
        details.style.display=open?'block':'none';
        button.setAttribute('aria-expanded',String(open));
      });
      section.appendChild(button);section.appendChild(details);root.appendChild(section);
    });
    const monitor=actBtn(nxTelemetryEnabled?'Ocultar monitor de desempenho':'Ativar monitor de desempenho',function(){nxTelemetryToggle(!nxTelemetryEnabled);renderBody();},'ghost');
    monitor.style.width='100%';monitor.style.marginTop='4px';root.appendChild(monitor);
  };
    // Painel como inventario: solta o ponteiro uma unica vez ao abrir.
  // Ao fechar, nao recaptura sem gesto do usuario; F9 continua nativo.
  document.addEventListener('keydown',function(e){
    if(!openUI)return;
    const isShortcut=e.ctrlKey&&e.shiftKey&&(e.code===getPref(LS_NX_SHORTCUT,'KeyH')||e.code==='KeyN');
    if(isShortcut)return;
    if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();setOpen(false,true);return;}
    if(wrap && e.target && wrap.contains(e.target))return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);
  document.addEventListener('keyup',function(e){
    if(!openUI || (wrap&&e.target&&wrap.contains(e.target)))return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);
  // Gerenciamento de foco independente do Pointer Lock: nunca recapturar automaticamente.
  let nxFocusBeforePanel = null;
  function setOpen(v, byUser) {
    const wasOpen = openUI;
    openUI = !!v;
    if (byUser) userTouched = true;
    if (!cardEl) buildUI();
    if (!cardEl) return;
    cardEl.style.display = openUI ? 'flex' : 'none';
    nxSyncTouchMenuBlock(document.documentElement.classList.contains('nx-native-menu-expanded'));
    if (nxShellEnabled && wrap) { wrap.classList.toggle('nx-shell-open', openUI); if (openUI) nxShellNeedsRelease = true; }
    if(openUI && !wasOpen){
      nxFocusBeforePanel = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
      if(document.pointerLockElement){
        try{document.exitPointerLock();}catch(_){}
      }
    }
    if (openUI) {
      syncNXPlacement(); renderBody(); update();
      if(!wasOpen){
        // Teclado e controle podem operar o menu sem enviar comandos ao jogo.
        if(!cardEl.hasAttribute('tabindex'))cardEl.setAttribute('tabindex','-1');
        try{cardEl.focus({preventScroll:true});}catch(_){}
      }
    }else if(wasOpen){
      const previous=nxFocusBeforePanel;
      nxFocusBeforePanel=null;
      // Restaurar foco nao significa restaurar Pointer Lock; o jogador decide quando retomar.
      if(previous && previous.isConnected && typeof previous.focus==='function'){
        try{previous.focus({preventScroll:true});}catch(_){}
      }else if(document.activeElement && wrap && wrap.contains(document.activeElement)){
        try{document.activeElement.blur();}catch(_){}
      }
    }
    if (wrap) wrap.style.display = 'flex';
  }

  const NX_PAD_BIND_KEY='nx.panel.padBinding.v1';
  const NX_KEY_BIND_KEY='nx.panel.keyBinding.v1';
  const nxPadNames=['A / X','B / círculo','X / quadrado','Y / triângulo','L1','R1','L2','R2','View / Share','Menu / Options','L3','R3','Cima','Baixo','Esquerda','Direita'];
  function nxPadBinding(){
    try {const b=JSON.parse(getPref(NX_PAD_BIND_KEY,'null'));
      return Array.isArray(b)&&b.length>=1&&b.length<=4&&b.every(function(v){return Number.isInteger(v)&&v>=0&&v<=15;})&&new Set(b).size===b.length?b:null;
    }catch(_){return null;}
  }
  function nxKeyBinding(){
    try {const b=JSON.parse(getPref(NX_KEY_BIND_KEY,'null'));
      return Array.isArray(b)&&b.length>=1&&b.length<=4&&b.every(function(v){return typeof v==='string'&&/^[a-zA-Z0-9]+$/.test(v);})&&new Set(b).size===b.length?b:null;
    }catch(_){return null;}
  }
  let nxCapturePad=null;
  let nxCaptureKeys=null;
  const nxKeysHeld=new Set();
  let nxKeyboardComboActive=false;
  function nxBindingLabel(b,names){if(!b)return 'Não configurado';return b.map(function(v){return names?names[v]||('Botão '+v):v.replace(/^Key/,'');}).join(' + ');}
  function nxBindControls(root){
    const g=group('Atalhos do painel','Configure de 1 a 4 botões simultâneos. Recomendamos 2 ou 3 para evitar abertura acidental durante o jogo.');
    const padText=mk('div','font-size:12px;margin-bottom:8px;color:'+C.text,nxBindingLabel(nxPadBinding(),nxPadNames));
    g.add(padText);
    g.add(setRow('Atalho do controle','Pressione Gravar, depois a combinação desejada e solte todos os botões. A configuração é salva automaticamente.',
      actBtn('Gravar controle',function(){
        nxCapturePad={best:[],started:Date.now(),label:padText};
        padText.textContent='Pressione de 1 a 4 botões e solte para salvar…';
      },'primary')));
    g.add(setRow('Limpar atalho do controle','Sem combinação automática.',actBtn('Limpar',function(){nxCapturePad=null;localStorage.removeItem(NX_PAD_BIND_KEY);renderBody();},'ghost')));
    const keyText=mk('div','font-size:12px;margin-bottom:8px;color:'+C.text,nxBindingLabel(nxKeyBinding()));
    g.add(keyText);
    g.add(setRow('Atalho do teclado','Clique em Gravar, mantenha as teclas pressionadas e solte para salvar. Máximo de quatro teclas.',
      actBtn('Gravar teclado',function(){nxCaptureKeys={best:[],label:keyText};keyText.textContent='Pressione a combinação e solte para salvar…';},'primary')));
    g.add(setRow('Limpar atalho do teclado','Sem combinação automática.',actBtn('Limpar',function(){nxCaptureKeys=null;localStorage.removeItem(NX_KEY_BIND_KEY);renderBody();},'ghost')));
    g.add(note('Atalhos ficam salvos no armazenamento local do navegador. Sem atalho configurado, abra o NX pelo botão na tela. A navegação por controle ainda pode enviar comandos ao jogo.'));
    g.add(note('Outras preferências do NX, incluindo vídeo, áudio, região e controles, já são salvas localmente quando alteradas. Não é necessário salvar cada opção novamente.'));

    root.appendChild(g.root);
  }
  // Navegação de controle no painel NX. Somente leitura da Gamepad API.
  // Botões padrão: L3=10, R3=11, A/Cross=0, B/Circle=1, D-pad=12..15.
  const nxPadUiState = { combo:false, lastAction:'', lastAt:0 };
  let nxGamepadLastPads=[];
  let nxGamepadLastReadAt=0;
  function nxReadGamepadSnapshot() {
    if(typeof navigator.getGamepads!=='function') throw new Error('Gamepad API indisponível');
    const pads=Array.from(navigator.getGamepads() || []).filter(Boolean);
    nxGamepadLastPads=pads;
    nxGamepadLastReadAt=Date.now();
    return pads;
  }
  function nxGamepadUiTick() {
    if (document.visibilityState === 'hidden' || typeof navigator.getGamepads !== 'function') {
      nxRemoteGamepadSuspend();
      return;
    }
    let pads;
    try { pads=nxReadGamepadSnapshot(); } catch (_) { nxRemoteGamepadSuspend();return; }
    const remoteVideoFocused=nxRemoteVideoHasInputFocus();
    const allowInput=!nxCapturePad && nxRemoteGamepadWindowFocused && (!openUI || remoteVideoFocused);
    if (!pads.length) { nxRemoteGamepadTick(pads,allowInput);nxPadUiState.combo=false;return; }
    const pressed = function(p,i){return !!(p.buttons && p.buttons[i] && p.buttons[i].pressed);};
    if(nxCapturePad){
      const p=pads[0];const active=[];
      for(let i=0;i<Math.min(16,p.buttons.length);i++)if(pressed(p,i))active.push(i);
      if(active.length){
        if(active.length>4){nxCapturePad.label.textContent='Máximo de 4 botões simultâneos. Solte e tente novamente.';nxCapturePad.best=[];}
        else if(active.length>=nxCapturePad.best.length){
          nxCapturePad.best=active.slice();
          nxCapturePad.label.textContent=nxBindingLabel(active,nxPadNames)+' — solte para salvar';
        }
      }else if(nxCapturePad.best.length){
        setPref(NX_PAD_BIND_KEY,JSON.stringify(nxCapturePad.best.slice().sort(function(a,b){return a-b;})));
        nxCapturePad=null;nxPadUiState.combo=false;renderBody();
      }
      nxRemoteGamepadTick(pads,false);
      return;
    }
    const bind=nxPadBinding();
    const combo=!!bind&&pads.some(function(p){return bind.every(function(i){return pressed(p,i);});});
    if (combo && !nxPadUiState.combo) {
      setOpen(!openUI,true);
      nxPadUiState.lastAt=Date.now();
    }
    nxPadUiState.combo=combo;
    nxRemoteGamepadTick(pads,allowInput && !combo);
    if (remoteVideoFocused) return;
    if (!openUI || combo || !cardEl) return;
    const p=pads[0];
    const axisY=p.axes && p.axes.length>1 ? p.axes[1] : 0;
    const axisX=p.axes && p.axes.length>0 ? p.axes[0] : 0;
    let action='';
    if (pressed(p,1)) action='back';
    else if (pressed(p,0)) action='confirm';
    else if (pressed(p,12)||axisY<-.65) action='up';
    else if (pressed(p,13)||axisY>.65) action='down';
    else if (pressed(p,14)||axisX<-.65) action='left';
    else if (pressed(p,15)||axisX>.65) action='right';
    const now=Date.now();
    if (!action) { nxPadUiState.lastAction='';return; }
    const repeated=action===nxPadUiState.lastAction;
    if (repeated && now-nxPadUiState.lastAt<220) return;
    if (!repeated && now-nxPadUiState.lastAt<120) return;
    nxPadUiState.lastAction=action;nxPadUiState.lastAt=now;
    if (action==='back') { if(tabId!=='overview')setTab('overview');else setOpen(false,true);return; }
    const selector='button:not(:disabled),[role="button"],input:not(:disabled),select:not(:disabled),[tabindex="0"]';
    const targets=Array.from(cardEl.querySelectorAll(selector)).filter(function(el){
      const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';
    });
    if (!targets.length) return;
    const focused=targets.indexOf(document.activeElement);
    if (action==='confirm') {
      if (focused>=0) { const el=targets[focused];if(el.tagName==='SELECT')el.focus();else el.click(); }
      else targets[0].focus({preventScroll:true});
      return;
    }
    const step=(action==='up'||action==='left')?-1:1;
    const next=targets[(focused+step+targets.length)%targets.length];
    next.focus({preventScroll:true});next.scrollIntoView({block:'nearest',inline:'nearest'});
  }
  let nxGamepadLoopTimer=null;
  function nxStartGamepadUiLoop() {
    if(nxGamepadLoopTimer!==null) return;
    const fast=nxRemoteGamepadReady() && (!openUI || nxRemoteVideoHasInputFocus()) && !nxCapturePad &&
      nxRemoteGamepadWindowFocused && document.visibilityState!=='hidden';
    nxGamepadLoopTimer=setTimeout(function() {
      nxGamepadLoopTimer=null;
      nxGamepadUiTick();
      nxStartGamepadUiLoop();
    },fast?16:75);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; update(); }, 150);
  }

  // Tocar fora do painel o fecha (o botão da barra e o próprio painel não contam como "fora")
  document.addEventListener('pointerdown', function (e) {
    if (!openUI) return;
    const t = e.target;
    if (t && wrap && wrap.contains(t)) return;
    if (t && nxLibraryButton && nxLibraryButton.contains(t)) return;
    // Fechar o painel sem cancelar eventos nativos de toque ou mouse.
    // O xCloud deve continuar recebendo entrada mesmo com periféricos conectados.
    setOpen(false,true);
  }, true);

  function update() {
    if (!buildUI()) return;

    const loss = curLoss();
    const col = lossColor(loss);
    // O pontinho (na pílula, no botão da biblioteca e no cabeçalho) indica o estado do link
    dotEl.style.background = col;
    if (nxLibraryDot) nxLibraryDot.style.background = col;
    pillTxt.textContent = loss == null ? '' : loss.toFixed(1) + '%';
    pillTxt.style.display = loss == null ? 'none' : 'inline';
    if (el.hdrDot) {
      el.hdrDot.style.background = col;
      el.hdrTxt.textContent = loss == null ? 'Sem partida' : loss.toFixed(1) + '% perda';
    }

    if (!openUI) return;
    nxDockPanel();
    runLive();
  }

  // ---------- 14. Aplicação de configurações ----------
  function pickApply(kind, k) {
    if (kind === 'srv') {
      setPref(LS_SRV, k);
      S.serverActual = '';
      S.serverPin = SERVERS[k].name;
      return false;
    }
    if (kind === 'bitrate') { setPref(LS_BITRATE, k); return false; }
    if (kind === 'res') { setPref(LS_RES, k === 'hq' ? 'hq' : 'auto'); return false; }
    if (kind === 'region') { setPref(LS_KEY, k); return true; }
    return false;
  }

  function toggleV4() {
    setPref(LS_V4, v4on() ? '0' : '1');
    S.v6dropped = 0;
    update();
  }

  function hardReload() {
    try {
      const kill = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && /^experimentationInfo|^HydrationCache/i.test(k)) kill.push(k);
      }
      kill.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { } });
    } catch (e) { }
    location.reload();
  }

  // Diagnóstico somente leitura; não modifica navigator, eventos nem a sessão.
  function inputCapabilities() {
    let touchPoints = 0, coarse = false, anyCoarse = false, hover = false;
    try { touchPoints = Number(navigator.maxTouchPoints) || 0; } catch (e) {}
    try { coarse = !!window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    try { anyCoarse = !!window.matchMedia('(any-pointer: coarse)').matches; } catch (e) {}
    try { hover = !!window.matchMedia('(any-hover: hover)').matches; } catch (e) {}
    let gamepads = 0;
    try { gamepads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean).length; } catch (e) {}
    return {
      touch: touchPoints > 0 || ('ontouchstart' in window) || coarse || anyCoarse,
      maxTouchPoints: touchPoints, pointerCoarse: coarse,
      anyPointerCoarse: anyCoarse, anyHover: hover, gamepadsConnected: gamepads,
      note: 'Capacidades locais; não confirmam liberação do controle virtual pelo xCloud'
    };
  }

  // Diagnóstico multimodal de eventos (somente leitura, buffer circular, sem dados digitados).
  const DIAG_MAX = 100;
  const diagEvents = [];
  const diagStart = Date.now();
  let diagLastTouch = 0;
  let diagLastPointer = 0;
  let diagLastKey = 0;
  function diagState() {
    let lock = false, focus = false, visibility = 'unknown';
    try { lock = !!(document.pointerLockElement || document.webkitPointerLockElement); } catch (e) {}
    try { focus = document.hasFocus(); } catch (e) {}
    try { visibility = document.visibilityState; } catch (e) {}
    return { pointerLocked: lock, focused: focus, visibility: visibility,
      fullscreen: !!(document.fullscreenElement || document.webkitFullscreenElement),
      screen: { width: window.innerWidth, height: window.innerHeight } };
  }
  function diagLog(type, detail) {
    try {
      diagEvents.push({ ms: Date.now() - diagStart, type: type, detail: detail || null, state: diagState() });
      if (diagEvents.length > DIAG_MAX) diagEvents.shift();
    } catch (e) {}
  }
  function diagZone(x, y) {
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    const col = Math.min(3, Math.max(0, Math.floor(x / w * 4)));
    const row = Math.min(3, Math.max(0, Math.floor(y / h * 4)));
    return 'r' + row + 'c' + col;
  }
  // Camada única de observação de controles: somente leitura, sem interceptar getGamepads.
  const NX_INPUT_PROFILE_KEY = 'nx.input.previewProfile.v1';
  const nxInputProfiles = {
    default: { label: 'Padrão', deadzone: 0.12, curve: 1 },
    precision: { label: 'Precisão', deadzone: 0.08, curve: 1.6 },
    racing: { label: 'Corrida', deadzone: 0.05, curve: 1.2 },
    accessible: { label: 'Acessibilidade', deadzone: 0.18, curve: 0.75 }
  };
  function nxInputProfileName() {
    const name = getPref(NX_INPUT_PROFILE_KEY, 'default');
    return Object.prototype.hasOwnProperty.call(nxInputProfiles, name) ? name : 'default';
  }
  const NX_RIGHT_STICK_PROFILE_KEY = 'nx.input.rightStickProfile.v1';
  function nxRightStickProfileName() {
    const name = getPref(NX_RIGHT_STICK_PROFILE_KEY, 'default');
    return Object.prototype.hasOwnProperty.call(nxInputProfiles, name) ? name : 'default';
  }
  function nxTransformStickAxis(value, index) {
    const name = index < 2 ? nxInputProfileName() : nxRightStickProfileName();
    return nxPreviewAxis(value, nxInputProfiles[name]);
  }
  function nxPreviewAxis(value, profile) {
    if (!Number.isFinite(value)) return 0;
    const x = Math.max(-1, Math.min(1, value));
    const magnitude = Math.abs(x);
    if (magnitude <= profile.deadzone) return 0;
    const normalized = (magnitude - profile.deadzone) / (1 - profile.deadzone);
    return Math.sign(x) * Math.pow(normalized, profile.curve);
  }
  const NX_INPUT_APPLY_KEY = 'nx.input.applyAxes.v1';
  const nxInputBridge = { enabled: false, installed: false, error: '', transformedReads: 0, nativeReads: 0, fallbacks: 0, lastFallback: '', foreignOverride: false, restored: false };
  const nxOriginalGamepadDescriptor = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');
  const nxNativeGetGamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads.bind(navigator) : null;
  const NX_GYRO_GAME_KEY = 'nx.gyro.gameInput.v1';
  const NX_GYRO_TRIGGER_KEY = 'nx.gyro.activation.v1';
  function nxGyroGameEnabled() { return getPref(NX_GYRO_GAME_KEY, '0') === '1'; }
  function nxGyroActivationMode() { return getPref(NX_GYRO_TRIGGER_KEY, 'lt') === 'always' ? 'always' : 'lt'; }
  function nxInputEnabled() { return getPref(NX_INPUT_APPLY_KEY, '0') === '1'; }
  function nxGameBridgeRequested() { return nxInputEnabled() || nxGyroGameEnabled(); }
  const NX_GYRO_BLEND_KEY = 'nx.gyro.blend.v1';
  const NX_GYRO_MAX_AGE_MS = 250;
  function nxGyroBlend() {
    const value = Number(getPref(NX_GYRO_BLEND_KEY, '0.5'));
    return Number.isFinite(value) ? Math.max(0.1, Math.min(1, value)) : 0.5;
  }
  const NX_GYRO_TARGET_KEY = 'nx.gyro.gamepadIndex.v1';
  function nxGyroTargetIndex() {
    const raw = getPref(NX_GYRO_TARGET_KEY, '0');
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
  }
  function nxGyroGameAxes(buttons) {
    if (!nxGyroGameEnabled() || !nxGyroPreview.enabled || !nxGyroPreviewState().calibrated ||
        Date.now() - nxGyroPreview.lastAt > NX_GYRO_MAX_AGE_MS ||
        document.visibilityState === 'hidden') return null;
    if (nxGyroActivationMode() === 'lt') {
      const lt = buttons && buttons[6];
      if (!lt || !(lt.pressed || Number(lt.value) > 0.5)) return null;
    }
    const g = nxGyroPreviewState();
    return [g.axisX, g.axisY];
  }
  function nxMergeGyroAxes(axes, buttons, padIndex) {
    const target = nxGyroTargetIndex();
    if (padIndex !== undefined && padIndex !== target) return axes;
    const gyro = nxGyroGameAxes(buttons);
    if (!gyro || axes.length < 4) return axes;
    const merged = axes.slice();
    const blend = nxGyroBlend();
    merged[2] = Math.max(-1, Math.min(1, merged[2] + gyro[0] * blend));
    merged[3] = Math.max(-1, Math.min(1, merged[3] + gyro[1] * blend));
    return merged;
  }
  function nxInputBridgeStatus() {
    // Consulta somente leitura: abrir o painel nunca deve apagar preferencias.
    // Se outro script substituiu a API, a ponte NimboXcloud deixa de ser chamada.
    if (nxInputBridge.installed && navigator.getGamepads !== nxInputBridge.wrapper) {
      return 'Outro script controla a Gamepad API; ponte NimboXcloud inativa';
    }
    return nxInputBridge.installed ? 'Ativo' : (nxInputBridge.error || 'Nativo / simulação');
  }
  function nxRestoreNativeGamepads(reason) {
    nxInputBridge.fallbacks++;
    nxInputBridge.lastFallback = String(reason || 'Recuperação manual').slice(0, 160);
    nxInputBridge.error = nxInputBridge.lastFallback;
    nxInputBridge.enabled = false;
    setPref(NX_INPUT_APPLY_KEY, '0');
    setPref(NX_GYRO_GAME_KEY, '0');
    if (nxNativeGetGamepads) {
      try {
        if (!nxInputBridge.wrapper || navigator.getGamepads !== nxInputBridge.wrapper) {
          if (nxInputBridge.wrapper) nxInputBridge.foreignOverride = true;
          nxInputBridge.error += '; API não pertence à ponte NimboXcloud; não sobrescrita';
          nxInputBridge.installed = false;
          return;
        }
        if (nxOriginalGamepadDescriptor) {
          Object.defineProperty(navigator, 'getGamepads', nxOriginalGamepadDescriptor);
        } else {
          delete navigator.getGamepads;
        }
        nxInputBridge.installed = false;
        nxInputBridge.restored = true;
      } catch (err) { nxInputBridge.error += '; restauração: ' + String(err && err.message || err); }
    }
  }
  function nxInstallInputBridge() {
    nxInputBridge.enabled = nxGameBridgeRequested();
    if (!nxInputBridge.enabled || !nxNativeGetGamepads) return;
    // Não instalar por cima de outro wrapper que assumiu a API após o boot.
    // O descriptor original é capturado uma única vez; ownership deve ser conferido.
    if (nxInputBridge.wrapper && navigator.getGamepads === nxInputBridge.wrapper) {
      nxInputBridge.installed = true;
      return;
    }
    if (nxInputBridge.wrapper && navigator.getGamepads !== nxInputBridge.wrapper) {
      nxInputBridge.foreignOverride = true;
    }
    if (nxInputBridge.foreignOverride) {
      nxInputBridge.enabled = false;
      nxInputBridge.error = 'Outro script controla a Gamepad API';
      return;
    }
    if (Object.prototype.hasOwnProperty.call(navigator, 'getGamepads') && nxOriginalGamepadDescriptor && !nxOriginalGamepadDescriptor.configurable) {
      nxInputBridge.error = 'Gamepad API não configurável; processamento ignorado';
      return;
    }
    try {
      const bridge = function () {
        let pads;
        try {
          pads = nxNativeGetGamepads();
          nxInputBridge.nativeReads++;
          if (!pads) return pads;
          const result = Array.from(pads, function (pad) {
            if (!pad || !pad.connected || !pad.axes || !pad.axes.length || pad.mapping !== 'standard') return pad;
            // Apenas eixos padrão dos sticks. Eixos adicionais ficam intactos.
            const nativeAxes = Array.from(pad.axes);
            const profiledAxes = nxInputEnabled() ? nativeAxes.map(function (v, i) {
              return i < 4 ? nxTransformStickAxis(v, i) : v;
            }) : nativeAxes;
            const axes = nxMergeGyroAxes(profiledAxes, pad.buttons, pad.index);
            // Evita criar um novo objeto se não houver diferença perceptível.
            if (axes.every(function (v, i) { return Object.is(v, pad.axes[i]); })) return pad;
            const output = { id: pad.id, index: pad.index, connected: pad.connected,
              mapping: pad.mapping, timestamp: pad.timestamp, axes: axes, buttons: pad.buttons };
            try { if ('vibrationActuator' in pad) output.vibrationActuator = pad.vibrationActuator; } catch (_) {}
            try { if ('hapticActuators' in pad) output.hapticActuators = pad.hapticActuators; } catch (_) {}
            nxInputBridge.transformedReads++;
            return output;
          });
          return result;
        } catch (err) {
          nxRestoreNativeGamepads('Falha no processamento: ' + String(err && err.message || err));
          if (pads) return pads;
          try { return nxNativeGetGamepads(); } catch (_) { return []; }
        }
      };
      Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: bridge });
      nxInputBridge.wrapper = bridge;
      nxInputBridge.installed = navigator.getGamepads === bridge;
      if (!nxInputBridge.installed) nxInputBridge.error = 'Não foi possível instalar o processamento';
    } catch (err) { nxInputBridge.error = String(err && err.message || err); }
  }
  // Instala no início do userscript, antes de a interface do site inicializar.
  nxInstallInputBridge();
  // Telemetria agregada de fontes de entrada; nunca envia ou injeta comandos.
  const nxInputEvents = [];
  const NX_INPUT_EVENTS_MAX = 30;
  function nxInputEvent(kind, detail) {
    nxInputEvents.push({ at: new Date().toISOString(), kind: kind, detail: String(detail || '').slice(0, 90) });
    if (nxInputEvents.length > NX_INPUT_EVENTS_MAX) nxInputEvents.shift();
  }
  // Registro de entradas virtuais interno: não injeta Gamepad nem intercepta eventos do jogo.
  const nxVirtualInputs = Object.create(null);
  const NX_VIRTUAL_INPUT_TTL = 2000;
  const NX_VIRTUAL_INPUT_LIMIT = 8;
  function nxPruneVirtualInputs() {
    const now = Date.now();
    Object.keys(nxVirtualInputs).forEach(function (id) {
      if (now - nxVirtualInputs[id].at > NX_VIRTUAL_INPUT_TTL) delete nxVirtualInputs[id];
    });
  }
  function nxRegisterVirtualInput(id, kind, active) {
    if (typeof id !== 'string' || !/^[a-z0-9_-]{1,32}$/i.test(id)) return false;
    if (kind !== 'touch-hud' && kind !== 'gyro' && kind !== 'virtual-keyboard' && kind !== 'virtual-mouse') return false;
    if (active === false) {
      delete nxVirtualInputs[id];
      return true;
    }
    nxPruneVirtualInputs();
    if (!Object.prototype.hasOwnProperty.call(nxVirtualInputs, id) && Object.keys(nxVirtualInputs).length >= NX_VIRTUAL_INPUT_LIMIT) return false;
    nxVirtualInputs[id] = { kind: kind, at: Date.now() };
    return true;
  }
  function nxVirtualInputState() {
    nxPruneVirtualInputs();
    const kinds = Object.keys(nxVirtualInputs).map(function (id) { return nxVirtualInputs[id].kind; });
    return { count: kinds.length, kinds: Array.from(new Set(kinds)), injectionEnabled: false,
      note: 'Registro interno de atividade virtual; nenhuma entrada é enviada ao xCloud.' };
  }
  // Giroscópio em modo de observação: exige ativação explícita e nunca move o jogo.
  const NX_GYRO_INVERT_X_KEY = 'nx.gyro.previewInvertX.v1';
  const NX_GYRO_INVERT_Y_KEY = 'nx.gyro.previewInvertY.v1';
  function nxGyroInvertX() { return getPref(NX_GYRO_INVERT_X_KEY, '0') === '1'; }
  function nxGyroInvertY() { return getPref(NX_GYRO_INVERT_Y_KEY, '0') === '1'; }
  const NX_GYRO_SENS_KEY = 'nx.gyro.previewSensitivity.v1';
  const NX_GYRO_DEADZONE_KEY = 'nx.gyro.previewDeadzone.v1';
  function nxGyroSensitivity() {
    const value = Number(getPref(NX_GYRO_SENS_KEY, '1'));
    return Number.isFinite(value) ? Math.max(0.25, Math.min(3, value)) : 1;
  }
  function nxGyroDeadzone() {
    const value = Number(getPref(NX_GYRO_DEADZONE_KEY, '0.04'));
    return Number.isFinite(value) ? Math.max(0, Math.min(0.2, value)) : 0.04;
  }
  function nxGyroAxisPreview(degrees, range) {
    if (!Number.isFinite(degrees)) return 0;
    const normalized = Math.max(-1, Math.min(1, degrees / range * nxGyroSensitivity()));
    const deadzone = nxGyroDeadzone();
    if (Math.abs(normalized) <= deadzone) return 0;
    return Math.sign(normalized) * (Math.abs(normalized) - deadzone) / (1 - deadzone);
  }
  const NX_GYRO_SMOOTH_KEY = 'nx.gyro.previewSmoothing.v1';
  function nxGyroSmoothFactor() {
    const raw = Number(getPref(NX_GYRO_SMOOTH_KEY, '0.25'));
    return Number.isFinite(raw) ? Math.max(0.05, Math.min(1, raw)) : 0.25;
  }
  function nxScreenAngle() {
    try {
      const angle = screen.orientation && Number(screen.orientation.angle);
      return Number.isFinite(angle) ? ((angle % 360) + 360) % 360 : 0;
    } catch (_) { return 0; }
  }
  let nxGyroRequestGeneration = 0;
  const nxGyroPreview = { enabled: false, permission: 'não solicitada', samples: 0, lastAt: 0,
    alpha: null, beta: null, gamma: null, originBeta: null, originGamma: null,
    filteredX: null, filteredY: null, screenAngle: null, orientationChanges: 0, error: '' };
  function nxGyroOnOrientation(e) {
    if (!nxGyroPreview.enabled) return;
    if (!Number.isFinite(e.beta) || !Number.isFinite(e.gamma)) return;
    nxGyroPreview.samples++;
    nxGyroPreview.lastAt = Date.now();
    nxGyroPreview.alpha = Number.isFinite(e.alpha) ? e.alpha : null;
    nxGyroPreview.beta = e.beta;
    nxGyroPreview.gamma = e.gamma;
    const angle = nxScreenAngle();
    if (nxGyroPreview.screenAngle !== null && angle !== nxGyroPreview.screenAngle) {
      nxGyroPreview.orientationChanges++;
      nxResetGyroCalibration();
    }
    nxGyroPreview.screenAngle = angle;
    if (nxGyroPreview.originBeta !== null && nxGyroPreview.originGamma !== null) {
      const x = Math.max(-90, Math.min(90, e.gamma - nxGyroPreview.originGamma));
      const y = Math.max(-180, Math.min(180, e.beta - nxGyroPreview.originBeta));
      const factor = nxGyroSmoothFactor();
      nxGyroPreview.filteredX = nxGyroPreview.filteredX === null ? x : nxGyroPreview.filteredX + factor * (x - nxGyroPreview.filteredX);
      nxGyroPreview.filteredY = nxGyroPreview.filteredY === null ? y : nxGyroPreview.filteredY + factor * (y - nxGyroPreview.filteredY);
    }
    nxRegisterVirtualInput('nx-gyro-preview', 'gyro', true);
  }
  async function nxStartGyroPreview() {
    if (nxGyroPreview.enabled) return true;
    const generation = ++nxGyroRequestGeneration;
    if (typeof DeviceOrientationEvent === 'undefined') {
      nxGyroPreview.permission = 'indisponível';
      nxGyroPreview.error = 'DeviceOrientationEvent não disponível';
      return false;
    }
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (generation !== nxGyroRequestGeneration || document.visibilityState === 'hidden') return false;
        nxGyroPreview.permission = permission;
        if (permission !== 'granted') return false;
      } else nxGyroPreview.permission = 'API disponível';
      if (generation !== nxGyroRequestGeneration || document.visibilityState === 'hidden') return false;
      nxGyroPreview.enabled = true;
      nxGyroPreview.error = '';
      window.addEventListener('deviceorientation', nxGyroOnOrientation, { passive: true });
      return true;
    } catch (err) {
      if (generation !== nxGyroRequestGeneration) return false;
      nxGyroPreview.permission = 'erro';
      nxGyroPreview.error = String(err && err.message || err).slice(0, 120);
      return false;
    }
  }
  function nxStopGyroPreview() {
    ++nxGyroRequestGeneration;
    nxGyroPreview.enabled = false;
    window.removeEventListener('deviceorientation', nxGyroOnOrientation);
    nxRegisterVirtualInput('nx-gyro-preview', 'gyro', false);
    nxGyroPreview.lastAt = 0;
    nxGyroPreview.beta = null;
    nxGyroPreview.gamma = null;
    nxGyroPreview.screenAngle = null;
    nxResetGyroCalibration();
  }
  function nxResetGyroCalibration() {
    nxGyroPreview.originBeta = null;
    nxGyroPreview.originGamma = null;
    nxGyroPreview.filteredX = null;
    nxGyroPreview.filteredY = null;
  }
  function nxCalibrateGyroPreview() {
    if (!nxGyroPreview.enabled || Date.now() - nxGyroPreview.lastAt > 2000 ||
      !Number.isFinite(nxGyroPreview.beta) || !Number.isFinite(nxGyroPreview.gamma)) return false;
    nxGyroPreview.originBeta = nxGyroPreview.beta;
    nxGyroPreview.originGamma = nxGyroPreview.gamma;
    nxGyroPreview.filteredX = 0;
    nxGyroPreview.filteredY = 0;
    return true;
  }
  function nxGyroPreviewState() {
    const g = nxGyroPreview;
    return { enabled: g.enabled, permission: g.permission, samples: g.samples,
      receiving: g.enabled && Date.now() - g.lastAt < 2000,
      calibrated: g.originBeta !== null && g.originGamma !== null,
      tiltX: g.filteredX === null ? null : Math.round((nxGyroInvertX() ? -1 : 1) * g.filteredX * 10) / 10,
      tiltY: g.filteredY === null ? null : Math.round((nxGyroInvertY() ? -1 : 1) * g.filteredY * 10) / 10,
      invertX: nxGyroInvertX(), invertY: nxGyroInvertY(),
      smoothing: nxGyroSmoothFactor(),
      sensitivity: nxGyroSensitivity(), deadzone: nxGyroDeadzone(),
      axisX: !g.enabled || Date.now() - g.lastAt > 2000 || g.filteredX === null ? 0 :
        Math.round(nxGyroAxisPreview((nxGyroInvertX() ? -1 : 1) * g.filteredX, 45) * 1000) / 1000,
      axisY: !g.enabled || Date.now() - g.lastAt > 2000 || g.filteredY === null ? 0 :
        Math.round(nxGyroAxisPreview((nxGyroInvertY() ? -1 : 1) * g.filteredY, 60) * 1000) / 1000,
      screenAngle: g.screenAngle, orientationChanges: g.orientationChanges,
      autoPauseOnHidden: true,
      error: g.error, gameplayInput: nxGyroGameEnabled() && nxInputBridge.installed &&
        g.enabled && g.originBeta !== null && g.originGamma !== null &&
        Date.now() - g.lastAt <= NX_GYRO_MAX_AGE_MS };
  }
  const nxInputSources = {
    touch: { count: 0, lastAt: 0 }, mouse: { count: 0, lastAt: 0 },
    keyboard: { count: 0, lastAt: 0 }, gamepad: { count: 0, lastAt: 0 },
    simultaneous: 0, lastConflictAt: 0
  };
  const nxInputEventLastAt = Object.create(null);
  // Observação de movimento relativo: não injeta mouse nem guarda coordenadas.
  const nxRelativeMouse = { samples: 0, lastAt: 0, distance: 0, maxStep: 0, invalid: 0 };
  function nxObserveRelativeMouse(e) {
    if (!e.isTrusted || e.pointerType !== 'mouse') return;
    // Campos ausentes não devem virar zero ou gerar estatísticas falsas.
    if (typeof e.movementX !== 'number' || typeof e.movementY !== 'number') {
      nxRelativeMouse.invalid++;
      return;
    }
    const dx = e.movementX, dy = e.movementY;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) { nxRelativeMouse.invalid++; return; }
    const step = Math.hypot(dx, dy);
    if (step === 0) return;
    nxRelativeMouse.samples++;
    nxRelativeMouse.lastAt = Date.now();
    nxRelativeMouse.distance = Math.min(1000000, nxRelativeMouse.distance + Math.min(step, 10000));
    nxRelativeMouse.maxStep = Math.max(nxRelativeMouse.maxStep, Math.min(step, 10000));
  }
  function nxRecordInputSource(name) {
    const source = nxInputSources[name];
    if (!source) return;
    const now = Date.now();
    if (now - source.lastAt < 100) return;
    source.count++;
    source.lastAt = now;
    if (now - (nxInputEventLastAt[name] || 0) >= 1500) {
      nxInputEvent('source', name);
      nxInputEventLastAt[name] = now;
    }
    // Apenas pares touch/mouse indicam possível duplicação de evento.
    // Teclado + toque ou teclado + mouse são combinações legítimas.
    if (name === 'touch' || name === 'mouse') {
      const other = name === 'touch' ? 'mouse' : 'touch';
      const lastOther = nxInputSources[other].lastAt;
      if (lastOther > 0 && now - lastOther >= 0 && now - lastOther < 300 &&
          now - nxInputSources.lastConflictAt > 500) {
        nxInputSources.simultaneous++;
        nxInputSources.lastConflictAt = now;
        nxInputEvent('overlap', name + '/' + other);
      }
    }
  }
  const NX_INPUT_COORD_KEY = 'nx.input.coordination.v1';
  const nxCoordModes = {
    auto: 'Automático', gamepad: 'Controle físico', touch: 'Toque',
    mouse: 'Mouse', keyboard: 'Teclado'
  };
  function nxCoordMode() {
    const mode = getPref(NX_INPUT_COORD_KEY, 'auto');
    return Object.prototype.hasOwnProperty.call(nxCoordModes, mode) ? mode : 'auto';
  }
  function nxCoordState() {
    const now = Date.now(), recent = {};
    ['touch', 'mouse', 'keyboard', 'gamepad'].forEach(function (k) {
      recent[k] = nxInputSources[k].lastAt > 0 && now - nxInputSources[k].lastAt < 2000;
    });
    const configured = nxCoordMode();
    const priority = ['gamepad', 'touch', 'mouse', 'keyboard'];
    const active = configured !== 'auto' ? configured : (priority.filter(function (k) { return recent[k]; })
      .sort(function (a, b) { return nxInputSources[b].lastAt - nxInputSources[a].lastAt; })[0] || 'none');
    const simultaneous = priority.filter(function (k) { return recent[k]; });
    const virtual = nxVirtualInputState();
    return {
      configured: configured, suggested: active,
      activeSources: simultaneous, mixed: simultaneous.length > 1,
      virtualSources: virtual.kinds, virtualCount: virtual.count,
      outputModified: false,
      note: 'Arbitragem apenas diagnóstica. Não bloqueia eventos, não emula controles e não interfere no HUD nativo.'
    };
  }
  function nxInputSourcesReport() {
    return {
      touch: nxInputSources.touch.count, mouse: nxInputSources.mouse.count,
      keyboard: nxInputSources.keyboard.count, gamepad: nxInputSources.gamepad.count,
      recent: ['touch', 'mouse', 'keyboard', 'gamepad'].filter(function (k) {
        return nxInputSources[k].lastAt > 0 && Date.now() - nxInputSources[k].lastAt < 2000;
      }),
      touchMouseOverlap: nxInputSources.simultaneous,
      note: 'Observação passiva; toque pode gerar eventos de mouse sintéticos. Sobreposição não comprova conflito.'
    };
  }
  function nxInputSelfCheck() {
    const tests = [];
    function check(name, pass) { tests.push({ name: name, pass: !!pass }); }
    const neutral = nxInputProfiles.default;
    check('eixo neutro', nxPreviewAxis(0, neutral) === 0);
    check('zona morta', nxPreviewAxis(0.05, neutral) === 0);
    check('limite positivo', nxPreviewAxis(1, neutral) === 1);
    check('limite negativo', nxPreviewAxis(-1, neutral) === -1);
    check('valor inválido', nxPreviewAxis(NaN, neutral) === 0);
    check('curva direita finita', Number.isFinite(nxTransformStickAxis(0.6, 2)));
    check('perfil esquerdo existente', !!nxInputProfiles[nxInputProfileName()]);
    check('perfil direito existente', !!nxInputProfiles[nxRightStickProfileName()]);
    const state = nxCoordState();
    check('coordenação não invasiva', state.outputModified === false);
    check('histórico limitado', nxInputEvents.length <= NX_INPUT_EVENTS_MAX);
    check('registro virtual rejeita identificador inválido', !nxRegisterVirtualInput('../bad', 'gyro', true));
    check('registro virtual rejeita tipo inválido', !nxRegisterVirtualInput('test', 'unknown', true));
    check('registro virtual não injeta comandos', nxVirtualInputState().injectionEnabled === false);
    check('giroscópio desativado por padrão', !nxGyroGameEnabled() || nxGyroPreviewState().gameplayInput === nxInputBridge.installed &&
      nxGyroPreview.enabled && nxGyroPreview.originBeta !== null &&
      nxGyroPreview.originGamma !== null && Date.now() - nxGyroPreview.lastAt <= NX_GYRO_MAX_AGE_MS);
    check('suavização do sensor válida', nxGyroSmoothFactor() > 0 && nxGyroSmoothFactor() <= 1);
    check('pausa automática do sensor configurada', nxGyroPreviewState().autoPauseOnHidden === true);
    check('prévia informa status de entrada', typeof nxGyroPreviewState().gameplayInput === 'boolean');
    check('limite de entradas virtuais', NX_VIRTUAL_INPUT_LIMIT === 8);
    check('janela de expiração virtual', NX_VIRTUAL_INPUT_TTL === 2000);
    check('ângulo de tela normalizado', nxScreenAngle() >= 0 && nxScreenAngle() < 360);
    check('inversão horizontal booleana', typeof nxGyroInvertX() === 'boolean');
    check('inversão vertical booleana', typeof nxGyroInvertY() === 'boolean');
    check('eixo virtual neutro', nxGyroAxisPreview(0, 45) === 0);
    check('eixo virtual positivo limitado', nxGyroAxisPreview(999, 45) === 1);
    check('eixo virtual negativo limitado', nxGyroAxisPreview(-999, 45) === -1);
    check('eixo virtual inválido neutro', nxGyroAxisPreview(NaN, 45) === 0);
    check('fusão de eixos sem sensor mantém original', nxMergeGyroAxes([0, 0, 0.2, -0.3], []).join(',') === '0,0,0.2,-0.3');
    check('modo de ativação válido', ['lt', 'always'].includes(nxGyroActivationMode()));
    check('intensidade de fusão limitada', nxGyroBlend() >= 0.1 && nxGyroBlend() <= 1);
    check('idade máxima do sensor limitada', NX_GYRO_MAX_AGE_MS <= 250);
    check('controle alvo válido', nxGyroTargetIndex() >= 0 && nxGyroTargetIndex() <= 3);
    check('linha do tempo com limite de eventos', NX_INPUT_EVENTS_MAX === 30);
    check('rota de jogo não assume página genérica', nxHudGameId('../bad') === '');
    const nudgeLayout = nxHudValidateLayout(null);
    check('HUD auto-carregamento booleano', typeof nxHudAutoEnabled() === 'boolean');
    check('HUD teclado move posição', nxHudNudge(nudgeLayout, 'a', 1, 0) === true);
    check('HUD teclado rejeita botão desconhecido', nxHudNudge(nudgeLayout, 'invalid', 1, 0) === false);
    check('HUD teclado rejeita movimento inválido', nxHudNudge(nudgeLayout, 'a', NaN, 0) === false);
    check('backup HUD rejeita JSON inválido', !nxHudImportBackup('{'));
    check('backup HUD rejeita JSON excessivo', !nxHudImportBackup(' '.repeat(65537)));
    check('backup HUD rejeita formato desconhecido', !nxHudImportBackup('{"format":"outro"}'));
    check('backup HUD exportado tem formato correto',
      JSON.parse(nxHudExportBackup()).format === 'nimboxcloud-hud-backup-v1');
    check('identificador de jogo rejeita caminho', nxHudGameId('../bad') === '');
    check('identificador de jogo normalizado', nxHudGameId('GAME_123') === 'game_123');
    check('nome de perfil de HUD válido', nxHudProfileName('Corrida 1') === 'Corrida 1');
    check('nome de perfil de HUD inválido rejeitado', nxHudProfileName('../bad') === '');
    check('layout de HUD tem oito elementos', Object.keys(nxHudReadLayout()).length === 8);
    check('layout de HUD limita coordenadas', nxHudValidateLayout({ a: [999, -5] }).a.join(',') === '95,5');
    check('layout de HUD exportado tem versão', nxHudExportLayout().includes('nimboxcloud-hud-v1'));
    check('layout de HUD rejeita importação inválida', nxHudImportLayout('{"format":"unknown"}') === false);
    check('layout de HUD recupera dados inválidos', nxHudValidateLayout({ a: [NaN, 5] }).a.join(',') === NX_HUD_DEFAULT.a.join(','));
    check('controle secundário preservado',
      nxMergeGyroAxes([0, 0, 0.2, 0.1], [], nxGyroTargetIndex() === 0 ? 1 : 0).join(',') === '0,0,0.2,0.1');
    check('zona morta válida', nxGyroDeadzone() >= 0 && nxGyroDeadzone() <= 0.2);
    check('sensibilidade válida', nxGyroSensitivity() >= 0.25 && nxGyroSensitivity() <= 3);
    return { passed: tests.filter(function (t) { return t.pass; }).length,
      total: tests.length, tests: tests, note: 'Autoteste matemático e estrutural; não substitui teste de streaming.' };
  }
  function nxResetInputDiagnostics() {
    ['touch', 'mouse', 'keyboard', 'gamepad'].forEach(function (k) {
      nxInputSources[k].count = 0;
      nxInputSources[k].lastAt = 0;
    });
    nxInputSources.simultaneous = 0;
    nxInputSources.lastConflictAt = 0;
    nxInputEvents.length = 0;
    nxRelativeMouse.samples = 0;
    nxRelativeMouse.lastAt = 0;
    nxRelativeMouse.distance = 0;
    nxRelativeMouse.maxStep = 0;
    nxRelativeMouse.invalid = 0;
    Object.keys(nxInputEventLastAt).forEach(function (k) { delete nxInputEventLastAt[k]; });
    Object.keys(nxVirtualInputs).forEach(function (id) { delete nxVirtualInputs[id]; });
    nxGamepadMonitor.errors = 0;
    nxGamepadMonitor.lastChange = null;
    nxGamepadMonitor.lastSignature = undefined;
  }
  const nxGamepadMonitor = { connected: 0, active: 0, snapshots: [], lastChange: null, errors: 0 };
  function nxSampleGamepads() {
    let pads;
    try {
      pads = nxGamepadLastReadAt && Date.now()-nxGamepadLastReadAt<=1000
        ? nxGamepadLastPads
        : nxReadGamepadSnapshot();
    }
    catch (err) {
      nxGamepadMonitor.errors++;
      nxGamepadMonitor.connected = 0;
      nxGamepadMonitor.active = 0;
      nxGamepadMonitor.snapshots = [];
      nxGamepadMonitor.lastSignature = undefined;
      nxInputEvent('gamepad-error', err && err.name || 'read');
      return;
    }
    const next = [];
    const axesAreProcessed=nxInputBridge.installed && navigator.getGamepads===nxInputBridge.wrapper;
    try {
      for (let i = 0; i < (pads ? pads.length : 0); i++) {
        const pad = pads[i];
        if (!pad || !pad.connected) continue;
        const buttons = Array.from(pad.buttons || []);
        const axes = Array.from(pad.axes || []);
        next.push({
          index: pad.index, mapping: pad.mapping || 'unknown',
          buttons: buttons.length, axes: axes.length,
          pressed: buttons.reduce(function (n, b) { return n + (b && b.pressed ? 1 : 0); }, 0),
          movingAxes: axes.filter(function (v) { return Number.isFinite(v) && Math.abs(v) > 0.18; }).length,
          axisPreview: axes.slice(0, 4).map(function (v, i) { return Math.round((axesAreProcessed?v:nxTransformStickAxis(v, i)) * 100) / 100; })
        });
      }
    } catch (err) {
      nxGamepadMonitor.errors++;
      nxGamepadMonitor.connected = 0;
      nxGamepadMonitor.active = 0;
      nxGamepadMonitor.snapshots = [];
      nxGamepadMonitor.lastSignature = undefined;
      nxInputEvent('gamepad-error', err && err.name || 'snapshot');
      return;
    }
    const signature = next.map(function (p) { return p.index + ':' + p.mapping + ':' + p.buttons + ':' + p.axes; }).join('|');
    if (nxGamepadMonitor.lastSignature !== undefined && signature !== nxGamepadMonitor.lastSignature) {
      nxGamepadMonitor.lastChange = new Date().toISOString();
      nxInputEvent('gamepad-connection', next.length + ' connected');
    }
    nxGamepadMonitor.lastSignature = signature;
    nxGamepadMonitor.connected = next.length;
    nxGamepadMonitor.active = next.filter(function (p) { return p.pressed || p.movingAxes; }).length;
    if (nxGamepadMonitor.active) nxRecordInputSource('gamepad');
    nxGamepadMonitor.snapshots = next;
  }
  let nxInputDiagnosticsStarted = false;
  function startInputDiagnostics() {
    // A navegação SPA pode reabrir painéis; nunca duplicar observadores globais.
    if (nxInputDiagnosticsStarted) return;
    nxInputDiagnosticsStarted = true;
    document.addEventListener('touchstart', function (e) {
      if (e.isTrusted) nxRecordInputSource('touch');
    }, { passive: true, capture: true });
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.isTrusted) nxRecordInputSource('mouse');
    }, true);
    document.addEventListener('pointermove', nxObserveRelativeMouse, { capture: true, passive: true });
    document.addEventListener('keydown', function (e) {
      if (e.isTrusted && !e.repeat) nxRecordInputSource('keyboard');
    }, true);
    diagLog('diagnostics-start', { capabilities: inputCapabilities() });
    document.addEventListener('pointerlockchange', function () { diagLog('pointerlockchange'); }, true);
    document.addEventListener('webkitpointerlockchange', function () { diagLog('webkitpointerlockchange'); }, true);
    document.addEventListener('pointerlockerror', function () { diagLog('pointerlockerror'); }, true);
    document.addEventListener('visibilitychange', function () {
      diagLog('visibilitychange');
      if (document.visibilityState === 'hidden') {
        nxStopGyroPreview();
        nxRemoteGamepadSuspend();
      }
    }, true);
    document.addEventListener('fullscreenchange', function () { diagLog('fullscreenchange'); }, true);
    document.addEventListener('webkitfullscreenchange', function () { diagLog('webkitfullscreenchange'); }, true);
    window.addEventListener('blur', function () {
      nxRemoteGamepadWindowFocused=false;
      nxRemoteGamepadSuspend();
      diagLog('window-blur');
    }, true);
    window.addEventListener('focus', function () {
      nxRemoteGamepadWindowFocused=true;
      diagLog('window-focus');
    }, true);
    document.addEventListener('focusin', function () { diagLog('focusin', { target: 'element' }); }, true);
    document.addEventListener('touchstart', function (e) {
      const now = Date.now();
      if (now - diagLastTouch < 180) return;
      diagLastTouch = now;
      const t = e.changedTouches && e.changedTouches[0];
      diagLog('touchstart', { zone: t ? diagZone(t.clientX, t.clientY) : null, touches: e.touches ? e.touches.length : null });
    }, { capture: true, passive: true });
    document.addEventListener('pointerdown', function (e) {
      const now = Date.now();
      if (now - diagLastPointer < 180) return;
      diagLastPointer = now;
      diagLog('pointerdown', { pointerType: e.pointerType || 'unknown', zone: diagZone(e.clientX, e.clientY), button: e.button });
    }, { capture: true, passive: true });
    document.addEventListener('keydown', function (e) {
      const now = Date.now();
      if (now - diagLastKey < 250) return;
      diagLastKey = now;
      // Nunca registra tecla, texto, código ou combinações digitadas.
      diagLog('keydown', { trusted: e.isTrusted, repeat: e.repeat });
    }, true);
    window.addEventListener('gamepadconnected', function () { diagLog('gamepadconnected'); }, true);
    window.addEventListener('gamepaddisconnected', function () { diagLog('gamepaddisconnected'); }, true);
    window.addEventListener('resize', function () { diagLog('resize'); }, true);
    window.addEventListener('pageshow', function () {
      nxRemoteGamepadWindowFocused=true;
      diagLog('pageshow');
    }, true);
    window.addEventListener('pagehide', function () {
      nxRemoteReleaseGamepadSlots(nxRemoteChannels);
      diagLog('pagehide');
    }, true);
  }

  function compactInteractionEvents() {
    const important = new Set(['diagnostics-start','pageshow','pagehide','gamepadconnected','gamepaddisconnected','fullscreenchange','pointerlockchange','pointerlockerror','visibilitychange','resize']);
    const counts = {};
    const timeline = [];
    for (const e of diagEvents) {
      counts[e.type] = (counts[e.type] || 0) + 1;
      if (important.has(e.type)) timeline.push(e);
    }
    return { state: diagState(), counts: counts, timeline: timeline.slice(-30),
      retained: DIAG_MAX, note: 'Eventos de foco e toque agregados por tipo para reduzir o relatório; sem coordenadas ou teclas.' };
  }
  function buildReport() {
    return JSON.stringify({
      v: VER,
      url: location.href,
      inputCapabilities: inputCapabilities(),
      inputSources: nxInputSourcesReport(),
      relativeMouse: { samples: nxRelativeMouse.samples, lastAt: nxRelativeMouse.lastAt,
        distance: Math.round(nxRelativeMouse.distance), maxStep: Math.round(nxRelativeMouse.maxStep),
        invalid: nxRelativeMouse.invalid, pointerLocked: !!document.pointerLockElement,
        note: 'Movimento relativo passivo; não mede precisão no jogo nem altera sensibilidade.' },
      inputEventHistory: nxInputEvents.slice(),
      inputBridgeHealth: nxInputBridgeStatus(),
      inputSelfCheck: nxInputSelfCheck(),
      inputCoordination: nxCoordState(),
      virtualInputs: nxVirtualInputState(),
      gyroPreview: nxGyroPreviewState(),
      hudEditor: { layout: nxHudReadLayout(), savedProfileNames: Object.keys(nxHudProfilesRead()),
        currentGameId: nxHudCurrentGameId(), autoLoadEnabled: nxHudAutoEnabled(), lastRoute: nxHudLastRoute,
        lastAppliedProfile: nxHudLastAppliedProfile, gameBindings: nxHudGameBindings(), gameplayApplied: false },
      gyroGame: { enabled: nxGyroGameEnabled(), activation: nxGyroActivationMode(),
        blend: nxGyroBlend(), targetGamepadIndex: nxGyroTargetIndex(),
        maxSensorAgeMs: NX_GYRO_MAX_AGE_MS,
        bridgeInstalled: nxInputBridge.installed },
      gamepadMonitor: { connected: nxGamepadMonitor.connected, active: nxGamepadMonitor.active, snapshots: nxGamepadMonitor.snapshots, lastChange: nxGamepadMonitor.lastChange, errors: nxGamepadMonitor.errors, previewProfile: nxInputProfileName(), rightStickProfile: nxRightStickProfileName(), previewOnly: !nxInputBridge.installed, bridge: { enabled: nxInputBridge.enabled, installed: nxInputBridge.installed, error: nxInputBridge.error, transformedReads: nxInputBridge.transformedReads, nativeReads: nxInputBridge.nativeReads, fallbacks: nxInputBridge.fallbacks, lastFallback: nxInputBridge.lastFallback, foreignOverride: nxInputBridge.foreignOverride, restored: nxInputBridge.restored } },
      inputNegotiation: lastInputNegotiation,
      touchSession: touchSessionDiagnostics,
      touchFullscreenPolicy: touchFullscreenPolicy,
      interactionDiagnostics: compactInteractionEvents(),
      region: cfg(),
      stream: { pin: S.serverPin, actual: S.serverActual, label: srvBtnLabel(), ipv4Only: v4on(), resolution: resBtnLabel(), bitrateLimit: bitrateCfg().label, playPatched: S.playPatched },
      territory: { before: S.territoryBefore, now: S.territoryNow, cookie: getCookie('territory') },
      experiment: { hits: S.expHits, before: S.expBefore, after: S.expAfter, cacheCleared: S.cacheCleared },
      media: { peerConnections: S.pcs, ipv6CandidatesDropped: S.v6dropped },
      qos: S.qos,
      qosHistory: { samples: S.hist, min: S.histMin },
      env: S.env,
      counts: {
        hookAll: S.all, gssv: S.gssv, injected: S.inj,
        captured: S.caps.length, deniedErrors: S.denied
      },
      logs: S.logs,
      captures: S.caps,
      lastErr: S.lastErr,
      elapsedSec: Math.round((Date.now() - S.startedAt) / 1000)
    }, null, 2);
  }

  function copyAll() {
    const t = buildReport();
    console.log(t);
    try {
      navigator.clipboard.writeText(t).then(
        function () { alert('Relatório copiado'); },
        function () { alert('Falha ao copiar; o relatório foi impresso no console'); }
      );
    } catch (e) { alert('Falha ao copiar; o relatório foi impresso no console'); }
  }

  // Quando o streaming começa, a página chama a Fullscreen API e entra em tela cheia. Nesse estado
  // o navegador só renderiza o elemento em tela cheia e seus descendentes, então um painel preso
  // ao body some por completo (no Steam Deck / Game Mode: "ao entrar no jogo a pílula some e só
  // reaparece ao abrir o guia do Steam, que interrompe a tela cheia"). Por isso o painel
  // precisa acompanhar o elemento em tela cheia.
  function fullscreenHost() {
    let fs = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fs) return null;
    try {
      if (fs.tagName === 'VIDEO') fs = fs.parentElement || fs.parentNode;
      if (fs && fs.nodeType === 1 && fs.appendChild) return fs;
    } catch (e) { }
    return null;
  }

  function mountTarget() {
    return fullscreenHost() || document.body || document.documentElement;
  }

  // Verifica se um diálogo do site realmente está sobre o painel: usa apenas "visível + intersecta
  // o retângulo do painel", evitando falsos positivos de nós ocultos permanentes do framework
  // (um falso positivo deixaria o painel invisível o tempo todo).
  function modalHit() {
    if (!wrap) return false;
    let wr;
    try { wr = wrap.getBoundingClientRect(); } catch (e) { return false; }
    if (!wr.width) return false;
    try {
      const list = document.querySelectorAll('[aria-modal="true"],[role="dialog"]');
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        if (wrap.contains(n)) continue;
        const r = n.getBoundingClientRect();
        if (r.width < 60 || r.height < 60) continue;
        // Contêiner que cobre a maior parte da viewport é a própria imagem do streaming, não um diálogo; não pode esconder o painel
        if (r.width > window.innerWidth * 0.7 && r.height > window.innerHeight * 0.7) continue;
        if (r.right > wr.left - 8 && r.left < wr.right + 8 &&
            r.bottom > wr.top - 8 && r.top < wr.bottom + 8) return true;
      }
    } catch (e) { }
    return false;
  }

  // ---------- 15. Loop principal ----------
  function tick() {
    try {
      if (wrap && wrap.isConnected) {
        const r = wrap.getBoundingClientRect();
        if (r.right < 28 || r.left > innerWidth - 28 || r.bottom < 24 || r.top > innerHeight - 24) resetPos();
      }
      const host = mountTarget();
      if (!wrap || !wrap.isConnected) buildUI();
      if (wrap && host && wrap.parentNode !== host) host.appendChild(wrap);
      // O botão integrado permanece na barra original; o painel segue o host fullscreen.
      syncNXPlacement();
    } catch (e) { S.lastErr = 'NX tick: ' + String(e && e.message || e); }

    // Não reabrir o painel quando a barra nativa do xCloud estiver recolhida.
    if (cardEl) cardEl.style.display = openUI ? 'flex' : 'none';
    if (pillEl) {
      pillEl.style.opacity = '1';
      pillEl.style.pointerEvents = 'auto';
      if (openUI) pillEl.style.display='none';
    }

    // Na primeira entrada no streaming, recolhe automaticamente para não atrapalhar os controles do jogo
    if (!autoFolded && isInGame()) {
      autoFolded = true;
      if (!userTouched) setOpen(false);
    }
    update();
  }

  function detectedDeviceProfile() {
    const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const desktopPointer = window.matchMedia && window.matchMedia('(any-pointer:fine)').matches;
    return mobile ? (desktopPointer && innerWidth >= 900 ? 'dex' : 'mobile') : 'desktop';
  }
  function applyDeviceProfile() {
    const pref = getPref(LS_DEVICE_PROFILE, 'auto');
    const mode = pref === 'auto' ? detectedDeviceProfile() : pref;
    // Configuração explícita, sem modificar User-Agent, pointer lock, gamepads ou touch.
    // O perfil de dispositivo é informativo; não reduz bitrate nem resolução.
    // A escolha do dispositivo não modifica a resolução definida pelo jogador.
    // Preserva 1080p/1080p HQ e não aplica 720p automaticamente.
    pushLog('device', 'Perfil ' + mode + ' aplicado (qualidade/limite SDP; próxima sessão)');
    update();
  }
  function cycleDeviceProfile() {
    const modes = ['auto', 'desktop', 'mobile', 'dex'];
    const next = modes[(modes.indexOf(getPref(LS_DEVICE_PROFILE, 'auto')) + 1) % modes.length];
    setPref(LS_DEVICE_PROFILE, next);
    pushLog('device', 'Perfil local ' + next + ' (não altera User-Agent nem controles)');
  }
  function cycleNxShortcut() {
    const modes = ['KeyH', 'KeyJ', 'KeyK'];
    const next = modes[(modes.indexOf(getPref(LS_NX_SHORTCUT, 'KeyH')) + 1) % modes.length];
    setPref(LS_NX_SHORTCUT, next);
    pushLog('shortcut', 'Atalho NX: Ctrl+Shift+' + next.slice(3));
  }
  // Respeita o pedido de áudio feito pelo próprio xCloud. Não inicia chat nem cria conexão.
  const nxVoiceTracks = new Set();
  let nxNativeGetUserMedia = null;
  let nxPttHeld = false;
  function applyVoiceMute() {
    const allowed = getPref(LS_MIC_MUTE, '0') !== '1' && (getPref(LS_MIC_PTT, '0') !== '1' || nxPttHeld);
    nxVoiceTracks.forEach(function (track) { if (track.readyState === 'live') track.enabled = allowed; });
  }
  document.addEventListener('keydown', function (e) {
    if (e.code !== 'KeyV' || e.repeat || e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    nxPttHeld = true; applyVoiceMute();
  }, true);
  document.addEventListener('keyup', function (e) { if (e.code === 'KeyV') { nxPttHeld = false; applyVoiceMute(); } }, true);
  window.addEventListener('blur', function () { nxPttHeld = false; applyVoiceMute(); });
  function installMicDeviceRouting() {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') return;
    const media = navigator.mediaDevices;
    const original = media.getUserMedia.bind(media);
    nxNativeGetUserMedia = original;
    if (media.getUserMedia.__nxMicRouter) return;
    const routed = function (constraints) {
      const selected = getPref(LS_MIC_DEVICE, '');
      const enabled = getPref(LS_MIC_ENABLED, '0') === '1';
      if (!enabled || !constraints || !constraints.audio) return original(constraints);
      const audio = constraints.audio === true ? {} : Object.assign({}, constraints.audio);
      // A escolha do usuário substitui somente o dispositivo, mantendo demais opções do site.
      if (selected) audio.deviceId = { ideal: selected };
      audio.noiseSuppression = getPref(LS_MIC_NOISE, '1') === '1';
      audio.echoCancellation = getPref(LS_MIC_ECHO, '1') === '1';
      audio.autoGainControl = getPref(LS_MIC_AGC, '1') === '1';
      const requested = Object.assign({}, constraints, { audio: audio });
      return original(requested).then(function (stream) {
        const track = stream.getAudioTracks()[0];
        if (track) { nxVoiceTracks.add(track); track.addEventListener('ended', function () { nxVoiceTracks.delete(track); }); applyVoiceMute(); }
        const settings = track && typeof track.getSettings === 'function' ? track.getSettings() : {};
        if (selected && settings.deviceId && settings.deviceId !== selected) {
          S.micStatus = 'O navegador escolheu outro microfone; dispositivo solicitado indisponível.';
        } else {
          S.micStatus = 'Captura de áudio iniciada com as preferências NX. Chat de voz não confirmado.';
        }
        return stream;
      });
    };
    try {
      Object.defineProperty(routed, '__nxMicRouter', { value: true });
      media.getUserMedia = routed;
    } catch (err) { S.micStatus = 'Roteamento indisponível: ' + String(err && err.name || err); }
  }
  installMicDeviceRouting();

  let micTestStream = null, micTestContext = null, micTestTimer = null;
  let micDeviceControl = null, micLevelControl = null, micGainNode = null, micBassNode = null;
  let micTrebleNode = null, micMonitorNode = null, micMonitorEnabled = false, micRequestId = 0;
  function applyMicEffects() {
    if (micGainNode) micGainNode.gain.value = Math.max(0, Math.min(2, Number(getPref(LS_MIC_GAIN, '100')) / 100));
    if (micBassNode) micBassNode.gain.value = Math.max(-12, Math.min(12, Number(getPref(LS_MIC_BASS, '0'))));
    if (micTrebleNode) micTrebleNode.gain.value = Math.max(-12, Math.min(12, Number(getPref(LS_MIC_TREBLE, '0'))));
  }
  function setMicMonitor(enabled) {
    micMonitorEnabled = !!enabled;
    if (micMonitorNode) micMonitorNode.gain.value = micMonitorEnabled ? 1 : 0;
    if (micMonitorEnabled && micTestContext) Promise.resolve(micTestContext.resume()).catch(function () {});
  }
  async function refreshMicDevices() {
    if (!micDeviceControl || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(function (d) { return d.kind === 'audioinput'; });
      const selected = getPref(LS_MIC_DEVICE, '');
      micDeviceControl.replaceChildren();
      const base = document.createElement('option'); base.value = ''; base.textContent = 'Microfone padrão do sistema'; micDeviceControl.appendChild(base);
      devices.forEach(function (d, i) {
        if (!d.deviceId) return;
        const opt = document.createElement('option'); opt.value = d.deviceId;
        opt.textContent = d.label || ('Entrada de áudio ' + (i + 1)); micDeviceControl.appendChild(opt);
      });
      micDeviceControl.value = Array.from(micDeviceControl.options).some(function (o) { return o.value === selected; }) ? selected : '';
    } catch (err) { S.micStatus = 'Não foi possível listar dispositivos: ' + String(err && err.name || err); update(); }
  }
  function stopMicrophoneTest() {
    micRequestId++;
    if (micTestTimer) { clearInterval(micTestTimer); micTestTimer = null; }
    if (micTestStream) { micTestStream.getTracks().forEach(function (t) { t.stop(); }); micTestStream = null; }
    if (micTestContext) { Promise.resolve(micTestContext.close()).catch(function () {}); micTestContext = null; }
    micGainNode = micBassNode = micTrebleNode = micMonitorNode = null;
    micMonitorEnabled = false;
    if (micLevelControl) micLevelControl.value = 0;
    S.micStatus = 'Teste encerrado. Nenhum áudio de teste é enviado ao jogo.';
    update();
  }
  async function inspectMicrophone() {
    if (getPref(LS_MIC_ENABLED, '0') !== '1') { S.micStatus = 'Ative o microfone antes do teste.'; update(); return; }
    stopMicrophoneTest();
    const request = micRequestId;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      S.micStatus = 'Captura indisponível: confira HTTPS e permissões'; update(); return;
    }
    S.micStatus = 'Solicitando permissão do microfone…'; update();
    try {
      const deviceId = getPref(LS_MIC_DEVICE, '');
      const constraints = {
        echoCancellation: getPref(LS_MIC_ECHO, '1') === '1',
        noiseSuppression: getPref(LS_MIC_NOISE, '1') === '1',
        autoGainControl: getPref(LS_MIC_AGC, '1') === '1'
      };
      if (deviceId) constraints.deviceId = { ideal: deviceId };
      const capture = nxNativeGetUserMedia || navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      const stream = await capture({ audio: constraints, video: false });
      if (request !== micRequestId || isInGame()) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      micTestStream = stream;
      await refreshMicDevices();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) { S.micStatus = 'Microfone autorizado; processamento de áudio indisponível'; update(); return; }
      const ctx = new AudioCtx(); micTestContext = ctx;
      const source = ctx.createMediaStreamSource(stream);
      micBassNode = ctx.createBiquadFilter(); micBassNode.type = 'lowshelf'; micBassNode.frequency.value = 180;
      micTrebleNode = ctx.createBiquadFilter(); micTrebleNode.type = 'highshelf'; micTrebleNode.frequency.value = 3000;
      micGainNode = ctx.createGain();
      const analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
      micMonitorNode = ctx.createGain(); micMonitorNode.gain.value = 0;
      source.connect(micBassNode); micBassNode.connect(micTrebleNode);
      micTrebleNode.connect(micGainNode); micGainNode.connect(analyser);
      analyser.connect(micMonitorNode); micMonitorNode.connect(ctx.destination);
      applyMicEffects(); setMicMonitor(false); // Monitor desligado por padrão para evitar realimentação.
      const samples = new Uint8Array(analyser.fftSize);
      const refresh = function () {
        if (micTestStream !== stream) return;
        analyser.getByteTimeDomainData(samples);
        let power = 0;
        for (let i = 0; i < samples.length; i++) { const v = (samples[i] - 128) / 128; power += v * v; }
        const level = Math.min(100, Math.round(Math.sqrt(power / samples.length) * 250));
        if (micLevelControl) micLevelControl.value = level;
        S.micStatus = 'Teste local ativo · nível ' + level + '% · processamento apenas na prévia';
        update();
      };
      refresh(); micTestTimer = setInterval(refresh, 350);
      stream.getAudioTracks().forEach(function (track) {
        track.addEventListener('ended', function () { if (micTestStream === stream) stopMicrophoneTest(); });
      });
    } catch (err) {
      if (request !== micRequestId) return;
      stopMicrophoneTest();
      S.micStatus = 'Falha ao acessar microfone: ' + String(err && (err.name || err.message) || err);
      update();
    }
  }
  function testPhoneVibration() {
    if (typeof navigator.vibrate !== 'function') {
      S.vibrationStatus = 'Vibração do celular indisponível neste navegador'; update(); return;
    }
    const strength = Math.max(0, Math.min(1, Number(getPref(LS_VIBRATION, '0.5')) || 0));
    // Vibration API permite duração, não intensidade física.
    const ok = navigator.vibrate(strength > 0 ? [Math.round(80 + 170 * strength), 70, Math.round(80 + 170 * strength)] : 0);
    S.vibrationStatus = ok ? 'Comando enviado ao celular (intensidade física não configurável)' : 'Navegador recusou vibração do celular';
    update();
  }
  async function testVibration() {
    let pads;
    try { pads = typeof navigator.getGamepads === 'function' ? Array.from(navigator.getGamepads() || []).filter(Boolean) : []; }
    catch (err) { S.vibrationStatus = 'Acesso aos controles bloqueado: ' + String(err && err.name || err); update(); return; }
    if (!pads.length) { S.vibrationStatus = 'Nenhum controle detectado. Pressione um botão do controle e tente novamente.'; update(); return; }
    const pad = pads.find(function (p) {
      return (p.vibrationActuator && (typeof p.vibrationActuator.playEffect === 'function' || typeof p.vibrationActuator.pulse === 'function')) ||
        (p.hapticActuators && p.hapticActuators[0] && typeof p.hapticActuators[0].pulse === 'function');
    });
    if (!pad) { S.vibrationStatus = 'Controle conectado, mas sem API de vibração exposta pelo navegador'; update(); return; }
    const strength = Math.max(0, Math.min(1, Number(getPref(LS_VIBRATION, '0.5')) || 0));
    if (!strength) { S.vibrationStatus = 'Intensidade 0%: selecione um valor acima de zero'; update(); return; }
    S.vibrationStatus = 'Enviando teste para ' + (pad.id || 'controle') + '…'; update();
    try {
      let result;
      if (pad.vibrationActuator && typeof pad.vibrationActuator.playEffect === 'function') {
        result = await pad.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0, duration: 400, strongMagnitude: strength, weakMagnitude: strength
        });
      } else if (pad.vibrationActuator && typeof pad.vibrationActuator.pulse === 'function') {
        result = await pad.vibrationActuator.pulse(strength, 400);
      } else {
        result = await pad.hapticActuators[0].pulse(strength, 400);
      }
      const accepted = result === true || result === 'complete' || result === undefined;
      S.vibrationStatus = accepted
        ? 'Teste solicitado ao controle (' + Math.round(strength * 100) + '%). Confirme se vibrou fisicamente.'
        : 'Teste não executado pelo navegador: ' + String(result);
    } catch (err) {
      S.vibrationStatus = 'Falha na vibração do controle: ' + String(err && (err.name || err.message) || err);
    }
    update();
  }
  // P04: preserve the host's original inline filter and restore it on bypass.
  // This is presentation-only CSS; no decoding, capture or frame copying.
  const nxVideoFilters = new WeakMap();
  function restoreVideoAdjustments(video) {
    if (!video) return;
    const state = nxVideoFilters.get(video);
    if (!state) return;
    if (video.style.filter === state.applied) {
      if (state.original) video.style.setProperty('filter', state.original, state.priority);
      else video.style.removeProperty('filter');
    }
    nxVideoFilters.delete(video);
  }
  const nxVideoFits = new WeakMap();
  function restoreVideoFit(video) {
    if (!video) return;
    const state = nxVideoFits.get(video);
    if (!state) return;
    if (video.style.objectFit === state.applied) {
      if (state.original) video.style.setProperty('object-fit', state.original, state.priority);
      else video.style.removeProperty('object-fit');
    }
    nxVideoFits.delete(video);
  }
  function applyVideoFit(video) {
    if (!video) return;
    const fit = getPref(LS_VIDEO_FIT, 'original');
    if (fit !== 'contain' && fit !== 'cover') { restoreVideoFit(video); return; }
    let state = nxVideoFits.get(video);
    if (state && video.style.objectFit !== state.applied) { nxVideoFits.delete(video); return; }
    if (!state) {
      state = { original: video.style.getPropertyValue('object-fit'),
        priority: video.style.getPropertyPriority('object-fit'), applied: fit };
      nxVideoFits.set(video, state);
    }
    state.applied = fit;
    video.style.setProperty('object-fit', fit, state.priority);
  }
  // Uma unica cadeia de filtros substituida a cada ajuste; nunca empilhar camadas.
  // Brilho/contraste/saturacao sao controles CSS, nao equalizacao independente de
  // brancos/pretos nem sharpening real.
  // Perfis portateis: somente dados numericos e metadados, nunca codigo executavel.
  const NX_VISUAL_FORMAT='nx-visual-preset';
  const NX_VISUAL_DEFAULT={brightness:100,contrast:100,saturation:100};
  function nxVisualSanitize(input){
    if(!input || typeof input!=='object' || Array.isArray(input))throw new Error('Perfil invalido');
    if(input.format!==NX_VISUAL_FORMAT || input.version!==1)throw new Error('Formato de perfil incompativel');
    const name=String(input.name||'').trim();
    if(!name || name.length>64)throw new Error('Nome deve ter entre 1 e 64 caracteres');
    const author=String(input.author||'Comunidade').trim().slice(0,48);
    const values=input.settings;
    if(!values || typeof values!=='object' || Array.isArray(values))throw new Error('Ajustes ausentes');
    const limits={brightness:[85,115],contrast:[85,115],saturation:[75,125]};
    const clean={};
    for(const key of Object.keys(limits)){
      const n=values[key];
      if(typeof n!=='number' || !Number.isFinite(n) || n<limits[key][0] || n>limits[key][1])
        throw new Error('Valor invalido: '+key);
      clean[key]=Math.round(n);
    }
    return {format:NX_VISUAL_FORMAT,version:1,name,author,settings:clean};
  }
  function nxVisualLibrary(){
    try{
      const parsed=JSON.parse(getPref(LS_VISUAL_LIBRARY,'[]'));
      if(!Array.isArray(parsed))return [];
      return parsed.slice(0,24).map(function(x){try{return nxVisualSanitize(x);}catch(_){return null;}}).filter(Boolean);
    }catch(_){return [];}
  }
  function nxVisualApply(preset){
    const safe=nxVisualSanitize(preset);
    setPref(LS_VIDEO_BRIGHTNESS,String(safe.settings.brightness));
    setPref(LS_VIDEO_CONTRAST,String(safe.settings.contrast));
    setPref(LS_VIDEO_SATURATION,String(safe.settings.saturation));
    setPref(LS_VIDEO_PROFILE,'custom');
    setPref(LS_VISUAL_ACTIVE,safe.name);
    applyVideoAdjustments(activeStreamVideo());
    return safe;
  }
  function nxVisualSave(name){
    const cal=nxVideoCalibration();
    const safe=nxVisualSanitize({format:NX_VISUAL_FORMAT,version:1,name,
      author:'Local',settings:{brightness:cal.brightness,contrast:cal.contrast,saturation:cal.saturation}});
    const library=nxVisualLibrary().filter(function(x){return x.name!==safe.name;});
    library.unshift(safe);
    setPref(LS_VISUAL_LIBRARY,JSON.stringify(library.slice(0,24)));
    setPref(LS_VISUAL_ACTIVE,safe.name);
    return safe;
  }
  function nxVisualExport(preset){
    const safe=nxVisualSanitize(preset);
    const blob=new Blob([JSON.stringify(safe,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='nx-visual-'+safe.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  function nxVisualImport(file){
    if(!file || file.size>16384){toast('Arquivo invalido ou maior que 16 KB');return;}
    const reader=new FileReader();
    reader.onload=function(){
      try{
        const parsed=JSON.parse(String(reader.result||''));
        const safe=nxVisualSanitize(parsed);
        const library=nxVisualLibrary().filter(function(x){return x.name!==safe.name;});
        library.unshift(safe);
        setPref(LS_VISUAL_LIBRARY,JSON.stringify(library.slice(0,24)));
        nxVisualApply(safe);
        toast('Perfil importado: '+safe.name);
        renderBody();
      }catch(e){toast('Importacao rejeitada: '+String(e.message||e));}
    };
    reader.onerror=function(){toast('Falha ao ler arquivo');};
    reader.readAsText(file);
  }
  function nxVideoCalibration(){
    const profile=getPref(LS_VIDEO_PROFILE,'original');
    const presets={
      original:{brightness:100,contrast:100,saturation:100},
      balanced:{brightness:100,contrast:102,saturation:104},
      vivid:{brightness:100,contrast:105,saturation:108}
    };
    if(presets[profile])return presets[profile];
    const clamp=function(key,min,max,def){
      const value=Number(getPref(key,String(def)));
      return Number.isFinite(value)?Math.max(min,Math.min(max,value)):def;
    };
    return {
      brightness:clamp(LS_VIDEO_BRIGHTNESS,85,115,100),
      contrast:clamp(LS_VIDEO_CONTRAST,85,115,100),
      saturation:clamp(LS_VIDEO_SATURATION,75,125,100)
    };
  }
  // GPU opt-in: canvas WebGL2 de apresentacao, sem modificar o stream original.
  // Falhas de CORS, DRM ou contexto grafico restauram o video nativo.
  let nxGpu=null;
  function nxGpuStop(){
    const state=nxGpu;nxGpu=null;
    if(!state)return;
    state.running=false;
    if(state.raf)cancelAnimationFrame(state.raf);
    if(state.video && state.video.style.opacity===state.appliedOpacity){
      if(state.originalOpacity)state.video.style.setProperty('opacity',state.originalOpacity,state.opacityPriority);
      else state.video.style.removeProperty('opacity');
    }
    if(state.canvas)state.canvas.remove();
    if(state.video && state.video.isConnected && getPref(LS_NX_GPU,'0')==='0')applyVideoAdjustments(state.video);
    if(state.gl){
      try{state.gl.deleteTexture(state.texture);state.gl.deleteBuffer(state.buffer);
        state.gl.deleteProgram(state.program);}catch(_){}
    }
  }
  function nxGpuCompile(gl,type,source){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      const reason=gl.getShaderInfoLog(shader)||'Shader invalido';gl.deleteShader(shader);throw new Error(reason);
    }
    return shader;
  }
  function nxGpuStart(video){
    if(!video || !video.videoWidth || !video.videoHeight)return;
    if(nxGpu && nxGpu.video===video)return;
    nxGpuStop();
    const canvas=document.createElement('canvas');
    canvas.setAttribute('aria-hidden','true');
    canvas.style.cssText='position:fixed;pointer-events:none;display:block;z-index:100;object-fit:fill;';
    const host=fullscreenHost()||document.body;
    if(!host)return;
    const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:false});
    if(!gl){S.lastErr='GPU: WebGL2 indisponivel';return;}
    let program,texture,buffer;
    try{
      const vert=nxGpuCompile(gl,gl.VERTEX_SHADER,`#version 300 es
in vec2 a_pos;out vec2 v_uv;
void main(){v_uv=vec2((a_pos.x+1.0)*0.5,1.0-(a_pos.y+1.0)*0.5);gl_Position=vec4(a_pos,0.0,1.0);}`);
      const frag=nxGpuCompile(gl,gl.FRAGMENT_SHADER,`#version 300 es
precision mediump float;
uniform sampler2D u_tex;uniform float u_shadows;uniform float u_highlights;
uniform vec3 u_adjust;uniform int u_clarityMode;uniform float u_clarityStrength;in vec2 v_uv;out vec4 outColor;
void main(){
 vec3 c=texture(u_tex,v_uv).rgb;
 vec3 up=texture(u_tex,v_uv+vec2(0.0,1.0/float(textureSize(u_tex,0).y))).rgb;
 vec3 down=texture(u_tex,v_uv-vec2(0.0,1.0/float(textureSize(u_tex,0).y))).rgb;
 vec3 left=texture(u_tex,v_uv-vec2(1.0/float(textureSize(u_tex,0).x),0.0)).rgb;
 vec3 right=texture(u_tex,v_uv+vec2(1.0/float(textureSize(u_tex,0).x),0.0)).rgb;
 vec3 minimum=min(min(up,down),min(left,right));
 vec3 maximum=max(max(up,down),max(left,right));
 float detail=clamp(dot(maximum-minimum,vec3(0.3333)),0.0,1.0);
 if(u_clarityMode==1)c=clamp(c+(4.0*c-up-down-left-right)*(u_clarityStrength*0.20),0.0,1.0);
 else if(u_clarityMode==2){
  vec3 mn=min(min(min(up,down),min(left,right)),c);
  vec3 mx=max(max(max(up,down),max(left,right)),c);
  vec3 amp=clamp(min(mn,2.0-mx)/max(mx,vec3(0.0001)),0.0001,1.0);
  vec3 w=-1.0/(inversesqrt(amp)*5.6);
  vec3 enhanced=clamp(((up+down+left+right)*w+c)/(4.0*w+1.0),0.0,1.0);
  c=mix(c,enhanced,u_clarityStrength*0.5);
 }
 float l=dot(c,vec3(0.2126,0.7152,0.0722));
 float shadows=(1.0-smoothstep(0.08,0.55,l))*u_shadows*0.22;
 float highlights=smoothstep(0.45,0.95,l)*u_highlights*0.20;
 c=clamp(c+vec3(shadows+highlights),0.0,1.0);
 c=clamp((c-0.5)*u_adjust.y+0.5,0.0,1.0)*u_adjust.x;
 float grey=dot(c,vec3(0.2126,0.7152,0.0722));
 c=clamp(mix(vec3(grey),c,u_adjust.z),0.0,1.0);
 outColor=vec4(c,1.0);
}`);
      program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
      gl.deleteShader(vert);gl.deleteShader(frag);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Link shader falhou');
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      gl.useProgram(program);
      const attr=gl.getAttribLocation(program,'a_pos');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(program,'u_tex'),0);
      const state={video,canvas,gl,program,buffer,texture,host,running:true,raf:0,
        originalOpacity:video.style.getPropertyValue('opacity'),
        opacityPriority:video.style.getPropertyPriority('opacity'),appliedOpacity:'0'};
      nxGpu=state;host.appendChild(canvas);
      const render=function(){
        if(!state.running || nxGpu!==state)return;
        if(getPref(LS_NX_GPU,'0')!=='1' || document.visibilityState==='hidden' ||
           !video.isConnected || !video.videoWidth || !video.videoHeight){
          nxGpuStop();return;
        }
        const parent=fullscreenHost()||document.body;
        if(parent!==state.host){state.host=parent;parent.appendChild(canvas);}
        const rect=video.getBoundingClientRect();
        if(rect.width<10||rect.height<10){state.raf=requestAnimationFrame(render);return;}
        const hostRect=parent===document.body?{left:0,top:0}:parent.getBoundingClientRect();
        canvas.style.left=(rect.left-hostRect.left)+'px';
        canvas.style.top=(rect.top-hostRect.top)+'px';
        canvas.style.width=rect.width+'px';canvas.style.height=rect.height+'px';
        const w=Math.min(1920,Math.max(1,Math.round(rect.width)));
        const h=Math.min(1080,Math.max(1,Math.round(rect.height)));
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
        try{
          gl.bindTexture(gl.TEXTURE_2D,texture);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
          const cal=nxVideoCalibration();
          gl.uniform3f(gl.getUniformLocation(program,'u_adjust'),cal.brightness/100,cal.contrast/100,cal.saturation/100);
          const clamp=function(key){const n=Number(getPref(key,'0'));return Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;};
           const clarityMode=getPref('nx.gpu.clarity.mode.v1','off');
           const clarityRaw=Number(getPref('nx.gpu.clarity.strength.v1','35'));
           gl.uniform1i(gl.getUniformLocation(program,'u_clarityMode'),clarityMode==='usm'?1:clarityMode==='cas'?2:0);
           gl.uniform1f(gl.getUniformLocation(program,'u_clarityStrength'),Number.isFinite(clarityRaw)?Math.max(0,Math.min(100,clarityRaw))/100:0.35);
          gl.uniform1f(gl.getUniformLocation(program,'u_shadows'),clamp(LS_NX_SHADOWS));
          gl.uniform1f(gl.getUniformLocation(program,'u_highlights'),clamp(LS_NX_HIGHLIGHTS));
          gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
          restoreVideoAdjustments(video); // GPU substitui CSS: nunca processar duas vezes.
          if(video.style.opacity!==state.appliedOpacity)video.style.setProperty('opacity','0',state.opacityPriority);
        }catch(e){
          S.lastErr='GPU desativada: '+String(e&&e.message||e);
          setPref(LS_NX_GPU,'0');nxGpuStop();return;
        }
        state.raf=requestAnimationFrame(render);
      };
      canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();setPref(LS_NX_GPU,'0');nxGpuStop();});
      state.raf=requestAnimationFrame(render);
    }catch(e){
      S.lastErr='GPU: '+String(e&&e.message||e);
      try{if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);}catch(_){}
      canvas.remove();
    }
  }
  function nxGpuSync(){
    const video=activeStreamVideo();
    if(getPref(LS_NX_GPU,'0')==='1' && video && document.visibilityState!=='hidden')nxGpuStart(video);
    else nxGpuStop();
    if(video)applyVideoAdjustments(video);
  }
  function applyVideoAdjustments(video) {
    if(!video)return;
    if(getPref(LS_VIDEO_ECO,'1')==='1' && document.visibilityState==='hidden'){
      restoreVideoAdjustments(video);return;
    }
    if(getPref(LS_NX_GPU,'0')==='1' && nxGpu && nxGpu.video===video){restoreVideoAdjustments(video);return;}
    const cal=nxVideoCalibration();
    if(cal.brightness===100 && cal.contrast===100 && cal.saturation===100){
      restoreVideoAdjustments(video);return;
    }
    let state=nxVideoFilters.get(video);
    if(state && video.style.filter!==state.applied){
      // Se o site mudou o filtro, nao anexar filtros a um resultado anterior do NX.
      nxVideoFilters.delete(video);
      return;
    }
    if(!state){
      state={original:video.style.getPropertyValue('filter'),
        priority:video.style.getPropertyPriority('filter'),applied:''};
      nxVideoFilters.set(video,state);
    }
    const adjustment='brightness('+(cal.brightness/100).toFixed(3)+
      ') contrast('+(cal.contrast/100).toFixed(3)+
      ') saturate('+(cal.saturation/100).toFixed(3)+')';
    state.applied=(state.original&&state.original!=='none'?state.original+' ':'')+adjustment;
    video.style.setProperty('filter',state.applied,state.priority);
  }
  function cycleSharpness() {
    // Compatibilidade com atalho legado: ajuste suave de contraste, nao nitidez.
    const video=activeStreamVideo();
    if(!video){S.lastErr='Ajuste visual: video nao encontrado';update();return;}
    const cal=nxVideoCalibration();
    setPref(LS_VIDEO_BRIGHTNESS,String(cal.brightness));
    setPref(LS_VIDEO_SATURATION,String(cal.saturation));
    setPref(LS_VIDEO_CONTRAST,String(cal.contrast>=105?100:cal.contrast+2));
    setPref(LS_VIDEO_PROFILE,'custom');
    applyVideoAdjustments(video);
    pushLog('video','Contraste suave atualizado; sem nitidez artificial');
  }
  function inspectServerMeasurements() {
    const names = Object.keys(S.latencyByServer).filter(function (name) { const item = S.latencyByServer[name]; return item && item.at && Date.now() - item.at < 24 * 3600 * 1000 && item.samples >= 5; });
    S.serverProbeStatus = names.length ? names.length + ' servidor(es) medido(s) em sessões; sondagem prévia não disponível' : 'Nenhum servidor medido; sondagem prévia não disponível';
    update();
  }
  function inspectRemotePlay() {
    S.remotePlayStatus = nxRemotePlay.sessionStatus==='connected'
      ? 'Sessão xHome conectada; gamepad e teclado/mouse físicos experimentais, mídia ainda não homologada.'
      : 'Sessão xHome: '+String(nxRemotePlay.status||'não conectada');
    update();
  }
  function cycleVideoFilter() {
    const video=activeStreamVideo();
    if(!video){S.lastErr='Filtro: video nao encontrado';schedule();return;}
    const cal=nxVideoCalibration();
    setPref(LS_VIDEO_BRIGHTNESS,String(cal.brightness));
    setPref(LS_VIDEO_CONTRAST,String(cal.contrast));
    setPref(LS_VIDEO_SATURATION,String(cal.saturation>=110?100:cal.saturation+5));
    setPref(LS_VIDEO_PROFILE,'custom');
    applyVideoAdjustments(video);
    pushLog('video','Saturacao CSS atualizada; filtro unico');
  }
  function captureStreamFrame() {
    const video = activeStreamVideo();
    if (!video || !video.videoWidth || !video.videoHeight) { S.lastErr = 'Captura: vídeo indisponível'; schedule(); return; }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D indisponível');
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(function (blob) {
        if (!blob) { S.lastErr = 'Captura bloqueada ou indisponível'; schedule(); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'nimboxcloud-' + Date.now() + '.png';
        a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      }, 'image/png');
    } catch (err) { S.lastErr = 'Captura: ' + String(err && err.message || err); schedule(); }
  }
  let nxAudioGraph = null;
  const nxAudioGraphs = new WeakMap();
  function getAudioBands() {
    try { const a = JSON.parse(getPref(LS_AUDIO_BANDS,'[0,0,0,0,0,0,0,0,0,0]'));
      if (Array.isArray(a) && a.length === 10) return a.map(function (n) { return Math.max(-12,Math.min(12,Number(n)||0)); });
    } catch (e) {} return [0,0,0,0,0,0,0,0,0,0];
  }
  function nxAudioOutputSupport(){
    const media=activeStreamAudio();
    const graph=nxAudioGraph && nxAudioGraph.media===media ? nxAudioGraph : null;
    return {media:media,graph:graph,
      canRoute:!!(graph && typeof graph.ctx.setSinkId==='function' ||
        !graph && media && typeof media.setSinkId==='function'),
      bluetoothNative:/Android/i.test(navigator.userAgent)};
  }
  function applyAudioOutput(){
    const status=nxAudioOutputSupport(),sink=getPref(LS_AUDIO_OUTPUT,'');
    if(!status.media)return;
    const target=status.graph?status.graph.ctx:status.media;
    if(typeof target.setSinkId!=='function'){
      if(sink)S.lastErr='Saida manual indisponivel: selecione o Bluetooth no sistema Android';
      return;
    }
    // ID vazio representa a saida padrao do sistema, inclusive fones Bluetooth.
    Promise.resolve(target.setSinkId(sink)).catch(function(e){
      S.lastErr='Saida de audio: '+String(e&&e.name||e);
    });
  }
  function applyAudioProcessing() {
    const media = activeStreamAudio(); if (!media) return;
    if(nxAudioGraph && nxAudioGraph.media!==media){
      const previous=nxAudioGraph;
      // O MediaElementSource continua ligado ao destino para nao silenciar a fonte antiga.
      previous.filters.forEach(function(node){node.gain.value=0;});
      previous.dialogue.gain.value=0;
      previous.bypass.gain.value=1;previous.compressed.gain.value=0;previous.limited.gain.value=0;
      nxAudioGraph=nxAudioGraphs.get(media)||null;
    }
    const enabled = getPref(LS_AUDIO_FX,'0') === '1';
    if (!enabled && !nxAudioGraph) return;
    try {
      if (!nxAudioGraph) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { S.lastErr = 'Web Audio não suportado'; return; }
        const ctx = new AC(), source = ctx.createMediaElementSource(media);
        const filters = [32,64,125,250,500,1000,2000,4000,8000,16000].map(function (hz,i) {
          const n = ctx.createBiquadFilter(); n.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking';
          n.frequency.value = Math.min(hz,ctx.sampleRate*0.45); n.Q.value = 1; return n;
        });
        const dialogue = ctx.createBiquadFilter(); dialogue.type = 'peaking'; dialogue.frequency.value = 2400; dialogue.Q.value = 0.75;
        const monoSplitter = ctx.createChannelSplitter(2), monoMix = ctx.createGain(); monoMix.gain.value = 0.5;
        const monoMerger = ctx.createChannelMerger(2), stereoGain = ctx.createGain(), monoGain = ctx.createGain();
        const pan = ctx.createStereoPanner(), compressor = ctx.createDynamicsCompressor(), limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -4; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.003;
        const bypass = ctx.createGain(), compressed = ctx.createGain(), limited = ctx.createGain(), compToLimit = ctx.createGain(), directToLimit = ctx.createGain();
        const analyser=ctx.createAnalyser();analyser.fftSize=1024;
        source.connect(analyser);
        let prev = analyser; filters.forEach(function (node) { prev.connect(node); prev = node; }); prev.connect(dialogue);
        dialogue.connect(stereoGain); stereoGain.connect(pan);
        dialogue.connect(monoSplitter); monoSplitter.connect(monoMix,0); monoSplitter.connect(monoMix,1);
        monoMix.connect(monoMerger,0,0); monoMix.connect(monoMerger,0,1); monoMerger.connect(monoGain); monoGain.connect(pan);
        pan.connect(bypass); bypass.connect(ctx.destination);
        pan.connect(compressor); compressor.connect(compressed); compressed.connect(ctx.destination);
        pan.connect(directToLimit); directToLimit.connect(limiter);
        compressor.connect(compToLimit); compToLimit.connect(limiter);
        limiter.connect(limited); limited.connect(ctx.destination);
        nxAudioGraph = {media:media,ctx:ctx,source:source,analyser:analyser,filters:filters,dialogue:dialogue,pan:pan,compressor:compressor,limiter:limiter,
          stereoGain:stereoGain,monoGain:monoGain,bypass:bypass,compressed:compressed,limited:limited,
          compToLimit:compToLimit,directToLimit:directToLimit};
        nxAudioGraphs.set(media,nxAudioGraph);
        applyAudioOutput();
      }
      const g = nxAudioGraph;
      getAudioBands().forEach(function (n,i) { g.filters[i].gain.value = enabled ? n : 0; });
      g.dialogue.gain.value = enabled && getPref(LS_AUDIO_DIALOG,'0') === '1' ? 4 : 0;
      const mono = enabled && getPref(LS_AUDIO_MONO,'0') === '1'; g.stereoGain.gain.value = mono ? 0 : 1; g.monoGain.gain.value = mono ? 1 : 0;
      g.pan.pan.value = enabled ? Math.max(-1,Math.min(1,Number(getPref(LS_AUDIO_BALANCE,'0'))/100)) : 0;
      const compress = enabled && (getPref(LS_AUDIO_COMP,'0') === '1' || getPref(LS_AUDIO_NORMAL,'0') === '1');
      const limit = enabled && getPref(LS_AUDIO_LIMIT,'0') === '1';
      g.compressor.threshold.value = getPref(LS_AUDIO_NORMAL,'0') === '1' ? -30 : -24;
      g.compressor.ratio.value = getPref(LS_AUDIO_NORMAL,'0') === '1' ? 2 : 3;
      g.bypass.gain.value = !compress && !limit ? 1 : 0;
      g.compressed.gain.value = compress && !limit ? 1 : 0;
      g.limited.gain.value = limit ? 1 : 0;
      g.compToLimit.gain.value = limit && compress ? 1 : 0;
      g.directToLimit.gain.value = limit && !compress ? 1 : 0;
      Promise.resolve(g.ctx.resume()).then(function(){
        if(g.ctx.state!=='running')S.lastErr='Audio suspenso: toque em Ativar audio no painel NX';
      }).catch(function(e){S.lastErr='Audio suspenso: '+String(e&&e.message||e);});
    } catch (e) { S.lastErr = 'Web Audio: '+String(e && e.name || e); }
  }
  function nxAudioSignalStatus(){
    const media=activeStreamAudio(),g=nxAudioGraph;
    if(!media)return 'Fluxo de audio nao detectado';
    if(!g || g.media!==media)return 'EQ nao conectado ao fluxo';
    if(g.ctx.state!=='running')return 'AudioContext '+g.ctx.state+' — processamento inativo';
    if(!g.analyser)return 'Sem medicao de sinal';
    const samples=new Uint8Array(g.analyser.fftSize);
    g.analyser.getByteTimeDomainData(samples);
    let energy=0;
    for(let i=0;i<samples.length;i++){const v=(samples[i]-128)/128;energy+=v*v;}
    const rms=Math.sqrt(energy/samples.length);
    return 'Web Audio running · sinal '+(rms>0.002?'detectado':'nao detectado/silencio')+
      ' · '+(getPref(LS_AUDIO_FX,'0')==='1'?'EQ ativo':'bypass');
  }
  function activeStreamAudio() {
    const media=Array.from(document.querySelectorAll('video,audio'));
    const candidates=media.filter(function(v){
      const stream=v.srcObject;
      if(stream && typeof stream.getAudioTracks==='function')return stream.getAudioTracks().some(function(t){return t.readyState==='live';});
      return !!(v.currentSrc && v.currentSrc.startsWith('blob:'));
    });
    const playable=candidates.filter(function(v){return !v.paused && !v.ended && v.readyState>=2;});
    return playable.find(function(v){return v.srcObject && v.srcObject.getAudioTracks && v.srcObject.getAudioTracks().length;})
      || playable[0] || candidates[0] || null;
  }
  function activeStreamVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    const candidates = videos.filter(function (v) { return v.srcObject || (v.currentSrc && v.currentSrc.startsWith('blob:')); });
    return candidates.find(function (v) { return v.readyState >= 2 && !v.paused; }) || candidates[0] || null;
  }
  function adjustVolume(delta) {
    const video = activeStreamAudio();
    if (!video) { S.lastErr = 'Volume: vídeo de streaming não encontrado'; schedule(); return; }
    const next = Math.max(0, Math.min(1, Math.round((video.volume + delta) * 10) / 10));
    video.volume = next;
    video.muted = false;
    setPref(LS_VOLUME, String(next));
    schedule();
  }
  function toggleMute() {
    const video = activeStreamAudio();
    if (!video) { S.lastErr = 'Volume: vídeo de streaming não encontrado'; schedule(); return; }
    video.muted = !video.muted;
    schedule();
  }

  function boot() {
    startInputDiagnostics();
    nxSampleGamepads();
    nxStartGamepadUiLoop();
    setInterval(function () {
      nxInputBridgeStatus();
      if (document.visibilityState === 'visible') nxSampleGamepads();
    }, 750);
    S.diagnosticsWarnings = [
      'RTT: apenas sessões usadas; sondagem ativa não implementada',
      'Contraste adicional: filtro CSS, não é nitidez real nem CAS',
      'Microfone: teste de captura local com permissão; transmissão ao jogo depende do xCloud',
      'Vibração: testes locais de controle e celular; sem remapeamento do feedback do streaming',
      'Remote Play: xHome experimental; gamepad e teclado/mouse físicos encaminhados sem homologação em Xbox real; mídia e HUD de toque aguardam validação'
    ];
    S.deviceDetected = detectedDeviceProfile();
    // Observa apenas eventos relevantes; não coleta corpos de API, cookies ou tokens.
    let labLastPath = location.pathname;
    let labLastWarning = false;
    setInterval(function () {
      if (location.pathname !== labLastPath) {
        labLastPath = location.pathname;
        nxConsoleLabEvent('navigation', labLastPath);
      }
      const warning = nxConsoleLabWarning();
      if (warning !== labLastWarning) {
        labLastWarning = warning;
        nxConsoleLabEvent(warning ? 'unsupported-device-warning' : 'warning-dismissed',
          warning ? 'Diálogo de incompatibilidade exibido' : 'Diálogo ausente');
      }
    }, 1200);
    document.addEventListener('keydown',function(e){
      if(!e.isTrusted||e.repeat)return;
      const target=e.target;
      if(!nxCaptureKeys&&target&&(target.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))return;
      nxKeysHeld.add(e.code);
      if(nxCaptureKeys){
        e.preventDefault();e.stopImmediatePropagation();
        const active=Array.from(nxKeysHeld);
        if(active.length>4){nxCaptureKeys.label.textContent='Máximo de 4 teclas simultâneas. Solte e tente novamente.';nxCaptureKeys.best=[];}
        else if(active.length>=nxCaptureKeys.best.length){
          nxCaptureKeys.best=active;
          nxCaptureKeys.label.textContent=nxBindingLabel(active)+' — solte para salvar';
        }
        return;
      }
      const bind=nxKeyBinding();const matched=!!bind&&bind.every(function(code){return nxKeysHeld.has(code);});
      if(matched&&!nxKeyboardComboActive){nxKeyboardComboActive=true;e.preventDefault();e.stopImmediatePropagation();setOpen(!openUI,true);}
    },true);
    document.addEventListener('keyup',function(e){
      nxKeysHeld.delete(e.code);
      if(nxCaptureKeys){
        e.preventDefault();e.stopImmediatePropagation();
        if(nxKeysHeld.size===0&&nxCaptureKeys.best.length){
          setPref(NX_KEY_BIND_KEY,JSON.stringify(nxCaptureKeys.best));
          nxCaptureKeys=null;renderBody();
        }
      }
      const bind=nxKeyBinding();if(!bind||!bind.every(function(code){return nxKeysHeld.has(code);}))nxKeyboardComboActive=false;
    },true);
    window.addEventListener('blur',function(){nxKeysHeld.clear();nxKeyboardComboActive=false;});
    document.addEventListener('keydown', function (e) {
      if (!e.isTrusted || !e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey || e.repeat) return;
      const a = document.activeElement;
      if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
      // O atalho configurável é processado pelo gerenciador de combinações abaixo.
      if (e.code === 'KeyD') { e.preventDefault(); console.log('[NX diagnostic]', { qos: S.qos, history: S.qosHistory, diagnosis: S.lastDiagnosis }); }
    }, false);
    // Reaplicar volume salvo apenas quando um elemento de vídeo de streaming existir.
    let lastVolumeAudio = null, lastAdjustedVideo = null;
    setInterval(function () {
      const audio = activeStreamAudio();
      if (audio && audio !== lastVolumeAudio) {
        lastVolumeAudio = audio;
        const stored = Number(getPref(LS_VOLUME, '1'));
        if (Number.isFinite(stored)) audio.volume = Math.max(0, Math.min(1, stored));
      }
      if(audio && getPref(LS_AUDIO_FX,'0')==='1' && (!nxAudioGraph || nxAudioGraph.media!==audio))applyAudioProcessing();
      const video = activeStreamVideo();
      if(getPref(LS_NX_GPU,'0')==='1' && video)nxGpuStart(video);
      else if(nxGpu)nxGpuStop();
      if (video !== lastAdjustedVideo) {
        restoreVideoAdjustments(lastAdjustedVideo);
        restoreVideoFit(lastAdjustedVideo);
        lastAdjustedVideo = video;
        applyVideoAdjustments(video);
        applyVideoFit(video);
      } else if (video && !nxVideoFilters.has(video) &&
                 (['balanced', 'vivid'].includes(getPref(LS_VIDEO_PROFILE, 'original')) ||
                  (getPref(LS_VIDEO_PROFILE, 'custom') === 'custom' &&
                   (getPref(LS_VIDEO_COLOR, '0') !== '0' || getPref(LS_SHARPNESS, '0') !== '0')))) {
        // Reapply when the stream element persists but the host has reset its style.
        applyVideoAdjustments(video);
      }
    }, 2500);
    document.addEventListener('visibilitychange', function () {
      const video = activeStreamVideo();
      if (video) applyVideoAdjustments(video);
      nxGpuSync();
    });
    buildUI();
    update();
    tick();
    // O site pode substituir o body durante a inicializacao do React.
    // Recria/reataca o painel quando a arvore de documentos muda.
    let recoveryQueued = false;
    const panelObserver = new MutationObserver(function () {
      if (recoveryQueued) return;
      // Nao reagir a cada mudanca de React: so recuperar quando o NX perdeu o host.
      const host = mountTarget();
      if (wrap && wrap.isConnected && wrap.parentNode === host) return;
      recoveryQueued = true;
      queueMicrotask(function () {
        recoveryQueued = false;
        try {
          const target = mountTarget();
          if (!target) return;
          if (!wrap || !wrap.isConnected) buildUI();
          if (wrap && wrap.parentNode !== target) target.appendChild(wrap);
          if (wrap && wrap.isConnected) { S.nxRecoveries++; syncNXPlacement(); }
        } catch (err) { S.lastErr = 'NX recovery: ' + String(err); }
      });
    });
    panelObserver.observe(document.documentElement, { childList: true, subtree: true });
    // Recuperacao periodica: React pode recriar a barra sem emitir mudancas no root.
    // Nao depende da deteccao de perfil para manter o NX acessivel.
    // Atalho de recuperacao do painel para navegadores com teclado.
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyN') { e.preventDefault(); resetPos(); setOpen(true, true); }
    }, false);
    // Ao entrar/sair da tela cheia, move o painel imediatamente para o novo host, sem depender do tick de 1,5s
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        try {
          const host = mountTarget();
          if (wrap && host) host.appendChild(wrap);
          // Recalcular no mesmo frame: não esperar o tick periódico para revelar o fallback.
          syncNXPlacement();
        } catch (e) { }
      }, true);
    });
    setInterval(tick, 1500);
    window.addEventListener('popstate', tick);
    window.addEventListener('resize', tick);
    window.addEventListener('orientationchange', tick, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', tick, { passive: true });
    tick();
    setInterval(pumpQos, 2000);
    console.log('[xcu] v' + VER + ' iniciado | data center', srvCfg().label, '| IPv4', v4on(), '| qualidade', resCfg().label);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
