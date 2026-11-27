/** CP38 descriptive temporal analytics over existing Seed snapshots; never drives policy automatically. */
import {asRecord,numberWithin,strictUtc} from './dynamicStudentState.ts';
import { DEMO_TEMPORAL_FIXTURE_VERSION } from './demoTemporalSeed.ts';
export const TEMPORAL_VERSION='cla-temporal-v1' as const;
const DAY=86400000, HALF_LIFE_DAYS=7, MAX_GAP_DAYS=28, WINDOW=10;
const SPECS=[{key:'studyHoursPerWeek',max:168,step:3},{key:'planCompletionRate',max:100,step:15},{key:'motivationLevel',max:100,step:15},{key:'SCI',max:100,step:15},{key:'MAS',max:100,step:15},{key:'CSL',max:100,step:15}] as const;
type Metric=typeof SPECS[number]['key'];
type Point={snapshotId:string;at:string;value:number};
export type TemporalSeries={metric:Metric;points:Point[];ema:number|null;delta:number|null;spanDays:number;status:'INSUFFICIENT'|'DESCRIPTIVE';latestShift:boolean|null;predictionInterval:null};
export type TemporalStudentReport={version:typeof TEMPORAL_VERSION;status:'BLOCKED'|'NO_HISTORY'|'INSUFFICIENT'|'DESCRIPTIVE';reason:string;windowMayBeTruncated:boolean;rows:number;distinctDays:number;syntheticRows:number;series:TemporalSeries[];limitations:string[]};
const LIMITS=['Profile saves are self-reports, not independent verified measurements. Latest save per UTC day only.','At most ten newest snapshots; gaps over 28 days or missing values break the series.','EMA half-life 7 days; at least 3 distinct days and 7 days span. Thresholds are descriptive heuristics, not validated change points or anomalies.','No forecast, calibrated confidence, intervention effect or automatic policy update.'];
const round=(n:number)=>Math.round(n*100)/100;
export function analyzeStudentTemporal(input:unknown,uid:string,scope:'student'|'demo',serverConfirmed:boolean,asOf:string):TemporalStudentReport {
 const report:TemporalStudentReport={version:TEMPORAL_VERSION,status:'BLOCKED',reason:'INVALID_WINDOW',windowMayBeTruncated:false,rows:0,distinctDays:0,syntheticRows:0,series:[],limitations:[...LIMITS]};
 if(serverConfirmed!==true||!uid||(scope!=='student'&&scope!=='demo')||!strictUtc(asOf)||!Array.isArray(input)||input.length>WINDOW+1)return report;
 if(!input.length)return {...report,status:'NO_HISTORY',reason:'EMPTY'};
 report.windowMayBeTruncated=input.length>WINDOW;
 const ids=new Set<string>(), times=new Set<string>();
 const valid: {id:string;at:string;row:Record<string,unknown>}[]=[];
 for(const item of input){
   const r=asRecord(item);
   if(!r||r.studentId!==uid||r.dataScope!==scope||typeof r.id!=='string'||!r.id||r.id.length>200||ids.has(r.id)||!strictUtc(r.createdAt)||times.has(r.createdAt)||Date.parse(r.createdAt)>Date.parse(asOf))return report;
   ids.add(r.id);times.add(r.createdAt);valid.push({id:r.id,at:r.createdAt,row:r});
 }
 const recent=valid.sort((a,b)=>a.at.localeCompare(b.at)).slice(-WINDOW);
 report.rows=recent.length;
 const days=new Map<string,typeof recent[number]>();for(const point of recent)days.set(point.at.slice(0,10),point);
 const daily=[...days.values()];report.distinctDays=daily.length;report.syntheticRows=daily.filter(p=>p.row.recordType==='SYNTHETIC_DEMO'&&p.row.demoFixtureVersion===DEMO_TEMPORAL_FIXTURE_VERSION).length;
 for(const spec of SPECS){
   const segment:Point[]=[];
   for(const p of daily){
     let v=numberWithin(p.row[spec.key],spec.max);
     if(spec.key==='SCI'||spec.key==='MAS'||spec.key==='CSL'){
       if(p.row.mappingVersion!=='cla-cognitive-proxy-v2'||!Array.isArray(p.row.missingDimensions)||p.row.missingDimensions.includes(spec.key))v=null;
     }
     if(v===null){segment.length=0;continue;}
     if(segment.length && (Date.parse(p.at)-Date.parse(segment[segment.length-1].at))/DAY>MAX_GAP_DAYS)segment.length=0;
     segment.push({snapshotId:p.id,at:p.at,value:v});
   }
   const span=segment.length>1?(Date.parse(segment[segment.length-1].at)-Date.parse(segment[0].at))/DAY:0;
   const ready=segment.length>=3&&span>=7;
   let ema=segment[0]?.value??0;
   if(ready)for(let i=1;i<segment.length;i++){const dt=(Date.parse(segment[i].at)-Date.parse(segment[i-1].at))/DAY;const alpha=1-Math.pow(0.5,dt/HALF_LIFE_DAYS);ema+=alpha*(segment[i].value-ema);}
   report.series.push({metric:spec.key,points:segment,spanDays:round(span),status:ready?'DESCRIPTIVE':'INSUFFICIENT',ema:ready?round(ema):null,delta:ready?round(segment[segment.length-1].value-segment[0].value):null,latestShift:ready?Math.abs(segment[segment.length-1].value-segment[segment.length-2].value)>=spec.step:null,predictionInterval:null});
 }
 report.status=report.series.some(s=>s.status==='DESCRIPTIVE')?'DESCRIPTIVE':'INSUFFICIENT';report.reason=report.status==='DESCRIPTIVE'?'OBSERVED_SELF_REPORT_ONLY':'MINIMUM_WINDOW_NOT_MET';return report;
}
