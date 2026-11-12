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
  const metadataMatch = main.match(/^\/\/ @version\s+(\S+)/m);
  assert.ok(metadataMatch, '@version exists');
  const metadata = metadataMatch[1];
  const runtime = valueBetween(main, "const VER = '", "';", 'runtime VER');
  const dependencyMatch = main.match(/^\/\/ @require\s+.*NimboXcloud-Touch-HUD\.user\.js\?nx_version=([^\s]+)$/m);
  assert.ok(dependencyMatch, '@require cache key exists');
  const dependency = dependencyMatch[1];
  assert.equal(runtime, metadata);
  assert.equal(dependency, metadata);
});

test('Touch HUD metadata and runtime constant share one module version', () => {
  const metadataMatch = touch.match(/^\/\/ @version\s+(\S+)/m);
  assert.ok(metadataMatch, 'Touch HUD @version exists');
  const metadata = metadataMatch[1];
  const runtime = valueBetween(touch, "const VERSION='", "';", 'Touch HUD VERSION');
  assert.equal(runtime, metadata);
});

test('NX separates physical Gamepad from keyboard and mouse categories', () => {
  assert.ok(main.includes("{ id: 'gamepad', label: 'Gamepad', desc: 'Controles físicos, giroscópio, vibração e atalhos' }"));
  assert.ok(main.includes("{ id: 'gyrotouch', label: 'Teclado e mouse', desc: 'NimboTouch, HUD, toque e atalhos de teclado' }"));
  assert.ok(main.includes("['gamepad','Gamepad']"));
  assert.ok(main.includes("TAB_BUILDERS.controls=TAB_BUILDERS.gamepad;"));
  assert.ok(main.includes("nxMoveGroup(root,nodes,'Giroscópio')"));
  const builder = main.indexOf('TAB_BUILDERS.gyrotouch=function(root){');
  const activation = main.indexOf("const activation=group('Ativação'", builder);
  const legacy = main.indexOf("const nodes=nxLegacyControlGroups('keyboard')", builder);
  const hud = main.indexOf("nxMoveGroup(root,nodes,'Editor de HUD — prévia arrastável')", builder);
  assert.ok(builder >= 0 && activation > builder && legacy > activation && hud > legacy, 'activation precedes keyboard/mouse and HUD settings');
  assert.ok(main.includes("group('Teclado e mouse'"), 'legacy keyboard/mouse group exists');
  assert.ok(!main.includes('Gyro Touch'), 'old tab label is removed');
});
