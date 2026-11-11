# Pesquisa comparativa — perfis de plataforma e protocolo xCloud

Data: 2026-11-11. Pesquisa documental e inspeção estática de código; **sem teste de streaming**.

## Objetivo

Determinar o que pode ser aproveitado para os perfis Automático, Android, Desktop, Smart TV e Xbox do NimboXcloud, preservando o cliente oficial em `play.xbox.com`.

## Fontes verificadas

1. **Stratix** — https://github.com/nafields/stratix/blob/main/Docs/XCLOUD_PROTOCOL.md — descreve OAuth device code, XSTS, gsToken, estados da sessão, SDP/ICE, canais WebRTC e protocolo binário. O próprio documento cita Greenlight e Xbox XCloud Player como referências. A documentação ressalva que a API é proprietária e pode mudar.
2. **Xbox XCloud Player** — https://github.com/unknownskl/xbox-xcloud-player — código diretamente inspecionado: `src/channel/control.ts` e `src/channel/input/packet.ts`. `control.ts` declara `controlV1`, autorização, registro de gamepad e handlers Gamepad/MouseKeyboard/Touch; `packet.ts` separa report types e filas para gamepad, pointer, mouse e keyboard.
3. **Greenlight** — https://github.com/unknownskl/greenlight — README: aplicativo wrapper sobre Xbox XCloud Player, suporta streaming de Xbox One/Series, gamepad e teclado; interface desktop. Não é evidência de UA Xbox no navegador.
4. **XStreaming** — https://github.com/Geocld/XStreaming — README: cliente React Native mobile inspirado em Greenlight; suporte a gamepad virtual/OTG/Bluetooth, Android TV e renderização alternativa nativa. **Licença AGPL-3.0**, verificar obrigações antes de reutilizar código.
5. **Team OpenXbox** — https://openxbox.org/ e https://openxbox.org/smartglass-documentation/ — SmartGlass controla Xbox real por rede local; projetos Nano v3/xCloud WebRTC. SmartGlass UDP local **não é** a mesma coisa que a API do xCloud no navegador.
6. **Better xCloud 6.7.13** — arquivo fornecido pelo usuário `better-xcloud.user.js`: `UserAgent.spoof` modifica APIs JavaScript; `game.fortnite.forceConsole` interfere na preferência de toque; interceptação de requisições altera `settings.osName` e `x-ms-device-info` em determinados caminhos. Trata-se de versão antiga, não prova compatibilidade atual.

## Matriz técnica

| Área | Stratix | XCloud Player | Greenlight | XStreaming | OpenXbox | Better xCloud |
|---|---|---|---|---|---|---|
| Autenticação/sessão | Documentado | Biblioteca de cliente | Integra cliente | Cliente mobile | Pesquisa de protocolo | Reutiliza cliente web |
| WebRTC/SDP/ICE | Documentado | Implementado | Via biblioteca | Cliente com renderização mobile | Nano v3 e pesquisa | Intercepta cliente web |
| Input gamepad | Formato descrito | Codificador binário | Controles desktop | Gamepad mobile | SmartGlass e xCloud | Hook do cliente |
| Input mouse/teclado | Report types descritos | Tipos e filas concretos | Teclado | Não auditado no código | Não auditado | Suporte próprio |
| Spoof UA Xbox em browser Android | Não demonstrado | Não demonstrado | Não demonstrado | Não demonstrado | Não demonstrado | UA JS e preferências específicas |
| Fluxo de Remote Play Xbox real | xHome descrito | xHome suportado | xHome suportado | xHome suportado | SmartGlass/Nano | Não é foco desta comparação |

**Atenção a divergências de versão:** o documento Stratix apresenta um conjunto de bits para `ReportType` que não coincide integralmente com o enum `ReportTypes` observado em `src/channel/input/packet.ts` do Xbox XCloud Player atual (nesse arquivo `ClientMetadata=8`, `Mouse=32`, `Keyboard=64`). Não copiar layout binário de uma fonte para outra sem confrontar código e sessão real.

## O que é comum

- Autenticação e autorização precedem a criação da sessão.
- Sessão é negociada em etapas, não apenas por User-Agent.
- SDP/ICE/WebRTC determinam a viabilidade da mídia.
- Canal de controle e canal de entrada são separados; dispositivos de entrada podem ser descritos independentemente.
- Identidade declarada não garante codec, gamepad ou permissões do servidor.

## Recomendações para NimboXcloud

1. **Preservar cliente oficial e tokens**; não substituir autenticação por device code apenas para tentar modo console.
2. **Gerenciador central de perfis**: separar identidade JS, dados de sessão, preferências de input, interface e qualidade. O perfil Automático deve ser neutro quando selecionado explicitamente, sem modificações de identidade.
3. **Xbox experimental com fallback**: não enviar `osName=xbox` sem prova do protocolo; não forjar IDs de hardware, tokens ou recursos de codec.
4. **Diagnóstico sanitizado por etapa**: registrar presença e nomes de campos, osName solicitado, status HTTP e estados WebRTC, nunca tokens, identificadores de sessão ou payloads integrais.
5. **Input**: usar referências do canal `controlV1` e do pacote de entrada para entender capacidades, mas não substituir o emissor do cliente oficial por outro emissor concorrente.
6. **Fortnite**: investigar preferência de toque como variável específica do título, separada de identidade Xbox.
7. **Compatibilidade**: mapear endpoints `v5` usados no NimboXcloud e os `v2` descritos no Stratix; não assumir equivalência sem verificação.
8. **Testes**: comparar três relatórios Edge Android do usuário, depois homologar em navegador real na fase final.

## Limitações

Esta pesquisa não prova que um Android Edge possa apresentar-se integralmente como console Xbox ao serviço. Alterações JS não reescrevem automaticamente cabeçalhos HTTP nativos, Client Hints de rede, TLS ou recursos de hardware. Alguns dados são de clientes independentes, não do navegador oficial.

## Próximos itens de auditoria

- Inspecionar a implementação completa de sessão/headers em XCloud Player e XStreaming.
- Confrontar com requisições reais do `play.xbox.com` atual sem expor credenciais.
- Validar formato de `x-ms-device-info` e possíveis campos de capacidade.
- Só então propor alteração do perfil Xbox que afete negociação de entrada.
