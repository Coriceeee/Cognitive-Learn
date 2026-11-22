import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDraftUnchanged, draftPayloadSignature, draftVersion, DraftConflictError } from '../src/lib/draftRevision.ts';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const readSource = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const hookSource = readSource('src/lib/useModuleDraft.ts');

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) :
    /\.(ts|tsx)$/.test(entry.name) ? [join(dir, entry.name)] : []);
}

test('CP53.1: all directly called React hooks are imported (offline build preflight)', () => {
  const hooks = ['useRef', 'useMemo', 'useState', 'useEffect', 'useCallback', 'useContext',
    'useReducer', 'useLayoutEffect', 'useId', 'useSyncExternalStore'];
  const failures = [];
  for (const filename of sourceFiles(root)) {
    const source = readFileSync(filename, 'utf8');
    const imports = [...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]react['"]/gs)];
    const named = new Set(imports.flatMap(([, group]) => group.split(',')
      .map(item => item.trim().split(/\s+as\s+/).pop())));
    for (const hook of hooks) {
      // Detect generic invocations such as useRef<string | null>(null) too.
      if (new RegExp(`(?<![\\w.])${hook}\\s*(?:<|\\()`).test(source) && !named.has(hook)) {
        failures.push(`${filename.slice(root.length + 1)}: ${hook} is used without a React import`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('CP53.2: acknowledged write cannot be replaced at same revision with different payload', () => {
  const locallySaved = { scores: { math: '8.25', english: '9' }, weeksLeft: '12' };
  const expected = { exists: true, revision: 3, signature: '', payloadSignature: draftPayloadSignature(locallySaved) };
  const staleWriter = draftVersion({ revision: 3, data: { ...locallySaved, weeksLeft: '1' }, updatedAt: { seconds: 2026, nanoseconds: 10 } });
  assert.throws(() => assertDraftUnchanged(expected, staleWriter), DraftConflictError);
});

test('CP53.3: acknowledged payload signature is stable for same values with shuffled keys', () => {
  const payload = { scores: { math: '7.5', english: '8.4' }, weeksLeft: '24' };
  const expected = { exists: true, revision: 9, signature: '', payloadSignature: draftPayloadSignature(payload) };
  const same = draftVersion({ revision: 9, data: { weeksLeft: '24', scores: { english: '8.4', math: '7.5' } }, updatedAt: { seconds: 1, nanoseconds: 0 } });
  assert.doesNotThrow(() => assertDraftUnchanged(expected, same));
});

test('CP53.4: approved save records payload signature while server timestamp resolves', () => {
  assert.match(hookSource, /payloadSignature: draftPayloadSignature\(value\)/);
  assert.match(hookSource, /assertDraftUnchanged\(expected, draftVersion\(stored\)\)/);
  assert.match(hookSource, /transaction\.set\(ref,/);
});

test('CP53.5: same-revision replay remains invalid even when timestamp is unavailable', () => {
  const saved = { gpa: '9', financialNeed: '60' };
  const expected = { exists: true, revision: 1, signature: '', payloadSignature: draftPayloadSignature(saved) };
  assert.throws(() => assertDraftUnchanged(expected, draftVersion({ revision: 1, data: { gpa: '8', financialNeed: '60' } })), DraftConflictError);
  assert.throws(() => assertDraftUnchanged(expected, draftVersion(null)), DraftConflictError);
  assert.throws(() => assertDraftUnchanged(expected, draftVersion({ revision: 2, data: saved })), DraftConflictError);
});
