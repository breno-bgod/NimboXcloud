<div align="center">

# NimboXcloud

### Seu xCloud. Mais controle.
**Your xCloud. More control.**

**[Português](./README.md) · [English](./README_EN.md)**

**Em desenvolvimento para a nova experiência do Xbox Cloud Gaming — [play.xbox.com](https://play.xbox.com/)**

[**Testar versão em desenvolvimento**](./NimboXcloud.user.js) · [**Reportar problema**](./../../issues) · [**Plano de desenvolvimento**](./DEVELOPMENT_ROADMAP.md)

</div>

---

## Um projeto pessoal em desenvolvimento

Sou **KReight**, criador e único desenvolvedor do **NimboXcloud**. Este é um projeto pessoal, pequeno e independente, que estou construindo e testando aos poucos. **Ainda não é um produto pronto ou uma versão estável.**

O Xbox Cloud Gaming está mudando. Enquanto muitas ferramentas de personalização nasceram para a interface anterior, **estou desenvolvendo o NimboXcloud para a nova experiência web, em `play.xbox.com`** — não para a antiga página `xbox.com/play`.

Minha intenção é estudar como levar à nova versão recursos de controle, acessibilidade e personalização semelhantes aos que jogadores conhecem de outras ferramentas, testar novas ideias e melhorar gradualmente a experiência de streaming. Nem tudo o que planejo já funciona.

**O NimboXcloud é um userscript experimental e de código aberto.** Estou desenvolvendo-o para funcionar sobre o site oficial do Xbox Cloud Gaming; ele não hospeda jogos, não substitui o serviço e não garante acesso ou recursos que dependem da Microsoft.

## Avaliação e próxima atualização

Consulte a [avaliação comparativa e o plano de atualização](./docs/PLANO_ATUALIZACAO.md): preservação dos sistemas próprios, ajustes atuais e prioridades para servidores, acessibilidade, streaming, áudio e voz.

## Estado do projeto e funcionalidades congeladas

**Antes de instalar, contribuir ou criar um fork:** leia o [registro oficial de decisões, funcionalidades congeladas, recursos experimentais e problemas conhecidos](./docs/PROJECT_STATUS_AND_DECISIONS.md).

O NimboXcloud ainda **não está homologado como versão estável**. Algumas funções estão no código, mas foram retiradas da interface ou congeladas para evitar expectativas incorretas:

- **Congelados:** curvas do analógico, laboratório de identidade Xbox e equalizador avançado. A ocultação e a desativação completa desses módulos ainda estão em andamento.
- **Em retomada técnica experimental:** Remote Play xHome, por autorização explícita do mantenedor em 2026-11-12. A interface permanece oculta; descoberta, criação de sessão, negociação WebRTC e encerramento remoto best-effort estão em desenvolvimento, mas vídeo, áudio e controles jogáveis ainda não foram comprovados.
- **Experimentais disponíveis para testes:** Fortnite Console e giroscópio aplicado ao jogo; GPU/WebGL2 e editor de HUD continuam sob avaliação, sem garantia de funcionamento.
- **Mantidos:** painel NX, diagnóstico e seleção de servidor (troca de servidor já relatada como funcional pelo mantenedor).
- **Em revisão:** bitrate/qualidade (50 Mbps configurados não garantem 50 Mbps recebidos), perfil Automático e estabilidade do CI.

**Colaboradores e outras IAs:** usem o [registro de decisões](./docs/PROJECT_STATUS_AND_DECISIONS.md) como fonte de verdade antes de alterar recursos suspensos. O [roteiro de desenvolvimento](./docs/ROADMAP.md) apresenta as prioridades de estabilização.

## HUD de teclado e mouse por toque (experimental)

O módulo [`NimboXcloud Touch HUD v1.2.5`](./modules/NimboXcloud-Touch-HUD.user.js) está incluído no repositório e é **carregado pelo userscript principal via `@require`**, com acesso em **NX → Teclado e mouse → Ativar teclado e mouse**. Permite testar movimento relativo do mouse pelo dedo, joystick WASD, botões de teclado e edição do HUD. Requer jogo/sessão com suporte a mouse e teclado; não transforma mouse em analógico. **Não instale simultaneamente versões antigas do Nimbo Touch.**

Para testar: atualize/reinstale o userscript principal no Tampermonkey para aplicar o novo `@require`, abra um jogo compatível em `play.xbox.com` e acesse **NX → Teclado e mouse → Ativar teclado e mouse**. Desative instalações separadas antigas do Nimbo Touch para evitar duplicidade. Os testes reais de streaming continuam pendentes.

## O que estou implementando e testando

| Área | Recursos presentes no código |
| --- | --- |
| **Streaming e conexão** | Perfis de negociação de qualidade, limites de bitrate, escolha de data center, preferência baseada em latência e opção de priorizar IPv4. |
| **Imagem** | Perfis visuais, contraste e saturação, ajustes de enquadramento, tela cheia e captura de quadros. |
| **Áudio** | Equalizador de **10 bandas**, perfis para diferentes tipos de jogo e conteúdo, compressor, normalização, limitador, realce de diálogos e balanço estéreo. |
| **Controles e HUD** | Diagnóstico de controle físico, toque, teclado e mouse; editor visual de layout, escala e perfis por jogo, com importação e exportação. |
| **Giroscópio** | Leitura e calibração de movimento, prévia dos eixos e integração experimental com a entrada de controle. |
| **Microfone e vibração** | Testes de entrada de voz, ajustes disponíveis no navegador, opção de falar ao pressionar uma tecla e testes locais de vibração. |
| **Monitoramento** | Painel **NX** com indicadores disponíveis de FPS, latência, jitter, perda de pacotes, bitrate, resolução, codec, quadros descartados e erros de sessão. |
| **Laboratório de compatibilidade** | Ferramentas experimentais para estudar negociação de sessão, capacidades do navegador e diferenças entre experiências de acesso ao xCloud. |

> **Importante:** a tabela descreve recursos presentes no código, não uma garantia de que todos estejam funcionando em qualquer sessão. A qualidade real do streaming e as permissões de acesso continuam sob controle do serviço.

## O painel NX (em desenvolvimento)

Estou construindo o **NX** para reunir configurações e informações em uma única interface. A ideia é ajudar o jogador a entender a sessão, testar ajustes e recuperar preferências sem depender de ferramentas de diagnóstico externas.

Minha prioridade é **preservar os controles nativos**, inclusive o toque e os controles físicos, em vez de substituir indiscriminadamente os mecanismos do site.

## Nova experiência NX — interface minimalista (em desenvolvimento)

O **NX** está sendo reorganizado para mostrar menos elementos durante a jogatina, sem remover as ferramentas avançadas. A navegação separa **Vídeo, Streaming, Áudio, Voz, Controles, Teclado e mouse, Servidores, Personalizar, Compatibilidade e Sistema**. Cada área mantém suas próprias configurações, sem misturar a entrada do controle físico com teclado e mouse.

### NX Stream Monitor

Uma sobreposição opcional, separada do painel principal, está presente no código para acompanhar a transmissão enquanto o menu fica fechado:

- **Métricas configuráveis:** FPS decodificado, RTT WebRTC, bitrate recebido, perda de pacotes, resolução e jitter, conforme disponibilidade dos dados.
- **Layouts:** horizontal, vertical, compacto e automático de acordo com a largura da tela.
- **Aparência:** fundo de transparente a preto, quatro cores de texto e escala ajustável.
- **Posição:** quatro cantos da tela ou arrastar para reposicionar.
- **Região:** bandeiras para datacenters conhecidos quando identificados; uma seleção de região não prova que o streaming esteja fisicamente naquele país.
- **Preferências locais:** configurações mantidas no navegador.

O monitor reutiliza a telemetria WebRTC do script; **RTT não equivale ao ping interno do jogo**. A visualização e o posicionamento ainda exigem testes em sessões reais e em diferentes tamanhos de tela.

### Comparação de regiões: limite atual

O código mantém **histórico de RTT de datacenters efetivamente utilizados** em partidas anteriores. Uma comparação em tempo real entre todos os servidores, com sondagens periódicas em segundo plano, **ainda não foi implementada**. Resultados históricos não devem ser apresentados como ping atual.

Para detalhes técnicos e pendências, consulte [Arquitetura](./docs/ARQUITETURA.md) e [Plano de desenvolvimento](./DEVELOPMENT_ROADMAP.md).

## Estado atual: em desenvolvimento

**Este é um projeto em desenvolvimento, mantido por uma pessoa.** Existem recursos escritos no código, mas ainda estou verificando integração, compatibilidade e funcionamento em partidas reais. Não considero o sistema finalizado:

| Situação | Exemplos |
| --- | --- |
| **Presente no código** | Configurações de streaming, filtros de imagem, processamento de áudio, painel NX, diagnósticos e gerenciamento de layouts. |
| **Experimental / precisa de testes reais** | Reposicionamento do HUD nativo, curvas aplicadas aos analógicos, giroscópio controlando o jogo e perfis de compatibilidade. |
| **Experimental / em validação técnica** | Remote Play xHome: descoberta, criação de sessão, SDP/ICE e DELETE remoto best-effort presentes no código; vídeo, áudio e controles jogáveis ainda não comprovados. |
| **Ainda não implementado ou não demonstrado** | Upscaling real por CAS/FSR/DLSS, geração de quadros, teclado e mouse virtuais completos por toque, volante com pedais e assistência de mira contextual. |

**O laboratório Xbox não transforma um navegador em um console real e não desbloqueia jogos exclusivos de console.** Não anunciamos como concluído aquilo que ainda precisa de comprovação.

Acompanhe as prioridades e os testes pendentes no [plano de desenvolvimento](./DEVELOPMENT_ROADMAP.md). O [histórico de alterações](./CHANGELOG.md) registra as mudanças documentadas.

## Como testar o projeto

1. Instale um gerenciador de userscripts compatível, como o **Tampermonkey**.
2. Abra **[NimboXcloud.user.js](./NimboXcloud.user.js)** e escolha **Raw** para importar o arquivo.
3. Ative o script e acesse **[play.xbox.com](https://play.xbox.com/)**.

O script está sendo desenvolvido para a **nova interface** (`https://play.xbox.com/*`), não para a página antiga. **Use por sua conta e risco: podem ocorrer falhas, incompatibilidades e mudanças de comportamento durante os testes.** A compatibilidade depende das mudanças do site, do navegador e das permissões disponíveis.

## Quem está criando o projeto?

Sou **KReight**, o criador e único responsável pelo desenvolvimento atual do NimboXcloud. Estou aprendendo, planejando, programando e testando suas funcionalidades gradualmente; não há uma equipe ou empresa por trás dele. Sugestões, análises de código, relatórios de problemas e contribuições são bem-vindos.

O código está disponível sob a **GNU GPL versão 3 ou posterior (GPL-3.0-or-later)**, com preservação dos avisos aplicáveis às partes reutilizadas. A base técnica deriva de [xbox-cloud-unlock, de RoyLiu04](https://github.com/RoyLiu04/xbox-cloud-unlock); entre as referências de engenharia estão [Better xCloud, de redphx](https://github.com/redphx/better-xcloud) e [Xbox Cloud Gaming Optimizer, de darkchaox](https://github.com/darkchaox/xbox-cloud-gaming-optimizer). Referências e créditos **não significam parceria ou endosso**.

Este é um projeto **não oficial**, sem afiliação à Microsoft ou ao Xbox. Alterações experimentais de região podem não funcionar e podem contrariar termos do serviço.

## Licença

A distribuição atual adota [GPL-3.0-or-later](./LICENSE). Redistribuições e modificações devem cumprir a GPL, incluindo a disponibilização do código-fonte correspondente quando exigida. Os [avisos MIT de terceiros](./THIRD_PARTY_NOTICES.md) permanecem preservados. As versões anteriormente publicadas sob MIT mantêm suas permissões originais.

## Explore o projeto

- [**Código principal**](./NimboXcloud.user.js)
- [**Plano de desenvolvimento**](./DEVELOPMENT_ROADMAP.md)
- [**Histórico de alterações**](./CHANGELOG.md)
- [**Arquitetura e limites técnicos**](./docs/ARQUITETURA.md)
- [**Como contribuir**](./CONTRIBUTING.md)
- [**English — Full README**](./README_EN.md)

---

<div align="center">

**NimboXcloud — Seu xCloud. Mais controle.**

*Projeto pessoal de KReight · Em desenvolvimento · Open source · GPL-3.0-or-later · play.xbox.com*

</div>

