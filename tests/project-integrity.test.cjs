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

test('NX exposes one input destination and preserves device-specific builders and shortcut keys', () => {
  const registry=main.slice(main.indexOf('  const TABS = ['),main.indexOf('  const PRESETS = ['));
  assert.ok(registry.includes("id: 'inputs'"));
  assert.ok(!registry.includes("id: 'gamepad'"));
  assert.ok(!registry.includes("id: 'gyrotouch'"));
  assert.ok(main.includes("TAB_BUILDERS.controls=TAB_BUILDERS.gamepad;"));
  assert.ok(main.includes("nxSettingsSection(root,'Ajustes do controle físico',TAB_BUILDERS.gamepad)"));
  assert.ok(main.includes("nxSettingsSection(root,'Ajustes de teclado e mouse',TAB_BUILDERS.gyrotouch)"));
  assert.ok(main.includes("nxBindControls(root,'gamepad')"));
  assert.ok(main.includes("nxBindControls(root,'keyboard')"));
});
