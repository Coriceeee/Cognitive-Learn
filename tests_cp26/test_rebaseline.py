import csv, subprocess, sys, pathlib, unittest, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
class RebaselineTests(unittest.TestCase):
 def test_total_unique_and_no_auto_accept(self):
  p=ROOT/'reports/progress/cp26/CP26_REBASELINE_164_EVIDENCE.csv'
  rows=list(csv.DictReader(p.open(encoding='utf-8-sig',newline='')))
  self.assertEqual(len(rows),164)
  self.assertEqual(len({r['ID'] for r in rows}),164)
  self.assertTrue(all(r['Đã loại khỏi backlog (0/1)']=='0' for r in rows))
 def test_id_and_scores_preserved(self):
  a=list(csv.DictReader((ROOT/'CLA_REBASELINE_164_NOTIFICATIONS_20261114.csv').open(encoding='utf-8-sig')))
  b=list(csv.DictReader((ROOT/'reports/progress/cp26/CP26_REBASELINE_164_EVIDENCE.csv').open(encoding='utf-8-sig')))
  self.assertEqual([(r['ID'],r['Điểm tạm kiểm kê nguồn 14-11 (%)']) for r in a],[(r['ID'],r['Điểm kiểm kê 14-11 (%)']) for r in b])
 def test_summary(self):
  s=json.loads((ROOT/'reports/progress/cp26/CP26_SUMMARY.json').read_text())
  self.assertEqual(s['evidence_linked'],53)
  self.assertEqual(s['accepted_by_cp26'],0)
  self.assertEqual(s['baseline_mean_pct'],37.2)
if __name__=='__main__':unittest.main()
