import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cla_hf_benchmark import problem, fingerprint, split_groups, get_answer

class BenchmarkTests(unittest.TestCase):
    def row(self, idx, group):
        return {"question": f"Question {idx}?", "options": ["a", "b", "c", "d"], "answer": "2", "file_name": group}

    def test_invalid_answer(self):
        row = self.row(1,"a")
        row["answer"] = "5"
        self.assertEqual(problem(row), "invalid_answer")

    def test_answers(self):
        self.assertEqual(get_answer({"answer": "B"}), "2")
        self.assertEqual(get_answer({"answer": 2}), "2")

    def test_duplicate_hash(self):
        a, b = self.row(1,"a"), self.row(1,"b")
        self.assertEqual(fingerprint(a), fingerprint(b))

    def test_group_disjoint(self):
        rows = [self.row(i, f"exam{i//3}") for i in range(45)]
        result, _ = split_groups(rows, 7)
        groups = [{r["file_name"] for r in v} for v in result.values()]
        for i in range(len(groups)):
            for j in range(i+1, len(groups)):
                self.assertFalse(groups[i].intersection(groups[j]))

if __name__ == "__main__":
    unittest.main()
