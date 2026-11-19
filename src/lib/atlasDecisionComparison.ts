import { answerNationalCutoff, nationalCutoffs } from './nationalAdmissionRegistry.ts';
import { verifiedPrograms, ptit2026MethodScales, type Ptit2026Method } from '../data/verifiedAdmissionPrograms.ts';

export const comparisonVersion = 'atlas-national-2026-v3';
export type ComparisonInput = { code: string; method: string; score: string };
export function parseMethodScore(raw: string, method: string): number | null {
  if (!Object.prototype.hasOwnProperty.call(ptit2026MethodScales, method)) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw.trim())) return null;
  const n = Number(raw.trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 0 && n <= ptit2026MethodScales[method as Ptit2026Method].scale ? n : null;
}
export function compareAdmissionOption(input: ComparisonInput) {
  const program = verifiedPrograms.find(p => p.code === input.code);
  const score = parseMethodScore(input.score, input.method);
  if (!program || score === null) return null;
  const method = input.method as Ptit2026Method;
  const cutoff = program.cutoffs2026.values[method];
  const gap = Math.round((score - cutoff) * 100) / 100;
  return { version: comparisonVersion, code: program.code, major: program.major, campus: program.campus, year: 2026 as const,
    method, label: ptit2026MethodScales[method].label, scale: ptit2026MethodScales[method].scale, score, cutoff, gap,
    relation: gap < 0 ? 'BELOW' as const : gap > 0 ? 'ABOVE' as const : 'EQUAL' as const,
    officialSource: program.cutoffs2026.source, reviewedAt: program.cutoffs2026.reviewedAt, tieBreak: program.cutoffs2026.tieBreak,
    eligibility: 'NOT_EVALUATED' as const, probability: null };
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').trim().replace(/\s+/g,' ');
const methods: Record<string, Ptit2026Method> = { thpt:'THPT', 'thi thpt':'THPT', 'tai nang':'TALENT', sat:'SAT', act:'ACT', tsa:'TSA', hsa:'HSA', 'v-act':'VACT', vact:'VACT', spt:'SPT', 'ket hop':'COMBINED' };
/** Intentionally strict grammar: unknown or multi-intent questions fall back to existing specialist navigation. No LLM or personal data. */
export function answerVerifiedCutoff(question: string) {
  if (question.length > 160) return null;
  const match = /^diem chuan ptit bvh (.+?) (2024|2025|2026)(?: (.+?))?\??$/.exec(normalize(question));
  if (!match) return answerNationalCutoff(question);
  const [, rawMajor, yearText, rawMethod] = match;
  const major = rawMajor === 'cntt' ? 'cong nghe thong tin' : rawMajor;
  const p = verifiedPrograms.find(p => p.code === major || normalize(p.major) === major);
  if (!p) return null;
  const year = Number(yearText);
  let value: number, method: string, scale: number | null, source: string;
  if (year === 2026) {
    if (!rawMethod || !Object.prototype.hasOwnProperty.call(methods, rawMethod)) return null;
    const key = methods[rawMethod]; value = p.cutoffs2026.values[key]; method = ptit2026MethodScales[key].label; scale = ptit2026MethodScales[key].scale; source = p.cutoffs2026.source;
  } else {
    const item = p.historicalCutoffs.find(x => x.year === year);
    if (!item || (rawMethod && !(year === 2024 && ['thpt','thi thpt'].includes(rawMethod)))) return null;
    value = item.cutoff; method = year === 2024 ? 'Thi THPT' : 'Điểm chuẩn chung công bố'; scale = year === 2024 ? 30 : null; source = item.source;
  }
  return { source, answer: `PTIT cơ sở Hà Nội (BVH) · ${p.major} (${p.code}) · ${year} · ${method}: ${value.toFixed(2)}${scale === null ? '' : `/${scale}`} điểm công bố. Đây là dữ liệu lịch sử, không phải dự báo đỗ; cần kiểm tra điều kiện và tiêu chí phụ trong thông báo gốc.` };
}
export function safeCutoffSource(value: unknown): string | undefined {
  return typeof value === 'string' && nationalCutoffs.some(p => p.source === value) ? value : undefined;
}
