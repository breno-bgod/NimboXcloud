// SPDX-License-Identifier: GPL-3.0-or-later
// Port of PSBox src/xcloud/gssv.cpp session transport; no credentials persisted.
// Requires legitimate Xbox tokens from an authorized auth provider.
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const unwrap = data => {
  const value = data?.exchangeResponse;
  if (typeof value === 'string') return JSON.parse(value);
  return value ?? null;
};
export class GssvWebClient {
  #fetch;
  #token;
  #region = '';
  #session = '';
  #deviceInfo;
  constructor({ fetchImpl = fetch, deviceInfo, offering = 'xgpuweb' } = {}) {
    if (!['xgpuweb', 'xhome'].includes(offering)) throw new Error('INVALID_OFFERING');
    this.offering = offering;
    this.#fetch = fetchImpl;
    this.#deviceInfo = deviceInfo ?? {
      appInfo: { env: { clientAppId: 'play.xbox.com', clientAppType: 'browser', clientSdkVersion: '10.3.7', httpEnvironment: 'prod' } },
      dev: { os: { name: 'windows', platform: 'desktop' }, displayInfo: { dimensions: { widthInPixels: 1920, heightInPixels: 1080 } } }
    };
  }
  get sessionPath() { return this.#session; }
  get region() { return this.#region; }
  async #request(method, url, body, { bearer = true, signal } = {}) {
    const headers = { 'x-gssv-client': 'XboxComBrowser' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (bearer) {
      if (!this.#token) throw new Error('GSSV_LOGIN_REQUIRED');
      headers.Authorization = 'Bearer ' + this.#token;
      headers['X-MS-Device-Info'] = JSON.stringify(this.#deviceInfo);
    }
    let response;
    try {
      response = await this.#fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal });
    } catch (error) {
      throw new Error('GSSV_NETWORK_OR_CORS_ERROR', { cause: error });
    }
    if (!response.ok) {
      if (response.status === 204) return null;
      throw new Error('GSSV_HTTP_' + response.status);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  async login(xstsToken, { signal } = {}) {
    if (typeof xstsToken !== 'string' || !xstsToken) throw new Error('XSTS_TOKEN_REQUIRED');
    const data = await this.#request('POST', 'https://' + this.offering + '.gssv-play-prod.xboxlive.com/v2/login/user', { token: xstsToken, offeringId: this.offering }, { bearer: false, signal });
    if (!data?.gsToken || !Array.isArray(data?.offeringSettings?.regions)) throw new Error('INVALID_GSSV_LOGIN');
    const region = data.offeringSettings.regions.find(x => x.isDefault) ?? data.offeringSettings.regions[0];
    const url = new URL(region?.baseUri ?? '');
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.xboxlive.com')) throw new Error('INVALID_REGION');
    this.#token = data.gsToken;
    this.#region = url.origin;
    return { market: data.market, regions: data.offeringSettings.regions.map(({ name, isDefault }) => ({ name, isDefault })) };
  }
  #url(suffix) {
    if (!this.#region) throw new Error('GSSV_LOGIN_REQUIRED');
    return this.#region + suffix;
  }
  #sessionUrl(suffix) {
    if (!this.#session) throw new Error('GSSV_SESSION_REQUIRED');
    return this.#url(this.#session + suffix);
  }
  async startSession(titleId, { locale = 'pt-BR', signal } = {}) {
    if (!titleId) throw new Error('TITLE_ID_REQUIRED');
    if (this.#session) throw new Error('SESSION_OCCUPIED');
    const home = this.offering === 'xhome';
    const body = {
      clientSessionId: crypto.randomUUID(), titleId: home ? '' : titleId,
      systemUpdateGroup: '', serverId: home ? titleId : '', fallbackRegionNames: [],
      settings: {
        nanoVersion: 'V3;WebrtcTransport.dll', enableTextToSpeech: false,
        magnifier: false, highContrast: 0, locale, useIceConnection: false,
        timezoneOffsetMinutes: 0, sdkType: 'web', osName: 'windows',
        enableOptionalDataCollection: false
      }
    };
    const data = await this.#request('POST', this.#url('/v5/sessions/' + (home ? 'home' : 'cloud') + '/play'), body, { signal });
    if (!/^\/v\d+\/sessions\//.test(data?.sessionPath ?? '') || data.sessionPath.includes('..')) throw new Error('INVALID_SESSION_PATH');
    this.#session = data.sessionPath;
    return { state: 'created' };
  }
  async state({ signal } = {}) { return this.#request('GET', this.#sessionUrl('/state'), undefined, { signal }); }
  async connect(transferToken, { signal } = {}) {
    if (!transferToken) throw new Error('TRANSFER_TOKEN_REQUIRED');
    await this.#request('POST', this.#sessionUrl('/connect'), { userToken: transferToken }, { signal });
  }
  async sendSdpOffer(sdp, { signal } = {}) {
    const version = (minVersion, maxVersion) => ({ minVersion, maxVersion });
    const configuration = {
      chatConfiguration: { bytesPerSample: 2, expectedClipDurationMs: 20, format: { codec: 'opus', container: 'webm' }, numChannels: 1, sampleFrequencyHz: 24000 },
      chat: version(1, 1), control: version(1, 3), input: version(1, 9), message: version(1, 1)
    };
    await this.#request('POST', this.#sessionUrl('/sdp'), { messageType: 'offer', sdp, requestId: '1', configuration }, { signal });
  }
  async pollSdpAnswer({ signal, attempts = 40, intervalMs = 500 } = {}) {
    for (let i = 0; i < attempts; i++) {
      if (signal?.aborted) throw new Error('SESSION_CANCELLED');
      const payload = unwrap(await this.#request('GET', this.#sessionUrl('/sdp'), undefined, { signal }));
      if (payload?.status && payload.status !== 'success') throw new Error('SDP_REJECTED');
      if (payload?.sdp) return { type: 'answer', sdp: payload.sdp };
      await sleep(intervalMs);
    }
    throw new Error('SDP_ANSWER_TIMEOUT');
  }
  async sendIceCandidate(candidate, { signal } = {}) {
    await this.#request('POST', this.#sessionUrl('/ice'), {
      messageType: 'iceCandidate', candidate: [{
        candidate: candidate.candidate, sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      }]
    }, { signal });
  }
  async pollIceCandidates({ signal } = {}) {
    const payload = unwrap(await this.#request('GET', this.#sessionUrl('/ice'), undefined, { signal }));
    return Array.isArray(payload) ? payload.filter(x => x?.candidate) : [];
  }
  async keepalive({ signal } = {}) { await this.#request('POST', this.#sessionUrl('/keepalive'), undefined, { signal }); }
  async stop() {
    const path = this.#session;
    this.#session = '';
    if (path) await this.#request('DELETE', this.#url(path)).catch(() => {});
  }
  dispose() { this.#token = ''; this.#region = ''; this.#session = ''; }
}
