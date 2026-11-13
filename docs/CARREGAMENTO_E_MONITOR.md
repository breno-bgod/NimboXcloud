# Preparação da partida, ícones e monitor — proposta no PR #22

## Comportamento

O painel de preparação é compacto, na lateral direita, e começa com os detalhes recolhidos. O botão NX expande/recolhe só os detalhes; previsão e tempo decorrido permanecem. Se os detalhes estiverem desativados nas preferências, esse botão também fica oculto.

O painel de preparação aparece após uma chamada real de início de sessão xCloud ou consulta de espera na rota de lançamento. Sempre exibe estimativa disponível e tempo decorrido. A opção **Estatísticas → Personalizar monitor → Mostrar informações técnicas no carregamento** controla somente os detalhes; não esconde a estimativa.

As informações separam servidor solicitado de destino observado pelo endpoint de início; o destino observado não identifica o hardware alocado. Qualidade solicitada não é resolução recebida. Antes dos quadros e das estatísticas atuais, os campos indicam espera por medição, sem reaproveitar FPS/bitrate da sessão anterior.

O NX e seus acessos integrados ficam ocultos e setOpen rejeita aberturas nesse período, inclusive atalhos. Os controles nativos do Xbox, como cancelar/voltar, não são ocultados nem substituídos. HUD em edição é ocultada temporariamente, preservando os dados; não se descarta trabalho silenciosamente. Ao receber um vídeo novo/reutilizado que efetivamente esteja pronto e reproduzindo, o NX é liberado. Isso observa mídia e não certifica gameplay.

Cancelamento, falha de criação ou saída da rota também liberam o painel. Sem progresso por três minutos após a última resposta relevante ou após o prazo estimado, o estado muda para carregamento sem atualização e libera as configurações. Uma fila com estimativa maior prolonga esse limite; respostas atuais renovam a atividade. Não se cancela a sessão nem se promete que a fila terminou. Esse fallback protege contra bloqueio permanente quando o cliente não informa estado terminal.

## Estimativa e limites

Os números estimatedTotalWaitTimeInSeconds e estimatedAllocationTimeInSeconds são lidos de respostas waittime existentes, mas só aplicados ao título e à origem regional correspondentes ao play. Sem esse contexto, a previsão permanece indisponível. Alocação explicitamente zerada prevalece sobre um total alto; um total contraditório menor que a alocação não substitui a alocação. Previsões candidatas com mais de um minuto são descartadas. Estado Provisioned ou negociação SDP/conexão remove a previsão de fila e impede que callbacks tardios a restaurem. A estimativa de alocação não inclui necessariamente todo o preparo. Valores ausentes/inválidos mostram **Estimativa indisponível**; a previsão ultrapassada é identificada sem contagem regressiva fictícia.

As leituras usam Response.clone, sem consumir a resposta original ou atrasar sua entrega esperando JSON. Callbacks pertencem à geração da tentativa; dados de uma sessão antiga não alteram a nova. Não são emitidas requisições novas. Somente titleId é extraído do corpo de play, por clone preparado antes de o fetch nativo consumir o Request; nenhum corpo ou token é incluído no diagnóstico. A captura original não é modificada.

O observador cobre fetch em domínios Xbox verificados. Se uma versão do cliente mudar transporte ou formato, pode faltar estimativa; não inferir números pelo tempo decorrido. Estimativas antecipadas nos cartões da biblioteca não fazem parte deste lote: faltam validar a correspondência de títulos e acesso real antes de propor consultas adicionais.

## Barra do Xbox e monitor

O teste do mantenedor mostrou ausência da barra nativa e o NX isolado no alto. Foram corrigidos riscos concretos, sem atribuir uma causa única à imagem: a classe de prioridade não força mais position: relative no contêiner nativo, e #StreamHud fica fora do bloqueio de entradas do Nimbo mesmo recolhido. O puxador GripHandle conhecido é detectado sem modificar seus eventos/estilos. Quando ele está visível e a barra recolhida, o NX independente fica oculto; abrir a barra permite a integração normal. Se a estrutura nativa não for reconhecida, o acesso de recuperação fica compacto no canto inferior. O botão NX duplicado do módulo HUD é oculto enquanto o host NX está montado; o fallback independente do módulo é preservado quando o host falta. Ainda é necessário testar a barra real no navegador/dispositivo do mantenedor.

O monitor é passivo para cliques durante o jogo, evitando bloquear o puxador Xbox ou ações de gameplay. Abrir o NX habilita o arraste; as coordenadas salvas são preservadas.

Estatísticas contém o botão Ativar/Ocultar estatísticas no início e uma seção Personalizar monitor recolhida. Interface mantém a aparência geral do NX; não há duas cópias dos ajustes do monitor.

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

363 testes Node: 360 PASS, zero FAIL, três TODO preexistentes. A cobertura adicional cobre geração/tentativas, espera antes do play, erro HTTP/abort, clone inválido, vídeo anterior, navegação, inatividade, bloqueio real do painel, detalhes opcionais, limpeza e gráficos. Sintaxe dos dois scripts e relatório estático executados. Ícones renderizados e inspecionados em SVG via librsvg/Cairo, sem adicionar dependências ao projeto.

Chromium/Playwright não iniciou neste ambiente. Não foi possível validar carregamento, fila ou a nova apresentação em uma conta Xbox real. Teste recomendado no dispositivo: ativar/desativar detalhes antes de lançar; iniciar Fortnite; conferir espera/estimativa ausente; tentar abrir NX por botão, teclado e controle; cancelar e repetir; ao receber vídeo, abrir NX e ajustar layouts/cores/escala/posição do monitor. Conferir ícones e nomes em retrato e paisagem. Simulação de RTC/DOM não valida serviço, mídia real nem disponibilidade de GTA VI.

## Retorno do mantenedor e áudio/voz — avaliação, sem reativação

O mantenedor observou previsão de 57 minutos e entrada em cerca de 30 segundos. Sem a resposta original não é possível provar se o serviço errou ou se a estimativa era de outro contexto; não se divide o valor por 60 nem se fabrica previsão usando essa única partida. PSBox GssvClient::titleWaitSeconds também trata estimatedTotalWaitTimeInSeconds como segundos. Better xCloud condiciona a previsão de fila a estimatedAllocationTimeInSeconds > 0. Esses padrões fundamentam as novas validações, sem prometer exatidão.

A área atual de áudio já contém equalizador de dez bandas (não dez perfis), presets Original/FPS/Corrida/Cinema/Música/Diálogos/Personalizado e processamento Web Audio. FPS nesse contexto é perfil para jogos de tiro, não aumento de quadros. A seleção de microfone aplica preferências às próximas solicitações getUserMedia; o teste de nível e seus filtros são locais e não comprovam envio ao chat. Não se ativou processamento nem se modificou roteamento de áudio neste refinamento.

Direção recomendada para outro lote: poucos presets claros, bypass original, ganho/limitação com teste auditivo e seleção de microfone/saída onde houver suporte. Estéreo já misturado não permite prometer reconstrução 3D ou separação de chat/jogo. O Discord Embedded App SDK hospeda apps dentro do Discord; não fornece, por si, o cliente de chamadas incorporado ao NX. Chamadas integradas exigem projeto próprio de integração, permissões e serviço, fora deste lote.

Referências: [PSBox gssv.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.cpp), [Better xCloud css.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/utils/css.ts), [seleção de dispositivos de áudio](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/selectAudioOutput), [getUserMedia/deviceId](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [Discord Embedded App SDK](https://support-dev.discord.com/hc/en-us/articles/21204423970071-Introducing-the-Embedded-App-SDK).
