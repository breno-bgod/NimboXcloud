# P01 — Entradas: execução consolidada e AUD-01

**Data:** 2026-11-11 · **Runtime:** v4.11.10 · **Status:** IMPLEMENTAÇÃO PARCIAL / AUD-01 ABERTA

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


## Segunda etapa — correções e decisão de auditoria (2026-11-11)
- `954962c6`: INPUT-004: sobreposição touch/mouse não é mais disparada por teclado e exige timestamp válido do outro dispositivo.
- `7b027c95`: teste de classificação teclado/toque/mouse.
- `e38c11ad`: INPUT-003: eventos sem `movementX/movementY` numéricos são contabilizados como inválidos, não convertidos implicitamente em zero.
- `ed9618e9`: teste para movimento relativo ausente.
- Cenário isolado executado contra a v4.11.10: **passou** (1 sobreposição touch/mouse, 1 movimento válido, 1 evento inválido).
- Tentativa de `git ls-remote` no ambiente de execução: **falhou por DNS** (`Could not resolve host: github.com`). Não houve checkout, execução Node nem teste real em navegador.

**AUD-01: REVISÃO ESTÁTICA PARCIAL — NÃO APROVADA PARA ENCERRAMENTO.** A implementação de teclado/mouse virtual jogável e a arbitragem ativa de inputs não foram demonstradas; `nxCoordState` continua somente diagnóstico. INPUT-007 exige testes reais em Chrome/Edge Android/desktop com gamepad físico. Nenhum item INPUT-001..007 foi marcado integralmente concluído.


## Retomada para encerramento (2026-11-11)
- `e064f948` (v4.11.16): instalação repetida da ponte de gamepad não substitui wrapper próprio nem de terceiros.
- `c3e98a09`: teste executável para repetição de instalação e propriedade externa.
- `e14a4e46` (v4.11.17): falha no processamento do snapshot também limpa estado obsoleto.
- `86411a4d`: teste para os dois caminhos de erro de leitura de gamepad.
- Verificação isolada da ponte: reinstalação idempotente e proprietário externo preservado — PASSOU.
- **Não encerrado:** INPUT-001, INPUT-003, INPUT-004 e INPUT-005 ainda não comprovam uma camada de entrada jogável unificada; INPUT-002, INPUT-006 e INPUT-007 requerem validação real; AUD-01 permanece ABERTA. Não confundir observação passiva com integração de teclado/mouse virtual.


## xHome — dispatcher único de teclado/mouse (2026-11-12)
- Implementado como opt-in após WebRTC conectado, canais prontos e trilha de vídeo ao vivo; bloqueia a ativação quando uma sessão Cloud Gaming está conectada e suspende o modo automaticamente se ela surgir durante o xHome.
- Eventos físicos confiáveis passam pelo dispatcher xHome; `keydown/keyup` são integrados aos listeners existentes do NX, sem adicionar um segundo par global.
- Pointer move/down/up/cancel/wheel/contextmenu e pointerlockchange usam uma única instalação idempotente; nenhum `requestPointerLock` ou `navigator.getGamepads` é sobrescrito.
- NimboTouch recebe um adaptador host opcional e envia estados virtuais ao mesmo encoder/canal; sem ativação xHome, o transporte SDK do Cloud Gaming permanece inalterado.
- Ownership por origem (physical/touch) impede que soltar uma origem libere uma tecla ou botão ainda mantido pela outra.
- Neutralização cobre blur, visibility hidden, abertura do NX, abertura do painel NimboTouch, Stop e pagehide.
- O mapeamento absoluto usa dimensões decodificadas da trilha/vídeo, com fallback para o perfil selecionado e compensação de letterboxing.
- **Estado:** implementação automatizável/experimental; protocolo e comportamento de captura ainda exigem validação em Xbox físico e Chrome/Edge/Android. P01/AUD-01 continuam abertos.
