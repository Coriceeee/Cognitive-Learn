import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getComparableAtlasBenchmark,
  mapAtlasProgramsToAdmissionRules,
} from "../src/lib/atlasBenchmarkBridge.ts";
import { validateAdmissionProgram } from "../src/lib/admissionRules.ts";

const programSource = {
  id: "program-source-2026", universityId: "school-1", title: "Đề án trường năm 2026",
  sourceType: "admission_scheme", sourceUrl: "https://tuyensinh.test-university.edu.vn/de-an-2026",
  sourceYear: 2026, extractedBy: "Manual", status: "verified", updatedAt: "2026-11-11",
};
const cutoffSource = {
  ...programSource, id: "cutoff-source-2026", title: "Công bố điểm chuẩn 2026",
  sourceUrl: "https://tuyensinh.test-university.edu.vn/diem-chuan-2026",
};
const sources = [programSource, cutoffSource];
const universityMap = {
  "school-1": { id: "school-1", name: "Trường thử nghiệm", shortName: "TTN", region: "VN", website: "", verified: true },
};
const program = {
  id: "program-1", universityId: "school-1", majorName: "Công nghệ thông tin", majorCode: "7480201",
  combinations: ["A00"], methods: ["THPT"], tuitionLabel: "Chưa xác minh",
  scholarshipLabel: "Chưa xác minh", sourceIds: [programSource.id], sourceYear: 2026,
  status: "verified", benchmark: { value: 25, year: 2026, method: "THPT", sourceIds: [cutoffSource.id], status: "verified" },
};
const grades = {
  combinationOptions: [{ combinationCode: "A00", combinationLabel: "A00", subjects: ["math", "physics", "chemistry"],
    rawScore: 28, convertedScore: 28, normalizedScore: 93.333, missingSubjects: [], warnings: [] }],
  externalOptions: [], bestOption: { label: "A00", method: "COMBINATION", score: 28, normalizedScore: 93.333 }, warnings: [],
};
const status = (overrides = {}, sourceSet = sources) => getComparableAtlasBenchmark({ ...program, ...overrides }, sourceSet);

test("04.01 verified benchmark with two matching source records is passed to admission comparison", () => {
  const benchmark = status();
  assert.ok(benchmark);
  assert.equal(benchmark.value, 25);
  assert.equal(benchmark.year, 2026);
  assert.deepEqual(benchmark.sourceUrls, [cutoffSource.sourceUrl]);
  const [mapped] = mapAtlasProgramsToAdmissionRules([program], sources, universityMap);
  assert.equal(mapped.benchmarkVerified, true);
  assert.equal(mapped.benchmarkScore, 25);
  assert.equal(mapped.benchmarkYear, 2026);
  assert.equal(mapped.benchmarkMethod, "THPT");
  assert.equal(validateAdmissionProgram({ program: mapped, scoreReport: grades }).riskLevel, "SAFE");
});

test("04.02 missing, pending or rejected cutoff cannot be compared", () => {
  assert.equal(status({ benchmark: undefined }), null);
  for (const state of ["pending", "rejected"]) {
    assert.equal(status({ benchmark: { ...program.benchmark, status: state } }), null);
    assert.equal(status({}, [programSource, { ...cutoffSource, status: state }]), null);
  }
});

test("04.03 historical 2025 cutoff cannot be presented as a 2026 benchmark", () => {
  assert.equal(status({ benchmark: { ...program.benchmark, year: 2025 } }), null);
  assert.equal(status({}, [programSource, { ...cutoffSource, sourceYear: 2025 }]), null);
});

test("04.04 THPT-only, valid 0-30 scale (not SAT, HSA, nor invalid numbers)", () => {
  for (const method of ["SAT", "HSA", "HOC_BA", undefined]) {
    assert.equal(status({ benchmark: { ...program.benchmark, method } }), null);
  }
  for (const value of [-1, 30.01, NaN, Infinity]) {
    assert.equal(status({ benchmark: { ...program.benchmark, value } }), null);
  }
  assert.equal(status({ methods: ["SAT"] }), null);
});

test("04.05 evidence must be linked to the same school and year", () => {
  assert.equal(status({}, [programSource, { ...cutoffSource, universityId: "other-school" }]), null);
  assert.equal(status({}, [{ ...programSource, universityId: "other-school" }, cutoffSource]), null);
  assert.equal(status({}, [{ ...programSource, sourceYear: 2025 }, cutoffSource]), null);
});

test("04.06 missing, dangling, or rejected references cannot be partially approved", () => {
  assert.equal(status({ sourceIds: [] }), null);
  assert.equal(status({ sourceIds: [programSource.id, "missing-record"] }), null);
  assert.equal(status({ benchmark: { ...program.benchmark, sourceIds: [cutoffSource.id, "missing-cutoff"] } }), null);
  assert.equal(status({}, [{ ...programSource, status: "rejected" }, cutoffSource]), null);
});

test("04.06b ambiguous duplicate source IDs cannot be approved", () => {
  assert.equal(status({}, [...sources, { ...cutoffSource, status: "pending" }]), null);
  assert.equal(status({}, [...sources, { ...programSource, status: "pending" }]), null);
});

test("04.07 placeholder, insecure or sample source links cannot enable an official comparison", () => {
  for (const url of ["#", "http://school.edu.vn", "https://example.com/cutoff", "not-a-url", "https://localhost/a"]) {
    assert.equal(status({}, [programSource, { ...cutoffSource, sourceUrl: url }]), null, url);
  }
});

test("04.08 pending programs cannot be ranked, even with a verified cutoff", () => {
  assert.equal(status({ status: "pending" }), null);
  assert.equal(status({ status: "rejected" }), null);
  const [mapped] = mapAtlasProgramsToAdmissionRules([{ ...program, status: "pending" }], sources, universityMap);
  assert.equal(mapped.benchmarkVerified, false);
  assert.equal(validateAdmissionProgram({ program: mapped, scoreReport: grades }).riskLevel, "INVALID");
});

test("04.09 records without source evidence remain invalid and do not become a fallback ranking", () => {
  const [mapped] = mapAtlasProgramsToAdmissionRules([{ ...program, benchmark: undefined }], sources, universityMap);
  assert.equal(mapped.benchmarkScore, undefined);
  assert.equal(mapped.benchmarkVerified, false);
  assert.equal(validateAdmissionProgram({ program: mapped, scoreReport: grades }).valid, false);
});

test("04.10 application passes sources to bridge and prints reference year and source URL", () => {
  const page = readFileSync(new URL("../src/page/atlas/AtlasPage.tsx", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../src/page/atlas/components/AtlasAdmissionEnginePanel.tsx", import.meta.url), "utf8");
  assert.match(page, /<AtlasAdmissionEnginePanel\s+programs=\{programs\}\s+sources=\{sources\}/);
  assert.match(panel, /mapAtlasProgramsToAdmissionRules\(/);
  assert.match(panel, /Xem nguồn điểm chuẩn/);
  assert.match(panel, /Mốc tham chiếu THPT năm/);
});
