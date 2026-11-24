import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { studentDataSignals, countAvailableSignals } from '../src/lib/studentSignalRail.ts';

const page = readFileSync(new URL('../src/page/seed/StudentPage.tsx',import.meta.url), 'utf8');
const component = readFileSync(new URL('../src/page/seed/components/StudentActionSignalRail.tsx',import.meta.url), 'utf8');
const style = readFileSync(new URL('../src/styles/41-cla-action-signal-rail.css',import.meta.url), 'utf8');
const styleEntry = readFileSync(new URL('../src/styles.css',import.meta.url), 'utf8');
const flags = (hasProfile,hasCognitiveScore,hasComparableGrowth) => studentDataSignals({hasProfile,hasCognitiveScore,hasComparableGrowth});

describe('CP62 dashboard data-source signal rail', () => {
  it('renders three explicitly labeled source flags and no invented measurements', () => {
    const all = flags(false,false,false);
    assert.deepEqual(all.map(({id})=>id), ['profile','cognitive','growth']);
    assert.deepEqual(all.map(({available})=>available), [false,false,false]);
    assert.equal(countAvailableSignals(all),0);
    assert.ok(all.every(item=>item.status && item.detail));
  });
  it('distinguishes a profile from cognitive and historical observation', () => {
    const profileOnly = flags(true,false,false);
    assert.deepEqual(profileOnly.map(s=>s.available), [true,false,false]);
    assert.equal(countAvailableSignals(profileOnly),1);
  });
  it('does not convert missing profile to valid downstream signals', () => {
    const inconsistent = flags(false,true,true);
    assert.deepEqual(inconsistent.map(s=>s.available), [false,false,false]);
  });
  it('handles mixed prerequisites without pretending all three are ready', () => {
    const mixed = flags(true,true,false);
    assert.deepEqual(mixed.map(s=>s.available), [true,true,false]);
    assert.equal(countAvailableSignals(mixed),2);
  });
  it('renders all-available as exactly three source flags, not a numeric score', () => {
    const full = flags(true,true,true);
    assert.equal(countAvailableSignals(full),3);
    assert.match(full[1].detail,/không phải chẩn đoán/i);
    assert.ok(!full.some(s=>/100\s*điểm|xác suất/i.test(s.status)));
  });
  it('keeps the verified action rail after its data canvas while six-module primary navigation moves above both', () => {
    assert.match(page,/import StudentActionSignalRail from/);
    assert.ok(page.indexOf('<LearningCircuit') < page.indexOf('<StudentDecisionCanvas'));
    assert.ok(page.indexOf('<StudentDecisionCanvas') < page.indexOf('<StudentActionSignalRail'));
    assert.doesNotMatch(page,/className="student-dash-focus"/);
    assert.match(page,/hasComparableGrowth=\{hasComparableGrowth\}/);
  });
  it('keeps the exam calendar first and the preview isolated', () => {
    assert.ok(page.indexOf('<ExamHorizon') < page.indexOf('<StudentDecisionCanvas'));
    assert.match(page, /!isAdminPreview && <ExamHorizon/);
    assert.match(page, /demo=\{isAdminPreview\}/);
  });
  it('bounds action count and uses real links, ARIA and plain source labels', () => {
    assert.match(component, /actions\.slice\(0, 3\)/);
    assert.match(component, /<a href=\{action.href\}>/);
    assert.match(component, /role="img" aria-label=\{plotLabel\}/);
    assert.match(component, /Không phải điểm năng lực/);
    assert.match(component, /không phải chỉ số khoa học/);
  });
  it('includes mobile, dark and reduced-motion styles loaded in the global entrypoint', () => {
    assert.match(styleEntry, /41-cla-action-signal-rail\.css/);
    assert.match(style, /:root\[data-theme="dark"\]/);
    assert.match(style, /@media\(max-width: 860px\)/);
    assert.match(style, /@media\(max-width: 600px\)/);
    assert.match(style, /prefers-reduced-motion: reduce/);
    assert.match(style, /focus-visible/);
  });
});
