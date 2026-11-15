import csv, tempfile, unittest, sys
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import pipeline

class TestOulad(unittest.TestCase):
    def test_auc(self):
        self.assertEqual(pipeline.auc([0,1],[0.1,0.9]),1.0)
        self.assertEqual(pipeline.auc([0,1],[0.9,0.1]),0.0)
        self.assertAlmostEqual(pipeline.auc([0,1],[0.5,0.5]),0.5)
    def test_missing_train_only(self):
        train=[{'v':'1'},{'v':'3'},{'v':''}]
        x,m,s=pipeline.data_for_model(train,['v'])
        self.assertEqual(m,[2.0]);self.assertEqual(x[2][-2],1.)
        _,m2,s2=pipeline.data_for_model([{'v':'300'}],['v'],m,s)
        self.assertEqual(m2,m)
    def test_early_withdrawal_excluded_and_late_withdrawal_retained(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)
            def write(name,columns,rows):
                with (root/name).open('w',newline='') as f:
                    w=csv.writer(f);w.writerow(columns);w.writerows(rows)
            students=[['AAA','2013J',str(i),'Withdrawn','0','30'] for i in (1,2,3)]
            write('studentInfo.csv',['code_module','code_presentation','id_student','final_result','num_of_prev_attempts','studied_credits'],students)
            write('studentRegistration.csv',['code_module','code_presentation','id_student','date_registration','date_unregistration'],
                  [['AAA','2013J','1','-10','15'],['AAA','2013J','2','-10','31'],['AAA','2013J','3','-10','']])
            write('studentVle.csv',['code_module','code_presentation','id_student','id_site','date','sum_click'],[])
            write('assessments.csv',['code_module','code_presentation','id_assessment','assessment_type','date','weight'],[])
            write('studentAssessment.csv',['id_assessment','id_student','date_submitted','is_banked','score'],[])
            pipeline.prepare(SimpleNamespace(input=str(root),out=str(root/'work'),cutoff=30))
            with (root/'work'/'features.csv').open(newline='') as f: rows=list(csv.DictReader(f))
            self.assertEqual(len(rows),2)
            import json
            manifest=json.loads((root/'work'/'dataset_manifest.json').read_text())
            self.assertEqual(manifest['excluded_counts']['already_unregistered_at_cutoff'],1)
    def test_cluster_bootstrap_and_calibration(self):
        rows=[{'participant_hash':'a'},{'participant_hash':'a'},{'participant_hash':'b'},{'participant_hash':'c'}]
        y=[1,1,0,0]
        before=[.3,.4,.6,.7];after=[.8,.8,.2,.2]
        result=pipeline.bootstrap_brier_delta(rows,y,before,after,reps=100)
        self.assertGreater(result['estimate'],0)
        self.assertEqual(result['bootstrap_reps'],100)
        self.assertEqual(len(result['ci95']),2)
        self.assertEqual(sum(x['n'] for x in pipeline.calibration_bins(y,after)),len(y))
    def test_end_to_end(self):
        with tempfile.TemporaryDirectory() as t:
            root=Path(t)
            def write(name,cols,rows):
                with (root/name).open('w',newline='') as f:
                    w=csv.writer(f);w.writerow(cols);w.writerows(rows)
            students=[];regs=[];sv=[];sa=[]
            for i in range(100):
                sid=str(10000+i);res=['Pass','Distinction','Fail','Withdrawn'][i%4]
                students.append(['AAA','2013J',sid,res,str(i%4),str(30+i%4)])
                regs.append(['AAA','2013J',sid,'-7',''])
                sv.append(['AAA','2013J',sid,'1','15',str(i%9)])
                sv.append(['AAA','2013J',sid,'1','60','500']) # post-cutoff NEVER INCLUDED
                sa.append(['10',sid,'10','0',str(50+i%30)])
                sa.append(['10',sid,'40','0','100']) # post-cutoff NEVER INCLUDED
            write('studentInfo.csv',['code_module','code_presentation','id_student','final_result','num_of_prev_attempts','studied_credits'],students)
            write('studentRegistration.csv',['code_module','code_presentation','id_student','date_registration','date_unregistration'],regs)
            write('studentVle.csv',['code_module','code_presentation','id_student','id_site','date','sum_click'],sv)
            write('assessments.csv',['code_module','code_presentation','id_assessment','assessment_type','date','weight'],[['AAA','2013J','10','TMA','40','100']])
            write('studentAssessment.csv',['id_assessment','id_student','date_submitted','is_banked','score'],sa)
            pipeline.prepare(SimpleNamespace(input=str(root),out=str(root/'work'),cutoff=30))
            with open(root/'work'/'features.csv',newline='') as f:
                data=list(csv.DictReader(f))
            self.assertEqual(len(data),100)
            self.assertTrue(all(int(r['clicks_0_30'])<10 for r in data))
            self.assertTrue(all(int(r['prior_assess_count'])==1 for r in data))
            self.assertTrue(all(float(r['prior_mean_score'])<80 for r in data))
            pipeline.evaluate(SimpleNamespace(input=str(root/'work'/'features.csv'),out=str(root/'results')))
            self.assertTrue((root/'results'/'metrics.json').is_file())
if __name__=='__main__':unittest.main()
