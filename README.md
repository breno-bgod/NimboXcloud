<div align="center">

# NimboXcloud

### Seu xCloud. Mais controle.
**Your xCloud. More control.**

**[Português](./README.md) · [English](./README_EN.md)**

**Em desenvolvimento (Alpha) para a nova experiência do Xbox Cloud Gaming — [play.xbox.com](https://play.xbox.com/)**

[**Testar versão Alpha**](./NimboXcloud.user.js) · [**Reportar problema**](./../../issues) · [**Plano de desenvolvimento**](./DEVELOPMENT_ROADMAP.md)

</div>

---

## Um projeto pessoal em fase Alpha

Sou **KReight**, criador e único desenvolvedor do **NimboXcloud**. Este é um projeto pessoal, pequeno e independente, que estou construindo e testando aos poucos. **Ainda não é um produto pronto ou uma versão estável.**

O Xbox Cloud Gaming está mudando. Enquanto muitas ferramentas de personalização nasceram para a interface anterior, **estou desenvolvendo o NimboXcloud para a nova experiência web, em `play.xbox.com`** — não para a antiga página `xbox.com/play`.

Minha intenção é estudar como levar à nova versão recursos de controle, acessibilidade e personalização semelhantes aos que jogadores conhecem de outras ferramentas, testar novas ideias e melhorar gradualmente a experiência de streaming. Nem tudo o que planejo já funciona.

**O NimboXcloud é um userscript experimental e de código aberto.** Estou desenvolvendo-o para funcionar sobre o site oficial do Xbox Cloud Gaming; ele não hospeda jogos, não substitui o serviço e não garante acesso ou recursos que dependem da Microsoft.

## O que estou implementando e testando

| Área | Recursos presentes no código Alpha |
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

## Estado atual: Alpha / testes

**Esta é uma versão Alpha de um projeto mantido por uma pessoa.** Existem recursos escritos no código, mas ainda estou verificando integração, compatibilidade e funcionamento em partidas reais. Não considero o sistema finalizado:

| Situação | Exemplos |
| --- | --- |
| **Presente no código** | Configurações de streaming, filtros de imagem, processamento de áudio, painel NX, diagnósticos e gerenciamento de layouts. |
| **Experimental / precisa de testes reais** | Reposicionamento do HUD nativo, curvas aplicadas aos analógicos, giroscópio controlando o jogo e perfis de compatibilidade. |
| **Ainda não implementado ou não demonstrado** | Upscaling real por CAS/FSR/DLSS, geração de quadros, teclado e mouse virtuais completos por toque, volante com pedais, assistência de mira contextual e Remote Play integrado. |

**O laboratório Xbox não transforma um navegador em um console real e não desbloqueia jogos exclusivos de console.** Não anunciamos como concluído aquilo que ainda precisa de comprovação.

Acompanhe as prioridades e os testes pendentes no [plano de desenvolvimento](./DEVELOPMENT_ROADMAP.md). O [histórico de alterações](./CHANGELOG.md) registra as mudanças documentadas.

## Como testar a versão Alpha

1. Instale um gerenciador de userscripts compatível, como o **Tampermonkey**.
2. Abra **[NimboXcloud.user.js](./NimboXcloud.user.js)** e escolha **Raw** para importar o arquivo.
3. Ative o script e acesse **[play.xbox.com](https://play.xbox.com/)**.

O script está sendo desenvolvido para a **nova interface** (`https://play.xbox.com/*`), não para a página antiga. **Use por sua conta e risco: podem ocorrer falhas, incompatibilidades e mudanças de comportamento durante os testes.** A compatibilidade depende das mudanças do site, do navegador e das permissões disponíveis.

## Quem está criando o projeto?

Sou **KReight**, o criador e único responsável pelo desenvolvimento atual do NimboXcloud. Estou aprendendo, planejando, programando e testando suas funcionalidades gradualmente; não há uma equipe ou empresa por trás dele. Sugestões, análises de código, relatórios de problemas e contribuições são bem-vindos.

O código está disponível sob a **licença MIT**, com preservação dos avisos aplicáveis às partes reutilizadas. A base técnica deriva de [xbox-cloud-unlock, de RoyLiu04](https://github.com/RoyLiu04/xbox-cloud-unlock); entre as referências de engenharia estão [Better xCloud, de redphx](https://github.com/redphx/better-xcloud) e [Xbox Cloud Gaming Optimizer, de darkchaox](https://github.com/darkchaox/xbox-cloud-gaming-optimizer). Referências e créditos **não significam parceria ou endosso**.

Este é um projeto **não oficial**, sem afiliação à Microsoft ou ao Xbox. Alterações experimentais de região podem não funcionar e podem contrariar termos do serviço.

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

*Projeto pessoal de KReight · Alpha / em desenvolvimento · Open source · MIT · play.xbox.com*

</div>
