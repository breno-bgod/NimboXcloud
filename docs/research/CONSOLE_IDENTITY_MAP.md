# Mapa de identidade de console — análise corrigida

Data: 2026-11-13. Base Nimbo: 3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd (4.15.1).
Objetivo: descobrir se uma sessão iniciada no navegador pode ser reconhecida pelo serviço como cliente console Xbox. Catálogo, paginação e disponibilidade de título são etapas separadas; não respondem por si a essa pergunta.

## Diagnóstico do Nimbo atual

| Camada | Código observado na main | O que demonstra |
| --- | --- | --- |
| Perfil histórico Xbox | NimboXcloud.user.js:169–175, nxConsoleLabProfile | Preferências xbox/xboxone/xboxseries migram para off; a função retorna off. Não há perfil Xbox ativo |
| Identidade JavaScript | :166–207 | navigator nativo preservado; os manifestos Xbox são referências não verificadas |
| Início cloud | :1097–1151, patchPlayRequest | settings.osName muda para windows/tizen conforme qualidade. Descritor X-MS-Device-Info, SDK e entradas são preservados; não implementa cliente Xbox |
| Autenticação do xCloud | Cliente do site; observador :316 | Nimbo observa host/status de login, não cria uma identidade autenticada de console |
| Diagnóstico | :349 e :384 | Lê identidade JS, offering observado e status. Reconhecimento Xbox permanece não verificado; sucesso de sessão não confirma classificação do cliente |
| Token para xHome | :3639, nxRemoteGssvToken | Reutiliza credencial GSSV da sessão do site em memória de execução. Não obtém identidade Xbox de hardware |
| Descritor e início xHome | :4548 e :4573 | clientAppType browser, hw.sdktype web e perfil de mídia; serverId identifica o console de destino, não transforma o navegador no console |

Fonte fixada: [NimboXcloud.user.js](https://github.com/breno-bgod/NimboXcloud/blob/3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd/NimboXcloud.user.js).

**Conclusão:** o projeto possui infraestrutura de streaming e diagnóstico, mas o mecanismo de reconhecimento do cliente como Xbox não está implementado nem demonstrado. A suspensão do perfil experimental foi uma decisão anterior; esta análise não o reativa.

## Referências examinadas pela cadeia de identidade

### PSBox

Commit eb63daf8f953684387a06a7bab8ef0a1e3133463, GPL-3.0.
- [xbox_live.cpp:69–95](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/eb63daf8f953684387a06a7bab8ef0a1e3133463/src/auth/xbox_live.cpp#L69): usuário RPS seguido de XSTS com UserTokens e SandboxId RETAIL.
- [auth_manager.cpp:136](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/eb63daf8f953684387a06a7bab8ef0a1e3133463/src/auth/auth_manager.cpp#L136): encadeia usuário, XSTS para GSSV e login cloud/home.
- gssv.h/gssv.cpp, já fixados no manifesto da auditoria: xgpuweb por padrão, perfis browser/native de aplicativo e sdkType web em startSession.

Não foi encontrada emissão de identidade autenticada Xbox no caminho inspecionado. Isso não constitui auditoria de todos os arquivos nem prova impossibilidade em outro cliente. PSBox funcionar em PlayStation/Linux não mostra como o servidor o classifica.

### xCloudNative

Commit a6ab26f4e29d84bf09e130bd8b6ac2325f099e59, MIT.
[XalAuthenticator.kt:166–191](https://github.com/Ricardex742/xCloudNative/blob/a6ab26f4e29d84bf09e130bd8b6ac2325f099e59/app/src/main/java/com/xcloud/tclnative/auth/XalAuthenticator.kt#L166): caminho inspecionado também usa usuário RPS, XSTS UserTokens e xgpuweb. Mensagens internas CONSOLE_CONNECT e token de transferência não são prova de reconhecimento do cliente como Xbox. A existência de classe com nome XalAuthenticator não basta para deduzir autenticação de dispositivo Xbox.

### Greenlight

Commit ca4283b5e03f0c6604683c03cfba1221a2e65239.
[packages/platform/src/controller/auth.ts](https://github.com/unknownskl/greenlight/blob/ca4283b5e03f0c6604683c03cfba1221a2e65239/packages/platform/src/controller/auth.ts): delega autenticação a xal-node e separa tokens xhome, xgpuweb e fallback xgpuwebf2p. Não foi inspecionada a implementação da dependência nesta execução; não inferir classificação Xbox pelo nome da biblioteca.

### XStreaming — pista diferente de autenticação

Commit 06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8.
[docs/1.Auth.md:96](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/docs/1.Auth.md#L96) documenta DeviceType Android, ProofOfPossession e uso posterior de DeviceToken, mantendo xgpuweb/xhome nos caminhos descritos. É evidência de uma cadeia de autenticação de dispositivo diferente da cadeia simples de usuário; **não é evidência de dispositivo Xbox**. Documentação de protocolo não equivale a implementação atual executada.

### Fortnite

O patch forceFortniteConsole do Better xCloud em ea4d19f2800cee9cfa387a0c9c37b3711cf208c7 altera o sinal de entrada de toque. Não foi localizada nesse patch uma mudança de autenticação para identidade Xbox. A experiência interna do jogo pode mudar sem o cliente tornar-se console. Os arquivos foram examinados anteriormente e permanecem referência específica de entrada.

## O que as fontes oficiais esclarecem — e o que não esclarecem

A documentação [EDS Authorization](https://learn.microsoft.com/en-us/xbox/gdk/docs/reference/live/rest/additional/edsauthorization) distingue identidades de usuário, dispositivo e título, combinadas por XSTS. [Xbox services security tokens](https://learn.microsoft.com/en-us/gaming/gdk/docs/services/fundamentals/s2s-auth-calls/service-authentication/security-tokens/live-security-tokens) explica que claims dependem do relying party.

Essas fontes dão fundamento à distinção entre declaração e identidade emitida. Não especificam nesta pesquisa a regra de classificação usada pelo serviço cloud para um Xbox. Não concluir que ele exige certificado, atestação de hardware ou um valor específico de DeviceType sem evidência adicional. Não inventar token, certificado, endpoint ou valor Xbox.

## Experimento executado com o código real do Nimbo

[identity-boundary](../../experiments/console/identity-boundary/README.md): quatro testes no snapshot atual da main, extraindo funções reais para VM. Confirmam:
1. patchPlayRequest altera somente o perfil observado, preservando descritor, SDK e configuração de toque no caso testado.
2. Requisição abortada não é reconstruída.
3. Preferências históricas Xbox não ativam o laboratório.
4. O descritor xHome declara browser/web nos três perfis de mídia.

Estado: simulação controlada aprovada para esses limites do código. Nenhum token real é lido; nenhuma chamada de rede é executada; não há sessão classificada como Xbox ou gameplay validado.

## Plano correto para continuar

1. Rastrear nos clientes de referência a origem e o destino da identidade: usuário, aplicação, eventual dispositivo e login GSSV. Para XStreaming, conferir implementação correspondente à documentação, não trocar Android por Xbox por suposição.
2. Identificar evidência pública ou diagnóstico autorizado de um cliente Xbox legítimo: distinguir descritores declarados de classificação/claims emitidos pelo serviço. Não pedir credenciais, tokens brutos, chaves ou certificados no chat.
3. Verificar se o SDK web permite expressar a capacidade real identificada, respeitando o contrato de autenticação. Comparar somente campos não sensíveis e explicitamente documentados; se exigir componente nativo, registrar.
4. Só então propor experimento isolado, opt-in, com evidência de reconhecimento ou rejeição da identidade. Vídeo recebido e HTTP 200 não servem isoladamente como confirmação.
5. Testar execução de um título autorizado em etapa separada. Não prometer GTA VI.

## Viabilidade por plataforma

Android, iOS e desktop: processamento JavaScript de descritores e uso das APIs web existentes é possível; equivalência de identidade Xbox permanece **não demonstrada nas três plataformas**. Trocar linguagem ou embutir um navegador não resolve, por si, uma identidade validada pelo servidor. CORS, acesso ao SDK e eventuais dependências de plataforma devem ser avaliados depois de identificar o mecanismo real.

Sem esse mecanismo, a decisão técnica é manter o produto em uso intacto e conduzir a pesquisa no PR #24. A automação foi alinhada para priorizar identidade de sessão; paginação fica registrada como investigação secundária.

## Implementação XStreaming: claims declarados no XSTS — 2026-11-13

Verificação nova sobre o snapshot 06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8; a documentação de autenticação foi confrontada com a implementação.

- [src/xal/index.ts:88](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/src/xal/index.ts#L88) constrói autenticação de dispositivo com DeviceType Android.
- [doXstsAuthorization:363](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/src/xal/index.ts#L363) deixa DeviceToken e TitleToken comentados. O objeto ativo Properties contém SandboxId e UserTokens. [getStreamingToken:640](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/src/xal/index.ts#L640) usa esse método para obter XSTS de GSSV e depois tokens xhome/xgpuweb.
- [src/xal/msal.ts:183](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/src/xal/msal.ts#L183) também monta XSTS com UserTokens. getGssvToken encadeia esse método antes do login de streaming.
- [XalManager.java](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/android/app/src/main/java/com/xstreaming/XalManager.java) gera par EC P-256 localmente e assina mensagens por uma bridge React Native. Não foi encontrada nesse trecho prova de origem Xbox; isso não determina os requisitos do servidor cloud.

[Experimento isolado](../../experiments/console/xstreaming-identity/README.md): executa somente as declarações payload extraídas dos arquivos fixados por SHA e hash, com valores sintéticos e VM limitada. Cinco testes aprovados; inclui controle que ativa campos apenas na string local e confirma sua detecção. Sem chamadas de autenticação, emissão de tokens ou envio de campos modificados ao servidor.

**Limite essencial:** ausência de DeviceToken/TitleToken explícitos na requisição não determina os claims derivados de UserTokens nem a classificação emitida pelo servidor. O resultado confirma o objeto montado pelo cliente, não reconhecimento ou ausência de reconhecimento como Xbox.

Estado: simulação controlada aprovada para construção de requisição; servidor e gameplay não verificados. A pista XStreaming deve ser tratada como autenticação Android com dois caminhos de usuário examinados, não como solução pronta para identidade Xbox.

Próximo passo: localizar evidência não sensível da classificação de cliente Xbox ou testar portabilidade criptográfica isolada para Web Crypto, sem confundir capacidade de assinar com identidade console. Não alterar a autenticação oficial.

## Instrumentação para próxima validação no navegador

Foi adicionado um [laboratório passivo opt-in](../../experiments/console/session-observer/README.md), separado do produto oficial, para acompanhar uma sessão iniciada manualmente no site. Ele não cria login/sessão nem implementa identidade Xbox. O relatório distingue declaração de descritor, status HTTP, observação de vídeo e confirmação manual de áudio/comandos, mantendo classificação do servidor não verificada.

Onze testes locais aprovados; navegador de teste bloqueado na inicialização, sem sessão real disponível. Use o roteiro para obter uma referência web não sensível antes de qualquer alteração de identidade. O resultado esperado inicial é observabilidade, não reconhecimento como console.

## Ponte HTML/JS Tizen: montagem verificada

[Experimento](../../experiments/console/tizen-bootstrap/README.md), fonte 24f0861a3fe2114a7d80f378a7724606399af392, LICENSE MIT confirmado. Cinco testes locais aprovados sobre construtor real com transporte simulado.

A ponte usa interface própria, mas declara browser/web/xgpuweb. O perfil de mídia android não muda o descritor Windows fixo. Isso reforça a separação entre perfil pedido, descritor e classificação emitida. Nenhuma identidade Xbox foi validada.

O manifesto de widget permite declarar rede externa; tal declaração não equivale a autorização CORS para o Edge Android/iOS/desktop. A viabilidade de um cliente independente nessas plataformas permanece condicionada ao fluxo de autenticação/SDK e permissões reais, sem necessidade presumida de reescrita nativa.


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
