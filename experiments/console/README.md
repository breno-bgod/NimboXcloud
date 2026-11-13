# Experimentos isolados de console

Esta pasta não é importada pelo userscript oficial. Não altere o instalador, módulos ativos, autenticação ou preferências para executar uma hipótese daqui.

Antes de adicionar código, registre a hipótese e o critério de refutação em [CONSOLE_RESEARCH.md](../../docs/research/CONSOLE_RESEARCH.md). Use um subdiretório por hipótese, com README contendo:

1. Fonte primária fixada por SHA, licença e API real utilizada.
2. Dados de entrada e procedência de fixtures, sem tokens ou dados pessoais.
3. Comando reproduzível e resultado esperado, inclusive cenário de erro.
4. Saída observada e limitações do ambiente.
5. Estado e próximo passo, preservando resultados negativos.

Use dependências existentes ou APIs nativas. Não execute autenticação automaticamente nem substitua uma etapa de autorização. Testes de VM/DOM, mocks e provisionamento WebRTC não validam recepção real de mídia ou gameplay. Até três revisões fundamentadas por execução; um bloqueio documentado vale mais que um teste artificialmente aprovado.

Nenhum experimento foi adicionado nesta organização inicial. Promoção ao produto oficial exige revisão e decisão do mantenedor.
