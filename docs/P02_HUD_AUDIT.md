# P02 — HUD real: auditoria e plano de integração

**Data:** 2026-11-11 · **Runtime:** v4.11.12 · **Estado:** EM ANDAMENTO

| Item | Evidência encontrada | Estado |
|---|---|---|
| HUD-001 | Editor local com layout de 8 controles, perfis, importação e exportação | Parcial |
| HUD-002 | `nxHudDomProbe()` procura possíveis elementos e shadow roots sem modificar DOM | Parcial: candidatos não comprovam controles jogáveis |
| HUD-003 | Integração com HUD nativo não identificada como segura | Pendente |
| HUD-004 | Movimentação do HUD nativo real não demonstrada; editor atua em preview | Pendente |
| HUD-005 | Layout validado em porcentagens entre 5 e 95; safe areas, rotação e escala real não validadas | Parcial |
| HUD-006 | Perfis, backup e rollback existentes; v4.11.11 tenta novamente após falha de autoload; v4.11.12 rejeita chaves inseguras | Parcial |
| HUD-007 | Multitouch e gameplay Android/desktop | NÃO TESTADO |
| AUD-02 | Inspeção estática e riscos documentados; aceite funcional pendente | ABERTA |

## Alterações desta etapa

- `06a25930`: correção do carregamento automático após falha ou associação indisponível.
- `e046a3ce`: validação de chaves potencialmente perigosas na importação de backups.
- `8fc25ea0`: testes em `tests/hud-p02.test.cjs`.

## Critérios para concluir

1. Identificar elementos nativos do HUD com evidência em sessão real e versão atual do xCloud.
2. Confirmar que mover elementos não rompe handlers, coordenadas, multitouch nem layout responsivo.
3. Implementar edição real apenas após confirmação de ownership e mecanismos de restauração.
4. Validar orientação, safe areas e perfis por jogo com migração e rollback.
5. Executar testes automatizados no Node/CI e testes reais Android/desktop.

**Não afirmar que a prévia edita controles jogáveis.** O scanner DOM é somente diagnóstico e não autoriza reposicionar elementos arbitrários.
