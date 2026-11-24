import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guardedJson, visibleGeminiText, upstreamStage} from '../api/geminiTransport.ts';
const url='https://generativelanguage.googleapis.com/v1beta/models/test:generateContent';
test('transport accepts valid response envelope larger than old 18 KB cap',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{thought:true,text:'x'.repeat(30_000)},{text:'OK'}]}}]})));
 const r=await guardedJson(url,{},500);assert.equal(r.ok,true);assert.equal(visibleGeminiText(r.data.candidates[0].content.parts),'OK');
});
test('transport retains upstream status without echoing errors',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('not JSON',{status:429}));
 const r=await guardedJson(url,{},500);assert.equal(r.status,429);assert.equal(r.data,null);
});
test('invalid successful JSON has explicit stage',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('html'));
 await assert.rejects(guardedJson(url,{},500),{code:'INVALID_JSON',stage:'GEMINI_GENERATE'});
});
test('oversize response is rejected during streaming',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('x'.repeat(1025)));
 await assert.rejects(guardedJson(url,{},500,1024),{code:'REPLY_LIMIT'});
});
test('network faults report role stage, not URL or credentials',async t=>{
 t.mock.method(globalThis,'fetch',async()=>{throw new Error('SECRET_TOKEN');});
 await assert.rejects(guardedJson('https://firestore.googleapis.com/v1/test?key=PRIVATE',{},500),e=>e.code==='NETWORK'&&e.stage==='FIRESTORE_ROLE'&&!/SECRET|PRIVATE/.test(e.message));
});
test('timeout is bounded and stage-specific',async t=>{
 t.mock.method(globalThis,'fetch',async(_url,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true})));
 await assert.rejects(guardedJson(url,{},15),{code:'TIMEOUT',stage:'GEMINI_GENERATE'});
});
test('thought-only output is not a response and auth stage is explicit',()=>{
 assert.equal(visibleGeminiText([{thought:true,text:'private'}]),'');
 assert.equal(upstreamStage('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=PRIVATE'),'FIREBASE_AUTH');
});
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const luminance=hex=>{const rgb=hex.match(/[a-f0-9]{2}/gi).map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
test('light surfaces and text pairs meet 4.5:1 for tested palette colors',()=>{
 const css=read('src/styles/53-cla-focused-admission.css');
 for(const surface of ['ffffff','edf4ff','fff7e8','e9eef5','f2f6fc'])for(const fg of ['142941','405a72','526a81','1c4f9d','176346','754216']){
  const a=luminance(fg),b=luminance(surface);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${fg}/${surface}`);
 }
 for(const c of ['atlas-combination-studio','atlas-official-pathways','atlas-national-result','cla-projection-table input','atlas-combination-card.is-selected'])assert.ok(css.includes(c));
 assert.match(css,/color: #142941;\s*background: linear-gradient/);
});
test('all handlers use guarded transport; security checks remain present',()=>{
 for(const p of ['gemini-chat','gemini-lumen','gemini-admission-reader']){
 const src=read('api/'+p+'.ts');assert.match(src,/guardedJson\(/);assert.match(src,/visibleGeminiText\(/);assert.match(src,/authorization/i);assert.match(src,/accounts:lookup/);assert.match(src,/firestore\.googleapis\.com/);
 }
});
