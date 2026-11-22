'use strict';
// CP81 release-file integrity check. This is NOT a scientific-research attestation.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'CP81_SOURCE_MANIFEST.json'),'utf8'));
const problems=[];
for(const entry of manifest.files){
  const rel=entry.path;
  if(rel.startsWith('/') || rel.includes('..') || rel.includes('\\')){
    problems.push('Unsafe path in manifest'); continue;
  }
  const file=path.join(root,rel);
  if(!fs.existsSync(file)){problems.push('MISSING '+rel);continue;}
  const digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(digest!==entry.sha256)problems.push('CHANGED '+rel);
}
for(const rel of ['src/page/main/RolePage.tsx', 'src/components/common/StudentLinkManager.tsx', 'src/components/common/SharedReportPanel.tsx']) {
  if(fs.existsSync(path.join(root,rel)))problems.push('RETIRED COMPONENT PRESENT '+rel);
}
if(problems.length){
  console.error(`CLA CP81 snapshot NOT MATCHED: ${problems.length} issues; do not use this tree as the CP81 release.`);
  for(const p of problems.slice(0,25))console.error(p);
  if(problems.length>25)console.error(`...and ${problems.length-25} additional mismatches`);
  process.exitCode=1;
}else{
  console.log(`CLA CP81 snapshot PASS: ${manifest.files.length} packaged files matched; no retired role components.`);
  console.log('This proves file identity only; no test/build/production approval.');
}
