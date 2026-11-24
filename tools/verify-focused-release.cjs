const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'FOCUSED_RELEASE_MANIFEST.json'),'utf8'));
if(m.schema!=='cla.focused.release.v1'||!Array.isArray(m.files)||!m.files.length)throw Error('Invalid manifest');
for(const e of m.files){
 if(typeof e.path!=='string'||e.path.startsWith('/')||e.path.includes('..')||e.path.includes('\\'))throw Error('Invalid path');
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,e.path))).digest('hex');
 if(actual!==e.sha256)throw Error(`FOCUSED SOURCE FAIL: ${e.path}`);
}
console.log(`FOCUSED SOURCE PASS: ${m.files.length} pinned source files; not a production validation.`);
