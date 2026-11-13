# Registro de pesquisa: console e streaming no navegador

## Evidências herdadas e limites

Registro inicial em 2026-11-13 a partir da [proposta existente](../SERVICO_CONSOLE_PLANO.md). Esta organização não representa uma nova inspeção integral dos projetos, descoberta de repositório recente ou simulação aprovada. Os próximos registros devem fixar SHA e data das fontes consultadas.

### PSBox — pesquisa

Referências: [gssv.h](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.h) e [gssv.cpp](https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.cpp). Os links de branch servem para localização; experimentos deverão citar o commit efetivamente consultado.

A investigação anterior distinguiu xgpuweb (cloud, titleId) de xhome (console próprio, serverId). É um cliente nativo; reutilizar uma ideia exige verificar transporte, APIs e restrições do navegador. Não demonstra autorização para executar títulos fora do catálogo ou de uma conta. Próximo passo: comparar mudanças recentes por SHA com os pontos de sessão e mídia já implementados no Nimbo, sem reiniciar diagnósticos concluídos.

### Better xCloud / Fortnite — pesquisa

Referência: [patcher.ts](https://github.com/redphx/better-xcloud/blob/typescript/src/modules/patcher/patcher.ts), patch forceFortniteConsole.

A evidência registrada na proposta é a alteração do argumento de sendTouchInputEnabledMessage para false na rota /launch/fortnite/. Isso descreve uma capacidade específica relacionada à experiência do Fortnite, não um desbloqueio geral de títulos. A preferência existente no Nimbo não comprova que esse patch esteja implementado. Próximo passo: identificar o caminho real no SDK retail atual e elaborar hipótese isolada com critério de refutação. Não inventar método público equivalente.

### Orbita — código atual bloqueado

Fontes: [site](https://x360.pistatrack.com/?lang=pt-BR), [ajuda](https://x360.pistatrack.com/ajuda?lang=pt-BR), [jogos](https://x360.pistatrack.com/jogos).

A proposta registra o aplicativo XEX/Aurora 1.1.0 executado no Xbox 360 como cliente do serviço cloud. Isso não comprova um serviço que transmita qualquer jogo de Xbox 360. O repositório sergiolimasks/orbita vinculado estava indisponível (404); conteúdo legado indexado não foi tratado como código da versão atual. Próxima busca deve conferir novamente a disponibilidade e distinguir documentação de implementação verificável.

### Linux — adaptação pendente

Android também pode anunciar Linux no user-agent. Esse texto não fornece APIs SDL, acesso a drivers, sockets ou decodificadores nativos ao JavaScript da página. A automação deve classificar cada solução: compatível com APIs web, dependente de servidor autorizado ou exclusiva de cliente nativo. Nenhuma equivalência funcional é presumida.

## Formato dos próximos registros

- Problema e hipótese única; links para questões/PRs existentes para evitar duplicação.
- Origem: URL primária, licença, created_at, SHA e data do commit relevante.
- Classificação: repositório novo nos últimos 30 dias ou projeto existente com alteração recente. updated_at sozinho não basta.
- Evidência no código e diferença entre cliente nativo e navegador.
- Experimento: fixture sem dados pessoais, origem, comando, resultado esperado e critério de refutação.
- Resultado observado: pesquisa / simulação aprovada / falha / bloqueada / validada em sessão real.
- Após falha: nova referência e justificativa da revisão; até três revisões fundamentadas por execução.
- Limites e próximo passo. Sem credenciais, tokens ou afirmação de gameplay baseada apenas em WebRTC/CI.

Nenhum resultado de GTA VI é declarado. A validação depende da disponibilidade efetiva do título ao mantenedor e de sessão autorizada.
