#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")" && pwd)"
: "${ANDROID_HOME:?Set ANDROID_HOME to official Android SDK}"
out="${1:?Pass directory containing libnimbo_psbox_platform.so}"
test -f "$out/libnimbo_psbox_platform.so"
android_jar="$ANDROID_HOME/platforms/android-35/android.jar"
test -f "$android_jar"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
javac --release 17 -Xlint:all -Werror -classpath "$android_jar" -d "$work/classes" \
  "$root"/java/org/nimboxcloud/psbox/*.java
jar --create --file "$work/classes.jar" -C "$work/classes" .
python3 - "$root" "$out" "$work" <<'PY'
import pathlib, sys, zipfile
root,out,work=map(pathlib.Path,sys.argv[1:])
entries={
 'AndroidManifest.xml':root/'AndroidManifest.xml',
 'classes.jar':work/'classes.jar',
 'jni/arm64-v8a/libnimbo_psbox_platform.so':out/'libnimbo_psbox_platform.so',
 'proguard.txt':root/'consumer-rules.pro',
 'LICENSE':root/'vendor/LICENSE',
 'NDK-NOTICE.txt':out/'NDK-NOTICE.txt',
 'SCOPE.txt':out/'SCOPE.txt',
}
if (out/'MBEDTLS-LICENSE.txt').exists():entries['MBEDTLS-LICENSE.txt']=out/'MBEDTLS-LICENSE.txt'
target=out/'nimbo-psbox-platform-experimental.aar'
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED) as archive:
 for name,path in sorted(entries.items()):archive.writestr(name,path.read_bytes())
with zipfile.ZipFile(target) as archive:
 assert archive.testzip() is None
 assert set(archive.namelist())==set(entries)
print('AAR assembled: Java + ARM64 platform JNI; no app, login or streaming')
PY
