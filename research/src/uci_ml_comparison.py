"""CP33: fixed external benchmark. No deployment or individual prediction.
The public export is opt-in and recomputed from pinned, hash-checked local files.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'huggingface' / 'uci_student_performance'))
from fetch_eval import FILES, LICENSE, REPO, REVISION, CITATION, validated_rows, atomic

VERSION = 'cla.uci.ml-comparison.v1'
SEED = 20261118
ALPHA = .10
ACADEMIC = ['G1', 'G2', 'failures']
BEHAVIOR = ['studytime', 'activities']
FEATURES = ACADEMIC + BEHAVIOR
MODEL_NAMES = ['last_G2', 'ridge_academic', 'ridge_plus_behavior', 'forest_academic', 'forest_plus_behavior']
LIMITATIONS = [
    'External retrospective benchmark: two Portuguese secondary schools, not Vietnamese THPT or CLA students.',
    'No participant identifier or exact feature timestamps; signature grouping prevents identical predictor-vector overlap, not participant leakage.',
    'G1/G2 are prior grades; context variables lack timestamps. No prospective or causal claim.',
    'Intervals use separate calibration rows and assume exchangeability; coverage is empirical, not a guarantee for new domains.',
    'Does not validate SCI/MAS/CSL, intervention efficacy or admission probability. No trained model is promoted to production.',
]


def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def prepare(frame: pd.DataFrame) -> pd.DataFrame:
    if not set(FEATURES + ['G3']).issubset(frame.columns):
        raise ValueError('Missing required features or outcome')
    f = frame[FEATURES + ['G3']].copy()
    for name, lo, hi in [('G1', 0, 20), ('G2', 0, 20), ('G3', 0, 20), ('failures', 0, 4), ('studytime', 1, 4)]:
        f[name] = pd.to_numeric(f[name], errors='coerce')
        if not (f[name].notna() & f[name].between(lo, hi) & (f[name] % 1 == 0)).all():
            raise ValueError(f'Invalid {name}; do not fill missing values with zero')
    if not f.activities.isin(['yes', 'no']).all():
        raise ValueError('Invalid activities')
    f['activities'] = f.activities.map({'yes': 1, 'no': 0})
    return f


def split(frame: pd.DataFrame):
    # Conservative grouping by permitted predictor vector only (never target).
    groups = pd.util.hash_pandas_object(frame[FEATURES], index=False).to_numpy()
    ids = np.arange(len(frame))
    train_cal, test = next(GroupShuffleSplit(n_splits=1, test_size=.2, random_state=SEED).split(ids, groups=groups))
    train_rel, cal_rel = next(GroupShuffleSplit(n_splits=1, test_size=.25, random_state=SEED+1).split(train_cal, groups=groups[train_cal]))
    train, cal = train_cal[train_rel], train_cal[cal_rel]
    if min(len(train), len(cal), len(test)) < 20 or len(train) < 50:
        raise ValueError('Too few split rows for this technical benchmark')
    group_sets = [set(groups[i]) for i in (train, cal, test)]
    if any(group_sets[i] & group_sets[j] for i in range(3) for j in range(i)):
        raise ValueError('Predictor signature overlap')
    return train, cal, test, groups


def interval_radius(errors):
    e = np.sort(np.asarray(errors, dtype=float))
    if len(e) < 20 or not np.isfinite(e).all() or (e < 0).any():
        raise ValueError('Invalid calibration residuals')
    rank = math.ceil((len(e)+1)*(1-ALPHA))
    if rank > len(e):
        raise ValueError('Not enough calibration observations')
    return float(e[rank-1])


def summarize(y, pred, radius):
    err = np.abs(y-pred)
    lo = np.clip(pred-radius, 0, 20)
    hi = np.clip(pred+radius, 0, 20)
    return { 'mae': float(err.mean()), 'rmse': float(np.sqrt(np.mean(err**2))),
             'coverage': float(np.mean((lo <= y) & (y <= hi))),
             'mean_interval_width': float(np.mean(hi-lo)), 'calibration_radius': radius }


def paired_delta(y, base, candidate, groups):
    d = np.abs(y-base)-np.abs(y-candidate)
    unique = np.unique(groups)
    buckets = [d[groups == g] for g in unique]
    rng = np.random.default_rng(SEED+2)
    sims = [np.concatenate([buckets[i] for i in rng.integers(0,len(buckets),len(buckets))]).mean() for _ in range(1000)]
    return {'mae_reduction': float(d.mean()), 'ci95_signature_bootstrap': [float(x) for x in np.quantile(sims,[.025,.975])]}


def evaluate(frame):
    """Pure computation, usable for unit tests. Not a source-verified claim."""
    f = prepare(frame)
    tr, ca, te, groups = split(f)
    y = f.G3.to_numpy(dtype=float)
    predictions = {}; metrics = {}
    def add(name, cal, test):
        cal, test = np.clip(cal,0,20), np.clip(test,0,20)
        predictions[name] = test
        metrics[name] = summarize(y[te], test, interval_radius(np.abs(y[ca]-cal)))
    add('last_G2', f.G2.iloc[ca].to_numpy(), f.G2.iloc[te].to_numpy())
    for name, cols in [('academic', ACADEMIC), ('plus_behavior', FEATURES)]:
        for family, model in [('ridge', make_pipeline(StandardScaler(), Ridge(alpha=1.0))), ('forest', RandomForestRegressor(n_estimators=200, min_samples_leaf=5, random_state=SEED, n_jobs=1))]:
            model.fit(f.iloc[tr][cols], y[tr])
            add(f'{family}_{name}', model.predict(f.iloc[ca][cols]), model.predict(f.iloc[te][cols]))
    comparisons = {family: paired_delta(y[te], predictions[f'{family}_academic'], predictions[f'{family}_plus_behavior'], groups[te]) for family in ['ridge','forest']}
    return {'counts': dict(zip(['train','calibration','test'], map(len, [tr,ca,te]))),
            'split_sha256': hash_bytes(json.dumps([tr.tolist(),ca.tolist(),te.tolist()],separators=(',',':')).encode()),
            'metrics': metrics, 'behavior_increment': comparisons}


def reviewed_report(raw_dir: Path):
    manifest = json.loads((raw_dir/'manifest.json').read_text(encoding='utf8'))
    if any(manifest.get(k) != v for k,v in [('repo',REPO),('revision',REVISION),('license',LICENSE),('scope','EXTERNAL_METHOD_FEASIBILITY_ONLY')]):
        raise ValueError('Pinned source manifest does not match reviewed HF source')
    entries = manifest.get('files', [])
    if len(entries) != len(FILES) or {e['file'] for e in entries} != set(FILES):
        raise ValueError('Both source files required exactly once')
    subjects = []
    for filename, (subject,count) in FILES.items():
        entry = next(e for e in entries if e['file'] == filename)
        raw = (raw_dir/filename).read_bytes()
        sha = hash_bytes(raw)
        if entry.get('sha256') != sha or entry.get('rows') != count or entry.get('subject') != subject or entry.get('url') != f'https://huggingface.co/datasets/{REPO}/resolve/{REVISION}/{filename}':
            raise ValueError('Source file metadata or digest mismatch')
        validated_rows(raw,count)
        summary = evaluate(pd.read_csv(raw_dir/filename,sep=';'))
        subjects.append({'subject':subject, 'rows':count, 'source_sha256':sha, **summary})
    return {'schema_version':VERSION,'status':'EXTERNAL_METHOD_FEASIBILITY_ONLY','dataset':REPO,'revision':REVISION,'license':LICENSE,'citation':CITATION,
            'seed':SEED,'nominal_coverage':1-ALPHA,'academic_features':ACADEMIC,'behavior_features':BEHAVIOR,
            'model_policy':'fixed hyperparameters; no holdout tuning or model selection',
            'code_sha256':hash_bytes(Path(__file__).read_bytes()),'environment':{'python':sys.version.split()[0],'numpy':np.__version__,'pandas':pd.__version__,'sklearn':sklearn.__version__},
            'subjects':subjects,'limitations':LIMITATIONS}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--acknowledge-source-rights',action='store_true')
    p.add_argument('--publish-reviewed',action='store_true',help='Explicit human approval to export aggregate only')
    args=p.parse_args()
    try:
        if not args.acknowledge_source_rights: raise ValueError('Source rights acknowledgement required')
        raw_dir=ROOT/'data'/'raw_private'/'uci_hf'
        report=reviewed_report(raw_dir)
        payload=(json.dumps(report,indent=2,allow_nan=False)+'\n').encode()
        atomic(raw_dir/'ml_comparison_aggregate.json',payload)
        if args.publish_reviewed:
            atomic(ROOT.parent/'public'/'research'/'uci-ml-evidence.json',payload)
        print('EXTERNAL_METHOD_FEASIBILITY_ONLY: 2 source files; no production model')
    except Exception as exc:
        print('CP33_ML_BLOCKED:',type(exc).__name__,str(exc),file=sys.stderr)
        return 2
    return 0

if __name__=='__main__':
    raise SystemExit(main())
