#!/usr/bin/env node
/**
 * CLA layout repair; dry-run unless --apply. Never overwrites differing files.
 * Archives a conflicting legacy copy instead of discarding data.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const apply = process.argv.includes('--apply');
const unknownFlags = process.argv.slice(2).filter(x => x !== '--apply');
if (unknownFlags.length) { console.error('Usage: node tools/fix-cla-layout.cjs [--apply]'); process.exit(2); }
const mappings = [
  ['src/audit_dataset.py','research/src/audit_dataset.py'],
  ['src/baseline_next_term.py','research/src/baseline_next_term.py'],
  ['benchmarks/cla_llm_120_cases_DRAFT.jsonl','research/benchmarks/cla_llm_120_cases_DRAFT.jsonl'],
  ['registry/model_register.csv','research/registry/model_register.csv'],
  ['registry/source_register.csv','research/registry/source_register.csv'],
  ['data/synthetic_demo/scope_gate_smoke.csv','research/data/synthetic_demo/scope_gate_smoke.csv'],
  ['evidence/RESEARCH_SCOPE_DAY1.md','research/protocol/RESEARCH_SCOPE_DAY1.md'],
  ['data/evidence/RESEARCH_SCOPE_DAY1.md','research/protocol/RESEARCH_SCOPE_DAY1.md'],
  ['protocol/RESEARCH_SCOPE_DAY1.md','research/protocol/RESEARCH_SCOPE_DAY1.md'],
  ['protocol/data/evidence/RESEARCH_SCOPE_DAY1.md','research/protocol/RESEARCH_SCOPE_DAY1.md'],
  ['evidence/CLAIM_EVIDENCE_DAY1.md','research/evidence/CLAIM_EVIDENCE_DAY1.md'],
  ['data/evidence/CLAIM_EVIDENCE_DAY1.md','research/evidence/CLAIM_EVIDENCE_DAY1.md'],
  ['protocol/data/evidence/CLAIM_EVIDENCE_DAY1.md','research/evidence/CLAIM_EVIDENCE_DAY1.md'],
  ['evidence/firebase.emulator.cp21.json','firebase.emulator.cp21.json'],
  ['data/evidence/firebase.emulator.cp21.json','firebase.emulator.cp21.json'],
  ['protocol/data/evidence/firebase.emulator.cp21.json','firebase.emulator.cp21.json'],
  ['evidence/RUN_RULES_CHECKPOINT21.ps1','RUN_RULES_CHECKPOINT21.ps1'],
  ['data/evidence/RUN_RULES_CHECKPOINT21.ps1','RUN_RULES_CHECKPOINT21.ps1'],
  ['protocol/data/evidence/RUN_RULES_CHECKPOINT21.ps1','RUN_RULES_CHECKPOINT21.ps1'],
  ['CP22_APPLY_AND_TEST.md','docs/CP22_APPLY_AND_TEST.md'],
  ['CP22_PROGRESS_20261105.md','docs/CP22_PROGRESS_20261105.md'],
  ['COGNITIVE LEARN AI.docx','docs/specifications/COGNITIVE LEARN AI.docx'],
  ['COGNITIVE_LEARN_FINAL_SUPPLEMENT_SPEC.docx','docs/specifications/COGNITIVE_LEARN_FINAL_SUPPLEMENT_SPEC.docx'],
  ['COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL.docx','docs/specifications/COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL.docx'],
  ['lộ trình (1) (1).docx','docs/specifications/lộ trình (1) (1).docx'],
  ['firestore.rules.CANDIDATE','docs/archive/firestore.rules.CANDIDATE'],
  ['firebase.emulator.checkpoint.json','docs/archive/firebase.emulator.checkpoint.json'],
  ['docs/CLA6_STRUCTURE_AUDIT.json','docs/archive/CLA6_STRUCTURE_AUDIT.json'],
];
const digest = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const isFile = p => fs.existsSync(p) && fs.statSync(p).isFile();
function safeMove(src,dst) {
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  try { fs.renameSync(src,dst); }
  catch(e) {
    if(e.code !== 'EXDEV') throw e;
    fs.copyFileSync(src,dst,fs.constants.COPYFILE_EXCL);
    if (digest(src) !== digest(dst)) throw new Error('SHA256 mismatch after copy: '+src);
    fs.unlinkSync(src);
  }
}
const counts={move:0,dedupe:0,archive:0,skipped:0};
console.log('CLA layout '+(apply?'APPLY':'DRY RUN')+': '+root);
for (const [oldRel,newRel] of mappings) {
  const old=path.join(root,oldRel), target=path.join(root,newRel);
  if(!isFile(old)) continue;
  let action,dest=target;
  if(isFile(target)) {
    if(digest(old)===digest(target)) action='dedupe';
    else {
      action='archive';
      dest=path.join(root,'docs/archive/legacy-layout',oldRel);
      if(fs.existsSync(dest)) {
        if(isFile(dest) && digest(old)===digest(dest)) action='dedupe';
        else { console.error('CONFLICT: archived file differs: '+oldRel); counts.skipped++;continue; }
      }
    }
  } else if(fs.existsSync(target)) { console.error('CONFLICT: destination is not a file: '+newRel);counts.skipped++;continue; }
  else action='move';
  console.log((apply?'DO ':'PLAN ')+action.toUpperCase()+': '+oldRel+' -> '+(action==='dedupe'?'(matching SHA-256)':path.relative(root,dest)));
  if(apply) {
    if(action==='dedupe') fs.unlinkSync(old);
    else safeMove(old,dest);
  }
  counts[action]++;
}
if(apply) {
  for (const rel of ['protocol/data/evidence','protocol/data','protocol','data/evidence','data/synthetic_demo','data','evidence','benchmarks','registry']) {
    const dir=path.join(root,rel);
    if(fs.existsSync(dir) && fs.statSync(dir).isDirectory() && fs.readdirSync(dir).length===0) fs.rmdirSync(dir);
  }
}
console.log('Summary:',JSON.stringify(counts));
if(!apply) console.log('No files changed. Run with --apply to execute.');
if(counts.skipped) process.exitCode=2;
