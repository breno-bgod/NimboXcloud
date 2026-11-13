# Experimento: catálogo incompleto versus autorização

## Hipótese

Uma diferença de listagem entre clientes pode ser causada pela leitura incompleta de páginas, sem diferença na oferta ou nos direitos da conta.

## Evidência de código, consultada em 2026-11-13

- [PSBox gssv.cpp, listTitles](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/eb63daf8f953684387a06a7bab8ef0a1e3133463/src/xcloud/gssv.cpp#L328): pede páginas e segue continuationToken; interrompe token repetido, página vazia e limites. LICENSE GPL-3.0.
- [xCloudNative XCloudSignalingClient.kt, fetchCatalogGames](https://github.com/Ricardex742/xCloudNative/blob/a6ab26f4e29d84bf09e130bd8b6ac2325f099e59/app/src/main/java/com/xcloud/tclnative/signaling/XCloudSignalingClient.kt#L102): uma leitura de /v2/titles, seguida de parse/deduplicação/ordenação, sem seguir o cursor nessa função. MIT.
- [resolveGalleryProduct](https://github.com/Ricardex742/xCloudNative/blob/a6ab26f4e29d84bf09e130bd8b6ac2325f099e59/app/src/main/java/com/xcloud/tclnative/signaling/XCloudSignalingClient.kt#L123): outro caminho resolve produto por consulta autenticada; pode recuperar item ausente da lista inicial. Não foi reproduzida a aplicação Android.
- [CatalogService.kt, officialGallery](https://github.com/Ricardex742/xCloudNative/blob/a6ab26f4e29d84bf09e130bd8b6ac2325f099e59/app/src/main/java/com/xcloud/tclnative/catalog/CatalogService.kt#L128): galeria pública usa Cloud:XGPUWEB, mantendo metadados separados da identidade cloud.

## Modelo e critérios

Código JavaScript independente, sem rede, autenticação ou carregamento pelo userscript. pages.synthetic.json é inteiramente sintético; não é resposta capturada do Xbox. Os campos results, titleId e continuationToken foram observados no PSBox. O objeto de saída e seus estados são locais ao experimento, não mensagens do Xbox.

O modelo compara consumo de uma página com consumo das páginas fornecidas. Não executa Kotlin/C++ nem afirma reproduzir toda a política de catálogo dos clientes. O token é somente um sinal de continuação; o modelo consome páginas já fornecidas, sem testar um servidor ou o encadeamento de requisições.

Hipótese refutada para uma amostra sem continuação: ambas as estratégias produzem os mesmos IDs. Com página adicional, o modelo deve localizar IDs adicionais; não deve marcar catálogo completo quando faltar página ou o cursor repetir. Não infere disponibilidade negativa pela ausência de um item.

## Execução

Requer Node.js com suporte a --test-isolation=none neste ambiente:

`node --test --test-isolation=none experiments/console/catalog-pagination/probe.test.mjs`

`node experiments/console/catalog-pagination/probe.mjs experiments/console/catalog-pagination/pages.synthetic.json`

Cinco testes aprovados: segunda página, ausência de paginação, página ausente/vazia, cursor repetido/cíclico/limite e entradas inválidas/deduplicação. result.synthetic.json preserva o resultado da fixture: um ID na leitura única, dois na paginada. Nenhum corresponde a jogo real.

## Limites e próximo teste

Estado: simulação controlada aprovada somente para o modelo de paginação; código dos clientes foi inspecionado estaticamente. Não há validação de catálogo real, mídia, comandos, autorização ou GTA VI.

Antes de atribuir uma ausência à oferta exclusiva de console, verificar completude do catálogo e resolução autenticada de produto com título já disponível. Sem console/sessão, a comparação real continua bloqueada. A evidência de uma função sem paginação é um risco condicional, não um bug confirmado de gameplay no cliente Android.

O processamento local das páginas é compatível com JavaScript em Android/iOS/desktop. Isso não valida acesso aos mesmos endpoints no navegador: CORS, autenticação e a oferta efetivamente concedida precisam ser verificados separadamente. Nenhuma alteração de identidade ou de protocolo foi aplicada ao Nimbo.
