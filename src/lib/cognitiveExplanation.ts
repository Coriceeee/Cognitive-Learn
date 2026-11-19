/** Explain the existing production formula, without inventing a measurement or confidence. */
import { COGNITIVE_COMPOSITE_WEIGHTS as weights, computeCognitiveComposite } from "./cognitiveCompositeFormula.ts";
type Code=keyof typeof weights;
const codes=Object.keys(weights) as Code[];
const record=(x:unknown):Record<string,unknown>|null=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
export function explainCognitiveComposite(input:unknown){
 const r=record(input),v=record(r?.vector);
 const version='cla-cognitive-proxy-v2';
 const validVersion=r?.mappingVersion===version&&v?.mappingVersion===version;
 const available=v?.availableDimensions,missing=v?.missingDimensions,dims=r?.dimensions;
 const factors=codes.map(code=>{
   const matches=Array.isArray(dims)?dims.filter(x=>record(x)?.code===code):[];
   const d=record(matches[0]),x=v?.[code];
   const ok=validVersion&&Array.isArray(available)&&available.filter(y=>y===code).length===1&&Array.isArray(missing)&&!missing.includes(code)&&matches.length===1&&d?.available===true&&typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=100&&r?.[code]===x&&d.value===x;
   return {code,weight:weights[code],value:ok?x as number:null,contribution:ok?Math.round((x as number)*weights[code]*100)/100:null};
 });
 const complete=factors.every(x=>x.value!==null)&&r?.scoreAvailable===true;
 const expected=complete?computeCognitiveComposite(Object.fromEntries(factors.map(f=>[f.code,f.value])) as Record<Code,number>):null;
 const consistent=expected!==null&&r?.overallScore===expected;
 return {version:'cla-composite-explain-v1',mappingVersion:validVersion?version:null,status:consistent?'TRACE_MATCH' as const:complete?'INCONSISTENT' as const:'INSUFFICIENT_DATA' as const,score:consistent?expected:null,factors:consistent?factors:factors.map(f=>({...f,contribution:null})),limitations:['Đây là phép giải thích tại chỗ của công thức proxy, không phải Evidence Record được lưu bất biến.','CRI có thể phụ thuộc SCI/MAS/CSL; các yếu tố không độc lập và trọng số chưa được kiểm định.','Không suy ra quan hệ nhân quả, độ tin cậy tâm trắc hoặc xác suất từ phép phân rã.']};
}
