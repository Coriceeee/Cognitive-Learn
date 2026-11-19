import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from cluster_comparison import compare
from test_study import row
class Comparison(unittest.TestCase):
 def test_equal_weight_people_not_cycles(self):
  data=[row(participant_id='s1',cycle_id=f'c{i}',outcome_score='10') for i in range(4)]+[row(participant_id='s2',outcome_score='5'),row(participant_id='a1',assigned_arm='adaptive',outcome_score='8')]
  a=compare(data,'SYNTHETIC');self.assertEqual(a['groups']['static']['participant_mean_change'],2.5);self.assertEqual(a['difference'],.5);self.assertIsNone(a['ci95']);self.assertFalse(a['causal_effect'])
 def test_bootstrap_independent_and_reproducible(self):
  data=[row(participant_id=f'{arm}{i}',assigned_arm=arm,outcome_score=str(6+(arm=='adaptive'))) for arm in ('static','adaptive') for i in range(10)]
  a=compare(data,'SYNTHETIC');self.assertEqual(a['ci95'],[1,1]);self.assertEqual(a,compare(list(reversed(data)),'SYNTHETIC'));self.assertFalse(a['efficacy_validated'])
 def test_block_invalid_outcomes(self):
  a=compare([row(),row(participant_id='a1',assigned_arm='adaptive',outcome_verified='no')],'SYNTHETIC');self.assertIsNone(a['difference']);self.assertEqual(a['status'],'BLOCKED_INVALID_INPUT')
 def test_mixed_assignment(self):
  a=compare([row(),row(participant_id='a1',assigned_arm='adaptive',assignment_method='randomized')],'SYNTHETIC');self.assertEqual(a['status'],'BLOCKED_MIXED_ASSIGNMENT')
 def test_mixed_policy(self):
  a=compare([row(),row(participant_id='s2',policy_version='v2'),row(participant_id='a1',assigned_arm='adaptive')],'SYNTHETIC');self.assertEqual(a['status'],'BLOCKED_MIXED_POLICY')
 def test_synthetic_not_research(self):
  with self.assertRaises(ValueError):compare([row(participant_id='synthetic_01')],'CONSENTED_RESEARCH_UNVERIFIED')
