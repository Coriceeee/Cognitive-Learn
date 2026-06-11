import type { StudentProfile } from '../types/domain';

export const mockStudent: StudentProfile = {
  id: 'demo-student',
  fullName: 'Nguyễn Minh Anh',
  grade: 12,
  province: 'Hà Nội',
  desiredMajor: 'Công nghệ thông tin',
  desiredUniversity: 'Đại học Bách khoa Hà Nội',
  subjects: [
    { subject: 'Toán', currentScore: 7.8, targetScore: 9, weeklyHours: 8 },
    { subject: 'Vật lý', currentScore: 7.2, targetScore: 8.5, weeklyHours: 6 },
    { subject: 'Tiếng Anh', currentScore: 8.1, targetScore: 9, weeklyHours: 5 },
  ],
  cognitiveMetrics: {
    actionConsistency: 72,
    goalSwitchFrequency: 35,
    taskAbandonmentRate: 28,
    decisionLatency: 42,
    contextSwitchRate: 38,
  },
};
