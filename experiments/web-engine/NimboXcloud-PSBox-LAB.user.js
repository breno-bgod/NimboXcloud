// ==UserScript==
// @name         NimboXcloud PSBox WebRTC LAB (PR #34)
// @namespace    https://github.com/breno-bgod/NimboXcloud
// @version      0.1.0
// @description  Laboratório experimental Xbox Cloud: login Microsoft, GSSV e WebRTC. Não substitui o NimboXcloud oficial.
// @match        https://www.xbox.com/*
// @match        https://xbox.com/*
// @run-at       document-idle
// @grant        none
// @connect      login.live.com
// @connect      user.auth.xboxlive.com
// @connect      xsts.auth.xboxlive.com
// @connect      *.gssv-play-prod.xboxlive.com
// @license      GPL-3.0-or-later
// @downloadURL  https://raw.githubusercontent.com/breno-bgod/NimboXcloud/experiment/psbox-web-port/experiments/web-engine/NimboXcloud-PSBox-LAB.user.js
// @updateURL    https://raw.githubusercontent.com/breno-bgod/NimboXcloud/experiment/psbox-web-port/experiments/web-engine/NimboXcloud-PSBox-LAB.user.js
// ==/UserScript==

/* SPDX-License-Identifier: GPL-3.0-or-later
 * This userscript is deliberately isolated from the production userscript.
 * Dynamic ES module imports require browser CSP and CDN availability.
 * @connect does NOT bypass browser CORS with @grant none.
 */
(async () => {
  'use strict';
  if (document.getElementById('nimbo-psbox-lab-root')) return;
  const root = document.createElement('section');
  root.id = 'nimbo-psbox-lab-root';
  root.style.cssText = 'position:fixed;z-index:2147483647;right:12px;bottom:12px;width:min(410px,calc(100vw - 24px));max-height:85vh;overflow:auto;background:#101522;color:#e8edf8;border:1px solid #6b7c98;border-radius:12px;box-shadow:0 8px 35px #0009;font:14px system-ui;padding:14px;box-sizing:border-box';
  root.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><strong>PSBox WebRTC LAB — PR #34</strong><button id="nx-close" title="Fechar">×</button></div>
    <p id="nx-status" role="status">Carregando módulos experimentais...</p>
    <button id="nx-login">Entrar com Microsoft</button>
    <p id="nx-auth" hidden>Abra <a id="nx-link" href="https://www.microsoft.com/link" target="_blank" rel="noopener noreferrer" style="color:#8fc5ff">microsoft.com/link</a> e informe: <strong id="nx-code"></strong></p>
    <p id="nx-profile"></p>
    <label for="nx-title">ID do título Xbox Cloud</label><input id="nx-title" placeholder="titleId autorizado" style="width:100%;box-sizing:border-box;background:#1b2536;color:white;padding:8px;border:1px solid #526077;border-radius:6px">
    <p><button id="nx-start" disabled>Iniciar sessão</button><button id="nx-play">Ativar som</button><button id="nx-stop">Encerrar</button><button id="nx-logout">Sair</button></p>
    <video id="nx-video" autoplay playsinline controls style="width:100%;aspect-ratio:16/9;background:#000"></video>
    <small>Experimental: sem garantia de CORS, handshake completo ou gameplay. Não cole tokens em mensagens.</small>`;
  document.body.appendChild(root);
  const $ = id => root.querySelector('#' + id);
  const status = message => { $('nx-status').textContent = message; };
  let auth, session = null, busy = false, closed = false;
  const setStart = () => { $('nx-start').disabled = busy || !auth?.signedIn || !!session || closed; };
  $('nx-close').onclick = async () => { closed = true; try { await session?.stop(); } catch {} auth?.signOut(); root.remove(); };
  try {
    // jsDelivr serves .mjs as JavaScript and resolves the relative ESM imports.
    const base = 'https://cdn.jsdelivr.net/gh/breno-bgod/NimboXcloud@experiment/psbox-web-port/experiments/web-engine/';
    const [{ XboxWebAuth }, { PsboxCloudWebSession }] = await Promise.all([
      import(base + 'xbox-web-auth.mjs'), import(base + 'psbox-cloud-session.mjs')
    ]);
    if (closed) return;
    auth = new XboxWebAuth();
    status('Pronto. Faça login Microsoft.');
    $('nx-login').onclick = async () => {
      if (busy) return; busy = true; setStart();
      try {
        const profile = await auth.signIn({ onCode: ({ userCode, verificationUri }) => {
          const url = new URL(verificationUri);
          if (url.protocol !== 'https:' || !['microsoft.com', 'www.microsoft.com'].includes(url.hostname)) throw new Error('UNTRUSTED_VERIFICATION_URL');
          $('nx-link').href = url.href; $('nx-code').textContent = userCode; $('nx-auth').hidden = false;
          status('Autorize a conta Microsoft em outra aba.');
        } });
        if (closed) return;
        $('nx-auth').hidden = true; $('nx-code').textContent = '';
        $('nx-profile').textContent = profile?.gamertag ?? 'Conta Xbox autenticada';
        status('Login concluído. Informe o titleId.');
      } catch (error) { status('Login: ' + error.message); }
      finally { busy = false; setStart(); }
    };
    $('nx-start').onclick = async () => {
      if (busy || session) return;
      const titleId = $('nx-title').value.trim();
      if (!/^[a-zA-Z0-9._-]{1,128}$/.test(titleId)) return status('titleId inválido.');
      busy = true; setStart();
      try {
        const credentials = await auth.sessionCredentials();
        if (closed) return;
        session = new PsboxCloudWebSession({ video: $('nx-video'), onStatus: ({ state, detail }) => status('WebRTC: ' + state + (detail ? ' (' + detail + ')' : '')) });
        await session.start({ ...credentials, titleId });
        status('Sessão negociada; aguardando vídeo.');
      } catch (error) {
        status('Sessão: ' + error.message);
        await session?.stop().catch(() => {}); session = null;
      } finally { busy = false; setStart(); }
    };
    $('nx-play').onclick = () => session?.player.play().catch(error => status('Som: ' + error.message));
    $('nx-stop').onclick = async () => { if (!session) return; busy = true; setStart(); const current = session; session = null; await current.stop().catch(() => {}); busy = false; setStart(); status('Sessão encerrada.'); };
    $('nx-logout').onclick = async () => { if (session) await session.stop().catch(() => {}); session = null; auth.signOut(); $('nx-auth').hidden = true; $('nx-code').textContent = ''; $('nx-profile').textContent = ''; status('Desconectado.'); setStart(); };
  } catch (error) {
    status('Falha ao carregar módulos: ' + error.message + '. Verifique CSP, CDN e conexão.');
  }
})();
