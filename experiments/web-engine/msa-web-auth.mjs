// SPDX-License-Identifier: GPL-3.0-or-later
// Browser-side port of PSBox src/auth/msa.cpp. Tokens stay in memory only.
// Device-code login may require an approved same-origin broker when CORS blocks it.
const CONNECT = 'https://login.live.com/oauth20_connect.srf';
const TOKEN = 'https://login.live.com/oauth20_token.srf';
const TRANSFER_SCOPE = 'service::http://Passport.NET/purpose::PURPOSE_XBOX_CLOUD_CONSOLE_TRANSFER_TOKEN';
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(new Error('AUTH_CANCELLED'));
  const timer = setTimeout(done, ms);
  function done() { signal?.removeEventListener('abort', abort); resolve(); }
  function abort() { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new Error('AUTH_CANCELLED')); }
  signal?.addEventListener('abort', abort, { once: true });
});
export class MsaWebAuth {
  #fetch;
  #tokens = null;
  constructor({ fetchImpl = fetch, clientId = '000000004c20a908', scope = 'service::user.auth.xboxlive.com::MBI_SSL' } = {}) {
    this.#fetch = fetchImpl; this.clientId = clientId; this.scope = scope;
  }
  get signedIn() { return Boolean(this.#tokens?.accessToken); }
  async #post(url, fields, signal) {
    let response;
    try { response = await this.#fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields), signal }); }
    catch (error) { throw new Error('MSA_NETWORK_OR_CORS_ERROR', { cause: error }); }
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  }
  async requestDeviceCode({ signal } = {}) {
    const { ok, data, status } = await this.#post(CONNECT, { client_id: this.clientId, scope: this.scope, response_type: 'device_code' }, signal);
    if (!ok || !data.user_code || !data.device_code) throw new Error('DEVICE_CODE_FAILED_' + status);
    return {
      userCode: data.user_code, deviceCode: data.device_code,
      verificationUri: data.verification_uri ?? 'https://www.microsoft.com/link',
      intervalSec: Math.min(60, Math.max(1, Number(data.interval) || 5)),
      expiresInSec: Math.min(3600, Math.max(60, Number(data.expires_in) || 900))
    };
  }
  #setTokens(data, previousRefresh = '') {
    const accessToken = data.access_token ?? data.lpt;
    if (!accessToken) throw new Error('MSA_TOKEN_MISSING');
    this.#tokens = {
      accessToken, refreshToken: data.refresh_token ?? previousRefresh,
      expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000
    };
  }
  async authorizeDevice({ onCode, signal } = {}) {
    const dc = await this.requestDeviceCode({ signal });
    onCode?.({ userCode: dc.userCode, verificationUri: dc.verificationUri, expiresInSec: dc.expiresInSec });
    let interval = dc.intervalSec;
    const deadline = Date.now() + dc.expiresInSec * 1000;
    while (Date.now() < deadline) {
      await sleep(interval * 1000, signal);
      const { ok, status, data } = await this.#post(TOKEN, {
        client_id: this.clientId, device_code: dc.deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      }, signal);
      if (ok) { this.#setTokens(data); return; }
      if (data.error === 'authorization_pending' || status >= 500) continue;
      if (data.error === 'slow_down' || status === 429) { interval = Math.min(60, interval + 5); continue; }
      if (data.error === 'expired_token') throw new Error('DEVICE_CODE_EXPIRED');
      if (['authorization_declined', 'access_denied'].includes(data.error)) throw new Error('AUTH_DENIED');
      throw new Error('DEVICE_CODE_POLL_FAILED_' + status);
    }
    throw new Error('DEVICE_CODE_EXPIRED');
  }
  async refresh({ scope = this.scope, signal } = {}) {
    if (!this.#tokens?.refreshToken) throw new Error('MSA_REFRESH_UNAVAILABLE');
    const { ok, status, data } = await this.#post(TOKEN, {
      client_id: this.clientId, grant_type: 'refresh_token',
      refresh_token: this.#tokens.refreshToken, scope
    }, signal);
    if (!ok) throw new Error('MSA_REFRESH_FAILED_' + status);
    const previous = this.#tokens.refreshToken;
    this.#setTokens(data, previous);
    return this.#tokens.accessToken;
  }
  async accessToken({ signal } = {}) {
    if (!this.#tokens) throw new Error('MSA_LOGIN_REQUIRED');
    if (Date.now() > this.#tokens.expiresAt - 600000) await this.refresh({ signal });
    return this.#tokens.accessToken;
  }
  async consoleTransferToken({ signal } = {}) {
    if (!this.#tokens?.refreshToken) throw new Error('MSA_LOGIN_REQUIRED');
    return this.refresh({ scope: TRANSFER_SCOPE, signal });
  }
  signOut() { this.#tokens = null; }
}
