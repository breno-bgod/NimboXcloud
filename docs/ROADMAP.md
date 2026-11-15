# NimboXcloud — Roteiro Alpha 0.0.1

Este roteiro começa com a primeira apresentação pública do Alpha em 2026-11-14. O código atual é a base de testes, não uma implementação comprovadamente estável.

## Prioridade 0 — Segurança e regressões
- [ ] Executar CI, análise estática e testes dos dois scripts após cada alteração.
- [ ] Validar inicialização, sessão, reconexão, WebRTC e Gamepad em partidas reais.
- [ ] Preservar controles nativos, preferências e layouts existentes.
- [ ] Evitar vazamento de tokens, cookies e identificadores em logs e issues.

## Prioridade 1 — Feedback Alpha
- [ ] Reproduzir problemas recebidos por issues com navegador, dispositivo e passos claros.
- [ ] Corrigir conflitos entre controle físico, toque, mouse e teclado.
- [ ] Validar giroscópio, touchpad, HUD e fullscreen em Android e desktop.
- [ ] Medir bitrate, FPS, RTT, perda e região efetivamente utilizada sem prometer resultados.

## Prioridade 2 — Recursos experimentais
- [ ] Investigar Remote Play xHome com console autorizado, sem prometer gameplay.
- [ ] Revisar compatibilidade e acessibilidade com testes controlados.
- [ ] Atualizar [CHANGELOG.md](../CHANGELOG.md) somente com mudanças do ciclo Alpha.

Status e limites: [Estado do projeto](PROJECT_STATUS_AND_DECISIONS.md).
