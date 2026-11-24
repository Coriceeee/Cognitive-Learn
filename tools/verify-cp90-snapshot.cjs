#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function verifyRelease(base=root){
  const errors=[];
  let manifest;
  try{manifest=JSON.parse(fs.readFileSync(path.join(base,'CP90_SOURCE_MANIFEST.json'),'utf8'));}
  catch{return {ok:false,errors:['MISSING CP90_SOURCE_MANIFEST.json'],count:0};}
  if(manifest.schema!=='cla.cp90.full.immutable.v1'||!Array.isArray(manifest.files))return {ok:false,errors:['INVALID CP90 manifest'],count:0};
  const seen=new Set();
  for(const {path:rel,sha256} of manifest.files){
    if(typeof rel!=='string'||rel.startsWith('/')||rel.includes('\\')||rel.includes('\0')||rel.split('/').some(s=>!s||s==='.'||s==='..')||seen.has(rel)||!/^[a-f0-9]{64}$/.test(sha256)){
      errors.push(`INVALID ENTRY ${String(rel)}`);continue;
    }
    seen.add(rel);
    try{
      const pathname=path.join(base,rel);
      if(!fs.statSync(pathname).isFile())throw new Error('not file');
      const got=crypto.createHash('sha256').update(fs.readFileSync(pathname)).digest('hex');
      if(got!==sha256)errors.push(`CHANGED ${rel}`);
    }catch{errors.push(`MISSING ${rel}`);}
  }
  return {ok:errors.length===0,errors,count:seen.size};
}
if(require.main===module){
 const value=verifyRelease();
 if(!value.ok){console.error('CP90 SOURCE FAIL');value.errors.slice(0,40).forEach(x=>console.error(x));process.exitCode=1;}
 else {console.log(`CP90 SOURCE PASS: ${value.count} immutable files match SHA-256.`);console.log('Local source integrity only; not Firebase Auth, Gemini, or production proof.');}
}
module.exports={verifyRelease};
