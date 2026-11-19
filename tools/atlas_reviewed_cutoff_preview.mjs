import {readFileSync} from 'node:fs';
import {parseReviewedCutoffBatch} from '../src/lib/reviewedCutoffBatch.ts';
import {officialUniversities} from '../src/data/officialAdmissionSources.ts';
import {nationalCutoffs,cutoffKey} from '../src/lib/nationalAdmissionRegistry.ts';
// Offline, read-only preview. Never promotes a candidate into production or declares authenticity.
const file=process.argv[2];if(!file)throw Error('Usage: npm run research:atlas:batch-preview -- path/to/reviewed-batches.json');
const input=JSON.parse(readFileSync(file,'utf8'));
if(input.schema!=='cla-reviewed-cutoff-batches-v1'||!Array.isArray(input.batches)||!input.batches.length)throw Error('Invalid batch manifest');
const existing=new Map(nationalCutoffs.map(r=>[cutoffKey(r),r]));const seen=new Set();const counts={new:0,unchanged:0,conflict:0};const conflicts=[];
for(const b of input.batches){
 const school=officialUniversities.find(s=>s.id===b.universityId);if(!school)throw Error('Register and review school before batch preview');
 const record=school.years.find(y=>y.year===b.year);const knownSources=[record?.schemeUrl,record?.cutoffUrl];
 if(!knownSources.includes(b.source))throw Error('Review exact school-year source before batch preview');
 for(const r of parseReviewedCutoffBatch(b)){const key=cutoffKey(r);if(seen.has(key))throw Error('Duplicate across input batches: '+key);seen.add(key);const old=existing.get(key);if(!old){counts.new++;continue;}if(old.cutoff===r.cutoff&&old.scale===r.scale&&old.source===r.source&&old.major===r.major&&old.label===r.label){counts.unchanged++;continue;}counts.conflict++;conflicts.push({key,existing:{cutoff:old.cutoff,scale:old.scale,source:old.source,major:old.major,label:old.label},candidate:{cutoff:r.cutoff,scale:r.scale,source:r.source,major:r.major,label:r.label}});}
}
console.log(JSON.stringify({scope:'OFFLINE_PREVIEW_NOT_SOURCE_AUTHENTICATION',counts,conflicts,productionWrites:0},null,2));if(counts.conflict)process.exitCode=2;
