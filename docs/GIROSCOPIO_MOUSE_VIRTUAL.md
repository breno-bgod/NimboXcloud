# Giroscópio na mira do mouse virtual

Preparado para Nimbo 4.15.3 / módulo 1.4.1. Opt-in; desligado ao carregar a página.

1. Em **Entradas**, selecione **Teclado e mouse virtuais**.
2. Expanda **Ajustes de teclado e mouse**.
3. Em **Mira por giroscópio · mouse virtual**, toque em **Ativar giroscópio da mira**.
4. Conceda permissão do sensor se o navegador solicitar e feche o painel.
5. Movimente o aparelho; escolha Suave, Normal ou Forte para a contribuição.
   Para parar, volte ao mesmo botão e escolha **Desativar giroscópio da mira**.

Não exige controle físico ou recarga. Não ativa leitura sozinho após reinstalar
ou recarregar. Se a API não estiver disponível ou a permissão for negada, informa
o resultado sem fingir ativação. O jogo e a sessão precisam aceitar mouse.

Movimentos relativos seguem o mesmo move/canal do touchpad virtual, respeitando
seus ajustes gerais. A primeira amostra define referência; aparelho parado não
gera deslocamento contínuo. Pausa com painel/menu/editor, sessão inativa, perda
de foco, página oculta, outro modo de entrada ou xHome. Rotação, retorno de pausa,
amostras antigas ou saltos bruscos reiniciam referência, evitando acumulado.
Não altera teclas, botões do mouse nem o giroscópio do controle físico.

Foi escolhida a ativação nas configurações, uma das alternativas pedidas pelo
mantenedor. Não há novo botão posicionado no HUD nesta revisão. Os controles
existentes e seus layouts continuam nos mesmos lugares.

Validação: oito regressões locais para ativação/permissão, deltas, orientação,
pausa, dados antigos, transporte e preservação de botões. Suite completa: 393
testes, 390 aprovados, zero falhas, três TODO preexistentes. Sintaxe dos dois
scripts e relatório estático executados. Chromium foi tentado e encerrou antes
da navegação (TargetClosedError); sem captura visual ou leitura real de sensor.
Não há medição de latência, precisão da mira ou gameplay validado no aparelho.

Reteste no celular: ativar, fechar painel e mover lentamente; verificar que
parar o aparelho para a mira, abrir NX não movimenta o jogo, girar ou alternar
aplicativos não provoca salto, botões do HUD continuam funcionando e desligar
interrompe somente essa contribuição. Em desktop sem sensor não deve ativar.
