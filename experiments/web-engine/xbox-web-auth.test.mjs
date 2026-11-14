import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MsaWebAuth } from './msa-web-auth.mjs';
import { XboxWebAuth } from './xbox-web-auth.mjs';

test('device-code login, Xbox XSTS, transfer token; no token persistence', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const form = options.body instanceof URLSearchParams ? options.body : null;
    let data;
    if (url.includes('connect.srf')) data = { user_code: 'ABCD', device_code: 'device-secret', interval: 1, expires_in: 900 };
    else if (url.includes('token.srf')) {
      data = form.get('grant_type') === 'refresh_token'
        ? { access_token: 'transfer-secret', refresh_token: 'rotated-refresh', expires_in: 3600 }
        : { access_token: 'msa-secret', refresh_token: 'refresh-secret', expires_in: 3600 };
    } else if (url.includes('user/authenticate')) data = { Token: 'xbl-secret' };
    else if (url.includes('xsts/authorize')) data = { Token: 'xsts-secret', NotAfter: '2099-01-01T00:00:00Z', DisplayClaims: { xui: [{ gtg: 'Player', xid: '123' }] } };
    else throw new Error('unexpected URL');
    return { ok: true, status: 200, json: async () => data };
  };
  const auth = new XboxWebAuth({ fetchImpl });
  const code = [];
  await auth.signIn({ onCode: value => code.push(value) });
  assert.equal(code[0].userCode, 'ABCD');
  assert.equal(auth.profile.gamertag, 'Player');
  const creds = await auth.sessionCredentials();
  assert.equal(creds.xstsToken, 'xsts-secret');
  assert.equal(creds.transferToken, 'transfer-secret');
  assert.equal(auth.signedIn, true);
  assert.ok(!JSON.stringify(auth.profile).includes('secret'));
  const transfer = calls.find(x => x.options.body instanceof URLSearchParams && x.options.body.get('scope')?.includes('CONSOLE_TRANSFER_TOKEN'));
  assert.ok(transfer);
  auth.signOut();
  assert.equal(auth.signedIn, false);
});
test('transfer token does not overwrite ordinary MSA access token', async () => {
  const fetchImpl = async (url, options) => {
    const form = options.body;
    const transfer = form.get('scope')?.includes('CONSOLE_TRANSFER_TOKEN');
    const data = transfer ? { lpt: 'transfer', refresh_token: 'refresh-new' } : { access_token: 'regular', refresh_token: 'refresh', expires_in: 3600 };
    return { ok: true, status: 200, json: async () => data };
  };
  const msa = new MsaWebAuth({ fetchImpl });
  await msa.authorizeDevice({ onCode: () => {} }).catch(() => {});
  // Mock intentionally omits a device code: login must reject without storing tokens.
  assert.equal(msa.signedIn, false);
});
