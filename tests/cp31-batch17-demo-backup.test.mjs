import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {produceBackup,renderBackupHTML} from '../tools/cla_demo_backup.mjs';
const sample=()=>({stages:Array.from({length:7},(_,i)=>({id:'stage-'+i,source:'engine-'+i})),trends:[{key:'math',label:'Toán (giả lập)',scores:[0,0,2]},{key:'english',label:'Anh (giả lập)',scores:[7,8,8]}],cycleCount:2,declaredCount:8,sourceFingerprint:'a'.repeat(64)});

test('Static standalone offline HTML contains all essential safety claims',()=>{
  const html=renderBackupHTML(sample());
  assert.match(html,/<!doctype html>/i);
  for(const needed of ['SYNTHETIC','T0','T1','T2','Không','Firestore','không phải giao diện website','4 phút']) assert.ok(html.includes(needed),needed);
  assert.doesNotMatch(html,/<script\b|https?:\/\/|<link\b|<iframe\b/i);
  assert.match(html,/Toán \(giả lập\)/);
});

test('Render is deterministic for the same independently checked data',()=>{
  assert.equal(renderBackupHTML(sample()),renderBackupHTML(sample()));
});

test('Disallowed score is fail-closed, not silently drawn',()=>{
  const data=sample();data.trends[0].scores[1]=12;
  assert.throws(()=>renderBackupHTML(data),/Score outside/);
});

test('Missing science-replay stages is fail-closed',()=>{
  const data=sample();data.stages.pop();
  assert.throws(()=>renderBackupHTML(data),/Invalid view model/);
});

test('Potentially hostile labels and sources are HTML-escaped',()=>{
  const data=sample();data.trends[0].label='<script>alert(1)</script>';
  data.stages[0].source='<img src=x onerror=alert(1)>';
  const html=renderBackupHTML(data);
  assert.doesNotMatch(html,/<script>|<img src=x/);
  assert.match(html,/&lt;script&gt;alert/);
  assert.match(html,/&lt;img src=x onerror=alert/);
});

test('Offline fallback from the REAL replay JSON is byte-reproducible and tamper-detecting',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cla-demo-backup-'));
  const outfile=path.join(tmp,'standalone.html');
  try{
    const report=produceBackup('--generate',outfile);
    assert.equal(report.status,'SYNTHETIC_DEMO_BACKUP_VERIFIED');
    assert.equal(report.measurementEquivalenceVerified,false);
    assert.equal(report.causalEffectEstimated,false);
    assert.equal(report.firestoreEmulatorChecked,false);
    assert.equal(report.browserE2EChecked,false);
    assert.match(fs.readFileSync(outfile,'utf8'),/Toán \(giả lập\)/);
    assert.equal(produceBackup('--verify',outfile).htmlSha256,report.htmlSha256);
    fs.appendFileSync(outfile,'<!-- tampered -->');
    assert.throws(()=>produceBackup('--verify',outfile),/changed/);
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('Verification refuses an absent HTML artifact',()=>{
  const absent=path.join(os.tmpdir(),'cla-nonexistent-standalone-'+process.pid+'.html');
  assert.throws(()=>produceBackup('--verify',absent),/No backup HTML/);
});

test('Verification rejects unsupported action',()=>{
  assert.throws(()=>produceBackup('--deploy'),/Mode must/);
});
