/** Read-only description of current production proxy inputs; not research validation. */
const codes = ['SCI', 'MAS', 'CSL'] as const;
type Code = typeof codes[number];
const spec:Record<Code,{label:string;production:string;research:string}> = {
 SCI:{label:'Self Coherence Index',production:'Hoàn thành hoặc nhất quán hành động đã khai báo.',research:'Hoàn thành kế hoạch, nhất quán hành động, phù hợp mục tiêu–hành động.'},
 MAS:{label:'Meaning Alignment Score',production:'Động lực tự báo cáo.',research:'Động lực, kiên trì, bỏ dở (không tương đương thang đo meaning alignment).'},
 CSL:{label:'Cognitive Stability Level',production:'Chiến lược học được cung cấp.',research:'Ổn định hành vi, chuyển mục tiêu, chuyển ngữ cảnh.'},
};
function record(v:unknown):Record<string,unknown>|null{return v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;}
export function cognitiveResearchReadiness(result:unknown){
 const r=record(result),v=record(r?.vector);
 const allowed=r?.mappingVersion==='cla-cognitive-proxy-v2'&&v?.mappingVersion==='cla-cognitive-proxy-v2'&&Array.isArray(v.availableDimensions)&&Array.isArray(v.missingDimensions)&&Array.isArray(r.dimensions);
 const rows=codes.map(code=>{
  const value=v?.[code];
  const dims=Array.isArray(r?.dimensions)?r.dimensions.filter(d=>record(d)?.code===code):[];
  const dim=record(dims[0]);
  const available=allowed&&Array.isArray(v?.availableDimensions)&&v.availableDimensions.filter(x=>x===code).length===1&&Array.isArray(v.missingDimensions)&&!v.missingDimensions.includes(code)&&dims.length===1&&dim?.available===true&&typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100&&dim.value===value&&r?.[code]===value;
  return {code,...spec[code],value:available?value as number:null,status:available?'PROXY_AVAILABLE' as const:'INSUFFICIENT_DATA' as const};
 });
 return {rows,mappingVersion:allowed?'cla-cognitive-proxy-v2':null,availableCount:rows.filter(x=>x.value!==null).length,researchValidation:'NOT_VALIDATED' as const,adaptiveEfficacy:'NOT_ESTABLISHED' as const};
}
