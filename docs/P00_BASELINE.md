# P00 — Baseline técnico e riscos (2026-11-11)

Versão: 4.11.2; linhas: 4520. Sem testes reais em Chrome, Edge, Android ou sessão Xbox nesta rodada.

## Riscos identificados

| ID | Evidência | Risco | Estado |
|---|---|---|---|
| CORE-001.F01 | Substituição de Element.prototype.requestPointerLock, com rejeição de chamadas após liberação | Mouse pode deixar de recapturar após ESC ou perda de foco | ABERTO |
| CORE-001.F02 | Editor HUD é descrito no código como prévia local | Usuário confundir prévia com controle real | ABERTO |
| CORE-001.F03 | Hooks globais fetch/XHR e armazenamento persistente | Interferência com outros scripts | ABERTO |

## Reprodução manual pendente (CORE-003)

1. Desktop Chrome/Edge: capturar mouse no jogo, pressionar ESC e clicar novamente; registrar se recaptura sem F9.
2. Desktop: capturar, alternar janela, retornar e verificar movimento relativo.
3. Android Chrome: alternar toque e gamepad físico; verificar multitouch.
4. Android: abrir e fechar painel NX em partida; verificar eventos e controles.
5. HUD: salvar/restaurar perfil, verificar persistência e distinguir prévia de HUD nativo.

Registrar navegador, versão, dispositivo, jogo e resultado sem credenciais. Não automatizar ações destrutivas.

## Rollback

Esta etapa não altera o userscript. Os commits de documentação e testes podem ser revertidos isoladamente. A suíte usa Node.js sem dependências externas.
