# Avaliação comparativa e plano de atualização — NimboXcloud

Revisão: 2026-11-12. Base auditada: `863cb5c8f9b4fe103acc64426021e092064245ff`, runtime 4.12.87. Ajustes desta revisão: 4.12.88.

## Direção de produto

Melhorar a acessibilidade e a personalização no novo `play.xbox.com`, preservando os sistemas próprios que já funcionam. Better xCloud é referência de experiência e engenharia; paridade integral não é requisito. O mantenedor relata funcionamento de vários sistemas, com destaque para o mouse por toque e troca de servidor. A revisão de código não substitui nem invalida esses relatos.

Não reescrever o projeto nem trocar o transporte de mouse por preferência arquitetural. JavaScript, instalação simples e nenhuma dependência nova neste lote. Mudanças amplas exigem diagnóstico, plano e critérios de regressão prévios.

## Evidência e limites

- Código e testes obtidos pela integração GitHub em revisão fixada, sem `git clone`.
- Lidos os dois userscripts, testes relevantes, workflows, arquitetura e decisões. A análise por subsistema não é uma certificação de cada linha do repositório.
- Referência Better xCloud: commit `ea4d19f2800cee9cfa387a0c9c37b3711cf208c7`.
- 204 testes locais: 201 aprovados, zero falhas, três TODO. Há testes estruturais e testes de execução com mocks; não são 201 testes de gameplay.
- Execução local: Node 24.22.1 com `--test-isolation=none`; CI usa Node 22 com isolamento padrão. A aprovação do CI do lote precisa ser registrada separadamente.
- Não houve sessão autenticada Xbox, medição de latência/bateria, comprovação de resolução superior a 1080p ou homologação de áudio/entrada em dispositivo real.

## Comparação por sistema

| Sistema | NimboXcloud observado | Referência Better xCloud | Decisão |
|---|---|---|---|
| Novo site | Alvo explícito `play.xbox.com` | README e issue #1028 informam trabalho para o site novo | Preservar adaptação própria; não copiar patches antigos sem verificar seus alvos |
| Mouse/teclado por toque | `NimboXboxTransport` usa `onVirtualMouseInput`, tradutor de teclado do SDK e canal da sessão; inclui WASD, botões configuráveis, editor e perfis | Upstream tem subsistemas de mouse/teclado e touch; equivalência ao mouse por dedo do Nimbo não foi demonstrada nesta revisão | Diferencial relatado pelo mantenedor; manter e ampliar cobertura de ciclo de vida |
| Toque nativo | Configuração nativa passa sem alteração; ativação do NimboTouch tem restauração limitada aos campos que controla | `TouchController`, gates e patches dependem do cliente antigo | Manter caminhos separados; testar troca de modo sem interferência |
| Joystick virtual | Implementação de dois analógicos e botões limitada ao adaptador xHome, conforme código/testes | Controles touch/customização presentes no upstream | Não anunciar joystick próprio para todo xCloud; investigar integração retail antes de ampliar |
| Controle físico | Ponte opt-in, giroscópio e perfis de eixos; testes de restauração e preservação de outro dono da API | Patch de customização mapeia botões, gatilhos e faixas radiais no objeto de entrada do cliente | Evoluir incrementalmente; não confundir zona morta de prévia com efeito comprovado no jogo |
| Macros/multiteclas | Bindings de HUD e manutenção de várias teclas por ponteiros; não foi identificado um motor geral completo de macros/remapeamento físico | Patch de customização consultado não demonstra equivalência completa ao reWASD | Tratar como evolução futura, não como defeito do mouse atual |
| Qualidade | xCloud oferece no código 1080p/Windows e HQ/Tizen; antes deste lote `resCfg()` ignorava a escolha e sempre retornava HQ | `getOsNameFromResolution` também usa Android/Windows/Tizen; SDP pode priorizar perfis H.264 e aplicar teto | Corrigir seleção; medir solicitação e recepção. Referência consultada não prova desbloqueio de >1080p |
| Bitrate | `bitrateCfg()` retorna Auto; tabelas legadas de 5–50 Mbps não constituem limite ativo | `patchSdpBitrate` escreve teto na negociação | Preservar automático; investigar controle opcional só com teste A/B |
| Servidores | Cinco REGIONS de mercado; SERVERS tem quatro datacenters nomeados mais Auto; preferência manual aceita identificador maiúsculo; fallback preserva alternativas | Login enumera `offeringSettings.regions` e complementa nomes com metadados | Priorizar catálogo dinâmico vindo da resposta real, sem fabricar endpoints nem confundir mercado com datacenter |
| Áudio | EQ de dez bandas, perfis, compressor, limitador, mono, balanço, bypass e roteamento de saída presentes | Material consultado não comprova EQ equivalente de dez bandas | Preservar implementação; revisar retorno neutro e troca de fonte antes de retomar conforme decisões |
| Microfone | Roteador de `getUserMedia` seleciona dispositivo e constraints, acompanha mute/PTT. Ganho/graves/agudos do teste são prévia local | Upstream integra estado/atalho de microfone ao ciclo de sessão | Distinguir captura, prévia processada e áudio realmente transmitido; comprovar caminho até o jogo |
| Estatísticas | FPS, RTT, bitrate, resolução, perda, codec, buffer, decode e overlay existentes | Coletor dedicado com deltas de bytes/tempo, resolução e dados de tráfego | Aproveitar monitor; corrigir unidades e casos de borda. FPS do stream não é FPS interno do jogo |

## Diagnósticos confirmados e ajustes 4.12.88

1. **Perfis sem efeito:** `resCfg()` retornava sempre HQ. Agora respeita `xcu.resolution`: `hq` solicita Tizen e `auto` solicita Windows. Sem preferência ou com valor desconhecido, mantém HQ. Não modifica a negociação já ativa; preferências antigas `auto` passam a ser respeitadas na próxima partida. Máximo restaura a solicitação HQ.
2. **Descrição divergente:** a linha de qualidade agora lê o perfil efetivo em vez de afirmar “1080p máxima disponível”; texto dos perfis explicita o comportamento. Equilibrado e Compatível continuam aliases para Windows, sem inventar diferença.
3. **Unidade ambígua:** cartão de bitrate usa Mbps, em vez de Mb.
4. **Perda negativa:** o contador WebRTC `packetsLost` pode ser negativo; o monitor passa a limitar a perda acumulada a zero, preservando perdas positivas.
5. **Smoke legado:** corrigido caminho inexistente e expectativas antigas de F9, toque e xHome, mantendo cobertura ainda pertinente. Incluídos testes comportamentais do coletor, preservação do toque e seleção de qualidade.
6. **Cobertura de CI:** ambos os workflows passam a incluir `*.test.mjs`, além de `*.test.cjs`.
7. **Teste portátil:** relatório estático executado em VM com captura do stdout, sem depender de subprocesso bloqueado neste ambiente. O corpo real do CLI e o formato JSON continuam verificados; o CLI também é executado pelo workflow.

Não alterados neste lote: transporte de mouse/teclado, HUD, protocolo xHome, áudio, microfone, servidores, Gamepad API, padrões IPv4 e região.

## Plano de atualização

### Lote 1 — Base verificável e seleção honesta (implementado nesta revisão)

Arquivos: `NimboXcloud.user.js`, `tests/smoke.test.mjs`, `tests/static-risk.test.cjs`, workflows e documentação.

Aceite automatizado: sintaxe dos scripts, metadados coerentes, escolha HQ/Windows, perda não negativa, deltas de QoS e suíte completa. Aceite de dispositivo pendente: abrir Streaming, selecionar perfil, iniciar nova partida e comparar qualidade solicitada/recebida. Confirmar início e mouse/toque sem regressão em ambos os perfis.

### Lote 2 — Catálogo de servidores da sessão (próxima prioridade recomendada)

1. Capturar nomes válidos de `offeringSettings.regions` sem persistir token ou resposta completa.
2. Separar catálogo de mercado/acesso do catálogo de datacenters na interface.
3. Preservar chaves antigas (`ejp`, `ckr`, `eus`, `weu`) e aceitar novas regiões realmente anunciadas.
4. Manter ordem/fallback do serviço quando a preferência não estiver disponível; indicar preferência e destino observado separadamente.
5. Testar Auto, Brasil quando anunciado, regiões novas, lista ausente, região removida, duplicação, resposta malformada e ausência de interceptação.

Locais: `SERVERS`, `srvCfg`, `rewriteRegions`, seletor NX e histórico RTT. Risco: quebra do login/seleção por assumir formato de API. Mitigação: observação primeiro, nenhuma criação de URL, fallback nativo. Ganho: acesso às regiões disponibilizadas àquela sessão, sem atualização manual do script.

### Lote 3 — Preservar e consolidar acessibilidade existente

1. Verificar mouse por toque, WASD, teclas personalizadas, perfis e restauração usando o transporte atual.
2. Cobrir simultaneidade: mover, mirar, disparar e usar outra tecla; duas superfícies com mesma tecla; cancelamento de ponteiro.
3. Testar perda de foco, fullscreen, menu nativo, desconexão, nova sessão e retorno do controle físico.
4. Corrigir apenas falhas reproduzidas; manter toque nativo disponível e estado de cada modo visível.
5. Só depois avaliar joystick virtual para xCloud retail; o adaptador xHome atual não prova compatibilidade retail.

Locais: `NimboXboxTransport`, `syncKeys`, controles/editor NimboTouch e ponte opt-in de gamepad. Risco: entrada presa ou disputa entre dispositivos. Mitigação: soltar estados antes de trocar proprietário e nunca transmitir a uma sessão antiga.

### Lote 4 — Qualidade medida e monitoramento

Comparar Windows e Tizen na mesma rede/dispositivo/jogo: resolução recebida, codec/perfil quando disponível, bitrate, FPS decodificado, RTT, perdas e decode. Registrar valores indisponíveis como indisponíveis, não zero inventado.

Depois avaliar prioridade H.264 via abordagem do upstream e filtros locais já existentes. Não anunciar CAS/FSR, >1080p ou FPS do jogo sem implementação e evidência. Acrescentar MB/s apenas se útil, com conversão Mbps/8 e rótulo separado; bitrate e “Mbps” não são duas medições diferentes.

Risco: perfil melhorar imagem e prejudicar toque ou início de sessão. Mitigação: opção de retorno, teste dos modos de entrada e nenhuma mudança automática agressiva durante a partida.

### Lote 5 — Áudio e voz com caminho comprovado

Áudio: preservar EQ, estudar a restauração completa de mono/balanço/compressor ao trocar elemento, testar saída padrão/Bluetooth e bloqueio de AudioContext. Perfis novos só após comparação auditiva e ausência de clipping.

Voz: validar dispositivo, mute/PTT, permissão negada, desconexão do microfone e reconexão. Projetar processamento transmitido somente após identificar o caminho de áudio de saída da sessão; a prévia atual não comprova isso.

Respeitar o congelamento registrado do EQ enquanto a revisão não for concluída; a intenção atual do mantenedor autoriza estudar a retomada, não comprova homologação.

### Lote 6 — Remapeamento avançado incremental

Começar por remapeamento simples de botão e zona morta radial comprovados no jogo. Depois multiteclas e, por último, sequências de macro com cancelamento em blur, menu, Stop, troca de perfil e troca de sessão. Todos desligados por padrão e reversíveis.

Locais previstos: perfis existentes, ponte de entrada e editor; sem segundo gerenciador concorrente. Não prometer driver virtual ou remapeamento global do sistema em userscript. Sem cronograma fechado antes de validar a integração de entrada retail.

### Manutenção transversal

- Modularização por extrações pequenas somente quando ajudar um lote; manter distribuição simples.
- Preferências antigas e recuperação devem ter testes antes de remover código.
- Integridade/versionamento do `@require`: estudar pin por revisão imutável sem quebrar atualização do módulo.
- Atualizar documentos de estado conforme evidência atual; documentos de auditoria antigos têm data e não são certificação da versão nova.
- Um recurso passa de “relatado funcional” para “reproduzido nesta revisão” somente após teste registrado. Falta de teste novo não o reclassifica automaticamente como quebrado.

## Referências consultadas e padrões extraídos

- [Better xCloud: login e regiões](https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/utils/xcloud-interceptor.ts): catálogo baseado na resposta real; metadados de apresentação não provam disponibilidade.
- [Better xCloud: rede e osName](https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/utils/network.ts) e [SDP](https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/utils/sdp.ts): qualidade solicitada, preferência de codec e teto não são garantia de recepção.
- [Better xCloud: customização](https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/modules/patcher/patches/src/controller-customization.ts): transformação no objeto de entrada do cliente, com dependência dos patches daquele cliente.
- [Better xCloud: estatísticas](https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/utils/stream-stats-collector.ts), Event Bus e Feature Gates: responsabilidades separadas e integração ao estado da sessão; importar flags cegamente não adapta o novo cliente.
- [Issue #1028](https://github.com/redphx/better-xcloud/issues/1028): o autor informa trabalho em suporte a `play.xbox.com`; não determina viabilidade de cada recurso Nimbo.
- [Greenlight: entrada](https://github.com/unknownskl/greenlight/blob/main-v2/packages/player/src/client/lib/input/gamepad.ts): mapeamentos, foco e attach/detach explícitos. [Gerenciamento de sessão](https://github.com/unknownskl/greenlight/blob/main-v2/packages/desktop/main/helpers/streammanager.ts): distinguir home/cloud e estados. Cliente próprio tem controle de transporte diferente do userscript.
- [xbox-xcloud-player](https://github.com/unknownskl/xbox-xcloud-player): biblioteca de API/player WebRTC; não adicionada como dependência.
- [XStreaming](https://github.com/Geocld/XStreaming): README declara controles virtuais/OTG/Bluetooth, Android TV e renderização nativa; recursos nativos não se transferem automaticamente ao navegador. Estudo conceitual, sem copiar código AGPL para o projeto MIT.
- XBPlayer: busca pelo nome retornou homônimos; o README de `xwipro/xbplayer` é de um player HLS/MP4, não referência Xbox confirmada. Não atribuir funcionalidades ou arquitetura a um projeto Xbox sem identificar o repositório correto.

## Checklist de teste real por lote

Registrar versão, navegador, dispositivo, jogo, modo de entrada, resultado esperado/observado e recuperação. Nunca incluir tokens, cookies, SDP completo ou dados de conta no relatório. Confirmar que a partida continua utilizável ao desativar o recurso.

