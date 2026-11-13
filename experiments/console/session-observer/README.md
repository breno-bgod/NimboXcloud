# Laboratório passivo de sessão no play.xbox.com

## Objetivo e hipótese

Observar etapas de uma sessão real sem mudar autenticação ou identidade: pedidos de login/início pelo fetch da página, descritor declarado quando acessível e vídeo vivo com contador de quadros avançando. Hipótese: uma instrumentação opt-in consegue produzir evidência útil para a próxima comparação de cliente, sem consumir corpos de requisições/respostas ou alterar os argumentos.

Este experimento não inicia jogos, não realiza login e não implementa identidade Xbox. O usuário opera o cliente existente. HTTP 200, vídeo e confirmações manuais continuam separados da classificação do servidor.

## Teste manual no navegador do mantenedor

1. Instale somente o userscript experimental [NX-Session-Lab.user.js](https://raw.githubusercontent.com/breno-bgod/NimboXcloud/proposal/console-service-resume/experiments/console/session-observer/NX-Session-Lab.user.js) num gerenciador de userscripts que funcione no seu navegador. Ele é separado do instalador oficial; não há @require nem importação pelo Nimbo.
2. Abra play.xbox.com e faça o login normalmente, sem fornecer credenciais ao laboratório. Abra o controle recolhido “Laboratório de sessão · experimental” e clique em “Iniciar observação” ANTES de iniciar um jogo já disponível. Não precisa fazer logout/login para preencher a etapa de login: ela pode permanecer não observada.
3. Inicie o jogo pelos controles normais do site. Observe pedidos play-cloud/play-home, status e descritor, quando visíveis. Nada observado não equivale a falha: o SDK pode usar uma referência fetch anterior, XHR, worker ou outro contexto.
4. Confira imagem em movimento, áudio e uma ação no jogo. Marque as confirmações manuais somente se você efetivamente ouviu áudio e os comandos responderam. A existência de trilha áudio não marca esses campos automaticamente.
5. Clique “Mostrar relatório”. O texto é um snapshot sanitizado e selecionável; revise antes de compartilhar. Não envie HAR completo, headers, cookies, tokens ou logs de conta. “Identidade Xbox: NÃO CONFIRMADA” é o estado esperado até existir evidência específica do servidor.
6. Use “Parar observação”. Para remover completamente o experimento, desative-o no gerenciador e recarregue a página. Nenhum dado é salvo no navegador pelo script.

O painel experimental acompanha seu próprio host fullscreen quando ele é um contêiner DOM. Em fullscreen nativo de vídeo, controles HTML externos podem desaparecer: saia desse modo para consultar/parar a observação. Não há substituição da API fullscreen nem movimentação de HUD Xbox/NX.

## Dados coletados

- Até 24 eventos de rotas POST login/play GSSV reconhecidas, sem URL, query, IDs ou corpos.
- offering obtido do host de login: xgpuweb, xgpuwebf2p, xhome ou other.
- Somente campos enumerados do header X-MS-Device-Info: presença/parse, clientAppType, sdkType e família os. Valores desconhecidos são other. Um nome iniciado por Xbox é rotulado xbox-declared, nunca identidade validada.
- Vídeo com MediaStream/trilha viva; progressão de totalVideoFrames quando disponível; presença de trilha áudio. Não associa automaticamente o vídeo ao pedido capturado.
- Confirmações explicitamente manuais e data de geração do relatório.

Não lê Authorization, cookies, armazenamento da conta, corpo de login/play ou respostas; não cria requisições próprias e não envia o relatório. O callback preserva this/argumentos/promise/resposta do fetch anterior. Ao parar, restaura fetch somente se ninguém o substituiu depois; callbacks tardios são descartados por época. Isso não garante observação de toda a rede nem classificação Xbox.

## Referências verificadas

- Nimbo main 3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd: nxObserveOffering, patchPlayRequest e nxProtocolEvidence. O diagnóstico oficial permanece intacto.
- PSBox eb63daf8f953684387a06a7bab8ef0a1e3133463, src/xcloud/gssv.cpp: header X-MS-Device-Info e estágios de login/início.
- Better xCloud ea4d19f2800cee9cfa387a0c9c37b3711cf208c7, patcher.ts: força sinal de toque no Fortnite; não representa identidade validada e não é aplicado pelo observador.
- Mapa [CONSOLE_IDENTITY_MAP.md](../../../docs/research/CONSOLE_IDENTITY_MAP.md).

Nenhuma novidade foi presumida dos heads externos, que permanecem iguais à pesquisa anterior. Busca de repositórios novos desde 14/10 retornou candidatos já registrados; o trabalho desta execução foi a lacuna de observação interativa.

## Verificação

`node --check experiments/console/session-observer/NX-Session-Lab.user.js`

`node --test --test-isolation=none experiments/console/session-observer/observer.test.cjs`

Onze testes aprovados em Node/VM: opt-in/transparência, sanitização, confirmação manual sem promover identidade, Request sem consumo, rotas, callbacks tardios, wrappers concorrentes/limite, mídia, falhas, montagem/fullscreen do painel próprio e rollback de instalação e leitura exclusiva do header permitido (sem copiar Authorization). Testes usam somente respostas/objetos sintéticos.

Chromium/Playwright foi tentado com todas as rotas substituídas por fixtures locais; o navegador falhou ANTES da navegação: Crashpad setsockopt Operation not permitted, SIGTRAP/TargetClosedError. A interface ainda não foi validada visualmente nem em serviço autenticado. Estado: testes locais aprovados; teste real pendente.

## Próxima decisão

Use um primeiro relatório real como referência web. Depois procure uma diferença verificável de descritor/capacidade/classificação em um cliente Xbox legítimo, sem capturar segredos ou inferir identidade a partir de sucesso. Só então planeje alteração isolada.

Android/iOS/desktop dependem de gerenciador compatível e APIs do navegador. Não se declara compatibilidade homologada nas três plataformas, reconhecimento Xbox, reprodução de jogo ou suporte a GTA VI.

## Diagnóstico 0.1.1 — relatórios do mantenedor

Três relatórios fornecidos no chat em 13/11 mostraram running=false e events=[]; dois também mostraram quadros avançando e confirmações manuais de áudio/entrada. Esses relatos não estabelecem o motivo de parada nem reconhecimento Xbox. O código preserva a última amostra após stop, portanto vídeo positivo e captura parada podem coexistir. Não foi comprovada falha de autenticação ou do serviço.

Hipótese limitada: distinguir ciclo de vida e tráfego visível permite escolher a próxima correção sem atribuir ausência de eventos ao Xbox. diagnostics agora informa tentativas/início/parada, motivo enumerado, chamadas fetch observadas (sem URL/corpo), rotas reconhecidas, situação do hook e data da amostra de mídia. replaced-or-wrapped não prova perda: outro wrapper pode delegar corretamente. mediaIsHistorical indica amostra anterior à parada. O relatório exibido continua sendo snapshot: gerar novamente após mudanças.

Verificação: sintaxe aprovada e 13 testes Node/VM aprovados, incluindo contadores em chamada não reconhecida, stop/restart, falha de instalação e substituição de hook. Sem novo teste real ou visual. Não corrige ainda cobertura XHR/workers/referências salvas. Próximo teste: iniciar observação, abrir jogo autorizado, gerar relatório enquanto ativo; usar diagnostics para distinguir zero chamadas, rotas não reconhecidas, hook substituído e parada explícita. Não acrescenta perfil Xbox ou alterações de autenticação.
