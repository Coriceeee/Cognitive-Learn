import type { VercelRequest, VercelResponse } from '../server/vercelTypes.ts';
import { parsePublicQuery, parsePublicCandidates, publicSearchText, PUBLIC_SEARCH_VERSION, safePublicUrl } from '../src/lib/publicSourceSearch.ts';
import type { PublicQuery } from '../src/lib/publicSourceSearch.ts';
import { parseNationalSourceQuery, nationalYearQueries, emptyNationalYears, NATIONAL_SOURCE_DISCOVERY_VERSION, type NationalSourceQuery, type NationalYearResult } from '../src/lib/nationalSourceDiscovery.ts';

const calls = new Map<string, number>();
const record = (v: unknown): Record<string, unknown> | null => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
async function boundedJson(url: string, init: RequestInit, timeout = 10000) {
  const response = await fetch(url, {...init, redirect:'error', signal:AbortSignal.timeout(timeout)});
  if (!response.ok) throw new Error('upstream error');
  if (!response.body) throw new Error('missing response');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = ''; let bytes = 0;
  try { while (true) { const next = await reader.read(); if (next.done) break; bytes += next.value.byteLength; if (bytes > 65536) throw new Error('response too large'); text += decoder.decode(next.value,{stream:true}); } text += decoder.decode(); }
  finally { await reader.cancel().catch(()=>{}); }
  return JSON.parse(text) as unknown;
}
async function verifiedUid(token: string) {
  const key = (process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || '').trim();
  const project = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  if (!key || !/^[a-zA-Z0-9-]+$/.test(project)) throw new Error('auth unavailable');
  const auth = record(await boundedJson(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token})}));
  const user = Array.isArray(auth?.users)?record(auth.users[0]):null;
  const uid = user?.localId;
  if (typeof uid !== 'string' || !/^[\w:-]{1,128}$/.test(uid) || user?.disabled===true) throw new Error('account unavailable');
  const doc = record(await boundedJson(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,{headers:{Authorization:`Bearer ${token}`}}));
  const f = record(doc?.fields);
  if (record(f?.active)?.booleanValue!==true || !['student','admin'].includes(String(record(f?.role)?.stringValue))) throw new Error('role unavailable');
  return uid;
}
/** Approved independent public-source provider contract. Not Google Search Grounding output ingestion. */
type ProviderConfig={endpoint:string;token:string;kind?:'brave-web'};
export function providerConfig(env: Record<string,string|undefined>):ProviderConfig|null {
  // Explicit operator review required; no Gemini key reuse and no automatic enablement.
  if(env.CLA_PUBLIC_SEARCH_APPROVAL==='approved-brave-web-display-v1'&&env.CLA_BRAVE_SEARCH_API_KEY?.trim())return {endpoint:'https://api.search.brave.com/res/v1/web/search',token:env.CLA_BRAVE_SEARCH_API_KEY.trim(),kind:'brave-web'};
  if (env.CLA_PUBLIC_SEARCH_APPROVAL !== 'approved-independent-public-source-provider-v1') return null;
  const endpoint = safePublicUrl(env.CLA_PUBLIC_SEARCH_ENDPOINT);
  if (!endpoint || !env.CLA_PUBLIC_SEARCH_TOKEN?.trim()) return null;
  return {endpoint,token:env.CLA_PUBLIC_SEARCH_TOKEN.trim()};
}
export async function queryPublicProvider(q: PublicQuery, config: ProviderConfig, transport:typeof boundedJson=boundedJson) {
  if(config.kind==='brave-web'){
    // Display only: do not feed these results into AI, persist or populate the Atlas database.
    const url=new URL('https://api.search.brave.com/res/v1/web/search');
    for(const [k,v] of Object.entries({q:publicSearchText(q),count:'8',safesearch:'strict',result_filter:'web',text_decorations:'false',spellcheck:'false',summary:'false'}))url.searchParams.set(k,v);
    const raw=record(await transport(url.href,{method:'GET',headers:{Accept:'application/json','X-Subscription-Token':config.token}},15000));
    const web=record(raw?.web);const rows=Array.isArray(web?.results)?web.results:[];
    return parsePublicCandidates({results:rows.map(v=>{const r=record(v);return {title:r?.title,url:r?.url,snippet:r?.description};})});
  }
  // Only allowlisted fields; Firebase token/UID, history, scores and private profile are never forwarded.
  const payload={version:1,topic:q.topic,subject:q.subject,year:q.year};
  const raw=await transport(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.token}`},body:JSON.stringify(payload)},15000);
  return parsePublicCandidates(raw);
}
/** Three bounded independent searches. Provider errors are isolated by year; no Grounding ingestion. */
export async function queryNationalProvider(q:NationalSourceQuery,config:ProviderConfig,transport:typeof boundedJson=boundedJson):Promise<NationalYearResult[]> {
  return Promise.all(nationalYearQueries(q).map(async (query):Promise<NationalYearResult>=>{
    try {const results=await queryPublicProvider(query,config,transport);return {year:query.year!,status:results.length?'UNVERIFIED_CANDIDATES':'NO_RESULTS',results};}
    catch{return {year:query.year!,status:'PROVIDER_UNAVAILABLE',results:[]};}
  }));
}
export default async function handler(req:VercelRequest,res:VercelResponse) {
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
  const origin=req.headers.origin; const host=req.headers.host;
  const allowed=typeof origin==='undefined'||(typeof origin==='string'&&(origin===`https://${host}`||(process.env.NODE_ENV!=='production'&&origin===`http://${host}`)||(process.env.CORS_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim().replace(/\/$/,'')).includes(origin)));
  if (!allowed) return res.status(403).json({status:'FORBIDDEN'});
  if (typeof origin==='string') res.setHeader('Access-Control-Allow-Origin',origin);
  if (req.method==='OPTIONS') return res.status(204).end();
  if (req.method!=='POST') return res.status(405).json({status:'METHOD_NOT_ALLOWED'});
  const config=providerConfig(process.env);
  try {
    const bearer=typeof req.headers.authorization==='string'?/^Bearer ([\w.-]+)$/.exec(req.headers.authorization):null;
    if (!bearer) return res.status(401).json({status:'AUTH_REQUIRED'});
    let value=req.body;
    if (typeof value==='string'||Buffer.isBuffer(value)) {if(Buffer.byteLength(String(value))>3000)return res.status(413).json({status:'TOO_LARGE'});try{value=JSON.parse(String(value));}catch{return res.status(400).json({status:'INVALID_QUERY'});}}
    if(Buffer.byteLength(JSON.stringify(value??null))>3000)return res.status(413).json({status:'TOO_LARGE'});
    const national=parseNationalSourceQuery(value);const q=parsePublicQuery(value);if(!national&&!q)return res.status(422).json({status:'INVALID_QUERY'});
    if(!config)return res.status(200).json(national?{version:NATIONAL_SOURCE_DISCOVERY_VERSION,years:emptyNationalYears(national,'PROVIDER_NOT_CONFIGURED')}:{version:PUBLIC_SEARCH_VERSION,status:'PROVIDER_NOT_CONFIGURED',results:[]});
    let uid:string;try{uid=await verifiedUid(bearer[1]);}catch{return res.status(403).json({status:'AUTH_NOT_VERIFIED'});}
    const now=Date.now();for(const [id,when] of calls)if(now>=when)calls.delete(id);
    if(calls.has(uid)||calls.size>=3000)return res.status(429).json({status:'RATE_LIMITED'});calls.set(uid,now+(national?30000:10000));
    if(national)return res.status(200).json({version:NATIONAL_SOURCE_DISCOVERY_VERSION,years:await queryNationalProvider(national,config)});
    const results=await queryPublicProvider(q!,config);
    return res.status(200).json({version:PUBLIC_SEARCH_VERSION,status:results.length?'UNVERIFIED_CANDIDATES':'NO_RESULTS',results});
  } catch {return res.status(502).json({version:PUBLIC_SEARCH_VERSION,status:'PROVIDER_UNAVAILABLE',results:[]});}
}
