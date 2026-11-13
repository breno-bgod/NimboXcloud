'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const main = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
const touch = fs.readFileSync(path.join(__dirname, '..', 'modules', 'NimboXcloud-Touch-HUD.user.js'), 'utf8');
function section(source, start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'source section: ' + start);
  return source.slice(a, b);
}
const clean = value => JSON.parse(JSON.stringify(value));
function transportHarness(initial = {}) {
  const config = { enableKeyboardInput: false, enableMouseInput: false, enableAbsoluteMouse: true,
    enableTouchInput: true, maxTouchPoints: 10, ...initial };
  const calls = [], ctx = { setTimeout, clearTimeout };
  const raw = { connectionState: 'Connected', isShutdown: false, configuration: { inputConfiguration: config },
    onVirtualMouseInput() {}, updateInputConfigurationAsync(options) {
      calls.push(clean(options)); Object.assign(config, options); return Promise.resolve();
    } };
  vm.runInNewContext('function nimboApplyInput(raw,options){return raw.updateInputConfigurationAsync(options);}\n' +
    section(touch, 'class NimboXboxTransport {', '\nfunction nimboApplyInput') +
    '\nglobalThis.create = raw => new NimboXboxTransport(raw);', ctx);
  return { config, calls, raw, transport: ctx.create(raw) };
}
function configurationHarness(mode = 'native', pads = 0) {
  const context = { Response, Headers, Promise,
    nxPhysicalInputMode: () => mode, nxPhysicalInputState: {}, inputCapabilities: () => ({ gamepadsConnected: pads }) };
  vm.runInNewContext('let touchSessionDiagnostics;\n' +
    section(main, '  function rewriteJson(res, fn) {', '  // ---------- 5.') +
    section(main, '  function patchTouchSessionConfiguration(response) {', '  // Pointer Lock pertence') +
    '\nglobalThis.patch = patchTouchSessionConfiguration;', context);
  return context;
}

test('physical keyboard and mouse enable both native fields while preserving native touch', async () => {
  const h = transportHarness();
  const status = await h.transport.setPhysicalInputMode('keyboard-mouse');
  assert.deepEqual(h.calls[0], { enableKeyboardInput: true, enableMouseInput: true, enableAbsoluteMouse: false });
  assert.equal(h.config.enableTouchInput, true);
  assert.equal(h.config.maxTouchPoints, 10);
  assert.equal(status.state, 'configured');
  await h.transport.setPhysicalInputMode('native');
  assert.equal(h.config.enableKeyboardInput, false);
  assert.equal(h.config.enableMouseInput, false);
  assert.equal(h.config.enableAbsoluteMouse, true);
  assert.equal(h.config.enableTouchInput, true);
});

test('gamepad preference requests native keyboard/mouse off without creating a virtual controller', async () => {
  const h = transportHarness({ enableKeyboardInput: true, enableMouseInput: true });
  assert.equal((await h.transport.setPhysicalInputMode('gamepad')).state, 'configured');
  assert.equal(h.config.enableKeyboardInput, false);
  assert.equal(h.config.enableMouseInput, false);
  assert.ok(h.calls.every(call => !Object.hasOwn(call, 'enableGamepadInput') && !Object.hasOwn(call, 'enableTouchInput')));
  await h.transport.setPhysicalInputMode('native');
  assert.equal(h.config.enableKeyboardInput, true);
  assert.equal(h.config.enableMouseInput, true);
});

test('virtual HUD restoration returns to the physical configuration before native restoration', async () => {
  const h = transportHarness();
  await h.transport.setPhysicalInputMode('keyboard-mouse');
  await h.transport.activateKeyboardMouse();
  await h.transport.restore();
  assert.equal(h.config.enableKeyboardInput, true);
  assert.equal(h.config.enableMouseInput, true);
  assert.equal(h.transport.physicalMode, 'keyboard-mouse');
  await h.transport.setPhysicalInputMode('native');
  assert.equal(h.config.enableKeyboardInput, false);
  assert.equal(h.config.enableMouseInput, false);
});

test('native changes made after physical activation are not overwritten on restore', async () => {
  const h = transportHarness();
  await h.transport.setPhysicalInputMode('keyboard-mouse');
  h.config.enableMouseInput = false;
  h.config.enableTouchInput = false;
  await h.transport.setPhysicalInputMode('native');
  assert.equal(h.config.enableMouseInput, false);
  assert.equal(h.config.enableTouchInput, false);
  assert.equal(Object.hasOwn(h.calls.at(-1), 'enableMouseInput'), false);
});

test('partial physical activation failure restores owned fields and rejects the request', async () => {
  const h = transportHarness(); let first = true;
  h.raw.updateInputConfigurationAsync = options => {
    h.calls.push(clean(options)); Object.assign(h.config, options);
    if (first) { first = false; return Promise.reject(new Error('rejected')); }
    return Promise.resolve();
  };
  await assert.rejects(h.transport.setPhysicalInputMode('keyboard-mouse'), /rejected/);
  assert.equal(h.config.enableKeyboardInput, false);
  assert.equal(h.config.enableMouseInput, false);
  assert.equal(h.config.enableTouchInput, true);
  assert.equal(h.transport.physicalMode, 'native');
});

test('unrecognized or disconnected physical configurations fail without fabricating capabilities', async () => {
  const h = transportHarness(); delete h.config.enableKeyboardInput;
  await assert.rejects(h.transport.setPhysicalInputMode('keyboard-mouse'), /indisponível/);
  assert.equal(h.calls.length, 0);
  h.raw.connectionState = 'Disconnected';
  await assert.rejects(h.transport.setPhysicalInputMode('gamepad'), /conectada/);
  await assert.rejects(h.transport.setPhysicalInputMode('invalid'), /inválido/);
});

test('disposal serializes after physical activation and restores the previous native configuration', async () => {
  const h = transportHarness();
  const activation = h.transport.setPhysicalInputMode('keyboard-mouse');
  const disposal = h.transport.dispose();
  await activation; await disposal;
  assert.equal(h.transport.disposed, true);
  assert.equal(h.config.enableKeyboardInput, false);
  assert.equal(h.config.enableMouseInput, false);
  await assert.rejects(h.transport.setPhysicalInputMode('keyboard-mouse'), /conectada/);
});

test('automatic input leaves the configuration response unchanged', async () => {
  const h = configurationHarness();
  const response = new Response('{"anything":true}');
  assert.equal(await h.patch(response), response);
});

for (const encoded of [true, false]) test('explicit physical mode patches known overrides and preserves touch (' + encoded + ')', async () => {
  const h = configurationHarness('keyboard-mouse');
  const input = { enableKeyboardInput: false, enableMouseInput: false, enableTouchInput: true, maxTouchPoints: 10 };
  const overrides = { inputConfiguration: input, otherOption: 7 };
  const response = new Response(JSON.stringify({ clientStreamingConfigOverrides: encoded ? JSON.stringify(overrides) : overrides, untouched: 9 }));
  const output = await (await h.patch(response)).json();
  assert.equal(typeof output.clientStreamingConfigOverrides, encoded ? 'string' : 'object');
  const config = encoded ? JSON.parse(output.clientStreamingConfigOverrides) : output.clientStreamingConfigOverrides;
  assert.deepEqual(config.inputConfiguration, { ...input, enableKeyboardInput: true, enableMouseInput: true });
  assert.equal(config.otherOption, 7); assert.equal(output.untouched, 9);
  assert.equal(h.nxPhysicalInputState.negotiatedMode, 'keyboard-mouse');
});

test('direct known input configuration is supported without overriding touch', async () => {
  const h = configurationHarness('gamepad', 1);
  const response = new Response(JSON.stringify({ inputConfiguration: { enableKeyboardInput: true, enableMouseInput: true, enableTouchInput: true } }));
  const output = await (await h.patch(response)).json();
  assert.deepEqual(output.inputConfiguration, { enableKeyboardInput: false, enableMouseInput: false, enableTouchInput: true });
});

test('unknown configuration schemas and invalid JSON retain the original response', async () => {
  const h = configurationHarness('keyboard-mouse');
  for (const body of ['invalid json', '{}', '{"clientStreamingConfigOverrides":"invalid"}',
    '{"clientStreamingConfigOverrides":[]}', '{"clientStreamingConfigOverrides":{"inputConfiguration":[]}}']) {
    const response = new Response(body); assert.equal(await h.patch(response), response);
  }
});

test('no physical gamepad means no gamepad-mode rewrite', async () => {
  const h = configurationHarness('gamepad', 0);
  const response = new Response('{"inputConfiguration":{"enableKeyboardInput":true}}');
  assert.equal(await h.patch(response), response);
});

test('Desktop experience uses pointer capabilities without identifying DeX or changing the UA', () => {
  for (const width of [480, 1200]) {
    const navigator = { userAgent: 'Mozilla Android', maxTouchPoints: 10 };
    const ctx = { navigator, innerWidth: width, window: { matchMedia: query => ({ matches: query === '(any-pointer:fine)' }) } };
    vm.runInNewContext(section(main, '  function detectedDeviceProfile() {', '  function nxDeviceProfilePreference()') +
      '\nglobalThis.detect = detectedDeviceProfile;', ctx);
    assert.equal(ctx.detect(), 'desktop');
    assert.equal(navigator.userAgent, 'Mozilla Android');
  }
  const ctx = { navigator: { userAgent: 'Android' }, window: { matchMedia: () => ({ matches: false }) } };
  vm.runInNewContext(section(main, '  function detectedDeviceProfile() {', '  function nxDeviceProfilePreference()') + '\nglobalThis.detect=detectedDeviceProfile;', ctx);
  assert.equal(ctx.detect(), 'mobile');
});

test('legacy DeX preference is presented as Desktop without erasing saved settings', () => {
  const ctx = { LS_DEVICE_PROFILE: 'device', getPref: () => 'dex' };
  vm.runInNewContext(section(main, '  function nxDeviceProfilePreference() {', '  function nxDeviceProfileLabel(') + '\nglobalThis.read=nxDeviceProfilePreference;', ctx);
  assert.equal(ctx.read(), 'desktop');
});

test('public physical activation pauses HUD and uses only the current cloud transport', async () => {
  const calls = [];
  const owner = { connected: () => true, setPhysicalInputMode: async mode => { calls.push(mode); return { mode, state: 'configured' }; } };
  const ctx = { ui: { wanted: true, active: true, stop() { calls.push('stop-hud'); } }, nimboTransport: owner,
    nimboHasPhysicalGamepad: () => false };
  vm.runInNewContext(section(touch, 'async function nimboSetPhysicalInputMode(mode){', 'const NIMBO_INPUT_MODES=') +
    '\nglobalThis.apply=nimboSetPhysicalInputMode;', ctx);
  assert.equal((await ctx.apply('keyboard-mouse')).state, 'configured');
  assert.deepEqual(calls, ['stop-hud', 'keyboard-mouse']);
  await assert.rejects(ctx.apply('gamepad'), /Conecte/);
  ctx.ui.remoteMode = true;
  await assert.rejects(ctx.apply('keyboard-mouse'), /xCloud/);
});

test('physical preference is saved before a current-session request and no gamepad is fabricated', async () => {
  const prefs = new Map(), calls = [];
  let pads = 0;
  const ctx = { LS_PHYSICAL_INPUT: 'mode', getPref: (k, d) => prefs.get(k) || d,
    setPref: (k, v) => prefs.set(k, v), inputCapabilities: () => ({ gamepadsConnected: pads }),
    renderBody() {}, toast: message => calls.push(message),
    window: { NimboTouch: { setPhysicalInputMode: async mode => { calls.push(['apply', mode, prefs.get('mode')]); } } } };
  vm.runInNewContext(section(main, '  const nxPhysicalInputState = ', '  function nxPhysicalInputGroup(') +
    '\nglobalThis.apply=nxChoosePhysicalInputMode;globalThis.state=nxPhysicalInputState;', ctx);
  assert.equal(await ctx.apply('gamepad'), false);
  assert.equal(prefs.size, 0);
  assert.equal(await ctx.apply('keyboard-mouse'), true);
  assert.deepEqual(calls.at(-1), ['apply', 'keyboard-mouse', 'keyboard-mouse']);
  pads = 1;
  assert.equal(await ctx.apply('gamepad'), true);
  assert.equal(prefs.get('mode'), 'gamepad');
  assert.equal(await ctx.apply('native'), true);
  assert.equal(prefs.get('mode'), 'native');
  ctx.setPref = () => {};
  assert.equal(await ctx.apply('keyboard-mouse'), false);
  assert.equal(prefs.get('mode'), 'native');
});

test('physical mode summary does not claim gameplay confirmation when SDK only accepts a request', () => {
  const ctx = { LS_PHYSICAL_INPUT: 'mode', getPref: () => 'keyboard-mouse',
    window: { NimboTouch: { physicalInputStatus: () => ({ connected: true, mode: 'keyboard-mouse', state: 'requested' }) } } };
  vm.runInNewContext(section(main, '  const nxPhysicalInputState = ', '  async function nxChoosePhysicalInputMode(') +
    '\nglobalThis.summary=nxPhysicalInputSummary;', ctx);
  assert.match(ctx.summary(), /não confirmado/);
});

test('physical UI is separate from the touch HUD and monitor names bitrate explicitly', () => {
  assert.match(main, /TAB_BUILDERS\.inputs=nxInputModePage/);
  assert.match(main, /nxChooseInputMode\(nxSelectedInputMode\(\)==='virtual-keyboard-mouse'/);
  assert.match(main, /Ativar HUD de teclado e mouse por toque/);
  const monitor = section(main, '  function nxTelemetryTick(){', '  setInterval(nxTelemetryTick,');
  assert.match(monitor, /bitrate:'Bitrate '/);
  assert.doesNotMatch(monitor, /bitrate:'BR '/);
  assert.doesNotMatch(main, /Element\.prototype\.requestPointerLock\s*=/);
});
