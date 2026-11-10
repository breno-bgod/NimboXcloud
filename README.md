# Xbox Cloud Gaming Unlock (PT-BR)

**Mais controle sobre a experiência de jogar pelo navegador.**

O **Xbox Cloud Gaming Unlock (PT-BR)** é um userscript não oficial para o [Xbox Cloud Gaming](https://play.xbox.com/). O projeto reúne ajustes locais de região, seleção de data center, negociação de qualidade de vídeo e diagnóstico de conexão em uma interface acessível, com atenção especial ao uso em **Android, Samsung DeX e Windows**.

O objetivo é oferecer escolhas ao jogador sem exigir que ele abandone o toque ou o controle físico. O script funciona sobre o site oficial e **não é um serviço de cloud gaming independente**.

> **Estado atual:** versão **3.4.0**, em desenvolvimento. Recursos implementados no código não significam compatibilidade garantida com todas as versões do xCloud. Os testes reais de streaming em diferentes dispositivos ainda precisam ser documentados.

## O que o projeto oferece

| Recurso | Descrição |
| --- | --- |
| Perfis de vídeo | Máxima qualidade/1080p HQ por padrão, 1080p e 720p como escolhas manuais |
| Bitrate | Opções automáticas e limites configuráveis de 5, 8, 10, 12 e 15 Mbps |
| Região | Ajustes de mercado e território em respostas/requisições específicas do site |
| Data center | Preferência por regiões de streaming disponíveis no script |
| Conectividade | Opção de filtrar candidatos ICE IPv6 para priorizar IPv4 |
| Monitoramento | Painel com informações de RTT, perda de pacotes, bitrate, resolução e quadros descartados |
| Entrada | Entradas gerenciadas nativamente pelo xCloud; o userscript não intercepta o bloqueio do ponteiro nem força prioridade entre toque, gamepad e teclado/mouse |

**Sobre 1080p HQ:** o perfil solicita uma modalidade de negociação que usa a identificação `tizen`, semelhante a abordagens estudadas em outros projetos. Não é uma promessa de 1440p ou mesmo de 1080p efetivos: a resolução final depende do servidor e da sessão WebRTC. A escolha de qualidade não deve depender da resolução física da janela ou do modo DeX.

## Sobre mim e este projeto

Eu me chamo **Bigode**. Este é um projeto pessoal, pequeno e informal que estou desenvolvendo no meu tempo livre. Não sou uma empresa nem uma equipe de desenvolvimento: estou estudando como o Xbox Cloud Gaming funciona no navegador, testando ideias e tentando criar melhorias úteis para quem joga pelo celular, no Samsung DeX ou no computador.

Minha principal inspiração é o **[Better xCloud](https://github.com/redphx/better-xcloud)**, criado por **redphx**. Considero este projeto parte do meu trabalho experimental de **fork/adaptação do ecossistema Better xCloud**, mas é importante explicar a origem do código: **a versão de userscript publicada aqui deriva diretamente de [xbox-cloud-unlock, de RoyLiu04](https://github.com/RoyLiu04/xbox-cloud-unlock)** e estuda implementações do Better xCloud. Portanto, este repositório ainda **não é um fork técnico direto do repositório de redphx**, nem representa o projeto oficial dele.

### Por que estou fazendo isso?

Em 2026, a Microsoft começou a testar uma [nova experiência web do Xbox Cloud Gaming](https://news.xbox.com/en-us/2026/01/26/try-the-new-xbox-cloud-gaming-web-experience-now-in-public-preview/). Isso criou uma transição entre duas interfaces:

- **[xbox.com/play](https://www.xbox.com/play)** — experiência anterior, para a qual o Better xCloud foi desenvolvido.
- **[play.xbox.com](https://play.xbox.com/)** — nova experiência web, que é o alvo deste userscript.

O próprio Better xCloud [informou dificuldades de compatibilidade com `play.xbox.com` em novembro de 2026](https://github.com/redphx/better-xcloud) e está trabalhando na adaptação. Eu quero aproveitar esse período para aprender, testar abordagens próprias e contribuir com alternativas experimentais. **Não estou afirmando que já resolvi todos os problemas de compatibilidade.**

### Projetos que estou estudando

| Projeto | O que procuro aprender |
| --- | --- |
| [Better xCloud — redphx](https://github.com/redphx/better-xcloud) | Controles, experiência de streaming, perfis de qualidade, diagnóstico e arquitetura do userscript |
| [Better xCloud para Android — redphx](https://github.com/redphx/better-xcloud-android) | Experiência móvel, suporte a toque e integração com Android |
| [Xbox Cloud Unlock — RoyLiu04](https://github.com/RoyLiu04/xbox-cloud-unlock) | Base técnica original deste userscript, ajustes de mercado e região |
| [Xbox Cloud Gaming Optimizer — darkchaox](https://github.com/darkchaox/xbox-cloud-gaming-optimizer) | Experimentos anteriores com acesso regional e otimização |

Estou estudando essas soluções para entender o que já funciona, o que deixou de funcionar com o novo site e quais ideias podem ser adaptadas de forma responsável, respeitando as licenças e os créditos de cada autor.

### O que quero construir

Quero um userscript que permita **escolher melhor como jogar**, com qualidade de imagem configurável, preferência de servidores, informações claras sobre a conexão e suporte a diferentes dispositivos, sem obrigar quem usa Android ou DeX a jogar como se estivesse em um PC com teclado e mouse.

O projeto ainda está em fase experimental. **Nem toda ideia mencionada é uma funcionalidade pronta**; meu objetivo é evoluir por versões, documentar os resultados e, quando estiver suficientemente estável, abrir o repositório para outras pessoas testarem e contribuírem.

---

## Instalação

1. Instale um gerenciador de userscripts compatível, como o Tampermonkey.
2. Abra [`xbox-cloud-unlock-ptbr.user.js`](./xbox-cloud-unlock-ptbr.user.js).
3. No GitHub, use **Raw / Download raw file** e importe o arquivo no gerenciador.
4. Ative o script e abra `https://play.xbox.com/`.

O script é executado em `document-start`. A compatibilidade depende do navegador e das permissões do gerenciador de userscripts.

**Repositório privado:** é necessário estar autenticado e autorizado no GitHub para baixar o código. Atualização automática via URL pública ainda não está configurada; novas versões devem ser importadas manualmente por enquanto.

## Documentação

- [Histórico de versões](./CHANGELOG.md)
- [Arquitetura e limites técnicos](./docs/ARQUITETURA.md)
- [Roteiro de desenvolvimento](./docs/ROADMAP.md)
- [Guia de contribuição](./CONTRIBUTING.md)

## Origens e referências

Este projeto não surgiu do zero. O código declara como base e referências técnicas:

- [**RoyLiu04 / xbox-cloud-unlock**](https://github.com/RoyLiu04/xbox-cloud-unlock) — origem do userscript e de mecanismos de desbloqueio/ajuste de região; o cabeçalho atual atribui autoria a RoyLiu04 e declara licença MIT.
- [**redphx / better-xcloud**](https://github.com/redphx/better-xcloud) — referência de engenharia para seleção de data centers, perfis de qualidade e interceptações relacionadas ao streaming.
- [**darkchaox / xbox-cloud-gaming-optimizer**](https://github.com/darkchaox/xbox-cloud-gaming-optimizer) — referência histórica para abordagens de região e otimização.

A menção a um projeto de referência **não implica parceria, endosso ou incorporação integral de seu código**. Antes da abertura pública, revisaremos os avisos de copyright e os requisitos das licenças de cada trecho reutilizado.

## Limitações e aviso legal

- **Não oficial:** sem afiliação à Microsoft, Xbox ou autores dos projetos citados.
- O serviço pode modificar suas APIs, políticas e mecanismos de negociação sem aviso.
- Alterações de mercado e região podem não funcionar e podem contrariar termos de uso do serviço. Cada usuário é responsável por verificar as condições aplicáveis.
- Nenhum ajuste garante resolução, bitrate, latência ou disponibilidade do serviço.
- O projeto está em desenvolvimento; recursos devem ser validados em dispositivos reais antes de uma versão estável pública.

## Desenvolvimento

Mudanças são registradas por commits e descritas no [CHANGELOG](./CHANGELOG.md). A intenção é abrir o repositório ao público após revisão técnica, de segurança, documentação e licenciamento.
