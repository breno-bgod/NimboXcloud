# NimboXcloud — Plano mestre de desenvolvimento

**Edição:** PM-030 · **Data:** 2026-11-11 · **Status:** P00 em andamento; runtime v4.11.18; P02 HUD prioritário

## Regras permanentes

- Este arquivo é a fonte de verdade para IDs, escopo e critérios de aceite. Nunca renumerar ou excluir tarefas: marcar como cancelada, substituída ou concluída com justificativa.
- Estados: `PENDENTE`, `EM_ANDAMENTO`, `IMPLEMENTADO`, `TESTADO`, `VALIDADO`, `BLOQUEADO`, `CANCELADO`. `VALIDADO` requer teste real no ambiente alvo.
- Um pacote reúne de 4 a 10 tarefas relacionadas, quando tecnicamente viável; após cada pacote **é obrigatório** um pacote de auditoria, testes e correções antes de iniciar o próximo.
- Falhas descobertas viram subtarefas `ID.F01`, `ID.F02`, etc.; não alteram o ID original. Toda alteração exige commit, evidências e rollback possível.
- Não declarar compatibilidade com xCloud apenas por passar em teste de sintaxe. Testes reais que exigem conta/sessão precisam de ambiente autorizado.
- Diagnósticos devem ser passivos por padrão. Testes que alteram servidor, bitrate, fullscreen, Pointer Lock, controles ou idioma só podem rodar em ambiente de teste e com confirmação explícita; restaurar estado após execução.
- Respeitar licenças e atribuições. XFly e Xperience: MIT nos arquivos recebidos. XStreaming: AGPL-3.0 no repositório; estudar conceitos antes de considerar qualquer cópia de código.

## Referências examinadas

- `XFly-main.zip`: `src/engine/gamepad-gate.ts`, `rtc.ts`, `upscale.ts`, `src/renderer/src/components/StreamHud.tsx` (Electron/Windows).
- `x-os.org-main.zip` (Xperience XCloud): `src/modules/mkb/pointer-client.ts`, `src/modules/touch-controller.ts`, `src/modules/patcher/patches/src/poll-gamepad.ts`, `stream-hud.ts`, `src/modules/player/`, `src/modules/remote-play-manager.ts`, `src/utils/stream-stats-collector.ts` (userscript/TypeScript).
- `Geocld/XStreaming`: README, `package.json`, documentação de autenticação/API/streaming (React Native/WebView; recursos nativos e licença AGPL-3.0).
- `breno-bgod/NimboXcloud`: userscript atual; versão observada 4.11.2. **Implementação existente não equivale a funcionamento validado.**

## Ciclo de trabalho

**P00** Auditoria de base e inventário → **A00** auditoria/correção → **P01** entradas e Pointer Lock → **A01** auditoria/correção → **P02** HUD real → **A02** auditoria/correção → **P03** streaming → **A03** auditoria/correção → **P04** vídeo e áudio → **A04** auditoria/correção → **P05** diagnóstico e autotestes → **A05** auditoria/correção → **P06** acessibilidade e expansão → **A06** auditoria/correção → **P07** estabilidade, documentação e release → **A07** auditoria final.

### P00 — Inventário e segurança de mudanças (prioridade crítica)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| CORE-001 | Inventariar módulos, hooks, eventos, timers e armazenamento do script atual | NimboXcloud | mapa de dependências com donos e conflitos | EM_ANDAMENTO |
| CORE-002 | Identificar quais mudanças noturnas alteraram comportamento real versus somente diagnóstico | commits GitHub | matriz por commit com impacto e rollback | EM_ANDAMENTO |
| CORE-003 | Registrar baseline de reprodução de erros de mouse, Pointer Lock e touchscreen | relatos + navegador | cenários reproduzíveis documentados | IMPLEMENTADO |
| CORE-004 | Criar suite de lint, parse e smoke tests sem conta | Xperience/build | comandos reproduzíveis com saída e falha CI | EM_ANDAMENTO (parse verificado; lint/CI pendentes) |
| CORE-005 | Criar configuração de feature flags e rollback de módulos experimentais | NimboXcloud | desligar recursos sem reinstalar script | EM_ANDAMENTO (opt-out Pointer Lock implementado) |
| CORE-006 | Verificar licença, atribuição e proveniência de cada módulo adaptado | MIT/AGPL | inventário de proveniência revisado | EM_ANDAMENTO (matriz inicial publicada) |

### P01 — Entrada: mouse, teclado, gamepad e Pointer Lock (prioridade crítica)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| INPUT-001 | Definir único coordenador de entradas e prioridade entre fontes | Xperience poll-gamepad / XFly gamepad-gate | nenhum hook concorrente ou duplo disparo | PENDENTE |
| INPUT-002 | Mapear ciclo Pointer Lock: solicitação, concessão, perda, foco e saída | Xperience pointer-client | transições testadas sem captura permanente | PENDENTE |
| INPUT-003 | Corrigir mouse relativo, escala, sensibilidade e limites de movimento | Xperience pointer-client | movimentos previsíveis em FPS | PENDENTE |
| INPUT-004 | Eliminar duplicação touch → mouse sintético e conflitos com controle físico | Xperience touch-controller | multitouch e controle simultâneos sem travamento | PENDENTE |
| INPUT-005 | Auditar teclado virtual, mapeamento e atalhos | Xperience mkb | sem digitação fantasma ou bloqueio de UI | PENDENTE |
| INPUT-006 | Auditar conexão/desconexão e polling de gamepads | XFly/Xperience | reconexão segura sem perder entrada | PENDENTE |
| INPUT-007 | Testar Android Chrome, desktop Chrome e Edge com matriz de jogos | execução real | evidências por navegador/dispositivo | PENDENTE |

### P02 — HUD real e perfis (prioridade alta; bloquear alterações prematuras)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| HUD-001 | Inventariar editor de prévia, perfis, backups e diagnósticos já existentes | NimboXcloud | diferenciar prévia de controles reais | PENDENTE |
| HUD-002 | Identificar estrutura e ciclo de vida dos controles reais sem modificar DOM | Xperience stream-hud/touch-controller | candidatos verificados em sessão real | PENDENTE |
| HUD-003 | Definir estratégia de integração sem sequestrar eventos de gameplay | Xperience | prova de conceito reversível | PENDENTE |
| HUD-004 | Aplicar posições do editor aos controles reais com isolamento | NimboXcloud/Xperience | botões continuam funcionais após arrasto | PENDENTE |
| HUD-005 | Suportar escala, safe areas, orientação e resolução | Xperience | layouts estáveis em formatos diferentes | PENDENTE |
| HUD-006 | Migrar e validar perfis antigos e restaurar padrão | NimboXcloud | sem perda de dados em upgrade/rollback | PENDENTE |
| HUD-007 | Testar multitouch, drag, gameplay e perfis por jogo | execução real | testes reais sem conflito de inputs | PENDENTE |

### P03 — Sessão, região, servidor e bitrate (prioridade alta)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| NET-001 | Auditar interceptação fetch/XHR e compatibilidade com novo xCloud | NimboXcloud/Xperience | sem corromper autenticação ou payload | PENDENTE |
| NET-002 | Validar descoberta e seleção de regiões/data centers | XFly/Xperience | fallback seguro e sem falsos resultados | PENDENTE |
| NET-003 | Auditar bitrate, resolução e negociação WebRTC/SDP | XFly rtc / XStreaming docs | limites respeitados e recuperação automática | PENDENTE |
| NET-004 | Auditar IPv4/IPv6 e ICE sem quebrar conectividade | XFly rtc | sessão estável com e sem override | PENDENTE |
| NET-005 | Criar diagnóstico de sessão, rede, perda, RTT e jitter | Xperience stats | relatório confiável com métricas disponíveis | PENDENTE |
| NET-006 | Testar reconexão, mudança de rede e interrupções | execução real | recuperação documentada | PENDENTE |

### P04 — Imagem, áudio e interface (prioridade média)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| MEDIA-001 | Inventariar renderização atual e filtros existentes | XFly upscale / Xperience player | matriz de custo e compatibilidade | PENDENTE |
| MEDIA-002 | Avaliar WebGL2/WebGPU, CAS/FSR1 sem duplicar filtros | Xperience/XStreaming | testes A/B de qualidade e latência | PENDENTE |
| MEDIA-003 | Avaliar fullscreen, janela, minimização e foco por plataforma | XFly/Xperience | sem quebrar input/Pointer Lock | PENDENTE |
| MEDIA-004 | Auditar áudio, volume, mute e microfone | Xperience shortcuts | permissões e estados consistentes | PENDENTE |
| MEDIA-005 | Testar consumo de CPU/GPU, memória e bateria | execução real | métricas por dispositivo | PENDENTE |
| MEDIA-006 | Documentar inviabilidade de LSFG/DLL nativa em userscript puro | XStreaming | decisão técnica explícita | PENDENTE |

### P05 — Diagnóstico completo e testes dentro do aplicativo (prioridade alta)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| DIAG-001 | Criar registro central de módulos, capacidades e health checks | NimboXcloud | cada módulo expõe estado e diagnóstico | PENDENTE |
| DIAG-002 | Criar testes passivos de presença e integridade de hooks e configurações | Xperience stats | sem alterar partida nem capturar dados privados | PENDENTE |
| DIAG-003 | Criar autotestes isolados de teclado, mouse, Pointer Lock e touch | INPUT | simulação e eventos reais claramente distinguidos | PENDENTE |
| DIAG-004 | Criar autotestes de gamepad, giroscópio e vibração | INPUT/GYRO | testes condicionados a hardware/permissão | PENDENTE |
| DIAG-005 | Criar testes controlados de bitrate, servidor, idioma e resolução | NET/MEDIA | consentimento, timeout, restauração e rollback | PENDENTE |
| DIAG-006 | Criar testes de painéis, fullscreen, foco e modo janela | MEDIA | sem deixar UI em estado alterado | PENDENTE |
| DIAG-007 | Criar relatório estruturado JSON + resumo legível | NimboXcloud | status, evidências, erros e limitações por teste | PENDENTE |
| DIAG-008 | Remover tokens, IDs pessoais, cookies e dados de conta do relatório | privacidade | teste automático de redaction | PENDENTE |
| DIAG-009 | Criar matriz de cobertura e indicador NÃO TESTADO | todos | jamais confundir 'não testado' com 'aprovado' | PENDENTE |
| DIAG-010 | Permitir execução em lote com abortar, progresso e relatório final | todos | execução segura, repetível e cancelável | PENDENTE |

### P06 — Acessibilidade e funcionalidades opcionais (prioridade média/baixa)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| ACC-001 | Reavaliar giroscópio e integração com gamepad sem hooks concorrentes | projetos gyro + INPUT | calibrado e testado em Android | PENDENTE |
| ACC-002 | Mapear HUD adaptativo para uso com uma mão e remapeamento | Xperience | configuração reversível e funcional | PENDENTE |
| ACC-003 | Avaliar Remote Play separado de Cloud Play | Xperience/XStreaming | viabilidade e autenticação documentadas | PENDENTE |
| ACC-004 | Avaliar vibração/haptics e controles OTG/Bluetooth | XStreaming/XFly | detecção e fallback por plataforma | PENDENTE |
| ACC-005 | Auditar ideias de Rewards e conquistas sem presumir APIs disponíveis | XStreaming achievements | fonte, autorização e escopo comprovados | PENDENTE |
| ACC-006 | Avaliar localização/idiomas e acessibilidade do painel | Xperience | troca de idioma sem quebrar layout | PENDENTE |

### P07 — Estabilização e lançamento (prioridade final)

| ID | Tarefa | Referência | Critério de aceite | Estado |
|---|---|---|---|---|
| REL-001 | Rodar lint, parse, testes unitários e integração em CI | projeto | pipeline reproduzível e verde | PENDENTE |
| REL-002 | Testar matriz Android/desktop, controles e navegadores | execução real | evidências e falhas registradas | PENDENTE |
| REL-003 | Fazer auditoria de segurança, privacidade e licenças | projeto/referências | achados críticos resolvidos | PENDENTE |
| REL-004 | Medir desempenho e vazamento de eventos/timers/DOM | projeto | sem regressões críticas | PENDENTE |
| REL-005 | Revisar documentação, changelog, instalação e rollback | projeto | documentação correspondente ao release | PENDENTE |
| REL-006 | Gerar relatório de aceitação e publicar release estável | todos | critérios principais validados em sessão real | PENDENTE |

## Auditorias obrigatórias após cada pacote

| ID | Auditoria | Estado |
|---|---|---|
| AUD-00 | Revisar P00: baseline, conflitos, testes e rollback | PENDENTE |
| AUD-01 | Revisar P01: Pointer Lock, teclado/mouse, touch e gamepad | PENDENTE |
| AUD-02 | Revisar P02: HUD real, perfis e regressões de toque | PENDENTE |
| AUD-03 | Revisar P03: negociação, regiões, rede e estabilidade | PENDENTE |
| AUD-04 | Revisar P04: vídeo, áudio, foco e desempenho | PENDENTE |
| AUD-05 | Revisar P05: segurança dos autotestes e relatórios | PENDENTE |
| AUD-06 | Revisar P06: acessibilidade e recursos opcionais | PENDENTE |
| AUD-07 | Auditoria geral final e regressão cruzada | PENDENTE |

## Critérios de pacote e relatório

Cada pacote deverá registrar: IDs incluídos, commits, origem da solução, alterações de comportamento, testes automatizados, testes reais (ou 'NÃO EXECUTADO'), falhas, subtarefas Fxx, regressões, rollback, próximo pacote. A auditoria seguinte é bloqueante se houver regressão crítica.

**Estado inicial:** todas as tarefas acima estão `PENDENTE` até auditoria individual; recursos que já existem no script serão reclassificados após verificação, não presumidos como validados. Nenhuma tarefa antiga será marcada como concluída apenas com base no histórico de respostas.

## Registro de execução P00 — rodada 1 (2026-11-11)

- Baseline confirmado: `NimboXcloud.user.js` v4.11.2, 4.520 linhas; inventário inicial de 117 ocorrências de APIs/hooks selecionados, 10 chamadas de temporizadores, 194 referências a armazenamento, 122 referências a funções HUD (contagens lexicais, não quantidade de módulos).
- **Achado crítico CORE-001.F01:** apesar do comentário de preservação de Pointer Lock, a implementação substitui `Element.prototype.requestPointerLock` (aproximadamente linha 1059) e rejeita solicitações quando `f9Released` está ativo. Pode interferir na recaptura nativa após perda de foco/ESC; ainda não reproduzido em sessão real. Requer auditoria de INPUT-002 e correção segura antes de declarar estabilidade.
- Histórico recente: v4.10.3–v4.10.8 concentram correções de persistência de HUD; v4.10.9–v4.11.2 são diagnóstico de HUD. Não há evidência de integração do editor com os controles reais.
- Referências: XFly (Electron), Xperience XCloud (userscript) e XStreaming (React Native, AGPL-3.0). Não copiar código AGPL sem revisão de compatibilidade.
- **P00 ainda não concluído.** CORE-003 a CORE-006 e AUD-00 aguardam implementação/verificação; testes reais no navegador não executados.


## P00 — pacote 1 de implementação (2026-11-11)
- `tests/baseline.test.cjs`: cinco testes de parse, metadados, versão e detecção do risco conhecido de Pointer Lock.
- `.github/workflows/baseline.yml`: execução automática de smoke tests em push/PR.
- `docs/P00_BASELINE.md`: cenários de reprodução e riscos CORE-001.F01/F02/F03.
- **Verificação ainda pendente:** execução efetiva do workflow no GitHub e testes reais no navegador; nenhum deles é presumido aprovado.
- CORE-004 permanece parcialmente atendido até adicionar lint e verificar CI; `IMPLEMENTADO` indica artefatos criados, não validação.


## AUD-00 — verificação parcial P00.1 (2026-11-11)
- Verificação estática direta no código obtido da branch main: **6/6 verificações PASS** (parse do userscript, @match, @run-at, consistência de versão, presença da interceptação Pointer Lock, parse do teste). Isso **não é** execução do workflow Node no GitHub.
- `tests/baseline.test.cjs` atualizado para não confundir detecção da interceptação com teste de funcionamento; três testes de navegador/xCloud marcados explicitamente como TODO.
- GitHub Actions: consulta de execuções associadas ao commit anterior não retornou execuções; status do workflow **não confirmado**.
- **AUD-00 não concluída**; CORE-004 continua em andamento, aguardando lint, execução do CI e cenários reais. Runtime preservado.


## P00 — pacote 2 e verificação documental (2026-11-11)
- `docs/P00_MODULE_INVENTORY.md`: inventário estático de Pointer Lock, gamepad, touch, rede, armazenamento, HUD e diagnóstico. CORE-001 **EM_ANDAMENTO**, pois faltam donos, teardown e testes reais.
- `docs/P00_CHANGE_HISTORY.md`: histórico de commits v4.6.0–v4.11.2 classificado. CORE-002 **EM_ANDAMENTO**; diffs ainda pendentes.
- `docs/P00_PROVENANCE.md`: matriz preliminar MIT/AGPL. CORE-006 **EM_ANDAMENTO**; licenças por arquivo ainda pendentes.
- Auditoria documental: os três arquivos foram publicados; não houve mudança de runtime. CI e testes reais permanecem sem validação.
- A próxima rodada deve aprofundar CORE-001/002/006 e CORE-005; somente depois fechar AUD-00.


## P00 — automação de auditoria estática (2026-11-11)
- `tools/static-risk-report.cjs` identifica pontos de interceptação global e produz JSON sem credenciais; detecta riscos, não comprova falhas de execução.
- `tests/static-risk.test.cjs` valida formato e localização das ocorrências; workflow passa a executar `node --check`, testes Node e relatório, com permissões de leitura.
- Verificação estática independente encontrou substituições de `Element.prototype.requestPointerLock` (linha 1059), `XMLHttpRequest.prototype.send` (1141) e `window.fetch` (693) no baseline v4.11.2. As referências de linha podem mudar.
- Corrigido falso positivo de igualdade `===` e linhas de comentário no detector.
- **Estado:** implementado e revisado estaticamente; execução efetiva do Node/GitHub Actions e testes em sessão xCloud ainda não confirmados. AUD-00 permanece aberta.


## AUD-00 — correção de cobertura CI (2026-11-11)
- Detectado que `.github/workflows/baseline.yml` rodava somente `tests/baseline.test.cjs`, deixando `tests/static-risk.test.cjs` sem execução no CI.
- Corrigido para `node --test tests/*.test.cjs` (commit `0ce903468c817b8fddb5b2884fd05141a59f43f7`).
- **Validação limitada:** revisão do conteúdo do workflow. Execução real do GitHub Actions ainda não confirmada; CORE-004 e AUD-00 permanecem em andamento.
- Não houve alteração no userscript v4.11.2. Tentativa de clone externo no ambiente de teste falhou por ausência de resolução DNS; não equivale a falha do repositório.


## P00 — atualização de segurança Pointer Lock (2026-11-11)
- v4.11.3: flag `nx.pointerLockLegacyF9`, valor `'0'` desativa o override de `Element.prototype.requestPointerLock` e o interceptador F9 **após recarregar**. Ausência da chave preserva comportamento legado.
- Commits `2f5be9de`, `ebd5cf24`, `f76d4cd7`: implementação, correção da tecla F9, teste de regressão estático.
- Sintaxe do userscript e do teste verificada estaticamente. **Não foi executado teste real no xCloud**, nem confirmado GitHub Actions.
- **Risco conhecido:** outros caminhos do script ainda podem alterar o ciclo de captura; esta flag não comprova correção do mouse. CORE-005 permanece parcial e AUD-00 aberta.
- Rollback operacional sem reinstalar: `localStorage.setItem('nx.pointerLockLegacyF9', '0'); location.reload()` no contexto da página, somente para teste consciente. Para restaurar: `localStorage.removeItem('nx.pointerLockLegacyF9'); location.reload()`.


## P00 — testes de comportamento isolado da flag (2026-11-11)
- Commit `9a7374aa`: `tests/pointer-lock-flag.test.cjs` testa cinco cenários em contexto VM isolado, sem credenciais, rede ou xCloud.
- Sintaxe do teste verificada na criação. **Execução Node e GitHub Actions não confirmadas**; testes reais do navegador seguem pendentes.
- CORE-005 segue EM_ANDAMENTO: flag do Pointer Lock implementada, mas outras funcionalidades experimentais ainda não possuem rollback uniforme.
- **Próximas ações:** confirmar CI, mapear e corrigir demais flags, revisar conflitos de entrada, completar AUD-00 antes de P01.


## P00 — dois pacotes sequenciais e auditoria (2026-11-11)
**Pacote P00.5 — histórico e rollback:**
- `docs/P00_DIFF_AUDIT.md`, commit `bf157b41`: comparações reais de 3 intervalos, 19 commits no intervalo HUD, fronteiras de rollback documentadas. CORE-002 continua EM_ANDAMENTO (falta revisão de patch por função).

**Pacote AUD-00.5 — teste de comportamento isolado:**
- `tests/pointer-lock-policy.test.cjs`, commit `8532c009`: simula o ciclo lock → unlock → relock com DOM mock; cobre modo legado, opt-out e evento F9 não consumido.
- A sintaxe do novo teste foi verificada na criação. Execução real em Node/CI **não confirmada**. Mock não substitui navegador nem xCloud.
- P00 e AUD-00 **não encerrados**: faltam lint/CI confirmado, inventário completo de hooks, flags gerais, proveniência por arquivo e validação em sessão real.


## P00.6 / AUD-00.6 — correção de diagnóstico e mapa de ciclo de vida (2026-11-11)
- Commit `06e0760d`: v4.11.4 corrige o motivo exibido no diagnóstico de Pointer Lock quando o modo F9 legado está desativado. Nenhuma alteração de comportamento padrão.
- Commit `957dbc53`: teste de regressão em DOM mock para o diagnóstico de liberação nativa; sintaxe verificada, execução Node/CI ainda não confirmada.
- Commit `83e945b6`: `docs/P00_HOOK_LIFECYCLE.md` mapeia 3 interceptores diretos, 80 inscrições de eventos, 7 intervalos, 3 timeouts e 22 escritas em localStorage. Análise lexical, não prova de funcionamento.
- **P00 pendente:** CORE-001 (teardown e dependências), CORE-002 (diff por função), CORE-004 (execução CI/lint), CORE-005 (flags gerais), CORE-006 (licença por arquivo); AUD-00 exige validação e correção.
- **P01–P07 pendentes:** INPUT-001..007, HUD-001..007, NET-001..006, MEDIA-001..006, DIAG-001..010, ACC-001..006, REL-001..006, e AUD-01..07. Nenhum destes foi marcado concluído.


## AUD-00.7 — segurança da ponte de gamepad (2026-11-11)
- Commit `9d6ad2a1`: suíte `tests/gamepad-bridge.test.cjs` com cenários de ponte desativada, restauração nativa e wrapper concorrente.
- Verificação adicional: três cenários equivalentes foram executados em sandbox JavaScript isolado contra o trecho da v4.11.4: **3/3 passaram**. Não foi execução Node nem teste real no xCloud.
- Commit `648acfc6`: `docs/P00_GAMEPAD_BRIDGE_AUDIT.md` com mapa de ownership, rollback e riscos.
- Runtime mantido em v4.11.4. **P00/AUD-00 abertos.** Pendências principais: execução CI, auditoria de teardown e efeitos colaterais do status da Gamepad API, flags e licenças por arquivo, testes reais.


## AUD-00.8 — status de Gamepad API sem efeitos colaterais (2026-11-11)
- `ffd7afb8`: runtime v4.11.5; `nxInputBridgeStatus()` deixa de gravar preferências ao observar substituição externa da Gamepad API.
- `570f58a3`: regressão estática/dinâmica isolada adicionada à suíte de gamepad.
- Verificação isolada adicional em sandbox JavaScript: modo desativado e modo ativo com wrapper externo; **2/2 cenários preservaram preferências e API de terceiros**. Não houve teste em navegador ou sessão xCloud.
- **Pendências P00:** CORE-001 inventário completo/teardown; CORE-002 diff por função; CORE-004 CI/lint; CORE-005 flags/rollback geral; CORE-006 licenças por arquivo; AUD-00 validação.
- **Próximos pacotes pendentes:** P01 INPUT-001..007/AUD-01; P02 HUD-001..007/AUD-02; P03 NET-001..006/AUD-03; P04 MEDIA-001..006/AUD-04; P05 DIAG-001..010/AUD-05; P06 ACC-001..006/AUD-06; P07 REL-001..006/AUD-07.


## AUD-00.9 — simplificação da restauração da Gamepad API (2026-11-11)
- `78827f2d`: v4.11.6 remove condição de ownership duplicada e inalcançável em `nxRestoreNativeGamepads`, preservando guarda anterior que não sobrescreve wrappers de terceiros.
- `4a43cd0b`: testes para restauração repetida e ponte desativada com API já pertencente a terceiro.
- Sintaxe do userscript e da suíte verificadas; execução Node, CI e navegador real ainda não confirmadas.
- **P00 aberto:** CORE-001, CORE-002, CORE-004, CORE-005, CORE-006 e AUD-00. **P01–P07 pendentes:** INPUT-001..007, HUD-001..007, NET-001..006, MEDIA-001..006, DIAG-001..010, ACC-001..006, REL-001..006, AUD-01..07.


## AUD-00.10 — proteção de API e estado real de validação (2026-11-11)
- `b70d051a`: testes para Gamepad API não configurável e controles com mapeamento não padrão. Ambos os cenários passaram em sandbox JS isolado; a suíte Node completa ainda não foi executada.
- `65aa2e8d`: `docs/P00_VALIDATION_STATUS.md` explicita verificações feitas e não confirmadas.
- **CORE-004 continua EM_ANDAMENTO:** execução real de `node --test` e GitHub Actions não confirmada.
- **P00 restante:** CORE-001 (teardown), CORE-002 (diff por função), CORE-004 (CI), CORE-005 (flags gerais), CORE-006 (licenças), AUD-00.
- **P01–P07 restante:** INPUT-001..007/AUD-01; HUD-001..007/AUD-02; NET-001..006/AUD-03; MEDIA-001..006/AUD-04; DIAG-001..010/AUD-05; ACC-001..006/AUD-06; REL-001..006/AUD-07.


## P01 — lote concentrado 1/2 (2026-11-11)
- `741d15a0`: v4.11.7, observadores globais de entrada idempotentes.
- `e8b0c4a1`: v4.11.8, observação de mouse relativo sem injeção e sem registrar coordenadas.
- `a2d24e10`: testes `tests/input-p01.test.cjs` para idempotência, mouse relativo, ponte opt-in e privacidade.
- `ba78ff8d`: `docs/P01_INPUT_AUDIT.md` registra evidências e pendências de INPUT-001..007/AUD-01.
- **P01 ainda não concluído:** coordenador não invasivo não equivale a roteamento de entradas; mouse virtual/teclado virtual jogáveis e testes reais não demonstrados. AUD-01 permanece ABERTA.
- **P00 restante:** CORE-001, CORE-002, CORE-004, CORE-005, CORE-006, AUD-00.
- **P01 restante:** INPUT-001..007 (aceite funcional), AUD-01.
- **P02–P07 restantes:** HUD-001..007/AUD-02; NET-001..006/AUD-03; MEDIA-001..006/AUD-04; DIAG-001..010/AUD-05; ACC-001..006/AUD-06; REL-001..006/AUD-07.


## P01 — lote concentrado 2/2 (2026-11-11)
- `954962c6`: v4.11.9 corrige falsos conflitos teclado/touch/mouse e timestamp inicial.
- `7b027c95`: regressão da classificação de entradas simultâneas.
- `e38c11ad`: v4.11.10 rejeita campos ausentes de movimento relativo.
- `ed9618e9`: regressão para evento de mouse incompleto.
- `9f10bc9d`: auditoria P01 atualizada com evidências, limites e bloqueios.
- Verificação JS isolada: **PASSOU**. Tentativa de checkout remoto falhou por DNS; suíte Node/CI e gameplay não verificados.
- **P01 após dois lotes:** INPUT-001..006 PARCIAIS, INPUT-007 NÃO TESTADO, AUD-01 ABERTA. Não marcar concluído antes de provar teclado/mouse virtual jogável, arbitragem ativa segura e testes reais.
- **Demais pendências:** P00 CORE-001/002/004/005/006/AUD-00; P02 HUD-001..007/AUD-02; P03 NET-001..006/AUD-03; P04 MEDIA-001..006/AUD-04; P05 DIAG-001..010/AUD-05; P06 ACC-001..006/AUD-06; P07 REL-001..006/AUD-07.


## P02 — primeiro lote de HUD (2026-11-11)
- `06a25930`: v4.11.11 corrige retry de autoload após falha de perfil.
- `e046a3ce`: v4.11.12 rejeita chaves inseguras em backups de HUD.
- `8fc25ea0`: testes `tests/hud-p02.test.cjs` (retry, importação e descoberta passiva).
- `8416aea6`: auditoria `docs/P02_HUD_AUDIT.md` com limites e critérios de aceite.
- **P02 restante:** HUD-001/002/005/006 PARCIAIS; HUD-003/004 PENDENTES; HUD-007 NÃO TESTADO; AUD-02 ABERTA.
- **P01 restante:** INPUT-001..006 PARCIAIS, INPUT-007 NÃO TESTADO, AUD-01 ABERTA.
- **P00 restante:** CORE-001/002/004/005/006/AUD-00.
- **P03–P07 restante:** NET-001..006/AUD-03; MEDIA-001..006/AUD-04; DIAG-001..010/AUD-05; ACC-001..006/AUD-06; REL-001..006/AUD-07.


## P01 — separar código de testes reais (2026-11-11)
- **Implementação pendente (não pode ser adiada como 'teste real'):** INPUT-001 arbitragem/roteamento ativo seguro; INPUT-003 ajuste efetivo de sensibilidade quando aplicável ao modo de entrada; INPUT-005 integração funcional de teclado virtual; INPUT-004 integração real touch/controle quando código próprio for necessário; INPUT-002/006 corrigir defeitos encontrados na revisão estática.
- **Validação real posterior:** INPUT-002 ESC/F9/Pointer Lock/foco; INPUT-003 resposta no jogo; INPUT-004 multitouch/controle; INPUT-005 teclado virtual no xCloud; INPUT-006 hotplug/reconexão; INPUT-007 matriz Chrome/Edge Android/desktop.
- `eb313961`: v4.11.13, INPUT-006 limpa estado obsoleto de gamepad quando a leitura nativa falha.
- `dd923a25`: teste de regressão de estado obsoleto (verificação estática; Node/CI não confirmados).
- **P01 permanece aberto por código E por validação real**; AUD-01 não aprovada. P02 HUD-001..007/AUD-02 também aberto; P00 e P03..P07 sem mudança.


## Prioridade redefinida — P02 HUD (2026-11-11)
- A pedido do usuário, **P01 pausado até a etapa final**. Não iniciar novos trabalhos de mouse/teclado/gamepad/Pointer Lock agora.
- **P02 é prioridade ativa**: HUD inclui posicionamento, tamanho, perfis, joystick virtual, safe areas e controles de toque; a prévia atual não altera o HUD jogável do xCloud.
- `c67a6c0c`: v4.11.14 protege o editor contra perda de captura de ponteiro e avisa explicitamente que se trata de prévia.
- **P02 restante:** HUD-001/002/005/006 PARCIAIS; HUD-003/004 PENDENTES (integração real); HUD-007 NÃO TESTADO; AUD-02 ABERTA.
- **P01 pendente para o final:** INPUT-001..006 implementação/aceite parcial; INPUT-007 testes reais; AUD-01.
- **P00 e P03..P07:** sem alteração de escopo ou conclusão.


## P02 — segundo lote HUD (2026-11-11)
- `a5ef777f`: v4.11.15, exclusividade do ponteiro durante arrasto do editor e liberação segura de captura.
- `28370f8a`: teste de regressão para segundo dedo e `lostpointercapture`.
- **P02 código corrigido:** editor de prévia e persistência; ainda **não** existe prova de integração com controles jogáveis do xCloud (HUD-003/HUD-004).
- **P02 pendente:** HUD-001/002/005/006 parciais; HUD-003/004 pendentes; HUD-007 teste real; AUD-02 aberta.
- **P01:** adiado para o final conforme decisão do usuário. **P00, P03–P07:** sem mudança.


## P02 — manutenção de perfis e segurança (2026-11-11)
- `5b85f6b2`: v4.11.18 rejeita nomes de perfil que colidem com chaves especiais de objetos JS e invalida o cache de carregamento automático quando a associação do jogo muda.
- `643d9290`: regressões para nomes especiais e invalidação do cache.
- Verificações executadas: sintaxe JS do runtime e dos testes; execução isolada do validador de nomes (6 casos passaram). **Suíte Node/CI e gameplay não executados nesta rodada.**
- **P02 ainda aberto:** integração com HUD jogável do xCloud (HUD-003/004), layout responsivo e testes reais. P01 segue reservado para revisão final, conforme preferência do usuário.


## P01 — retomada de código (2026-11-11)
- `e064f948`: v4.11.16 protege propriedade da Gamepad API em reinstalações.
- `c3e98a09`: testes executáveis de reinstalação e owner externo.
- `e14a4e46`: v4.11.17 elimina snapshots obsoletos em falhas de processamento.
- `86411a4d`: regressão para ambos os tipos de erro de leitura.
- `eb85e385`: AUD-01 revisada sem aprovação indevida.
- **P01 ainda não concluído:** INPUT-001/003/004/005 precisam de integração funcional; INPUT-002/006/007 testes reais; AUD-01 ABERTA. P02 continua com HUD-003/004 pendentes; P00/P03–P07 inalterados.


## Política de execução confirmada (2026-11-11)
- **Implementar/corrigir código em todos os pacotes antes da etapa final de validação real** (Chrome/Edge, Android, controle físico e partidas). Não tratar código ausente como 'apenas teste'.
- Testes automatizados de regressão podem acompanhar cada alteração de código; testes manuais reais ficam concentrados no fim.
- `bcfb8b93`: v4.11.19, HUD-005 permite ajustar de 60% a 160% o tamanho dos botões **da prévia**, persistindo a configuração independentemente das posições.
- `2e5bbf0c`: teste de persistência e limites da escala.
- **P02 ainda precisa de código:** HUD-002 identificação robusta dos controles jogáveis; HUD-003 integração segura; HUD-004 movimentação real; HUD-005 escala e safe areas reais; HUD-006 perfis aplicados ao HUD real. HUD-007 e aceite real AUD-02 ficam para validação final.
- **P01 ainda precisa de código:** INPUT-001/003/004/005, além de defeitos encontrados em INPUT-002/006. Não encerrar P01 por testes isolados.
- **Demais pacotes:** P00 auditoria parcial; P03 NET-001..006/AUD-03; P04 MEDIA-001..006/AUD-04; P05 DIAG-001..010/AUD-05; P06 ACC-001..006/AUD-06; P07 REL-001..006/AUD-07.


## P02 — integração nativa experimental (2026-11-11)
- `38b2cc66` v4.11.20: integração nativa por rótulos estritos, opt-in e reversível.
- `b11132ea` v4.11.21: recusa rótulos duplicados.
- `b2ca27fb`: regressões estáticas de segurança.
- `3cfb9a82`: auditoria atualizada.
- **P02 ainda não encerrado:** HUD-001/002/003/004/005/006 PARCIAIS, HUD-007 NÃO TESTADO, AUD-02 ABERTA. Falta compatibilidade comprovada com HUD real, reaplicação em remontagem e associação de perfis com HUD nativo.
- **P01:** implementação parcial e validação real pendentes. **P00, P03–P07:** inalterados.


## P02 — sincronização automática de HUD (2026-11-11)
- `2ef9c7a8`: v4.11.22 sincroniza perfil por jogo, layout, escala e remount de elementos nativos pelo monitor SPA existente.
- `5efbe97b`: regressão automatizada escrita para sincronização.
- `10f6a803`: auditoria P02 atualizada.
- **Código de sincronização e autoaplicação de perfis: implementado**, sujeito à identificação estrita dos controles e às flags opt-in.
- **P02 aceite final pendente:** HUD-002/003/004/005/007 exigem comprovação no xCloud real; AUD-02 aberta. Não declarar HUD jogável validado sem sessão real.
- **P01 e demais pacotes:** sem mudança de status.


## P03 — início do lote de streaming (2026-11-11)
- `184b95ca` (v4.11.23): NET-005, limpa QoS obsoleto quando RTCPeerConnection encerra; escolhe inbound-rtp de vídeo com maior volume de bytes; prioriza candidate-pair selecionado válido e succeeded.
- **P03 NET-005 PARCIAL:** diagnóstico mais robusto; falta avaliação do fluxo real e de reconexões. NET-001/002/003/004/006 continuam pendentes de revisão de código; AUD-03 aberta.
- **P02:** lógica de sincronização e perfis implementada; compatibilidade real e aceite final pendentes. **P01:** código e testes finais pendentes. **P00/P04–P07:** sem alteração.


## P03 — lote de confiabilidade WebRTC (2026-11-11)
- `3b41b238` v4.11.24: evita editar SDP em rollback/descrições sem offer/answer; não altera SDP idêntico; não publica QoS após fechamento; libera trava de amostragem em rejeições.
- `6649b531`: criado `tests/streaming-p03.test.cjs`.
- `cf7747ba`: criado `docs/P03_STREAMING_AUDIT.md` com inventário de NET-001..006 e riscos.
- **P03 EM ANDAMENTO:** NET-005 melhorias implementadas; NET-001/002/003/004/006 revisão e compatibilidade ainda pendentes; AUD-03 aberta. Sem teste real, sem alegação de aumento de bitrate ou FPS.
- **P02:** sincronização implementada, validação real pendente; **P01:** código pendente; **P00/P04–P07:** inalterados.


## P03 — segurança ICE e requisições (2026-11-11)
- `59d0e275` v4.11.25: NET-004 não descarta o último candidato ICE viável; NET-001 preserva signal/referrerPolicy/keepalive na requisição de play reconstruída.
- `503e787a`: regressões escritas em `tests/streaming-p03.test.cjs`.
- `9f6ec41f`: auditoria P03 ampliada.
- **P03 continua em andamento:** NET-001 e NET-004 receberam correções concretas, NET-002/003/006 ainda precisam de revisão de código; NET-005 exige validação real; AUD-03 aberta.
- **P02:** código automático implementado, teste real pendente. **P01:** código pendente. **P00/P04–P07:** sem mudança.


## P03 — fallback e cancelamentos (2026-11-11)
- `98f3a5a3` v4.11.26: NET-002 fallback sem alteração da lista do servidor, reescrita idempotente; NET-001 injeção restrita a HTTPS; NET-006 separa AbortError de falha de rede.
- `2ee55f1a`: regressões estáticas adicionadas; `1cf05fce`: auditoria P03 ampliada.
- **NET-001..005:** implementações presentes com correções; compatibilidade real e revisão de integração pendentes.
- **NET-006:** diagnóstico passivo implementado; recuperação automática NÃO implementada por ausência de API/contrato de reconexão seguro do xCloud. Não declarar código 100% concluído.
- **AUD-03:** aberta; testes reais e suíte Node completa não confirmados.
- **P02:** lógica de sincronização implementada, testes reais pendentes; **P01:** código pendente; **P00/P04–P07:** sem mudança.


## P03 — revisão de negociação SDP (2026-11-11)
- `af64755b` v4.11.27: NET-001 não reconstrói requisições de play já canceladas; NET-003 não injeta bitrate em seção de vídeo rejeitada e preserva quebras de linha SDP.
- `dd9768ee`: regressões estáticas atualizadas; auditoria P03 ampliada.
- **P03:** correções de código aplicadas em NET-001..005; NET-006 mantém diagnóstico passivo sem reconexão automática não verificada. AUD-03 aberta; suíte Node e testes reais não executados nesta etapa.


## P04 — Início de vídeo e áudio (2026-11-11)
- `016b38bb`: v4.12.0, MEDIA-001 restaura ajustes no vídeo anterior quando o xCloud substitui o elemento; MEDIA-002 preserva o filtro inline do host e permite bypass.
- `24171983`: testes estáticos MEDIA-001/002; auditoria em `docs/P04_MEDIA_AUDIT.md`.
- **MEDIA-001/002 parciais; MEDIA-003..006 pendentes; AUD-04 aberta.** Sem testes reais ou suíte Node completa nesta execução.
