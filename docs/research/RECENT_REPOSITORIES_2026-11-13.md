# Busca de projetos recentes — 30/10 a 13/11/2026

Consulta em 13/11/2026. Janela de criação solicitada: últimas duas semanas. Datas confirmadas pela API GitHub; criação do repositório não significa criação original de todo o código. Discussões recentes de projetos antigos são apresentadas separadamente.

## Resultado principal: alguém pediu exatamente o mesmo caminho

[Green-NX #92 — Feature Request: GTA 6 Xbox One Cloud Streaming](https://github.com/rmrf404/green-nx/issues/92), aberta em 10/11/2026 às 18:09:56Z. O autor pede investigar os requisitos de dispositivo/sessão do cliente Xbox One para transmitir GTA VI no Nintendo Switch.

A questão coincide diretamente com a investigação de identidade do Nimbo. Estado conferido: aberta, zero comentários. Trata-se de solicitação de um usuário; não há resposta do mantenedor, commit de implementação ou gameplay demonstrado nessa issue.

O repositório green-nx foi criado em 22/07/2026; não é novo nesta quinzena. Head consultado b52dd73d2bcdd043316a2623d5871dcbd2e5000b de 17/09/2026. Não transformar a atividade da issue em atualização de código. Não houve contato/publicação externa.

## Repositórios criados na janela e triados

| Projeto | Criação UTC | Processo encontrado | Relação com Nimbo / limite |
| --- | --- | --- | --- |
| [Ricardex742/xCloudNative](https://github.com/Ricardex742/xCloudNative) | 31/10/2026 | Cliente Android independente, Kotlin, autenticação e reprodução nativa | Comparação de cliente completo. Código de identidade já analisado usa xgpuweb; não demonstra Xbox reconhecido |
| [deivid22srk/xcloud-tizen](https://github.com/deivid22srk/xcloud-tizen) | 04/11/2026 | HTML/JavaScript próprio, autenticação, REST e WebRTC em widget Tizen | Candidato mais próximo da ideia de interface própria com ponte de comunicação; permissões do widget diferem de página comum |
| [BlaNkS01/xcloud-toolkit](https://github.com/BlaNkS01/xcloud-toolkit) | 11/11/2026 | Userscript/extensão para entradas, diagnóstico e imagem no cliente web | Próximo da manutenção funcional do Nimbo; README nega contorno de restrições do serviço. Sem solução GTA VI identificada |
| [GoyDevv/GoyXCloud](https://github.com/GoyDevv/GoyXCloud) | 11/11/2026 | Android WebView, código Better xCloud e bridge de mouse | Similar ao uso do site com adaptações de entrada, não identidade Xbox demonstrada |
| [odiasz1/XboxCloudTVLite](https://github.com/odiasz1/XboxCloudTVLite) | 08/11/2026 | WebView carrega xbox.com/play | Wrapper de navegação; não novo cliente de protocolo |
| [tianshuiniu/xcloud-switch](https://github.com/tianshuiniu/xcloud-switch) | 01/11/2026 | C++ com camada de autenticação/REST; README declara fase de mídia não implementada | Útil como estudo de cadeia; configuração aponta xhome e README admite ausência de validação real. Não apresentar como streaming funcional |
| [LectraWallet/xbox-cloud-proxy](https://github.com/LectraWallet/xbox-cloud-proxy) | 13/11/2026 | Proxy Node com Scramjet/Bare e interface própria | Intermedia o site; não foi identificada prova de reconhecimento Xbox. Não executado nem usado para autenticação |

### Snapshots e arquivos examinados

- xCloudNative: a6ab26f4e29d84bf09e130bd8b6ac2325f099e59, 12/11 21:36:14Z, MIT. README e cadeia de identidade já fixada na pesquisa anterior; mesma revisão.
- xcloud-tizen: 24f0861a3fe2114a7d80f378a7724606399af392, 04/11 15:31:12Z. js/config.js:45 declara xgpuweb/fallback xgpuwebf2p; js/api/streaming.js:31–33 declara app browser e :65 sdkType web; js/stream/session.js organiza início. tools/proxy/README.md distingue widget com permissões próprias de depuração em navegador com CORS; não homologado em conta/TV nesta pesquisa. Metadados da API retornaram NOASSERTION; leitura posterior do arquivo LICENSE no mesmo SHA confirmou MIT. Ainda é necessário preservar a licença ao reutilizar código.
- xcloud-toolkit: 6be08afec1f93b2fc01ae561d16c769bf852f868, 12/11 19:50:32Z, MIT. README e xcloud-toolkit_v2_1_1.js consultados; não houve teste de execução.
- GoyXCloud: 87b1dae3f54ac1935192836c4895a076152e4373, 11/11 04:55:08Z. MainActivity.java carrega o site e injeta JavaScript; árvore inclui Better xCloud. Metadados fork=false não provam código original. Licença não confirmada.
- XboxCloudTVLite: 4e9afcd2e9469b7bc325519dd791778ff17df490, 08/11 01:46:09Z. MainActivity.java:21 aponta xbox.com/pt-br/play; :114 chama loadUrl. Licença não confirmada.
- xcloud-switch: 3a3d7318f892aa35776bbce687c5ee323cce5e08, 01/11 10:44:11Z. README, include/xcloud/config.h e src/auth.cpp. Não endossar instruções do README para imprimir tokens ou desativar verificação TLS. Não executado; licença não confirmada.
- xbox-cloud-proxy: 76bea014ae1b5a211b954eb6093edf4e13be5e30, 13/11 07:28:11Z. README, server.js e public/index.html consultados. Não executado e licença não confirmada. Não foi usado o mecanismo de transferência de login.

Links de código podem ser fixados como https://github.com/OWNER/REPO/blob/SHA/PATH usando os dados acima.

## Fora do GitHub: desenvolvedor discutindo a mesma hipótese

[Canal oficial Better xCloud, post 961](https://t.me/betterxcloud/961), conteúdo acessível na [página pública do canal](https://t.me/s/betterxcloud). O autor declara que não testará GTA VI por preferência pessoal e apresenta, como especulação, a possibilidade de alterar informações do cliente; também levanta a hipótese de verificações adicionais pelo serviço. Não há demonstração de identidade Xbox ou implementação nesse post. Data exata não foi exposta na extração consultada; não incluí-lo artificialmente no filtro de criação de repositórios.

Isso confirma discussão de uma ideia semelhante por outro desenvolvedor. Não confirma sucesso nem a necessidade de atestação específica.

## Pista técnica histórica, separada da quinzena

O artigo de 2024 [Network Anatomy and Real-Time Measurement of Nvidia GeForce NOW Cloud Gaming](https://www2.ee.unsw.edu.au/~vijay/pubs/conf/24PAMCloudGaming.pdf), de pesquisadores da UNSW/Canopus, inclui comparação com tráfego Xbox e relata nomes de serviço xgpuconsole, xgpuweb e xgpu para configurações diferentes.

O PDF integral expirou por timeout nos dois hosts primários tentados; o trecho foi encontrado pela indexação do PDF hospedado pelos autores e pelo evento. É uma pista histórica parcial, não uma especificação atual nem prova de endpoint/credencial aceitos em 2026. Não montar uma requisição ou trocar offering para xgpuconsole somente com base nesse nome.

## Resultados excluídos

- BxiiDN/XCloudSSD: armazenamento virtual com rclone, sem relação com Xbox Cloud Gaming.
- aquib4040/RapidXCloud-Android: cofre/backup de arquivos, não jogos Xbox.
- RafaelNGP/xbox-cloud-gaming-ps5: criado em 11/11, mas descrição diz ponte temporária de atualização para versões antigas do PSBox; não é um novo cliente independente.
- liljtrav/xbox-cloud-proxy: fork criado em 09/11, com push herdado anterior à quinzena; não foi contado como implementação nova.
- JBuildr/nubix (07/10), RayLabsStudio/RayxCloud (11/09), PSBox (07/10), XCloud4 (20/10) e green-nx (22/07): fora da janela de criação, embora possam ser referências.
- [PSBox #351](https://github.com/RafaelNGP/psbox-cloud-gaming/issues/351), 04/11, menciona GTA 6 no formulário, mas o log mostra falha TLS anterior ao login. Não comprova execução desse jogo.

## Método, limites e próximo passo

Foram usadas buscas de repositórios por xcloud, Xbox Cloud e Game Pass com created:2026-10-30..2026-11-13; buscas de GTA VI/GTA 6 e xgpuconsole em repositórios/issues; pesquisa web em português/inglês e buscas indexadas para GitLab/Codeberg. Nem todos os resultados foram inspecionados; não se declara cobertura exaustiva de todo código público/privado.

Não foi encontrado nesta busca um repositório novo com implementação demonstrada de GTA VI no navegador reconhecido como Xbox. A correspondência mais direta é a issue Green-NX; o melhor candidato novo para estudar uma ponte HTML/JavaScript própria é xcloud-tizen, com a ressalva de permissões Tizen e ausência de teste real.

Próximo trabalho recomendado: comparar o bootstrap Tizen com nosso observador e cliente web, sem copiar autenticação ou relaxar CORS/TLS por suposição. Acompanhar Green-NX #92 e o post Better xCloud por evidência nova. Nenhum código foi instalado/executado, nenhuma conta conectada e nenhum teste de gameplay realizado nesta triagem.
