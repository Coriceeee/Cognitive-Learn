import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { auditAcademicGpa, type GpaIntegrityResult } from "../services/academicGpaIntegrity";
import { isServerConfirmedSnapshot } from "../services/realtimeReadPolicy";

type IntegrityState = {
  status: "loading" | "signed-out" | "syncing" | "error" | GpaIntegrityResult["status"];
  result: GpaIntegrityResult | null;
};

/** Two server-confirmed listeners, bound to one authenticated session. No local writes. */
export function useAcademicGpaIntegrity(): IntegrityState {
  const [state, setState] = useState<IntegrityState>({status: "loading", result: null});
  useEffect(() => {
    let active = true;
    let epoch = 0;
    let unsubscribers: Unsubscribe[] = [];
    const reset = (status: IntegrityState["status"]) => setState({status, result: null});
    const stop = () => { for (const off of unsubscribers) off(); unsubscribers = []; };
    const stopAuth = onAuthStateChanged(auth, user => {
      ++epoch; stop();
      if (!user) { reset("signed-out"); return; }
      reset("loading");
      const uid = user.uid;
      const ownEpoch = epoch;
      const isCurrent = () => active && ownEpoch === epoch && auth.currentUser?.uid === uid;
      const values: Record<"learning_profiles" | "student_transcripts", unknown> = {
        learning_profiles: undefined, student_transcripts: undefined,
      };
      const received = new Set<string>();
      const recompute = () => {
        if (!isCurrent() || received.size < 2) return;
        const result = auditAcademicGpa(uid, values.learning_profiles, values.student_transcripts);
        setState({status: result.status, result});
      };
      for (const collectionName of ["learning_profiles", "student_transcripts"] as const) {
        const stopDoc = onSnapshot(doc(db, collectionName, uid), {includeMetadataChanges: true}, snapshot => {
          if (!isCurrent()) return;
          if (!isServerConfirmedSnapshot(snapshot.metadata)) {
            // Neither previously confirmed nor pending local writes may be called verified.
            received.clear();
            values.learning_profiles = undefined;
            values.student_transcripts = undefined;
            reset("syncing"); return;
          }
          values[collectionName] = snapshot.exists() ? snapshot.data() : null;
          received.add(collectionName);
          recompute();
        }, () => {
          if (!isCurrent()) return;
          received.clear(); reset("error");
        });
        unsubscribers.push(stopDoc);
      }
    }, () => { ++epoch; stop(); reset("error"); });
    return () => { active = false; ++epoch; stop(); stopAuth(); };
  }, []);
  return state;
}
