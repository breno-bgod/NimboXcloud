# Histórico de alterações

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
