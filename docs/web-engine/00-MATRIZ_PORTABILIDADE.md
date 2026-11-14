# Fase 0 — Matriz de portabilidade do código existente

**Estado:** auditoria estática inicial; sem cópia de runtime ou prova de streaming Web.
**Base examinada:** árvore `main` em `3c50bf0c4619f29e472348bd75a18495b73ee87d`.
**Decisão do mantenedor:** aproveitar a base NimboXcloud existente, copiar para laboratório isolado e adaptar por falhas reais; evitar reescrever do zero.

## Inventário e tratamento recomendado

| Origem existente | Linguagem/escopo | Decisão inicial | Motivo |
|---|---|---|---|
| `experiments/console/engine-session-contract/session-owner.mjs` | JS, contrato offline | **COPIAR E ADAPTAR** | Ownership, geração e neutralização de input reaproveitáveis; nomes dos adapters e estados exigem adaptação |
| `experiments/console/engine-session-contract/session-owner.test.mjs` | Testes Node | **COPIAR COM O CONTRATO** | Preservar invariantes e testes de regressão |
| `experiments/console/session-observer/NX-Session-Lab.user.js` | JS, observador passivo | **REFERÊNCIA/EXTRAIR MÓDULOS** | Instrumentação e sanitização úteis, mas dependem de userscript e DOM do site |
| `experiments/console/session-observer/*.test.cjs` | Testes offline | **ADAPTAR** | Fixtures de diagnóstico, não provam sessão independente |
| `experiments/console/psbox-android-platform/vendor/src/net/http.*` | C++ nativo | **REFERÊNCIA DE CONTRATO** | Não executável diretamente em navegador; avaliar Fetch API ou WASM, CORS |
| `experiments/console/psbox-android-platform/vendor/src/util/json.*` | C++ nativo | **NÃO COPIAR PARA JS** | `JSON` nativo do navegador é preferível |
| `experiments/console/psbox-android-platform/platform_jni.cpp`, `java/` | JNI/Java Android | **MANTER NATIVO** | Activity, storage, JNI e Android não são APIs Web |
| `experiments/console/catalog-pagination/` | JS de laboratório | **ADAPTAR** | Paginação com fixtures sintéticas |
| `experiments/console/xstreaming-identity/` | JS de laboratório | **REFERÊNCIA** | Identidade declarada não equivale a autorização |
| `experiments/console/client-profile-audit/` | Auditoria | **REFERÊNCIA** | Diferenciar perfis e capacidades |
| `experiments/console/tizen-bootstrap/` | JS de laboratório | **REFERÊNCIA** | Não presumir que identidade de TV funcione no Web |
| `NimboXcloud.user.js` | JS de produto | **EXTRAIR SOB TESTES, NÃO DUPLICAR INTEIRO** | Hooks, NX, QoS, seleção de região, entrada; dependência atual do site oficial |
| `modules/NimboXcloud-Touch-HUD.user.js` | JS de produto | **ADAPTAR EM ETAPA POSTERIOR** | Preservar HUD, mapeamentos e editor sem acoplar ao DOM Xbox |
| `tests/*.test.cjs`, `tests/*.test.mjs` | Regressões | **MANTER E REUTILIZAR** | CI baseline existente |

## Restrições técnicas

- A pasta Android contém uma camada de plataforma, HTTP/CA e JNI, **não um motor Web independente completo**.
- A API `SessionOwner` atual exige adapters `nimbo-cloud` e `psbox`, e o código descreve uma proposta de integração, não uma sessão cloud real. Adaptar contratos, não fingir compatibilidade.
- Não colar código C++/JNI diretamente em JavaScript. Portar comportamento com testes; WASM somente se houver ganho e suporte técnico comprovados.
- Nenhuma cópia deve incluir tokens, cookies, credenciais, artefatos binários, certificados privados ou dados de usuários.
- Código externo requer origem, licença, atribuição e compatibilidade; preferir cópia dos próprios componentes já existentes.

## Ordem prática para o primeiro lote de portabilidade (após a Fase 1)

1. Criar `experiments/web-engine/` sem importação pelo userscript oficial.
2. Copiar contrato `session-owner.mjs` e seus testes, registrando commit de origem.
3. Adaptar ownership para o motor Web e manter invariantes de stop, geração e neutralização.
4. Extrair observação/diagnóstico sanitizado para módulo independente do DOM.
5. Portar catálogo/paginação com fixtures sintéticas.
6. Somente depois ligar auth, sinalização, WebRTC e input real, com gates da Bíblia.

## Critérios de falha / rollback

- Se a cópia exigir mudar a main, **parar**.
- Se falhar teste do contrato original, **corrigir ou reverter no experimento**.
- Se houver dependência Android/JNI/DOM Xbox, **marcar para adaptação**.
- Se código de terceiro não tiver licença compatível verificada, **não importar**.
- Se o CI não rodar, **não declarar pronto**.

**Pendências da Fase 0:** examinar detalhes de todos os módulos, registrar dependências e preferências, validar matriz com testes. Este arquivo não encerra a fase.
