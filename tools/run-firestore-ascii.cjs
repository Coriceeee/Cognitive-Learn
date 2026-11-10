#!/usr/bin/env node
/**
 * Runs CLA Firestore Rules tests from an ASCII-only folder, without .ps1 policy
 * or relying on JAVA_HOME already being set in the current Windows terminal.
 * Does not deploy, contact a production Firebase project or copy .env files.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
const prepareOnly=args.includes('--prepare-only');
const pos=args.indexOf('--workspace');
if(args.some((a,i)=>a!=='--prepare-only' && a!=='--workspace' && !(pos>=0 && i===pos+1)) ||
   (pos>=0 && !args[pos+1])) {
  console.error('Usage: node tools/run-firestore-ascii.cjs [--prepare-only] [--workspace ASCII_PATH]');process.exit(2);
}
const defaultRoot=process.platform==='win32'
  ? path.join(process.env.LOCALAPPDATA || 'C:\\CLA-Temp','CLA-Firestore-ASCII')
  : path.join(os.tmpdir(),'CLA-Firestore-ASCII');
const workspace=path.resolve(pos>=0?args[pos+1]:defaultRoot);
const ascii=p=>!/[\u0080-\uffff]/.test(p);
if(!ascii(workspace)) throw Error('Workspace path contains non-ASCII characters. Use --workspace C:\\CLA-Firestore-ASCII');
if(workspace.toLowerCase()===root.toLowerCase() ||
   root.toLowerCase().startsWith(workspace.toLowerCase()+path.sep.toLowerCase()))
  throw Error('Workspace cannot be the project root or its ancestor');
const files=['package.json','package-lock.json','firebase.emulator.cp21.json',
  'firestore.rules.CANDIDATE_CP21','tests/firestore.rules.cp21.test.mjs'];
for(const f of files) if(!fs.existsSync(path.join(root,f))) throw Error('Missing project file: '+f);
fs.mkdirSync(path.join(workspace,'tests'),{recursive:true});
for(const secret of ['.env','.env.local']) if(fs.existsSync(path.join(workspace,secret)))
  throw Error('Refusing to reuse workspace containing '+secret+': '+workspace);
for(const f of files) {
  const to=path.join(workspace,f);
  fs.mkdirSync(path.dirname(to),{recursive:true});
  fs.copyFileSync(path.join(root,f),to);
}
const config=JSON.parse(fs.readFileSync(path.join(workspace,'firebase.emulator.cp21.json'),'utf8'));
if(config.firestore?.rules!=='firestore.rules.CANDIDATE_CP21')
  throw Error('Unexpected Rules target in emulator config; refusing to run');
console.log('Prepared isolated Firestore workspace: '+workspace);
console.log('Copied only 5 test/config files; no secrets or production credentials.');
if(prepareOnly) process.exit(0);
function probeJava(bin,env) {
  const p=cp.spawnSync(bin,['-version'],{env,encoding:'utf8',windowsHide:true});
  if(p.error || p.status!==0) return null;
  const version=(p.stderr||'')+'\n'+(p.stdout||'');
  const m=version.match(/version\s+"(\d+)(?:\.|\")/);
  return m && Number(m[1])>=21 ? version.trim().split('\n')[0] : null;
}
function findJava() {
  const env={...process.env};
  let out=probeJava('java',env);
  if(out) return {env,version:out,home:env.JAVA_HOME||'(PATH)'};
  if(process.platform!=='win32') throw Error('Java 21+ unavailable on PATH');
  const dirs=[];
  if(env.JAVA_HOME) dirs.push(env.JAVA_HOME);
  const pf=env.ProgramFiles||'C:\\Program Files';
  for(const base of [path.join(pf,'Eclipse Adoptium'),path.join(pf,'Java'),path.join(pf,'Microsoft')]) {
    if(!fs.existsSync(base)) continue;
    for(const entry of fs.readdirSync(base,{withFileTypes:true})) {
      if(entry.isDirectory() && /(?:jdk|openjdk)[-_]?2[1-9]/i.test(entry.name)) dirs.push(path.join(base,entry.name));
    }
  }
  for(const home of dirs) {
    const bin=path.join(home,'bin','java.exe');
    if(!fs.existsSync(bin)) continue;
    const next={...env,JAVA_HOME:home,Path:path.join(home,'bin')+';'+(env.Path||env.PATH||'')};
    next.PATH=next.Path;
    out=probeJava(bin,next);
    if(out) return {env:next,home,version:out};
  }
  throw Error('JDK 21+ not found. Check C:\\Program Files\\Eclipse Adoptium\\jdk-21*\\bin\\java.exe');
}
const java=findJava();
console.log('Java:',java.version,'from',java.home);
function run(command,argv=[]) {
  const opts={cwd:workspace,env:java.env,stdio:'inherit',windowsHide:true};
  const proc=process.platform==='win32'
    ? cp.spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',command],opts)
    : cp.spawnSync(command,argv,opts);
  if(proc.error) throw proc.error;
  if(proc.status!==0) throw Error(command+' failed with exit code '+proc.status);
}
run('npm ci');
if(process.platform==='win32') {
  // The firebase command expects exactly one positional <script> argument.
  // Calling it via cmd.exe /c with a quoted multi-word script can cause cmd
  // to remove the quotes and Firebase to report "Too many arguments".
  // Pass a space-free, single-path batch launcher as the <script> instead.
  const runnerName='CLA_FIRESTORE_TEST.cmd';
  const runnerPath=path.join(workspace,runnerName);
  const runnerContents='@echo off\r\ncall npm run test:rules\r\nexit /b %ERRORLEVEL%\r\n';
  fs.writeFileSync(runnerPath,runnerContents,{encoding:'utf8',flag:'w'});
  try {
    run('firebase emulators:exec --project demo-cla-cp21-security --config firebase.emulator.cp21.json --only firestore .\\'+runnerName);
  } finally {
    fs.rmSync(runnerPath,{force:true});
  }
} else {
  run('firebase',['emulators:exec','--project','demo-cla-cp21-security','--config','firebase.emulator.cp21.json','--only','firestore','npm run test:rules']);
}
console.log('Emulator process exited successfully. Inspect actual test counts above (expected 42).');
