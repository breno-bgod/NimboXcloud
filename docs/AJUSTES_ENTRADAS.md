# Entradas: captura física, HUD e atalhos

## Comportamento proposto

- Entradas mantém os cinco modos. Para mouse USB/Bluetooth, selecione **Teclado e mouse físicos**, inicie uma sessão compatível e use **Capturar mouse** ou **F8**. **F2** e **Sem atalho** são alternativas. **Esc** e abrir o painel liberam a captura. Não há recaptura automática.
- A captura usa a API nativa no vídeo ativo. Não desbloqueia suporte a teclado/mouse em jogos incompatíveis. F9 permanece com o Xbox. Uma tecla já presente na combinação do painel é reservada ao painel.
- Teclado e mouse virtuais usam touchpad e teclas na tela, sem Pointer Lock. **Controles na tela e editor de HUD** distingue esse editor do editor de analógicos/botões do controle virtual. Os layouts existentes não são migrados nem apagados.
- Os atalhos configuráveis de teclado e controle abrem o painel; não remapeiam comandos do jogo. Sem combinação personalizada, aparece o atalho padrão de teclado.
- Sistema não repete tela cheia/orientação e não exibe os seletores experimentais de identidade. Preferências históricas desses experimentos permanecem armazenadas, sem aplicação dos experimentos suspensos.

## Fortnite e referências

A preferência atual do Nimbo lê um valor e exibe um estado, mas ainda não aplica a integração. O recurso de referência é real: no Better xCloud, forceFortniteConsole injeta a condição da rota /launch/fortnite/ em sendTouchInputEnabledMessage(e), forçando e = false. A configuração descreve a finalidade como disponibilizar Salve o Mundo no mobile. Não se trata de uma simples seleção de controle. A proposta de substituir a opção foi retirada deste PR; sua implementação no Nimbo exige análise do cliente Xbox atual e teste autenticado. Isso não demonstra acesso a outros títulos ou mudança de autorização do serviço.

Consultados:

- [Better xCloud: forceFortniteConsole, linhas 335–345](https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/modules/patcher/patcher.ts#L335): patch real da mensagem de toque, condicionado à rota do Fortnite. [Configuração e finalidade](https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/utils/settings-storages/global-settings-storage.ts).

- [Better xCloud: xcloud-interceptor.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/utils/xcloud-interceptor.ts): sinalização explícita de teclado/mouse e toque. Não oferece evidência de que desativar toque garanta outra interface no cliente atual.
- [Better xCloud: mkb-handler.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/mkb/mkb-handler.ts): captura por gesto e tratamento da API nativa, sem substituição do protótipo. Seu emulador de gamepad difere do nosso caminho de mouse nativo.
- [Better xCloud #318](https://github.com/redphx/better-xcloud/issues/318): o mantenedor explica que a experiência de console não contém os controles nativos de toque. Não se deve prometer combinar ambos automaticamente.
- [Greenlight: mousekeyboard.ts](https://github.com/unknownskl/greenlight/blob/main-v2/packages/player/src/client/lib/input/mousekeyboard.ts): usa Pointer Lock no elemento de vídeo. O cliente desktop possui sua própria integração; isso não transfere autorização ou recursos nativos para o navegador.

## Verificação

Testes comportamentais cobrem captura explícita, seleção física efetivamente aplicada, sessão ausente, outras entradas, conflitos, formulários, modificadores, F9/Esc, liberação, API indisponível e promessa rejeitada. Total local: 329 testes, 326 PASS, zero FAIL, três TODO preexistentes.

Pendente em navegador e sessão Xbox reais: Fortnite compatível com teclado/mouse, F8/F2 e botão após Esc, liberação ao abrir o painel, navegação em campos editáveis e preservação dos dois editores de HUD. Testes Node não validam movimento da câmera nem recepção no servidor. Não há evidência nova de gameplay ou suporte a GTA VI.

## Regressão relatada: ponteiro capturado sem movimento no jogo

O mantenedor observou F8 escondendo o cursor local e exibindo o cursor da sessão, sem movimento remoto. A versão anterior só solicitava Pointer Lock; dependia de listeners nativos do cliente e não enviava eventos físicos pelo adaptador do Nimbo. A correção conecta mousemove, botões, roda e KeyboardEvent confiável ao NimboXboxTransport: onVirtualMouseInput para leituras relativas e inputManager.getKeyboardReading/inputChannel.sendKeyboardInput para teclado, com o flush já existente. Não há novo payload de rede.

O encaminhamento vale somente enquanto o vídeo capturado pelo Nimbo possui o lock, a sessão está conectada e o modo físico está selecionado. HUD Remote Play ativo, campos editáveis, painel e documentos ocultos não enviam comandos. Eventos de ponteiro compatíveis não seguem também ao SDK; a cópia mousemove é encaminhada uma vez. Esc, desbloqueio e perda de foco liberam teclas/botões. Erro do transporte encerra a captura com mensagem visível. O módulo é fixado por commit no @require para a versão de teste carregar a mesma implementação.

Referências adicionais: [Better xCloud native-mkb-handler](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/mkb/native-mkb-handler.ts), com movimento relativo explicitamente colocado no canal, e [PSBox kbm_sdl.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/input/kbm_sdl.cpp), que captura eventos SDL, filtra movimentos enquanto capturado e distingue touchpad de controle. A integração SDL do cliente nativo não existe no navegador; aqui usamos eventos DOM confiáveis e o adaptador Xbox já presente.

Os oito testes de integração novos percorrem evento → transporte → métodos do SDK simulado; um teste adicional impede captura silenciosa com módulo antigo. A suíte dos cinco modos também verifica Gamepad API física/virtual, leituras do touchpad/teclado virtual, seleção de toque nativo, neutralização e troca de sessão. Isso não certifica recepção dos comandos pelo servidor nem funcionamento de cada modo em hardware real.

Teste recomendado: instalar novamente o script da branch de teste para atualizar também @require; abrir Fortnite ou outro jogo com suporte nativo a teclado/mouse; selecionar a entrada física, capturar e testar mira, cliques, roda, WASD, Esc, retorno e mudança para cada entrada disponível. Não foi possível iniciar Chromium neste ambiente; permanece necessária validação no navegador real.

## Retorno do editor e direção da Central de Controles

O mantenedor relatou sucesso nos testes da correção de entradas em 2026-11-13. O relato não identifica navegador nem certifica todos os jogos. Depois apontou que salvar a HUD abria o painel amarelo antigo. O editor agora retorna explicitamente ao NX → Entradas ao salvar ou cancelar. Trocas internas de modo continuam encerrando o editor sem abrir painel; o módulo usado independentemente mantém o fallback legado. Os layouts e suas rotinas de persistência não mudaram.

Foram adicionados seis testes: retorno ao host, fallback independente, salvar/cancelar, fechamento interno sem navegação e seleção explícita de Entradas. A validação visual desta nova correção permanece pendente no dispositivo do mantenedor.

Direção proposta: Central de Controles com identidade visual própria. Dispositivos/perfis à esquerda, HUD ou representação do dispositivo no centro e ação do elemento selecionado à direita; no mobile, áreas acessíveis em etapas. Uma ação simples funciona sem configurar macros. Evoluir depois para modificadores, combinações e sequências, com liberação de comandos em troca de perfil, perda de foco ou sessão encerrada. Isso é proposta incremental, não recurso implementado neste lote.

Referências: [reWASD Workspace](https://help.rewasd.com/interface/workspace.html), [Key Combo](https://help.rewasd.com/mapping-features/key-combo.html) e [Virtual Controller](https://help.rewasd.com/basic-functions/virtual-controller.html). A inspiração é a organização por dispositivos, perfis e ações; o Nimbo mantém implementação e identidade próprias. No navegador, as saídas são os canais autorizados do jogo e a ponte Gamepad do Nimbo; não se cria um dispositivo virtual do sistema operacional como no aplicativo nativo.
## Central de Entradas verde em revisão

O NX organiza a escolha de entrada em Teclado e mouse, Controle e Mobile. A navegação muda os ajustes visíveis. Selecionar um modo continua passando pelo gerenciador existente, com liberação de comandos e recuperação em falhas.

O desktop apresenta uma área ampliada com representação ilustrativa do dispositivo. Mobile reúne teclado/mouse por toque, controle virtual e toque nativo, além dos dois editores de HUD. Velocidade e sensibilidade horizontal/vertical reutilizam a preferência de movimento do touchpad. A gravação acontece antes de atualizar os valores em memória.

O tema grafite/verde acompanha o NX e o editor. No celular em orientação vertical, as propriedades ocupam uma gaveta inferior recolhível. Salvar e cancelar permanecem visíveis na barra inferior.

Validação local com 388 testes, 385 aprovados, zero falhas e três TODO preexistentes, sintaxe e relatório estático. Edge headless validou navegação desktop/mobile, sensibilidade persistida e salvar/retornar ao NX em uma página local simulada. Partida autenticada, hardware físico e conforto de uso no aparelho continuam pendentes.
