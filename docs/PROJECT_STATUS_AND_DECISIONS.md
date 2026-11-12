# NimboXcloud — Estado do projeto, decisões e pendências

> **Fonte de referência para mantenedores, colaboradores, forks e assistentes de IA.**
> Última revisão: 2026-11-11. Versão de referência: `4.12.27`, branch `main`.
> **Este documento registra decisões de produto, não certifica funcionamento em uma sessão real.** Consulte os testes, CI e evidências antes de declarar qualquer recurso estável.

## Política de documentação: somente escopo vigente

A documentação oficial é um **registro do estado atual e do trabalho futuro aprovado**, não um diário de todas as tentativas. Aplique as seguintes regras:

- **Documentar:** funcionalidades efetivamente presentes, limitações confirmadas, pendências atuais, recursos congelados com intenção de retomada e melhorias aprovadas.
- **Documentar temporariamente:** recursos destinados à remoção que ainda possuem código, configuração persistida ou risco de impacto. Identificar como *remoção pendente* até concluir limpeza e testes.
- **Não adicionar ao roteiro final:** protótipos que falharam e nunca foram incorporados, hipóteses descartadas e ideias sem decisão de implementação.
- **Após remoção definitiva:** retirar o item da matriz de recursos ativos/congelados e do roteiro; não manter uma seção permanente de tentativas fracassadas. O histórico técnico continuará disponível no Git e, quando necessário, nas notas de versão.
- **Não apagar fatos relevantes enquanto houver risco residual:** antes de excluir a documentação de um recurso, verificar que código, interface, preferências antigas e testes associados foram tratados.

O objetivo é que qualquer colaborador ou IA compreenda **o que existe, o que precisa ser corrigido e o que será desenvolvido**, sem confundir experimentos abandonados com compromissos futuros.

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
- **Não remova** Fortnite experimental, giroscópio ou seletor de servidor sem nova decisão fundamentada.
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
