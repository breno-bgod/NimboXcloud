#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
if command -v javac >/dev/null; then
  compiler=(javac)
else
  compiler=(java com.sun.tools.javac.Main)
fi
release=(--release "${JAVA_TEST_RELEASE:-17}")
# Trimmed JRE images can contain javac's module but omit ct.sym for --release.
# Runtime-only host checks are allowed explicitly; CI/AAR keep release 17.
if [[ "${JAVA_TEST_RELEASE:-17}" == runtime ]]; then release=(); fi
"${compiler[@]}" "${release[@]}" -Xlint:all -Werror -d "$work" \
  "$root/java/org/nimboxcloud/psbox/PlatformOwner.java" \
  "$root/java-test/org/nimboxcloud/psbox/PlatformOwnerTest.java"
java -cp "$work" org.nimboxcloud.psbox.PlatformOwnerTest
