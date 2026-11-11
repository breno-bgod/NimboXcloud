'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

const sectionStart = src.indexOf('  const NX_INPUT_APPLY_KEY = ');
const sectionEnd = src.indexOf('  // Telemetria agregada de fontes de entrada;', sectionStart);
assert.ok(sectionStart > 0 && sectionEnd > sectionStart, 'Gamepad bridge boundaries not found');
const bridgeSource = src.slice(sectionStart, sectionEnd);

function boot(settings, nativePads, configure) {
  const store = { ...settings };
  const nativeGet = () => nativePads;
  const navigator = { getGamepads: nativeGet };
  if (configure) configure(navigator);
  const ctx = {
    navigator,
    Date, Number, Object, Array, Math, String,
    nxGyroPreview: { enabled: false },
    nxGyroPreviewState: () => ({ calibrated: false }),
    nxPreviewAxis: (value, profile) => value,
    getPref: (key, fallback) => Object.hasOwn(store, key) ? store[key] : fallback,
    setPref: (key, value) => { store[key] = value; }
  };
  const source = bridgeSource + '\n globalThis.__testBridge = nxInputBridge; globalThis.__restore = nxRestoreNativeGamepads; globalThis.__status = nxInputBridgeStatus; globalThis.__install = nxInstallInputBridge;';
  vm.runInNewContext(source, ctx, { timeout: 1000 });
  return { navigator, store, bridge: ctx.__testBridge, restore: ctx.__restore, status: ctx.__status, install: ctx.__install, nativeGet };
}
test('native Gamepad API is untouched when experimental modules are disabled', () => {
  const a = boot({}, []);
  assert.equal(a.navigator.getGamepads, a.nativeGet);
  assert.equal(a.bridge.installed, false);
});
test('experimental axis profile can be reverted to native Gamepad API', () => {
  const pad = { id: 'pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: [] };
  const a = boot({ 'nx.input.applyAxes.v1': '1' }, [pad]);
  assert.equal(a.bridge.installed, true);
  assert.equal(a.navigator.getGamepads()[0].id, 'pad');
  a.restore('test restore');
  assert.equal(a.navigator.getGamepads, a.nativeGet);
  assert.equal(a.store['nx.input.applyAxes.v1'], '0');
  assert.equal(a.store['nx.gyro.gameInput.v1'], '0');
});
test('foreign Gamepad API owner is never overwritten on restore', () => {
  const a = boot({ 'nx.input.applyAxes.v1': '1' }, []);
  const foreign = () => [];
  a.navigator.getGamepads = foreign;
  a.restore('test foreign override');
  assert.equal(a.navigator.getGamepads, foreign);
  assert.equal(a.bridge.foreignOverride, true);
});

test('status inspection does not modify stored settings when another script takes over', () => {
  const a = boot({ 'nx.input.applyAxes.v1': '1', 'nx.gyro.gameInput.v1': '0' }, []);
  const foreign = () => [];
  a.navigator.getGamepads = foreign;
  const before = JSON.stringify(a.store);
  assert.match(a.status(), /Outro script controla/);
  assert.equal(JSON.stringify(a.store), before);
  assert.equal(a.navigator.getGamepads, foreign);
});

test('repeated native restore does not overwrite another script', () => {
  const a = boot({ 'nx.input.applyAxes.v1': '1' }, []);
  a.restore('first');
  const foreign = () => [];
  a.navigator.getGamepads = foreign;
  a.restore('second');
  assert.equal(a.navigator.getGamepads, foreign);
});
test('disabled bridge does not replace existing native Gamepad function', () => {
  const foreign = () => [];
  const a = boot({}, [], nav => { nav.getGamepads = foreign; });
  assert.equal(a.navigator.getGamepads, foreign);
  assert.equal(a.bridge.installed, false);
});

test('non-configurable native Gamepad API is never replaced', () => {
  const a = boot({ 'nx.input.applyAxes.v1': '1' }, [], nav => {
    Object.defineProperty(nav, 'getGamepads', {
      value: nav.getGamepads, configurable: false, writable: false
    });
  });
  assert.equal(a.bridge.installed, false);
  assert.match(a.bridge.error, /não configurável/);
});
test('non-standard controllers are passed through without rewriting their identity', () => {
  const pad = { id: 'custom', index: 0, connected: true, mapping: '', axes: [0.4, -0.4], buttons: [] };
  const a = boot({ 'nx.input.applyAxes.v1': '1' }, [pad]);
  assert.equal(a.navigator.getGamepads()[0], pad);
});

test('repeated bridge installation never replaces an existing owner', () => {
  const a = boot({ 'nx.input.applyAxes.v1': '1' }, []);
  const original = a.navigator.getGamepads;
  assert.equal(a.bridge.installed, true);
  // A segunda chamada deve preservar o wrapper da própria ponte.
  a.install();
  assert.equal(a.navigator.getGamepads, original);
  assert.equal(original, a.bridge.wrapper);
  const foreign = () => [];
  a.navigator.getGamepads = foreign;
  a.install();
  assert.equal(a.navigator.getGamepads, foreign);
  assert.equal(a.bridge.foreignOverride, true);
});
