/** Existing production proxy formula, extracted without changing its version/weights. */
export const COGNITIVE_COMPOSITE_WEIGHTS = {SCI:.3,MAS:.25,CSL:.2,CRI:.25} as const;
export type CompositeCode=keyof typeof COGNITIVE_COMPOSITE_WEIGHTS;
export function computeCognitiveComposite(values:Record<CompositeCode,number>):number {
 const w=COGNITIVE_COMPOSITE_WEIGHTS;
 return Math.round(values.SCI*w.SCI+values.MAS*w.MAS+values.CSL*w.CSL+values.CRI*w.CRI);
}
