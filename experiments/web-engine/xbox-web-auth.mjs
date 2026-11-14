// SPDX-License-Identifier: GPL-3.0-or-later
// Browser port of PSBox src/auth/xbox_live.cpp and auth_manager.cpp core chain.
// All secrets remain in memory; no console logging, persistence or token URLs.
import { MsaWebAuth } from './msa-web-auth.mjs';
const GSSV_RP = 'http://gssv.xboxlive.com/';
export class XboxWebAuth {
  #fetch;
  #msa;
  #gssvXsts = null;
  #profile = null;
  constructor({ fetchImpl = fetch, msa } = {}) {
    this.#fetch = fetchImpl;
    this.#msa = msa ?? new MsaWebAuth({ fetchImpl });
  }
  get signedIn() { return this.#msa.signedIn && Boolean(this.#gssvXsts); }
  get profile() { return this.#profile ? { ...this.#profile } : null; }
  async #post(url, body, signal) {
    let response;
    try {
      response = await this.#fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-xbl-contract-version': '1' },
        body: JSON.stringify(body), signal
      });
    } catch (error) { throw new Error('XBL_NETWORK_OR_CORS_ERROR', { cause: error }); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.Token) throw new Error('XBL_AUTH_FAILED_' + response.status + (data.XErr ? '_XERR_' + data.XErr : ''));
    return { token: data.Token, notAfter: data.NotAfter, userHash: data.DisplayClaims?.xui?.[0]?.uhs ?? '',
      gamertag: data.DisplayClaims?.xui?.[0]?.gtg ?? '', xuid: data.DisplayClaims?.xui?.[0]?.xid ?? '' };
  }
  async #userToken(msaAccessToken, signal) {
    const request = prefix => this.#post('https://user.auth.xboxlive.com/user/authenticate', {
      RelyingParty: 'http://auth.xboxlive.com', TokenType: 'JWT',
      Properties: { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: prefix + msaAccessToken }
    }, signal);
    try { return await request('t='); }
    catch (error) {
      if (error.message.startsWith('XBL_AUTH_FAILED_')) return request('d=');
      throw error;
    }
  }
  async #xsts(userToken, relyingParty, signal) {
    return this.#post('https://xsts.auth.xboxlive.com/xsts/authorize', {
      RelyingParty: relyingParty, TokenType: 'JWT',
      Properties: { SandboxId: 'RETAIL', UserTokens: [userToken.token] }
    }, signal);
  }
  async #exchange({ signal } = {}) {
    const user = await this.#userToken(await this.#msa.accessToken({ signal }), signal);
    this.#gssvXsts = await this.#xsts(user, GSSV_RP, signal);
    try {
      const profile = await this.#xsts(user, 'http://xboxlive.com', signal);
      this.#profile = { gamertag: profile.gamertag, xuid: profile.xuid };
    } catch { this.#profile = null; }
  }
  async signIn({ onCode, signal } = {}) {
    await this.#msa.authorizeDevice({ onCode, signal });
    try { await this.#exchange({ signal }); }
    catch (error) { this.signOut(); throw error; }
    return this.profile;
  }
  async ensureFresh({ signal } = {}) {
    if (!this.signedIn) throw new Error('XBL_LOGIN_REQUIRED');
    const expires = Date.parse(this.#gssvXsts.notAfter ?? '');
    if (!Number.isFinite(expires) || expires - Date.now() < 600000) await this.#exchange({ signal });
  }
  async sessionCredentials({ signal } = {}) {
    await this.ensureFresh({ signal });
    return { xstsToken: this.#gssvXsts.token, transferToken: await this.#msa.consoleTransferToken({ signal }) };
  }
  signOut() { this.#msa.signOut(); this.#gssvXsts = null; this.#profile = null; }
}
