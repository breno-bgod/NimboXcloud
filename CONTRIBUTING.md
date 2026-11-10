# Como contribuir

O projeto está em desenvolvimento e atualmente é mantido em repositório privado. Este documento orienta futuras contribuições quando o acesso for ampliado.

## Antes de propor mudanças
- Abra uma issue descrevendo o problema, navegador, sistema operacional, versão do userscript e passos de reprodução.
- Remova de capturas e relatórios qualquer token, cookie, identificador de conta, endereço IP privado ou informação sensível.
- Verifique se o comportamento ocorre sem outros scripts/extensões que modifiquem o xCloud.

## Padrão para alterações
1. Faça uma alteração por objetivo, preferencialmente em branch própria.
2. Preserve a funcionalidade existente: toque, gamepad, configurações e painel.
3. Não transforme automaticamente dispositivos móveis em controles de teclado e mouse.
4. Execute `node --check xbox-cloud-unlock-ptbr.user.js`.
5. Descreva o que foi testado de verdade e o que continua sem validação.
6. Atualize `CHANGELOG.md` ao modificar comportamento visível.

## Pull requests
Inclua resumo, motivação, riscos, passos de teste, resultado esperado e resultado observado. Não inclua dados de autenticação nem código de terceiros sem verificar a licença.

## Conduta e suporte
Trate relatos de incompatibilidade como informação técnica reproduzível. Não prometa desbloqueio regional ou qualidade de vídeo garantidos. O projeto não é afiliado à Microsoft ou ao Xbox.
