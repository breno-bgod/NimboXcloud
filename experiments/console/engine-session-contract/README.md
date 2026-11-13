# Contrato experimental entre motores

Estado: **simulação aprovada**, sem integração Android. Proposta no PR #24;
nenhum import pelo userscript, requisição, login, credencial ou partida.

## Hipótese e critério de falha

Um proprietário único pode coordenar Nimbo Cloud e o futuro adaptador PSBox,
rejeitando início concorrente e entradas antigas. Antes da troca, deve invalidar
a geração anterior, neutralizar entradas e aguardar encerramento confirmado.
Falha: iniciar segundo motor antes do stop, aceitar entrada antiga ou liberar
propriedade após rejeição de stop. Os adaptadores dos testes são doubles locais,
sem representar protocolo, autenticação, entitlement ou streaming.

## API proposta do Nimbo, não API upstream

`SessionOwner` recebe somente os adaptadores `nimbo-cloud` e `psbox`, definidos
pelo host confiável. Cada um implementa `start()`, `neutralizeInput()`, `stop()`
e declara capacidades booleanas `controller`, `keyboardMouse`, `touch`.
Ausência significa indisponível. Capacidade declarada não é homologação.

- `start(engine)` retorna geração somente após resolução do adaptador.
- `stop()` invalida geração e aguarda liberação de transporte/recursos.
- `acceptsInput(engine, generation)` permite descartar eventos antigos; não
  transmite nem valida payload de entrada. A checagem deverá ocorrer novamente
  no consumidor nativo, não apenas antes de enfileirar.
- `snapshot()` expõe apenas estado, motor, geração e erro enumerado. Não exporta
  mensagens brutas de backend. Estados: idle, starting, running, stopping, failed.
- Stop rejeitado mantém propriedade, bloqueia outro start e permite retry.
  Neutralização rejeitada ainda tenta stop; só libera propriedade se stop
  confirmar encerramento, reportando INPUT_RELEASE_FAILED.

`start`/`stop` precisam ter semântica forte nos adaptadores reais. Resolução não
significa jogo autorizado ou mídia validada. Operação pendente bloqueia troca;
cancelamento durante start e recuperação de backend travado são lacunas explícitas.
Não se usa timeout para fingir que um núcleo nativo encerrou.

## Origem e vínculo com PSBox

Referência: RafaelNGP/psbox-cloud-gaming, SHA
`c775ecaddde52024d177cce7392aae13cc6917aa` (13/11/2026, 17:14:27 UTC).
Código deste experimento é novo; nenhum fonte PSBox foi incorporado.

- `src/app/stream_player.h`: `xc::app::StreamPlayer::start(std::string&)`,
  `stop()`, `sendInput`, `sendKbm`, `setTouchEnabled`. Start é bloqueante:
  precisa de worker no APK. Não chamar diretamente pela thread da interface.
- `src/app/app_core.h`: `coreStartup`, `coreFrame`, `coreShutdown`, `runApp`.
  Reutilizar `runApp()` sem adaptação também executaria a UI PSBox. Isso não
  atende ao painel único; a integração requer separar serviços do app core.
- `docs/multiplatform.md`: backends escolhidos no link; SDL desktop não implica
  port Android. Não há correspondência JNI implementada neste experimento.

Fontes GPL-3.0-or-later com copyright RafaelNGP nos headers examinados; LICENSE
upstream GPL v3. Incorporação futura deve preservar avisos e fontes correspondentes;
separação de módulos não elimina obrigações GPL. Ver proposta de integração.

## Reprodução

```sh
node --test --test-isolation=none experiments/console/engine-session-contract/session-owner.test.mjs
```

Resultado: **9/9 testes locais**. Sem SDK/NDK/Gradle, compilação ARM64, APK,
instalação ou sessão real nesta revisão. Nenhum ganho de latência alegado.
Próximo marco: alvo nativo Android com dependências cross compiladas e Activity
do host, sem reutilizar executável PS5/Linux nem abrir outro painel.
