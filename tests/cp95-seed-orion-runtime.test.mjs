import test from "node:test";
import assert from "node:assert/strict";
import { getNineGradedSubjects, isValidElectiveSelection } from "../src/page/seed/services/academicCurriculum.ts";

const selectedElectives = ["Vật lý", "Tin học", "Công nghệ", "Âm nhạc"];

test("Seed curriculum produces the exact nine-subject catalog consumed by Orion", () => {
  const subjects = getNineGradedSubjects("Tiếng Nhật", selectedElectives);
  assert.deepEqual(subjects, [
    "Toán", "Ngữ văn", "Tiếng Nhật", "Lịch sử",
    "Giáo dục quốc phòng và an ninh", ...selectedElectives,
  ]);
  assert.equal(subjects.length, 9);
  assert.equal(new Set(subjects).size, 9);
});

test("Seed accepts exactly four distinct supported electives for the locked curriculum", () => {
  assert.equal(isValidElectiveSelection(selectedElectives), true);
  assert.equal(isValidElectiveSelection(["Vật lý", "Tin học", "Công nghệ"]), false);
  assert.equal(isValidElectiveSelection(["Vật lý", "Vật lý", "Công nghệ", "Âm nhạc"]), false);
  assert.equal(isValidElectiveSelection(["Vật lý", "Tin học", "Công nghệ", "Môn tự chọn"]), false);
});
