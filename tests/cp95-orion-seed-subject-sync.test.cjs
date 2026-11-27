'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const page=fs.readFileSync('src/page/orion/OrionPage.tsx','utf8');
const curriculum=fs.readFileSync('src/page/seed/services/transcriptData.ts','utf8');
const seedPage=fs.readFileSync('src/page/seed/StudentProfilePage.tsx','utf8');

test('Orion derives its displayed subject list from the verified Seed transcript',()=>{
  assert.match(page,/transcript\.data\.currentSubjects\.map\(subject => \[getOrionSubjectKey\(subject\), subject\]\)/);
  assert.match(page,/transcript\.status !== "ready"/);
  assert.match(page,/activeSubjectKeys\.map/);
  assert.doesNotMatch(page,/const subjectLabels: Record<ScoreKey/);
  assert.doesNotMatch(page,/Orion hiện hỗ trợ sáu môn/);
  assert.match(curriculum,/const currentSubjects = subjects;/);
});

test('Orion keeps legacy draft keys while supporting Seed subjects outside the old six-subject list',()=>{
  assert.match(page,/"Ngữ văn": "literature"/);
  assert.match(page,/"Tiếng Anh": "english"/);
  assert.match(page,/return LEGACY_SUBJECT_KEYS\[subject\] \?\? `seed:\$\{subject\}`/);
  assert.match(page,/value=\{scores\[key\] \?\? ""\}/);
  assert.match(page,/value=\{targets\[key\] \?\? ""\}/);
});

test('Orion score prefill is mapped from Seed transcript subjects, not a fixed six-subject map',()=>{
  assert.match(page,/transcript\.data\?\.currentSubjects \?\? \[\]/);
  assert.match(page,/getOrionSubjectKey\(subject\)/);
});

test('Seed locks the chosen four electives and foreign language after the first saved curriculum',()=>{
  assert.match(seedPage,/lockedElectives !== null \|\| !profileReady/);
  assert.match(seedPage,/lockedForeignLanguage !== null/);
  assert.match(seedPage,/electiveSelectionLocked:\s*true/);
  assert.match(seedPage,/setLockedElectives\(\[\.\.\.selectedElectives\]\)/);
  assert.match(seedPage,/setLockedForeignLanguage\(profile\.foreignLanguage\)/);
});
