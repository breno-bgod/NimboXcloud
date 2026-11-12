# Como contribuir

O NimboXcloud é um projeto experimental de estudo, de código aberto sob licença GPL-3.0-or-later, mantido por **KReight**, estudante autodidata de JavaScript. Contribuições de qualquer nível de experiência são bem-vindas: conselhos, dúvidas, correções, testes, sugestões, documentação e pull requests.

Forks e adaptações são permitidos nos termos da GPL-3.0-or-later. Preserve avisos de copyright e licença, identifique modificações e disponibilize o código-fonte correspondente nas condições exigidas pela GPL. Os trechos MIT de terceiros mantêm seus avisos em [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md). Contribuições novas devem permitir sua distribuição nos termos da GPL-3.0-or-later; registre separadamente a origem e a licença de código de terceiros.

## Antes de trabalhar em uma funcionalidade

Consulte primeiro o [estado oficial do projeto e registro de decisões](./docs/PROJECT_STATUS_AND_DECISIONS.md) e o [roteiro de desenvolvimento](./docs/ROADMAP.md). Eles identificam recursos ativos, experimentais, congelados, ocultos e pendentes.

**Não reative por conta própria** Remote Play, laboratório Xbox, curvas do analógico ou equalizador avançado apenas porque o código ainda existe. Para propor retomada, descreva o problema, apresente evidências reproduzíveis, riscos, plano de teste e mecanismo de reversão. Fortnite Console e giroscópio permanecem experimentais para teste voluntário.

Ao alterar o status de um recurso, atualize a matriz de decisões; ao alterar comportamento visível, atualize o changelog. Indique separadamente testes automatizados e testes reais de partida.

## Antes de propor mudanças
- Abra uma issue descrevendo o problema, navegador, sistema operacional, versão do userscript e passos de reprodução.
- Remova de capturas e relatórios qualquer token, cookie, identificador de conta, endereço IP privado ou informação sensível.
- Verifique se o comportamento ocorre sem outros scripts/extensões que modifiquem o xCloud.

## Padrão para alterações
1. Faça uma alteração por objetivo, preferencialmente em branch própria.
2. Preserve a funcionalidade existente: toque, gamepad, configurações e painel.
3. Não transforme automaticamente dispositivos móveis em controles de teclado e mouse.
4. Execute `node --check NimboXcloud.user.js`, `node --check modules/NimboXcloud-Touch-HUD.user.js`, `node --test tests/*.test.cjs tests/*.test.mjs` e `node tools/static-risk-report.cjs`.
5. Descreva o que foi testado de verdade e o que continua sem validação.
6. Atualize `CHANGELOG.md` ao modificar comportamento visível.

## Pull requests
Inclua resumo, motivação, riscos, passos de teste, resultado esperado e resultado observado. Não inclua dados de autenticação nem código de terceiros sem verificar a licença.

## Conduta e suporte
Trate relatos de incompatibilidade como informação técnica reproduzível. Não prometa desbloqueio regional ou qualidade de vídeo garantidos. O projeto não é afiliado à Microsoft ou ao Xbox.

