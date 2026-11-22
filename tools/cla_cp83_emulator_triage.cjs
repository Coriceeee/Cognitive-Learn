#!/usr/bin/env node
'use strict';
/** Non-network, read-only triage of existing local Firestore emulator gate reports.
    The result is a diagnostic, NOT a security authorization PASS. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const home=path.join(root,'reports/security');
const resultPath=path.join(home,'firestore_emulator_gate.json');
const logPath=path.join(home,'firestore_emulator_gate.log');
const debugPath=path.join(home,'firestore_emulator_debug.log');
const fbDebugPath=path.join(home,'firebase_emulator_debug.log');
let report;
try{report=JSON.parse(fs.readFileSync(resultPath,'utf8'));}
catch(e){console.log('CP83 TRIAGE: no parseable emulator gate JSON; check: '+resultPath);process.exitCode=2;}
if(report){
  const text=[logPath,debugPath,fbDebugPath].map(f=>{try{return fs.readFileSync(f,'utf8')}catch{return ''}}).join('\n');
  const hints=[];
  if(/application control|blocked this file|Windows Defender Application Control|app control policy/i.test(text)) hints.push('OS_APPLICATION_CONTROL_POLICY');
  if(/unable to access jarfile|unsupportedclassversionerror|class file version|could not find java|java not found/i.test(text)) hints.push('JAVA_RUNTIME_OR_EMULATOR_BINARY');
  if(/address already in use|port taken|bindexception|port \d+ is not open|eaddrinuse/i.test(text)) hints.push('LOOPBACK_PORT_CONFLICT');
  if(/cannot create symbolic link|a required privilege is not held|junction|access is denied|eperm|eacces/i.test(text)) hints.push('FILESYSTEM_OR_POLICY_ACCESS');
  if(/AssertionError|assert\.fail|expected.*(allow|deny)|authorization failed|firebaseerror: (permission-denied|unauthenticated)/i.test(text)) hints.push('AUTHORIZATION_TEST_FAILURE_REVIEW_RULES');
  if(/emulator has exited with code: 1|fatal error occurred/i.test(text)) hints.push('EMULATOR_PROCESS_EXITED');
  if(hints.length===0 && report.emulatorAuthorizationTests==='FAIL') hints.push('UNDETERMINED_NEED_FIREBASE_DEBUG_LOG');
  console.log('CP83 FIRESTORE DIAGNOSTIC (not security PASS)');
  console.log('staticTests:',report.staticTests,'emulatorAuthorizationTests:',report.emulatorAuthorizationTests,'overall:',report.overall);
  console.log('port:',report.emulatorPort ?? '(not recorded)');
  console.log('hints:',hints.join(', ')||'NONE');
  console.log('source:',resultPath);
  console.log('review sanitized excerpts of these local logs:');
  for(const f of [logPath,debugPath,fbDebugPath])if(fs.existsSync(f))console.log('  '+f);
  if(Array.isArray(report.notes))for(const note of report.notes)console.log('note:',note);
  console.log('Do not deploy Security Rules while emulator authorization is not PASS.');
}
