const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const exists=rel=>fs.existsSync(path.join(root,rel));
const mandatory=[
 'src/App.tsx','src/page/nexus/AdminPage.tsx','src/page/nexus/AdminDiagnosticsPage.tsx',
 'api/health.ts','api/gemini-lumen.ts','api/gemini-admission-reader.ts',
 'research/registry/model_register.csv','research/registry/source_register.csv',
 'research/protocol/RESEARCH_SCOPE_DAY1.md',
 'research/data/synthetic_demo/scope_gate_smoke.csv',
 'research/evidence/CLAIM_EVIDENCE_DAY1.md',
 'research/src/audit_dataset.py','research/src/baseline_next_term.py',
 'research/benchmarks/cla_llm_120_cases_DRAFT.jsonl',
 'tests/academic.test.cjs','tests/firestore.rules.cp21.test.mjs',
 'tests/cp21.rules.contract.test.cjs',
 'firestore.rules.CANDIDATE_CP21','firebase.emulator.cp21.json',
 'RUN_RULES_CHECKPOINT21.ps1','package.json','vercel.json',
];
const legacy=[
 'src/audit_dataset.py','src/baseline_next_term.py',
 'benchmarks/cla_llm_120_cases_DRAFT.jsonl',
 'evidence/CLAIM_EVIDENCE_DAY1.md','evidence/firebase.emulator.cp21.json',
 'evidence/RESEARCH_SCOPE_DAY1.md','evidence/RUN_RULES_CHECKPOINT21.ps1',
 'data/evidence/CLAIM_EVIDENCE_DAY1.md','data/evidence/firebase.emulator.cp21.json',
 'data/evidence/RESEARCH_SCOPE_DAY1.md','data/evidence/RUN_RULES_CHECKPOINT21.ps1'
];
for(const file of mandatory)assert(exists(file),'MISSING '+file);
for(const file of legacy)assert(!exists(file),'MISPLACED '+file);
const conf=JSON.parse(fs.readFileSync(path.join(root,'firebase.emulator.cp21.json'),'utf8'));
assert.equal(conf.firestore.rules,'firestore.rules.CANDIDATE_CP21');
const pkg=require(path.join(root,'package.json'));
assert(pkg.scripts['test:rules:emulator']&&pkg.scripts['test:rules:static']);
console.log('CLA LAYOUT PASS:',mandatory.length,'required files and',legacy.length,'legacy misplacements absent');
