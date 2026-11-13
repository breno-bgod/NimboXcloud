# Entradas e organização do painel — 4.13.0

## Decisão de produto

Escolher como jogar em uma única página, **NX → Entradas**. Detectar mouse, controle ou experiência Desktop não substitui a escolha manual. Há cinco modos explícitos e uma opção de recuperação, **Automático do Xbox**.

| Modo | Teclado nativo | Mouse nativo/SDK | Gamepad entregue ao SDK | Toque nativo |
| --- | --- | --- | --- | --- |
| Teclado/mouse físicos | Ligado | Ligado | Oculto | Desligado quando o campo existe |
| Controle físico | Desligado | Desligado | Físico | Desligado quando o campo existe |
| Teclado/mouse virtuais | Desligado; tradução direta do HUD | Canal relativo do HUD | Oculto | Desligado quando o campo existe |
| Controle virtual | Desligado | Desligado | Estado do HUD Nimbo | Desligado quando o campo existe |
| Toque nativo | Desligado | Desligado | Oculto | Ligado somente se disponibilizado pela sessão |

O modo Automático restaura os campos do SDK pertencentes ao Nimbo e volta a entregar os gamepads nativos. Perfis de analógico/giroscópio já ativados permanecem uma preferência separada; não são ativados por esta atualização.

## Implementação e raciocínio

- `NimboInputCoordinator`, no módulo Touch: serializa inspeção, liberação, configuração, roteamento e ativação. Falhas tentam recuperar a entrada anterior. Uma sessão substituída invalida a transação antiga.
- `NimboXboxTransport`: modifica somente campos booleanos conhecidos de `inputConfiguration`. Guarda seus valores anteriores e restaura somente campos que ainda pertencem à alteração Nimbo. Não inventa `enableGamepadInput` nem suporte a toque.
- `NimboInputHost`, no script principal: compartilha a ponte existente de Gamepad API com processamento de eixos; nenhum segundo wrapper concorrente. Instala passagem transparente no início, pois o SDK pode guardar a função antes da primeira escolha. Em Automático, sem processamento, devolve o próprio resultado nativo intacto. Modos explícitos filtram os dispositivos ou expõem um gamepad virtual padrão, índice 0.
- O estado físico é consultado pela função original; um controle virtual nunca satisfaz a exigência de controle físico conectado. A navegação do painel também usa essa leitura original.
- Eventos de entradas concorrentes são filtrados em superfícies reconhecidas de gameplay/Pointer Lock. Campos de texto, painel NX, HUD Nimbo e diálogos são preservados. Escape, F9 e o atalho de recuperação continuam disponíveis. Não há substituição de `requestPointerLock`.
- O joystick virtual e suas geometrias foram reaproveitados, com saída para xCloud pelo host e para xHome pelo adaptador existente. O editor mostra os controles correspondentes ao modo. Não foi necessário reescrever a interface de toque nem depender de uma conexão Remote Play.
- Ao trocar: soltar teclas traduzidas pelo SDK e botões do mouse, neutralizar o joystick, interromper repetição/compensação do HUD, cancelar uma edição ainda aberta sem salvar um rascunho parcial e configurar o novo modo. Abrir menus ou ocultar a página pausa o HUD e libera seu estado.

A preferência nova é `nx.input.mode.v1`. A preferência física anterior é lida como fallback e migrada ao selecionar/aplicar o modo. Não são apagados layouts, perfis ou atalhos. A configuração recebida no início continua nativa quando a preferência unificada já existe; a aplicação acontece na sessão capturada.

> Atualização 4.13.2: a navegação foi consolidada. Controle físico e teclado/mouse agora são seções de Entradas; aparência do monitor fica em Interface. Consulte [organização atual](./PAINEL_ORGANIZADO.md). As seções abaixo descrevem a entrega original 4.13.0.

## Organização do painel

- Categorias com nome visível, página atual e botão de fechar acessíveis.
- Busca sem distinção de acentos: exemplos `hud`, `controle virtual`, `zona morta`, `fps`, `microfone`, `servidor`.
- Início com os destinos expostos por padrão, em vez de exigir abrir cada grupo.
- **Entradas:** ativação dos cinco modos, estado, editor real e acesso aos ajustes.
- **Gamepad / Teclado e mouse:** ajustes específicos e atalhos; ativação encaminhada ao mesmo gerenciador.
- **Sistema → Prévia técnica de HUD:** antigo editor demonstrativo, identificado como prévia que não controla o jogo. Não confundir com o editor do módulo em Entradas.
- Streaming, Estatísticas, Vídeo, Imagens, Áudio e Voz preservam seus destinos e preferências. A aparência do painel continua separada da aparência do monitor de estatísticas.

## Referências consultadas

1. [Better xCloud — virtualização de controle](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/mkb/mkb-handler.ts): Gamepad API, identidade virtual, estado neutro, conexão/desconexão. [Interceptação de configuração](https://github.com/redphx/better-xcloud/blob/typescript/src/utils/xcloud-interceptor.ts): campos de teclado, mouse e toque. Padrão aproveitado: um controle virtual precisa de saída e ciclo de vida, não apenas desenho na tela.
2. [Greenlight — entrada de teclado/mouse](https://github.com/unknownskl/greenlight/blob/main/packages/player/src/client/lib/input/mousekeyboard.ts): separação de interface e transporte, ativação/desativação de fontes. Diferença: cliente próprio controla os canais; um userscript precisa respeitar a sessão e os menus do Xbox.

Nenhuma dependência foi adicionada. Não foram copiados subsistemas desses clientes nem removidos avisos legais.

## Evidência e limites

- Sintaxe dos dois scripts verificada com Node.
- Suíte local: **267 testes, 264 PASS, zero FAIL, três TODO**. Inclui 22 testes novos de transição, recuperação, troca de sessão, teclado solto, joystick virtual e busca. Os testes de integração usam o código real em VM com SDK/DOM controlados, sem autenticação Xbox.
- Chromium/Playwright foi tentado. Falhou na inicialização: `setsockopt: Operation not permitted`, em Crashpad. Não houve validação visual nem medição real de desempenho.
- **Não foi possível verificar gameplay, multitouch real, DeX, Pointer Lock real ou a exclusividade em todas as versões do cliente Xbox.** Eventos fora das superfícies reconhecidas e referências ao navegador capturadas antes do userscript podem escapar do filtro. O painel não deve anunciar homologação de compatibilidade universal.
- Se o SDK não informar suporte a toque, o modo nativo é recusado sem interromper a entrada anterior. Não cria layouts nativos em jogos sem esse recurso.
- A atualização não altera disponibilidade do catálogo, licença dos jogos, autenticação, servidores nem a conexão xHome. O objetivo futuro de testar GTA VI permanece no projeto; esta mudança de controles não comprova que o título será disponibilizado pelo serviço. Não anunciar acesso antes de um teste real após disponibilidade.

## Roteiro de aceite no dispositivo

1. Atualizar/reinstalar o userscript principal 4.13.0 e recarregar `play.xbox.com`; conferir módulo Touch 1.3.0 no diagnóstico.
2. Abrir Fortnite no navegador usado no DeX. Em **NX → Entradas**, escolher teclado/mouse físicos, fechar o painel e clicar no vídeo para permitir a captura nativa. Testar movimento, mira e cliques.
3. Escolher controle virtual. Testar os dois analógicos, A/B/X/Y, gatilhos e D-pad sem controle físico. Com um controle conectado, confirmar que ele não movimenta o personagem nesse modo.
4. Segurar um botão do HUD, abrir o painel e trocar de modo. Confirmar que a ação não permanece pressionada. Repetir com mouse/tecla e com mudança de foco/orientação.
5. Editar a HUD do controle virtual, salvar, recarregar e conferir as posições. Trocar para teclado/mouse virtuais e conferir que o editor apresenta os controles corretos.
6. Em um jogo com suporte oficial, disponibilizar o toque nativo e selecionar esse modo. Testar gesto simultâneo e ausência do HUD Nimbo. Em um título sem suporte, verificar aviso e preservação do modo anterior.
7. Conectar/desconectar controle físico e alternar entre os cinco modos e Automático. Confirmar busca, nomes das categorias, fechar/voltar e atalho de recuperação com toque, mouse, teclado e controle.

Se uma troca não responder no jogo, voltar ao Automático e reiniciar a partida antes de repetir. Registrar navegador/versão, jogo, modo anterior/novo e resultado; sem tokens ou identificadores de conta.
