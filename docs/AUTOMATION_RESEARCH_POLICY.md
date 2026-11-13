# Política de pesquisa automatizada do NimboXcloud

Atualizada por decisão do mantenedor em 2026-11-13.

## Divisão de trabalho

- Produto oficial: manutenção do painel e das funções em uso, conduzida pelo mantenedor/responsável principal e publicada somente após suas verificações.
- Pesquisa: Remote Play/xHome, capacidades do cliente console/cloud, Fortnite Console, lançamento autorizado e preparação para GTA VI. A automação não modifica main, instalador, versões/releases, módulos ativos, preferências ou layouts.
- Repositórios e ideias experimentais não se tornam recursos oficiais por passarem em mocks ou CI. A promoção ao produto exige decisão explícita do mantenedor.

## Pesquisa recorrente

A automação existente continua habilitada a cada 30 minutos. Seu objetivo principal passa a ser busca na web/GitHub:
1. Repositórios criados na janela móvel dos últimos 30 dias, com atividade de código relevante.
2. Projetos mais antigos que tiveram commits/PRs/releases relevantes nesse período, comparados ao último SHA consultado.
3. PSBox, Orbita, Better xCloud, Greenlight, xbox-xcloud-player, XStreaming e novos candidatos para navegador, Android/mobile/TV, Linux/SteamOS, desktop e consoles.

Datas de criação e commit devem ser verificadas; updated_at, estrelas ou notícias republicadas não provam avanço técnico. Fontes inacessíveis, privadas ou legadas são identificadas como tal. Linux no user-agent, inclusive no Android, não fornece APIs/driver/codecs de um cliente nativo SDL/C++ ao navegador.

## Espaço de trabalho

Ponto central atual: [PR #24](https://github.com/breno-bgod/NimboXcloud/pull/24), branch proposal/console-service-resume, em rascunho.

- docs/research/INDEX.md: índice de descobertas, hipóteses e estados.
- docs/research/CONSOLE_RESEARCH.md: fontes, SHA/datas, evidências, limitações, falhas e próximos passos.
- experiments/console/: protótipos, fixtures e testes isolados. Nada nessa pasta é carregado pelo userscript oficial.

Se o PR central for fechado/mesclado, localizar um sucessor; só na ausência criar um único novo PR de pesquisa em rascunho. PRs antigos aguardando revisão não suspendem a busca, mas a automação não os mescla nem amplia seus escopos. Coordenação com outra conta ocorre pelo GitHub.

## Experimentos e entrega

Uma hipótese pequena por execução; teste reproduzível, critério de refutação e API real antes de implementar. Em falhas, pesquisar outras referências e tentar revisões fundamentadas. Até três revisões por execução, sem loop infinito; preservar resultados negativos e retomar depois quando houver evidência nova.

Estados: pesquisa, simulação aprovada, falha, bloqueada ou validada em sessão real. Sem conta/console/ambiente, não transformar simulação em validação de mídia, áudio, comandos ou jogo. Não pedir/salvar tokens e senhas; não inventar autorização, endpoints ou payloads.

Publicar no PR somente descobertas/experimentos ou mudanças de bloqueio relevantes; sem commits vazios ou notificações repetidas. Releitura do head e atualização sem force protegem trabalho concorrente. O mantenedor decide a aplicação futura.
