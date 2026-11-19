import test from 'node:test';import assert from 'node:assert/strict';
import {cognitiveResearchReadiness} from '../src/lib/cognitiveResearchReadiness.ts';
const v='cla-cognitive-proxy-v2';const base=()=>({mappingVersion:v,SCI:0,MAS:72,CSL:0,vector:{mappingVersion:v,SCI:0,MAS:72,CSL:0,availableDimensions:['SCI','MAS'],missingDimensions:['CSL']},dimensions:[{code:'SCI',available:true,value:0},{code:'MAS',available:true,value:72},{code:'CSL',available:false,value:0}]});
test('valid zero retained; missing zero never displayed',()=>{const a=cognitiveResearchReadiness(base());assert.deepEqual(a.rows.map(x=>x.value),[0,72,null]);assert.equal(a.availableCount,2);assert.equal(a.researchValidation,'NOT_VALIDATED');});
test('unsupported version and malformed values remain unavailable',()=>{const r=base();r.mappingVersion='legacy';assert.equal(cognitiveResearchReadiness(r).availableCount,0);assert.equal(cognitiveResearchReadiness(null).availableCount,0);});
test('disagreeing provenance fails closed',()=>{const r=base();r.vector.missingDimensions.push('SCI');r.dimensions[1].value=71;assert.equal(cognitiveResearchReadiness(r).availableCount,0);});
test('duplicate dimensions and nonfinite values rejected',()=>{const r=base();r.dimensions.push({...r.dimensions[0]});r.MAS=r.vector.MAS=r.dimensions[1].value=NaN;assert.equal(cognitiveResearchReadiness(r).availableCount,0);});
