'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'source section: ' + start);
  return source.slice(a, b);
}
function harness() {
  const prefs = new Map(), caps = [];
  const S = { serverCatalog: null, serverCatalogStatus: 'waiting', serverActual: '', serverPin: '',
    serverFallback: '', latencyByServer: Object.create(null) };
  const context = {
    URL, Request, Response, Headers, Promise, Date, S,
    LS_SRV: 'server', LS_AUTO_BEST: 'best',
    getPref: (key, fallback) => prefs.get(key) || fallback,
    setPref: (key, value) => prefs.set(key, value),
    GSSV_RE: /(^|\.)gssv-play-[a-z0-9-]*\.xboxlive\.com$/i,
    schedule() {}, addCap: item => caps.push(item), nowStr: () => '12:00:00'
  };
  vm.runInNewContext(
    section('  const SERVERS = {', '  // A qualidade') +
    section('  // Catálogo da sessão:', '  function resCfg()') +
    section('  function rewriteJson(res, fn) {', '  // ---------- 5.') +
    section('  function rewriteRegions(res, u) {', '  // ---------- 7.') +
    '\nObject.assign(globalThis, { parseRegion: nxServerRegion, capture: nxCaptureServerCatalog, available: nxServerAvailable, options: nxServerOptions, pick: nxPickServer, observe: nxObserveCloudServer, config: srvCfg, rewrite: rewriteRegions });', context);
  return { ...context, prefs, caps, S, context };
}
function region(name, short = name.toLowerCase(), extra = {}) {
  return { name, baseUri: 'https://' + short + '.core.gssv-play-prod.xboxlive.com', ...extra };
}
const loginUrl = new URL('https://xgpuweb.gssv-play-prod.xboxlive.com/v2/login/user');
function login(regions, extra = {}) {
  return new Response(JSON.stringify({ offeringSettings: { regions }, ...extra }), {
    status: 200, headers: { 'content-type': 'application/json', 'x-test': 'retained' }
  });
}
const clean = value => JSON.parse(JSON.stringify(value));

test('Auto captures all advertised regions without changing the response or retaining credentials', async () => {
  const h = harness();
  const response = login([region('BRAZILSOUTH', 'brs'), region('NEWREGION7', 'new7')], { gsToken: 'private-token' });
  const result = await h.rewrite(response, loginUrl);
  assert.equal(result, response);
  assert.equal(h.S.serverCatalogStatus, 'ready');
  assert.deepEqual(clean(h.S.serverCatalog.map(r => r.name)), ['BRAZILSOUTH', 'NEWREGION7']);
  assert.ok(h.options().some(r => r.k === 'NEWREGION7'));
  assert.equal(JSON.stringify(h.S).includes('private-token'), false);
  assert.equal(h.caps.length, 0);
  assert.equal((await result.json()).gsToken, 'private-token', 'original response remains readable');
});

test('unknown region names are accepted as labels; duplicates and unsafe endpoints are omitted from options', () => {
  const h = harness();
  h.capture({ offeringSettings: { regions: [region('NEWREGION7', 'new7'), region('NEWREGION7', 'duplicate'),
    region('__proto__', 'bad'), region('BADHOST', 'bad', { baseUri: 'https://evil.example/' }), null] } });
  assert.equal(h.S.serverCatalog.length, 1);
  assert.equal(h.S.serverCatalog[0].label, 'NEWREGION7');
  for (const uri of ['http://brs.core.gssv-play-prod.xboxlive.com',
    'https://user:pass@brs.core.gssv-play-prod.xboxlive.com',
    'https://brs.core.gssv-play-prod.xboxlive.com.evil.example',
    'https://brs.core.gssv-play-prod.xboxlive.com:444',
    'https://brs.core.gssv-play-prodxhome.xboxlive.com'])
    assert.equal(h.parseRegion(region('BRAZILSOUTH', 'brs', { baseUri: uri })), null, uri);
});

test('only sanitized metadata is retained, with no arbitrary response fields or query strings', () => {
  const h = harness();
  h.capture({ gsToken: 'secret', offeringSettings: { regions: [region('BRAZILSOUTH', 'brs', {
    token: 'also-secret', baseUri: 'https://brs.core.gssv-play-prod.xboxlive.com/?token=secret'
  })] } });
  assert.deepEqual(Object.keys(h.S.serverCatalog[0]).sort(), ['label', 'name', 'origin', 'shortName']);
  assert.equal(JSON.stringify(h.S).includes('secret'), false);
});

test('a new region can be selected and reordered while alternatives and response metadata survive', async () => {
  const h = harness();
  h.prefs.set('server', 'BRAZILSOUTH');
  const response = login([region('EASTUS', 'eus', { isDefault: true }), region('BRAZILSOUTH', 'brs'), region('NEWREGION7', 'new7')]);
  const result = await h.rewrite(response, loginUrl);
  assert.notEqual(result, response);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('x-test'), 'retained');
  const body = await result.json();
  assert.deepEqual(body.offeringSettings.regions.map(r => r.name), ['BRAZILSOUTH', 'EASTUS', 'NEWREGION7']);
  assert.deepEqual(body.offeringSettings.regions.map(r => !!r.isDefault), [true, false, false]);
  assert.equal(h.S.serverPin, 'BRAZILSOUTH');
  assert.equal(h.S.serverActual, '', 'preference does not prove the endpoint used');
});

test('an already preferred default is idempotent and retains response identity', async () => {
  const h = harness(); h.prefs.set('server', 'BRAZILSOUTH');
  const response = login([region('BRAZILSOUTH', 'brs', { isDefault: true }), region('EASTUS', 'eus')]);
  assert.equal(await h.rewrite(response, loginUrl), response);
  assert.equal(h.S.serverPin, 'BRAZILSOUTH');
});

test('a missing preferred region retains native fallback and does not overwrite the active destination', async () => {
  const h = harness(); h.prefs.set('server', 'BRAZILSOUTH');
  h.S.serverActual = 'JAPANEAST'; h.S.serverPin = 'BRAZILSOUTH';
  const response = login([region('EASTUS', 'eus', { isDefault: true })]);
  assert.equal(await h.rewrite(response, loginUrl), response);
  assert.equal(h.S.serverActual, 'JAPANEAST');
  assert.equal(h.S.serverPin, '');
  assert.match(h.S.serverFallback, /indisponível/);
  assert.equal(h.prefs.get('server'), 'BRAZILSOUTH', 'temporary unavailability does not erase saved choice');
  assert.ok(h.options().find(r => r.k === 'BRAZILSOUTH').disabled);
});

test('legacy selection keys still resolve to their original region', async () => {
  for (const [key, name] of [['ejp', 'JAPANEAST'], ['ckr', 'KOREACENTRAL'], ['eus', 'EASTUS'], ['weu', 'WESTEUROPE']]) {
    const h = harness(); h.prefs.set('server', key);
    assert.equal(h.config().name, name);
    const response = login([region('BRAZILSOUTH', 'brs', { isDefault: true }), region(name, key)]);
    const body = await (await h.rewrite(response, loginUrl)).json();
    assert.equal(body.offeringSettings.regions[0].name, name);
    assert.equal(h.prefs.get('server'), key, 'read does not migrate or erase storage');
  }
});

test('selection changes preserve active destination and applied login pin', () => {
  const h = harness(); h.capture({ offeringSettings: { regions: [region('BRAZILSOUTH', 'brs')] } });
  h.S.serverActual = 'EASTUS'; h.S.serverPin = 'EASTUS';
  assert.equal(h.pick('BRAZILSOUTH'), true);
  assert.equal(h.prefs.get('server'), 'BRAZILSOUTH');
  assert.equal(h.S.serverActual, 'EASTUS');
  assert.equal(h.S.serverPin, 'EASTUS');
  assert.equal(h.pick('REMOVEDREGION'), false);
  assert.equal(h.pick('__proto__'), false);
  assert.equal(h.prefs.get('server'), 'BRAZILSOUTH');
  assert.equal(h.pick('auto'), true);
});

test('unavailable storage does not report success or erase fallback feedback', () => {
  const h = harness();
  h.capture({ offeringSettings: { regions: [region('BRAZILSOUTH', 'brs')] } });
  h.S.serverFallback = 'previous fallback';
  h.context.setPref = () => {};
  assert.equal(h.pick('BRAZILSOUTH'), false);
  assert.equal(h.config().name, '');
  assert.equal(h.S.serverFallback, 'previous fallback');
});

test('historical Auto only considers available, fresh regions with sufficient samples', async () => {
  const h = harness(); h.prefs.set('best', '1');
  const at = Date.now();
  Object.assign(h.S.latencyByServer, {
    REMOVEDREGION: { avg: 1, samples: 20, at },
    EASTUS: { avg: 40, samples: 20, at },
    BRAZILSOUTH: { avg: 20, samples: 20, at },
    NEWREGION7: { avg: 2, samples: 2, at },
    STALEREGION: { avg: 1, samples: 20, at: at - 25 * 3600 * 1000 },
    FUTUREREGION: { avg: 1, samples: 20, at: at + 100000 }
  });
  const names = ['EASTUS', 'BRAZILSOUTH', 'NEWREGION7', 'STALEREGION', 'FUTUREREGION'];
  const response = await h.rewrite(login(names.map(n => region(n))), loginUrl);
  assert.equal((await response.json()).offeringSettings.regions[0].name, 'BRAZILSOUTH');
  assert.equal(h.config().name, 'BRAZILSOUTH');
});

test('catalog refresh removes obsolete choices without erasing saved preferences', () => {
  const h = harness(); h.prefs.set('server', 'BRAZILSOUTH');
  h.capture({ offeringSettings: { regions: [region('BRAZILSOUTH', 'brs')] } });
  h.capture({ offeringSettings: { regions: [region('EASTUS', 'eus')] } });
  assert.equal(h.available('BRAZILSOUTH'), false);
  assert.equal(h.options().find(o => o.k === 'BRAZILSOUTH').disabled, true);
  assert.equal(h.prefs.get('server'), 'BRAZILSOUTH');
});

test('failed login and malformed JSON clear stale catalog and forward the original response', async () => {
  for (const response of [new Response('denied', { status: 403 }), new Response('not-json', { status: 200 }),
    login(null), login([]), login([null]), login(Array.from({ length: 129 }, () => region('EASTUS', 'eus')))]) {
    const h = harness(); h.capture({ offeringSettings: { regions: [region('BRAZILSOUTH', 'brs')] } });
    assert.equal(await h.rewrite(response, loginUrl), response);
    assert.equal(h.S.serverCatalog.length, 0);
    assert.equal(h.S.serverPin, '');
  }
});

test('xHome login is completely untouched and cannot replace the cloud catalog', async () => {
  const h = harness(); h.capture({ offeringSettings: { regions: [region('BRAZILSOUTH', 'brs')] } });
  const before = JSON.stringify(h.S);
  for (const host of ['xhome.gssv-play-prod.xboxlive.com', 'home.core.gssv-play-prodxhome.xboxlive.com']) {
    const response = login([region('EASTUS', 'eus')]);
    assert.equal(await h.rewrite(response, new URL('https://' + host + '/v2/login/user')), response);
    assert.equal(JSON.stringify(h.S), before);
  }
});

test('endpoint observation maps short host names to the advertised canonical region', () => {
  const h = harness(); h.capture({ offeringSettings: { regions: [region('BRAZILSOUTH', 'brs')] } });
  h.observe(new URL('https://brs.core.gssv-play-prod.xboxlive.com/v5/sessions/cloud/play'));
  assert.equal(h.S.serverActual, 'BRAZILSOUTH');
  h.observe(new URL('https://ejp.core.gssv-play-prod.xboxlive.com/v5/sessions/cloud/play'));
  assert.equal(h.S.serverActual, 'JAPANEAST', 'known legacy alias works before a full mapping is available');
});

test('the actual fetch hook captures login data in Auto and preserves rejection behavior', async () => {
  const h = harness();
  const response = login([region('BRAZILSOUTH', 'brs')]);
  Object.assign(h.context, { window: { fetch: () => Promise.resolve(response) }, location: { href: 'https://play.xbox.com/' },
    cfg: () => ({ ip: null }), nxObserveOffering: (_url, _method, promise) => promise,
    GEARS_RE: /^gears\.xboxservices\.com$/, EXP_PATH_RE: /experimentation/, CAP_RE: /gssv-play/,
    nxSessionRecord() {}, patchPlayRequest: (input, init) => Promise.resolve({ input, init }),
    rewriteExp: value => Promise.resolve(value), rewriteIce: value => Promise.resolve(value),
    patchTouchSessionConfiguration: value => Promise.resolve(value) });
  vm.runInNewContext(section('  const nativeFetch = window.fetch;', '  // Limite máximo negociado por SDP;'), h.context);
  assert.equal(await h.context.window.fetch(loginUrl.href, { method: 'POST' }), response);
  assert.equal(h.S.serverCatalog[0].name, 'BRAZILSOUTH');
  const failure = new Error('network down');
  const h2 = harness(); Object.assign(h2.context, h.context, { window: { fetch: () => Promise.reject(failure) } });
  vm.runInNewContext(section('  const nativeFetch = window.fetch;', '  // Limite máximo negociado por SDP;'), h2.context);
  await assert.rejects(h2.context.window.fetch(loginUrl.href), error => error === failure);
});

test('selector refreshes on catalog arrival and preserves saved unavailable choices until Auto is selected', () => {
  const h = harness(), liveFns = [], messages = [];
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.listeners = {}; this.style = {}; }
    setAttribute(key, value) { this[key] = value; }
    replaceChildren() { this.children = []; }
    appendChild(child) { this.children.push(child); }
    addEventListener(name, listener) { this.listeners[name] = listener; }
    set value(value) { this.currentValue = value; }
    get value() { return this.currentValue; }
  }
  Object.assign(h.context, { document: { createElement: tag => new Element(tag) }, liveFns,
    toast: message => messages.push(message) });
  vm.runInNewContext(section('  function nxServerSelect() {', '  function chips(') +
    '\nglobalThis.select = nxServerSelect();', h.context);
  const select = h.context.select;
  assert.equal(select.value, 'auto');
  assert.equal(select['aria-label'], 'Servidor de streaming');
  h.capture({ offeringSettings: { regions: [region('BRAZILSOUTH', 'brs'), region('NEWREGION7', 'new7')] } });
  liveFns.forEach(fn => fn());
  assert.deepEqual(select.children.map(o => o.value), ['auto', 'BRAZILSOUTH', 'NEWREGION7']);
  const firstOption = select.children[0]; liveFns.forEach(fn => fn());
  assert.equal(select.children[0], firstOption, 'unchanged live ticks do not rebuild the select');
  h.S.serverActual = 'EASTUS';
  select.value = 'BRAZILSOUTH'; select.listeners.change();
  assert.equal(h.prefs.get('server'), 'BRAZILSOUTH');
  assert.equal(h.S.serverActual, 'EASTUS');
  assert.match(messages.at(-1), /Recarregue/);
  h.capture({ offeringSettings: { regions: [region('NEWREGION7', 'new7')] } });
  liveFns.forEach(fn => fn());
  assert.equal(select.value, 'BRAZILSOUTH');
  assert.equal(select.children.find(o => o.value === 'BRAZILSOUTH').disabled, true);
  select.value = 'auto'; select.listeners.change();
  assert.equal(h.prefs.get('server'), 'auto');
  assert.equal(select.children.length, 2);
});
