import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from export_public_evidence import payload_from_audit


def fixture():
    m = {'roc_auc': 0.71, 'brier': 0.22, 'log_loss': 0.63, 'accuracy_at_0.5': 0.67}
    return {
      'audit_status':'PASS', 'errors':[], 'audit_timestamp_utc':'2026-11-15T00:00:00Z',
      'data': {'split_counts':{'train':5, 'val':3, 'test':2},'archive_sha256_recorded':'a'*64,'feature_sha256':'b'*64},
      'performance': {'academic_test':m, 'behavior_test':m,'brier_delta_academic_minus_behavior':0.0,'participant_bootstrap_ci95':[-0.01,0.01]}
    }

class PublicEvidenceTests(unittest.TestCase):
    def test_aggregate_only_export(self):
        report = payload_from_audit(fixture(), {'target_is_post_cutoff':True,'cutoff_day':30})
        self.assertEqual(report['test_count'], 2)
        self.assertNotIn('participant_hash', str(report))
        self.assertNotIn('features.csv', str(report))
        self.assertEqual(report['audit_status'], 'PASS')

    def test_blocks_failed_audit(self):
        f = fixture(); f['errors']=['checksum mismatch']; f['audit_status']='FAIL'
        with self.assertRaises(ValueError): payload_from_audit(f, {'target_is_post_cutoff':True,'cutoff_day':30})

    def test_blocks_missing_ci(self):
        f = fixture(); f['performance']['participant_bootstrap_ci95']=None
        with self.assertRaises(ValueError): payload_from_audit(f, {'target_is_post_cutoff':True,'cutoff_day':30})

    def test_blocks_invalid_metrics(self):
        f = fixture(); f['performance']['behavior_test']['roc_auc']=float('nan')
        with self.assertRaises(ValueError): payload_from_audit(f, {'target_is_post_cutoff':True,'cutoff_day':30})

if __name__ == '__main__': unittest.main()
