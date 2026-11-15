import csv, sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate import evaluate,read_data,spearman
BASE={'participant_id':'p1','window':'2026-10-01','event_count':'10','plan_completion_rate':'70','action_consistency':'80','goal_action_alignment':'90','motivation_self_report':'60','task_persistence_rate':'70','task_abandonment_rate':'20','behavior_consistency':'80','goal_switch_rate':'30','context_switch_rate':'40'}
class ValidationTests(unittest.TestCase):
 def test_all_values(self):
  rep, rows=evaluate([BASE]);self.assertEqual(rows[0]['SCI_score'],80);self.assertEqual(rows[0]['MAS_score'],70);self.assertEqual(rows[0]['CSL_score'],70);self.assertEqual(rep['status'],'EXPERIMENTAL_PROXY_NOT_VALIDATED')
 def test_missing_gate(self):
  row={**BASE,'goal_action_alignment':''};_,rows=evaluate([row]);self.assertIsNone(rows[0]['SCI_score']);self.assertEqual(rows[0]['SCI_status'],'INSUFFICIENT_DATA')
 def test_event_gate(self):
  _,rows=evaluate([{**BASE,'event_count':'3'}]);self.assertTrue(all(rows[0][f'{c}_score'] is None for c in ('SCI','MAS','CSL')))
 def test_zero_is_valid(self):
  _,rows=evaluate([{**BASE,'task_abandonment_rate':'0'}]);self.assertAlmostEqual(rows[0]['MAS_score'],(60+70+100)/3,places=3)
 def test_out_of_range(self):
  rep,rows=evaluate([{**BASE,'plan_completion_rate':'999'}]);self.assertEqual(rep['invalid_numeric_cells']['plan_completion_rate'],1);self.assertIsNone(rows[0]['SCI_score'])
 def test_duplicate(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'data.csv'
   with p.open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=BASE.keys());w.writeheader();w.writerows([BASE,BASE])
   with self.assertRaisesRegex(ValueError,'Duplicate'):read_data(p)
 def test_spearman(self):
  self.assertEqual(spearman([1,2,3],[3,2,1]),-1)
  self.assertIsNone(spearman([1,1,1],[1,2,3]))
 def test_repeated(self):
  second={**BASE,'window':'2026-10-08','plan_completion_rate':'75'}
  rep,_=evaluate([BASE,second]);self.assertEqual(rep['repeated_window_exploration']['SCI']['paired_participants'],1)
 def test_missing_field(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'data.csv';p.write_text('participant_id,window,event_count\np1,1,7\n')
   with self.assertRaisesRegex(ValueError,'Missing required columns'):read_data(p)
if __name__=='__main__':unittest.main()
