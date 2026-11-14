import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PsboxWebRtcAdapter } from './psbox-webrtc-adapter.mjs';

function fixture() {
  const channels = [];
  const peer = {
    createDataChannel(label) {
      const channel = { label, readyState: 'open', sent: [], close() { this.readyState = 'closed'; }, send(data) { this.sent.push(data); } };
      channels.push(channel);
      return channel;
    },
    async createOffer() { return { type: 'offer', sdp: 'synthetic-offer' }; },
    async setLocalDescription(value) { this.localDescription = value; },
    async setRemoteDescription(value) { this.remoteDescription = value; },
    async addIceCandidate(value) { (this.ice ??= []).push(value); },
    close() { this.closed = true; }
  };
  return { peer, channels };
}
test('negotiates synthetic SDP, ICE and opens four PSBox channels', async () => {
  const { peer, channels } = fixture();
  const offers = [];
  const adapter = new PsboxWebRtcAdapter({ peerFactory: () => peer });
  await adapter.start({
    sendOffer: async sdp => offers.push(sdp),
    receiveAnswer: async () => ({ sdp: 'synthetic-answer' }),
    receiveIceCandidates: async () => [{ candidate: 'synthetic-candidate' }]
  });
  assert.deepEqual(offers, ['synthetic-offer']);
  assert.equal(peer.remoteDescription.sdp, 'synthetic-answer');
  assert.equal(peer.ice.length, 1);
  assert.deepEqual(channels.map(c => c.label), ['message', 'control', 'input', 'chat']);
  adapter.send('input', new Uint8Array([1]));
  assert.equal(channels[2].sent.length, 1);
  adapter.close();
  assert.equal(adapter.state, 'idle');
  assert.equal(peer.closed, true);
  assert.ok(channels.every(c => c.readyState === 'closed'));
});
test('rejects invalid answer and releases resources', async () => {
  const { peer } = fixture();
  const adapter = new PsboxWebRtcAdapter({ peerFactory: () => peer });
  await assert.rejects(adapter.start({ sendOffer: async () => {}, receiveAnswer: async () => ({}) }), /INVALID_SDP_ANSWER/);
  assert.equal(adapter.state, 'idle');
  assert.equal(peer.closed, true);
});
test('stop invalidates callbacks and pending signaling', async () => {
  const { peer } = fixture();
  let resolveAnswer;
  let received = 0;
  const adapter = new PsboxWebRtcAdapter({ peerFactory: () => peer, onTrack: () => received++ });
  const pending = adapter.start({ sendOffer: async () => {}, receiveAnswer: () => new Promise(resolve => { resolveAnswer = resolve; }) });
  for (let i = 0; i < 20 && !resolveAnswer; i++) await Promise.resolve();
  assert.equal(typeof resolveAnswer, 'function');
  const stale = peer.ontrack;
  adapter.close();
  stale({});
  resolveAnswer({ sdp: 'synthetic-answer' });
  await assert.rejects(pending, /SESSION_CANCELLED/);
  assert.equal(received, 0);
  assert.equal(adapter.state, 'idle');
});
test('blocks concurrent session and input before connection', async () => {
  const { peer } = fixture();
  const adapter = new PsboxWebRtcAdapter({ peerFactory: () => peer });
  assert.throws(() => adapter.send('input', 'x'), /SESSION_NOT_CONNECTED/);
  let resolveAnswer;
  const pending = adapter.start({ sendOffer: async () => {}, receiveAnswer: () => new Promise(resolve => { resolveAnswer = resolve; }) });
  await assert.rejects(adapter.start({ sendOffer: async () => {}, receiveAnswer: async () => ({ sdp: 'x' }) }), /SESSION_OCCUPIED/);
  for (let i = 0; i < 20 && !resolveAnswer; i++) await Promise.resolve();
  adapter.close();
  resolveAnswer({ sdp: 'x' });
  await assert.rejects(pending, /SESSION_CANCELLED/);
});
