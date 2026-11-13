// Contrato experimental do Nimbo: não é API do PSBox nem ponte JNI.
// Sem rede, credenciais ou importação pelo userscript oficial.
export class SessionOwner {
  #adapters; #owner = null; #state = 'idle'; #error = null; #busy = false; #generation = 0;
  constructor(adapters) {
    this.#adapters = new Map();
    for (const id of ['nimbo-cloud', 'psbox']) {
      const adapter = adapters[id];
      if (!adapter || !['start', 'stop', 'neutralizeInput'].every(k => typeof adapter[k] === 'function'))
        throw new TypeError('INVALID_ADAPTER');
      this.#adapters.set(id, adapter);
    }
  }
  snapshot() {
    return Object.freeze({ state: this.#state, engine: this.#owner, error: this.#error, generation: this.#generation });
  }
  capabilities(engine) {
    if (!this.#adapters.has(engine)) throw new Error('UNKNOWN_ENGINE');
    const declared = this.#adapters.get(engine).capabilities;
    return Object.freeze(Object.fromEntries(['controller', 'keyboardMouse', 'touch']
      .map(key => [key, declared?.[key] === true])));
  }
  async start(engine) {
    if (!this.#adapters.has(engine)) throw new Error('UNKNOWN_ENGINE');
    if (this.#busy || this.#owner) throw new Error('SESSION_OCCUPIED');
    this.#busy = true; this.#owner = engine; this.#state = 'starting'; this.#error = null;
    const adapter = this.#adapters.get(engine);
    const generation = ++this.#generation;
    try {
      await adapter.start();
      this.#state = 'running';
      return generation;
    } catch {
      // Um start rejeitado pode ter alocado recursos: nunca libera a sessão
      // para o outro motor antes de confirmar cleanup.
      await this.#cleanup(adapter);
      if (!this.#owner && !this.#error) { this.#state = 'failed'; this.#error = 'START_FAILED'; }
      throw new Error(this.#error);
    } finally { this.#busy = false; }
  }
  async #cleanup(adapter) {
    let neutralized = true;
    try { await adapter.neutralizeInput(); } catch { neutralized = false; }
    // Mesmo com falha de entrada, tenta encerrar mídia/transporte.
    try { await adapter.stop(); }
    catch { this.#state = 'failed'; this.#error = 'STOP_FAILED'; return; }
    this.#owner = null;
    this.#state = neutralized ? 'idle' : 'failed';
    this.#error = neutralized ? null : 'INPUT_RELEASE_FAILED';
  }
  async stop() {
    if (this.#busy) throw new Error('OPERATION_IN_PROGRESS');
    if (!this.#owner) return this.snapshot();
    this.#busy = true; this.#state = 'stopping';
    ++this.#generation; // invalida callbacks/entrada da sessão anterior
    try {
      await this.#cleanup(this.#adapters.get(this.#owner));
      if (this.#error) throw new Error(this.#error);
      return this.snapshot();
    } finally { this.#busy = false; }
  }
  acceptsInput(engine, generation) {
    return this.#state === 'running' && this.#owner === engine && generation === this.#generation;
  }
}
