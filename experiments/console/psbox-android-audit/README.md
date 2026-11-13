# PSBox Android: auditoria estática, sem compilação

Estado: pesquisa; caminho Android incompleto no snapshot examinado. Não é um APK, uma implementação de identidade Xbox ou prova de streaming. O experimento não é carregado pelo Nimbo oficial.

## Hipótese e refutação

Hipótese: a presença de android/ no pacote PSBox não implica que o núcleo de autenticação/sessão está integrado ao aplicativo Android. Auditar pontos de entrada, recursos e integração antes de tratar esse caminho como ponte para testes de identidade. Evidência que refuta os bloqueios: Activity real, recursos resolvidos, grafo CMake incluindo o núcleo e dependências presentes. Mesmo isso exigiria build e teste real: nenhuma checagem estática promove reconhecimento Xbox.

## Proveniência

- Pacote fornecido pelo mantenedor: psbox-cloud-gaming-main.zip, SHA256 0f608df12eeee2d9c3a77d07a1ff5127f2dfb9f3a5c3c3942b698248e522f953. Não redistribuído aqui.
- Fonte pública PSBox: https://github.com/RafaelNGP/psbox-cloud-gaming/tree/eb63daf8f953684387a06a7bab8ef0a1e3133463 (main consultada em 13/11/2026, commit de 13/11 às 02:38:53 UTC; projeto criado em 07/10/2026, fora da janela de novos projetos 14/10–13/11). GPL-3.0-or-later; nenhuma fonte externa copiada para o experimento.
- Comparados por SHA256 com a fonte pública, idênticos: android/app/src/main/AndroidManifest.xml; android/app/src/main/cpp/CMakeLists.txt; src/platform/android/platform_android.cpp. A correspondência é desses arquivos, não uma autenticação do ZIP inteiro nem de sua origem.
- Referências Android: https://developer.android.com/ndk/guides/cmake e https://developer.android.com/guide/topics/manifest/activity-element.
- Referência complementar já auditada: XStreaming 06ef1c7ee01d09cf9bb2a97fc4895da85e8488a8, src/xal/index.ts/msal.ts (Android nativo e autenticação não demonstram identidade Xbox; ver experimento xstreaming-identity).

## Resultado verificável

1. Manifesto declara .MainActivity, sem fonte Java/Kotlin no ZIP.
2. Manifesto referencia mipmap/ic_launcher e mipmap/ic_launcher_round, sem recursos correspondentes.
3. CMake Android liga somente platform_android.cpp e hw_decoder_android.cpp; não integra diretamente auth_manager/gssv/xcloud_core. Não atribuir capacidade de login/criação de sessão a esse alvo.
4. Os três submódulos estão sem arquivos no ZIP. Isso é comum em archives e não prova ausência no checkout com submódulos.
5. Há código AMediaCodec, mas sua existência não valida apresentação dos quadros ou desempenho. A auditoria não examina o pipeline de mídia completo.

O caminho PSBox cloud examinado usa descritor browser/web e offering xgpuweb; osName é perfil de mídia. Nada nesta auditoria produz token, classificação ou autorização nova. Cliente nativo Android pode usar APIs distintas do browser e requisições fora do CORS da página; isso não implica que o fluxo se transfira a Android/iOS/desktop web. NDK não executa dentro de página comum. iOS exige avaliação própria.

## Execução reproduzível

```sh
python3 experiments/console/psbox-android-audit/audit.py /caminho/psbox-cloud-gaming-main.zip
python3 -m unittest discover -s experiments/console/psbox-android-audit -p 'test_*.py'
```

result.json é o resultado real da leitura do ZIP; hashes são das fontes, sem dados de contas. Sem extração ou execução do conteúdo. Quatro testes aprovados: esqueleto sem sessão, presença de fontes sem promover runtime, rejeição de caminhos inseguros e raiz ambígua. Fixtures são sintéticas; a ferramenta é uma checagem limitada, não um parser geral de CMake/Java nem verificador completo de projeto. Fontes geradas e links indiretos exigem revisão manual. As categorias detected/missing não equivalem a build aprovado.

Busca web delimitada por PSBox Android e identidade não trouxe implementação nova comprovada; nenhuma data updated_at foi tratada como avanço técnico. Não houve build NDK/Gradle, APK instalado, console físico, sessão autenticada ou gameplay nesta execução.

## Próxima tentativa

Resolver isoladamente o ponto de entrada e o grafo de build em proposta Android específica antes de qualquer port amplo. Para a pesquisa prioritária web, obter a chamada de início pelo observador 0.1.3 e comparar a cadeia com PSBox. Não alterar autenticação por suposição nem confundir compilação, descritor e classificação do servidor. Toda implementação nativa ampla depende de proposta revisável; main, instalador, preferências e módulos permanecem intactos.
