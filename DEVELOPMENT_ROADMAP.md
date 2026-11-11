# NimboXcloud — Plano vivo de desenvolvimento

> Documento operacional. Toda execução autônoma deve reler a versão atual de `main` e atualizar este plano conforme evidências. Nunca presumir que a versão indicada aqui ainda é a mais recente.

## Estado de referência
- Versão auditada do userscript: 4.12.17 (rever o HEAD em cada execução).
- Arquivo principal: `NimboXcloud.user.js`.
- Plataforma prioritária: navegador em `play.xbox.com`, sem reescrever como aplicativo nativo.
- Objetivo: estabilidade real do cliente web, manutenção das funções existentes e investigação verificável das diferenças entre cliente web e cliente Xbox.

## Procedimento obrigatório a cada execução
1. Ler o HEAD mais recente da branch `main`, histórico de commits recente, `NimboXcloud.user.js` e este documento. Não trabalhar com cópia ou SHA antigo.
2. Verificar falhas de sintaxe, integrações, inicialização, condições de corrida, duplicidade de hooks, mudanças de APIs e regressões. Conferir especialmente `fetch`, XHR, WebRTC, Gamepad, HUD, gyro e telemetria.
3. Comparar estado real do código com itens abaixo. Escolher a correção de maior impacto e menor risco; não reimplementar recursos existentes.
4. Fazer mudança pequena, preservar configurações e funcionalidades, testar o que for possível. Diferenciar teste estático de teste autenticado real.
5. Antes de publicar, reler SHA atual; se houver commit concorrente, reconciliar em vez de sobrescrever. Publicar commit somente após validação disponível.
6. Atualizar este documento com itens concluídos, evidências, novas pendências e próximo passo. Não declarar concluído sem prova.
7. Registrar no resumo: commit, arquivos alterados, testes executados, riscos, itens pendentes e descoberta externa relevante.

## Frente NX — reformulação minimalista (2026-11-11)

- [x] Estrutura de navegação inicial em quatro categorias recolhíveis, preservando páginas técnicas existentes.
- [x] NX Stream Monitor opcional com métricas da coleta WebRTC já existente.
- [x] Preferências de layout horizontal, vertical, compacto e automático; opacidade, cor, escala e posição.
- [x] Bandeiras associadas a datacenters conhecidos quando identificados.
- [ ] **P0:** testar abertura/fechamento do painel, links das quatro categorias, retorno e manutenção das funções originais em catálogo e partida.
- [ ] **P0:** testar NX Stream Monitor em Chrome/Edge, Android, DeX, fullscreen, rotação e telas pequenas; verificar sobreposição de controles touch.
- [ ] **P0:** auditar unidades e frescor das métricas (RTT WebRTC não é ping do jogo; bitrate e FPS podem estar indisponíveis).
- [ ] **P1:** aprimorar responsividade e acessibilidade por toque/controle; validar arrasto, reposicionamento e restauração das preferências.
- [ ] **P1:** avaliar dashboard de gráficos em apresentação imersiva, sem duplicar rotinas de telemetria.
- [ ] **P1:** criar comparador visual do histórico por datacenter com indicação de idade, quantidade de amostras e método de medição.
- [ ] **P2:** pesquisar endpoints regionais legítimos e acessíveis; somente depois considerar sondagens opt-in em segundo plano com limites de frequência e timeout.
- [ ] **P2:** testes de regressão reproduzíveis para as categorias e para a sobreposição.

**Limite atual:** nenhuma sondagem ativa multi-região foi comprovada no código. O histórico de RTT é alimentado por sessões efetivamente utilizadas; não prometer latência atual de servidores alternativos.

## Backlog prioritário (reavaliar a cada execução)
- [ ] P0 — Auditar interceptações de `fetch` e XHR, `patchPlayRequest`, `rewriteExp`, `rewriteRegions`, `rewriteIce`; comparar com Cloud Play Debug Panel original e procurar regressões.
- [ ] P0 — Validar a confiabilidade de `nxSessionHealth`, `nxCompatibilityVerdict` e métricas da sobreposição: evitar falsos positivos, dados antigos e unidades erradas.
- [ ] P0 — Verificar conflitos entre gamepad físico, atalhos View+Menu, gyro, HUD e teclado/mouse por toque; não quebrar entradas existentes.
- [ ] P1 — Ampliar relatório de protocolo com evidências observadas/configuradas/não verificáveis, sem coletar tokens, cookies ou dados sensíveis.
- [ ] P1 — Comparar autenticação, ofertas, criação de sessão e WebRTC com projetos open source: xbox-xcloud-player, XStreaming, Greenlight, OpenXCloud, PSBox, green-nx, XCloud4 e novos projetos.
- [ ] P1 — Documentar hipóteses de identidade de console, separar identificação declarada de autorização real; testar apenas com conta e sessões autorizadas. Não presumir que UA ou headers liberam catálogo.
- [ ] P1 — Melhorar diagnóstico de falhas, logging sanitizado, timeout, tratamento de erro e relatório exportável.
- [ ] P2 — Revisar organização do painel, acessibilidade por controle e divisão de módulos sem reescrita arriscada.
- [ ] P2 — Avaliar automação de testes estáticos e testes de regressão reproduzíveis.

## Registro de execução
Adicionar entradas concisas com data UTC, HEAD inicial, ação, testes, HEAD final e pendências. Não apagar histórico útil. Manter o backlog coerente com o código atual.


## Matriz de validação funcional — auditoria 2026-11-11
- [ ] P0 — Executar teste autenticado de catálogo → criação de sessão → vídeo/áudio em play.xbox.com e registrar ambiente e resultado.
- [ ] P0 — Confirmar que gamepad físico e controles touch nativos continuam operacionais com os perfis Windows e HQ/Tizen.
- [ ] P0 — Testar giroscópio aplicado ao gamepad em jogo real, distinguindo prévia de saída efetiva.
- [ ] P1 — Testar editor de HUD com botões nativos em vários jogos e garantir restauração sem sobrescrever estilos externos.
- [ ] P1 — Validar equalizador, processamento de áudio, microfone e vibração em Android/DeX/Windows, sem prometer suporte do serviço.
- [ ] P1 — Verificar correção e frescor das métricas WebRTC e estados de sessão.
- [ ] P1 — Manter README PT/EN e CHANGELOG sincronizados com a versão e com evidências de testes; não inventar histórico de versões.
- [ ] P2 — Avaliar separadamente HUD de teclado/mouse por toque, volante, Remote Play e upscaling real antes de declarar qualquer um implementado.
- [ ] P2 — Investigar perfis de plataforma e ofertas de console sem confundir identidade local com autenticação ou autorização de catálogo.

## Regras de segurança e qualidade
- Preservar o comportamento funcional e dados do usuário; não alterar autenticação sem justificativa e mecanismo de reversão.
- Não coletar nem registrar credenciais, tokens, cookies, identificadores pessoais ou URLs sensíveis.
- Nunca afirmar que um jogo exclusivo de console foi liberado sem teste real verificável.
- Não confundir a observação de um status HTTP com autorização para catálogo de console.
- Em caso de risco alto, documentar bloqueio e avançar para tarefa segura.

## Execução 2026-11-11 17:42 UTC — captura de rede
- HEAD inicial: `1b73dbfb9c273bc37c360a1d490ba67a75218aa9`; commit de código: `f1f4d72c1bd793eb5649b1f762c1c0ad2f27bf16`; HEAD antes deste registro: `f1f4d72c1bd793eb5649b1f762c1c0ad2f27bf16`.
- Auditoria: a captura de requisições armazenava `pathname + search` em três locais, com risco de persistir parâmetros sensíveis. Uma falha de rede também registrava mensagem de exceção não sanitizada.
- Alteração: `NimboXcloud.user.js` v4.12.17; captura agora guarda somente `pathname` e categoria fixa `network-failure`, sem alterar as requisições enviadas ao servidor.
- Validação realmente executada: parse sintático de todo o userscript via `new Function` (PASS); conferência de três substituições e versão (PASS). Sem execução de testes de jogo, navegador, Node.js ou streaming autenticado.
- Risco restante: outras fontes de telemetria podem armazenar identificadores/URLs; auditoria integral de fluxos de exportação ainda pendente. A mudança reduz detalhe de diagnóstico de erro deliberadamente.
- Próxima tarefa concreta: auditar todos os pontos de `addCap`, `nxSessionRecord`, exportação de relatório e `S.lastErr` para dados sensíveis; critérios de aceite: nenhum token, cookie, query string ou URL sensível em buffers persistidos/exportados; sintaxe aprovada e regressão estática reproduzível.
