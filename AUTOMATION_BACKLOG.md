# Fila técnica da automação — pesquisa e experimentos

A nova orientação do mantenedor prioriza pesquisa web/GitHub e experimentação isolada. Leia [a política vigente](docs/AUTOMATION_RESEARCH_POLICY.md).

Consulte o HEAD atual da branch oficial e a documentação vigente antes de propor novas alterações. Repositórios criados e projetos atualizados nos últimos 30 dias são pesquisados separadamente. PRs antigos aguardando revisão não impedem a pesquisa.

Nenhuma alteração automática na main, versão/release, painel ou módulos em uso. Código experimental somente em branch separada, mediante autorização do mantenedor. Mocks não comprovam gameplay nem autorização de títulos; falhas devem ser preservadas e orientar a próxima busca. A manutenção oficial segue pelo mantenedor/responsável principal.

## Trilhas de pesquisa

- Capacidades reais do cliente cloud e ponto equivalente ao Fortnite Console no SDK retail.
- Catálogo, identificação e lançamento de títulos autorizados; estados de sessão, mídia e comandos.
- Remote Play/xHome, mantendo a exigência de console autorizado e validação separada.
- Negociação de qualidade e resolução como hipótese secundária quando trouxer evidência transferível; não criar seletor fictício ou sondagens indiscriminadas.

## Pesquisa de qualidade de imagem acima de 1080p



- Leia primeiro [Vídeo e imagem](docs/VIDEO_E_IMAGEM.md), decisões e roadmap atuais. Preserve a interface e os cinco modos de entrada aprovados.
- Primeiro resultado revisável: mapear os pontos reais de acesso do SDK retail a controle, dimensões e codecs. Não invente métodos do SDK nem intercepte todos os data channels para enviar mensagens às cegas. Se não houver acesso verificável, entregue um diagnóstico/proposta de experimento em PR, sem seletor de resolução fictício.
- Caso exista adaptação comprovável, implementar protótipo isolado e opt-in, com testes, aplicação única por sessão, limite de tentativas, liberação de callbacks e fallback para a negociação nativa. Não mexer em credenciais, entitlement ou sinalização xHome para forçar aceitação.
- Aceite: medir dimensões recebidas via vídeo/WebRTC e distinguir solicitação aceita de resolução efetivamente recebida. Sem partida autenticada, marcar resultado como pendente de teste real.
- Falhas de CI do experimento devem ser corrigidas no próprio PR. Regressões do produto oficial são registradas para o responsável principal; não expandir silenciosamente o experimento ao runtime ativo. Pesquisa pode continuar enquanto PRs de implementação aguardam revisão.
