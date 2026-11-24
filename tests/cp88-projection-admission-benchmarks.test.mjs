import test from "node:test";
import assert from "node:assert/strict";
import { compareProjectionToHistoricalCutoffs } from "../src/lib/examProjectionBenchmarks.ts";

const interest = "CNTT";
const completeA00 = { math: 8, physics: 8, chemistry: 8 };

test("compares only same-scale published THPT cutoffs with source-listed combinations", () => {
  const report = compareProjectionToHistoricalCutoffs({ scores: completeA00, interest });
  const ptit = report.rows.find(row => row.universityId === "ptit" && row.majorCode === "7480201" && row.combinationCode === "A00");
  const dthu = report.rows.find(row => row.universityId === "dthu" && row.majorCode === "7480201" && row.combinationCode === "A00");
  assert.ok(ptit);
  assert.ok(dthu);
  assert.equal(ptit.projectedScore, 24);
  assert.equal(ptit.cutoff, 23);
  assert.equal(ptit.gap, 1);
  assert.equal(dthu.projectedScore, 24);
  assert.equal(dthu.cutoff, 19.35);
  assert.equal(dthu.gap, 4.65);
  for (const row of report.rows) {
    assert.equal(row.referenceYear, 2026);
    assert.equal(row.eligibility, "NOT_EVALUATED");
    assert.equal(row.probability, null);
    assert.ok(row.cutoffSource.startsWith("https://"));
    assert.ok(row.schemeSource.startsWith("https://"));
    assert.ok(["THPT", "DTHU_THPT", "HUST_THPT_A00", "USSH_THPT_C00", "USSH_THPT_D01"].some(method => row.id.includes(method)));
  }
});

test("converted composite and aptitude methods never masquerade as THPT cutoffs", () => {
  const report = compareProjectionToHistoricalCutoffs({ scores: completeA00 });
  assert.ok(report.rows.length > 0);
  assert.ok(report.rows.every(row => !/HSA|TSA|SAT|COMPOSITE|COMMON|HOC_BA/i.test(row.id + " " + row.method)));
});

test("missing subjects remain missing while explicit zero is a valid observed score", () => {
  const incomplete = compareProjectionToHistoricalCutoffs({ scores: { math: 8, physics: 8 } , interest });
  assert.equal(incomplete.rows.length, 0);
  const zero = compareProjectionToHistoricalCutoffs({ scores: { math: 0, physics: 0, chemistry: 0 }, interest });
  const ptit = zero.rows.find(row => row.universityId === "ptit" && row.majorCode === "7480201" && row.combinationCode === "A00");
  assert.ok(ptit);
  assert.equal(ptit.projectedScore, 0);
  assert.equal(ptit.relation, "BELOW");
});

test("rejects invalid scales and unsupported reference years without imputing data", () => {
  assert.equal(compareProjectionToHistoricalCutoffs({ scores: { math: 11, physics: 8, chemistry: 8 }, interest }).rows.length, 0);
  assert.equal(compareProjectionToHistoricalCutoffs({ scores: completeA00, interest, referenceYear: 2025 }).rows.length, 0);
});

test("reports the comparison as a historical reference, never admission probability", () => {
  const report = compareProjectionToHistoricalCutoffs({ scores: completeA00, interest });
  assert.equal(report.version, "exam-projection-thpt-reference-v1");
  assert.ok(report.limitations.some(note => note.includes("không phải xác suất trúng tuyển")));
  assert.ok(report.limitations.some(note => note.includes("phương thức khác")));
});

test("Atlas renders the historical comparison separately from admission eligibility", async () => {
  const { readFile } = await import("node:fs/promises");
  const ui = await readFile(new URL("../src/page/atlas/components/AtlasAdmissionEnginePanel.tsx", import.meta.url), "utf8");
  assert.match(ui, /scoreBasis !== "projection"/);
  assert.match(ui, /compareProjectionToHistoricalCutoffs/);
  assert.match(ui, /Kịch bản thi thử so với điểm chuẩn THPT 2026/);
  assert.match(ui, /Không phải dự báo đỗ cho kỳ tuyển sinh tiếp theo/);
  assert.match(ui, /Không dùng kịch bản thi thử để xác nhận điều kiện/);
  assert.match(ui, /row\.eligibility/); 
  assert.doesNotMatch(ui, /projectionBenchmarkReport\.rows[\s\S]{0,1500}getRiskLabel/);
});
