# HUD nativo e tema do carregamento — correção proposta

## Evidência e diagnóstico

O mantenedor apresentou capturas em retrato, paisagem e tela cheia: a barra Xbox ficava acessível em retrato, mas o NX permanecia separado à direita; o painel de carregamento tinha aparência distinta do NX.

Foi reproduzida uma causa concreta no código: isInGame retornava false para um vídeo com srcObject e trilha viva quando não havia estatísticas RTC interceptadas, blob src ou test id. Isso desviava a sessão para o posicionamento da biblioteca e evitava tentar integrar o NX à barra. A regressão falha contra a base 4.15.0 e passa com a correção. Não se atribui toda diferença das imagens a essa única causa.

## Alteração

- Detecção do vídeo real por MediaStream/trilha viva, preservando fallbacks existentes. Trailers sem trilha viva não são tratados como essa evidência.
- Busca do grupo de controles nativos sobe invólucros individuais até a linha compartilhada. Acesso NX é colocado ao lado do Xbox quando o botão possui identificação acessível; sem identificação, preserva-se o ponto nativo já reconhecido. Nenhum botão Xbox é removido, clonado ou recebe listener do Nimbo.
- Reconciliação idempotente mantém botões únicos em retrato e paisagem. Acesso independente fica à esquerda e é só um ícone, sem percentual reaparecendo em update. Painel NX aberto mantém o dock existente.
- Paleta compartilhada por nxPanelApply e carregamento: fundo/tom/transparência, texto, cor de ícone, borda e superfície. O botão de recolher usa o mesmo BRAND_ICON, preservando o logotipo atual. Fonte e desfoque correspondem ao NX.
- Relatório unificado inclui nativeUi: detecção de jogo, tag fullscreen, presença do StreamHud e se está dentro da subárvore fullscreen, visibilidade dos acessos e lado da recuperação. Não inclui texto digitado, títulos/IDs de conta, credenciais ou DOM bruto.

## Limite do navegador

Fullscreen API renderiza a subárvore do elemento escolhido. Se o cliente colocar apenas o vídeo em fullscreen e deixar a barra nativa fora, um lançador do Nimbo não pode, por si, trazer essa barra para dentro. Esta correção não move DOM gerido pelo React, não substitui a API do navegador nem força uma barra Xbox artificial. O botão Tela cheia do NX já solicita documentElement para manter controles/diálogos na página. Caso o problema persista, nativeHudInsideFullscreen no diagnóstico permite diferenciar esse caso de falha de detecção.

## Verificação

- Regressão na base: teste de sessão srcObject viva falha; depois passa.
- Sete testes novos de detecção, trailer/trilha encerrada, invólucros da barra, retrato/paisagem, ausência de duplicação, menu recolhido, recuperação à esquerda e diagnóstico de subárvore; um teste adicional de tema compartilhado. Total: 371 testes, 368 PASS, zero FAIL e três TODO preexistentes.
- Sintaxe dos dois scripts e relatório estático executados.
- Cenários de DOM são controlados; não equivalem a teste visual/autenticado do navegador do mantenedor.

Aceite pendente no dispositivo: abrir Fortnite, expandir/recolher a barra Xbox, girar retrato/paisagem, entrar/sair de tela cheia e conferir NX ao lado do Xbox sem duplicação. Conferir carregamento recolhido/expandido e personalização de tom/transparência/texto. Se a barra ainda faltar, copiar o diagnóstico do Sistema e observar nativeUi, sem enviar credenciais.

Não há alteração de versão oficial, módulos de entradas, sinalização, autenticação, endpoints, áudio, preferências ou layouts salvos. Referências existentes: Better xCloud css.ts/stream-ui.ts identificam StreamHud e GripHandle; a estrutura real do cliente novo pode variar e requer teste no dispositivo.
