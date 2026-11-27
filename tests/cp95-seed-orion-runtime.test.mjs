import test from "node:test";
import assert from "node:assert/strict";
import { buildTranscriptView } from "../src/page/seed/services/transcriptData.ts";

const selectedElectives = ["Vật lý", "Tin học", "Công nghệ", "Âm nhạc"];
const expectedSubjects = [
  "Toán", "Ngữ văn", "Tiếng Nhật", "Lịch sử",
  "Giáo dục quốc phòng và an ninh", ...selectedElectives,
];

test("Seed curriculum produces the exact nine-subject catalog consumed by Orion", () => {
  const view = buildTranscriptView({
    curriculum: {
      program: "GDPT 2018",
      foreignLanguage: "Tiếng Nhật",
      selectedElectives,
      electiveSelectionLocked: true,
    },
    transcript: {},
  });

  assert.deepEqual(view.currentSubjects, expectedSubjects);
  assert.equal(view.currentSubjects.length, 9);
  assert.deepEqual(view.terms[0].subjects.map((row) => row.subject), expectedSubjects);
});

test("Seed-to-Orion source data preserves zero, partial and missing scores without inventing values", () => {
  const view = buildTranscriptView({
    curriculum: {
      foreignLanguage: "Tiếng Anh",
      selectedElectives: ["Vật lý", "Hóa học", "Sinh học", "Địa lý"],
    },
    transcript: {
      grade12: {
        semester1: {
          "Toán": { regular: ["0"], midterm: "0", final: "0" },
          "Ngữ văn": { regular: ["8"], midterm: "", final: "" },
          "Tiếng Anh": { regular: [], midterm: "", final: "" },
        },
      },
    },
  });

  const term = view.terms.find((item) => item.grade === "grade12" && item.semester === "semester1");
  assert.ok(term);
  const bySubject = Object.fromEntries(term.subjects.map((row) => [row.subject, row]));
  assert.equal(bySubject["Toán"].average, 0);
  assert.equal(bySubject["Toán"].provisional, 0);
  assert.equal(bySubject["Toán"].status, "COMPLETE");
  assert.equal(bySubject["Ngữ văn"].average, null);
  assert.equal(bySubject["Ngữ văn"].provisional, 8);
  assert.equal(bySubject["Ngữ văn"].status, "PARTIAL");
  assert.equal(bySubject["Tiếng Anh"].provisional, null);
  assert.equal(bySubject["Tiếng Anh"].status, "MISSING");
});
