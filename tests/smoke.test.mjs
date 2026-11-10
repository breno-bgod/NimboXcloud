// tests/smoke.test.mjs — node --test tests/smoke.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../xbox-cloud-unlock-ptbr.user.js', import.meta.url), 'utf8');
test('userscript is valid JavaScript syntax', async () => {
  const { Script } = await import('node:vm');
  assert.doesNotThrow(() => new Script(source));
});
test('runs on play.xbox.com', () => {
  assert.match(source, /@match\s+https:\/\/play\.xbox\.com\/\*/);
});
test('keeps native pointer lock and F9 flow', () => {
  assert.match(source, /originalRequestPointerLock/);
  assert.match(source, /e\.code\s*===\s*'F9'|e\.code\s*!==\s*'F9'/);
});
test('NX recovery, diagnostics and QoS are present', () => {
  for (const name of ['nxRecoveries', 'latencyByServer', 'activeStreamVideo', 'Auto RTT', 'Diagnóstico', 'getStats(']) {
    assert.ok(source.includes(name), name);
  }
});
test('no experimental 1440p profile advertised', () => {
  assert.doesNotMatch(source, /r1440:\s*\{/);
});
