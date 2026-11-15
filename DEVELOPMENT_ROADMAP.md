# NimboXcloud — Plano operacional Alpha 0.0.1

A versão Alpha 0.0.1, iniciada em 2026-11-14, é o ponto de partida das correções públicas. O histórico técnico anterior está nos commits Git e não integra o registro público de lançamentos Alpha.

## Procedimento de manutenção
1. Ler o HEAD atual de `main`, o código dos dois userscripts, os testes e as issues recentes.
2. Reproduzir o problema antes de alterar o comportamento. Registrar o que foi observado e o que continua hipótese.
3. Corrigir em mudança pequena, sem remover funcionalidades, configurações, licenças ou avisos necessários.
4. Verificar sintaxe, testes automatizados, riscos estáticos e, quando possível, testar em dispositivo e sessão reais.
5. Conferir novamente o HEAD antes de publicar, evitando sobrescrever trabalho concorrente.
6. Atualizar o [CHANGELOG Alpha](CHANGELOG.md) apenas com alterações a partir de 0.0.1.

## Prioridades
- **P0:** inicialização, estabilidade de sessão, Gamepad, controles físicos e virtuais, regressões do painel NX.
- **P1:** HUD, giroscópio, touchpad, fullscreen, áudio, monitoramento e seleção de regiões.
- **P2:** compatibilidade experimental e Remote Play xHome, sempre com autorização e validação separadas.

## Critérios de aceite
- Nenhum recurso declarado funcional apenas com base em mocks ou testes sintéticos.
- Nenhum token, cookie ou dado de conta publicado em diagnósticos.
- Preferências, layouts e caminhos de recuperação preservados.
- Evidência dos testes realizados e limitações pendentes em cada correção.

Detalhes de produto: [Estado Alpha](docs/PROJECT_STATUS_AND_DECISIONS.md) e [roteiro](docs/ROADMAP.md).
