const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('src/page/orion/OrionPage.tsx','utf8');
test('CP50 Orion: incoming snapshot cannot overwrite unsaved local edits', () => {
  assert.match(source, /if \(!savedDraft \|\| dirtyRevision\.current\) return/);
  assert.match(source, /dirtyRevision\.current = true/);
});
test('CP50 Orion: autosave validates weeks and scores before persistence', () => {
  const autoSave = source.slice(source.indexOf('autosaveTimer.current = window.setTimeout'), source.indexOf('function markLocalEdit'));
  assert.match(autoSave, /isBlankOrValid\(payload\.weeksLeft, 1, 104, true\)/);
  assert.match(autoSave, /isBlankOrValid\(v, 0, 10\)/);
  assert.ok(autoSave.indexOf('isBlankOrValid(payload.weeksLeft') < autoSave.indexOf('await saveDraft(payload)'));
});
test('CP50 Orion: async saves cannot clear newer edits', () => {
  const manualSave = source.slice(source.indexOf('async function saveCurrentDraft'), source.indexOf('const subjects:'));
  assert.match(manualSave, /const revision = editRevision\.current/);
  assert.match(manualSave, /if \(editRevision\.current === revision\)/);
  assert.match(manualSave, /thay đổi mới đang chờ tự lưu/);
});
