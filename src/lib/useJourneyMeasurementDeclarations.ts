import {useEffect,useMemo,useState} from 'react';
import {collection,doc,onSnapshot,query,runTransaction,serverTimestamp,where,limit} from 'firebase/firestore';
import {auth,db} from './firebase';
import {isJourneyCycle,type JourneyCycle} from './closedLoopJourney';
import {auditMeasurementSnapshot,MAX_MEASUREMENT_WINDOW_DOCS,
  type MeasurementSnapshotAudit} from './journeyMeasurementSnapshot';
import {buildMeasurementDeclaration,manifestFromStoredMeasurements,
  measurementDeclarationDocId,
  type MeasurementContextInput,type StoredMeasurementDeclaration} from './journeyMeasurementDeclarations';

const root='learning_journeys';
type LoadStatus='idle'|'loading'|'ready'|'error';
const errorText=(error:unknown)=>{
  const code=(error as {code?:string})?.code;
  return code==='permission-denied'
    ? 'Firestore chưa cấp quyền lưu/đọc khai báo phép đo. Chỉ triển khai Rules ứng viên sau khi kiểm thử Emulator và QA.'
    : error instanceof Error ? error.message : 'Không thể đồng bộ khai báo phép đo.';
};
/** Only listens to declarations belonging to the currently displayed bounded cycle window. */
export function useJourneyMeasurementDeclarations(uid:string,cycles:JourneyCycle[]){
  const [rows,setRows]=useState<StoredMeasurementDeclaration[]>([]);
  const [coverage,setCoverage]=useState<MeasurementSnapshotAudit|null>(null);
  const [status,setStatus]=useState<LoadStatus>('idle');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const ids=useMemo(()=>cycles.map(c=>c.id).sort(),[cycles]);
  const idsKey=ids.join('|');
  useEffect(()=>{
    setRows([]);setCoverage(null);setError('');
    if(!uid || !ids.length){setStatus('idle');return;}
    if(ids.length>8 || ids.some(id=>!/^\w[\w-]{7,99}$/.test(id))){setStatus('error');setError('Cửa sổ chu kỳ không hợp lệ.');return;}
    setStatus('loading');
    const currentCycles=cycles;
    let cancelled=false;
    // Fetch one sentinel beyond the accepted maximum; limit(96) silently conceals overflow.
    const observer=onSnapshot(query(collection(db,root,uid,'measurement_declarations'),where('cycleId','in',ids),limit(MAX_MEASUREMENT_WINDOW_DOCS+1)),snapshot=>{
      if(cancelled || auth.currentUser?.uid!==uid)return;
      // An initial local cache view and pending local writes are not server-consistent evidence.
      if(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites){
        setRows([]);setCoverage(null);setStatus('loading');
        setError('Đang đợi dữ liệu Firestore xác nhận từ máy chủ; cache cục bộ chưa đủ để kiểm toán.');return;
      }
      const audit=auditMeasurementSnapshot(uid,currentCycles,snapshot.docs.map(d=>({id:d.id,data:d.data()})));
      if(audit.state==='BLOCKED'){
        setRows([]);setCoverage(audit);setStatus('error');setError(`Khai báo phép đo không nhất quán (${audit.reason}); đã ẩn dữ liệu cũ.`);return;
      }
      setRows(audit.rows);setCoverage(audit);setStatus('ready');setError('');
    },err=>{if(!cancelled && auth.currentUser?.uid===uid){setRows([]);setCoverage(null);setStatus('error');setError(errorText(err));}});
    return ()=>{cancelled=true;observer();};
  },[uid,idsKey,cycles]);
  async function save(cycleId:string,subjectKey:string,timepoint:'T0'|'T1',context:MeasurementContextInput){
    if(busy || status!=='ready' || auth.currentUser?.uid!==uid)
      throw new Error('Chưa tải xong dữ liệu hoặc tài khoản đã thay đổi.');
    setBusy(true);setError('');
    try{
      const cycle=cycles.find(c=>c.id===cycleId);
      if(!cycle || !isJourneyCycle(cycle))throw new Error('Chu kỳ không tồn tại hoặc bị thay đổi.');
      const expected=buildMeasurementDeclaration(cycle,uid,subjectKey,timepoint,context);
      const ref=doc(db,root,uid,'measurement_declarations',measurementDeclarationDocId(expected));
      const cycleRef=doc(db,root,uid,'cycles',cycleId);
      await runTransaction(db,async transaction=>{
        const current=await transaction.get(cycleRef);
        const existing=await transaction.get(ref);
        if(existing.exists())throw new Error('Điểm này đã có khai báo bất biến; không cho ghi đè.');
        if(!current.exists() || current.data().userId!==uid || !isJourneyCycle(current.data()))
          throw new Error('Chu kỳ không còn hợp lệ.');
        const live=buildMeasurementDeclaration(current.data() as JourneyCycle,uid,subjectKey,timepoint,context);
        if(Object.keys(expected).some(key=>live[key as keyof typeof live]!==expected[key as keyof typeof expected]))
          throw new Error('Chu kỳ hoặc điểm đã thay đổi trong lúc lưu; không ghi dữ liệu cũ.');
        if(auth.currentUser?.uid!==uid)throw new Error('Tài khoản đã thay đổi.');
        transaction.set(ref,{...live,declaredAt:serverTimestamp()});
      });
    }catch(err){setError(errorText(err));throw err;}
    finally{setBusy(false);}
  }
  return {rows:status==='ready'?rows:[],manifest:status==='ready'?manifestFromStoredMeasurements(rows):null,
    coverage:status==='ready'?coverage:null,status,error,busy,save};
}
