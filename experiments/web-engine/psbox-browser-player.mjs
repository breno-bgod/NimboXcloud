// Browser media sink for the experimental PSBox WebRTC port.
// Accepts actual remote MediaStreamTracks, never synthetic frames or credentials.
import { PsboxWebRtcAdapter } from './psbox-webrtc-adapter.mjs';

export class PsboxBrowserPlayer {
  #video;
  #stream;
  #adapter;
  #state = 'idle';
  #onStatus;
  #tracks = new Set();
  #epoch = 0;
  constructor({ video, onStatus = () => {}, peerFactory } = {}) {
    if (!video || typeof video.play !== 'function' || !('srcObject' in video))
      throw new TypeError('HTML_VIDEO_REQUIRED');
    this.#video = video;
    this.#onStatus = onStatus;
    this.#stream = new MediaStream();
    this.#video.autoplay = true;
    this.#video.playsInline = true;
    this.#video.controls = true;
    this.#adapter = new PsboxWebRtcAdapter({
      peerFactory,
      onTrack: (event) => this.#attachTrack(event.track),
      onState: (state) => {
        if (this.#state !== 'stopped') this.#status(state);
      }
    });
  }
  get state() { return this.#state; }
  get mediaStream() { return this.#stream; }
  get hasVideo() { return this.#tracks.size > 0 && [...this.#tracks].some(track => track.kind === 'video' && track.readyState === 'live'); }
  #status(state, detail = null) {
    this.#state = state;
    this.#onStatus({ state, detail, hasVideo: this.hasVideo });
  }
  #attachTrack(track) {
    if (!track || !['video', 'audio'].includes(track.kind) || this.#tracks.has(track)) return;
    this.#tracks.add(track);
    this.#stream.addTrack(track);
    const epoch = this.#epoch;
    track.addEventListener?.('ended', () => {
      if (epoch !== this.#epoch) return;
      this.#tracks.delete(track);
      this.#stream.removeTrack(track);
      this.#status(this.#tracks.size ? 'receiving' : 'media-ended');
    }, { once: true });
    this.#video.srcObject = this.#stream;
    this.#status('receiving');
    // Browser autoplay policies may block sound; keep user-gesture play() available.
    this.#video.play().catch(error => {
      if (epoch === this.#epoch) this.#status('playback-blocked', error?.name ?? 'PLAYBACK_BLOCKED');
    });
  }
  async start(signaling) {
    if (this.#state !== 'idle' && this.#state !== 'stopped') throw new Error('PLAYER_OCCUPIED');
    this.#epoch++;
    this.#status('connecting');
    try {
      await this.#adapter.start(signaling);
      if (this.#state === 'connecting') this.#status('waiting-for-media');
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  async play() {
    await this.#video.play();
    if (this.hasVideo) this.#status('receiving');
  }
  stop() {
    this.#epoch++;
    this.#adapter.close();
    try { this.#video.pause(); } catch {}
    this.#video.srcObject = null;
    for (const track of this.#tracks) {
      try { this.#stream.removeTrack(track); } catch {}
      // Remote WebRTC tracks are owned by RTCPeerConnection, not the video element.
    }
    this.#tracks.clear();
    this.#status('stopped');
  }
}
