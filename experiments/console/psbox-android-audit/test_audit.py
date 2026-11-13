import tempfile
import unittest
import zipfile
from pathlib import Path
from audit import audit

class AuditTest(unittest.TestCase):
    def run_archive(self, files):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'source.zip'
            with zipfile.ZipFile(path, 'w') as z:
                for name, body in files.items():
                    z.writestr(name, body)
            return audit(path)

    def test_scaffold_is_not_session_or_identity(self):
        r = self.run_archive({'p/android/app/src/main/AndroidManifest.xml': '<activity android:name=".MainActivity"/>',
                              'p/android/app/src/main/cpp/CMakeLists.txt': 'add_library(psbox SHARED platform.cpp)'})
        self.assertTrue(r['androidScaffoldPresent'])
        self.assertIn('manifest-main-activity-source-not-found', r['blockers'])
        self.assertFalse(r['sessionExecuted'])
        self.assertEqual(r['serverConsoleRecognition'], 'not-verified')

    def test_source_and_dependency_presence_never_imply_runtime(self):
        files = {'p/android/app/src/main/java/MainActivity.java': 'class MainActivity {}',
                 'p/android/app/src/main/cpp/CMakeLists.txt': 'target_link_libraries(psbox xcloud_core)'}
        files.update({'p/deps/' + dep + '/file': 'synthetic' for dep in ['mbedtls', 'libdatachannel', 'ffmpeg']})
        r = self.run_archive(files)
        self.assertTrue(r['mainActivitySourceFound'])
        self.assertTrue(r['directSessionCoreIntegrationFound'])
        self.assertNotIn('submodule-content-missing-from-archive', r['blockers'])
        self.assertFalse(r['buildExecuted'])
        self.assertEqual(r['serverConsoleRecognition'], 'not-verified')

    def test_unsafe_archive_rejected_without_extracting(self):
        with self.assertRaisesRegex(ValueError, 'unsafe-entry'):
            self.run_archive({'p/../../outside': 'synthetic'})

    def test_ambiguous_root_rejected(self):
        with self.assertRaisesRegex(ValueError, 'ambiguous-root'):
            self.run_archive({'one/file': '', 'two/file': ''})

if __name__ == '__main__':
    unittest.main()
