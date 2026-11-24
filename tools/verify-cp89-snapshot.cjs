#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function verifyRelease(base = root) {
  const errors = [];
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(path.join(base,'CP89_SOURCE_MANIFEST.json'),'utf8')); }
  catch (error) { return {ok:false,errors:['MISSING CP89_SOURCE_MANIFEST.json'],count:0}; }
  if (manifest.schema !== 'cla.cp89.full.immutable.v1' || !Array.isArray(manifest.files) || !Array.isArray(manifest.mutableOutputs))
    return {ok:false,errors:['INVALID CP89 manifest'],count:0};
  const seen = new Set();
  for (const item of manifest.files) {
    const rel = item?.path;
    if (typeof rel !== 'string' || !/^[a-f0-9]{64}$/.test(item.sha256) || rel.includes('\\') || rel.includes('\0') || rel.startsWith('/') || rel.split('/').some(p=>!p||p==='.'||p==='..') || seen.has(rel)) {
      errors.push(`INVALID_ENTRY ${String(rel)}`);continue;
    }
    seen.add(rel);
    const file = path.join(base,rel);
    try { if(!fs.statSync(file).isFile())throw Error('not a file');if(sha(file)!==item.sha256) errors.push(`CHANGED ${rel}`); }
    catch { errors.push(`MISSING ${rel}`); }
  }
  const banned = ['src/page/main/RolePage.tsx','src/components/common/StudentLinkManager.tsx','src/components/common/SharedReportPanel.tsx','src/audit_dataset.py','src/baseline_next_term.py'];
  for (const rel of banned) if(fs.existsSync(path.join(base,rel))) errors.push(`LEGACY ${rel}`);
  return {ok:errors.length===0,errors,count:seen.size};
}
if (require.main===module) {
  const result = verifyRelease();
  if(!result.ok) {console.error(`CP89 SOURCE FAIL (${result.errors.length} mismatches)`); result.errors.slice(0,30).forEach(x=>console.error(x));process.exitCode=1;}
  else {console.log(`CP89 IMMUTABLE SOURCE PASS: ${result.count} files SHA-256 matched; generated reports excluded.`);console.log('Không xác nhận production, đăng nhập Firebase thật hoặc hiệu lực khoa học.');}
}
module.exports = {verifyRelease};
