#!/usr/bin/env python3
"""CP33: private paired-window agreement audit; never grants validity or clinical claims."""
import argparse
import csv
import hashlib
import json
import math
import random
import statistics as st
from datetime import date
from pathlib import Path
from validate import evaluate, SPECS, REQUIRED, num, VERSION

SCHEMA = 'cla.cognitive.reliability.v1'
EXTRA = ['consent_status', 'instrument_version', 'stability_confirmed']
MIN_PAIRS = 10  # computational reporting floor, not a power calculation
BOOTSTRAPS = 2000
SEED = 20261118


def iso(s):
    if date.fromisoformat(s).isoformat() != s:
        raise ValueError('Expected YYYY-MM-DD')
    return date.fromisoformat(s)


def icc_a1(pairs):
    """Two-way absolute agreement, single measurement ICC(A,1); negative is allowed."""
    n = len(pairs)
    if n < 2:
        return None
    k = 2
    grand = st.mean(x for p in pairs for x in p)
    row = [st.mean(p) for p in pairs]
    col = [st.mean(p[j] for p in pairs) for j in range(k)]
    msr = k * sum((m-grand)**2 for m in row)/(n-1)
    msc = n * sum((m-grand)**2 for m in col)/(k-1)
    mse = sum((p[j]-row[i]-col[j]+grand)**2 for i,p in enumerate(pairs) for j in range(k))/((n-1)*(k-1))
    denom = msr+(k-1)*mse+k*(msc-mse)/n
    return (msr-mse)/denom if denom > 1e-12 else None


def percentile(xs, p):
    xs = sorted(xs)
    i = (len(xs)-1)*p
    a, b = math.floor(i), math.ceil(i)
    return xs[a]+(xs[b]-xs[a])*(i-a)


def agreement(pairs):
    n = len(pairs)
    out = {'paired_participants':n,'icc_a1':None,'icc_ci95':None,'bootstrap_valid':0,
           'mean_retest_minus_test':None,'mean_absolute_difference':None,'status':'INSUFFICIENT_PAIRS'}
    if n < MIN_PAIRS:
        return out
    delta = [b-a for a,b in pairs]
    estimate = icc_a1(pairs)
    out.update(mean_retest_minus_test=round(st.mean(delta),6),mean_absolute_difference=round(st.mean(map(abs,delta)),6))
    if estimate is None:
        out['status']='UNDEFINED_VARIANCE'; return out
    rng = random.Random(SEED)
    boot = [icc_a1(rng.choices(pairs,k=n)) for _ in range(BOOTSTRAPS)]
    valid = [x for x in boot if x is not None and math.isfinite(x)]
    out.update(icc_a1=round(estimate,6),bootstrap_valid=len(valid),status='EXPLORATORY_AGREEMENT_ONLY')
    if len(valid)>=.95*BOOTSTRAPS:
        out['icc_ci95']=[round(percentile(valid,p),6) for p in (.025,.975)]
    return out


def read(path):
    with Path(path).open(encoding='utf-8-sig',newline='') as f:
        reader=csv.DictReader(f)
        fields=reader.fieldnames or []
        if len(fields)!=len(set(fields)) or set(fields)!=set(REQUIRED+EXTRA):
            raise ValueError('Unexpected/missing columns; use exact research schema')
        rows=list(reader)
    if any(None in r or None in r.values() for r in rows):
        raise ValueError('Malformed CSV row')
    return rows


def audit(rows, plan, scope):
    if scope not in ('SYNTHETIC','CONSENTED_RESEARCH_UNVERIFIED'):
        raise ValueError('Invalid scope')
    if set(plan)!= {'schema','test_window','retest_window','instrument_version','protocol_version'} or plan['schema']!='cla.cognitive.paired-plan.v1':
        raise ValueError('Invalid plan')
    t0,t1=plan['test_window'],plan['retest_window']
    if not 7 <= (iso(t1)-iso(t0)).days <= 14:
        raise ValueError('Retest must be 7–14 days later')
    if not all(isinstance(plan[k],str) and plan[k].strip() for k in ('instrument_version','protocol_version')):
        raise ValueError('Missing instrument/protocol version')
    seen=set(); selected=[]; all_ids=set(); excluded_unstable=0
    for r in rows:
        if set(r)!=set(REQUIRED+EXTRA): raise ValueError('Unexpected row schema')
        pid=r['participant_id'].strip(); window=r['window']; iso(window)
        if not pid or pid!=r['participant_id'] or (pid,window) in seen: raise ValueError('Missing or duplicate identity/window')
        seen.add((pid,window))
        if r['consent_status']!='granted' or r['instrument_version']!=plan['instrument_version']:
            raise ValueError('Consent declaration or instrument version mismatch')
        if scope!='SYNTHETIC' and pid.lower().startswith(('syn_','synthetic','demo_','test_')):
            raise ValueError('Synthetic/demo identifier rejected from research scope')
        if r['stability_confirmed'] not in ('yes','no','unknown'):
            raise ValueError('Invalid stability declaration')
        ev=num(r['event_count'],0,1e12)
        if ev is None or not ev.is_integer(): raise ValueError('Invalid event count')
        if any(r[f].strip() and num(r[f]) is None for f in REQUIRED[3:]): raise ValueError('Invalid indicator value')
        if window not in (t0,t1): continue
        all_ids.add(pid)
        if r['stability_confirmed']=='yes': selected.append(r)
        else: excluded_unstable+=1
    base, scores=evaluate(selected)
    paired={c:{} for c in SPECS}
    for r in scores:
        for c in SPECS:
            if r[f'{c}_score'] is not None:
                paired[c].setdefault(r['participant_id'],{})[r['window']]=r[f'{c}_score']
    result={c:agreement([(w[t0],w[t1]) for _,w in sorted(paired[c].items()) if t0 in w and t1 in w]) for c in SPECS}
    return {'schema':SCHEMA,'data_scope':scope,'status':'EXPERIMENTAL_PROXY_NOT_VALIDATED','mapping_version':VERSION,
            'plan':plan,'target_window_participants':len(all_ids),'excluded_unstable_or_unknown_rows':excluded_unstable,
            'results':result,'sensitivity':base['sensitivity'],'bootstrap_seed':SEED,'bootstrap_replicates':BOOTSTRAPS,
            'psychometric_validation':False,'limitations':['Stability and consent are declared, not independently verified.','Paired complete cases only; selection and missingness may bias estimates.','ICC(A,1) and percentile participant bootstrap are exploratory; no acceptance threshold or power claim.','CP24 research composites differ from production proxies; no score promotion.','No validity, causality, or THPT generalization established.']}


def main():
    p=argparse.ArgumentParser();p.add_argument('--input',required=True,type=Path);p.add_argument('--plan',required=True,type=Path);p.add_argument('--out',required=True,type=Path);p.add_argument('--scope',required=True,choices=['SYNTHETIC','CONSENTED_RESEARCH_UNVERIFIED']);a=p.parse_args()
    # Private output only: no automatic website export, no participant-level records.
    repo=Path(__file__).resolve().parents[2]; out=a.out.resolve()
    if out.is_relative_to(repo) and not out.is_relative_to(repo/'research'/'reports'/'private'):
        p.error('Use research/reports/private/ or an external private directory')
    if a.scope!='SYNTHETIC' and any('synthetic' in x.name.lower() for x in (a.input,a.plan)):
        p.error('Synthetic fixture/plan cannot be promoted')
    report=audit(read(a.input),json.loads(a.plan.read_text(encoding='utf-8')),a.scope)
    report['input_sha256']=hashlib.sha256(a.input.read_bytes()).hexdigest();report['plan_sha256']=hashlib.sha256(a.plan.read_bytes()).hexdigest()
    out.mkdir(parents=True,exist_ok=True);(out/'reliability.json').write_text(json.dumps(report,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    print(SCHEMA,report['status'],a.scope)

if __name__=='__main__': main()
