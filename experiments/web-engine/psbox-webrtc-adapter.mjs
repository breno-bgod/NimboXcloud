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
  constructor({ peerFactory = (config) => new RTCPeerConnection(config), onTrack = () => {}, onState = () => {} } = {}) {
    this.#factory = peerFactory;
    this.#onTrack = onTrack;
    this.#onState = onState;
  }
  get state() { return this.#state; }
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
      for (const label of ['message', 'control', 'input', 'chat']) {
        const channel = peer.createDataChannel(label);
        this.#channels.set(label, channel);
      }
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
