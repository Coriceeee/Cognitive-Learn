import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'huggingface'/'uci_student_performance'))
from fetch_eval import validated_rows, work, FILES, REVISION

class FetchGateTests(unittest.TestCase):
    def test_good_minimum_schema(self):
        raw=b'school;studytime;failures;G1;G2;G3\nGP;2;0;10;12;13\n'
        self.assertEqual(validated_rows(raw,1),1)
    def test_refuse_bad_grade_and_count_and_duplicates(self):
        header=b'school;studytime;failures;G1;G2;G3\n'
        good=b'GP;2;0;10;12;13\n'
        for raw,count in [(header+b'GP;2;0;10;12;21\n',1),(header+good,2),(header+good+good,2),(b'<html>error</html>',1)]:
            with self.assertRaises(ValueError): validated_rows(raw,count)
    def test_license_gate_and_scope(self):
        with self.assertRaisesRegex(ValueError,'license|CC BY'): work(Path('/tmp/not-real'),False,False)
        with self.assertRaisesRegex(ValueError,'gitignored'): work(Path('/tmp/not-real'),True,False)
    def test_pinned_revision_and_subject_counts(self):
        self.assertRegex(REVISION,r'^[0-9a-f]{40}$')
        self.assertEqual(FILES['student-mat.csv'],('math',395))
        self.assertEqual(FILES['student-por.csv'],('portuguese',649))
