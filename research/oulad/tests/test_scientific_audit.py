import csv, importlib.util, json, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('scientific_audit',ROOT/'scientific_audit.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
class ScientificAuditTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.p=Path(self.tmp.name)
        columns=['participant_hash','course','presentation','split','target','target_label']+a.FEATURES
        with (self.p/'features.csv').open('w',newline='') as f:
            wr=csv.DictWriter(f,fieldnames=columns);wr.writeheader()
            for split,uid,target in [('train','a','1'),('val','b','0'),('test','c','1')]:
                row=dict.fromkeys(columns,'0');row.update(participant_hash=uid,course='AAA',presentation='2013J',split=split,target=target,target_label='Pass',registered_by_cutoff='1',prior_mean_score='')
                wr.writerow(row)
        (self.p/'dataset_manifest.json').write_text(json.dumps({'split_counts':{'train':1,'val':1,'test':1},'target_is_post_cutoff':True,'cutoff_day':30,'archive_sha256':'abc'}))
        (self.p/'metrics.json').write_text(json.dumps({'split_counts':{'train':1,'val':1,'test':1},'input_sha256':a.checksum(self.p/'features.csv'),'models':{'academic_only':{'test':{'brier':.25}},'academic_plus_behavior':{'test':{'brier':.20}}},'comparison':{'brier_improvement_academic_vs_behavior':{'estimate':.05,'ci95':[.02,.08]}},'calibration':{'x':[]},'course_audit':{'AAA':{}}}))
    def tearDown(self):self.tmp.cleanup()
    def run_audit(self):return a.audit(self.p/'features.csv',self.p/'dataset_manifest.json',self.p/'metrics.json')
    def test_valid(self):
        r=self.run_audit();self.assertEqual(r['audit_status'],'PASS');self.assertEqual(r['data']['rows'],3)
        self.assertIn('bootstrap',a.markdown(r))
    def test_feature_tamper(self):
        with (self.p/'features.csv').open('a') as f:f.write('\n')
        self.assertEqual(self.run_audit()['audit_status'],'FAIL')
    def test_cross_split_leakage(self):
        file=self.p/'features.csv';s=file.read_text();s=s.replace('b,AAA,','a,AAA,');file.write_text(s)
        self.assertIn('Participant leakage across splits',self.run_audit()['errors'])
    def test_archive_mismatch(self):
        archive=self.p/'OULAD.zip';archive.write_bytes(b'not actual archive')
        r=a.audit(self.p/'features.csv',self.p/'dataset_manifest.json',self.p/'metrics.json',archive)
        self.assertEqual(r['audit_status'],'FAIL')
if __name__=='__main__':unittest.main()
