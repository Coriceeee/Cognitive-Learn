/** CP41: synthetic-only contextual bandit experiment. No app imports, real records,
 * network, persistence to Firestore, or deployment interface. */
export const VERSION='cla-contextual-bandit-sandbox-v1';
const ACTIONS=['MAINTAIN','REDUCE'];
const STATES=['stable','strained','overload'];
const BASELINE='static-safe-v1';
const CANDIDATE='contextual-mean-reward-v1';
const MIN=40;
// Fictional Bernoulli probabilities [goal completion, manageable burden].
const world={stable:{MAINTAIN:[.83,.86],REDUCE:[.67,.95]},strained:{MAINTAIN:[.50,.44],REDUCE:[.73,.83]},overload:{REDUCE:[.61,.77]}};
const allowed=s=>s==='overload'?['REDUCE']:STATES.includes(s)?[...ACTIONS]:[];
const baseline=s=>s==='overload'?'REDUCE':STATES.includes(s)?'MAINTAIN':null;
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const reward=(row,w)=>w*row.goal+(1-w)*row.manageable;
export function makeSynthetic(n,seed,split){
 if(!Number.isInteger(n)||n<1||n>20000||!Number.isInteger(seed)||!['train','test'].includes(split))throw Error('Invalid synthetic fixture parameters');
 const rand=rng(seed);return Array.from({length:n},(_,i)=>{const state=STATES[Math.floor(rand()*STATES.length)],choices=allowed(state),action=choices[Math.floor(rand()*choices.length)];const [g,b]=world[state][action];return {id:`SYNTHETIC-${split}-${i}`,scope:'SYNTHETIC',state,action,propensity:1/choices.length,goal:Number(rand()<g),manageable:Number(rand()<b)};});
}
function validate(rows,split){
 if(!Array.isArray(rows)||!rows.length||rows.length>20000)throw Error('Missing/bounded synthetic split required');
 const ids=new Set();for(const r of rows){if(!r||r.scope!=='SYNTHETIC'||typeof r.id!=='string'||!(new RegExp(`^SYNTHETIC-${split}-[0-9]+$`)).test(r.id)||ids.has(r.id)||!allowed(r.state).includes(r.action)||r.propensity!==1/allowed(r.state).length||![0,1].includes(r.goal)||![0,1].includes(r.manageable))throw Error('Invalid synthetic row, duplicate, unsupported action or logging propensity');ids.add(r.id);}
}
function checkWeight(w){if(!Number.isFinite(w)||w<0||w>1)throw Error('Reward weight must be in [0,1]');}
export function trainPolicy(rows,w=.6){
 validate(rows,'train');checkWeight(w);const decisions={};const support={};
 for(const s of STATES){const stats=allowed(s).map(action=>{const data=rows.filter(r=>r.state===s&&r.action===action);return {action,n:data.length,mean:data.length?data.reduce((a,r)=>a+reward(r,w),0)/data.length:null};});support[s]=stats;
  const enough=stats.every(a=>a.n>=MIN);const fallback=baseline(s);const ranked=[...stats].sort((a,b)=>(b.mean??-1)-(a.mean??-1)||Number(b.action===fallback)-Number(a.action===fallback));decisions[s]=enough?ranked[0].action:fallback;
 }
 return {version:CANDIDATE,weight:w,decisions,support,minPerAction:MIN};
}
function policyAction(policy,state){const act=policy?.decisions?.[state];if(!allowed(state).includes(act))throw Error('Policy violates allowed action mask');return act;}
export function evaluatePolicy(rows,policy,w=.6){
 validate(rows,'test');checkWeight(w);if(policy.weight!==w)throw Error('Reward mismatch');
 let sum=0,sw=0,sw2=0,matched=0;const rewards=[];const actions={MAINTAIN:0,REDUCE:0};
 for(const row of rows){const act=policyAction(policy,row.state);actions[act]++;const iw=row.action===act?1/row.propensity:0;const val=reward(row,w)*iw;sum+=val;sw+=iw;sw2+=iw*iw;matched+=Number(iw>0);rewards.push(val);}
 return {ips:sum/rows.length,snips:sw?sum/sw:null,ess:sw2?sw*sw/sw2:0,matched,n:rows.length,actions,rewards};
}
function comparison(train,test,w){const p=trainPolicy(train,w);const b={version:BASELINE,weight:w,decisions:Object.fromEntries(STATES.map(s=>[s,baseline(s)]))};const x=evaluatePolicy(test,b,w),y=evaluatePolicy(test,p,w);const dif=y.rewards.map((v,i)=>v-x.rewards[i]);const delta=dif.reduce((a,v)=>a+v,0)/dif.length;
 // Paired nonparametric bootstrap on independent synthetic units, not real learners.
 const rand=rng(37041);const boot=Array.from({length:400},()=>{let v=0;for(let i=0;i<dif.length;i++)v+=dif[Math.floor(rand()*dif.length)];return v/dif.length;}).sort((a,b)=>a-b);
 // Known simulator expectation, unavailable for real observational logs.
 const oracle=policy=>test.reduce((sum,r)=>{const [g,b]=world[r.state][policyAction(policy,r.state)];return sum+w*g+(1-w)*b;},0)/test.length;
 const strip=({rewards,...rest})=>rest;
 return {weight:w,policy:p,baseline:{version:BASELINE,decisions:b.decisions,...strip(x),oracle:oracle(b)},candidate:{version:CANDIDATE,...strip(y),oracle:oracle(p)},pairedIpsDelta:delta,syntheticBootstrap95:[boot[10],boot[389]]};
}
export function runSandbox(){const train=makeSynthetic(1800,41901,'train'),test=makeSynthetic(1200,41902,'test');return {version:VERSION,scope:'SYNTHETIC_ONLY',deploymentAllowed:false,realEvaluation:'NOT_EVALUABLE',trainN:train.length,testN:test.length,split:'independent synthetic cohorts; predeclared seeds 41901/41902',reward:'w * fictional goalMet + (1-w) * fictional manageableBurden',logging:'uniform over safe actions; overload -> REDUCE only',comparisons:[.4,.6,.8].map(w=>comparison(train,test,w)),rollback:{activeLivePolicyUnchanged:true,candidateExportAllowed:false,baseline:BASELINE},limitations:['Simulation probabilities hand-authored; reward is not GPA or clinical wellbeing.','No evidence of educational benefit, real-world propensity validity, or policy safety.','One synthetic decision per unit; no delayed rewards or RL.','Bootstrap interval is conditional on the fictional generator and frozen learned policy.','No live policy update or automatic assignments.']};}
