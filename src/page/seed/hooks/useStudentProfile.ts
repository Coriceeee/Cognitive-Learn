import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../lib/firebase";
import { calculateCognitive } from "../../../lib/cognitiveEngine";
import {
  defaultCognitiveResult,
  defaultStudentProfile,
  type CognitiveResult,
  type StudentProfile,
} from "../types";

function getValue(source: any, path: string) {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return current[key];
    }

    return undefined;
  }, source);
}

function pickString(source: any, paths: string[], fallback: string) {
  for (const path of paths) {
    const value = getValue(source, path);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function pickNumber(source: any, paths: string[], fallback: number) {
  for (const path of paths) {
    const value = getValue(source, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function normalizeStudentProfile(raw: any): StudentProfile {
  return {
    fullName: pickString(
      raw,
      ["fullName", "profile.fullName", "profile.name", "name"],
      defaultStudentProfile.fullName
    ),

    className: pickString(
      raw,
      ["className", "profile.className", "profile.class", "class"],
      defaultStudentProfile.className
    ),

    targetMajor: pickString(
      raw,
      ["targetMajor", "profile.targetMajor", "profile.majorGoal", "majorGoal"],
      defaultStudentProfile.targetMajor
    ),

    targetUniversity: pickString(
      raw,
      [
        "targetUniversity",
        "profile.targetUniversity",
        "profile.universityGoal",
        "universityGoal",
      ],
      defaultStudentProfile.targetUniversity
    ),

    gpa10: pickNumber(
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

    gpa11: pickNumber(
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

    gpa12: pickNumber(
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

    gpaOverall: pickNumber(
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

    studyHoursPerWeek: pickNumber(
      raw,
      ["studyHoursPerWeek", "behavior.studyHoursPerWeek"],
      defaultStudentProfile.studyHoursPerWeek
    ),

    practiceTestsPerWeek: pickNumber(
      raw,
      ["practiceTestsPerWeek", "behavior.practiceTestsPerWeek"],
      defaultStudentProfile.practiceTestsPerWeek
    ),

    planCompletionRate: pickNumber(
      raw,
      ["planCompletionRate", "behavior.planCompletionRate"],
      defaultStudentProfile.planCompletionRate
    ),

    motivationLevel: pickNumber(
      raw,
      ["motivationLevel", "behavior.motivationLevel"],
      defaultStudentProfile.motivationLevel
    ),
  };
}

export function useStudentProfile() {
  const [profile, setProfile] =
    useState<StudentProfile>(defaultStudentProfile);

  const [cognitive, setCognitive] =
    useState<CognitiveResult>(defaultCognitiveResult);

  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(window.location.search);
  const isAdminPreview = params.get("from") === "admin";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError("");

      if (!user) {
        setProfile(defaultStudentProfile);
        setCognitive(defaultCognitiveResult);
        setHasProfile(false);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "learning_profiles", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setProfile(defaultStudentProfile);
          setCognitive(defaultCognitiveResult);
          setHasProfile(false);
          setLoading(false);
          return;
        }

        const rawData = snap.data();
        const normalizedProfile = normalizeStudentProfile(rawData);
        const cognitiveResult = calculateCognitive(normalizedProfile);

        setProfile(normalizedProfile);
        setCognitive(cognitiveResult);
        setHasProfile(true);
      } catch (err) {
        console.error("Firestore error:", err);
        setProfile(defaultStudentProfile);
        setCognitive(defaultCognitiveResult);
        setHasProfile(false);
        setError("Không thể tải dữ liệu học sinh.");
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return {
    profile,
    cognitive,
    loading,
    hasProfile,
    error,
    isAdminPreview,
  };
}