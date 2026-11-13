"""Auditoria estática do ZIP PSBox. Não extrai, executa ou autentica."""
import argparse
import hashlib
import json
import re
import zipfile
from pathlib import PurePosixPath


def audit(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as source:
        for block in iter(lambda: source.read(65536), b''):
            digest.update(block)
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        names = [entry.filename for entry in entries]
        if len(names) != len(set(names)):
            raise ValueError('duplicate-entry')
        if any(PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts or '\\' in n for n in names):
            raise ValueError('unsafe-entry')
        roots = {n.split('/')[0] for n in names}
        if len(roots) != 1:
            raise ValueError('ambiguous-root')
        root = next(iter(roots)) + '/'
        hashes = {}

        def text(relative):
            name = root + relative
            if name not in names:
                return ''
            info = archive.getinfo(name)
            if info.file_size > 2 * 1024 * 1024:
                raise ValueError('source-too-large')
            data = archive.read(name)
            hashes[relative] = hashlib.sha256(data).hexdigest()
            return data.decode('utf-8-sig')

        manifest = text('android/app/src/main/AndroidManifest.xml')
        cmake = text('android/app/src/main/cpp/CMakeLists.txt')
        # This audit targets the inspected snapshot. Includes/indirect links
        # make reachability unknown, not automatically integrated.
        sources = [n for n in names if n.startswith(root + 'android/') and n.endswith(('.java', '.kt'))]
        java = '\n'.join(text(n[len(root):]) for n in sources)
        activity = bool(re.search(r'\bclass\s+MainActivity\b', java))
        native_entry = bool(re.search(r'\b(?:JNIEXPORT|JNI_OnLoad|android_main)\b', text('src/platform/android/platform_android.cpp')))
        direct_core = any(x in cmake for x in ['xcloud_core', 'auth_manager.cpp', 'gssv.cpp'])
        deps = {}
        for dep in ['mbedtls', 'libdatachannel', 'ffmpeg']:
            deps[dep] = sum(n.startswith(root + 'deps/' + dep + '/') and not n.endswith('/') for n in names)
        blockers = []
        if '.MainActivity' in manifest and not activity:
            blockers.append('manifest-main-activity-source-not-found')
        if '@mipmap/' in manifest and not any(n.startswith(root + 'android/app/src/main/res/mipmap') for n in names):
            blockers.append('referenced-launcher-resources-not-found')
        if not direct_core:
            blockers.append('android-cmake-does-not-directly-integrate-session-core')
        if any(v == 0 for v in deps.values()):
            blockers.append('submodule-content-missing-from-archive')
        return {'schema': 'psbox-android-static-audit-v1', 'archiveSha256': digest.hexdigest(),
                'sourceSha256': hashes, 'androidScaffoldPresent': bool(manifest and cmake),
                'mainActivitySourceFound': activity, 'nativeEntryInPlatformFileFound': native_entry,
                'directSessionCoreIntegrationFound': direct_core, 'submoduleFileCounts': deps,
                'blockers': blockers, 'buildExecuted': False, 'sessionExecuted': False,
                'serverConsoleRecognition': 'not-verified',
                'limitations': ['Static targeted checks; generated sources/indirect CMake links require manual review.',
                                'No build, APK installation, token issuance, server classification or gameplay validated.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('archive')
    args = parser.parse_args()
    print(json.dumps(audit(args.archive), indent=2, ensure_ascii=False))
