# Xbox Cloud Gaming Unlock (PT-BR)

**Mais controle sobre a experiência de jogar pelo navegador.**

O **Xbox Cloud Gaming Unlock (PT-BR)** é um userscript não oficial para o [Xbox Cloud Gaming](https://play.xbox.com/). O projeto reúne ajustes locais de região, seleção de data center, negociação de qualidade de vídeo e diagnóstico de conexão em uma interface acessível, com atenção especial ao uso em **Android, Samsung DeX e Windows**.

O objetivo é oferecer escolhas ao jogador sem exigir que ele abandone o toque ou o controle físico. O script funciona sobre o site oficial e **não é um serviço de cloud gaming independente**.

> **Estado atual:** versão **3.3.1**, em desenvolvimento. Recursos implementados no código não significam compatibilidade garantida com todas as versões do xCloud. Os testes reais de streaming em diferentes dispositivos ainda precisam ser documentados.

## O que o projeto oferece

| Recurso | Descrição |
| --- | --- |
| Perfis de vídeo | Máxima qualidade/1080p HQ por padrão, 1080p e 720p como escolhas manuais |
| Bitrate | Opções automáticas e limites configuráveis de 5, 8, 10, 12 e 15 Mbps |
| Região | Ajustes de mercado e território em respostas/requisições específicas do site |
| Data center | Preferência por regiões de streaming disponíveis no script |
| Conectividade | Opção de filtrar candidatos ICE IPv6 para priorizar IPv4 |
| Monitoramento | Painel com informações de RTT, perda de pacotes, bitrate, resolução e quadros descartados |
| Entrada | Preservação da experiência por toque e gamepad; teclado e mouse não são impostos pelo perfil de vídeo |

**Sobre 1080p HQ:** o perfil solicita uma modalidade de negociação que usa a identificação `tizen`, semelhante a abordagens estudadas em outros projetos. Não é uma promessa de 1440p ou mesmo de 1080p efetivos: a resolução final depende do servidor e da sessão WebRTC. A escolha de qualidade não deve depender da resolução física da janela ou do modo DeX.

## Por que criamos este projeto?

O desenvolvimento surgiu da necessidade de controlar melhor a experiência do Xbox Cloud Gaming em dispositivos móveis e ambientes híbridos, especialmente quando uma sessão no Samsung DeX recebe vídeo abaixo de 720p mesmo com uma tela maior. Queremos investigar esse comportamento, oferecer opções de qualidade independentes do tamanho da janela e manter o uso por toque, gamepad e periféricos opcionais.

O foco é **estabilidade, transparência das configurações e diagnóstico**, sem apresentar mudanças de negociação como garantias de desempenho.

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
