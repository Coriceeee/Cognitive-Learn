#!/usr/bin/env python3
"""CP23: Export aggregate-only OULAD research evidence after a fresh CP22 audit.

No student-level rows or personal predictions are included. Python stdlib only.
"""
import argparse
import json
import math
import os
from pathlib import Path
from scientific_audit import audit


def finite_metric(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('Missing or nonfinite research metric')
    return round(float(value), 6)


def payload_from_audit(result, manifest):
    if result.get('audit_status') != 'PASS' or result.get('errors'):
        raise ValueError('Independent audit has not passed; export blocked')
    if manifest.get('target_is_post_cutoff') is not True:
        raise ValueError('Prediction target is not certified post cutoff')
    p = result['performance']
    ci = p['participant_bootstrap_ci95']
    if not isinstance(ci, list) or len(ci) != 2:
        raise ValueError('Missing participant bootstrap confidence interval')
    academic, behavior = p['academic_test'], p['behavior_test']
    metrics = ('roc_auc', 'brier', 'log_loss', 'accuracy_at_0.5')
    models = {
        'academic_only': {m: finite_metric(academic[m]) for m in metrics},
        'academic_plus_behavior': {m: finite_metric(behavior[m]) for m in metrics},
    }
    delta = finite_metric(p['brier_delta_academic_minus_behavior'])
    lower, upper = [finite_metric(c) for c in ci]
    if lower > upper:
        raise ValueError('Invalid confidence interval')
    for model in models.values():
        if any(not (0 <= model[k] <= 1) for k in ('roc_auc', 'brier', 'accuracy_at_0.5')) or model['log_loss'] < 0:
            raise ValueError('Out-of-range model metric')
    if not (0 < result['data']['split_counts'].get('test', 0)):
        raise ValueError('Missing test cohort')
    return {
        'schema_version': 'cla.oulad.public-evidence.v1',
        'dataset': 'Open University Learning Analytics Dataset (OULAD)',
        'source': 'https://archive.ics.uci.edu/dataset/349/open+university+learning+analytics+dataset',
        'doi': '10.24432/C5KK69',
        'license': 'CC BY 4.0',
        'cohort': 'UK online university courses; not Vietnamese high-school students',
        'outcome': 'Pass or Distinction vs Fail or Withdrawn (end of course)',
        'cutoff_day': int(manifest['cutoff_day']),
        'audit_status': 'PASS',
        'audit_timestamp_utc': result['audit_timestamp_utc'],
        'test_count': int(result['data']['split_counts']['test']),
        'split_counts': {k: int(result['data']['split_counts'][k]) for k in ('train', 'val', 'test')},
        'models': models,
        'comparison': {'brier_improvement': delta, 'learner_cluster_bootstrap_ci95': [lower, upper]},
        'provenance': {
            'archive_sha256': result['data']['archive_sha256_recorded'],
            'features_sha256': result['data']['feature_sha256'],
            'method': 'Day-30 holdout; participant-level split; independent CP22 file audit',
        },
        'limitations': [
            'Research-level aggregate benchmark only; not an individual student prediction.',
            'OULAD university data does not validate grade forecasts for Vietnamese high-school students.',
            'Predictive associations do not establish causal effects of CLA interventions.',
            'SCI/MAS/CSL validity and Static vs Adaptive effectiveness are not established.',
            'The audit checks data consistency and reported metrics; it is not an independent model refit.',
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--features', default='research/oulad/work/features.csv')
    parser.add_argument('--manifest', default='research/oulad/work/dataset_manifest.json')
    parser.add_argument('--metrics', default='research/oulad/work/results/metrics.json')
    parser.add_argument('--archive', default='research/oulad/data/OULAD.zip')
    parser.add_argument('--out', default='public/research/oulad-evidence.json')
    args = parser.parse_args()
    source = Path(args.archive)
    if not source.is_file():
        parser.error('Original OULAD archive required to verify provenance')
    result = audit(args.features, args.manifest, args.metrics, args.archive)
    if result['audit_status'] != 'PASS':
        parser.error('CP22 integrity check failed: ' + '; '.join(result['errors']))
    manifest = json.loads(Path(args.manifest).read_text(encoding='utf-8'))
    summary = payload_from_audit(result, manifest)
    destination = Path(args.out)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp = destination.with_suffix('.tmp')
    temp.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    os.replace(temp, destination)
    print('Exported aggregate-only verified OULAD summary:', destination)
    print('Test count:', summary['test_count'], 'Brier delta:', summary['comparison']['brier_improvement'])


if __name__ == '__main__':
    main()
