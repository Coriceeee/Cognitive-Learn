/** Presentation only: null means no plottable observation, not zero. Never extrapolate. */
export function chartFraction(value: number | null, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && Number.isFinite(max) && max > 0 && value >= 0 && value <= max ? value / max : null;
}
export type ChartObservation = { at: string; value: number };
export function temporalChartPoints(points: readonly ChartObservation[], max: number, halfLifeDays = 7) {
  if (points.length < 3 || !Number.isFinite(halfLifeDays) || halfLifeDays <= 0) return [];
  const times = points.map(p => Date.parse(p.at));
  const span = times[times.length - 1] - times[0];
  if (span < 7 * 86400000 || times.some((t, i) => !Number.isFinite(t) || (i > 0 && (t <= times[i-1] || t-times[i-1] > 28*86400000))) || points.some(p => chartFraction(p.value, max) === null)) return [];
  let ema = points[0].value;
  return points.map((p, i) => {
    if (i) ema += (1 - Math.pow(.5, (times[i] - times[i-1]) / 86400000 / halfLifeDays)) * (p.value - ema);
    return { ...p, x: (times[i] - times[0]) / span, observed: p.value / max, ema: ema / max };
  });
}
