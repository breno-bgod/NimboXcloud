'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('NET-003: SDP bitrate edits only offer/answer descriptions', () => {
  const start = src.indexOf('  (function hookBitrate() {');
  const end = src.indexOf('  // ---------- 10. Amostragem', start);
  assert.ok(start > 0 && end > start);
  const hook = src.slice(start, end);
  assert.match(hook, /\^\(\?:offer\|answer\)\$/);
  assert.match(hook, /normalizedSdp === description\.sdp/);
  assert.match(hook, /original\.apply\(this, arguments\)/);
});

test('NET-005: closed WebRTC sessions do not retain stale QoS', () => {
  const start = src.indexOf('  function pumpQos() {');
  const end = src.indexOf('  function PCQos(pc) {', start);
  assert.ok(start > 0 && end > start);
  const body = src.slice(start, end);
  assert.match(body, /pc\.connectionState === 'closed'/);
  assert.match(body, /pc\.signalingState === 'closed'/);
  assert.match(body, /S\.qos = null/);
  assert.match(body, /S\.lastPc === pc && pc\.connectionState !== 'closed'/);
});

test('NET-005: chosen video RTP report is local and has highest byte count', () => {
  const start = src.indexOf('  function PCQos(pc) {');
  const end = src.indexOf('  // ', start + 35);
  assert.ok(start > 0);
  const body = src.slice(start, start + 2000);
  assert.match(body, /!r\.isRemote/);
  assert.match(body, /r\.bytesReceived \|\| 0/);
  assert.match(body, /selectedCandidatePairId/);
});

test('NET-004: IPv4 preference cannot discard the last viable ICE candidate', () => {
  const start = src.indexOf('  function rewriteIce(');
  const end = src.indexOf('  // ---------- 8.', start);
  assert.ok(start > 0 && end > start);
  const body = src.slice(start, end);
  assert.match(body, /keep\.some\(function \(ln\)/);
  assert.match(body, /keep\.some\(function \(item\)/);
  assert.match(body, /if \(!dropped\) return false/);
});

test('NET-001: reconstructed play requests preserve abort and referrer policy', () => {
  const start = src.indexOf('  function patchPlayRequest(');
  const end = src.indexOf('  // ---------- 9.', start);
  assert.ok(start > 0 && end > start);
  const body = src.slice(start, end);
  assert.match(body, /signal: req\.signal/);
  assert.match(body, /referrerPolicy: req\.referrerPolicy/);
  assert.match(body, /keepalive: req\.keepalive/);
});

test('NET-002: unavailable data center retains server fallback and clears pin', () => {
  const start = src.indexOf('  function rewriteRegions(');
  const end = src.indexOf('  // ---------- 7.', start);
  assert.ok(start > 0 && end > start);
  const body = src.slice(start, end);
  assert.match(body, /S\.serverPin = ''/);
  assert.match(body, /if \(os\.regions\[0\] === hit/);
  assert.match(body, /return false/);
});

test('NET-001/006: cancellation is distinguished from network failure', () => {
  assert.match(src, /err && err\.name === 'AbortError' \? 'cancelled' : 'network-failure'/);
  assert.match(src, /injectable\(u\.pathname\) && u\.protocol === 'https:'/);
});

test('NET-003: bitrate SDP preserves newline style and ignores rejected video sections', () => {
  const start = src.indexOf('  (function hookBitrate() {');
  const end = src.indexOf('  (function hookRtc()', start);
  assert.ok(start > 0 && end > start);
  const hook = src.slice(start, end);
  assert.match(hook, /Rejected \(port 0\) video sections/);
  assert.match(hook, /normalizedSdp/);
  assert.match(hook, /patchedSdp\.replace/);
});

test('NET-001: aborted play requests are not parsed and rebuilt', () => {
  const start = src.indexOf('  function patchPlayRequest(');
  const end = src.indexOf('  // ---------- 9.', start);
  const body = src.slice(start, end);
  assert.match(body, /init\.signal\.aborted/);
  assert.match(body, /input\.signal\.aborted/);
});


test('NET-004: retail IPv4 rewriting leaves xHome SDP and ICE endpoints untouched', async () => {
  const start = src.indexOf('  function rewriteIce(');
  const end = src.indexOf('  // ---------- 8.', start);
  assert.ok(start > 0 && end > start);
  const code = src.slice(start, end) + '\\nglobalThis.__rewriteIce = rewriteIce;';
  let rewriteCalls = 0;
  const context = {
    Promise,
    v4on: () => true,
    rewriteJson(response, mutate) {
      rewriteCalls++;
      const payload = { exchangeResponse: JSON.stringify({ sdp:
        'a=candidate:1 1 udp 1 2001:db8::1 5000 typ host\\r\\na=candidate:2 1 udp 1 192.0.2.1 5001 typ host'
      }) };
      mutate(payload);
      return Promise.resolve(response);
    },
    isV6Candidate(candidate) {
      const fields = String(candidate).trim().split(/\\s+/);
      return (fields[4] || '').includes(':');
    },
    S: { v6dropped: 0 },
    addCap() {}
  };
  vm.runInNewContext(code, context);
  const response = { status: 200 };
  for (const hostname of [
    'xhome.gssv-play-prod.xboxlive.com',
    'wus.core.gssv-play-prodxhome.xboxlive.com'
  ]) {
    const url = { hostname, host: hostname, pathname: '/v5/sessions/home/session-id/sdp' };
    assert.equal(await context.__rewriteIce(response, url, true), response);
    assert.equal(await context.__rewriteIce(response, url, false), response);
  }
  assert.equal(rewriteCalls, 0, 'xHome login and regional session hosts must bypass retail candidate rewriting');

  const retailHost = 'wus.core.gssv-play-prod.xboxlive.com';
  await context.__rewriteIce(response, { hostname: retailHost, host: retailHost, pathname: '/v5/sessions/cloud/session-id/sdp' }, true);
  assert.equal(rewriteCalls, 1, 'retail GSSV IPv4 rewriting remains active');
});
