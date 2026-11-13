# Entradas: captura física, HUD e atalhos

## Comportamento proposto

- Entradas mantém os cinco modos. Para mouse USB/Bluetooth, selecione **Teclado e mouse físicos**, inicie uma sessão compatível e use **Capturar mouse** ou **F8**. **F2** e **Sem atalho** são alternativas. **Esc** e abrir o painel liberam a captura. Não há recaptura automática.
- A captura usa a API nativa no vídeo ativo. Não desbloqueia suporte a teclado/mouse em jogos incompatíveis. F9 permanece com o Xbox. Uma tecla já presente na combinação do painel é reservada ao painel.
- Teclado e mouse virtuais usam touchpad e teclas na tela, sem Pointer Lock. **Controles na tela e editor de HUD** distingue esse editor do editor de analógicos/botões do controle virtual. Os layouts existentes não são migrados nem apagados.
- Os atalhos configuráveis de teclado e controle abrem o painel; não remapeiam comandos do jogo. Sem combinação personalizada, aparece o atalho padrão de teclado.
- Sistema não repete tela cheia/orientação e não exibe os seletores experimentais de identidade. Preferências históricas desses experimentos permanecem armazenadas, sem aplicação dos experimentos suspensos.

## Fortnite e referências

A opção antiga lia uma preferência e exibia um estado, mas não aplicava alteração de configuração. Foi substituída por orientação e botão para Entradas, sem criar outra preferência ou trocar a entrada sem escolha do jogador.

Consultados:

- [Better xCloud: xcloud-interceptor.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/utils/xcloud-interceptor.ts): sinalização explícita de teclado/mouse e toque. Não oferece evidência de que desativar toque garanta outra interface no cliente atual.
- [Better xCloud: mkb-handler.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/mkb/mkb-handler.ts): captura por gesto e tratamento da API nativa, sem substituição do protótipo. Seu emulador de gamepad difere do nosso caminho de mouse nativo.
- [Better xCloud #318](https://github.com/redphx/better-xcloud/issues/318): o mantenedor explica que a experiência de console não contém os controles nativos de toque. Não se deve prometer combinar ambos automaticamente.
- [Greenlight: mousekeyboard.ts](https://github.com/unknownskl/greenlight/blob/main-v2/packages/player/src/client/lib/input/mousekeyboard.ts): usa Pointer Lock no elemento de vídeo. O cliente desktop possui sua própria integração; isso não transfere autorização ou recursos nativos para o navegador.

## Verificação

Testes comportamentais cobrem captura explícita, seleção física efetivamente aplicada, sessão ausente, outras entradas, conflitos, formulários, modificadores, F9/Esc, liberação, API indisponível e promessa rejeitada. Total local: 314 testes, 311 PASS, zero FAIL, três TODO preexistentes.

Pendente em navegador e sessão Xbox reais: Fortnite compatível com teclado/mouse, F8/F2 e botão após Esc, liberação ao abrir o painel, navegação em campos editáveis e preservação dos dois editores de HUD. Testes Node não validam movimento da câmera nem recepção no servidor. Não há evidência nova de gameplay ou suporte a GTA VI.
