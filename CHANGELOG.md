## [4.12.85] — 2026-11-12
- Reorganizado o painel NX por responsabilidade: Vídeo, Imagens, Streaming, Estatísticas, Gamepad, Teclado e mouse, Áudio, Voz, Remote Play, Região da loja, Interface, Compatibilidade e Sistema.
- Separados os ajustes de perfil do dispositivo, enquadramento e tela cheia dos filtros de imagem e do processamento gráfico WebGL2.
- Movidos giroscópio, vibração, diagnóstico de gamepad e atalho do controle para **Gamepad**.
- Movidos NimboTouch, editor de HUD, diagnóstico de toque/mouse e atalho de teclado para **Teclado e mouse**.
- Corrigida a associação da página **Voz**: agora ela exibe o grupo do microfone, em vez do terceiro grupo de diagnóstico de entradas.
- Separados os grupos de microfone e vibração; as preferências e chaves locais existentes foram preservadas.
- Transferidos métricas e configurações do NX Stream Monitor para **Estatísticas**; Streaming mantém data center, qualidade solicitada, rede e medições de servidores.
- O módulo gráfico atual usa WebGL2/filtros locais; FSR 1 não está implementado nesta versão.
- Adicionados testes estáticos para propriedade das categorias, navegação, atalhos e separação de telemetria.

## [4.12.84] — 2026-11-12
- Made xHome virtual gamepad a separate presentation mode: while enabled, the K/M touch area, WASD joystick and mapped keyboard/mouse buttons are hidden. The shared HUD editor still exposes both layouts so each can be positioned and adjusted independently.
- No input transport, xCloud retail path, Gamepad API hook or scheduler changed.

## [4.12.83] — 2026-11-12
- Added an optional Xbox-style virtual gamepad HUD to NimboTouch for Remote Play xHome only: dual analog sticks, face buttons, D-pad, bumpers, analog triggers, View/Menu, stick clicks and an opt-in Home button.
- Reused the existing xHome touch adapter, virtual-gamepad encoder, shared scheduler and per-profile HUD geometry/editor. The xCloud retail transport and its native/TAK input path are unchanged.
- Added independent pointer ownership for both sticks and simultaneous buttons, circular axis clamping, analog trigger values, and release on pointer end/cancel, blur, hidden page, menu suspension, Stop and session teardown.
- No synthetic navigator.getGamepads override, extra polling loop or second input manager was introduced.
- Added Node regression tests for multi-touch ownership, diagonal clamping, trigger pressure, cancellation and suspension/recovery. Real Xbox input acceptance remains unverified.

## [4.12.82] — 2026-11-12
- Preserved the xHome NimboTouch adapter, virtual-gamepad contract, shared input sequence and existing remote lifecycle while integrating the HUD editor deletion fix.
- Restored the production updateURL/downloadURL to the repository main branch. A promoted feature-branch snapshot had pointed userscript updates at the experimental branch and removed the xHome touch adapter.
- Fixed the HUD editor deleting every binding when removing one custom key; deletion now targets only the selected ID and keeps the remaining controls and saved geometry.
- Corrected over-escaped xHome scheduler regression assertions and added a runtime regression that executes the actual removeKey method.
- Added a guard test for xHome adapter presence and main-branch distribution URLs. The experimental Gamepad API panel branch was not merged into main; xCloud continues to use the existing opt-in input architecture.
- Updated the userscript/runtime version and Touch HUD @require cache key to 4.12.82; Touch HUD module remains 1.2.3.
- No Xbox hardware, browser, or authenticated streaming test was performed; Remote Play remains experimental.

## [4.12.80] — 2026-11-12
- Fixed the shared xHome gamepad loop returning early when the browser Gamepad API is unavailable or throws. It now continues with an empty physical snapshot, allowing the touch virtual gamepad to resume and stale physical slots to neutralize.
- Added dynamic and structural regressions for virtual-input recovery without Gamepad API.
- No synthetic Gamepad API, additional polling loop, or change to the xCloud input path was introduced.

## [4.12.79] — 2026-11-12
- Fixed stale virtual touch-gamepad state across xHome focus, visibility, and NX-panel suspension. A suspended touch state is cleared after neutralization, and new virtual frames are rejected until the shared scheduler resumes.
- Preserved physical gamepad state handling, slot registration, the shared polling loop, packet sequence, and the existing xCloud Gamepad API path.
- Added a regression for neutral-frame emission, idempotent repeated suspension, stale-update rejection, slot release on resume, and fresh-input recovery.
- Real Xbox acceptance and on-device touch behavior remain unverified.

## [4.12.78] — 2026-11-12
- Added a normalized virtual-gamepad transport contract to the xHome touch adapter. It accepts four standard axes and up to 17 standard buttons, applies a radial deadzone and circular magnitude clamp, and preserves analog trigger values.
- Virtual touch-gamepad state reuses the existing xHome encoder, shared packet sequence, gamepadChanged registration, neutral-release lifecycle, backpressure handling, and single gamepad polling loop. It reserves an available remote slot beside physical controllers without replacing Gamepad API or adding another scheduler.
- Exposed `NimboTouch.sendRemoteGamepadState()` and `releaseRemoteGamepad()` for a future analog touch surface. No new on-screen stick or HUD layout was added in this version; the current WASD HUD remains unchanged.
- The shared input loop now continues to service a connected xHome virtual gamepad when `navigator.getGamepads` is unavailable, while preserving physical-gamepad polling when supported.
- Added mock regressions for radial normalization, axes/triggers/buttons, slot coexistence, release ordering, stale-session rejection, and the no-Gamepad-API path. Real Xbox acceptance and Android/browser interaction remain unverified.

## [4.12.77] — 2026-11-12
- Integrated the existing NimboTouch HUD with the xHome input data channel through an explicit, opt-in adapter. Relative mouse movement, mouse buttons, wheel and virtual keyboard keys use the existing xHome encoders and shared input sequence.
- Added separate Remote Play HUD activation/deactivation, including a distinct enabled state so a paused HUD can still be disabled from the NX panel. The HUD pauses on focus/visibility/menu loss and resumes only while the same adapter and WebRTC session are ready.
- Adapter teardown releases held virtual keys and mouse buttons before data-channel closure; stale request IDs and congested channels reject new touch input. The xCloud attachSession and native keyboard/mouse activation/restore path remain unchanged.
- Added mock regressions for packet ordering, release, backpressure, stale-session rejection and the module adapter contract. Real Xbox input acceptance and on-device touch behavior remain unverified.

## [4.12.75] — 2026-11-12
- Added xHome media lifecycle diagnostics for received audio/video tracks, mute/unmute/ended transitions, video metadata/frame readiness, dimensions, playback state, and browser autoplay rejection.
- Deduplicated playback requests for repeated WebRTC track events and added a user-triggered playback retry when autoplay is blocked.
- Stop, cancel, and failed-session cleanup now detach media listeners, clear the video element, stop tracks, reset sanitized diagnostics, and reject stale callbacks from previous sessions.
- Renamed the NX navigation tab from “Gyro Touch” to “Teclado e mouse” and updated its icon; the internal builder ID and existing settings remain unchanged.
- Aligned the userscript metadata, runtime diagnostic version, and Touch HUD @require cache key at 4.12.75.
- Added regressions for media lifecycle, autoplay rejection, duplicate playback, stale callbacks, tab organization, and version consistency.
- Mock tests do not prove Xbox hardware compatibility, real ICE connectivity, decoded video, or audible audio; physical-console validation remains pending.

## [4.12.73] — 2026-11-12
- Made the NimboTouch session facade forward every xCloud `updateInputConfigurationAsync` call unchanged. It no longer guesses NimboTouch activation from the values of keyboard/mouse flags, which could also be requested by the native client.
- Moved NimboTouch keyboard/mouse activation into an explicit transport method called only by the NimboTouch toggle. Its snapshot and rollback are limited to keyboard/mouse fields and never include `enableTouchInput`.
- Captured the active transport for the asynchronous activation and aborts the UI transition if the streaming session is replaced mid-operation.
- Added five Node regression tests for native touch on/off, native keyboard+mouse requests, explicit NimboTouch activation, and rollback after native touch-mode changes.
- Added an xHome mock-WebRTC regression test for incoming audio/video tracks, duplicate-track suppression, media-stream attachment and playback invocation.
- Added a CI syntax check for the required Touch HUD module.
- Automated tests do not prove Chrome/Edge or authenticated xCloud runtime behavior; real-session validation remains pending.

## [4.12.71] — 2026-11-12
- Added a read-only TAK runtime probe for the `window.testTouchLayout` own-property descriptor. It never invokes the hook, executes accessors, inspects layout contents, or mutates the stream.
- Exposed the probe in the NX device-compatibility diagnostic and protocol report; absence is explicitly scoped to the userscript-visible window and is not treated as proof that the page runtime lacks TAK.
- Added five deterministic tests covering missing, callable, accessor, non-function and hostile descriptor cases.
- Documented the official TAK v4.0 schema capabilities (analog sticks, gamepad actions, touchpad, gyroscope, accelerometer, opacity, scale, sensitivity and deadzone) and the distinction between the Better xCloud runtime test hook and Microsoft's developer-only sideload flow.
- Aligned the internal diagnostic version constant with the published userscript version while releasing 4.12.71.
- No layout is applied and no Remote Play or Cloud Gaming input path is changed.

## [4.12.70] — 2026-11-12
- Added the NX Minimal Touch visual skin to the existing NimboTouch HUD: compact translucent-black key buttons with white labels, a lighter analog-stick base and knob, and a discreet touch/mouse surface with an editor-only aiming marker.
- The skin is presentation-only: it does not convert keyboard/mouse bindings into Xbox gamepad buttons, add a native TAK D-pad, or claim analog gamepad output. Existing input behavior and saved HUD geometry remain unchanged.
- Bumped the Touch HUD module to 1.1.7 and updated the userscript dependency cache key.
- Native TAK assets/runtime application and a true Xbox virtual gamepad remain separate validation tasks.

## [4.12.69] — 2026-11-12
- Integrated opt-in physical keyboard and mouse capture into the xHome input channel, using the existing pure Keyboard (64) and Mouse (32) encoders.
- Added ordered shared input sequencing across metadata, gamepad, keyboard and mouse reports; the client metadata frame remains sequence 0 and the first input frame starts at 1.
- Added key-state tracking, repeat suppression, relative mouse movement, button transitions, wheel deltas and forced release frames on blur, hidden page, Escape, pagehide, disconnect and Stop.
- Capture is scoped to the remote video and enabled only by the user; touch pointers and untrusted synthetic keyboard events are ignored, NX shortcuts and configured push-to-talk are preserved, and no new permanent polling or Gamepad API hook is installed.
- Fixed gamepad routing while the NX panel is open: focusing the xHome video routes the controller to the console and uses the 16 ms input loop instead of navigating the panel; no Pointer Lock request is made.
- Touch HUD forwarding to xHome and Xbox hardware validation remain pending.

## [4.12.68] — 2026-11-12
- Added pure xHome keyboard and mouse encoders using the shared 14-byte input header: Keyboard report 64 with a 3-byte VKey frame, and Mouse report 32 with an 18-byte frame.
- Added physical KeyboardEvent.code to Windows virtual-key mapping with validated legacy keyCode fallback; unknown keys are rejected instead of emitting ambiguous input.
- Mouse encoding preserves signed relative X/Y and wheel deltas, the browser button bitmask, and the relative/absolute flag; numeric fields are clamped to their protocol widths.
- Refactored the gamepad encoder to use the same packet-header helper without changing its 38-byte wire layout.
- Corrected stale xHome diagnostics/comments that still claimed authentication and gamepad forwarding were not implemented.
- Encoders are still dormant: no global keyboard/mouse listeners, pointer lock, Touch HUD integration, or keyboard/mouse transmission was added. Xbox validation remains pending.

## [4.12.67] — 2026-11-12
- Integra o gamepad físico ao canal input xHome usando o encoder binário já existente e o slot estável do índice do navegador (0–3).
- Reutiliza o loop de leitura do painel NX: frequência adaptativa de 75 ms normalmente e 16 ms somente quando a sessão xHome, os quatro canais, o HandshakeAck e o foco permitem entrada.
- Neutraliza controles em desconexão, abertura do painel, perda de foco, ocultação da página, pagehide e encerramento; tenta novamente se o canal rejeitar um frame de liberação e limita fila por bufferedAmount.
- Não adiciona override de navigator.getGamepads, polling paralelo, nem altera o fluxo de entrada do Cloud Gaming. A transmissão xHome continua experimental e sem homologação em Xbox real.

## [4.12.66] — 2026-11-12
- Added a deterministic xHome gamepad packet encoder matching the public MIT reference layout: 14-byte header, one-frame count and 23-byte gamepad record (38 bytes total).
- Added idempotent registration/unregistration for remote gamepad slots 0–3; registered slots are released before data-channel teardown.
- Encoder remains pure and dormant: no continuous frame transmission, Gamepad API interception, or polling was added.
- Replaced real Node timers in the xHome test harness with browser-like numeric fake handles; explicit timeout tests retain controllable fake clocks.
- CI after PR #2: baseline run 43176093250 and regression run 43176093339 both PASS; node --check and static risk report PASS; 123 tests, 120 PASS, 0 FAIL, 3 TODO.

## [4.12.65] — 2026-11-12
- O bootstrap xHome agora possui timeout de 12 segundos para abertura dos quatro data channels e recebimento de `HandshakeAck`; o timer é cancelado somente após a inicialização completa.
- Erro ou fechamento inesperado de qualquer canal provoca encerramento local e tentativa de liberação remota da sessão, evitando `dataChannelsReady` permanecer verdadeiro após perda do transporte.
- Falha ao enviar o handshake ou ao inicializar os canais segue o mesmo caminho de teardown; Stop/Cancel limpam o timer.
- Adicionados dois testes determinísticos para timeout sem ACK e fechamento inesperado após ACK.
- Nenhum frame de controle foi enviado nesta versão; a interface xHome continua oculta e o recurso não está homologado em Xbox real.

# Histórico de alterações

## [4.12.64] — 2026-11-12
- Remote Play xHome agora cria os quatro data channels usados pelo protocolo observado no cliente de referência: `chat/chatV1`, `control/controlV1`, `input/1.0` e `message/messageV1`, todos ordenados.
- Implementado handshake `messageV1`; após `HandshakeAck`, o cliente envia a autorização `controlV1`, os eventos iniciais de registro do gamepad, metadados binários iniciais do canal `input` e seis mensagens de configuração de sessão.
- Os canais são fechados no Stop, Cancel e falha de inicialização. A flag `dataChannelsReady` só fica ativa após o bootstrap completo.
- Referência técnica: estruturas públicas de protocolo de [unknownskl/xbox-xcloud-player](https://github.com/unknownskl/xbox-xcloud-player), cujo `package.json` declara MIT. Não foi incorporado o cliente completo.
- **Limite explícito:** ainda não são enviados frames de gamepad, teclado, mouse ou toque. O bootstrap dos canais não comprova comandos jogáveis, mídia ou sessão Xbox real.
- Validação CI no commit `c61a13f5689429a00b00f775e7d26c24e07b7063`: baseline e regression workflows PASS; 118 testes, 115 PASS, 0 FAIL, 3 TODO; `node --check` e relatório estático concluídos.

# Histórico de alterações

## [4.12.63] — 2026-11-12
- Corrigido o acionamento repetido de Stop quando a liberação remota xHome está pendente: o estado de pendência, a mensagem de erro e o retry existente são preservados; nenhuma segunda requisição DELETE é emitida.
- Ampliada a suíte de `tests/xhome-discovery.test.cjs` com cenários HTTP 403/500, 404/410 idempotentes, falha de rede, Stop repetido e retry concorrente.
- A versão do cabeçalho, constante interna e parâmetro de cache do módulo Touch HUD foi alinhada em 4.12.63.
- README PT/EN, matriz de decisões e roadmap público foram sincronizados com a retomada técnica autorizada do xHome; a interface permanece oculta e o recurso continua sem homologação de vídeo/áudio/controles.
- **Validação desta execução:** inspeção estática dos trechos e dos testes adicionados. Execução Node/CI e teste em Xbox real ainda não confirmados; não declarar a matriz aprovada até obter resultados dos workflows.

## [Reformulação visual NX — etapas 1 e 2] — 2026-11-11
- Painel NX com tela inicial reorganizada em quatro categorias recolhíveis: Transmissão, Controles, Personalização e Avançado.
- Mantidas páginas existentes de streaming, região, áudio, voz, controles, sistema e indicadores detalhados.
- NX Stream Monitor opcional e independente do painel: FPS, RTT WebRTC, bitrate, perda, resolução, jitter e indicação de servidor.
- Monitor com orientação horizontal/vertical/compacta/automática, escala, cores de texto, transparência do fundo e posição por canto ou arrasto.
- Bandeiras para datacenters reconhecidos, sem inferir localização real apenas pela região selecionada.
- Reaproveitamento da coleta de estatísticas WebRTC e armazenamento local das preferências.
- Commits de implementação: `dcbab9667526ba8e9e7f7f4f64b9daad8a30e300` e `fe329eb454210c0180d1cb619ec4fea7450d5bd5`.
- **Validação:** presença das alterações confirmada no repositório. Testes reais de renderização, fullscreen, controle, Android/DeX e transmissão autenticada continuam pendentes.
- **Não implementado:** sondagem periódica comparativa de servidores alternativos; o histórico de RTT existente provém de datacenters utilizados anteriormente.


## [Documentação de funcionalidades — auditoria v4.12.16] — 2026-11-11
- Inventário de recursos implementados, experimentais e não comprovados publicado nos READMEs em português e inglês.
- Registrados recursos de streaming, rede, imagem, áudio, HUD, entradas, giroscópio, microfone, vibração, laboratório Xbox, telemetria e interface.
- Esclarecidos limites: ausência de upscaling real, geração de quadros, autenticação de console e acesso comprovado ao catálogo exclusivo.
- Distinção explícita entre código presente e testes reais de streaming; nenhum comportamento do userscript alterado nesta atualização documental.
- O histórico de versões 3.6.38–4.12.16 não foi reconstruído artificialmente; consultar commits e o código para mudanças específicas.


## [3.6.37] — 2026-11-10
- Versão atual identificada no cabeçalho e no código do userscript `NimboXcloud.user.js`.
- Documentação alinhada ao nome do arquivo principal, links de instalação e perfil padrão 1080p/Windows.
- Arquivo legado `xbox-cloud-unlock-ptbr.user.js` removido do repositório.
- O histórico detalhado das versões 3.6.7 a 3.6.37 não foi reconstruído sem evidências; consultar commits para mudanças intermediárias.
- Testes reais de streaming, controles e compatibilidade continuam pendentes.

## [3.6.6] — 2026-11-10
- Diagnóstico de Pointer Lock, foco, visibilidade, fullscreen, redimensionamento, touch, ponteiro, teclado e conexão de gamepad, ativo no catálogo e na partida.
- Eventos em buffer circular de até 100 entradas, sem registrar teclas digitadas ou coordenadas exatas (toques agrupados em zonas 4x4).
- Diagnóstico apenas de leitura; não altera o fluxo de entrada, sessão ou vídeo.
- Sintaxe JavaScript validada; testes reais ainda pendentes.


## [3.6.5] — 2026-11-10
- Diagnóstico da negociação de entrada na criação da sessão: apenas nomes de campos e valores de capacidade de toque/teclado/mouse, quando presentes.
- Nenhum corpo de requisição, token ou identificador novo é incluído no diagnóstico de entrada.
- Sem modificação de prioridades, controles virtuais ou perfil de vídeo; sintaxe JavaScript validada.
- Pendente validação real no Edge/Android.


## [3.6.4] — 2026-11-10
- Diagnóstico multimodal no relatório NX: touchscreen, tipo de ponteiro, hover e quantidade de gamepads.
- Somente leitura: sem mudanças em qualidade de vídeo, negociação de entrada ou comportamento do painel.
- Sintaxe validada; testes reais no Edge/Android e Windows touchscreen ainda pendentes.


## [3.6.3] — 2026-11-10
- Corrigido erro de sintaxe que impedia a execução integral do userscript: declaração `cardEl = mk(...)` estava acidentalmente comentada, deixando um array de estilos solto.
- Restaurada a criação do cartão do painel NX; sintaxe JavaScript validada estaticamente.
- Teste real no Edge/Android ainda pendente.


## [Documentação aberta e bilíngue] — 2026-11-10
- README em português e README_EN em inglês apresentam KReight como estudante autodidata de JavaScript.
- Projeto experimental, convite a contribuições, permissão para forks e condições da licença MIT esclarecidos.
- Identidade KReight uniformizada na documentação e no aviso de copyright próprio; avisos originais preservados.
- Nenhuma alteração de comportamento no userscript.

## [Identidade e atribuição] — 2026-11-10
- Assinatura `@author` atualizada para **KReight**, mantenedor do NimboXcloud.
- README atualizado com identidade independente e agradecimentos às referências.
- Licença MIT original de RoyLiu04 preservada junto à licença do projeto.
- Nenhuma alteração funcional no userscript; versão permanece 3.6.2.


Este arquivo registra as mudanças relevantes do Xbox Cloud Gaming Unlock (PT-BR). As versões anteriores à publicação no GitHub foram desenvolvidas fora deste repositório; o histórico abaixo não pretende reconstruir todos os commits anteriores.

## [3.6.2] — 2026-11-10
- NX flutuante permanece visível como fallback na biblioteca, mesmo quando o botão integrado ao cabeçalho é encontrado.
- Diálogos e sobreposições do xCloud não desativam a pílula nem recolhem à força o cartão expandido.
- Posicionamento de recuperação padronizado no canto superior direito.
- Primeira sincronização do painel ocorre imediatamente na inicialização, sem esperar o intervalo de 1,5 segundo.
- Erros da sincronização passam a ser registrados em `lastErr` para diagnóstico.
- Comparado com o arquivo v3.2.0 fornecido pelo autor; teste visual real no novo xCloud permanece pendente.

## [3.6.0] — 2026-11-10
- Botão **NX** na biblioteca, posicionado ao lado do perfil quando o cabeçalho é identificado.
- Botão **NX** no canto superior direito durante o streaming; painel expansível/recolhível.
- Configurações pré-jogo reutilizam os seletores existentes de qualidade, bitrate, servidor, IPv4 e região.
- Estatísticas WebRTC preservadas no painel in-game.
- Fallback: quando o botão de perfil não é encontrado, NX aparece no canto superior direito.
- **Pendente:** teste em navegador real, incluindo mudanças de rota e detecção de sessão.

## [3.5.0] — 2026-11-10
- Preservado o cabeçalho original `x-ms-device-info`, sem mascarar as capacidades de toque do dispositivo.
- Perfil padrão alterado de Tizen/HQ para Windows/1080p para reduzir conflitos com o controle virtual nativo; HQ/Tizen continua disponível como experimental.
- Painel reanexado ao DOM após substituição do corpo da página e monitorado durante inicialização/tela cheia.
- Sintaxe validada localmente com `node --check`; teste real de sessão, controle virtual e vídeo pendente.

## [3.4.0] — 2026-11-10
- Removida a interceptação de `Element.prototype.requestPointerLock` e o rastreamento próprio de eventos de ponteiro.
- Removido o controle manual “Toque 1º” do painel. A escolha do dispositivo ativo fica com o xCloud, sem prioridade artificial do userscript.
- Mantidos os perfis de vídeo independentes das entradas, com máxima qualidade (1080p HQ) como padrão.
- Corrigida a montagem do objeto `RTCSessionDescriptionInit` no ajuste experimental de bitrate SDP, preservando `type`.
- Corrigida a guarda contra inicialização duplicada do userscript.
- **Validação:** sintaxe JavaScript verificada com `node --check`. Testes reais de streaming e alternância de periféricos ainda pendentes.
- **Nota:** “1080p HQ” não é 1440p comprovado; resolução efetiva depende da negociação com o serviço.

## [3.3.1] — 2026-11-10
**Primeira versão publicada neste repositório.**
- Perfil de qualidade máxima (1080p HQ) selecionado como padrão, inclusive quando a preferência legada é `auto`.
- Perfis manuais 1080p HQ, 1080p e 720p.
- Opções de bitrate: automático, 5, 8, 10, 12 e 15 Mbps.
- Configuração de streaming independente do tamanho da janela, modo DeX e tela cheia, na lógica do script.
- Mantidos os recursos de seleção de região/data center, filtro de candidatos ICE IPv6, painel e estatísticas de conexão.

**Validação:** publicação do código e verificação estática anterior de sintaxe. Não há comprovação de teste ponta a ponta em Android/DeX, Windows ou sessão xCloud nesta versão. A qualidade final é negociada pelo serviço.

## Próximas versões
As alterações futuras devem incluir: versão, data, recursos adicionados, correções, incompatibilidades conhecidas e evidências de testes.
