# NimboXcloud

<p align="center">
  <strong>Português</strong> · <a href="./README_EN.md"><strong>English — Read the full project description</strong></a>
</p>

> **English-speaking visitors:** The complete English version of this README, including features, development status, installation, limitations and credits, is available in **[README_EN.md](./README_EN.md)**.

**Mais controle sobre o Xbox Cloud Gaming, diretamente no navegador.**

O **NimboXcloud** é um userscript de código aberto que adiciona uma central de controle ao [Xbox Cloud Gaming](https://play.xbox.com/). Ele permite personalizar a experiência de streaming, ajustar imagem e áudio, organizar controles e acompanhar a qualidade da conexão — sem substituir o serviço oficial.

> **Versão do código verificada:** 4.12.16. Projeto em desenvolvimento: a presença de um recurso no código não garante que funcione em todas as sessões. Funções experimentais estão identificadas abaixo.

## O que o NimboXcloud faz

### Streaming e conexão
- **Qualidade de vídeo:** perfis de negociação 720p, 1080p e 1080p HQ experimental.
- **Bitrate:** modo automático e limites configuráveis solicitados à sessão.
- **Servidor:** seleção de data center e preferência automática baseada no histórico de latência.
- **Rede:** opção de priorizar IPv4, filtrando candidatos IPv6 na negociação WebRTC.
- **Região:** ajustes experimentais de mercado e território nas comunicações do site.

A resolução, o bitrate, a disponibilidade e o acesso aos jogos continuam dependendo do Xbox Cloud Gaming.

### Imagem e exibição
- Perfis visuais **Original, Equilibrado, Vívido e Manual**.
- Ajustes locais de contraste, cor e saturação.
- Modos de enquadramento para preservar ou preencher a tela.
- Tela cheia, captura de quadro em PNG e economia de efeitos quando a aba está oculta.

O ajuste chamado “nitidez” utiliza contraste: **não é upscaling por CAS, FSR ou DLSS**.

### Áudio
- Volume, mudo e seleção de saída quando o navegador oferece suporte.
- **Equalizador de 10 bandas**, de 32 Hz a 16 kHz.
- Perfis para **FPS, corrida, cinema, música e diálogos**.
- Compressor, normalização, limitador, realce de diálogos, áudio mono e balanço esquerdo/direito.

### Controles e HUD
- Diagnóstico de **controle físico, toque, mouse e teclado**, inclusive atividade simultânea.
- Editor visual de posições e escala dos botões, com perfis por jogo.
- Importação, exportação e backup dos layouts.
- **Integração experimental com o HUD nativo:** tenta reposicionar botões identificados com segurança, sem criar novos comandos de toque.
- **Curvas experimentais para analógicos**, com opção de restaurar o comportamento nativo.

### Giroscópio — experimental
- Leitura de orientação, calibração e prévia dos eixos.
- Inversão, zona morta e suavização da **prévia**.
- Opção experimental de contribuir para os eixos de um controle, com intensidade configurável e ativação contínua ou ao segurar LT.

**Importante:** nem todo ajuste da prévia modifica a mira no jogo. A saída jogável precisa de testes reais.

### Microfone e vibração
- Seleção e teste de microfone, medidor de entrada, redução de ruído, cancelamento de eco, ganho automático, mudo e opção de apertar uma tecla para falar.
- Testes locais de vibração do controle e do dispositivo, conforme o suporte do navegador.

A transmissão de voz e a resposta tátil durante o jogo dependem do serviço e dos dispositivos.

### Monitoramento em tempo real
O **painel NX** reúne, quando disponíveis, dados de **FPS, RTT, jitter, perda de pacotes, bitrate recebido, resolução, codec, quadros descartados, congelamentos e servidor**. Também oferece diagnósticos de sessão, registros de erros e relatórios estruturados para investigação de problemas.

### Laboratório de compatibilidade — experimental
O projeto inclui perfis de experiência, observação da negociação de sessão, verificação de capacidades do navegador, relatórios de protocolo e uma interface **Xbox Shell** experimental. Esses recursos ajudam a investigar compatibilidade, mas **não transformam o navegador em um Xbox real, não alteram autenticação do servidor e não liberam jogos exclusivos de console**.

## Estado de desenvolvimento

**Recursos presentes no código:** configurações de streaming, filtros visuais, processamento de áudio, editor de layouts, diagnósticos, painel NX e ferramentas de testes.

**Recursos experimentais ou ainda não validados em partidas reais:** integração com HUD nativo, curvas aplicadas aos analógicos, saída de giroscópio para o jogo, perfis de compatibilidade e funcionamento ponta a ponta em diferentes ambientes.

**Não implementados ou não comprovados neste userscript:** geração de quadros, upscaling CAS/FSR/DLSS real, teclado e mouse virtuais completos por toque, volante virtual com pedais, assistência de mira contextual, Remote Play integrado e autenticação como console Xbox.

O objetivo é **melhorar a experiência do jogador sem prometer capacidades que o navegador ou o serviço não oferecem**.

## Instalação

1. Instale um gerenciador de userscripts compatível, como o Tampermonkey.
2. Abra [NimboXcloud.user.js](./NimboXcloud.user.js) e selecione **Raw** para importar o script.
3. Ative o userscript e acesse [play.xbox.com](https://play.xbox.com/).

O script é executado no início do carregamento da página. **Se o repositório estiver privado**, o link Raw exige autorização e as atualizações automáticas pelo gerenciador podem não funcionar; nesse caso, importe as novas versões manualmente.

## Sobre o projeto

**Desenvolvido por KReight.** O NimboXcloud é um projeto independente de estudo e desenvolvimento, aberto a sugestões, análises, relatos de bugs e contribuições.

O código é disponibilizado sob a **licença MIT**, respeitando também os avisos e licenças aplicáveis às partes reutilizadas. O projeto deriva tecnicamente de [xbox-cloud-unlock (RoyLiu04)](https://github.com/RoyLiu04/xbox-cloud-unlock) e utiliza como referências de engenharia o [Better xCloud (redphx)](https://github.com/redphx/better-xcloud) e o [Xbox Cloud Gaming Optimizer (darkchaox)](https://github.com/darkchaox/xbox-cloud-gaming-optimizer). Essas referências não implicam parceria ou endosso.

O NimboXcloud **não é afiliado à Microsoft ou ao Xbox**. Ajustes de região podem não funcionar e podem contrariar termos do serviço.

## Documentação e contribuição

- [Histórico de alterações](./CHANGELOG.md)
- [Plano de desenvolvimento e testes pendentes](./DEVELOPMENT_ROADMAP.md)
- [Arquitetura e limites técnicos](./docs/ARQUITETURA.md)
- [Guia de contribuição](./CONTRIBUTING.md)
- [English — full project description](./README_EN.md)
