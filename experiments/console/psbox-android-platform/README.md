# PSBox Android: armazenamento privado do host Nimbo

Estado local: **build e teste nativo Linux aprovados**, sem runtime Android.
O CI ARM64 é uma verificação separada; só seu resultado pode comprovar o link
Android desta biblioteca. Não é APK nem integração do motor completo.

## Hipótese, falha e origem

O backend Android upstream retornava init/dataDirWritable como true mesmo com
mkdir falhando, e usava /data/data/com.rafaelngp.psbox/files sem configuração.
No APK Nimbo, esse caminho pertence a outro aplicativo. A adaptação exige que
o host confiável configure XCLOUD_DATA_DIR com filesDir/psbox antes dos workers;
ela não cria Activity/JNI nem recebe caminhos de uma página web.

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
instalação, JNI, Activity, mídia, FFmpeg/SDL/libdatachannel ligados ou partida.
CA/assets ainda não são provisionados pelo host: não iniciar login com esta
biblioteca isolada. O backend atual ainda tem funções stub e capacidades não
validadas. Próximo incremento é configuração/lifecycle do host Android e ligação
gradual das dependências reais, mantendo um painel e uma sessão ativa.
