import type { CognitiveMetrics, CognitiveState } from '../types/domain';

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function calculateCognitiveState(m: CognitiveMetrics): CognitiveState {
  const sci = clamp(
    m.actionConsistency * 0.55 +
    (100 - m.goalSwitchFrequency) * 0.25 +
    (100 - m.taskAbandonmentRate) * 0.2
  );

  const mas = clamp(
    m.actionConsistency * 0.35 +
    (100 - m.taskAbandonmentRate) * 0.45 +
    (100 - m.goalSwitchFrequency) * 0.2
  );

  const csl = clamp(
    (100 - m.contextSwitchRate) * 0.45 +
    (100 - m.decisionLatency) * 0.25 +
    m.actionConsistency * 0.3
  );

  return {
    sci: Math.round(sci),
    mas: Math.round(mas),
    csl: Math.round(csl),
  };
}
