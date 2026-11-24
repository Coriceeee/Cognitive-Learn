#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const base=path.resolve(__dirname,'..');
const mf=JSON.parse(fs.readFileSync(path.join(base,'CP91_SOURCE_MANIFEST.json'),'utf8'));
if(mf.schema!=='cla.cp91.full.immutable.v1'||!Array.isArray(mf.files))throw Error('INVALID CP91 MANIFEST');
const seen=new Set();let errors=[];
for(const item of mf.files){const rel=item.path;
  if(typeof rel!=='string'||rel.startsWith('/')||rel.includes('\\')||rel.includes('\0')||rel.split('/').some(v=>!v||v==='..'||v==='.')||seen.has(rel)||!/^[0-9a-f]{64}$/.test(item.sha256)) {errors.push('BAD '+String(rel));continue;}
  seen.add(rel);
  try {const p=path.join(base,rel);if(!fs.statSync(p).isFile())throw Error('not file');const got=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');if(got!==item.sha256)errors.push('CHANGED '+rel);} catch {errors.push('MISSING '+rel);}
}
if(errors.length){console.error('CP91 SNAPSHOT FAIL',errors.slice(0,25));process.exitCode=1;}
else console.log(`CP91 SOURCE PASS: ${seen.size} files match SHA-256 (LOCAL SOURCE ONLY; not production Firestore proof).`);
