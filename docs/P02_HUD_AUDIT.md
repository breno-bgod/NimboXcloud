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


## Integração nativa experimental — 2026-11-11
- `38b2cc66` v4.11.20: modo opt-in, reversível, de reposicionamento por rótulos de acessibilidade estritos, sem sintetizar inputs.
- `b11132ea` v4.11.21: rótulos duplicados ficam bloqueados, mesmo se ocorrerem três ou mais correspondências.
- `b2ca27fb`: testes estáticos de opt-in, rollback e duplicatas.
- **Limitação importante:** o HUD atual do xCloud pode não expor os rótulos esperados, usar canvas, iframes inacessíveis ou DOM dinâmico. Nesse caso, a integração não atua. A correspondência por rótulos não prova que o elemento controla o gameplay. A integração não acompanha remontagens do DOM automaticamente e pode exigir reaplicação. Transformações CSS podem alterar layout/gestos em controles complexos.
- **Estado correto:** HUD-003/004 PARCIAIS (mecanismo experimental implementado, compatibilidade não demonstrada); HUD-005 PARCIAL (escala aplicada no modo experimental, safe areas reais não validadas); HUD-006 PARCIAL (perfis ainda não reaplicam nativo automaticamente); HUD-007 NÃO TESTADO; AUD-02 ABERTA.
