import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { useVerifiedStudentProfile } from '../../seed/hooks/StudentProfileProvider';
import { useAtlasKnowledge } from '../../atlas/hooks/useAtlasKnowledge';
import { useModuleDraft } from '../../../lib/useModuleDraft';
import { isMatchingAccountRecord, isServerConfirmedSnapshot } from '../../seed/services/realtimeReadPolicy';
import { derivePulseLinkedSignals } from '../../../lib/pulseLinkedSourceModel';

type HistoryPoint = {overallScore:number;scoreAvailable?:boolean;createdAt?:string};
type DataState<T> = {owner:string;value:T|null;status:'loading'|'ready'|'error';error:string};
const empty = <T,>():DataState<T> => ({owner:'',value:null,status:'loading',error:''});
/** PULSE reads existing, owner-scoped, server-confirmed sources. No writes or fake data. */
export function usePulseLinkedSources() {
  const {cognitive,hasProfile,loading:profileLoading,syncing:profileSyncing} = useVerifiedStudentProfile();
  const atlas = useAtlasKnowledge();
  const orion = useModuleDraft<{targetMajor:string;weeksLeft:string;scores:Record<string,string>;targets:Record<string,string>}>('orion');
  const [uid,setUid] = useState('');
  const [seed,setSeed] = useState<DataState<Record<string,unknown>>>(empty);
  const [history,setHistory] = useState<DataState<HistoryPoint[]>>(empty);

  useEffect(() => {
    let alive = true;
    let epoch = 0;
    let stopSeed:Unsubscribe|undefined;
    let stopHistory:Unsubscribe|undefined;
    const stopAuth = onAuthStateChanged(auth,user => {
      epoch++; const currentEpoch=epoch;
      stopSeed?.();stopHistory?.();stopSeed=undefined;stopHistory=undefined;
      const owner=user?.uid ?? '';
      setUid(owner);setSeed(empty());setHistory(empty());
      if (!owner) return;
      const current=()=>alive && epoch===currentEpoch && auth.currentUser?.uid===owner;
      stopSeed=onSnapshot(doc(db,'learning_profiles',owner),{includeMetadataChanges:true},snap=>{
        if (!current()) return;
        if (!isServerConfirmedSnapshot(snap.metadata)) {setSeed(empty());return;}
        const raw=snap.exists()?snap.data():null;
        if(raw && !isMatchingAccountRecord(raw,owner)) {
          setSeed({owner,value:null,status:'error',error:'Hồ sơ SEED sai chủ sở hữu.'}); return;
        }
        setSeed({owner,value:raw??null,status:'ready',error:''});
      },error=>{if(current())setSeed({owner,value:null,status:'error',error:error.code==='permission-denied'?'Không có quyền đọc SEED.':'Không thể đọc SEED từ máy chủ.'});});
      const hQuery=query(collection(db,'learning_profiles',owner,'cognitive_history'),orderBy('createdAt','desc'),limit(10));
      stopHistory=onSnapshot(hQuery,{includeMetadataChanges:true},snap=>{
        if (!current()) return;
        if (!isServerConfirmedSnapshot(snap.metadata)) {setHistory(empty());return;}
        const data=snap.docs.map(entry=>entry.data()).filter(item=>item.studentId===owner).map(item=>({
          overallScore:item.overallScore,scoreAvailable:item.scoreAvailable,createdAt:item.createdAt?.toDate?.()?.toISOString?.() ?? (typeof item.createdAt==='string'?item.createdAt:undefined),
        }));
        setHistory({owner,value:data,status:'ready',error:''});
      },error=>{if(current())setHistory({owner,value:null,status:'error',error:error.code==='permission-denied'?'Không có quyền đọc lịch sử LUMEN.':'Không thể đọc lịch sử LUMEN.'});});
    });
    return ()=>{alive=false;epoch++;stopSeed?.();stopHistory?.();stopAuth();};
  },[]);

  const signals=useMemo(()=>derivePulseLinkedSignals({
    lumenScore:uid && hasProfile && !profileLoading && !profileSyncing && cognitive.scoreAvailable === true ? cognitive.overallScore : null,
    lumenCri:uid && hasProfile && !profileLoading && !profileSyncing && cognitive.scoreAvailable === true ? cognitive.CRI : null,
    history:history.owner===uid && history.status==='ready'?history.value:null,
    atlasProgramCount:uid && atlas.storageStatus==='ready' && atlas.programs.length>0?atlas.programs.length:null,
    atlasSourceCount:uid && atlas.storageStatus==='ready' && atlas.sources.length>0?atlas.sources.length:null,
    orionDraft:uid && orion.uid===uid && orion.status==='ready'?orion.draft:null,
    seedRecord:uid && seed.owner===uid && seed.status==='ready'?seed.value:null,
  }),[uid,hasProfile,profileLoading,profileSyncing,cognitive.scoreAvailable,cognitive.overallScore,cognitive.CRI,
    history,atlas.storageStatus,atlas.programs.length,atlas.sources.length,orion.uid,orion.status,orion.draft,seed]);
  const errors=[seed.error,history.error,atlas.storageError,orion.error].filter(Boolean);
  return {signals,ready:signals.filter(item=>item.value!==null).length,uid,errors,
    loading:!uid || seed.status==='loading' || history.status==='loading' || atlas.storageStatus==='loading' || atlas.storageStatus==='syncing' || orion.status==='loading' || orion.status==='syncing'};
}
