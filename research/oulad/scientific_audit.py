#!/usr/bin/env python3
"""CP22 independent OULAD integrity and claim audit; Python standard library only.
Read-only: does not refit models or reveal student rows.
"""
from __future__ import annotations
import argparse, csv, hashlib, json, math
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

FEATURES = ['num_of_prev_attempts','studied_credits','registered_by_cutoff','prior_assess_count','prior_mean_score','clicks_0_30','active_days_0_30','unique_sites_0_30']

def checksum(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for chunk in iter(lambda:f.read(1024*1024), b''):h.update(chunk)
    return h.hexdigest()

def audit(features,manifest,metrics,archive=None):
    features=Path(features);manifest=Path(manifest);metrics=Path(metrics)
    man=json.loads(manifest.read_text(encoding='utf-8'))
    report=json.loads(metrics.read_text(encoding='utf-8'))
    counts=Counter(); labels=Counter(); seen=set(); learner_split={}; errors=[]; warnings=[]; missing=Counter(); duplicate=0; bad_ranges=Counter(); per_course=defaultdict(Counter)
    with features.open(encoding='utf-8',newline='') as f:
        reader=csv.DictReader(f)
        required={'participant_hash','course','presentation','split','target','target_label'}|set(FEATURES)
        absent=required-set(reader.fieldnames or [])
        if absent:errors.append('Missing required feature columns: '+','.join(sorted(absent)))
        else:
            for row in reader:
                s=row['split']; uid=row['participant_hash'];target=row['target']
                if s not in ('train','val','test'):errors.append('Invalid split label');continue
                counts[s]+=1;labels[(s,target)]+=1;per_course[(row['course'],s)][target]+=1
                key=(row['course'],row['presentation'],uid)
                if key in seen:duplicate+=1
                seen.add(key)
                if uid in learner_split and learner_split[uid]!=s:errors.append('Participant leakage across splits')
                learner_split[uid]=s
                if target not in ('0','1'):errors.append('Invalid target label')
                for col in FEATURES:
                    val=row[col]
                    if val=='':missing[col]+=1;continue
                    try:n=float(val)
                    except ValueError:bad_ranges[col]+=1;continue
                    if not math.isfinite(n) or (col!='prior_mean_score' and n<0) or (col=='prior_mean_score' and not 0<=n<=100) or (col=='active_days_0_30' and n>int(man.get('cutoff_day',30))+1) or (col=='registered_by_cutoff' and n!=1):bad_ranges[col]+=1
    if duplicate:errors.append(f'Duplicate course/presentation/student rows: {duplicate}')
    if bad_ranges:errors.append('Invalid feature ranges: '+str(dict(bad_ranges)))
    if dict(counts)!=man.get('split_counts'):errors.append('Feature counts differ from manifest')
    if dict(counts)!=report.get('split_counts'):errors.append('Feature counts differ from evaluation')
    measured_sha=checksum(features)
    if measured_sha!=report.get('input_sha256'):errors.append('Feature checksum differs from evaluated version')
    if man.get('target_is_post_cutoff') is not True:errors.append('Target cutoff flag not certified')
    if archive:
        ar=Path(archive)
        if not ar.exists():errors.append('Raw source archive not available for checksum verification')
        elif checksum(ar)!=man.get('archive_sha256'):errors.append('Raw source archive SHA-256 mismatch')
    else:warnings.append('Archive checksum not independently verified (use --archive)')
    comparison=report.get('comparison',{}).get('brier_improvement_academic_vs_behavior',{})
    ci=comparison.get('ci95'); delta=comparison.get('estimate')
    if delta is None or not isinstance(ci,list) or len(ci)!=2:
        warnings.append('Bootstrap Brier improvement or confidence interval not present')
    else:
        ci=[float(x) for x in ci];delta=float(delta)
        if not ci[0]<=delta<=ci[1]:warnings.append('Brier estimate outside bootstrap percentile CI; inspect bootstrap')
    if not report.get('calibration'):warnings.append('No calibration-bin results')
    if not report.get('course_audit'):warnings.append('No course-stratified audit')
    if any(sum(1 for (s,t),v in labels.items() if s==part and v>0)<2 for part in ('train','val','test')):warnings.append('At least one split lacks an observed class')
    n=sum(counts.values())
    audit_result={
        'audit_timestamp_utc':datetime.now(timezone.utc).isoformat(),
        'audit_status':'PASS' if not errors else 'FAIL',
        'data':{'rows':n,'unique_learners':len(learner_split),'split_counts':dict(counts),'positive_by_split':{s:labels[(s,'1')] for s in ('train','val','test')},'missing_fields':dict(missing),'feature_sha256':measured_sha,'archive_sha256_recorded':man.get('archive_sha256')},
        'performance':{'academic_test':report.get('models',{}).get('academic_only',{}).get('test',{}),'behavior_test':report.get('models',{}).get('academic_plus_behavior',{}).get('test',{}),'brier_delta_academic_minus_behavior':delta,'participant_bootstrap_ci95':ci},
        'limits':{'supported':'Incremental predictive performance on the OULAD holdout for day-30 course outcome','not_supported':['Prediction accuracy for Vietnamese high-school grade scores','SCI/MAS/CSL psychometric validity','CLA Static vs Adaptive intervention effects','Causal claims from predictive associations','External validation or prospective clinical/educational deployment']},
        'warnings':warnings,'errors':list(dict.fromkeys(errors))}
    return audit_result

def markdown(result):
    d=result['data'];p=result['performance']; a=p['academic_test'];b=p['behavior_test'];ci=p['participant_bootstrap_ci95'];delta=p['brier_delta_academic_minus_behavior']
    ci_text='not available' if ci is None else f'[{ci[0]:.6f}, {ci[1]:.6f}]'
    lines=['# CLA — OULAD CP22 Scientific Evidence Report','',f"**Audit status:** {result['audit_status']}",f"**Feature records:** {d['rows']} | **Unique learner IDs:** {d['unique_learners']}",f"**Train / validation / test:** {d['split_counts']}",'', '## Independent test-set comparison','', '| Metric | Academic-only | Academic + Behavior |','|---|---:|---:|']
    for k in ['accuracy_at_0.5','roc_auc','brier','log_loss']:
        lines.append(f'| {k} | {a.get(k,"n/a")} | {b.get(k,"n/a")} |')
    lines+=['',f'**Brier improvement** (academic minus behavior): {delta}; learner-cluster bootstrap 95% CI: {ci_text}.','', '## Quality and reproducibility','',f"- Feature SHA256: `{d['feature_sha256']}`",f"- Recorded original archive SHA256: `{d['archive_sha256_recorded']}`",f"- Missing by feature: {d['missing_fields']}",'','## Scientific claim boundaries','',f"Supported: {result['limits']['supported']}",'']
    lines += [f"- NOT established: {v}" for v in result['limits']['not_supported']]
    if result['warnings']:lines+=['','## Warnings']+[f'- {v}' for v in result['warnings']]
    if result['errors']:lines+=['','## Blocking errors']+[f'- {v}' for v in result['errors']]
    lines+=['','This report checks file consistency and holdout metrics; it is not an independent rerun of model fitting, a causal study or evidence of SCI/MAS/CSL validity.','']
    return '\n'.join(lines)

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--features',default='research/oulad/work/features.csv')
    p.add_argument('--manifest',default='research/oulad/work/dataset_manifest.json')
    p.add_argument('--metrics',default='research/oulad/work/results/metrics.json')
    p.add_argument('--archive',default=None)
    p.add_argument('--out',default='research/oulad/work/results/scientific_audit')
    args=p.parse_args()
    result=audit(args.features,args.manifest,args.metrics,args.archive)
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    (out/'audit.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    (out/'report.md').write_text(markdown(result),encoding='utf-8')
    print('Audit:',result['audit_status'],'rows:',result['data']['rows'],'Brier delta:',result['performance']['brier_delta_academic_minus_behavior'],'CI:',result['performance']['participant_bootstrap_ci95'])
    print('Report:',out/'report.md')
    if result['errors']:raise SystemExit(2)

if __name__=='__main__':main()
