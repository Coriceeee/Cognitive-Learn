#!/usr/bin/env node
'use strict';
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'CP88_SOURCE_MANIFEST.json'),'utf8'));
if(manifest.schema!=='cla.cp88.full.immutable.v1'||!Array.isArray(manifest.files)||!Array.isArray(manifest.mutableOutputs))throw Error('invalid CP88 manifest');
const errors=[];const seen=new Set();
for(const e of manifest.files){
 if(!e || typeof e.path!=='string'||e.path.includes('\\')||e.path.includes('\0')||e.path.startsWith('/')||e.path.split('/').some(p=>!p||p==='.'||p==='..')||seen.has(e.path)){
  errors.push('INVALID_ENTRY '+String(e?.path));continue;
 }
 seen.add(e.path);
 const file=path.join(root,e.path);
 try {const s=fs.lstatSync(file);if(!s.isFile())throw Error('not regular');
 const sha=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(sha!==e.sha256)errors.push('CHANGED '+e.path);}catch(err){errors.push('MISSING '+e.path);}
}
const banned=['src/page/main/RolePage.tsx','src/components/common/StudentLinkManager.tsx','src/components/common/SharedReportPanel.tsx','src/audit_dataset.py','src/baseline_next_term.py'];
for(const f of banned){if(fs.existsSync(path.join(root,f)))errors.push('LEGACY '+f);}
if(errors.length){console.error('CP88 FULL SOURCE FAIL: '+errors.length+' mismatches');errors.slice(0,25).forEach(e=>console.error(e));process.exit(1);}
console.log('CP88 FULL SOURCE PASS: '+seen.size+' SHA-256 matched; '+manifest.mutableOutputs.length+' generated report paths excluded.');
console.log('This does not prove production Firebase access or real student account sign-in.');
