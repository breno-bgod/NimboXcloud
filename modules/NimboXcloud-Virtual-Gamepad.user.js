// ==UserScript==
// @name         NimboXcloud — Controle Virtual (Experimental)
// @namespace    https://github.com/breno-bgod/NimboXcloud/virtual-gamepad
// @version      0.1.0
// @description  Controle Xbox virtual independente por toque: dois analógicos, botões e D-pad via Gamepad API.
// @author       KReight
// @license      MIT
// @match        https://play.xbox.com/*
// @run-at       document-start
// @sandbox      raw
// @grant        none
// @noframes
// @supportURL   https://github.com/breno-bgod/NimboXcloud/issues
// @downloadURL  https://raw.githubusercontent.com/breno-bgod/NimboXcloud/feature/virtual-gamepad-v0.1/modules/NimboXcloud-Virtual-Gamepad.user.js
// @updateURL    https://raw.githubusercontent.com/breno-bgod/NimboXcloud/feature/virtual-gamepad-v0.1/modules/NimboXcloud-Virtual-Gamepad.user.js
// ==/UserScript==

(function () {
  'use strict';

  const GLOBAL_KEY = '__NIMBOX_VIRTUAL_GAMEPAD_V010__';
  if (window[GLOBAL_KEY]) return;

  const VERSION = '0.1.0';
  const GAMEPAD_ID = 'NimboXcloud Virtual Gamepad';
  const BUTTON_COUNT = 17;
  const AXIS_COUNT = 4;
  const MAX_NATIVE_SLOTS = 4;
  const DEADZONE = 0.075;
  const state = {
    enabled: false, installed: false, error: '', reads: 0, lastIndex: -1,
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: BUTTON_COUNT }, () => 0),
    pointers: new Map(), buttonPointers: new Map(), panel: null, status: null
  };

  function clamp(value, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : 0;
  }
  function resetInputs() {
    state.axes = [0, 0, 0, 0];
    state.buttons.fill(0);
    state.pointers.clear();
    state.buttonPointers.clear();
    updateKnobs();
    updateButtonVisuals();
  }
  function makeButton(value) {
    const normalized = clamp(value, 0, 1);
    return { pressed: normalized > 0.5, touched: normalized > 0, value: normalized };
  }
  function createSnapshot(index) {
    return {
      id: GAMEPAD_ID, index, connected: true,
      timestamp: typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(),
      mapping: 'standard',
      axes: state.axes.slice(0, AXIS_COUNT),
      buttons: state.buttons.map(makeButton),
      hapticActuators: [], vibrationActuator: null
    };
  }
  function dispatchGamepadEvent(type, gamepad) {
    try {
      let event;
      if (typeof GamepadEvent === 'function') {
        event = new GamepadEvent(type, { gamepad, bubbles: false, cancelable: false });
      } else {
        event = new Event(type);
        Object.defineProperty(event, 'gamepad', { enumerable: true, value: gamepad });
      }
      window.dispatchEvent(event);
    } catch (error) {
      console.debug('[Nimbo Virtual Gamepad] Evento ' + type + ' não pôde ser emitido:', error);
    }
  }

  const nativeDescriptor = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');
  const nativeGetGamepads = typeof navigator.getGamepads === 'function'
    ? navigator.getGamepads.bind(navigator) : null;

  function findVirtualIndex(pads) {
    for (let index = 0; index < MAX_NATIVE_SLOTS; index += 1) {
      const pad = pads[index];
      if (!pad || pad.connected === false) return index;
    }
    return Math.max(MAX_NATIVE_SLOTS, pads.length);
  }
  function installGamepadProvider() {
    if (!nativeGetGamepads) {
      state.error = 'Este navegador não disponibiliza navigator.getGamepads().';
      return false;
    }
    if (nativeDescriptor && nativeDescriptor.configurable === false) {
      state.error = 'A propriedade getGamepads não permite integração neste navegador.';
      return false;
    }
    try {
      const provider = function () {
        const nativePads = nativeGetGamepads();
        if (!state.enabled) return nativePads;
        const pads = Array.from(nativePads || []);
        const index = findVirtualIndex(pads);
        const previousIndex = state.lastIndex;
        const snapshot = createSnapshot(index);
        if (previousIndex !== index && previousIndex >= 0) {
          dispatchGamepadEvent('gamepaddisconnected', createSnapshot(previousIndex));
        }
        pads[index] = snapshot;
        state.lastIndex = index;
        state.reads += 1;
        if (previousIndex !== index) dispatchGamepadEvent('gamepadconnected', snapshot);
        return pads;
      };
      Object.defineProperty(navigator, 'getGamepads', {
        configurable: true,
        enumerable: nativeDescriptor ? !!nativeDescriptor.enumerable : true,
        writable: true,
        value: provider
      });
      state.installed = navigator.getGamepads === provider;
      if (!state.installed) state.error = 'O navegador não confirmou a instalação do provedor.';
      return state.installed;
    } catch (error) {
      state.error = 'Não foi possível instalar o provedor: ' + String(error && error.message || error);
      return false;
    }
  }
  function setEnabled(enabled) {
    const next = !!enabled;
    if (next === state.enabled) return;
    if (next && !state.installed && !installGamepadProvider()) {
      refreshStatus();
      return;
    }
    if (!next && state.enabled && state.lastIndex >= 0) {
      dispatchGamepadEvent('gamepaddisconnected', createSnapshot(state.lastIndex));
    }
    state.enabled = next;
    if (!next) {
      resetInputs();
      state.lastIndex = -1;
    } else {
      state.lastIndex = -1;
    }
    refreshStatus();
  }
  function setAxis(index, value) {
    if (index < 0 || index >= AXIS_COUNT) return;
    state.axes[index] = clamp(value, -1, 1);
    if (Math.abs(state.axes[index]) < DEADZONE) state.axes[index] = 0;
    updateKnobs();
  }
  function setButton(index, value) {
    if (index < 0 || index >= BUTTON_COUNT) return;
    state.buttons[index] = clamp(value, 0, 1);
    updateButtonVisuals();
  }
  function updateStick(stick, pointerEvent) {
    const rect = stick.getBoundingClientRect();
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.38);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let x = clamp((pointerEvent.clientX - centerX) / radius, -1, 1);
    let y = clamp((pointerEvent.clientY - centerY) / radius, -1, 1);
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    const start = stick.dataset.stick === 'left' ? 0 : 2;
    setAxis(start, x);
    setAxis(start + 1, y);
    const knob = stick.querySelector('.nvg-knob');
    if (knob) knob.style.transform = 'translate(' + (x * 31) + 'px,' + (y * 31) + 'px)';
  }
  function updateKnobs() {
    if (!state.panel) return;
    ['left', 'right'].forEach((side, index) => {
      const knob = state.panel.querySelector('[data-stick="' + side + '"] .nvg-knob');
      if (!knob) return;
      knob.style.transform = 'translate(' + (state.axes[index * 2] * 31) + 'px,' +
        (state.axes[index * 2 + 1] * 31) + 'px)';
    });
  }
  function updateButtonVisuals() {
    if (!state.panel) return;
    state.panel.querySelectorAll('[data-button]').forEach((element) => {
      const index = Number(element.dataset.button);
      element.classList.toggle('is-pressed', state.buttons[index] > 0.5);
    });
  }
  function refreshStatus() {
    if (!state.status) return;
    let nativeCount = 0;
    try {
      nativeCount = nativeGetGamepads
        ? Array.from(nativeGetGamepads() || []).filter((pad) => pad && pad.connected).length : 0;
    } catch (_) {}
    state.status.textContent = state.error ? state.error : (state.enabled
      ? 'Ativo · aguardando leitura do jogo · controles físicos: ' + nativeCount
      : 'Desativado · controles físicos preservados: ' + nativeCount);
    const toggle = state.panel && state.panel.querySelector('[data-action="toggle"]');
    if (toggle) {
      toggle.textContent = state.enabled ? 'Desativar controle' : 'Ativar controle';
      toggle.classList.toggle('is-active', state.enabled);
    }
  }

  const STYLE = `
    #nimbo-vgp-root{position:fixed;z-index:2147483000;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));font:500 13px/1.35 system-ui,-apple-system,Segoe UI,sans-serif;color:#f5f7fb;touch-action:none;user-select:none;-webkit-user-select:none}
    #nimbo-vgp-root *{box-sizing:border-box}
    #nimbo-vgp-launch{border:1px solid #ffffff30;background:#151922ed;color:#fff;border-radius:14px;padding:10px 14px;font-weight:800;letter-spacing:.04em;box-shadow:0 8px 28px #0008;touch-action:manipulation}
    #nimbo-vgp-panel{width:min( min(94vw,620px), calc(100vw - 20px));padding:12px;background:#111722f2;border:1px solid #ffffff26;border-radius:18px;box-shadow:0 14px 42px #000a;backdrop-filter:blur(12px);margin-bottom:9px}
    #nimbo-vgp-panel[hidden]{display:none}
    .nvg-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
    .nvg-title{font-weight:850;letter-spacing:.06em}.nvg-sub{font-size:10px;color:#aab5c5}
    .nvg-status{font-size:10px;color:#aab5c5;min-height:14px;margin:6px 0 10px}
    .nvg-toggle{border:1px solid #ffffff30;border-radius:10px;padding:8px 11px;background:#27354a;color:#fff;font-weight:750}
    .nvg-toggle.is-active{background:#176b50}
    .nvg-close{border:0;background:transparent;color:#dce5f2;font-size:21px;padding:2px 8px}
    .nvg-deck{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center}
    .nvg-side{display:flex;flex-direction:column;gap:8px;align-items:center;min-width:0}
    .nvg-stick{width:clamp(104px,25vw,142px);height:clamp(104px,25vw,142px);border-radius:50%;border:1px solid #ffffff35;background:radial-gradient(circle,#263448 0 42%,#182231 43% 68%,#0b111b 69%);display:grid;place-items:center;position:relative;touch-action:none}
    .nvg-knob{width:44px;height:44px;border-radius:50%;background:linear-gradient(145deg,#64758b,#26364b);border:2px solid #aebdce;box-shadow:0 5px 12px #0009;pointer-events:none}
    .nvg-caption{font-size:10px;color:#9ba9bc;font-weight:750;letter-spacing:.08em}
    .nvg-cluster{display:grid;grid-template-columns:repeat(3,34px);grid-template-rows:repeat(3,30px);gap:3px;align-items:center;justify-items:center}
    .nvg-key{min-width:32px;height:30px;border:1px solid #ffffff30;border-radius:9px;background:#263448;color:#f5f7fb;font-weight:800;touch-action:none;padding:0 7px}
    .nvg-key.is-pressed{background:#e6edf7;color:#111827;transform:scale(.96)}
    .nvg-spacer{width:32px;height:30px}
    .nvg-face{display:grid;grid-template-columns:repeat(3,34px);grid-template-rows:repeat(3,30px);gap:3px;align-items:center;justify-items:center}
    .nvg-face [data-button="0"]{grid-column:2;grid-row:3;background:#176b50}
    .nvg-face [data-button="1"]{grid-column:3;grid-row:2;background:#8d3038}
    .nvg-face [data-button="2"]{grid-column:1;grid-row:2;background:#245b9c}
    .nvg-face [data-button="3"]{grid-column:2;grid-row:1;background:#8b6b20}
    .nvg-shoulders{display:flex;gap:5px;justify-content:center;flex-wrap:wrap}
    .nvg-shoulders .nvg-key{min-width:48px}
    .nvg-center{display:flex;gap:7px;justify-content:center}
    .nvg-center .nvg-key{min-width:42px}
    .nvg-foot{display:flex;justify-content:space-between;gap:8px;margin-top:10px;color:#8290a4;font-size:9px}
    @media(max-width:390px){#nimbo-vgp-panel{padding:9px}.nvg-deck{gap:4px}.nvg-stick{width:100px;height:100px}.nvg-key{min-width:29px;padding:0 5px}.nvg-cluster,.nvg-face{grid-template-columns:repeat(3,30px)}}
  `;

  function buttonMarkup(index, label) {
    return '<button type="button" class="nvg-key" data-button="' + index + '">' + label + '</button>';
  }
  function mount() {
    if (document.getElementById('nimbo-vgp-root')) return;
    const root = document.createElement('div');
    root.id = 'nimbo-vgp-root';
    root.innerHTML = `
      <section id="nimbo-vgp-panel" hidden aria-label="Controle virtual NimboXcloud">
        <div class="nvg-head">
          <div><div class="nvg-title">NIMBOXCLOUD · VIRTUAL GAMEPAD</div><div class="nvg-sub">Experimental 0.1.0 · Gamepad API</div></div>
          <button type="button" class="nvg-close" data-action="close" aria-label="Fechar">×</button>
        </div>
        <div class="nvg-status" aria-live="polite">Inicializando...</div>
        <button type="button" class="nvg-toggle" data-action="toggle">Ativar controle</button>
        <div class="nvg-deck">
          <div class="nvg-side">
            <div class="nvg-shoulders">${buttonMarkup(4, 'LB')}${buttonMarkup(6, 'LT')}${buttonMarkup(8, 'VIEW')}</div>
            <div class="nvg-stick" data-stick="left" aria-label="Analógico esquerdo"><div class="nvg-knob"></div></div>
            <div class="nvg-caption">ANALÓGICO ESQUERDO</div>
            <div class="nvg-cluster">
              <span class="nvg-spacer"></span>${buttonMarkup(12, '▲')}<span class="nvg-spacer"></span>
              ${buttonMarkup(14, '◀')}<span class="nvg-spacer"></span>${buttonMarkup(15, '▶')}
              <span class="nvg-spacer"></span>${buttonMarkup(13, '▼')}<span class="nvg-spacer"></span>
            </div>
            <div class="nvg-center">${buttonMarkup(10, 'L3')}</div>
          </div>
          <div class="nvg-side">
            <div class="nvg-shoulders">${buttonMarkup(5, 'RB')}${buttonMarkup(7, 'RT')}${buttonMarkup(9, 'MENU')}</div>
            <div class="nvg-face">
              ${buttonMarkup(0, 'A')}${buttonMarkup(1, 'B')}${buttonMarkup(2, 'X')}${buttonMarkup(3, 'Y')}
            </div>
            <div class="nvg-stick" data-stick="right" aria-label="Analógico direito"><div class="nvg-knob"></div></div>
            <div class="nvg-caption">ANALÓGICO DIREITO</div>
            <div class="nvg-center">${buttonMarkup(11, 'R3')}${buttonMarkup(16, 'HOME')}</div>
          </div>
        </div>
        <div class="nvg-foot"><span>Toque e segure para pressionar</span><span>Os controles físicos não são bloqueados</span></div>
      `;
    const style = document.createElement('style');
    style.textContent = STYLE;
    (document.head || document.documentElement).appendChild(style);
    document.body.appendChild(root);
    state.panel = root.querySelector('#nimbo-vgp-panel');
    state.status = root.querySelector('.nvg-status');
    const launch = document.createElement('button');
    launch.type = 'button';
    launch.id = 'nimbo-vgp-launch';
    launch.textContent = 'NX · CONTROLE';
    root.appendChild(launch);
    launch.addEventListener('click', () => {
      state.panel.hidden = !state.panel.hidden;
      launch.textContent = state.panel.hidden ? 'NX · CONTROLE' : 'NX · OCULTAR';
    });
    root.querySelector('[data-action="close"]').addEventListener('click', () => {
      state.panel.hidden = true;
      launch.textContent = 'NX · CONTROLE';
    });
    root.querySelector('[data-action="toggle"]').addEventListener('click', () => setEnabled(!state.enabled));

    root.querySelectorAll('.nvg-stick').forEach((stick) => {
      stick.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        stick.setPointerCapture(event.pointerId);
        state.pointers.set(event.pointerId, { type: 'stick', element: stick });
        updateStick(stick, event);
      });
      stick.addEventListener('pointermove', (event) => {
        if (state.pointers.has(event.pointerId)) updateStick(stick, event);
      });
      const release = (event) => {
        if (!state.pointers.has(event.pointerId)) return;
        state.pointers.delete(event.pointerId);
        const start = stick.dataset.stick === 'left' ? 0 : 2;
        setAxis(start, 0);
        setAxis(start + 1, 0);
        try { if (stick.hasPointerCapture(event.pointerId)) stick.releasePointerCapture(event.pointerId); } catch (_) {}
      };
      stick.addEventListener('pointerup', release);
      stick.addEventListener('pointercancel', release);
      stick.addEventListener('lostpointercapture', release);
    });
    root.querySelectorAll('[data-button]').forEach((button) => {
      const index = Number(button.dataset.button);
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        state.pointers.set(event.pointerId, { type: 'button', index, element: button });
        if (!state.buttonPointers.has(index)) state.buttonPointers.set(index, new Set());
        state.buttonPointers.get(index).add(event.pointerId);
        setButton(index, 1);
      });
      const release = (event) => {
        const pointer = state.pointers.get(event.pointerId);
        if (!pointer || pointer.type !== 'button') return;
        state.pointers.delete(event.pointerId);
        const activePointers = state.buttonPointers.get(index);
        if (activePointers) {
          activePointers.delete(event.pointerId);
          if (!activePointers.size) state.buttonPointers.delete(index);
        }
        setButton(index, state.buttonPointers.has(index) ? 1 : 0);
        try { if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId); } catch (_) {}
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
    refreshStatus();
  }
  function mountWhenReady() {
    if (document.body) { mount(); return; }
    const observer = new MutationObserver(() => {
      if (document.body) { observer.disconnect(); mount(); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.addEventListener('blur', resetInputs);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') resetInputs();
  });
  window.addEventListener('pagehide', () => { setEnabled(false); resetInputs(); });

  const api = {
    version: VERSION,
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    setAxis,
    setButton,
    getState: () => ({
      version: VERSION, enabled: state.enabled, installed: state.installed,
      error: state.error, reads: state.reads, lastIndex: state.lastIndex,
      axes: state.axes.slice(), buttons: state.buttons.slice()
    })
  };
  Object.defineProperty(window, 'NimboVirtualGamepad', {
    configurable: false, enumerable: false, writable: false, value: api
  });
  window[GLOBAL_KEY] = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWhenReady, { once: true });
  } else { mountWhenReady(); }
  installGamepadProvider();
  console.info('[Nimbo Virtual Gamepad] ' + VERSION + ' carregado. Ative no HUD para disponibilizar o controle.');
})();