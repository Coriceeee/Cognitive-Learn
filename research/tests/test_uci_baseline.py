import csv
import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from baseline_uci_student_performance import run

FIELDS = [
    "studytime", "failures", "schoolsup", "famsup", "paid", "activities",
    "traveltime", "absences", "freetime", "goout", "internet", "higher",
    "G1", "G2", "G3",
]


class UciBaselineGateTest(unittest.TestCase):
    def _write_rows(self, count=120, invalid=False):
        temp = tempfile.TemporaryDirectory()
        path = Path(temp.name) / "student-mat.csv"
        with path.open("w", newline="", encoding="utf8") as f:
            w = csv.DictWriter(f, fieldnames=FIELDS, delimiter=";")
            w.writeheader()
            for i in range(count):
                row = {
                    "studytime": (i % 4) + 1, "failures": i % 3,
                    "schoolsup": "yes" if i % 2 else "no", "famsup": "yes",
                    "paid": "no", "activities": "yes", "traveltime": 1,
                    "absences": i % 10, "freetime": (i % 5) + 1,
                    "goout": (i % 5) + 1, "internet": "yes", "higher": "yes",
                    "G1": 6 + (i % 10), "G2": 7 + (i % 10),
                    "G3": 8 + (i % 10),
                }
                if invalid:
                    row["G3"] = 25
                w.writerow(row)
        return temp, path

    def test_unverified_source_is_blocked(self):
        temp, path = self._write_rows(120)
        try:
            result = run(path, "math")
            self.assertEqual(result["status"], "BLOCKED")
            self.assertIn("Source license", result["block_reason"])
        finally:
            temp.cleanup()

    def test_underpowered_data_is_blocked(self):
        temp, path = self._write_rows(30)
        try:
            result = run(path, "math", source_revision="fixture-test", source_verified=True)
            self.assertEqual(result["status"], "BLOCKED")
        finally:
            temp.cleanup()

    def test_invalid_target_range_is_blocked(self):
        temp, path = self._write_rows(120, invalid=True)
        try:
            result = run(path, "math", source_revision="fixture-test", source_verified=True)
            self.assertEqual(result["status"], "BLOCKED")
        finally:
            temp.cleanup()

    def test_three_information_cutoffs_are_separated(self):
        temp, path = self._write_rows(120)
        try:
            result = run(path, "math", source_revision="fixture-test", source_verified=True)
            self.assertEqual(result["status"], "EXTERNAL_BASELINE_EVALUATED_WITH_LIMITATIONS")
            self.assertIn("context_behavior_only", result["metrics"])
            self.assertIn("after_first_period_G1", result["metrics"])
            self.assertIn("after_second_period_G1_G2", result["metrics"])
            self.assertNotIn("G2", result["metrics"]["after_first_period_G1"]["features"])
            self.assertIn("G2", result["metrics"]["after_second_period_G1_G2"]["features"])
            self.assertNotIn("G3", result["metrics"]["after_second_period_G1_G2"]["features"])
            self.assertNotIn("absences", result["metrics"]["context_behavior_only"]["features"])
            self.assertIn("academic_only_ridge", result["metrics"]["after_first_period_G1"])
            self.assertIn("academic_only_ridge", result["metrics"]["after_second_period_G1_G2"])
            self.assertEqual(result["master_protocol_evidence_type"], "S_SECONDARY_EXTERNAL")
            self.assertEqual(result["evidence_class"], "E_EXTERNAL")
        finally:
            temp.cleanup()


if __name__ == "__main__":
    unittest.main(verbosity=2)
