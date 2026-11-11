# Arquitetura técnica

## Escopo
O arquivo `NimboXcloud.user.js` é um userscript executado pelo Tampermonkey em `https://play.xbox.com/*`, com `@run-at document-start` e `@grant none`. Ele não é um cliente independente do Xbox Cloud Gaming.

## Fluxo principal
1. Carrega preferências locais por `localStorage` (região, data center, IPv4, qualidade, bitrate e preferências de interface).
2. Intercepta operações relevantes de rede feitas pela página, por meio de mecanismos de `fetch` e XHR.
3. Ajusta determinadas respostas e requisições relacionadas à identificação de mercado e à escolha do data center.
4. Aplica preferências de negociação do streaming, incluindo `osName` para os perfis de qualidade e ajustes relacionados a WebRTC/SDP.
5. Exibe painel de configurações e telemetria de qualidade de conexão obtida pelo navegador.

## Perfis de qualidade
| Preferência | Identificação usada na negociação | Objetivo |
| --- | --- | --- |
| Automático / padrão | `windows` | Solicitar perfil 1080p |
| 1080p HQ (experimental) | `tizen` | Solicitar perfil 1080p HQ |
| 1080p | `windows` | Solicitar perfil 1080p |
| 720p | `android` | Solicitar perfil 720p |

O perfil padrão atual prioriza 1080p/Windows para preservar a experiência nativa de toque. HQ/Tizen permanece experimental.

Essas identificações são utilizadas no contexto de negociação de streaming; não significam que o navegador ou o sistema operacional foi realmente alterado. **Não há garantia de 1080p efetivos, 1440p ou bitrate fixo**, pois a entrega depende do serviço, dispositivo, navegador e rede.

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

