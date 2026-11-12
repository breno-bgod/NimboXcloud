# Servidores de streaming — lote 4.12.91

## Objetivo

Oferecer as regiões anunciadas pelo Xbox no login da sessão, preservando Automático, preferências antigas e alternativas nativas. A lista de regiões de acesso/loja é independente da lista de datacenters.

## Como usar

1. Atualize o userscript principal para 4.12.91 e recarregue o site.
2. Abra NX → Streaming. O seletor mostra o catálogo recebido no login.
3. Mantenha Automático ou escolha uma região da lista.
4. Para aplicar uma mudança de servidor, encerre a partida e use **Recarregar para aplicar servidor**. A preferência é aplicada na resposta de login; não foi comprovado que todo início de jogo refaça esse login.
5. Inicie outra partida e confira **Destino observado**. A escolha configurada não é prova de que o serviço a utilizou.

O botão de recarregar fica desabilitado quando a telemetria indica transmissão ativa. Nenhuma troca ou recarga é feita automaticamente. Se a lista ainda não chegou, os quatro atalhos antigos aparecem identificados como aguardando lista; não são uma confirmação de disponibilidade. A lista efetiva substitui esses atalhos quando chega.

## Implementação

- O catálogo é observado em login cloud via fetch, inclusive em Automático. Não há nova solicitação de autenticação ou sondagem.
- Cada entrada retém somente nome, rótulo, origem HTTPS e identificador curto do host.
- Só são aceitos hosts no formato de datacenter GSSV cloud esperado; URLs com credenciais, portas alternativas, destinos externos e origens xHome são rejeitadas para o seletor.
- Respostas e credenciais não são persistidas no catálogo. A origem não inclui query, fragmento ou caminho.
- Identificadores desconhecidos válidos são exibidos pelo nome retornado pelo serviço. A tabela de rótulos não cria disponibilidade.
- Preferências `ejp`, `ckr`, `eus` e `weu` continuam sendo lidas sem apagar/migrar armazenamento. Escolhas novas usam o nome canônico da região.
- A região preferida é colocada como padrão sem eliminar as demais. Se estiver ausente, mantém-se a resposta original e informa-se o fallback.
- JSON inválido, lista vazia ou falha HTTP invalidam a lista anterior, evitando apresentar dados antigos como atuais.
- Login xHome passa integralmente sem modificar catálogo ou resposta.
- A preferência histórica de RTT só considera regiões oferecidas, com pelo menos cinco amostras válidas nas últimas 24 h. Histórico não é ping atual.
- O endpoint observado é associado ao nome canônico para o monitor e histórico. Sua localização física não é comprovada por isso.
- O seletor recebe atualizações pelo ciclo existente de interface; nenhuma rotina periódica adicional foi criada.
- Preferências do seletor não alteram o destino observado ou o pin do login já aplicado à partida atual.

## Verificação

Node 24.22.1: `node --test --test-isolation=none tests/*.test.cjs tests/*.test.mjs`.

Resultado local: **221 testes, 218 PASS, zero FAIL, três TODO**. Sintaxe dos dois scripts passou; relatório estático executado com os quatro hooks já existentes identificados. Foram adicionados dezesseis testes de comportamento, incluindo uso do hook fetch real, catálogo dinâmico, fallback, idempotência, aliases, atualização do seletor com DOM simulado e isolamento xHome.

O Chromium foi iniciado via Playwright para testar o seletor em larguras mobile e desktop, mas encerrou antes de abrir a página por restrição do ambiente: `setsockopt: Operation not permitted` (SIGTRAP). Portanto, **não houve teste visual de navegador nem partida autenticada** neste lote. O teste com DOM simulado não equivale a navegador real.

## Aceite no dispositivo

- Confirmar que a lista aparece depois do login e distingue datacenter de região da loja.
- Escolher uma região anunciada, recarregar antes da partida e conferir o endpoint observado.
- Voltar a Automático e repetir.
- Confirmar mouse por toque, WASD, controle físico, toque nativo, áudio e abertura/fechamento do painel.
- Confirmar que mudar a preferência durante uma partida não muda a identificação da sessão atual.
- Se uma região salva desaparecer, conferir indicação de indisponibilidade, preservação da preferência e possibilidade de selecionar Automático.
- Registrar versão, navegador, aparelho, jogo, região solicitada e resultado observado. Não compartilhar tokens, cookies ou respostas completas de autenticação.

## Pesquisa e decisões

A pesquisa comparou a enumeração de `offeringSettings.regions` em dois clientes públicos com o caminho já existente no NimboXcloud. Ambos extraem o catálogo da resposta de login. A implementação deste lote é própria, em JavaScript; nenhum núcleo C++ nem dependência externa foi incorporado. Ao contrário de reduzir a lista a um destino, preservamos as alternativas retornadas pelo Xbox.

Registros técnicos de origem consultados (fora da interface do produto):
- https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.cpp — blob `5610a31b351052447dd39ce87f0824c2035415c7`, trecho de login/enumeração.
- https://github.com/redphx/better-xcloud/blob/typescript/src/utils/xcloud-interceptor.ts — blob `f44bda13df7a232fff3264b2fad0fa5566b7e6c0`, trecho de login/enumeração.

## Limites

A interceptação depende de o login cloud passar por fetch no contexto observado. Se o cliente migrar o login para Worker/XHR ou alterar seu schema, o catálogo pode ficar indisponível; o código preserva o fluxo nativo. A mudança não garante que uma região anunciada aceite qualquer jogo, não muda direitos da conta e não habilita 1440p. O próximo lote é investigar a negociação de qualidade preservando a entrada atual.

