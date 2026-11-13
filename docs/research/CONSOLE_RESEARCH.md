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
