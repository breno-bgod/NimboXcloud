# P00 — Estado de validação e evidências

Revisão: 2026-11-12. Código de runtime validado no PR #16: `f1def105ff3283c9ff1b2d3bbec4a1b096c3fc50`. Runtime: v4.12.92 (antes do merge).

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


## Evidência adicional — 4.12.92 / PR #16

- [Baseline — run 43330718365](https://github.com/breno-bgod/NimboXcloud/actions/runs/43330718365): PASS.
- [NX/xHome regression — run 43330718131](https://github.com/breno-bgod/NimboXcloud/actions/runs/43330718131): PASS.
- Resultado em ambos: 223 testes, 220 PASS, 0 FAIL, 3 TODO.
- Regressão de limite: uma leitura ICE inicial + no máximo 30 polls, sem timer 31 e sem ID de timer obsoleto.
- Regressão de transição: GET ICE pendente resolvido depois de connected/failed/closed não inicia outro poll.
- Sintaxe dos dois userscripts e relatório estático passaram no baseline.
- Sem homologação de navegador real, sessão Xbox, mídia, áudio ou comandos do console. Remote Play permanece experimental.
- Próxima validação: normalizar e deduplicar candidatos equivalentes representados como string JSON e objeto, ignorando entradas malformadas sem duplicar `addIceCandidate`.
