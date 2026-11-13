# Teste — giroscópio e touchpad complementares

Branch do PR #27, preparada como 4.15.4 sobre a Central de Entradas oficial
4.15.3 do PR #29. Módulo oficial 1.4.1 preservado. Não é atualização de PSBox.

## Ativar

1. Atualize o Nimbo existente pelo link de teste do PR #27 e recarregue a página.
2. Em **NX → Entradas**, o grupo **Giroscópio e touchpad complementares** aparece
   em todas as famílias (Teclado e mouse, Controle e Mobile).
3. Com o celular na horizontal, escolha **Ativar FPS · mira direita** ou
   **Ativar Corrida · volante** e conceda permissão se o navegador solicitar.
4. Feche o painel. A primeira amostra válida define a referência. Para recalibrar,
   use **Recentrar sensor / volante**, feche o painel e segure na posição de jogo.
5. Escolha intensidade e inversão de eixos se necessário. **Desligar giroscópio**
   remove somente essa contribuição, sem trocar a entrada escolhida.

Perfis começam desligados a cada carregamento. Retrato, ângulo indisponível,
menu, background, perda de foco, edição do HUD e amostra antiga não aplicam giro.
Paisagens 90° e 270° usam a base da tela com quaternions DeviceOrientation
(Z-X'-Y''); não assumem os eixos de retrato. Não usa a leitura do gamepad físico.

FPS usa velocidade angular para somar no analógico direito: aparelho parado não
mantém a câmera girando. Corrida usa rotação de volante relativa ao centro e
contribui apenas no eixo horizontal do analógico esquerdo, mantendo a posição
enquanto inclinado. Soma limitada a [-1,1]; botões e demais eixos preservados.

## Touchpad dos controles

Use **Ativar touchpad do controle**, no mesmo grupo. No modo **Controle físico**,
a área do jogo inteira recebe o arraste de um dedo. No modo **Controle virtual**,
aparece a área **Touchpad de mira** no topo. Soltar/cancelar zera a contribuição;
sem movimento recente, ela expira em 90 ms. Menus, links, botões e HUD não são
alvos do touchpad físico. Múltiplos ponteiros não tomam a posse do gesto ativo.

Esse touchpad soma ao analógico direito. Não implementa o protocolo específico
do touchpad PlayStation nem promete ações exclusivas de PS4/PS5 em jogos Xbox.
O touchpad de teclado/mouse virtual original continua enviando mouse como antes.
Velocidade e sensibilidade compartilhadas ficam acessíveis em todas as famílias.
A nova área virtual tem posição fixa nesta primeira revisão; layouts anteriores
do HUD permanecem preservados.

## Transporte e limites

A composição ocorre depois do roteamento de entradas. Sem gamepad disponível,
usa controle complementar da ponte Gamepad existente, sem inventar mensagens de
rede. A entrada selecionada não muda. Preserva dispositivos não mapeados e não
sobrescreve quatro slots ocupados. Ponte substituída por outro script impede
ativação e informa erro. Nenhuma nova autenticação, offering ou entitlement.

Mouse/teclado ou toque combinados com analógico dependem de como o jogo e o
cliente aceitam entradas mistas. O modelo local não comprova recebimento pelo
serviço. xHome não está coberto nesta revisão. Fullscreen exclusivo de VIDEO
mantém a limitação do navegador para sobreposições DOM.

## Validação

401 testes locais: 398 PASS, zero FAIL, três TODO preexistentes. Treze regressões
novas cobrem ambas paisagens, retrato, perfil FPS/Corrida, soma, repouso, pausa,
permissão, touchpad/TTL/cancelamento, sensibilidade, slots, ponte estrangeira e
roteamento local nos modos. Composição de UI mantém o grupo comum e recursos do
PR #29. Sintaxe e relatório estático executados. Chromium tentado: falhou ao
iniciar com Crashpad setsockopt Operation not permitted/SIGTRAP; sem screenshot.

Não houve sensor real, teste de orientação física, streaming, precisão, latência
ou gameplay. O CI deve aprovar este head antes de distribuir o link como pronto
para teste. Diagnóstico inclui phoneInput (perfil, paisagem e amostra recente),
sem coordenadas brutas e sem afirmar reconhecimento pelo servidor.

Roteiro no celular: testar FPS com o celular nas duas paisagens; verificar que
parar o aparelho para a câmera; mover também o analógico físico/virtual; alternar
para Corrida e conferir apenas direção; abrir menu/girar/alternar aplicativo;
desligar sem perder a entrada original. Testar touchpad com botões simultâneos,
soltura/cancelamento e os ajustes compartilhados. Registrar modo/jogo e resultado,
sem tokens, HAR ou arquivos de sessão.
