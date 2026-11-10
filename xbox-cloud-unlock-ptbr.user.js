// ==UserScript==
// @name         NimboXcloud
// @namespace    https://github.com/breno-bgod/Xbox-Cloud-Unlock-PTBR
// @version      3.6.5
// @description  Deixa o play.xbox.com utilizável em regiões restritas: reescreve a verificação de mercado e os cabeçalhos, e oferece ajustes de streaming (data center / forçar IPv4 / qualidade) com um mini medidor de QoS
// @author       KReight
// @license      MIT
// @match        https://play.xbox.com/*
// @run-at       document-start
// @grant        none
// @supportURL   https://github.com/breno-bgod/Xbox-Cloud-Unlock-PTBR/issues
// ==/UserScript==

/*
 * Funcionalidades
 *   1. Desbloqueio de região: reescreve a resposta de experimentation de gears / xboxcomfd
 *      (trafficFilters.territory, market) e ajusta o cookie territory para a região escolhida,
 *      evitando que a página de reprodução classifique o IP de saída atual como "mercado não suportado".
 *   2. Link de streaming: permite fixar o data center (reescreve isDefault e a ordem de
 *      offeringSettings.regions), remove candidatos IPv6 do ICE (força IPv4) e escolhe a faixa
 *      de qualidade conforme settings.osName, com HQ como padrao independente da tela.
 *   3. Medidor de status: uma pequena pílula no canto mostra a perda de pacotes em tempo real;
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

  const VER = '3.6.5';
  const LS_KEY = 'xcu.region';       // região de desbloqueio (IP)
  const LS_SRV = 'xcu.streamRegion'; // data center de streaming
  const LS_V4 = 'xcu.forceIPv4';     // forçar IPv4
  const LS_RES = 'xcu.resolution';   // faixa de qualidade
  const LS_BITRATE = 'xcu.maxBitrateMbps'; // limite opcional de bitrate SDP

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
  // O servidor ainda pode negociar uma resolucao inferior.
  const RES_MODES = {
    auto: { osName: 'windows', label: '1080p (compatível com toque)' },
    hq: { osName: 'tizen', label: '1080p HQ (experimental)' },
    r1080: { osName: 'windows', label: '1080p' },
    r720: { osName: 'android', label: '720p' }
  };
  const BITRATE_MODES = {
    auto: { mbps: 0, label: 'Auto' },
    b5: { mbps: 5, label: '5 Mbps' },
    b8: { mbps: 8, label: '8 Mbps' },
    b10: { mbps: 10, label: '10 Mbps' },
    b12: { mbps: 12, label: '12 Mbps' },
    b15: { mbps: 15, label: '15 Mbps' }
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
    hist: [],
    histMin: null,
    startedAt: Date.now(),
    lastErr: ''
  };
  window.__XCU__ = S;

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
    if (SERVERS[k]) return SERVERS[k];
    if (/^[A-Z]{3,}$/.test(k)) return { name: k, label: k };
    return SERVERS.auto;
  }
  function resCfg() {
    return RES_MODES[getPref(LS_RES, 'auto')] || RES_MODES.auto;
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

  function pumpQos() {
    const pc = S.lastPc;
    if (qosBusy || !pc || typeof pc.getStats !== 'function') return;
    qosBusy = true;
    PCQos(pc).then(function (q) {
      if (q) { S.qos = q; S.qosAt = Date.now(); schedule(); }
    }, function () { }).then(function () { qosBusy = false; });
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
        if (video.codecId && rep.get) {
          const cc = rep.get(video.codecId);
          if (cc && cc.mimeType) out.codec = String(cc.mimeType).replace(/^video\//i, '').toUpperCase();
        }
        if (video.jitterBufferDelay != null && video.jitterBufferEmittedCount) {
          out.bufMs = Math.round(video.jitterBufferDelay / video.jitterBufferEmittedCount * 1000);
        }

        if (prevSnap && prevSnap.bytes != null) {
          const dB = out.bytes - prevSnap.bytes;
          const dT = (out.ts - prevSnap.ts) / 1000;
          if (dT > 0.5 && dB >= 0) out.kbps = Math.round(dB * 8 / dT / 1000);

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
        prevSnap = { bytes: out.bytes, ts: out.ts, recv: recv, lost: lost };
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

  // ---------- 10b. Entradas nativas ----------
  // Nao interceptar requestPointerLock, eventos de teclado/mouse/toque ou Gamepad API.
  // O xCloud gerencia dinamicamente o periferico ativo; a negociacao de video
  // nao deve alterar o comportamento dos controles.

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

  // ---------- 13. Interface: uma pílula + cartão recolhível ----------
  // Restrições de design (desde a v3.1.1):
  //   · Por padrão recolhida numa pílula de ~24px de altura, centralizada no topo da tela
  //   · O contêiner tem largura fixa de 260px e filhos centralizados — ao expandir o cartão,
  //     o contêiner só cresce para baixo e a posição da pílula não muda (antes da v3.1.0 o
  //     cartão ficava abaixo da pílula com o contêiner colado embaixo, e expandir empurrava a pílula para cima)
  //   · O contêiner externo tem pointer-events:none; só a pílula/cartão recebem cliques — nunca intercepta cliques da página
  //   · Arrastável; a posição fica no localStorage (após arrastar vira posição absoluta; é preciso limpar manualmente para recentralizar)
  const LS_POS = 'xcu.pos';
  const ZBASE = 2147483000;
  const MONO = 'ui-monospace,Menlo,Consolas,monospace';

  let wrap = null, pillEl = null, cardEl = null, dotEl = null, pillTxt = null, pickEl = null;
  let openUI = false, userTouched = false, autoFolded = false, pending = false;
  let nxLibraryButton = null, nxLibraryAnchor = null, nxMode = '';
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
      if (nxLibraryButton) nxLibraryButton.style.display = 'none';
      wrap.style.display = 'flex';
      wrap.style.position = 'fixed';
      wrap.style.transform = 'none';
      wrap.style.left = 'auto';
      wrap.style.right = '12px';
      wrap.style.top = '12px';
      wrap.style.alignItems = 'flex-end';
      if (pillEl) { pillEl.style.cursor = 'pointer'; pillEl.style.display = 'inline-flex'; }
      return;
    }
    const placement = findProfileAnchor();
    const anchor = placement && placement.node;
    if (anchor && anchor.parentElement) {
      if (!nxLibraryButton) {
        nxLibraryButton = document.createElement('button');
        nxLibraryButton.id = 'nimboxcloud-library-button';
        nxLibraryButton.type = 'button';
        nxLibraryButton.textContent = 'NX';
        nxLibraryButton.title = 'NimboXcloud — configurações antes de jogar';
        nxLibraryButton.style.cssText = 'border:1px solid #556276;background:#121b2a;color:#e9f4ff;' +
          'font:700 12px/1 sans-serif;border-radius:8px;padding:6px;cursor:pointer;' +
          'min-width:30px;min-height:30px;z-index:2147483000;flex-shrink:0';
        nxLibraryButton.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation(); setOpen(!openUI, true);
        });
      }
      if (placement.position === 'after') {
        if (nxLibraryButton.parentElement !== anchor.parentElement || nxLibraryButton.previousElementSibling !== anchor) anchor.after(nxLibraryButton);
      } else {
        if (nxLibraryButton.parentElement !== anchor.parentElement || nxLibraryButton.nextElementSibling !== anchor) anchor.before(nxLibraryButton);
      }
      nxLibraryButton.style.display = '';
      nxLibraryAnchor = anchor;
      wrap.style.display = 'flex';
      wrap.style.position = 'fixed';
      wrap.style.transform = 'none';
      wrap.style.left = 'auto';
      wrap.style.right = '12px';
      const ar = nxLibraryButton.getBoundingClientRect();
      wrap.style.top = Math.min(innerHeight - 48, Math.max(44, ar.bottom + 8)) + 'px';
      wrap.style.alignItems = 'flex-end';
      // Nunca ocultar o NX flutuante: o botao integrado pode estar recortado
      // pelo layout dinamico da biblioteca.
      if (pillEl) pillEl.style.display = 'inline-flex';
    } else {
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
      'width:260px', 'max-width:calc(100vw - 16px)',
      'display:flex', 'flex-direction:column', 'align-items:center',
      'font:11px/1.5 ' + MONO, 'color:#c9d1d9', 'text-align:center'
    ].join(';'));
    wrap.id = '__xcu_panel__';
    const saved = readPos();
    // A posicao do NX e definida por contexto (biblioteca ou partida).

    // Pílula NX
    pillEl = mk('div', [
      'pointer-events:auto', 'display:inline-flex', 'align-items:center', 'gap:5px',
      'padding:3px 9px', 'height:24px', 'box-sizing:border-box', 'border-radius:12px',
      'background:rgba(13,17,23,.92)', 'border:1px solid #30363d', 'cursor:grab',
      'user-select:none', 'box-shadow:0 2px 10px rgba(0,0,0,.45)', 'white-space:nowrap'
    ].join(';'));
    dotEl = mk('span', 'width:7px;height:7px;border-radius:50%;background:#8b949e;flex:0 0 auto');
    pillTxt = mk('span', 'color:#c9d1d9;font-weight:700', 'NX');
    pillEl.title = 'Clique para expandir · segure para arrastar · duplo clique volta ao topo central';
    pillEl.appendChild(dotEl);
    pillEl.appendChild(pillTxt);
    wrap.appendChild(pillEl);
    pillEl.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!openUI, true); });

    // Cartão expansível do painel NX
    cardEl = mk('div', [
      'pointer-events:auto', 'display:none', 'margin-top:6px',
      'width:100%', 'max-width:calc(100vw - 16px)', 'box-sizing:border-box', 'text-align:left',
      'background:rgba(13,17,23,.96)', 'border:1px solid #30363d', 'border-radius:10px',
      'padding:8px 9px 9px', 'box-shadow:0 8px 26px rgba(0,0,0,.55)'
    ].join(';'));

    const head = mk('div', 'display:flex;align-items:center;justify-content:space-between;' +
      'margin-bottom:5px;cursor:move;user-select:none');
    head.appendChild(mk('span', 'font-weight:700;color:#e6edf3', 'NimboXcloud v' + VER));
    const closeBtn = mk('span', 'cursor:pointer;color:#8b949e;padding:0 3px;font-size:14px;line-height:1', '×');
    closeBtn.title = 'Recolher';
    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); setOpen(false, true); });
    head.appendChild(closeBtn);
    cardEl.appendChild(head);
    bindDrag(head, null);

    el.status = mk('div', 'line-height:1.6');
    el.qos = mk('div', 'line-height:1.6;margin-top:3px');
    el.hint = mk('div', 'margin-top:3px;color:#d29922;font-size:10px;line-height:1.45;display:none');
    cardEl.appendChild(el.status);
    cardEl.appendChild(el.qos);
    cardEl.appendChild(el.hint);

    const row1 = mk('div', 'display:flex;gap:5px;flex-wrap:wrap;margin-top:7px');
    el.btnSrv = pillBtn('Data center', function () { openPicker('srv'); });
    el.btnRes = pillBtn('Qualidade', function () { openPicker('res'); });
    el.btnBitrate = pillBtn('Bitrate', function () { openPicker('bitrate'); });
    el.btnV4 = pillBtn('IPv4', toggleV4);
    el.btnRegion = pillBtn('Região da loja', function () { openPicker('region'); });
    el.btnSrv.title = 'Abra para escolher o data center (vale na próxima partida, sem recarregar)';
    el.btnRes.title = 'Abra para escolher a faixa de qualidade (vale na próxima partida, sem recarregar)';
    el.btnRegion.title = 'Abra para escolher a região da loja (recarrega a página uma vez ao selecionar)';
    // Estes botões abrem/fecham o menu por conta própria; não podem ser tratados como clique externo pelo "clicar fora recolhe"
    [el.btnSrv, el.btnRes, el.btnBitrate, el.btnRegion].forEach(function (b) { b.setAttribute('data-xcu-pick', '1'); });
    row1.appendChild(el.btnSrv);
    row1.appendChild(el.btnRes);
    row1.appendChild(el.btnBitrate);
    row1.appendChild(el.btnV4);
    row1.appendChild(el.btnRegion);
    cardEl.appendChild(row1);

    // Lista de opções: é um bloco dentro do cartão, não uma camada fixed — o painel fica dentro
    // do elemento em tela cheia, e uma camada fixed seria cortada em tela cheia.
    // Expandir só aumenta a altura do cartão; a posição da pílula não é afetada.
    pickEl = mk('div', [
      'display:none', 'margin-top:5px', 'padding:3px', 'box-sizing:border-box',
      'border:1px solid #30363d', 'border-radius:7px',
      'background:rgba(6,10,15,.55)', 'max-height:210px', 'overflow:auto'
    ].join(';'));
    cardEl.appendChild(pickEl);

    const row2 = mk('div', 'display:flex;gap:5px;flex-wrap:wrap;margin-top:5px');
    const copyBtn = pillBtn('Copiar relatório', copyAll);
    const resetBtn = pillBtn('Limpar cache e recarregar', hardReload);
    copyBtn.style.flex = '1';
    row2.appendChild(copyBtn);
    row2.appendChild(resetBtn);
    cardEl.appendChild(row2);

    wrap.appendChild(cardEl);
    host.appendChild(wrap);
    return wrap;
  }

  function setOpen(v, byUser) {
    openUI = !!v;
    if (byUser) userTouched = true;
    if (!cardEl) return;
    cardEl.style.display = openUI ? 'block' : 'none';
    if (!openUI) closePicker();
    else update();
  }

  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; update(); }, 150);
  }

  function isPrivateIp(ip) {
    return /^10\./.test(ip) || /^192\.168\./.test(ip) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip) || /^169\.254\./.test(ip) || /^127\./.test(ip);
  }

  function hintOne(q, loss) {
    if (!q) return '';
    if (loss != null && loss > 5) {
      if (!v4on()) return 'Perda alta: clique em "IPv4" para voltar ao modo forçado';
      if (srvCfg().name !== 'JAPANEAST') return 'Perda de ' + loss.toFixed(1) + '%: clique em "Data center", escolha Tóquio e compare outra partida';
      return 'Tóquio também perde ' + loss.toFixed(1) + '% → problema de linha, não de qualidade nem de data center';
    }
    if (q.decoded || q.dropped) {
      const dr = q.dropped / ((q.decoded + q.dropped) || 1) * 100;
      if (dr > 5 && (loss == null || loss < 3)) return 'Quadros descartados ' + dr.toFixed(1) + '% mas perda baixa → a decodificação local não acompanha';
    }
    if (q.family === 'IPv6') return 'Usando IPv6; clique em "IPv4" para alternar e comparar';
    if (loss != null && loss < 2) return '';
    return '';
  }

  function update() {
    if (!buildUI()) return;

    const c = cfg();
    const q = S.qos;
    const loss = q ? (q.instLoss != null ? q.instLoss : (q.loss || 0)) : null;

    // A pílula mostra só a perda de pacotes; a cor indica o estado
    dotEl.style.background = loss == null ? '#8b949e' : (loss < 2 ? '#3fb950' : (loss < 5 ? '#d29922' : '#f85149'));
    pillTxt.textContent = 'NX' + (loss == null ? '' : ' · ' + loss.toFixed(1) + '%');

    if (!openUI) return;

    // Linha de status: os valores configurados já aparecem nos botões abaixo, então esta linha
    // só faz sentido quando "real ≠ configurado". Se coincidem, a linha some e o espaço vai
    // para as leituras do link.
    const wantT = String(c.territory || '').toUpperCase();
    const curT = String(getCookie('territory') || '').toUpperCase();
    // expAfter começa com o texto provisório "(não passou)"; só vale se for um código de região de duas letras
    const expRaw = String(S.expAfter || '').toUpperCase();
    const expT = /^[A-Z]{2}$/.test(expRaw) ? expRaw : '';
    const diffs = [];
    if (wantT) {
      if (!curT) diffs.push('cookie territory ausente');
      else if (curT !== wantT) diffs.push('territory real ' + curT + ', configurado ' + wantT);
      if (expT && expT !== wantT) diffs.push('IP detectado como ' + expT + ', não foi alterado para ' + wantT);
    }
    if (diffs.length) {
      el.status.innerHTML = '<span style="color:#f85149">⚠ ' + diffs.join(' · ') + '</span>';
      el.status.style.display = 'block';
    } else {
      el.status.style.display = 'none';
    }

    if (!q) {
      el.qos.innerHTML = '<span style="color:#8b949e">Sem streaming ativo (pode abrir jogos normalmente)</span>';
      el.hint.style.display = 'none';
    } else {
      const col = loss < 2 ? '#3fb950' : (loss < 5 ? '#d29922' : '#f85149');
      const dr = (q.decoded || q.dropped) ? (q.dropped / ((q.decoded + q.dropped) || 1) * 100) : null;
      el.qos.innerHTML =
        'Perda <b style="color:' + col + '">' + loss.toFixed(1) + '%</b>' +
        (q.rtt != null ? ' · <b>' + q.rtt + 'ms</b>' : '') +
        (q.kbps ? ' · ' + (q.kbps / 1000).toFixed(1) + 'Mbps' : '') +
        (q.w ? ' · ' + q.h + 'p' : '') +
        '<br><span style="color:#8b949e">' + (S.serverActual || 'Auto') +
        (q.family ? ' · ' + q.family : '') +
        (q.codec ? ' · ' + q.codec : '') +
        (dr != null ? ' · Descartados ' + dr.toFixed(1) + '%' : '') + '</span>';

      const h = hintOne(q, loss);
      if (h) { el.hint.textContent = '⚠ ' + h; el.hint.style.display = 'block'; }
      else el.hint.style.display = 'none';
    }

    el.btnSrv.textContent = 'Data center ' + srvBtnLabel() + ' ▾';
    el.btnRes.textContent = 'Qualidade ' + resBtnLabel() + ' ▾';
    el.btnBitrate.textContent = 'Bitrate ' + bitrateCfg().label + ' ▾';
    el.btnV4.textContent = 'IPv4 ' + (v4on() ? 'forçado' : 'off');
    el.btnRegion.textContent = 'Região da loja ' + c.name + ' ▾';
  }

  // ---------- 14. Configurações: abrir a lista e escolher o valor direto ----------
  // Antes era "um clique troca para o próximo valor". Mudar a região da loja recarrega a página
  // inteira, e ciclar exigia muitos cliques e reentrar no jogo várias vezes; por isso agora
  // lista todas as opções e escolhe com um clique:
  //   · Data center / qualidade: vale ao selecionar (na próxima partida usa o novo valor), sem recarregar
  //   · Região da loja: recarrega a página uma vez após selecionar
  //   · O menu é um bloco dentro do cartão (ver buildUI), não é cortado em tela cheia
  let pickKind = '';   // '' | 'srv' | 'res' | 'region'

  function pickApply(kind, k) {
    if (kind === 'srv') {
      setPref(LS_SRV, k);
      S.serverActual = '';
      S.serverPin = SERVERS[k].name;
      return false;
    }
    if (kind === 'bitrate') {
      setPref(LS_BITRATE, k);
      return false;
    }
    if (kind === 'res') {
      setPref(LS_RES, k);
      return false;
    }
    if (kind === 'region') {
      setPref(LS_KEY, k);
      return true;   // precisa recarregar
    }
    return false;
  }

  function pickCur(kind) {
    if (kind === 'srv') return getPref(LS_SRV, 'auto');
    if (kind === 'res') return getPref(LS_RES, 'auto');
    if (kind === 'bitrate') return getPref(LS_BITRATE, 'auto');
    return cfg().key;
  }

  function pickItems(kind) {
    if (kind === 'bitrate') return Object.keys(BITRATE_MODES).map(function(k) {
      return { k: k, label: BITRATE_MODES[k].label, sub: k === 'auto' ? 'sem limite local' : 'teto SDP (experimental)' };
    });
    if (kind === 'srv') {
      return Object.keys(SERVERS).map(function (k) {
        return { k: k, label: SERVERS[k].label, sub: SERVERS[k].name || 'definido pelo servidor' };
      });
    }
    if (kind === 'res') {
      return Object.keys(RES_MODES).map(function (k) {
        const m = RES_MODES[k];
        return {
          k: k, label: m.label,
          sub: m.osName === 'tizen' ? 'perfil HQ de streaming' : (m.osName === 'windows' ? 'perfil 1080p' : 'perfil 720p')
        };
      });
    }
    const out = Object.keys(REGIONS).map(function (k) {
      return { k: k, label: REGIONS[k].name, sub: REGIONS[k].territory };
    });
    out.push({ k: 'off', label: 'Desligar desbloqueio', sub: 'sem reescrita' });
    return out;
  }

  function openPicker(kind) {
    pickKind = pickKind === kind ? '' : kind;
    renderPicker();
  }

  function closePicker() {
    pickKind = '';
    renderPicker();
  }

  function syncPickBtns() {
    [['srv', el.btnSrv], ['res', el.btnRes], ['bitrate', el.btnBitrate], ['region', el.btnRegion]].forEach(function (p) {
      if (p[1]) p[1].style.borderColor = pickKind === p[0] ? '#1f6feb' : '#30363d';
    });
  }

  function renderPicker() {
    if (!pickEl) return;
    syncPickBtns();
    if (!pickKind) {
      pickEl.style.display = 'none';
      pickEl.textContent = '';
      return;
    }
    pickEl.textContent = '';
    pickEl.style.display = 'block';

    const kind = pickKind;
    const titles = { srv: 'Data center', res: 'Qualidade', bitrate: 'Limite de bitrate (próxima partida)', region: 'Região da loja (recarrega a página ao selecionar)' };
    pickEl.appendChild(mk('div', 'color:#8b949e;font-size:10px;padding:2px 6px 4px', titles[kind]));

    const cur = pickCur(kind);
    pickItems(kind).forEach(function (it) {
      const on = it.k === cur;
      const row = mk('div', [
        'display:flex', 'align-items:center', 'justify-content:space-between', 'gap:8px',
        'padding:4px 6px', 'border-radius:5px', 'cursor:pointer',
        on ? 'background:rgba(31,111,235,.18)' : ''
      ].join(';'));
      row.appendChild(mk('span', 'color:' + (on ? '#58a6ff' : '#c9d1d9'), (on ? '✓ ' : '') + it.label));
      row.appendChild(mk('span', 'color:#6e7681;font-size:10px', it.sub || ''));
      row.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      row.addEventListener('pointerenter', function () {
        if (!on) row.style.background = 'rgba(110,118,129,.16)';
      });
      row.addEventListener('pointerleave', function () {
        row.style.background = on ? 'rgba(31,111,235,.18)' : 'transparent';
      });
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        const needReload = pickApply(kind, it.k);
        closePicker();
        if (needReload) location.reload();
        else update();
      });
      pickEl.appendChild(row);
    });
  }

  // Clicar fora do cartão recolhe o menu (cliques no menu e nos três botões não contam como "fora")
  document.addEventListener('pointerdown', function (e) {
    if (!pickKind) return;
    const t = e.target;
    if (t && pickEl && pickEl.contains(t)) return;
    if (t && t.closest && t.closest('[data-xcu-pick]')) return;
    closePicker();
  }, true);

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

  function buildReport() {
    return JSON.stringify({
      v: VER,
      url: location.href,
      inputCapabilities: inputCapabilities(),
      inputNegotiation: lastInputNegotiation,
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

    // Ao entrar no streaming, o contêiner da imagem costuma ter role="dialog", e em tela cheia o
    // painel já recolhe sozinho; a pílula precisa continuar visível e clicável (no Steam Deck é
    // preciso clicá-la com o cursor do controle).
    // Usa "ainda houve amostra de QoS nos últimos 8 segundos" e não "já houve uma conexão",
    // senão, ao sair do streaming, S.pcs não zera e o painel nunca mais cede lugar a diálogos do site.
    const streaming = !!(S.qosAt && (Date.now() - S.qosAt < 8000));
    // Um dialogo do xCloud nao pode esconder a interface do NimboXcloud.
    // A visibilidade depende somente da acao do usuario.
    if (cardEl) cardEl.style.display = openUI ? 'block' : 'none';
    if (pillEl) {
      pillEl.style.display = 'inline-flex';
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

  function boot() {
    buildUI();
    update();
    tick();
    // O site pode substituir o body durante a inicializacao do React.
    // Recria/reataca o painel quando a arvore de documentos muda.
    const panelObserver = new MutationObserver(function () {
      if (wrap && !wrap.isConnected) {
        const host = mountTarget();
        if (host) host.appendChild(wrap);
      }
    });
    panelObserver.observe(document.documentElement, { childList: true, subtree: false });
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