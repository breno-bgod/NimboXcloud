# Portabilidade experimental PSBox → Web

Origem importada: `experiments/upstream/psbox-cloud-gaming/`, upstream RafaelNGP/psbox-cloud-gaming commit `48de20b7c3ec47f544010169c8cb8a03626623ac`. Código original GPL-3.0-or-later; preservar créditos e licença.

Este laboratório **não** altera o userscript, não autentica, não inicia jogo e não faz chamadas reais ao Xbox. A classe `PsboxWebRtcAdapter` é uma tradução experimental da arquitetura `src/stream/stream_session.h` para APIs Web, não uma cópia literal do C++. Recebe callbacks de sinalização autorizada e fábrica de RTCPeerConnection injetados. Os testes são sintéticos e **não provam streaming real**.

Dependências analisadas em `CMakeLists.txt`: `xcloud_core` (HTTP, mbedTLS, auth, GSSV, catálogo, input), `xcloud_stream` (libdatachannel, SDP/ICE, RTP, input), `xcloud_media` (FFmpeg H264/Opus), `xcloud_ui` (canvas/fontes e menus), `xcloud_appcore` (lifecycle/worker/player). O navegador substitui libdatachannel por RTCPeerConnection, mídia por MediaStream/HTMLVideoElement e HTTP por fetch; a compatibilidade real de CORS, autenticação e canais ainda não foi demonstrada.

Executar: `node --test experiments/web-engine/*.test.mjs`.

Próximos incrementos: integração com SessionOwner próprio do Nimbo; contrato de sinalização GSSV; testes de SDP/ICE e cancelamento; pacotes binários de input e controle; mídia. Não conectar a produção sem evidências e revisão de licença.
