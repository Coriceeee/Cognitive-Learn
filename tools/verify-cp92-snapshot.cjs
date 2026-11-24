#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const mf=JSON.parse(fs.readFileSync(path.join(root,'CP92_SOURCE_MANIFEST.json'),'utf8'));
if(mf.schema!=='cla.cp92.full.immutable.v1'||!Array.isArray(mf.files))throw Error('INVALID CP92 MANIFEST');
const errors=[],seen=new Set();
for(const entry of mf.files){
  const p=entry.path;
  if(typeof p!=='string'||p.startsWith('/')||p.includes('\\')||p.includes('\0')||p.split('/').some(part=>!part||part==='..'||part==='.')||seen.has(p)||!/^[0-9a-f]{64}$/.test(entry.sha256)){errors.push(`INVALID ${String(p)}`);continue;}
  seen.add(p);
  try {const f=path.join(root,p);if(!fs.statSync(f).isFile()||crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')!==entry.sha256)errors.push(`CHANGED ${p}`);}
  catch {errors.push(`MISSING ${p}`);}
}
if(errors.length){console.error('CP92 SOURCE FAIL',errors.slice(0,30));process.exitCode=1;}
else console.log(`CP92 SOURCE PASS: ${seen.size} immutable files match SHA-256 (local source only, NOT production deployment or scientific validation).`);
