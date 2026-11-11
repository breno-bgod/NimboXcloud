# NimboXcloud — Plano mestre de desenvolvimento

**Edição:** PM-003 · **Data:** 2026-11-11 · **Status:** P00 em andamento; runtime não modificado

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
| CORE-004 | Criar suite de lint, parse e smoke tests sem conta | Xperience/build | comandos reproduzíveis com saída e falha CI | IMPLEMENTADO (lint pendente) |
| CORE-005 | Criar configuração de feature flags e rollback de módulos experimentais | NimboXcloud | desligar recursos sem reinstalar script | PENDENTE |
| CORE-006 | Verificar licença, atribuição e proveniência de cada módulo adaptado | MIT/AGPL | inventário de proveniência revisado | PENDENTE |

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
