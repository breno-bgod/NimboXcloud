# Proposta: dois motores no ambiente NimboXcloud

Estado: proposta em rascunho no PR #24, com contrato local testável; não é APK.
Decisão do mantenedor de 13/11/2026: nenhum fork separado é necessário.
Identidade Xbox é pesquisa secundária, nunca pré-requisito para o port.

## Fronteiras

O host APK futuro possui um painel Nimbo e dois adaptadores de motor: Nimbo
Cloud e PSBox. Uma sessão ativa por vez inicialmente. O userscript atual não
executa nativo e permanece preservado; não existe APK host integrado no código
oficial auditado. Não criar segundo painel PSBox nem chamar runApp() como se
fosse um serviço sem UI. Biblioteca/login/sessão do PSBox precisam de fachada
própria para o painel compartilhado, mantendo estado e armazenamento separados.

O contrato experimental está em
[engine-session-contract](../../experiments/console/engine-session-contract/README.md).
É API proposta do Nimbo, não endpoint Microsoft nem API existente de JNI.
Inclui capacidades explícitas, start/stop, estados/erros enumerados, geração de
entrada e neutralização antes da troca. A resolução de start não comprova mídia
ou autorização: o adaptador real terá de definir sua condição de prontidão.

## Comunicação segura

A Activity confiável controla ciclo de vida, superfície, foco e sessão. Não
expor uma ponte nativa genérica a páginas de login ou a qualquer origem WebView.
Navegação externa/login manual não deve receber interface nativa privilegiada.
Definir mensagens tipadas e permitidas, validar tamanho, tipo, faixa e geração
no consumidor; nunca aceitar nomes arbitrários de método, URL ou caminho vindos
da interface. Não transmitir tokens pelo painel, logs ou snapshots. Nenhuma
ponte JNI/WebView está implementada nesta revisão.

Em perda de foco/troca: neutralizar botões, eixos, teclas, mouse e toques do
motor anterior antes de encerrar. Stop só confirma após transporte, áudio,
decoder e workers cessarem; falha mantém propriedade e impede outro motor.
O protótipo bloqueia stop concorrente com start pendente; cancelamento durante
inicialização e núcleo travado precisam de implementação própria no adaptador.

## Mapeamento real upstream

Base PSBox: c775ecaddde52024d177cce7392aae13cc6917aa; sem novo commit desde a
auditoria anterior. README, GPL, mapa multiplataforma, CMake e headers foram
consultados no SHA remoto, sem presumir que o ZIP é o head.

- src/app/stream_player.h: StreamPlayer::start(std::string&), stop(), sendInput(),
  sendKbm(), setTouchEnabled(). Start é bloqueante: nunca na thread UI.
- src/app/app_core.h: coreStartup/coreFrame/coreShutdown e runApp; o app core
  contém UI própria. Seleção de fontes exige separar serviço de UI, não copiar
  silenciosamente a aplicação desktop inteira.
- android/app/src/main/cpp/CMakeLists.txt: só platform_android.cpp e
  hw_decoder_android.cpp; não liga núcleo de sessão.
- Árvore android/ remota: sem MainActivity, recursos ou wrapper Gradle.
- cmake/platform.cmake: Android cai no ramo linux/desktop; cmake/deps/ffmpeg.cmake
  cai em host. Corrigir toolchain/dependências antes de linkar no APK.
- MediaCodec preliminar não foi validado. Não converter presença de arquivo em
  capacidade anunciada; iniciar com backend cuja saída seja comprovada por build
  e teste, depois decidir hardware versus software com medição real.

Código PSBox GPL-3.0-or-later e avisos RafaelNGP devem ser preservados na
incorporação. Preparar manifesto de fontes selecionadas, SHA, patches locais,
licenças de dependências e fonte correspondente de cada APK distribuído.
Módulos separados não tornam o núcleo GPL automaticamente MIT. Nesta revisão
não houve importação de código upstream, dependência nova ou executável.

## Marcos e próximo incremento

1. Definir alvo ARM64 no mesmo repositório, dentro de experiments/console/,
   com Activity do host e biblioteca nativa; fixar SDK/NDK/CMake/Gradle e
   dependências oficiais após verificar compatibilidade. Não inventar versões
   como se já tivessem sido compiladas. Compilar na nuvem é aceitável.
2. Ligar o núcleo e backends Android, sem UI PSBox duplicada; validar criação,
   encerramento, rotação, foco e retorno. Não reutilizar arquivos host/PS5.
3. Login manual e biblioteca real; depois partida autorizada com vídeo, áudio
   e controle físico. Teclado/mouse e toque/HUD vêm em etapas posteriores.
4. Integrar componentes visuais Nimbo somente após contrato e lifecycle reais.

Build ARM64 ainda bloqueado neste executor: Java disponível; SDK/NDK, Gradle,
CMake e Clang ausentes. Tentativas anteriores de download ficaram bloqueadas
no executor; não repetir pedidos de autorização já concedidos. Próximo passo
é preparar CI de build após completar o alvo, não anunciar APK de um stub.

Validação desta proposta: 9 testes comportamentais locais aprovados do contrato,
com adaptadores sintéticos, sem login, JNI, compilação Android ou gameplay.
Aparelho alvo informado: Galaxy S23 SM-S911B, Android 17/One UI 9.0; não homologado.

Fontes fixadas: [mapa multiplataforma](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/c775ecaddde52024d177cce7392aae13cc6917aa/docs/multiplatform.md),
[StreamPlayer](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/c775ecaddde52024d177cce7392aae13cc6917aa/src/app/stream_player.h),
[Android](https://github.com/RafaelNGP/psbox-cloud-gaming/tree/c775ecaddde52024d177cce7392aae13cc6917aa/android),
[licença](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/c775ecaddde52024d177cce7392aae13cc6917aa/LICENSE).


## Incremento proposto: biblioteca de plataforma Java/JNI

Após o link ARM64 da camada de plataforma aprovado no CI #43492918003,
a próxima revisão acrescenta fachada Java/JNI com initialize(Context),
isReady e shutdown, sem Activity/painel independente. Configuração usa
filesDir/psbox sem setenv; mutex nativo controla repetição e concorrência.
AAR experimental inclui Java compilado com SDK35/release17 e JNI ARM64/API26,
sem motor completo ou fluxo autenticado. Seu build será confirmado em CI;
não equivale a instalação nem ao marco completo de lifecycle do aplicativo.
O host Activity e o adaptador de sessão precisam encerrar mídia/entrada/workers
antes de confirmar parada; shutdown de plataforma isolado não satisfaz isso.
