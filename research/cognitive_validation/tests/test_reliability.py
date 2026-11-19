import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from reliability import audit,icc_a1,agreement
from validate import FIELDS
PLAN={'schema':'cla.cognitive.paired-plan.v1','test_window':'2026-10-01','retest_window':'2026-10-08','instrument_version':'instrument-v1','protocol_version':'candidate-v1'}
def rows(n=12):
 return [dict({f:str(25+i*3+(2 if j else 0)) for f in FIELDS},participant_id=f'SYN_{i}',window=PLAN['retest_window' if j else 'test_window'],event_count='7',consent_status='granted',instrument_version='instrument-v1',stability_confirmed='yes') for i in range(n) for j in range(2)]
class Reliability(unittest.TestCase):
 def test_perfect_absolute_agreement(self): self.assertAlmostEqual(icc_a1([(i,i) for i in range(12)]),1)
 def test_constant_undefined(self): self.assertIsNone(icc_a1([(5,5)]*12))
 def test_systematic_shift_not_perfect(self): self.assertLess(icc_a1([(i,i+20) for i in range(12)]),.5)
 def test_inverted_negative(self): self.assertLess(icc_a1([(i,11-i) for i in range(12)]),0)
 def test_bootstrap_reproducible(self):
  p=[(i,i+(i%2)) for i in range(12)];a=agreement(p);self.assertEqual(a,agreement(p));self.assertIsNotNone(a['icc_ci95'])
 def test_small_withhold(self): self.assertIsNone(agreement([(1,1)]*9)['icc_a1'])
 def test_missing_exclusion_and_scope(self):
  data=rows(4);data[0]['goal_action_alignment']='';data[2]['stability_confirmed']='unknown';a=audit(data,PLAN,'SYNTHETIC');self.assertEqual(a['results']['SCI']['paired_participants'],2);self.assertEqual(a['results']['MAS']['paired_participants'],3);self.assertFalse(a['psychometric_validation']);self.assertNotIn('SYN_0',str(a))
 def test_invalid_version_consent_duplicate(self):
  for key,val in [('instrument_version','v2'),('consent_status','denied'),('event_count','7.5'),('window','bad'),('goal_action_alignment','101')]:
   data=rows(1);data[0][key]=val
   with self.assertRaises(ValueError):audit(data,PLAN,'SYNTHETIC')
  with self.assertRaises(ValueError):audit(rows(1)*2,PLAN,'SYNTHETIC')
 def test_reject_synthetic_research_and_invalid_window(self):
  with self.assertRaises(ValueError):audit(rows(1),PLAN,'CONSENTED_RESEARCH_UNVERIFIED')
  with self.assertRaises(ValueError):audit(rows(1),dict(PLAN,retest_window='2026-10-02'),'SYNTHETIC')
