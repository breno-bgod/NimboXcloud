# NimboXcloud — Plano vivo de desenvolvimento

> Documento operacional. Toda execução autônoma deve reler a versão atual de `main` e atualizar este plano conforme evidências. Nunca presumir que a versão indicada aqui ainda é a mais recente.

## Estado de referência
- **HEAD de `main` consultado em 2026-11-13:** `c28675d29a4e16f9a7546e091e596c9068975187`.
- **Versão real do userscript:** 4.15.2; blob de `NimboXcloud.user.js`: `c2a5e8f70f0f261561babeac729766e4d545f17b`. O changelog declara módulo Touch HUD 1.4.0.
- Arquivo principal: `NimboXcloud.user.js`; interface e composição do painel permanecem no userscript, com HUD em `modules/NimboXcloud-Touch-HUD.user.js).
- Plataforma: navegador em `play.xbox.com`.
- **Escopo vigente desta frente automatizada:** exclusivamente arquitetura de informação, apresentação, CSS/layout, tipografia, ícones decorativos, responsividade e UX. Alterações funcionais pertencem a outra frente/responsável.
- Trabalho desta execução: branch `automation/visual-responsive-nav-2026-11-13`, criada a partir do HEAD acima; nenhuma alteração foi publicada diretamente em `main`.

## Procedimento obrigatório a cada execução — frente visual
1. Consultar diretamente o HEAD/SHA atual de `main`, este roadmap, `CHANGELOG.md`, árvore do repositório, userscript, módulos de interface, testes de painel e commits recentes. Não usar SHAs memorizados.
2. Inventariar os destinos, grupos, linhas de configuração e estados realmente presentes; comparar a apresentação com a taxonomia aprovada pelo mantenedor.
3. Rastrear a montagem visual antes de mover nós ou alterar categorias. Se a composição tocar callbacks, handlers, ciclo de vida, persistência ou IDs, não modificar: documentar a proposta e o risco para a outra IA.
4. Alterar somente markup/template comprovadamente visual, CSS, espaçamento, tipografia, ícones decorativos, rótulos e hierarquia. Não criar opções, controles ou estados fictícios.
5. Não alterar jogabilidade, input, Gamepad API, pointer/touch/keyboard/mouse handlers, giroscópio funcional, rede, autenticação, sessão, streaming, WebRTC, persistência, semântica de configurações ou telemetria.
6. Pesquisar referências atuais de design systems/produtos, extrair padrões e registrar fontes/licenças; não copiar assets ou código sem licença adequada.
7. Reconsultar `main` e o HEAD da branch imediatamente antes de gravar. Trabalhar em uma branch `automation/*` baseada em `main`, manter um PR próprio por vez, não fazer push direto em `main` nem mesclar PR.
8. Executar os testes disponíveis e revisar o diff. Distinguir CI/teste estático de validação visual real; nunca alegar teste em navegador/dispositivo sem execução.
9. Atualizar este documento no GitHub em toda execução com SHA inicial/final, versão, inventário, alterações, fontes, testes, riscos e uma única próxima tarefa visual concreta. Sem mudança segura, registrar diagnóstico útil sem commit vazio.

## Frente NX — organização funcional do painel (2026-11-12)

- [x] Navegação por responsabilidades: Início, Vídeo, Imagens, Streaming, Estatísticas, Gamepad, Teclado e mouse, Áudio, Voz, Remote Play, Região da loja, Interface, Compatibilidade e Sistema.
- [x] Separar Gamepad de Teclado e mouse: giroscópio, vibração, diagnóstico de gamepad e atalho do controle ficam em Gamepad; NimboTouch, editor de HUD, diagnóstico de toque/mouse e atalho de teclado ficam em Teclado e mouse.
- [x] Separar Vídeo de Imagens: perfil Auto/Desktop/Celular/DeX, enquadramento e tela cheia em Vídeo; filtros, perfis visuais, captura e processamento WebGL2 em Imagens.
- [x] Corrigir Voz para exibir somente o grupo de microfone e separar a vibração do grupo de acessórios.
- [x] Transferir métricas e opções do NX Stream Monitor para Estatísticas; remover a configuração duplicada da página Início.
- [x] Preservar chaves e preferências locais existentes e reutilizar os builders legados, sem criar novo gerenciador de entradas.
- [ ] **P0:** validar navegação e renderização das 14 categorias em Chrome/Edge, Android, DeX, tela cheia e rotação; conferir acessibilidade por toque e controle físico.
- [ ] **P0:** confirmar no xCloud que o Gamepad físico, NimboTouch e HUD nativo coexistem sem mudança de comportamento.
- [ ] **P1:** conferir visualmente a hierarquia, rolagem do rail, foco/retorno e tamanhos do painel em telas pequenas.

**Limite atual:** a reorganização foi verificada por sintaxe e testes automatizados do repositório; ainda não houve teste visual autenticado no navegador, Android/DeX ou jogo real. O código atual usa WebGL2 e filtros locais; não há implementação de FSR 1 neste build.

## Backlog funcional histórico — fora do escopo desta automação visual

> Os itens abaixo preservam o histórico da frente funcional. Esta automação não os executa nem corrige bugs de jogabilidade, input, protocolo, rede, autenticação, sessão ou streaming. Evidências funcionais devem ser encaminhadas ao responsável pela outra frente.


- [ ] P0 — Auditar interceptações de `fetch` e XHR, `patchPlayRequest`, `rewriteExp`, `rewriteRegions`, `rewriteIce`; comparar com Cloud Play Debug Panel original e procurar regressões.
- [ ] P0 — Validar a confiabilidade de `nxSessionHealth`, `nxCompatibilityVerdict` e métricas da sobreposição: evitar falsos positivos, dados antigos e unidades erradas.
- [ ] P0 — Verificar conflitos entre gamepad físico, atalhos View+Menu, gyro, HUD e teclado/mouse por toque; não quebrar entradas existentes.
- [ ] P1 — Ampliar relatório de protocolo com evidências observadas/configuradas/não verificáveis, sem coletar tokens, cookies ou dados sensíveis.
- [ ] P1 — Comparar autenticação, ofertas, criação de sessão e WebRTC com projetos open source: xbox-xcloud-player, XStreaming, Greenlight, OpenXCloud, PSBox, green-nx, XCloud4 e novos projetos.
- [ ] P1 — Documentar hipóteses de identidade de console, separar identificação declarada de autorização real; testar apenas com conta e sessões autorizadas. Não presumir que UA ou headers liberam catálogo.
- [ ] P1 — Melhorar diagnóstico de falhas, logging sanitizado, timeout, tratamento de erro e relatório exportável.
- [x] P2 — Reorganizar a taxonomia do painel por responsabilidade, sem recriar os gerenciadores de input.
- [ ] P1 — Validar navegação acessível do painel por controle físico e toque em navegadores reais.
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

## 2026-11-11 — CI para testes de descoberta xHome
- HEAD inicial `6e3051e19d5a1e560c395b37d8e576f787b28d77`; commit de código `c89ba8eb154796d08a72017c314147d01e82f341`; HEAD final será o commit deste registro.
- Arquivo novo `.github/workflows/xhome-tests.yml`: GitHub Actions para `node --check NimboXcloud.user.js` e `node --test tests/xhome-discovery.test.cjs`, Node.js 22, acionado em push/main, pull requests com alterações relevantes e `workflow_dispatch`.
- Validação real nesta execução: Node.js v22.16.0 disponível localmente; tentativa de baixar arquivos por raw.githubusercontent.com falhou por DNS (`Could not resolve host`). Testes Node **não executados** e status de GitHub Actions **não verificado**. Não afirmar aprovação até obter logs reais. Não foram feitos testes Xbox/Chrome/Edge.
- Pendências: conferir status do novo workflow no GitHub, corrigir testes caso falhem; testar mocks de rede e redirecionamento; validar credenciais/CORS xHome no navegador; mapear handshake de sessão e WebRTC sem interferir no xCloud.
- Próxima tarefa concreta: consultar a execução do workflow no GitHub Actions e corrigir falhas verificadas. Critério de aceite: `node --check` e cinco testes com resultado verde registrado pelo CI; então iniciar implementação segura do fluxo de sessão xHome.

## 2026-11-11 — xHome: cobertura de segurança ampliada
- HEAD inicial `2ba6e8cdfaf94d39446ece75a8121d94fb8db6f3`; commit de testes `2e8f37cc9aa5f4e28d59272540705b2bfb75414f`; HEAD final será o commit deste registro.
- Arquivo modificado `tests/xhome-discovery.test.cjs`: adicionados casos 403, rejeição de redirecionamento no login GSSV e rejeição de redirecionamento na consulta com bearer. Total de oito cenários definidos; não confundir testes escritos com testes aprovados.
- Inspeção GitHub: consulta de workflow runs para commit `c89ba8eb154796d08a72017c314147d01e82f341` retornou lista vazia; API utilizada só retorna execuções de pull request, portanto **não prova ausência de execuções push**. Estado real do GitHub Actions não confirmado.
- Validações: revisão estática de arquivos de teste e do userscript; nenhum teste Node executado nesta execução, nenhum teste de navegador ou Xbox.
- Bloqueio: conector disponível não oferece listagem geral de workflow runs por push e os arquivos do GitHub não foram materializados no container nesta execução.
- Próxima tarefa concreta: obter execução GitHub Actions por push (ou executar arquivos em Node local após materialização), corrigir falhas dos oito testes e registrar logs reais. Critério: oito testes PASS e `node --check` PASS; depois seguir para handshake xHome e sessão.

## 2026-11-11 — xHome: cancelamento durante descoberta regional
- HEAD inicial `f688126367cc2aaf09480c6567b89442cd87c86c`; commits de teste `b623c6d57b0e67c8d18b52d1cb23d6626af13cfa` e `66ee85ed415dde65cc1f189170c574a116ad7f28`; HEAD final será commit de documentação.
- `tests/xhome-discovery.test.cjs`: adicionado nono cenário que aguarda explicitamente início da requisição regional, cancela e libera uma resposta atrasada, validando que consoles/região/horário não reaparecem. Handshake por Promise substitui dependência frágil de microtasks.
- Validação: revisão estática do teste. `node -v` local reportou v22.16.0, mas raw.githubusercontent.com continua inacessível por DNS; não foi possível executar os testes Node com arquivos do repositório neste ambiente. Sem validação real Chrome/Edge, console ou sessão WebRTC.
- Próxima tarefa: verificar resultados do workflow de CI pelo GitHub Actions e corrigir quaisquer falhas dos nove testes; em seguida mapear com fonte verificável a negociação de sessão xHome e sua integração com mídia/controles. Critério: testes verdes comprovados antes de marcar a etapa concluída.

## 2026-11-11 — xHome: distinguir regiões indisponíveis de lista vazia
- HEAD inicial `62e0ca2d3ef9c449922490b4b992f17bf898c669`; commits `4a66e7c3e71dcfdec4a2a43635f23154c2bb337f` e `b1006330f26beb308078387e52b8300e948de2f3`; HEAD final será este registro.
- `nxRemoteDiscover`: ignora objetos de região nulos ou sem `baseUri` string, trata JSON nulo e conta regiões com resposta válida (`results` array). Quando nenhuma região responde corretamente, reporta erro explícito em vez de afirmar que não há Xbox vinculado. Uma lista vazia válida permanece resultado de sucesso.
- `tests/xhome-discovery.test.cjs`: adicionados três casos (região vazia bem-sucedida, todas falhando com HTTP 503, regiões malformadas), totalizando doze cenários escritos.
- Validação: sintaxe integral do userscript via `new Function` PASS; testes Node ainda sem execução confirmada. Ambiente container tem Node v22.16.0, mas `raw.githubusercontent.com` não resolve via DNS; GitHub connector permite ler arquivos, porém não materializa diretamente no container. Sem teste Xbox/Chrome/Edge.
- Próxima tarefa concreta: confirmar execução CI dos 12 testes; corrigir falhas reais e então integrar handshake de sessão xHome com controle rigoroso de origem e estado, sem alterar caminho Cloud Gaming existente.

## 2026-11-11 — xHome: ordenação resiliente a regiões nulas
- HEAD inicial `8ffd2e433e0e99eb501d9cd4c7a4791ddf645ad2`; commits `3c417de582cc7287ac6a099c3cf422e5b136d1b2` e `8149040190fee4fa0a8b72843d512084e9ece6a6`; HEAD final será este registro.
- Corrigida a ordenação de regiões xHome para tolerar entradas `null`/não-objeto sem exceção durante acesso a `isDefault`. A filtragem posterior continua ignorando regiões sem `baseUri` válida.
- Adicionado teste para resposta com região nula e região padrão válida; total de treze cenários escritos em `tests/xhome-discovery.test.cjs`.
- Validação realizada: parse integral do userscript via `new Function` PASS. Não houve execução comprovada dos treze testes em Node ou GitHub Actions, nem testes em Xbox/navegador.
- Próxima tarefa concreta: obter logs do GitHub Actions para o workflow `xhome-tests.yml`, corrigir falhas reais e, após testes verdes, integrar criação de sessão xHome de forma isolada do Cloud Gaming.

## 2026-11-11 — xHome: proteção contra respostas tardias após cancelamento
- HEAD inicial `fccccca60db6c8c2f3fdd60cdb79322d2502510f`; commits `039daf936d65dde7ac73f18a69dc5e8dadf5560f` e `29c8b2f473be43f5004087639ad7d671e4644572`; HEAD final será este registro.
- `NimboXcloud.user.js`: verificação de `requestId` e `AbortController.signal.aborted` após fetch de login, leitura JSON de login, início de cada região, fetch regional e leitura JSON regional; catch regional também propaga cancelamento. Impede mutação de `attempts`, `region` e `consoles` por consultas canceladas.
- `tests/xhome-discovery.test.cjs`: dois testes com promises controladas para cancelamento durante leitura JSON do login e da lista regional; total de quinze cenários definidos.
- Verificação: parse integral JavaScript com `new Function` PASS. Execução Node/GitHub Actions dos testes não confirmada. Sem teste real de conta Xbox, browser ou WebRTC.
- Próxima prioridade: obter resultados verificáveis do CI, corrigir falhas e avançar para criação de sessão xHome após validação de protocolo e autorização, sem alterar caminho de Cloud Gaming.

## 2026-11-11 — xHome: validação de credenciais GSSV e resposta de login
- HEAD inicial `b80877007cde2e985dd7147e8699bb76e379f671`; commits `959c5092607625d05a7bf2d975bb5c1bdf74d4c6` e `c3f7086059129016f45a8bb791c518c11fbef670`; HEAD final será este registro.
- `NimboXcloud.user.js`: token GSSV do cache `xboxcom_xbl_user_info` rejeitado quando `expiration` existente já passou; tokens `Auth.User.*` exigem `relyingParty` exatamente `http(s)://gssv.xboxlive.com/` e continuam exigindo expiração futura. Resposta JSON nula no login xHome agora é tratada como incompleta.
- `tests/xhome-discovery.test.cjs`: harness aceita `localStorage` mock injetável e foram criados três testes (login nulo, token cache expirado, relyingParty de domínio malicioso). Total de dezoito cenários escritos.
- Validação: parse integral do userscript via `new Function` PASS. Tentativa de `git ls-remote` em container falhou por DNS (`Could not resolve host: github.com`). Não há confirmação de testes Node ou GitHub Actions verdes; não há teste real Xbox/Chrome/Edge.
- Próxima tarefa concreta: verificar status CI e executar os 18 cenários em Node com arquivos locais; corrigir eventuais falhas antes de avançar para handshake xHome.

## 2026-11-11 — xHome: criação de sessão opt-in (experimental)
- Commits `9927ad175e670356f0829371c66a6197afa28152`, `45b01e5b80dca35bea8ce16ecd6c83fd467ff728` e `dd206d5967e7707c5ccb499d8bd1b3457d6e6057`.
- Pesquisa: documentação pública `Geocld/XStreaming/docs/3.Stream.md` descreve `POST /v5/sessions/home/play` com `serverId`, `X-MS-Device-Info` e bearer xHome; resposta `sessionId` e estado `Provisioning`, seguida de polling de estado e negociação SDP/ICE. URL: https://github.com/Geocld/XStreaming/blob/main/docs/3.Stream.md. Não foi copiado código AGPL; integração própria implementada com base na descrição de protocolo.
- `NimboXcloud.user.js`: botão explícito de iniciar sessão para console selecionado; novo login GSSV, host regional limitado ao formato `https://<shortName>.core.gssv-play-prodxhome.xboxlive.com`, POST play, validação de sessionId, cancelamento e timeout de 20 s. Tokens apenas em escopo local assíncrono, não no estado serializável. Nenhuma conexão WebRTC é criada nesta etapa.
- `tests/xhome-discovery.test.cjs`: adicionados 3 cenários de criação, origem inválida e HTTP 403; total 21 cenários escritos. Sintaxe integral do userscript validada via `new Function`; testes Node/CI e conexão real Xbox não confirmados.
- PENDENTE para funcionamento real: confirmar CORS/autenticação em Chrome/Edge; polling `/state` até `Provisioned`; configuração, negociação SDP/ICE, RTCPeerConnection, render de vídeo/áudio, data channels de input, keepalive e encerramento DELETE. Não afirmar funcionalidade completa antes de testes reais.

## 2026-11-11 — xHome: polling de estado de sessão
- Commits `5bef716341334808e0f484d0bd5acd5ee7ac2a84` e `721c2b5aef99ff124c47816d193a2d59282fe167`.
- Após POST `/v5/sessions/home/play`, o userscript consulta `GET /v5/sessions/home/{sessionId}/state` no mesmo host regional xHome autenticado, até `Provisioned` (até 12 consultas com 1s entre respostas `Provisioning`), com AbortController e timeout global de 20s. Estados inesperados e erros HTTP falham sem afirmar reprodução.
- Atualizado teste de criação para três chamadas (login, play, state), mais um teste de estado terminal `Failed`; 22 cenários escritos no total. Parse integral JavaScript via `new Function` PASS; testes Node/CI não confirmados.
- Fonte técnica: https://github.com/Geocld/XStreaming/blob/main/docs/3.Stream.md, seção 3.2. Implementação própria, sem copiar código de terceiros.
- PENDENTE: integração WebRTC real (SDP/ICE, RTCPeerConnection, render de vídeo/áudio, canais de controle/input, keepalive, encerramento DELETE), testes autenticados e validação CI. Nenhuma conexão jogável demonstrada.

## 2026-11-11 — xHome: negociação SDP experimental via WebRTC
- Commits `8ffb9741baa0103c006587f338be65e7cabc8c27` e `0c0481b3b0264d34bb8d5050e988ed390a70fbd1`.
- Depois do estado `Provisioned`, se RTCPeerConnection estiver disponível: cria peer isolado, transceivers recvonly áudio/vídeo e datachannel input, gera offer SDP, envia POST `/v5/sessions/home/{sessionId}/sdp` com configuração de canais e busca GET `/sdp` até obter `exchangeResponse` com SDP answer. Aplica `setRemoteDescription` e sinaliza `sdp-ready` (não equivale a conectado).
- Limpeza de peer em cancelamento/falha. Adicionado teste mockado de oferta e resposta SDP, total 23 cenários escritos. Parse do userscript via `new Function` PASS; execução dos testes Node e conexão Xbox real não confirmadas.
- Fonte técnica: https://github.com/Geocld/XStreaming/blob/main/docs/3.Stream.md, seções 3.4–3.7. Implementação própria, sem copiar código AGPL.
- PENDENTE para jogabilidade: ICE candidates (POST/GET `/ice`), monitoramento de estado da conexão, renderização vídeo/áudio, canais de entrada, keepalive e encerramento de sessão; testes autenticados em Chrome/Edge e CI.

## 2026-11-11 — xHome: primeira troca ICE (experimental)
- Commits `ead9dfa6d4a8e088ba507343abb0f0d3cc38711b`, `a40f38a74740ed7db9152187c7c6e8cfabff110a` e `896d905785c12991021a352085d654378e130757`.
- Após SDP answer, RTCPeerConnection coleta candidatos ICE locais com listener instalado ANTES de createOffer, consulta GET `/v5/sessions/home/{sessionId}/ice`, aceita array ou objeto `candidates` e aplica candidatos remotos válidos via `addIceCandidate`. Candidatos locais acumulados são enviados via POST `/ice`; estado do peer reporta `connected`/`failed`/`closed` sem declarar mídia pronta.
- Adicionado teste mockado de candidato ICE remoto; teste SDP anterior atualizado para a chamada GET adicional. Total 24 cenários escritos. Sintaxe do userscript via `new Function` PASS. Node/CI e sessão real não verificados.
- ATENÇÃO: formato JSON exato de ICE do serviço xHome e cadência de trickle ICE não foram validados com captura real; GET único e fila local inicial não cobrem candidatos posteriores. Não há player de vídeo/áudio nem input jogável. Necessário corrigir protocolo e implementar loop de ICE, renderização, controles e teardown antes de considerar Remote Play funcional.

## 2026-11-11 — xHome: reprodução WebRTC local e encerramento
- Commits `7d17b0ca0f89925398444e8a0fc1d107860889b5` e `374637af85d87d544fcbef8609cb72447a3bde56`.
- RTCPeerConnection recebe listener `ontrack` quando `MediaStream` disponível; agrega tracks sem duplicar IDs, associa stream a `<video>` persistente no painel NX com autoplay, playsInline e controles. Play pode ser bloqueado por política do navegador e é tratado sem erro fatal.
- `nxRemoteStop()` fecha peer, interrompe tracks, desassocia player e limpa estado local mesmo após `busy=false`; botão de encerramento local. Não envia DELETE ao servidor Xbox (sessão remota pode persistir).
- Teste novo de encerramento pós-conexão: total 25 cenários escritos. Parse integral do userscript via `new Function` PASS. Execução Node/CI e sessão real Xbox não confirmadas.
- Pendências críticas: troca ICE contínua e formato do protocolo real, controles input via datachannel, fechamento da sessão no servidor, timeout/autoplay e testes em Chrome/Edge. Não declarar Remote Play jogável.

## 2026-11-11 — xHome: ICE contínuo experimental
- Commits `bf523eaf7554b89a75ead793f2d78a5d2802d590` e `bac66f92372be2b8dbf3c9174d9800b85d799fff`.
- Candidatos ICE locais posteriores são enviados por fila serial; polling remoto com deduplicação, limite de 30 ciclos, 1 segundo entre ciclos, e limpeza do timer ao encerrar ou conectar. O polling é agendado somente quando `peer.connectionState` é `new` ou `connecting`.
- Atenção: formato de payload xHome `/ice` ainda não confirmado com sessão real. Falta executar suíte Node e testar conexão real, transmissão de vídeo/áudio e controles. Nenhum Remote Play jogável foi confirmado.

## 2026-11-11 — Prioridade NX: acesso global ao painel e Pointer Lock
- Remote Play pausado a pedido do usuário para corrigir o painel NX. Commits `2ac1ef1e9454814bdb77d25db865f72af4c2410e`, `58a2336c18689acec6d88286c8469ec5e8640a65`, `d6747cc9c65f1a12fcf7a2a5e23d7157483f31dc`, `9920a104940fc533663fb2d894cbe7a7b648116e`.
- v4.12.18: fallback flutuante NX visível durante jogo, menus e carregamento quando a barra nativa estiver ausente ou recolhida; o painel não depende de perfil Xbox/desktop/auto/mobile. Abrir o painel solta Pointer Lock uma vez. Removida interceptação de `Element.prototype.requestPointerLock` e F9 legado que provocava conflitos com recaptura nativa. Teclas e eventos de ponteiro fora do painel são consumidos enquanto aberto, inclusive clique de fechamento.
- Testes de regressão estáticos adicionados em `tests/nx-panel-regression.test.cjs`; workflow roda `node --test tests/*.test.cjs`. Sintaxe JS verificada no editor de atualização; execução CI e teste real Chrome/Edge ainda não confirmados.
- LIMITAÇÃO: não é possível pausar o processamento de gamepad físico do xCloud apenas com bloqueio de eventos DOM; o painel deve evitar interferir nos controles, mas não se pode garantir pausa de jogo. Ao fechar, recaptura do mouse exige gesto do usuário/navegador, sem spam automático. Validar perfis, telas e fullscreen em Chrome/Edge antes de considerar resolvido.

## 2026-11-11 — correção prioritária NX: painel e foco em tela cheia (execução autônoma)
- HEAD inicial observado: `58a2336c18689acec6d88286c8469ec5e8640a65` (v4.12.18); HEAD de código ao validar: `e3c6b786be5f9d635adfe67f0570ca7ee8a919de`. Commits concorrentes anteriores `2ac1ef1`, `58a2336`, `9920a10`, `d6747cc` foram preservados; commit próprio `e3c6b786be5f9d635adfe67f0570ca7ee8a919de`.
- Arquivo modificado: `NimboXcloud.user.js`. Ajuste incremental em `setOpen`: liberar Pointer Lock apenas na transição fechado→aberto, focar cartão do NX para navegação por teclado, salvar/restaurar foco anterior ao fechar, sem tentar recapturar mouse automaticamente. Atalhos existentes e perfis preservados. Acesso nas telas da biblioteca/loading/partida e desativação da interceptação legada de F9 já haviam sido alterados em commits concorrentes, não duplicados.
- Validação REAL nesta execução: parse sintático integral do userscript e arquivo `tests/xhome-discovery.test.cjs` com `new Function`: PASS. Nenhum teste Node, Chrome/Edge, xCloud real ou teste de pointer lock executado; a análise de sintaxe não comprova execução funcional. Sem novas dependências, hooks de gamepad ou interceptadores.
- Riscos: o site pode tentar recapturar Pointer Lock automaticamente; soltar captura não bloqueia por si só os comandos do gamepad que o xCloud lê diretamente. Em fullscreen nativo de elemento `video`, o navegador pode não permitir sobreposição DOM. Não prometer supressão total de entrada ou ausência de prompt até teste real.
- xHome: permanece experimental; descoberta, sessão, SDP, ICE e player sem teste autenticado; controles Remote Play ainda pendentes. Usuário priorizou corrigir NX antes de retomar xHome.
- **Próxima tarefa concreta:** criar teste de regressão automatizado para abertura/fechamento do NX (atalho Ctrl+Shift+H, Escape, fullscreen em contêiner, foco, Pointer Lock, perfis e remount React) com DOM simulado, e executar Node; aceite: zero erros, menu acessível na biblioteca e loading, nenhuma recaptura pelo NimboXcloud e nenhuma duplicação de launcher. Validar posteriormente em Chrome/Edge com sessão real.

## 2026-11-11 — NX: calibracao de imagem sem acumulo de filtros
- v4.12.19. Commits `1cb8fdebfa8b22d8b2b0fa6409d70a007c619767`, `35aaedd1d060a591948cbe8e6b5e56c5dff15e18`, `105f337cc62ec6c3105c0607b3870ea8a7629ef0`.
- A antiga nitidez era contraste adicional e podia estourar realces; substituida por controles moderados de brilho (85–115%), contraste (85–115%) e saturacao (75–125%). Presets Original/Equilibrado/Vivido substituem valores sem empilhar filtros. Manual preserva base ao mudar de preset; atalhos legados migrados para ajustes suaves. Restaurar Original remove filtro NX e preserva filtro inicial do site.
- Novos testes estaticos em `tests/nx-video-calibration.test.cjs`, workflow ja executa glob de testes. Parse JS confirmado; testes Node e validacao visual real ainda pendentes.
- Limitacao: filtros CSS nao recuperam informacao perdida no streaming nem ajustam brancos/pretos independentemente. Para controle separado de niveis ou nitidez real sera necessario pipeline WebGL/WebGPU com custos de latencia e desempenho a medir.

## 2026-11-11 — NX Visual Studio: biblioteca portatil v1
- v4.12.20, commits `878c7984e49722f56914e5be8c5b79226ec5111a` e `017ffb3e85a9bd1b31ba8d614f9853952b1f7de9`.
- Biblioteca de ate 24 perfis locais, salvar perfil, exportar JSON e importar arquivo JSON limitado a 16 KB, esquema `nx-visual-preset` v1 validado com allowlist numerica. Aplicacao de perfil usa filtros CSS unicos existentes; reset original continua disponivel. Sem codigo executavel nos arquivos.
- Adicionados testes de regressao do schema e rejeicao de entradas invalidas. Sintaxe do userscript verificada e sanitizacao exercitada com dados validos/invalidos; execucao completa do workflow e teste de interface ainda nao confirmados.
- Proximas etapas: curvas RGB e sombras/realces por shader, LUTs 3D, nitidez espacial (CAS/unsharp), GPU upscale experimental, preview antes/depois, e integracao comunitaria via site futuro. Nao anunciar estes recursos como implementados.

## 2026-11-11 — GPU experimental WebGL2 v4.12.21
- Commits `4d3ab15b51c22bfc10e06c6ca09a9a955b8da326`, `22382ef18ed83ed04ea83d78d7331dbdf47ef894`, `7e0ae35f182b10e86575ffeb26febb325229a688`.
- Pipeline opt-in WebGL2 renderiza video em canvas sobreposto sem alterar a fonte, com brilho/contraste/saturacao e curvas suaves independentes de sombras/realces; fallback para video nativo em erro de captura/contexto, desativacao e aba oculta. Remove CSS NX enquanto GPU ativa; restaura CSS ao desativar. Controles em NX > Midia > Imagem.
- Testes estaticos de regressao adicionados; sintaxe do script validada. **Ainda sem teste real de captura de video, desempenho, fullscreen ou compatibilidade com DRM/CORS**. Se houver video preto ou atraso, desligar GPU no painel ou ajustar `localStorage['nx.visual.gpu.v1']='0'` e recarregar.
- Proximos passos: teste real Chrome/Edge Android/desktop, medir FPS/latencia, otimizar uploads, LUTs, curvas RGB, nitidez e upscale somente apos validacao.

## 2026-11-11 — Audio Web Audio v4.12.22
- Commits `e8dd13e1c6f695d140aff7a987bcc4bb4ee9945a`, `75ef5e43e1f9fc12fe70ebc03b4fd96889cf413b`.
- Seleciona audio tracks WebRTC vivos e fontes em reproducao, adiciona botao de ativacao por gesto para AudioContext.resume, informa estado real running/suspended/closed no diagnostico, neutraliza grafos antigos ao trocar elemento de streaming e evita reinicializacao desnecessaria no polling.
- Sintaxe JS verificada; testes estaticos adicionados, mas validacao auditiva real no Chrome/Edge, compatibilidade com audio separado em outras fontes e comportamento de bypass de MediaElementSource permanecem pendentes. Nao afirmar que equalizacao ja foi ouvida e confirmada.

## 2026-11-11 — Bluetooth Android e diagnostico de sinal v4.12.23
- Commits `0f3e02f02dbe36838beecab76d1d23b5ac6160af` e `4f83e40ae925766d8d303878545f8194525e1f2d`.
- Saida padrao do sistema e explicitamente indicada como rota Bluetooth no Android; selecao manual fica desabilitada se `setSinkId` nao for suportado, com status explicativo. Um AnalyserNode entre a fonte Web Audio e as dez bandas mede o sinal de entrada e diferencia silencio/ausencia de sinal, AudioContext suspenso e equalizador desconectado. Testes estaticos adicionados.
- **Nao comprovado em dispositivo real**: o navegador pode nao expor dispositivos Bluetooth nem permitir capturar audio do xCloud em MediaElementSource. O analisador identifica ausencia de sinal, mas nao contorna restricoes de DRM/CORS nem garante que o som passa pelo grafo.

## 2026-11-11 21:40 UTC — xHome: cancelamento de polling ICE
- HEAD inicial observado: `930e0bc540ca4cfce86de610cc43f56196677b95`; commit de código: `a6088825f65db7cd330258bff78806dc485c9405`; HEAD de documentação: commit subsequente a este registro (consultar main).
- Arquivo alterado: `NimboXcloud.user.js` v4.12.23. Auditoria encontrou GET periódico de ICE sem `AbortController.signal` e reagendamento mesmo com peer em estado `failed` ou `closed`. Corrigido para propagar cancelamento à requisição e reagendar somente quando peer estiver `new` ou `connecting` e operação não tiver sido abortada. Nenhuma alteração de credenciais, interceptadores, entradas ou Cloud Gaming.
- Testes realmente executados: parse sintático integral via `new Function(userscript)` PASS; conferência de substituições únicas PASS; HEAD/blob relidos antes do commit PASS. Não executados Node test runner, lint, Chrome/Edge, console Xbox ou streaming real. Suíte existente `tests/xhome-discovery.test.cjs` foi inspecionada, não executada.
- Risco pendente: chamadas `addIceCandidate` em andamento ainda exigem revisão de cancelamento e o formato ICE/SDP xHome não foi validado em Xbox real. `nxRemoteStop` fecha somente o peer local, sem DELETE de sessão no servidor; isso pode deixar sessão xHome ativa. Tratar como prioridade antes de declarar conexão funcional. A captura real de áudio/vídeo e input continua não comprovada.
- Próxima tarefa concreta: implementar encerramento remoto autenticado com DELETE para sessão xHome usando contexto de autenticação efêmero e tratamento de erros, sem persistir bearer nem interferir no Cloud Gaming. Critérios: teste mockado de sucesso/401/timeout/cancelamento, nenhuma credencial em relatórios, encerramento local sempre garantido e parse/testes Node aprovados.

## 2026-11-11 22:41 UTC — auditoria autônoma xHome, sem alteração de código
- HEAD inicial observado diretamente: `51055c8215e6877b6f95f624073710c1cccf03cd`; blob userscript `658a3fa3695c3427cb7670453f7e952bfe2c215a`, versão 4.12.29. HEAD final antes do commit documental: `51055c8215e6877b6f95f624073710c1cccf03cd`; HEAD final após commit: consultar main (commit do roadmap).
- Auditoria direta: `nxRemoteStartSession()` bloqueia somente `busy` e falta de `selectedId`, não bloqueia uma segunda sessão quando `sessionId` já está definido; o botão de iniciar é desabilitado apenas por `busy`. `nxRemoteStop()` encerra somente a conexão local; o botão de encerramento só aparece com `mediaStream`, deixando sessões provisionadas sem mídia sem botão de parada. O `catch` de inicialização mantém `sessionId` após falha e não encerra todas as tracks locais. Há mensagens desatualizadas na UI que afirmam que WebRTC ainda não foi implementado apesar de SDP/ICE experimentais presentes.
- Tentativas de alteração nesta execução foram interrompidas ANTES de qualquer commit por falha de correspondência exata dos trechos (nenhuma alteração de código publicada). Não confundir inspeção estática com testes: Node, lint, CI, Chrome, Edge, Xbox e streaming NÃO executados.
- Riscos: criação duplicada pode deixar sessões xHome órfãs; falta de DELETE remoto autenticado; negociação e formato ICE sem validação real. A prioridade de encerramento remoto do ciclo anterior continua válida.
- **Próxima tarefa concreta:** corrigir guardas contra sessão duplicada, exibir encerramento local sem depender de `mediaStream`, limpar `sessionId`/tracks em falha e adicionar regressões mockadas. Aceite: uma única sessão ativa por vez, botão de parar acessível antes de mídia, falha não retém sessão local, sintaxe e testes Node aprovados. Depois implementar DELETE autenticado sem armazenar bearer.

## 2026-11-11 23:32 UTC — xHome: guardas e encerramento local acessível
- HEAD inicial observado na main: `d27ec475ca7e68b7cfc44f49bb141f2abb26c030` (v4.12.37). Commit de código: `898daff08595baf9453824bb36cdee1d9785ef04`. HEAD imediatamente antes do commit documental: `898daff08595baf9453824bb36cdee1d9785ef04`; HEAD final será o commit deste roadmap.
- Arquivo de código alterado: `NimboXcloud.user.js`. `nxRemoteStartSession` agora recusa iniciar se já existir `sessionId` ou `peer`, além de `busy`; botão Iniciar acompanha a guarda. Botão Encerrar sessão local aparece assim que existe sessão, peer ou stream, inclusive antes da primeira trilha de vídeo. Falha de inicialização interrompe tracks existentes, zera `mediaStream` e `sessionId`, e atualiza textos de UI desatualizados sobre negociação WebRTC.
- Validações realmente executadas: parse integral do userscript com `new Function` PASS antes e após publicação; inspeção de cinco invariantes estáticos PASS; HEAD relido imediatamente antes da escrita. Não executados testes Node, build, lint, CI, Chrome/Edge, Xbox físico ou streaming real (ambiente sem acesso ao navegador de jogo e download externo indisponível). Não houve alteração de interceptadores fetch, `navigator.getGamepads`, entrada ou credenciais.
- Limitação: `nxRemoteStop` ainda fecha somente a sessão local; falta DELETE remoto autenticado, sem persistir bearer. Não há prova de mídia nem controles jogáveis. Cancelamento da descoberta e sessão permanece no fluxo existente.
- **Próxima tarefa concreta:** implementar encerramento remoto autenticado por DELETE usando contexto de sessão efêmero e abort/timeout separados, preservando limpeza local mesmo em HTTP 401, falha de rede ou timeout. Aceite: mocks de sucesso/401/timeout/cancelamento, sem credenciais persistidas ou em logs, Node tests PASS e nenhuma regressão na criação/descoberta xHome.

## 2026-11-12 00:40 UTC — xHome: proteção da sessão ativa durante redescoberta
- HEAD inicial observado via busca de commits: `c86b124a0a2690db777ae756477e8a697a0b241a`; commit de código: `30e6337b4350d53e6d95d57a0786c7ecff0c7036`; HEAD antes deste registro: `30e6337b4350d53e6d95d57a0786c7ecff0c7036`; HEAD final: commit documental gerado por esta atualização. Userscript v4.12.44.
- Arquivo alterado: `NimboXcloud.user.js`. A descoberta de consoles (`nxRemoteDiscover`) agora é recusada quando há `sessionId`, `peer` ou `mediaStream` ativo, além de `busy`. O botão "Buscar meus consoles" acompanha a guarda. Isso evita limpar `selectedId`/região e invalidar o estado de uma sessão xHome ativa ao consultar novamente. Sem alteração de credenciais, transporte, interceptadores, entradas ou fluxo Cloud Gaming.
- Validações realmente executadas: leitura direta do script e roadmap no GitHub; comparação de HEAD imediatamente antes do commit; três assertivas estáticas das guardas PASS. **Não executados:** parse JS em Node, suíte Node, lint, CI, Chrome/Edge, Xbox físico e streaming real. Alteração textual isolada; testes de comportamento ainda necessários.
- Auditoria adicional: `nxRemoteCancel()` continua encerrando a sessão local quando `busy` está ativo, comportamento adequado para cancelar inicialização, mas o servidor remoto não recebe DELETE. `nxRemoteStop()` apenas limpa recursos locais. Não declarar Remote Play funcional até autenticação, ICE, mídia e controles reais serem confirmados.
- Risco novo: o botão de descoberta fica indisponível durante sessão ativa; o usuário precisa encerrar a sessão antes de consultar consoles novamente. É intencional para preservar integridade do estado.
- **Próxima tarefa concreta:** implementar encerramento remoto xHome autenticado com DELETE de `/v5/sessions/home/{sessionId}`, usando contexto efêmero de autenticação e timeout próprio, sempre limpando estado local; antes confirmar o contrato do endpoint no código MIT de referência. Critérios de aceite: mocks para 204/401/timeout/cancelamento; zero bearer em storage/logs; nenhuma regressão em descoberta e início; Node test runner PASS.

## 2026-11-12 01:41 UTC — xHome: proteção contra respostas ICE tardias
- HEAD inicial observado diretamente na main: `ce31ca480ea83487464ccec35db52a4d3b15d7b9`; versão inicial 4.12.51; commit de código `2bca65fa53496c97631bd948c83974ba01a92fba` (4.12.52). HEAD antes da atualização documental: `2bca65fa53496c97631bd948c83974ba01a92fba`. HEAD final: commit deste roadmap.
- Arquivo alterado: `NimboXcloud.user.js`. O polling remoto ICE agora verifica cancelamento antes/depois das respostas assíncronas, verifica identidade do peer e estado de sinalização antes de adicionar candidatos, e não exibe erro de ICE causado por cancelamento voluntário. Evita processamento de resposta atrasada depois de Stop/Cancel. Não modifica autenticação, codecs, controles, hooks ou interceptadores.
- Validação REAL: leitura direta de userscript e roadmap, busca de commits, inspeção do fluxo xHome; parse JavaScript integral com `new Function(source)` PASS antes do commit; quatro alterações textuais de ocorrência única PASS; HEAD relido antes da gravação PASS. Não executados Node CLI, testes de regressão existentes, lint, CI, Chrome/Edge, Xbox físico ou streaming real. A verificação sintática não substitui testes de comportamento.
- Auditoria: o encerramento local `nxRemoteStop()` continua sem DELETE remoto; `nxRemoteCancel()` também não libera a sessão no servidor após provisionamento. A negociação WebRTC e mídia continuam experimentais. `package.json` não existe na raiz (404), portanto localizar os workflows/testes antes de afirmar build.
- Risco: chamadas `addIceCandidate()` já iniciadas não podem ser revertidas; fechamento do peer é protegido pelo requestId e pelo sinal de cancelamento, mas requer mocks de corrida. A alteração não comprova suporte real do Xbox.
- **Próxima tarefa concreta:** confirmar contrato de DELETE xHome no upstream MIT e implementar encerramento remoto autenticado com token efêmero, timeout separado e limpeza local incondicional. Critérios de aceite: testes mockados 204/401/timeout/cancelamento, nenhuma credencial em storage/logs, sintaxe e Node tests PASS, preservação de descoberta e sessão Cloud Gaming.

## 2026-11-12 02:38 UTC — consistência de versão e auditoria xHome
- HEAD inicial: `564974ab341ebd3b4fd4c93f35d24a4e5e48d4bc` (userscript metadata v4.12.54; constante interna VER ainda 4.12.53). Commit de código: `88c0e9a70906f5bc97999910fba8eb79777c0af1`. HEAD antes deste registro: `88c0e9a70906f5bc97999910fba8eb79777c0af1`. HEAD final: commit documental desta entrada (consultar main).
- Alterado `NimboXcloud.user.js`: alinhada constante interna `VER` com `@version 4.12.54` e URL `@require ...nx_version=4.12.54`. Não alterados transportes, autenticação, dados, hooks, HUD ou entrada. A divergência podia exibir versão errada em diagnósticos e comprometer rastreabilidade.
- Validação executada: leitura direta de código e roadmap, comparação de commits desde `6127a9e`, checagem de versão e parse integral do JavaScript por `new Function(source)` PASS; HEAD relido antes do commit. Não executados Node CLI, testes automatizados, lint, CI, Chrome/Edge, Xbox real nem streaming.
- Auditoria xHome: `nxRemoteStop` e `nxRemoteCancel` ainda não enviam DELETE remoto, apesar de haver `sessionId`; `nxRemoteStartSession` usa credencial `gsToken` efêmera em escopo local e provisiona `/v5/sessions/home/play`. O contrato de encerramento precisa ser confirmado antes de implementar. O fluxo atual pode deixar sessão remota órfã após Stop, Cancel ou falha. Nenhuma evidência nova de mídia ou controles reais.
- Estrutura: `package.json` ausente na raiz (404); módulo touch externo referenciado em `@require`; suíte de testes ainda requer execução em ambiente Node. Risco: versão interna alinhada não comprova execução no navegador.
- **Próxima tarefa concreta:** verificar contrato e autenticação do DELETE xHome em fonte MIT confiável, implementar encerramento remoto best-effort com token efêmero e timeout separado e limpeza local incondicional. Aceite: testes mockados 204/401/timeout/cancelamento, sem bearer persistido/logado, parse e testes Node PASS e ausência de regressão em descoberta/início.


## 2026-11-12 04:00 UTC — xHome: encerramento remoto autenticado e suíte de regressão verde
- SHA inicial da execução: `1859a26e52564b459d3ceaef18380469b1b486db`. SHA final de código/testes antes deste registro: `8185df88df2a3179b2ff82925f3d8bb0c262c432`. Versão publicada: `4.12.62`. O commit deste registro documental será o HEAD seguinte.
- Commits publicados nesta execução:
  - `92bc1ebe6192a46f0cd849407338154415aa5cd4` — alinhamento dos testes antigos com a arquitetura atual (Pointer Lock nativo, perfis de identidade suspensos, filtros de vídeo, medição de áudio e fallback do painel NX).
  - `4af54506af643616b82f4065fd2879e4ec1c8f39` — correção de uma asserção de teste que confundia `navigator.userAgent ===` com atribuição.
  - `4fabda6d8a94072eb6829b6caa38155d82c980cd` — encerramento xHome remoto por DELETE autenticado.
  - `f688a233ea1fd9271a63ba995fc3fc639fcfa5cf` e `8185df88df2a3179b2ff82925f3d8bb0c262c432` — regressões de teardown, cancelamento e falha após provisionamento.
- Fonte de protocolo: a documentação pública de `Geocld/XStreaming`, seção 3.11, descreve `DELETE https://<region>.core.gssv-play-prodxhome.xboxlive.com/v5/sessions/home/{sessionId}`, com bearer de sessão e sem corpo de resposta: https://github.com/Geocld/XStreaming/blob/main/docs/3.Stream.md. O repositório XStreaming declara AGPL-3.0; foi usada somente a descrição documental do protocolo. Nenhum código AGPL foi copiado ou incorporado.
- `NimboXcloud.user.js`:
  - versão `@version`, constante interna `VER` e parâmetro `@require nx_version` alinhados em `4.12.62`;
  - adicionado `nxRemoteDeleteSession()`, com região limitada a `[a-z0-9]{2,12}`, sessionId validado, host regional fixo, `Authorization: Bearer`, `redirect:'error'` e timeout independente de 8 segundos;
  - `nxRemoteStop()` agora encerra peer, vídeo, timer e tracks localmente antes de aguardar DELETE remoto. HTTP 404/410 é tratado como sessão já ausente; falha HTTP/rede/timeout não desfaz a limpeza local;
  - bearer xHome fica em variável de fechamento `nxRemoteSessionToken`, fora de `nxRemotePlay`, sem persistência ou inclusão no estado serializável;
  - quando o DELETE não é confirmado, a sessão pendente fica somente em memória e a interface oferece `Tentar liberar sessão remota`; novas descobertas/inícios ficam bloqueados até liberação confirmada;
  - cancelamento durante o POST de criação é diferido até receber o sessionId; em seguida envia DELETE, evitando perder um identificador já criado. Falhas posteriores à criação também tentam DELETE automaticamente.
- Testes/arquivos afetados:
  - `tests/xhome-discovery.test.cjs`: cinco novos cenários para DELETE 204, HTTP 401 com retry, timeout e limpeza de tracks, cancelamento durante POST e falha após criação; teste de falha de provisionamento atualizado para exigir DELETE.
  - Atualizados `tests/baseline.test.cjs`, `tests/console-ua-regression.test.cjs`, `tests/media-p04.test.cjs`, `tests/nx-bluetooth-audio.test.cjs`, `tests/nx-panel-regression.test.cjs`, `tests/pointer-lock-flag.test.cjs` e `tests/pointer-lock-policy.test.cjs`. Os testes estavam presos a implementações antigas removidas; foram substituídos por invariantes do comportamento atual, não desativados.
  - `DEVELOPMENT_ROADMAP.md`: referência de versão e handoff atualizados.
- Validação real via GitHub Actions no SHA `8185df88df2a3179b2ff82925f3d8bb0c262c432`:
  - workflow `NimboXcloud baseline`, run `43151779714`: PASS; `node --check NimboXcloud.user.js`, 110 testes (107 PASS, 3 TODO, 0 FAIL) e `node tools/static-risk-report.cjs` concluídos com sucesso;
  - workflow `NimboXcloud regression tests`, run `43151779746`: PASS; sintaxe e os mesmos 110 testes (107 PASS, 3 TODO, 0 FAIL).
  - Não existe `package.json` na raiz; não há build/lint npm configurado. Não executados Chrome, Edge, autenticação real xHome, Xbox físico ou streaming real.
- Auditoria de hooks: o relatório estático lista padrões de Gamepad API nas linhas de instalação/restauração do mesmo bridge, além de um wrapper de `fetch` e um observador XHR. A leitura do código confirma um único bridge ativo de `navigator.getGamepads` com restauração do descriptor, um wrapper de fetch e um wrapper de XHR; o módulo Touch HUD não instala outro getGamepads. Nenhum novo interceptador foi adicionado.
- Riscos e hipóteses ainda não validados: o contrato DELETE vem de documentação comunitária XStreaming e precisa de confirmação com uma sessão Xbox real; respostas 401/403/5xx ainda não foram verificadas contra o serviço atual. O retry e o bearer pendente existem somente em memória: recarregar a página perde o contexto de retry e o servidor pode manter a sessão até expirar. Se o POST de criação for aceito pelo servidor, mas a conexão cair antes de entregar o sessionId, o cliente não tem identificador para enviar DELETE. A negociação ICE/SDP, keepalive, áudio/vídeo e comandos ainda não foram comprovados em Xbox real; o data channel `input` ainda não transmite comandos jogáveis.
- Concluído nesta etapa: contrato de DELETE documentado; encerramento remoto best-effort implementado; limpeza local incondicional; retry em memória; cancelamento diferido durante criação; suíte CI voltou a verde.
- Pendências gerais: validar DELETE com conta/console reais; cobrir 403/404/410/500 e idempotência de Stop; confirmar formato ICE/trickle e keepalive; renderizar mídia real; implementar mensagens do data channel para controle físico/touch; testar reconexão e regressões no Chrome/Edge. Remote Play continua experimental e não deve ser descrito como jogável.
- **Próxima tarefa concreta:** completar a matriz de regressão do teardown xHome para HTTP 403, 404, 410, 500, falha de rede, timeout, Stop repetido e retry repetido; manter uma única tentativa de DELETE por sessão e provar que 404/410 são idempotentes. Critérios de aceite: todos os casos mockados PASS nos dois workflows, limpeza local em todos os resultados, sessão pendente bloqueando novo start até liberação, nenhum bearer em estado/storage/logs e nenhuma alteração no fluxo Cloud Gaming. Depois, executar validação real de DELETE com Xbox quando o ambiente permitir.

## 2026-11-12 — xHome: matriz de teardown e proteção contra Stop repetido
- SHA inicial desta execução: `7c42850811826dd2e6f705413ef2ee96261ae6b2` (main consultada diretamente; versão 4.12.62). SHA antes desta atualização documental: `aa3ce59018c28fff3f4a16326daa70fe9a476159`. O commit deste registro passa a ser o HEAD final.
- Commits funcionais/documentais desta execução:
  - `9a42c3defffaa2388c7b92d99fc672a98ff2d9fd` — `nxRemoteStop()` agora detecta `nxRemotePendingRelease` antes de alterar o estado. Um segundo Stop não apaga a mensagem/erro de liberação pendente, não limpa o contexto do retry e não emite um DELETE duplicado.
  - `01af19c11079c52e56c05f20b113c59a7a407a8d` — adicionados sete cenários de regressão em `tests/xhome-discovery.test.cjs`: HTTP 403 e 500 com retry; HTTP 404 e 410 como já encerrado/idempotente; falha de rede com retry; Stop repetido durante pendência; e duas chamadas de retry concorrentes limitadas a um DELETE.
  - `c1871d1bca6f79bca424be2a5e471c90156b5476` — versão `@version`, constante interna `VER` e parâmetro `@require nx_version` alinhados em 4.12.63.
  - `aa3ce59018c28fff3f4a16326daa70fe9a476159` — histórico de alterações atualizado.
  - `61a050d2f6b3e0d603040e70c1c3cd40face17f7` — matriz de decisões registra retomada técnica autorizada, mantendo a UI oculta.
  - `7b4c6c61a75758541b637f50948686bd076d0b5e` e `4f39d69b880a2b211ed93c137415b921696e05ce` — README em português e inglês deixam de classificar xHome como inexistente/congelado e passam a descrevê-lo como experimental e não homologado.
  - `28b2d9ee1819399b6fa4cc480a8dca7b52196f5e` — roadmap público sincronizado.
  - `2f8e285c347415aeb121f2176ffc6b4f5e92af57` — changelog registra a sincronização documental.
- Arquivos alterados: `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md`, `README.md`, `README_EN.md`, `docs/PROJECT_STATUS_AND_DECISIONS.md`, `docs/ROADMAP.md` e este `DEVELOPMENT_ROADMAP.md`. Nenhuma mudança em gerenciadores de entrada, HUD Touch, interceptadores globais, autenticação de Cloud Play ou preferências locais.
- Auditoria do estado atual: a pendência remota fica em `nxRemotePendingRelease` no escopo do módulo, com o bearer fora de `nxRemotePlay` e sem persistência. Descoberta e novo start continuam bloqueados enquanto houver liberação pendente. O novo guard de Stop preserva esse fluxo e o botão explícito de retry. 404/410 continuam tratados como sessão já ausente; demais HTTP, timeout e falha de rede mantêm retry.
- Validação realmente executada nesta execução: leitura direta do HEAD, commits, diff do commit de testes, código xHome, suíte e roadmap; conferência de que as três referências de versão passaram a 4.12.63; inspeção estática dos sete novos cenários e do guard. **Não executados:** `node --check`, `node --test`, lint/build, browser, Chrome/Edge, Xbox real ou streaming. A consulta de status combinado do commit de versão retornou lista vazia; a ferramenta de workflow disponível neste contexto não lista execuções de push, portanto CI desta alteração permanece **não verificado**, não aprovado.
- Resultado esperado, ainda a confirmar por execução: 403/500 e rede devem manter a sessão remota pendente e permitir retry; 404/410 devem finalizar sem retry; Stop repetido não deve alterar o aviso nem emitir DELETE adicional; retry concorrente deve emitir apenas uma requisição. Não marcar a matriz como concluída até os testes executarem.
- Riscos conhecidos mantidos: `nxRemotePendingRelease` e o bearer existem apenas em memória; recarregar a página perde o contexto de retry, podendo deixar a sessão remota ativa até expirar no servidor. O contrato DELETE ainda carece de validação autenticada com Xbox real. A negociação ICE/SDP, mídia e comandos do canal `input` continuam sem comprovação de transmissão e controles jogáveis. Não houve alteração desses fluxos nesta execução.
- Concluído: correção de estado em Stop repetido; cobertura de testes adicionada; release 4.12.63 e changelog atualizados.
- Pendências restantes: confirmar os novos testes nos workflows baseline/regression; validar DELETE com console/conta reais; investigar recuperação segura após reload sem persistir bearer; comprovar ICE, áudio/vídeo, comandos de controle e reconexão.
- **Próxima tarefa concreta:** obter e verificar a execução dos workflows baseline e regression no commit `c1871d1bca6f79bca424be2a5e471c90156b5476` (ou no HEAD documental subsequente), corrigindo qualquer falha antes de avançar. A documentação pública também foi alinhada: a retomada foi autorizada, mas a aba xHome permanece oculta até homologação. Critérios de aceite: `node --check` e todos os testes da suíte PASS em ambos os workflows; 403/500/rede/timeout deixam retry utilizável; 404/410 são idempotentes; Stop/retry concorrentes produzem no máximo um DELETE por tentativa; nenhum bearer aparece em estado exportável, storage ou logs. Depois disso, a próxima etapa funcional é validação do DELETE em Xbox real.


## 2026-11-12 05:45 UTC — xHome: bootstrap dos data channels WebRTC
- SHA inicial desta execução: 09d52dfe0ba7b57ab9cef9dd9f6b7a867a46d005 (main consultada diretamente; userscript 4.12.63). Commits de implementação: 4258c08024fadb522c12c2f7fb9553b200c5ec9c (código 4.12.64) e c61a13f5689429a00b00f775e7d26c24e07b7063 (teste de handshake). Commit do changelog: d77558788de49235c5b1d38e6cc59270ef336228. O commit deste registro documental passa a ser o HEAD final.
- Arquivos alterados: NimboXcloud.user.js, tests/xhome-discovery.test.cjs, CHANGELOG.md e este documento.
- Descoberta técnica: o código anterior criava somente input com ordered:false, sem protocolo, sem handlers e sem handshake. Isso não correspondia ao cliente de referência. A inspeção direta do Better xCloud src/utils/xhome-interceptor.ts confirmou o roteamento/ajustes HTTP do xHome; a inspeção do Xbox XCloud Player confirmou quatro canais: chat/chatV1, control/controlV1, input/1.0 e message/messageV1. O package.json do Xbox XCloud Player declara MIT. Foram adaptados apenas nomes/opções e formas públicas das mensagens de bootstrap; nenhum cliente completo ou código AGPL foi incorporado.
- Implementação em NimboXcloud.user.js v4.12.64:
  - cria os quatro canais, todos ordenados e com seus protocolos explícitos;
  - o canal message envia o handshake messageV1 e aguarda HandshakeAck;
  - somente depois de todos os canais estarem abertos, envia autorização controlV1, os eventos iniciais de registro do gamepad, o pacote binário inicial ClientMetadata no canal input e seis mensagens de configuração de sessão;
  - adiciona dataChannelsReady e status explícito de que o envio de comandos ainda não foi implementado;
  - fecha os canais em Stop, Cancel e falha de inicialização. Não adiciona outro hook de navigator.getGamepads, outro wrapper de fetch/XHR ou outro polling de gamepad.
- Teste novo em tests/xhome-discovery.test.cjs: verifica os quatro nomes/protocolos/opções, ordem handshake → HandshakeAck → autorização/configuração, conteúdo do pacote metadata (15 bytes, report type 8), ausência de bearer nos dados enviados e fechamento dos canais no Stop.
- Validação real via GitHub Actions no commit de teste c61a13f5689429a00b00f775e7d26c24e07b7063:
  - Regression tests, run 43163307224: PASS; node --check, node --test tests/*.test.cjs; 118 testes, 115 PASS, 0 FAIL, 3 TODO.
  - Baseline, run 43163307321: PASS; sintaxe, os mesmos 118 testes e node tools/static-risk-report.cjs.
  - Os commits posteriores alteraram apenas documentação; o código/testes validados permanecem idênticos no HEAD atual.
- Avisos não bloqueantes nos logs: dependência Node punycode depreciada; actions/checkout@v4 e actions/setup-node@v4 usam runtime Node 20, que o runner já sinaliza como depreciado/forçado para Node 24. Não houve falha nos jobs.
- Escopo/limitações: nenhum frame de gamepad, teclado, mouse ou toque é enviado. O canal input recebeu somente metadados iniciais; o canal chat foi criado, mas microfone não foi iniciado; touchInputEnabled permanece false. Não há prova de áudio/vídeo, conexão ICE funcional ou comandos jogáveis em Xbox real. O recurso continua experimental e a interface segue oculta.
- Auditoria de compatibilidade web: o userscript mantém @match https://play.xbox.com/*. A documentação Microsoft distingue o cliente estável xbox.com/play da experiência de prévia play.xbox.com; a versão estável não é coberta por este match. Não foi ampliado o escopo porque a arquitetura atual foi desenvolvida para a prévia e o cliente estável precisa de auditoria DOM/API própria. Fonte: https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/game-streaming-web-content-test-application-xbox-com-play.
- Riscos novos: se algum dos quatro canais nunca abrir ou o HandshakeAck não chegar, o bootstrap não se completa e não há timeout/retry específico de handshake ainda. A sessão pode continuar em estado ICE pendente sem comandos. A confirmação real do protocolo e do accessKey continua dependente de uma sessão autorizada com console físico.
- Concluído: verificação dos workflows que estavam pendentes; bootstrap de quatro data channels; teste automatizado de handshake e teardown; versão/changelog 4.12.64.
- Pendências: implementar frames binários de gamepad usando o bridge único já existente; depois mouse/teclado e touch; tratar vibração; adicionar timeout/telemetria sanitizada do handshake; validar sessão, mídia e comandos em Xbox real; avaliar separadamente compatibilidade com xbox.com/play; atualizar Actions para runtimes suportados sem warnings.
- Próxima tarefa concreta: integrar o gamepad físico ao canal input reutilizando o bridge/estado de gamepad já existente no NimboXcloud, sem novo override de navigator.getGamepads nem polling concorrente. Critérios de aceite: teste binário determinístico para todos os botões, D-pad, triggers e quatro eixos; teste de neutralização/disconnect e de liberação dos botões ao encerrar; frames só enviados após os quatro canais e HandshakeAck; nenhum bearer em estado/storage/logs; node --check e ambos workflows PASS; nenhuma alteração no caminho de entrada do Cloud Gaming. Não declarar controle jogável até teste real com Xbox.


## 2026-11-12 — xHome: timeout e falhas dos data channels
- SHA inicial consultado diretamente: `193b2d125853f4b4a36afcd41d3f914de132b6b0`; userscript inicial `4.12.64`.
- Commits desta execução: código `bb460ff7d230e2c6bfd9a182842a0bf28f01625e`; testes `587d60ad065766bf4abe59f737939ab7da49ae6f`; changelog `b811268a3da65e26e3f0d26e844e9c5460fe8bbb`. O commit que adiciona esta entrada é o HEAD documental final desta execução.
- Auditoria do handoff anterior: o bootstrap criava quatro canais e aguardava `HandshakeAck`, mas não tinha timeout, handlers `onerror/onclose` nem teardown quando a inicialização falhava. Assim, um canal que nunca abrisse poderia deixar a sessão presa em `ice-pending`; um canal fechado depois do ACK poderia deixar `dataChannelsReady=true`.
- Correção em `NimboXcloud.user.js` v4.12.65:
  - timeout de 12 segundos cobrindo abertura dos quatro canais e HandshakeAck;
  - cancelamento do timer após bootstrap completo e durante Stop/Cancel;
  - erro ou fechamento inesperado de qualquer canal encerra os recursos locais e chama o fluxo de liberação remota já existente;
  - falha ao enviar Handshake ou ao enviar mensagens de bootstrap usa o mesmo teardown;
  - o estado `dataChannelsReady` volta a false no teardown.
- Testes adicionados em `tests/xhome-discovery.test.cjs`: timeout sem HandshakeAck fecha os canais e peer; fechamento inesperado do canal input após ACK derruba a sessão; handshake bem-sucedido cancela o timer.
- Arquivos alterados: `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md` e este documento.
- Referência técnica: estruturas de canal e lifecycle verificadas no código público MIT `unknownskl/xbox-xcloud-player` (commit `a6511a645736f4988f77323284c6f0f36bf93aef`), especialmente `src/channel/message.ts`, `src/channel/input.ts`, `src/channel/input/packet.ts` e `src/input/gamepad.ts`. O código de referência mostra que o canal input usa frames binários de 23 bytes por gamepad e que a classe de controle registra o gamepad com `gamepadChanged`; nenhuma implementação de frames foi copiada para esta alteração.
- Descoberta para a próxima etapa: o userscript possui `nxInputBridge`, mas ele só transforma leituras da Gamepad API para curvas/giroscópio opcional; não é um transporte de frames xHome. `nxSampleGamepads` é diagnóstico em 750 ms, e `nxGamepadUiTick` é navegação de painel em 75 ms. O Touch HUD usa o transporte nativo do xCloud (`onVirtualMouseInput`/teclado), não o canal xHome. Portanto, a afirmação anterior de que já existia um bridge de envio reutilizável estava imprecisa. Não foi criado um segundo wrapper de `navigator.getGamepads` nem um polling concorrente nesta execução.
- Risco/problema pendente: o bootstrap ainda envia `gamepadChanged` true e imediatamente false como parte da sequência de autorização, mas não registra posteriormente um controle físico conectado. Nenhum frame de gamepad é enviado. O formato de 23 bytes e o agendamento do cliente de referência estão documentados, porém precisam de serialização determinística e testes antes da transmissão.
- Validação desta execução: alterações aplicadas com SHA de blob verificado e HEAD relido entre cada commit. Os dois testes novos foram adicionados, mas **ainda não foram executados localmente nem pelo GitHub Actions nesta etapa**; aguardar os workflows acionados pelo push. Não declarar PASS até obter status. Nenhum teste Chrome/Edge, streaming, áudio/vídeo ou Xbox físico foi realizado.
- Concluído: timeout do handshake, teardown em erro/fechamento de canal, dois testes de regressão e changelog 4.12.65.
- Pendências: confirmar CI; implementar encoder binário de gamepad (23 bytes por frame) e registro do slot com `gamepadChanged` ao conectar/desconectar; definir um único scheduler xHome sem novo override da Gamepad API; sincronizar frames com metadata de vídeo conforme protocolo; implementar teclado/mouse/toque e vibração; validar sessão e mídia em Xbox real.
- **Próxima tarefa concreta:** implementar e testar somente o encoder binário de gamepad xHome e a transição de registro do slot, sem ainda ativar envio contínuo. Critérios de aceite: mapeamento documentado dos 17 botões padrão, D-pad, triggers e quatro eixos; tamanho/offsets/endianness conferidos contra `InputPacket` MIT; frames de neutralização; testes para desconexão e registro único; nenhuma nova interceptação de `navigator.getGamepads`; `node --check`, suíte completa e ambos workflows PASS. Somente depois integrar o scheduler e o envio ao canal input.


## 2026-11-12 — xHome: encoder binário e lifecycle de slots de gamepad
- SHA inicial da main consultada diretamente: 33b690ee2a952c6fc186737fef13de8b9d9d06d0; versão inicial do userscript: 4.12.65.
- Implementação preparada na branch automation/xhome-gamepad-packet-2026-11-12; PR #2 squash-merged após CI verde. Commit integrado na main: f35a283f5e537ef8a3becbb5da554cc543b244ab; commit final de documentação desta execução será criado a seguir.
- Diagnóstico do ciclo anterior: os commits bb460ff / 587d60a adicionaram timeout de 12 s aos data channels. Os workflows mais recentes falharam no teste 103 (session: WebRTC offer is sent and SDP answer is applied) porque JSON.stringify(nxRemotePlay) encontrou o objeto Timeout circular do Node em channelTimer. A sintaxe passou; 116 testes passaram, 1 falhou e 3 ficaram TODO. O timer real também mantinha o processo aberto por ~12 s. O comportamento esperado no navegador usa handles numéricos; o harness não simulava esse contrato.
- Correção de testes: o harness padrão usa handles numéricos fake, sem executar timers implicitamente; os testes específicos de timeout continuam controlando callbacks/handles por meio de timerOverrides. Isso remove a diferença Node/browser e evita timers pendentes após os testes.
- Referência técnica conferida diretamente em unknownskl/xbox-xcloud-player (MIT), src/channel/input/packet.ts: pacote possui cabeçalho de 14 bytes, contador de frames e registro Gamepad de 23 bytes. O registro contém slot, máscara de 15 botões (bits 1–15), quatro eixos int16, dois triggers uint16 e os campos PhysicalPhysicality/VirtualPhysicality. A implementação de referência grava o último campo em big-endian; o encoder mantém esse detalhe e possui teste explícito.
- Implementação em NimboXcloud.user.js v4.12.66:
  - encoder puro de 38 bytes para um frame Gamepad padrão, com report type 2, sequence uint32, timestamp float64, slot 0–3, botões, eixos e triggers normalizados/clampados;
  - registro/desregistro idempotente de slots no canal controlV1, condicionado a dataChannelsReady e canal aberto;
  - teardown envia gamepadChanged=false para slots registrados antes de fechar os canais;
  - não lê navigator.getGamepads, não instala wrapper, não cria polling nem transmite frames contínuos. O encoder ainda não está conectado ao input físico.
- Testes adicionados em tests/xhome-discovery.test.cjs: layout binário completo de 38 bytes, clamp/sequence/mapping inválido e registro idempotente/teardown de slot. Resultado confirmado: 123 testes, 120 PASS, 0 FAIL e 3 TODO nos dois workflows.
- Arquivos alterados: NimboXcloud.user.js, tests/xhome-discovery.test.cjs, CHANGELOG.md e este documento.
- Riscos: o formato foi conferido contra a implementação pública MIT, mas ainda não foi validado contra um console Xbox real; o slot ainda não é associado a um gamepad físico; nenhum frame é transmitido. A divergência de endianess do campo VirtualPhysicality é mantida exatamente como a referência e precisa de confirmação em sessão real. Não houve alteração do Cloud Gaming, HUD Touch ou bridge da Gamepad API.
- Concluído nesta etapa: encoder determinístico; transições de slot idempotentes; neutralização do slot no teardown; harness de timer compatível com browser; testes correspondentes.
- Pendências: executar node --check, suíte completa e ambos workflows; validar o pacote/registro com Xbox real; depois integrar um único scheduler xHome ao estado de gamepad existente, sem novo wrapper/polling concorrente; implementar keyboard/mouse/touch e vibração; comprovar mídia e reconexão.
- Próxima tarefa concreta: após CI verde, integrar o envio contínuo de frames ao canal input com um único scheduler ativo apenas durante sessão xHome pronta. Critérios de aceite: ler Gamepad API por uma única rotina, associar no máximo quatro slots estáveis, registrar/desregistrar com gamepadChanged, enviar frame de neutralização em disconnect/blur/Stop, limitar fila via bufferedAmount, encerrar o scheduler em todos os caminhos de teardown e nunca interceptar navigator.getGamepads novamente; testes determinísticos de conexão, botão, eixo, trigger, disconnect e concorrência; workflows baseline/regression PASS. Não habilitar envio em sessão real até validar autorização e formato com Xbox.


### Correção do primeiro CI da etapa 4.12.66
- O primeiro PR run (43175885519 baseline; 43175885534 regression) confirmou a correção do timer circular, mas encontrou dois erros exclusivos do sandbox VM do teste: ArrayBuffer e Array retornados pelo contexto VM não compartilham o prototype do Node externo, portanto instanceof/deepStrictEqual falhavam apesar dos valores corretos.
- Ajustados os testes para verificar o tipo de ArrayBuffer por Object.prototype.toString e converter slots com Array.from no contexto do teste. Nenhum código de produção foi alterado por esse ajuste.
- Aguardando nova execução dos workflows antes de declarar aprovação.


### Fechamento e validação final — execução 2026-11-12
- SHA inicial da main: 33b690ee2a952c6fc186737fef13de8b9d9d06d0.
- SHA do código integrado na main após PR #2: f35a283f5e537ef8a3becbb5da554cc543b244ab.
- PR #2: https://github.com/breno-bgod/NimboXcloud/pull/2 — squash merge concluído somente depois de ambos workflows PASS.
- Baseline: run 43176093250 PASS; Syntax check PASS; Baseline tests PASS; Static risk report PASS.
- Regression: run 43176093339 PASS; syntax e suíte de regressão PASS.
- Resultado em ambos: 123 testes, 120 PASS, 0 FAIL, 3 TODO.
- Primeiro CI do PR (708085f) falhou em duas assertions de contexto cruzado (ArrayBuffer/Array VM versus Node); os testes foram corrigidos sem alterar o encoder. Segundo commit do PR (3aba68e) passou integralmente.
- Avisos não bloqueantes: punycode depreciado e actions/checkout@v4 + setup-node@v4 sinalizados por runtime Node 20; não afetam o resultado atual, mas merecem atualização futura.
- Validação executada: GitHub Actions; node --check; node --test tests/*.test.cjs; node tools/static-risk-report.cjs. Não houve build/lint separado configurado, nem execução em Chrome/Edge, Android, stream xCloud ou Xbox físico.
- O userscript permanece 4.12.66. O encoder e o registro de slots estão disponíveis internamente, mas não há envio contínuo de frames e o Remote Play não está homologado.
- Status: CONCLUÍDO no PR #3; o scheduler único, envio de frames, neutralização, controle de bufferedAmount e teardown foram integrados na versão 4.12.67.


## 2026-11-12 — xHome: encaminhamento experimental do gamepad físico
- SHA inicial da main consultada diretamente nesta execução: 255cd7c7e9480293ff91675bbbd686d32922600e; versão inicial 4.12.66.
- Branch de trabalho: automation/xhome-gamepad-stream-2026-11-12.
- Auditoria do estado inicial: o encoder binário de 38 bytes e o registro idempotente de slots já existiam, mas nenhum frame era enviado. O nxGamepadUiTick lia a Gamepad API a cada 75 ms e nxSampleGamepads fazia uma segunda leitura nativa a cada 750 ms.
- Implementação integrada em NimboXcloud.user.js v4.12.67:
  - envia frames do gamepad padrão pelo data channel input somente quando dataChannelsReady, HandshakeAck, peer conectado e canal aberto;
  - associa Gamepad.index a slots estáveis 0–3, registra uma vez e remove no disconnect;
  - reutiliza o loop existente de leitura do painel NX com temporização adaptativa: 16 ms apenas quando a sessão xHome está conectada, o painel está fechado e a janela tem foco; 75 ms no restante do tempo;
  - compartilha o snapshot de Gamepad API com o diagnóstico de 750 ms, evitando uma segunda rotina periódica de leitura;
  - neutraliza slots em desconexão, blur, visibility hidden, painel aberto, pagehide e teardown; ignora novos frames quando bufferedAmount excede 4096 bytes;
  - trata botão digital pressed=true com value=0 como pressionado, sem alterar valores analógicos positivos.
- Testes acrescentados em tests/xhome-discovery.test.cjs: gate de prontidão, estabilidade de slot, frame ativo, neutralização antes de unregister, suspensão/resume, backpressure e fallback de botão digital.
- Arquivos alterados: NimboXcloud.user.js, tests/xhome-discovery.test.cjs, CHANGELOG.md e DEVELOPMENT_ROADMAP.md.
- Referência de protocolo: encoder continua baseado em observação independente do layout InputPacket (14-byte header, frame count e registro Gamepad de 23 bytes). O repositório público unknownskl/xbox-xcloud-player não expõe licença detectável pela API GitHub (license=null); nenhum código-fonte dele foi copiado nesta etapa. O userscript Better xCloud 6.7.13 MIT fornecido pelo usuário foi localizado na Library; sua implementação de polling reforça a necessidade de respeitar o intervalo e liberar botões ao terminar o estado de atalho.
- Validação pré-commit: parse integral do userscript e do teste via new Function PASS; verificações estáticas PASS (sem novo override de getGamepads e sem setInterval paralelo). Primeiro workflow de regressão falhou somente por uma asserção textual antiga sobre o status; a expectativa foi atualizada. Reexecução final PASS nos dois workflows, tanto no PR quanto após o merge na main: 130 testes, 127 PASS, 0 FAIL, 3 TODO. node --check PASS; testes baseline PASS; static risk report PASS. Não há build/lint separado configurado. Nenhum teste real de navegador, stream, áudio/vídeo ou Xbox físico foi realizado.
- Riscos: formato binário, mapeamento de botões e endianness ainda não foram confirmados com console Xbox real; apenas mapping standard é encaminhado; o threshold de 4096 bytes pode descartar frames temporariamente em rede congestionada. O Cloud Gaming continua recebendo a Gamepad API normalmente, inclusive se o Remote Play estiver ativo.
- Próxima tarefa concreta: implementar encoders puros de teclado e mouse xHome, ainda sem interceptar eventos globais. Critérios de aceite: offsets, endianness e códigos de tecla documentados; eventos keydown/keyup e mouse down/up/move/scroll com neutralização e teardown; testes determinísticos de tamanho, estados e ordenação; nenhum listener concorrente com o Touch HUD; node --check, suíte completa e ambos workflows PASS.


- Revisão de robustez antes do PR: neutralização agora só marca pausa após envio aceito; desconexão mantém o slot registrado até o frame neutro ser aceito. O callback WebRTC reconcilia o estado atual imediatamente após ser instalado, evitando perder o evento connected se ele ocorrer antes do listener.
- Testes adicionais: retry de neutralização após falha simulada de send e manutenção do slot até a liberação ser aceita.

- CI do PR #3: primeiro run de regressão falhou por expectativa textual obsoleta; correção aplicada somente no teste. Segunda execução do PR: regression run 43179830547 PASS (130 testes, 127 PASS, 0 FAIL, 3 TODO) e baseline run 43179831053 PASS. Após o squash merge, main run 43179894260 PASS (mesmos 130 testes) e baseline run 43179893968 PASS (syntax check, baseline tests e static risk report PASS).

- Publicação: PR #3 https://github.com/breno-bgod/NimboXcloud/pull/3 foi squash-merged em 2026-11-12 08:03:44 UTC. SHA inicial desta execução: 255cd7c7e9480293ff91675bbbd686d32922600e. SHA final da implementação integrada na main: c9f7cf0c4772101ac3bb11d2a577032972e745ce. Versão final do userscript: 4.12.67.
- Estado final: o gamepad físico agora é encaminhado ao canal input após handshake e conexão WebRTC; o xCloud continua usando a Gamepad API existente sem novo override. Remote Play ainda NÃO está completo: vídeo/áudio e controle em Xbox físico aguardam validação real, e teclado/mouse ainda não foram integrados.


## 2026-11-12 09:05 UTC — xHome: encoders puros de teclado e mouse

- SHA inicial da main consultada diretamente: `bcf8e251ab52ab958a3dd6359d3a4db70aaa113a`; versão inicial: 4.12.67.
- PR #5: https://github.com/breno-bgod/NimboXcloud/pull/5 — squash merge concluído após CI verde.
- SHA final da implementação integrada na main: `6cda5228472467fa5a087a62bf030722cd6b77be`; versão do userscript: 4.12.68.
- Auditoria: o comentário de bootstrap ainda dizia que nenhum frame de gamepad era enviado, e o diagnóstico manual afirmava que autenticação/protocolo Remote Play não estavam integrados. Ambos estavam desatualizados após a etapa 4.12.67; foram corrigidos para descrever o estado experimental real.
- Referência de protocolo: `unknownskl/greenlight`, branch `main-v2`, LICENSE MIT; arquivos `packages/player/src/client/lib/channel/input/packet.ts` e `input/mousekeyboard.ts`. O encoder usa os formatos documentados de ReportTypes Keyboard (64) e Mouse (32), sem copiar trechos-fonte. O repositório separado `unknownskl/xbox-xcloud-player` não expõe licença detectável (`license=null`); nenhum código foi copiado dele. `Geocld/XStreaming` usa AGPL-3.0; não foi adaptado.
- Implementação em `NimboXcloud.user.js`:
  - helper comum de cabeçalho de 14 bytes + contador de frames; encoder Gamepad refatorado para usá-lo, preservando o pacote de 38 bytes;
  - encoder Keyboard: pacote de 18 bytes, um registro VKey de 3 bytes (tipo, pressed, virtual-key), com mapeamento de `KeyboardEvent.code` para VK e fallback validado de `keyCode`;
  - encoder Mouse: pacote de 33 bytes, registro de 18 bytes com X/Y/roda assinados em int32 little-endian, máscara de botões e flag relative/absolute;
  - valores numéricos limitados à largura do protocolo; códigos de tecla desconhecidos e modos de ponteiro inválidos são rejeitados;
  - encoders continuam puros e sem captura: nenhum listener global, Pointer Lock, integração de Touch HUD ou envio de teclado/mouse foi ativado.
- Diagnóstico: `inspectRemotePlay` e `S.diagnosticsWarnings` agora refletem a autenticação/sessão experimental e deixam claro que gamepad, vídeo e áudio ainda não foram homologados em Xbox físico.
- Arquivos alterados no PR: `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md`; este documento atualizado após o merge.
- Validação real via GitHub Actions:
  - PR regression run 43188373642: PASS; `node --check` PASS; suíte completa: 134 testes, 131 PASS, 0 FAIL, 3 TODO.
  - PR baseline run 43188373678: PASS; sintaxe, suíte e static risk report PASS.
  - Main regression run 43188479003: PASS.
  - Main baseline run 43188479207: PASS.
  - Static risk report identificou somente padrões já existentes: wrappers opt-in de Gamepad API, interceptação de XHR send e fetch; esta alteração não adicionou hooks nem polling.
- Limitações/riscos: não houve teste local neste runtime porque o clone HTTPS falhou por DNS; CI executou sintaxe e testes em Node 22. Não houve Chrome/Edge, Android, sessão xHome autenticada, Xbox físico ou validação de vídeo/áudio. O layout do protocolo ainda precisa ser confirmado contra console real; a implementação de teclado/mouse ainda não envia frames.
- Concluído: encoders puros e testes determinísticos de tamanhos, offsets, endianess, sequência, keydown/keyup, mapeamento VK, movimento relativo, roda, botões, clamp e rejeição de entrada inválida.
- Prioridades restantes: captura integrada de teclado/mouse sem competir com NimboTouch; liberação de todas as teclas/botões em blur/Stop; validação de mídia e controles em Xbox real; reconexão/encerramento real; testes de regressão de Cloud Gaming.
- **Próxima tarefa concreta:** integrar a captura e o envio de teclado/mouse ao fluxo xHome usando um único dispatcher compartilhado com a arbitragem de Pointer Lock/NimboTouch, sem instalar listeners globais paralelos. Critérios de aceite: somente encaminhar quando sessão/canais xHome estiverem prontos e o modo de captura estiver ativo; rastrear várias teclas e botões simultâneos; enviar keyup/mouseup para todos os estados retidos em blur, visibility hidden, Stop e pagehide; movimento relativo apenas sob captura/Pointer Lock, com roda e cliques ordenados; não consumir eventos do Cloud Gaming nem duplicar listeners do Touch HUD; testes determinísticos de concorrência, liberação e teardown; `node --check`, suíte completa e workflows baseline/regression PASS.


## 2026-11-12 09:28 UTC — diagnóstico: controle virtual completo (touch HUD → gamepad)

- SHA inicial da main consultada diretamente: `e8d49aec1e98cae47e83ae9181d0e26751e7b623`; userscript `4.12.68`.
- Arquivos auditados diretamente: `NimboXcloud.user.js` (blob `8d7de5c1cace8ed977518dce92dc1d3820b8c90e`), `modules/NimboXcloud-Touch-HUD.user.js` (v1.1.6, blob `54724387d1687ce7ad696527844c6eed3b72c255`), `tests/xhome-discovery.test.cjs`, workflows e histórico recente.
- Diagnóstico confirmado:
  - O editor HUD principal `NX_HUD_DEFAULT` só salva oito posições (dois sticks, A/B/X/Y e LT/RT); `nxHudNativeApply` reposiciona controles nativos encontrados por rótulo. Não cria um controle virtual e não sintetiza entradas.
  - O editor NimboTouch já permite criar/remover botões, mover/redimensionar, ajustar opacidade, salvar perfis e associá-los a jogos. Porém, o joystick atual é digital de oito direções e converte movimento em WASD; os botões emitem teclado/mouse. Não gera eixos analógicos ou botões Xbox.
  - O encaminhamento xHome já tem encoder de gamepad padrão, slots 0–3, scheduler único e neutralização, mas atualmente consome apenas snapshots de `navigator.getGamepads()`. Esse é o ponto de integração mais direto para o controle virtual no Remote Play, sem falsificar a Gamepad API nem criar outro polling.
  - Há curvas/deadzone e transformação experimental de eixos para gamepads físicos. A prévia/calibração de giroscópio já existe, mas não equivale a gyro aplicado ao controle virtual. Vibração atual testa localmente atuadores físicos ou `navigator.vibrate`; não existe retorno tátil de Remote Play encaminhado ao HUD.
  - A ponte de teclado/mouse xHome ainda está na etapa de encoders puros; captura e envio ainda não foram conectados. Não deve ser usada como substituto para um gamepad virtual completo.
- Decisão arquitetural para a próxima etapa:
  1. Definir um estado de controle virtual normalizado (botões Xbox, dois eixos, triggers, D-pad, touchpad e flags de conexão), com deadzone/sensibilidade aplicadas uma única vez.
  2. Fazer o NimboTouch editor renderizar esse estado: dois sticks analógicos, face buttons, bumpers/triggers, D-pad, Menu/View e superfície touchpad com gestos/cursor; cada área com posição, tamanho/largura/altura, opacidade e zona morta editáveis e persistidas em perfis compatíveis.
  3. Expor o estado por uma ponte interna explícita e alimentar o scheduler xHome existente, que aloca um slot livre 0–3, combina controle virtual/físico sem colisão, envia frames e neutraliza em cancelamento, blur, ocultação, Stop e pagehide.
  4. Manter separado o caminho do Cloud Gaming: não existe API web padrão para criar um `Gamepad` sintético em `navigator.getGamepads()`. No xCloud, o HUD só poderá comandar jogos por uma rota de entrada oficialmente/tecnicamente observável (controles touch nativos ou teclado/mouse quando suportado); não anunciar compatibilidade universal com jogos que exigem gamepad.
  5. Adicionar gyro ao eixo direito virtual após calibração/permissão, e vibração somente após identificar uma fonte de rumble no canal remoto ou suporte local real; não simular confirmação de rumble remoto.
- Segurança/regressões: preservar Gamepad API nativa e controles físicos; nenhum segundo scheduler/listener global; nunca sobrescrever slots físicos; soltar todos os estados retidos ao perder foco/sessão; não alterar perfis antigos sem migração validada.
- Testes nesta execução: inspeção estática dos trechos de editor, entrada e protocolo; consulta do histórico e HEAD. Não foram executados Node/CI, navegador, xCloud autenticado ou Xbox físico. O último commit de implementação reporta 134 testes (131 PASS, 0 FAIL, 3 TODO) nos workflows; isso é histórico publicado, não teste executado nesta execução.
- Código alterado: nenhum. Commit desta execução: somente atualização deste roadmap.
- **Próxima tarefa concreta:** implementar o contrato puro de estado do gamepad virtual e sua integração de leitura ao scheduler xHome já existente, inicialmente sem interface visual nova. Critérios de aceite: normalização de botões 0–16, dois eixos e triggers; deadzone circular configurável e clamp; slot virtual livre e estável sem colisão com pads físicos 0–3; frame neutro e unregister em todos os caminhos de teardown; testes determinísticos de press/release, eixo, trigger, múltiplos toques, desconexão e coexistência físico/virtual; `node --check`, suíte completa e ambos workflows baseline/regression PASS.


## 2026-11-12 — revisão de arquitetura: priorizar Touch Adaptation Kit (TAK)

- SHA inicial desta revisão: `b30194cc5076e7ac00410043ae8f165f62b97de6`.
- Nova evidência técnica: a documentação Microsoft descreve Touch Adaptation Kit como sistema de layouts de controles touch renderizados pelo cliente de streaming; documenta componentes/layouts, troca durante sessão e sideload em ambiente de desenvolvimento. Referências: Microsoft Learn — Getting started with touch e Web Content Test Application (CTA) em `xbox.com/play`.
- Evidência upstream: a wiki do Better xCloud documenta uso de `testTouchLayout(layout)` para testar layouts TAK, esquema JSON v4.0 com `joystick`, `directionalPad`, botões A/B/X/Y, triggers, bumpers, Menu e View, além do fluxo de layouts customizados para jogos sem touch nativo. A wiki informa limitações de assets personalizados e troca dinâmica contextual.
- Correção da decisão anterior: não devemos começar implementando um renderizador de gamepad visual próprio como caminho principal. O caminho prioritário passa a ser adaptar/reutilizar layouts TAK e componentes visuais nativos sempre que o cliente permitir. O editor NX deve operar sobre o modelo JSON/layout e reaplicar a configuração pelo mecanismo disponível; evitar manipulação direta de DOM até confirmar que os controles são DOM e não uma camada renderizada pelo cliente.
- Escopo de investigação obrigatório antes de implementar:
  1. Confirmar no runtime de `play.xbox.com`/nova experiência se `testTouchLayout` existe, assinatura, disponibilidade e persistência durante a sessão.
  2. Verificar se layouts TAK customizados podem ser aplicados no fluxo retail sem dev tools/sideload; separar isso do mecanismo documentado para ambiente de desenvolvimento.
  3. Mapear as diferenças entre xCloud e Remote Play, incluindo layouts nativos específicos do jogo e layout Standard.
  4. Determinar se o editor pode alterar geometria, escala, posição e opacidade dos componentes TAK sem perder ações e assets.
  5. Se o cliente não permitir modificar layouts nativos retail, usar TAK para jogos/layouts suportados e só então considerar fallback virtual NX, conectado ao encoder existente; não afirmar que podemos modificar controles oficiais de qualquer jogo.
- Nova prioridade: prova de conceito read-only/diagnóstica do runtime TAK em sessão real, seguida de um layout de teste reversível. Critérios de aceite: detectar suporte sem quebrar inicialização; identificar a API e o formato ativos; aplicar/reverter um layout de teste em ambiente autorizado; validar joystick analógico, botões, D-pad e gatilhos; registrar comportamento em xCloud e Remote Play separadamente.
- Gyro, vibração e touchpad permanecem extensões condicionais: só integrar como componentes/ações TAK se o esquema e runtime oferecerem suporte; caso contrário, implementar como camada complementar sem substituir o caminho nativo.
- Nenhum código de produção foi alterado nesta revisão. Nenhum teste de navegador, sessão autenticada ou Xbox físico foi executado. Esta entrada corrige a prioridade arquitetural registrada na execução anterior.

## 2026-11-12 12:34 UTC — xHome: captura física de teclado/mouse e roteamento do gamepad por foco

- SHA inicial desta execução: \`e8d49aec1e98cae47e83ae9181d0e26751e7b623\` (userscript \`4.12.68\`).
- HEADs concorrentes reconciliados antes do merge: \`b30194cc5076e7ac00410043ae8f165f62b97de6\` e \`70aea665d1ac486289bec92606cbe36bf94e2f11\`; ambos acrescentaram somente documentação ao roadmap. Nenhuma alteração de código foi descartada.
- SHA final da implementação integrada: \`9756c9a3be97d16c05a24c7a4c5b6ade9eeea53e\` (userscript \`4.12.69\`). PR #10 foi mesclado; PR #9 foi fechado sem merge após a primeira tentativa de CI revelar uma regra existente de Pointer Lock.
- Commits incrementais publicados na branch de trabalho: \`7de8f336f880552724864752cf662dcfd8d95870\`, \`f9a3d670f791f4223c0a5ec4c3f394c3df7f466b\`, \`a77665db220391b4fab90a2dc8da6d58125e9235\`; merge em \`main\`: \`9756c9a3be97d16c05a24c7a4c5b6ade9eeea53e\`.
- Arquivos alterados: \`NimboXcloud.user.js\`, \`tests/xhome-discovery.test.cjs\`, \`CHANGELOG.md\` e este roadmap.
- Implementado:
  - Captura opcional de teclado físico e mouse físico na página Remote Play, ativada explicitamente pelo usuário e limitada ao vídeo xHome focado.
  - Encaminhamento pelos encoders já existentes (Keyboard report 64 e Mouse report 32), sem novo encoder concorrente, sem override de \`navigator.getGamepads\` e sem polling paralelo.
  - Estado de teclas pressionadas, supressão de auto-repeat, movimento relativo, botões, roda e liberação forçada de teclas/botões em blur, página oculta, Escape, pagehide, desconexão e Stop.
  - Sequência única compartilhada entre gamepad, teclado e mouse. O frame ClientMetadata mantém sequência 0; o primeiro frame de entrada passa a usar sequência 1. Isso elimina a colisão que existia quando o primeiro frame de gamepad também começava em 0.
  - O gamepad físico agora é encaminhado enquanto o vídeo xHome está focado, mesmo com o painel NX aberto; o loop volta a 16 ms nesse estado e deixa de interpretar o mesmo controle como navegação do painel.
  - Atalhos Ctrl+Shift do NX e push-to-talk configurado em V permanecem disponíveis. Eventos de toque e KeyboardEvent sintéticos não são encaminhados por esta captura.
- Decisão de compatibilidade: a primeira tentativa de CI detectou que os testes de política do repositório proíbem chamadas novas a \`requestPointerLock\`. A implementação foi corrigida para não solicitar nem liberar Pointer Lock; o mouse usa movimento relativo dentro da área do vídeo, sem roubar o lock do Cloud Gaming ou do NimboTouch.
- Testes reais:
  - PR #10: workflows regression #117 e baseline #368 — ambos PASS.
  - Após merge: workflows regression #118 e baseline #370 — ambos PASS.
  - Em cada suíte: 141 testes, 138 PASS, 0 FAIL, 3 TODO.
  - \`node --check NimboXcloud.user.js\`: PASS.
  - Relatório estático de riscos: PASS, JSON válido e linhas rastreáveis.
  - Não há build/lint separado configurado no repositório.
- Descobertas e limites:
  - O bloqueio anterior de gamepad era o gate \`!openUI\`; com o vídeo focado o loop agora prioriza o console em vez de navegar o painel.
  - O modo teclado/mouse ainda não é uma prova de controle funcional em Xbox físico. A transmissão real de vídeo/áudio, os comandos xHome e a resposta de jogos ainda precisam de validação com console e conta autorizados.
  - O HUD de toque NimboTouch ainda não é encaminhado ao canal xHome. A captura atual ignora ponteiros touch de propósito; não alegar suporte touch xHome.
  - Sem Pointer Lock, o mouse só envia movimento enquanto o ponteiro está dentro do vídeo. Uma integração posterior com a arbitragem existente pode ampliar isso, mas não deve criar outro gerenciador.
  - Nenhum teste manual em Chrome/Edge, sessão autenticada ou Xbox físico foi executado nesta execução.
- Estado da frente xHome: descoberta/autenticação, criação de sessão, negociação SDP/ICE e canais de dados já existem no código; gamepad físico e captura opcional de teclado/mouse agora têm caminho de envio implementado e testes determinísticos. Mídia e controles ainda não estão homologados em hardware real.
- Tarefas concluídas nesta etapa: encoders de teclado/mouse; sequência de entrada compartilhada; captura física opt-in; liberação no ciclo de vida; roteamento do gamepad com o vídeo focado; regressões automatizadas.
- Prioridades restantes: validação de mídia e controles em Xbox real; integração do HUD touch ao xHome por um contrato único; investigação do Touch Adaptation Kit antes de qualquer editor/renderizador de HUD próprio; reconexão real e regressões de Cloud Gaming.
- **Próxima tarefa concreta:** executar uma prova de conceito passiva/read-only do Touch Adaptation Kit no runtime atual de \`play.xbox.com\`, mantendo a prioridade arquitetural definida na revisão mais recente. Critérios de aceite: verificar com guardas se \`testTouchLayout\` existe e qual assinatura/retorno apresenta; identificar o formato TAK efetivamente usado (incluindo versão e componentes) sem alterar sessão, DOM ou controles; comparar xCloud e Remote Play separadamente; documentar diferença entre retail e sideload/dev tooling; adicionar testes de detecção sem hooks de entrada, mutações ou listeners permanentes. Só depois dessa evidência planejar um teste de layout reversível em ambiente autorizado.

## 2026-11-12 — NimboTouch: primeira camada visual NX Minimal Touch

- SHA inicial consultado: `6b922f8634fae50e566a66ddc1eb52041368943a` (userscript `4.12.69`).
- Implementado no módulo `modules/NimboXcloud-Touch-HUD.user.js`:
  - Botões atuais com superfície preta translúcida, contorno branco discreto e rótulos brancos.
  - Joystick atual com base mais transparente e knob compacto.
  - Área touch/mouse permanece transparente durante o uso; no editor recebe contorno leve e marcador de mira.
  - Realce de pressionamento sutil, sem animações ou brilho excessivo.
- O skin é somente visual. Não transforma bindings de teclado/mouse em comandos Xbox, não cria D-pad nativo, não adiciona eixos analógicos nem altera o protocolo de entrada. Perfis e geometria existentes não foram migrados ou sobrescritos.
- Versões: userscript `4.12.70`; módulo Touch HUD `1.1.7`.
- Testes nesta execução: inspeção estática dos pontos de montagem/renderização e transformação textual dos arquivos. Não foi possível executar `node --check`, suíte automatizada, navegador, sessão xCloud ou hardware Xbox por esta integração; portanto não há alegação de validação funcional.
- Limitação conhecida: a superfície touch atual é a área de mouse/mira existente, não um touchpad TAK com gestos/cursor completo. D-pad e botões Xbox funcionais dependem da prova de conceito TAK/ponte de gamepad.
- **Próxima tarefa concreta:** validar a camada visual em Android e desktop; em paralelo, concluir inspeção passiva do runtime TAK e identificar assets/ícones e mecanismo de aplicação em sessão retail. Critérios: sem regressão de captura de ponteiros/edição, sem obstrução excessiva do vídeo, preservar layouts salvos, confirmar comportamento de fullscreen/rotação e documentar assets/licenças antes de incorporá-los.


## 2026-11-12 13:00 UTC — TAK: diagnóstico passivo do runtime e contrato de layout

- SHA inicial desta execução: `6b922f8634fae50e566a66ddc1eb52041368943a` (userscript `4.12.69`). Durante a execução, outra alteração foi integrada na main: skin visual NX Minimal Touch e módulo `1.1.7` (HEAD intermediário `3f0ed28fba951fef00eb75536d786a0e177a2b64`). O trabalho TAK foi reaplicado sobre esse HEAD; nenhum arquivo dessa mudança concorrente foi descartado.
- PR #11 foi fechado por conflito após a atualização concorrente da main. PR #12 foi aberto sobre o HEAD atualizado e squash-merged com sucesso: `7bdf158c42b18a9a87364613ad464d7362494808`. Versão final do userscript: `4.12.71`; módulo Touch HUD preservado em `1.1.7`.
- Arquivos alterados pelo PR: `NimboXcloud.user.js`, `tests/tak-runtime.test.cjs`, `docs/TAK-ARCHITECTURE.md`, `CHANGELOG.md`. Este registro atualiza o roadmap.
- Correção adicional encontrada durante reconciliação: a main já anunciava `@version 4.12.70`, mas a constante interna `VER` ainda era `4.12.69`. A constante foi alinhada em `4.12.71`, junto com o cache key de `@require`.
- Implementado no userscript:
  - Sondagem read-only do descritor próprio `window.testTouchLayout`.
  - Resultado exposto em Compatibilidade de dispositivo e no relatório de protocolo.
  - O hook nunca é chamado; acessores não são executados; nenhum DOM, sessão, controle, fetch/XHR, Gamepad API ou WebRTC é alterado.
  - Ausência é descrita somente como “não visível no contexto do userscript”; isso não prova que a página não exponha o hook em outro mundo JavaScript.
- Descoberta importante no schema oficial Microsoft v4.0: o modelo inclui joystick analógico, botões Xbox, D-pad, throttle, touchpad (com exemplo de saída `relativeMouse`), sensores gyroscope/accelerometer e propriedades de opacidade, escala, sensibilidade, deadzone e curvas. Isso confirma que touchpad e gyro fazem parte do TAK; disponibilidade real no cliente/dispositivo ainda depende de runtime e hardware.
- Limite confirmado pelo schema: a composição usa zonas/rodas/grupos (`left`, `right`, `upper`, `lower`); não há coordenadas livres X/Y para cada controle individual. Portanto, o editor NX pode reorganizar slots e grupos e alterar propriedades permitidas, mas não deve prometer arrasto livre arbitrário de cada controle nativo.
- A wiki do Better xCloud documenta `testTouchLayout(layout)` via DevTools, com Touch controller Availability = All games, reload e teste em jogo sem layout touch oficial. A própria wiki lista limitações de assets customizados e troca dinâmica por contexto nesse fluxo. Isso não comprova disponibilidade do hook no novo `play.xbox.com`, nem substituição de layouts oficiais em jogo que já possui touch.
- A documentação oficial Microsoft de sideload exige TAK CLI/`tak serve` e Content Test Application com sideload habilitado; selecionar Developer > TAK é fluxo de desenvolvimento, não substituição automática de layout numa sessão retail comum. Evidências e links foram registrados em `docs/TAK-ARCHITECTURE.md`.
- Testes:
  - GitHub Actions PR #12 — baseline run `43222905223` PASS; regression run `43222905196` PASS.
  - Node 22: 146 testes, 143 PASS, 0 FAIL, 3 TODO.
  - `node --check NimboXcloud.user.js`: PASS; static risk report: PASS.
  - Validação adicional no runtime de execução: parse integral do userscript e do novo teste via V8 `new Function` PASS; testes diretos do helper para hook ausente, função, accessor, Proxy hostil e escopo nulo PASS; função/accessor não foram invocados.
  - Não executados Chrome/Edge, sessão autenticada `play.xbox.com`, jogo, Android/DeX ou Xbox físico. Não houve teste real do `testTouchLayout` em sessão retail. Sem build/lint separado configurado.
- Estado TAK: schema e componentes confirmados; diagnóstico de visibilidade integrado; aplicação de layout e reversão ainda não comprovadas.
- Pesquisa complementar: o gist Thunder Virtual Controller (Navneetkrh, 2025-11-30) tem editor de posições, swipe e gyro, mas substitui globalmente `navigator.getGamepads`, emite `gamepadconnected` e mantém RAF permanente; usa `navigator.vibrate` como aproximação de vibração e mira `www.xbox.com/*/play*`, não `play.xbox.com`. Não há licença explícita visível. Não reutilizar código; apenas referência de UX. Essa arquitetura conflita com o gerenciador único de entradas do NX. Detalhes em `docs/TAK-ARCHITECTURE.md`. NimboTouch Minimal Skin é apenas visual e continua sem gamepad virtual Xbox nativo.
- Estado xHome: esta execução não alterou a negociação SDP/ICE, canais, entrada ou mídia. Gamepad físico e teclado/mouse continuam experimentais e sem homologação em Xbox real; HUD touch ainda não é encaminhado ao canal xHome.
- **Próxima tarefa concreta:** obter evidência do runtime real de `play.xbox.com` usando o novo diagnóstico e, se o hook estiver visível, testar um layout TAK mínimo e reversível em jogo sem touch oficial. Critérios de aceite: identificar contexto/versão do hook sem invocação automática; aplicar e restaurar o layout somente por ação explícita e em ambiente autorizado; testar joystick, botões, D-pad, trigger e touchpad; registrar diferenças retail/xCloud/xHome; nenhum layout oficial sobrescrito e nenhuma regressão no NimboTouch.


## 2026-11-12 13:25 UTC — regressão de toque nativo xCloud e lacuna do controle virtual

- SHA inicial desta execução: `a96966433faad87bb060c1398c82cd139c237850` (userscript `4.12.71`; módulo Touch HUD anunciado como `1.1.7`, mas constante interna ainda estava `1.1.6`).
- Diagnóstico confirmado no módulo `modules/NimboXcloud-Touch-HUD.user.js`:
  - `NimboXboxTransport.configure()` reconhecia uma configuração do próprio xCloud (`enableKeyboardInput=false`, `enableMouseInput=false`, `enableTouchInput=true`) como solicitação interna de restauração e retornava `restoreNow()` sem encaminhar a chamada original ao SDK. Isso podia descartar exatamente a alteração Automático/Manual feita no menu nativo do Xbox e restaurar o estado de toque anterior.
  - O caminho de ativação também incluía `enableTouchInput:false`; a camada do NimboTouch não deve ser proprietária nem interceptar o estado do toque nativo.
  - A UI do editor confirma que o joystick existente é apenas digital de oito direções e converte movimento em WASD. A biblioteca atual oferece stick WASD, teclas, mira e disparo; não existe controle Xbox virtual analógico, nem ativador/desativador próprio para esse controle. A ausência no editor não é um bug de renderização: o recurso ainda não foi implementado.
  - O código não substitui `navigator.getGamepads` por padrão; a ponte de eixos/gyro só é instalada mediante preferências explícitas. Não há evidência de que ela seja a causa desta regressão de toque.
- Correção publicada:
  - Removido o atalho que interceptava a configuração de toque do xCloud. Chamadas nativas de Automático/Manual agora seguem para `raw.updateInputConfigurationAsync` sem serem consumidas pelo NimboTouch.
  - Removido `enableTouchInput` do snapshot, da restauração e da ativação do adaptador. O NimboTouch agora salva/restaura somente os campos de teclado/mouse que administra; o toque nativo permanece sob controle do xCloud.
  - Corrigida a versão interna do módulo para coincidir com o metadata: `1.1.8`.
  - Atualizado o userscript para `4.12.72` e invalidado o cache do módulo no `@require`.
- Arquivos alterados: `modules/NimboXcloud-Touch-HUD.user.js`, `NimboXcloud.user.js`, este documento.
- Commits publicados em `main`: `9a63988b39ca982593dce06af180c44798961187` (correção do módulo); `cb102937a1d6820d3efbdc8cfe5fd8aebe0d357e` (versão/cache do userscript). Sem alterações destrutivas em perfis ou HUD salvas.
- Validação executada nesta execução: parse dos dois arquivos completos com V8 `new Function` (PASS); verificações estáticas para ausência de referências a `enableTouchInput` no módulo, remoção do atalho de restauração, alinhamento de versões e atualização do cache key (PASS). Não há workflows de PR associados ao commit direto; não foram executados Node test suite, Chrome/Edge, xCloud autenticado, Android ou jogo real.
- Risco/limite: a correção remove a interferência confirmada no fluxo de configuração, mas a recuperação do toque em uma sessão já aberta precisa ser validada após atualizar/recarregar o userscript. Uma sessão cujo SDK já esteja em estado inconsistente pode exigir reiniciar a partida.
- Estado do controle virtual: ainda não implementado. O joystick atual é teclado WASD; não cria eixos analógicos nem botões Xbox. A API web não oferece criação padrão de um Gamepad sintético em `navigator.getGamepads()`. Priorizar TAK nativo quando comprovadamente disponível; fallback NX deverá usar um contrato normalizado de gamepad e o canal de entrada autorizado, sem falsificar a Gamepad API ou criar um segundo scheduler.
- Próxima tarefa concreta (P0): validar a correção de toque em sessão real e criar regressão automatizada do contrato de configuração. Critérios de aceite: uma chamada nativa `{enableKeyboardInput:false, enableMouseInput:false, enableTouchInput:true}` chega intacta ao SDK mesmo quando NimboTouch está ativo; ativa/desativa Automático/Manual sem perda de toque; stop do NimboTouch não restaura nem sobrescreve `enableTouchInput`; testes cobrem ativação, alternância nativa e stop.
- Próxima tarefa seguinte (P1): implementar seção própria `Controle virtual` no painel NX, com toggle Ativar/Desativar e editor de HUD para sticks analógicos, botões Xbox, D-pad e gatilhos, usando uma única fonte de estado e integração explícita com TAK/encoder suportado. Não apresentar o joystick WASD como controle Xbox.


## 2026-11-12 13:52 UTC — isolamento explícito do NimboTouch e regressões de entrada/mídia xHome

- **SHA inicial da execução:** `65632b4f617b5d53d124ddb0d79b5b9e4f6e5a25`.
- **SHA final da alteração funcional do userscript:** `70d5a9ff04a3a9dfaa49affa466ffa3abd14e5bc` (`4.12.73`). **HEAD imediatamente antes deste handoff:** `d079fdcc5177b26a7b944c74f3e08c02b77dfa90`; o commit deste registro passa a ser o HEAD documental final.
- **Versões verificadas diretamente na main:** userscript `4.12.73`; módulo Touch HUD `1.1.9`.
- Auditoria da camada `NimboXboxTransport` encontrou um segundo risco além da regressão de toque já registrada: `configure()` inferia que qualquer chamada contendo `enableMouseInput:true` e `enableKeyboardInput:true` vinha do NimboTouch. O cliente Xbox também pode solicitar essa combinação nativamente. A heurística podia alterar uma configuração legítima mesmo sem qualquer ativação do botão NX.
- **Correção funcional:**
  - `configure(options)` agora encaminha o mesmo objeto de opções ao SDK, sem inferir intenção nem criar snapshot.
  - A ativação K/M foi movida para `activateKeyboardMouse()`, chamada exclusivamente pelo botão Ativar do NimboTouch.
  - Snapshot/rollback ficam limitados aos campos K/M que o adaptador administra; `enableTouchInput` nunca é capturado, alterado ou restaurado pelo NimboTouch.
  - A rotina de ativação captura a instância do transporte e abandona a transição de UI se a sessão for substituída durante o `await`.
- **Regressões adicionadas:**
  - `tests/nimbo-touch-config.test.cjs`: cinco casos para passagem transparente do toque nativo, solicitação nativa com K/M simultâneos, ativação explícita, alternância Automático/Manual durante NimboTouch ativo e restauração sem sobrescrever toque.
  - `tests/xhome-discovery.test.cjs`: harness aceita `MediaStream` simulado e cobre chegada de tracks de áudio/vídeo, deduplicação por ID, anexação ao vídeo e chamada de playback.
  - `.github/workflows/baseline.yml`: adicionada verificação `node --check modules/NimboXcloud-Touch-HUD.user.js`; o workflow já verificava o userscript principal.
- Arquivos alterados: `modules/NimboXcloud-Touch-HUD.user.js`, `NimboXcloud.user.js`, `tests/nimbo-touch-config.test.cjs`, `tests/xhome-discovery.test.cjs`, `.github/workflows/baseline.yml`, `CHANGELOG.md` e este roadmap.
- Commits funcionais e de validação: `fafef856b02ba53fd8c9351d87e96698220e95cc` (transporte explícito); `70d5a9ff04a3a9dfaa49affa466ffa3abd14e5bc` (versão/cache 4.12.73); `6e141ce37f868e0c2c2d8100529daeccbf19ce04` (cinco testes touch); `0a365e94a12742c8845940f6a822edf3a7982ceb` (sintaxe do módulo no CI); `fc265a048a9290cc22157075e9ebff73d963b342` (changelog); `5310a66026cd0a9385195272426922de997ba8f7` (teste de mídia xHome); `d079fdcc5177b26a7b944c74f3e08c02b77dfa90` (changelog de mídia).
- **CI confirmado no SHA `d079fdc`:**
  - GitHub Actions baseline run `43231411518`: PASS. `node --check NimboXcloud.user.js`, `node --check modules/NimboXcloud-Touch-HUD.user.js`, suíte `node --test tests/*.test.cjs` e static risk report executados.
  - Resultado Node 22: **152 testes, 149 PASS, 0 FAIL, 3 TODO**.
  - GitHub Actions xHome regression run `43231091304` no SHA `5310a66`: PASS, incluindo o novo teste de tracks WebRTC.
  - Static risk report concluiu sem falhar; registrou quatro padrões já conhecidos no userscript principal (dois pontos de ponte Gamepad opt-in, interceptação XHR send e fetch). Isso é relatório estático, não evidência de falha em runtime.
  - Não existe `package.json` nem script separado de build/lint no HEAD consultado; workflows executam Node 22, sintaxe, testes e relatório estático.
- Validação adicional no runtime desta execução: cinco cenários diretos do contrato `NimboXboxTransport` passaram; parse integral do módulo e do userscript passou. O CI repetiu as verificações sobre o checkout real do commit.
- **Estado do xCloud:** o caminho de configuração nativa está coberto por testes determinísticos e o proxy deixou de classificar chamadas nativas por seus valores. Ainda falta validar Automático/Manual e o toque nativo numa sessão autenticada Chrome/Edge/Android após instalar 4.12.73. Não declarar regressão corrigida em jogo antes desse teste.
- **Estado xHome:** descoberta/autenticação, criação/provisionamento, SDP/ICE, canais de dados, encoders e envio experimental de gamepad/teclado/mouse possuem cobertura mock. O novo teste confirma somente a lógica local de anexação de tracks; não prova conexão ICE real, decodificação de vídeo, áudio audível, comandos aceitos pelo Xbox ou reconexão em console físico. A interface Remote Play permanece oculta.
- Limitações e riscos: o teste de mídia usa `FakePeer` e `FakeMediaStream`; não simula codecs, jitter, sincronização A/V, autoplay real ou política de áudio móvel. Os três TODO do baseline continuam ligados a Pointer Lock, coexistência touch/gamepad e HUD nativa em sessão real. Os quatro achados do static risk report precisam continuar sob revisão, mas não foram introduzidos por esta alteração.
- **Tarefas concluídas nesta execução:** isolamento explícito da ativação NimboTouch; passagem transparente das configurações nativas; cinco regressões de configuração touch; verificação de sintaxe do módulo no CI; teste mock de chegada/duplicação/anexação de tracks xHome.
- **Pendências prioritárias:** validar 4.12.73 em xCloud real; confirmar áudio/vídeo e comandos no Xbox xHome; validar hook TAK no contexto real de `play.xbox.com`; implementar controle virtual Xbox editável somente após definir o contrato TAK/fallback, sem falsificar `navigator.getGamepads` nem criar segundo scheduler.
- **Próxima tarefa concreta (xHome — ciclo de mídia):** implementar diagnóstico de prontidão e lifecycle de tracks de áudio/vídeo na sessão xHome. Critérios de aceite: registrar apenas estado sanitizado da sessão atual; distinguir track recebido, mute/unmute, ended, vídeo pronto/dimensões e rejeição de autoplay; ignorar eventos de uma sessão antiga após Stop/reconexão; Stop deve remover `srcObject`, parar todas as tracks e limpar o estado; adicionar testes mock para esses caminhos; ambos workflows verdes. A validação final de codec, áudio audível e resposta do jogo continuará exigindo Xbox físico e conta autorizada.


## 2026-11-12 — auditoria de regressão percebida: Touchpad e giroscópio

- **HEAD consultado antes da auditoria:** `343bf6ae8ac8b32a1bf486e67a9b8d5eb5fccbd5` (branch `main`).
- **Userscript consultado:** `NimboXcloud.user.js` v4.12.73 antes da alteração, blob `bec8b39f076cc3c497f8918bdf238b446d6d899a`; versão resultante v4.12.74.
- **Módulo touch consultado:** `modules/NimboXcloud-Touch-HUD.user.js` v1.1.9.
- **Diagnóstico:** os recursos não foram removidos do HEAD atual. O Touchpad continua no módulo separado NimboTouch; o giroscópio continua implementado no userscript principal e a interface de ambos é construída na aba `Controles` do painel NX. A navegação lateral contém a entrada `Controles`.
- **Fluxo atual do Touchpad:** na aba Controles, o grupo `HUD de teclado e mouse por toque` oferece `Abrir Touch HUD`; o painel do módulo oferece ativação do touchpad, edição da HUD e perfis. Ele usa mouse relativo e joystick WASD; não representa o analógico direito nem substitui o giroscópio.
- **Fluxo atual do giroscópio:** o grupo `Giroscópio — calibração experimental` contém dois passos independentes: `Enviar giroscópio ao jogo` (preferência persistida e recarga da página) e `Leitura de sensores` (solicita permissão/ativa listener `deviceorientation`). A leitura precisa ser ativada novamente após a recarga e a posição central precisa ser calibrada. Essa separação de dois toggles com reload intermediário é uma causa provável de a função parecer ausente/inoperante; a interface não oferece uma única ativação guiada.
- **Mapeamento confirmado no código:** `nxMergeGyroAxes()` combina os valores do sensor com `axes[2]` e `axes[3]` do gamepad padrão, preservando os eixos originais; o controle-alvo é configurável (índices 0–3). Por padrão, a contribuição só é aplicada enquanto LT (botão 6) está pressionado; há opção `Sempre ativo`. A intensidade de contribuição é configurável.
- **Limitações atuais:** a fonte é `DeviceOrientationEvent` (beta/gamma), não leitura direta de `DeviceMotionEvent.rotationRate`; a ponte `navigator.getGamepads` é instalada apenas no boot quando a preferência de saída do gyro ou curvas de stick está habilitada. Se outro script assumir a Gamepad API antes/depois da ponte, a NX se abstém de sobrescrevê-la. O código de restauração de fallback também desliga a preferência de saída do gyro para voltar ao caminho nativo em caso de erro.
- **Não foi feita alteração funcional nesta auditoria:** nenhuma evidência permite afirmar que a lógica de mapeamento foi apagada. Evitar reintroduzir um segundo wrapper ou importar o antigo GyroBridge como userscript concorrente.
- **Validação:** inspeção direta do HEAD, do userscript principal e do módulo Touch HUD; nenhuma suíte, sintaxe, navegador, Android ou sessão xCloud foi executada nesta auditoria. Nenhuma alteração funcional foi publicada.
- **Próxima tarefa concreta (P0 — recuperar ativação simples do gyro-to-right-stick):** unificar a ativação em uma ação explícita que habilite a ponte de gamepad e solicite permissão do sensor no mesmo fluxo de gesto do usuário, sem reload obrigatório; mostrar estado claro de sensor/permissão/calibração/controle-alvo/saída; ao desativar, remover listener e restaurar a Gamepad API somente se nenhuma outra função NX ainda depender da ponte e se a NX ainda for proprietária do wrapper. Adicionar testes para permissão negada, sensor sem amostras, calibração, LT/always, fusão dos eixos 2/3, preservação do controle físico, fallback e coexistência com a curva de stick. Critério de aceite: um único fluxo de ativação visível restaura gyro-to-right-stick sem interferir no touchpad NimboTouch nem instalar um segundo gerenciador de entradas.


## 2026-11-12 — correção do diagnóstico: regressão sobre sistema previamente funcional

- **Correção do registro anterior:** a hipótese de que o giroscópio era apenas uma experiência incompleta e que a principal causa seria a ativação em duas etapas não está comprovada e não deve orientar uma reimplementação. O usuário confirma que a versão anterior do sistema de toque/giroscópio foi usada em jogos e funcionava integralmente. Tratar como regressão introduzida durante a migração/refatoração; preservar a implementação comprovada e localizar a alteração que a quebrou.
- **Fontes anteriores localizadas na Library:** `nimboplay-v23.user.js`, `nimboplay-v17.user.js`, `nimboplay-v16.user.js`, `nimbo-touch-1.0.1.user.js`, `GyroBridge_Gyropad_Enhanced.user.js` e cópia `GyroBridge_Gyropad_Enhanced.user(1).js`. Não são cópias a substituir automaticamente; são referências para comparação.
- **Distinção importante entre duas rotas de gyro encontradas:**
  1. `BxTouchpadMotion` em NimboPlay v16/v17/v23 lê `devicemotion.rotationRate` e soma o movimento do sensor ao mouse relativo do touchpad; o próprio texto da interface descreve “Giroscópio + touchpad”. Isso não é a rota de analógico direito.
  2. `GyroBridge - Gyropad Enhanced` é a rota que efetivamente emula o analógico: lê `devicemotion.rotationRate.alpha/beta`, aplica offset/calibração, zona morta, suavização, inversão/troca de eixos e sensibilidade; intercepta `navigator.getGamepads`; combina ou substitui os eixos do stick selecionado, por padrão o direito (`axes[2]`/`axes[3]`), preservando identidade, botões e demais eixos via Proxy. Configuração original inclui ativação `always` por padrão e gatilhos LT/LB/RT/RB.
- **Comparação com arquitetura atual:** o userscript NX atual possui outra implementação `nxGyroPreview`/`nxMergeGyroAxes`, baseada em `deviceorientation` para a prévia e com saída de jogo opcional, gating por LT por padrão e instalação condicional da ponte de gamepad. Não assumir equivalência funcional com o GyroBridge original. É necessário comparar algoritmo, convenções de eixos, gatilho, calibração, ciclo de permissão, persistência e ponto de interceptação.
- **Regra de implementação:** não criar novo script concorrente nem novo wrapper de `getGamepads`. Adaptar/restaurar o algoritmo e o comportamento comprovados dentro do gerenciador único atual, preservando o canal do touchpad e a entrada física. Manter preferências existentes e migrar valores somente com compatibilidade explícita.
- **Próxima tarefa concreta:** comparação linha a linha entre `GyroBridge_Gyropad_Enhanced.user.js` (fonte original de gyro-to-right-stick), NimboPlay/NimboTouch anterior e a implementação NX atual. Identificar primeiro o commit/alteração de regressão e reproduzir a lógica funcional dentro da ponte única; adicionar testes de equivalência para fusão/substituição dos eixos 2/3, alvo do controle, ativação `always`/gatilho, calibração por 90 amostras, freshness do sensor, preservação de botões/eixos e fallback. Critério de aceite: recuperar o comportamento anterior sem segundo interceptador e sem alterar a funcionalidade de touchpad/HUD.
- **Testes nesta execução:** recuperação de arquivos históricos da Library e inspeção do código-fonte; nenhuma execução de navegador, sensor físico ou jogo. Nenhuma alteração funcional foi publicada.


## 2026-11-12 — separação da aba Gyro Touch no painel NX

- **Userscript antes da alteração:** `NimboXcloud.user.js` v4.12.73, blob `bec8b39f076cc3c497f8918bdf238b446d6d899a`.
- **Commit funcional:** `fab85e9feb409484c0926aa9825240c0d35c0a66`; **commit de versão:** `055ff14732918dd0b4bb23405d9370879b29a4fb`.
- **Organização do painel:** a aba `Controles` passa a concentrar configurações do joystick e do controle físico. Foi criada a aba independente `Gyro Touch` na navegação lateral.
- **Conteúdo de Gyro Touch:** primeira seção é `Ativação`, com o controle `Ativar teclado e mouse`; abaixo ficam as seções de teclado/mouse, editor de HUD e giroscópio.
- **Integração preservada:** o botão principal usa a API pública já existente `window.NimboTouch.toggle()` e consulta `window.NimboTouch.isEnabled()`. O módulo `modules/NimboXcloud-Touch-HUD.user.js` não foi alterado; não foi criado outro gerenciador de entradas.
- **Separação de responsabilidades:** o controle físico permanece na aba `Controles`; o módulo externo integrado de teclado/mouse e seus ajustes passam para `Gyro Touch`. A ativação do teclado/mouse não altera o estado do controle físico.
- **Compatibilidade:** nomes e chaves de preferências existentes foram preservados; a mudança é de navegação e agrupamento visual.
- **Validação executada:** verificações estruturais do texto-fonte confirmaram a entrada da nova aba na lista e na rail, o builder próprio, o botão de ativação como primeiro controle da aba e a exclusão dos grupos Gyro Touch da página `Controles`. O SHA do userscript foi relido após o commit e conferido.
- **Limitação dos testes:** não foi executado parser JavaScript, suíte automatizada, navegador, Android ou sessão de jogo nesta alteração. O botão utiliza a API existente do módulo; a interação real ainda precisa ser validada em sessão xCloud.
- **Próxima validação:** abrir o painel em desktop e celular; confirmar que `Controles` mostra apenas joystick/controle físico, que `Gyro Touch` aparece na navegação, que o primeiro item ativa/desativa o NimboTouch e que editor/HUD/giroscópio continuam acessíveis e funcionais.


## 2026-11-12 — ciclo autônomo: ciclo de mídia xHome, versão e separação da navegação

- **SHA inicial da execução:** `1d0102b582948f2c0ce13e4f3400d55efa017f48`.
- **HEAD técnico antes deste handoff:** `197fbbfc4633c5c217f0490fd0e1e459b56fc60e`. O commit desta atualização registra o handoff no próprio `main`.
- **Versão confirmada diretamente na main:** userscript `4.12.75`; módulo Touch HUD `1.1.9`.
- **Auditoria de versão:** havia divergência entre `@version 4.12.74` e a constante interna `VER = 4.12.73`; o diagnóstico e a exportação de versão podiam mostrar um número diferente do instalado. Corrigido para `4.12.75`, alinhando metadata, constante de runtime e cache key do `@require`. O módulo Touch HUD permaneceu em `1.1.9`, sem alteração funcional.
- **Organização da interface:** renomeada a aba visível `Gyro Touch` para **`Teclado e mouse`**, atualizados o ícone da navegação lateral, o texto de erro da ativação e as descrições. O ID interno `gyrotouch` foi preservado para evitar migração desnecessária de estado; a aba `Controles` continua filtrando os grupos de teclado/mouse, editor de HUD e giroscópio. Preferências existentes não foram renomeadas nem apagadas.
- **Correção do ciclo de mídia xHome:**
  - Adicionado estado sanitizado de diagnóstico para contagem de faixas de áudio/vídeo, faixas ativas/mutadas/encerradas, metadados/dados de vídeo, dimensões e estado de playback.
  - Os listeners observam `mute`, `unmute`, `ended`, `loadedmetadata`, `loadeddata`, `playing`, `pause` e `error`; não guardam IDs de sessão, credenciais, SDP ou conteúdo de mídia no diagnóstico.
  - Repetições de `ontrack` não repetem `play()` para a mesma sessão. A rejeição de autoplay fica visível como bloqueio do navegador e oferece ação manual `Tentar reproduzir`.
  - Stop, cancelamento e falha removem listeners, pausam e limpam `srcObject`, param as tracks e zeram o diagnóstico. Callbacks de sessão anterior são descartados pela combinação de `requestId` e identidade do `MediaStream`.
- **Arquivos alterados:** `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `tests/project-integrity.test.cjs`, `CHANGELOG.md`, `README.md`, `README_EN.md` e este roadmap. `modules/NimboXcloud-Touch-HUD.user.js` não foi alterado.
- **Commits publicados nesta execução:**
  - `3b23b467878c740644b1344e15d26922f8fb4f79` — ciclo de mídia xHome, versão e aba Teclado e mouse.
  - `5c8beed8abe48119c2210f5094ab7a9ca2108304` — regressões do ciclo de mídia.
  - `46c8ad25383768e1c332511341a911d1f4b3f963` — criação dos testes de integridade; `89c9d25b4a1efeed4f8163da3d950a96c3aa9e26` — correção do separador de linhas nesses testes.
  - `ee182d9ee26ce9b12494d07e750ce36a1736e001` — changelog; `4d3cb86c4e12cbebe4cbbe6d7c804a437e899a46` — README PT; `82a046076489a880ad51294a9791d9f79191f443` — README EN; `88f9b9c9443f2d945616905a204e01cdd360010a` e `197fbbfc4633c5c217f0490fd0e1e459b56fc60e` — alinhamento das descrições de navegação nos dois READMEs.
- **Validação realmente executada nesta execução:** parse completo por V8 `new Function` do userscript principal, módulo Touch HUD e arquivos de teste; PASS. Self-test isolado dos helpers de mídia: anexação, uma única solicitação de playback, atualização de mute, remoção de listeners, limpeza de tracks e rejeição de callback obsoleto; PASS. Verificação estática de alinhamento das três versões e dos rótulos; PASS.
- **Testes não executados / CI:** não foi executado `node --check` nem `node --test tests/*.test.cjs` em runtime Node nesta execução. O workflow `.github/workflows/baseline.yml` está configurado para rodar em push na `main`, mas a consulta de status disponível retornou lista vazia; portanto, **não há confirmação de CI verde** neste registro. Também não foram executados Chrome/Edge, Android, sessão autenticada xCloud ou Xbox físico.
- **Estado xHome após a alteração:** a lógica local de tracks, playback e cleanup está coberta por mocks. Isso não comprova ICE conectado em console real, codec/decodificação, áudio audível, sincronização A/V, autoplay móvel ou comandos aceitos pelo Xbox. Remote Play permanece experimental/incompleto; a validação com console e conta autorizados continua pendente. HUD de toque ainda não está ligado ao canal xHome.
- **Riscos e hipóteses:** o guard de playback deve eliminar chamadas duplicadas quando o SDK emitir eventos `track` repetidos; o diagnóstico deve separar falha de autoplay de ausência de tracks; a limpeza deve impedir eventos atrasados de uma sessão encerrada de alterar a nova sessão. Esses comportamentos foram verificados em harness local, não em browser real.
- **Tarefas concluídas nesta execução:** diagnóstico e lifecycle de mídia xHome; deduplicação de playback; cleanup idempotente com proteção contra callbacks antigos; correção de versão; renomeação da aba; atualização dos READMEs PT/EN e changelog; testes de regressão adicionados.
- **Pendências prioritárias:** confirmar mídia xHome em Xbox físico; validar áudio e vídeo reais; testar gamepad e teclado/mouse em console; integrar toque/HUD somente após validar o contrato de entrada; concluir auditoria do gyro histórico e sua fusão com touchpad.
- **Próxima tarefa concreta (P1 — lifecycle de entrada xHome):** auditar o ciclo de Gamepad, teclado e mouse quando a sessão WebRTC muda de estado, é substituída ou encerrada. Critérios de aceite: nenhuma entrada enviada após Stop/ICE disconnect; todos os botões/teclas/botões do mouse pressionados recebem frame de liberação; listeners e polling são removidos ao perder foco, ocultar a página, encerrar ou trocar sessão; sequência de pacotes não reinicia dentro da mesma sessão; callbacks antigos não podem enviar dados para os canais da nova sessão; testes mock cobrem reconnect, blur, pagehide, disconnect e Stop; baseline CI verde. A confirmação de comandos no Xbox continuará dependendo de console físico.


## 2026-11-12 — ciclo autônomo: recuperação da suíte xHome e handoff de integração touch

- **SHA inicial da execução:** `3c6756e6b3b101db7b1efc318a4707c98a4bb9ad`.
- **SHA final das correções de teste/código desta execução:** `91b2367126c72898fb7254e46beb83c50e55c30b` (userscript permanece `4.12.75`; módulo Touch HUD permanece `1.1.9`).

- **Commit de handoff desta entrada:** `08844ae1dd133acddb8119efb04acb084456e2a6`.
- **Diagnóstico direto do GitHub:** os workflows baseline e xHome falhavam nos commits anteriores. O parse do userscript e do módulo estava aprovado; a falha era na suíte:
  1. O harness de `tests/xhome-discovery.test.cjs` começava em `const nxRemotePlay`, mas a inicialização passou a chamar `nxRemoteEmptyMediaDiagnostics()`, declarada imediatamente antes. O harness não incluía a função e provocava `ReferenceError` em 65 casos.
  2. `tests/project-integrity.test.cjs` dividia o arquivo por uma sequência literal de barra-n e procurava uma aspa que não existe na linha `@require`; também esperava encontrar o grupo de teclado/mouse diretamente dentro do builder, embora o builder o monte por `buildLegacyControls` e filtre os grupos.
  3. O teste de autoplay verificava a rejeição assíncrona de `video.play()` antes de o callback de rejeição atualizar o diagnóstico. A produção mantinha o estado `pending` até a Promise ser processada; o teste não aguardava o próximo ciclo do event loop.
- **Correções aplicadas somente aos testes:**
  - `tests/xhome-discovery.test.cjs`: o harness passa a incluir `nxRemoteEmptyMediaDiagnostics`; o teste de autoplay aguarda a conclusão assíncrona antes de validar `blocked`.
  - `tests/project-integrity.test.cjs`: leitura de versão e `@require` por expressões regulares ancoradas nas linhas de metadata; a verificação da aba `Teclado e mouse` acompanha o fluxo real do builder, que cria a ativação primeiro e depois filtra os grupos legados.
  - Nenhum código de produção, preferência do usuário, credencial ou protocolo xHome foi alterado nesta execução.
- **Commits incrementais publicados:**
  - `4d47e92565e854abb12458b2e91e1bba596a5d9e` — incluir helper de diagnóstico de mídia no harness xHome.
  - `de3bbc364ad85bd6937c2245094a954f4cadf32c` — corrigir extração inicial da versão/cache key (primeira correção; ainda insuficiente, substituída pelo ajuste posterior).
  - `73805d4a8f6ab7e40f34a021f3e49e768f433b83` — alinhar assertions de metadata e builder dinâmico.
  - `91b2367126c72898fb7254e46beb83c50e55c30b` — aguardar a Promise de rejeição de autoplay no teste.
- **Validação realmente executada:**
  - Parse V8 `new Function` do userscript, módulo Touch HUD e dois arquivos de teste: PASS.
  - GitHub Actions baseline run `43250235065`: PASS; `node --check` do userscript e do módulo: PASS; suíte completa: 156 testes, 153 PASS, 0 FAIL, 3 TODO; relatório estático: PASS e JSON válido.
  - GitHub Actions xHome regression run `43250234916`: PASS; suíte completa: 156 testes, 153 PASS, 0 FAIL, 3 TODO.
  - Os dois workflows foram executados no commit `91b2367126c72898fb7254e46beb83c50e55c30b`.
  - Não houve teste em Chrome/Edge, Android, sessão autenticada ou Xbox físico. Os testes xHome usam mocks e não comprovam transmissão nem comandos aceitos pelo console.
- **Reconciliação do roadmap:** o handoff anterior deste documento apontava novamente o lifecycle de entrada xHome como próxima tarefa. Isso já estava implementado e registrado na entrada `2026-11-12 12:34 UTC` (commit integrado `9756c9a3be97d16c05a24c7a4c5b6ade9eeea53e\)): captura opt-in de teclado/mouse físico, liberação em blur/ocultação/pagehide/Stop, sequência compartilhada e roteamento do gamepad com vídeo focado. O código atual e os testes de blur, Stop, desconexão de slot e canais confirmam que essa tarefa não deve ser repetida.
- **TAK — estado corrigido:** a sondagem passiva de `window.testTouchLayout` já existe em `nxTouchAdaptationHookSnapshot`; `tests/tak-runtime.test.cjs` cobre ausência do hook, função visível sem invocação, accessor sem executar getter, propriedade não-função e erro de inspeção. `docs/TAK-ARCHITECTURE.md` documenta schema v4.0 e limites. Isso conclui a implementação da sondagem passiva e sua cobertura mock, mas **não** prova que o hook esteja visível no contexto real de `play.xbox.com` nem que um layout seja aceito pelo cliente.
- **Auditoria do NimboTouch para a próxima etapa:** o módulo expõe `attachSession(raw)` e utiliza um `NimboXboxTransport` ligado ao objeto de sessão xCloud. A HUD atual emite mouse relativo e teclas configuradas (incluindo WASD); não cria um Gamepad Xbox sintético, não expõe atualmente um adaptador xHome e não encaminha ponteiros touch ao canal xHome. A captura física xHome atual ignora pointer events touch intencionalmente. Não confundir esta HUD de teclado/mouse com um gamepad virtual analógico.
- **Riscos e hipóteses:** uma integração correta deve adicionar um contrato de transporte explícito ao NimboTouch e ligá-lo aos encoders/canais xHome existentes, sem interceptar novamente eventos globais, sem substituir `navigator.getGamepads`, sem criar outro scheduler e sem alterar o transporte xCloud. A contribuição touch deverá ser desligada e liberar teclas/botões ao perder foco, ocultar a página, trocar sessão, desconectar ou pressionar Stop.
- **Tarefas concluídas nesta execução:** recuperação da suíte; correção dos testes de integridade; confirmação de CI verde; reconciliação do handoff de lifecycle; confirmação de que a sondagem TAK passiva já está implementada.
- **Pendências prioritárias:** validar mídia e comandos com Xbox físico; criar transporte NimboTouch-to-xHome para mouse relativo e teclado virtual; depois definir separadamente o contrato de gamepad virtual (analógico/botões) sem falsificar Gamepad API; obter evidência real do TAK em `play.xbox.com`; continuar auditoria histórica do giroscópio e sua fusão com touchpad.
- **Próxima tarefa concreta (P1 — contrato de transporte NimboTouch → xHome):** especificar e implementar um adaptador explícito no módulo Touch HUD para encaminhar mouse relativo, botões de mouse e teclas virtuais ao canal xHome já existente. Critérios de aceite: manter intacto `attachSession(raw)` do xCloud; ativar o modo xHome somente por ação explícita quando peer e canais estiverem prontos; reutilizar encoders/sequência xHome existentes; manter estado de teclas/botões e enviar releases em pointercancel, blur, visibilitychange, pagehide, troca de sessão e Stop; rejeitar callbacks de adaptador antigo; não criar `getGamepads` sintético nem scheduler adicional; testes mock cobrem movimento, botões, roda, teclas, multi-toque, cancelamento, backpressure e teardown; ambos workflows PASS. O resultado deve ser descrito como teclado/mouse virtual via toque, não como controle Xbox virtual nem analógico.


## 2026-11-12 17:08 UTC — xHome: confirmar adaptador NimboTouch e fechar handoff desatualizado

- **SHA inicial consultado nesta execução:** `7d90e2e7f16d538fa3fcebfe25d0884cb79e7dd3` (userscript `4.12.77`).
- **SHA final do código/testes desta execução:** `f711a7f57e153751b0de888f6609209a79b778d0`. O commit seguinte é apenas o handoff deste roadmap.
- **Versões confirmadas diretamente na main:** userscript `4.12.77`; módulo `modules/NimboXcloud-Touch-HUD.user.js` `1.2.1`.
- **Reconciliação obrigatória do handoff anterior:** a tarefa descrita como “contrato de transporte NimboTouch → xHome” já foi implementada depois do último registro do roadmap. Não reimplementar:
  - `fafef856b02ba53fd8c9351d87e96698220e95cc`: adaptador explícito no userscript e integração no módulo.
  - `6b1f0bd009e3433dc3f52bf5d3c0b6494533ed51`: teste do contrato público do módulo.
  - `0bb226ccdbb2c03072e32a3e791ca6734d7fa13a`: estado público `isRemoteEnabled`.
  - `1ab97294f89f5f33dad392a96077951621fd0921`: permite desativar o HUD remoto mesmo quando pausado.
  - `db44b020b368289650f7ec5f54bcd2e8f3f90c53`: regressão para o estado pausado.
  - `7d90e2e7f16d538fa3fcebfe25d0884cb79e7dd3`: changelog da integração.
- **Contrato existente confirmado no código atual:**
  - O módulo mantém `attachSession(raw)` e o transporte xCloud. O caminho remoto é separado por `attachRemoteInputAdapter` / `clearRemoteInputAdapter`, `startRemote` / `stopRemote`, `isRemoteActive` / `isRemoteEnabled`.
  - Em modo xHome, a HUD envia mouse relativo, botões do mouse, roda e teclas virtuais pelo adaptador explícito; o módulo não substitui `navigator.getGamepads`.
  - O userscript vincula o adaptador a `requestId`, identidade do `RTCPeerConnection` e identidade dos data channels; exige sessão/WebRTC/canal `input` prontos, usa os encoders e a sequência compartilhada existentes, respeita backpressure e rejeita sessão obsoleta.
  - Stop/pausa libera teclas e botões antes de desativar o modo remoto; o detach limpa o adaptador antes de fechar os canais.
  - O modo remoto tem `canResume` e `checkResume` próprios; não depende de `STATES.isPlaying` ou `api.streamSession` do xCloud. A inicialização remota seleciona o adaptador xHome e não executa `activateKeyboardMouse()`, que permanece exclusivo do transporte xCloud.
- **Alteração desta execução:** foram acrescentadas três regressões estruturais em `tests/nimbo-touch-xhome.test.cjs`:
  1. isolamento do gate de retomada xHome em relação ao estado da sessão xCloud;
  2. ordem de liberação dos inputs e descarte do adaptador no Stop;
  3. seleção do transporte remoto sem alterar a configuração de entrada xCloud.
- **Arquivos alterados nesta execução:** `tests/nimbo-touch-xhome.test.cjs` e este `DEVELOPMENT_ROADMAP.md`. Nenhum código de produção, configuração de usuário, credencial ou protocolo foi alterado.
- **Commits de teste:** `3752020ae2033bace967dd2ea66223d57787979b` e `493c9af7a694f7f79a4ab13f340c0da06f41fe35` tiveram assertions incompletas e CI vermelho; os problemas eram exclusivamente os matchers de teste (escape duplicado e espaço no método `stop() {`). Corrigido em `f711a7f57e153751b0de888f6609209a79b778d0`. Nenhuma falha de produção foi identificada por essas execuções.
- **Validação final no GitHub Actions, no SHA `f711a7f`:**
  - Baseline run [43266212243](https://github.com/breno-bgod/NimboXcloud/actions/runs/43266212243): PASS — parse do userscript, parse do módulo Touch HUD, suíte completa e relatório estático.
  - xHome regression run [43266212416](https://github.com/breno-bgod/NimboXcloud/actions/runs/43266212416): PASS — parse do userscript e suíte de regressão NX/xHome.
  - Verificação estrutural adicional dos novos invariantes no runtime desta execução: PASS.
  - O workflow executa Node 22; não há `package.json` nem build/lint separado configurado no repositório.
- **Limites e riscos:** não houve teste em Chrome/Edge, Android, sessão autenticada ou Xbox físico. O adaptador confirma envio local ao data channel, não aceitação dos comandos pelo console. A HUD atual continua sendo teclado/mouse virtual (incluindo joystick WASD); não é um gamepad Xbox virtual analógico. O xHome ainda não foi homologado com vídeo/áudio e gameplay reais. A sondagem TAK continua passiva; `testTouchLayout` não foi invocado e sua disponibilidade no runtime retail de `play.xbox.com` não está comprovada.
- **Tarefas concluídas nesta execução:** auditoria do HEAD real; confirmação de que a integração NimboTouch → xHome já existe; fechamento do handoff obsoleto; três testes de regressão do lifecycle remoto; ambos workflows verdes.
- **Pendências prioritárias:** validar transmissão e entrada em Xbox físico; implementar um caminho de gamepad virtual verdadeiro sem falsificar Gamepad API; confirmar runtime TAK em `play.xbox.com`; retomar comparação do algoritmo histórico de giroscópio/touchpad; continuar estabilidade do xCloud atual.
- **Próxima tarefa concreta (P1 — contrato de gamepad virtual por toque para xHome, sem UI inicialmente):** criar um adaptador puro que aceite estado normalizado de analógicos e botões e encaminhe diretamente pelo encoder/canal de gamepad xHome já existente. Critérios de aceite: reutilizar `nxRemoteEncodeGamepadFrame`, `nxRemoteSendGamepadFrame` e o lifecycle de slots existente; registrar um slot virtual apenas uma vez; mapear eixos em `[-1,1]`, aplicar deadzone e limitar diagonais sem alterar a magnitude intencional; enviar estado neutro e `gamepadChanged(false)` em Stop, pausa, desconexão, troca de sessão e descarte; rejeitar frames de adaptadores antigos e respeitar backpressure; testes cobrem eixos, botões, diagonais, slot, release e sessão obsoleta; não sobrescrever `navigator.getGamepads`, não criar RAF/scheduler paralelo e não chamar isso de gamepad funcional antes de validação com Xbox físico. Para xCloud retail, manter TAK como caminho preferencial e não assumir que o transporte xHome é reutilizável no streaming em nuvem.


## 2026-11-12 18:01 UTC — xHome: descarte do estado virtual ao suspender entradas

- **SHA inicial da execução:** `a19503affa27e41e7380bd31bc79ca70d6f116f3` (userscript `4.12.78`; módulo Touch HUD `1.2.2`).
- **Diagnóstico:** o contrato de gamepad virtual por toque já havia sido implementado em `a5e66c19fc2693d01601f95af3d23e6454e8096d`, mas `nxRemoteGamepadSuspend()` neutralizava os slots sem descartar `nxRemoteVirtualGamepad`. A API `sendGamepad()` também aceitava novos snapshots enquanto `nxRemoteGamepadPaused` estava ativo. Ao recuperar foco/visibilidade ou fechar o painel NX, um snapshot antigo poderia ser reenviado pelo scheduler sem novo gesto do usuário.
- **Correção em `NimboXcloud.user.js` v4.12.79:**
  - suspensão descarta o estado virtual de toque antes de enviar frames neutros;
  - suspensão repetida continua idempotente quando já está pausada e não há estado virtual pendente;
  - atualizações virtuais são rejeitadas enquanto o scheduler estiver pausado;
  - após o scheduler voltar a aceitar entrada, somente um snapshot novo pode registrar/acionar o slot virtual;
  - o gamepad físico, o slot compartilhado, a sequência de pacotes e o caminho xCloud não foram alterados.
- **Regressão adicionada:** `tests/xhome-discovery.test.cjs` verifica neutralização, descarte do estado retido, suspensão repetida sem flood, rejeição de updates obsoletos, desregistro do slot no resume e recuperação com input novo.
- **Arquivos alterados:** `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md` e este documento. O módulo Touch HUD permanece em `1.2.2`; a interface analógica ainda não foi criada.
- **Commits publicados:** `059a39563e2fe4e6bac90c698aacc9f15cbccb15` (correção e versão 4.12.79); `670fd1deba950f4dc8ccd681c8a9aa0ce905d2df` (teste de lifecycle); `eb85b740a4153206642f29c5ac4a0a4f11f2dd8a` (changelog). O commit desta entrada documental será o HEAD final do ciclo.
- **Validação executada neste runtime:** parse V8 `new Function` do userscript, teste e módulo Touch HUD: PASS. Harness isolado dos helpers reais extraídos do userscript: 7/7 verificações PASS (aceitação antes da suspensão, descarte do estado, frame neutro, pausa, idempotência, rejeição durante pausa e aceitação após resume).
- **Limitação de ambiente:** clone local do GitHub falhou por DNS (`Could not resolve host: github.com`); portanto `node --check` e `node --test tests/*.test.cjs` não foram executados localmente. A consulta disponível de status de commit não expõe check-runs do GitHub Actions; não declarar CI verde sem confirmação posterior. Nenhum Chrome/Edge, Android, sessão xHome autenticada ou Xbox físico foi testado.
- **Estado Remote Play:** descoberta, sessão, SDP/ICE, canais, mídia diagnóstica, gamepad físico, teclado/mouse físico, HUD K/M por toque e contrato de gamepad virtual por toque estão implementados em níveis experimentais/mocks. A superfície analógica ainda não está presente na HUD; nenhum teste prova que o Xbox aceite os frames. Remote Play permanece incompleto.
- **Riscos/hipóteses:** a correção evita reativação de estado de toque obsoleto após suspensão; a liberação efetiva do comando no console e a resposta de jogo ainda dependem de hardware autorizado. A interface futura deverá enviar snapshots novos durante o gesto e liberar estado em `pointerup`, `pointercancel`, `lostpointercapture`, blur, ocultação, Stop e troca de sessão.
- **Tarefas concluídas:** contrato normalizado de gamepad virtual xHome (4 eixos, 17 botões, deadzone radial, clamp circular, triggers analógicos, slot livre); proteção contra replay do estado virtual ao suspender; regressão de lifecycle.
- **Pendências prioritárias:** homologar mídia/controles em Xbox físico; criar a superfície analógica editável dentro do NimboTouch sem substituir a HUD WASD existente; confirmar runtime TAK em `play.xbox.com`; retomar auditoria histórica do gyro/touchpad; manter auditoria de interceptações e inicialização xCloud.
- **Próxima tarefa concreta (P1 — superfície de controle virtual no NimboTouch, inicialmente xHome):** adicionar modo opcional separado do teclado/mouse, com dois sticks analógicos e botões padrão Xbox (face buttons, bumpers, triggers, D-pad, Menu/View), usando o contrato `sendRemoteGamepadState()` já existente. Critérios de aceite: layout editável e salvo por perfil sem migrar destrutivamente perfis antigos; multi-touch com identificadores de ponteiro independentes; eixos normalizados e deadzone aplicada uma única vez; triggers preservam valores analógicos; todos os estados são neutralizados em pointerup/cancel/lostpointercapture, blur, visibility hidden, menu, Stop e troca de sessão; nenhuma nova Gamepad API hook ou scheduler; Cloud Gaming continua no caminho TAK/nativo e não recebe gamepad sintético; testes determinísticos de gestos simultâneos, botões, diagonais, cancelamento, suspensão e teardown; ambos workflows baseline/regression PASS antes de considerar a interface concluída.


## 2026-11-12 18:12 UTC — xHome: manter scheduler virtual disponível sem Gamepad API

- **SHA inicial desta correção complementar:** `efa677b2e52a8360c0b774bfaf01e54d23cebc11` (userscript `4.12.79`).
- **Regressão identificada após a correção de suspensão:** ao limpar `nxRemoteVirtualGamepad`, o fallback de `nxGamepadUiTick()` retornava imediatamente quando `navigator.getGamepads` não existia (ou lançava erro) e não havia estado virtual. Assim, o scheduler nunca recebia o snapshot vazio necessário para limpar `nxRemoteGamepadPaused`; o primeiro gesto após a suspensão seria rejeitado indefinidamente em navegadores sem Gamepad API.
- **Correção em `NimboXcloud.user.js` v4.12.80:** o loop agora tenta ler Gamepad API dentro de um único `try` e continua com `pads=[]` quando a API está ausente/lança erro. O scheduler compartilhado continua ativo, neutraliza/desregistra slots físicos não observáveis e reabre o gate para um novo estado virtual quando a sessão está focada. Nenhum novo loop, hook ou Gamepad sintético foi criado.
- **Regressões:** `tests/xhome-discovery.test.cjs` adiciona cenário dinâmico de retomada com snapshot físico vazio; `tests/nimbo-touch-xhome.test.cjs` garante que o bloco `nxGamepadUiTick` não retorna antes de chamar o scheduler quando Gamepad API está ausente.
- **Arquivos alterados nesta correção complementar:** `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `tests/nimbo-touch-xhome.test.cjs`, `CHANGELOG.md` e este documento.
- **Commits:** `fa5466b5049feabefb042ec2a970516186ccf5ea` (produção e versão 4.12.80); `3e6a0953bdf637f57568eeeda0fcf73af09044d0` (teste dinâmico); `554ba06f9e9d6d6dac41e1a897b64b5ec4658392` (teste estrutural); `a0cec2e804af0b2eadb1d5cbfdfd93cd8efd0d7a` (changelog). O commit desta entrada documental passa a ser o HEAD final.
- **Validação executada:** parse V8 `new Function` do userscript, módulo e ambos os arquivos de teste após a segunda correção: PASS. Harness isolado dos helpers reais da suspensão: 7/7 PASS. Execução isolada da função real `nxGamepadUiTick()` com `navigator.getGamepads` ausente e com método que lança erro: 2/2 cenários chamaram o scheduler com snapshot vazio e `allowInput=true`. Node `--check`/suíte completa ainda não foram executados.
- **Limitações:** clone local continua bloqueado por falha DNS ao resolver `github.com`; a consulta de status do conector não expõe check-runs do Actions (retornou lista vazia). Não declarar CI verde. Sem teste em browser, Android, sessão autenticada ou Xbox físico.
- **Estado:** versão 4.12.80 corrige o replay de estado virtual e mantém o scheduler apto a retomar sem Gamepad API. Remote Play segue experimental; a superfície analógica de toque não existe ainda e o protocolo/controle não foi homologado em console.
- **Próxima tarefa concreta (P1 — superfície de controle virtual no NimboTouch, inicialmente xHome):** adicionar modo opcional separado do teclado/mouse, com dois sticks analógicos e botões padrão Xbox, usando `sendRemoteGamepadState()`. Critérios: layout editável por perfil com migração não destrutiva; multi-touch independente; eixos normalizados e deadzone aplicada uma vez; triggers analógicos; neutralização em pointerup/cancel/lostpointercapture, blur, ocultação, menu, Stop e troca de sessão; nenhuma nova Gamepad API hook/scheduler; xCloud permanece no caminho TAK/nativo; regressões de gestos simultâneos, botões, diagonais, cancelamento, suspensão, ausência de Gamepad API e teardown; baseline/regression PASS antes de concluir.


## 2026-11-12 18:47 UTC — estabilizar HUD, corrigir CI e restaurar integração xHome na main

- **SHA inicial consultado no começo do ciclo:** `3642d4a17231a22aaa9615375e39be4fdf61363a` (userscript 4.12.80; Touch HUD 1.2.2).
- **SHA final da implementação e dos testes:** `880b5ed6fd6c64a62d7d5c5aa11d858da61499a4` (userscript 4.12.82; Touch HUD 1.2.3). O commit desta entrada documental é o handoff subsequente da main.
- **Bug de produção encontrado no editor HUD:** `BxTouchpadUnified.removeKey(id)` usava `this.bindings.filter(b=>b!==b)`, condição sempre falsa. Remover uma única tecla personalizada apagava todas as bindings em memória e podia eliminar os demais controles quando o usuário salvava. Corrigido para filtrar somente o ID selecionado; geometrias e bindings restantes são preservadas.
- **Falha de CI identificada:** três assertions do teste xHome estavam com escapes duplicados e procuravam barras invertidas literais, apesar do bloco `nxGamepadUiTick` estar correto. Corrigidas as expressões regulares. O teste dinâmico de `removeKey` teve inicialmente um delimitador de método incorreto; ajustado para localizar `clearKeys()` diretamente.
- **Regressão de promoção concorrente identificada e neutralizada:** o commit `8814566a6c9c0d877ac21660023af9eae8684ab1` promoveu para main um snapshot da branch `fix/virtual-gamepad-panel-integration`. Esse snapshot apontava `@updateURL`/`@downloadURL` para a branch experimental, removia o adaptador NimboTouch → xHome, removia o contrato de gamepad virtual xHome e fazia os testes de entrada/xHome falharem em cascata. O commit `8fae652b85ddb64d6726dcf283ce89b2760212b5` restaurou a base estável de xHome, manteve a versão pública 4.12.82 e recolocou as URLs de atualização na branch main. A branch experimental foi preservada e não foi modificada.
- **Versões finais confirmadas diretamente na main:** userscript metadata/runtime `4.12.82`; `@require` cache key `nx_version=4.12.82`; módulo Touch HUD metadata/runtime `1.2.3`.
- **Arquivos alterados no ciclo:** `NimboXcloud.user.js`, `modules/NimboXcloud-Touch-HUD.user.js`, `tests/nimbo-touch-xhome.test.cjs`, `tests/nimbo-touch-config.test.cjs`, `CHANGELOG.md` e este roadmap.
- **Commits relevantes publicados:** `dd12316243ebc340fc93dada43816ad8c00c9cab` (corrige remoção de bindings, corrige assertions xHome e alinha versões); `8814566a6c9c0d877ac21660023af9eae8684ab1` (promoção concorrente auditada e considerada insegura); `8fae652b85ddb64d6726dcf283ce89b2760212b5` (restaura xHome e URLs main); `880b5ed6fd6c64a62d7d5c5aa11d858da61499a4` (normaliza assertions de URL e protege o contrato xHome).
- **Regressões adicionadas:** execução em VM do método real `removeKey`, verificando que só o ID solicitado desaparece; verificação da presença dos adaptadores e contrato de gamepad virtual xHome; verificação de que update/download URLs continuam apontando para main; assertions corrigidas para o scheduler sem Gamepad API.
- **Validação realmente executada:**
  - Parse V8 `new Function` do userscript, módulo e arquivos de teste: PASS.
  - Harness V8 do método real `removeKey`: PASS; os controles não selecionados e suas geometrias permanecem.
  - Harness das quatro expressões regulares do scheduler: 4/4 PASS.
  - GitHub Actions baseline [43283413913](https://github.com/breno-bgod/NimboXcloud/actions/runs/43283413913), no SHA `880b5ed`: PASS — parse do userscript, parse do módulo, suíte completa e relatório estático; 175 testes, 172 PASS, 0 FAIL, 3 TODO.
  - GitHub Actions xHome regression [43283414014](https://github.com/breno-bgod/NimboXcloud/actions/runs/43283414014), no SHA `880b5ed`: PASS — 175 testes, 172 PASS, 0 FAIL, 3 TODO.
  - Não houve teste em Chrome/Edge, Android, sessão autenticada ou Xbox físico.
- **Descobertas/riscos:** a branch `fix/virtual-gamepad-panel-integration` contém uma interface experimental que envolve Gamepad API e tem uma estratégia diferente do contrato xHome. Ela não deve ser promovida diretamente: a promoção observada removeu a integração remota e quebrou os testes. Avaliar essa branch separadamente antes de qualquer rebase/merge. O adaptador NimboTouch → xHome e o contrato `sendRemoteGamepadState()` estão preservados na main.
- **Tarefas concluídas nesta execução:** corrigida exclusão destrutiva de bindings do editor HUD; corrigidas assertions que mantinham CI vermelho; restaurados xHome e URLs de distribuição; ambos workflows verdes no mesmo SHA final de código/testes.
- **Pendências prioritárias:** homologar mídia e comandos com Xbox físico; implementar superfície analógica editável no NimboTouch para xHome; avaliar separadamente a branch experimental de Gamepad HUD; confirmar TAK no runtime retail; continuar auditoria do giroscópio/touchpad histórico.
- **Próxima tarefa concreta (P1 — superfície de gamepad virtual por toque no NimboTouch, somente xHome nesta etapa):** implementar modo opcional separado do teclado/mouse, usando o contrato `sendRemoteGamepadState()` existente. Critérios: dois sticks e botões padrão; layout editável e persistido por perfil sem migração destrutiva; multi-touch por pointerId independente; eixos normalizados e deadzone aplicada uma única vez; triggers analógicos; neutralização em pointerup/cancel/lostpointercapture, blur, visibility hidden, menu, Stop e troca de sessão; sem novo hook Gamepad API ou scheduler; xCloud retail permanece no caminho TAK/nativo; testes determinísticos de gestos simultâneos, botões, diagonais, cancelamento, suspensão e teardown; ambos workflows baseline/regression PASS.


## 2026-11-12 18:49 UTC — revisão de atualizações em branches de controle virtual

- **HEAD inicial/final da main nesta revisão:** `00872cd6c6ae5b3d3f0ae081297fa37ada07a007`. A branch `main` não recebeu commits novos desde a última auditoria; userscript permanece em `4.12.82`. Módulo Touch HUD permanece na linha estável `1.2.3`.
- **Atualizações encontradas fora da main:**
  - `fix/virtual-gamepad-panel-integration`, HEAD `67ea7e9857a42825084c1d99387a6c51d5efa3d2`, está 17 commits à frente e 31 atrás de `main`. Inclui HUD Xbox virtual integrada ao painel NX, editor de posição/tamanho/ocultação, transparência, modos de toque/hold e documentação de teste. O commit mais recente é de 18:32 UTC.
  - `feature/virtual-gamepad-v0.1`, HEAD `3761c257337da43364e52c7c6117f91867e593ff`, está 5 commits à frente e 31 atrás de `main`. Adiciona módulo independente `modules/NimboXcloud-Virtual-Gamepad.user.js` e roteiro de teste. Declara `@sandbox raw` para tentar disponibilizar a Gamepad API sintética no contexto principal.
- **Riscos que impedem promoção direta de `fix/virtual-gamepad-panel-integration`:**
  1. O metadata da branch aponta `@updateURL` e `@downloadURL` para a própria branch experimental, não para `main`.
  2. A branch divergiu antes das correções recentes de xHome. O arquivo contém funções de input xHome mais antigas, mas não preserva o adaptador NimboTouch → xHome e o contrato de toque remoto que existem na main atual. A comparação de branches confirma divergência significativa; não fazer merge direto.
  3. A HUD expõe um Gamepad sintético sobrescrevendo/fornecendo `navigator.getGamepads` no contexto JavaScript. Isso não cria hardware no sistema operacional; a aceitação depende do mundo de execução e de como o cliente xCloud consulta a API. A branch integrada não declara `@sandbox raw`; a visibilidade do patch para o cliente retail precisa ser comprovada no Tampermonkey antes de qualquer promoção.
  4. Os workflows encontrados para a branch experimental falharam em commits anteriores (`4dc4b318` e `66fc6d3c`); não foi encontrado run para o HEAD mais recente `67ea7e9`. Portanto, o HEAD atual não tem CI comprovado.
  5. A branch `feature/virtual-gamepad-v0.1` é uma implementação independente, também não testada no HEAD atual. Não instalar junto com a versão integrada: ambas pretendem prover controle virtual e podem competir por UI/entrada.
- **Decisão técnica desta revisão:** nenhuma alteração de produção foi promovida. Preservar as duas branches e a main estável. Não descartar trabalho experimental. A integração deve ser feita por rebase/port seletivo sobre o HEAD atual, mantendo o transporte xHome, os encoders e o lifecycle existentes; não substituir o gerenciador de entradas nem duplicar a HUD.
- **Validação realizada:** consulta direta da branch main, commits recentes, árvore raiz, diretório de testes, roadmap, userscript principal e metadados de branches; comparação GitHub main...branches; leitura das instruções e do código do controle virtual nas duas branches; consulta dos workflows disponíveis. Não houve execução local de Node, parse, navegador, Tampermonkey ou jogo nesta revisão.
- **Estado atual confirmado:** main permanece em `4.12.82`; a superfície visual de controle virtual não está integrada na main. O contrato de gamepad remoto xHome da main permanece separado e experimental. Nenhuma transmissão/entrada foi homologada em Xbox físico.
- **Próxima tarefa concreta (P1 — portar seletivamente a HUD virtual para a main sem perder xHome):** comparar os builders/estado/estilos do painel experimental com o módulo Touch HUD e o contrato xHome atuais; portar somente a camada visual/editável e o mapeamento de gestos para `sendRemoteGamepadState()` em xHome, mantendo o caminho retail explicitamente separado e sem sobrescrever `navigator.getGamepads` até haver prova de contexto MAIN_WORLD e compatibilidade. Critérios de aceite: URLs de distribuição apontam para main; adaptador e lifecycle xHome atuais permanecem; layout antigo e preferências NimboTouch não são sobrescritos; testes de pointerId, multi-touch, cancelamento, blur, ocultação, Stop, sessão obsoleta e coexistência com controle físico; workflows baseline e xHome PASS no HEAD final; teste real no Tampermonkey documentado separadamente.



## 2026-11-12 19:45 UTC — NimboTouch: HUD de gamepad virtual xHome

- **SHA inicial da execução:** `393e2bf04219365585bd94df5bfc124ad689a010` — userscript `4.12.82`, módulo Touch HUD `1.2.3`.
- **SHA final de código/testes/changelog antes desta entrada:** `09739f3ff1d7c556b5484c2e9ccdb144e8d382ac` — userscript `4.12.84`, módulo Touch HUD `1.2.5`.
- **Lacuna confirmada no início:** a main já possuía normalizador de gamepad remoto com 4 eixos, 17 botões, deadzone radial de 0,08, encoder, slot compartilhado, scheduler único e descarte por sessão. Faltava a superfície de controle analógico por toque. As branches experimentais antigas não foram mescladas.
- **Recurso implementado:** NimboTouch agora oferece um botão separado para ativar um controle Xbox virtual durante uma sessão xHome. A HUD inclui dois analógicos, A/B/X/Y, LB/RB, LT/RT com pressão analógica, D-pad, View/Menu, L3/R3 e botão Xbox oculto por padrão. O estado é enviado pelo adaptador `remoteAdapter.sendGamepad()` existente, sem inventar um transporte novo.
- **Editor e persistência:** os controles usam o sistema de geometria já existente em `BxTouchpadProfiles`; posição, tamanho, opacidade e visibilidade ficam no layout do perfil ativo. Perfis antigos não exigem migração nem alteração de chaves. O editor continua mostrando ambos os conjuntos para que possam ser ajustados.
- **Separação de modos:** quando o gamepad virtual está ligado, a área de mouse, o joystick WASD e os botões de teclado/mouse são ocultados. Ao desligar o gamepad, esses controles voltam. Em edição, ambos os conjuntos permanecem visíveis. O xCloud retail continua no caminho nativo/TAK e não recebe gamepad sintético.
- **Segurança do input:** um helper sem DOM controla ownership por `pointerId`, permite os dois sticks simultaneamente e vários botões em paralelo, limita cada stick ao círculo unitário e mantém o deadzone somente no normalizador xHome. LT/RT preservam valores contínuos. `pointerup`, `pointercancel` e `lostpointercapture` liberam o estado; blur, página oculta, menu, pausa, Stop e teardown chamam a liberação do adaptador.
- **Arquivos alterados:** `modules/NimboXcloud-Touch-HUD.user.js`, `tests/nimbo-touch-virtual-gamepad.test.cjs`, `NimboXcloud.user.js`, `CHANGELOG.md` e este documento. Versões/cache alinhados: userscript `4.12.84`, módulo `1.2.5`, `@require nx_version=4.12.84`.
- **Commits publicados nesta execução:**
  - `c295555a016334512347f93cbbbb08327f312c97` — superfície virtual xHome e helper de estado;
  - `7930d29e101991924e04f1a9648ca9ec9946a944` — regressões de gestos e lifecycle;
  - `314cdc8f4b692a7e0e5b26462b2692be9a6fb168` — versão/cache `4.12.83`;
  - `c60a686c12484caedfa7ada73ac445aa6939f40f` — changelog `4.12.83`;
  - `eea0486dee95041910e0f71c52ecb7ceec493ccd` — separação visual entre gamepad e teclado/mouse;
  - `f61a3002e1194ed4e58cec1e96078a88a3c5fe5f` — teste de exclusividade dos modos;
  - `c0e3dbfd5726a47b7e68ae62b8fc0e07c2b42c44` — versão/cache `4.12.84`;
  - `09739f3ff1d7c556b5484c2e9ccdb144e8d382ac` — changelog `4.12.84`.
- **Validação realmente executada:**
  - Parse V8 `new Function` do módulo, userscript e novo arquivo de teste: PASS.
  - Harness V8 do helper real extraído do módulo: PASS — clamp diagonal, triggers analógicos, suspensão/liberação, entrada nova após resume e desativação.
  - GitHub Actions baseline [43293397053](https://github.com/breno-bgod/NimboXcloud/actions/runs/43293397053), SHA `09739f3`: PASS — syntax check, Touch HUD syntax check, baseline tests e static risk report.
  - GitHub Actions regressions [43293386529](https://github.com/breno-bgod/NimboXcloud/actions/runs/43293386529), SHA `c0e3dbf`: PASS — syntax check e suíte NX/xHome; inclui o novo teste de gamepad virtual.
  - GitHub Actions baseline [43293386316](https://github.com/breno-bgod/NimboXcloud/actions/runs/43293386316), SHA `c0e3dbf`: PASS.
  - Não há build/lint separado configurado no repositório; os workflows executaram Node 22 e as suítes de teste.
- **Limites e riscos:** não houve Chrome/Edge, Tampermonkey, Android, sessão xHome autenticada ou Xbox físico nesta execução. Os testes comprovam o helper e as regressões do repositório, não a aceitação dos comandos pelo console nem o funcionamento em jogos reais. Remote Play permanece experimental e não deve ser anunciado como homologado.
- **Tarefas concluídas:** superfície analógica opcional; modo visual exclusivo em relação a K/M; layout editável por perfil; ownership multi-touch; triggers analógicos; neutralização no lifecycle; versão e cache atualizados; baseline e regressão verdes.
- **Pendências prioritárias:** homologar input e streaming com Xbox físico; testar a HUD no Tampermonkey em Android e desktop; validar retomada e liberação em troca real de sessão; continuar a auditoria de compatibilidade xCloud e do caminho TAK; investigar a integração histórica de giroscópio sem duplicar gerenciadores.
- **Próxima tarefa concreta (P1 — teste de integração do encoder xHome com canal de dados falso):** executar os métodos reais de normalização, registro de slot, encoder e scheduler contra um `RTCDataChannel` simulado. Critérios de aceite: verificar bytes/flags dos quatro eixos e 17 botões, pressão LT/RT, deadzone aplicada uma vez, registro único do slot, frames neutros e `gamepadChanged(false)` no release, backpressure, sessão obsoleta, ausência de Gamepad API e recuperação após suspensão; ambos workflows PASS. Depois disso, registrar separadamente o teste obrigatório em Xbox físico, sem declarar aceitação antes de realizá-lo.



## Registro de execução — 2026-11-12 — reorganização do painel NX (4.12.86)

- **HEAD inicial consultado:** `9b87a89e056d2471a336cf90d6f2985182223f86`.
- **Commits de código e validação:** `4a92f65215b2448794c0cfc7650e506a3b5aa47b` (primeira organização), `6faed997f6669f1b6749ad742934c9ff50b944d9` (configuração do monitor somente em Estatísticas e enumeração de áudio escopada), `d4c083c31c755a1ffc22be70e3f6d9f0b81ca350` (testes alinhados e verdes).
- **Arquivos alterados:** `NimboXcloud.user.js`, `tests/nx-panel-regression.test.cjs`, `tests/project-integrity.test.cjs`, `CHANGELOG.md` e este documento.
- **Correções estruturais:** criada a categoria Gamepad; renomeada a página de controles por toque para Teclado e mouse; separados Vídeo, Imagens, Streaming e Estatísticas; adicionados Remote Play e Interface à navegação; separado Região da loja dos data centers de streaming.
- **Correções de classificação:** voz agora extrai a linha Microfone de Acessórios, não o terceiro grupo de diagnóstico; vibração migrou para Gamepad; giroscópio migrou para Gamepad; atalhos de controle e teclado foram divididos; perfis visuais JSON passaram para Imagens; enquadramento e tela cheia passaram para Vídeo.
- **Telemetria:** monitor configurável e métricas estão em Estatísticas; Início mantém o resumo e as categorias. Streaming mostra data center, rede, qualidade e medições de servidores.
- **Preferências e arquitetura:** as chaves locais existentes foram mantidas; os builders originais são reutilizados e seus nós movidos por categoria. Nenhum transporte, Gamepad API, módulo NimboTouch ou gerenciador de input foi reimplementado.
- **Precisão de recursos:** o processamento gráfico existente é WebGL2/Clarity Boost e filtros locais. FSR 1 não foi encontrado e não é apresentado como disponível.
- **Validação:** [baseline 43299048415](https://github.com/breno-bgod/NimboXcloud/actions/runs/43299048415) PASS no commit `d4c083c` — Node 22, `node --check` do userscript e Touch HUD, `node --test tests/*.test.cjs` e relatório estático. [Regressões 43299046977](https://github.com/breno-bgod/NimboXcloud/actions/runs/43299046977) PASS no mesmo commit — sintaxe e testes NX/xHome. As primeiras execuções falharam por duas asserções desatualizadas; elas foram atualizadas e a execução final passou.
- **Não validado:** aparência/gestos no Chrome/Edge real, Android/DeX, sessão xCloud autenticada e partida com controle.
- **Próxima tarefa concreta:** continuar o teste isolado do encoder xHome contra um `RTCDataChannel` simulado, cobrindo sequência compartilhada, estado dos quatro eixos e 17 botões, triggers, deadzone aplicada uma vez, backpressure, sessão obsoleta e liberação neutra no encerramento. Depois, homologar separadamente com Xbox físico; não declarar controle/streaming xHome concluídos antes dessa prova.

## 2026-11-12 — xHome: descritor browser e perfil de qualidade coerentes (4.12.87)

- **SHA inicial consultado nesta execução:** `072d05bf5babbae6e869bc5eee203be84e746c43` (userscript 4.12.86; main continha somente a reorganização do painel desde o último código validado).
- **SHA final de código/testes validado:** `58a5dd5f178a94d8bc7483f08afccda65e17322c`. **HEAD após changelog e antes deste registro:** `c80254e93f40a36f42435552c480d0010ebed8f3`. O commit desta entrada será o HEAD documental final.
- **Versão publicada:** userscript `4.12.87`; `@version`, constante `VER` e chave de cache `@require nx_version` alinhadas. O módulo NimboTouch permanece `1.2.5`.
- **Reconciliação do handoff anterior:** a tarefa de testar encoder/scheduler xHome com canais de dados simulados já estava implementada em `tests/xhome-discovery.test.cjs` no HEAD inicial. Os testes existentes cobrem pacote de 38 bytes, sequência, 17 botões, quatro eixos, triggers, deadzone/clamp, slots, neutralização, backpressure, sessão obsoleta, ausência de Gamepad API e retomada após suspensão. Não foi duplicado outro encoder nem outro scheduler; a tarefa anterior fica concluída por evidência de código/testes.
- **Descoberta técnica:** o código NimboXcloud enviava `clientAppType:'native'`, `Microsoft.GamingApp` e modelo fictício `Surface Pro`, além de fixar `osName:'windows'` para todas as qualidades. Isso contrariava o objetivo de cliente web e a recomendação do próprio estudo comparativo de não afirmar um modelo físico inexistente. A UI oferecia 720p, 1080p e 1080p HQ, mas o descritor não acompanhava a escolha.
- **Fonte externa conferida:** Better xCloud upstream, branch `typescript`, HEAD `ea4d19f2800cee9cfa387a0c9c37b3711cf208c7` (commit de 2026-11-11 14:29 UTC), arquivos `src/utils/network.ts` e `src/utils/xhome-interceptor.ts`; licença MIT conferida no arquivo `LICENSE`. A função upstream `getOsNameFromResolution` relaciona HQ a `tizen`, 1080p a `windows` e o fallback 720p a `android`; `generateMsDeviceInfo` descreve um cliente browser/SDK web e modelo desconhecido. Foi adaptado apenas esse contrato de metadados, não o userscript completo. Nenhum código AGPL do XStreaming foi incorporado.
- **Correção em `NimboXcloud.user.js`:**
  - adicionadas funções puras `nxRemoteResolutionProfile()` e `nxRemoteBuildDeviceInfo()`;
  - descritor xHome agora declara `clientAppType:'browser'`, `sdktype:'web'`, modelo `unknown` e `clientAppId` do host atual, removendo a falsa identidade `Surface Pro`/aplicativo nativo;
  - 720p usa perfil Android e 1280×720; 1080p usa Windows e 1920×1080; 1080p HQ usa Tizen e 1920×1080;
  - o mesmo perfil é enviado no cabeçalho `X-MS-Device-Info`, em `settings.osName` e no payload `dimensionschanged`;
  - o perfil é capturado no início da sessão e passado explicitamente a `nxRemoteInitDataChannels`, evitando que uma mudança posterior na seleção altere dimensões durante o handshake;
  - autenticação, bearer, endpoints, autorização, SDP/ICE, canais e transporte de input não foram alterados.
- **Arquivos afetados:** `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md` e este roadmap.
- **Commits publicados nesta execução:**
  - `8a82be8d740e770f8bf143df2f7926b994d4e135` — primeiro descritor browser/perfil; CI detectou referência fora de escopo durante inicialização dos canais.
  - `5f4bdc9f2ef97cc07587fb59b93af61e7c19babe` — primeiro conjunto de testes; permaneceu vermelho pelo mesmo problema.
  - `b5bcc718d2cb31e2e9e97b0afb1168a295819d7b` — captura do perfil no início e passagem explícita para a inicialização dos data channels.
  - `58a5dd5f178a94d8bc7483f08afccda65e17322c` — regressões para dimensões 720p e coerência do perfil selecionado.
  - `c80254e93f40a36f42435552c480d0010ebed8f3` — changelog.
- **Validação final real no SHA `58a5dd5`:**
  - Baseline [run 43302421854](https://github.com/breno-bgod/NimboXcloud/actions/runs/43302421854): PASS — sintaxe do userscript/módulo, suíte e relatório estático; 190 testes, 187 PASS, 0 FAIL, 3 TODO.
  - NX/xHome regression [run 43302421958](https://github.com/breno-bgod/NimboXcloud/actions/runs/43302421958): PASS — 190 testes, 187 PASS, 0 FAIL, 3 TODO.
  - As execuções anteriores `43302190733`, `43302190621`, `43302225189` e `43302225174` falharam pela variável de perfil não capturada no escopo de inicialização; a correção foi feita e os dois workflows finais passaram no mesmo SHA.
  - Não existe `package.json` na raiz; build/lint npm não estão configurados. Não foram executados Chrome, Edge, Android, sessão autenticada nem Xbox físico.
- **Riscos/limites:** o mapeamento de SO é um perfil de qualidade observado no Better xCloud, não um mecanismo de autenticação nem uma concessão de permissão. Os mocks confirmam apenas a consistência das requisições e do payload; o serviço pode ignorar ou rejeitar perfis, e a aceitação real de HQ ainda depende de sessão Xbox autorizada.
- **Tarefas concluídas:** correção do descritor de cliente web; coerência entre resolução, header, body e data channel; teste de integração de encoder/scheduler reconhecido como já concluído; baseline e regressão verdes.
- **Pendências prioritárias:** homologar autenticação, mídia e comandos com Xbox físico; confirmar os três perfis de qualidade no serviço; validar Stop→Start/reconexão e callbacks antigos; testar HUD em Tampermonkey Android/desktop; confirmar TAK em `play.xbox.com`; continuar auditoria de gyro/touchpad e estabilidade xCloud.
- **Próxima tarefa concreta (P1 — regressão de reconexão xHome):** criar teste determinístico de Stop seguido de novo Start, com dois peers/sessões simulados. Critérios de aceite: DELETE da sessão antiga confirmado antes do novo POST; novo `requestId` e novo peer ativos; callbacks tardios de `ontrack`, ICE, data channel e estado do peer antigo não podem modificar mídia, status ou input da sessão nova; tokens não aparecem no estado/logs; ambos workflows baseline e NX/xHome PASS no mesmo SHA. Não declarar reconexão real concluída sem Xbox físico.


## Execução visual — 2026-11-12 — auditoria de arquitetura de informação (sem alteração funcional)

- **HEAD inicial consultado:** `351e6523bad139138435e0909a3b4e2c50119a81`.
- **Versão auditada:** 4.12.87. **SHA do blob do userscript:** `11b61da991977c3f8e31affac92fb2016d8cbe1a`. **SHA do blob do roadmap antes deste registro:** `08038cfb63cbfe9ec4a2e13a6758c6c191ca5874`.
- **Arquivos inspecionados diretamente em main:** `NimboXcloud.user.js` (7.792 linhas), `DEVELOPMENT_ROADMAP.md`, `CHANGELOG.md`; commits recentes consultados até `351e6523bad139138435e0909a3b4e2c50119a81`. A raiz e os workflows foram parcialmente inferidos pelo roadmap e pelos registros de CI; não foi obtida uma listagem completa da árvore nesta execução.
- **Estado visual observado no código:** rail atual expõe 14 destinos: Início, Vídeo, Imagens, Streaming, Estatísticas, Gamepad, Teclado e mouse, Áudio, Voz, Remote Play, Região da loja, Interface, Compatibilidade e Sistema. O painel é uma coluna/rail de 48 px com ícones, rótulos apenas em tooltip/ARIA e cartão de até 360 px. Isso é compacto, mas pouco descobrível em toque e exige que o usuário memorize ícones.
- **Classificação real encontrada:** Gamepad já concentra diagnóstico do gamepad, giroscópio, perfis de analógico e vibração; a página chamada Teclado e mouse ainda contém ativação do NimboTouch, editor de HUD e detecção de toque/mouse — estes itens pertencem a Mobile pela taxonomia aprovada. Vídeo e Imagens estão separados; Stream contém qualidade, perfis e seleção de servidor; Estatísticas já recebe configurações do NX Stream Monitor; Áudio e Voz estão separados; Remote Play tem página própria; Compatibilidade e Sistema contêm diagnósticos e opções experimentais; Região da loja está separada dos servidores de stream.
- **Inventário de destino recomendado (apresentação somente):** Mobile = NimboTouch, touchpad, editor da HUD touch e controle virtual na tela (apenas itens comprovadamente mobile); Joypad = gamepad físico, mapeamentos se existentes, deadzone/perfis de analógico, gatilhos se existentes, giroscópio e vibração; Teclado e Mouse = recursos próprios de teclado/mouse físico, atalhos e editor próprio somente se existir; Stream = servidores, bitrate, qualidade/resolução e perfis; Vídeo e Áudio = filtros WebGL2/Clarity Boost, apresentação e áudio/microfone existentes; Estatísticas = métricas e monitor; Remote Play = recursos xHome com estado experimental explícito; Desenvolvedor/Avançado = compatibilidade, protocolo, relatórios e diagnóstico técnico; Gerais = idioma/aparência/restauração apenas se forem preferências universais existentes.
- **Riscos de implementação identificados:** os IDs internos atuais (`video`, `images`, `stream`, `gamepad`, `gyrotouch`, `audio`, `voice`, `remote`, `region`, `personalize`, `compatibility`, `advanced`) são referenciados por `TAB_BUILDERS`, `TABS`, navegação, estado e testes. Reclassificar por simples renomeação pode quebrar navegação, builders e regressões. A página `gyrotouch` chama `window.NimboTouch.toggle()`; seus handlers e a lógica de ativação não devem ser movidos nem editados nesta frente. Qualquer mudança posterior deve preservar IDs, callbacks, chaves, valores, defaults, armazenamento e ordem de inicialização; preferir camada de apresentação que mapeie destinos sem tocar nos builders funcionais.
- **Decisão desta execução:** nenhuma alteração em `NimboXcloud.user.js`, CSS, módulos, entradas, armazenamento ou comportamento. O código atual mistura montagem/renderização e callbacks funcionais no mesmo arquivo; sem isolamento adicional, não foi possível provar que uma reorganização de DOM seria estritamente visual. Registrada a auditoria e a próxima etapa documental em vez de arriscar regressão.
- **Referências visuais pesquisadas:** [Microsoft Fluent 2 — navegação](https://fluent2.microsoft.design/components/web/react/core/nav/usage/) recomenda navegação curta, rótulos claros, níveis limitados e drawer overlay em larguras pequenas; [Fluent 2 — acessibilidade](https://fluent2.microsoft.design/accessibility) recomenda hierarquia previsível, foco visível, contraste WCAG AA e reflow até 320 px; [Fluent 2 — layout](https://fluent2.microsoft.design/layout) usa espaçamento consistente em base de 4 px e espaço negativo em vez de excesso de bordas; [Carbon — UI shell](https://www.carbondesignsystem.com/building-blocks/core/components/ui-shell-left-panel/guidelines) recomenda side navigation para mais de cinco destinos e evita hierarquias profundas; [Carbon — tabs](https://www.carbondesignsystem.com/building-blocks/core/components/tabs/guidelines) limita tabs a contextos relacionados e recomenda navegação lateral para muitos destinos. Referências usadas como princípios, sem copiar assets/código.
- **Testes executados nesta execução:** leitura estática do userscript e do roadmap via GitHub; conferência do histórico de commits; busca de documentação de design. **Não executados:** Node, parse, lint, build, workflows, screenshot, Chrome/Edge, Android/DeX ou teste visual. Nenhum código de produto foi alterado.
- **HEAD final esperado:** novo commit documental após `351e6523bad139138435e0909a3b4e2c50119a81`; será confirmado após a gravação. Sem commits de código.
- **Próxima tarefa concreta (P1 — especificação de navegação visual segura):** desenhar e documentar uma matriz de mapeamento entre os 14 IDs internos existentes e as 9 categorias visuais aprovadas, com rótulos visíveis (não apenas ícones), subgrupos e comportamento responsivo. Critérios de aceite: cada opção existente tem exatamente uma categoria principal; Mobile contém HUD touch/editor e gamepad virtual mobile; Joypad contém apenas gamepad físico; Teclado e Mouse contém apenas opções próprias desse sistema; FSR/HDR/1440p/macros/mapeamentos inexistentes não são apresentados como disponíveis; todos os IDs/callbacks/keys permanecem inalterados; proposta revisada contra testes atuais antes de qualquer implementação visual.


## Execução xHome — 2026-11-12 — regressão determinística Stop→Start e isolamento de callbacks

- **HEAD inicial de main:** `f7bd5cf47b1011e76e1aabf8ee5fb5b43d5617d1`.
- **HEAD final de código/testes em main:** `61d1c5303cf1e81969455b75c52eaab70e49a648` (merge do PR #14). **Commit de teste validado no PR:** `33717a99c3a5ad0e19a7dd0594f805a1901b7735`.
- **Versão do userscript:** 4.12.87. **Blob de `NimboXcloud.user.js` antes/depois:** `11b61da991977c3f8e31affac92fb2016d8cbe1a` (inalterado). **Blob de `tests/xhome-discovery.test.cjs` após merge:** `f7b3a1073a66e3d6c3d5e6bf555a59e43e1c5aaa`. **Blob do roadmap antes desta entrada:** `6bfb0357cffc9d30f722fc923f158b2be44f5b20`.
- **PR/integração:** [#14 — test(xhome): cover Stop→Start reconnection lifecycle](https://github.com/breno-bgod/NimboXcloud/pull/14), mesclado em main. Commits: `a03f188bb0d14765a35c69eb2691ab540b433071` (cenário inicial), `33717a99c3a5ad0e19a7dd0594f805a1901b7735` (estabilização da espera pela prontidão de mídia) e merge `61d1c5303cf1e81969455b75c52eaab70e49a648`.
- **Referência Better xCloud 6.7.13 consultada:** arquivo `better-xcloud.user(2).js` fornecido anteriormente e localizado na Library. A comparação confirmou a separação do fluxo xHome em `XhomeInterceptor` (login, configuração, criação de sessão, input configs, títulos e ICE). Foi usado apenas como referência de arquitetura/protocolo; nenhum bloco do userscript foi copiado. A autenticação e os endpoints NimboXcloud existentes foram preservados.
- **Auditoria do ciclo atual:** revisados `nxRemoteStartSession`, `nxRemoteStop`, `nxRemoteCloseDataChannels`, `nxRemoteClearMedia`, `nxRemoteInitDataChannels`, callbacks de ICE/peer/data channels e o adaptador de toque. Os callbacks de `ontrack`, `onicecandidate`, `onconnectionstatechange`, data channels e o adaptador já validam `requestId`/identidade da sessão. Não foi reproduzida falha funcional no fluxo Stop→Start; a lacuna era a ausência de uma regressão integrada com duas sessões consecutivas.
- **Teste acrescentado:** cria duas sessões e dois peers simulados; exige que o DELETE remoto da primeira sessão termine antes do segundo POST `/sessions/home/play`; verifica novo `requestId`, novo peer e novo MediaStream; dispara callbacks tardios do peer antigo (`ontrack`, ICE, estado de conexão, `onclose` e mensagem de data channel) e tenta enviar teclado por um adaptador antigo. O teste garante que esses eventos não alteram status, mídia, diagnósticos ou input da sessão nova. Também verifica que GSSV/bearer não aparecem no estado exportável.
- **Falha inicial e correção do teste:** a primeira execução encontrou uma asserção prematura: o teste comparava diagnósticos enquanto a Promise de `video.play()` ainda transitava de `pending` para `playing`. O código de produção e a sintaxe já passavam; a falha era de sincronização do próprio teste. A espera foi corrigida para observar a prontidão de reprodução antes de capturar o estado. A segunda execução passou integralmente; nenhuma mudança funcional foi necessária.
- **Validação final no PR, aplicada ao merge ref:** 
  - [NimboXcloud regression tests — run 43313368313](https://github.com/breno-bgod/NimboXcloud/actions/runs/43313368313): PASS; validação de sintaxe e regressões NX/xHome; 191 testes, 188 PASS, 0 FAIL, 3 TODO.
  - [NimboXcloud baseline — run 43313368343](https://github.com/breno-bgod/NimboXcloud/actions/runs/43313368343): PASS; sintaxe do userscript, sintaxe do módulo Touch HUD, suíte completa e relatório estático de risco; 191 testes, 188 PASS, 0 FAIL, 3 TODO.
  - As primeiras execuções `43313198772` e `43313198710` falharam somente na asserção prematura descrita acima; após a correção, ambos os workflows passaram no mesmo commit de teste.
- **Arquivos afetados:** somente `tests/xhome-discovery.test.cjs` e este `DEVELOPMENT_ROADMAP.md`. Nenhum código do userscript, módulo touch, UI, protocolo, input, storage, autenticação, rede ou comportamento de sessão foi alterado.
- **Limites e riscos:** os testes usam mocks determinísticos e confirmam isolamento de callbacks e ordem de requisições, não conectividade real. Não houve teste em Chrome/Edge, Android/DeX, conta autenticada, Xbox físico, NAT real, mídia do console ou controle físico. Não declarar xHome funcional/completo por causa desta regressão. A homologação real continua dependente de Xbox e conta do usuário.
- **Tarefas concluídas:** regressão automatizada Stop→Start; ordem DELETE antigo antes do novo POST; isolamento de callbacks/ICE/data channel/touch adapter da sessão anterior; baseline e NX/xHome regression verdes.
- **Pendências prioritárias:** homologar descoberta/autenticação com conta real; validar provisionamento, SDP/ICE e mídia do console; confirmar áudio/vídeo e comandos de gamepad/touch/teclado/mouse; testar desconexão e reconexão reais; manter regressões xCloud e NimboTouch.
- **Próxima tarefa concreta (P1 — ICE poll antigo durante reconexão):** criar teste determinístico com GET `/ice` da sessão A deliberadamente pendente, executar Stop e iniciar sessão B antes de liberar a resposta antiga. Critérios de aceite: a resposta tardia de A não pode chamar `addIceCandidate`, atualizar status, agendar novo poll nem afetar peer/canais/mídia de B; somente candidatos de B podem chegar ao peer B; DELETE de A precede POST de B; ambos workflows continuam PASS. Não alterar o transporte ICE sem evidência de falha reproduzível.


## Execução xHome — 2026-11-12 — cancelamento do polling ICE durante Stop→Start (4.12.89)

- **HEAD inicial da main:** `261e37f162123ff69e4f7ce76bfc9d2628f01fc6` (runtime 4.12.88).
- **HEAD final do código/testes após merge:** `5b51cc3cb8d1ab1f93d5d7571cb20b578763e881`. **Blob do userscript:** `6843b306d6847f9ba054bdc82489e53f538e112d`. **Blob de testes:** `7742367567d1e8e0391dbb58dfe6646479d7d398`. Touch HUD permaneceu em 1.2.5.
- **Reconciliação do estado anterior:** a main já continha a release 4.12.88, não registrada neste roadmap. Ela corrigiu `resCfg()` para respeitar a preferência salva (HQ/Tizen por padrão; `auto`/Windows para a próxima partida), corrigiu perda WebRTC negativa, unidade do bitrate para Mbps e incluiu o smoke ESM nos dois workflows. Não foi reimplementado neste ciclo. Equilibrado/Compatível continuam aliases de 1080p/Windows; não foi adicionado modo 720p nem promessa de resolução recebida.
- **Falha reproduzida na frente xHome:** `nxRemoteStartSession()` limpava `nxRemotePlay.abortController` no `finally` após concluir a criação da sessão. O polling ICE mantinha a referência local ao controller, mas `nxRemoteStop()` já não conseguia abortar o GET pendente. Os guards por `requestId`/peer já impediam que a resposta obsoleta alterasse a sessão B; o defeito reproduzido era deixar a requisição da sessão A em voo e não cancelável durante Stop.
- **Teste determinístico:** adicionada regressão em `tests/xhome-discovery.test.cjs` com duas sessões e dois peers. O GET `/ice` da sessão A fica pendente, Stop e Start criam a sessão B, e o mock deliberadamente ignora o AbortSignal antes de liberar a resposta antiga. O teste verifica que Stop aborta o sinal, o DELETE de A antecede o POST de B, o candidato antigo não chega a nenhum peer, o status/peer/sessionId/timer de B permanecem iguais e nenhum poll extra é agendado.
- **Correção em `NimboXcloud.user.js` 4.12.89:** manter o AbortController enquanto `sessionId` está ativo; limpar a referência quando a inicialização falha sem criar sessão. Stop agora tem a referência necessária para abortar requisições ICE pendentes e depois limpar o controller. Não houve alteração em endpoints, payload ICE, SDP, autenticação, credenciais, data channels, encoder, input, Gamepad API, fetch/XHR global ou transporte xCloud retail.
- **Falha inicial de CI que revelou o bug:** os workflows `43322014677` e `43322014614` falharam somente na nova asserção `Stop must abort the old session controller` (`false !== true`), com 201 PASS, 1 FAIL e 3 TODO. A falha não foi mascarada nem removida; levou à correção do ciclo de vida do controller.
- **PR/commits:** [PR #15](https://github.com/breno-bgod/NimboXcloud/pull/15), squash merge `5b51cc3cb8d1ab1f93d5d7571cb20b578763e881`. Commits de trabalho: `33143a811156e7c9c3bc2977a437d21ef3a45abd` (regressão inicial), `2aa7327bbc3d1157ff795d1e4ef341e513a50d13` (correção de produção), `ff87f384206424393858ac0349a61705192af76c` (asserções do controller) e `6088e69cf1ff521861c652dfa6e79043db86e9e5` (changelog/PR final).
- **Arquivos afetados:** `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md` e este roadmap. Versão metadata/runtime/`@require nx_version` alinhada em 4.12.89.
- **Validação real no PR e após merge na main:**
  - Baseline PR [run 43322313258](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322313258): PASS.
  - NX/xHome PR [run 43322313707](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322313707): PASS.
  - Baseline main [run 43322395932](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322395932): PASS.
  - NX/xHome main [run 43322395967](https://github.com/breno-bgod/NimboXcloud/actions/runs/43322395967): PASS.
  - Ambos workflows na main executaram **205 testes, 202 PASS, 0 FAIL, 3 TODO**. Baseline também validou sintaxe do userscript e do módulo Touch HUD e executou o relatório estático; ambos workflows executaram os testes `*.test.cjs` e `*.test.mjs`.
- **Limites:** não existe `package.json` nem build/lint separado configurado. A validação desta execução foi feita pelo GitHub Actions; não foi executado Node local neste runtime. Não houve Chrome/Edge, Tampermonkey, Android/DeX, sessão Xbox autenticada, Xbox físico, NAT real, mídia ou comandos de jogo. A resposta antiga foi simulada com fetch que ignora AbortSignal; isso prova o guard de sessão e o pedido de cancelamento no mock, não a conectividade do serviço.
- **Tarefas concluídas:** cancelamento do ICE poll pendente em Stop; isolamento da resposta tardia durante Stop→Start; release 4.12.88 reconciliada com o estado real; baseline e regressão xHome verdes no PR e na main.
- **Riscos/pendências:** xHome continua experimental e não homologado. Descoberta/autenticação, provisionamento, SDP/ICE, áudio/vídeo e controles ainda precisam de teste com console/conta autorizados. O relatório estático ainda identifica padrões de hooks que exigem revisão contextual; não os classificar automaticamente como bugs.
- **Próxima tarefa concreta (P1 — esgotamento e transição do ICE poll):** criar teste determinístico para o limite de 30 consultas e para a mudança do peer de `connecting` para `connected` enquanto um GET `/ice` está pendente. Critérios de aceite: nenhum novo timer após conexão, falha terminal ou limite; Stop continua abortando; erros transitórios não alteram uma sessão posterior; no máximo 30 polls; ambos workflows PASS. Não alterar protocolo ou backoff sem evidência reproduzível.


## Execução xHome — 2026-11-12 — limite e ciclo de vida do ICE poll (4.12.92)

- **HEAD inicial da main:** `0446a26ca693a4ef3d764495780c4e47f62c8d26`. **Versão observada:** 4.12.91. **Blob do userscript antes da alteração:** `7a2db6e3872a8f2e18e2d1da5bd10b647f911f64`.
- **Reconciliação desde a última entrada:** a main já continha as versões 4.12.90 e 4.12.91, ausentes do registro anterior. 4.12.90 concentrou a identidade pública do projeto e alinhou o módulo Touch HUD em 1.2.6; a revisão de testes QoS desacoplou o limite de extração do texto editorial. 4.12.91 passou a construir o catálogo de datacenters cloud a partir das regiões anunciadas no login, preservando aliases, alternativas e a separação do login xHome. A mudança foi acompanhada por 16 testes comportamentais. Também foram publicados a adoção de GPL-3.0-or-later e os avisos de terceiros. Essas alterações foram inspecionadas e não foram reimplementadas.
- **Auditoria do polling:** a condição de entrada usava `icePollCount++ >= 30`, mas o agendamento posterior verificava apenas requestId, AbortSignal e estado `new/connecting`. Depois da 30ª consulta, o código ainda criava um timer; a 31ª callback era executada e só então parava. Além disso, o ID do timer disparado permanecia em `nxRemotePlay.iceTimer`, sem vínculo explícito entre o callback e o timer ainda pertencente à sessão.
- **Correção em `NimboXcloud.user.js` 4.12.92:** uma condição única `canPollIce()` valida requestId, AbortSignal, identidade do peer, estado `new/connecting` e orçamento restante. O contador é incrementado somente quando a consulta começa. O agendador captura o ID do timer e só executa se ele ainda for o timer ativo da mesma sessão/peer; limpa a referência ao disparar. Após 30 polls não existe 31º timer. Erros ICE não sobrescrevem o estado terminal de um peer substituído/falho. Os guards de identidade também são rechecados após a aplicação de candidatos.
- **Testes adicionados:** `tests/xhome-discovery.test.cjs` ganhou duas regressões determinísticas: (1) uma leitura ICE inicial mais exatamente 30 polls, sem callback ou timer 31 e com `iceTimer === null`; (2) GET ICE pendente que resolve depois da transição do peer para `connected`, `failed` ou `closed`, sem iniciar outra consulta ou agendar novo timer.
- **PR:** [#16 — fix(xhome): stop ICE polling cleanly at connection and request limit](https://github.com/breno-bgod/NimboXcloud/pull/16). Commits incrementais no branch `fix/xhome-ice-poll-boundary-4-12-92`; head de código/testes validado: `f1def105ff3283c9ff1b2d3bbec4a1b096c3fc50`. A main foi relida antes da gravação e permaneceu no SHA base acima; o branch estava 3 commits à frente e 0 atrás.
- **Merge na main:** PR #16 squash-merged em `091e6cc0c9da53b9bb31777a47a86c0b67a60368`. O documento de validação foi sincronizado após o merge; o commit final de handoff deste ciclo será o registro de roadmap abaixo. Workflows após o merge: [baseline 43331038503](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331038503) e [regressões 43331038550](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331038550) PASS; baseline após os documentos: [43331130068](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331130068) PASS.
- **Arquivos de código/teste/changelog:** `NimboXcloud.user.js`, `tests/xhome-discovery.test.cjs`, `CHANGELOG.md`. Versão de metadata, constante runtime e query `@require nx_version` alinhadas em 4.12.92. Módulo Touch HUD permanece em 1.2.6.
- **Validação real no GitHub Actions para o head de código/testes:** [baseline run 43330718365](https://github.com/breno-bgod/NimboXcloud/actions/runs/43330718365) PASS e [NX/xHome regression run 43330718131](https://github.com/breno-bgod/NimboXcloud/actions/runs/43330718131) PASS. Ambos executaram **223 testes: 220 PASS, 0 FAIL, 3 TODO**. Baseline também executou `node --check NimboXcloud.user.js`, `node --check modules/NimboXcloud-Touch-HUD.user.js` e `node tools/static-risk-report.cjs`; todos os passos concluíram com sucesso. A suíte CommonJS + ESM passou nos dois workflows.
- **Limites e riscos:** não existe `package.json` nem build/lint separado configurado. Não houve Chrome/Edge, Tampermonkey, Android/DeX, Xbox físico, conta autenticada, NAT real, transmissão de mídia ou comando aceito pelo console. Os testes provam o limite e a propriedade dos timers em mocks, não a conectividade xHome. Remote Play continua experimental/não homologado. Permanecem 3 testes TODO.
- **Tarefas concluídas:** limite de 30 polls sem tentativa 31; timer liberado ao disparar; callbacks de timer vinculados ao request/peer atual; nenhuma nova consulta após connected/failed/closed durante GET pendente; baseline e regressões verdes.
- **Hipótese observável para a próxima etapa:** `remoteSeen` deduplica ICE com `JSON.stringify(entry)` antes de normalizar entradas em string ou objeto. O mesmo candidato representado nas duas formas pode não ser reconhecido como duplicado e chegar duas vezes a `addIceCandidate`.
- **Próxima tarefa concreta (P1 — normalização e deduplicação de candidatos ICE):** criar regressão que entregue o mesmo candidato primeiro como JSON string e depois como objeto (e na ordem inversa), incluindo entradas malformadas. Critérios de aceite: candidatos equivalentes são normalizados e adicionados uma única vez; entradas inválidas são ignoradas sem encerrar a sessão; falha de `addIceCandidate` é diagnosticada sem agendar poll após estado terminal; testes de Stop→Start/limite 30 permanecem verdes; não alterar SDP, autenticação ou formato de payload do serviço.

- **Reconciliação final:** HEAD da main confirmado antes do último registro documental: `86d4c8fe505f45c1a7cf2eb87c9d49de1a925917`. Versão 4.12.92 e blob do userscript `681d4ecdafcd9ecd584792b012c095832dee8a12`; PR #16 integrado. O commit gerado por este registro é o HEAD final de handoff da execução.


## Execução xHome — 2026-11-12 — isolamento da sinalização IPv4 retail (4.12.94)

- **HEAD inicial desta etapa:** `bb0dda00f10642541aa8e6355be6679ed628f665`. **Versão observada:** 4.12.93; módulo Touch HUD 1.2.7. A main já continha o lote concorrente de entrada física: escolha explícita de teclado/mouse ou gamepad físico, configuração apenas em schemas cloud conhecidos, restauração separada da HUD, classificação DeX como Desktop e telemetria com rótulo Bitrate. Esse lote foi inspecionado, não reimplementado. [docs/ENTRADA_FISICA.md](https://github.com/breno-bgod/NimboXcloud/blob/main/docs/ENTRADA_FISICA.md) documenta os limites e testes manuais pendentes.
- **Validação do HEAD base:** workflows [baseline 43331673749](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331673749) e [NX/xHome 43331673708](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331673708) PASS; ambos executaram 242 testes, 239 PASS, 0 FAIL e 3 TODO. Sintaxe dos dois scripts e relatório estático passaram. Não houve homologação real do DeX/Fortnite.
- **Auditoria de hooks e fluxo:** `GSSV_RE` corresponde tanto a `xhome.gssv-play-prod.xboxlive.com` quanto a hosts regionais `*.core.gssv-play-prodxhome.xboxlive.com`. O wrapper global de `fetch` aplicava `rewriteIce` a todos os caminhos GSSV `/sdp` e `/ice`. A preferência IPv4 está ligada por padrão (`v4on()` usa default `1`). `rewriteIce` só entende o envelope retail `exchangeResponse` como string JSON. O parser xHome, porém, aceita resposta direta em array ou objeto `candidates` para `/ice`. Resultado: o helper não filtrava o ICE trickle xHome, mas podia filtrar candidatos IPv6 do SDP xHome, criando comportamento parcial entre a resposta SDP e as consultas ICE.
- **Correção em 4.12.94:** `rewriteIce` agora retorna a resposta original para hostnames que contêm `xhome`, antes de executar a política IPv4 retail. O SDP e as listas ICE xHome permanecem nativos. A reescrita IPv4 continua ativa para hosts GSSV retail. Nenhum endpoint, payload enviado, autenticação, sessão, data channel, entrada ou transporte foi modificado.
- **Teste adicionado:** `tests/streaming-p03.test.cjs` executa a função real `rewriteIce` isolada, com IPv4 ativo. Confirma bypass para o host xHome de login e o host regional `prodxhome`, tanto para SDP quanto ICE, e confirma que o host retail continua chamando a reescrita.
- **Falha inicial de CI:** a primeira execução do teste retail falhou porque o fixture não fornecia `nowStr()`, usado somente quando um candidato é removido e o diagnóstico é registrado. O fixture foi completado com `nowStr`; o teste não foi enfraquecido.
- **PR:** [#17 — fix(xhome): isolate signaling from retail IPv4 rewriting](https://github.com/breno-bgod/NimboXcloud/pull/17). Branch `fix/xhome-isolate-retail-ice-rewrite-4-12-94`; head de código/teste validado `a09c06ab45440f9a39a84ae79c88e702ee0052e0`. Base `bb0dda00f10642541aa8e6355be6679ed628f665`; 4 commits à frente, 0 atrás no momento da gravação.
- **Merge na main:** PR #17 squash-merged em `e9de54e4aa79ccdb9b30e26aeb9994cb3fa6e0f4`. `docs/P00_VALIDATION_STATUS.md` foi sincronizado após o merge; o último commit deste ciclo será o handoff final do roadmap. Workflows após o merge: [baseline 43332265026](https://github.com/breno-bgod/NimboXcloud/actions/runs/43332265026) e [regressões 43332265025](https://github.com/breno-bgod/NimboXcloud/actions/runs/43332265025) PASS; baseline no HEAD documental final: [43332322583](https://github.com/breno-bgod/NimboXcloud/actions/runs/43332322583) PASS. Resultado em todos: 243 testes, 240 PASS, 0 FAIL, 3 TODO.
- **Arquivos de runtime/teste/changelog:** `NimboXcloud.user.js`, `tests/streaming-p03.test.cjs`, `CHANGELOG.md`. Metadata, constante runtime e query `@require nx_version` alinhadas em 4.12.94; módulo Touch HUD permanece 1.2.7.
- **Validação real no PR após correção do fixture:** [baseline 43331934517](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331934517) PASS e [NX/xHome regression 43331934314](https://github.com/breno-bgod/NimboXcloud/actions/runs/43331934314) PASS. Resultado: **243 testes, 240 PASS, 0 FAIL, 3 TODO**. Sintaxe dos dois userscripts, suíte completa e relatório estático passaram no baseline. A regressão xHome também passou.
- **Auditoria residual:** o fetch global continua sendo um único wrapper; há wrapper de `RTCPeerConnection`, hook de `setLocalDescription` para bitrate e observador de `XMLHttpRequest.send`. Não foi encontrado override ativo de `requestPointerLock` neste build. A Gamepad API tem múltiplos consumidores e a ponte experimental continua opt-in/rollback; `docs/P00_HOOK_LIFECYCLE.md` (v4.11.4) e `docs/P01_INPUT_AUDIT.md` (v4.11.10) estão defasados e AUD-01 permanece aberta. Nenhuma mudança foi feita nesses hooks nesta etapa.
- **Limites e riscos:** sem teste em navegador real, Tampermonkey, Xbox físico, conta autorizada, NAT, áudio/vídeo ou comandos de jogo. O bypass preserva a sinalização xHome original, mas não comprova que a sessão WebRTC conecte. Remote Play continua experimental e não homologado. Os 3 TODO permanecem.
- **Próxima tarefa concreta (P1 — canonicalização/deduplicação de ICE):** criar regressão com o mesmo candidato recebido primeiro como string JSON e depois como objeto (e ordem inversa), além de entradas malformadas. Critérios: formas equivalentes produzem uma única chamada a `addIceCandidate`; malformed strings são ignoradas sem encerrar a sessão; erro de candidato é diagnosticado e não contamina sessão posterior; Stop→Start e limite de 30 polls continuam PASS; retail IPv4 rewrite permanece ativo e xHome permanece isolado.

- **Reconciliação final da etapa:** HEAD da main antes do último handoff documental: `0bb1cd2716e44b0fbc5bc0bc09c7ead2bb26d250`; userscript 4.12.94, blob `55dd82262b6b81dbfab1c731c530aa794678391c`, módulo Touch HUD 1.2.7. PR #17 integrado e workflows do PR aprovados. O commit gerado por este registro passa a ser o HEAD final desta execução.

- **Evidência pós-merge consolidada:** PR #16 e PR #17 têm regressões e baseline verdes na main. HEAD da main antes desta última atualização documental: `8eaa70aac263c4e24c82d6b3dbdef51d7041030f`; todos os testes de CI reportam 243 testes, 240 PASS, 0 FAIL e 3 TODO. O commit deste registro é o HEAD final atualizado.


## Execução xHome — 2026-11-12 — canonicalização e deduplicação de candidatos ICE (4.12.95)

- **SHA inicial consultado na main:** `82a7560c955184c266ec8c10c0e02a70996f9015`. Runtime inicial: 4.12.94; blob inicial do userscript: `55dd82262b6b81dbfab1c731c530aa794678391c`; Touch HUD 1.2.7.
- **Reconciliação do handoff anterior:** a tarefa P1 de limite de 30 polls e transição do peer para `connected/failed/closed` já estava concluída em 4.12.92 e testada. A tarefa P1 seguinte do roadmap era normalizar/deduplicar candidatos ICE equivalentes recebidos como JSON string e objeto. A correção de isolamento da reescrita IPv4 retail em hosts xHome já estava integrada em 4.12.94 e foi preservada.
- **Falha reproduzida:** a lista inicial aplicava candidatos sem normalização e criava `remoteSeen` com `JSON.stringify(entry)`; o polling também comparava a representação bruta antes de parsear strings. O mesmo candidato com ordem de propriedades diferente ou envelope string/objeto podia ser aplicado duas vezes. Entradas JSON inválidas eram ignoradas, mas não havia chave canônica compartilhada entre a carga inicial e o trickle ICE.
- **Correção em `NimboXcloud.user.js` 4.12.95:** criado normalizador local para `RTCIceCandidateInit`, com validação de `candidate`, `sdpMid`, `sdpMLineIndex` e `usernameFragment`; strings JSON são parseadas com limite de tamanho; objetos e strings são convertidos para a mesma forma canônica. Uma única função aplica candidatos e usa a mesma chave na lista inicial e nas respostas do polling. Candidatos inválidos/malformados são ignorados sem interromper candidatos válidos. A chave só distingue candidatos por seus campos ICE relevantes, não pela ordem das propriedades JSON.
- **Diagnóstico de erro:** falhas de `addIceCandidate` continuam visíveis no status enquanto o peer está conectando; se o peer já entrou em estado terminal, o detalhe é mantido em `nxRemotePlay.error`. O guard `canPollIce()` impede reagendamento após terminalização. O comportamento de Stop/abort e o limite de 30 polls foram preservados.
- **Testes novos:** `tests/xhome-discovery.test.cjs` cobre string→objeto e objeto→string entre leitura inicial e polling, diferenças de ordem de propriedades, entradas malformadas e um erro de `addIceCandidate` que terminaliza o peer. A comparação do teste Stop→Start foi ajustada para comparar o valor serializado do candidato normalizado, sem depender do protótipo entre realms do harness.
- **Falhas intermediárias e correções transparentes:** a rodada test-first em `1a6ff7a5f3a8e39e198167fa919db87bdf642f32` falhou nas duas regressões novas, reproduzindo a ausência de deduplicação e de diagnóstico terminal. A primeira implementação em `1b7ff46013cca05ae463532853663a8898d643a9` ainda não conectava o helper ao loop de polling e permaneceu vermelha. A rodada `06b9eca54047a33b9e011a4776d0bce79a0e7cc3` fez o polling usar o helper e passou nos novos cenários; uma assertion preexistente do Stop→Start ainda dependia da identidade de realm e foi corrigida no commit final `ae96ffe7d2a58c0b87a9f8b6204111ea70afb501`. Nenhuma assertion funcional foi removida.
- **PR/merge:** [PR #18 — fix(xhome): canonicalize remote ICE candidates](https://github.com/breno-bgod/NimboXcloud/pull/18), squash-merged em `e42137eb0cca1cb0eb5fd2cd958743700f4caf01`. O branch estava baseado no HEAD inicial e não atrás da main antes do merge. O merge foi condicionado ao SHA esperado do PR.
- **Arquivos de código/teste/changelog:** `NimboXcloud.user.js` (versão 4.12.95), `tests/xhome-discovery.test.cjs` e `CHANGELOG.md`. O módulo Touch HUD permaneceu em 1.2.7, blob `5bf03e53d0210d082290917c99f4055b8ed402eb`. Blob do userscript após merge: `13a2ad17cf978ee758943d6d347115bc8817d7a1`; blob de testes: `11d51c34c5d5909c011492d359023dc0e44efb50`.
- **Validação final na main:** baseline [run 43333473532](https://github.com/breno-bgod/NimboXcloud/actions/runs/43333473532) PASS; regressões NX/xHome [run 43333473500](https://github.com/breno-bgod/NimboXcloud/actions/runs/43333473500) PASS. Ambos executaram **245 testes, 242 PASS, 0 FAIL, 3 TODO**. O baseline também passou `node --check NimboXcloud.user.js`, `node --check modules/NimboXcloud-Touch-HUD.user.js` e `node tools/static-risk-report.cjs`. A suíte CommonJS/ESM passou nos dois workflows.
- **Documentação de validação:** `docs/P00_VALIDATION_STATUS.md` atualizada no commit `d77e46ed67940c5803fe67f27173d6abcc20a52c`, com evidência pós-merge, contagem, links de Actions e limitações. O HEAD após essa atualização foi relido antes deste registro.
- **Auditoria residual / próxima hipótese:** `peer.onicecandidate` verifica requestId e AbortSignal, mas não valida explicitamente `nxRemotePlay.peer===peer` nem estado terminal `failed/closed`. O callback pode tentar enviar um candidato local tardio enquanto o peer atual já está terminal, e o catch da cadeia `iceSendChain` também pode alterar status baseado somente no requestId. Stop incrementa requestId e aborta o controller, mas a transição isolada para `failed` não faz isso. É uma hipótese testável, não uma falha de transmissão real confirmada.
- **Limites:** sem browser real, Tampermonkey, Android/DeX, Xbox físico, conta autorizada, NAT real, mídia, áudio ou comandos aceitos pelo console. Não existe `package.json`; build/lint npm separados não estão configurados. Remote Play continua experimental e não homologado.
- **Tarefas concluídas:** normalização canônica da lista ICE inicial e trickle; deduplicação entre string/objeto e ordem de propriedades; descarte de entradas inválidas; diagnóstico de falha de aplicação; preservação do limite 30, Stop→Start e isolamento de sessão antiga; PR #18 e workflows pós-merge verdes.
- **Pendências prioritárias:** homologar sessão e mídia com console/conta autorizados; confirmar áudio e aceitação de comandos; revisar hooks globais e a ponte Gamepad; validar HUD físico/touch em navegador real.
- **Próxima tarefa concreta (P1 — isolamento de candidatos ICE locais após falha do peer):** criar regressão que dispare `peer.onicecandidate` depois de `connectionState='failed'` e antes de Stop, além de um erro tardio na cadeia `iceSendChain`. Critérios de aceite: peer terminal não faz novo POST `/ice`; callback de peer substituído/encerrado não altera status da sessão atual; falha de envio não sobrescreve estado terminal ou sessão posterior; candidatos locais do peer ativo continuam sendo enviados em ordem e exatamente uma vez; Stop→Start, canonicalização remota, limite 30 e ambos workflows permanecem PASS. Não alterar payload, autenticação, SDP ou protocolo sem evidência.
- **SHA de código/testes final após merge:** `e42137eb0cca1cb0eb5fd2cd958743700f4caf01`. **SHA após validação documental P00:** `d77e46ed67940c5803fe67f27173d6abcc20a52c`. Este commit acrescenta o handoff de roadmap e passa a ser o HEAD documental final desta execução.


## Execução xHome — 2026-11-13 — isolamento e ordenação de ICE local (4.13.1)

### Reconciliação do estado encontrado

- **SHA inicial consultado na main:** `a271f6b290b27bdfad67e290103d09f41b4acc79`. Versão real: **4.13.0**; blob do userscript `c89a0baaa4463ee13a64ed89e0c88858bbfb5683`; módulo Touch HUD **1.3.0**.
- O commit imediatamente anterior havia implementado a unificação de cinco modos de entrada (teclado/mouse físicos, gamepad físico, teclado/mouse virtuais, controle virtual e toque nativo), compartilhamento da ponte Gamepad API, editor HUD e organização/busca do painel. `docs/ENTRADAS_E_PAINEL.md` descreve a arquitetura e registra 267 testes (264 PASS, 0 FAIL, 3 TODO), sem validação de browser real. Essa implementação foi preservada; nenhum gerenciador de entrada foi duplicado ou alterado nesta execução.
- **Lacuna documental encontrada:** a versão 4.13.0 e a nova arquitetura de entradas já estavam em main e no CHANGELOG, mas não havia handoff correspondente no final deste roadmap. Este registro passa a reconciliar a release antes de documentar a correção 4.13.1.
- O handoff P1 anterior (callbacks ICE locais sem identidade/estado terminal) ainda não estava implementado. O código verificava requestId e AbortSignal, mas não identidade do peer nem failed/closed. A fila inicial enviava candidatos diretamente com `await iceSend`, enquanto candidatos emitidos durante essa espera usavam uma Promise chain separada.

### Regressão primeiro, falha reproduzida

- Branch: `fix/xhome-local-ice-ownership-4-13-1`.
- PR: [#19 — guard de propriedade e ordenação de ICE local](https://github.com/breno-bgod/NimboXcloud/pull/19).
- O commit de teste `755aee8bee425b43aab982fd886e07a0f66f9c57` adicionou um cenário em que A/B são coletados antes do SDP e C chega enquanto o POST de A está pendente.
- A regressão falhou nos dois workflows, como esperado: [baseline 43338553594](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338553594) e [xHome 43338553629](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338553629). O log mostrou a ordem real **A, C, B**, em vez de **A, B, C**. A mesma regressão também cobre erro tardio depois de failed, evento posterior ao estado terminal e callback de peer substituído.
- Essa falha confirmou um problema de ordenação reproduzível no código, não uma hipótese baseada somente em leitura estática.

### Correção implementada em 4.13.1

- **Arquivo:** `NimboXcloud.user.js`.
- Cada callback e cada POST ICE local agora exigem: requestId atual, AbortSignal ativo, `nxRemotePlay.peer === peer`, sinalização não fechada e ausência de `connectionState/iceConnectionState` failed/closed.
- Candidatos coletados antes de a resposta SDP chegar e candidatos trickle posteriores entram na mesma `iceSendChain`. O flush inicial também aguarda a cadeia, preservando a ordem A/B/C.
- Uma resposta ou rejeição tardia não altera status quando o peer terminou ou perdeu a propriedade da sessão. Candidatos emitidos depois de failed/closed não iniciam POST.
- O polling não agenda nova consulta depois de terminalização. O listener de conexão valida também a identidade do peer e reconcilia estados que mudaram durante a fila inicial, incluindo failed/closed.
- Sem alteração de endpoint, autenticação, tokens, corpo do payload ICE, SDP, data channels, transporte de input, xCloud retail ou persistência.
- **Teste:** `tests/xhome-discovery.test.cjs`, uma regressão nova. **Release:** `CHANGELOG.md`. Nenhuma dependência adicionada; Touch HUD permanece 1.3.0.
- Commits do branch: teste `755aee8bee425b43aab982fd886e07a0f66f9c57`; implementação `3874bb2b73eddc650f8b90a3733d2e8c35a32c7e`; changelog `faf3dd759c66431e05da1d708059f3d2e3dec8b0`.
- **Merge:** PR #19 squash-merged em `12fac62335f643ee5bc179afc3d38f45d7f7659f`. O compare antes do merge indicava 3 commits à frente, 0 atrás; merge condicionado ao head SHA esperado.

### Validação real

- No head final do PR: baseline [43338677098](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338677098) PASS; xHome [43338677076](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338677076) PASS.
- Após merge na main: baseline [43338759828](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338759828) PASS; xHome [43338759865](https://github.com/breno-bgod/NimboXcloud/actions/runs/43338759865) PASS.
- Em cada execução aprovada: **268 testes, 265 PASS, 0 FAIL, 3 TODO**. Baseline executou `node --check NimboXcloud.user.js`, `node --check modules/NimboXcloud-Touch-HUD.user.js`, suíte `tests/*.test.cjs` + `tests/*.test.mjs` e `node tools/static-risk-report.cjs`. A integridade de @version, VER, @require e versão do módulo também passou.
- O relatório estático continua identificando os wrappers Gamepad (duas ocorrências), fetch e XHR já existentes. Não são regressões introduzidas por este patch e não foram alterados neste ciclo.
- Avisos não bloqueantes no CI: depreciação de `punycode` no ambiente Node e ações GitHub que declaram Node 20. Nenhum teste falhou após a implementação.
- **Não executado:** Node local, build/lint npm (não há `package.json` na raiz), Chrome/Edge, Tampermonkey, Android/DeX, sessão autenticada, Xbox físico, NAT real, mídia, áudio ou comandos de jogo. O CI usa mocks; Remote Play permanece experimental e não homologado.

### Estado xHome após esta execução

- Concluído e coberto por testes: descoberta regional, criação/liberação de sessão, SDP, ICE remoto canônico/deduplicado, limite de polling, abort/Stop→Start, ownership e ordenação do ICE local, bootstrap dos quatro data channels, adaptadores experimentais de gamepad/teclado/mouse/touch e diagnóstico de mídia.
- Não comprovado: sessão real estável, entrega de vídeo/áudio ao elemento de reprodução, áudio audível, NAT/conectividade externa e comandos aceitos por Xbox físico.
- **SHA de runtime/testes após merge:** `12fac62335f643ee5bc179afc3d38f45d7f7659f`. **SHA após sincronizar P00:** `5656778fd059ac4706d278985553ef2792853308`. O commit deste handoff atualiza o roadmap e passa a ser o HEAD documental final da execução.

### Próxima tarefa concreta — P1: bloquear bootstrap tardio de data channels após terminalização do peer

Evidência: `nxRemoteInitDataChannels().isCurrent()` verifica requestId, AbortSignal, identidade do peer e identidade do objeto de canais, mas não verifica `connectionState`, `iceConnectionState` ou `signalingState` terminal. Um `onopen`/HandshakeAck tardio pode ainda executar `initialize()`, definir `dataChannelsReady=true` e substituir o texto de estado depois de o peer entrar em failed/closed.

Critérios de aceite:
1. Depois de failed/closed, callbacks tardios `onopen`, `onmessage(HandshakeAck)`, `onerror` e timer não podem executar bootstrap, enviar metadados/configurações, definir readiness ou sobrescrever o status terminal.
2. A transição terminal cancela `channelTimer`, fecha os data channels e mantém `dataChannelsReady=false`, sem recursão de falha/Stop.
3. O estado `disconnected` transitório continua recuperável se o mesmo peer retornar a connected; não aplicar teardown terminal a uma desconexão recuperável.
4. Stop→Start, ICE local ordenado/isolado, ICE remoto canônico, limite de 30 polls e regressões de entrada permanecem aprovados.
5. Baseline e xHome workflows verdes. Sem declarar validação de browser ou console físico.


## Execução visual — 2026-11-13 — navegação responsiva em telas compactas (4.15.2)

### Estado consultado e reconciliação
- **HEAD inicial de `main`:** `c28675d29a4e16f9a7546e091e596c9068975187`; versão do userscript **4.15.2**; blob inicial `NimboXcloud.user.js`: `c2a5e8f70f0f261561babeac729766e4d545f17b`.
- Commits recentes conferidos: release 4.15.2 e commits de acesso NX/atalhos/áudio; release 4.15.1 e correção de encaixe do NX na barra Xbox. A main tinha dois workflows verdes no HEAD consultado: baseline [43482698564](https://github.com/breno-bgod/NimboXcloud/actions/runs/43482698564) e regressões [43482698345](https://github.com/breno-bgod/NimboXcloud/actions/runs/43482698345).
- Árvore conferida: 90 entradas; userscript principal, módulo Touch HUD, 37 arquivos de teste, documentação de painel/entradas e dois workflows. Não existe `package.json` na raiz.
- Branch de trabalho: `automation/visual-responsive-nav-2026-11-13`, criada no SHA inicial; PR em rascunho [#28](https://github.com/breno-bgod/NimboXcloud/pull/28). Commits: `aacb979c0bf5bf2878982a10d372dd36e8f314dc` (CSS inicial), `0f0a0986c4808993ab8ed8a903a0a5485dffb8a7` (teste), `572f1a4f8ab8c6a8ed35606960b5c1d46a461434` (fallback de altura), `00008538959011066d46d142a9b6b2d43208bfe4` (asserção), `97472c80538c3b64ce6bf1d95434b904fb91a059` (roadmap) e `81f2bb232a4911955b0d7a26d3300e30f87a204e` (ajuste documental). A branch ficou 6 commits à frente e 0 atrás do HEAD base; diff limitado a três arquivos.

### Inventário da interface atual
- A navegação `TABS` tem nove destinos no total: Início, Vídeo e imagem, Streaming, Estatísticas, Entradas, Áudio e voz, Remote Play, Interface e Sistema. Portanto, são oito páginas de configuração mais Início; ainda não são as nove categorias solicitadas.
- **Início:** resumo/estado e atalhos para as páginas existentes.
- **Vídeo e imagem:** presets de qualidade solicitada, medição de resolução recebida, dispositivo/apresentação/enquadramento, ajustes de imagem, perfis locais e processamento GPU.
- **Streaming:** servidores/datacenter e opções de conexão/rede. O builder remove explicitamente os grupos “Qualidade de vídeo” e “Monitor de transmissão”; a qualidade continua na página Vídeo e imagem, contrariando a organização desejada de concentrar qualidade/transporte em Stream.
- **Estatísticas:** ativação e personalização do NX Stream Monitor, métricas, histórico e detalhes de transmissão.
- **Entradas:** seletor único dos cinco modos (teclado/mouse físicos, gamepad físico, teclado/mouse virtuais, controle virtual e toque nativo), opção Automático do Xbox e dois comandos de edição de HUD (controle virtual e teclado/mouse virtuais). A mesma página contém ajustes de gamepad físico (conexão, perfis de analógico, giroscópio, vibração e atalho do painel) e teclado/mouse físico (captura do ponteiro F8/F2 e atalho do painel).
- **Áudio e voz:** microfone/entrada de voz e reprodução/saída/efeitos de áudio.
- **Remote Play:** descoberta, seleção de console, controles de sessão e diagnóstico de mídia; a própria página descreve o recurso como experimental e não homologado em Xbox físico.
- **Interface:** aparência do painel (transparência, tom, cor de texto e ícones).
- **Sistema:** compatibilidade, ferramentas/manutenção e diagnósticos técnicos, incluindo diagnóstico de entradas e prévia técnica de HUD.
- **IDs legados:** `nxCanonicalTab` ainda direciona `gamepad` e `gyrotouch` para `inputs`; `images` para `video`, `voice` para `audio`, `compatibility` para `advanced` e `region` para `stream`. Não foram alterados.
- **Lacuna de arquitetura registrada:** a página Entradas mistura o seletor global de cinco modos com dois editores de HUD mobile e ajustes físicos. Os dois editores pertencem a Mobile; perfis/giroscópio/vibração/atalho físico pertencem a Joypad; captura/atalho físico pertencem a Teclado e Mouse. Porém, o seletor de cinco modos é único e transversal. Dividir a página sem duplicá-lo exige decidir um destino único para esse seletor antes de mexer nos builders. Não foi feita essa movimentação nesta execução.
- Outras divergências a tratar na próxima matriz: qualidade de stream ainda está em Vídeo e imagem; áudio e imagem permanecem em páginas distintas; Interface deve ser avaliada como Gerais, enquanto Sistema tende a Desenvolvedor/Avançado. Não há evidência suficiente para criar uma categoria Geral separada com opções fictícias.

### Mudança visual implementada na branch
- `NimboXcloud.user.js`: somente CSS injetado pelo `nxPanelApply`. Em viewport até 640 px, o painel passa de duas colunas para fluxo vertical; a navegação de categorias fica acima do conteúdo em uma faixa horizontal rolável, com rótulos visíveis, alvos de pelo menos 44 px e conteúdo ocupando a largura disponível. A faixa preserva todos os destinos, inclusive os que ficam fora da área visível inicial.
- Foi incluído fallback `100vh` antes de `100dvh` para limitar a altura em navegadores sem suporte a unidades dinâmicas de viewport.
- `tests/panel-layout.test.cjs`: teste estático para assegurar breakpoint, ordem visual, rolagem horizontal e dimensões mínimas dos itens.
- Nenhum ID, categoria, builder, callback, listener, handler, chave de armazenamento, valor, default, ordem DOM, estado, configuração ou comportamento de entrada foi alterado. A navegação muda somente por CSS; a ordem do DOM permanece intacta.

### Referências pesquisadas
- [Microsoft Fluent 2 — Nav](https://fluent2.microsoft.design/components/web/react/core/nav/usage): rótulos breves, linguagem simples, seleção clara, navegação consistente e adaptação em telas estreitas; o exemplo documenta drawer sobreposto em 640 px. Usado como referência de breakpoint e legibilidade, sem copiar implementação.
- [IBM Carbon — UI shell left panel](https://v10.carbondesignsystem.com/components/UI-shell-left-panel/usage): painel lateral para mais de cinco destinos e limite de dois níveis; reforça manter hierarquia curta e não adicionar níveis profundos para resolver excesso de opções.
- Não foram copiados assets, componentes ou código de terceiros.

### Testes e limitações
- Revisão estática do diff: somente `NimboXcloud.user.js` e `tests/panel-layout.test.cjs`; nenhuma mudança funcional. A asserção do novo teste foi corrigida para corresponder ao texto real do breakpoint.
- **CI no head `81f2bb232a4911955b0d7a26d3300e30f87a204e`:** baseline [run 43510290060](https://github.com/breno-bgod/NimboXcloud/actions/runs/43510290060) PASS e regressões [run 43510290405](https://github.com/breno-bgod/NimboXcloud/actions/runs/43510290405) PASS. Cada workflow executou **386 testes: 383 PASS, 0 FAIL, 3 TODO**. O novo teste de navegação compacta passou como subteste 185 nos dois workflows. Baseline também passou `node --check` do userscript e módulo Touch HUD e `tools/static-risk-report.cjs`; regressões passaram a validação de sintaxe e a suíte completa.
- Não executados localmente: Node, parser, build ou lint. Não executados: screenshot, Playwright/Chromium, Chrome/Edge, Android, DeX, orientação retrato/paisagem ou jogo autenticado. Não declarar validação visual concluída.
- Risco restante: em telas compactas, a navegação exige rolagem horizontal para alcançar todos os destinos; o comportamento precisa de verificação visual/toque real. O breakpoint e os tamanhos foram validados apenas por inspeção do CSS e teste estático pendente de CI.

### Próxima tarefa visual concreta — P1: matriz de categorias e destino único do seletor de entrada
- Especificar o mapeamento de cada grupo/linha atual para Mobile, Joypad, Teclado e Mouse, Stream, Vídeo e Áudio, Estatísticas, Remote Play, Desenvolvedor/Avançado e Gerais quando houver preferência universal real.
- Critérios de aceite: cada configuração aparece em exatamente uma categoria; os dois editores de HUD ficam em Mobile; Joypad contém somente gamepad físico; Teclado e Mouse contém somente ajustes físicos desse sistema; Stream reúne servidores, qualidade, resolução e rede; imagem e áudio ficam agrupados; Remote Play continua explicitamente experimental; diagnóstico técnico não se mistura com estatísticas; o seletor único dos cinco modos tem um único destino e não é duplicado; IDs legados, callbacks, armazenamento e testes permanecem preservados.
- Não implementar a divisão até que a matriz prove uma composição visual segura sem mover handlers nem recriar o seletor.
