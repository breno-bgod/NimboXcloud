# Prioridade vigente

[Adaptação Android baseada no PSBox](PSBOX_ANDROID_AUTOMATION.md): nova decisão do mantenedor; substitui o foco principal anterior em identidade Xbox. Histórico e evidências abaixo permanecem para consulta. Dois motores no mesmo ambiente; nenhum fork separado exigido e nenhum APK próprio compilado. [Proposta de integração](PSBOX_ANDROID_INTEGRATION.md).

# Índice de pesquisa de console e streaming

Ponto central: [PR #24](https://github.com/breno-bgod/NimboXcloud/pull/24).
Política: [pesquisa automatizada](../AUTOMATION_RESEARCH_POLICY.md).
Organização inicial: 2026-11-13.

Este espaço reúne pesquisa e experimentos para revisão antes de qualquer incorporação ao produto oficial. A execução recorrente busca repositórios criados nos últimos 30 dias e, separadamente, mudanças recentes em projetos existentes. A janela deve ser recalculada em cada execução; nenhuma descoberta recente é presumida por este índice.

| Frente | Estado | Evidência / próximo passo |
| --- | --- | --- |
| PSBox Android: armazenamento privado | Build/teste Linux e link Android ARM64 aprovados no CI | [Experimento](../../experiments/console/psbox-android-platform/README.md) e [artefato do CI](https://github.com/breno-bgod/NimboXcloud/actions/runs/43492918003); biblioteca parcial, sem APK |
| Integração Android: propriedade de sessão | Simulação aprovada; 9 testes locais | [Contrato e limites](../../experiments/console/engine-session-contract/README.md); sem JNI/APK/gameplay |
| Identidade de cliente Xbox — pesquisa secundária | Análise e testes locais; reconhecimento pelo servidor não demonstrado | [Mapa de identidade](CONSOLE_IDENTITY_MAP.md) e [quatro testes no Nimbo real](../../experiments/console/identity-boundary/README.md) |
| XStreaming: objeto XSTS ativo | Simulação controlada aprovada; classificação desconhecida | [Experimento](../../experiments/console/xstreaming-identity/README.md): cinco testes; DeviceToken/TitleToken comentados no caminho legado e ausentes no MSAL |
| Observação interativa no navegador | 19 testes locais aprovados; fetch relatado pelo mantenedor; XHR novo aguarda teste real | [Laboratório opt-in](../../experiments/console/session-observer/README.md): pedidos/descritor/mídia, sem promover identidade Xbox |
| Projetos criados nas últimas duas semanas | Pesquisa / código triado | [Relatório 30/10–13/11](RECENT_REPOSITORIES_2026-11-13.md); Green-NX #92 coincide com objetivo, ainda sem solução demonstrada |
| Ponte Tizen HTML/JS | Cinco testes locais aprovados; sem rede real | [Bootstrap isolado](../../experiments/console/tizen-bootstrap/README.md): browser/web, perfil Android com descritor Windows; permissões de widget não validam CORS no Edge |
| PSBox / Greenlight / XStreaming | Auditoria estática revalidada | [Registro](CONSOLE_RESEARCH.md): xgpuweb (cloud) separado de xhome (Remote Play do console próprio); todos são clientes nativos, não páginas web |
| Fortnite Console no Better xCloud | Pesquisa | Patch de entrada de toque identificado; localizar integração real equivalente no SDK atual |
| Orbita | Site e XEX 1.1.0 revalidados; código XEX não inspecionável | [Ajuda](https://x360.pistatrack.com/ajuda?lang=pt-BR) declara xCloud nos servidores Microsoft, conta define catálogo e uma sessão por aparelho; [lista](https://x360.pistatrack.com/jogos) tem 35/600 títulos testados como funcionais |
| Linux nativo versus navegador | Pesquisa | Mapear APIs e dependências antes de propor adaptação |
| Clientes nativos atualizados | Pesquisa com SHAs fixados | [Registro](CONSOLE_RESEARCH.md): PSBox 1.7.1, XCloud4 1.3.0-beta, Green-NX 1.0.31pre1, OpenXCloud e Orbita XEX 1.1.0; nenhum demonstra oferta retail exclusiva de console no navegador |
| Perfis cloud de clientes nativos | Pesquisa; auditoria estática reproduzida | [Auditoria offline](../../experiments/console/client-profile-audit/README.md); quatro fontes, dez âncoras, controles negativos aprovados; sem sessão real |
| Paginação e resolução de catálogo | Simulação controlada aprovada (modelo local) | [Experimento](../../experiments/console/catalog-pagination/README.md): cinco testes; consulta Android de produto pode recuperar item ausente; sem catálogo real validado |

| Disponibilidade retail console × web | Inconclusiva; comparação pareada ainda ausente | GTA VI é candidato futuro anunciado para Xbox One/Series em 19/11; browser não é explicitamente excluído e não houve teste antes do lançamento |
| Compatibilidade de APIs web | Pesquisa documental | WebRTC/WebSocket/Gamepad são amplamente disponíveis; WebHID/WebUSB/Pointer Lock e fullscreen têm lacunas mobile; matriz em CONSOLE_RESEARCH.md |

Estados permitidos: pesquisa, simulação aprovada, falha, bloqueada, validada em sessão real. Simulação aprovada não comprova áudio, vídeo, comandos ou gameplay.

- **PSBox Android:** [auditoria reproduzível](../../experiments/console/psbox-android-audit/README.md), quatro testes aprovados; bloqueios de entrada/recursos/build no ZIP. Sem APK, sessão ou classificação Xbox validada.

- **Client Hints e perfil JavaScript:** [experimento com método real](../../experiments/console/client-hints-boundary/README.md), cinco testes em VM; ocultação depende de propriedade herdada/própria. Sem headers HTTP ou classificação Xbox observados.

- **PSBox #466 (novo código):** [PR upstream](https://github.com/RafaelNGP/psbox-cloud-gaming/pull/466), main c775ecaddde52024d177cce7392aae13cc6917aa. Trata DeviceTypeNotAllowed e allowedDeviceTypes; autor relata recusa após perfis Xbox/TV. Pesquisa/relato upstream, sem reprodução própria. Ver mapa para limites e próximo teste de erro enumerado.
