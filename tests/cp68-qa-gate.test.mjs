import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { planRouteExperience } from '../src/lib/routeExperience.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path,root), 'utf8');
const python = read('tools/cp68_student_ux_e2e.py');

describe('CP68: production honesty and student SPA UX', () => {
  it('Back to a different module restores scroll but moves keyboard focus', () => {
    assert.deepEqual(planRouteExperience('/pulse/actions','/orion/roadmap','pop'),
      {scroll:'preserve',anchor:null,focusContent:true});
    assert.deepEqual(planRouteExperience('/haven','/lumen#overview','pop'),
      {scroll:'anchor',anchor:'overview',focusContent:true});
  });
  it('Back after changing only a filter does not steal focus or scroll', () => {
    assert.deepEqual(planRouteExperience('/atlas/sources?year=2025','/atlas/sources?year=2026','pop'),
      {scroll:'preserve',anchor:null,focusContent:false});
    assert.deepEqual(planRouteExperience('/atlas/sources?year=2025#part1','/atlas/sources?year=2025#part2','pop'),
      {scroll:'anchor',anchor:'part2',focusContent:false});
  });
  it('push and replace continue to focus new routes and go to top', () => {
    assert.deepEqual(planRouteExperience('/student','/atlas','push'),
      {scroll:'top',anchor:null,focusContent:true});
    assert.deepEqual(planRouteExperience('/student','/atlas','replace'),
      {scroll:'top',anchor:null,focusContent:true});
  });
  it('real React browser QA requires synthetic account consent', () => {
    assert.match(python, /I_USE_SYNTHETIC_QA_ACCOUNTS/);
    assert.match(python, /CLA_E2E_STUDENT_EMAIL/);
    assert.match(python, /CLA_E2E_STUDENT_PASSWORD/);
    assert.match(python, /--screenshots/);
  });
  it('QA origin is restricted to loopback and verifies Firebase project marker', () => {
    assert.match(python, /checked_origin\(origin\)/);
    assert.match(python, /SAFE_LOOPBACK/);
    assert.match(python, /qa_preflight\(origin, project_id/);
    assert.match(python, /local Firebase QA project/i);
  });
  it('QA checks all six modules and two viewports using real DOM and SPA links', () => {
    assert.match(python, /MODULES = \('student', 'lumen', 'atlas', 'orion', 'pulse', 'haven'\)/);
    assert.match(python, /VIEWPORTS = \(\(1280, 800\), \(390, 844\)\)/);
    assert.match(python, /\.cla-circuit a\[href=/);
    assert.match(python, /window\.__cp68DocumentProof/);
    assert.match(python, /document\.activeElement/);
  });
  it('rejects unapproved public origins before touching any QA credentials', () => {
    const process = spawnSync('python', ['tools/cp68_student_ux_e2e.py', '--base-url', 'https://example.com', '--project-id', 'cla-qa-synthetic', '--preflight',
      '--report', 'reports/cp68/test-preflight-status.json'], {
      cwd: new URL('.',root), encoding: 'utf8', timeout: 20000,
    });
    assert.equal(process.status, 2, 'preflight must reject a public origin even if dependencies are installed');
    const report = JSON.parse(read('reports/cp68/test-preflight-status.json'));
    assert.equal(report.status, 'BLOCKED');
    assert.deepEqual(report.checks, []);
    assert.equal(report.reasonType, 'ValueError');
  });
  it('does not advertise dark-mode full website as validated', () => {
    const html=read('index.html');
    assert.match(html,/data-theme.*light/);
    assert.doesNotMatch(python,/dark.mode.*PASS/i);
  });
});
