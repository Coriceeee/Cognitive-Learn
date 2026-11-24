'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const get = f => fs.readFileSync(path.join(root,f));
test('CP88 launcher resolves project from its own folder rather than hardcoded accented absolute path',()=>{
  const s = get('KHOI_PHUC_2_TAI_KHOAN_CLA_CP88.ps1');
  assert.equal(s[0],0xef); assert.equal(s[1],0xbb); assert.equal(s[2],0xbf);
  const src=s.toString('utf8');
  assert.match(src,/\$ProjectRoot = \$PSScriptRoot,/);
  assert.match(src,/VITE_USE_FIREBASE_EMULATORS/);
  assert.match(src,/Check-PublicConfig/);
  assert.doesNotMatch(src,/Set-ExecutionPolicy -Scope LocalMachine/);
});
test('CP88 diagnostic does not send credentials or write Firebase data',()=>{
  const s = get('CLA_CP88_KIEM_TRA_DANG_NHAP.py').toString('utf8');
  assert.match(s,/credentials: 'omit'/);
  assert.match(s,/method: 'GET'/);
  assert.doesNotMatch(s,/signInWithEmailAndPassword|createUserWithEmailAndPassword|setDoc\(/);
});
test('CP88 original CP87 manifest is preserved; current CP89 source validates separately',()=>{
  const crypto=require('node:crypto');
  const frozen=JSON.parse(get('CP88_SOURCE_MANIFEST.json'));
  const entry=frozen.files.find(e=>e.path==='CP87_SOURCE_MANIFEST.json');
  assert.ok(entry,'historical CP87 manifest is archived');
  assert.equal(crypto.createHash('sha256').update(get(entry.path)).digest('hex'),entry.sha256);
  const verify=require('../tools/verify-cp89-snapshot.cjs');
  const result=verify.verifyRelease(root);
  assert.equal(result.ok,true,result.errors.join('\n'));
});
