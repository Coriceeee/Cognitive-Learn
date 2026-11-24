import type { PulseLinkedSignal } from "./pulseLinkedSourceModel";

export type PulseMissingAction = {
  source: PulseLinkedSignal["source"];
  href: string;
  items: PulseLinkedSignal[];
};

/** Group missing signals by the actual destination, never by display label.
 * Pending/error states are not evidence that a student omitted data. */
export function groupPulseMissingActions(
  signals: readonly PulseLinkedSignal[], loading: boolean, errors: readonly string[],
): PulseMissingAction[] {
  if (loading || errors.length > 0) return [];
  const groups = new Map<string, PulseMissingAction>();
  for (const item of signals) {
    if (item.value !== null) continue;
    const key = JSON.stringify([item.source, item.href]);
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { source: item.source, href: item.href, items: [item] });
  }
  return [...groups.values()];
}
