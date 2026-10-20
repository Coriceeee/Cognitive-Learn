import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../lib/firebase";
import { calculateCognitive } from "../../../engines/cognitive/cognitiveEngine";
import { getCognitiveHistory } from "../../../engines/history/cognitiveHistoryRepository";
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




  useEffect(() => {


    const unsub =
      onAuthStateChanged(
        auth,
        async(user)=>{


          setLoading(true);

          setError("");



          if(!user){


            setProfile(
              defaultStudentProfile
            );


            setCognitive(
              defaultCognitiveResult
            );

            setGrowthAnalytics(null);


            setHasProfile(false);

            setLoading(false);

            return;

          }




          try {


            const ref =
              doc(
                db,
                "learning_profiles",
                user.uid
              );



            const snap =
              await getDoc(ref);




            if(!snap.exists()){


              setProfile(
                defaultStudentProfile
              );


              setCognitive(
                defaultCognitiveResult
              );

              setGrowthAnalytics(null);
              setHasProfile(false);


              setLoading(false);


              return;

            }




            const rawData =
              snap.data();



            const normalizedProfile =
              normalizeStudentProfile(
                rawData
              );



            // Prefer the exact measurement committed atomically alongside
            // the Firestore profile. Legacy profiles fall back to calculation.
            const storedMeasurement = rawData.cognitiveMeasurement as CognitiveResult | undefined;
            const cognitiveResult =
              storedMeasurement?.mappingVersion === "cla-cognitive-proxy-v2" &&
              Array.isArray(storedMeasurement.dimensions)
                ? storedMeasurement
                : calculateCognitive(normalizedProfile);



            setProfile(
              normalizedProfile
            );



            const normalizedCognitive =
              normalizeCognitiveResult(
                cognitiveResult
              );

            setCognitive(
              normalizedCognitive
            );

            let history: Awaited<ReturnType<typeof getCognitiveHistory>> = [];
            try {
              history = await getCognitiveHistory(user.uid);
            } catch (historyError) {
              // Profile is valid even if subcollection read is denied or offline.
              console.error("Cognitive History read failed:", historyError);
              setError("Đã tải hồ sơ, nhưng không đọc được Cognitive History. Kiểm tra quyền Firestore.");
            }

            const comparableHistory = history.filter(
              (entry) => entry.scoreAvailable === true
            );
            if (comparableHistory.length > 0) {
              const currentSnapshot = comparableHistory[0];
              const previousSnapshot =
                comparableHistory.length > 1
                  ? comparableHistory[1]
                  : null;

              setGrowthAnalytics(
                analyzeCognitiveGrowth(
                  currentSnapshot,
                  previousSnapshot
                )
              );
            } else {
              setGrowthAnalytics(
                createLimitedGrowthAnalytics(
                  normalizedProfile,
                  normalizedCognitive
                )
              );
            }

            setHasProfile(true);



          }
          catch(err){


            console.error(
              "Firestore error:",
              err
            );



            setProfile(
              defaultStudentProfile
            );


            setCognitive(
              defaultCognitiveResult
            );

            setGrowthAnalytics(null);


            setHasProfile(false);



            setError(
              "Không thể tải dữ liệu học sinh."
            );

          }



          setLoading(false);


        }
      );



    return () =>
      unsub();



  },[]);




  return {

    profile,

    cognitive,

    growthAnalytics,

    loading,

    hasProfile,

    error,

    isAdminPreview,

  };


}