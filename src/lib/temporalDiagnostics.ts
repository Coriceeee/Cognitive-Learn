/** Descriptive, robust diagnostics. No p-values, calibrated intervals or automatic action. */
import {strictUtc} from './dynamicStudentState.ts';
import type {TemporalSeries} from './temporalStudentIntelligence.ts';
export const TEMPORAL_DIAGNOSTICS_VERSION='cla-temporal-diagnostics-v1';
const DAY=86400000;
const spec={studyHoursPerWeek:{max:168,shift:3},planCompletionRate:{max:100,shift:15},motivationLevel:{max:100,shift:15},SCI:{max:100,shift:15},MAS:{max:100,shift:15},CSL:{max:100,shift:15}} as const;
const median=(a:number[])=>{const s=[...a].sort((x,y)=>x-y);return (s[Math.floor((s.length-1)/2)]+s[Math.floor(s.length/2)])/2;};
const round=(x:number)=>Math.round(x*100)/100;
const loss=(a:number[])=>{const m=median(a);return a.reduce((s,v)=>s+Math.abs(v-m),0);};
export function diagnoseTemporal(series:TemporalSeries){
 const p=series.points, cfg=spec[series.metric];
 const empty={version:TEMPORAL_DIAGNOSTICS_VERSION,trendPerWeek:null as number|null,direction:null as 'UP'|'DOWN'|'FLAT'|null,change:null as null|{at:string;before:number;after:number;lossReduction:number},latest:null as null|{value:number;baselineMedian:number;threshold:number;flag:boolean},sourceIds:[] as string[]};
 if(!cfg||series.status!=='DESCRIPTIVE'||p.length<3||p.length>10||p.some((v,i)=>!strictUtc(v.at)||!v.snapshotId||!Number.isFinite(v.value)||v.value<0||v.value>cfg.max||(i>0&&(v.at.slice(0,10)<=p[i-1].at.slice(0,10)||Date.parse(v.at)-Date.parse(p[i-1].at)>28*DAY)))||new Set(p.map(v=>v.snapshotId)).size!==p.length)return empty;
 const t=p.map(v=>Date.parse(v.at)/DAY), y=p.map(v=>v.value);
 if(t[t.length-1]-t[0]<7)return empty;
 const slopes:number[]=[];for(let i=0;i<y.length;i++)for(let j=i+1;j<y.length;j++)slopes.push((y[j]-y[i])/(t[j]-t[i])*7);
 const slope=median(slopes), direction: 'UP'|'DOWN'|'FLAT'=Math.abs(slope)<cfg.shift/2?'FLAT':slope>0?'UP':'DOWN';
 // Minimum three observations and seven elapsed days per side. L1 loss, robust medians.
 let change=empty.change, best=0;const total=loss(y);
 for(let k=3;k<=y.length-3;k++){
  if(t[k-1]-t[0]<7||t[t.length-1]-t[k]<7||total<=0)continue;
  const a=y.slice(0,k),b=y.slice(k), difference=median(b)-median(a), improvement=(total-loss(a)-loss(b))/total;
  if(Math.abs(difference)>=cfg.shift&&improvement>=.5&&improvement>best){best=improvement;change={at:p[k].at,before:median(a),after:median(b),lossReduction:round(improvement)};}
 }
 // Latest value excluded from baseline; floor prevents zero MAD from flagging tiny changes.
 let latest=empty.latest; if(y.length>=6&&t[y.length-2]-t[0]>=7){const baseline=y.slice(0,-1),m=median(baseline),mad=median(baseline.map(v=>Math.abs(v-m))),threshold=Math.max(cfg.shift,3*1.4826*mad);latest={value:y[y.length-1],baselineMedian:m,threshold:round(threshold),flag:Math.abs(y[y.length-1]-m)>=threshold};}
 return {...empty,trendPerWeek:round(slope),direction,change,latest,sourceIds:p.map(v=>v.snapshotId)};
}
