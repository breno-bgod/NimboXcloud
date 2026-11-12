# Entrada física e Desktop — 4.12.93 / Touch HUD 1.2.7

## Relato que motivou o lote

O mantenedor testou Fortnite em Samsung DeX com teclado e mouse físicos. Relatou entrada em SOUTHINDIA pela nova lista, mas encontrou exigência de controle e não conseguiu usar teclado/mouse. Identificou que a aba de teclado e mouse oferecia apenas ativação do HUD virtual.

Esse relato comprova o teste realizado pelo mantenedor, não a localização física do servidor. O rótulo DeX era uma heurística de Android + ponteiro fino + largura; não alterava User-Agent ou os controles e não foi identificado como causa comprovada do bloqueio de entrada.

## O que mudou

- O monitor usa **Bitrate**, eliminando a abreviação BR que podia ser confundida com região. SOUTHINDIA e CENTRALINDIA recebem bandeira da Índia. Métricas e fórmulas de bitrate não foram alteradas.
- Experiência mobile com ponteiro fino passa a ser classificada como Desktop, inclusive em janela pequena. Não se tenta identificar Samsung DeX. A preferência legada `dex` é lida como Desktop sem apagar configurações.
- O perfil de interface continua separado da entrada física e não falsifica User-Agent.
- NX → Teclado e mouse oferece **Usar teclado e mouse físicos**, além do botão claramente identificado **Ativar HUD de teclado e mouse por toque**.
- NX → Gamepad oferece **Usar controle físico**, habilitado somente quando o navegador reconhece um controle conectado.
- **Restaurar Automático** desfaz alterações de propriedade do adaptador em tempo real. Se a escolha foi aplicada à configuração recebida no início, reiniciar a partida permite receber novamente a configuração nativa.
- O modo físico é persistido em `nx.input.physicalMode.v1`: `native` (padrão), `keyboard-mouse` ou `gamepad`.

## Caminho de implementação

1. Uma escolha física explícita pode ajustar `enableKeyboardInput` e `enableMouseInput` em schemas conhecidos da resposta cloud `configuration`. `clientStreamingConfigOverrides` mantém seu formato string/objeto; também é aceito um objeto direto `inputConfiguration`. Formatos desconhecidos e JSON inválido passam sem alteração.
2. O adaptador já existente pode aplicar a escolha à sessão conectada por `updateInputConfigurationAsync`. Somente flags já conhecidas são usadas; não há eventos físicos sintéticos nem segundo encaminhador de teclas/mouse.
3. Ao trocar o modo físico, a HUD virtual é pausada e suas entradas soltas. Os estados de restauração da HUD e do modo físico são separados.
4. Nova sessão recebe a preferência explícita por sua própria fila. Sessão antiga não recebe comandos da ativação manual depois de substituída.
5. A restauração modifica apenas campos que ainda correspondem aos valores aplicados por esse adaptador, respeitando mudanças feitas pelo próprio Xbox. Erro parcial tenta retornar ao estado nativo salvo.
6. A escolha de controle físico solicita teclado/mouse desabilitados, sem inventar `enableGamepadInput`, inserir gamepad virtual ou substituir a Gamepad API.
7. `enableTouchInput` e `maxTouchPoints` não são alterados pelo seletor físico. O transporte xHome não é alvo desse seletor.
8. Pointer Lock e F9 permanecem sob controle do cliente/navegador; não há override de `requestPointerLock`.

A UI distingue preferência salva, solicitação aceita e flags habilitadas no cliente. Nenhum desses estados é tratado como prova de comandos entregues ao jogo.

## Como testar no DeX / Fortnite

1. Atualize/reinstale o userscript principal 4.12.93, garantindo o novo `@require` do módulo 1.2.7, e recarregue o site. Não instale uma segunda cópia do HUD.
2. Com teclado e mouse conectados, abra NX → Teclado e mouse → **Usar teclado e mouse físicos**.
3. Feche o painel e clique no vídeo. Verifique se o cliente captura o mouse e se as teclas e movimentos chegam ao Fortnite.
4. Se o cliente continuar pedindo controle, encerre e reabra a partida após salvar a preferência. A alteração da configuração inicial exige uma nova sessão.
5. Se necessário, compare manualmente o perfil de streaming Equilibrado (Windows) com Máximo (HQ/Tizen), reiniciando a partida entre testes. Não foi comprovado que Tizen seja a causa; o lote não reduz a qualidade automaticamente.
6. Use **Restaurar Automático** e reinicie a partida para comparar o comportamento original.
7. Em teste separado, conecte um gamepad, confirme a contagem no NX e use **Usar controle físico**.
8. Reative o HUD por toque em teste separado e confirme WASD, mouse pelo dedo, liberação dos botões e funcionamento do toque nativo.

Registrar navegador e versão, preferência física, qualidade solicitada, estado mostrado no NX, captura de mouse e resultado observado no jogo. Não compartilhar tokens, cookies ou corpos de autenticação.

## Verificação e limites

- Node 24.22.1, `node --test --test-isolation=none tests/*.test.cjs tests/*.test.mjs`: **242 testes, 239 PASS, zero FAIL, três TODO**.
- Dezenove novos testes cobrem flags físicas, controle sem emulação, restauração, sobreposição de propriedade HUD/física, erro parcial, fila de descarte, schemas conhecidos/desconhecidos, escolha sem controle, Desktop por capacidades e armazenamento.
- Sintaxe dos dois scripts e relatório estático verificados. O relatório continua identificando os hooks já existentes.
- Chromium foi tentado via Playwright e encerrou durante a inicialização no ambiente restrito. Não houve teste visual nem sessão autenticada de Fortnite.
- A função do SDK foi verificada por mocks do contrato existente; os listeners físicos do cliente Xbox e sua aceitação de comandos ainda precisam ser validados no DeX.
- Suporte nativo a teclado/mouse continua sendo requisito do jogo. Não há conversão genérica de mouse para analógico nem novo joystick virtual retail neste lote.
- RTT de 391 ms relatado para a Índia é uma questão de latência; não demonstra a causa do bloqueio de entrada. Uma amostra de bitrate de 0,4 Mbps não mede sozinha a capacidade máxima do link.

## Pesquisa técnica

Foram conferidos os campos de configuração usados no cliente de referência e o ciclo de captura/liberação do player web, comparando com o contrato já presente no adaptador Nimbo. A implementação é própria; nenhum cliente completo ou dependência nova foi incorporado.

Registros técnicos de origem:
- https://github.com/redphx/better-xcloud/blob/typescript/src/utils/xcloud-interceptor.ts — configuração de mouse/teclado; `feature-gates.ts` foi consultado, mas gates antigos não foram copiados sem evidência do cliente atual.
- https://github.com/unknownskl/greenlight/blob/main-v2/packages/player/src/client/lib/input/mousekeyboard.ts — ciclo de listeners e Pointer Lock; não foi adicionado encaminhador concorrente.

