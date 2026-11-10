// tests/smoke.test.mjs — node --test tests/smoke.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const source = readFileSync(new URL('../xbox-cloud-unlock-ptbr.user.js', import.meta.url), 'utf8');

test('userscript parses and targets the current xCloud domain', () => {
  assert.doesNotThrow(() => new Script(source));
  assert.match(source, /@match\s+https:\/\/play\.xbox\.com\/\*/);
});

test('version metadata matches runtime version', () => {
  const meta = source.match(/@version\s+(\d+\.\d+\.\d+)/)?.[1];
  const runtime = source.match(/const VER\s*=\s*'(\d+\.\d+\.\d+)'/)?.[1];
  assert.ok(meta && runtime, 'version declarations missing');
  assert.equal(meta, runtime);
});

test('native pointer lock and F9 flow are retained', () => {
  assert.match(source, /originalRequestPointerLock/);
  assert.match(source, /e\.code\s*===\s*'F9'|e\.code\s*!==\s*'F9'/);
});

test('touchscreen support is preserved without a touch editor', () => {
  assert.match(source, /function patchTouchSessionConfiguration/);
  assert.match(source, /enableTouchInput\s*=\s*true/);
});

test('QoS samples are isolated by WebRTC session and inbound stream', () => {
  assert.match(source, /if \(q && S\.lastPc === pc\)/);
  assert.match(source, /prevSnap\.pc === pc && prevSnap\.inboundId === video\.id/);
  assert.match(source, /out\.dropRate = dDropped \/ \(dDropped \+ dDecoded\) \* 100/);
});

test('RTT history is bounded and can be cleared', () => {
  assert.match(source, /LS_RTT_HISTORY/);
  assert.match(source, /24 \* 3600 \* 1000/);
  assert.match(source, /localStorage\.removeItem\(LS_RTT_HISTORY\)/);
});

test('video adjustments share one application function', () => {
  assert.match(source, /function applyVideoAdjustments\(video\)/);
  assert.match(source, /function cycleVideoFilter\(\)/);
  assert.match(source, /function cycleSharpness\(\)/);
  assert.match(source, /applyVideoAdjustments\(video\)/);
});

test('microphone and vibration are capability checks, not xCloud integrations', () => {
  assert.match(source, /function inspectMicrophone\(\)/);
  assert.match(source, /enumerateDevices\(\)/);
  assert.match(source, /function testVibration\(\)/);
  assert.match(source, /hapticActuators/);
});

test('remote play and pre-session probing are not misrepresented as functional', () => {
  assert.match(source, /protocolo\/autenticação Xbox Remote Play não integrados/);
  assert.match(source, /sondagem prévia não disponível/);
});

test('no unverified 1440p mode is advertised', () => {
  assert.doesNotMatch(source, /r1440:\s*\{/);
});
