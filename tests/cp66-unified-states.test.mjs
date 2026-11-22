import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveDraftUiStatus } from '../src/lib/moduleUiStatus.ts';

const source = f => readFileSync(new URL('../'+f,import.meta.url),'utf8');
const pages=Object.fromEntries(['orion','pulse','haven','lumen','atlas'].map(n=>[n,source(`src/page/${n}/${n[0].toUpperCase()+n.slice(1)}Page.tsx`)]));
const seed=source('src/page/seed/StudentTranscriptPage.tsx');
const view=source('src/components/common/ModuleStateNotice.tsx');
const feedback=source('src/components/common/ModuleDraftFeedback.tsx');
const styles=source('src/styles/45-cla-module-state-system.css');
const baseline = { status:'ready', conflict:false, saving:false };
const status = x => resolveDraftUiStatus({...baseline,...x});

describe('CP66 pure and deterministic Firestore status UI',()=>{
 it('shows verified status only on confirmed ready',()=>assert.deepEqual(status({}),{tone:'success',label:'Đã đồng bộ',message:'Bản nháp đã được Firestore xác minh từ máy chủ.'}));
 it('never calls cache-backed syncing saved',()=>{
   const s=status({status:'syncing',notice:'Đã lưu vào hồ sơ',noticeTone:'success'});
   assert.equal(s.tone,'loading');assert.match(s.message,/cache chưa phải dữ liệu đã đồng bộ/);
 });
 it('never shows ready for loading, signed-out, or denied reads',()=>{
   for(const state of ['loading','signed-out','error']) assert.notEqual(status({status:state}).tone,'success');
 });
 it('gives conflicts precedence over stale save notices',()=>{
   const s=status({conflict:true,notice:'Đã lưu',noticeTone:'success'});
   assert.equal(s.tone,'error');assert.match(s.message,/thiết bị khác/);
 });
 it('never claims saved while an upload is pending',()=>{
   const s=status({saving:true,notice:'Đã lưu',noticeTone:'success'});
   assert.equal(s.tone,'loading');assert.match(s.message,/Chưa được xác nhận/);
 });
 it('distinguishes missing draft from confirmed saved draft',()=>{
   assert.deepEqual([status({status:'empty'}).tone,status({status:'ready'}).tone],['neutral','success']);
 });
 it('distinguishes failed writes from positive notices',()=>{
   const s=status({notice:'Không thể lưu',noticeTone:'error'});
   assert.equal(s.tone,'error');assert.equal(s.message,'Không thể lưu');
 });
 it('does not hide user edits behind old successful notices',()=>{
   const s=status({dirty:true,notice:'Đã lưu',noticeTone:'success'});
   assert.equal(s.tone,'warning');assert.match(s.message,/chỉnh sửa mới/);
 });
 it('does not call failed autosave successful',()=>{
   const s=status({autosave:'pending'});
   assert.equal(s.tone,'warning');assert.match(s.message,/chưa thành công/);
 });
 it('keeps in-progress autosave distinct from completed autosave',()=>{
   assert.equal(status({autosave:'saving',dirty:true}).tone,'loading');
   assert.equal(status({autosave:'saving'}).tone,'loading');
   assert.equal(status({autosave:'saved'}).tone,'success');
 });
 it('does not trust a stale success notice when the account signed out',()=>{
   const s=status({status:'signed-out',notice:'Đã lưu',noticeTone:'success'});
   assert.equal(s.tone,'warning');
 });
});

describe('CP66 integration: one status vocabulary in six modules',()=>{
 it('renders consistent form feedback for Orion, Pulse and Haven',()=>{
   for(const module of ['orion','pulse','haven']){
     assert.match(pages[module],/import ModuleDraftFeedback from/);
     assert.match(pages[module],/<ModuleDraftFeedback status=\{saveStatus\}/);
     assert.match(pages[module],/noticeTone=\{saveNoticeTone\}/);
     assert.match(pages[module],/className="cla-firestore-save cla-module-save-panel"/);
     assert.match(pages[module],/saveStatus !== "ready" && saveStatus !== "empty"/);
     assert.match(pages[module],/draftConflict && <button/);
   }
 });
 it('clears stale save notices on every edit in Pulse and Haven',()=>{
   for(const module of ['pulse','haven']){
     const page=pages[module];
     assert.match(page,/function markLocalEdit\(\) \{[\s\S]*?setSaveNotice\(""\);/);
     assert.doesNotMatch(page,/onChange=\{\(event\) => \{ markEditing\(\)/);
     assert.match(page,/const revision = editVersion.current/);
     assert.match(page,/if \(editVersion.current === revision\)/);
     assert.match(page,/setSaveNotice\("Đã lưu phiên bản trước; thay đổi mới vẫn chưa lưu\."\)/);
   }
 });
 it('keeps Orion autosave and newer edit protections intact',()=>{
   assert.match(pages.orion,/dirtyRevision\.current = true/);
   assert.match(pages.orion,/editRevision\.current === revision/);
   assert.match(pages.orion,/setAutosaveState\("pending"\)/);
   assert.match(pages.orion,/autosave=\{autosaveState\}/);
 });
 it('uses status-specific panels for Seed transcript, Lumen and Atlas',()=>{
   assert.match(seed,/status === "syncing" && <ModuleStateNotice/);
   assert.match(seed,/status === "error" && <ModuleStateNotice/);
   assert.match(seed,/onClick=\{retry\}/);
   assert.match(pages.lumen,/label="Chờ Firestore xác minh"/);
   assert.match(pages.lumen,/label="Chưa có hồ sơ học sinh"/);
   assert.match(pages.atlas,/label="Đối chiếu nguồn tuyển sinh"/);
   assert.match(pages.atlas,/storageError \? "error"/);
 });
 it('keeps explicit accessibility roles and is not merely a color badge',()=>{
   assert.match(view,/role=\{tone === 'error' \? 'alert' : 'status'\}/);
   assert.match(view,/aria-live=/);
   assert.match(view,/className="cla-module-state-label"/);
   assert.match(view,/<strong/);
   assert.match(feedback,/resolveDraftUiStatus\(props\)/);
 });
 it('includes accessible mobile, dark, focus, print, reduced-motion CSS',()=>{
   assert.match(source('src/styles.css'),/45-cla-module-state-system\.css/);
   for(const re of [/:root\[data-theme="dark"\]/,/@media\(max-width:650px\)/,/:focus-visible/,/@media\(prefers-reduced-motion:reduce\)/,/@media print/]) assert.match(styles,re);
 });
 it('keeps it a UI layer, not a change to Firestore authorisation',()=>{
   assert.doesNotMatch(view,/runTransaction|setDoc|onSnapshot|localStorage/);
   assert.doesNotMatch(feedback,/runTransaction|setDoc|onSnapshot|localStorage/);
   assert.match(source('src/lib/useModuleDraft.ts'),/isServerConfirmedSnapshot/);
 });
});
