// ==UserScript==
// @name         NimboXcloud | Região, Streaming e Diagnóstico
// @namespace    https://github.com/breno-bgod/NimboXcloud
// @version      3.6.45
// @description  Deixa o play.xbox.com utilizável em regiões restritas: reescreve a verificação de mercado e os cabeçalhos, e oferece ajustes de streaming (data center / forçar IPv4 / qualidade) com um mini medidor de QoS
// @author       KReight
// @license      MIT
// @match        https://play.xbox.com/*
// @run-at       document-start
// @grant        none
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

  const VER = '3.6.45';
  const LS_KEY = 'xcu.region';       // região de desbloqueio (IP)
  const LS_SRV = 'xcu.streamRegion'; // data center de streaming
  const LS_V4 = 'xcu.forceIPv4';     // forçar IPv4
  const LS_RES = 'xcu.resolution';   // faixa de qualidade
  const LS_BITRATE = 'xcu.maxBitrateMbps'; // limite opcional de bitrate SDP
  const LS_VOLUME = 'xcu.volume'; // volume local do elemento de video
  const LS_AUTO_BEST = 'xcu.autoBestMeasured';
  const LS_NX_DIAG = 'xcu.diagnostics';
  const LS_DEVICE_PROFILE = 'xcu.deviceProfile';
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
  const LS_SHARPNESS = 'xcu.sharpness';
  const LS_VIDEO_COLOR = 'xcu.videoColor';

  // Ícone da marca (caveira N em chamas, branco, fundo transparente). Usado pelo único botão do NX.
  const BRAND_ICON = 'data:image/png;base64,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';

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
    r720: { osName: 'android', label: '720p' }
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
    return BITRATE_MODES[getPref(LS_BITRATE, 'auto')] || BITRATE_MODES.auto;
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
    const selected = getPref(LS_RES, 'auto');
    // Migrar a antiga opcao 1080p duplicada para o perfil unico.
    return RES_MODES[selected === 'r1080' ? 'auto' : selected] || RES_MODES.auto;
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
    if (!r.osName) return Promise.resolve({ input: input, init: init });
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
        j.settings.osName = r.osName;
        const h = new Headers(req.headers);
        h.delete('content-length');
        // Preserve x-ms-device-info original: o dispositivo e suas capacidades
        // (incluindo toque) nao podem ser mascarados como Tizen/Windows.
        S.resApplied = r.label;
        S.playPatched++;
        addCap({
          at: nowStr(), method: 'PATCH', host: abs.host, path: abs.pathname, status: 0,
          type: 'patched', body: 'settings.osName -> ' + r.osName + ' (' + r.label + ')'
        });
        return {
          input: abs.href,
          init: {
            method: req.method,
            headers: h,
            body: JSON.stringify(j),
            mode: req.mode, credentials: req.credentials, cache: req.cache,
            redirect: req.redirect, referrer: req.referrer, integrity: req.integrity
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
            if (c.ip && injectable(u.pathname)) {
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

      let p = go;

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
            path: u.pathname + u.search,
            status: res.status,
            type: res.type
          };
          addCap(rec);
        }, function (err) {
          addCap({
            at: nowStr(), host: u.host, path: u.pathname + u.search,
            status: 0, type: 'failed', note: String((err && err.message) || err)
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
        if (!limit || !description || typeof description.sdp !== 'string') {
          return original.apply(this, arguments);
        }
        try {
          const lines = description.sdp.split(/\r?\n/);
          let video = false, inserted = false;
          const out = [];
          for (const line of lines) {
            if (line.startsWith('m=')) {
              if (video && !inserted) out.push('b=AS:' + Math.round(limit * 1000));
              video = line.startsWith('m=video ');
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
          const patched = { type: description.type, sdp: out.join('\r\n') };
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
    if (qosBusy || !pc || typeof pc.getStats !== 'function') return;
    qosBusy = true;
    PCQos(pc).then(function (q) {
      if (q && S.lastPc === pc) {
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
    }).then(function () { qosBusy = false; });
  }

  function PCQos(pc) {
    let stats;
    try { stats = pc.getStats(); } catch (e) { return Promise.resolve(null); }
    return Promise.resolve(stats).then(function (rep) {
      const out = {};
      let video = null, pair = null, pairId = null;

      rep.forEach(function (r) {
        if (r.type === 'inbound-rtp' && (r.kind === 'video' || r.mediaType === 'video')) video = r;
        if (r.type === 'transport' && r.selectedCandidatePairId) pairId = r.selectedCandidatePairId;
        if (r.type === 'candidate-pair' && (r.nominated || r.selected) && r.state === 'succeeded') pair = r;
      });
      if (pairId && rep.get) {
        const p2 = rep.get(pairId);
        if (p2) pair = p2;
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
    if (!response || !response.ok) return Promise.resolve(response);
    const caps = inputCapabilities();
    if (!caps.touch || caps.maxTouchPoints < 1) return Promise.resolve(response);
    return response.clone().text().then(function (body) {
      let data;
      try { data = JSON.parse(body); } catch (e) { return response; }
      if (!data || typeof data !== 'object' || Array.isArray(data)) return response;
      let overrides;
      try {
        overrides = typeof data.clientStreamingConfigOverrides === 'string'
          ? JSON.parse(data.clientStreamingConfigOverrides || '{}')
          : (data.clientStreamingConfigOverrides || {});
      } catch (e) { return response; }
      if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) return response;
      const original = overrides.inputConfiguration;
      if (original != null && (typeof original !== 'object' || Array.isArray(original))) return response;
      const inputs = Object.assign({}, original || {});
      const previous = typeof inputs.enableTouchInput === 'boolean' ? inputs.enableTouchInput : null;
      inputs.enableTouchInput = true;
      inputs.maxTouchPoints = Math.max(Number(inputs.maxTouchPoints) || 0, caps.maxTouchPoints);
      overrides.inputConfiguration = inputs;
      data.clientStreamingConfigOverrides = JSON.stringify(overrides);
      touchSessionDiagnostics = { inspected: true, applied: true, previousTouch: previous, maxTouchPoints: inputs.maxTouchPoints };
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: headers });
    }).catch(function () { return response; });
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
  // Depois da primeira captura nativa, toda perda de Pointer Lock
  // (F9, troca de monitor, perda de foco, ESC) pausa a recaptura automatica.
  // Somente um F9 fisico permite voltar a capturar.
  let nativeLockTarget = null;
  let nativeLockSeen = false;
  let f9Released = false;
  let f9RelockPending = false;
  const originalRequestPointerLock = Element.prototype.requestPointerLock;
  if (typeof originalRequestPointerLock === 'function') {
    Element.prototype.requestPointerLock = function () {
      if (!f9Released) return originalRequestPointerLock.apply(this, arguments);
      touchFullscreenPolicy.suppressed++;
      touchFullscreenPolicy.requestsBlockedByNimbo = true;
      touchFullscreenPolicy.lastReason = 'automatic pointer relock suppressed; press F9';
      return Promise.reject(new DOMException('Captura pausada ate F9', 'NotAllowedError'));
    };
  }
  document.addEventListener('pointerlockchange', function () {
    const current = document.pointerLockElement;
    if (current) {
      nativeLockTarget = current;
      nativeLockSeen = true;
      f9Released = false;
      f9RelockPending = false;
      touchFullscreenPolicy.lastReason = 'native pointer lock active';
    } else if (nativeLockSeen) {
      // O navegador pode liberar a captura sem evento de F9.
      f9Released = true;
      f9RelockPending = false;
      touchFullscreenPolicy.lastReason = 'pointer released; F9 required to resume';
    }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (!e.isTrusted || e.code !== 'F9' || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const active = document.activeElement;
    if (active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))) return;
    const playing = !!(document.fullscreenElement || document.webkitFullscreenElement ||
      document.querySelector('video[src^="blob:"][autoplay], video[data-testid*="stream"]'));
    if (!playing) return;
    touchFullscreenPolicy.f9Observed++;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (document.pointerLockElement) {
      f9Released = true;
      f9RelockPending = false;
      touchFullscreenPolicy.lastReason = 'F9: mouse released until next F9';
      document.exitPointerLock();
      return;
    }
    if (f9RelockPending) return;
    if (!nativeLockTarget || !nativeLockTarget.isConnected ||
        typeof originalRequestPointerLock !== 'function') {
      touchFullscreenPolicy.lastReason = 'F9: native target unavailable; click game to initialize';
      // Nao autorizar capturas automaticas quando ja houve uma captura.
      if (!nativeLockSeen) f9Released = false;
      return;
    }
    f9Released = false;
    f9RelockPending = true;
    touchFullscreenPolicy.lastReason = 'F9: explicit native pointer lock request';
    try {
      const result = originalRequestPointerLock.call(nativeLockTarget);
      if (result && typeof result.then === 'function') {
        result.then(function () {
          f9RelockPending = false;
        }, function (err) {
          f9RelockPending = false;
          f9Released = true;
          touchFullscreenPolicy.lastReason = 'F9 lock rejected: ' + (err && err.name || 'unknown');
        });
      } else {
        f9RelockPending = false;
      }
    } catch (err) {
      f9RelockPending = false;
      f9Released = true;
      touchFullscreenPolicy.lastReason = 'F9 lock error: ' + (err && err.name || 'unknown');
    }
  }, true);

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
            path: u.pathname + u.search, status: xhr.status, type: 'xhr'
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
    const controller = nodes.find(function (n) {
      return /controller|gamepad|controle|joystick|disconnected|desconectado/.test(desc(n));
    });
    if (controller) return { node: controller, position: 'after' };
    const profile = nodes.find(function (n) {
      return /profile|perfil|account|conta|avatar|user|usuário|usuario/.test(desc(n));
    });
    if (profile) return { node: profile, position: 'before' };
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

  // Encontra a faixa compacta de controles do xCloud no canto superior esquerdo.
  // Não altera botões nativos: só acrescenta o acesso NX quando a estrutura é reconhecível.
  function findInGameToolbar() {
    const candidates = document.querySelectorAll('button,[role="button"]');
    for (const node of candidates) {
      if (node.id === 'nimboxcloud-library-button' || node.closest('#__xcu_panel__')) continue;
      const r = node.getBoundingClientRect();
      if (r.width < 22 || r.width > 90 || r.height < 22 || r.height > 90 ||
          r.left < 0 || r.left > 170 || r.top < 0 || r.top > 105) continue;
      let parent = node.parentElement;
      for (let depth = 0; parent && depth < 3; depth++, parent = parent.parentElement) {
        if (parent.id === '__xcu_panel__' || parent === document.body) break;
        const pr = parent.getBoundingClientRect();
        if (pr.left > 170 || pr.top > 110 || pr.width < 80 || pr.width > 360 ||
            pr.height < 28 || pr.height > 125) continue;
        const buttons = Array.from(parent.querySelectorAll('button,[role="button"]'))
          .filter(function (b) {
            if (b.id === 'nimboxcloud-library-button') return false;
            const br = b.getBoundingClientRect();
            return br.width >= 22 && br.height >= 22 && br.left >= pr.left - 2 &&
              br.right <= pr.right + 2 && br.top >= pr.top - 2 && br.bottom <= pr.bottom + 2;
          });
        if (buttons.length < 2 || buttons.length > 5) continue;
        // O grupo deve conter o controle Xbox/guia ou um botão de mais opções.
        const labels = buttons.map(function (b) {
          return [b.getAttribute('aria-label'), b.getAttribute('title'),
            b.getAttribute('data-testid'), b.textContent].filter(Boolean).join(' ').toLowerCase();
        }).join(' ');
        const hasXbox = /xbox|guide|guia|menu|more|mais|options|opções|opcoes/.test(labels);
        const hasIcons = buttons.filter(function (b) { return b.querySelector('svg,img'); }).length >= 2;
        if (!hasXbox && !hasIcons) continue;
        return buttons[buttons.length - 1];
      }
    }
    return null;
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
    const width = Math.min(348, Math.max(240, innerWidth - 16));
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

  function syncNXPlacement() {
    if (!wrap || !wrap.isConnected) return;
    const playing = isInGame();
    const mode = playing ? 'game' : 'library';
    if (nxMode !== mode) {
      nxMode = mode;
      openUI = false;
      if (cardEl) cardEl.style.display = 'none';
      if (pickEl) pickEl.style.display = 'none';
    }
    if (playing) {
      if (micTestStream) stopMicrophoneTest(); // Nunca manter a captura de diagnóstico durante a sessão.
      const gameAnchor = findInGameToolbar();
      if (gameAnchor && gameAnchor.parentElement) {
        if (!nxLibraryButton) nxLibraryButton = buildLibraryButton();
        if (nxLibraryButton.parentElement !== gameAnchor.parentElement ||
            nxLibraryButton.previousElementSibling !== gameAnchor) gameAnchor.after(nxLibraryButton);
        const expanded = toolbarExpanded(gameAnchor);
        nxLibraryButton.style.display = expanded ? 'inline-flex' : 'none';
        nxLibraryButton.title = 'Abrir NimboXcloud durante a partida';
        // O botão NX deve recolher junto com a barra nativa. Painel aberto permanece acessível.
        wrap.style.display = openUI ? 'flex' : 'none';
        if (pillEl) pillEl.style.display = 'none';
        if (openUI) positionNXCard(nxLibraryButton);
      } else {
        // Enquanto a barra nativa está recolhida, não deixar um ícone independente na tela.
        if (nxLibraryButton) nxLibraryButton.style.display = 'none';
        if (pillEl) pillEl.style.display = 'none';
        wrap.style.display = openUI ? 'flex' : 'none';
        if (openUI) {
          wrap.style.left = '8px'; wrap.style.right = 'auto'; wrap.style.top = '58px';
          wrap.style.width = Math.min(348, innerWidth - 16) + 'px';
          wrap.style.alignItems = 'stretch';
          if (cardEl) cardEl.style.maxHeight = Math.max(160, innerHeight - 70) + 'px';
        }
      }
      return;
    }
    const placement = findProfileAnchor();
    const anchor = placement && placement.node;
    if (anchor && anchor.parentElement) {
      if (!nxLibraryButton) nxLibraryButton = buildLibraryButton();
      if (placement.position === 'after') {
        if (nxLibraryButton.parentElement !== anchor.parentElement || nxLibraryButton.previousElementSibling !== anchor) anchor.after(nxLibraryButton);
      } else {
        if (nxLibraryButton.parentElement !== anchor.parentElement || nxLibraryButton.nextElementSibling !== anchor) anchor.before(nxLibraryButton);
      }
      nxLibraryButton.style.display = 'inline-flex';
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
      const buttonVisible = buttonRect.width >= 18 && buttonRect.height >= 18 &&
        buttonRect.top >= 0 && buttonRect.bottom <= innerHeight &&
        buttonRect.left >= 0 && buttonRect.right <= innerWidth;
      if (pillEl) pillEl.style.display = buttonVisible ? 'none' : 'inline-flex';
    } else {
      // Barra do site ainda não carregou: fallback temporário com a pílula.
      if (nxLibraryButton) nxLibraryButton.style.display = 'none';
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
    controls: 'M6 12h4 M8 10v4 M15 13h.01 M18 11h.01 M17.3 5H6.7a4 4 0 0 0-3.9 3.3L1.5 15a3 3 0 0 0 5.3 2L8 15h8l1.2 2a3 3 0 0 0 5.3-2l-1.3-6.7A4 4 0 0 0 17.3 5z',
    region: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
    advanced: 'M9 2h6v4H9z M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2 M8 12h8 M8 16h5',
    close: 'M18 6L6 18 M6 6l12 12'
  };
  const TABS = [
    { id: 'overview', label: 'Geral' },
    { id: 'stream', label: 'Streaming' },
    { id: 'media', label: 'Mídia' },
    { id: 'controls', label: 'Controles' },
    { id: 'region', label: 'Região' },
    { id: 'advanced', label: 'Avançado' }
  ];
  const PRESETS = [
    { name: 'Máximo', res: 'hq', br: 'auto', sub: 'Melhor imagem' },
    { name: 'Equilibrado', res: 'auto', br: 'b10', sub: '1080p · 10 Mbps' },
    { name: 'Economia', res: 'r720', br: 'b5', sub: '720p · 5 Mbps' }
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
    const r = mk('div', 'padding:11px 0;display:flex;flex-direction:' + (stacked ? 'column' : 'row') +
      ';gap:' + (stacked ? '9px' : '12px') + ';align-items:' + (stacked ? 'stretch' : 'center') + ';justify-content:space-between');
    const t = mk('div', 'min-width:0;flex:1');
    t.appendChild(mk('div', 'font-size:13px;font-weight:600;color:' + C.text, label));
    const d = mk('div', 'font-size:11px;color:' + C.dim + ';margin-top:2px;line-height:1.4;word-break:break-word', desc || '');
    if (!desc) d.style.display = 'none';
    t.appendChild(d);
    r.appendChild(t);
    if (ctrl) r.appendChild(ctrl);
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
    const v = mk('div', 'font-size:12.5px;font-weight:600;color:' + C.text + ';text-align:right;max-width:58%;' +
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
    const fail = function () { console.log(tag, text); toast('Cópia bloqueada; texto no console'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(okMsg); }, fail);
        return;
      }
    } catch (e) { }
    fail();
  }
  function copyReport() { copyText(buildReport(), '[NX report]', 'Relatório copiado'); }
  function copyHistory() {
    copyText(JSON.stringify({ version: VER, samples: S.qosHistory, diagnosis: S.lastDiagnosis }, null, 2), '[NX history]', 'Histórico copiado');
  }
  function copyDiag() {
    copyText(JSON.stringify({
      version: VER, url: location.origin + location.pathname,
      selectedServer: srvCfg().name || 'auto', requestedQuality: resCfg().label,
      bitrateLimit: bitrateCfg().mbps || 'auto', lastQos: S.qos,
      latencyByServer: S.latencyByServer, nxRecoveries: S.nxRecoveries,
      diagnosticsWarnings: S.diagnosticsWarnings,
      micStatus: S.micStatus, vibrationStatus: S.vibrationStatus,
      remotePlayStatus: S.remotePlayStatus, serverProbeStatus: S.serverProbeStatus,
      pointerLockActive: !!document.pointerLockElement,
      touchPoints: navigator.maxTouchPoints || 0, lastError: S.lastErr
    }, null, 2), '[NX diagnostic]', 'Diagnóstico copiado');
  }

  // ----- Abas -----
  const TAB_BUILDERS = {
    overview: function (root) {
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

      const pg = group('Perfis rápidos', 'Aplicam qualidade e limite de bitrate de uma vez. Valem na próxima partida.');
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
      root.appendChild(pg.root);

      const cg = group('Configuração atual');
      cg.add(infoRow('Data center', function () { return srvBtnLabel(); }));
      cg.add(infoRow('Qualidade', function () { return resCfg().label; }));
      cg.add(infoRow('Limite de bitrate', function () { return bitrateCfg().label; }));
      cg.add(infoRow('Rede', function () { return v4on() ? 'IPv4 forçado' : 'IPv4 + IPv6'; }));
      cg.add(infoRow('Região da loja', function () { return cfg().name; }));
      root.appendChild(cg.root);
    },

    stream: function (root) {
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
      g2.add(setRow('Perfil de qualidade', 'O perfil HQ usa a negociação Tizen e pode interferir no controle virtual (toque). A resolução entregue aparece em Geral.',
        chips(Object.keys(RES_MODES).map(function (k) { return { k: k, label: RES_MODES[k].label }; }),
          getPref(LS_RES, 'auto') === 'r1080' ? 'auto' : getPref(LS_RES, 'auto'), function (k) {
            setPref(LS_RES, k); renderBody();
          }), true));
      g2.add(setRow('Limite de bitrate', 'Teto solicitado via SDP (experimental). Não aumenta o bitrate entregue pelo servidor.',
        chips(Object.keys(BITRATE_MODES).map(function (k) {
          return { k: k, label: BITRATE_MODES[k].label.replace(' (limite)', '') };
        }), getPref(LS_BITRATE, 'auto'), function (k) { setPref(LS_BITRATE, k); renderBody(); }), true));
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
      const audioOutputs = document.createElement('select');
      audioOutputs.setAttribute('aria-label', 'Dispositivo de saída');
      audioOutputs.style.cssText = 'width:100%;background:#161b22;color:#e8edf3;border:1px solid #30363d;border-radius:6px;padding:7px';
      const refreshOutputs = async function () {
        audioOutputs.replaceChildren();
        const def = document.createElement('option'); def.value = ''; def.textContent = 'Saída padrão do sistema'; audioOutputs.appendChild(def);
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          try { (await navigator.mediaDevices.enumerateDevices()).filter(function (d) { return d.kind === 'audiooutput' && d.deviceId; }).forEach(function (d, i) {
            const opt = document.createElement('option'); opt.value = d.deviceId; opt.textContent = d.label || ('Saída ' + (i + 1)); audioOutputs.appendChild(opt);
          }); } catch (e) { /* A lista pode exigir permissão. */ }
        }
        audioOutputs.value = Array.from(audioOutputs.options).some(function (o) { return o.value === getPref(LS_AUDIO_OUTPUT, ''); }) ? getPref(LS_AUDIO_OUTPUT, '') : '';
      };
      audioOutputs.addEventListener('change', function () { setPref(LS_AUDIO_OUTPUT, audioOutputs.value); applyAudioOutput(); });
      g1.add(setRow('Saída de áudio', 'Troca de fones/alto-falantes quando o navegador oferece setSinkId.', audioOutputs, true));
      g1.add(setRow('Dispositivos', 'Atualiza a lista de saídas disponíveis.', actBtn('Atualizar saídas', refreshOutputs, 'ghost')));
      refreshOutputs();
      [['Graves', LS_AUDIO_BASS], ['Médios', LS_AUDIO_MID], ['Agudos', LS_AUDIO_TREBLE]].forEach(function (cfg) {
        const range = document.createElement('input'); range.type = 'range'; range.min = '-12'; range.max = '12'; range.step = '1';
        range.value = getPref(cfg[1], '0'); range.style.width = '100%';
        range.addEventListener('input', function () { setPref(cfg[1], range.value); applyAudioProcessing(); });
        g1.add(setRow(cfg[0], 'Equalização local do som recebido, em dB.', range, true));
      });
      const comp = document.createElement('input'); comp.type = 'checkbox'; comp.checked = getPref(LS_AUDIO_COMP, '0') === '1';
      comp.addEventListener('change', function () { setPref(LS_AUDIO_COMP, comp.checked ? '1' : '0'); applyAudioProcessing(); });
      g1.add(setRow('Compressor', 'Reduz picos do áudio recebido; não modifica o chat transmitido.', comp));
      g1.add(setRow('Processamento', 'Ativa o equalizador somente quando solicitado; pode aumentar uso de CPU.',
        actBtn('Aplicar ao áudio atual', function () { applyAudioProcessing(); applyAudioOutput(); }, 'ghost')));
      g1.add(setRow('Áudio espacial', 'Utilize o recurso espacial do sistema operacional/fone. Não há API universal para forçá-lo no xCloud.',
        mk('span', 'font-size:11px', 'Controlado pelo dispositivo')));
      g1.add(setRow('Voz x jogo', 'Separação de volumes indisponível quando o xCloud entrega um único fluxo misturado.',
        mk('span', 'font-size:11px', 'Depende de fluxos separados')));
      root.appendChild(g1.root);

      const g2 = group('Imagem', 'Ajustes visuais locais em CSS. Não são nitidez real, CAS nem upscaling.');
      g2.add(setRow('Contraste adicional', 'Reforça o contraste do vídeo.',
        chips([{ k: '0', label: 'Desligado' }, { k: '1', label: 'Leve' }, { k: '2', label: 'Forte' }], getPref(LS_SHARPNESS, '0'), function (k) {
          setPref(LS_SHARPNESS, k); applyVideoAdjustments(activeStreamVideo()); renderBody();
        }), true));
      g2.add(setRow('Cor e saturação', 'Deixa as cores mais vivas.',
        chips([{ k: '0', label: 'Padrão' }, { k: '1', label: 'Vívido' }, { k: '2', label: 'Intenso' }], getPref(LS_VIDEO_COLOR, '0'), function (k) {
          setPref(LS_VIDEO_COLOR, k); applyVideoAdjustments(activeStreamVideo()); renderBody();
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
      g1.add(setRow('Aplicar perfil', 'Ajusta qualidade e limite de bitrate conforme o perfil (próxima sessão).',
        actBtn('Aplicar', function () { applyDeviceProfile(); renderBody(); toast('Perfil aplicado · próxima partida'); }, 'primary')));
      root.appendChild(g1.root);

      const g2 = group('Entradas detectadas');
      g2.add(infoRow('Tela de toque', function () {
        const c = inputCapabilities();
        return (c.touch ? 'Sim' : 'Não') + ' · ' + c.maxTouchPoints + ' pontos';
      }));
      g2.add(infoRow('Controles conectados', function () { return inputCapabilities().gamepadsConnected; }));
      g2.add(infoRow('Mouse capturado', function () { return document.pointerLockElement ? 'Sim' : 'Não'; },
        'Com teclado físico, F9 libera ou recaptura o mouse durante a partida.'));
      root.appendChild(g2.root);

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

      const g4 = group('Atalho do painel');
      g4.add(setRow('Abrir/fechar o painel', 'Combinação de teclado (Ctrl+Shift+N recentraliza o painel).',
        chips([{ k: 'KeyH', label: 'Ctrl+Shift+H' }, { k: 'KeyJ', label: 'Ctrl+Shift+J' }, { k: 'KeyK', label: 'Ctrl+Shift+K' }],
          getPref(LS_NX_SHORTCUT, 'KeyH'), function (k) { setPref(LS_NX_SHORTCUT, k); renderBody(); }), true));
      root.appendChild(g4.root);
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

      const g4 = group('Sistema');
      g4.add(infoRow('Remote Play', function () { return S.remotePlayStatus; }));
      g4.add(infoRow('Recuperações do painel', function () { return S.nxRecoveries; }));
      g4.add(infoRow('Histórico de QoS', function () { return S.qosHistory.length + ' amostras'; }));
      g4.add(infoRow('Último erro', function () { return S.lastErr || 'Nenhum'; }));
      root.appendChild(g4.root);

      const g5 = group('Ferramentas');
      const tools = mk('div', 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px 0');
      tools.appendChild(actBtn('Copiar relatório', copyReport, 'primary'));
      tools.appendChild(actBtn('Copiar diagnóstico', copyDiag, 'ghost'));
      tools.appendChild(actBtn('Copiar histórico', copyHistory, 'ghost'));
      tools.appendChild(actBtn('Limpar cache', hardReload, 'danger'));
      g5.card.appendChild(tools);
      root.appendChild(g5.root);

      root.appendChild(mk('div', 'text-align:center;color:' + C.dim + ';font-size:10.5px;margin:14px 0 2px', 'NimboXcloud v' + VER + ' · por KReight'));
    }
  };

  function setTab(id) {
    if (!TAB_BUILDERS[id]) id = 'overview';
    tabId = id;
    renderBody(true);
  }

  function renderTabs() {
    if (!el.tabBtns) return;
    TABS.forEach(function (t) {
      const b = el.tabBtns[t.id];
      if (!b) return;
      const on = t.id === tabId;
      b.style.color = on ? C.accent : C.dim;
      b.style.borderTop = '2px solid ' + (on ? C.accent : 'transparent');
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function renderBody(resetScroll) {
    if (!el.body) return;
    const keep = el.body.scrollTop;
    liveFns = [];
    el.body.textContent = '';
    try { TAB_BUILDERS[tabId](el.body); }
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
      'width:348px', 'max-width:calc(100vw - 16px)',
      'display:flex', 'flex-direction:column', 'align-items:flex-end',
      'font:12px/1.5 ' + UI_FONT, 'color:' + C.text, 'text-align:left'
    ].join(';'));
    wrap.id = '__xcu_panel__';

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
      'background:' + C.bg, 'border:1px solid rgba(255,255,255,.12)', 'border-radius:18px',
      'box-shadow:0 20px 56px rgba(0,0,0,.65)',
      '-webkit-backdrop-filter:blur(14px)', 'backdrop-filter:blur(14px)'
    ].join(';'));
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

    // Barra de abas
    const bar = mk('div', 'display:flex;flex:0 0 auto;border-top:1px solid ' + C.line + ';background:rgba(0,0,0,.25)');
    bar.setAttribute('role', 'tablist');
    el.tabBtns = {};
    TABS.forEach(function (t) {
      const b = mk('button', 'all:unset;box-sizing:border-box;flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;' +
        'gap:3px;padding:8px 2px 9px;cursor:pointer;font-size:10px;font-weight:600;letter-spacing:.01em;' +
        'border-top:2px solid transparent;color:' + C.dim + ';-webkit-tap-highlight-color:transparent');
      b.setAttribute('role', 'tab');
      b.appendChild(ico(ICONS[t.id], 19));
      b.appendChild(mk('span', 'max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', t.label));
      b.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); setTab(t.id); });
      el.tabBtns[t.id] = b;
      bar.appendChild(b);
    });
    cardEl.appendChild(bar);

    wrap.appendChild(cardEl);
    host.appendChild(wrap);
    return wrap;
  }

  function setOpen(v, byUser) {
    openUI = !!v;
    if (byUser) userTouched = true;
    if (!cardEl) return;
    cardEl.style.display = openUI ? 'flex' : 'none';
    if (openUI) { syncNXPlacement(); if (!isInGame()) fitCard(); renderBody(); update(); }
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
    setOpen(false);
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
    fitCard();
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
    if (kind === 'res') { setPref(LS_RES, k); return false; }
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
  function startInputDiagnostics() {
    diagLog('diagnostics-start', { capabilities: inputCapabilities() });
    document.addEventListener('pointerlockchange', function () { diagLog('pointerlockchange'); }, true);
    document.addEventListener('webkitpointerlockchange', function () { diagLog('webkitpointerlockchange'); }, true);
    document.addEventListener('pointerlockerror', function () { diagLog('pointerlockerror'); }, true);
    document.addEventListener('visibilitychange', function () { diagLog('visibilitychange'); }, true);
    document.addEventListener('fullscreenchange', function () { diagLog('fullscreenchange'); }, true);
    document.addEventListener('webkitfullscreenchange', function () { diagLog('webkitfullscreenchange'); }, true);
    window.addEventListener('blur', function () { diagLog('window-blur'); }, true);
    window.addEventListener('focus', function () { diagLog('window-focus'); }, true);
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
    window.addEventListener('pageshow', function () { diagLog('pageshow'); }, true);
    window.addEventListener('pagehide', function () { diagLog('pagehide'); }, true);
  }

  function buildReport() {
    return JSON.stringify({
      v: VER,
      url: location.href,
      inputCapabilities: inputCapabilities(),
      inputNegotiation: lastInputNegotiation,
      touchSession: touchSessionDiagnostics,
      touchFullscreenPolicy: touchFullscreenPolicy,
      interactionDiagnostics: { state: diagState(), events: diagEvents.slice(), retained: DIAG_MAX, note: 'Eventos locais; zonas 4x4; teclas e coordenadas exatas não registradas. Screenshot físico não é detectável diretamente.' },
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
      syncNXPlacement();
    } catch (e) { S.lastErr = 'NX tick: ' + String(e && e.message || e); }

    // Um dialogo do xCloud nao pode esconder a interface do NimboXcloud.
    // A visibilidade depende somente da acao do usuario. A exibição da pílula
    // (oculta na biblioteca quando o botão da barra está visível) é decidida
    // exclusivamente por syncNXPlacement; aqui só garantimos que ela seja clicável.
    if (cardEl) cardEl.style.display = openUI ? 'flex' : 'none';
    if (pillEl) {
      pillEl.style.opacity = '1';
      pillEl.style.pointerEvents = 'auto';
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
    const bitrate = mode === 'mobile' ? 'b8' : (mode === 'dex' ? 'b12' : 'auto');
    setPref(LS_BITRATE, bitrate);
    setPref(LS_RES, mode === 'mobile' ? 'r720' : 'auto');
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
          S.micStatus = 'Captura solicitada pelo xCloud com o microfone selecionado. Envio de voz ao jogo não verificado.';
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints, video: false });
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
  function applyVideoAdjustments(video) {
    if (!video) return;
    const color = Math.max(0, Math.min(2, Number(getPref(LS_VIDEO_COLOR, '0')) || 0));
    const sharp = Math.max(0, Math.min(2, Number(getPref(LS_SHARPNESS, '0')) || 0));
    const contrast = [1, 1.04, 1.10][color] || 1;
    const saturation = [1, 1.06, 1.10][color] || 1;
    // O ajuste de "nitidez" é apenas contraste CSS; sem convolução de pixels.
    const extraContrast = [1, 1.07, 1.14][sharp] || 1;
    video.style.filter = 'contrast(' + (contrast * extraContrast).toFixed(3) + ') saturate(' + saturation.toFixed(3) + ')';
  }
  function cycleSharpness() {
    const video = activeStreamVideo();
    if (!video) { S.lastErr = 'Ajuste visual: vídeo não encontrado'; update(); return; }
    const modes = ['0', '1', '2'];
    const next = modes[(modes.indexOf(getPref(LS_SHARPNESS, '0')) + 1) % modes.length];
    setPref(LS_SHARPNESS, next);
    applyVideoAdjustments(video);
    pushLog('video', 'Contraste adicional ' + next + '; não é nitidez real ou CAS');
  }
  function inspectServerMeasurements() {
    const names = Object.keys(S.latencyByServer).filter(function (name) { const item = S.latencyByServer[name]; return item && item.at && Date.now() - item.at < 24 * 3600 * 1000 && item.samples >= 5; });
    S.serverProbeStatus = names.length ? names.length + ' servidor(es) medido(s) em sessões; sondagem prévia não disponível' : 'Nenhum servidor medido; sondagem prévia não disponível';
    update();
  }
  function inspectRemotePlay() {
    S.remotePlayStatus = 'Não conectado: protocolo/autenticação Xbox Remote Play não integrados';
    update();
  }
  function cycleVideoFilter() {
    const video = activeStreamVideo();
    if (!video) { S.lastErr = 'Filtro: vídeo não encontrado'; schedule(); return; }
    const next = ((Number(getPref(LS_VIDEO_COLOR, '0')) || 0) + 1) % 3;
    setPref(LS_VIDEO_COLOR, String(next));
    applyVideoAdjustments(video);
    pushLog('video', 'Cor/contraste CSS ' + next + ' (não aplica nitidez, CAS nem upscaling)');
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
  function applyAudioOutput() {
    const media = activeStreamAudio();
    const sink = getPref(LS_AUDIO_OUTPUT, '');
    if (!media || typeof media.setSinkId !== 'function') { S.lastErr = 'Seleção de saída não suportada neste navegador'; return; }
    Promise.resolve(media.setSinkId(sink)).catch(function (e) { S.lastErr = 'Saída de áudio: ' + String(e && e.name || e); });
  }
  function applyAudioProcessing() {
    const media = activeStreamAudio();
    if (!media) return;
    const vals = [LS_AUDIO_BASS, LS_AUDIO_MID, LS_AUDIO_TREBLE].map(function (k) { return Number(getPref(k, '0')) || 0; });
    const compress = getPref(LS_AUDIO_COMP, '0') === '1';
    if (!nxAudioGraph && vals.every(function (v) { return v === 0; }) && !compress) return;
    if (nxAudioGraph && nxAudioGraph.media !== media) { S.lastErr = 'Processamento associado a outro elemento; recarregue para trocar o fluxo'; return; }
    try {
      if (!nxAudioGraph) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(media);
        const bass = ctx.createBiquadFilter(); bass.type = 'lowshelf'; bass.frequency.value = 180;
        const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1100; mid.Q.value = 0.8;
        const treble = ctx.createBiquadFilter(); treble.type = 'highshelf'; treble.frequency.value = 3500;
        const compressor = ctx.createDynamicsCompressor(); compressor.threshold.value = -22; compressor.ratio.value = 3;
        const dry = ctx.createGain(); const wet = ctx.createGain();
        source.connect(bass); bass.connect(mid); mid.connect(treble);
        treble.connect(dry); treble.connect(compressor); compressor.connect(wet);
        dry.connect(ctx.destination); wet.connect(ctx.destination);
        nxAudioGraph = { media: media, ctx: ctx, bass: bass, mid: mid, treble: treble, dry: dry, wet: wet };
      }
      nxAudioGraph.bass.gain.value = vals[0]; nxAudioGraph.mid.gain.value = vals[1]; nxAudioGraph.treble.gain.value = vals[2];
      nxAudioGraph.dry.gain.value = compress ? 0 : 1; nxAudioGraph.wet.gain.value = compress ? 1 : 0;
      Promise.resolve(nxAudioGraph.ctx.resume()).catch(function () {});
    } catch (e) { S.lastErr = 'Processamento de áudio indisponível: ' + String(e && e.name || e); }
  }
  function activeStreamAudio() {
    const media = Array.from(document.querySelectorAll('video,audio'));
    const candidates = media.filter(function (v) {
      const stream = v.srcObject;
      if (stream && typeof stream.getAudioTracks === 'function') return stream.getAudioTracks().length > 0;
      return !!(v.currentSrc && v.currentSrc.startsWith('blob:'));
    });
    return candidates.find(function (v) { return v.readyState >= 2 && !v.paused; }) || candidates[0] || null;
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
    S.diagnosticsWarnings = [
      'RTT: apenas sessões usadas; sondagem ativa não implementada',
      'Contraste adicional: filtro CSS, não é nitidez real nem CAS',
      'Microfone: teste de captura local com permissão; transmissão ao jogo depende do xCloud',
      'Vibração: testes locais de controle e celular; sem remapeamento do feedback do streaming',
      'Remote Play: diagnóstico de indisponibilidade; protocolo não integrado'
    ];
    S.deviceDetected = detectedDeviceProfile();
    document.addEventListener('keydown', function (e) {
      if (!e.isTrusted || !e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey || e.repeat) return;
      const a = document.activeElement;
      if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return;
      if (e.code === getPref(LS_NX_SHORTCUT, 'KeyH')) { e.preventDefault(); setOpen(!openUI, true); }
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
      const video = activeStreamVideo();
      if (video && video !== lastAdjustedVideo) { lastAdjustedVideo = video; applyVideoAdjustments(video); }
    }, 2500);
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
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyN') { resetPos(); setOpen(true, true); }
    }, false);
    // Ao entrar/sair da tela cheia, move o painel imediatamente para o novo host, sem depender do tick de 1,5s
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        try {
          const host = mountTarget();
          if (wrap && host) host.appendChild(wrap);
        } catch (e) { }
      }, true);
    });
    setInterval(tick, 1500);
    window.addEventListener('popstate', tick);
    window.addEventListener('resize', tick);
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
