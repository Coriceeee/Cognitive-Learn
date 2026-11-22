import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isServerConfirmedSnapshot} from '../src/page/seed/services/realtimeReadPolicy.ts';
import {readProductConsent, createProductConsentRecord} from '../src/lib/studentConsentPolicy.ts';
const file=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');
const hook=file('src/lib/useDailyCompanion.ts');
const page=file('src/page/companion/DailyCompanionPage.tsx');
const uid='student_cp69_a';
test('CP69.10: consent from cached/pending write cannot permit saving',()=>{
  for(const metadata of [{fromCache:true,hasPendingWrites:false},{fromCache:false,hasPendingWrites:true},null,{}]){
    assert.equal(isServerConfirmedSnapshot(metadata),false);
  }
  const record=createProductConsentRecord(uid,true,null);
  assert.equal(readProductConsent(record,uid),'accepted');
  assert.equal(readProductConsent(record,'student_cp69_b'),'missing');
  assert.match(hook,/setConsentAccepted\(isServerConfirmedSnapshot\(snapshot\.metadata\)/);
});
test('CP69.11: companion listener requests metadata changes and never displays cached data as saved',()=>{
  assert.match(hook,/onSnapshot\(docFor\(currentUid\), \{includeMetadataChanges:true\}/);
  assert.match(hook,/if \(!isServerConfirmedSnapshot\(snapshot\.metadata\)\) \{[\s\S]*setSettings\(null\); setStatus\("syncing"\); return;/);
  assert.match(page,/\["loading", "syncing"\]\.includes\(companion\.status\)/);
});
test('CP69.12: transaction reads consent record on server before writing schedule',()=>{
  assert.match(hook,/const consent = await transaction\.get\(doc\(db, "student_consents", owner\)\)/);
  assert.match(hook,/readProductConsent\(consent\.data\(\), owner\) !== "accepted"/);
  assert.match(hook,/const snapshot = await transaction\.get\(docFor\(owner\)\)/);
  assert.match(hook,/if \(!current\(\)\) throw new Error\("Tài khoản đã thay đổi, không lưu dữ liệu/);
});
test('CP69.13: account switch invalidates stale companion callbacks and errors',()=>{
  assert.match(hook,/const epoch = \+\+authEpoch\.current/);
  assert.match(hook,/const current = \(\) => mounted && epoch === authEpoch\.current && auth\.currentUser\?\.uid === currentUid/);
  assert.match(hook,/if \(!current\(\)\) return;/);
  assert.match(hook,/if \(current\(\)\) setError/);
});
