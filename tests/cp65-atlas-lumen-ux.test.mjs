import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { summarizeAtlasEvidence } from '../src/lib/atlasEvidenceOverview.ts';

const source = path => readFileSync(new URL(path, import.meta.url),'utf8');
const atlas = source('../src/page/atlas/AtlasPage.tsx');
const lumen = source('../src/page/lumen/LumenPage.tsx');
const atlasPanel = source('../src/page/atlas/components/AtlasEvidenceJourney.tsx');
const lumenPanel = source('../src/page/lumen/components/LumenObservationJourney.tsx');
const stylesheet = source('../src/styles/44-cla-atlas-lumen-journey.css');
const stylesEntry = source('../src/styles.css');
const rows = [
  {universityId:'a', year:2024, source:'https://a.vn/2024', code:'01',campus:'Hà Nội',method:'THPT'},
  {universityId:'a', year:2024, source:'https://a.vn/2024', code:'02',campus:'Hà Nội',method:'THPT'},
  {universityId:'b', year:2025, source:'https://b.vn/2025', code:'01',campus:'HCM',method:'HSA'},
  {universityId:'a', year:2026, source:'', code:'01',campus:'Hà Nội',method:'THPT'},
];

describe('CP65 source-backed Atlas overview',()=>{
  it('counts registry rows not inferred national coverage',()=>{
    assert.deepEqual(summarizeAtlasEvidence(rows),[
      {year:2024,records:2,universities:1,distinctSources:1},
      {year:2025,records:1,universities:1,distinctSources:1},
      {year:2026,records:1,universities:1,distinctSources:0},
    ]);
  });
  it('keeps missing years explicitly zero without interpolation',()=>{
    assert.deepEqual(summarizeAtlasEvidence(rows,[2023,2025,2027]).map(x=>x.records),[0,1,0]);
  });
  it('does not invent rows when data is empty',()=>{
    assert.equal(summarizeAtlasEvidence([]).reduce((n,x)=>n+x.records,0),0);
  });
  it('retains distinction between records, universities, distinct URLs',()=>{
    const x=summarizeAtlasEvidence(rows)[0];
    assert.equal(x.records,2); assert.equal(x.universities,1); assert.equal(x.distinctSources,1);
  });
  it('reads actual registry instead of hard-coded numbers',()=>{
    assert.match(atlasPanel,/summarizeAtlasEvidence\(nationalCutoffs\)/);
    assert.match(atlasPanel,/không phải số trường toàn quốc/);
    assert.match(atlasPanel,/Năm có nhiều bản ghi hơn không có nghĩa/);
    assert.doesNotMatch(atlasPanel,/xác suất đỗ:\s*\{/);
  });
  it('exposes four real active task routes and works with soft links',()=>{
    for(const route of ['/atlas/sources','/atlas/vietnam','/atlas/compare','/atlas/subjects']) assert.ok(atlasPanel.includes(route));
    assert.doesNotMatch(atlasPanel,/window\.location|location\.assign/);
    assert.match(atlasPanel,/nav aria-label="Hành trình tra cứu Atlas"/);
  });
  it('keeps Atlas year-by-year cutoff graph visible on comparison tab',()=>{
    assert.match(atlas,/view === "\/atlas\/compare" && <AtlasCutoffField \/>/);
    assert.doesNotMatch(atlas,/<summary>Xem biểu đồ điểm công bố/);
  });
  it('limits visual pathway to Atlas overview rather than every nested tab',()=>{
    assert.match(atlas,/view === "\/atlas" && <>/);
    assert.match(atlas,/AtlasEvidenceJourney \/>/);
    assert.ok(atlas.indexOf('<ModuleSectionNav moduleKey="atlas" />') < atlas.indexOf('view === "/atlas" && <>'), 'Atlas tabs should be visible before the large home overview');
  });
});

describe('CP65 Lumen observation-first UX',()=>{
  it('adds evidence journey and chart to the overview only',()=>{
    assert.match(lumen,/view === "\/lumen" && <>/);
    assert.match(lumen,/LumenObservationJourney cognitive=\{cognitive\} growth=\{growthAnalytics\} historyLoading=\{historyLoading\}/);
    assert.match(lumen,/LumenSignalAtlas cognitive=\{cognitive\} growth=\{growthAnalytics\} mode="indices"/);
  });
  it('never treats missing dimensions as observed zeros',()=>{
    assert.match(lumenPanel,/item.available === true && Number.isFinite\(item.value\)/);
    assert.match(lumenPanel,/cognitive.scoreAvailable === true/);
  });
  it('does not claim growth before history verification',()=>{
    assert.match(lumenPanel,/!historyLoading && growth !== null && growth.overall.previous !== null/);
    assert.match(lumenPanel,/Đang kiểm tra lịch sử/);
    assert.match(lumenPanel,/Chưa đủ cặp đo hợp lệ/);
  });
  it('routes unavailable insights to Seed completion, not a fake AI result',()=>{
    assert.match(lumenPanel,/canExplain \? "\/lumen\/insights" : "\/student\/profile"/);
    assert.match(lumenPanel,/không phải điểm số AI/);
  });
  it('leaves other Lumen tabs intact',()=>{
    for(const route of ['/lumen/history','/lumen/indices','/lumen/insights','/lumen/roadmap','/lumen/evidence','/lumen/assistant']) assert.ok(lumen.includes(route));
  });
});

describe('CP65 usability, release tracking and limitations',()=>{
  it('supports semantic navigation and readable chart numbers',()=>{
    assert.match(atlasPanel,/aria-label="Số bản ghi/);
    assert.match(atlasPanel,/\.toLocaleString\("vi-VN"\)/);
    assert.match(lumenPanel,/<ol className="cla-lumen-journey-list">/);
    assert.match(stylesheet,/:focus-visible/);
  });
  it('includes mobile, dark, print and reduced-motion rules',()=>{
    assert.match(stylesEntry,/44-cla-atlas-lumen-journey\.css/);
    assert.match(stylesheet, /:root\[data-theme="dark"\]/);
    assert.match(stylesheet, /@media\(max-width:620px\)/);
    assert.match(stylesheet, /@media print/);
    assert.match(stylesheet, /prefers-reduced-motion/);
  });
  it('fingerprints CSS and logic files for release provenance',()=>{
    const {trackedFiles} = createRequire(import.meta.url)('../tools/cp31_release_fingerprint.cjs');
    const files=trackedFiles();
    for(const file of ['src/styles/44-cla-atlas-lumen-journey.css','src/lib/atlasEvidenceOverview.ts','src/page/atlas/components/AtlasEvidenceJourney.tsx','src/page/lumen/components/LumenObservationJourney.tsx']) assert.ok(files.includes(file),file);
  });
});
