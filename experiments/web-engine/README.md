# Portabilidade experimental PSBox → Web

Origem importada: `experiments/upstream/psbox-cloud-gaming/`, upstream RafaelNGP/psbox-cloud-gaming commit `48de20b7c3ec47f544010169c8cb8a03626623ac`. Código original GPL-3.0-or-later; preservar créditos e licença.

Este laboratório **não** altera o userscript, não autentica, não inicia jogo e não faz chamadas reais ao Xbox. A classe `PsboxWebRtcAdapter` é uma tradução experimental da arquitetura `src/stream/stream_session.h` para APIs Web, não uma cópia literal do C++. Recebe callbacks de sinalização autorizada e fábrica de RTCPeerConnection injetados. Os testes são sintéticos e **não provam streaming real**.

Dependências analisadas em `CMakeLists.txt`: `xcloud_core` (HTTP, mbedTLS, auth, GSSV, catálogo, input), `xcloud_stream` (libdatachannel, SDP/ICE, RTP, input), `xcloud_media` (FFmpeg H264/Opus), `xcloud_ui` (canvas/fontes e menus), `xcloud_appcore` (lifecycle/worker/player). O navegador substitui libdatachannel por RTCPeerConnection, mídia por MediaStream/HTMLVideoElement e HTTP por fetch; a compatibilidade real de CORS, autenticação e canais ainda não foi demonstrada.

Executar: `node --test experiments/web-engine/*.test.mjs`.

Próximos incrementos: integração com SessionOwner próprio do Nimbo; contrato de sinalização GSSV; testes de SDP/ICE e cancelamento; pacotes binários de input e controle; mídia. Não conectar a produção sem evidências e revisão de licença.

## Player WebRTC com trilhas reais (incremento atual)

`psbox-browser-player.mjs` conecta eventos `ontrack` de um RTCPeerConnection ao `MediaStream` de um `HTMLVideoElement`, com áudio, vídeo, tratamento de autoplay e encerramento. `player.html` é uma página de laboratório com sinalização manual SDP para **um peer WebRTC autorizado sob controle do operador**; inclui transceivers recvonly de vídeo/áudio e espera ICE completo. Servir por HTTP local (por exemplo, `python3 -m http.server 8000` na raiz do repositório) e abrir `http://localhost:8000/experiments/web-engine/player.html`. Não expor SDP publicamente.

**Não é ainda streaming Xbox Cloud:** falta implementação/validação de autenticação e sessão GSSV legítima, transporte de sinalização automático, candidatos remotos/trickle ICE quando necessários, protocolo de controle, teste em navegador com mídia real e compatibilidade de CORS. A página não solicita nem armazena credenciais Xbox. O objetivo da etapa foi entregar o pipeline real de mídia do navegador antes da próxima rodada de testes, conforme orientação do mantenedor.

## Interface experimental Xbox Cloud

Abra `experiments/web-engine/cloud.html` via servidor HTTP local (`python3 -m http.server 8000` na raiz do repositório, depois `http://localhost:8000/experiments/web-engine/cloud.html`). O botão **Entrar com Microsoft** aciona o Device Code OAuth do PSBox, obtém Xbox Live/XSTS e habilita **Iniciar sessão cloud**, que solicita token de transferência, cria sessão GSSV e tenta negociar o player WebRTC. Não há persistência dos tokens; não publicar logs, SDP ou credenciais.

**Limitações verificáveis:** navegador pode bloquear endpoints Microsoft/Xbox por CORS, o handshake de data channels do PSBox ainda não foi portado integralmente, não há seleção de título via catálogo nem validação de áudio/vídeo real. A UI não substitui o userscript oficial. Nunca colocar credenciais num proxy público ou desligar políticas de segurança do navegador. Os testes de unidade são simulados, não substituem login real.
