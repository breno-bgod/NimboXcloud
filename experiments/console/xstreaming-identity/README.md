# XStreaming: identidade de dispositivo versus objeto XSTS

## Hipótese e origem

A presença de autenticação de dispositivo no cliente significa que DeviceToken é encaminhado no XSTS usado no streaming?

Fonte pública fixada: Geocld/XStreaming, commit 06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8 (2026-11-02), licença AGPL-3.0 conforme LICENSE consultado. Dois arquivos são lidos externamente, sem copiar seu código para o Nimbo:
- [src/xal/index.ts](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/src/xal/index.ts), salvar como xal-index.ts.
- [src/xal/msal.ts](https://github.com/Geocld/XStreaming/blob/06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8/src/xal/msal.ts), salvar como msal.ts.

sources.json contém os hashes dos snapshots. Normalização: UTF-8, CRLF para LF e uma quebra final. Fontes alteradas são rejeitadas antes da execução.

## O que o experimento executa

O extrator delimita somente a declaração local const payload nos métodos inspecionados e a avalia em VM, com timeout e valores sintéticos. Não executa o método inteiro, axios, login, geração de credenciais ou assinatura. A cadeia de chamada até GSSV foi verificada por leitura do código, não simulada integralmente.

Relatório contém nomes de propriedades, quantidade de tokens e DeviceType declarado. Não imprime valores de tokens, chaves ou credenciais. O teste de sensibilidade ativa propriedades comentadas somente na string local em memória; não propõe enviá-las ao serviço.

## Reprodução

Requer Node.js. Baixe os arquivos dos links fixados para um diretório local, com os nomes acima. Não use arquivos de sessão/conta.

`node experiments/console/xstreaming-identity/probe.mjs DIRETORIO`

`XSTREAMING_SOURCES=DIRETORIO node --test --test-isolation=none experiments/console/xstreaming-identity/probe.test.mjs`

## Resultado observado

Cinco testes aprovados:
1. Objeto XSTS legado omite DeviceToken/TitleToken apesar de receber valores sintéticos disponíveis no contexto.
2. Objeto XSTS MSAL contém usuário sem essas propriedades.
3. Construtor de dispositivo declara Android; saída não expõe valores sintéticos.
4. Controle de sensibilidade detecta propriedades quando ativadas só na cópia de teste.
5. Extrator rejeita snapshot sem o método esperado.

Resultado do probe preservado em result.json. Verificação de sintaxe dos dois scripts aprovada.

## Limites

Estado: simulação controlada da construção de objetos, com fontes reais e valores sintéticos. Sem rede, tokens reais, aprovação de autenticação, emissão de claims, reconhecimento Xbox ou gameplay. Ausência dessas propriedades na requisição não prova quais claims o servidor emite a partir de UserTokens.

No caminho legado, src/xal/index.ts:363 tem as propriedades de dispositivo/título comentadas; getStreamingToken (:640) chama esse método para GSSV. No caminho MSAL, getGssvToken usa doXstsAuthorization (:183), também sem elas. A seleção de caminho pelo aplicativo e seu funcionamento real não foram homologados.

A documentação de autenticação do projeto mostra uma sequência mais ampla; não substituir a implementação atual pela documentação. NativeModules.XalManager e o assinador Java são dependências da implementação React Native examinada, não evidência de identidade Xbox. P-256 local não comprova certificado ou atestação de console.

## Próximo passo

Investigar qual informação não sensível distingue um cliente Xbox legítimo na classificação do serviço. Se a hipótese for portar o cálculo criptográfico para Web Crypto, testar separadamente a equivalência com mensagens sintéticas antes de qualquer proposta de autenticação. Isso seria uma verificação de portabilidade, não reconhecimento como console.

Android/iOS/desktop: construir JSON é transferível; a bridge React Native não existe em uma página comum. Disponibilidade de APIs web e aceitação no servidor permanecem não verificadas. Não alterar autenticação do Nimbo nem ativar campos por tentativa.
