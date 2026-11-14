// ==UserScript==
// @name         NimboXcloud PSBox WebRTC LAB (PR #34)
// @namespace    https://github.com/breno-bgod/NimboXcloud
// @version      0.2.0
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
    <p id="nx-profile"></p><p><button id="nx-library" disabled>Carregar biblioteca PSBox</button><input id="nx-search" placeholder="Pesquisar jogos" style="width:48%;padding:7px;background:#1b2536;color:white"></p><div id="nx-games" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-height:240px;overflow:auto"></div>
    <label for="nx-title">ID do título Xbox Cloud</label><input id="nx-title" placeholder="titleId autorizado" style="width:100%;box-sizing:border-box;background:#1b2536;color:white;padding:8px;border:1px solid #526077;border-radius:6px">
    <p><button id="nx-start" disabled>Iniciar sessão</button><button id="nx-play">Ativar som</button><button id="nx-stop">Encerrar</button><button id="nx-logout">Sair</button></p>
    <video id="nx-video" autoplay playsinline controls style="width:100%;aspect-ratio:16/9;background:#000"></video>
    <small>Experimental: sem garantia de CORS, handshake completo ou gameplay. Não cole tokens em mensagens.</small>`;
  document.body.appendChild(root);
  const $ = id => root.querySelector('#' + id);
  const status = message => { $('nx-status').textContent = message; };
  let auth, session = null, busy = false, closed = false, games = [], libraryClient = null;
  const setStart = () => { $('nx-start').disabled = busy || !auth?.signedIn || !!session || closed; };
  $('nx-close').onclick = async () => { closed = true; try { await session?.stop(); } catch {} auth?.signOut(); root.remove(); };
  try {
    // jsDelivr serves .mjs as JavaScript and resolves the relative ESM imports.
    const base = 'https://cdn.jsdelivr.net/gh/breno-bgod/NimboXcloud@experiment/psbox-web-port/experiments/web-engine/';
    const [{ XboxWebAuth }, { PsboxCloudWebSession }, { GssvWebClient }, { PsboxGameLibrary }] = await Promise.all([
      import(base + 'xbox-web-auth.mjs'), import(base + 'psbox-cloud-session.mjs'), import(base + 'gssv-web-client.mjs'), import(base + 'psbox-game-library.mjs')
    ]);
    if (closed) return;
    auth = new XboxWebAuth();
    const render = () => { const container = $('nx-games'); container.replaceChildren(); const query = $('nx-search').value.trim().toLocaleLowerCase('pt-BR'); for (const game of games.filter(g => (g.name || g.titleId).toLocaleLowerCase('pt-BR').includes(query)).slice(0,150)) { const btn = document.createElement('button'); btn.style.cssText = 'min-width:0;background:#1b2536;color:white;border:1px solid #526077;border-radius:6px;padding:4px;font:12px system-ui;overflow:hidden'; if (game.imageUrl) { const img = document.createElement('img'); img.src = game.imageUrl; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; img.style.cssText = 'width:100%;aspect-ratio:3/4;object-fit:cover'; btn.append(img); } const label = document.createElement('span'); label.textContent = game.name || game.titleId; btn.append(label); btn.onclick = () => { $('nx-title').value = game.titleId; status('Selecionado: ' + label.textContent + '. Clique em Iniciar sessão.'); }; container.append(btn); } };
    $('nx-search').oninput = render;
    $('nx-library').onclick = async () => { if (busy || !auth.signedIn) return; busy = true; $('nx-library').disabled = true; try { const { xstsToken } = await auth.sessionCredentials(); libraryClient?.dispose(); libraryClient = new GssvWebClient(); const login = await libraryClient.login(xstsToken); const library = new PsboxGameLibrary({ gssv: libraryClient }); status('Buscando títulos no GSSV do PSBox...'); games = await library.list({ market: login.market || 'BR', language: 'pt-BR' }); render(); status('Biblioteca PSBox: ' + games.length + ' títulos. Selecione um jogo.'); } catch (error) { status('Biblioteca: ' + error.message); } finally { busy = false; $('nx-library').disabled = !auth.signedIn; setStart(); } };
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
        $('nx-library').disabled = false;
        status('Login concluído. Clique em Carregar biblioteca PSBox.');
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
    $('nx-logout').onclick = async () => { if (session) await session.stop().catch(() => {}); session = null; auth.signOut(); libraryClient?.dispose(); libraryClient = null; games = []; $('nx-games').replaceChildren(); $('nx-library').disabled = true; $('nx-auth').hidden = true; $('nx-code').textContent = ''; $('nx-profile').textContent = ''; status('Desconectado.'); setStart(); };
  } catch (error) {
    status('Falha ao carregar módulos: ' + error.message + '. Verifique CSP, CDN e conexão.');
  }
})();
