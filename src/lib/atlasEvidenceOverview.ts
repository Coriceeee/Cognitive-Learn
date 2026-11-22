/**
 * CP65: descriptive inventory of records already present in the bundled registry.
 * A count is not national coverage, trend, admission probability, or verification.
 */
export type AtlasEvidenceRecord = {
  universityId: string;
  year: number;
  source: string;
  code: string;
  campus: string;
  method: string;
};

export type AtlasEvidenceYear = {
  year: number;
  records: number;
  universities: number;
  distinctSources: number;
};

export function summarizeAtlasEvidence(
  records: readonly AtlasEvidenceRecord[],
  years: readonly number[] = [2024, 2025, 2026],
): AtlasEvidenceYear[] {
  return years.map((year) => {
    const yearRecords = records.filter((record) => record.year === year);
    return {
      year,
      records: yearRecords.length,
      universities: new Set(yearRecords.map((record) => record.universityId).filter(Boolean)).size,
      distinctSources: new Set(yearRecords.map((record) => record.source?.trim()).filter(Boolean)).size,
    };
  });
}
