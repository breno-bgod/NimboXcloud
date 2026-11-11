# P00 — Matriz de mudanças recentes (2026-11-11)

Fonte: mensagens dos commits da branch main, do v4.6.0 ao v4.11.2. Classificação baseada no título dos commits; não substitui inspeção de diff.

| Faixa | Commits / exemplos | Natureza | Risco e rollback |
|---|---|---|---|
| v4.6.0–v4.8.0 | 2c053444, 52806b48, 7215f249 | Perfis HUD, vínculo com jogos, SPA | Persistência e seleção; reversão exige preservar dados |
| v4.9.0–v4.9.1 | b168d4e5, 709949c8 | Arrasto por teclado, carregamento opt-in | Interação do editor; testar touch/teclado |
| v4.10.0–v4.10.8 | 37555878, d0200537, 6c9ae4fb | Backup, restauração, rollback e verificações de armazenamento | Migração e integridade dos perfis |
| v4.10.9–v4.11.2 | 74e6c1b9, 2bac7aac, 1f8f5267 | Descoberta **passiva** do HUD nativo | Diagnóstico não prova manipulação funcional de botões reais |

**Conclusão:** o histórico observado não comprova editor de HUD real funcional. Não reverter indiscriminadamente, pois os commits de armazenamento podem proteger dados existentes.

**Limitação:** títulos de commit não demonstram ausência de efeitos colaterais. CORE-002 permanece em andamento até análise de diffs e testes.
