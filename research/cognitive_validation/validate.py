#!/usr/bin/env python3
"""CP24: honest, dependency-free feasibility/sensitivity audit for CLA proxy indices.
No psychometric validity claims or clinical classification are emitted.
"""
import argparse, csv, hashlib, json, math, statistics
from pathlib import Path

VERSION = 'cla-indices-research-cp24-v1'
# All raw fields must be supported by study instruments; no implicit 0 for missing.
SPECS = {
 'SCI': [('plan_completion_rate', 1), ('action_consistency', 1), ('goal_action_alignment', 1)],
 'MAS': [('motivation_self_report', 1), ('task_persistence_rate', 1), ('task_abandonment_rate', -1)],
 'CSL': [('behavior_consistency', 1), ('goal_switch_rate', -1), ('context_switch_rate', -1)],
}
FIELDS = sorted({n for items in SPECS.values() for n, _ in items})
REQUIRED = ['participant_id', 'window', 'event_count'] + FIELDS

def num(x, lo=0, hi=100):
 try:
  if x is None or str(x).strip() == '': return None
  n = float(x)
  return n if math.isfinite(n) and lo <= n <= hi else None
 except (TypeError, ValueError): return None

def rank(seq):
 order = sorted(range(len(seq)), key=lambda i: seq[i]); out=[0.0]*len(seq)
 for p in range(len(seq)):
  if p and seq[order[p]] == seq[order[p-1]]: continue
  q = p
  while q+1 < len(seq) and seq[order[q+1]] == seq[order[p]]: q+=1
  r = (p+q+2)/2
  for k in range(p,q+1): out[order[k]]=r
 return out

def spearman(a,b):
 if len(a)<3: return None
 x,y=rank(a),rank(b); mx,my=statistics.mean(x),statistics.mean(y)
 cov=sum((i-mx)*(j-my) for i,j in zip(x,y)); xx=sum((i-mx)**2 for i in x); yy=sum((j-my)**2 for j in y)
 return round(cov/math.sqrt(xx*yy),6) if xx and yy else None

def read_data(path):
 with path.open(newline='', encoding='utf-8-sig') as f:
  reader=csv.DictReader(f)
  if not reader.fieldnames or not set(REQUIRED).issubset(reader.fieldnames):
   raise ValueError('Missing required columns: '+', '.join(sorted(set(REQUIRED)-set(reader.fieldnames or []))))
  rows=list(reader)
 if len({(r['participant_id'],r['window']) for r in rows})!=len(rows): raise ValueError('Duplicate participant_id + window')
 if any(not r['participant_id'].strip() or not r['window'].strip() for r in rows): raise ValueError('Missing participant_id or window')
 return rows

def evaluate(rows, min_events=7, required_fraction=.70):
 index_rows=[]; status_counts={k:{'AVAILABLE':0,'INSUFFICIENT_DATA':0} for k in SPECS}
 out_of_range={k:0 for k in FIELDS}
 for r in rows:
  vals={f:num(r.get(f)) for f in FIELDS}
  for f in FIELDS:
   if r.get(f,'').strip() and vals[f] is None:out_of_range[f]+=1
  events=num(r.get('event_count'),0,1e12)
  if events is None: raise ValueError('Invalid event_count')
  result={'participant_id':r['participant_id'],'window':r['window'],'event_count':int(events)}
  for code,items in SPECS.items():
   observed=[(field,sign,vals[field]) for field,sign in items if vals[field] is not None]
   coverage=len(observed)/len(items)
   eligible=coverage >= required_fraction and events >= min_events
   status='AVAILABLE' if eligible else 'INSUFFICIENT_DATA'; status_counts[code][status]+=1
   result[f'{code}_status']=status; result[f'{code}_coverage']=round(coverage,4)
   # 0--100 descriptive composite; versioned equal weights, not validated or calibrated.
   result[f'{code}_score']=round(sum(v if sign==1 else 100-v for _,sign,v in observed)/len(observed),4) if eligible else None
  index_rows.append(result)
 sensitivity={}
 for code,items in SPECS.items():
  valid=[]; alternatives={f'{f}:{change:+.0%}':[] for f,_ in items for change in (-.2,.2)}
  loo={f:[] for f,_ in items}
  for raw, scored in zip(rows,index_rows):
   if scored[f'{code}_status']!='AVAILABLE':continue
   # Sensitivity requires complete raw data; never silently impute missing fields.
   values=[num(raw[f]) for f,_ in items]
   if any(v is None for v in values):continue
   oriented=[v if sign==1 else 100-v for v,(_,sign) in zip(values,items)]
   valid.append(sum(oriented)/len(oriented))
   for i,(f,_) in enumerate(items):
    for change in (-.2,.2):
     weights=[1.0]*len(items);weights[i]=1+change
     alternatives[f'{f}:{change:+.0%}'].append(sum(a*w for a,w in zip(oriented,weights))/sum(weights))
    loo[f].append(sum(v for j,v in enumerate(oriented) if j!=i)/(len(oriented)-1))
  sensitivity[code]={
   'complete_case_rows':len(valid),
   'weight_perturbation_spearman':{k:spearman(valid,v) for k,v in alternatives.items()},
   'leave_one_out_spearman':{k:spearman(valid,v) for k,v in loo.items()},
   'note':'Not test-retest reliability or psychometric validation; complete cases only',
  }
 repeated={}
 for code in SPECS:
  by_person={}
  for r in index_rows:
   if r[f'{code}_score'] is not None: by_person.setdefault(r['participant_id'],[]).append((r['window'],r[f'{code}_score']))
  pairs=[sorted(v,key=lambda x:x[0])[:2] for v in by_person.values() if len(v)>=2]
  repeated[code]={'paired_participants':len(pairs), 'exploratory_rank_association':spearman([p[0][1] for p in pairs],[p[1][1] for p in pairs]), 'warning':'Window ordering is lexicographic: use ISO dates or sortable window IDs; this is not test-retest reliability'}
 return {'status':'EXPERIMENTAL_PROXY_NOT_VALIDATED', 'mapping_version':VERSION,'rows':len(rows), 'unique_participants':len({r['participant_id'] for r in rows}), 'minimum_events':min_events,'required_fraction':required_fraction,'index_status_counts':status_counts,'invalid_numeric_cells':out_of_range,'sensitivity':sensitivity,'repeated_window_exploration':repeated,'unmet_validity_gates':['content validity and construct definitions','reference sample and score calibration','reliability with confidence intervals','convergent/discriminant validity','external validation in Vietnamese THPT','ethics and participant consent']},index_rows

def main():
 p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--out',required=True);p.add_argument('--min-events',type=int,default=7);a=p.parse_args()
 if a.min_events<1: p.error('--min-events must be >= 1')
 source=Path(a.input); report,rows=evaluate(read_data(source),a.min_events)
 report['input_sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
 out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
 (out/'audit.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 with (out/'indices_experimental.csv').open('w',newline='',encoding='utf-8') as f:
  cols=['participant_id','window','event_count']+[f'{code}_{suffix}' for code in SPECS for suffix in ('status','coverage','score')]
  writer=csv.DictWriter(f,fieldnames=cols);writer.writeheader();writer.writerows(rows)
 (out/'report.md').write_text('# CP24 — SCI/MAS/CSL Research Feasibility\n\n'
  '**Status: EXPERIMENTAL PROXY — NOT VALIDATED.**\n\n'
  f'Input SHA-256: `{report["input_sha256"]}`. Rows: {report["rows"]}; participants: {report["unique_participants"]}.\n\n'
  'Raw indicators are predeclared research fields; no missing-value substitution or unverified psychometric claims.\n\n'
  'Inspect `audit.json` for coverage, sensitivity and repeated-window diagnostics. Scores must not drive automated high-stakes decisions.\n',encoding='utf-8')
 print('CP24:', report['status'],report['rows'],'rows;',report['unique_participants'],'participants; output:',out)

if __name__=='__main__': main()
