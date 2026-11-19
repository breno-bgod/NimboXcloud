# NimboXcloud — Plano operacional Alpha 0.0.1

A versão Alpha 0.0.1, iniciada em 2026-11-14, é o ponto de partida das correções públicas. O histórico técnico anterior está nos commits Git e não integra o registro público de lançamentos Alpha.

## Procedimento de manutenção
1. Ler o HEAD atual de `main`, o código dos dois userscripts, os testes e as issues recentes.
2. Reproduzir o problema antes de alterar o comportamento. Registrar o que foi observado e o que continua hipótese.
3. Corrigir em mudança pequena, sem remover funcionalidades, configurações, licenças ou avisos necessários.
4. Verificar sintaxe, testes automatizados, riscos estáticos e, quando possível, testar em dispositivo e sessão reais.
5. Conferir novamente o HEAD antes de publicar, evitando sobrescrever trabalho concorrente.
6. Atualizar o [CHANGELOG Alpha](CHANGELOG.md) apenas com alterações a partir de 0.0.1.

## Prioridades
- **P0:** inicialização, estabilidade de sessão, Gamepad, controles físicos e virtuais, regressões do painel NX.
- **P1:** HUD, giroscópio, touchpad, fullscreen, áudio, monitoramento e seleção de regiões.
- **P2:** compatibilidade experimental e Remote Play xHome, sempre com autorização e validação separadas.

## Critérios de aceite
- Nenhum recurso declarado funcional apenas com base em mocks ou testes sintéticos.
- Nenhum token, cookie ou dado de conta publicado em diagnósticos.
- Preferências, layouts e caminhos de recuperação preservados.
- Evidência dos testes realizados e limitações pendentes em cada correção.

Detalhes de produto: [Estado Alpha](docs/PROJECT_STATUS_AND_DECISIONS.md) e [roteiro](docs/ROADMAP.md).


## Execução visual — 2026-11-15 — Mobile e classificação da qualidade de transmissão

### Base consultada e rastreabilidade
- HEAD inicial/final de `main`: `5ba8943eedb83b0735dc7afe1cb20276fa7fcde3` (sem alterações diretas nesta execução).
- Userscript: Alpha `0.0.1`; blob inicial consultado: `d2269b619aa5e217f2f79f317a0d0334fffe2757`.
- Roadmap inicial: blob `5c9b79108a48d7faf29651b000d8cbc6c8df0496`; CHANGELOG lido: blob `6e3ddc67cbb90258c45c65c8701ce2bf79af3185`. Não houve lançamento novo nem alteração do CHANGELOG.
- Branch de trabalho existente: `automation/visual-mobile-nav-2026-11-14`; PR visual único desta frente: [#35](https://github.com/breno-bgod/NimboXcloud/pull/35), ainda em rascunho.
- Integração rastreável da base atual de `main` na branch: `1a663482d65560b75933a3c85038a6606415f3c5` (merge commit normal, sem force push). Correções de testes: `54d6cf9b002b12d6caf08cdb13c2577de54536be` e `7c743766bb49e947874c738645f827d2fc1a0ca4`.
- Esta automação permanece estritamente visual. As prioridades funcionais gerais descritas acima não autorizam alterações de jogabilidade, entrada, rede, sessão, streaming ou telemetria.

### Inventário real e classificação
A navegação atual tem nove IDs estáveis: `overview`, `video`, `stream`, `statistics`, `inputs`, `audio`, `remote`, `personalize` e `advanced`. Há Início e oito páginas de configuração; a taxonomia final solicitada ainda exige desdobrar Entradas e agrupar Vídeo/Áudio.

| Categoria-alvo | Conteúdo comprovado no código | Situação |
| --- | --- | --- |
| Mobile | Família `mobile` do seletor; editores reais de HUD para controle virtual e teclado/mouse virtuais; giroscópio do smartphone; touchpad e sensibilidade compartilhada | Giroscópio/touchpad e seus ajustes agora só são apresentados nesta família |
| Joypad | Gamepad físico conectado, perfis de analógico, vibração e atalho de gamepad | Não foi encontrado remapeamento A/B/X/Y nem editor de layout físico |
| Teclado e Mouse | Captura/Pointer Lock do mouse físico e atalho de teclado; configurações próprias do modo físico | HUD virtual de teclado/mouse continua em Mobile por ser touchscreen; não foram encontrados macros funcionais |
| Stream | Presets de qualidade, data center, seleção de servidor, preferência por RTT medido, rede/IPv4 e servidores medidos | Presets movidos de Vídeo para Stream; não foi encontrado controle configurável de bitrate |
| Vídeo e Áudio | Vídeo: enquadramento, brilho, contraste, saturação, perfis locais, GPU/WebGL2, Unsharp/CAS, sombras e realces. Áudio: microfone, volume, saída, equalização e processamento | Ainda são duas páginas; FSR/HDR não foram encontrados no userscript atual |
| Estatísticas | Monitor de transmissão, FPS, bitrate recebido, RTT, jitter, perda, decodificação, quadros descartados, codec e resolução recebida | Resolução recebida apresentada aqui; métricas permanecem separadas dos diagnósticos técnicos |
| Remote Play | Descoberta, sessão, mídia, entrada e qualidade futura 720p/1080p/1080p-HQ | Continua experimental; não foi homologado com console físico. Seus presets pertencem à futura sessão xHome, não ao Stream do xCloud |
| Desenvolvedor/Avançado | Compatibilidade, identificação observacional, relatórios, diagnóstico técnico de entradas, ferramentas e logs/sistema | Rótulo visível alterado para “Avançado”; prévia técnica de HUD continua identificada como prévia, não como editor funcional |
| Gerais/universais | Aparência do painel NX | Rótulo visível alterado para “Gerais”. Perfil Auto/Desktop/Celular ainda está em Vídeo, embora controle a experiência geral da interface; avaliar na matriz. Nenhuma preferência de idioma foi encontrada; `navigator.language` é apenas observacional |

O seletor único de modo de entrada continua dentro da página Entradas: cinco modos e recuperação Automático do Xbox. Não foi duplicado. Sua posição definitiva — área global persistente ou destino único — permanece pendente de matriz, para que todas as categorias continuem acessíveis sem criar seletores concorrentes.

### Alterações visuais desta execução
- `nxPhoneControls` e `nxTouchpadSettings` são montados somente quando a família apresentada é Mobile. Builders, handlers e callbacks existentes foram reutilizados.
- `nxQualityPresets` foi movido visualmente de Vídeo para Stream. Os dois presets existentes permanecem exatamente os mesmos: Máximo e Padrão.
- O grupo somente informativo “Qualidade recebida” (resolução real do vídeo) foi movido para Estatísticas. O monitor sobreposto mantém seu campo opcional de resolução como visualização independente já existente.
- A página Vídeo deixa de apresentar controles de qualidade de transmissão; mantém apresentação e processamento local de imagem.
- Rótulos visíveis atualizados: “Streaming” → “Stream”, “Interface” → “Gerais”, “Sistema” → “Avançado”. Todos os IDs e aliases internos foram preservados.
- Índice de busca e descrições foram ajustados para que qualidade solicitada/resolução encaminhem a Stream/Estatísticas, e os ajustes locais permaneçam em Vídeo.
- A navegação compacta do PR continua com composição vertical, faixa horizontal rolável, rótulos visíveis e alvos de 44 px. Nenhum DOM, evento de entrada ou comportamento do jogo foi alterado.
- Arquivos de código/teste afetados: `NimboXcloud.user.js`, `tests/panel-layout.test.cjs`, `tests/nx-panel-regression.test.cjs`. Este registro atualiza somente o roadmap; `CHANGELOG.md` permanece inalterado.

### Referências pesquisadas
1. [Android Developers — Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns): navegação primária adaptativa; barra com três a cinco destinos, rail em telas grandes e drawer quando há mais destinos.
2. [Apple Developer — Explore navigation design for iOS (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/10001/): tabs devem representar seções de nível superior, significativas e descritivas.
3. [IBM Carbon — Global header](https://www.carbondesignsystem.com/building-blocks/core/patterns/global-header): header persistente para orientação e painel lateral quando a navegação exige mais níveis.
4. [W3C — WCAG 2.2, Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum): mínimo AA de 24 × 24 CSS px, sujeito às exceções documentadas. Os alvos de 44 px adotados no rail são uma escolha mais confortável, não uma declaração de conformidade integral.
   
Foram extraídos padrões de navegação e acessibilidade; nenhum asset ou código dessas fontes foi copiado. A faixa horizontal atual é uma solução intermediária: com oito páginas de configuração, deve ser reavaliada frente à orientação Android de três a cinco destinos em barras compactas.

### Testes e evidências
- Workflow final [Baseline — 43766374990](https://github.com/breno-bgod/NimboXcloud/actions/runs/43766374990): PASS.
- Sintaxe do userscript principal e do módulo Touch: PASS.
- Suíte: 406 testes, 403 PASS, 0 FAIL, 3 TODO preexistentes.
- Relatório estático de riscos: PASS.
- Testes acrescentados/ajustados verificam família Mobile, navegação compacta, localização dos presets, resolução em Estatísticas e preservação dos nove IDs. O teste de regressão também confirma que Stream contém os presets e Vídeo não os duplica.
- As primeiras execuções de CI revelaram duas expectativas de teste antigas e, depois, uma inicialização ausente do builder de Estatísticas no harness. Foram corrigidas apenas as expectativas/harness; a execução final acima passou.
- Não houve teste manual em Chrome/Edge, Playwright, Android, DeX, rotação, fullscreen ou sessão real. CI não comprova a aparência em dispositivo.
- Não foi encontrada configuração de bitrate; o valor recebido é métrica de Estatísticas, não um controle de limite. Nenhum bug funcional foi corrigido nesta frente.

### Riscos e pendências
- `Entradas` ainda reúne as três famílias; a arquitetura final precisa expor Mobile, Joypad e Teclado e Mouse sem perder o seletor único dos cinco modos.
- Vídeo e Áudio ainda são páginas separadas. A futura composição deve reutilizar os builders existentes sem duplicar opções.
- O perfil Auto/Desktop/Celular está em Vídeo apesar de alterar a experiência geral da interface; avaliar transferência para Gerais.
- “Gerais” atualmente contém apenas aparência do painel. Não criar opções universais fictícias.
- `docs/PAINEL_ORGANIZADO.md` ainda descreve a organização histórica 4.13.2 e contém afirmações que não refletem todos os builders atuais; precisa ser reconciliado em tarefa documental visual própria.
- A navegação compacta horizontal pode ficar extensa com a taxonomia final. Avaliar drawer/overflow acessível em vez de reduzir rótulos a ícones sem identificação.
- Nenhuma alteração de lógica, input, Gamepad API, sensores funcionais, storage, rede, autenticação, sessão, WebRTC, streaming ou telemetria foi feita.

### Próxima tarefa visual única — P1: matriz final das nove categorias e destino do seletor global
Critérios de aceite:
1. Inventariar cada grupo e linha dos builders atuais e atribuir exatamente uma categoria principal.
2. Definir Mobile, Joypad e Teclado e Mouse como destinos claros, mantendo HUDs e editores touchscreen em Mobile e dispositivos físicos nas categorias próprias.
3. Reunir qualidade solicitada, servidores e rede em Stream; manter bitrate recebido e demais métricas em Estatísticas.
4. Agrupar Vídeo e Áudio sem duplicar controles; manter Remote Play explicitamente experimental.
5. Separar Estatísticas de Desenvolvedor/Avançado e manter Gerais restrito a preferências universais reais.
6. Definir um único local persistente para o seletor dos cinco modos, sem cópias por categoria.
7. Preservar todos os IDs, aliases, callbacks, storage keys, valores, defaults e comportamentos.
8. Criar testes sobre os builders reais que comprovem ausência de opções duplicadas e de opções inacessíveis antes de implementar a nova navegação.


## Execução visual — 2026-11-16 — rótulos da navegação compacta em telas estreitas

### Base e rastreabilidade
- HEAD inicial/final consultado de `main` antes da atualização documental: `5ba8943eedb83b0735dc7afe1cb20276fa7fcde3`. Nenhuma alteração direta em `main`.
- Branch visual: `automation/visual-mobile-nav-2026-11-14`.
- HEAD inicial desta execução na branch: `8e4d73559d8719f8b6a2476e63c79f868942699e`.
- HEAD de código/testes desta execução: `a1ead2a3aa70c2b6e8e0bc19f041742720875ff4`.
- Versão pública lida: Alpha `0.0.1`; `CHANGELOG.md` foi consultado e permaneceu inalterado.
- PR visual único: [#35](https://github.com/breno-bgod/NimboXcloud/pull/35), base `main`, mantido em rascunho.
- Arquivos de código/teste: `NimboXcloud.user.js` e `tests/panel-layout.test.cjs`. Este registro atualiza apenas o roadmap.

### Auditoria e descoberta
- A navegação compacta usa uma faixa horizontal rolável em viewports de até 640 px.
- A regra adicional de até 480 px escondia os rótulos dos destinos e deixava somente ícones. Isso contradizia a intenção de manter os nomes visíveis e reduzia a descoberta das categorias.
- O teste anterior verificava a regra de exibição em até 640 px, mas não verificava a sobrescrita em até 480 px; portanto, não detectava a regressão de rótulos ocultos.
- O painel tem nove destinos atuais, contando Início, e o fechamento da faixa. A taxonomia final de categorias ainda não foi implementada.

### Alteração visual
- Removida a regra que ocultava os rótulos em até 480 px.
- Mantidos ícone e nome visível em cada destino. Em telas estreitas, os botões de categoria usam largura entre 64 e 84 px e texto de 9 px, com altura da faixa de 64 px.
- A rolagem horizontal permanece como mecanismo de acesso aos destinos que não cabem simultaneamente; nenhum destino foi removido ou abreviado.
- O teste de layout agora verifica explicitamente a regra de até 480 px e falha se os rótulos voltarem a receber `display:none`.
- Alteração restrita a CSS de apresentação e teste estático. Nenhum handler, evento, callback, builder, ID, alias, storage key, valor, default, estado ou comportamento de entrada foi modificado.

### Referências pesquisadas
1. [Android Developers — Layouts and navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns): navegação adaptativa; rail é apropriado em janelas maiores e padrões secundários não devem substituir a navegação primária.
2. [Microsoft Fluent 2 — Nav](https://fluent2.microsoft.design/components/web/react/core/nav/usage): navegação breve, linguagem simples e fácil de percorrer visualmente.
3. [W3C — WCAG 2.2](https://www.w3.org/TR/wcag/): referência de acessibilidade para foco, navegação e tamanho de alvos. Os 44 px usados no painel são uma escolha de conforto; o critério Target Size (Enhanced) é nível AAA, não uma alegação de conformidade AA.
- Foram extraídos princípios; nenhum asset, componente ou código foi copiado.

### Testes e resultados
- [GitHub Actions — NimboXcloud baseline, run 43963729711](https://github.com/breno-bgod/NimboXcloud/actions/runs/43963729711): PASS.
- Sintaxe de `NimboXcloud.user.js`: PASS.
- Sintaxe de `modules/NimboXcloud-Touch-HUD.user.js`: PASS.
- Suíte: 406 testes, 403 PASS, 0 FAIL, 3 TODO.
- Relatório estático de riscos: PASS. Foram reportados quatro padrões já existentes (Gamepad override, XHR override e fetch override); o relatório é correspondência estática e não demonstra falha em execução. Não foram alterados nesta frente.
- Não houve teste manual em Chrome, Edge, Android, DeX, fullscreen, rotação ou sessão real. A aprovação do CI não comprova a legibilidade visual em cada largura física.

### Riscos e pendências
- Em telas muito estreitas, os rótulos continuam visíveis, mas alguns destinos exigem rolagem horizontal. Isso é uma solução intermediária, não a arquitetura final.
- A faixa atual ainda tem mais destinos do que cabem simultaneamente em 320–480 px. Não reduzir os nomes a ícones nem adicionar um menu alternativo antes de definir a taxonomia final.
- A matriz das categorias ainda precisa resolver Mobile, Joypad e Teclado e Mouse como destinos próprios, agrupar Vídeo e Áudio, e determinar o destino único do seletor global dos cinco modos.
- Nenhum bug funcional foi corrigido ou investigado nesta execução.

### Próxima tarefa visual única — P1: matriz definitiva das categorias e destino do seletor global
Critérios de aceite:
1. Inventariar cada grupo e linha dos builders atuais, com finalidade, público e dependências, e atribuir exatamente uma categoria principal.
2. Definir Mobile, Joypad e Teclado e Mouse como destinos próprios sem mover mecanismos touchscreen para categorias físicas.
3. Reunir qualidade solicitada, servidores e rede em Stream; manter qualidade recebida e métricas em Estatísticas.
4. Agrupar Vídeo e Áudio sem duplicar controles e manter Remote Play identificado como experimental.
5. Separar Estatísticas de Desenvolvedor/Avançado e manter Gerais restrito a preferências universais existentes.
6. Definir um único local persistente para o seletor dos cinco modos, sem cópias por categoria nem perda de acesso.
7. Preservar IDs, aliases, callbacks, storage keys, valores, defaults e comportamento.
8. Criar testes dos builders reais para ausência de duplicação e inacessibilidade antes de alterar a navegação principal.


## Execução visual — 2026-11-17 — consistência dos rótulos e atalhos da página inicial

### Base e reconciliação
- Releitura direta do GitHub antes da alteração: `main` permaneceu em `5ba8943eedb83b0735dc7afe1cb20276fa7fcde3`; nenhuma gravação foi feita em `main`.
- Branch visual: `automation/visual-mobile-nav-2026-11-14`; HEAD inicial desta execução: `4c7b531c21c2f6d4285645390abc628f3fc65c11`.
- HEAD final do código e dos testes desta execução: `4a2b9d5d3d5e9d294bad0433e1baad78d261ee47`; o resultado de CI foi verificado antes deste registro documental.
- PR #35 permaneceu aberto, em rascunho, base `main`, sem merge e sem divergência. A branch e o HEAD do PR foram conferidos novamente imediatamente antes de criar o commit.
- Versão pública observada: Alpha `0.0.1`. `CHANGELOG.md` foi relido (blob `6e3ddc67cbb90258c45c65c8701ce2bf79af3185`) e não foi alterado.
- Blobs lidos antes da mudança: userscript `225b243eeacaf3614150c606b0d1374992bdda91`, teste de layout `c23415fa3f8029537a718059c8c41f33fbb5727b`, roadmap `8a11a7e892943fd56306c0ad81fef35112d779cc`.

### Inventário e classificação
- Mobile: modos touchscreen, HUDs virtuais, editores, giroscópio do smartphone e touchpad; os controles correspondentes já ficam dentro da família Mobile em Entradas.
- Joypad: dispositivos físicos reconhecidos, perfis de analógico, vibração e atalho do gamepad.
- Teclado e Mouse: captura/Pointer Lock físico e atalho; o teclado/mouse virtual por toque permanece em Mobile.
- Stream: presets existentes, servidores/data center e rede; nenhum controle real de bitrate foi identificado.
- Vídeo e Áudio: continuam em páginas distintas; vídeo inclui enquadramento e processamento local de imagem, áudio inclui saída/equalização e entrada de microfone.
- Estatísticas: monitor, FPS, bitrate recebido, RTT, jitter, perda, decodificação e resolução recebida.
- Remote Play: página separada e explicitamente experimental; a qualidade 720p/1080p/1080p-HQ pertence à futura sessão xHome e não foi confundida com Stream.
- Desenvolvedor/Avançado: compatibilidade, relatórios e diagnóstico técnico.
- Gerais: aparência do painel; não foi encontrado seletor de idioma. O perfil Auto/Desktop/Celular permanece em Vídeo e requer decisão na matriz, pois combina preferência de apresentação e perfil de sessão.
- A navegação principal ainda tem nove destinos contando Início. Mobile, Joypad e Teclado e Mouse são subfamílias dentro de Entradas, não destinos primários independentes. O seletor único dos cinco modos e a recuperação Automático do Xbox também permanecem nessa página.

### Melhoria visual aplicada
- Os atalhos da página Início agora usam os mesmos rótulos visíveis das páginas de destino: `Stream`, `Entradas`, `Gerais` e `Avançado`.
- A família física `gamepad` é apresentada como “Joypad”; a família `keyboard` como “Teclado e Mouse”; a família touchscreen como “Mobile”, inclusive no rótulo acessível da prévia.
- O resumo de Entradas na página inicial explicita as três famílias, sem sugerir que HUD touchscreen seja um controle físico.
- O texto do grupo de sistema distingue aparência geral de ferramentas técnicas.
- Alterações somente em textos/rótulos existentes. Os identificadores internos `keyboard`, `gamepad`, `mobile`, os IDs dos atalhos, `setTab`, builders, aliases legados, callbacks, storage keys, valores, defaults e comportamentos foram preservados.
- Nenhum novo controle, destino ou opção funcional foi criado; não houve alteração de CSS, handlers ou lógica de entrada.

### Arquivos desta execução
- `NimboXcloud.user.js`: rótulos de apresentação dos atalhos e das famílias de entrada.
- `tests/panel-layout.test.cjs`: teste estático para consistência de rótulos e preservação das rotas legadas.
- `DEVELOPMENT_ROADMAP.md`: este registro.
- `CHANGELOG.md`: sem alteração, pois não houve novo lançamento nem mudança funcional.

### Referências pesquisadas
1. [Microsoft Fluent 2 — Nav](https://fluent2.microsoft.design/components/web/react/core/nav/usage): navegação deve ser curta, escaneável, com linguagem simples e taxonomia consistente; recomenda drawer sobre conteúdo em telas estreitas.
2. [Microsoft Fluent 2 — Content Design](https://fluent2.microsoft.design/content-design/): títulos, descrições e rótulos devem ser concisos e deixar decisões e próximos passos claros.
3. [IBM Carbon — Global header](https://www.carbondesignsystem.com/building-blocks/core/patterns/global-header): separar navegação do produto de funções de sistema e manter locais consistentes para as funções globais.
4. [IBM Carbon — Accessibility](https://www.carbondesignsystem.com/building-blocks/foundations/accessibility/developers): hierarquia semântica e ordem lógica de foco para navegação por teclado e tecnologias assistivas.
- Foram extraídos padrões de nomenclatura, consistência e hierarquia; nenhum asset ou código foi copiado.

### Testes, riscos e limitações
- GitHub Actions [NimboXcloud baseline — run 44190595762](https://github.com/breno-bgod/NimboXcloud/actions/runs/44190595762): conclusão `success` no commit `4a2b9d5d3d5e9d294bad0433e1baad78d261ee47`.
- Sintaxe de `NimboXcloud.user.js`: PASS; sintaxe de `modules/NimboXcloud-Touch-HUD.user.js`: PASS; relatório estático de riscos: PASS.
- Suíte executada: 407 testes, 404 aprovados, 0 falhas e 3 TODO preexistentes.
- O runner também emitiu aviso de depreciação do runtime Node 20 usado por `actions/checkout@v4` e `actions/setup-node@v4`, forçado para Node 24 no runner. O workflow concluiu com sucesso; a atualização das actions fica como manutenção de CI fora desta frente visual.
- A pipeline disponível executa `node --check` nos dois userscripts, `node --test tests/*.test.cjs tests/*.test.mjs` e `tools/static-risk-report.cjs`.
- Não foi executado teste manual em Chrome/Edge, Playwright, Android, DeX, fullscreen ou sessão real. CI não valida composição visual em dispositivo.
- A mudança deliberadamente não divide as três famílias em destinos principais: `nxCanonicalTab` e `setTab` tratam os aliases `gamepad` e `gyrotouch` como rotas para `inputs`; alterar isso exige matriz e testes de caracterização para preservar a única seleção de modo e todas as opções acessíveis.
- A página inicial ainda apresenta grupos agregados (Conexão, Entradas e controles, Sistema e interface); a taxonomia final permanece pendente.
- Nenhum bug funcional foi corrigido ou avaliado nesta execução.

### Próxima tarefa visual única — P1: matriz executável das nove categorias e posição única do seletor de entrada
Critérios de aceite:
1. Inventariar cada grupo e linha dos builders reais, registrando finalidade, público e dependências, com exatamente uma categoria primária por opção.
2. Definir os destinos primários Mobile, Joypad e Teclado e Mouse sem duplicar builders ou controles.
3. Definir um único local persistente para os cinco modos atuais e a recuperação Automático, mantendo `NX_INPUT_MODE_KEY`, callbacks e comportamento.
4. Reunir qualidade solicitada, servidores e rede em Stream; manter métricas recebidas em Estatísticas.
5. Agrupar Vídeo e Áudio sem duplicar opções; manter Remote Play separado e experimental.
6. Separar métricas gerais de diagnóstico técnico; deixar Gerais restrito a preferências universais comprovadas.
7. Preservar todos os IDs, aliases, storage keys, valores, defaults, eventos e rotas de recuperação.
8. Adicionar testes dos builders reais que provem unicidade e acessibilidade das opções antes de alterar a navegação principal.


## Execução visual — 2026-11-18 — largura progressiva do painel em desktop

### Base consultada e reconciliação
- `main` foi relida diretamente do GitHub: HEAD `5ba8943eedb83b0735dc7afe1cb20276fa7fcde3`. Nenhuma gravação direta em `main`.
- Branch visual `automation/visual-mobile-nav-2026-11-14`: HEAD inicial desta execução `665ea1e744cf1b1df48ea2601f29ebea3cd7bc5d`; HEAD após a alteração de código/testes `ac3e16763a40deac8536e46ceee67041fd730a5e`.
- PR [#35](https://github.com/breno-bgod/NimboXcloud/pull/35) foi relido antes da gravação: aberto, em rascunho, base `main`, base SHA `5ba8943eedb83b0735dc7afe1cb20276fa7fcde3`, sem divergência. Permanece sem merge.
- Versão observada nos metadados do userscript: Alpha `0.0.1`.
- Blobs consultados nesta etapa: userscript inicial `2125c99dad3ae1032f9b431643454c97bb1b914a`; teste inicial `7590f0e271736aa73ac44a5cd72264303084e7b9`; roadmap antes desta entrada `92354102fb3fa6cdbf6b33bbba74ba029aced8f7`.
- `CHANGELOG.md` foi relido na branch e em `main`; blob `6e3ddc67cbb90258c45c65c8701ce2bf79af3185` em ambos. Não há novo lançamento e o arquivo não foi alterado.
- O histórico recente foi revisado: o último commit da branch anterior a esta tarefa era documental (`665ea1e...`), e a branch mantinha 13 commits à frente de `main`. A árvore do repositório e os componentes de painel/testes foram consultados antes da implementação.
- Antes de gravar o código, `main`, HEAD da branch, HEAD do PR e conteúdos/blob SHA dos dois arquivos foram lidos novamente. A atualização do ref usou compare-and-swap com o HEAD esperado; nenhuma alteração concorrente foi sobrescrita.

### Inventário e arquitetura de informação revisados
A navegação continua com nove destinos (Início + oito páginas de configuração). Esta execução não altera a taxonomia nem move builders:
- **Mobile:** seletor da família touchscreen, HUD virtual de gamepad, HUD virtual de teclado/mouse, editores, giroscópio do smartphone, touchpad e sensibilidade.
- **Joypad:** controle físico conectado, perfis de analógico, vibração e atalho. Não foi encontrado remapeamento funcional A/B/X/Y nem editor de layout de gamepad físico.
- **Teclado e Mouse:** ajustes dos dispositivos físicos, captura/Pointer Lock e atalho. O HUD virtual de teclado/mouse continua em Mobile; não foram encontrados macros funcionais.
- **Stream:** presets de qualidade solicitada, servidores/data center e rede. Bitrate recebido continua sendo métrica, não foi encontrado controle configurável de bitrate.
- **Vídeo e Áudio:** ainda são páginas separadas. Vídeo contém enquadramento e processamento local de imagem; Áudio reúne microfone, saída, volume/equalização e controles existentes.
- **Estatísticas:** monitor, FPS, bitrate recebido, RTT, jitter, perda, dados de decodificação e resolução recebida.
- **Remote Play:** página própria, experimental e sem homologação com console físico; seus perfis de qualidade futura xHome não são presets do Stream do xCloud.
- **Desenvolvedor/Avançado:** compatibilidade, relatórios e diagnósticos técnicos. Não foram introduzidos dados sensíveis.
- **Gerais:** aparência do painel. Não foi encontrado seletor de idioma; `navigator.language` permanece dado observacional, não preferência editável.
- O seletor único dos cinco modos de entrada e a recuperação Automático do Xbox continuam em Entradas. `nxCanonicalTab` ainda resolve aliases legados para essa página; o destino global definitivo permanece pendente da matriz.

### Alteração visual desta execução
- O painel de configurações em viewports a partir de 761 px passa a usar largura progressiva limitada entre 360 e 440 px: `clamp(360px, calc(50vw - 40px), 440px)`.
- A regra é aplicada tanto ao invólucro do painel quanto à superfície `role="dialog"`, evitando que o limite inline antigo de 360 px corte a expansão.
- A página Entradas foi explicitamente excluída dessa regra: mantém sua largura especializada de até 1040 px e seu workspace em duas colunas quando o espaço permite.
- As regras mobile até 640 px e estreitas até 480 px permanecem sem alteração; navegação horizontal, rótulos visíveis e alvos existentes foram preservados.
- Motivação: no desktop, o rail lateral ocupa aproximadamente 126 px dentro da largura antiga de 360 px; a área útil de conteúdo ficava estreita para descrições e controles. A expansão gradual melhora leitura sem transformar o painel em uma janela de largura irrestrita.
- Arquivos alterados nesta execução: `NimboXcloud.user.js` (somente CSS em `nxWorkspaceStyle`) e `tests/panel-layout.test.cjs` (teste estático do limite progressivo e da exclusão da página Entradas). Nenhum markup, builder, ID, alias, callback, evento, storage key, valor ou default foi modificado.
- Não houve alterações em input/gameplay, Gamepad API, handlers de toque/teclado/mouse, sensores, persistência, rede, autenticação, sessão, WebRTC, transporte, streaming ou telemetria.

### Referências pesquisadas
1. [Microsoft Fluent 2 — Drawer](https://fluent2.microsoft.design/components/web/react/core/drawer/usage): drawer como superfície secundária; distinguir modo overlay/inline, limitar a largura e preservar rolagem no corpo.
2. [Microsoft Fluent 2 — Layout](https://fluent2.microsoft.design/layout): classes de viewport e adaptação responsiva por espaço disponível; referência para manter uma transição explícita entre larguras compactas e desktop.
3. [Microsoft Fluent 2 — Nav](https://fluent2.microsoft.design/components/web/react/core/nav/usage): navegação de painel com rótulos claros, comportamento overlay em larguras estreitas e hierarquia curta.
4. [IBM Carbon — UI Shell left panel accessibility](https://www.carbondesignsystem.com/building-blocks/core/components/ui-shell-left-panel/accessibility): ordem de foco, interação por teclado e apresentação sobreposta em telas menores.
5. [IBM Carbon — UI Shell left panel usage](https://v10.carbondesignsystem.com/components/UI-shell-left-panel/usage): painel lateral para conjuntos maiores de destinos e limitação de níveis de navegação.
- Foram extraídos padrões de largura adaptativa, rolagem e navegação; nenhum asset, código ou componente proprietário foi copiado.

### Testes e evidências
- GitHub Actions [NimboXcloud baseline — run 44406565968](https://github.com/breno-bgod/NimboXcloud/actions/runs/44406565968), commit `ac3e16763a40deac8536e46ceee67041fd730a5e`: conclusão `success`.
- Etapas `Syntax check`, `Touch HUD module syntax check`, `Baseline tests` e `Static risk report` concluídas com sucesso.
- Resultado do Node test runner extraído dos logs: 408 testes contabilizados, 405 aprovados, 0 falhas e 3 TODO preexistentes (testes que dependem de navegador real/sessão xCloud).
- Sintaxe de `NimboXcloud.user.js` e `modules/NimboXcloud-Touch-HUD.user.js`: PASS. Relatório estático de riscos: PASS.
- O novo teste confirma que a regra progressiva desktop existe, é limitada a 360–440 px e não substitui a regra especializada da página Entradas.
- Não foi executado teste manual em Chrome/Edge, Playwright, Android, DeX, fullscreen, tablet físico ou sessão real. CI e teste estático não comprovam o encaixe visual, a legibilidade em todos os tamanhos nem a área de jogo coberta pelo painel.

### Riscos e pendências
- O painel continua sendo uma superfície sobre o jogo; a largura máxima maior pode cobrir até 80 px adicionais do conteúdo em desktop. A expansão é limitada a 440 px e não altera o layout do jogo, mas requer inspeção visual.
- A regra não afeta `data-nx-page=inputs`; essa página mantém composição especializada. Os breakpoints mobile não foram alterados.
- A navegação ainda não expõe Mobile, Joypad e Teclado e Mouse como páginas primárias. Vídeo e Áudio continuam separados. Não foi feita divisão porque o seletor único e aliases legados ainda exigem matriz de destinos e testes de caracterização.
- Nenhum bug funcional foi corrigido ou investigado nesta execução.

### Próxima tarefa visual única — P1: matriz definitiva das nove categorias e destino único do seletor de entrada
Critérios de aceite:
1. Inventariar cada grupo e linha dos builders existentes, registrando finalidade, público e dependências, e atribuir exatamente uma categoria principal.
2. Definir Mobile, Joypad e Teclado e Mouse como destinos claros, mantendo todo mecanismo touchscreen e seus editores em Mobile.
3. Definir um único local persistente para os cinco modos e a recuperação Automático do Xbox, sem criar seletores duplicados nem perda de acesso.
4. Reunir qualidade solicitada, servidores e rede em Stream; manter resolução/bitrate recebidos e métricas em Estatísticas.
5. Agrupar Vídeo e Áudio sem duplicar opções; manter Remote Play separado e explicitamente experimental.
6. Separar métricas gerais de Desenvolvedor/Avançado e manter Gerais restrito a preferências universais comprovadas.
7. Preservar IDs, aliases, callbacks, storage keys, valores, defaults, eventos e comportamento.
8. Criar testes sobre os builders reais que comprovem unicidade e acessibilidade das opções antes de alterar a navegação principal.


## Execução visual — 2026-11-19 — simplificação do Início em lista leve

### Base, versão e rastreabilidade
- `main` consultada no início e novamente antes do registro: `5ba8943eedb83b0735dc7afe1cb20276fa7fcde3`; permaneceu inalterada.
- Branch visual: `automation/visual-mobile-nav-2026-11-14`; PR [#35](https://github.com/breno-bgod/NimboXcloud/pull/35), aberto, em rascunho, base `main`, sem merge.
- HEAD da branch no início desta execução: `f509b81d3636321a7ddcd74b51a493441d117703`.
- HEAD do código/testes após esta melhoria: `5106a87708634c93f3bd5daad4cd5d23b38acc7c`; comparação com `main`: 16 commits à frente, 0 atrás.
- Userscript Alpha `0.0.1`, blob atualizado `08b3af2d75a7ea230ac530a3c4bfd43972afd435`; módulo Touch `1.4.1`.
- `CHANGELOG.md` foi lido novamente e não foi alterado: nenhuma versão pública foi lançada nesta execução.

### Auditoria real das categorias
A navegação tem oito páginas de configuração mais Início. A taxonomia solicitada ainda não existe integralmente; a classificação abaixo foi conferida contra `TABS`, `TAB_BUILDERS`, `nxInputModePage`, os compositores legados e os dois userscripts.

| Categoria-alvo | Recursos efetivamente encontrados | Lacunas/decisões |
| --- | --- | --- |
| Mobile | Família touchscreen; controle virtual; teclado/mouse virtuais; dois editores de HUD existentes; giroscópio do smartphone; touchpad e suas três sensibilidades | Os dois editores pertencem a Mobile mesmo que uma HUD contenha teclas/mouse |
| Joypad | Controle físico conectado; perfis de analógico; teste de vibração; combinação de botões para abrir o próprio painel | A combinação é atalho do painel, não remapeamento de botões do jogo. Não foi encontrado remapeamento A/B/X/Y nem editor de layout físico |
| Teclado e Mouse | Captura de mouse físico/Pointer Lock; atalhos F8, F2 ou desativado; combinação de teclado para abrir o painel | Atalhos são do painel/captura, não mapeamento de teclas do jogo. Não foram encontrados macros funcionais |
| Stream | Presets reais Máximo e Padrão; servidores, data center, rede, preferência por conexão medida e IPv4 | Não há controle configurável de bitrate neste userscript; bitrate recebido é métrica |
| Vídeo e Áudio | Vídeo: perfil do dispositivo, enquadramento, brilho, contraste, saturação, perfis locais e processamento GPU. Áudio: microfone, volume, saída e processamento/equalização existentes | As páginas ainda são separadas. Não foram encontrados controles de FSR/HDR |
| Estatísticas | NX Stream Monitor e métricas de FPS, RTT, jitter, perda, bitrate recebido, resolução, codec, decodificação e quadros descartados | Manter métricas fora do diagnóstico técnico; não alterar coleta ou cálculos |
| Remote Play | Descoberta xHome, informação de console, sessão/mídia e diagnósticos; qualidade futura 720p/1080p/1080p-HQ | Permanece experimental e sem homologação com console físico. Controles contextuais de sessão não são um segundo editor de HUD |
| Desenvolvedor/Avançado | Compatibilidade, identidade observacional de browser/cliente, relatório de protocolo, diagnóstico técnico de entradas, sistema e logs | “Editor de HUD — prévia arrastável” é explicitamente uma prévia que não controla o jogo; não deve ser apresentada como editor funcional nem deslocada para Mobile/Joypad |
| Gerais/universais | Aparência do painel NX: transparência, tom de fundo, cor de texto/ícones e restauração | Não foi encontrada preferência de idioma. Auto/Desktop/Celular continua em Vídeo embora influencie a experiência geral; avaliar na matriz antes de mover |

O seletor único continua dentro de Entradas e apresenta cinco modos: teclado/mouse físicos, controle físico, teclado/mouse virtuais, controle virtual e toque nativo. A recuperação `Automático do Xbox` também está ali. Nenhuma cópia foi criada. A separação das três famílias em categorias de primeiro nível exige decidir primeiro onde ficará esse seletor único.

### Melhoria visual implementada
- A página Início tinha cinco grupos de atalhos em cartões independentes com bordas, raio, fundos e espaçamentos repetidos. A informação era uma lista de destinos relacionados, mas a composição tratava cada grupo como um cartão separado.
- Os cinco cartões passaram a uma lista leve com divisores horizontais discretos; o resumo de conexão também deixou o cartão preenchido e passou a usar separador.
- Cabeçalhos de grupo mantêm altura mínima de 52 px; destinos internos, 44 px. Os itens filhos alinham-se ao texto do grupo em vez de repetir recuo lateral de cartão.
- A hierarquia, ícones, rótulos, grupos recolhíveis, `aria-expanded`, listeners e chamadas `setTab(link[0])` foram preservados. A alteração foi feita em strings de estilo dentro do builder visual de Início.
- Não foram alterados IDs, aliases, builders de configurações, callbacks, armazenamento, valores, defaults, eventos, Gamepad API, pointer/touch/keyboard/mouse, sessão, rede, streaming ou telemetria.
- Arquivos de código/teste: `NimboXcloud.user.js` e `tests/panel-layout.test.cjs`. Este registro altera somente `DEVELOPMENT_ROADMAP.md`; `CHANGELOG.md` permanece intacto.

### Referências pesquisadas em 2026-11-19
1. [Microsoft Fluent 2 — List](https://fluent2.microsoft.design/components/web/react/core/list/usage): listas verticais ajudam a escanear e acessar itens relacionados; estruturas hierárquicas devem continuar explícitas.
2. [Microsoft Fluent 2 — Layout](https://fluent2.microsoft.design/layout): proximidade e espaço em branco podem comunicar relações sem cercar cada grupo com uma caixa; a escala global usa unidade-base de 4 px.
3. [Microsoft Fluent 2 — Divider](https://fluent2.microsoft.design/components/web/react/core/divider/usage): divisores block/inset criam ritmo e distinção, com margens próprias; neste painel foi usada uma borda CSS discreta, não um componente copiado.
4. [Microsoft Fluent 2 — Accessibility](https://fluent2.microsoft.design/accessibility): hierarquia de títulos, foco e navegação por teclado devem permanecer previsíveis.
- Foram extraídos princípios de listas, espaçamento e divisores. Nenhum código, componente, asset ou ilustração dessas referências foi copiado.

### Testes e resultados
- [GitHub Actions — Baseline #44621083014](https://github.com/breno-bgod/NimboXcloud/actions/runs/44621083014): concluído com sucesso.
- Verificação de sintaxe de `NimboXcloud.user.js`: PASS.
- Verificação de sintaxe de `modules/NimboXcloud-Touch-HUD.user.js`: PASS.
- Suíte: 409 testes, 406 PASS, 0 FAIL, 3 TODO preexistentes.
- O teste novo `home shortcuts use a lightweight list with comfortable targets and preserve routing` foi incluído e aprovado; verifica a remoção do tratamento de cartões, alturas mínimas e preservação de `aria-expanded`, alternância de detalhes e roteamento.
- Relatório estático de riscos: executado. Registrou quatro padrões existentes (duas substituições de Gamepad API, um override de XHR e um override de fetch); esta alteração não tocou esses trechos. O relatório é correspondência estática e não prova falha em execução.
- Warnings não bloqueantes do runner: aviso de depreciação de ações que ainda usam Node 20 e aviso do módulo `punycode`. Nenhum workflow/CI foi alterado por estarem fora do escopo visual.
- Não houve teste manual em Chrome/Edge, Playwright, Android, DeX, rotação, fullscreen ou sessão real. O CI valida sintaxe/testes automatizados, não aparência em dispositivos.

### Riscos e pendências
- A navegação principal ainda tem Entradas como uma única página com três famílias. O seletor de cinco modos e `Automático do Xbox` devem continuar únicos e acessíveis após qualquer divisão.
- Vídeo e Áudio ainda são páginas separadas; a futura composição deve reutilizar os mesmos nós/builder sem duplicar controles.
- O perfil Auto/Desktop/Celular está em Vídeo, embora altere apresentação geral da interface; precisa de análise semântica antes de ir para Gerais.
- Gerais atualmente contém apenas aparência. Nenhum seletor de idioma foi localizado.
- `docs/PAINEL_ORGANIZADO.md` está desatualizado (cabeçalho 4.13.2) e descreve páginas/organização anteriores; reconciliar após a matriz final para não documentar um desenho ainda não implementado.
- A lista do Início mantém disclosures existentes; esta mudança não transforma os grupos em novos destinos nem altera seus callbacks.
- Nenhuma alteração de comportamento foi feita nesta frente.

### Próxima tarefa visual única — P1: matriz definitiva das nove categorias e localização única do seletor
Critérios de aceite:
1. Inventariar cada grupo e linha real dos builders, atribuindo cada opção a exatamente uma categoria principal.
2. Separar Mobile, Joypad e Teclado e Mouse como destinos claros sem criar editores ou opções inexistentes; os dois editores touchscreen e giroscópio/touchpad do smartphone ficam em Mobile.
3. Definir um único local persistente para os cinco modos e `Automático do Xbox`, mantendo todos os modos acessíveis sem seletor duplicado em cada categoria.
4. Manter servidores, rede e qualidade solicitada em Stream; bitrate/resolução recebidos e demais métricas em Estatísticas.
5. Agrupar Vídeo e Áudio reaproveitando os builders atuais, sem duplicar linhas nem callbacks; avaliar o perfil Auto/Desktop/Celular com evidência.
6. Manter Remote Play separado e identificado como experimental; distinguir Estatísticas gerais de Desenvolvedor/Avançado.
7. Classificar somente preferências universais reais em Gerais; não inventar idioma.
8. Atualizar `docs/PAINEL_ORGANIZADO.md` para refletir apenas a arquitetura aprovada.
9. Antes de alterar navegação, criar testes de caracterização sobre builders reais comprovando unicidade, acesso de todas as opções, aliases/rotas e preservação dos IDs, storage keys, callbacks, valores e defaults.
