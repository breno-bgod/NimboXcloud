#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")" && pwd)"
: "${ANDROID_NDK_HOME:?Set ANDROID_NDK_HOME to official NDK 27.2.12479018}"
if ! grep -Eq '^Pkg.Revision[[:space:]]*=[[:space:]]*27\.2\.12479018[[:space:]]*$' "$ANDROID_NDK_HOME/source.properties"; then
  echo 'Wrong NDK revision; expected 27.2.12479018' >&2
  exit 1
fi
toolchain="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin"
compiler="$toolchain/aarch64-linux-android26-clang++"
test -x "$compiler"
out="${1:?Pass an output directory}"
mkdir -p "$out"
"$compiler" -std=c++20 -Wall -Wextra -Werror -fPIC -shared -pthread \
  -I "$root/vendor/src" -I "$root" "$root/vendor/src/platform/android/platform_android.cpp" \
  "$root/vendor/src/platform/posix_common.cpp" "$root/platform_lifecycle.cpp" \
  "$root/platform_jni.cpp" -static-libstdc++ -Wl,--no-undefined -llog \
  -o "$out/libnimbo_psbox_platform.so"
"$toolchain/llvm-readelf" -h "$out/libnimbo_psbox_platform.so" > "$out/elf-header.txt"
grep -Eq 'Machine:[[:space:]]+AArch64' "$out/elf-header.txt"
"$toolchain/llvm-readelf" -d "$out/libnimbo_psbox_platform.so" > "$out/elf-dynamic.txt"
if grep -q 'libc++_shared.so' "$out/elf-dynamic.txt"; then
  echo 'Unexpected shared C++ runtime dependency' >&2
  exit 1
fi
cp "$ANDROID_NDK_HOME/source.properties" "$out/ndk-source.properties"
cp "$ANDROID_NDK_HOME/NOTICE" "$out/NDK-NOTICE.txt"
"$toolchain/llvm-nm" --defined-only --dynamic "$out/libnimbo_psbox_platform.so" > "$out/jni-symbols.txt"
for symbol in nativeInitialize nativeShutdown nativeIsReady; do
  grep -q "Java_org_nimboxcloud_psbox_PsboxPlatform_$symbol" "$out/jni-symbols.txt"
done
printf '%s\n' 'Platform lifecycle JNI only; not an APK, app core, decoder or streaming engine.' > "$out/SCOPE.txt"
