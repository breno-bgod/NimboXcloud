# Controle virtual integrado ao painel NX — 4.12.77

## Instalação

Esta é a versão completa do userscript NimboXcloud. Não instale o módulo experimental separado.

1. Desative o userscript experimental separado **NimboXcloud — Controle Virtual (Experimental)**, se estiver instalado.
2. Instale/atualize o arquivo completo `NimboXcloud.user.js`.
3. Abra `https://play.xbox.com/`.
4. Abra o painel NX e entre em **Controle virtual**.

## Controles da aba

- **Ativar HUD**: exibe os controles Xbox sobre o jogo.
- **Desativar HUD**: remove a HUD e libera os estados de entrada.
- **Editar HUD**: abre a edição por cima da tela do jogo.
- **Restaurar layout original**: volta às posições e tamanhos iniciais.

## Editor da HUD

Durante a edição:

- Arraste cada analógico ou botão para reposicionar.
- Use **+** e **−** no próprio controle para redimensionar.
- Use **×** para ocultar um controle.
- Use o seletor superior para adicionar controles ocultos novamente.
- Toque em **Salvar** e depois em **Concluir edição**.
- Ajuste a transparência na aba Controle virtual.

O layout é salvo localmente no navegador, separado das preferências do NimboTouch/Teclado e Mouse.

## Controles Xbox disponíveis

Analógicos esquerdo/direito; A, B, X, Y; LB, RB, LT, RT; View, Menu, L3, R3; D-pad; Home (oculto por padrão).

## Diagnóstico

No console da página, execute:

```js
navigator.getGamepads()
```

Procure um item com ID `NimboXcloud Virtual Gamepad`.

## Checklist de teste real

- [ ] Painel NX abre normalmente.
- [ ] Aba Controle virtual aparece.
- [ ] Ativar HUD exibe os controles.
- [ ] Editar HUD permite arrastar, redimensionar e ocultar controles.
- [ ] Adicionar controle restaura um item oculto.
- [ ] Salvar mantém o layout após recarregar a página.
- [ ] O gamepad aparece em `navigator.getGamepads()`.
- [ ] O jogo reconhece os botões e analógicos.
- [ ] Controle físico continua funcionando.
- [ ] Desativar HUD libera os comandos.

## Limite da validação

O arquivo passou por validação sintática e revisão estática. Ainda é necessário testar no Tampermonkey e em uma sessão real do Xbox Cloud Gaming. A implementação expõe um Gamepad sintético por meio da Gamepad API do navegador; ela não cria um dispositivo físico/virtual no sistema operacional. Se o jogo consumir a API em outro contexto isolado ou usar uma referência nativa capturada antes do userscript, poderá não reconhecer o controle, mesmo que a HUD responda visualmente.
