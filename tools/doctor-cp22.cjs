/** CLA CP22 preflight checks (offline, does not contact Firebase or install anything). */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const required=['package.json','firebase.emulator.cp21.json','firestore.rules.CANDIDATE_CP21',
 'tools/check-cla-layout.cjs','tests/cp21.rules.contract.test.cjs','tests/firestore.rules.cp21.test.mjs',
 'RUN_RULES_CHECKPOINT21.ps1'];
let failed=0;
for(const file of required){
 const ok=fs.existsSync(path.join(root,file));
 console.log(`${ok?'PASS':'MISSING'}: ${file}`);
 if(!ok)failed++;
}
try{
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const version=pkg.devDependencies?.['@firebase/rules-unit-testing'];
 if(version!=='5.0.2'){console.log(`FAIL: rules-unit-testing=${version||'missing'}, need 5.0.2 with Firebase 12`);failed++;}
 else console.log('PASS: rules-unit-testing 5.0.2 for Firebase 12');
 const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
 const installed=lock.packages?.['node_modules/@firebase/rules-unit-testing']?.version;
 if(installed!=='5.0.2'){
   console.log(`LOCKFILE NOT SYNCED: ${installed||'missing'} — run npm install; commit package-lock.json`);
   failed++;
 } else console.log('PASS: package-lock.json synced for rules-unit-testing');
}catch(e){ console.log('FAIL reading package/lock:',e.message);failed++; }
console.log(`Preflight: ${failed?'FAIL':'PASS'} (${failed} blockers)`);
process.exitCode=failed?1:0;
