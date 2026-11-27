import test from "node:test";
import assert from "node:assert/strict";
import { readNumber, isBlankOrValid, allValid } from "../src/lib/inputValidation.ts";

test("Orion treats missing dynamic Seed subject scores as incomplete values", () => {
  const legacyScores = { math: "8.5", literature: "7.5" };
  const dynamicSeedSubject = "seed:Tin học";

  assert.equal(readNumber(legacyScores[dynamicSeedSubject], 0, 10), null);
  assert.equal(isBlankOrValid(legacyScores[dynamicSeedSubject], 0, 10), true);
  assert.equal(readNumber(undefined, 0, 10), null);
  assert.equal(readNumber(null, 0, 10), null);
});

test("shared numeric input validation preserves supported score parsing", () => {
  assert.equal(readNumber("", 0, 10), null);
  assert.equal(readNumber("  ", 0, 10), null);
  assert.equal(readNumber("8,5", 0, 10), 8.5);
  assert.equal(readNumber("10", 0, 10), 10);
  assert.equal(readNumber("-0.1", 0, 10), null);
  assert.equal(readNumber("10.1", 0, 10), null);
  assert.equal(readNumber("not-a-number", 0, 10), null);
});

test("blank and missing fields remain optional, but non-string malformed values are rejected", () => {
  assert.equal(isBlankOrValid(undefined, 0, 10), true);
  assert.equal(isBlankOrValid(null, 0, 10), true);
  assert.equal(isBlankOrValid("", 0, 10), true);
  assert.equal(isBlankOrValid("9.5", 0, 10), true);
  assert.equal(isBlankOrValid("11", 0, 10), false);
  assert.equal(isBlankOrValid({ value: "8" }, 0, 10), false);
  assert.equal(allValid([["8", 0, 10], ["9", 0, 10]]), true);
  assert.equal(allValid([[undefined, 0, 10]]), false);
});
