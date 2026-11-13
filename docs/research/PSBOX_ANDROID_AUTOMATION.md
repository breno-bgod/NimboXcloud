# Diretriz vigente — integração Android PSBox

A decisão mais recente do mantenedor substitui a exigência anterior de fork:
**dois motores independentes, um ambiente/painel NimboXcloud**, com fontes
selecionadas PSBox incorporadas com SHA, licença e avisos preservados.
Nenhum fork GitHub separado é requisito. Nimbo Cloud permanece disponível;
o núcleo nativo pertence ao APK, não ao userscript.

[Proposta revisável e próximos marcos](PSBOX_ANDROID_INTEGRATION.md).

## Regras de execução

- PSBox upstream é referência principal. Ler main, instruções, código/diff,
  Android/NDK/SDL/mídia/entrada/auth/sessão; comparar com último SHA registrado.
  Conferir PRs, issues, releases e CI; relatos não substituem testes.
- Trabalhar no PR #24 e experiments/console/ até proposta de integração
  revisável. Não criar aplicativo independente nem segundo painel. Uma sessão
  ativa por vez inicialmente; contrato explícito de capacidades, start/stop,
  estados/erros, neutralização e fronteira segura UI/nativo.
- Não alterar userscript oficial, cinco modos de entrada, HUD/editor,
  preferências, instalador/@require, versão ou painel nesta automação.
- Incorporar uma correção comprovada por vez. Arquitetura ampla/dependência
  nova requer proposta curta em rascunho antes da implementação ampla.
- Sem novo código upstream, resolver bloqueio registrado. Até três revisões
  fundamentadas por hipótese. Sem commits vazios ou pesquisas repetidas.
- Nunca main direto, force push, merge próprio ou publicação automática de
  release/tag/APK de produção. Preservar commits concorrentes e no máximo um PR
  ativo desta frente. Não solicitar ao mantenedor criação de fork para continuar.
- Login autorizado manual; nunca coletar senhas, tokens, chaves, HAR bruto ou
  sessões. Sem compras nem payloads/DeviceType/offering inventados.
- Identidade Xbox é secundária e não condiciona build ou partida autorizada.
  DeviceTypeNotAllowed no PSBox #466 não autoriza outro fluxo de autenticação.
  xHome exige console próprio; não confundir com xCloud. GTA VI só quando
  efetivamente disponível e autorizado.
- Verificar port Android atual antes de recriar. Não embutir executável
  PS5/Linux nem VM. Binários host não são ARM64 Android; arquivo MediaCodec
  não comprova decoder funcional. Preservar GPL e avisos.
- Compilação na nuvem é permitida; desktop do mantenedor não é necessário.
  Dependências oficiais com versões fixadas, TLS e proxy preservados. Não
  repetir chamadas bloqueadas nem atribuir falha do executor ao usuário.
- Marcos: build ARM64; Activity/nativo com lifecycle; login/biblioteca; partida
  com vídeo/áudio/controle físico; teclado/mouse; toque/HUD e troca. Separar
  auditoria, simulação, build, instalação e gameplay em toda entrega.
- Antes de publicar, reler heads upstream/integração e PRs concorrentes;
  atualizar registros somente com avanço real. Fornecer PR/commit, testes,
  artefato se existir e limitações. Nenhum APK anunciado sem compilação real.

Aparelho informado: Galaxy S23 SM-S911B, Android 17/One UI 9.0; controle físico,
teclado/mouse e toque desejados. Não equivale a homologação.
