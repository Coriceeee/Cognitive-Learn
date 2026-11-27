import { strictUtc } from './dynamicStudentState.ts';

export const DEMO_TEMPORAL_FIXTURE_VERSION = 'cla-demo-temporal-v1';
const DAY_MS = 86_400_000;

const observations = [
  { daysAgo: 9, studyHoursPerWeek: 7.5, planCompletionRate: 46, motivationLevel: 52, SCI: 48, MAS: 52, CSL: 50 },
  { daysAgo: 5, studyHoursPerWeek: 9, planCompletionRate: 61, motivationLevel: 61, SCI: 56, MAS: 61, CSL: 57 },
  { daysAgo: 1, studyHoursPerWeek: 11, planCompletionRate: 76, motivationLevel: 70, SCI: 65, MAS: 70, CSL: 66 },
] as const;

export type DemoTemporalSnapshot = {
  id: string;
  studentId: string;
  dataScope: 'demo';
  recordType: 'SYNTHETIC_DEMO';
  demoFixtureVersion: typeof DEMO_TEMPORAL_FIXTURE_VERSION;
  synthetic: true;
  createdAt: string;
  overallScore: 0;
  confidenceScore: 0;
  riskLevel: 'UNKNOWN';
  trend: 'UNKNOWN';
  SCI: number;
  MAS: number;
  CSL: number;
  GVI: 0;
  BDI: 0;
  FRI: 0;
  CRI: 0;
  gpaOverall: null;
  studyHoursPerWeek: number;
  practiceTestsPerWeek: null;
  planCompletionRate: number;
  motivationLevel: number;
  scoreAvailable: false;
  dataCoverageScore: 0;
  missingDimensions: string[];
  mappingVersion: 'cla-cognitive-proxy-v2';
};

/**
 * Three clearly labelled, non-research demo observations.
 * They are anchored to the profile's last server update and never land in the future.
 */
export function buildDemoTemporalSnapshots(uid: string, observedAt: string): DemoTemporalSnapshot[] {
  if (typeof uid !== 'string' || uid.trim().length === 0 || uid.length > 128 || !strictUtc(observedAt)) {
    throw new Error('Không thể tạo dữ liệu DEMO: UID hoặc thời điểm hồ sơ không hợp lệ.');
  }

  const anchor = Date.parse(observedAt);
  return observations.map(point => {
    const date = new Date(anchor - point.daysAgo * DAY_MS);
    date.setUTCHours(23, 59, 59, 999);
    const createdAt = date.toISOString();
    if (!strictUtc(createdAt) || Date.parse(createdAt) >= anchor) {
      throw new Error('Không thể tạo dữ liệu DEMO nằm trong khoảng thời gian hợp lệ.');
    }

    return {
      id: `${DEMO_TEMPORAL_FIXTURE_VERSION}-${point.daysAgo}d`,
      studentId: uid,
      dataScope: 'demo',
      recordType: 'SYNTHETIC_DEMO',
      demoFixtureVersion: DEMO_TEMPORAL_FIXTURE_VERSION,
      synthetic: true,
      createdAt,
      overallScore: 0,
      confidenceScore: 0,
      riskLevel: 'UNKNOWN',
      trend: 'UNKNOWN',
      SCI: point.SCI,
      MAS: point.MAS,
      CSL: point.CSL,
      GVI: 0,
      BDI: 0,
      FRI: 0,
      CRI: 0,
      gpaOverall: null,
      studyHoursPerWeek: point.studyHoursPerWeek,
      practiceTestsPerWeek: null,
      planCompletionRate: point.planCompletionRate,
      motivationLevel: point.motivationLevel,
      scoreAvailable: false,
      dataCoverageScore: 0,
      missingDimensions: ['GVI', 'BDI', 'FRI', 'CRI'],
      mappingVersion: 'cla-cognitive-proxy-v2',
    };
  });
}
