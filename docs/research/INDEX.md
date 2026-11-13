# Índice de pesquisa de console e streaming

Ponto central: [PR #24](https://github.com/breno-bgod/NimboXcloud/pull/24).
Política: [pesquisa automatizada](../AUTOMATION_RESEARCH_POLICY.md).
Organização inicial: 2026-11-13.

Este espaço reúne pesquisa e experimentos para revisão antes de qualquer incorporação ao produto oficial. A execução recorrente busca repositórios criados nos últimos 30 dias e, separadamente, mudanças recentes em projetos existentes. A janela deve ser recalculada em cada execução; nenhuma descoberta recente é presumida por este índice.

| Frente | Estado | Evidência / próximo passo |
| --- | --- | --- |
| Identidade de cliente Xbox — foco prioritário | Análise e testes locais; reconhecimento pelo servidor não demonstrado | [Mapa de identidade](CONSOLE_IDENTITY_MAP.md) e [quatro testes no Nimbo real](../../experiments/console/identity-boundary/README.md) |
| XStreaming: objeto XSTS ativo | Simulação controlada aprovada; classificação desconhecida | [Experimento](../../experiments/console/xstreaming-identity/README.md): cinco testes; DeviceToken/TitleToken comentados no caminho legado e ausentes no MSAL |
| PSBox: separação cloud / console próprio | Pesquisa | [Registro](CONSOLE_RESEARCH.md); investigar capacidades transferíveis ao navegador |
| Fortnite Console no Better xCloud | Pesquisa | Patch de entrada de toque identificado; localizar integração real equivalente no SDK atual |
| Orbita | Bloqueada para inspeção do código atual | Site e ajuda consultados; repositório vinculado indisponível |
| Linux nativo versus navegador | Pesquisa | Mapear APIs e dependências antes de propor adaptação |
| Novos repositórios na janela de 30 dias | Pesquisa | xCloudNative inspecionado; XCloud4 e xCloudPS4 identificados, inspeção pendente |
| Perfis cloud de clientes nativos | Pesquisa; auditoria estática reproduzida | [Auditoria offline](../../experiments/console/client-profile-audit/README.md); quatro fontes, dez âncoras, controles negativos aprovados; sem sessão real |
| Paginação e resolução de catálogo | Simulação controlada aprovada (modelo local) | [Experimento](../../experiments/console/catalog-pagination/README.md): cinco testes; consulta Android de produto pode recuperar item ausente; sem catálogo real validado |

Estados permitidos: pesquisa, simulação aprovada, falha, bloqueada, validada em sessão real. Simulação aprovada não comprova áudio, vídeo, comandos ou gameplay.
