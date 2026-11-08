/** Static contract smoke tests. They CANNOT verify actual Firestore security behavior. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const rules = readFileSync('firestore.rules.CANDIDATE_CP21', 'utf8');
const cases = [
  ['rules v2', /rules_version\s*=\s*'2'/],
  ['user doc own-id guard', /request\.auth\.uid\s*==\s*uid/],
  ['active role gate', /get\(userPath\(request\.auth\.uid\)\)\.data\.active\s*==\s*true/],
  ['prevent self-registration of admin', /role\s+in\s*\['student',\s*'teacher',\s*'parent'\]/],
  ['lock elective selection', /function preserveLockedElectives\(/],
  ['four unique electives', /selected\.size\(\)\s*==\s*4[\s\S]*?selected\[2\]\s*!=\s*selected\[3\]/],
  ['foreign language not equal to elective', /!curriculum\.selectedElectives\.hasAny\(\[curriculum\.foreignLanguage\]\)/],
  ['transcript path protected', /match \/student_transcripts\/\{uid\}/],
  ['scope validation', /function validDataScope\(/],
  ['append-only cognitive history', /match \/cognitive_history\/\{snapshotId\}/],
  ['teacher/parent report review constrained', /function validOneTimeReview\(/],
  ['no public system health access', /match \/system_health\/\{document\}\s*\{\s*allow read, write: if false;/],
];
for (const [name, pattern] of cases) {
  test('STATIC ONLY ' + name, () => assert.match(rules, pattern));
}
