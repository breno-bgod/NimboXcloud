# NimboXcloud Virtual Gamepad — teste 0.1.0

## Objetivo

Módulo experimental independente que apresenta um controle virtual Xbox padrão por meio da Gamepad API do navegador. Não depende do NimboTouch, do touchpad, de teclado/mouse virtual, do xHome ou do sistema de toque nativo do Xbox Cloud Gaming.

## Instalação no Tampermonkey

1. Abra o arquivo `modules/NimboXcloud-Virtual-Gamepad.user.js` na branch `feature/virtual-gamepad-v0.1`.
2. Use o botão **Raw** para abrir o userscript e escolha instalar no Tampermonkey.
3. Confirme que o script está habilitado.
4. Abra `https://play.xbox.com/` e inicie um jogo.
5. Toque em **NX · CONTROLE**, abra o painel e pressione **Ativar controle**.
6. No jogo, teste primeiro os botões e depois os dois analógicos.

O metadata `@sandbox raw` é intencional: o módulo precisa executar no contexto principal da página para que a substituição de `navigator.getGamepads()` seja visível ao cliente do Xbox Cloud Gaming. Tampermonkey documenta `raw` como execução no MAIN_WORLD (página) a partir da linha 4.18.

## Diagnóstico

No console da página, execute:

```js
window.NimboVirtualGamepad.getState()
```

Campos principais:
- `enabled`: controle virtual ativado.
- `installed`: adaptador Gamepad API instalado.
- `reads`: quantidade de leituras feitas pelo jogo enquanto ativo.
- `lastIndex`: slot virtual atual.
- `axes`: quatro eixos no padrão Gamepad.
- `buttons`: dezessete botões no padrão Xbox.

## Checklist para o primeiro teste

- [ ] O botão NX aparece na página do jogo.
- [ ] O painel abre e fecha sem bloquear a página.
- [ ] A ativação muda o status para ativo.
- [ ] `getState().reads` aumenta quando o jogo consulta os controles.
- [ ] O jogo reconhece os botões A/B/X/Y.
- [ ] O analógico esquerdo movimenta o personagem.
- [ ] O analógico direito controla a câmera.
- [ ] Um controle físico continua funcionando simultaneamente.
- [ ] Ao soltar ou cancelar o toque, eixos e botões voltam ao neutro.
- [ ] Ao ocultar a página ou perder foco, nenhuma entrada fica presa.

## Limitações conhecidas da versão 0.1.0

- É uma prova de conceito; a aceitação de Gamepad sintético depende do navegador e da implementação de entrada do cliente xCloud.
- O módulo não cria hardware virtual no sistema operacional. Ele expõe um objeto Gamepad sintético pela API JavaScript da página.
- Não há vibração/haptics, editor de layout, calibração, gyro ou integração com xHome nesta versão.
- O slot virtual é escolhido para não substituir slots físicos existentes.
- A validação estática do JavaScript não equivale a teste real no Tampermonkey, navegador ou jogo. O primeiro teste funcional deve ser feito com a página e um jogo ativos.

## Segurança e compatibilidade

O módulo fica desativado por padrão e só disponibiliza o Gamepad virtual após ação explícita no painel. Ao perder foco, ocultar a página ou sair dela, os eixos e botões são zerados. O adaptador preserva os gamepads físicos retornados pelo navegador.
