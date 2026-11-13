#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")" && pwd)"
: "${ANDROID_HOME:?Set official Android SDK directory}"
: "${MBEDTLS_SOURCE_DIR:?Set pinned Mbed TLS checkout}"
test "$(git -C "$MBEDTLS_SOURCE_DIR" rev-parse HEAD)" = 107ea89daaefb9867ea9121002fbbdf926780e98
test "$(git -C "$MBEDTLS_SOURCE_DIR/framework" rev-parse HEAD)" = 94599c0e3b5036e086446a51a3f79640f70f22f6
cmake="$ANDROID_HOME/cmake/3.22.1/bin/cmake"
ninja="$ANDROID_HOME/cmake/3.22.1/bin/ninja"
out="${1:?Pass output directory}"
mkdir -p "$out"
"$cmake" -S "$root/transport" -B "$out/host-build" -G Ninja \
  -DCMAKE_MAKE_PROGRAM="$ninja" -DCMAKE_BUILD_TYPE=Release -DMBEDTLS_SOURCE_DIR="$MBEDTLS_SOURCE_DIR"
"$cmake" --build "$out/host-build" --target nimbo_psbox_platform --parallel 2
"$out/host-build/nimbo_psbox_platform"
: "${ANDROID_NDK_HOME:?Set official NDK 27.2.12479018}"
grep -Eq '^Pkg.Revision[[:space:]]*=[[:space:]]*27\.2\.12479018[[:space:]]*$' "$ANDROID_NDK_HOME/source.properties"
"$cmake" -S "$root/transport" -B "$out/android-build" -G Ninja \
  -DCMAKE_MAKE_PROGRAM="$ninja" -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_TOOLCHAIN_FILE="$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake" \
  -DANDROID_ABI=arm64-v8a -DANDROID_PLATFORM=android-26 -DANDROID_STL=c++_static \
  -DMBEDTLS_SOURCE_DIR="$MBEDTLS_SOURCE_DIR"
"$cmake" --build "$out/android-build" --target nimbo_psbox_platform --parallel 2
cp "$out/android-build/libnimbo_psbox_platform.so" "$out/"
toolchain="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin"
"$toolchain/llvm-readelf" -h "$out/libnimbo_psbox_platform.so" > "$out/elf-header.txt"
grep -Eq 'Machine:[[:space:]]+AArch64' "$out/elf-header.txt"
"$toolchain/llvm-readelf" -d "$out/libnimbo_psbox_platform.so" > "$out/elf-dynamic.txt"
if grep -q 'libc++_shared.so' "$out/elf-dynamic.txt"; then exit 1; fi
"$toolchain/llvm-nm" --defined-only --dynamic "$out/libnimbo_psbox_platform.so" > "$out/jni-symbols.txt"
for symbol in nativeInitialize nativeShutdown nativeIsReady; do
  grep -q "Java_org_nimboxcloud_psbox_PsboxPlatform_$symbol" "$out/jni-symbols.txt"
done
cp "$ANDROID_NDK_HOME/NOTICE" "$out/NDK-NOTICE.txt"
cp "$ANDROID_NDK_HOME/source.properties" "$out/ndk-source.properties"
cp "$MBEDTLS_SOURCE_DIR/LICENSE" "$out/MBEDTLS-LICENSE.txt"
git -C "$MBEDTLS_SOURCE_DIR" archive HEAD -o "$out/mbedtls-source.tar"
git -C "$MBEDTLS_SOURCE_DIR/framework" archive HEAD -o "$out/mbedtls-framework-source.tar"
printf '%s\n' 'Platform JNI + original HTTPS transport; offline trust/parsers tested. No handshake, login, session, APK or gameplay.' > "$out/SCOPE.txt"
# Build trees may contain host executables: keep only declared deliverables.
rm -rf "$out/host-build" "$out/android-build"
