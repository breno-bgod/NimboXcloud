# NimboXcloud — Estado do projeto, decisões e pendências

> **Fonte de referência para mantenedores, colaboradores, forks e assistentes de IA.**
> Última revisão: 2026-11-13. Versão de referência: `4.15.2`, branch `main`.
> **Este documento registra decisões de produto, não certifica funcionamento em uma sessão real.** Consulte os testes, CI e evidências antes de declarar qualquer recurso estável.

## Política de documentação: somente escopo vigente

A documentação oficial é um **registro do estado atual e do trabalho futuro aprovado**, não um diário de todas as tentativas. Aplique as seguintes regras:

- **Documentar:** funcionalidades efetivamente presentes, limitações confirmadas, pendências atuais, recursos congelados com intenção de retomada e melhorias aprovadas.
- **Documentar temporariamente:** recursos destinados à remoção que ainda possuem código, configuração persistida ou risco de impacto. Identificar como *remoção pendente* até concluir limpeza e testes.
- **Não adicionar ao roteiro final:** protótipos que falharam e nunca foram incorporados, hipóteses descartadas e ideias sem decisão de implementação.
- **Após remoção definitiva:** retirar o item da matriz de recursos ativos/congelados e do roteiro; não manter uma seção permanente de tentativas fracassadas. O histórico técnico continuará disponível no Git e, quando necessário, nas notas de versão.
- **Não apagar fatos relevantes enquanto houver risco residual:** antes de excluir a documentação de um recurso, verificar que código, interface, preferências antigas e testes associados foram tratados.

O objetivo é que qualquer colaborador ou IA compreenda **o que existe, o que precisa ser corrigido e o que será desenvolvido**, sem confundir experimentos abandonados com compromissos futuros.

## Publicação 4.15.2 — correções autorizadas

Incorporação do PR #25 autorizada no chat: acesso NX independente, atalhos de painel/captura, seleção da fonte de áudio e opt-out dos ajustes de microfone. 385 testes locais: 382 aprovados, zero falhas, três TODO preexistentes. Sintaxe e relatório estático executados. CI deve ser conferido no head publicado. Homologação no Edge Android, som audível e fullscreen continuam pendentes; não declarar resolução de toda falha relatada apenas pelos testes. Produto mantém módulo 1.4.0 e preferências. PSBox/Android segue separado no PR #24, sem APK oficial.

## Publicação 4.15.1 e nova divisão de trabalho — 2026-11-13

O mantenedor autorizou oficializar a correção visual do PR #23: detecção de sessão MediaStream, encaixe no grupo nativo Xbox, recuperação à esquerda e aparência do carregamento compartilhada com o NX. Versão 4.15.1, módulo de entradas/HUD 1.4.0 preservado. Ver docs/HUD_NATIVO_E_FULLSCREEN.md para critérios e limites; teste visual no dispositivo continua pendente.

A automação passa a pesquisar repositórios novos/atualizados na janela móvel dos últimos 30 dias e a testar hipóteses em PR experimental. O produto em uso é mantido pelo responsável principal. Pesquisa de console, xHome e Fortnite Console não é promovida automaticamente. Política em docs/AUTOMATION_RESEARCH_POLICY.md; ponto central inicial no PR #24. PR #21 continua separado.

## Publicação oficial — 4.15.0 / 2026-11-13

O mantenedor autorizou promover o lote do PR #22 à versão oficial. Userscript 4.15.0 e módulo 1.4.0 mantêm preferências/layouts e os cinco modos de entrada. O @require fixa o módulo correspondente, e os endereços de atualização/instalação continuam na main. O PR automático #21 permanece separado desta publicação.

A publicação não amplia a validação realizada: o mantenedor relatou funcionamento das entradas e apresentou capturas da sessão; os últimos refinamentos de barra nativa, previsão e apresentação continuam sujeitos a teste no dispositivo. A revisão funcional tem 363 testes, 360 PASS, zero FAIL e três TODO preexistentes. A versão oficial será verificada pelo CI; o ambiente local ficou indisponível durante sua preparação. Não há nova evidência de áudio/voz, Remote Play jogável ou disponibilidade de GTA VI.

## Refinamento após teste do mantenedor — 2026-11-13 (4.15.0)

Carregamento passa à lateral direita e inicia compacto, com detalhes recolhíveis e previsão/tempo decorrido sempre visíveis. Estatísticas concentra ativação e personalização do monitor; Interface mantém aparência geral. O tempo informado pelo serviço exige correspondência de título/região e alocação não contraditória. Não há evidência suficiente para explicar de forma única os 57 minutos previstos versus cerca de 30 segundos observados.

Preservados posicionamento e entrada da barra nativa Xbox; integração usa seu puxador reconhecido, com recuperação independente fora da área superior se necessário. Correção ainda requer validação real no dispositivo. Áudio/voz recebeu somente avaliação: priorizar equalização, bypass e seleção de dispositivos; não implementar chamadas Discord nem áudio 3D por suposição. Detalhes e referências no documento de carregamento/monitor.

## Preparação da partida e monitor — 2026-11-13 (4.15.0)

Por solicitação do mantenedor, a preparação xCloud apresenta estimativa do serviço ou indisponibilidade, sempre visível, com detalhes técnicos opcionais. NX fica oculto e rejeita abertura durante a preparação observada; mídia pronta, cancelamento/falha, saída e fallback por inatividade liberam o acesso. Cancelar e voltar no Xbox permanecem disponíveis.

Monitor preserva preferências e acrescenta cartões com históricos limitados de FPS do vídeo, RTT e bitrate. Ícones e rótulos foram ajustados sem reorganizar categorias ou trocar o logotipo. Não há chamadas extras para estimativas nem sondagem de jogos; prévias de fila na biblioteca continuam fora do lote. Ver [comportamento, referências e aceite](./CARREGAMENTO_E_MONITOR.md). Validação Xbox/visual real pendente.

## Retorno do editor de HUD — 2026-11-13 (4.15.0)

O mantenedor confirmou sucesso nos testes da versão de entradas do PR #22 e relatou retorno indevido ao painel legado ao salvar a HUD. A correção usa o host NX para voltar à página Entradas ao salvar/cancelar, mantendo o fallback somente no módulo independente. Persistência dos layouts e troca interna de modos são preservadas. A nova navegação ainda requer teste visual real.

Direção de produto: central própria para dispositivos, perfis, mapeamento de ações e edição de HUD, inspirada na organização do reWASD. Remapeamento avançado, camadas e macros serão lotes separados; não declarar emulação de dispositivo no sistema operacional pelo navegador. Proposta em [Ajustes de entradas](./AJUSTES_ENTRADAS.md).

## Ajuste de entradas e Sistema — 2026-11-13 (4.15.0)

Por decisão do mantenedor, Sistema não apresenta nem aplica os experimentos de identidade/Client Hints, mesmo com preferências antigas, e não apresenta uma segunda ação de tela cheia/horizontal. DeX não é uma categoria própria: o perfil de dispositivo usa as capacidades normais do navegador, preservando a migração interna de preferências antigas.

A preferência Fortnite Console não aplica alteração na versão atual do Nimbo, mas o recurso do Better xCloud é real e deve ser preservado como objetivo. Seu patch força o argumento de sendTouchInputEnabledMessage para false na rota /launch/fortnite/, com a finalidade declarada de disponibilizar Salve o Mundo no mobile. A substituição por simples escolha de entrada foi retirada do PR após esclarecimento do mantenedor. A integração no Nimbo continua pendente e não equivale a liberar títulos sem autorização.

Após relato do mantenedor de cursor capturado sem movimento, o PR de entradas passou a encaminhar eventos físicos explicitamente pelo transporte existente, com liberação ao perder foco e módulo de teste fixado por commit. Há testes de integração até o SDK simulado; recepção no servidor e gameplay continuam pendentes. O touchpad virtual envia movimentos diretamente ao SDK; Pointer Lock é oferecido separadamente para mouse físico, mediante gesto explícito e sessão conectada.

Referências e roteiro de verificação: [ajustes de entradas](./AJUSTES_ENTRADAS.md). Os cinco modos, HUD/editor e preferências existentes permanecem. Não é validação de gameplay.

## Revisão incremental — 2026-11-12 / v4.12.88

O mantenedor definiu acessibilidade mobile/desktop, streaming, servidores, áudio/voz e estatísticas como eixos de evolução, preservando o que já funciona e os diferenciais próprios, especialmente o mouse por toque. A [avaliação e plano incremental](./PLANO_ATUALIZACAO.md) registra o estado observado e os critérios dos próximos lotes; paridade integral com Better xCloud não é requisito.

Neste lote: seleção HQ/Windows passa a respeitar a preferência salva; HQ continua padrão sem preferência. Corrigidos perda negativa, unidades de bitrate e teste smoke fora do CI. Não foram reativados recursos congelados nem alterados transportes de entrada, áudio ou xHome. A retomada de áudio/remapeamento será precedida de revisão e teste, conforme o plano.

As versões indicadas nas auditorias anteriores são históricas. A seção de revisão e o plano detalham as mudanças mais recentes sem declarar homologação de gameplay.

## Revisão incremental — 2026-11-12 / v4.12.91

Catálogo de datacenters cloud agora deriva das regiões anunciadas no login, preserva aliases e alternativas e mantém login xHome separado. A preferência do usuário não altera o destino observado da partida atual. Para aplicar a escolha, recarregar antes da próxima partida; não prometer aplicação sem novo login.

A implementação e dezesseis testes comportamentais novos estão concluídos; 221 testes locais, 218 PASS, zero FAIL e três TODO. Isso não homologa seleção real de datacenter. Teste visual de Chromium bloqueado por setsockopt; mouse/HUD/controles continuam exigindo validação de dispositivo. Consulte [roteiro de aceite](./SERVIDORES_DINAMICOS.md).

## Revisão incremental — 2026-11-12 / v4.12.93

O mantenedor relatou entrada em South India com Fortnite pela lista dinâmica, mas teclado/mouse físicos indisponíveis no Samsung DeX. Registro de uso real do mantenedor; a causa não foi atribuída ao rótulo DeX nem ao perfil HQ sem comprovação.

Foram adicionadas solicitações explícitas de teclado/mouse e gamepad físicos, separadas do HUD virtual, e restauração de configurações do adaptador. O rótulo da experiência em DeX passa a Desktop por capacidades; o monitor escreve Bitrate. Padrão Automático, toque nativo e Pointer Lock preservados. O joystick virtual xCloud retail não foi implementado neste lote.

Validação local: 242 testes, 239 PASS, zero FAIL, três TODO. Funcionalidade física no Fortnite/DeX ainda depende de teste autenticado. [Roteiro e limites](./ENTRADA_FISICA.md).

## Revisão incremental — 2026-11-13 / v4.13.0

O mantenedor confirmou que já testou o controle virtual e pediu seu aproveitamento no xCloud, independente do Remote Play, além de cinco modos selecionáveis e reorganização do painel. Relato de uso real preservado; a leitura do vínculo do adaptador no snapshot anterior não deve ser apresentada como prova de que o HUD não existia ou não funcionava para o mantenedor.

Implementados seletor único em Entradas, gerenciador de transições/recuperação, saída xCloud do joystick existente e navegação com nomes, busca e destinos expostos. O editor usado no jogo fica em Entradas; a prévia demonstrativa fica em Sistema. Automático preserva a negociação original e a ponte padrão entrega a leitura nativa intacta sem processamento.

Validação local: 267 testes, 264 PASS, zero FAIL, três TODO, incluindo 22 casos novos. Testes de VM com SDK/DOM controlados não homologam partida. Chromium falhou em setsockopt antes de abrir. Exclusividade em cliente real, compatibilidade do toque nativo, mobile/DeX e persistência visual exigem o [roteiro de aceite](./ENTRADAS_E_PAINEL.md). Nenhuma mudança de catálogo, entitlement, identidade de console, disponibilidade de GTA VI ou sinalização xHome neste lote. A integração de controles prepara os próximos testes; não comprova acesso a títulos ainda não testados.

## Revisão incremental — 2026-11-13 / v4.13.2

A pedido do mantenedor, o painel passou a nove categorias. Vídeo/Imagem e Áudio/Voz foram agrupados (voz acima); Sistema inclui compatibilidade; Interface centraliza a aparência do painel e do monitor. Estatísticas permanece separada. Entradas incorpora os ajustes de controle físico e teclado/mouse em seções expansíveis, sem alterar o gerenciador de modos. Região da loja foi retirada da navegação, preservando preferências/negociação existentes; JSON foi retirado da tela de imagem, mantendo perfis locais. O redesenho do Início foi adiado explicitamente; somente seus destinos foram atualizados.

Corrigidos o grupo de origem de enquadramento/tela cheia (causa da página Vídeo quase vazia), ordem brilho/contraste no shader, separador vertical do monitor e detecção de ações de restauração. 276 testes locais, 273 PASS, zero FAIL, três TODO. Chromium falhou em setsockopt antes de abrir. Percepção de brilho e layout no DeX/celular continuam pendentes de teste real. [Organização e aceite](./PAINEL_ORGANIZADO.md).

## Revisão incremental — 2026-11-13 / v4.14.0

O mantenedor relatou filtros sem diferença com WebGL2 ligado e pediu acesso rápido a captura/tela cheia, restauração unificada e qualidade junto de Vídeo e imagem. Implementados esses destinos e feedback de renderização/erro. Corrigidos caminhos de falha GPU, serialização/prioridade CSS, reaplicação manual com chaves atuais, seleção do vídeo, captura processada e enquadramento. O canvas preserva dimensão decodificada; não muda resolução do servidor.

300 testes Node: 297 PASS, zero FAIL, três TODO. Shader real executado em EGL/OpenGL ES3 sem janela para oito controles; RGB [80,100,120] virou [92,115,138] com brilho 115%. Isso não homologa upload de vídeo, composição DOM ou gameplay no navegador. Chromium continua bloqueado em setsockopt; causa específica no dispositivo do mantenedor não foi confirmada. [Implementação, referências e aceite](./VIDEO_E_IMAGEM.md).

PSBox solicita 1440 por canal de controle e dimensões/capacidades compatíveis. Esse caminho ainda não está adaptado/verificado no SDK retail do Nimbo. Não criar opção fictícia nem tratar canvas maior como stream 1440p. O próximo experimento está em AUTOMATION_BACKLOG.md, respeitando PRs e correções prioritárias de conexão/mídia.

## Propósito e princípios

O NimboXcloud é um userscript independente para a nova experiência de Xbox Cloud Gaming em `https://play.xbox.com/`. Busca oferecer monitoramento, personalização, controles e recursos de acessibilidade sem substituir o serviço Xbox. Prioridade: **iniciar e manter partidas estáveis**, preservar controle/toque nativos e permitir recuperação quando uma opção falhar.

- **Manter:** recurso útil, disponível; não confundir existência no código com homologação.
- **Experimental:** acessível para teste voluntário, desligado por padrão, com aviso de limites e reversão.
- **Congelado:** preservar implementação e contexto, não ampliar até critérios de retomada; ocultar da interface quando indicado.
- **Retirado da interface:** não oferecer ao jogador; pode continuar no código. **Não equivale a removido do código nem a desativado em runtime.**
- **Modificar:** corrigir comportamento/UX/testes antes de lançar como estável.
- **Pendente:** decisão aceita, mas ainda não implementada. Não anunciar como concluída.

## Matriz de decisões (fonte de verdade)

| Área | Decisão | Interface / implementação | Motivo e condição para retomar |
| --- | --- | --- | --- |
| Inicialização no novo xCloud | **Manter, prioridade máxima** | Ativo | Sem regressões de login, início, reconexão e partida. |
| Painel NX e monitor de QoS | **Manter** | Ativo | Homologar desempenho, recuperação e mobile/desktop. |
| Região e seleção de servidor | **Manter** | Ativo; **usuário relatou teste real bem-sucedido de troca de servidor** | Distinguir região solicitada da efetivamente observada; preservar fallback. |
| Bitrate e qualidade | **Modificar / investigar** | Ativo | Seleção de 50 Mbps com uso observado de ~3–5 Mbps; medir bitrate recebido, resolução, FPS, RTT e perdas. O valor configurado não garante taxa entregue pelo servidor. |
| Perfis de plataforma | **Modificar** | Automático, Android, Desktop, Console | Automático deve preservar identidade nativa de celular/desktop; escolha manual deve solicitar perfil específico, sem prometer aceitação pelo servidor. Separar `osName` de qualidade. |
| Fortnite: experiência de console | **Manter experimental** | Opção disponível | Usuário fará teste real. A implementação modifica sinalização de toque da configuração da sessão; **não comprova identidade de console nem garante alteração do jogo**. |
| Giroscópio aplicado ao jogo | **Manter experimental** | Disponível para teste | Testar orientação, calibração, interferência no gamepad, latência e recuperação. |
| Editor de HUD | **Manter em desenvolvimento experimental** | Implementação parcial; não anunciar como editor funcional completo | Validar movimentação real dos controles nativos, persistência e compatibilidade com HUD touch. |
| GPU / WebGL2 | **Manter experimental** | Código e opção de teste presentes | Medir consumo, bateria, latência, FPS e fallback antes de ativação geral. |
| Curvas do analógico | **Congelar / ocultar** | Controles da UI ocultados na 4.12.27; código preservado | Pesquisar funcionamento, segurança da interceptação de Gamepad API e compatibilidade. Conferir estado de preferência antiga antes de considerar congelamento completo de runtime. |
| Remote Play (xHome) | **Retomada técnica autorizada; UI oculta** | Aba permanece oculta; fluxo xHome experimental em desenvolvimento desde 2026-11-12 | Descoberta, autenticação, criação de sessão, SDP/ICE e DELETE best-effort estão no código; vídeo, áudio e controles jogáveis não foram comprovados. Manter UI oculta até homologação real. |
| Laboratório de identidade Xbox | **Congelar / ocultar ferramentas específicas** | Código e parte da UI avançada ainda presentes; limpeza pendente | Não existe prova de que alterar UA/Client Hints simule hardware Xbox ou libere serviços. Não expandir até obter evidências reproduzíveis. |
| Xbox One / Xbox Series X|S | **Ocultar e preservar** | Seletores específicos retirados; código legado preservado | Retomar apenas com dados confiáveis de negociação e compatibilidade. |
| Smart TV | **Retirar da interface** | Seletor retirado; perfil antigo migra para Automático | Fora do escopo atual. |
| Equalizador / processamento avançado de áudio | **Congelar** | **Limpeza de interface e prevenção de ativação antiga pendentes** | Usuário relatou resultado insatisfatório; preservar controles básicos de volume. Retomar após revisão da cadeia de áudio e testes A/B. |
| Filtros simples de imagem | **Manter** | Disponíveis | Preservar opção de restaurar original e medir custo. |
| Diagnóstico e relatórios | **Manter / simplificar interface** | Disponíveis | Não expor credenciais, cookies, identificadores sensíveis nem dados privados. |

## Funcionalidades aprovadas para estudo e implementação futura

Estas frentes foram solicitadas pelo mantenedor e **não devem ser descritas como prontas**:

| Frente | Objetivo | Estado e próximos passos |
| --- | --- | --- |
| Controles virtuais na tela | HUD de botões Xbox por toque, além de teclado virtual e touchpad/mouse; permitir teste em celular e com controle físico | **Planejado / validar base existente**. Inventariar HUD e entradas, definir gerenciador único sem wrappers concorrentes, verificar compatibilidade com novo xCloud e restauração de controles nativos. |
| Nitidez estilo Clarity Boost | Oferecer aprimoramento visual local ajustável, inspirado na abordagem AMD CAS do Better xCloud, sem depender de APIs exclusivas do Edge | **Planejado / investigar**. Auditar CAS e GPU existentes, estudar implementação de referência e licenças, evitar duplicar filtros, medir FPS, latência, bateria e fallback. Não alegar equivalência ao Clarity Boost nativo. |
| Multiplayer local (dois controles) | Permitir dois jogadores na mesma sessão quando o jogo e o serviço suportarem | **Planejado / investigar**. Estudar a implementação do Better xCloud e o protocolo de entrada do cliente atual; testar com dois gamepads físicos. O xCloud pode não suportar jogos que exigem segundo perfil Xbox. Não confundir detectar dois controles com entregar dois jogadores. |

**Regra:** incorporar essas frentes no planejamento, mas não apresentá-las como recursos disponíveis ou homologados até haver implementação, testes automatizados e partida real validada.

## Pendências imediatas de implementação

1. **P0 — Estabilizar testes/CI:** corrigir testes desatualizados sem eliminar cobertura útil; validar `node --check`, `node --test tests/*.test.cjs` e relatório de risco. Última falha de CI observada durante auditoria anterior; consultar a execução atual.
2. **P0 — Perfil Automático:** impedir que preferência de qualidade imponha indevidamente `osName: windows` quando a intenção for identidade nativa.
3. **P0 — Revisar segurança dos hooks:** `fetch`, XHR, WebRTC, Gamepad API; garantir fallback e ausência de vazamento de tokens.
4. **P1 — Completar congelamento da interface:** ocultar laboratório de identidade específico, equalizador avançado e informações redundantes; preservar Fortnite, giroscópio e perfis genéricos.
5. **P1 — Impedir efeitos antigos de recursos congelados:** auditar preferências persistidas de curvas, equalizador e outros experimentos; ocultar botões não impede necessariamente que um recurso previamente habilitado continue ativo.
6. **P1 — Medir bitrate:** testar limites 5/10/20/50 Mbps em condições comparáveis e registrar bitrate recebido, resolução, codec, FPS, RTT, perdas e comportamento adaptativo.
7. **P1 — Homologar experiências reais:** Android/Edge, Chrome/Edge desktop, DeX quando disponível; testar controle, toque, reconexão, troca de jogo e recuperação de configurações.
8. **P2 — Modularizar fontes:** continuar distribuindo um único `.user.js`, mas separar desenvolvimento em módulos com build e testes reproduzíveis.
9. **P2 — Atualizar documentação, notas de versão e instruções de contribuição** em cada mudança de status.

## Protocolo de retomada de funcionalidades congeladas

Antes de reativar um módulo:
1. Abrir issue/PR com **problema, objetivo, hipótese, evidência e impacto no jogador**.
2. Identificar dependências, pontos de interceptação, preferências persistidas e riscos de regressão.
3. Criar testes automatizados e roteiro de teste em sessão real; não afirmar que mocks equivalem a jogo real.
4. Disponibilizar primeiro como **experimental e desligado por padrão**, com opção clara de restauração.
5. Registrar resultados, limitações e decisão nesta matriz; somente então promover a estável.

## Guia para quem clonar ou usar outra IA

- **Leia primeiro:** `README.md` → **este arquivo** → `docs/ROADMAP.md` → `CONTRIBUTING.md` → auditorias em `docs/`.
- Remote Play (xHome) teve retomada técnica explicitamente autorizada pelo mantenedor em 2026-11-12; continuar o trabalho incremental, mas manter a aba/controles ocultos até mídia e comandos serem comprovados em Xbox real.
- **Não reative** curvas do analógico, equalizador ou identidade Xbox apenas porque existem no código.
- **Não remova** giroscópio ou seletor de servidor sem nova decisão fundamentada. Fortnite Console deve ser preservado e investigado como sinalização específica da sessão, conforme esclarecimento do mantenedor.
- **Não presuma** que a opção de 50 Mbps força 50 Mbps, que a escolha de perfil muda a identidade aceita pelo servidor, ou que WebRTC provisionado significa Remote Play jogável.
- Preserve as opções nativas de toque e gamepad; evite múltiplos wrappers concorrentes para `navigator.getGamepads`.
- Em toda alteração: atualizar esta matriz se houver mudança de escopo/status, `CHANGELOG.md` se houver mudança de comportamento e testes/CI correspondentes.
- Sempre registrar **o que foi implementado**, **o que foi testado de fato**, **o que continua pendente** e o commit correspondente.

## Registro de decisões

- **2026-11-11 — v4.12.24:** Fortnite Console introduzido como experimento opt-in de sinalização de toque.
- **2026-11-11 — v4.12.25:** Xbox One e Series X|S ocultados, código preservado; Console genérico mantido.
- **2026-11-11 — v4.12.26:** Smart TV retirado; Original renomeado para Automático; Android/Desktop/Console mantidos.
- **2026-11-11 — v4.12.27:** aba Remote Play e controles de curvas do analógico ocultados; código preservado; versão interna sincronizada.
- **2026-11-11 — decisão de produto:** equalizador congelado; laboratório Xbox congelado; Fortnite e gyro continuam experimentais; seletor de servidor mantido; bitrate priorizado para investigação. **A implementação integral dessas decisões ainda não foi concluída.**
- **2026-11-12 — decisão do mantenedor:** retomada técnica do Remote Play xHome autorizada. Desenvolvimento de descoberta, sessão, WebRTC e teardown pode continuar; a aba permanece oculta e o recurso não pode ser anunciado como jogável antes de comprovar mídia e controles em Xbox real.

> **Política de transparência:** nunca confundir "opção aparece", "código existe", "teste automatizado passa" e "funcionou em partida real". São níveis distintos de evidência.




