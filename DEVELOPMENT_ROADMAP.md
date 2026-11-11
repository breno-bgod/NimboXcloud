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
