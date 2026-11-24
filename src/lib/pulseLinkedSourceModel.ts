/** CP92 – explicit provenance for the PULSE live source panel.
 * Counts are record counts, not aptitude, prediction, or educational outcomes.
 * Missing measurements must remain null; zero is only valid when observed.
 */
import { runOrionStrategy, type OrionSubjectScore } from './orionStrategyEngine.ts';

export type PulseSource = 'LUMEN' | 'ATLAS' | 'ORION' | 'SEED';
export type PulseLinkedSignal = {
  key: string;
  label: string;
  value: number | null;
  unit: string;
  source: PulseSource;
  href: string;
  group: string;
  max: number;
  note: string;
};
export type PulseLinkInputs = {
  lumenScore?: number | null;
  lumenCri?: number | null;
  history?: Array<{overallScore: number; scoreAvailable?: boolean; createdAt?: string}> | null;
  atlasProgramCount?: number | null;
  atlasSourceCount?: number | null;
  orionDraft?: unknown;
  seedRecord?: unknown;
};
const between = (value: unknown, min: number, max: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
function numericInput(value: unknown, min: number, max: number): number | null {
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(',', '.'));
    return between(parsed, min, max);
  }
  return between(value, min, max);
}
function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function seedField(value: unknown, field: string, max: number): number | null {
  const source = record(value);
  const behavior = record(source?.behavior);
  // A default 0 introduced by UI normalization is NOT an observation.
  return numericInput(source?.[field] ?? behavior?.[field], 0, max);
}
function orionReadiness(input: unknown): number | null {
  const draft = record(input);
  if (!draft) return null;
  const weeks = numericInput(draft.weeksLeft, 1, 104);
  if (weeks === null || !Number.isInteger(weeks)) return null;
  const scores = record(draft.scores);
  const targets = record(draft.targets);
  if (!scores || !targets) return null;
  const labels: Record<string,string> = {
    math:'Toán', literature:'Ngữ văn', english:'Tiếng Anh',
    physics:'Vật lý', chemistry:'Hóa học', biology:'Sinh học',
  };
  const subjects: OrionSubjectScore[] = Object.entries(labels).flatMap(([subject,label]) => {
    const current = numericInput(scores[subject], 0, 10);
    const target = numericInput(targets[subject], 0, 10);
    return current === null || target === null ? [] : [{subject,label,currentScore:current,targetScore:target,importance:1}];
  });
  if (subjects.length === 0) return null;
  return runOrionStrategy({subjects,weeksLeft:weeks,targetMajor:typeof draft.targetMajor === 'string' ? draft.targetMajor : ''}).readinessScore;
}
export function derivePulseLinkedSignals(input: PulseLinkInputs): PulseLinkedSignal[] {
  const history = (input.history ?? []).filter(item => item.scoreAvailable === true
    && between(item.overallScore,0,100) !== null
    && typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt)));
  // A *previous* observation needs two real, dated historical observations;
  // never use a single cached/current snapshot as a fabricated prior period.
  const previous = history.length >= 2 ? between(history[1].overallScore,0,100) : null;
  const signal = (key: string,label: string,value: number|null,unit: string,source:PulseSource,href:string,
    group:string,max:number,note:string):PulseLinkedSignal => ({key,label,value,unit,source,href,group,max,note});
  return [
    signal('lumen-current','Tổng hợp LUMEN hiện tại',between(input.lumenScore,0,100),' / 100','LUMEN','/lumen','lumen',100,'Điểm proxy thử nghiệm; chỉ hiển thị khi có đủ phép đo'),
    signal('lumen-previous','LUMEN kỳ trước',previous,' / 100','LUMEN','/lumen/history','lumen',100,'Cần ít nhất hai bản ghi lịch sử có ngày và đủ phép đo'),
    signal('lumen-cri','Chỉ dấu CRI',between(input.lumenCri,0,100),' / 100','LUMEN','/lumen','lumen',100,'Chỉ số quy tắc tổng hợp, không phải điểm IQ'),
    signal('atlas-programs','Chương trình trong Atlas',input.atlasProgramCount === null || input.atlasProgramCount === undefined ? null : between(input.atlasProgramCount,0,10000),' chương trình','ATLAS','/atlas','atlas',10,'Đếm chương trình đã lưu trong kho tài khoản; không phải số ngành phù hợp'),
    signal('atlas-sources','Nguồn đã lưu trong Atlas',input.atlasSourceCount === null || input.atlasSourceCount === undefined ? null : between(input.atlasSourceCount,0,10000),' nguồn','ATLAS','/atlas/sources','atlas',10,'Đếm bản ghi nguồn, không xác nhận độ chính xác của nguồn'),
    signal('orion-readiness','Chỉ số chiến lược ORION',orionReadiness(input.orionDraft),' / 100','ORION','/orion/inputs','orion',100,'Tính lại bằng engine ORION từ điểm môn, mục tiêu và số tuần đã lưu'),
    signal('seed-hours','Giờ học mỗi tuần',seedField(input.seedRecord,'studyHoursPerWeek',168),' giờ','SEED','/student/profile','seed',168,'Giờ học do học sinh khai trong hồ sơ SEED'),
    signal('seed-plan','Hoàn thành kế hoạch',seedField(input.seedRecord,'planCompletionRate',100),'%','SEED','/student/profile','seed',100,'Tỷ lệ hoàn thành kế hoạch do học sinh khai trong SEED'),
  ];
}
