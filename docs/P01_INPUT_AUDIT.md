# P01 — Entradas: execução consolidada e AUD-01

**Data:** 2026-11-11 · **Runtime:** v4.11.8 · **Status:** IMPLEMENTAÇÃO PARCIAL / AUD-01 ABERTA

| Item | Implementação encontrada ou realizada | Situação |
|---|---|---|
| INPUT-001 | Coordenador `nxCoordState()` existente, não invasivo; início de observadores tornou-se idempotente em v4.11.7 | Parcial — não é roteador único de entradas |
| INPUT-002 | Política legada F9 com opt-out `nx.pointerLockLegacyF9=0`; testes isolados de captura/recaptura | Parcial — ciclo de vida real no navegador pendente |
| INPUT-003 | Telemetria passiva de `movementX/movementY` em v4.11.8; sem guardar coordenadas | Parcial — não altera sensibilidade nem injeta mouse |
| INPUT-004 | Observação de toque e mouse; ponte Gamepad API só por opt-in, com rollback | Parcial — coexistência em jogo pendente |
| INPUT-005 | Observação de teclado sem registrar teclas digitadas; F9 legado respeita campos editáveis | Parcial — teclado virtual jogável não implementado por este pacote |
| INPUT-006 | Amostragem nativa de gamepads, monitor de conexão, testes de rollback | Parcial — reconexão real e polling sob carga pendentes |
| INPUT-007 | Chrome/Edge Android e desktop, mouse e controle físicos | **NÃO TESTADO** |
| AUD-01 | Revisão estática, testes isolados, riscos e critérios documentados | **ABERTA** |

## Evidência técnica

- `741d15a0`: evita duplicação de observadores do diagnóstico.
- `e8b0c4a1`: telemetria relativa de mouse somente leitura.
- `a2d24e10`: testes automatizados para idempotência, movimento relativo, opt-in e privacidade do teclado.
- Teste isolado de movimento relativo executado: 1 amostra confiável de distância 5, eventos touch/sintético ignorados, NaN contabilizado: **PASSOU**.
- Sintaxe completa do userscript v4.11.8 verificada em compilação JavaScript isolada. **Suíte Node e CI não confirmados.**

## Critérios para concluir P01/AUD-01

1. Testar em sessão real xCloud com Chrome e Edge desktop, Android e controle físico.
2. Confirmar mouse com Pointer Lock, F9, ESC, blur/focus, fullscreen e recuperação.
3. Validar teclado/mouse virtual realmente jogáveis; não confundir observação com injeção.
4. Testar multitouch simultâneo com gamepad, hotplug e reconexão.
5. Confirmar que scripts externos não têm seus hooks sobrescritos e que rollback funciona.
6. Rodar CI e guardar logs e SHA; corrigir falhas.

**Não marcar INPUT-001..007 nem AUD-01 como concluídos até cumprir os critérios acima.**
