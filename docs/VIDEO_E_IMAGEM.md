# Vídeo e imagem — 4.14.0

## Problema relatado e resultado do lote

O mantenedor relatou ausência de diferença ao ajustar imagem com WebGL2 ligado. O navegador não foi identificado. Não foi possível reproduzir sua sessão Xbox neste ambiente; portanto, não atribuir o relato a uma única causa como se estivesse comprovada no dispositivo.

Foram corrigidos caminhos concretos que mascaravam falhas: WebGL2 podia continuar marcado como solicitado após falhar na inicialização; falhas de desenho podiam ser silenciosas; a reaplicação de imagem manual consultava chaves antigas; a seleção de vídeo podia escolher uma prévia antes do gameplay. A normalização de valores CSS também passa a ser considerada para não acumular filtros nem perder sua restauração.

## Interface

- **Tela cheia** e **Capturar jogo** ficam acima da área rolável do painel, disponíveis em todas as páginas. Não é preciso procurar uma opção no fim de Imagem.
- **Vídeo e imagem** reúne qualidade solicitada, resolução do vídeo recebido, dispositivo, ajuste à tela, filtros e perfis locais. Streaming mantém servidor, conexão e rede.
- Perfis de qualidade: Máximo (1080p HQ) e Padrão (1080p). A opção Compatível repetia a mesma solicitação do Padrão e saiu da interface. A seleção de qualidade não zera mais um limite de bitrate escolhido separadamente.
- **Original / Sem cortes / Preencher:** segue o Xbox / mostra a imagem inteira com possíveis bordas / ocupa o quadro podendo cortar bordas. Os valores persistidos continuam `original`, `contain` e `cover`.
- **Processamento em uso** informa imagem original, filtros padrão ou WebGL2; **Estado da GPU** só informa renderização após o primeiro desenho bem-sucedido. Uma falha informa a causa e desativa o WebGL2, preservando o vídeo com filtros padrão.
- Um botão **Restaurar configurações** reúne a restauração de imagem e GPU: perfil neutro, brilho/contraste/saturação 100%, GPU desligada, nitidez original, intensidade padrão, curvas zeradas e enquadramento original. Não apaga a biblioteca de até 24 perfis, os controles nem a qualidade solicitada para a sessão.
- A opção de economia saiu da interface. Processamento em segundo plano agora pausa automaticamente. Trata-se da aba do navegador oculta, não da barra de ferramentas: suspender desenho e cópias de quadros pode economizar processamento/bateria sem alterar FPS ou bitrate do servidor.

O perfil Auto/Desktop/Celular continua sendo uma preferência de experiência da interface. Não é usado para trocar qualidade nem controles e não habilita resoluções por si só.

## Renderização e captura

- Vídeos com trilha de gameplay viva têm prioridade sobre prévias blob; fluxos apenas de áudio não são selecionados como vídeo. O adaptador não fabrica um vídeo quando só há áudio ou metadados ausentes.
- Filtros e enquadramento usam prioridade CSS explícita, preservando os valores/prioridades originais para restauração. O valor instalado é lido novamente pela CSSOM; reaplicar não empilha cadeias de filtros por diferenças de serialização decimal.
- Ajustes manuais são reaplicados ao vídeo persistente após mudanças do host, usando os valores atuais de brilho, contraste e saturação. Não dependem mais de chaves antigas de cor/nitidez.
- O WebGL2 confirma compilação/link e o primeiro desenho antes de esconder o vídeo original. Falhas de criação de contexto, shader, upload/desenho e perda de contexto retornam ao vídeo nativo com feedback. Uma falha desativa a preferência para evitar tentativas infinitas pelo polling.
- O canvas usa as dimensões decodificadas do vídeo, em vez de reduzir a imagem ao tamanho da janela ou limitá-la artificialmente a 1920×1080. Isso preserva um vídeo maior se ele já estiver sendo recebido; não solicita uma resolução maior ao serviço.
- O enquadramento e a posição do objeto são transferidos para a apresentação GPU. A troca de vídeo e a pausa restauram os estilos e liberam recursos pertencentes ao Nimbo.
- Captura sem GPU usa o filtro CSS exibido; com GPU, espera o próximo desenho e exporta o canvas processado. Não depende de manter o buffer gráfico entre quadros. Troca de processamento, blob ausente ou falta de quadro têm falha visível e liberação do estado de captura.
- Captura exporta o quadro do jogo em PNG; não captura o painel, o HUD de controle ou toda a tela do dispositivo. Proteções de conteúdo, CORS e restrições de download do navegador continuam aplicáveis.

## Referências e resolução acima de 1080p

Consultados:

1. [Better xCloud — VideoPlayer](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/player/video/video-player.ts), [BaseCanvasPlayer](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/player/base-canvas-player.ts), [WebGL2Player](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/player/webgl2/webgl2-player.ts) e [ação de captura](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/game-bar/screenshot-action.ts). Referências para filtros explícitos, ciclo de vida do renderizador, dimensões nativas e acesso rápido à captura.
2. [PSBox — stream_session.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/stream/stream_session.cpp), [gssv.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.cpp) e [stream_player.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/app/stream_player.cpp). Referências para distinguir resolução pedida, recebida e apresentação processada.

O PSBox envia `userRequestedResolutionUpdate` com `resolutionAlias` pelo canal `control`, incluindo o alias `1440`. Também anuncia dimensões compatíveis e trata a negociação do cliente/codecs. Comentários do projeto indicam dependência de disponibilidade do serviço/plano/mercado; não são prova de suporte universal.

O NimboXcloud retail ainda solicita qualidade por `settings.osName`. Não há neste lote adaptação verificada do canal de controle do SDK retail, do anúncio de dimensões e das capacidades de codec para essa sequência. **1440p não foi implementado nem anunciado como funcionando.** Alterar o tamanho do canvas ou criar um botão 1440p não resolveria essa negociação. O próximo experimento deve isolar esses pontos, medir `frameWidth/frameHeight` e preservar fallback antes de oferecer uma opção pública.

## Evidência

- **300 testes Node: 297 PASS, zero FAIL, três TODO.** Vinte e três testes novos exercitam o código real de ciclo GPU/CSS com DOM/GL controlados, seleção do vídeo, reset, captura, enquadramento e qualidade independente do bitrate. Os mocks não comprovam renderização no navegador.
- Teste gráfico real adicional com Mesa/EGL 1.5 e contexto OpenGL ES3 sem janela, usando os shaders do userscript: brilho, contraste, saturação, Unsharp, CAS, intensidade zero, sombras e realces passaram. Exemplo medido: RGB `[80,100,120]` virou `[92,115,138]` com brilho 115%.
- Comando opcional: `MESA_SHADER_CACHE_DISABLE=true python tools/check-visual-shader.py`. Usa somente a biblioteca padrão Python e libEGL/Mesa do sistema; não adiciona dependência ao userscript. Não comprova upload de um elemento de vídeo no navegador nem composição DOM.
- Chromium/Playwright foi tentado e falhou ao iniciar Crashpad: `setsockopt: Operation not permitted`. Não foi possível verificar composição visual em navegador real, CORS/DRM, download no celular, desempenho ou o problema específico no DeX. Não considerar os três TODO homologados por esse teste EGL.

## Aceite no dispositivo

1. Atualizar para 4.14.0 e recarregar. Abrir uma partida e conferir a resolução recebida em Vídeo e imagem.
2. Sem GPU, mudar brilho para 115%, depois 85%, e saturação para 75%. Conferir diferença e restauração para Original.
3. Ativar WebGL2. Conferir se Estado da GPU diz **Renderizando em…**, aguarda quadro ou informa erro. Repetir os ajustes. Se continuar sem diferença, registrar o texto do estado e o navegador; não presumir sucesso apenas pelo seletor ligado.
4. Testar Unsharp/CAS a 0% e 100%, sombras e realces em cenas apropriadas. Os controles não recuperam detalhes inexistentes na transmissão.
5. Comparar Sem cortes/Preencher em uma janela com proporção diferente da do jogo, com e sem GPU.
6. Usar Capturar jogo no topo e conferir os efeitos no PNG. Testar Tela cheia e retorno; confirmar que as ações continuam acessíveis.
7. Salvar um perfil local, restaurar configurações e verificar que o perfil e a qualidade solicitada permanecem. Ocultar/retomar a aba e conferir retomada dos efeitos sem tela preta.
