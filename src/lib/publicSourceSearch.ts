/** Public-source discovery only. No learner profile, fit score or prediction enters this contract. */
export const PUBLIC_TOPICS = {
  admission: 'Tuyển sinh / điểm chuẩn Việt Nam',
  study: 'Du học / điều kiện / chứng chỉ',
  scholarship: 'Học bổng / học phí / thời hạn',
} as const;
export type PublicTopic = keyof typeof PUBLIC_TOPICS;
export type PublicQuery = { version: 1; topic: PublicTopic; subject: string; year: number | null; confirmedPublic: true };
export type PublicCandidate = { title: string; url: string; snippet: string; status: 'UNVERIFIED_CANDIDATE' };
export const PUBLIC_SEARCH_VERSION = 'cla-public-search-v1';
const obj = (x: unknown): Record<string, unknown> | null => x !== null && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : null;
export function parsePublicQuery(value: unknown): PublicQuery | null {
  const p = obj(value);
  if (!p || Object.keys(p).some(k => !['version','topic','subject','year','confirmedPublic'].includes(k)) || p.version !== 1 || p.confirmedPublic !== true || typeof p.topic !== 'string' || !Object.prototype.hasOwnProperty.call(PUBLIC_TOPICS,p.topic)) return null;
  if (typeof p.subject !== 'string' || p.subject.length > 120 || /[\p{Cc}\p{Cf}]/u.test(p.subject)) return null;
  const subject = p.subject.trim().replace(/\s+/g,' ');
  if (subject.length < 2 || !/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .,&()'’+\-/]*$/u.test(subject) || /\d{6,}|(?:\d[ .-]?){9,}|https?\b|www\.|site:|[0-9]+[.,][0-9]+/i.test(subject)) return null;
  // Names are not automatically identifiable. UI explicitly limits this to public institution/program/country names.
  const currentYear = new Date().getUTCFullYear();
  if (p.year !== null && (typeof p.year !== 'number' || !Number.isInteger(p.year) || p.year < 2020 || p.year > currentYear + 2)) return null;
  return {version:1,topic:p.topic as PublicTopic,subject,year:p.year as number|null,confirmedPublic:true};
}
export function publicSearchText(q: PublicQuery): string {
  const scope = q.topic === 'admission' ? 'điểm chuẩn phương thức xét tuyển ngành chỉ tiêu học phí trang tuyển sinh chính thức' : q.topic === 'study' ? 'official undergraduate admissions international students entry requirements language certificates tuition' : 'official undergraduate scholarship eligibility deadline tuition funding';
  return `${q.subject} ${q.year ?? ''} ${scope}`.replace(/\s+/g,' ').trim();
}
export function externalSourceSearch(q: PublicQuery): string {
  return `https://www.google.com/search?q=${encodeURIComponent(publicSearchText(q))}`;
}
export function safePublicUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const u = new URL(value);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !h.includes('.') || !/^[a-z0-9.-]+$/.test(h) || /^\d/.test(h) || /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(h) || /(?:^|\.)google(?:usercontent)?\.com$/.test(h) || /(?:^|\.)grounding-api-redirect\.google\.com$/.test(h)) return null;
    return u.href;
  } catch { return null; }
}
export function parsePublicCandidates(value: unknown): PublicCandidate[] {
  const root = obj(value);
  if (!root || !Array.isArray(root.results)) return [];
  const seen = new Set<string>();
  const result: PublicCandidate[] = [];
  for (const item of root.results.slice(0,24)) {
    const r = obj(item); if (!r) continue;
    const url = safePublicUrl(r.url);
    if (!url || seen.has(url) || typeof r.title !== 'string' || !r.title.trim()) continue;
    seen.add(url);
    // Always treated as untrusted plain text and never imported into CLA's engines.
    const clean = (v: string, limit: number) => v.replace(/[\p{Cc}\p{Cf}]/gu,' ').trim().slice(0,limit);
    result.push({title:clean(r.title,180),url,snippet:typeof r.snippet==='string'?clean(r.snippet,500):'',status:'UNVERIFIED_CANDIDATE'});
    if (result.length === 8) break;
  }
  return result;
}
