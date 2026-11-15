#!/usr/bin/env python3
"""CLA OULAD early-warning pilot (Python standard library only).

Research prototype. Predict final course result at course day 30; not a causal model.
Uses OULAD (Kuzilek et al.; CC BY 4.0; DOI 10.24432/C5KK69).
"""
from __future__ import annotations
import argparse, csv, hashlib, io, json, math, os, random, shutil, sys, tempfile, time, urllib.error, urllib.request, zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

SOURCE_URL = 'https://archive.ics.uci.edu/static/public/349/open+university+learning+analytics+dataset.zip'
NEEDED = {'studentInfo.csv', 'studentVle.csv', 'studentAssessment.csv', 'assessments.csv', 'studentRegistration.csv'}
ACADEMIC = ('num_of_prev_attempts', 'studied_credits', 'registered_by_cutoff', 'prior_assess_count', 'prior_mean_score')
BEHAVIOR = ('clicks_0_30', 'active_days_0_30', 'unique_sites_0_30')
FULL = ACADEMIC + BEHAVIOR
SEED = 20261115

def utc():
    return datetime.now(timezone.utc).isoformat()

def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def json_write(path, value):
    path=Path(path); path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def download(args):
    out=Path(args.out);out.parent.mkdir(parents=True,exist_ok=True)
    if out.exists():
        print('Existing archive:',out,'SHA256:',sha(out));return
    if args.url!=SOURCE_URL and not args.allow_custom_url:
        raise ValueError('Custom URLs require --allow-custom-url; trusted default is UCI only')
    tmp=out.with_suffix(out.suffix+'.part')
    request=urllib.request.Request(args.url,headers={'User-Agent':'CLA-OULAD-Research/1.0'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request,timeout=40) as response,open(tmp,'wb') as f:
                total=0
                while True:
                    chunk=response.read(1024*1024)
                    if not chunk:break
                    total+=len(chunk);f.write(chunk)
            if not zipfile.is_zipfile(tmp):raise ValueError('Download is not a ZIP archive')
            tmp.replace(out)
            json_write(str(out)+'.source.json',{'url':args.url,'retrieved_at':utc(),'sha256':sha(out),'bytes':out.stat().st_size,'license':'CC BY 4.0; verify original source and attribution'})
            print('Downloaded',out,'bytes',total,'SHA256',sha(out));return
        except (urllib.error.URLError,TimeoutError,OSError) as e:
            print('Attempt',attempt+1,'failed:',repr(e),file=sys.stderr)
            if attempt==3:raise
            time.sleep(min(30,2**attempt*3))
    

def locate_csvs(archive):
    """Read OULAD CSVs from either UCI ZIP or nested original ZIP, no extraction."""
    if archive.is_dir():
        files={n:archive/n for n in NEEDED}
        missing=[n for n,p in files.items() if not p.is_file()]
        if missing:raise ValueError('Missing CSV files: '+', '.join(missing))
        return files,[]
    handles=[]
    root=zipfile.ZipFile(archive);handles.append(root)
    def scan(z):
        found={Path(n).name:n for n in z.namelist() if not n.endswith('/')}
        if NEEDED.issubset(found):return z,{k:found[k] for k in NEEDED}
        for name in z.namelist():
            if name.lower().endswith('.zip'):
                info=z.getinfo(name)
                if info.file_size>1024*1024*1024:continue
                nested=zipfile.ZipFile(io.BytesIO(z.read(name)));handles.append(nested)
                rows={Path(n).name:n for n in nested.namelist() if not n.endswith('/')}
                if NEEDED.issubset(rows):return nested,{k:rows[k] for k in NEEDED}
        raise ValueError('Expected OULAD CSV members missing from ZIP')
    z, names=scan(root)
    return {k:(z,names[k]) for k in NEEDED},handles

def csv_rows(src):
    if isinstance(src,Path):
        with src.open('r',encoding='utf-8-sig',newline='') as f:yield from csv.DictReader(f)
    else:
        z,name=src
        with z.open(name) as raw,io.TextIOWrapper(raw,encoding='utf-8-sig',newline='') as f:
            yield from csv.DictReader(f)

def integer(value,default=None):
    try:return int(str(value).strip())
    except (ValueError,TypeError):return default

def numeric(value,default=None):
    try:
        v=float(value)
        return v if math.isfinite(v) else default
    except (ValueError,TypeError):return default

def prepare(args):
    archive=Path(args.input);out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    files,handles=locate_csvs(archive)
    try:
        info={}; targets=Counter(); skipped=Counter()
        for r in csv_rows(files['studentInfo.csv']):
            key=(r['code_module'],r['code_presentation'],r['id_student'])
            if key in info:skipped['duplicate_student_course']+=1;continue
            label=r.get('final_result','')
            if label not in ('Pass','Distinction','Fail','Withdrawn'):
                skipped['unknown_target']+=1;continue
            info[key]=r;targets[label]+=1
        reg={}
        for r in csv_rows(files['studentRegistration.csv']):
            key=(r['code_module'],r['code_presentation'],r['id_student'])
            if key in info:
                reg[key]=(integer(r.get('date_registration')),integer(r.get('date_unregistration')))

        assess={}
        for r in csv_rows(files['assessments.csv']):
            assess[r['id_assessment']]=(r['code_module'],r['code_presentation'],integer(r.get('date')),r.get('assessment_type'))
        # Assessment submissions are point-in-time evidence; cannot use those after cutoff.
        prior=defaultdict(list)
        for r in csv_rows(files['studentAssessment.csv']):
            meta=assess.get(r['id_assessment']);submitted=integer(r.get('date_submitted'))
            if not meta or submitted is None or not (0<=submitted<=args.cutoff):continue
            key=(meta[0],meta[1],r['id_student'])
            if key not in info:continue
            score=numeric(r.get('score'))
            if score is not None and 0<=score<=100:prior[key].append(score)
        behavior=defaultdict(lambda:[0,set(),set()])
        for r in csv_rows(files['studentVle.csv']):
            day=integer(r.get('date'))
            if day is None or not (0<=day<=args.cutoff):continue
            key=(r['code_module'],r['code_presentation'],r['id_student'])
            if key not in info:continue
            clicks=integer(r.get('sum_click'),0)
            if clicks<0:continue
            b=behavior[key];b[0]+=clicks;b[1].add(day);b[2].add(r['id_site'])
        output=out/'features.csv'
        with output.open('w',encoding='utf-8',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=['course','presentation','participant_hash','split','target_label','target']+list(FULL));writer.writeheader()
            by_split=Counter()
            for key,r in sorted(info.items()):
                registered, unregistered=reg.get(key,(None,None))
                if registered is None or registered>args.cutoff:
                    skipped['unregistered_or_unknown_at_cutoff']+=1;continue
                # At cutoff the outcome must still be in the future.
                # Withdrawal already recorded on/before the cutoff is not a prediction target.
                if unregistered is not None and unregistered<=args.cutoff:
                    skipped['already_unregistered_at_cutoff']+=1;continue
                # Prevent training/test crossover for learners enrolled in multiple presentations.
                digest=hashlib.sha256(('CLA-OULAD-v1:'+key[2]).encode()).hexdigest()
                bucket=int(digest[:12],16)%100
                split='train' if bucket<70 else ('val' if bucket<80 else 'test')
                previous=prior.get(key,[])
                b=behavior.get(key,[0,set(),set()]);label=r['final_result']
                record={'course':key[0],'presentation':key[1],'participant_hash':digest[:20],
                        'split':split,'target_label':label,'target':int(label in ('Pass','Distinction')),
                        'num_of_prev_attempts':integer(r.get('num_of_prev_attempts'),0),
                        'studied_credits':integer(r.get('studied_credits'),0),
                        'registered_by_cutoff':int(registered<=args.cutoff),
                        'prior_assess_count':len(previous),
                        'prior_mean_score':round(sum(previous)/len(previous),4) if previous else '',
                        'clicks_0_30':b[0], 'active_days_0_30':len(b[1]),'unique_sites_0_30':len(b[2])}
                writer.writerow(record);by_split[split]+=1
        manifest={'source':'OULAD / UCI 349','doi':'10.24432/C5KK69','license':'CC BY 4.0',
                  'archive_sha256':sha(archive) if archive.is_file() else None,'cutoff_day':args.cutoff,
                  'target':'final_result Pass|Distinction vs Fail|Withdrawn',
                  'target_is_post_cutoff':True,'split':'sha256(id_student), 70/10/20, learner-level',
                  'timestamp':utc(),'source_labels':dict(targets),'split_counts':dict(by_split),
                  'excluded_counts':dict(skipped),'features':list(FULL),
                  'eligibility':'registered by cutoff, not unregistered by cutoff',
                  'excluded_sensitive_fields':['gender','region','disability','imd_band','age_band'],
                  'limitations':['UK university online courses, not Vietnam high school','click counts are not minutes studied',
                                 'observational prediction, not causal intervention evaluation',
                                 'target includes withdrawal, model may reflect engagement patterns; monitor subgroup harm',
                                 'zero clicks vs non-observed days may be ambiguous']}
        json_write(out/'dataset_manifest.json',manifest)
        print('Prepared',output,'split_counts',dict(by_split),'excluded',dict(skipped))
    finally:
        for h in handles:h.close()

def sigmoid(x):
    if x>=0:return 1/(1+math.exp(-min(700,x)))
    t=math.exp(max(-700,x));return t/(1+t)

def auc(y,p):
    positives=sum(y);negatives=len(y)-positives
    if not positives or not negatives:return None
    ordered=sorted(zip(p,y),key=lambda z:z[0]);rank=1;sum_rank=0;idx=0
    while idx<len(ordered):
        j=idx+1
        while j<len(ordered) and ordered[j][0]==ordered[idx][0]:j+=1
        mean_rank=(idx+1+j)/2
        sum_rank+=mean_rank*sum(int(t) for _,t in ordered[idx:j]);idx=j
    return (sum_rank-positives*(positives+1)/2)/(positives*negatives)

def bootstrap_brier_delta(rows, y, p_academic, p_behavior, reps=300, seed=SEED):
    """Participant-cluster bootstrap CI for Brier(academic) - Brier(behavior).

    Resamples learner IDs (not rows) to preserve within-learner dependencies.
    Results describe a performance difference, not a causal treatment effect.
    """
    clusters=defaultdict(list)
    for i,row in enumerate(rows):clusters[row['participant_hash']].append(i)
    ids=sorted(clusters)
    if not ids:return {'estimate':None,'ci95':None,'bootstrap_reps':0}
    def delta(indices):
        return sum((y[i]-p_academic[i])**2-(y[i]-p_behavior[i])**2 for i in indices)/len(indices)
    rng=random.Random(seed)
    values=[]
    for _ in range(reps):
        sample=[i for _ in ids for i in clusters[rng.choice(ids)]]
        values.append(delta(sample))
    values.sort()
    return {'estimate':round(delta(list(range(len(y)))),6),
            'ci95':[round(values[int(.025*(reps-1))],6),round(values[int(.975*(reps-1))],6)],
            'bootstrap_reps':reps,'method':'participant-cluster bootstrap; academic minus behavior Brier'}

def calibration_bins(y,p,bins=10):
    result=[]
    for b in range(bins):
        indexes=[i for i,q in enumerate(p) if min(bins-1,int(q*bins))==b]
        if indexes:
            result.append({'bin':b,'n':len(indexes),'mean_probability':round(sum(p[i] for i in indexes)/len(indexes),4),
                           'observed_rate':round(sum(y[i] for i in indexes)/len(indexes),4)})
    return result

def metrics(y,p):
    n=len(y)
    if n==0:return {'count':0}
    eps=1e-12
    return {'count':n,'positive_rate':round(sum(y)/n,5),
            'brier':round(sum((t-q)**2 for t,q in zip(y,p))/n,6),
            'log_loss':round(-sum(t*math.log(max(eps,q))+(1-t)*math.log(max(eps,1-q)) for t,q in zip(y,p))/n,6),
            'accuracy_at_0.5':round(sum((q>=.5)==bool(t) for t,q in zip(y,p))/n,5),
            'roc_auc':None if auc(y,p) is None else round(auc(y,p),6)}

def data_for_model(rows,cols,means=None,stds=None):
    # Missingness indicators are added; fit preprocessing on train only.
    values=[[numeric(r.get(c)) for c in cols] for r in rows]
    if means is None:
        means=[];stds=[]
        for j in range(len(cols)):
            arr=[v[j] for v in values if v[j] is not None]
            mu=sum(arr)/len(arr) if arr else 0.0
            scale=math.sqrt(sum((x-mu)**2 for x in arr)/len(arr)) if arr else 1.0
            means.append(mu);stds.append(max(scale,1e-6))
    transformed=[]
    for vals in values:
        transformed.append([max(-8,min(8,((v if v is not None else means[j])-means[j])/stds[j])) for j,v in enumerate(vals)]+
                           [float(v is None) for v in vals]+[1.0])
    return transformed,means,stds

def fit_logistic(X,y,epochs=250,rate=.05,reg=.001):
    if not X:return []
    p=len(X[0]);w=[0.0]*p
    for epoch in range(epochs):
        grad=[0.0]*p
        for row,target in zip(X,y):
            error=sigmoid(sum(a*b for a,b in zip(row,w)))-target
            for j,v in enumerate(row):grad[j]+=error*v
        for j in range(p):
            g=grad[j]/len(X)+(0.0 if j==p-1 else reg*w[j])
            w[j]-=rate*g
    return w

def predict(w,X):return [sigmoid(sum(a*b for a,b in zip(w,x))) for x in X]

def evaluate(args):
    with open(args.input,encoding='utf-8',newline='') as f:
        rows=list(csv.DictReader(f))
    splits={s:[r for r in rows if r['split']==s] for s in ('train','val','test')}
    if not all(splits.values()):raise ValueError('Need nonempty train, val, test groups')
    students={s:{r['participant_hash'] for r in rr} for s,rr in splits.items()}
    assert not any(students[x]&students[y] for x,y in [('train','val'),('train','test'),('val','test')]), 'Participant leakage'
    y={s:[int(r['target']) for r in rr] for s,rr in splits.items()}
    prior=sum(y['train'])/len(y['train'])
    report={'run_at':utc(),'source_manifest':str(Path(args.input).parent/'dataset_manifest.json'),
            'input_sha256':sha(args.input),'split_counts':{s:len(rr) for s,rr in splits.items()},
            'models':{},'research_scope':'Cross-dataset methodological prototype; not CLA intervention evidence'}
    test_predictions={}
    for name,features in [('constant_baseline',()),('academic_only',ACADEMIC),('academic_plus_behavior',FULL)]:
        if not features:
            valpred=[prior]*len(y['val']);testpred=[prior]*len(y['test'])
        else:
            Xt,m,sd=data_for_model(splits['train'],features)
            Xv,_,_=data_for_model(splits['val'],features,m,sd)
            Xtest,_,_=data_for_model(splits['test'],features,m,sd)
            weights=fit_logistic(Xt,y['train'])
            valpred=predict(weights,Xv);testpred=predict(weights,Xtest)
        test_predictions[name]=testpred
        report['models'][name]={'features':list(features),'validation':metrics(y['val'],valpred),'test':metrics(y['test'],testpred)}
    # Test outcomes are only interpreted after all three frozen policies are fit.
    report['comparison']={'brier_improvement_academic_vs_behavior':bootstrap_brier_delta(
        splits['test'],y['test'],test_predictions['academic_only'],test_predictions['academic_plus_behavior'])}
    report['calibration']={name:calibration_bins(y['test'],pred) for name,pred in test_predictions.items()}
    # Operational non-sensitive subgroup audit; small cells withheld.
    report['course_audit']={}
    for course in sorted({r['course'] for r in splits['test']}):
        ix=[i for i,r in enumerate(splits['test']) if r['course']==course]
        if len(ix)<30:continue
        report['course_audit'][course]={
            name:metrics([y['test'][i] for i in ix],[pred[i] for i in ix])
            for name,pred in test_predictions.items()}
    report['limitations']=['Holdout test is not an external cohort or prospective validation',
       'No intervention claim; UK university data cannot establish effects for Vietnamese high-school students',
       'Bootstrap interval reflects learner sampling, not dataset provenance or model training variability']
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    json_write(out/'metrics.json',report)
    print(json.dumps(report['models'],indent=2))
    print('Saved',out/'metrics.json')

def main():
    p=argparse.ArgumentParser(description=__doc__);s=p.add_subparsers(dest='cmd',required=True)
    f=s.add_parser('fetch');f.add_argument('--out',default='research/oulad/data/OULAD.zip');f.add_argument('--url',default=SOURCE_URL);f.add_argument('--allow-custom-url',action='store_true');f.set_defaults(func=download)
    pr=s.add_parser('prepare');pr.add_argument('--input',required=True);pr.add_argument('--out',default='research/oulad/work');pr.add_argument('--cutoff',type=int,default=30);pr.set_defaults(func=prepare)
    e=s.add_parser('evaluate');e.add_argument('--input',default='research/oulad/work/features.csv');e.add_argument('--out',default='research/oulad/work/results');e.set_defaults(func=evaluate)
    args=p.parse_args();args.func(args)
if __name__=='__main__':main()
