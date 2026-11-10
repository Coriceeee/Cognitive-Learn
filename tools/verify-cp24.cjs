#!/usr/bin/env node
'use strict';
/**
 * CP24 release gate: repeatable local checks. Never deploys or touches production.
 * Writes only test statuses; no raw logs, personal data, or environment variables.
 */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
if ([...args].some(arg => !['--plan', '--skip-emulator', '--skip-build'].includes(arg))) {
  console.error('Usage: node tools/verify-cp24.cjs [--plan] [--skip-emulator] [--skip-build]');
  process.exit(2);
}
const plan = [
  { id:'layout', command:'npm run check:layout', optional:false },
  { id:'node', command:'npm test', optional:false },
  { id:'rules_static', command:'npm run test:rules:static', optional:false },
  { id:'typecheck_api', command:'npm run typecheck:api', skip: args.has('--skip-build') },
  { id:'production_build', command:'npm run build', skip: args.has('--skip-build') },
  { id:'firestore_emulator', command:'node tools/run-firestore-ascii.cjs', skip: args.has('--skip-emulator') },
];
if (args.has('--plan')) {
  for (const step of plan) console.log(`${step.skip?'SKIP':'RUN '} ${step.id}: ${step.command}`);
  console.log('No files changed; no commands executed.');
  process.exit(0);
}
const results=[];
for (const step of plan) {
  if (step.skip) { results.push({id:step.id,status:'NOT_RUN',reason:'explicitly skipped'}); continue; }
  console.log('\n==== CP24 VERIFY: '+step.id+' ====');
  const start=Date.now();
  const proc=process.platform==='win32'
    ? cp.spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',step.command],{cwd:root,stdio:'inherit',windowsHide:true})
    : cp.spawnSync(step.command.startsWith('node ') ? process.execPath : 'npm',
      step.command.startsWith('node ') ? step.command.split(' ').slice(1) : step.command.split(' ').slice(1),
      {cwd:root,stdio:'inherit'});
  const success=!proc.error && proc.status===0;
  results.push({id:step.id,status:success?'PASS':'FAIL',exitCode:proc.status??-1,durationMs:Date.now()-start});
  if (!success) console.error('FAILED:',step.id,proc.error?.message||'exit code '+proc.status);
}
const report={schemaVersion:1,checkpoint:'CP24',generatedAt:new Date().toISOString(),
  environment:'local-commands-only',status:results.some(x=>x.status==='FAIL')?'FAIL':
    results.some(x=>x.status==='NOT_RUN')?'INCOMPLETE':'PASS',results};
const output=path.join(root,'docs','checkpoints','CP24_VERIFY_LOCAL.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n','utf8');
console.log('\nCP24 summary:',report.status,'Report:',output);
process.exitCode=report.status==='FAIL'?1:report.status==='INCOMPLETE'?2:0;
