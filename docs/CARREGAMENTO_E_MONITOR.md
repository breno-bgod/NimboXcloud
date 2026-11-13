# Preparação da partida, ícones e monitor — proposta no PR #22

## Comportamento

O painel de preparação aparece após uma chamada real de início de sessão xCloud ou consulta de espera na rota de lançamento. Sempre exibe estimativa disponível e tempo decorrido. A opção **Interface → NX Stream Monitor → Mostrar informações técnicas no carregamento** controla somente os detalhes; não esconde a estimativa.

As informações separam servidor solicitado de destino observado pelo endpoint de início; o destino observado não identifica o hardware alocado. Qualidade solicitada não é resolução recebida. Antes dos quadros e das estatísticas atuais, os campos indicam espera por medição, sem reaproveitar FPS/bitrate da sessão anterior.

O NX e seus acessos integrados ficam ocultos e setOpen rejeita aberturas nesse período, inclusive atalhos. Os controles nativos do Xbox, como cancelar/voltar, não são ocultados nem substituídos. HUD em edição é ocultada temporariamente, preservando os dados; não se descarta trabalho silenciosamente. Ao receber um vídeo novo/reutilizado que efetivamente esteja pronto e reproduzindo, o NX é liberado. Isso observa mídia e não certifica gameplay.

Cancelamento, falha de criação ou saída da rota também liberam o painel. Sem progresso por três minutos após a última resposta relevante ou após o prazo estimado, o estado muda para carregamento sem atualização e libera as configurações. Uma fila com estimativa maior prolonga esse limite; respostas atuais renovam a atividade. Não se cancela a sessão nem se promete que a fila terminou. Esse fallback protege contra bloqueio permanente quando o cliente não informa estado terminal.

## Estimativa e limites

São lidos somente os números estimatedTotalWaitTimeInSeconds e, na ausência de total válido, estimatedAllocationTimeInSeconds de respostas waittime existentes. A estimativa de alocação não inclui necessariamente todo o preparo. Valores ausentes/inválidos mostram **Estimativa indisponível**; a previsão ultrapassada é identificada sem contagem regressiva fictícia.

As leituras usam Response.clone, sem consumir a resposta original ou atrasar sua entrega esperando JSON. Callbacks pertencem à geração da tentativa; dados de uma sessão antiga não alteram a nova. Não são emitidas requisições novas nem lidos/persistidos tokens ou corpos integrais no diagnóstico.

O observador cobre fetch em domínios Xbox verificados. Se uma versão do cliente mudar transporte ou formato, pode faltar estimativa; não inferir números pelo tempo decorrido. Estimativas antecipadas nos cartões da biblioteca não fazem parte deste lote: faltam validar a correspondência de títulos e acesso real antes de propor consultas adicionais.

## Monitor durante a partida

Mantidos os modos horizontal, vertical, automático e compacto, cores, opacidade, escala, campos e posição salvos. Novo modo **Cartões com gráficos** mostra histórico de FPS do vídeo recebido, RTT e bitrate quando selecionados; os outros campos aparecem como cartões de texto. Histórico de até 60 amostras, limitado em memória e reiniciado por sessão. Renderizações repetidas não criam novas amostras; lacunas e zero FPS não são substituídos por valores fictícios. Cada gráfico usa sua escala, começando em zero. Remote Play permanece disponível após uma sessão cloud, com identificação própria e métricas condicionadas ao seu peer, sem reaproveitar o servidor cloud.

Nenhuma leitura de disco, temperatura ou utilização geral de CPU/GPU foi acrescentada. Essas capacidades do Adrenalin/Afterburner não são oferecidas ao userscript por APIs normais do navegador.

## Ícones e textos

Desenhos de controle e teclado/mouse passam a ter contornos legíveis e separados. Entradas, Interface e Remote Play possuem ícones próprios, sem fallback repetido de controle. Barra lateral recebe mais espaço e rótulos só quebram entre palavras; não se altera o logotipo.

## Referências consultadas

- [Better xCloud xcloud-interceptor.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/utils/xcloud-interceptor.ts): handleWaitTime lê estimativas do serviço usando clone; não é necessário provisionar jogos para sondar filas.
- [Better xCloud loading-screen.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/loading-screen.ts): apresentação de espera separada do monitor de jogo. O Nimbo não copia sua contagem regressiva.
- [Better xCloud game-tile.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/ui/game-tile.ts): estimativa por título; depende de identificador e API correspondentes, ainda não integrados nos cartões do Nimbo.
- [PSBox stream_session.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/stream/stream_session.cpp): distinção de conexão, espera por negociação, handshake e falha. O cliente nativo possui callbacks próprios; aqui só se apresentam respostas e reprodução observadas no navegador, sem copiar seu protocolo.

## Evidência e aceite pendente

351 testes Node: 348 PASS, zero FAIL, três TODO preexistentes. Vinte e dois testes novos cobrem geração/tentativas, espera antes do play, erro HTTP/abort, clone inválido, vídeo anterior, navegação, inatividade, bloqueio real do painel, detalhes opcionais, limpeza e gráficos. Sintaxe dos dois scripts e relatório estático executados. Ícones renderizados e inspecionados em SVG via librsvg/Cairo, sem adicionar dependências ao projeto.

Chromium/Playwright não iniciou neste ambiente. Não foi possível validar carregamento, fila ou a nova apresentação em uma conta Xbox real. Teste recomendado no dispositivo: ativar/desativar detalhes antes de lançar; iniciar Fortnite; conferir espera/estimativa ausente; tentar abrir NX por botão, teclado e controle; cancelar e repetir; ao receber vídeo, abrir NX e ajustar layouts/cores/escala/posição do monitor. Conferir ícones e nomes em retrato e paisagem. Simulação de RTC/DOM não valida serviço, mídia real nem disponibilidade de GTA VI.
