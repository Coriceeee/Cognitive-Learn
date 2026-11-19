/** Static contract smoke tests. They CANNOT verify actual Firestore security behavior. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const rules = readFileSync('firestore.rules.CANDIDATE_CP21', 'utf8');
const cases = [
  ['rules v2', /rules_version\s*=\s*'2'/],
  ['user doc own-id guard', /request\.auth\.uid\s*==\s*uid/],
  ['active role gate', /get\(userPath\(request\.auth\.uid\)\)\.data\.active\s*==\s*true/],
  ['prevent self-registration of admin', /request\.resource\.data\.role == 'student'/],
  ['lock elective selection', /function preserveLockedElectives\(/],
  ['four unique electives', /selected\.size\(\)\s*==\s*4[\s\S]*?selected\[2\]\s*!=\s*selected\[3\]/],
  ['foreign language not equal to elective', /!curriculum\.selectedElectives\.hasAny\(\[curriculum\.foreignLanguage\]\)/],
  ['transcript path protected', /match \/student_transcripts\/\{uid\}/],
  ['scope validation', /function validDataScope\(/],
  ['append-only cognitive history', /match \/cognitive_history\/\{snapshotId\}/],
  ['retired shared reports cannot be created or reviewed', /match \/student_shared_reports\/\{linkId\}[\s\S]*?allow list, create, update: if false;/],
  ['cp24 append-only provenance collection', /match \/pipeline_evidence\/\{uid\}\/checks\/\{checkId\}/],
  ['cp24 forbid update and delete provenance', /match \/pipeline_evidence\/\{uid\}\/checks\/\{checkId\}[\s\S]*?allow update, delete: if false;/],
  ['cp24 no PII through schema whitelist', /function validPipelineEvidence\(uid\)[\s\S]*?data\.keys\(\)\.hasOnly/],
  ['no public system health access', /match \/system_health\/\{document\}\s*\{\s*allow read, write: if false;/],
];
for (const [name, pattern] of cases) {
  test('STATIC ONLY ' + name, () => assert.match(rules, pattern));
}
