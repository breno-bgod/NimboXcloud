import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GssvWebClient } from './gssv-web-client.mjs';

test('GSSV login, create, connect, SDP/ICE, keepalive, cleanup with mocked HTTP', async () => {
  const calls = [];
  const responses = [
    { gsToken: 'test-gs', market: 'BR', offeringSettings: { regions: [{ name: 'Brazil', baseUri: 'https://br.gssv-play-prod.xboxlive.com', isDefault: true }] } },
    { sessionPath: '/v5/sessions/cloud/test-session' },
    { state: 'ReadyToConnect' }, null, null,
    { exchangeResponse: JSON.stringify({ status: 'success', sdp: 'test-answer' }) },
    null, { exchangeResponse: JSON.stringify([{ candidate: 'candidate:123', sdpMid: '0', sdpMLineIndex: 0 }]) },
    null, null
  ];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, ...opts });
    const body = responses.shift();
    return { ok: true, status: body === null ? 204 : 200, text: async () => JSON.stringify(body) };
  };
  const client = new GssvWebClient({ fetchImpl });
  const result = await client.login('test-xsts');
  assert.equal(result.market, 'BR');
  await client.startSession('1234');
  assert.equal(client.sessionPath, '/v5/sessions/cloud/test-session');
  assert.equal((await client.state()).state, 'ReadyToConnect');
  await client.connect('test-transfer');
  await client.sendSdpOffer('test-offer');
  assert.equal((await client.pollSdpAnswer({ attempts: 1, intervalMs: 0 })).sdp, 'test-answer');
  await client.sendIceCandidate({ candidate: 'candidate:123', sdpMid: '0', sdpMLineIndex: 0 });
  assert.equal((await client.pollIceCandidates()).length, 1);
  await client.keepalive();
  await client.stop();
  assert.equal(client.sessionPath, '');
  assert.equal(calls[0].headers.Authorization, undefined);
  assert.equal(calls[1].headers.Authorization, 'Bearer test-gs');
  assert.equal(calls[1].method, 'POST');
  assert.ok(calls[1].url.endsWith('/v5/sessions/cloud/play'));
  assert.ok(calls.at(-1).method === 'DELETE');
  assert.equal(responses.length, 0);
});
test('GSSV refuses untrusted region and does not persist token', async () => {
  const client = new GssvWebClient({ fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ gsToken: 'secret', offeringSettings: { regions: [{ baseUri: 'https://evil.example' }] } }) }) });
  await assert.rejects(client.login('xsts'), /INVALID_REGION/);
  await assert.rejects(client.startSession('title'), /GSSV_LOGIN_REQUIRED/);
});
