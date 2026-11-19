#!/usr/bin/env python3
"""CP25: prospective intervention data-quality gate and descriptive analysis (stdlib)."""
import argparse, csv, hashlib, json, math, pathlib, statistics
from collections import Counter, defaultdict

REQUIRED = ('participant_id','cycle_id','assigned_arm','assignment_method','assignment_timestamp','baseline_timestamp','baseline_score','policy_version','recommendation_id','human_approved','exposure_timestamp','outcome_timestamp','outcome_score','outcome_scale','outcome_verified','consent_status')
ARMS = {'static', 'adaptive'}
ISO_FMT = '%Y-%m-%dT%H:%M:%SZ'

def dt(s):
    from datetime import datetime, timezone
    if not s: return None
    try:
        result = datetime.strptime(s, ISO_FMT).replace(tzinfo=timezone.utc)
        return result
    except ValueError: return None

def fscore(s):
    if s == '': return None
    try: v = float(s)
    except (TypeError, ValueError): return None
    return v if math.isfinite(v) and 0 <= v <= 10 else None

def read_csv(path):
    with open(path, encoding='utf-8-sig', newline='') as f:
        reader=csv.DictReader(f)
        if not reader.fieldnames or len(reader.fieldnames) != len(set(reader.fieldnames)) or not set(REQUIRED).issubset(reader.fieldnames):
            raise ValueError('Missing required columns or duplicate headers: '+str(sorted(set(REQUIRED)-set(reader.fieldnames or []))))
        return list(reader)

def audit(rows):
    failures=[]; cautions=[]; used=set(); participants={}; valid=[]
    counts=Counter(); methods=Counter(); scale_by_arm=defaultdict(set)
    for ix,row in enumerate(rows,2):
        errors=[]; pid=row['participant_id'].strip(); cycle=row['cycle_id'].strip()
        arm=row['assigned_arm'].strip().lower(); method=row['assignment_method'].strip().lower(); methods[method]+=1
        if not pid or not cycle: errors.append('missing_identity')
        if (pid,cycle) in used: errors.append('duplicate_participant_cycle')
        used.add((pid,cycle))
        if pid in participants and participants[pid] != arm: errors.append('cross_arm_participant')
        participants.setdefault(pid,arm)
        if arm not in ARMS: errors.append('invalid_arm')
        if method not in ('randomized','observational'): errors.append('invalid_assignment_method')
        if row['consent_status'].strip().lower() != 'granted': errors.append('missing_consent')
        if row['human_approved'].strip().lower() != 'yes': errors.append('human_approval_missing')
        if row['outcome_verified'].strip().lower() != 'yes': errors.append('outcome_unverified')
        if not row['recommendation_id'].strip() or not row['policy_version'].strip(): errors.append('missing_policy_trace')
        b,a,e,o = [dt(row[k].strip()) for k in ('baseline_timestamp','assignment_timestamp','exposure_timestamp','outcome_timestamp')]
        if not all((b,a,e,o)): errors.append('invalid_or_missing_timestamp')
        elif not (b < a <= e < o): errors.append('time_order_violation')
        base,after=fscore(row['baseline_score'].strip()),fscore(row['outcome_score'].strip())
        if base is None or after is None: errors.append('invalid_or_missing_score')
        scale=row['outcome_scale'].strip()
        if not scale: errors.append('missing_outcome_scale')
        else: scale_by_arm[arm].add(scale)
        if errors:
            failures.append({'line':ix,'participant_id':pid,'errors':errors}); counts.update(errors)
        else: valid.append({'participant_id':pid,'arm':arm,'method':method,'baseline':base,'outcome':after,'delta':after-base,'scale':scale})
    if len(set(methods)) > 1: cautions.append('mixed_assignment_methods')
    scales=set().union(*scale_by_arm.values()) if scale_by_arm else set()
    if len(scales)>1: cautions.append('noncomparable_outcome_scales')
    if any(r['method']=='observational' for r in valid): cautions.append('observational_assignment_cannot_support_causal_claim')
    if any(r['method']=='randomized' for r in valid): cautions.append('randomization_record_not_independently_verified')
    if len({r['participant_id'] for r in valid}) != len(valid): cautions.append('repeated_participants_need_clustered_inference')
    groups={arm:[r for r in valid if r['arm']==arm] for arm in ('static','adaptive')}
    summary={}
    for arm,items in groups.items():
        summary[arm]={'n_records':len(items),'n_participants':len(set(x['participant_id'] for x in items)), 'baseline_mean': round(statistics.mean(x['baseline'] for x in items),6) if items else None, 'outcome_mean':round(statistics.mean(x['outcome'] for x in items),6) if items else None,'mean_change':round(statistics.mean(x['delta'] for x in items),6) if items else None}
    mean_diff=(summary['adaptive']['mean_change']-summary['static']['mean_change']) if all(summary[k]['mean_change'] is not None for k in groups) else None
    random_only=(set(methods)=={'randomized'})
    gate = ('PASS_DESCRIPTIVE_ONLY' if not failures and len(scales)==1 and all(groups.values()) else 'FAIL_INCOMPLETE_OR_INVALID')
    if gate == 'PASS_DESCRIPTIVE_ONLY' and random_only:
        cautions.append('assignment_record_only_no_allocation_concealment_or_attrition_audit')
    return {'status':gate,'evidence_level':'DESCRIPTIVE_NOT_CAUSAL','total_rows':len(rows),'valid_rows':len(valid),'failure_count':len(failures),'failure_codes':dict(counts),'failures':failures[:100], 'assignment_methods':dict(methods),'groups':summary,'mean_change_difference_adaptive_minus_static':round(mean_diff,6) if mean_diff is not None else None,'cautions':sorted(set(cautions)),'claim_gate':{'can_claim_feasibility': gate=='PASS_DESCRIPTIVE_ONLY','can_claim_adaptive_causal_effect':False,'reason':'Prospective registered and independently audited randomized trial with pre-specified analysis and verified outcome required'}}

def run(input_path,out):
    p=pathlib.Path(input_path); out=pathlib.Path(out); out.mkdir(parents=True,exist_ok=True)
    rows=read_csv(p); result=audit(rows); result['source_sha256']=hashlib.sha256(p.read_bytes()).hexdigest(); result['input_file']=p.name
    (out/'audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    g=result['groups']; lines=['# CLA CP25 — Adaptive intervention feasibility audit','','**Evidence class:** DESCRIPTIVE_NOT_CAUSAL','',f"**Gate:** {result['status']}",f"**Records:** {result['valid_rows']}/{result['total_rows']}",'', '| Metric | Static | Adaptive |','|---|---:|---:|']
    for name,key in [('Records','n_records'),('Participants','n_participants'),('Mean baseline','baseline_mean'),('Mean outcome','outcome_mean'),('Mean within-person change','mean_change')]: lines.append(f"| {name} | {g['static'][key]} | {g['adaptive'][key]} |")
    lines+=['',f"**Observed change difference (Adaptive − Static):** {result['mean_change_difference_adaptive_minus_static']}",'','This is a descriptive difference only; it is NOT a causal treatment effect or proof that CLA improves learning.','', '## Warnings']+[f"- {x}" for x in result['cautions']]+['','## Research prerequisites','- Pre-register hypothesis, primary outcome, analysis plan and duration before first participant.','- Confirm ethics/guardian consent, assignment integrity and independent measurement.','- Preserve all assigned participants and report missing outcomes / attrition (intention-to-treat).','- Prevent policy cross-over and intervention contamination.','- Include uncertainty intervals and sample-size justification before efficacy claims.','- Do not publish participant-level study logs to the public website.']
    (out/'report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('CP25:',result['status'],'valid',result['valid_rows'],'/',result['total_rows'],'evidence:',result['evidence_level'])
    return result

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--input',required=True);parser.add_argument('--out',required=True);args=parser.parse_args(); result=run(args.input,args.out)
    if result['status'].startswith('FAIL'): raise SystemExit(2)
if __name__=='__main__':main()
