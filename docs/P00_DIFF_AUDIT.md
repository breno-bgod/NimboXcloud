# P00 — Auditoria de diffs e fronteiras de rollback

Data: 2026-11-11. Fonte: comparação de commits pelo GitHub (estatísticas reais de arquivos; sem execução de gameplay).

| Intervalo | Commits | Arquivos afetados | Alterações | Interpretação |
|---|---:|---|---:|---|
| v4.6.0 (`2c0534448`) → v4.11.2 (`1f8f5267f`) | 19 | `NimboXcloud.user.js` | +355 / -18 | Mudanças concentradas no userscript; exige revisão do comportamento HUD |
| v4.10.9 (`74e6c1b97`) → v4.11.2 | 3 | `NimboXcloud.user.js` | +29 / -10 | Descoberta nativa e correções associadas; não confirma edição real |
| Marco inicial do plano (`fc4e5e9d4`) → plano PM-005 (`fc919874166`) | 21 | userscript, docs, testes, CI | userscript +10 / -3 | Maioria das alterações foi infraestrutura; runtime mudou na opção de Pointer Lock |

## Fronteiras de rollback

1. **Perfis HUD:** antes de reverter versões, exportar backup do layout e preservar as chaves existentes; não apagar armazenamento em lote.
2. **Pointer Lock v4.11.3:** desativar o bloqueio legado via `localStorage.setItem('nx.pointerLockLegacyF9', '0')` e recarregar. Remover a chave restaura o comportamento anterior.
3. **Diagnóstico estático e CI:** reversão independente do userscript, sem impacto nos dados locais.
4. **Intercepções de fetch, XHR e Gamepad API:** não reverter em bloco; mapear consumidores, inicialização e efeitos antes.

## Lacunas

As estatísticas de diff **não são análise linha a linha**; ainda falta associar cada mudança funcional ao trecho específico e validar no navegador. CORE-002 segue EM_ANDAMENTO. Nenhum commit foi revertido.
