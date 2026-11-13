#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")" && pwd)"
build="$(mktemp -d)"
trap 'rm -rf "$build"' EXIT
"${CXX:-g++}" -std=c++20 -Wall -Wextra -pthread -I "$root/vendor/src" \
  "$root/storage_test.cpp" "$root/vendor/src/platform/android/platform_android.cpp" \
  "$root/vendor/src/platform/posix_common.cpp" -o "$build/storage-test"
"$build/storage-test"
