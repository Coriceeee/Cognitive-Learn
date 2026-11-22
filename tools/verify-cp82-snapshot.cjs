'use strict';
/** CP82 byte-integrity check for the delivered ZIP (not research attestation). */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'CP82_SOURCE_MANIFEST.json'),'utf8'));
const errors=[];
if(manifest.schema!=='cla.cp82.release-source-files.v1'||!Array.isArray(manifest.files))errors.push('Invalid CP82 manifest');
for(const entry of manifest.files||[]){
  const rel=entry.path;
  if(typeof rel!=='string'||!rel||path.isAbsolute(rel)||rel.includes('\\')||rel.includes('\0')||rel.split('/').some(part=>!part||part==='.'||part==='..')){
    errors.push('Unsafe manifest path');continue;
  }
  const file=path.join(root,rel);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()) {errors.push('MISSING '+rel);continue;}
  const sum=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if(sum!==entry.sha256)errors.push('CHANGED '+rel);
}
for(const rel of ['src/page/main/RolePage.tsx','src/components/common/StudentLinkManager.tsx','src/components/common/SharedReportPanel.tsx']){
  if(fs.existsSync(path.join(root,rel)))errors.push('Retired role component restored: '+rel);
}
if(errors.length){
  console.error('CLA CP82 ZIP SOURCE NOT MATCHED: '+errors.length+' mismatches');
  errors.slice(0,20).forEach(e=>console.error(e));
  process.exitCode=1;
}else{
  console.log('CP82 ZIP SOURCE PASS: '+manifest.files.length+' files SHA-256 matched; retired roles absent.');
  console.log('Only proves local bytes match ZIP; says NOTHING about live deployment or scientific validity.');
}
