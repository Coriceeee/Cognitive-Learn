import {admissionYears,officialUniversities,type OfficialUniversity} from '../data/officialAdmissionSources.ts';
import {nationalCutoffs,type NationalCutoff} from './nationalAdmissionRegistry.ts';
import {buildNationalPathwayCatalogue,type PathwayProgram} from './nationalAdmissionPathways2026.ts';
/** Local inventory, NOT national denominator. Count a school once per year per category. */
export function auditNationalCoverage(schools:readonly OfficialUniversity[]=officialUniversities,cutoffs:readonly NationalCutoff[]=nationalCutoffs,programs:readonly PathwayProgram[]=buildNationalPathwayCatalogue()){
 const rows=schools.map(s=>({id:s.id,name:s.name,portal:s.portalUrl,years:admissionYears.map(year=>{
  const source=s.years.find(y=>y.year===year);const nr=cutoffs.filter(r=>r.universityId===s.id&&r.year===year).length;
  // Pathway catalog currently only supports 2026; past 'unknown' is not zero programmes nationally.
  const pr=year===2026?programs.filter(p=>p.universityId===s.id&&p.year===year):null;
  return {year,source:source?.schemeUrl??null,methodReviewed:source?.detailsStatus==='institution_method_verified',cutoffRecords:nr,programRecords:pr?.length??null,combinationRecords:pr?.filter(p=>p.evidence.length>0).length??null,mappedCombinationRecords:pr?.filter(p=>p.evidence.some(e=>e.subjects!==null)).length??null,unmappedOrConditionalRecords:pr?.filter(p=>p.evidence.some(e=>e.subjects===null)).length??null,programmeMethodRecords:pr?.filter(p=>Boolean(p.publishedMethodCodes?.length)).length??null};
 })}));
 const summary=admissionYears.map(year=>{const slots=rows.map(s=>s.years.find(y=>y.year===year)!);return {year,registrySchools:schools.length,sourceSchools:slots.filter(s=>s.source).length,methodSchools:slots.filter(s=>s.methodReviewed).length,cutoffSchools:slots.filter(s=>s.cutoffRecords>0).length,programSchools:year===2026?slots.filter(s=>(s.programRecords??0)>0).length:null,combinationSchools:year===2026?slots.filter(s=>(s.combinationRecords??0)>0).length:null};});
 const tasks=rows.flatMap(s=>s.years.flatMap(y=>{const missing=[...(!y.source?['source']:[]),...(!y.methodReviewed?['methods']:[]),...(!y.cutoffRecords?['cutoffs']:[]),...(y.year===2026&&(!y.programRecords||y.programRecords!==y.combinationRecords)?['combinations']:[]),...(y.year===2026&&(y.unmappedOrConditionalRecords??0)>0?['combination_mapping_or_conditions']:[])];return missing.length?[{schoolId:s.id,school:s.name,year:y.year,source:y.source??s.portal,missing}]:[];}));
 return {scope:'LOCAL_REGISTRY_ONLY' as const,nationalDenominator:null,rows,summary,tasks};
}
