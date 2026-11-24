import test from "node:test";
import assert from "node:assert/strict";
import { compareProjectionToHistoricalCutoffs } from "../src/lib/examProjectionBenchmarks.ts";

const interest = "CNTT";
const completeA00 = { math: 8, physics: 8, chemistry: 8 };

test("lists only source-backed 2026 THPT references for complete projected combinations", () => {
  const report = compareProjectionToHistoricalCutoffs({ scores: completeA00, interest });
  const ptit = report.rows.find(row => row.universityId === "ptit" && row.majorCode === "7480201" && row.combinationCode === "A00");
  const dthu = report.rows.find(row => row.universityId === "dthu" && row.majorCode === "7480201" && row.combinationCode === "A00");
  assert.ok(ptit);
  assert.ok(dthu);
  assert.equal(ptit.cutoff, 23);
  assert.equal(dthu.cutoff, 19.35);
  for (const row of report.rows) {
    assert.equal(row.referenceYear, 2026);
    assert.equal(row.comparisonStatus, "BLOCKED_ADJUSTMENT_RULES");
    assert.equal(row.eligibility, "NOT_EVALUATED");
    assert.equal(row.probability, null);
    assert.ok(row.cutoffSource.startsWith("https://"));
    assert.ok(row.schemeSource.startsWith("https://"));
    assert.ok(["THPT", "DTHU_THPT", "HUST_THPT_A00", "USSH_THPT_C00", "USSH_THPT_D01"].some(method => row.id.includes(method)));
    assert.equal("projectedScore" in row, false);
    assert.equal("gap" in row, false);
  }
});

test("converted composite and aptitude methods never masquerade as THPT cutoffs", () => {
  const report = compareProjectionToHistoricalCutoffs({ scores: completeA00 });
  assert.ok(report.rows.length > 0);
  assert.ok(report.rows.every(row => !/HSA|TSA|SAT|COMPOSITE|COMMON|HOC_BA/i.test(row.id + " " + row.method)));
});

test("missing subjects remain missing while explicit zero is valid observed input", () => {
  const incomplete = compareProjectionToHistoricalCutoffs({ scores: { math: 8, physics: 8 }, interest });
  assert.equal(incomplete.rows.length, 0);
  const zero = compareProjectionToHistoricalCutoffs({ scores: { math: 0, physics: 0, chemistry: 0 }, interest });
  assert.ok(zero.rows.some(row => row.universityId === "ptit" && row.majorCode === "7480201" && row.combinationCode === "A00"));
});

test("rejects invalid scales and unsupported reference years without imputing data", () => {
  assert.equal(compareProjectionToHistoricalCutoffs({ scores: { math: 11, physics: 8, chemistry: 8 }, interest }).rows.length, 0);
  assert.equal(compareProjectionToHistoricalCutoffs({ scores: completeA00, interest, referenceYear: 2025 }).rows.length, 0);
});

test("explains why cutoff gaps and admission probabilities are blocked", () => {
  const report = compareProjectionToHistoricalCutoffs({ scores: completeA00, interest });
  assert.equal(report.version, "exam-projection-reference-v2");
  assert.ok(report.limitations.some(note => note.includes("điểm cộng, điểm ưu tiên")));
  assert.ok(report.limitations.some(note => note.includes("không tính chênh lệch")));
});

test("Atlas renders cutoff sources without comparing raw mock scores to final cutoffs", async () => {
  const { readFile } = await import("node:fs/promises");
  const ui = await readFile(new URL("../src/page/atlas/components/AtlasAdmissionEnginePanel.tsx", import.meta.url), "utf8");
  const start = ui.indexOf('className="atlas-projection-benchmark"');
  const end = ui.indexOf("{!engineResult ? (", start);
  const section = ui.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(section, /Mốc tuyển sinh THPT 2026 theo tổ hợp có đủ điểm dự báo/);
  assert.match(section, /không tính chênh lệch/);
  assert.match(section, /điểm cộng, điểm ưu tiên/);
  assert.doesNotMatch(section, /projectedScore|row\.gap|row\.relation|Chênh lệch/);
  assert.match(ui, /chưa được so sánh trực tiếp với điểm chuẩn/);
});
