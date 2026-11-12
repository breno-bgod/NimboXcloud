// tests/smoke.test.mjs — node --test tests/smoke.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../NimboXcloud.user.js', import.meta.url), 'utf8');

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
  assert.doesNotMatch(source, /Element\.prototype\.requestPointerLock\s*=/);
  assert.doesNotMatch(source, /e\.(?:code|key)\s*===\s*['"]F9['"]/);
  assert.match(source, /document\.addEventListener\('pointerlockchange'/);
});

test('native touch configuration is returned unchanged', async () => {
  const start = source.indexOf('  function patchTouchSessionConfiguration(response) {');
  const end = source.indexOf('  // Pointer Lock pertence', start);
  assert.ok(start >= 0 && end > start);
  const context = { Promise, nxPhysicalInputMode: () => 'native', nxPhysicalInputState: {} };
  runInNewContext('let touchSessionDiagnostics;\n' + source.slice(start, end) +
    '\nglobalThis.patch = patchTouchSessionConfiguration;', context);
  const response = { configuration: { enableTouchInput: false } };
  assert.equal(await context.patch(response), response);
  assert.equal(response.configuration.enableTouchInput, false);
});

test('QoS samples are isolated by WebRTC session and inbound stream', () => {
  assert.match(source, /if \(q && S\.lastPc === pc && pc\.connectionState !== \'closed\'/);
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

test('microphone preview and local vibration diagnostics remain available', () => {
  assert.match(source, /function inspectMicrophone\(\)/);
  assert.match(source, /enumerateDevices\(\)/);
  assert.match(source, /function testVibration\(\)/);
  assert.match(source, /hapticActuators/);
});

test('remote play and pre-session probing are not misrepresented as functional', () => {
  assert.match(source, /mídia ainda não homologada/);
  assert.match(source, /sondagem prévia não disponível/);
});

test('no unverified 1440p mode is advertised', () => {
  assert.doesNotMatch(source, /r1440:\s*\{/);
});


// Executa o coletor real com relatórios WebRTC controlados, sem sessão Xbox.
function qosHarness() {
  const start = source.indexOf('  function PCQos(pc) {');
  const end = source.indexOf('  let touchSessionDiagnostics = ', start);
  assert.ok(start >= 0 && end > start);
  const context = { Promise, Date, S: { hist: [], histMin: null } };
  runInNewContext('let prevSnap = null;\n' + source.slice(start, end) +
    '\nglobalThis.collect = PCQos;', context);
  const video = { id: 'video', type: 'inbound-rtp', kind: 'video',
    packetsReceived: 100, packetsLost: 0, bytesReceived: 1000,
    timestamp: 1000, framesDecoded: 60, framesDropped: 0 };
  const report = new Map([['video', video]]);
  const pc = { getStats: () => Promise.resolve(report) };
  return { collect: context.collect, video, pc };
}

test('QoS clamps negative loss without hiding positive packet loss', async () => {
  const { collect, video, pc } = qosHarness();
  video.packetsLost = -5;
  assert.equal((await collect(pc)).loss, 0);
  video.packetsLost = 25;
  assert.equal((await collect(pc)).loss, 20);
});

test('QoS computes bitrate and decoded FPS only within the same stream', async () => {
  const { collect, video, pc } = qosHarness();
  assert.equal((await collect(pc)).kbps, undefined);
  Object.assign(video, { timestamp: 2000, bytesReceived: 251000, framesDecoded: 120 });
  const sample = await collect(pc);
  assert.equal(sample.kbps, 2000);
  assert.equal(sample.decodedFps, 60);
  video.id = 'replacement-video';
  assert.equal((await collect(pc)).kbps, undefined);
  assert.equal((await collect({ getStats: pc.getStats })).kbps, undefined);
});

test('quality selection respects saved presets and defaults safely to HQ', () => {
  const start = source.indexOf('  function resCfg() {');
  const end = source.indexOf('  function v4on()', start);
  assert.ok(start >= 0 && end > start);
  const modes = { auto: { osName: 'windows' }, hq: { osName: 'tizen' } };
  let saved;
  const context = { RES_MODES: modes, LS_RES: 'quality', getPref: (_key, fallback) => saved || fallback };
  runInNewContext(source.slice(start, end) + '\nglobalThis.selected = resCfg;', context);
  assert.equal(context.selected(), modes.hq);
  saved = 'auto';
  assert.equal(context.selected(), modes.auto);
  saved = 'hq';
  assert.equal(context.selected(), modes.hq);
  saved = 'obsolete';
  assert.equal(context.selected(), modes.hq);
  saved = 'constructor';
  assert.equal(context.selected(), modes.hq);
});

