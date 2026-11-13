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
