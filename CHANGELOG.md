# Histórico de alterações

Este arquivo registra as mudanças relevantes do Xbox Cloud Gaming Unlock (PT-BR). As versões anteriores à publicação no GitHub foram desenvolvidas fora deste repositório; o histórico abaixo não pretende reconstruir todos os commits anteriores.

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
