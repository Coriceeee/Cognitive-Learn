/**
 * Build Orion's subject catalog from the active student's server-verified Seed curriculum.
 * An empty transcript still has a valid locked curriculum; only grade prefill is ready-only.
 */
export type OrionSubjectCatalogInput = Readonly<{
  draftOwnerUid: string | null;
  transcriptOwnerUid: string | null;
  transcriptStatus: string;
  currentSubjects: readonly string[] | null;
}>;

const LEGACY_SUBJECT_KEYS: Readonly<Record<string, string>> = {
  "Toán": "math", "Ngữ văn": "literature", "Văn": "literature",
  "Tiếng Anh": "english", "Anh": "english", "Vật lý": "physics", "Lý": "physics",
  "Hóa học": "chemistry", "Hóa": "chemistry", "Sinh học": "biology", "Sinh": "biology",
};

export function getOrionSubjectKey(subject: string): string {
  return LEGACY_SUBJECT_KEYS[subject] ?? `seed:${subject}`;
}

export function buildOrionSubjectCatalog(input: OrionSubjectCatalogInput): Record<string, string> {
  if (!input.draftOwnerUid || input.transcriptOwnerUid !== input.draftOwnerUid
    || !["ready", "empty"].includes(input.transcriptStatus)
    || !Array.isArray(input.currentSubjects)) return {};
  const unique = Array.from(new Set(input.currentSubjects.filter(
    subject => typeof subject === "string" && subject.trim().length > 0,
  )));
  return Object.fromEntries(unique.map(subject => [getOrionSubjectKey(subject), subject]));
}
