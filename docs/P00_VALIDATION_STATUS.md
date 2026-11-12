# P00 — Estado de validação e evidências

Revisão: 2026-11-12. Commit verificado: `97a275564ca1b2433d2f3d350f42e544904582cb`. Runtime: v4.12.87.

## Evidência automatizada confirmada

O [workflow baseline #43313714460](https://github.com/breno-bgod/NimboXcloud/actions/runs/43313714460), executado em `main`, concluiu com sucesso no commit acima. O job e seus passos foram consultados diretamente pela integração GitHub.

| Verificação | Estado | Evidência / limitação |
|---|---|---|
| Sintaxe do userscript principal | **PASSOU no CI** | Passo `node --check NimboXcloud.user.js` concluído com sucesso |
| Sintaxe do módulo Touch HUD | **PASSOU no CI** | Passo `node --check modules/NimboXcloud-Touch-HUD.user.js` concluído com sucesso |
| Suíte CommonJS | **PASSOU no CI** | Passo `node --test tests/*.test.cjs` concluído com sucesso; contagem de testes não extraída nesta revisão |
| Relatório estático | **EXECUTADO no CI** | `node tools/static-risk-report.cjs` concluiu; o programa relata padrões e não reprova automaticamente achados |
| Teste legado `tests/smoke.test.mjs` | **FORA DO CI / DESATUALIZADO** | Lê `xbox-cloud-unlock-ptbr.user.js`, ausente na árvore verificada; contém expectativas antigas de F9/Pointer Lock e Remote Play |
| Chrome/Edge, Android e xCloud | **NÃO VERIFICADO nesta revisão** | Exige sessão autenticada e dispositivos; CI não comprova jogabilidade |
| HUD nativo, multitouch e controle físico | **NÃO VERIFICADO em sessão real nesta revisão** | Testes estáticos e mocks não comprovam integração com o cliente Xbox |
| Remote Play xHome | **NÃO HOMOLOGADO** | Manter UI oculta conforme a matriz de decisões; sucesso de testes não comprova mídia e entrada |

## Revisão local 4.12.88 — 2026-11-12

A lacuna do smoke legado foi corrigida: arquivo correto, contratos atuais e inclusão de `tests/*.test.mjs` nos dois workflows. O teste do relatório estático executa o corpo real do CLI em VM, sem subprocessos; o CLI também foi executado diretamente.

- Ambiente local: Node 24.22.1.
- Comando: `node --test --test-isolation=none tests/*.test.cjs tests/*.test.mjs`.
- Resultado: **204 testes, 201 PASS, zero FAIL, três TODO**.
- Sintaxe dos dois scripts: passou. Relatório estático: executado; quatro achados de hooks, não classificados automaticamente como bugs.
- A opção sem isolamento foi usada porque a criação de subprocessos Node retorna EPERM neste ambiente. O CI em Node 22 executa o comando padrão com isolamento; seu resultado será registrado separadamente.
- Não houve teste de navegador/sessão autenticada nesta revisão. Os três TODO continuam pendentes.

A linha do teste legado na tabela acima descreve a base 4.12.87, antes desta correção. Consulte o [plano comparativo](./PLANO_ATUALIZACAO.md) para alterações e riscos.

## Critério de aceite para mudanças futuras

1. Executar verificações de sintaxe nos dois userscripts.
2. Executar a suíte CommonJS e qualquer suíte adicional mantida.
3. Revisar o relatório de risco; sua saída bem-sucedida não significa ausência de riscos.
4. Registrar execução, SHA, contagens quando disponíveis e limitações.
5. Validar início, encerramento, reconexão, controles e toque em sessão real antes de declarar estabilidade.

Esta evidência se refere exclusivamente ao commit identificado. Não equivale à execução local nesta conversa nem certifica commits posteriores.

