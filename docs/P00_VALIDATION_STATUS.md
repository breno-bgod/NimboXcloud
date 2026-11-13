## Evidência adicional — 4.12.95 / PR #18 (mesclado)

- PR [#18 — fix(xhome): canonicalize remote ICE candidates](https://github.com/breno-bgod/NimboXcloud/pull/18), squash-merged na main em `e42137eb0cca1cb0eb5fd2cd958743700f4caf01`.
- [Baseline na main — run 43333473532](https://github.com/breno-bgod/NimboXcloud/actions/runs/43333473532): PASS.
- [NX/xHome na main — run 43333473500](https://github.com/breno-bgod/NimboXcloud/actions/runs/43333473500): PASS.
- Ambos os workflows executaram **245 testes, 242 PASS, 0 FAIL e 3 TODO**.
- Baseline: `node --check NimboXcloud.user.js`, `node --check modules/NimboXcloud-Touch-HUD.user.js`, suíte CommonJS/ESM e `node tools/static-risk-report.cjs` passaram.
- Regressão xHome: sintaxe do userscript e suíte completa passaram.
- A primeira rodada test-first falhou em duas regressões que reproduziram a deduplicação ausente e a ausência de diagnóstico terminal. A implementação inicial ainda não conectava o helper ao polling; uma rodada posterior revelou uma comparação de objetos entre realms no teste Stop→Start. As três falhas foram corrigidas sem remover assertions. Os dois workflows finais passaram no mesmo SHA de código/teste.
- `NimboXcloud.user.js` 4.12.95 normaliza objetos e JSON strings em `RTCIceCandidateInit` canônico antes de aplicar candidatos. A deduplicação considera candidate, sdpMid, sdpMLineIndex e usernameFragment, tanto na lista inicial quanto no polling. Entradas inválidas são ignoradas; erros de aplicação continuam visíveis em estado terminal e não reabrem polling.
- Sem alterações em endpoints, autenticação, payload enviado, SDP, controle ou transporte xCloud retail.
- Sem navegador real, Android/DeX, conta Xbox autenticada ou console físico. Remote Play permanece experimental/não homologado.

# P00 — Estado de validação e evidências

Revisão: 2026-11-12. PR #18 integrado na main: `e42137eb0cca1cb0eb5fd2cd958743700f4caf01`. Runtime: 4.12.95 / Touch HUD 1.2.7.

## Evidência automatizada confirmada na main

Após o merge do [PR #15](https://github.com/breno-bgod/NimboXcloud/pull/15), os dois workflows foram executados novamente no commit de código da main:

| Verificação | Estado | Evidência / limitação |
|---|---|---|
| Sintaxe do userscript principal | **PASSOU no CI** | `node --check NimboXcloud.user.js` |
| Sintaxe do módulo Touch HUD | **PASSOU no CI** | `node --check modules/NimboXcloud-Touch-HUD.user.js` |
| Suíte CommonJS + ESM | **PASSOU no CI** | 205 testes, 202 PASS, 0 FAIL, 3 TODO |
| Relatório estático | **EXECUTADO no CI** | `node tools/static-risk-report.cjs`; padrões relatados exigem avaliação contextual |
| Regressão xHome Stop→Start / ICE pendente | **PASSOU no CI** | O Stop aborta o controller ativo; resposta tardia da sessão A não altera a sessão B |
| Smoke legado ESM | **INCLUÍDO NO CI** | `tests/*.test.mjs` é executado nos dois workflows |
| Chrome/Edge, Android/DeX e jogo xCloud | **NÃO TESTADO nesta revisão** | Requer navegador, dispositivos e sessão autenticada |
| Remote Play xHome | **NÃO HOMOLOGADO** | Mocks não comprovam mídia, áudio ou aceitação de comandos pelo console |

### Execuções

- [Baseline na main — run 43322395932](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322395932): PASS; 205 testes, 202 PASS, 0 FAIL, 3 TODO.
- [NX/xHome na main — run 43322395967](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322395967): PASS; 205 testes, 202 PASS, 0 FAIL, 3 TODO.
- Os mesmos dois workflows também passaram no head do PR antes do merge: [baseline 43322313258](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322313258) e [NX/xHome 43322313707](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322313707).

## Correção 4.12.89 — cancelamento do polling ICE

O controller de `nxRemoteStartSession()` agora permanece associado à sessão enquanto houver `sessionId`. Isso permite que `nxRemoteStop()` aborte um GET `/ice` pendente. Quando a inicialização falha antes de criar uma sessão, a referência continua sendo limpa no `finally`.

A regressão usa duas sessões e dois peers simulados. O fetch antigo ignora deliberadamente o AbortSignal e retorna depois que a sessão B está ativa. O teste confirma que o candidato antigo não é aplicado, o status/peer/timer de B permanecem intactos e nenhum poll adicional é agendado.

A primeira execução do teste falhou porque o controller já havia sido removido antes de Stop. Essa falha revelou o defeito real; a correção foi aplicada e os dois workflows passaram depois. O transporte ICE, autenticação, SDP, endpoints e caminho de input xCloud retail não foram modificados.

## Ambiente e limitações

- O CI executa Node 22, verifica a sintaxe dos dois userscripts, roda `tests/*.test.cjs` e `tests/*.test.mjs`, e executa o relatório estático.
- Não há `package.json` na raiz; build/lint npm separados não estão configurados.
- Não foi executado Node local nesta revisão.
- Não houve teste em Chrome/Edge, Tampermonkey, Android/DeX, conta Xbox autenticada, console físico, NAT real, vídeo/áudio ou comandos de jogo.
- Os 3 testes TODO permanecem pendentes.
- Remote Play continua experimental; sucesso dos mocks não equivale a transmissão funcional ou controle homologado.

## Próxima validação

Testar o limite de 30 consultas do ICE poll e a transição para `connected` enquanto um GET está pendente. Aceite: nenhum timer novo após conexão, falha terminal ou esgotamento; Stop continua abortando; erros de uma sessão antiga não alteram uma sessão posterior; ambos workflows permanecem verdes.


## Evidência adicional — 4.12.92 / PR #16 (mesclado)

- [Baseline — run 43330718365](https://github.com/breno-bgod/NimboXcloud/actions/runs/43330718365): PASS.
- [NX/xHome regression — run 43330718131](https://github.com/breno-bgod/NimboXcloud/actions/runs/43330718131): PASS.
- PR #16 squash-merged em `091e6cc0c9da53b9bb31777a47a86c0b67a60368`.
- Resultado em ambos: 223 testes, 220 PASS, 0 FAIL, 3 TODO.
- Regressão de limite: uma leitura ICE inicial + no máximo 30 polls, sem timer 31 e sem ID de timer obsoleto.
- Regressão de transição: GET ICE pendente resolvido depois de connected/failed/closed não inicia outro poll.
- Sintaxe dos dois userscripts e relatório estático passaram no baseline.
- Sem homologação de navegador real, sessão Xbox, mídia, áudio ou comandos do console. Remote Play permanece experimental.
- Próxima validação: normalizar e deduplicar candidatos equivalentes representados como string JSON e objeto, ignorando entradas malformadas sem duplicar `addIceCandidate`.


## Evidência adicional — 4.12.94 / PR #17 (mesclado)

- [Baseline — run 43331934517](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331934517): PASS.
- [NX/xHome regression — run 43331934314](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331934314): PASS.
- Após o merge na main: [baseline 43332265026](https://github.com/breno-bgod/NimboXcloud/actions/runs/43332265026) PASS e [regressões 43332265025](https://github.com/breno-bgod/NimboXcloud/actions/runs/43332265025) PASS; ambos com 243 testes, 240 PASS, 0 FAIL e 3 TODO.
- Após a atualização documental final: [baseline 43332322583](https://github.com/breno-bgod/NimboXcloud/actions/runs/43332322583) PASS, novamente com 243 testes, 240 PASS, 0 FAIL e 3 TODO.
- Resultado: 243 testes, 240 PASS, 0 FAIL, 3 TODO.
- Sintaxe do userscript principal e do módulo Touch HUD, suíte CommonJS/ESM e relatório estático passaram.
- A primeira execução do baseline falhou apenas pelo fixture de teste sem `nowStr`; o fixture foi corrigido e os dois workflows passaram no head atualizado.
- O helper retail de IPv4 agora ignora explicitamente os hosts xHome de login e região; o comportamento retail continua testado.
- Sem sessão Xbox real, navegador real, áudio, vídeo ou controle homologados.
- Próxima validação: deduplicação canônica de ICE quando a mesma entrada aparece como string e objeto.


## Evidência adicional — 4.13.1 / PR #19 (mesclado)

- **HEAD base da execução:** `a271f6b290b27bdfad67e290103d09f41b4acc79` (4.13.0). O commit recente já havia unificado os cinco modos de entrada e o painel; essa implementação foi preservada.
- **PR #19:** [guard de propriedade e ordenação de ICE local](https://github.com/breno-bgod/NimboXcloud/pull/19), squash-merged em `12fac62335f643ee5bc179afc3d38f45d7f7659f`.
- **Falha reproduzida antes da correção:** a regressão isolada falhou em `755aee8bee425b43aab982fd886e07a0f66f9c57`. O primeiro POST foi o candidato A, mas o candidato C emitido durante o envio entrou antes do candidato B que já estava na fila: sequência observada A, C, B em vez de A, B, C. A falha foi confirmada nos workflows baseline [43338553594](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338553594) e xHome [43338553629](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338553629).
- **Correção:** a fila inicial e o trickle ICE usam a mesma cadeia serializada. Cada callback e cada POST exigem requestId atual, AbortSignal não cancelado, identidade do RTCPeerConnection e ausência de estado terminal failed/closed. Falhas tardias não substituem o status terminal; a reconciliação também captura estados que mudaram durante a fila inicial.
- **Regressão nova:** cobre ordem A/B/C com POST pendente, rejeição tardia após failed, callback posterior ao estado terminal e callback de peer substituído.
- **Validação no head final do PR:** baseline [43338677098](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338677098) PASS e xHome [43338677076](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338677076) PASS.
- **Validação pós-merge na main:** baseline [43338759828](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338759828) PASS e xHome [43338759865](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338759865) PASS.
- Resultado em todos os workflows aprovados: **268 testes, 265 PASS, 0 FAIL, 3 TODO**. Sintaxe do userscript principal e do Touch HUD, integridade das versões, suítes CommonJS/ESM e relatório estático passaram. O relatório continua apontando wrappers Gamepad, fetch e XHR já existentes; não são regressões introduzidas por esta correção.
- **Arquivos de runtime/teste/documentação de release:** `NimboXcloud.user.js` 4.13.1, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md`. Touch HUD permanece 1.3.0; a chave de cache `@require nx_version` acompanha 4.13.1.
- **Sem alteração** de endpoint, autenticação, token, formato do payload ICE, SDP, data channels ou transporte de controle. A implementação de cinco modos de entrada de 4.13.0 foi preservada.
- **Limites:** CI usa Node 22 e mocks. Não houve Chrome/Edge, Tampermonkey, Android/DeX, Xbox físico, NAT real, vídeo, áudio ou comandos reais. Remote Play permanece experimental e não homologado.
- **Avisos não bloqueantes do CI:** depreciação de `punycode` no ambiente Node e aviso do GitHub Actions sobre ações que ainda declaram Node 20; nenhum causou falha.
- **Próxima validação P1:** impedir que canais xHome ainda não concluídos executem bootstrap tardio depois de o peer entrar em failed/closed. O `isCurrent()` de `nxRemoteInitDataChannels` hoje verifica requestId, AbortSignal, peer e objeto de canais, mas não o estado terminal do peer.
  - Aceite: HandshakeAck/onopen tardios após failed/closed não definem `dataChannelsReady`, não anexam adaptador e não sobrescrevem o status terminal.
  - Ao terminalizar: cancelar `channelTimer`, fechar canais e manter readiness falsa sem recursão de Stop/failure.
  - Manter `disconnected` transitório recuperável se o peer voltar a connected.
  - Preservar Stop→Start, ordenação/ownership ICE local, canonicalização ICE remota e limite de 30 polls.
  - Baseline e xHome CI aprovados; sem declarar teste de console real.
