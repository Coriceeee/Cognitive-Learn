import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { revokeStudentShares } from '../src/lib/studentShareRevocation.ts';

const ROOT = new URL('../', import.meta.url);
const page = readFileSync(new URL('src/page/seed/StudentConsentPage.tsx', ROOT), 'utf8');
const owner = 'student_001';
const linkA = 'student_001_teacher_001';
const linkB = 'student_001_parent_001';
function harness(ids = [linkA]) {
  const active = new Set(ids);
  const actions = [];
  const state = { uid: owner };
  return {
    actions, active, state,
    port: {
      currentUid: () => state.uid,
      listOwnedLinks: async () => { actions.push('query'); return [...active].slice(0, 40); },
      deleteSharedReport: async id => { actions.push(`report:${id}`); },
      deleteOwnedLink: async id => { actions.push(`link:${id}`); active.delete(id); },
    },
  };
}
test('SR01 withdrawal cleanup queries again and verifies empty server result', async () => {
  const h = harness([linkA, linkB]);
  const result = await revokeStudentShares(owner, h.port);
  assert.deepEqual(result, { revoked: 2, verifiedEmpty: true });
  assert.deepEqual(h.actions, ['query', `report:${linkA}`, `link:${linkA}`, `report:${linkB}`, `link:${linkB}`, 'query']);
});
test('SR02 student report must be removed BEFORE corresponding link', async () => {
  const h = harness();
  await revokeStudentShares(owner, h.port);
  assert.ok(h.actions.indexOf(`report:${linkA}`) < h.actions.indexOf(`link:${linkA}`));
});
test('SR03 cross-account link from untrusted snapshot fails closed', async () => {
  const h = harness(['student_002_teacher_001']);
  await assert.rejects(revokeStudentShares(owner, h.port), /FOREIGN_LINK/);
  assert.equal(h.actions.filter(a => a.startsWith('link:')).length, 0);
});
test('SR04 switching account aborts without deleting remaining links', async () => {
  const h = harness([linkA, linkB]);
  h.port.deleteOwnedLink = async id => { h.actions.push(`link:${id}`); h.state.uid = 'student_002'; h.active.delete(id); };
  await assert.rejects(revokeStudentShares(owner, h.port), /ACCOUNT_CHANGED/);
  assert.equal(h.active.size, 1);
});
test('SR05 delete report error blocks link removal, no misleading success', async () => {
  const h = harness();
  h.port.deleteSharedReport = async () => { throw new Error('permission-denied'); };
  await assert.rejects(revokeStudentShares(owner, h.port), /permission-denied/);
  assert.ok(h.active.has(linkA));
});
test('SR06 nonempty 25th page never yields verifiedEmpty=true', async () => {
  const h = harness();
  h.port.deleteOwnedLink = async () => {};
  const result = await revokeStudentShares(owner, h.port, 2);
  assert.equal(result.verifiedEmpty, false);
});
test('SR07 disallow invalid UID and oversized query pages', async () => {
  const h = harness();
  await assert.rejects(revokeStudentShares('..', h.port), /INVALID_OWNER/);
  h.port.listOwnedLinks = async () => Array(41).fill(linkA);
  await assert.rejects(revokeStudentShares(owner, h.port), /INVALID_PAGE/);
});
test('SR08 user withdrawal is committed BEFORE best-effort share cleanup', () => {
  const withdrawn = page.indexOf('await setDoc(doc(db, "student_consents", uid)');
  const cleanup = page.indexOf('await cleanupSharedLinks(uid);', withdrawn);
  assert.ok(withdrawn >= 0 && cleanup > withdrawn);
  assert.match(page, /getDocsFromServer\(q\)/);
  assert.match(page, /where\("studentId", "==", ownerUid\), limit\(40\)/);
});
test('SR09 UI shows retry on partial cleanup and warns about residual data', () => {
  assert.match(page, /shareCleanupPending &&/);
  assert.match(page, /Thử thu hồi liên kết còn tồn/);
  assert.match(page, /bản sao lưu/);
  assert.match(page, /if \(!result\.verifiedEmpty\)/);
});
