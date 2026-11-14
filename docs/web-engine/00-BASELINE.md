# Fase 0 — Linha de base e inventário inicial

**Data:** 2026-11-14
**Branch:** `experiment/web-engine-phase-0-baseline`
**Estado:** EM ANDAMENTO — inventário remoto parcial; testes locais e homologação pendentes.
**Escopo:** documentação e auditoria, sem alterações no runtime.

## 0.1 Referência do repositório

- Repositório: `breno-bgod/NimboXcloud`.
- `main` no início da auditoria: commit `3c50bf0c4619f29e472348bd75a18495b73ee87d` (merge PR #31).
- PR #31: fechado e **merged** em 2026-11-14 16:49:16 UTC.
- **Versão observada no cabeçalho do `NimboXcloud.user.js` da main: 4.15.5** (`@version` e `VER`). Documentação `PROJECT_STATUS_AND_DECISIONS.md` ainda menciona 4.15.4; a versão do código prevalece para este baseline.
- `@match https://play.xbox.com/*`, `@run-at document-start`, `@grant none`.
- `@require` fixa Touch HUD em commit `158df53180043af93e85af9e9d139c85ccaf36a9`.
- Árvore Git obtida por API: **170 arquivos** (blobs), resultado não truncado.
- PRs abertos observados: #28, #21, #13, #8, #7, #6 e #4; nenhum foi modificado.

## 0.2 Inventário de componentes

| Componente | Arquivo/diretório | Responsabilidade | Risco |
|---|---|---|---|
| Runtime oficial | `NimboXcloud.user.js` | hooks do site oficial, UI NX, configuração e diagnósticos | Crítico: preservar |
| Touch HUD | `modules/NimboXcloud-Touch-HUD.user.js` | controles virtuais e editor | Alto: regressão de input |
| Contrato experimental | `experiments/console/engine-session-contract/` | ownership de motor e geração, testes offline | Médio: contrato não integrado |
| Observador de sessão | `experiments/console/session-observer/` | monitoramento sanitizado | Alto: dados sensíveis |
| Código nativo experimental | `experiments/console/psbox-android-platform/` | plataforma Android e transporte | Médio: não é motor Web |
| Testes do produto | `tests/` | 40 arquivos `.test.cjs`/`.test.mjs` inventariados | Alto: regressões |
| CI produto | `.github/workflows/xhome-tests.yml` | Node 22, `node --check` e `node --test` | Médio: cobertura parcial |
| CI base | `.github/workflows/baseline.yml` | verificar passos e escopo na auditoria seguinte | A investigar |
| CI PSBox | `.github/workflows/psbox-android-platform.yml` | frente Android separada | Fora do MVP Web |

## 0.3 Mapa inicial de funções no userscript

Linhas referentes ao arquivo da `main` lido em 2026-11-14; posições podem mudar em commits futuros.

| Função | Linha aprox. | Responsabilidade | Risco/ação de auditoria |
|---|---:|---|---|
| `nxSessionHealth`, `nxSessionRecord` | 209–224 | diagnóstico de sessão | confirmar estados e sanitização |
| `nxCaptureServerCatalog`, `nxPickServer`, `nxObserveCloudServer` | 606–647 | catálogo, seleção e observação de datacenter | separar preferência de região real |
| `rewriteRegions`, `rewriteIce` | 814–876 | interceptação e modificação de respostas/ICE | regressão de rede/IPv6 |
| `inspectInputNegotiation`, `patchPlayRequest` | 1162–1180 | negociação e patch de criação de sessão | integridade do request |
| `nxObserveLaunchFetch` | 1288 | observação de lançamento | identificar rotas atuais |
| `hookRtc`, `diagnoseQos`, `pumpQos`, `PCQos` | 1513–1585 | observação WebRTC e QoS | não confundir observação com ownership |
| `patchTouchSessionConfiguration` | 1685 | configuração de touch | conflito com perfis |
| `nxRemoteAttachMedia`, `nxRemoteClearMedia` | 3554–3561 | mídia xHome | não assumir cloud |
| `nxRemoteSendInputPacket`, `nxRemoteInputRelease` | 3869–3892 | entrada xHome | liberar entradas ao encerrar |
| `nxRemoteDeleteSession`, `nxRemoteStartSession` | 4311–4506 | sessão Remote Play/xHome | não reutilizar sem análise |
| `nxRouteGamepads`, `nxGateGameInput`, `nxSetInputRoute` | 7150–7175 | arbitragem de controles | conflitos físicos/virtuais |
| `nxInstallInputBridge`, `nxVirtualInputState` | 7294–7386 | ponte e entrada virtual | evitar dupla injeção |
| `nxSampleGamepads`, `startInputDiagnostics` | 7698–7751 | diagnóstico de input | não enviar telemetria sensível |

**Observação:** a presença dessas funções não comprova compatibilidade de streaming independente.

## 0.4 Comportamentos que não podemos perder

- Painel NX, atalhos, catálogo, monitor de QoS e preferências persistidas.
- Touch HUD e Central de Entradas, gamepad físico/virtual, mouse, teclado e touchpad.
- Fluxos funcionais relatados para perfis Automático, Desktop e Mobile/Android.
- Distinção entre região solicitada, catálogo de datacenters e servidor efetivo.
- Diagnóstico sem tokens/cookies/SDP completo.
- Experimentos xHome e PSBox/Android separados do runtime oficial.

## 0.5 Testes e limitações

**Não executados neste ambiente:** `node --check NimboXcloud.user.js`, `node --test tests/*.test.cjs tests/*.test.mjs`, testes de hardware, Edge/Chrome, partida autorizada e CI deste novo commit. O acesso local à rede GitHub pelo contêiner falhou na resolução DNS; leitura e escrita foram feitas via conector GitHub. Não registrar PASS sem execução.

**Resultados históricos, não repetidos:** documentação de 4.15.4 relata 399 PASS, 0 FAIL, 3 TODO. Esse total não deve ser atribuído à versão 4.15.5 nem à branch atual sem novo teste.

**Próximos itens da própria Fase 0:** conferir `baseline.yml`, scripts de ferramentas, cobertura das funções, preferências persistidas, executar os testes no CI/ambiente apropriado, inspecionar falhas e registrar o HEAD após commits experimentais.

## 0.6 Portão de aprovação

- [x] Branch experimental criada, main não alterada.
- [x] Bíblia 1.0 registrada.
- [x] HEAD inicial, versão observada e PR #31 verificados.
- [x] Inventário de arquivos, testes e funções principais iniciado.
- [ ] CI e testes realmente executados no HEAD experimental.
- [ ] Mapa completo de responsabilidades e riscos revisado.
- [ ] Aceite explícito do mantenedor para encerrar Fase 0.

**Conclusão:** Fase 0 **não concluída**. Fases 1–9 permanecem bloqueadas.
