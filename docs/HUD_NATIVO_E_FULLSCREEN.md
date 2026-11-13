# HUD nativo e tema do carregamento — versão 4.15.1

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

Publicação 4.15.1. Não há alteração dos módulos de entradas, sinalização, autenticação, endpoints, áudio, preferências ou layouts salvos. Referências existentes: Better xCloud css.ts/stream-ui.ts identificam StreamHud e GripHandle; a estrutura real do cliente novo pode variar e requer teste no dispositivo.


## Alteração proposta: acesso independente na borda esquerda

O relato posterior à versão 4.15.1 mostra o NX visível, mas sem a alça Xbox. A imagem não determina a causa da ausência nativa. Por decisão do mantenedor, o acesso NX deixa de depender dessa barra: a reconciliação não chama a montagem de ações nativas e exibe apenas um botão próprio na borda esquerda, tanto na biblioteca quanto na partida. O menu Xbox continua recebendo prioridade sobre áreas de toque quando reconhecido.

O botão tem alvo de 44 × 44 px, rótulo acessível e ativação por teclado. Arrastar altera somente a altura, com limiar de 6 px para distinguir toque e arraste. A posição proporcional é salva em nx.panel.edgePosition.v1, sem migrar ou apagar preferências antigas. Rotação recalcula a altura; valores inválidos usam o padrão. Cancelamento ou perda de captura não persiste posição, e ponteiros secundários não interferem. O tick não interrompe um arraste ativo.

Ao abrir, o painel conserva o dock já existente. Ao fechar, a alça volta imediatamente. Durante preparação, o bloqueio de configurações continua; o cartão de informações permanece recolhível, com estimativa visível, tema NX e posição à esquerda. Esse cartão não abre configurações.

Verificação: cinco testes comportamentais de acesso independente, persistência, arraste/toque/teclado, cancelamento, múltiplos ponteiros, rotação e estados de painel/carregamento. Total: 374 testes, 371 aprovados, zero falhas e três TODO. Sintaxe dos dois scripts e relatório estático verificados. Asserções antigas sobre o lançador integrado foram retiradas porque esse comportamento deixou de ser requisito.

Playwright/Chromium foi tentado, mas o processo encerrou durante inicialização (TargetClosedError). Falta validar visualmente em Edge Android e navegador iOS/desktop, inclusive fullscreen e áreas seguras. O limite de fullscreen descrito acima continua: a alça acompanha o host existente e não recupera controles que estejam fora da árvore renderizada pelo navegador.

Roteiro no dispositivo: abrir e fechar NX; arrastar a alça sem abrir; recarregar e conferir altura; girar a tela; entrar/sair de fullscreen; abrir/recolher Xbox se disponível; iniciar outra partida e verificar que o acesso no carregamento só expande informações. Conferir teclado e HUD sem alteração de suas preferências.


## Atalho personalizado e painel aberto

O bloqueio de teclado do painel podia consumir keydown/keyup no document antes do gerenciador de combinações, especialmente quando o foco estava fora do painel. A soltura não era registrada e a combinação podia permanecer travada. O gerenciador passa à fase de captura no window; os filtros de eventos confiáveis, repetição e campos editáveis permanecem. Não altera teclas salvas, F8/F2 de captura, F9 nativo ou API Pointer Lock.

Verificação: dois cenários falham antes; três regressões passam depois. 87 testes relacionados a painel, modos, captura e entrada física aprovados, além de sintaxe dos dois scripts e relatório estático. Sem teste visual/fullscreen ou Android real nesta revisão. Não atribuir a esse guard a alternância observada pela tecla abaixo de Esc nem todo desaparecimento do ícone; esses sintomas ainda exigem diagnóstico.
