# Investigação prioritária — partida não inicia em play.xbox.com

Data: 2026-11-11. Estado: pesquisa e auditoria estática; testes reais pendentes.

## Objetivo
**Correção de premissa confirmada pelo usuário:** o NimboXcloud JÁ inicia partidas no novo play.xbox.com nos perfis Automático, Desktop e Mobile/Android. A falha ocorre somente ao selecionar os perfis Smart TV, Xbox e Xbox One. Preservar o fluxo de streaming funcional e diagnosticar especificamente a negociação de perfis não funcionais.

## Evidências externas
- Better xCloud (README, aviso de 6 nov. 2026): suporte atual apenas a xbox.com/play; desenvolvimento para play.xbox.com em andamento. https://github.com/redphx/better-xcloud
- Issue #1028 (8 nov. 2026): discussão dedicada a suporte play.xbox.com. https://github.com/redphx/better-xcloud/issues/1028
- Microsoft Xbox Wire (26 jan. 2026): nova experiência web é preview e pode comportar-se diferentemente. https://news.xbox.com/en-us/2026/01/26/try-the-new-xbox-cloud-gaming-web-experience-now-in-public-preview/
- Microsoft GDK CTA: novo site possui ferramentas de desenvolvimento e configuração de tipos de entrada, com diferenças em relação ao site antigo. https://learn.microsoft.com/en-us/gaming/gdk/docs/features/common/game-streaming/game-streaming-web-content-test-application-xbox-com-play
- Stratix: estados de sessão, SDP/ICE, WebRTC, autenticação e cabeçalhos de dispositivo. Endpoints v2 do documento não equivalem automaticamente aos v5 atuais. https://github.com/nafields/stratix/blob/main/Docs/XCLOUD_PROTOCOL.md

## Achados verificados no NimboXcloud.user.js 4.12.6
1. O hook de fetch reconhece criação de sessão apenas em `/v5/sessions/cloud/play`. Se o novo site utilizar outro caminho, a interceptação de criação não ocorrerá. Hipótese a verificar com registros reais.
2. `patchPlayRequest` reconstrói uma requisição `Request` e reserializa o corpo JSON para modificar `settings.osName`. Isso pode alterar semântica ou metadados; não há prova de falha. O caminho Automático ainda solicita `windows` por qualidade, portanto não é neutro.
3. O perfil Xbox experimental desativa a alteração de `osName` na criação da sessão, mas `patchTouchSessionConfiguration` ainda habilita `enableTouchInput` quando o Android possui touchscreen. **Conflito de política de entrada confirmado em código**, causa da falha desconhecida.
4. `patchTouchSessionConfiguration` só atua em respostas de `/configuration` no domínio GSSV reconhecido. Se a configuração migrar para outro endpoint, não terá efeito.
5. O diagnóstico registra status e etapa para `/sessions/cloud/play`, `state`, `connect`, `configuration`, `sdp`, `ice`, `keepalive`; não registra payloads sensíveis. É possível localizar a etapa de falha, desde que as rotas correspondam.
6. Existem outros hooks de região, ICE e ponteiro; não presumir que todos sejam seguros para o novo site sem isolamento por módulo.

## Matriz de reprodução informada pelo usuário

| Perfil | Resultado |
|---|---|
| Automático | Partida inicia |
| Desktop | Partida inicia |
| Mobile/Android | Partida inicia |
| Smart TV | Falha ao iniciar |
| Xbox | Falha ao iniciar |
| Xbox One | Falha ao iniciar |

**Consequência:** não tratar incompatibilidade geral com play.xbox.com como causa; investigar somente diferenças entre perfis.

## Hipóteses, por ordem de verificação
- H1: criação da sessão nem é observada devido a mudanças de endpoint ou de transporte.
- H2: o servidor rejeita criação por corpo, identidade, região ou autenticação.
- H3: a sessão é criada mas falha no estado/provisionamento ou em SDP/ICE.
- H4: WebRTC conecta, mas vídeo não decodifica ou entrada não negocia.
- H5: conflitos entre hooks de qualidade, região, touch e perfis alteram a negociação.

## Plano de correção, depois de evidências
1. Usar Automático, Desktop e Mobile como controles positivos e comparar com Smart TV, Xbox e Xbox One. Capturar apenas caminho sanitizado, método, status e duração das etapas (sem tokens, IDs, headers sensíveis ou payload integral).
2. Preservar o funcionamento comprovado dos três perfis positivos; investigar se o modo Automático altera osName antes de considerar mudanças nele.
3. Comparar baseline com módulos ativados individualmente (região, qualidade, touch, console).
4. Corrigir primeiro o estágio comprovadamente defeituoso, com fallback e teste sintático.
5. Manter Xbox experimental desligado por padrão até comprovação de início de partida.
6. Realizar teste real em Edge/Chrome na fase final, conforme decisão do usuário.

## Limitações
A informação de reprodução por perfil foi fornecida pelo usuário; não há logs das tentativas por perfil neste estudo. Não atribuir a falha a um módulo específico sem o status/etapa da sessão. Nenhuma mudança de execução foi realizada nesta investigação.
