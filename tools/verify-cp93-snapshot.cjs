#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const m=JSON.parse(fs.readFileSync(path.join(root,'CP93_SOURCE_MANIFEST.json'),'utf8'));
if(m.schema!=='cla.cp93.modified.immutable.v1')throw Error('Invalid CP93 manifest schema');
for(const e of m.files){
 if(typeof e.path!=='string'||e.path.startsWith('/')||e.path.includes('..')||e.path.includes('\\'))throw Error('Invalid path');
 // Git for Windows may check out tracked text files with CRLF. The manifest
 // records canonical LF content, so normalize line endings before hashing while
 // still detecting every substantive source change.
 const source=fs.readFileSync(path.join(root,e.path),'utf8').replace(/\r\n?/g,'\n');
 const actual=crypto.createHash('sha256').update(source,'utf8').digest('hex');
 if(actual!==e.sha256)throw Error(`CP93 SOURCE FAIL: ${e.path}`);
}
console.log(`CP93 CHANGED/ADDED SOURCE PASS: ${m.files.length} files SHA256 matched (NOT a full CP92 rebaseline or live test).`);
