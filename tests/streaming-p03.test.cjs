'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');

test('NET-003: SDP bitrate edits only offer/answer descriptions', () => {
  const start = src.indexOf('  (function hookBitrate() {');
  const end = src.indexOf('  // ---------- 10. Amostragem', start);
  assert.ok(start > 0 && end > start);
  const hook = src.slice(start, end);
  assert.match(hook, /\^\(\?:offer\|answer\)\$/);
  assert.match(hook, /patchedSdp === description\.sdp/);
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
