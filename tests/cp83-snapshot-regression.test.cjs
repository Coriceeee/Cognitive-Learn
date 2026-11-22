const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {safeRel,verifyRelease}=require('../tools/verify-cp83-snapshot.cjs');
const root=path.resolve(__dirname,'..');
const live=JSON.parse(fs.readFileSync(path.join(root,'CP83_SOURCE_MANIFEST.json'),'utf8'));
function hash(b){return crypto.createHash('sha256').update(b).digest('hex');}
function fixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cla-cp83-proof-'));
  fs.mkdirSync(path.join(dir,'src'));
  fs.writeFileSync(path.join(dir,'src','App.tsx'),'immutable source');
  const data={schema:'cla.cp83.immutable-source.v1',files:[{path:'src/App.tsx',sha256:hash('immutable source')}],mutableOutputs:['reports/cp68/test-preflight-status.json']};
  fs.writeFileSync(path.join(dir,'CP83_SOURCE_MANIFEST.json'),JSON.stringify(data));
  return dir;
}
test('CP83 manifest lists only explicitly documented mutable reports',()=>{
  assert.deepEqual(live.mutableOutputs.slice().sort(),[
    'reports/cp68/test-preflight-status.json',
    'reports/cp73/qa-selftest.json',
    'reports/evidence/cla_cp82_SYNTHETIC_LOCAL_REPLAY.json',
  ].sort());
  const paths=new Set(live.files.map(x=>x.path));
  for(const x of live.mutableOutputs)assert(!paths.has(x));
});
test('CP83 verifies full immutable release bytes',()=>assert.equal(verifyRelease(root).ok,true));
test('CP83 accepts regenerated report but never modified source',()=>{
  const dir=fixture();
  try{
    const outfile=path.join(dir,'reports/cp68/test-preflight-status.json');
    fs.mkdirSync(path.dirname(outfile),{recursive:true});
    fs.writeFileSync(outfile,'changed after tests');
    assert.equal(verifyRelease(dir).ok,true);
    fs.writeFileSync(path.join(dir,'src/App.tsx'),'tampered source');
    assert(verifyRelease(dir).errors.some(x=>x.includes('CHANGED src/App.tsx')));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('CP83 rejects historical role components even outside hash manifest',()=>{
  const dir=fixture();
  try{
    fs.mkdirSync(path.join(dir,'src/page/main'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src/page/main/RolePage.tsx'),'retired');
    assert(verifyRelease(dir).errors.some(x=>x.includes('RolePage.tsx')));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('unsafe paths cannot enter a release manifest',()=>{
  for(const x of ['../x','./x','x//y','x\\y','/abs',''])assert.equal(safeRel(x),false);
  assert.equal(safeRel('src/App.tsx'),true);
});
