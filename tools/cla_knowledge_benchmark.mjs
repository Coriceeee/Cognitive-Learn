/** Public, author-labelled test set. Offline retrieval is not LLM inference. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {retrieveClaKnowledge,CLA_KNOWLEDGE,CLA_KNOWLEDGE_VERSION,validateKnowledgeSelection} from '../src/lib/claKnowledgeRetrieval.ts';
const raw=readFileSync(new URL('../research/benchmarks/cla_knowledge_120_v1.jsonl',import.meta.url),'utf8');
const cases=raw.trim().split('\n').map(JSON.parse);
if(cases.length!==120||new Set(cases.map(x=>x.caseId)).size!==120||cases.some(c=>c.scope!=='PUBLIC_SYNTHETIC_TEST'||c.goldReview!=='AUTHOR_DEFINED_NOT_INDEPENDENT'||typeof c.question!=='string'||validateKnowledgeSelection({evidenceIds:c.expectedIds},CLA_KNOWLEDGE.map(x=>x.id))===null))throw Error('Invalid benchmark manifest');
const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&[...a].sort().every((x,i)=>x===[...b].sort()[i]);
const rows=cases.map(c=>{const actual=retrieveClaKnowledge(c.question).map(x=>x.id);return {caseId:c.caseId,category:c.category,expected:c.expectedIds,actual,pass:same(actual,c.expectedIds)};});
const summary=Object.fromEntries(['single','multiple','abstain'].map(k=>[k,{total:rows.filter(r=>r.category===k).length,pass:rows.filter(r=>r.category===k&&r.pass).length}]));
const report={schema:'cla.knowledge-retrieval.benchmark.v1',version:CLA_KNOWLEDGE_VERSION,benchmarkSha256:createHash('sha256').update(raw).digest('hex'),knowledgeSha256:createHash('sha256').update(JSON.stringify(CLA_KNOWLEDGE)).digest('hex'),scope:'TECHNICAL_PUBLIC_SYNTHETIC_TEST',goldReview:'AUTHOR_DEFINED_NOT_INDEPENDENT',method:'lexical_exact_evidence_set',total:rows.length,pass:rows.filter(r=>r.pass).length,summary,liveLlm:'NOT_RUN',limitations:['No independent holdout or human gold review.','No live Gemini, open-weight model or factual groundedness evaluation.','Abstain means this narrow retrieval path returned no cards, not an end-to-end safety refusal.'],rows};
mkdirSync(new URL('../reports/evidence/',import.meta.url),{recursive:true});writeFileSync(new URL('../reports/evidence/cla_knowledge_retrieval_SYNTHETIC.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:report.total,pass:report.pass,summary,liveLlm:report.liveLlm}));
for(const row of rows.filter(x=>!x.pass))console.log('FAIL',row.caseId,row.expected,row.actual);
if(report.pass!==report.total)process.exitCode=1;
