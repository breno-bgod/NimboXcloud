'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const moduleSource = fs.readFileSync(
  path.join(__dirname, '..', 'modules', 'NimboXcloud-Touch-HUD.user.js'),
  'utf8'
);
const classStart = moduleSource.indexOf('class NimboXboxTransport {');
const classEnd = moduleSource.indexOf('\nfunction nimboApplyInput', classStart);
assert.ok(classStart >= 0 && classEnd > classStart, 'NimboXboxTransport class found');
const classSource = moduleSource.slice(classStart, classEnd);
const plain = value => JSON.parse(JSON.stringify(value));

function createTransport(initial = {}) {
  const inputConfiguration = {
    enableKeyboardInput: false,
    enableMouseInput: false,
    enableAbsoluteMouse: true,
    enableTouchInput: true,
    minTimeBetweenInputFramesMs: 9,
    ...initial
  };
  const calls = [];
  const raw = {
    isShutdown: false,
    connectionState: 'Connected',
    configuration: { inputConfiguration },
    onVirtualMouseInput() {},
    updateInputConfigurationAsync(options) {
      calls.push(options);
      Object.assign(inputConfiguration, options);
      return Promise.resolve({ applied: true });
    }
  };
  const sandbox = { setTimeout, clearTimeout };
  vm.createContext(sandbox);
  vm.runInContext(
    'function nimboApplyInput(raw, options) { return raw.updateInputConfigurationAsync(options); }\n' +
    classSource +
    '\nglobalThis.NimboXboxTransport = NimboXboxTransport;',
    sandbox
  );
  const transport = new sandbox.NimboXboxTransport(raw);
  return { raw, transport, calls, inputConfiguration };
}

test('native xCloud touch configuration is forwarded unchanged through the session facade', async () => {
  const { transport, calls, inputConfiguration } = createTransport();
  const nativeOptions = {
    enableKeyboardInput: false,
    enableMouseInput: false,
    enableTouchInput: true
  };

  await transport.facade.updateInputConfigurationAsync(nativeOptions);

  assert.equal(calls.length, 1);
  assert.equal(calls[0], nativeOptions);
  assert.equal(transport.previous, null);
  assert.equal(inputConfiguration.enableTouchInput, true);
});

test('native xCloud requests enabling keyboard and mouse together are not mistaken for NimboTouch activation', async () => {
  const { transport, calls, inputConfiguration } = createTransport();
  const nativeOptions = {
    enableKeyboardInput: true,
    enableMouseInput: true,
    enableAbsoluteMouse: false,
    enableTouchInput: true
  };

  await transport.facade.updateInputConfigurationAsync(nativeOptions);

  assert.equal(calls[0], nativeOptions);
  assert.equal(transport.previous, null);
  assert.equal(inputConfiguration.enableKeyboardInput, true);
  assert.equal(inputConfiguration.enableMouseInput, true);
  assert.equal(inputConfiguration.enableTouchInput, true);
});

test('explicit NimboTouch activation changes only keyboard/mouse fields and restore excludes native touch', async () => {
  const { transport, calls, inputConfiguration } = createTransport();

  await transport.activateKeyboardMouse();

  assert.deepEqual(plain(calls[0]), {
    enableMouseInput: true,
    enableAbsoluteMouse: false,
    enableKeyboardInput: false
  });
  assert.equal(Object.hasOwn(calls[0], 'enableTouchInput'), false);
  assert.equal(inputConfiguration.enableTouchInput, true);

  await transport.restore();

  assert.deepEqual(plain(calls[1]), {
    enableMouseInput: false,
    enableKeyboardInput: false,
    enableAbsoluteMouse: true
  });
  assert.equal(Object.hasOwn(calls[1], 'enableTouchInput'), false);
  assert.equal(inputConfiguration.enableTouchInput, true);
  assert.equal(transport.previous, null);
});

test('native automatic/manual touch changes pass through while NimboTouch is active and survive stop', async () => {
  const { transport, calls, inputConfiguration } = createTransport();

  await transport.activateKeyboardMouse();

  const manualOptions = {
    enableKeyboardInput: false,
    enableMouseInput: false,
    enableTouchInput: true
  };
  await transport.facade.updateInputConfigurationAsync(manualOptions);

  const automaticOptions = {
    enableKeyboardInput: false,
    enableMouseInput: false,
    enableTouchInput: false
  };
  await transport.facade.updateInputConfigurationAsync(automaticOptions);

  assert.equal(calls[1], manualOptions);
  assert.equal(calls[2], automaticOptions);
  assert.equal(transport.previous.enableMouseInput, false);
  assert.equal(inputConfiguration.enableTouchInput, false);

  await transport.restore();

  const restoreOptions = calls[3];
  assert.equal(Object.hasOwn(restoreOptions, 'enableTouchInput'), false);
  assert.equal(inputConfiguration.enableTouchInput, false);
  assert.equal(inputConfiguration.enableMouseInput, false);
  assert.equal(inputConfiguration.enableKeyboardInput, false);
  assert.equal(inputConfiguration.enableAbsoluteMouse, true);
});

test('native touch changes do not create a NimboTouch restore snapshot', async () => {
  const { transport, calls, inputConfiguration } = createTransport();
  const options = { enableTouchInput: false };

  await transport.facade.updateInputConfigurationAsync(options);
  await transport.restore();

  assert.equal(calls.length, 1);
  assert.equal(calls[0], options);
  assert.equal(inputConfiguration.enableTouchInput, false);
  assert.equal(transport.previous, null);
});
