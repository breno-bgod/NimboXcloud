# Arquitetura técnica

## Escopo
O arquivo `NimboXcloud.user.js` é um userscript executado pelo Tampermonkey em `https://play.xbox.com/*`, com `@run-at document-start` e `@grant none`. Ele não é um cliente independente do Xbox Cloud Gaming.

## Fluxo principal
1. Carrega preferências locais por `localStorage` (região, data center, IPv4, qualidade, bitrate e preferências de interface).
2. Intercepta operações relevantes de rede feitas pela página, por meio de mecanismos de `fetch` e XHR.
3. Ajusta determinadas respostas e requisições relacionadas à identificação de mercado e à escolha do data center.
4. Aplica preferências de negociação do streaming, incluindo `osName` para os perfis de qualidade e ajustes relacionados a WebRTC/SDP.
5. Exibe painel de configurações e telemetria de qualidade de conexão obtida pelo navegador.

## Perfis de qualidade xCloud — revisão 4.12.88

| Escolha no painel | Identificação solicitada | Objetivo |
| --- | --- | --- |
| Máximo | `tizen` | Solicitar 1080p HQ |
| Equilibrado / Compatível | `windows` | Solicitar 1080p padrão; os dois botões são aliases |

Sem preferência salva ou com valor desconhecido, mantém HQ. O seletor respeita `xcu.resolution`: `hq` ou `auto`. Antes da 4.12.88, o runtime ignorava essa escolha e sempre retornava HQ; preferências `auto` existentes agora passam a solicitar Windows na próxima partida. Selecionar Máximo retorna a HQ. Nenhuma alteração da sessão já ativa é forçada.

A identificação usada na negociação não altera o navegador nem comprova resolução/bitrate recebidos. `bitrateCfg()` mantém automático; a tabela legada de limites não significa que exista teto manual ativo. Preferências de resolução de xHome pertencem a outro fluxo.

Toque e Gamepad API não são modificados pelo seletor. A compatibilidade de cada perfil com a partida real precisa ser verificada no dispositivo.

## Componentes de rede
O código referencia, entre outros:
- `gears.xboxservices.com`: dados de experimentação/mercado;
- `gssv-play-*.xboxlive.com`: autenticação e opções de regiões;
- `*.core.gssv-play-*.xboxlive.com`: sessão de jogo, configuração e ICE;
- `RTCPeerConnection`: estatísticas e negociação WebRTC.

Esses endpoints e estruturas internas podem mudar sem aviso. O script é não oficial.

## Limites de escopo
- Não altera os servidores do Xbox nem os arquivos dos jogos.
- Não converte streaming em renderização local.
- Não garante resolução nem FPS recebidos.
- Não deve ativar ou priorizar teclado/mouse ao mudar a qualidade de vídeo.
- A filtragem de IPv6 e as mudanças de mercado podem não funcionar em todas as redes ou versões do serviço.

## Manutenção
Ao alterar interceptações de rede, verificar se os dados esperados ainda existem; preservar o comportamento original quando possível; evitar conflitos com outros userscripts; validar a sintaxe e testar o fluxo de toque, gamepad, DeX, tela cheia e diferentes perfis.

## NX UI e telemetria — reorganização de 2026-11-11

- **Navegação:** a página inicial apresenta Transmissão, Controles, Personalização e Avançado como grupos recolhíveis. Cada grupo direciona para construtores de páginas já existentes; as rotinas de streaming, áudio, controles e diagnóstico não foram duplicadas nesta mudança.
- **Dashboard:** acesso separado para os indicadores e gráficos existentes; uma visualização imersiva completa ainda depende de desenvolvimento e validação.
- **NX Stream Monitor:** sobreposição opcional, independente do cartão principal e atualizada a partir de `S.qos`, alimentado pelo `getStats()` do WebRTC. Não executa novas sondagens de rede.
- **Configuração:** `nx.monitor.settings.v1` mantém layout, campos, escala, opacidade, cor e posição; `nx.telemetry.overlay.v1` controla a ativação.
- **Métricas:** FPS decodificado, RTT WebRTC, bitrate estimado da recepção, perda, resolução e jitter dependem da disponibilidade das estatísticas. RTT não é ping interno do jogo.
- **Regiões:** bandeiras mapeadas para identificadores conhecidos de datacenter. `S.serverActual` pode não estar identificado. Seleção de região, endereço de saída e datacenter real são conceitos distintos.
- **Comparação histórica:** `S.latencyByServer` guarda médias e amostras de datacenters realmente usados; não equivale a sondagem ativa de todos os servidores.
- **Riscos a validar:** montagem em fullscreen, arrasto por toque, limite da viewport, acessibilidade por gamepad, sobreposição do HUD nativo e compatibilidade com mudanças de DOM do xCloud.

**Estado:** código em desenvolvimento; verificação de presença no repositório não substitui teste autenticado em navegador real.




## Catálogo de datacenters — 4.12.91

O login cloud via fetch alimenta um catálogo em memória de regiões e origens validadas. O seletor mantém Automático e aliases legados, atualiza a lista pelo ciclo existente de UI e preserva a resposta nativa quando a região preferida não está disponível. O login xHome não participa desse catálogo.

A escolha de servidor exige recarregar antes de iniciar outra partida para aplicar a preferência ao login. Preferência, pin aplicado e endpoint observado são estados distintos; nenhum deles comprova localização física da mídia. Consulte [implementação, testes e aceite](./SERVIDORES_DINAMICOS.md).
