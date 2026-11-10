# Xbox Cloud Gaming Unlock (PT-BR)

Userscript independente para `https://play.xbox.com/`, com controles de região, servidor, qualidade de streaming, bitrate e painel de diagnóstico.

## Versão inicial no repositório
- **v3.3.1** — configuração inicial de qualidade HQ e opções manuais de resolução.
- Arquivo principal: [xbox-cloud-unlock-ptbr.user.js](./xbox-cloud-unlock-ptbr.user.js)

## Instalação
1. Abra o arquivo principal no GitHub com sua conta autenticada.
2. Baixe o arquivo em **Raw / Download raw file**.
3. Importe-o no Tampermonkey e substitua a versão anterior.

> **Atenção:** o repositório é privado. Links `raw.githubusercontent.com` não são uma fonte pública de atualização automática; não há autoatualização do Tampermonkey configurada para esse repositório. Atualizações deverão ser importadas manualmente até a definição de um canal de distribuição autenticado.

## Política de desenvolvimento
- Registrar cada mudança em commit próprio.
- Manter o arquivo principal completo e instalável.
- Validar sintaxe antes de publicar; teste real de streaming requer navegador e sessão xCloud.
- Preservar controles por toque, gamepad e periféricos opcionais.
- Não confundir o perfil de negociação 1080p HQ com garantia de resolução recebida.

## Créditos e licença
Este projeto deriva de [xbox-cloud-unlock](https://github.com/RoyLiu04/xbox-cloud-unlock), de RoyLiu04, sob licença MIT. Preservar avisos de direitos autorais e licença do código original.
