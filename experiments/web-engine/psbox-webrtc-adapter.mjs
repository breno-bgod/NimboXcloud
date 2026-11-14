// Experimental Web adapter inspired by PSBox src/stream/stream_session.{h,cpp}.
// No auth, network endpoints, Xbox identity claims or production imports.
// The caller owns authorized signaling and supplies an RTCPeerConnection factory.
export class PsboxWebRtcAdapter {
  #peer = null;
  #generation = 0;
  #state = 'idle';
  #channels = new Map();
  #onTrack;
  #onState;
  #factory;
  #handshake = false;
  constructor({ peerFactory = (config) => new RTCPeerConnection(config), onTrack = () => {}, onState = () => {} } = {}) {
    this.#factory = peerFactory;
    this.#onTrack = onTrack;
    this.#onState = onState;
  }
  get state() { return this.#state; }
  get handshakeComplete() { return this.#handshake; }
  get channels() { return new Map(this.#channels); }
  #setState(state) { this.#state = state; this.#onState(state); }
  async start({ iceServers = [], sendOffer, receiveAnswer, sendIceCandidate, receiveIceCandidates } = {}) {
    if (this.#state !== 'idle') throw new Error('SESSION_OCCUPIED');
    if (typeof sendOffer !== 'function' || typeof receiveAnswer !== 'function') throw new TypeError('SIGNALING_REQUIRED');
    const generation = ++this.#generation;
    this.#setState('connecting');
    try {
      const peer = this.#factory({ iceServers });
      this.#peer = peer;
      peer.ontrack = (event) => { if (generation === this.#generation) this.#onTrack(event); };
      peer.ondatachannel = (event) => {
        if (generation === this.#generation && event?.channel?.label) this.#channels.set(event.channel.label, event.channel);
      };
      peer.onicecandidate = (event) => {
        if (generation !== this.#generation || !event.candidate || typeof sendIceCandidate !== 'function') return;
        Promise.resolve().then(() => sendIceCandidate(event.candidate.toJSON?.() ?? event.candidate)).catch(() => {});
      };
      const configs = [
        ['chat', { protocol: 'chatV1' }],
        ['control', { protocol: 'controlV1' }],
        ['input', { protocol: '1.0', ordered: false, maxRetransmits: 0 }],
        ['message', { protocol: 'messageV1' }]
      ];
      for (const [label, options] of configs) {
        const channel = peer.createDataChannel(label, options);
        this.#channels.set(label, channel);
      }
      const message = this.#channels.get('message');
      message.addEventListener?.('open', () => {
        if (generation !== this.#generation || message.readyState !== 'open') return;
        message.send(JSON.stringify({ type: 'Handshake', version: 'messageV1', id: 'be0bfc6d-1e83-4c8a-90ed-fa8601c5a179', cv: '0' }));
      });
      message.addEventListener?.('message', event => {
        if (generation !== this.#generation) return;
        try { if (JSON.parse(event.data)?.type === 'HandshakeAck') this.#handshake = true; } catch {}
      });
      const offer = await peer.createOffer();
      if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
      await peer.setLocalDescription(offer);
      if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
      await sendOffer(peer.localDescription?.sdp ?? offer.sdp);
      if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
      const answer = await receiveAnswer();
      if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
      if (!answer?.sdp || answer.type && answer.type !== 'answer') throw new Error('INVALID_SDP_ANSWER');
      await peer.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
      if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
      if (typeof receiveIceCandidates === 'function') {
        const candidates = await receiveIceCandidates();
        if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
        for (const candidate of candidates ?? []) {
          if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
          await peer.addIceCandidate(candidate);
        }
      }
      if (generation !== this.#generation) throw new Error('SESSION_CANCELLED');
      this.#setState('connected');
    } catch (error) {
      if (generation === this.#generation) this.close();
      throw error;
    }
  }
  send(label, payload) {
    if (this.#state !== 'connected') throw new Error('SESSION_NOT_CONNECTED');
    const channel = this.#channels.get(label);
    if (!channel || channel.readyState !== 'open') throw new Error('CHANNEL_NOT_OPEN');
    channel.send(payload);
  }
  close() {
    ++this.#generation;
    this.#handshake = false;
    for (const channel of this.#channels.values()) {
      try { channel.close(); } catch {}
    }
    this.#channels.clear();
    const peer = this.#peer;
    this.#peer = null;
    if (peer) {
      peer.ontrack = null; peer.ondatachannel = null; peer.onicecandidate = null;
      try { peer.close(); } catch {}
    }
    this.#setState('idle');
  }
}
