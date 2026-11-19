"""Synthetic unit fixture only; never writes or publishes metric evidence."""
import csv
import io
import unittest
import numpy as np
from research.src import longitudinal_adaptive_ml as m


def fixture():
    rows=[]
    for cohort,(t0,t1,n) in enumerate([('2024-01-01T00:00:00Z','2024-04-01T00:00:00Z',60),('2024-07-01T00:00:00Z','2024-10-01T00:00:00Z',30),('2025-01-01T00:00:00Z','2025-04-01T00:00:00Z',30)]):
        for i in range(n):
            gpa=(i%11)/1.1; hours=i%21; completion=(i%10)/10
            rows.append(dict(zip(m.COLUMNS,[f'fixture_{cohort}_{i:03}','research','true',t0,t0,t1,gpa,hours,completion,min(10,gpa*.85+completion)])))
    manifest={'schema':m.VERSION,'approved_use':'RESEARCH_ONLY','data_scope':'APPROVED_OBSERVATIONAL_ONLY','dataset_version':'UNIT_TEST_ONLY','permission_ref':'test-contract-only','instrument_ref':'test-contract-only','protocol_ref':'test-contract-only','feature_contract':'T0_GPA_AND_PRE_T0_7D_SELF_REPORT_V1','outcome_contract':'NEXT_TERM_GPA_0_10_SAME_INSTRUMENT_V1','calibration_start':'2024-07-01T00:00:00Z','test_start':'2025-01-01T00:00:00Z','observation_end':'2025-07-01T00:00:00Z'}
    return rows,manifest


def load(rows,manifest):
    s=io.StringIO(); w=csv.DictWriter(s,fieldnames=m.COLUMNS);w.writeheader();w.writerows(rows); raw=s.getvalue().encode()
    return m.load(raw,{**manifest,'source_sha256':m.sha(raw)})


class LongitudinalTests(unittest.TestCase):
    def test_temporal_counts_zero_and_determinism(self):
        rows,manifest=fixture(); a,n,e=load(rows,manifest);b,_,_=load(rows[::-1],manifest)
        self.assertEqual(n,[60,30,30]);self.assertEqual(e,0);self.assertEqual(a[0][0,0],0)
        for x,y in zip(a,b): np.testing.assert_array_equal(x,y)
    def test_reject_unapproved_and_synthetic_rows(self):
        for k,v in [('research_allowed','false'),('data_scope','synthetic')]:
            rows,manifest=fixture();rows[0][k]=v
            with self.assertRaises(ValueError):load(rows,manifest)
    def test_reject_duplicate_id_between_periods(self):
        rows,manifest=fixture();rows[-1]['participant_id']=rows[0]['participant_id']
        with self.assertRaises(ValueError):load(rows,manifest)
    def test_future_feature_rejected(self):
        rows,manifest=fixture();rows[0]['feature_available_at']=rows[0]['t1_time']
        with self.assertRaises(ValueError):load(rows,manifest)
    def test_cutoff_crossing_not_in_train(self):
        rows,manifest=fixture(); extra={**rows[0],'participant_id':'fixture_extra','t0_time':'2024-04-01T00:00:00Z','feature_available_at':'2024-04-01T00:00:00Z','t1_time':'2024-07-01T00:00:00Z'}
        _,n,e=load(rows+[extra],manifest);self.assertEqual(n,[60,30,30]);self.assertEqual(e,1)
    def test_missing_not_zero(self):
        rows,manifest=fixture();rows[0]['study_hours_week']=''
        with self.assertRaises(ValueError):load(rows,manifest)
    def test_source_hash_mismatch(self):
        _,manifest=fixture()
        with self.assertRaises(ValueError):m.load(b'foo',{**manifest,'source_sha256':'x'})
    def test_minimum_cohort(self):
        rows,manifest=fixture()
        with self.assertRaises(ValueError):load(rows[:-1],manifest)
    def test_train_support_drift(self):
        a=np.zeros((60,4));b=np.ones((30,4));d=m.drift(a,b)
        self.assertEqual(d['gpa_t0']['out_of_training_range_fraction'],1)
        self.assertEqual(d['gpa_t0']['histogram_total_variation'],1) # tails separated even for constant training values
    def test_nine_configs_and_intervals(self):
        rows,manifest=fixture();groups,_,_=load(rows,manifest); result=m.evaluate(groups)
        self.assertEqual(len(result['metrics']),9);self.assertEqual(len(result['behavior_increment']),4)
        for v in result['metrics'].values():
            self.assertTrue(0<=v['mae']<=10 and 0<=v['coverage90']<=1 and 0<=v['mean_interval_width']<=10)
        self.assertEqual(len(result['against_last_gpa']),8)
    def test_conformal_rank(self):self.assertEqual(m.radius(np.arange(30)),27)

if __name__=='__main__': unittest.main()
