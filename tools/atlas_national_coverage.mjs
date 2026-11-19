import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {auditNationalCoverage} from '../src/lib/nationalCoverageAudit.ts';
import {institutionDiscovery,institutionDiscoverySummary} from '../src/lib/institutionDiscovery.ts';
import {institutionDiscoverySource} from '../src/data/institutionDiscovery2026.ts';
const local=auditNationalCoverage();
const discovery={...institutionDiscoverySummary(),source:institutionDiscoverySource,queue:institutionDiscovery.filter(r=>r.status==='DISCOVERY_ONLY').flatMap(r=>[2026,2025,2024].map(year=>({directoryId:r.id,name:r.name,year,status:'FIND_AND_VERIFY_ADMISSION_SOURCE',admissionCode:null})))};
// An operator-provided, reviewed Ministry directory export; never infer a code from an acronym.
// This only computes matches/gaps; it never writes programme, cutoff or production records.
const arg=process.argv.indexOf('--inventory');
let inventory=null;
if(arg>=0){
 const doc=JSON.parse(readFileSync(process.argv[arg+1],'utf8'));
 if(doc.schema!=='cla-moet-directory-review-v1'||doc.source!=='https://tuyensinh.moet.gov.vn/ts/thong-tin'||!/^\d{4}-\d{2}-\d{2}$/.test(doc.asOf)||typeof doc.complete!=='boolean'||!Array.isArray(doc.entries)||!doc.entries.length)throw Error('Invalid directory manifest');
 const codes=new Set(),mapped=new Set(),localIds=new Set(local.rows.map(r=>r.id));
 const entries=doc.entries.map(r=>{
  if(typeof r.code!=='string'||!/^[A-Z0-9]{2,12}$/.test(r.code)||codes.has(r.code)||typeof r.name!=='string'||!r.name.trim()||r.name.length>300||!(r.localId===null||typeof r.localId==='string'&&localIds.has(r.localId)&&!mapped.has(r.localId)))throw Error('Invalid/ambiguous directory row');
  codes.add(r.code);if(r.localId)mapped.add(r.localId);return {code:r.code,name:r.name,localId:r.localId};
 });
 inventory={source:doc.source,asOf:doc.asOf,scope:doc.complete?'OPERATOR_DECLARED_COMPLETE_NOT_INDEPENDENTLY_VERIFIED':'PARTIAL_INVENTORY',units:entries.length,matchedUnits:entries.filter(r=>r.localId).length,unmapped:entries.filter(r=>!r.localId),unmappedLocalIds:local.rows.filter(r=>!mapped.has(r.id)).map(r=>r.id),nationalCoverage:null};
}
mkdirSync('reports/evidence',{recursive:true});writeFileSync('reports/evidence/cla_atlas_national_coverage.json',JSON.stringify({local,inventory,discovery},null,2)+'\n');console.log(JSON.stringify({summary:local.summary,openSlots:local.tasks.length,inventory,discovery:{...discovery,queue:discovery.queue.length}},null,2));
