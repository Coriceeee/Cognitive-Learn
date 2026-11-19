import tempfile
import unittest
import sys
from pathlib import Path
import pandas as pd
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from uci_ml_comparison import prepare, split, evaluate, interval_radius, reviewed_report, MODEL_NAMES, FEATURES

class MLComparison(unittest.TestCase):
    def fixture(self):
        rng=np.random.default_rng(41)
        f=pd.DataFrame({'G1':rng.integers(0,21,240),'G2':rng.integers(0,21,240),'failures':rng.integers(0,4,240),'studytime':rng.integers(1,5,240),'activities':rng.choice(['yes','no'],240),'G3':rng.integers(0,21,240)})
        return pd.concat([f,f.iloc[:10]],ignore_index=True)
    def test_signature_isolation_and_determinism(self):
        f=prepare(self.fixture()); tr,ca,te,g=split(f)
        self.assertEqual(len(set(tr)|set(ca)|set(te)),len(f))
        self.assertFalse(set(g[tr]) & set(g[te])); self.assertFalse(set(g[ca]) & set(g[te])); self.assertFalse(set(g[tr]) & set(g[ca]))
        self.assertTrue(np.array_equal(te,split(f)[2]))
    def test_invalid_missing_or_range(self):
        for col,val in [('G3',21),('G2',None),('studytime',0),('activities','unknown')]:
            f=self.fixture(); f.loc[0,col]=val
            with self.assertRaises(ValueError): prepare(f)
    def test_finite_sample_quantile(self):
        self.assertEqual(interval_radius(np.arange(20)),18)
        with self.assertRaises(ValueError): interval_radius([1,2])
    def test_all_models_and_intervals(self):
        r=evaluate(self.fixture())
        self.assertEqual(set(r['metrics']),set(MODEL_NAMES))
        self.assertEqual(sum(r['counts'].values()),250)
        for m in r['metrics'].values():
            self.assertTrue(0<=m['coverage']<=1); self.assertTrue(0<=m['mean_interval_width']<=20)
        self.assertEqual(set(r['behavior_increment']),{'ridge','forest'})
        self.assertNotIn('G3',FEATURES)
    def test_no_source_no_report(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(FileNotFoundError): reviewed_report(Path(d))

if __name__=='__main__': unittest.main()
