# Fila técnica da automação

As decisões recentes do mantenedor e os PRs em andamento prevalecem. Esta fila não autoriza commits automáticos na main. Use uma branch e um PR por tarefa; não duplique trabalho já em andamento.

## Próximo experimento: qualidade acima de 1080p no navegador

- Objetivo: investigar a sequência de resolução do PSBox no xCloud retail, sem confundir renderização/upscale local com resolução recebida.
- Leia primeiro [Vídeo e imagem](docs/VIDEO_E_IMAGEM.md), decisões e roadmap atuais. Preserve a interface e os cinco modos de entrada aprovados.
- Confira o estado real do Nimbo e do PSBox antes de partir da documentação histórica. O PSBox envia alias de resolução pelo canal de controle e anuncia dimensões/capacidades compatíveis; somente `osName` não reproduz essa sequência.
- Primeiro resultado revisável: mapear os pontos reais de acesso do SDK retail a controle, dimensões e codecs. Não invente métodos do SDK nem intercepte todos os data channels para enviar mensagens às cegas. Se não houver acesso verificável, entregue um diagnóstico/proposta de experimento em PR, sem seletor de resolução fictício.
- Caso exista adaptação comprovável, implementar protótipo isolado e opt-in, com testes, aplicação única por sessão, limite de tentativas, liberação de callbacks e fallback para a negociação nativa. Não mexer em credenciais, entitlement ou sinalização xHome para forçar aceitação.
- Aceite: medir dimensões recebidas via vídeo/WebRTC e distinguir solicitação aceita de resolução efetivamente recebida. Sem partida autenticada, marcar resultado como pendente de teste real.
- Corrigir antes um CI quebrado ou regressão comprovada de conexão/mídia. Não reiniciar pesquisas ou abrir outro PR enquanto um trabalho da automação aguarda revisão.
