/** CP64 — view-only inventory of *entered* fields.
 * This must never become a psychological, academic or admission score.
 * A blank input is not zero; an invalid value is not counted as ready.
 */
import { readNumber } from "./inputValidation.ts";

export type ReadinessInput = {
  key: string;
  label: string;
  value: string;
  min?: number;
  max?: number;
  integer?: boolean;
};
export type ReadinessGroup = {
  key: string;
  title: string;
  fields: ReadinessInput[];
};
export type ReadinessState = "ready" | "missing" | "invalid";
export type ReadinessGroupResult = {
  key: string;
  title: string;
  total: number;
  ready: number;
  missing: number;
  invalid: number;
  fields: Array<{ key: string; label: string; state: ReadinessState }>;
};
export type ReadinessResult = {
  groups: ReadinessGroupResult[];
  total: number;
  ready: number;
  missing: number;
  invalid: number;
};

export function inspectModuleInputs(groups: ReadinessGroup[]): ReadinessResult {
  const keys = new Set<string>();
  const inspected = groups.map(group => {
    const fields = group.fields.map(field => {
      if (keys.has(field.key)) throw new Error(`Duplicate field key: ${field.key}`);
      keys.add(field.key);
      const state: ReadinessState = field.value.trim() === ""
        ? "missing"
        : field.min === undefined || field.max === undefined
          ? "ready"
          : readNumber(field.value, field.min, field.max, field.integer) === null
            ? "invalid" : "ready";
      return { key: field.key, label: field.label, state };
    });
    return {
      key: group.key, title: group.title, fields,
      total: fields.length,
      ready: fields.filter(field => field.state === "ready").length,
      missing: fields.filter(field => field.state === "missing").length,
      invalid: fields.filter(field => field.state === "invalid").length,
    };
  });
  return {
    groups: inspected,
    total: inspected.reduce((acc, group) => acc + group.total, 0),
    ready: inspected.reduce((acc, group) => acc + group.ready, 0),
    missing: inspected.reduce((acc, group) => acc + group.missing, 0),
    invalid: inspected.reduce((acc, group) => acc + group.invalid, 0),
  };
}
