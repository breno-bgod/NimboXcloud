// SPDX-License-Identifier: GPL-3.0-or-later
// Orchestrates an authorized GSSV cloud session and browser WebRTC media player.
// The caller supplies ephemeral XSTS and console-transfer tokens from legitimate OAuth.
import { GssvWebClient } from './gssv-web-client.mjs';
import { PsboxBrowserPlayer } from './psbox-browser-player.mjs';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export class PsboxCloudWebSession {
  #gssv;
  #player;
  #abort = null;
  #active = false;
  #keepalive = null;
  constructor({ video, onStatus, fetchImpl, peerFactory } = {}) {
    this.#gssv = new GssvWebClient({ fetchImpl });
    this.#player = new PsboxBrowserPlayer({
      video, onStatus,
      peerFactory: config => {
        const peer = peerFactory ? peerFactory(config) : new RTCPeerConnection(config);
        peer.addTransceiver('video', { direction: 'recvonly' });
        peer.addTransceiver('audio', { direction: 'recvonly' });
        return peer;
      }
    });
  }
  get player() { return this.#player; }
  async start({ xstsToken, transferToken, titleId, locale = 'pt-BR' }) {
    if (this.#active) throw new Error('SESSION_OCCUPIED');
    this.#active = true;
    this.#abort = new AbortController();
    const { signal } = this.#abort;
    try {
      await this.#gssv.login(xstsToken, { signal });
      if (signal.aborted) throw new Error('SESSION_CANCELLED');
      await this.#gssv.startSession(titleId, { locale, signal });
      let connected = false;
      for (let i = 0; i < 120; i++) {
        if (signal.aborted) throw new Error('SESSION_CANCELLED');
        const status = await this.#gssv.state({ signal });
        if (status?.state === 'Failed') throw new Error('CLOUD_SESSION_FAILED');
        if (['ReadyToConnect', 'Provisioned'].includes(status?.state) && !connected) {
          await this.#gssv.connect(transferToken, { signal });
          connected = true;
        }
        if (status?.state === 'Provisioned' && connected) break;
        if (i === 119) throw new Error('CLOUD_PROVISION_TIMEOUT');
        await delay(1000);
      }
      if (signal.aborted) throw new Error('SESSION_CANCELLED');
      await this.#player.start({
        sendOffer: sdp => this.#gssv.sendSdpOffer(sdp, { signal }),
        receiveAnswer: () => this.#gssv.pollSdpAnswer({ signal }),
        sendIceCandidate: candidate => this.#gssv.sendIceCandidate(candidate, { signal }),
        receiveIceCandidates: () => this.#gssv.pollIceCandidates({ signal })
      });
      if (signal.aborted) throw new Error('SESSION_CANCELLED');
      this.#keepalive = setInterval(() => {
        this.#gssv.keepalive({ signal }).catch(() => {});
      }, 15000);
    } catch (error) {
      await this.stop();
      throw error;
    }
  }
  async stop() {
    this.#abort?.abort();
    if (this.#keepalive !== null) clearInterval(this.#keepalive);
    this.#keepalive = null;
    this.#player.stop();
    await this.#gssv.stop();
    this.#gssv.dispose();
    this.#active = false;
  }
}
