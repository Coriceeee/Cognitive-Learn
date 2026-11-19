"""V4 CP39 offline next-term GPA benchmark. No personal predictions or model export.
One pseudonymous participant per row; chronological, participant-disjoint cohorts.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import math
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor
import xgboost

VERSION = 'cla.longitudinal.adaptive-ml.v1'
SEED = 20261118
ACADEMIC = ['gpa_t0']
BEHAVIOR = ['study_hours_week', 'completion_rate']
FEATURES = ACADEMIC + BEHAVIOR
COLUMNS = ['participant_id', 'data_scope', 'research_allowed', 't0_time', 'feature_available_at', 't1_time', *FEATURES, 'gpa_t1']
MIN_COUNTS = (60, 30, 30)  # engineering gate; NOT a power calculation
HORIZON = (60, 180)
LIMITS = ['One row per pseudonym; source owner must establish identity resolution, permissions, timestamp and instrument equivalence independently.',
          'Fixed model settings; no tuning or selection on final holdout. Later cohorts may differ in ways these features cannot detect.',
          'Split conformal 90% interval uses calibration cohort; temporal shift can invalidate coverage assumptions.',
          'Descriptive feature drift and empirical range exceedance do not establish model safety or external validity.',
          'Predictive benchmark only. No causal effect, individualized admission probability, validated cognitive score or production policy.']


def sha(data):
    return hashlib.sha256(data).hexdigest()


def utc(s):
    if not isinstance(s, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', s):
        raise ValueError('UTC timestamp required (seconds, Z)')
    return datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)


def numeric(v, lo, hi):
    x = float(v)
    if not math.isfinite(x) or not lo <= x <= hi:
        raise ValueError('Missing or out-of-range numeric feature/outcome')
    return x


def load(raw, manifest):
    if not isinstance(manifest, dict) or manifest.get('schema') != VERSION or manifest.get('source_sha256') != sha(raw):
        raise ValueError('Manifest schema or source digest mismatch')
    if manifest.get('approved_use') != 'RESEARCH_ONLY' or manifest.get('data_scope') != 'APPROVED_OBSERVATIONAL_ONLY':
        raise ValueError('Approved observational research source required')
    for k in ('dataset_version', 'permission_ref', 'instrument_ref', 'protocol_ref'):
        if not isinstance(manifest.get(k), str) or not manifest[k].strip() or manifest[k].strip().upper() in ('TBD','VERIFY','PENDING','UNKNOWN'):
            raise ValueError('Missing independent approval/version reference')
    if manifest.get('feature_contract') != 'T0_GPA_AND_PRE_T0_7D_SELF_REPORT_V1' or manifest.get('outcome_contract') != 'NEXT_TERM_GPA_0_10_SAME_INSTRUMENT_V1':
        raise ValueError('Feature and outcome contracts must be reviewed')
    cuts = [utc(manifest.get(k)) for k in ('calibration_start', 'test_start', 'observation_end')]
    if not cuts[0] < cuts[1] < cuts[2]:
        raise ValueError('Invalid temporal cutoffs')
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    if reader.fieldnames != COLUMNS:
        raise ValueError('CSV header must match approved minimal schema exactly')
    groups = [[], [], []]; seen = set(); excluded = 0
    for row in reader:
        if None in row or any(v is None for v in row.values()):
            raise ValueError('Malformed CSV row')
        pid = row['participant_id']
        if not re.fullmatch(r'[A-Za-z0-9_-]{8,80}', pid) or pid in seen:
            raise ValueError('Invalid or duplicate pseudonym; one row per participant required')
        seen.add(pid)
        if row['data_scope'] != 'research' or row['research_allowed'] != 'true':
            raise ValueError('Unapproved/non-research row in source; quarantine before import')
        t0, available, t1 = (utc(row[k]) for k in ('t0_time','feature_available_at','t1_time'))
        if not available <= t0 < t1 or not HORIZON[0] <= (t1-t0).total_seconds()/86400 <= HORIZON[1]:
            raise ValueError('Future features or invalid next-term horizon')
        values = [numeric(row[k], lo, hi) for k,lo,hi in [('gpa_t0',0,10),('study_hours_week',0,168),('completion_rate',0,1),('gpa_t1',0,10)]]
        i = 0 if t0 < cuts[0] else 1 if t0 < cuts[1] else 2
        # The outcome must be available before the next cohort prediction window starts.
        if t1 >= cuts[i]:
            excluded += 1
            continue
        groups[i].append((pid, values))
    counts = [len(g) for g in groups]
    if any(n < m for n,m in zip(counts, MIN_COUNTS)):
        raise ValueError('Insufficient disjoint temporal cohorts; counts below engineering minima')
    return [np.array([v for _,v in sorted(g)], dtype=float) for g in groups], counts, excluded


def radius(errors):
    s = np.sort(np.asarray(errors, dtype=float))
    rank = math.ceil((len(s)+1)*.9)
    if len(s) < MIN_COUNTS[1] or rank > len(s) or not np.isfinite(s).all():
        raise ValueError('Insufficient calibration residuals')
    return float(s[rank-1])


def metrics(y, pred, r):
    err = np.abs(y-pred)
    lower = np.maximum(0, pred-r); upper = np.minimum(10, pred+r)
    return {'mae':float(err.mean()),'rmse':float(np.sqrt(np.mean(err**2))), 'coverage90':float(np.mean((lower<=y)&(y<=upper))), 'mean_interval_width':float(np.mean(upper-lower)), 'calibration_radius':r}


def drift(tr, test):
    # Training-derived bins only; total variation in feature histograms is descriptive.
    result = {}
    for i,k in enumerate(FEATURES):
        a,b = tr[:,i],test[:,i]
        edges = np.unique(np.quantile(a,[0,.25,.5,.75,1]))
        bins = np.unique(np.r_[-np.inf, edges, np.nextafter(a.max(), np.inf), np.inf])
        pa = np.histogram(a,bins)[0]/len(a); pb = np.histogram(b,bins)[0]/len(b)
        result[k] = {'histogram_total_variation':float(.5*np.abs(pa-pb).sum()), 'out_of_training_range_fraction':float(np.mean((b<a.min())|(b>a.max())))}
    return result


def compare(y, a, b):
    delta = np.abs(y-a)-np.abs(y-b)
    rng = np.random.default_rng(SEED)
    rep = np.array([delta[rng.integers(0,len(delta),size=len(delta))].mean() for _ in range(1000)])
    return {'mae_reduction':float(delta.mean()),'ci95_participant_bootstrap':[float(x) for x in np.quantile(rep,[.025,.975])]}


def evaluate(groups):
    tr,ca,te = groups; ys = te[:,-1]
    predictions = {}; report = {}
    def register(name, cp, tp):
        cp,tp = np.clip(cp,0,10),np.clip(tp,0,10)
        predictions[name] = (cp,tp)
        report[name] = metrics(ys,tp,radius(np.abs(ca[:,-1]-cp)))
    register('last_gpa', ca[:,0], te[:,0])
    for suffix, cols in [('academic',[0]),('plus_behavior',[0,1,2])]:
        models = {'ridge':make_pipeline(StandardScaler(),Ridge(alpha=1.0)),
                  'forest':RandomForestRegressor(n_estimators=120,min_samples_leaf=5,random_state=SEED,n_jobs=1),
                  'xgb':XGBRegressor(n_estimators=100,max_depth=3,learning_rate=.05,subsample=.85,colsample_bytree=1,random_state=SEED,n_jobs=1,objective='reg:squarederror')}
        for family, model in models.items():
            model.fit(tr[:,cols],tr[:,-1])
            register(f'{family}_{suffix}',model.predict(ca[:,cols]),model.predict(te[:,cols]))
        members = [predictions[f'{m}_{suffix}'] for m in models]
        register(f'ensemble_{suffix}',np.mean([m[0] for m in members],axis=0),np.mean([m[1] for m in members],axis=0))
    ablation = {m:compare(ys,predictions[f'{m}_academic'][1],predictions[f'{m}_plus_behavior'][1]) for m in ('ridge','forest','xgb','ensemble')}
    against_baseline = {m:compare(ys,predictions['last_gpa'][1],p[1]) for m,p in predictions.items() if m!='last_gpa'}
    return {'metrics': report,'behavior_increment':ablation,'against_last_gpa':against_baseline,'drift':drift(tr,te)}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--acknowledge-reviewed-source',action='store_true')
    args = p.parse_args()
    root = Path(__file__).resolve().parents[1]/'data'/'raw_private'/'longitudinal_v4'
    try:
        if not args.acknowledge_reviewed_source:
            raise ValueError('Manual permission/source review required')
        raw = (root/'cohort.csv').read_bytes(); manifest_bytes = (root/'manifest.json').read_bytes(); manifest=json.loads(manifest_bytes)
        if manifest.get('dataset_version') == 'UNIT_TEST_ONLY':
            raise ValueError('Unit-test fixture is never report evidence')
        groups,counts,excluded = load(raw,manifest)
        out = {'schema':VERSION,'status':'RESEARCH_AGGREGATE_REQUIRES_INDEPENDENT_REVIEW','source_sha256':sha(raw),'manifest_sha256':sha(manifest_bytes),'code_sha256':sha(Path(__file__).read_bytes()),'dataset_version':manifest['dataset_version'],'counts':dict(zip(('train','calibration','test'),counts)),'excluded_cutoff_crossings':excluded,'seed':SEED,'environment':{'python':sys.version.split()[0],'numpy':np.__version__,'sklearn':sklearn.__version__,'xgboost':xgboost.__version__},**evaluate(groups),'limitations':LIMITS}
        dest=root/f'aggregate_review_required_{sha(manifest_bytes)[:16]}_{out["code_sha256"][:16]}.json'; tmp=dest.with_suffix('.tmp'); tmp.write_text(json.dumps(out,indent=2,allow_nan=False)+'\n',encoding='utf8'); tmp.replace(dest)
        print('RESEARCH_AGGREGATE_REQUIRES_INDEPENDENT_REVIEW — no model deployed')
    except (OSError, ValueError, KeyError, TypeError):
        # Never print row values, pseudonyms or private input paths.
        print('CP39_BLOCKED: missing/unapproved/invalid source or insufficient temporal cohorts; review the private inputs.',file=sys.stderr)
        return 2
    return 0

if __name__=='__main__':
    raise SystemExit(main())
