const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('CP80: transaction keeps session guard separate from snapshot payload', () => {
  const src = read('src/lib/useDailyCompanion.ts');
  assert.match(src, /const current = \(\) => epoch === authEpoch\.current/);
  assert.match(src, /const currentData: DailyCompanionData = snapshot\.exists\(\)/);
  assert.match(src, /const next = transform\(currentData\)/);
  assert.match(src, /if \(!current\(\)\) throw new Error\("Tài khoản đã thay đổi, không lưu dữ liệu\."\)/);
  assert.doesNotMatch(src, /const current: DailyCompanionData/);
});
test('CP80: renamed items remain discoverable in student catalog without old labels', () => {
  const src = read('src/data/moduleSubmodules.ts').split('export const studentSubmoduleDirectory:')[1];
  for (const title of ['Chạm thế giới', 'Bức tranh tiến bộ', 'Mảnh ghép còn thiếu', 'Những cột mốc']) {
    assert.ok(src.includes(`title: "${title}"`), `${title} missing`);
  }
  assert.ok(!src.includes('title: "Du học toàn cầu"'));
});
test('CP80: Atlas subject optimizer remains reachable through focused navigation', () => {
  assert.match(read('src/page/atlas/AtlasPage.tsx'), /<ModuleSectionNav moduleKey="atlas" \/>/);
  assert.match(read('src/data/moduleSubmodules.ts'), /title: "Tổ hợp chiến lược"[^\n]+href: "\/atlas\/subjects"/);
});
test('CP80: CP31 release integrity hash is not replaced with an unverified CP80 hash', () => {
  assert.match(read('src/lib/nexusEvidenceBaseline.ts'), /cp31ReleaseSourceSha256 = '4fbb5938d5e6c3d0eee91292a100be47c910db3573c74befa104b261bfa33e28'/);
});
