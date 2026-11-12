# Touch Adaptation Kit (TAK) — arquitetura e limites

Data da revisão: 2026-11-12  
Escopo: investigação para o editor de controles do NimboXcloud em `play.xbox.com` e Remote Play xHome.

## Decisão

O TAK é a base prioritária para layouts de toque sempre que o runtime do Xbox permitir. O NimboXcloud deve tratar um layout como dados estruturados (JSON), preservar as ações Xbox e personalizar somente propriedades aceitas pelo schema/runtime. Não manipular a camada visual nativa por seletores DOM sem prova de que ela é DOM editável.

O NimboTouch atual permanece como complemento/fallback. Não deve ser removido antes de validar o TAK no cliente web atual.

## Capacidades confirmadas no schema oficial v4.0

Fonte: [Microsoft xbox-game-streaming-tools — layout.json](https://github.com/microsoft/xbox-game-streaming-tools/blob/main/touch-adaptation-kit/schemas/layout/v4.0/layout.json), licença MIT no repositório.

O schema define:
- `joystick` analógico, com mapeamento de eixos para `leftJoystick` e `rightJoystick`;
- `button`, com ações de gamepad como A/B/X/Y, View, Menu, bumpers, D-pad e cliques de L3/R3;
- `directionalPad` e `throttle`, que pode mapear gatilhos;
- `touchpad`, com exemplo de saída `relativeMouse`;
- sensores `gyroscope` e `accelerometer`, com mapeamento 3D para eixos do controle;
- propriedades de apresentação/configuração como opacidade (0–1), escala (0,5–2), sensibilidade (>0), deadzone e curvas de resposta.

Isso confirma que touchpad e giroscópio existem no modelo TAK; não prova que estejam ativos em toda sessão, dispositivo ou jogo.

### Limite de geometria

O layout v4.0 organiza controles em zonas como `left`, `right`, `upper`, `lower`, rodas internas/externas e grupos. O schema não expõe coordenadas livres X/Y para cada controle individual. Portanto, não prometer um canvas com arrasto livre de qualquer botão nativo. O editor NX pode reorganizar slots/grupos e ajustar propriedades suportadas; arrasto livre só será oferecido onde o runtime fornecer mecanismo real para isso.

## Teste de layout no cliente web

A [wiki do Better xCloud — custom touch layout](https://github.com/redphx/better-xcloud/wiki/How-to-create-custom-touch-control-layout) documenta:
- habilitar a disponibilidade de controles touch para todos os jogos;
- recarregar a página em Chromium com emulação de dispositivo touch;
- abrir um jogo sem layout touch oficial;
- passar um JSON v4.0 para `testTouchLayout(layout)` no console do DevTools.

A wiki registra limitações desse fluxo, incluindo ausência de assets customizados e ausência de troca dinâmica automática por contexto de jogo. Esse procedimento é evidência de um hook de teste usado pelo Better xCloud, não uma garantia de que ele esteja exposto no novo `play.xbox.com`, no contexto isolado de um userscript ou em jogos com layout oficial.

O NimboXcloud v4.12.71 adiciona apenas uma sondagem passiva do descritor próprio `window.testTouchLayout`. Ela não executa a função, não lê layouts, não modifica o DOM e não altera a sessão. "Não visível" significa apenas que o hook não foi encontrado no objeto `window` observado pelo userscript.

## Sideload oficial e ambiente retail

A documentação Microsoft de [deploy de layouts TAK](https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/building-touch-layouts/game-streaming-touch-deploying-touch-layout?view=gdk-2510) descreve o fluxo de desenvolvimento:
1. criar/validar o bundle com TAK CLI;
2. servir os layouts com `tak serve`;
3. habilitar sideload nas configurações de desenvolvedor do Content Test Application;
4. iniciar o stream e selecionar o layout no menu Developer > TAK.

Esse fluxo depende de Content Test Application e configuração de desenvolvedor. Não equivale a substituir layouts oficiais numa sessão retail comum de `play.xbox.com`.

## Arquitetura proposta para NX

1. Detectar o hook de teste sem invocá-lo e registrar em diagnóstico se ele está visível no contexto do userscript.
2. Quando houver acesso comprovado, testar um layout mínimo reversível em jogo sem touch nativo; nunca sobrescrever layout oficial por padrão.
3. Validar separadamente xCloud e xHome: layout TAK pode pertencer ao cliente de streaming e não necessariamente ao caminho de Remote Play xHome implementado pelo NimboXcloud.
4. Modelar o editor como JSON v4.0 com ações tipadas, validação antes de aplicar, cópia de segurança e restauração.
5. Usar recursos TAK documentados (touchpad, gyro, escala, opacidade, sensibilidade e deadzone) apenas após validar o suporte no runtime/dispositivo.
6. Manter NimboTouch como fallback quando o hook não existir ou o runtime não permitir layout customizado.

## Critérios antes de declarar integração

- [ ] `testTouchLayout` detectado no contexto real de `play.xbox.com`, ou mecanismo alternativo oficial confirmado.
- [ ] Layout JSON mínimo aceito sem erro e sem modificar permanentemente preferências.
- [ ] Aplicação e restauração confirmadas na mesma sessão.
- [ ] Analógico, botões, D-pad, triggers e touchpad testados.
- [ ] Gyroscope/accelerometer testados em dispositivo com sensor e permissão apropriados.
- [ ] Comportamento de jogos com layout oficial comparado com jogos sem layout oficial.
- [ ] Diferenças xCloud e Remote Play documentadas; nenhum recurso anunciado como universal sem teste.

## Referência externa avaliada: Thunder Virtual Controller

O [gist Thunder Virtual Controller](https://gist.github.com/Navneetkrh/8b224abcbe449a23b0360553663b8357), criado em 2025-11-30, demonstra uma interface virtual com editor de posições, swipe-to-look, gyro, deadzone e ajustes de sensibilidade. É uma referência conceitual, mas não é uma base segura para incorporar:
- O userscript substitui globalmente `navigator.getGamepads` por um gamepad sintético, dispara `gamepadconnected` e mantém um loop `requestAnimationFrame` permanente.
- O padrão conflita com o gerenciador único de entradas do NimboXcloud e pode ocultar controles físicos ou alterar o comportamento de outras partes da página.
- A vibração usa `navigator.vibrate` como substituto, não comprova retorno háptico real do controle Xbox.
- O cabeçalho do gist corresponde a `https://www.xbox.com/*/play*`, não ao domínio novo `play.xbox.com`.
- Não foi identificada licença explícita no gist consultado; não copiar nem adaptar código sem autorização/licença clara.

Conclusão: manter o TAK como caminho principal e usar esse gist apenas como referência de UX/controles para um fallback isolado. Não introduzir override global de `navigator.getGamepads`, gamepad sintético ou scheduler concorrente.

## Licenciamento e distribuição

O repositório público de schemas/ferramentas Microsoft declara MIT. A documentação informa que o TAK CLI possui EULA própria; não redistribuir o executável nem presumir que a licença MIT do repositório substitua a EULA do CLI. O NimboXcloud pode referenciar o schema público e implementar seu próprio editor, mantendo atribuição e compatibilidade com a licença aplicável.
