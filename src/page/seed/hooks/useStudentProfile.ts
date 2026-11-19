import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";

import { auth, db } from "../../../lib/firebase";
import { buildDynamicStudentState, type DynamicStudentState } from "../../../lib/dynamicStudentState";
import { analyzeStudentTemporal, type TemporalStudentReport } from "../../../lib/temporalStudentIntelligence";
import { calculateCognitive } from "../../../engines/cognitive/cognitiveEngine";
import { getVerifiedCognitiveHistory } from "../../../engines/history/cognitiveHistoryRepository";
import { isMatchingAccountRecord, isServerConfirmedSnapshot } from "../services/realtimeReadPolicy";
import { createSnapshotFromResult } from "../../../engines/history/cognitiveHistoryEngine";
import {
  analyzeCognitiveGrowth,
  type CognitiveGrowthAnalytics,
} from "../../../engines/history/cognitiveGrowthAnalytics";

import {
  defaultCognitiveResult,
  defaultStudentProfile,
  type CognitiveResult,
  type StudentProfile,
} from "../types";


function getValue(source: any, path: string) {
  return path.split(".").reduce((current, key) => {
    if (
      current &&
      typeof current === "object" &&
      key in current
    ) {
      return current[key];
    }

    return undefined;
  }, source);
}



function pickString(
  source: any,
  paths: string[],
  fallback: string
) {

  for (const path of paths) {

    const value = getValue(
      source,
      path
    );


    if (
      typeof value === "string" &&
      value.trim()
    ) {

      return value.trim();

    }

  }


  return fallback;

}



function pickNumber(
  source: any,
  paths: string[],
  fallback: number
) {

  for (const path of paths) {

    const value = getValue(
      source,
      path
    );


    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {

      return value;

    }


    if (
      typeof value === "string" &&
      value.trim()
    ) {

      const parsed =
        Number(value);


      if (
        Number.isFinite(parsed)
      ) {

        return parsed;

      }

    }

  }


  return fallback;

}




/** Preserve missing measurements instead of turning absent fields into 0. */
function pickOptionalNumber(source: unknown, paths: string[]): number | undefined {
  for (const path of paths) {
    const value = getValue(source, path);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const numberValue = Number(value);
      if (Number.isFinite(numberValue)) return numberValue;
    }
  }
  return undefined;
}

function normalizeStudentProfile(
  raw:any
):StudentProfile {


  return {


    fullName:
      pickString(
        raw,
        [
          "fullName",
          "profile.fullName",
          "profile.name",
          "name",
        ],
        defaultStudentProfile.fullName
      ),



    className:
      pickString(
        raw,
        [
          "className",
          "profile.className",
          "profile.class",
          "class",
        ],
        defaultStudentProfile.className
      ),



    targetMajor:
      pickString(
        raw,
        [
          "targetMajor",
          "profile.targetMajor",
          "profile.majorGoal",
          "majorGoal",
        ],
        defaultStudentProfile.targetMajor
      ),



    targetUniversity:
      pickString(
        raw,
        [
          "targetUniversity",
          "profile.targetUniversity",
          "profile.universityGoal",
          "universityGoal",
        ],
        defaultStudentProfile.targetUniversity
      ),



    gpa10:
      pickNumber(
        raw,
        [
          "gpa10",
          "gpaSummary.gpa10",
          "gpaSummary.grade10",
          "gpaSummary.grade10Gpa",
          "gpaSummary.grade10Average",
        ],
        defaultStudentProfile.gpa10
      ),



    gpa11:
      pickNumber(
        raw,
        [
          "gpa11",
          "gpaSummary.gpa11",
          "gpaSummary.grade11",
          "gpaSummary.grade11Gpa",
          "gpaSummary.grade11Average",
        ],
        defaultStudentProfile.gpa11
      ),



    gpa12:
      pickNumber(
        raw,
        [
          "gpa12",
          "gpaSummary.gpa12",
          "gpaSummary.grade12",
          "gpaSummary.grade12Gpa",
          "gpaSummary.grade12Average",
        ],
        defaultStudentProfile.gpa12
      ),



    gpaOverall:
      pickNumber(
        raw,
        [
          "gpaOverall",
          "gpaSummary.gpaOverall",
          "gpaSummary.overall",
          "gpaSummary.overallGpa",
          "gpaSummary.overallAverage",
        ],
        defaultStudentProfile.gpaOverall
      ),



    studyHoursPerWeek:
      pickNumber(
        raw,
        [
          "studyHoursPerWeek",
          "behavior.studyHoursPerWeek",
        ],
        defaultStudentProfile.studyHoursPerWeek
      ),



    practiceTestsPerWeek:
      pickNumber(
        raw,
        [
          "practiceTestsPerWeek",
          "behavior.practiceTestsPerWeek",
        ],
        defaultStudentProfile.practiceTestsPerWeek
      ),



    planCompletionRate:
      pickNumber(
        raw,
        [
          "planCompletionRate",
          "behavior.planCompletionRate",
        ],
        defaultStudentProfile.planCompletionRate
      ),



    motivationLevel:
      pickNumber(
        raw,
        [
          "motivationLevel",
          "behavior.motivationLevel",
        ],
        defaultStudentProfile.motivationLevel
      ),

    goalSwitchFrequency: pickOptionalNumber(raw, [
      "goalSwitchFrequency",
      "behavior.goalSwitchFrequency",
    ]),

    taskAbandonmentRate: pickOptionalNumber(raw, [
      "taskAbandonmentRate",
      "behavior.taskAbandonmentRate",
    ]),
    contextSwitchRate: pickOptionalNumber(raw, [
      "contextSwitchRate",
      "behavior.contextSwitchRate",
    ]),
    learningStrategy: pickOptionalNumber(raw, [
      "learningStrategy",
      "behavior.learningStrategy",
    ]),

  };

}






function normalizeCognitiveResult(
 result:CognitiveResult
):CognitiveResult {


  return {

    ...defaultCognitiveResult,

    ...result,


    SCI:
      result.SCI ?? 0,


    MAS:
      result.MAS ?? 0,


    CSL:
      result.CSL ?? 0,


    GVI:
      result.GVI ?? 0,


    BDI:
      result.BDI ?? 0,


    FRI:
      result.FRI ?? 0,


    CRI:
      result.CRI ?? 0,


  };

}






function createLimitedGrowthAnalytics(
  profile: StudentProfile,
  cognitive: CognitiveResult
): CognitiveGrowthAnalytics {
  const current = createSnapshotFromResult("current", profile, cognitive);
  return analyzeCognitiveGrowth(current, null);
}

export function useStudentProfile() {


  const [
    profile,
    setProfile
  ] =
    useState<StudentProfile>(
      defaultStudentProfile
    );



  const [
    cognitive,
    setCognitive
  ] =
    useState<CognitiveResult>(
      defaultCognitiveResult
    );



  


  const [
    growthAnalytics,
    setGrowthAnalytics
  ] =
    useState<CognitiveGrowthAnalytics | null>(
      null
    );const [
    loading,
    setLoading
  ] =
    useState(true);



  const [
    hasProfile,
    setHasProfile
  ] =
    useState(false);



  const [
    error,
    setError
  ] =
    useState("");



  const params =
    new URLSearchParams(
      window.location.search
    );


  const isAdminPreview =
    params.get("from") === "admin";




  const [syncing, setSyncing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dynamicState, setDynamicState] = useState<DynamicStudentState | null>(null);
  const [temporalReport, setTemporalReport] = useState<TemporalStudentReport | null>(null);

  useEffect(() => {
    // Server-confirmed realtime profile. Two generations prevent stale results:
    // sessionEpoch on A -> B -> A and snapshotEpoch for same-UID updates.
    let mounted = true;
    let sessionEpoch = 0;
    let snapshotEpoch = 0;
    let activeUid: string | null = null;
    let stopProfile: Unsubscribe | undefined;

    const resetView = () => {
      setProfile(defaultStudentProfile);
      setCognitive(defaultCognitiveResult);
      setGrowthAnalytics(null);
      setHasProfile(false);
      setHistoryLoading(false);
      setDynamicState(null);
      setTemporalReport(null);
    };
    const reportFailure = (code?: string) => {
      resetView();
      setLoading(false);
      setSyncing(false);
      setError(code === "permission-denied"
        ? "Không có quyền đọc hồ sơ học sinh. Hãy kiểm tra tài khoản hoặc consent."
        : code === "invalid-owner"
          ? "Hồ sơ không khớp tài khoản đăng nhập. Đã ngừng hiển thị dữ liệu."
          : "Không thể xác minh hồ sơ từ Firestore. Hãy kiểm tra kết nối và tải lại.");
    };

    const stopAuth = onAuthStateChanged(auth, user => {
      ++sessionEpoch;
      ++snapshotEpoch;
      stopProfile?.(); stopProfile = undefined;
      activeUid = user?.uid ?? null;
      resetView(); setError(""); setSyncing(false);
      setLoading(Boolean(user));
      if (!user) return;

      const uid = user.uid;
      const thisSession = sessionEpoch;
      const isCurrentSession = () => mounted && thisSession === sessionEpoch
        && activeUid === uid && auth.currentUser?.uid === uid;

      stopProfile = onSnapshot(doc(db, "learning_profiles", uid),
        { includeMetadataChanges: true }, snapshot => {
          if (!isCurrentSession()) return;
          const thisSnapshot = ++snapshotEpoch;
          const isCurrent = () => isCurrentSession() && thisSnapshot === snapshotEpoch;

          // Never promote offline cache or uncommitted local writes into verified
          // cognitive/academic information, even after a previously verified read.
          if (!isServerConfirmedSnapshot(snapshot.metadata)) {
            resetView(); setError(""); setSyncing(true); setLoading(false);
            return;
          }
          setSyncing(false);
          setError("");
          if (!snapshot.exists()) {
            resetView(); setLoading(false);
            return;
          }
          const rawData = snapshot.data();
          if (!isMatchingAccountRecord(rawData, uid)) {
            reportFailure("invalid-owner"); return;
          }

          try {
            const normalizedProfile = normalizeStudentProfile(rawData);
            // Use the exact measurement persisted with this version of Seed;
            // old schema may only expose the deterministic experimental proxy.
            const storedMeasurement = rawData.cognitiveMeasurement as CognitiveResult | undefined;
            const cognitiveResult = storedMeasurement?.mappingVersion === "cla-cognitive-proxy-v2"
              && Array.isArray(storedMeasurement.dimensions)
              ? storedMeasurement : calculateCognitive(normalizedProfile);
            const normalizedCognitive = normalizeCognitiveResult(cognitiveResult);
            const dynamic = buildDynamicStudentState(rawData, uid, true);
            setDynamicState(dynamic);
            setTemporalReport(null);
            setProfile(normalizedProfile);
            setCognitive(normalizedCognitive);
            setGrowthAnalytics(null); // Never retain an older snapshot's growth.
            setHasProfile(true);
            setLoading(false);
            setHistoryLoading(true);

            // History is read from the server, not an old browser cache. It is
            // deliberately supplemental: failure cannot erase a valid profile.
            void (async () => {
              try {
                const history = await getVerifiedCognitiveHistory(uid);
                if (!isCurrent()) return;
                if (dynamic) setTemporalReport(analyzeStudentTemporal(history.slice(0, 11), uid, dynamic.scope, true, dynamic.observedAt));
                const comparable = history.filter(entry => entry.scoreAvailable === true);
                const analytics = comparable.length > 0
                  ? analyzeCognitiveGrowth(comparable[0], comparable[1] ?? null)
                  : createLimitedGrowthAnalytics(normalizedProfile, normalizedCognitive);
                setGrowthAnalytics(analytics);
              } catch {
                if (!isCurrent()) return;
                setTemporalReport(null);
                setGrowthAnalytics(createLimitedGrowthAnalytics(normalizedProfile, normalizedCognitive));
                setError("Hồ sơ đã đồng bộ nhưng chưa xác minh được lịch sử Cognitive từ máy chủ.");
              } finally {
                if (isCurrent()) setHistoryLoading(false);
              }
            })();
          } catch {
            if (isCurrent()) reportFailure("invalid-profile");
          }
        }, failure => {
          if (!isCurrentSession()) return;
          ++snapshotEpoch;
          reportFailure(failure?.code);
        });
    }, () => {
      ++sessionEpoch; ++snapshotEpoch; activeUid = null;
      stopProfile?.(); resetView(); setSyncing(false); setLoading(false);
      setError("Không xác minh được trạng thái đăng nhập.");
    });

    return () => {
      mounted = false;
      ++sessionEpoch; ++snapshotEpoch;
      activeUid = null;
      stopProfile?.(); stopAuth();
    };
  }, []);



  return {

    profile,

    cognitive,

    growthAnalytics,
    dynamicState,
    temporalReport,

    loading,

    syncing,

    historyLoading,

    hasProfile,

    error,

    isAdminPreview,

  };


}