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
  -I "$root/vendor/src" "$root/vendor/src/platform/android/platform_android.cpp" \
  "$root/vendor/src/platform/posix_common.cpp" -Wl,--no-undefined -llog \
  -o "$out/libnimbo_psbox_platform.so"
"$toolchain/llvm-readelf" -h "$out/libnimbo_psbox_platform.so" > "$out/elf-header.txt"
grep -Eq 'Machine:[[:space:]]+AArch64' "$out/elf-header.txt"
"$toolchain/llvm-readelf" -d "$out/libnimbo_psbox_platform.so" > "$out/elf-dynamic.txt"
cp "$ANDROID_NDK_HOME/source.properties" "$out/ndk-source.properties"
printf '%s\n' 'Platform-only library; not an APK, JNI bridge, decoder or streaming engine.' > "$out/SCOPE.txt"
