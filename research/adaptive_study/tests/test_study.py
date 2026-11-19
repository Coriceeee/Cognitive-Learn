import csv, pathlib, sys, tempfile, unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
from study import audit,run
BASE={'participant_id':'s1','cycle_id':'c1','assigned_arm':'static','assignment_method':'observational','assignment_timestamp':'2026-10-02T00:00:00Z','baseline_timestamp':'2026-10-01T00:00:00Z','baseline_score':'5','policy_version':'v1','recommendation_id':'r1','human_approved':'yes','exposure_timestamp':'2026-10-03T00:00:00Z','outcome_timestamp':'2026-10-10T00:00:00Z','outcome_score':'6','outcome_scale':'same-exam-0-10','outcome_verified':'yes','consent_status':'granted'}
def row(**kw):return dict(BASE,**kw)
class StudyTests(unittest.TestCase):
 def test_valid_pair(self):
  x=audit([row(),row(participant_id='s2',assigned_arm='adaptive',outcome_score='7')]);self.assertEqual(x['status'],'PASS_DESCRIPTIVE_ONLY');self.assertEqual(x['mean_change_difference_adaptive_minus_static'],1);self.assertFalse(x['claim_gate']['can_claim_adaptive_causal_effect'])
 def test_consent(self):self.assertIn('missing_consent',audit([row(consent_status='denied')])['failure_codes'])
 def test_order(self):self.assertIn('time_order_violation',audit([row(outcome_timestamp='2026-09-01T00:00:00Z')])['failure_codes'])
 def test_double_arm(self):self.assertIn('cross_arm_participant',audit([row(),row(cycle_id='c2',assigned_arm='adaptive')])['failure_codes'])
 def test_duplicate(self):self.assertIn('duplicate_participant_cycle',audit([row(),row()])['failure_codes'])
 def test_missing_outcome(self):self.assertIn('invalid_or_missing_score',audit([row(outcome_score='')])['failure_codes'])
 def test_nan(self):self.assertIn('invalid_or_missing_score',audit([row(outcome_score='nan')])['failure_codes'])
 def test_unverified(self):self.assertIn('outcome_unverified',audit([row(outcome_verified='no')])['failure_codes'])
 def test_human(self):self.assertIn('human_approval_missing',audit([row(human_approved='no')])['failure_codes'])
 def test_mixed_scale(self):self.assertEqual(audit([row(),row(participant_id='s2',assigned_arm='adaptive',outcome_scale='other')])['status'],'FAIL_INCOMPLETE_OR_INVALID')
 def test_output_artifacts(self):
  with tempfile.TemporaryDirectory() as d:
   inp=pathlib.Path(d)/'a.csv';out=pathlib.Path(d)/'out'
   with inp.open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(BASE));w.writeheader();w.writerows([row(),row(participant_id='s2',assigned_arm='adaptive')])
   result=run(inp,out);self.assertEqual(result['status'],'PASS_DESCRIPTIVE_ONLY');self.assertTrue((out/'audit.json').exists());self.assertTrue((out/'report.md').exists())
 def test_rand_not_causal(self):
  x=audit([row(assignment_method='randomized'),row(participant_id='s2',assigned_arm='adaptive',assignment_method='randomized')]);self.assertFalse(x['claim_gate']['can_claim_adaptive_causal_effect'])
if __name__=='__main__':unittest.main()
