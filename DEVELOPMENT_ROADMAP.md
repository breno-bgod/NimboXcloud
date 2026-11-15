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
