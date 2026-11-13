# PSBox Android: armazenamento privado do host Nimbo

Estado local: **build e teste nativo Linux aprovados**, sem runtime Android.
O CI ARM64 é uma verificação separada; só seu resultado pode comprovar o link
Android desta biblioteca. Não é APK nem integração do motor completo.

## Hipótese, falha e origem

O backend Android upstream retornava init/dataDirWritable como true mesmo com
mkdir falhando, e usava /data/data/com.rafaelngp.psbox/files sem configuração.
No APK Nimbo, esse caminho pertence a outro aplicativo. A adaptação exige que
o host confiável configure filesDir/psbox antes dos workers;
a configuração não recebe caminhos de uma página web. A fachada JNI foi acrescentada na revisão de lifecycle abaixo.

Critério de falha: informar armazenamento pronto sem pasta absoluta explícita,
ou após erro de mkdir/criação/escrita do probe. Teste contra fonte upstream
falhou em "missing host directory must fail"; após correção, o executável C++
passou. Não alteramos autenticação, endpoints ou formato de arquivo de conta.
Fixtures são texto sintético e pastas temporárias; nenhum dado de usuário.

Fontes selecionadas de RafaelNGP/psbox-cloud-gaming no SHA
c775ecaddde52024d177cce7392aae13cc6917aa (13/11/2026 17:14:27 UTC):

- vendor/src/platform/android/platform_android.cpp: modificado localmente,
  sem fallback de pacote; mkdir validado, probe temporário exclusivo com escrita
  e remoção, errno/estado real, reset no init/shutdown.
- vendor/src/platform/platform.h, vendor/src/platform/posix_common.cpp,
  vendor/src/util/log.h: fontes upstream preservadas.
- vendor/LICENSE: GPL v3 integral; headers GPL-3.0-or-later e copyright RafaelNGP
  preservados. Manifesto com SHA256 upstream e local em sources.json.

Nenhuma fonte fora deste experimento importa a biblioteca. Não sincronizar toda
main upstream nem misturar armazenamento dos dois motores. Separação de módulos
não elimina obrigações GPL; distribuir fonte correspondente e avisos junto a
qualquer distribuição futura do binário adaptado.

## Reprodução

```sh
bash experiments/console/psbox-android-platform/test-host.sh
ANDROID_NDK_HOME=/caminho/ndk/27.2.12479018 \
  bash experiments/console/psbox-android-platform/build-arm64.sh /tmp/nx-arm64
```

Teste host: GCC C++20, arquivos reais no filesystem, sem rede. Verifica pasta
ausente/relativa, pasta aninhada, probe removido, read/write atômico com fixture,
arquivo em lugar de diretório, erro de criação, diretório existente sem escrita,
reinicialização e shutdown. Não mede desempenho nem valida persistência de token.

Build Android: NDK oficial 27.2.12479018, Clang target aarch64-linux-android26,
link compartilhado sem símbolos indefinidos, cabeçalho ELF AArch64. Não passa
binário host por Android. O workflow do PR instala o NDK pelo sdkmanager do
SDK oficial do runner, com TLS padrão; não exige desktop do mantenedor.

Limites: SDK/NDK indisponíveis no executor local; não houve build Android local,
instalação, Activity, mídia, FFmpeg/SDL/libdatachannel ligados ou partida.
CA/assets ainda não são provisionados pelo host: não iniciar login com esta
biblioteca isolada. O backend atual ainda tem funções stub e capacidades não
validadas. Próximo incremento é configuração/lifecycle do host Android e ligação
gradual das dependências reais, mantendo um painel e uma sessão ativa.


## Revisão de lifecycle e fachada Java/JNI

A fachada local `org.nimboxcloud.psbox.PsboxPlatform` é API proposta do Nimbo,
não do PSBox upstream e não do serviço cloud. Sem Activity ou novo painel.
`initialize(Context)` obtém filesDir/psbox do contexto Android, carrega a biblioteca
e retorna 0 somente para prontidão da plataforma. Código diferente é errno ou
NATIVE_UNAVAILABLE. `isReady()` consulta a camada, `shutdown()` confirma sua parada.
Não expor a classe como interface JavaScript nem aceitar caminhos de uma página.

A configuração explícita passa por configureAndroidDataDir, antes do init; não
usa setenv nem modifica variáveis de outro motor no processo. O fallback de
XCLOUD_DATA_DIR é mantido apenas para ferramentas/testes nativos. Mutex nativo
serializa init/status/shutdown; repetição na mesma pasta é idempotente, outra
pasta ativa recebe EBUSY. Falha de armazenamento fica fechada e permite nova
tentativa. Código JNI não deixa exceção C++ escapar para a VM. Regra de consumidor
preserva nome da classe/métodos para R8 não quebrar os símbolos JNI.

Teste host adicional compila o C++ real com -Werror e verifica estado inicial,
caminho inválido, init, preservação de ambiente, repetição, recusa de troca ativa,
shutdown idempotente, falha/recovery e concorrência com um proprietário.
Comando é o mesmo test-host.sh. Sem mocks de autenticação ou sessão.

O build ARM64 inclui JNI e verifica os três símbolos exportados. A biblioteca
C++ padrão é ligada estaticamente; NOTICE do NDK é preservado, evitando depender
de libc++_shared.so omitida no pacote. build-aar.sh usa android.jar da plataforma
35, javac --release 17 e monta AAR com classes.jar, ARM64, manifesto minSdk26,
regra R8, licença/avisos e escopo. Esse AAR não é instalável e não é APK.

CI desta revisão precisa confirmar compilação Java/JNI e montagem do AAR; não
foi executado em VM Android ou aparelho. A aprovação anterior ARM64 referia-se
somente ao backend sem JNI. Ainda não existe host Activity implementado, core
PSBox ligado, assets/CA, biblioteca de jogos ou partida. O encerramento desta
camada NÃO substitui StreamPlayer::stop nem neutralização de entradas e liberação
dos workers quando forem ligados. O adaptador de motor só pode confirmar stop
após terminar esses recursos adicionais. Próximo passo: host lifecycle real e
ligação gradual do núcleo, preservando o painel único.
