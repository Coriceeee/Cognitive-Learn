import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../lib/firebase";

import {
  calculateCognitive,
} from "../../../engines/cognitive/cognitiveEngine";

import {
  analyzeCognitiveGrowth,
  type CognitiveGrowthAnalytics,
} from "../../../engines/history/cognitiveGrowthAnalytics";

import {
  getLatestCognitiveSnapshot,
} from "../../../engines/history/cognitiveHistoryRepository";

import {
  createSnapshotFromResult,
} from "../../../engines/history/cognitiveHistoryEngine";

import {
  defaultCognitiveResult,
  defaultStudentProfile,
  type CognitiveResult,
  type OrionSubjectInput,
  type StudentProfile,
} from "../types";



function getValue(
  source: any,
  path: string
) {

  return path
    .split(".")
    .reduce(
      (current, key) => {

        if (
          current &&
          typeof current === "object" &&
          key in current
        ) {
          return current[key];
        }

        return undefined;

      },
      source
    );

}



function pickString(
  source: any,
  paths: string[],
  fallback: string
) {

  for (const path of paths) {

    const value =
      getValue(
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

    const value =
      getValue(
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



function normalizeOrionSubjects(
  raw: any
): OrionSubjectInput[] | undefined {

  const source =
    getValue(
      raw,
      "orion.subjects"
    ) ??
    getValue(
      raw,
      "orionSubjects"
    );

  if (
    !Array.isArray(source)
  ) {

    return undefined;

  }

  const subjects =
    source
      .map((item) => {

        if (
          !item ||
          typeof item !== "object"
        ) {

          return null;

        }

        const currentScore =
          Number(
            item.currentScore
          );

        const targetScore =
          Number(
            item.targetScore
          );

        const importance =
          Number(
            item.importance
          );

        if (
          typeof item.subject !==
            "string" ||
          typeof item.label !==
            "string" ||
          !Number.isFinite(
            currentScore
          ) ||
          !Number.isFinite(
            targetScore
          ) ||
          !Number.isFinite(
            importance
          )
        ) {

          return null;

        }

        return {

          subject:
            item.subject,

          label:
            item.label,

          currentScore,

          targetScore,

          importance,

        };

      })
      .filter(
        (
          item
        ): item is OrionSubjectInput =>
          item !== null
      );

  return subjects.length > 0
    ? subjects
    : undefined;

}



function normalizeStudentProfile(
  raw: any
): StudentProfile {

  const orionWeeksLeft =
    pickNumber(
      raw,
      [
        "orion.weeksLeft",
        "orionWeeksLeft",
      ],
      0
    );

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

    orionSubjects:
      normalizeOrionSubjects(
        raw
      ),

    orionWeeksLeft:
      orionWeeksLeft > 0
        ? orionWeeksLeft
        : undefined,

  };

}



function normalizeCognitiveResult(
  result: CognitiveResult
): CognitiveResult {

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



export function useStudentProfile() {

  const [
    profile,
    setProfile,
  ] =
    useState<StudentProfile>(
      defaultStudentProfile
    );



  const [
    cognitive,
    setCognitive,
  ] =
    useState<CognitiveResult>(
      defaultCognitiveResult
    );



  const [
    growthAnalytics,
    setGrowthAnalytics,
  ] =
    useState<CognitiveGrowthAnalytics | null>(
      null
    );



  const [
    loading,
    setLoading,
  ] =
    useState(true);



  const [
    hasProfile,
    setHasProfile,
  ] =
    useState(false);



  const [
    error,
    setError,
  ] =
    useState("");



  const params =
    new URLSearchParams(
      window.location.search
    );



  const isAdminPreview =
    params.get(
      "from"
    ) === "admin";



  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        async (user) => {

          setLoading(true);

          setError("");



          if (!user) {

            setProfile(
              defaultStudentProfile
            );

            setCognitive(
              defaultCognitiveResult
            );

            setGrowthAnalytics(
              null
            );

            setHasProfile(
              false
            );

            setLoading(
              false
            );

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
              await getDoc(
                ref
              );



            if (!snap.exists()) {

              setProfile(
                defaultStudentProfile
              );

              setCognitive(
                defaultCognitiveResult
              );

              setGrowthAnalytics(
                null
              );

              setHasProfile(
                false
              );

              setLoading(
                false
              );

              return;

            }



            const rawData =
              snap.data();



            const normalizedProfile =
              normalizeStudentProfile(
                rawData
              );



            const cognitiveResult =
              normalizeCognitiveResult(
                calculateCognitive(
                  normalizedProfile
                )
              );



            setProfile(
              normalizedProfile
            );



            setCognitive(
              cognitiveResult
            );



            setHasProfile(
              true
            );



            /*
             * Longitudinal Growth
             *
             * Không tự tạo dữ liệu lịch sử.
             * Chỉ phân tích khi hệ thống thực sự
             * có snapshot trước đó trong
             * cognitive_history.
             */

            try {

              const previousSnapshot =
                await getLatestCognitiveSnapshot(
                  user.uid
                );



              if (!previousSnapshot) {

                setGrowthAnalytics(
                  null
                );

              } else {

                const currentSnapshot =
                  createSnapshotFromResult(
                    user.uid,
                    normalizedProfile,
                    cognitiveResult
                  );



                const analytics =
                  analyzeCognitiveGrowth(
                    currentSnapshot,
                    previousSnapshot
                  );



                setGrowthAnalytics(
                  analytics
                );

              }

            } catch (
              growthError
            ) {

              console.error(
                "Cognitive growth error:",
                growthError
              );

              /*
               * Growth là lớp phân tích bổ sung.
               * Nếu history chưa đọc được,
               * không làm hỏng toàn bộ Student Dashboard.
               */

              setGrowthAnalytics(
                null
              );

            }

          } catch (
            err
          ) {

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

            setGrowthAnalytics(
              null
            );

            setHasProfile(
              false
            );



            setError(
              "Không thể tải dữ liệu học sinh."
            );

          }



          setLoading(
            false
          );

        }
      );



    return () =>
      unsub();

  }, []);



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