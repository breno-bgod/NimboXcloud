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

## Execução 2026-11-11 18:37 UTC — exportações de diagnóstico
- HEAD inicial: `3a3e8c92879aa44d6bd2f5e2dd4b8268b299e263`; commit de código: `cec02ad821c55dceb37ed62b91a58cb18636ee2f`; HEAD antes deste registro: `cec02ad821c55dceb37ed62b91a58cb18636ee2f`.
- Auditoria: `copyHistory` e `copyDiag` exportavam objetos diretamente, sem aplicar o filtro de dados sensíveis de `nxUnifiedReport`; fallback de `copyText` imprimia todo o diagnóstico no console quando clipboard falhava.
- Correção: `NimboXcloud.user.js` mantém v4.12.17; histórico e diagnóstico agora passam pela sanitização compartilhada; falha de clipboard mostra somente toast, sem registrar conteúdo no console. Sem mudança de rede, entradas, perfis ou configurações.
- Validação realizada: leitura do arquivo publicado; conferência estática das três substituições, ocorrência única de `copyDiag` e contagem simples de chaves (PASS). Não foi executado parser JavaScript real, suíte Node, Chrome/Edge ou jogo; contagem de chaves não equivale a parse sintático.
- Riscos: `nxUnifiedReport` ainda possui sanitização heurística que pode não cobrir todos os identificadores; falta teste automatizado com dados sensíveis artificiais. Exportações HUD e outros caminhos de log permanecem para revisão.
- Próxima tarefa concreta: criar teste de regressão executável para o sanitizador de relatórios com tokens, query strings, emails e objetos aninhados; aceite: nenhum valor sensível nos três caminhos de cópia, sintaxe verificada por parser real e nenhuma alteração de dados originais.

## Execução 2026-11-11 — Xbox Shell: painel centralizado
- HEAD inicial: `373295b35e741f7e4714e029e18a927995be85e1`.
- Diagnóstico confirmado: CSS `#__xcu_panel__.nx-console-shell.nx-shell-open` forçava `left/top:50%` e `translate(-50%,-50%)` com `!important`, causando painel no centro nos perfis Xbox; `bindDrag` altera estilos inline que não prevalecem sobre essa regra.
- Correção publicada: commit `90081b8dc2f0428904b6d70fbd9fbb71a131ee49`, `NimboXcloud.user.js`, mantém v4.12.17; painel Xbox Shell aberto agora fica ancorado no canto superior direito, largura limitada à viewport.
- Testes reais: parse completo do JavaScript via `new Function` PASS; substituição única do CSS PASS. Não testado em navegador, fullscreen real ou partida.
- Limitação: arraste e persistência de posição no Xbox Shell ainda são bloqueados por `!important` no CSS de ancoragem; não declarar reposicionamento livre resolvido. Atalhos F1–F5 propostos em conversa ainda não implementados.
- Próxima tarefa concreta: tornar a posição do Xbox Shell compatível com arraste e recuperação, removendo conflito de especificidade sem perder ancoragem inicial. Critérios: drag atualiza coordenadas efetivas, posição persiste após reabrir, viewport e fullscreen limitam coordenadas, reset restaura canto, testes DOM e parse passam.
- HEAD final desta execução: commit de documentação gerado após `90081b8d` (consultar `main` na próxima execução).

## Execução 2026-11-11 — NX home compacta, etapa 1
- HEAD inicial: `82125c9d001cb296ee1a204039fc031473a045d4`.
- Commit de código: `6491627fb913661660778c049ba62f8dd093b6ec`; arquivo `NimboXcloud.user.js`; versão metadata mantida 4.12.17.
- Mudança: Início agora apresenta estado de conexão, métricas, perfis rápidos e configuração atual antes da navegação; seis entradas existentes reorganizadas em grupos compactos (Jogo e controles, Áudio e acessórios, Conexão e sistema). Builders e preferências existentes preservados.
- Testes executados: parse integral via `new Function` PASS; conferência estática de três grupos e seis entradas PASS. Sem teste real Chrome/Edge, jogo ou screenshot do painel.
- Riscos: layout compacto não homologado visualmente; Xbox Shell mantém largura/posicionamento específicos; atalhos F1–F5 e arraste ainda pendentes. Não afirmar redesign integral concluído.
- Próxima tarefa concreta: testar e ajustar navegação compacta em larguras mobile e desktop com DOM real, sem alterar builders; aceite: seis categorias navegáveis, perfis rápidos acionáveis, nenhum overflow e retorno à home funcionando.
- HEAD final: commit de documentação subsequente ao commit de código acima (reler main).

## 2026-11-11 — Remote Play xHome, fase 1
- Referência: arquivo Better xCloud 6.7.13 fornecido pelo usuário (MIT), especialmente `RemotePlayManager.requestXhomeToken` e `getConsolesList`.
- Commit: `fd1042b9957a71c69ad76c3e67d6bee5a9a1068e` em `NimboXcloud.user.js`.
- Adicionada categoria Remote Play à home e builder próprio, com botão de consulta sob demanda.
- Consulta usa token GSSV da sessão Xbox local para login `xhome`, obtém regiões e lista consoles via `/v6/servers/home?mr=50`; token xHome mantido somente em escopo local da função, sem persistência/log.
- Tratamento de ausência de token, erro HTTP, falha de região e lista vazia; UI não expõe tokens nem IDs dos consoles.
- Validação: parse integral do userscript via `new Function` PASS. **Não testado em conta Xbox real, Chrome/Edge ou console físico**.
- Não implementado: iniciar sessão Remote Play, roteamento de launch, SDP/WebRTC, ICE, controles, encerramento/reconexão. Não anunciar streaming funcional.
- Próximo passo: validar descoberta com conta real e investigar sessão xHome isolada sem afetar Cloud Gaming, depois implementar conexão e input em etapas testáveis.

## 2026-11-11 — Remote Play xHome: fase 2 (diagnósticos e continuidade autônoma)
- Commit `fede8e78d8118d632da96b6418601e2bc89190b4`: painel Remote Play agora exibe região de descoberta, horário da última consulta e detalhes das tentativas/erros HTTP por região, sem registrar tokens.
- Validação realizada: parse integral do userscript com `new Function` PASS. Nenhuma conexão Xbox real, vídeo WebRTC ou controle foi testado.
- Automação horária existente `Automation_c075019083b08191803f7c2e950f0c9e` atualizada para continuar fases de Remote Play até homologação, preservando a prioridade de estabilidade do xCloud.
- Pendências: autenticação/descoberta real, seleção de console, criação de sessão xHome, WebRTC/ICE/SDP, mídia, inputs, reconexão, encerramento, testes em Chrome/Edge e hardware.
- Próxima tarefa: mapear com precisão a implementação upstream da rota `/consoles/launch/:serverId`, o handshake de sessão e interceptadores xHome; implementar uma etapa de conexão isolada com cancelamento e tratamento de erros, sem conflitar com Cloud Gaming. Aceite: código parseável, estado de conexão observável, sem credenciais em logs, sem regressões de navegação.

## 2026-11-11 — Remote Play: seleção de console (etapa 3 parcial)
- Referência inspecionada diretamente: Better xCloud 6.7.13 enviado pelo usuário, classes `RemotePlayManager` e `RemotePlayDialog`. Campos upstream confirmados: `serverId`, `deviceName`, `consoleType`, `powerState`; qualidades `720p`, `1080p`, `1080p-hq`.
- Commit de código: `13aa6ba2f331e674fde92fffa9862098f4f39502`.
- Corrigido mapeamento dos consoles descobertos: antes lia `name`/`state` e descartava o `serverId`, inviabilizando seleção; agora retém ID em memória, exibe nome/tipo/estado e permite selecionar console e resolução. Não exibe nem registra IDs ou tokens na UI.
- **Não inicia sessão**: seleção é etapa preparatória; lançar a rota upstream `/consoles/launch/:serverId` sem o patch de roteamento/sessão do Better xCloud não produziria Remote Play funcional. Evitar prometer conexão até implementar sinalização xHome e streaming.
- Validação: `new Function(userscript)` PASS; nenhuma conta Xbox, console real, Chrome/Edge ou mídia testados.
- Próxima tarefa concreta: estudar fluxo de `XhomeInterceptor` e patches de roteamento do upstream, implementar integração de sessão isolada e reversível sem sobrescrever fluxo Cloud Gaming. Aceite: inicialização e erro/cancelamento observáveis; sem tokens em logs; teste estático + validação com conta real pendente.
- Observação: `VER` no código lido = 4.12.16; reconciliar com metadados e versões documentadas antes de alterar número.

## 2026-11-11 16:42 America/Belem — Auditoria xHome: estado obsoleto e versão
- HEAD inicial confirmado: `4fe0239c5ab025a6a3e714f7a3969a45399dbdea`; HEAD após código: `451599b442245a7d7cc36ff47380932b68daa01c` (este registro cria commit posterior).
- Arquivo: `NimboXcloud.user.js`; corrigido estado residual de Remote Play: iniciar nova descoberta agora limpa lista, seleção e horário anteriores; qualquer erro de autenticação/rede também invalida consoles e seleção. Antes, falhas podiam deixar um Xbox antigo selecionado na interface, levando a ações sobre sessão não autenticada.
- Alinhada constante interna `VER` de 4.12.16 para 4.12.17, correspondente ao `@version` publicado; não houve alteração de API de autenticação.
- Verificação: leitura GitHub de main, inspeção de código/roadmap e commits recentes; `new Function(script)` PASS antes do commit; releitura do blob SHA antes de gravar para evitar sobrescrita concorrente.
- Limites: sem teste real em Chrome/Edge, sem console Xbox, sem sessão xHome autenticada; não há streaming Remote Play ainda. O fluxo de obtenção do token GSSV precisa validação real e o `fetch` cross-origin pode sofrer CORS; não assumir suporte apenas por parse.
- Próxima tarefa concreta: mapear e validar, com referência upstream, o formato correto da autenticação xHome e endpoints de descoberta, e adicionar testes simulados de sucesso/401/erro de rede; aceite: não exibir consoles após falha, diagnósticos sem tokens e compatibilidade com Cloud Gaming preservada.

## 2026-11-11 16:44 America/Belem — xHome: cancelamento, timeout e proteção de concorrência
- HEAD inicial: `c722793aa314acba39fc0f1b9c1b6a6420d2eda5`; código commit `fffa1e5a1b7feddaf2d8b50fa5d72aa283fb4834` (este registro produz HEAD final posterior).
- Arquivo modificado: `NimboXcloud.user.js`. Descoberta xHome agora usa `AbortController` em login e listagem, timeout de 15 segundos, botão Cancelar, geração `requestId` para impedir que resposta obsoleta altere estado e limpeza em `finally`.
- Risco corrigido: operações assíncronas anteriores podiam atualizar o painel após cancelamento; sem limite temporal, consulta podia ficar indefinidamente pendente.
- Teste realmente executado: parse do userscript inteiro com `new Function(script)` PASS. Não executados build, lint, testes de navegador, conta Xbox ou hardware. Não houve implementação de mídia/sessão.
- Pesquisa externa: Better xCloud 6.7.13 declara suporte ao Remote Play em `xbox.com/play`, mas ainda não está adaptado à nova `play.xbox.com` segundo release; código upstream usa `RemotePlayManager`, `XhomeInterceptor` e redirecionamento `/consoles/launch/:serverId`, que depende de patches de roteamento/sessão. Não copiar redirecionamento isoladamente.
- Próxima tarefa concreta: implementar testes de unidade com `fetch` simulado (sucesso, HTTP 401, timeout, cancelamento, resposta atrasada), de preferência extraindo o cliente xHome para módulo testável sem duplicar hooks. Critério: testes automatizados reproduzíveis e estado consistente em todos os casos; streaming real permanece bloqueado por necessidade de conta/console e integração WebRTC.

## 2026-11-11 — xHome: guarda pós-timeout na descoberta
- HEAD inicial `9cc613504f3d4d706c5d53e54693bb4bfadd2a6e`; commit de código `633bb1a1bb30025f693f64ad558c6e34afc3d4fd`; HEAD final será o commit deste registro.
- Corrigido `nxRemoteDiscover`: além da geração de requisições, a rotina agora verifica `controller.signal.aborted` antes de publicar resultados, impedindo aceitação tardia após timeout mesmo se `fetch` resolver tardiamente. `nxRemoteCancel` também limpa horário e tentativas anteriores.
- Validação: parse integral JavaScript via `new Function` PASS; sem testes automatizados de comportamento, sem browser ou Xbox físico. Mudança isolada à UI de descoberta xHome; não implementa sessão ou mídia.
- Risco pendente: necessidade de teste determinístico com `fetch` simulado para timeout, cancelamento, 401 e resposta atrasada. CORS e disponibilidade do token GSSV na nova página ainda não validados.
- Próxima tarefa concreta: extrair cliente de descoberta xHome para função injetável e criar testes automatizados com `fetch` mockado; critérios: quatro cenários passam sem resultados obsoletos, sem exposição de tokens e sem alterações ao gerenciador de entrada.

## 2026-11-11 — xHome: validação de origem antes de enviar bearer token
- HEAD inicial `673734bd0ae920ae709313a1774778ddf2b875b7`; commits de código `47041ae8a63acab4d71856766d21d327dba454db` e `9b4ae76690b877617c36617f3aea5dd3172b5dac`; HEAD final será o commit de documentação.
- Alterado `NimboXcloud.user.js`: a descoberta xHome não aceita mais qualquer HTTPS em `offeringSettings.regions[].baseUri`. Analisa URL, exige HTTPS, proíbe credenciais embutidas, restringe hostname a `xboxlive.com` ou subdomínios e utiliza a origem validada ao enviar `Authorization: Bearer`.
- Verificação de sintaxe integral `new Function(script)` PASS. Quatro casos de regex testados: host Xbox válido, raiz válida, sufixo enganoso rejeitado, prefixo enganoso rejeitado. Não houve testes reais de fetch, navegador, conta ou console.
- Risco: endpoint xHome legítimo que não termine em `xboxlive.com` será rejeitado até validação explícita; não ampliar allowlist sem evidência. A integração de sessão/WebRTC segue pendente.
- Próxima tarefa concreta: extrair descoberta para cliente testável e criar testes com mocks de `fetch` para 200, 401, cancelamento, timeout e origem maliciosa. Aceite: testes reproduzíveis, nenhum token em logs e nenhuma regressão na navegação do Cloud Gaming.

## 2026-11-11 — xHome: falhas de autorização e redirecionamento
- HEAD inicial `d6c5e57e21145cd68bd6e9951ba9b63478810726`; commit de código `6739d656fa6a2c37de8ebb7ce57a6fc9f0b73e84`; HEAD final será commit de documentação.
- `NimboXcloud.user.js`: GET de listagem de consoles rejeita redirecionamentos com `redirect:'error'` para reduzir risco de envio indevido de bearer; HTTP 401/403 agora interrompem descoberta com erro explícito em vez de tentar regiões adicionais, evitando falso diagnóstico de 'nenhum console'.
- Validação executada: parse JavaScript integral via `new Function` PASS. Não realizados testes de mocks `fetch`, browser, conta Xbox ou console. O tratamento de erros ainda necessita testes comportamentais automatizados.
- Pendências: autenticação e CORS no novo play.xbox.com, testes de mock de sucesso/401/timeout/cancelamento, seleção/lançamento de sessão xHome, sinalização WebRTC e integração de mídia/controles.
- Próxima tarefa concreta: extrair a descoberta para cliente testável e criar teste automatizado com fetch mockado para 200, 401, timeout, cancelamento e redirecionamento; critério de aceite: estados finais determinísticos, sem exposição de tokens ou regressões de navegação.

## 2026-11-11 — xHome: testes de regressão adicionados e redirecionamento de login bloqueado
- HEAD inicial `5213267bad8f0451b79a2dbe913428b7813a3ddc`; commits `a7d3ab6ae2a7ff0f19103928a3675f363c8d2143` (`NimboXcloud.user.js`) e `e4b33df4c5dd374634b43c7579f644d6a7ff272e` (`tests/xhome-discovery.test.cjs`); HEAD final será commit de documentação.
- Login `POST /v2/login/user` passa `redirect:'error'` para impedir redirecionamentos durante envio do token GSSV. Testes Node `node --test tests/xhome-discovery.test.cjs` criados para sucesso, 401, origem maliciosa, cancelamento e abort.
- Validação executada: parse do userscript com `new Function` PASS. Tentativa de executar os testes no runtime JavaScript da integração falhou por falta de `AbortController` global. **Não afirmar que os cinco testes passaram**; precisam ser executados em Node.js real/CI. Nenhum teste Chrome/Edge, Xbox ou mídia realizado.
- Riscos: mocks ainda não cobrem CORS real, ICE, SDP, fluxo de sessão, nem expiração do token; o teste de timeout simula abort, não espera 15s reais.
- Próxima tarefa concreta: executar `node --test tests/xhome-discovery.test.cjs` em ambiente Node.js, corrigir eventuais falhas e adicionar execução em CI. Critérios: cinco testes verdes, sintaxe do userscript aprovada, nenhum token em logs; depois avançar para criação de sessão xHome com protocolo confirmado.
