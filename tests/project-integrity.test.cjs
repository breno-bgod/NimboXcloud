'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'NimboXcloud.user.js'), 'utf8');
const touch = fs.readFileSync(path.join(root, 'modules', 'NimboXcloud-Touch-HUD.user.js'), 'utf8');

function valueBetween(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  assert.ok(start >= 0, label + ' start exists');
  const valueStart = start + startMarker.length;
  const end = source.indexOf(endMarker, valueStart);
  assert.ok(end >= valueStart, label + ' end exists');
  return source.slice(valueStart, end).trim();
}

test('userscript metadata, runtime diagnostics and @require cache key share one version', () => {
  const metadataLine = main.split('\n').find(line => line.startsWith('// @version'));
  assert.ok(metadataLine, '@version exists');
  const metadata = metadataLine.trim().split(' ').filter(Boolean).pop();
  const runtime = valueBetween(main, "const VER = '", "';", 'runtime VER');
  const dependency = valueBetween(main, 'NimboXcloud-Touch-HUD.user.js?nx_version=', "'", '@require cache key');
  assert.equal(runtime, metadata);
  assert.equal(dependency, metadata);
});

test('Touch HUD metadata and runtime constant share one module version', () => {
  const metadataLine = touch.split('\n').find(line => line.startsWith('// @version'));
  assert.ok(metadataLine, 'Touch HUD @version exists');
  const metadata = metadataLine.trim().split(' ').filter(Boolean).pop();
  const runtime = valueBetween(touch, "const VERSION='", "';", 'Touch HUD VERSION');
  assert.equal(runtime, metadata);
});

test('NX separates physical controls from keyboard and mouse navigation labels', () => {
  assert.ok(main.includes("{ id: 'controls', label: 'Controles', desc: 'Joystick e controle físico' }"));
  assert.ok(main.includes("{ id: 'gyrotouch', label: 'Teclado e mouse', desc: 'Teclado, mouse, giroscópio e HUD por toque' }"));
  assert.ok(main.includes("['gyrotouch','Teclado e mouse']"));
  assert.ok(main.includes("const touchGroups = ['Teclado e mouse', 'Editor de HUD — prévia arrastável', 'Giroscópio']"));
  const builder = main.indexOf('TAB_BUILDERS.gyrotouch = function (root)');
  const activation = main.indexOf("const activation = group('Ativação'", builder);
  const keyboard = main.indexOf("group('Teclado e mouse'", builder);
  assert.ok(builder >= 0 && activation > builder && keyboard > activation, 'activation appears before keyboard/mouse settings');
  assert.ok(!main.includes('Gyro Touch'), 'old tab label is removed');
});
