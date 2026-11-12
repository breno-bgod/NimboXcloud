## [4.12.65] — 2026-11-12
- O bootstrap xHome agora possui timeout de 12 segundos para abertura dos quatro data channels e recebimento de `HandshakeAck`; o timer é cancelado somente após a inicialização completa.
- Erro ou fechamento inesperado de qualquer canal provoca encerramento local e tentativa de liberação remota da sessão, evitando `dataChannelsReady` permanecer verdadeiro após perda do transporte.
- Falha ao enviar o handshake ou ao inicializar os canais segue o mesmo caminho de teardown; Stop/Cancel limpam o timer.
- Adicionados dois testes determinísticos para timeout sem ACK e fechamento inesperado após ACK.
- Nenhum frame de controle foi enviado nesta versão; a interface xHome continua oculta e o recurso não está homologado em Xbox real.

# Histórico de alterações

## [4.12.64] — 2026-11-12
- Remote Play xHome agora cria os quatro data channels usados pelo protocolo observado no cliente de referência: `chat/chatV1`, `control/controlV1`, `input/1.0` e `message/messageV1`, todos ordenados.
- Implementado handshake `messageV1`; após `HandshakeAck`, o cliente envia a autorização `controlV1`, os eventos iniciais de registro do gamepad, metadados binários iniciais do canal `input` e seis mensagens de configuração de sessão.
- Os canais são fechados no Stop, Cancel e falha de inicialização. A flag `dataChannelsReady` só fica ativa após o bootstrap completo.
- Referência técnica: estruturas públicas de protocolo de [unknownskl/xbox-xcloud-player](https://github.com/unknownskl/xbox-xcloud-player), cujo `package.json` declara MIT. Não foi incorporado o cliente completo.
- **Limite explícito:** ainda não são enviados frames de gamepad, teclado, mouse ou toque. O bootstrap dos canais não comprova comandos jogáveis, mídia ou sessão Xbox real.
- Validação CI no commit `c61a13f5689429a00b00f775e7d26c24e07b7063`: baseline e regression workflows PASS; 118 testes, 115 PASS, 0 FAIL, 3 TODO; `node --check` e relatório estático concluídos.

# Histórico de alterações

## [4.12.63] — 2026-11-12
- Corrigido o acionamento repetido de Stop quando a liberação remota xHome está pendente: o estado de pendência, a mensagem de erro e o retry existente são preservados; nenhuma segunda requisição DELETE é emitida.
- Ampliada a suíte de `tests/xhome-discovery.test.cjs` com cenários HTTP 403/500, 404/410 idempotentes, falha de rede, Stop repetido e retry concorrente.
- A versão do cabeçalho, constante interna e parâmetro de cache do módulo Touch HUD foi alinhada em 4.12.63.
- README PT/EN, matriz de decisões e roadmap público foram sincronizados com a retomada técnica autorizada do xHome; a interface permanece oculta e o recurso continua sem homologação de vídeo/áudio/controles.
- **Validação desta execução:** inspeção estática dos trechos e dos testes adicionados. Execução Node/CI e teste em Xbox real ainda não confirmados; não declarar a matriz aprovada até obter resultados dos workflows.

## [Reformulação visual NX — etapas 1 e 2] — 2026-11-11
- Painel NX com tela inicial reorganizada em quatro categorias recolhíveis: Transmissão, Controles, Personalização e Avançado.
- Mantidas páginas existentes de streaming, região, áudio, voz, controles, sistema e indicadores detalhados.
- NX Stream Monitor opcional e independente do painel: FPS, RTT WebRTC, bitrate, perda, resolução, jitter e indicação de servidor.
- Monitor com orientação horizontal/vertical/compacta/automática, escala, cores de texto, transparência do fundo e posição por canto ou arrasto.
- Bandeiras para datacenters reconhecidos, sem inferir localização real apenas pela região selecionada.
- Reaproveitamento da coleta de estatísticas WebRTC e armazenamento local das preferências.
- Commits de implementação: `dcbab9667526ba8e9e7f7f4f64b9daad8a30e300` e `fe329eb454210c0180d1cb619ec4fea7450d5bd5`.
- **Validação:** presença das alterações confirmada no repositório. Testes reais de renderização, fullscreen, controle, Android/DeX e transmissão autenticada continuam pendentes.
- **Não implementado:** sondagem periódica comparativa de servidores alternativos; o histórico de RTT existente provém de datacenters utilizados anteriormente.


## [Documentação de funcionalidades — auditoria v4.12.16] — 2026-11-11
- Inventário de recursos implementados, experimentais e não comprovados publicado nos READMEs em português e inglês.
- Registrados recursos de streaming, rede, imagem, áudio, HUD, entradas, giroscópio, microfone, vibração, laboratório Xbox, telemetria e interface.
- Esclarecidos limites: ausência de upscaling real, geração de quadros, autenticação de console e acesso comprovado ao catálogo exclusivo.
- Distinção explícita entre código presente e testes reais de streaming; nenhum comportamento do userscript alterado nesta atualização documental.
- O histórico de versões 3.6.38–4.12.16 não foi reconstruído artificialmente; consultar commits e o código para mudanças específicas.


## [3.6.37] — 2026-11-10
- Versão atual identificada no cabeçalho e no código do userscript `NimboXcloud.user.js`.
- Documentação alinhada ao nome do arquivo principal, links de instalação e perfil padrão 1080p/Windows.
- Arquivo legado `xbox-cloud-unlock-ptbr.user.js` removido do repositório.
- O histórico detalhado das versões 3.6.7 a 3.6.37 não foi reconstruído sem evidências; consultar commits para mudanças intermediárias.
- Testes reais de streaming, controles e compatibilidade continuam pendentes.

## [3.6.6] — 2026-11-10
- Diagnóstico de Pointer Lock, foco, visibilidade, fullscreen, redimensionamento, touch, ponteiro, teclado e conexão de gamepad, ativo no catálogo e na partida.
- Eventos em buffer circular de até 100 entradas, sem registrar teclas digitadas ou coordenadas exatas (toques agrupados em zonas 4x4).
- Diagnóstico apenas de leitura; não altera o fluxo de entrada, sessão ou vídeo.
- Sintaxe JavaScript validada; testes reais ainda pendentes.


## [3.6.5] — 2026-11-10
- Diagnóstico da negociação de entrada na criação da sessão: apenas nomes de campos e valores de capacidade de toque/teclado/mouse, quando presentes.
- Nenhum corpo de requisição, token ou identificador novo é incluído no diagnóstico de entrada.
- Sem modificação de prioridades, controles virtuais ou perfil de vídeo; sintaxe JavaScript validada.
- Pendente validação real no Edge/Android.


## [3.6.4] — 2026-11-10
- Diagnóstico multimodal no relatório NX: touchscreen, tipo de ponteiro, hover e quantidade de gamepads.
- Somente leitura: sem mudanças em qualidade de vídeo, negociação de entrada ou comportamento do painel.
- Sintaxe validada; testes reais no Edge/Android e Windows touchscreen ainda pendentes.


## [3.6.3] — 2026-11-10
- Corrigido erro de sintaxe que impedia a execução integral do userscript: declaração `cardEl = mk(...)` estava acidentalmente comentada, deixando um array de estilos solto.
- Restaurada a criação do cartão do painel NX; sintaxe JavaScript validada estaticamente.
- Teste real no Edge/Android ainda pendente.


## [Documentação aberta e bilíngue] — 2026-11-10
- README em português e README_EN em inglês apresentam KReight como estudante autodidata de JavaScript.
- Projeto experimental, convite a contribuições, permissão para forks e condições da licença MIT esclarecidos.
- Identidade KReight uniformizada na documentação e no aviso de copyright próprio; avisos originais preservados.
- Nenhuma alteração de comportamento no userscript.

## [Identidade e atribuição] — 2026-11-10
- Assinatura `@author` atualizada para **KReight**, mantenedor do NimboXcloud.
- README atualizado com identidade independente e agradecimentos às referências.
- Licença MIT original de RoyLiu04 preservada junto à licença do projeto.
- Nenhuma alteração funcional no userscript; versão permanece 3.6.2.


Este arquivo registra as mudanças relevantes do Xbox Cloud Gaming Unlock (PT-BR). As versões anteriores à publicação no GitHub foram desenvolvidas fora deste repositório; o histórico abaixo não pretende reconstruir todos os commits anteriores.

## [3.6.2] — 2026-11-10
- NX flutuante permanece visível como fallback na biblioteca, mesmo quando o botão integrado ao cabeçalho é encontrado.
- Diálogos e sobreposições do xCloud não desativam a pílula nem recolhem à força o cartão expandido.
- Posicionamento de recuperação padronizado no canto superior direito.
- Primeira sincronização do painel ocorre imediatamente na inicialização, sem esperar o intervalo de 1,5 segundo.
- Erros da sincronização passam a ser registrados em `lastErr` para diagnóstico.
- Comparado com o arquivo v3.2.0 fornecido pelo autor; teste visual real no novo xCloud permanece pendente.

## [3.6.0] — 2026-11-10
- Botão **NX** na biblioteca, posicionado ao lado do perfil quando o cabeçalho é identificado.
- Botão **NX** no canto superior direito durante o streaming; painel expansível/recolhível.
- Configurações pré-jogo reutilizam os seletores existentes de qualidade, bitrate, servidor, IPv4 e região.
- Estatísticas WebRTC preservadas no painel in-game.
- Fallback: quando o botão de perfil não é encontrado, NX aparece no canto superior direito.
- **Pendente:** teste em navegador real, incluindo mudanças de rota e detecção de sessão.

## [3.5.0] — 2026-11-10
- Preservado o cabeçalho original `x-ms-device-info`, sem mascarar as capacidades de toque do dispositivo.
- Perfil padrão alterado de Tizen/HQ para Windows/1080p para reduzir conflitos com o controle virtual nativo; HQ/Tizen continua disponível como experimental.
- Painel reanexado ao DOM após substituição do corpo da página e monitorado durante inicialização/tela cheia.
- Sintaxe validada localmente com `node --check`; teste real de sessão, controle virtual e vídeo pendente.

## [3.4.0] — 2026-11-10
- Removida a interceptação de `Element.prototype.requestPointerLock` e o rastreamento próprio de eventos de ponteiro.
- Removido o controle manual “Toque 1º” do painel. A escolha do dispositivo ativo fica com o xCloud, sem prioridade artificial do userscript.
- Mantidos os perfis de vídeo independentes das entradas, com máxima qualidade (1080p HQ) como padrão.
- Corrigida a montagem do objeto `RTCSessionDescriptionInit` no ajuste experimental de bitrate SDP, preservando `type`.
- Corrigida a guarda contra inicialização duplicada do userscript.
- **Validação:** sintaxe JavaScript verificada com `node --check`. Testes reais de streaming e alternância de periféricos ainda pendentes.
- **Nota:** “1080p HQ” não é 1440p comprovado; resolução efetiva depende da negociação com o serviço.

## [3.3.1] — 2026-11-10
**Primeira versão publicada neste repositório.**
- Perfil de qualidade máxima (1080p HQ) selecionado como padrão, inclusive quando a preferência legada é `auto`.
- Perfis manuais 1080p HQ, 1080p e 720p.
- Opções de bitrate: automático, 5, 8, 10, 12 e 15 Mbps.
- Configuração de streaming independente do tamanho da janela, modo DeX e tela cheia, na lógica do script.
- Mantidos os recursos de seleção de região/data center, filtro de candidatos ICE IPv6, painel e estatísticas de conexão.

**Validação:** publicação do código e verificação estática anterior de sintaxe. Não há comprovação de teste ponta a ponta em Android/DeX, Windows ou sessão xCloud nesta versão. A qualidade final é negociada pelo serviço.

## Próximas versões
As alterações futuras devem incluir: versão, data, recursos adicionados, correções, incompatibilidades conhecidas e evidências de testes.
