const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const rules=readFileSync('firestore.rules.CANDIDATE_CP21','utf8');
const ui=readFileSync('src/page/seed/StudentProfilePage.tsx','utf8');
const emulator=readFileSync('tests/firestore.rules.cp21.test.mjs','utf8');
const checks=[
 ['identity lock enforces foreign language and selected electives',()=>{assert.match(rules,/function sameAcademicIdentity\(/);assert.match(rules,/previous\.foreignLanguage == next\.foreignLanguage/);assert.match(rules,/previous\.selectedElectives == next\.selectedElectives/)}],
 ['legacy identity fails closed',()=>{assert.match(rules,/function preserveLockedElectives\([\s\S]*?return previous is map && next is map/)}],
 ['both academic document cross-checks use identity',()=>{assert.match(rules,/function legacySelectedElectives[\s\S]*?sameAcademicIdentity/);assert.match(rules,/function matchesStoredTranscript[\s\S]*?sameAcademicIdentity/);assert.equal((rules.match(/existsAfter\(path\)/g)||[]).length,2);assert.ok((rules.match(/getAfter\(path\)/g)||[]).length>=2)}],
 ['transcript writes validate 3 years and whitelisted 9 subjects',()=>{assert.match(rules,/function validThreeYearTranscript\(/);assert.match(rules,/transcript\.keys\(\)\.hasOnly\(\['grade10', 'grade11', 'grade12'\]\)/);assert.equal((rules.match(/validThreeYearTranscript\(request\.resource\.data\.transcript, request\.resource\.data\.curriculum\)/g)||[]).length,2)}],
 ['student UI blocks changing locked language',()=>{assert.match(ui,/disabled=\{lockedForeignLanguage !== null \|\| !profileReady\}/);assert.match(ui,/profile\.foreignLanguage !== lockedForeignLanguage/)}],
 ['student UI fails closed on corrupt previous transcripts',()=>{assert.match(ui,/findForeignTranscriptSubject\(academic\.transcript, lockedIdentity\)/);assert.match(ui,/saved\.exists\(\) && !storedProfileIdentity/)}],
 ['server emulator cases are retained',()=>{for(const id of ['S20','S21','S22','S23','S24','S25','S26','S27']) assert.match(emulator,new RegExp(`test\\('${id} `))}],
];
for(const [name,fn] of checks)test(`CP29 lock contract: ${name}`,fn);
