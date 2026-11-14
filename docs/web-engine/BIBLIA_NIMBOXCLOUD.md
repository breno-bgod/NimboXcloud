# BÍBLIA DO PROJETO — NimboXcloud

**Edição:** 1.0 — 14/11/2026
**Status:** APROVADA pelo mantenedor em 14/11/2026; Fase 0 iniciada. O mantenedor autorizou avanço automático entre fases após cumprimento verificável dos critérios, sem autorização adicional para começar a fase seguinte.
**Repositório:** https://github.com/breno-bgod/NimboXcloud
**Produto de referência:** userscript NX, versão documentada 4.15.4 (conferir HEAD antes de qualquer alteração).
**Objetivo:** cliente Web independente para Xbox Cloud Gaming, com interface NX própria, sem depender da UI de `play.xbox.com` nem exigir console físico. Somente autenticação e permissões legítimas.

> Regra central: executar uma etapa por vez. Nenhuma fase será considerada concluída sem evidências e testes exigidos. O mantenedor autorizou o avanço automático para a fase seguinte quando os critérios objetivos de aceite estiverem comprovados; casos ambíguos, riscos novos e exceções continuam exigindo decisão explícita. Esta Bíblia não comprova streaming independente funcional.

## 1. Identidade, visão e limites

**Construiremos:** motor Web para autenticação autorizada, catálogo, criação e gestão de sessões, sinalização, WebRTC, áudio/vídeo, entrada e observabilidade, integrado progressivamente à interface NX existente.

**Não construiremos:** app Android como objetivo principal; dependência de PS5/Xbox/PC próprio; simples camada visual sobre a página oficial como solução final; contorno de autenticação, licenças, georrestrições ou segurança.

**Preservar:** userscript oficial, módulo Touch HUD, Central de Entradas, preferências, painel NX e telemetria. Remote Play/xHome é uma frente separada, fora do MVP cloud.

**Princípios:** evidência antes de alterar; isolamento entre experimento e produção; mudanças pequenas e reversíveis; sem segredos nos logs; não alegar FPS/latência/compatibilidade sem testes reais; não duplicar lógica já validada; priorizar APIs Web nativas.

## 2. Fontes de verdade e precedência

1. Decisões explícitas do mantenedor.
2. Código e testes no HEAD da branch de trabalho.
3. `docs/PROJECT_STATUS_AND_DECISIONS.md` e `docs/INTEGRACAO_OFICIAL.md`.
4. `docs/ARQUITETURA.md`, `docs/P03_STREAMING_AUDIT.md`, `docs/SESSION_START_INVESTIGATION.md`.
5. Referências externas verificadas em commits/revisões específicos: xbox-xcloud-player, Greenlight, PSBox, Orbita, Better xCloud e WebRTC.
6. Hipóteses e experimentos, nunca confundidos com fatos.

Em caso de divergência, documentar e pedir decisão. Conferir URL, manutenção, licença e commit antes de incorporar código de terceiros.

## 3. Inventário inicial conhecido (sujeito à auditoria)

- `NimboXcloud.user.js`: userscript de `play.xbox.com`, hooks fetch/XHR/WebRTC; não há sessão cloud independente comprovada.
- `modules/NimboXcloud-Touch-HUD.user.js`: HUD e entradas virtuais.
- `experiments/console/engine-session-contract/`: contrato experimental de ownership.
- `experiments/console/session-observer/`: observação sanitizada de sessão.
- `experiments/console/psbox-android-platform/`: código nativo de referência, não alvo Web.
- `tests/streaming-p03.test.cjs`, `tests/loading-session.test.cjs`, `tests/nimbo-touch-xhome.test.cjs`, `tests/xhome-discovery.test.cjs`: regressões existentes.
- Estado documentado 4.15.4: 399 PASS, 0 FAIL, 3 TODO; não equivale a testes executados agora.
- Perfis Automático, Desktop e Mobile/Android relatados funcionais no site oficial; Smart TV, Xbox e Xbox One com falha; não extrapolar para motor independente.

## 4. Arquitetura-alvo — proposta, não implementação

```text
NimboXcloud Web (NX, catálogo, configurações)
  └── Nimbo Web Engine
      ├── auth/        login, expiração, logout
      ├── catalog/     jogos, disponibilidade
      ├── session/     criação, estados, encerramento
      ├── signaling/   SDP, ICE, configuração
      ├── transport/   RTCPeerConnection, data channels
      ├── media/       áudio, vídeo, fullscreen, resize
      ├── input/       gamepad, touch, mouse, teclado, foco
      ├── telemetry/   getStats, diagnósticos sanitizados
      └── adapters/    NX e provedores versionados
```

Separações obrigatórias: UI não manipula tokens/SDP diretamente; input não cria sessões; telemetria não altera transporte; região preferida não significa datacenter real; Remote Play não compartilha automaticamente pressupostos cloud.

**Restrição crítica:** CORS, cookies, tokens e APIs privadas podem impedir um cliente somente navegador. Validar cedo; backend mínimo exige aprovação prévia de segurança, hospedagem e custos. Nunca armazenar credenciais em logs, código ou fixtures.

## 5. Política GitHub

- `main` é produção: não fazer commit direto.
- Trabalhar em `experiment/web-engine-<fase>` com PR pequeno, testes e evidências.
- Não fazer merge nem publicar versão sem autorização explícita. A autorização de avançar fases não autoriza merge, release ou mudanças na main.
- Não modificar `@updateURL`, `@downloadURL`, versões ou assets oficiais em experimento.
- Não substituir NX por interface genérica.
- Não commitar tokens Xbox, cookies, headers Authorization, IDs de sessão reais, SDP integral ou ICE com IPs pessoais.
- Respeitar licenças e atribuições dos projetos de referência.
- Sem teste real, usar **PENDENTE DE HOMOLOGAÇÃO**.

## 6. Fases e portões de aprovação

### FASE 0 — Congelamento e linha de base

**Meta:** entender a base existente antes de modificar.

- [ ] Registrar HEAD, versão, branches, PRs abertos e situação do PR #31.
- [ ] Inventariar arquivos, módulos, scripts de build e CI.
- [ ] Executar testes existentes e validação sintática; registrar PASS/FAIL/TODO e ambiente.
- [ ] Catalogar funções de sessão, WebRTC, SDP/ICE, input, QoS e região.
- [ ] Registrar comportamentos e preferências a preservar.

**Entregável:** `docs/web-engine/00-BASELINE.md` com funções → arquivos → responsabilidades → riscos.
**Aceite:** inventário revisado e testes de base documentados. Comprovados os critérios, iniciar automaticamente a Fase 1 na branch experimental, sem merge.
**Bloqueio:** não refatorar antes de cumprir os critérios objetivos.

### FASE 1 — Pesquisa comparativa verificável

- [ ] Confirmar URLs, commits, licenças e manutenção de xbox-xcloud-player e Greenlight.
- [ ] Confirmar identidade/arquitetura de PSBox e Orbita.
- [ ] Mapear auth, catálogo, sessão, signaling, WebRTC, mídia, data channels e gamepad.
- [ ] Comparar contratos e versões de protocolo com NimboXcloud.
- [ ] Classificar cada componente: REUTILIZAR / ADAPTAR / REIMPLEMENTAR / INVESTIGAR / NÃO USAR.

**Entregável:** `docs/web-engine/01-MATRIZ_REFERENCIAS.md`, com links por arquivo e commit.
**Aceite:** nenhuma dependência sem licença/origem/compatibilidade verificadas.

### FASE 2 — Contratos e máquina de estados

- [ ] Definir interfaces AuthProvider, CatalogProvider, SessionProvider, SignalingProvider, Transport, InputAdapter e Telemetry.
- [ ] Estados: idle → authenticating → ready → creating → negotiating → connecting → playing → stopping → stopped; error e cancelled.
- [ ] Definir ownership, timeout, cancelamento, retry limitado, cleanup e idempotência.
- [ ] Testes unitários com fixtures fictícias e falhas simuladas.

**Entregável:** `experiments/web-engine/` tipado com testes offline.
**Aceite:** transições determinísticas, nenhum recurso órfão em testes, independência do DOM Xbox.

### FASE 3 — Autenticação e catálogo autorizados

- [ ] Definir login, renovação e logout legítimos.
- [ ] Validar permissões, CORS e armazenamento seguro.
- [ ] Tratar expiração, cancelamento e falhas.
- [ ] Consultar catálogo sem presumir acesso a jogos não autorizados.

**Entregável:** laboratório com identidade não sensível e jogos disponíveis.
**Aceite:** login/logout e catálogo reais, sem exposição de tokens.
**Bloqueio:** se inviável no browser, reavaliar arquitetura antes de avançar.

### FASE 4 — Ciclo de sessão e sinalização

- [ ] Descoberta de região sem prometer datacenter forçado.
- [ ] Criar sessão autorizada e acompanhar provisionamento.
- [ ] Implementar configuração, SDP/ICE e cancelamento conforme contratos confirmados.
- [ ] Encerrar em falha, navegação e perda de conexão.
- [ ] Instrumentar estados sem payloads sensíveis.

**Entregável:** laboratório com log sanitizado.
**Aceite:** criação e encerramento reais, cleanup validado.

### FASE 5 — WebRTC e reprodução de mídia

- [ ] Criar/destruir RTCPeerConnection com segurança.
- [ ] Conectar tracks a player HTML; lidar com autoplay.
- [ ] Resize, fullscreen, orientação e desconexão.
- [ ] Métricas getStats: frames, jitter, perda, bitrate, RTT; RTT não é latência do jogo.
- [ ] Testar fallback sem ICE restart arbitrário.

**Entregável:** player experimental com vídeo e áudio.
**Aceite:** partida reproduzida em navegador suportado e encerramento limpo.

### FASE 6 — Controles sem conflitos

- [ ] Gamepad API: conexão, polling, deadzones, mapeamento.
- [ ] Adaptar Touch HUD existente, sem duplicar UI.
- [ ] Mouse/teclado: pointer lock com gesto e liberação em blur.
- [ ] Um proprietário ativo por canal; impedir inputs presos.
- [ ] Testar botões, analógicos, gatilhos e latência ponta a ponta.

**Entregável:** matriz de entradas e testes reais.
**Aceite:** gameplay funcional, sem drift, duplicação ou captura permanente.

### FASE 7 — Integração gradual com NX

- [ ] Adaptador entre eventos do engine e painel NX.
- [ ] Reaproveitar preferências compatíveis, com migração explícita.
- [ ] Conectar catálogo, player, monitor, configurações e Central de Entradas.
- [ ] Preservar userscript como produto separado.
- [ ] Feature flag experimental desativada por padrão.

**Entregável:** protótipo Nimbo Web navegável.
**Aceite:** UI e regressões aprovadas, sem impacto no userscript.

### FASE 8 — Robustez, segurança e compatibilidade

- [ ] Testar Chromium desktop, Edge/Chrome Android e Samsung DeX quando disponíveis.
- [ ] Redes instáveis, foco, orientação e reconexão.
- [ ] Revisar armazenamento, CSP/CORS, dependências, licenças e telemetria.
- [ ] Acessibilidade, desempenho, consumo e erros.
- [ ] Documentar limites por plataforma.

**Entregável:** `docs/web-engine/08-HOMOLOGACAO.md` e bugs.
**Aceite:** critérios de beta atendidos com evidência.

### FASE 9 — Beta e eventual oficialização

- [ ] Changelog, instalação, rollback e suporte.
- [ ] CI e aprovação do PR.
- [ ] Autorização explícita para publicar.
- [ ] Beta separado, monitoramento de regressões.

**Entregável:** release beta rastreável.
**Aceite:** testes reais e autorização explícita do mantenedor para publicação.

## 7. Modelo obrigatório de tarefa

```text
ID:
Fase:
Problema/objetivo:
Estado atual confirmado:
Arquivos envolvidos:
Referências (URLs + commits):
Hipótese / risco:
Mudança mínima proposta:
Testes automatizados:
Teste real necessário:
Critério de aceite:
Rollback:
Status: NÃO INICIADA | EM ANDAMENTO | BLOQUEADA | EM REVISÃO | APROVADA
Evidências:
Decisão do mantenedor:
```

Código escrito ≠ integrado; teste unitário ≠ sessão real; WebRTC conectado ≠ partida jogável; PR aberto ≠ versão oficial.

## 8. Critérios globais de qualidade

- Nenhuma regressão na main ou perda de preferências NX.
- Sem segredos ou dados pessoais em logs, screenshots, issues e PRs.
- Cleanup de mídia, sessões e controles após erro/cancelamento.
- Sem reconexão agressiva; limites e backoff explícitos.
- Diferenciar região solicitada, região efetiva e endpoint observado.
- Métricas corretamente rotuladas; FPS decodificado não equivale a FPS do jogo.
- Responsividade e acessibilidade desktop, mobile e DeX.
- Licenças revisadas antes de importar código.

## 9. Riscos e decisões antecipadas

| Risco | Impacto | Tratamento |
|---|---|---|
| Endpoints privados e mudanças xCloud | Alto | Adaptadores versionados e testes por contrato |
| CORS/autenticação no navegador | Crítico | Prova de viabilidade na Fase 3 |
| Licenças/compatibilidade | Alto | Auditoria Fase 1 |
| Conflito de gamepad/touch/mouse | Alto | Ownership único e gameplay Fase 6 |
| Região solicitada não aplicada | Médio/alto | Separar preferência de observação |
| Regressão da main | Crítico | Branch e PR isolados, sem merge automático |
| Ausência de testes em hardware | Alto | Bloqueio explícito de homologação |

## 10. Painel de execução

| Fase | Estado | Próxima ação |
|---|---|---|
| 0. Linha de base | EM ANDAMENTO | HEAD, inventário, testes e relatório |
| 1. Referências | NÃO INICIADA | Auditar repos/commits/licenças |
| 2. Contratos | BLOQUEADA pela 1 | Interfaces e estados |
| 3. Auth e catálogo | BLOQUEADA pela 2 | Prova de viabilidade |
| 4. Sessão/signaling | BLOQUEADA pela 3 | Sessão real |
| 5. Mídia/WebRTC | BLOQUEADA pela 4 | Vídeo e áudio |
| 6. Controles | BLOQUEADA pela 5 | Gameplay |
| 7. NX | BLOQUEADA pela 6 | Integração |
| 8. Homologação | BLOQUEADA pela 7 | Multiplataforma |
| 9. Beta | BLOQUEADA pela 8 | Aprovação de publicação |

## 11. Prestação de contas

Ao iniciar cada fase: objetivo, estado atual, arquivos, riscos e testes esperados. Ao terminar: alterações, testes executados e resultados, pendências e link do PR. Avançar automaticamente à fase seguinte quando os critérios de aceite objetivos estiverem integralmente satisfeitos e documentados, comunicando o resultado ao mantenedor. Não pedir nova autorização de rotina entre fases. Mudança de escopo, risco relevante não previsto, merge na main ou publicação exigem autorização explícita.

## 12. Próxima ação autorizada

**Somente Fase 0:** leitura do HEAD e testes, execução do baseline quando o ambiente permitir, relatório `00-BASELINE.md` em branch experimental. Não iniciar auth nova, não modificar main, não publicar release.

---

### Registro de revisões

| Versão | Data | Alteração | Situação |
|---|---|---|---|
| 1.0 | 2026-11-14 | Plano mestre, fases, critérios e salvaguardas | APROVADA; Fase 0 autorizada |
| 1.1 | 2026-11-14 | Avanço automático entre fases após critérios comprovados; main/release protegidos | APROVADA pelo mantenedor |
