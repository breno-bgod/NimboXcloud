# Auditoria offline de perfis dos clientes

## Hipótese e limite

Hipótese investigada: clientes executados em consoles ou Android TV podem estar usando uma identidade/oferta diferente do web. Antes de tentar adaptar um protocolo, conferir os pontos de declaração no código público.

Esta ferramenta localiza âncoras em fontes fixadas por commit e verifica sua integridade. Não interpreta todo o fluxo, não executa os clientes, não testa autorização e não conclui equivalência de catálogo. Estado: pesquisa com auditoria estática reproduzida, não simulação de sessão aprovada.

## Fontes e execução

Fontes em sources.json; PSBox GPL-3.0, xCloudNative MIT (metadados consultados em 2026-11-13). Não há código desses clientes copiado para o repositório. Baixe os quatro arquivos públicos dos commits indicados e salve cada um em DIRETORIO/id.txt. Não forneça logs ou dados de uma conta.

- psbox-header.txt: https://github.com/RafaelNGP/psbox-cloud-gaming/blob/eb63daf8f953684387a06a7bab8ef0a1e3133463/src/xcloud/gssv.h
- psbox-session.txt: https://github.com/RafaelNGP/psbox-cloud-gaming/blob/eb63daf8f953684387a06a7bab8ef0a1e3133463/src/xcloud/gssv.cpp
- android-auth.txt: https://github.com/Ricardex742/xCloudNative/blob/a6ab26f4e29d84bf09e130bd8b6ac2325f099e59/app/src/main/java/com/xcloud/tclnative/auth/XalAuthenticator.kt
- android-session.txt: https://github.com/Ricardex742/xCloudNative/blob/a6ab26f4e29d84bf09e130bd8b6ac2325f099e59/app/src/main/java/com/xcloud/tclnative/signaling/XCloudSignalingClient.kt

Execute com Node.js, sem dependências:
`node experiments/console/client-profile-audit/audit.mjs DIRETORIO`

O script não faz rede. Normaliza CRLF para LF e exatamente uma quebra final, confere SHA-256 e informa linhas das âncoras. Código 0 indica somente que fontes/âncoras correspondem ao registro; 1 indica fonte ausente, alterada ou âncora não encontrada; 2 indica diretório não fornecido. Nova versão exige nova inspeção antes de atualizar o manifesto.

## Resultado observado em 2026-11-13

Quatro fontes corresponderam ao manifesto; dez âncoras localizadas. Alterar uma fonte produziu source-mismatch/código 1; remover a fonte produziu source-unavailable/código 1. Saídas preservadas em results.json e negative-results.json.

PSBox declara xgpuweb por padrão e separa home/cloud. O cliente Android declara xgpuweb, XboxComBrowser, clientAppType browser e sdkType web no caminho inspecionado. Isso não demonstra acesso à oferta específica de console. Também não prova que outro mecanismo inexista: a auditoria é parcial e não substitui rastreio do fluxo e teste real.

## Próximo teste

Obter evidência não sensível de um mesmo título/conta/região na nuvem do Xbox e na web, registrando data, modalidade e resultado. Investigar uma diferença concreta de capacidade/autorização antes de propor adaptação. Sem console/sessão, comparar o caminho de catálogo e capacidades por código; não alterar a identidade do Nimbo às cegas.

Viabilidade de equivalência de oferta: Android, iOS e desktop permanecem não demonstrados. PSBox possui caminho xHome que exige console próprio; o caminho cloud inspecionado não o exige no início de sessão, mas continua sujeito à conta/serviço. Renderização/transportes nativos não são automaticamente transferíveis para APIs web.
