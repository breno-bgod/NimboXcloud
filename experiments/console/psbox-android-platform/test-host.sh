#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")" && pwd)"
build="$(mktemp -d)"
trap 'rm -rf "$build"' EXIT
"${CXX:-g++}" -std=c++20 -Wall -Wextra -pthread -I "$root/vendor/src" -I "$root" \
  "$root/storage_test.cpp" "$root/vendor/src/platform/android/platform_android.cpp" \
  "$root/vendor/src/platform/posix_common.cpp" -o "$build/storage-test"
"$build/storage-test"
"${CXX:-g++}" -std=c++20 -Wall -Wextra -Werror -pthread -I "$root/vendor/src" -I "$root" \
  "$root/lifecycle_test.cpp" "$root/platform_lifecycle.cpp" \
  "$root/vendor/src/platform/android/platform_android.cpp" \
  "$root/vendor/src/platform/posix_common.cpp" -o "$build/lifecycle-test"
"$build/lifecycle-test"
