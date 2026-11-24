import test from 'node:test';
import assert from 'node:assert/strict';
import {stageAdmissionGoal,readAdmissionGoal,clearAdmissionGoal,formatAdmissionGoal} from '../src/lib/admissionGoalHandoff.ts';
const goal={majorName:'CNTT',universityName:'Trường A',majorCode:'7480201',year:2026};
test('explicit handoff preserves preference, no invented scores',()=>{assert.equal(stageAdmissionGoal('A',goal,100),true);assert.deepEqual(readAdmissionGoal('A',101),goal);assert.match(formatAdmissionGoal(goal),/7480201/);clearAdmissionGoal();assert.equal(readAdmissionGoal('A',102),null);});
test('other account cannot read and clears handoff',()=>{stageAdmissionGoal('A',goal,100);assert.equal(readAdmissionGoal('B',101),null);assert.equal(readAdmissionGoal('A',102),null);});
test('expiry, invalid owner and missing goal are rejected',()=>{stageAdmissionGoal('A',goal,100);assert.equal(readAdmissionGoal('A',300100),null);assert.equal(stageAdmissionGoal('',goal,100),false);assert.equal(stageAdmissionGoal('A',{...goal,majorName:' '},100),false);});

test('formatted goal fits existing journey constraints',()=>{const long={...goal,majorName:'A'.repeat(120),universityName:'B'.repeat(120)};assert.ok(formatAdmissionGoal(long).length<=120);assert.match(formatAdmissionGoal(long),/7480201, 2026/);});

test('backward clock invalidates the pending goal',()=>{stageAdmissionGoal('A',goal,100);assert.equal(readAdmissionGoal('A',99),null);assert.equal(readAdmissionGoal('A',101),null);});
