import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from package_release import allowed, build_archive, EXPECTED_EXAMPLES
from zipfile import ZipFile

class PackagingTests(unittest.TestCase):
    def test_templates_included_secrets_excluded(self):
        with tempfile.TemporaryDirectory() as rootdir, tempfile.TemporaryDirectory() as outdir:
            root = Path(rootdir)
            for name in EXPECTED_EXAMPLES:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text('EXAMPLE_ONLY=\n')
            (root / 'src').mkdir()
            (root / 'src' / 'App.tsx').write_text('export const ok = true;')
            (root / '.env').write_text('SECRET=do-not-package')
            (root / '.env.local').write_text('SECRET=do-not-package')
            (root / 'node_modules').mkdir()
            (root / 'node_modules' / 'bad.txt').write_text('excluded')
            (root / 'research' / 'data' / 'raw_private').mkdir(parents=True)
            (root / 'research' / 'data' / 'raw_private' / 'student.csv').write_text('PII')
            archive_path = Path(outdir) / 'cla.zip'
            result = build_archive(root, archive_path)
            with ZipFile(archive_path) as z:
                files = set(z.namelist())
                self.assertEqual(z.testzip(), None)
                for name in EXPECTED_EXAMPLES:
                    self.assertIn('Cognitive-Learn/' + name, files)
                self.assertIn('Cognitive-Learn/src/App.tsx', files)
                self.assertNotIn('Cognitive-Learn/.env', files)
                self.assertNotIn('Cognitive-Learn/.env.local', files)
                self.assertNotIn('Cognitive-Learn/node_modules/bad.txt', files)
                self.assertNotIn('Cognitive-Learn/research/data/raw_private/student.csv', files)
            self.assertTrue(result['source_only'])
            self.assertFalse(result['production_build_verified'])

    def test_exclusion_patterns(self):
        for path in ('functions-admin/.env.local', '.env.production', 'src/data/service-account-prod.json',
                     'reports/e2e/student.json', 'research/reports/private/student.log'):
            self.assertFalse(allowed(path), path)
        self.assertTrue(allowed('.env.example'))
        self.assertTrue(allowed('functions-admin/.env.example'))

    def test_missing_template_fails_closed(self):
        with tempfile.TemporaryDirectory() as rootdir, tempfile.TemporaryDirectory() as outdir:
            root = Path(rootdir)
            (root / '.env.example').write_text('')
            with self.assertRaisesRegex(RuntimeError, 'templates'):
                build_archive(root, Path(outdir) / 'cla.zip')

if __name__ == '__main__':
    unittest.main()
