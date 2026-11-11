# NimboXcloud

**Mais controle sobre a experiência de jogar pelo navegador.**

O **NimboXcloud** é um userscript não oficial para o [Xbox Cloud Gaming](https://play.xbox.com/). O projeto reúne ajustes locais de região, seleção de data center, negociação de qualidade de vídeo e diagnóstico de conexão em uma interface acessível, com atenção especial ao uso em **Android, Samsung DeX e Windows**.

O objetivo é oferecer escolhas ao jogador sem exigir que ele abandone o toque ou o controle físico. O script funciona sobre o site oficial e **não é um serviço de cloud gaming independente**.

> **Estado do código auditado:** versão **4.12.16**, em desenvolvimento. Recursos implementados no código não significam compatibilidade garantida com todas as versões do xCloud. Os testes reais de streaming em diferentes dispositivos ainda precisam ser documentados.

## Funcionalidades identificadas no código (v4.12.16)

**Estado:** implementado no userscript não equivale a funcionamento validado em uma sessão real. Recursos experimentais estão indicados. O serviço determina a qualidade efetiva e as permissões de acesso.

| Área | Recursos presentes | Limites / validação |
| --- | --- | --- |
| Streaming e rede | Perfis 720p, 1080p/Windows e 1080p HQ/Tizen; bitrate automático ou limites via SDP; seleção de data center, preferência por menor RTT histórico, filtro ICE IPv6 para preferir IPv4 | Resolução e bitrate não são garantidos; HQ/Tizen pode afetar o toque; testes ponta a ponta pendentes |
| Mercado | Ajustes experimentais de mercado/território e cookie de região | Não garantem autorização, catálogo ou acesso ao serviço; podem contrariar termos |
| Vídeo local | Perfis Original/Equilibrado/Vívido/Manual, contraste, saturação, enquadramento, fullscreen, captura PNG e economia de filtros em aba oculta | O controle de “nitidez” é contraste, **não** CAS, FSR, DLSS ou upscaling real |
| Áudio | Volume, mudo, escolha de saída quando suportada, equalizador de 10 bandas, perfis FPS/corrida/cinema/música/diálogos, compressor, normalização, limitador, realce de diálogos, mono e balanço L/R | Efeitos locais dependem da API do navegador; chat e jogo não têm volumes separados quando chegam misturados |
| Entrada e HUD | Detecção/diagnóstico de gamepad, toque, mouse e teclado; curvas experimentais de analógicos; editor de layout, escala, perfis por jogo, importação/exportação/backup | Integração com botões nativos é experimental, por CSS e correspondência segura; não cria HUD independente nem força prioridade de entrada |
| Giroscópio | Leitura, calibração, prévia com inversão/suavização/zona morta; envio experimental ao gamepad com intensidade, controle-alvo e ativação por LT ou contínua | Algumas opções alteram apenas a prévia; saída jogável e estabilidade ainda precisam de teste real |
| Microfone e vibração | Seleção/teste de microfone, medidor, redução de ruído, cancelamento de eco, ganho automático, mudo e push-to-talk; testes de vibração de controle/celular | Chat depende do xCloud; testes hápticos não alteram automaticamente o rumble enviado pelo serviço |
| Laboratório Xbox | Perfis Original/Android/Desktop/Xbox/Smart TV, diagnóstico de identidade e capacidades, observação de ofertas/sessões, Xbox Shell experimental, atalhos e exportação de evidências | Perfil Xbox/TV preserva a identidade nativa; **não** simula hardware ou autenticação real de console e não libera catálogo exclusivo |
| Diagnóstico | Overlay com FPS, RTT, jitter, perda, bitrate, resolução, codec, quadros descartados, servidor, histórico e erros; relatórios estruturados | Métricas dependem dos dados expostos pelo WebRTC; relatórios não comprovam sozinhos reprodução ou autorização |
| Interface | Painel NX expansível, atalhos configuráveis, recuperação de UI, preferências locais e limpeza de cache | Compatibilidade visual e funcional deve ser testada no novo site |

### Não concluído ou não comprovado

- Compatibilidade integral e testes autenticados reproduzíveis em Android, Samsung DeX e Windows.
- Giroscópio estável em jogo e integração do HUD nativo em diferentes títulos.
- Teclado/mouse virtual completo por toque, volante com pedais e assistência de mira contextual **não confirmados neste userscript**.
- Upscaling CAS/FSR/DLSS, geração de quadros e controle universal de áudio espacial **não implementados**.
- Remote Play integrado **não confirmado como funcional**.
- Identidade/autorização de Xbox real e liberação de jogos exclusivos de console **não demonstradas**.

## O que o projeto oferece

| Recurso | Descrição |
| --- | --- |
| Perfis de vídeo | 1080p com perfil Windows por padrão; 1080p HQ/Tizen experimental e 720p manuais |
| Bitrate | Opções automáticas e limites configuráveis; valores maiores podem ser solicitados pelo script, mas não são garantidos pelo servidor |
| Região | Ajustes de mercado e território em respostas/requisições específicas do site |
| Data center | Preferência por regiões de streaming disponíveis no script |
| Conectividade | Opção de filtrar candidatos ICE IPv6 para priorizar IPv4 |
| Monitoramento | Painel com informações de RTT, perda de pacotes, bitrate, resolução e quadros descartados |
| Entrada | Entradas gerenciadas nativamente pelo xCloud; o userscript não intercepta o bloqueio do ponteiro nem força prioridade entre toque, gamepad e teclado/mouse |

**Sobre 1080p HQ:** o perfil solicita uma modalidade de negociação que usa a identificação `tizen`, semelhante a abordagens estudadas em outros projetos. Não é uma promessa de 1440p ou mesmo de 1080p efetivos: a resolução final depende do servidor e da sessão WebRTC. A escolha de qualidade não deve depender da resolução física da janela ou do modo DeX. Para preservar o controle virtual, o padrão atual é 1080p/Windows; HQ/Tizen é experimental.

## Sobre o desenvolvedor

**NimboXcloud — Developed by KReight.**

Sou **KReight**, estudante autodidata de JavaScript e desenvolvedor independente em formação. Aprendo em casa, por meio de cursos, vídeos de diferentes canais do YouTube e materiais gratuitos disponíveis na internet. Estudo códigos e projetos de código aberto para entender como funcionam e aplicar o que aprendi.

O **NimboXcloud é um experimento de estudo**: uma forma de colocar em prática os conhecimentos que adquiri até agora, aprender com erros e desenvolver minhas próprias soluções. Não sou uma empresa nem uma equipe profissional. O projeto está em evolução, e **aceito ajuda, conselhos, sugestões, análises de código, relatórios de bugs e contribuições** de quem quiser colaborar.

## Código aberto e liberdade de uso

O NimboXcloud é **open source**, disponibilizado sob a **licença MIT**. Você pode acessar o código, estudar, copiar, modificar, criar forks, distribuir versões próprias e utilizá-lo em outros projetos, inclusive comerciais, conforme as condições da licença.

**Meu pedido à comunidade:** ao usar o NimboXcloud como base ou inspiração, mencione **KReight / NimboXcloud** nos créditos ou agradecimentos e, se possível, inclua um link para este repositório. Esse reconhecimento é um **pedido de cortesia**, não uma obrigação adicional à licença MIT.

**Obrigação da licença:** cópias e partes substanciais do software devem preservar os avisos de copyright e a licença MIT aplicáveis, inclusive os avisos do código original de terceiros. A atribuição do código de origem não significa que seus autores sejam responsáveis pelas modificações de KReight.

Este projeto deriva tecnicamente de [xbox-cloud-unlock, de RoyLiu04](https://github.com/RoyLiu04/xbox-cloud-unlock). Também estuda o [Better xCloud](https://github.com/redphx/better-xcloud) e outras referências citadas abaixo. Não existe afiliação ou endosso oficial desses projetos.

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

O projeto ainda está em fase experimental. **Nem toda ideia mencionada é uma funcionalidade pronta**; o objetivo é evoluir por versões, documentar resultados e receber contribuições da comunidade.

---

**Read this document in English:** [README_EN.md](./README_EN.md).

## Instalação

1. Instale um gerenciador de userscripts compatível, como o Tampermonkey.
2. Abra [`xbox-cloud-unlock-ptbr.user.js`](./NimboXcloud.user.js).
3. No GitHub, use **Raw / Download raw file** e importe o arquivo no gerenciador.
4. Ative o script e abra `https://play.xbox.com/`.

O script é executado em `document-start`. A compatibilidade depende do navegador e das permissões do gerenciador de userscripts.

**Atualizações:** o script declara `@updateURL` e `@downloadURL` apontando para a branch `main`. **Como o repositório está privado, a atualização automática não funciona normalmente pelo Tampermonkey**: o endereço Raw requer acesso autorizado. Até tornar o arquivo acessível publicamente, atualize manualmente. Não altere a visibilidade do repositório sem revisar o código e os dados publicados. Enquanto o repositório permanecer privado, o download exige autorização do GitHub; após torná-lo público, a instalação poderá ser feita pelo arquivo Raw. Até a configuração do canal de atualização, importe novas versões manualmente.

## Documentação

- [Histórico de versões](./CHANGELOG.md)
- [Arquitetura e limites técnicos](./docs/ARQUITETURA.md)
- [Roteiro de desenvolvimento](./docs/ROADMAP.md)
- [Guia de contribuição](./CONTRIBUTING.md)

## Agradecimentos, referências e atribuições

Este projeto não surgiu do zero. O código declara como base e referências técnicas:

- [**RoyLiu04 / xbox-cloud-unlock**](https://github.com/RoyLiu04/xbox-cloud-unlock) — autor da base original reutilizada neste userscript, licenciada sob MIT; aviso de copyright e licença preservados em [LICENSE](./LICENSE).
- [**redphx / better-xcloud**](https://github.com/redphx/better-xcloud) — referência de engenharia para seleção de data centers, perfis de qualidade e interceptações relacionadas ao streaming.
- [**darkchaox / xbox-cloud-gaming-optimizer**](https://github.com/darkchaox/xbox-cloud-gaming-optimizer) — referência histórica para abordagens de região e otimização.

A menção a um projeto de referência **não implica parceria, endosso ou incorporação integral de seu código**. Agradecimentos não substituem os avisos de licença e copyright exigidos para material reutilizado.

## Limitações e aviso legal

- **Não oficial:** sem afiliação à Microsoft, Xbox ou autores dos projetos citados.
- O serviço pode modificar suas APIs, políticas e mecanismos de negociação sem aviso.
- Alterações de mercado e região podem não funcionar e podem contrariar termos de uso do serviço. Cada usuário é responsável por verificar as condições aplicáveis.
- Nenhum ajuste garante resolução, bitrate, latência ou disponibilidade do serviço.
- O projeto está em desenvolvimento; recursos devem ser validados em dispositivos reais antes de uma versão estável pública.

## Desenvolvimento

Mudanças são registradas por commits e descritas no [CHANGELOG](./CHANGELOG.md). O projeto é aberto a contribuições. Testes reais de compatibilidade e a revisão contínua de segurança e licenças permanecem necessários.
