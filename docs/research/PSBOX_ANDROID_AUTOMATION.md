# Diretriz vigente: adaptação Android baseada no PSBox

Decisão explícita do mantenedor em 13/11/2026. Substitui a prioridade anterior de reconhecimento Xbox nesta frente. A automação existente foi atualizada, permanece ativa e conserva agenda/fuso anteriores; não foi criada outra automação.

## Objetivo e fronteiras

Usar RafaelNGP/psbox-cloud-gaming como upstream para nossa versão Android e acompanhar suas mudanças de código, PRs e CI. Nimbo Cloud e motor baseado no PSBox permanecem separados. Identidade Xbox é pesquisa secundária, não requisito para compilar ou testar uma partida autorizada. APK não comprova identidade nem acesso adicional a jogos. Main, painel, HUD/editor, preferências, instalador e releases do Nimbo oficial permanecem preservados.

## Estado verificado

- Upstream consultado: c775ecaddde52024d177cce7392aae13cc6917aa. Última mudança: PR #466 trata DeviceTypeNotAllowed; não completa o port Android.
- Base Nimbo: 3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd. PR central antes desta decisão: 249f5d362dec8d297f94eedf7cf5d3219c318d7b.
- ZIP com esqueleto Android auditado em [psbox-android-audit](../../experiments/console/psbox-android-audit/README.md). Não existe APK nosso compilado.
- breno-bgod/psbox-cloud-gaming retornou 404 no conector; não presumir existência/inexistência de repositório privado. As ferramentas GitHub disponíveis não expõem criação de fork. Criação web: https://github.com/RafaelNGP/psbox-cloud-gaming/fork. Não chamar cópia avulsa de fork criado.
- Ambiente local sem SDK/NDK/Gradle e compilador CMake/Clang disponíveis na consulta. Tentativas de acesso ao SDK ficaram interrompidas; não atribuir ao mantenedor ausência de autorização já dada. Não há build concluído.

## Plano incremental

1. Confirmar fork autorizado e fixar SHAs dos submódulos e dependências transitivas. Enquanto indisponível, propostas/evidências ficam no PR #24; não importar o projeto inteiro para o userscript.
2. Apresentar proposta mínima do grafo Android: Activity/SDL3, entrada nativa, appcore e backends; corrigir escolha de FFmpeg host versus toolchain NDK antes de afirmar build ARM64. O decoder MediaCodec preliminar exige verificação de formato/saída; não alegar pronto.
3. Produzir build de teste reproduzível em branch/PR, preferencialmente no fork com CI. Um APK que só abre não é streaming validado.
4. Validar login manual, biblioteca real e sessão autorizada com vídeo/áudio/controle físico; depois teclado/mouse e HUD de toque. Aparelho informado: S23 SM-S911B, Android 17/One UI 9.0; homologação pendente.
5. Só depois integrar entrada visual dos dois motores no aplicativo Nimbo; não alterar o produto em uso por efeito colateral.

## Operação e revisão

A cada execução: ler instruções aplicáveis, comparar upstream desde o último SHA, verificar divergências locais e trabalho concorrente, escolher uma tarefa pequena do próximo marco, testar e publicar somente em branch/PR. Sem mudanças cegas de autenticação ou protocolo, sem segredos, compras ou acesso autenticado automático. Preserve GPL e avisos; código de terceiros deve ter origem e licença verificadas. Sem force push, merge próprio ou release automática.

Pesquisa complementar é dirigida a bloqueios reais (XStreaming, Greenlight etc.), não uma busca geral que substitui implementação. Sem novidade upstream, avançar bloqueio registrado; sem tarefa útil segura, não gerar commits/notificações para marcar atividade. Resultados devem separar inspeção, simulação, build, instalação e gameplay.

## Prompt operacional da automação

Trabalhe em português brasileiro na adaptação Android do PSBox para a versão do mantenedor do NimboXcloud. Esta diretriz substitui a prioridade anterior de provar identidade Xbox. O objetivo imediato é usar o PSBox como base upstream e produzir um port Android funcional e revisável, mantendo o Nimbo Cloud atual separado. Investigar identidade Xbox é secundário e NÃO é pré-requisito para compilar ou validar uma partida autorizada.

BASE E COORDENAÇÃO
1. Comece lendo a main atual de RafaelNGP/psbox-cloud-gaming: AGENTS.md aplicável, README, licença/avisos, documentação multiplataforma, CMake, android/, camadas de plataforma, mídia, entrada, autenticação e sessão. Confira commits, releases, PRs abertos/mesclados, issues e CI recentes; compare desde o último SHA registrado. Não assuma que o ZIP enviado pelo mantenedor contém tudo ou corresponde integralmente ao head atual.
2. Confira breno-bgod/NimboXcloud, decisões recentes, CHANGELOG, roadmap, AUTOMATION_BACKLOG e o PR #24 (proposal/console-service-resume), seus comentários e docs/research/INDEX.md. Há outro ajudante em outra conta: coordene por GitHub e preserve seus commits. Não presuma acesso à conversa dele.
3. Localize o fork PSBox autorizado do mantenedor. O nome esperado deve ser verificado, não presumido. Enquanto não existir ou não estiver acessível, mantenha evidências/propostas no PR #24 e experimentos em experiments/console/. Não importe silenciosamente todo PSBox para NimboXcloud. Se a ferramenta não puder criar fork, registre o bloqueio e link de criação; não alegue fork criado.
4. Após existir o fork, use branches próprias e PRs pequenos para o port; mantenha no máximo um PR ativo desta frente. Preserve histórico upstream e registre SHA base, SHA upstream acompanhado e divergências locais. Nunca force push, faça commit direto em main, mescle seu PR, publique release/tag ou APK de produção automaticamente. APK de teste deve ser identificado como experimental e só existir quando realmente compilado.

TRABALHO PRINCIPAL
5. Monitore principalmente código novo do PSBox: Android/NDK/Gradle, SDL, FFmpeg/MediaCodec, libdatachannel/Mbed TLS, lifecycle, áudio/vídeo, controles, login, biblioteca e recuperação. Examine o diff e testes, não apenas notas de release. Separe atualização de código, atualização documental e relato de teste. Registre links, datas, SHAs, origem/licença e limites; preserve GPL e avisos.
6. Antes de mudar nossa versão, compare o código equivalente upstream e nossas divergências. Incorpore uma correção comprovada por vez, com justificativa e teste. Não substitua intenção local silenciosamente, não sincronize toda main upstream sem revisão. Arquitetura ampla/dependência nova exige proposta curta em PR de rascunho antes da implementação ampla.
7. A arquitetura pretendida é um aplicativo com Nimbo Cloud atual e motor baseado no PSBox separados por código e sessão. Não reescreva ou altere o userscript oficial, seus cinco modos de entrada, HUD/editor, preferências, instalador/@require, versão ou painel nesta automação. Reutilização da interface fica para etapa posterior; não confundir nova opção de menu com integração funcional.
8. Marcos: (a) build Android ARM64 reproduzível; (b) Activity/biblioteca nativa inicia e encerra corretamente; (c) login manual autorizado e biblioteca real; (d) jogo autorizado com vídeo, áudio e controle físico; (e) teclado/mouse; (f) toque/HUD e troca entre entradas. O aparelho de teste informado é Galaxy S23 SM-S911B, Android 17/One UI 9.0, com as três formas de entrada desejadas; são dados do mantenedor, não homologação. Não prometer todas as entradas no primeiro APK.
9. Reutilize o núcleo PSBox e backends adequados. Verifique o port Android existente antes de recriá-lo. A auditoria anterior encontrou MainActivity/recursos ausentes, alvo Android sem núcleo, submódulos vazios no ZIP e seleção FFmpeg host em vez de Android. Revalide esses bloqueios no SHA atual. Não anuncie AMediaCodec funcional apenas porque existe um arquivo, nem use binários host como ARM64. Não embuta VM/Linux por iniciativa própria.

EXPERIMENTOS E VERIFICAÇÃO
10. Em cada execução, escolha uma tarefa pequena útil: corrigir build/CI, completar um ponto real do port, testar lifecycle/mídia/entrada ou incorporar atualização upstream relevante. Defina resultado esperado e critério de falha. Use testes comportamentais e builds apropriados; não crie mocks que afirmem login, entitlement ou gameplay bem-sucedidos.
11. Faça progresso concreto sem repetir pesquisas já concluídas. Quando upstream não mudar, resolva um bloqueio registrado ou avance o próximo marco. Até três revisões fundamentadas por hipótese; sem loops infinitos. Se faltar ambiente, trabalhe no que for independente. Não peça novamente autorização já dada. Distinga falha de conectividade do executor, espera da ferramenta e falta de permissão; não atribua ao usuário. Não repita chamadas que ficaram bloqueadas: use ferramentas disponíveis/GitHub Actions quando autorizado e tecnicamente possível.
12. Compilação na nuvem é aceitável; o mantenedor não precisa ter desktop. Configure build de teste em branch/PR quando permitido. SDK/NDK/Gradle/dependências devem vir de fontes verificadas, com versões fixadas e TLS validado; preserve trust/proxy e não contorne aprovações técnicas. Não diga APK pronto sem artefato real, nem diga testado no aparelho sem execução real.
13. Não solicite nem registre senhas, tokens, certificados, chaves de conta/dispositivo, HAR bruto ou arquivos de sessão. Autenticação deve permanecer autorizada e manual. Não faça compras. Não altere endpoints, offering, DeviceType ou payloads por suposição.
14. Diferencie xCloud (serviço cloud autorizado) de xHome (console próprio autorizado). Portar PSBox, enviar descritor, obter HTTP 200, token ou vídeo não comprova identidade Xbox ou acesso adicional. GTA VI só pode ser validado quando efetivamente disponível e autorizado. PSBox #466 relata DeviceTypeNotAllowed mesmo após perfis Xbox/TV; isso não impede desenvolver o port e não autoriza inventar outro fluxo de autenticação.

REGISTRO E ENTREGA
15. Registre somente avanço real: problema, evidência, origem/SHA, mudança, comandos de teste/build, resultados, riscos e próximo passo no PR e nos registros do projeto de port. Até a criação do fork, use docs/research/CONSOLE_RESEARCH.md e INDEX.md no PR #24. Não faça commits de documentação para marcar atividade.
16. Antes de publicar, confira novamente heads upstream, fork e PRs concorrentes; integre sem sobrescrever trabalho alheio e repita checks afetados. Entregue link do PR/commit e artefato se existir, o que foi realmente compilado/testado e limites pendentes. Separe auditoria estática, simulação, build, instalação e gameplay.
17. A pesquisa de outros clientes (XStreaming, Greenlight, Orbita, Better xCloud) é complementar e direcionada a um bloqueio concreto do port. PSBox é a referência principal; não retornar à busca ampla de identidade/catálogo como tarefa padrão. Sem novidade ou tarefa útil segura, encerre sem notificações repetidas.
