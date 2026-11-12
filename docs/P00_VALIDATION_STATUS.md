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

## Lacuna a corrigir

Os dois workflows atuais executam somente `tests/*.test.cjs`. O arquivo `tests/smoke.test.mjs` fica excluído e falharia ao tentar ler o caminho antigo. Sua atualização deve conciliar as expectativas legadas com a política vigente de preservar F9 e Pointer Lock nativos e com o estado experimental do xHome. Não basta alterar o caminho ou remover asserções para obter sucesso.

## Critério de aceite para mudanças futuras

1. Executar verificações de sintaxe nos dois userscripts.
2. Executar a suíte CommonJS e qualquer suíte adicional mantida.
3. Revisar o relatório de risco; sua saída bem-sucedida não significa ausência de riscos.
4. Registrar execução, SHA, contagens quando disponíveis e limitações.
5. Validar início, encerramento, reconexão, controles e toque em sessão real antes de declarar estabilidade.

Esta evidência se refere exclusivamente ao commit identificado. Não equivale à execução local nesta conversa nem certifica commits posteriores.
