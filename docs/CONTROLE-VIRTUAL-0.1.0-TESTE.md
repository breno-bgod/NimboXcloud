# Controle virtual integrado ao painel NX — 4.12.76

## Instalação correta

Esta versão é o **userscript completo do NimboXcloud**, não um módulo separado.

1. Desative/remova no Tampermonkey o userscript experimental separado chamado **NimboXcloud — Controle Virtual (Experimental)**, caso tenha instalado a versão anterior.
2. Instale o arquivo `NimboXcloud.user.js` desta branch.
3. Mantenha habilitado o userscript principal do NimboXcloud (esta versão já contém o painel NX e o controle virtual integrado).
4. Abra `https://play.xbox.com/`.
5. Abra o painel NimboXcloud e entre na aba **Controle virtual**.
6. Toque em **Ativar controle virtual**. O HUD aparece sobre o jogo; o painel NX permanece intacto.

## O que está integrado

- Nova aba **Controle virtual** no painel NX.
- Dois analógicos virtuais.
- Botões A/B/X/Y, LB/RB/LT/RT, View/Menu, L3/R3, Home e D-pad.
- Saída pelo adaptador Gamepad API já existente no NimboXcloud, sem criar um segundo wrapper de `navigator.getGamepads`.
- Controles físicos preservados e slots existentes não substituídos.
- Estado interno separado de NimboTouch, xHome e teclado/mouse.
- Liberação dos comandos ao perder foco, ocultar a página ou fechar o HUD.

## Diagnóstico

Abra o console da página e execute:

```js
navigator.getGamepads()
```

Procure por um item com ID `NimboXcloud Virtual Gamepad`. O índice deve ser diferente dos controles físicos conectados.

## Checklist

- [ ] O painel principal NX aparece e abre normalmente.
- [ ] A aba **Controle virtual** aparece.
- [ ] Ativar o recurso exibe o HUD.
- [ ] O controle virtual aparece em `navigator.getGamepads()`.
- [ ] A/B/X/Y são reconhecidos pelo jogo.
- [ ] O analógico esquerdo movimenta o personagem.
- [ ] O analógico direito controla a câmera.
- [ ] Um controle físico continua funcionando.
- [ ] Fechar o HUD libera todos os comandos.

## Limite da validação

O JavaScript foi validado sintaticamente e a integração foi revisada estaticamente. A aceitação do gamepad sintético precisa ser confirmada no Tampermonkey, no navegador e em uma sessão real do Xbox Cloud Gaming. Esta versão não cria um dispositivo de hardware virtual no sistema operacional; ela expõe um Gamepad sintético à página.
