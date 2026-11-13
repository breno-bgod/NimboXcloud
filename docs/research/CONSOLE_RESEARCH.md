# Registro de pesquisa: console e streaming no navegador

## Evidências herdadas e limites

Registro inicial em 2026-11-13 a partir da [proposta existente](../SERVICO_CONSOLE_PLANO.md). Esta organização não representa uma nova inspeção integral dos projetos, descoberta de repositório recente ou simulação aprovada. Os próximos registros devem fixar SHA e data das fontes consultadas.

### PSBox — pesquisa

Referências: [gssv.h](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.h) e [gssv.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.cpp). Os links de branch servem para localização; experimentos deverão citar o commit efetivamente consultado.

A investigação anterior distinguiu xgpuweb (cloud, titleId) de xhome (console próprio, serverId). É um cliente nativo; reutilizar uma ideia exige verificar transporte, APIs e restrições do navegador. Não demonstra autorização para executar títulos fora do catálogo ou de uma conta. Próximo passo: comparar mudanças recentes por SHA com os pontos de sessão e mídia já implementados no Nimbo, sem reiniciar diagnósticos concluídos.

### Better xCloud / Fortnite — pesquisa

Referência: [patcher.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/patcher/patcher.ts), patch forceFortniteConsole.

A evidência registrada na proposta é a alteração do argumento de sendTouchInputEnabledMessage para false na rota /launch/fortnite/. Isso descreve uma capacidade específica relacionada à experiência do Fortnite, não um desbloqueio geral de títulos. A preferência existente no Nimbo não comprova que esse patch esteja implementado. Próximo passo: identificar o caminho real no SDK retail atual e elaborar hipótese isolada com critério de refutação. Não inventar método público equivalente.

### Orbita — código atual bloqueado

Fontes: [site](https://x360.pistatrack.com/?lang=pt-BR), [ajuda](https://x360.pistatrack.com/ajuda?lang=pt-BR), [jogos](https://x360.pistatrack.com/jogos).

A proposta registra o aplicativo XEX/Aurora 1.1.0 executado no Xbox 360 como cliente do serviço cloud. Isso não comprova um serviço que transmita qualquer jogo de Xbox 360. O repositório sergiolimasks/orbita vinculado estava indisponível (404); conteúdo legado indexado não foi tratado como código da versão atual. Próxima busca deve conferir novamente a disponibilidade e distinguir documentação de implementação verificável.

### Linux — adaptação pendente

Android também pode anunciar Linux no user-agent. Esse texto não fornece APIs SDL, acesso a drivers, sockets ou decodificadores nativos ao JavaScript da página. A automação deve classificar cada solução: compatível com APIs web, dependente de servidor autorizado ou exclusiva de cliente nativo. Nenhuma equivalência funcional é presumida.

## Formato dos próximos registros

- Problema e hipótese única; links para questões/PRs existentes para evitar duplicação.
- Origem: URL primária, licença, created_at, SHA e data do commit relevante.
- Classificação: repositório novo nos últimos 30 dias ou projeto existente com alteração recente. updated_at sozinho não basta.
- Evidência no código e diferença entre cliente nativo e navegador.
- Experimento: fixture sem dados pessoais, origem, comando, resultado esperado e critério de refutação.
- Resultado observado: pesquisa / simulação aprovada / falha / bloqueada / validada em sessão real.
- Após falha: nova referência e justificativa da revisão; até três revisões fundamentadas por execução.
- Limites e próximo passo. Sem credenciais, tokens ou afirmação de gameplay baseada apenas em WebRTC/CI.

Nenhum resultado de GTA VI é declarado. A validação depende da disponibilidade efetiva do título ao mantenedor e de sessão autorizada.

## Investigação de perfis — 2026-11-13

### Pergunta e conclusão delimitada

PSBox e um cliente Android TV novo usam oferta específica de console nos caminhos de sessão inspecionados? A evidência localizada aponta para xgpuweb/perfis web; não foi demonstrado acesso a oferta exclusiva do Xbox. Não se conclui que toda adaptação seja impossível nem que todos os caminhos desses aplicativos tenham sido auditados.

### Janela e candidatos

Busca delimitada: 2026-10-14 a 2026-11-13, queries GitHub `xcloud created:>=2026-10-14` e `xcloud pushed:>=2026-10-14`, além de busca web PSBox/Orbita/cloud no console. O fetch REST genérico de search/repositories foi rejeitado pela ferramenta; usado o conector específico de busca. A lista não é exaustiva.

- **Ricardex742/xCloudNative**: criado 2026-10-31T06:06:50Z, MIT; snapshot a6ab26f4e29d84bf09e130bd8b6ac2325f099e59 de 2026-11-12T21:36:14Z. Esse head é documental. Último commit retornado para XCloudSignalingClient.kt: 739d2b79be555b1f90d23f4ce005d59600352b2e de 2026-11-11T04:24:22Z, mudança de internacionalização. O mecanismo abaixo foi inspecionado no snapshot, sem alegar que foi introduzido por esse commit.
- **asp11edgr/XCloud4**: criado 2026-10-20T06:50:00Z, GPL-3.0. Candidato descoberto; código/último commit ainda não inspecionados, sem conclusão funcional.
- **ironweb10/xCloudPS4**: criado 2026-10-16T13:37:06Z. Candidato descoberto; licença/código/último commit ainda não verificados, sem conclusão funcional.
- **PSBox**: criado 2026-10-07T03:34:58Z, fora da janela de criação; projeto existente atualizado. Snapshot eb63daf8f953684387a06a7bab8ef0a1e3133463 de 2026-11-13T02:38:53Z, mensagem de versão 1.7.1 e ajustes de login/biblioteca. Fonte LICENSE GPL-3.0 consultada.
- **Better xCloud**: snapshot ea4d19f2800cee9cfa387a0c9c37b3711cf208c7 de 2026-11-11T14:29:48Z. Patcher forceFortniteConsole continua localizado em patcher.ts; não é evidência de autorização geral de catálogo.

### Evidência primária

Fontes fixadas e hashes em [sources.json](../../experiments/console/client-profile-audit/sources.json).

PSBox: gssv.h define xgpuweb como offering padrão; gssv.cpp usa XboxComBrowser, sdkType web e separa título cloud de serverId home. Existem perfis condicionais de dispositivo no arquivo: uma busca de texto não prova qual perfil foi usado em determinada sessão real.

Android TV: XalAuthenticator.kt declara offeringId xgpuweb e XboxComBrowser; XCloudSignalingClient.kt declara clientAppType browser, sdkType web e início sessions/cloud/play. Mensagens internas denominadas CONSOLE_CONNECT não foram tratadas como prova de oferta console; nome de estado não substitui análise de autorização.

O anúncio [Xbox Wire de 10/11](https://news.xbox.com/en-us/2026/11/10/grand-theft-auto-6-comes-to-xbox-cloud-gaming-november-19/) informa início futuro do streaming de GTA VI em Xbox One/Series em 19/11, com condições por dispositivo/mercado e compra separada. A leitura confirma o contexto de investigação, mas não oferece uma sessão comparativa ou garantia para navegador. Nenhum teste de GTA VI foi executado.

### Experimento reproduzível e resultado

[client-profile-audit](../../experiments/console/client-profile-audit/README.md): ferramenta offline sem dependências ou importação no userscript. Hipótese limitada: localizar as declarações nos snapshots verificáveis antes de tentar reproduzir um perfil. Não são inventados endpoints ou payloads; nenhuma chamada autenticada é executada.

Comando: `node experiments/console/client-profile-audit/audit.mjs DIRETORIO_DAS_FONTES`.

Resultado: quatro fontes com integridade correspondente e dez âncoras localizadas. Fonte modificada foi rejeitada com source-mismatch/código 1; fonte removida com source-unavailable/código 1. Sintaxe Node aprovada. Saídas positivas/negativas preservadas no diretório do experimento.

**Estado: pesquisa / auditoria estática reproduzida.** Não é simulação de sessão aprovada nem gameplay validado.

### Aplicabilidade e próximo passo

| Caminho | Console próprio | Dependência observada | Android / iOS / desktop em navegador |
| --- | --- | --- | --- |
| PSBox cloud inspecionado | Não é usado serverId home nesse caminho | Cliente nativo, mídia/transporte próprios; autorização cloud | Equivalência de oferta não demonstrada nas três plataformas |
| PSBox xHome | Sim | Console autorizado e fluxo home | Validação real pendente; não substitui oferta cloud |
| xCloudNative cloud inspecionado | Não aparece como requisito no início cloud analisado | Android/Kotlin e reprodução nativa | Equivalência de oferta não demonstrada; APK não comprova página web |

Próxima evidência necessária: comparação de um mesmo título na nuvem Xbox e na web com conta, região, assinatura e período compatíveis; registrar separadamente catálogo, início aceito, mídia e comandos. Não alterar identidade do Nimbo para inferir resultado. Sem acesso a console/sessão, investigar candidatos ainda não inspecionados ou o caminho de capacidades/catalogação, aproveitando os registros do ajudante externo.

## Catálogo paginado versus oferta — aprofundamento em 2026-11-13

Os heads externos consultados continuam PSBox eb63daf8f953684387a06a7bab8ef0a1e3133463 e xCloudNative a6ab26f4e29d84bf09e130bd8b6ac2325f099e59. Sem nova versão presumida; investigação focada na lacuna de catálogo identificada antes.

**Achado:** PSBox listTitles (gssv.cpp:328, cursor:389) segue continuationToken. xCloudNative fetchCatalogGames (XCloudSignalingClient.kt:102) consome uma única resposta de /v2/titles sem paginação nessa função. Uma lista menor pode decorrer de enumeração incompleta, sem diferença de direitos. Não foi capturada resposta paginada real do serviço nesta execução.

**Ressalva confirmada:** o mesmo cliente Android oferece resolveGalleryProduct (:123), uma consulta autenticada de produto que exige resultado único. Esse caminho pode recuperar um item da galeria pública ausente na enumeração inicial. Portanto, não há diagnóstico de bug de gameplay confirmado no aplicativo Android.

CatalogService.officialGallery (:128) usa contexto Cloud:XGPUWEB. OfficialGallery.kt mantém metadados visuais separados da identidade cloud. Cartão público, identidade resolvida, autorização de início e gameplay são evidências distintas; nenhum desses arquivos demonstrou oferta exclusiva de console.

### Experimento e resultados

[Modelo offline de paginação](../../experiments/console/catalog-pagination/README.md), com fixture inteiramente sintética e fontes fixadas por commit. Sem login/rede ou importação no produto. A simulação contrasta leitura única com leitura das páginas fornecidas; não executa Kotlin/C++ nem reproduz a sessão completa.

Comandos de sintaxe, cinco testes comportamentais e CLI executados. Cinco aprovados, zero falhas. A fixture produz um ID na leitura única e dois na paginada. Sem continuação, estratégias concordam. Página ausente, cursor repetido/cíclico e limite não produzem completude falsa. Resultado em result.synthetic.json.

**Estado: simulação controlada aprovada somente para o modelo local.** Não valida disponibilidade real, autorização, mídia, comandos ou GTA VI. O teste evita atribuir uma ausência de listagem diretamente à oferta do serviço.

### Próxima verificação

Em uma sessão autorizada com jogo já disponível, comparar completude da enumeração e resolução de produto antes de iniciar. Um título só visto em galeria pública não basta. Sem acesso a conta/console nesta execução, comparação cloud Xbox versus web continua pendente.

Android/iOS/desktop podem processar essas estruturas em JavaScript; acesso HTTP autenticado, CORS e capacidade real de sessão continuam não verificados em cada navegador. Nenhuma mudança de identidade, endpoint ou runtime aplicada ao Nimbo.

## Correção de foco: identidade de cliente Xbox — 2026-11-13

O mantenedor esclareceu que a pergunta principal é se o serviço reconhece a sessão do navegador como cliente console Xbox. A investigação de paginação permanece secundária, sem ser descartada ou apresentada como resposta à identidade.

[Mapa detalhado](CONSOLE_IDENTITY_MAP.md): análise da main 3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd, autenticação PSBox/xCloudNative, controlador Greenlight, documentação XStreaming e fontes oficiais Microsoft sobre identidades de usuário/dispositivo/título.

Achados: o perfil histórico Xbox do Nimbo retorna off; patchPlayRequest reescreve osName de qualidade preservando descritor; xHome declara browser/web e seu serverId é console de destino. PSBox e xCloudNative não demonstraram identidade Xbox no caminho de usuário/XSTS inspecionado. XStreaming documenta DeviceToken Android, o que não prova identidade Xbox. Não presumir que o cloud exige atestação/certificado sem evidência específica.

Experimento [identity-boundary](../../experiments/console/identity-boundary/README.md): quatro testes aprovados usando funções reais do snapshot da main em VM. Sem acesso a credenciais ou rede; sem reconhecimento Xbox ou gameplay validado. A automação foi corrigida para priorizar identidade de sessão, preservando frequência e coordenação.

Próximo trabalho: verificar a cadeia real de dispositivo de referências e obter evidência não sensível do perfil/classificação de um cliente Xbox legítimo. Separar dados declarados de identidade emitida e autorização para jogo; não tentar valores/endpoints adivinhados.

## XStreaming — documentação versus objeto ativo, 2026-11-13

Aprofundamento do foco de identidade; main permanece em 3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd. Snapshot XStreaming continua 06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8, sem atualização presumida. Busca delimitada por candidatos criados desde 14/10 e por DeviceType/DeviceToken não trouxe nova implementação de cliente Xbox confirmada; candidatos já registrados não foram apresentados como novidade.

Achado novo na implementação: src/xal/index.ts declara Android no construtor de DeviceToken, mas comenta DeviceToken/TitleToken no objeto XSTS final examinado. O caminho MSAL também usa UserTokens. A cadeia GSSV foi rastreada por leitura. Claims emitidos e classificação do servidor continuam desconhecidos.

[Experimento](../../experiments/console/xstreaming-identity/README.md): cinco testes aprovados sobre construção de objetos extraída de fontes reais; valores sintéticos, hashes fixados, VM e nenhuma rede. Um controle local ativa os campos para verificar sensibilidade do teste. Resultado não equivale a autenticação aceita.

Fontes/linhas, licença AGPL-3.0, limites e próximos passos no [mapa de identidade](CONSOLE_IDENTITY_MAP.md#implementação-xstreaming-claims-declarados-no-xsts--2026-11-13). Nada foi alterado no userscript ou nas credenciais. Sem evidência de identidade Xbox em Android/iOS/desktop.

## Laboratório passivo para sessão real — 2026-11-13

Atendendo à lacuna de teste interativo discutida com o mantenedor, foi preparado um [userscript experimental independente](../../experiments/console/session-observer/README.md) que roda no play.xbox.com e observa somente após o usuário clicar em Iniciar observação.

Hipótese: produzir referência observável de pedidos de login/início, descritor de cliente e vídeo em progressão sem mudar a comunicação. Refutação prática: se o SDK não usar o fetch acessível ou o descritor não estiver exposto, marcar a etapa não observada; não concluir falha ou identidade Xbox.

O observador preserva argumentos, this, promise e resposta. Lê exclusivamente o header X-MS-Device-Info quando presente, enumera campos permitidos e não acessa Authorization, corpos, cookies ou armazenamento. Até 24 eventos sanitizados em memória. Amostragem de vídeo com trilha viva e contador de quadros, presença de áudio e confirmações manuais separadas. Vínculo entre mídia e pedido e reconhecimento Xbox permanecem não verificados.

Fontes atuais relidas: Nimbo main 3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd, PSBox eb63daf8f953684387a06a7bab8ef0a1e3133463 (gssv.cpp) e Better xCloud ea4d19f2800cee9cfa387a0c9c37b3711cf208c7 (patcher.ts). Nenhuma mudança externa presumida. Busca criada desde 14/10 retornou candidatos já registrados.

Onze testes Node/VM aprovados e sintaxe verificada. Incluem transparência, ausência de leitura de Authorization/corpo, sanitização, Request não consumido, confirmação manual sem atribuir identidade, troca de época, wrappers concorrentes, vídeo, montagem/fullscreen apenas do painel próprio e falha de instalação. Resultado resumido preservado no experimento.

Chromium/Playwright tentou cenário com rotas locais substituídas, mas encerrou antes de navegar: Crashpad setsockopt Operation not permitted / SIGTRAP. Interface visual e sessão Xbox real não validadas. Estado: testes locais aprovados; teste real pendente. Não é prova de comunicação autenticada ou gameplay.

Próximo passo: mantenedor instalar o addon experimental, iniciar observação antes de abrir um jogo disponível e revisar o relatório sanitizado conforme roteiro. Login já ocorrido ou tráfego em worker/XHR pode permanecer não observado. Não pedir HAR/tokens ou substituir aprovação. O instalador oficial, os módulos e a main permanecem intactos.

## Busca dirigida de duas semanas — 13/11/2026

[Relatório e fontes](RECENT_REPOSITORIES_2026-11-13.md) para repositórios criados de 30/10 a 13/11. Novos candidatos de código efetivamente triados incluem xcloud-tizen (HTML/JS/widget), xcloud-toolkit (userscript), GoyXCloud e XboxCloudTVLite (WebViews), xcloud-switch (fase inicial) e proxy recente. Falsos positivos de armazenamento e cópias/ponte de atualização foram separados.

Achado mais direto: [Green-NX #92](https://github.com/rmrf404/green-nx/issues/92), aberta em 10/11, pede investigar requisitos de dispositivo/sessão do Xbox One para GTA VI no Switch. Ainda sem comentários/resposta/implementação demonstrada. O repositório é anterior à quinzena.

O autor do Better xCloud também discute a hipótese no post público 961 do Telegram, explicitamente como especulação. Uma pista acadêmica histórica menciona xgpuconsole, mas não constitui contrato atual nem autorização para mudar offering.

Estado: pesquisa com inspeção de código/documentação; sem instalação ou testes de execução. Main e experimentos existentes intactos. Prioridade sugerida: conferir a ponte JS do Tizen e acompanhar a issue Green-NX, mantendo identidade declarada e classificação autenticada separadas.

## Bootstrap Tizen executado isoladamente — 13/11/2026

Snapshot externo 24f0861a3fe2114a7d80f378a7724606399af392 permanece igual. Green-NX #92 segue aberta sem comentários; a busca delimitada de novos repositórios retornou candidatos já registrados. O trabalho desta execução foi testar a lacuna da ponte HTML/JS, sem repetir a triagem.

[Experimento tizen-bootstrap](../../experiments/console/tizen-bootstrap/README.md) avalia as fontes reais config.js e streaming.js em VM com XC.Http.post substituído por resposta sintética. Cinco testes aprovados e sintaxe dos dois scripts verificada. Os snapshots são fixados por SHA/hash e externos ao repositório; nenhuma credencial real é usada.

Achado: offering xgpuweb, clientAppType browser, SDK web. Pedido osName android conserva descritor Windows. Isso confirma campos declarados diferentes, não reconhecimento Xbox nem falha do serviço. O config.xml declara permissões externas do widget; documentação Samsung confirma a política de rede própria. Essas permissões não são concedidas a uma página comum no Edge.

O método original rejeitou fixtures HTTP 403 e HTTP 200 sem sessionPath, preservando a distinção entre resposta e sessão criada. Mesmo a fixture aceita não comprova mídia/identidade. Resultado preservado.

Estado: simulação controlada aprovada para montagem de requisição. Nenhum login, endpoint real, CORS de navegador ou gameplay testado. Próximo passo: usar observador real com jogo autorizado e obter comparação não sensível de cliente Xbox legítimo; não portar o widget ou copiar descritor por suposição.

LICENSE do projeto Tizen foi lido neste SHA e confirmado MIT; a classificação anterior NOASSERTION vinha de metadados da API e foi corrigida no relatório de triagem.


## Revalidação de ofertas retail, clientes nativos e APIs web — 2026-11-13

### Resposta provisória à pergunta central

**Estado: INCONCLUSIVO para paridade geral; nenhum método público legítimo foi encontrado para transformar uma oferta retail exclusiva de console em uma oferta web.**

Não foi encontrada evidência de um mesmo título que, na mesma conta, assinatura/plano, região e janela temporal, tenha iniciado via Cloud Gaming no cliente Xbox e sido recusado no navegador. A exigência de comparar as mesmas condições continua válida; compra isolada não comprova acesso à nuvem.

A documentação oficial confirma que o Xbox Cloud Gaming executa o jogo em servidores Xbox/Azure, enquanto o Xbox Remote Play executa o jogo no console próprio do usuário. A página oficial de Xbox também declara que jogos disponíveis variam por região, dispositivo, plano Game Pass e modalidade/tempo de cloud play. Isso torna plausível uma diferença por dispositivo, mas não identifica qual verificação interna bloqueia um título específico. Consulta em 2026-11-13:
- [Introdução oficial a game streaming — GDK](https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/game-streaming-overview?view=gdk-2610).
- [FAQ oficial Xbox Cloud Gaming](https://www.xbox.com/en-US/cloud-gaming).
- [Atualização Xbox de abril de 2025](https://news.xbox.com/pt-br/2025/04/16/atualizacao-xbox-de-abril-compre-jogos-no-app-xbox-mobile-jogue-por-streaming-games-que-ja-possui-e-mais/).

Em abril de 2025, a Xbox informou que o recurso Stream Your Own Game foi ampliado aos consoles Xbox, além dos dispositivos já anunciados, incluindo aparelhos compatíveis com navegador. No mesmo artigo, Remote Play pelo navegador é descrito separadamente como transmissão de qualquer jogo instalado no console próprio. Portanto, catálogo cloud e Remote Play não devem ser misturados.

### Caso futuro: Grand Theft Auto VI

- **Fonte primária:** [Xbox Wire Brasil, 2026-11-10](https://news.xbox.com/pt-br/2026/11/10/grand-theft-auto-vi-chega-ao-xbox-one-e-xbox-series-xs-por-meio-do-xbox-cloud-gaming/).
- **Oferta anunciada:** Xbox Cloud Gaming em Xbox One e Xbox Series X|S, a partir de 2026-11-19 às 03:00 (Brasília).
- **Modalidade:** execução cloud; a publicação separa o jogo nativo no Series X|S da transmissão para Xbox One.
- **Conta/entitlement:** o jogo deve ser comprado separadamente; a notícia informa que tempo de jogo cloud pode ser comprado em mercados suportados. Nenhuma conta ou assinatura do mantenedor foi testada.
- **Região e dispositivo:** a própria notícia alerta que disponibilidade, dispositivos compatíveis e elegibilidade variam por mercado e dispositivo.
- **Navegador:** a notícia nomeia Xbox One e Series X|S, mas não declara explicitamente que o navegador está excluído. Em 2026-11-13 a oferta ainda não havia começado.

**Conclusão do caso:** candidato forte para comparação após o lançamento, mas ainda não é evidência de indisponibilidade web nem prova de suporte no console de uma conta específica. Não declarar GTA VI suportado antes de oferta efetiva e teste real.

A [issue #92 do Green-NX](https://github.com/rmrf404/green-nx/issues/92), aberta em 2026-11-10, pergunta se o jogo poderá ser transmitido no Switch. Continua aberta, com zero comentários na consulta, sem implementação ou resposta demonstrada.

### O que a documentação oficial permite no navegador

A Microsoft documenta o Web Content Test Application em `play.xbox.com` e `xbox.com/play`. Os dois ambientes web oferecem seleção de região, contas sandbox e private offerings. Uma private offering é um ambiente privado de teste de jogos em datacenter; a conta precisa estar autorizada para aquela offering e as regiões precisam estar configuradas. Os títulos dessa offering não aparecem no catálogo retail normal.

A mesma documentação separa:
- **IP Connect:** browser conectado diretamente a um Xbox Development Kit por IP, com WebSocket para sinalização e UDP para o stream; exige kit configurado, sandbox/test account e rede permitida.
- **Remote Connect:** transmite um Development Kit pela infraestrutura Xbox Remote Play; exige o kit e a conta configurados.
- **Private offering:** teste de jogo em datacenter, sujeito à autorização explícita da conta e às regiões configuradas.

Esses fluxos comprovam que o navegador é capaz de iniciar streams autorizados, mas não fornecem um caminho público para solicitar uma offering retail exclusiva de console. O fluxo de Development Kit também não é uma forma de acessar o catálogo comercial de outro dispositivo.

Fontes primárias:
- [CTA para play.xbox.com](https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/game-streaming-web-content-test-application?view=gdk-2610).
- [CTA para xbox.com/play](https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/game-streaming-web-content-test-application-xbox-com-play?view=gdk-2610).
- [Game Streaming Overview](https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/game-streaming-overview?view=gdk-2610).

**Requisito concreto atualmente identificado:** para o navegador receber uma oferta retail, o serviço precisa disponibilizar aquele título para o dispositivo/plataforma web e a conta precisa satisfazer plano, entitlement, região e tempo de cloud. Para private offering, a conta precisa estar explicitamente autorizada. Não há API pública documentada para converter uma autorização de console em autorização web, trocar a offering retail por spoofing de UA/headers ou anexar o navegador a uma sessão cloud já criada no console. Isso é uma conclusão sobre a documentação pública atual, não prova de impossibilidade absoluta.

### Alternativas revalidadas

| Projeto | Versão / fonte fixada | Modalidade demonstrada e limites |
| --- | --- | --- |
| [PSBox](https://github.com/RafaelNGP/psbox-cloud-gaming/tree/eb63daf8f953684387a06a7bab8ef0a1e3133463) | 1.7.1, commit `eb63daf8f953684387a06a7bab8ef0a1e3133463`, GPL-3.0 | Cliente nativo PS5, PS4/GoldHEN e Linux/Steam Deck. Código separa `xgpuweb` (cloud/titleId) de `xhome` (Remote Play do Xbox próprio/serverId). 1080p60 H.264 declarado no README. Não é página web nem prova de offering console. |
| [XCloud4](https://github.com/asp11edgr/XCloud4/tree/eb1fcba315fc768797b5398b97826506bf21ea04) | 1.3.0-beta, commit `eb1fcba315fc768797b5398b97826506bf21ea04`, GPL-3.0 | Cliente nativo PS4 com GoldHEN, autenticação Microsoft e Cloud Gaming; 1080p Max declarado. README não documenta Remote Play de console próprio. Não é browser. |
| [Green-NX](https://github.com/rmrf404/green-nx/tree/b52dd73d2bcdd043316a2623d5871dcbd2e5000b) | 1.0.31pre1, commit `b52dd73d2bcdd043316a2623d5871dcbd2e5000b`, GPL-3.0 | Homebrew nativo de Nintendo Switch. Código inspecionado usa ofertas `xgpuweb`/`xgpuwebf2p` e separa `xhome`; não foi encontrado caminho `xgpuconsole`. Issue #92 sobre GTA VI continua sem resposta. |
| [Orbita](https://x360.pistatrack.com/baixar?lang=pt-BR) | XEX 1.1.0, Xbox 360 720p/60 fps; página de jogos consultada em 2026-11-13 | Aplicativo nativo para Xbox 360 RGH/JTAG/Aurora, cliente de Cloud Gaming, não Remote Play e não jogo local. Ajuda declara que o jogo roda nos servidores Microsoft, que a conta define os títulos e que uma conta só joga em um aparelho por vez. A lista declara 600 títulos: 35 funcionam, 2 com problemas e 563 não testados. O repositório atual vinculado não pôde ser inspecionado via API GitHub; não inferir código XEX a partir do legado ELF. |
| [Greenlight](https://github.com/unknownskl/greenlight/tree/ca4283b5e03f0c6604683c03cfba1221a2e65239) + [xbox-xcloud-player](https://github.com/unknownskl/xbox-xcloud-player/tree/a6511a645736f4988f77323284c6f0f36bf93aef) | Greenlight commit `ca4283b5e03f0c6604683c03cfba1221a2e65239`, MIT; player `1.0.0-beta7`, pacote declara MIT | Aplicativo desktop nativo que usa a biblioteca WebRTC para xCloud e xHome. xCloud e Remote Play do Xbox próprio são caminhos distintos. A biblioteca não é um site/browser; o exemplo do README usa token xHome. |
| [XStreaming](https://github.com/Geocld/XStreaming/tree/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8) | 2.12.0, commit `06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8`, AGPL-3.0 | Aplicativo React Native para Android/iOS, com `react-native-webrtc` e WebView. Os caminhos inspecionados separam `xgpuweb` de `xhome`; o payload de autenticação declara DeviceType Android. Não é uma página web comum nem identidade Xbox. |
| [Better xCloud](https://github.com/redphx/better-xcloud/tree/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7) | Release 6.7.13, MIT | Userscript que altera a experiência web e entradas. README atual informa que funciona em `xbox.com/play`, não no novo `play.xbox.com` em preview. O patch de toque do Fortnite é específico; não libera catálogo ou entitlement. |
| [EvenBetter-Xcloud](https://github.com/Endymi0n74/EvenBetter-Xcloud/tree/dffae53404b9ff3cead44604d477d0d7684453cc) | 1.13.11, commit `dffae53404b9ff3cead44604d477d0d7684453cc`, package declara MIT | Fork de userscript com APK Android baseado em WebView; iOS usa Safari + userscript. O auto-spoof de UA descrito no commit contorna um gate Chromium-only da página, não concede autorização de jogo nem identidade Xbox. |
| [OpenXCloud](https://github.com/shyim/openxcloud/tree/dfa95ebbf3dc7e46187e1ade5e56b02702190324) | commit `dfa95ebbf3dc7e46187e1ade5e56b02702190324` de 2026-11-12, GPL-3.0-only | Cliente desktop nativo Rust com webrtc-rs, FFmpeg, H.264/Opus e wgpu. README diz que o primeiro release ainda está em preparação; streaming Windows foi validado pelo autor em RTX 4070 Ti. Não é browser. |
| [xCloudNative](https://github.com/Ricardex742/xCloudNative/tree/a6ab26f4e29d84bf09e130bd8b6ac2325f099e59) | Snapshot auditado em 2026-11-13, MIT | Cliente Android nativo. A auditoria anterior encontrou `xgpuweb`, `XboxComBrowser`, `clientAppType=browser` e `sdkType=web` no caminho inspecionado; isso é descritor declarado, não classificação do servidor. |

**Leitura comum:** clientes nativos em consoles não Xbox podem consumir a oferta web `xgpuweb`; alguns também implementam Remote Play `xhome`. Ser um aplicativo em console, usar nome de console ou enviar descritor/UA específico não prova que o servidor concedeu a oferta de console Xbox. Licenças foram conferidas; nenhum código externo foi copiado nesta execução.

### Compatibilidade de APIs web por plataforma

Matriz de compatibilidade consultada em 2026-11-13; versões mínimas são referências de suporte da API, não homologação do Xbox Cloud Gaming:

| API | Android (Chrome/Edge Chromium) | iOS no Brasil (WebKit) | Desktop |
| --- | --- | --- | --- |
| WebRTC / RTCPeerConnection | Suporte amplo; Chrome Android 56+ | Safari iOS 11+ | Chrome 56+, Edge 15+, Firefox 44+, Safari 11+ |
| WebSocket | Amplamente disponível | Amplamente disponível | Amplamente disponível |
| WebCodecs VideoDecoder | Chrome Android 94+ | Safari iOS 16.4+ | Chrome/Edge 94+, Firefox 130+, Safari 16.4+ |
| MediaSource | Suporte amplo no Chrome Android | Parcial no Safari iOS; historicamente limitado no iPhone | Suporte amplo |
| Gamepad | Chrome Android 25+; mapeamento/haptics variam | Safari iOS 10.3+; haptics dependem do SO/controle | Suporte amplo |
| Pointer Lock | Chrome Android não; Firefox Android tem suporte | Safari iOS não | Suporte amplo em navegadores desktop |
| Fullscreen | Chrome Android suporta | Safari iOS parcial; vídeo pode usar fullscreen nativo | Suporte amplo |
| WebHID | Não suportado em Chrome Android/WebView Android | Não suportado | Chrome/Edge desktop 89+; Firefox/Safari não |
| WebUSB | Disponibilidade limitada, HTTPS e permissão explícita | Não suportado de forma interoperável | Principalmente Chromium desktop; não depender de forma multiplataforma |
| EME/DRM | API disponível; CDM/key system variam | API disponível; FairPlay/WebKit tem caminho próprio | API disponível; Widevine/PlayReady variam por navegador/SO |

WebRTC, WebSocket e Gamepad já cobrem o transporte e controles básicos em navegadores modernos. WebCodecs pode ajudar em decodificação explícita, mas não é pré-requisito para receber um MediaStream WebRTC; MSE não deve ser confundido com o transporte WebRTC. WebHID/WebUSB, Pointer Lock e fullscreen têm lacunas relevantes para periféricos e UX mobile, mas não explicam por si só um título ausente do catálogo.

Chrome bloqueia autoplay com áudio sem interação prévia; WebKit também exige gesto do usuário para áudio em cenários relevantes. O stream deve começar após ação do usuário e ser testado em primeiro plano. PWA conserva o motor e as permissões do navegador; não cria autorização nova. WebView usa o motor do sistema e pode ter bridge nativa/permissões do app, portanto não é equivalente a página comum. Em iOS distribuído no Brasil, Chrome/Edge/Firefox continuam sob WebKit: as exceções de motores alternativos da Apple são limitadas à UE e ao Japão, com entitlement.

Fontes de compatibilidade:
- [RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection), [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket), [VideoDecoder/WebCodecs](https://developer.mozilla.org/en-US/docs/Web/API/VideoDecoder), [MediaSource](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource), [Gamepad](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad).
- [Pointer Lock](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock), [Fullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API), [WebHID](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API), [WebUSB](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API), [EME](https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API).
- [Política de autoplay do Chrome](https://developer.chrome.com/blog/autoplay), [políticas de vídeo WebKit](https://webkit.org/blog/6784/new-video-policies-for-ios/), [motores alternativos na UE](https://developer.apple.com/de/support/alternative-browser-engines/) e [no Japão](https://developer.apple.com/support/alternative-browser-engines-jp/).

### Experimento mínimo e critério de refutação

**Hipótese:** um título que o serviço oferece via Cloud Gaming no cliente Xbox pode ser recusado no cliente web devido à elegibilidade do dispositivo/oferta, mesmo com a mesma conta, plano, região e janela.

**Pré-requisitos:** título efetivamente disponível na nuvem para a conta do mantenedor; mesma conta Xbox; plano e cloud playtime registrados; mesma região; console Xbox com cliente atualizado; navegador suportado em primeiro plano. GTA VI só pode ser usado depois de 2026-11-19 e se estiver realmente liberado à conta.

**Procedimento:**
1. Registrar título, Title ID se visível, região, data/hora, plano/tempo cloud e versões dos clientes, sem capturar tokens.
2. Iniciar Cloud Gaming no Xbox (não instalação local e não Remote Play); registrar tela/resultado e se a sessão foi criada.
3. Em até 15 minutos, abrir o mesmo título no site oficial web, na mesma conta/região, e registrar catálogo, erro e modalidade.
4. Se a web iniciar, observar SDP/ICE, trilhas de áudio/vídeo, quadros recebidos e um comando funcional; não marcar sucesso apenas por HTTP 200, catálogo, SDP ou conexão WebRTC.
5. Repetir uma vez em ordem inversa se a primeira comparação for ambígua.

**Resultado esperado:** ambos iniciam, ou o console inicia e a web retorna uma recusa reproduzível com evidência não sensível do estado/erro.

**Refutação da hipótese de bloqueio por dispositivo:** o mesmo título inicia no browser nas mesmas condições e entrega vídeo, áudio e comandos funcionais. **Confirmação de diferença observada:** o console inicia e a web recusa o mesmo título sob as condições controladas; isso ainda não identifica a regra interna até obter erro/documentação que a explique.

**Limite desta execução:** nenhum teste autenticado real, console físico, Android, iOS ou gameplay foi executado. O observador passivo existente continua opt-in; os testes locais anteriores não comprovam classificação do servidor.

### Próxima tarefa concreta

Obter uma comparação pareada, não sensível, de um título já disponível ao mantenedor na nuvem do Xbox e no navegador oficial, com a mesma conta/plano/região e janela de até 15 minutos. Só usar GTA VI após a oferta iniciar e o jogo estar efetivamente elegível à conta. Registrar a recusa/aceitação do serviço e a cadeia de mídia/comandos, sem tokens ou HAR completo.


## Auditoria do caminho Android PSBox — 13/11/2026

Experimento reproduzível [psbox-android-audit](../../experiments/console/psbox-android-audit/README.md). ZIP do mantenedor identificado por SHA256, com três arquivos confirmados idênticos ao PSBox eb63daf8f953684387a06a7bab8ef0a1e3133463. Resultado: esqueleto Android presente, mas sem MainActivity/ícones e sem integração direta do núcleo de sessão no CMake; dependências de submódulos vazias no archive. Quatro testes da auditoria aprovados; resultado real em result.json. Nenhum build/APK/sessão/identidade Xbox validado. A investigação reduz uma ambiguidade de capacidade do cliente nativo; não substitui o foco em classificação do cliente web. A existência de AMediaCodec e NDK não prova funcionamento no navegador ou identidade autenticada. Próximo passo de identidade: capturar início real com observador 0.1.3 e comparar com o núcleo PSBox; eventual trabalho Android amplo requer proposta própria.


## Client Hints — método real do Better xCloud em VM

Novo experimento [client-hints-boundary](../../experiments/console/client-hints-boundary/README.md): corpo de UserAgent.spoof em fonte fixada por SHA256, cinco testes aprovados. Propriedade herdada é escondida; propriedade própria com valor existente é preservada por defineProperty com descriptor vazio. UA não configurável pode deixar estado parcialmente alterado. Esses são resultados de objetos sintéticos, não diagnóstico confirmado do Edge do mantenedor. HTTP hints, tokens e classificação do servidor permanecem não observados/não verificados. A pesquisa de identidade não é pré-requisito para um port Android autorizado. Sem mudança do produto ou autenticação.


## PSBox #466 — recusa por tipo de dispositivo, evidência nova em 13/11/2026

**Fonte primária:** https://github.com/RafaelNGP/psbox-cloud-gaming/pull/466, incorporado em 13/11/2026 às 17:14:28 UTC. Commit funcional 0bb5ab3ea3ffde55b071e6b12731d7e26f86700a; main consultada c775ecaddde52024d177cce7392aae13cc6917aa. Comparação com eb63daf8f953684387a06a7bab8ef0a1e3133463: 15 arquivos, nenhuma alteração em src/auth/. Projeto criado em 07/10/2026 (não é repositório novo na janela 14/10–13/11); atividade de código nova confirmada por diff/SHA, não updated_at.

### O que a fonte afirma

O corpo do PR relata que Killer Instinct 2 Classic foi recusado com DeviceTypeNotAllowed mesmo com entitlement e que tentativas de se apresentar como Samsung TV e console Xbox no PS5 também foram recusadas. Relata verificação no PS5 e aprovação do mantenedor na TV. São relatos técnicos do próprio projeto; não recebemos logs sanitizados daquelas tentativas, valores/payloads completos ou confirmação do esquema interno do servidor. Não reproduzimos esses testes.

### O que o código efetivamente mudou

- src/xcloud/gssv.cpp/listTitles lê details.allowedDeviceTypes; gssv.h acrescenta o campo à estrutura Title.
- library_sync.cpp, library.cpp/.h e GameTile preservam a informação, inclusive no cache.
- isDeviceTypeRefusal reconhece a substring DeviceTypeNotAllowed no erro; worker.cpp mostra os dispositivos permitidos, com tradução em seis idiomas.
- tests/test_main.cpp separa exemplos de DeviceTypeNotAllowed e NoEntitlement. São testes de reconhecimento de texto, não de identidade autenticada.
- O PR não implementa um novo cliente Xbox, troca de offering ou nova autenticação. Sua mudança é diagnóstico da recusa.

### Consequência para a hipótese de identidade

Há agora evidência primária de uma recusa específica de dispositivo relatada pelo PSBox, separada de falta de entitlement. Isso reduz a sustentação da hipótese de que copiar o perfil declarado do PSBox basta para obter classificação Xbox. A afirmação do autor de que a identidade é fixada pelo cliente autenticado é uma explicação upstream: este diff não mostra onde a classificação ocorre e não prova exigência de certificado/atestado. Não converter allowedDeviceTypes em valor inventado de DeviceType na autenticação.

A lista permitida não identifica o dispositivo atual; ausência da lista não comprova ausência de restrição. HTTP 200 ou mídia em outro título não refutam a recusa daquele jogo. A mensagem genérica console/Samsung TV não substitui o campo recebido. Não generalizar o caso para GTA VI.

### Próximo experimento delimitado

Hipótese: é possível distinguir uma recusa explícita DeviceTypeNotAllowed de NoEntitlement na criação da sessão sem alterar identidade. Com título realmente disponível e autorizado ao mantenedor, registrar somente código enumerado de erro, etapa, horário e modalidade cloud; não exportar corpo bruto/token. Refutação de bloqueio por dispositivo para aquela tentativa: o mesmo título inicia sob condições controladas; erro diferente não confirma DeviceTypeNotAllowed. Antes de implementar leitura de erro no observador passivo, revisar seu contrato de não leitura de corpos e definir extração limitada/revisável; não ampliar silenciosamente a coleta. Não iniciar acesso autenticado automático.

Estado: pesquisa de código e relato upstream, sem sessão real nossa. Verificação: corpo do PR, diff dos 15 arquivos, três casos de teste upstream inspecionados; testes C++ não executados localmente nesta revisão documental. CI do Nimbo anterior aprovado; não comprova essa hipótese. Android/iOS/desktop web continuam sem prova de classificação Xbox; port Android é frente separada e não depende de validar essa identidade para compilar.


## Integração Android no Nimbo — contrato de sessão (13/11/2026)

Decisão vigente: dois motores no mesmo ambiente, sem fork separado obrigatório;
identidade Xbox secundária. [Proposta](PSBOX_ANDROID_INTEGRATION.md) e
[contrato executável](../../experiments/console/engine-session-contract/README.md).
Upstream reconsultado c775ecaddde52024d177cce7392aae13cc6917aa, sem novo SHA;
árvore Android confirma Activity/recursos/wrapper ausentes, CMake sem núcleo e
seleção host/Linux incompatível. PRs abertos: nenhum; issue #461 relata teclado/
mouse sem funcionamento, não prova falha Android; CI upstream consultado aprovado,
sem evidência de build Android. Nenhum comentário novo no PR #24.

Implementado somente proprietário experimental de sessão: bloqueio concorrente,
neutralização antes de stop, invalidação de gerações, erros sanitizados e retenção
de propriedade quando stop falha. Nove testes comportamentais locais aprovados:
node --test --test-isolation=none experiments/console/engine-session-contract/session-owner.test.mjs.
Estado: simulação aprovada. Adaptadores sintéticos não validam JNI, login, mídia,
entitlement ou gameplay. Nenhuma fonte PSBox copiada; referências GPL preservadas
na proposta. Nenhuma mudança no produto ou dependência nova. Executor sem toolchain
Android. Próximo incremento: alvo ARM64 e Activity/fachada nativa no próprio
experimento, com CI após completar dependências; sem segundo painel PSBox.


## PSBox Android — armazenamento privado verificado (13/11/2026)

[Experimento](../../experiments/console/psbox-android-platform/README.md).
Upstream permanece c775ecaddde52024d177cce7392aae13cc6917aa; nenhum PR aberto ou
comentário novo no PR #24; CI upstream aprovado, sem prova Android. Main Nimbo
agora c28675d29a4e16f9a7546e091e596c9068975187 (4.15.2); não alterada nesta frente.

Problema reproduzido: platform_android.cpp assumia init/dataDirWritable=true
mesmo com erro de mkdir e possuía fallback no pacote com.rafaelngp.psbox.
Foram incorporadas cinco fontes/avisos selecionados, hashes upstream/local em
sources.json, GPL integral preservada. Só platform_android.cpp foi modificado:
exige caminho absoluto do host, verifica diretórios, cria/escreve/remove probe
exclusivo, informa errno/estado e reseta prontidão no shutdown. Host deverá usar
filesDir/psbox, sem expor caminho a páginas web. Sem mudança de autenticação.

Comando: bash experiments/console/psbox-android-platform/test-host.sh. Baseline
upstream compilou, mas falhou em missing host directory must fail; adaptado
compilou e passou com filesystem real. Verificados casos negativos, escrita e
leitura de fixture sintética, limpeza, reinicialização e shutdown. Isso é build
e teste nativo Linux do backend, não validação no Android. Sem credenciais ou
conta usada. Script ARM64 fixa NDK 27.2.12479018/API26, recusa toolchain errado,
linka biblioteca com --no-undefined e exige ELF AArch64. Workflow limitado ao
experimento, artefato com fontes/avisos, sem APK e sem libdatachannel/FFmpeg/SDL.
Resultado ARM64 ainda pendente no momento da publicação. Próximo incremento:
confirmar CI; então configuração do host Activity/JNI e ligação gradual do núcleo,
sem segundo painel e sem iniciar login antes de CA/assets/lifecycle reais.


### Resultado ARM64 confirmado

CI [PSBox Android platform experiment #43492918003](https://github.com/breno-bgod/NimboXcloud/actions/runs/43492918003), commit 9782833d32652aa1cbe8c4819a80017f2f401b62: todos os passos aprovados, incluindo teste host, instalação NDK, link ARM64, verificação ELF e upload. Artefato nimbo-psbox-platform-arm64-not-apk, ID 14070886207, 73217 bytes, digest sha256:efb0bd2093e7aab5bd68aa1ff222c79e9d7f2deea7f8b73681e6f0e0d7494b8b. Inclui fonte correspondente/avisos. Link ARM64 desta camada está comprovado pelo build; marco (a) do motor completo ainda não concluído. Sem instalação ou execução Android, Activity/JNI, mídia ou login. A espera anterior do CI deixou de ser bloqueio; próximo passo é lifecycle/configuração do host e ligação do núcleo.


## Lifecycle de plataforma PSBox e fachada Java/JNI — 13/11/2026

Upstream reconsultado c775ecaddde52024d177cce7392aae13cc6917aa, sem novo SHA;
main Nimbo c28675d29a4e16f9a7546e091e596c9068975187, preservada. Nenhum comentário
novo no PR #24. [Experimento](../../experiments/console/psbox-android-platform/README.md).
Sobre a camada ARM64 anterior, acrescentados init/status/shutdown serializados,
configuração filesDir/psbox sem mutação global de ambiente, fachada Java/JNI
sem interface WebView e montagem de AAR experimental. Regra R8 e avisos do NDK
incluídos; runtime C++ estático, sem depender de libc++_shared omitida.

Teste host compila storage e lifecycle C++ reais (-Werror no lifecycle) e passa
com filesystem real: inicialização, idempotência, EBUSY para troca ativa, parada,
recuperação de erro, preservação do ambiente e concorrência com proprietário
único. Comando: bash experiments/console/psbox-android-platform/test-host.sh.
Scripts ARM64/AAR passaram bash -n; Java/JNI/empacotamento dependem do CI desta
revisão, ainda pendente ao publicar. Hash local atualizado em sources.json;
fontes/avisos upstream preservados. Nenhum login, token, mídia, Activity, APK,
instalação ou gameplay. Shutdown de plataforma não é stop completo do motor.
Próximo: confirmar AAR/ABI no CI e ligar Activity/lifecycle do host e núcleo
incrementalmente, antes de UI compartilhada ou sessão autenticada.


### Build Java/JNI/AAR confirmado

[CI #43497614092](https://github.com/breno-bgod/NimboXcloud/actions/runs/43497614092), commit a6098beba94e9d1cd1db88caf094c9c6c6dce46f: todos os passos aprovados, incluindo testes C++ host, link ARM64 sem símbolos indefinidos, verificação dos três símbolos JNI, ausência de dependência libc++_shared, compilação Java SDK35/release17 e montagem/verificação estrutural do AAR. Artefato nimbo-psbox-platform-arm64-not-apk, ID 14071318850, 546013 bytes, digest sha256:92be237a8962878f46fd8632a8e84c557469742b68b2bc3ea73a38619fd70a6e; contém AAR, biblioteca parcial e fonte correspondente/avisos. Não é APK nem motor completo. Não houve execução JNI em VM Android, Activity, instalação no S23, login, mídia ou gameplay. A espera de compilação deixou de ser bloqueio; próximo passo é host/lifecycle Android real e ligação gradual do núcleo antes de sessão autenticada.


## Ligação ao lifecycle da Activity — 13/11/2026

Incremento isolado: PsboxActivityBinding por composição com
Application.ActivityLifecycleCallbacks, seleção inicial desligada, init da
plataforma somente com Activity vinculada iniciada e motor selecionado;
liberação em onStop/deseleção/destruição, WeakReference e limpeza de listener.
PlatformOwner recusa outro proprietário, ignora parada de token antigo e mantém
propriedade em falha de cleanup/stop. Retries de BUSY são limitados a eventos de
lifecycle; sem polling. Não cria Activity, tela, launcher ou ponte WebView.
Não misturar chamadas diretas à fachada com a binding.

Teste Java do coordenador real com backend simulado passou localmente para
idempotência, proprietário único, callbacks atrasados, falhas, retry, exceções
sanitizadas e concorrência. Executor sem ct.sym não aceita --release17/21;
comando aprovado: JAVA_TEST_RELEASE=runtime bash
experiments/console/psbox-android-platform/test-java-host.sh. CI mantém release17
com JDK completo e compila todas as classes contra android.jar35 no AAR.
Scripts passaram bash -n. Compilação Android deste incremento pendente ao publicar.

A chamada de publicação anterior foi interrompida; conferência após retomada
confirmou que o PR não avançou e os arquivos locais foram preservados. Teste Java
reexecutado com sucesso. Upstream c775ecaddde52024d177cce7392aae13cc6917aa e main
Nimbo c28675d29a4e16f9a7546e091e596c9068975187 continuam iguais, sem comentário
novo do ajudante no PR #24. Não houve merge ou alteração do produto.

Sem eventos reais do framework, rotação/Activity em execução, JNI no aparelho,
APK, login, mídia ou gameplay. Prontidão/parada aqui refere-se somente à camada de
plataforma: antes do núcleo, neutralização, StreamPlayer::stop e workers devem
participar do encerramento. Próximo: confirmar build da binding e preparar
execução instrumentada do host antes de integrar núcleo/mídia/entrada.


### Build da binding confirmado

[CI #43513384405](https://github.com/breno-bgod/NimboXcloud/actions/runs/43513384405), commit 9c2bbe5af3c0d17da618c1cb0143ef65dee90d3e: testes Java com release17 aprovados, testes C++ host aprovados, link ARM64/JNI aprovado, compilação de todas as classes Android e montagem do AAR aprovadas. Artefato nimbo-psbox-platform-arm64-not-apk, ID 14078484160, 555666 bytes, digest sha256:c5b48455ba94fea0b7e50a8928e25de056a68e36f75acfe4d1f273ed081067f6, inclui AAR e fontes/avisos. Não foi necessário relaxar release17 no CI. Ainda é biblioteca de plataforma, não APK/motor completo. Não houve eventos reais de Activity, rotação, execução JNI no Android ou sessão cloud. Próximo: execução instrumentada do host e ligação gradual do núcleo sem novo painel.


## Transporte HTTPS original para o módulo Android — 13/11/2026

Main oficial 98eff1294ad053a284d8661d59d8923373d07e57 (PR29/4.15.3) preservada;
PSBox sem novo SHA desde c775ecaddde52024d177cce7392aae13cc6917aa. Sem comentário
novo no PR #24. Proposta curta publicada no PR antes da dependência. Incorporados
8 arquivos selecionados de HTTP/utilitários/CA/config originais, Git blob SHA e
SHA256 conferidos; sem auth/session/purchase. Mbed TLS 107ea89daaefb9867ea9121002fbbdf926780e98
(3.6.2) e framework94599c0e3b5036e086446a51a3f79640f70f22f6 reproduzem gitlinks.
Licenças/sourcecorrespondente e public CA provenance preservadas.

Novo CMake3.22.1 do SDK e script build-transport.sh: teste host offline de URL,
chunked/JSON e initTls com fallback público embutido; link Android ARM64/API26
com JNI, runtime estático e --no-undefined; AAR leva aviso MbedTLS e artefato leva
fontes das dependências. Nenhum request ou acesso autenticado automatizado.
Bash -n e regressões storage/lifecycle locais aprovados; CMake/dep/SDK indisponíveis
localmente, build do transporte pendente no CI ao publicar. CA pública não é
certificado de usuário/dispositivo. Aprovação não provará handshake, login,
identidade ou streaming. Próximo: confirmar esse build e ligar serviços do núcleo
com lifecycle real, mantendo um painel e preservando os dois motores.
