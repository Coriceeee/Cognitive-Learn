/** Reviewed institutional table parser. Structural validation only; no source authenticity claim. */
export type ReviewedSchemeRow={code:string;quota:number;combinationCodes:string[];methodCodes:string[];requiresAptitudeReview:boolean};
export function parseReviewedSchemeRows(table:string,allowedCombinations:readonly string[],allowedMethods:readonly string[]):ReviewedSchemeRow[]{
 const seen=new Set<string>(),combos=new Set(allowedCombinations),methods=new Set(allowedMethods);
 if(!table.trim())throw Error('Empty scheme table');
 return table.trim().split('\n').map(raw=>{
  const fields=raw.trim().split('|');if(fields.length!==5)throw Error('Invalid field count');
  const [code,q,methodText,combinationText,aptitude]=fields;const quota=Number(q);
  const combinationCodes=combinationText.split(' '),methodCodes=methodText.split(' ');
  if(!/^[0-9]{7,8}[A-Z0-9]*$/.test(code)||seen.has(code)||!/^\d+$/.test(q)||!Number.isSafeInteger(quota)||quota<=0||!['Y','N'].includes(aptitude)||new Set(combinationCodes).size!==combinationCodes.length||combinationCodes.some(c=>!combos.has(c))||new Set(methodCodes).size!==methodCodes.length||methodCodes.some(m=>!methods.has(m)))throw Error('Invalid or ambiguous scheme row: '+code);
  seen.add(code);return {code,quota,combinationCodes,methodCodes,requiresAptitudeReview:aptitude==='Y'};
 });
}
