import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  registerNavigationGuard, canNavigate, isLeavingDraftWorkspace,
} from '../src/lib/draftNavigationGuard.ts';
const hook = readFileSync(new URL('../src/lib/useModuleDraft.ts', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../src/lib/clientNavigation.ts', import.meta.url), 'utf8');

test('CP56.1 same workspace sub-tabs keep unsaved work without prompt', () => {
  for (const module of ['orion', 'pulse', 'haven']) {
    assert.equal(isLeavingDraftWorkspace(module, `/${module}`), false);
    assert.equal(isLeavingDraftWorkspace(module, `/${module}/inputs?q=1`), false);
    assert.equal(isLeavingDraftWorkspace(module, `/${module}/finance#x`), false);
    assert.equal(isLeavingDraftWorkspace(module, `/${module}-other`), true);
    assert.equal(isLeavingDraftWorkspace(module, '/student'), true);
  }
});

test('CP56.2 explicit allow, deny and unregister work without storing PII', () => {
  const release = registerNavigationGuard((_from, to) => to !== '/atlas');
  try {
    assert.equal(canNavigate('/orion','/atlas'), false);
    assert.equal(canNavigate('/orion','/orion'), true);
    assert.equal(canNavigate('/orion','/orion/scenarios'), true);
  } finally { release(); }
  assert.equal(canNavigate('/orion','/atlas'), true);
});

test('CP56.3 guard registry rejects navigation if any active draft rejects', () => {
  const first = registerNavigationGuard(() => true);
  const second = registerNavigationGuard(() => false);
  try { assert.equal(canNavigate('/orion', '/student'), false); }
  finally { first(); second(); }
  assert.equal(canNavigate('/orion','/student'), true);
});

test('CP56.4 hook registers and removes SPA and beforeunload guards', () => {
  assert.match(hook, /registerNavigationGuard\(\(_from, to\) => \{/);
  assert.match(hook, /editing\.current \|\| !isLeavingDraftWorkspace\(moduleName, to\)/);
  assert.match(hook, /window\.addEventListener\("beforeunload", warnBeforeUnload\)/);
  assert.match(hook, /event\.preventDefault\(\)/);
  assert.match(hook, /unregister\(\);/);
  assert.match(hook, /window\.removeEventListener\("beforeunload", warnBeforeUnload\)/);
});

test('CP56.5 hook does not treat an edit as saved until the server confirms it', () => {
  assert.match(hook, /editing\.current = true;/);
  assert.match(hook, /const nextRevision = await runTransaction/);
  assert.match(hook, /if \(queuedEdit === editGeneration\.current\) \{\s*editing\.current = false;/);
  assert.match(hook, /conflictRef\.current = true;/);
});

test('CP56.6 both click and imperative navigation use the central guard', () => {
  assert.match(nav, /event\.preventDefault\(\);\s*navigateTo\(/);
  assert.match(nav, /if \(!canNavigate\(currentLocation\(\), destination\)\) return;/);
});

test('CP56.7 rejected popstate restores location and leaves view mounted', () => {
  const pop = nav.split('function handlePopState(): void {')[1]?.split('\n}')[0];
  assert.ok(pop);
  assert.match(pop, /!canNavigate\(current, destination\)/);
  assert.match(pop, /window\.history\.pushState\(window\.history\.state, '', current\)/);
  assert.ok(pop.indexOf('pushState') < pop.indexOf("notify('pop')"));
});

test('CP56.8 do not persist draft data to browser localStorage or sessionStorage', () => {
  const guard = readFileSync(new URL('../src/lib/draftNavigationGuard.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(guard+hook, /localStorage|sessionStorage/);
});

test('CP56.9 explicit logout also respects pending unsaved drafts', () => {
  const menu = readFileSync(new URL('../src/components/common/UserMenu.tsx', import.meta.url), 'utf8');
  const logout = menu.split('async function handleLogout() {')[1]?.split('return (')[0];
  assert.ok(logout);
  assert.match(logout, /if \(!canNavigate\(from, "\/"\)\) return;/);
  assert.ok(logout.indexOf('canNavigate') < logout.indexOf('await signOut(auth)'));
});
