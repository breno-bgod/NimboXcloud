# P00 — Estado de validação e evidências

Data: 2026-11-11. Runtime: v4.11.6.

| Verificação | Estado | Evidência / limitação |
|---|---|---|
| Sintaxe do userscript | Verificada por compilação JavaScript isolada em atualizações recentes | Não equivale a `node --check` no runner do GitHub |
| Testes de Gamepad API com mocks | Cenários pontuais executados em sandbox JavaScript | Não executa o runner `node:test` completo |
| Proteção de Gamepad API não configurável | Passou em sandbox isolado | Teste adicional em `tests/gamepad-bridge.test.cjs` |
| Controle não padrão preservado | Passou em sandbox isolado | Identidade do objeto nativo mantida no cenário simulado |
| Suíte completa `node --test tests/*.test.cjs` | **NÃO CONFIRMADA** | Sem checkout local do repositório disponível; acesso GitHub via git indisponível neste ambiente |
| GitHub Actions `baseline.yml` | **NÃO CONFIRMADO** | Workflow configurado; nenhum resultado de execução consultável confirmado |
| Chrome/Edge, Android e xCloud | **NÃO TESTADO** | Requer sessão real e dispositivos |
| HUD nativo real | **NÃO TESTADO** | A descoberta passiva não confirma edição dos botões |

## Critério de aceite para CORE-004

1. Executar `node --check NimboXcloud.user.js`.
2. Executar `node --test tests/*.test.cjs`.
3. Executar `node tools/static-risk-report.cjs`.
4. Registrar saída, contagem de testes e SHA do commit.
5. Corrigir qualquer falha antes de marcar CORE-004 como concluído.

Não confundir a existência de testes com a execução bem-sucedida da suíte.
