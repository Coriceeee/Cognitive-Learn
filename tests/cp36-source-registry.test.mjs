import test from 'node:test';
import assert from 'node:assert/strict';
import { officialScholarships, searchScholarships, scholarshipCountryOptions } from '../src/data/officialScholarships.ts';
import { officialUniversities, findOfficialUniversities, admissionYears } from '../src/data/officialAdmissionSources.ts';

test('P1 source provenance: no duplicate scholarship IDs, source URLs and conditions present', () => {
  assert.equal(officialScholarships.length, 7);
  assert.equal(new Set(officialScholarships.map(item => item.id)).size, officialScholarships.length);
  assert.deepEqual([...scholarshipCountryOptions].sort(), ['AU','JP','KR','SG']);
  for (const item of officialScholarships) {
    assert.ok(item.sourceUrl.startsWith('https://'));
    assert.equal(item.level, 'Cử nhân');
    assert.equal(item.reviewedDate, '2026-11-11');
    assert.ok(item.conditions.length >= 2);
    assert.ok(item.documentChecks.length >= 2);
    assert.ok(item.intakeNote.length >= 25);
    assert.ok(item.credentialNote.length >= 25);
    assert.ok(['archive-cycle','check-cycle'].includes(item.availability));
    assert.ok(!('probability' in item));
  }
});

test('P1 scholarship search filters by country and label without claiming eligibility', () => {
  assert.equal(searchScholarships('').length, 7);
  assert.equal(searchScholarships('', 'SG').length, 4);
  assert.equal(searchScholarships('', 'KR').length, 1);
  assert.equal(searchScholarships('MEXT').length, 1);
  assert.equal(searchScholarships('does-not-exist').length, 0);
});

test('P1 Atlas provenance distinguishes 3-year records from 2026-only additions', () => {
  assert.equal(officialUniversities.length, 32);
  const yearRecords = officialUniversities.flatMap(item => item.years);
  assert.equal(yearRecords.length, 57);
  assert.equal(officialUniversities.filter(item => item.years.length === 3).length, 12);
  assert.equal(admissionYears.length, 3);
  const ids = new Set();
  for (const school of officialUniversities) {
    assert.ok(!ids.has(school.id)); ids.add(school.id);
    const years = new Set(school.years.map(item => item.year));
    assert.equal(years.size, school.years.length);
    assert.ok(school.years.every(item => item.schemeUrl.startsWith('https://')));
  }
  for (const id of ['uet','uel','ueh']) {
    assert.deepEqual(officialUniversities.find(item => item.id === id)?.years.map(item => item.year), [2026]);
  }
  assert.ok(findOfficialUniversities('Đại học Công nghệ', 2026).some(item => item.id === 'uet'));
  assert.ok(findOfficialUniversities('Kinh tế', 2026).some(item => item.id === 'uel'));
  assert.equal(findOfficialUniversities('Đại học Công nghệ', 2024).some(item => item.id === 'uet'), false);
});
