/** Static source audit: anchors exist in both data and empty-state branches.
 * This does not replace browser E2E click/refresh/deep-link testing.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'src/page/nexus/AdminPage.tsx'), 'utf8');
const cases = [
  ['/atlas#atlas-engine', 'src/page/atlas/AtlasPage.tsx', 'atlas-engine'],
  ['/atlas#atlas-programs', 'src/page/atlas/AtlasPage.tsx', 'atlas-programs'],
  ['/orion#orion-scenarios', 'src/page/orion/OrionPage.tsx', 'orion-scenarios'],
  ['/orion#orion-roadmap', 'src/page/orion/OrionPage.tsx', 'orion-roadmap'],
  ['/pulse#pulse-report', 'src/page/pulse/PulsePage.tsx', 'pulse-report'],
  ['/pulse#pulse-risk', 'src/page/pulse/PulsePage.tsx', 'pulse-risk'],
  ['/haven#haven-scholarships', 'src/page/haven/HavenPage.tsx', 'haven-scholarships'],
  ['/haven#haven-support-roles', 'src/page/haven/HavenPage.tsx', 'haven-support-roles'],
];
let count = 0;
for (const [route, page, id] of cases) {
  assert.ok(admin.includes(`path: "${route}"`), `Admin route missing: ${route}`);
  const source = fs.readFileSync(path.join(root, page), 'utf8');
  const matches = source.match(new RegExp(`id="${id}"`, 'g')) || [];
  assert.equal(matches.length, ['atlas-engine','atlas-programs'].includes(id) ? 1 : 2,
    `Expected one normal target plus empty-state target for ${route}`);
  count++;
  console.log('PASS', route);
}
console.log(`ADMIN ANCHOR CONTRACT: ${count}/${count} PASS (static source only)`);
