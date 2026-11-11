# AUD-00 — Gamepad API: fronteiras de segurança

Data: 2026-11-11. Fonte: `NimboXcloud.user.js` v4.11.4, região ~3386–3522.

## Implementação atual

- `nx.input.applyAxes.v1` e `nx.gyro.gameInput.v1` estão desativadas por padrão.
- A ponte `nxInstallInputBridge()` só tenta instalar um wrapper de `navigator.getGamepads` quando algum dos dois módulos foi explicitamente habilitado.
- `nxRestoreNativeGamepads()` desativa ambos os módulos, restaura o descritor original quando a ponte ainda controla a API e preserva um wrapper de terceiro caso tenha substituído o NimboXcloud.
- A transformação usa apenas gamepads conectados com `mapping === 'standard'`; as demais leituras passam inalteradas.

## Evidências

- `tests/gamepad-bridge.test.cjs`: casos opt-out nativo, restauração e concorrência com wrapper externo.
- Os mesmos três cenários foram executados em sandbox JavaScript isolado contra o trecho extraído do userscript: **3/3 passaram**. Não são testes Node.js, Chrome, Android ou xCloud.
- CI e execução da suíte Node ainda não confirmados.

## Pendências e riscos

- `nxInputBridgeStatus()` pode desativar preferências quando detecta override externo. Revisar impacto de consulta de status com efeito colateral.
- Avaliar se a substituição por objeto simples preserva todos os contratos de `Gamepad` exigidos pelos jogos.
- Confirmar gyro + gamepad físico com hardware real e sessão autorizada.
- Não ativar a ponte automaticamente para usuários existentes.

**Status:** CORE-001 e CORE-005 permanecem em andamento; INPUT-001 e INPUT-006 ainda pendentes.
