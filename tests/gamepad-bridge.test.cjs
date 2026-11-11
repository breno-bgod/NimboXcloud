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
  const source = bridgeSource + '\n globalThis.__testBridge = nxInputBridge; globalThis.__restore = nxRestoreNativeGamepads;';
  vm.runInNewContext(source, ctx, { timeout: 1000 });
  return { navigator, store, bridge: ctx.__testBridge, restore: ctx.__restore, nativeGet };
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
