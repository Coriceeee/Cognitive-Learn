import { navigateTo } from "../../lib/clientNavigation";
import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import { pushAppNotice } from "../../lib/appNotices";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocFromServer, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { calculateCognitive } from "../../engines/cognitive/cognitiveEngine";
import { attachObservedSnapshotMetrics, createCognitiveSnapshot } from "../../engines/history/cognitiveHistoryEngine";
import type { StudentProfile } from "./types";
import { countryCatalog } from "../../data/globalCountryCatalog";
import {
  calculateCompletedYearsAverage,
  calculateProvisionalAverage,
  calculateSemesterAverage,
  calculateYearAverage,
  summarizeSemesterScores,
  type ScoreRow,
} from "../../engines/academic-semester-engine";
import { validateSeedNumericInput } from "./services/profileInputValidation";
import { parseAcademicIdentity, sameAcademicIdentity, findForeignTranscriptSubject } from "./services/academicIdentity";
import { captureSeedBaseline, verifySeedTransaction, type SeedBaseline } from "./services/seedPersistenceContract";
import {
  ELECTIVE_SUBJECTS,
  NATIONAL_DEFENSE_SUBJECT,
  getNineGradedSubjects,
  isValidElectiveSelection,
} from "./services/academicCurriculum";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

type GradeKey = "grade10" | "grade11" | "grade12";
type SemesterKey = "semester1" | "semester2";

type TranscriptScores = Record<
  GradeKey,
  Record<SemesterKey, Record<string, ScoreRow>>
>;

type LearningProfile = {
  fullName: string;
  className: string;
  area: string;
  targetMajor: string;
  targetUniversity: string;
  foreignLanguage: string;
  studyHoursPerWeek: string;
  practiceTestsPerWeek: string;
  planCompletionRate: string;
  goalSwitchFrequency: string;
  taskAbandonmentRate: string;
  contextSwitchRate: string;
  learningStrategy: string;
  motivationLevel: string;
  educationBudget: string;
  maxTuition: string;
  studyAbroadInterest: string;
  targetCountry: string;
  scholarshipInterest: string;
  scholarshipGoal: string;
};

const gradeOptions: { key: GradeKey; label: string }[] = [
  { key: "grade10", label: "Lớp 10" },
  { key: "grade11", label: "Lớp 11" },
  { key: "grade12", label: "Lớp 12" },
];

const semesterOptions: { key: SemesterKey; label: string }[] = [
  { key: "semester1", label: "Học kì 1" },
  { key: "semester2", label: "Học kì 2" },
];

const electiveSubjects: readonly string[] = ELECTIVE_SUBJECTS;

const initialProfile: LearningProfile = {
  fullName: "",
  className: "",
  area: "",
  targetMajor: "",
  targetUniversity: "",
  foreignLanguage: "Tiếng Anh",
  studyHoursPerWeek: "",
  practiceTestsPerWeek: "",
  planCompletionRate: "",
  goalSwitchFrequency: "",
  taskAbandonmentRate: "",
  contextSwitchRate: "",
  learningStrategy: "",
  motivationLevel: "",
  educationBudget: "",
  maxTuition: "",
  studyAbroadInterest: "Không",
  targetCountry: "",
  scholarshipInterest: "Không",
  scholarshipGoal: "",
};

const initialElectives: string[] = [];

function emptyScoreRow(): ScoreRow {
  return {
    regular: ["", "", "", "", ""],
    midterm: "",
    final: "",
  };
}

function createInitialTranscript(): TranscriptScores {
  const scores = {} as TranscriptScores;

  gradeOptions.forEach((grade) => {
    scores[grade.key] = {} as Record<SemesterKey, Record<string, ScoreRow>>;

    semesterOptions.forEach((semester) => {
      scores[grade.key][semester.key] = {};
    });
  });

  const sampleSubjects = getNineGradedSubjects("Tiếng Anh", initialElectives);

  sampleSubjects.forEach((subject) => {
    scores.grade12.semester1[subject] = {
      regular: ["", "", "", "", ""],
      midterm: "",
      final: "",
    };
  });

  return scores;
}

// Deterministic synthetic transcript for a repeatable technical demo only.
// It is never loaded automatically and is never persisted by this helper.
function createSyntheticDemoTranscript(electives: readonly string[]): TranscriptScores {
  const subjects = getNineGradedSubjects("Tiếng Anh", electives);
  const baseline: Record<string, number> = {
    "Toán": 6.7,
    "Ngữ văn": 7.2,
    "Tiếng Anh": 7.8,
    "Lịch sử": 7.4,
    "Giáo dục quốc phòng và an ninh": 8.2,
    "Vật lý": 6.6,
    "Hóa học": 6.9,
    "Sinh học": 7.1,
    "Địa lý": 7.6,
    "Giáo dục kinh tế và pháp luật": 7.7,
    "Tin học": 8.0,
    "Công nghệ": 7.8,
    "Âm nhạc": 8.3,
    "Mĩ thuật": 8.1,
  };
  const result = {} as TranscriptScores;
  gradeOptions.forEach((grade, gradeIndex) => {
    result[grade.key] = {} as Record<SemesterKey, Record<string, ScoreRow>>;
    semesterOptions.forEach((semester, semesterIndex) => {
      const termOffset = gradeIndex * 0.28 + semesterIndex * 0.12;
      const rows: Record<string, ScoreRow> = {};
      subjects.forEach((subject) => {
        const score = Math.min(9.8, (baseline[subject] ?? 7.0) + termOffset);
        const round = (value: number) => String(Math.round(value * 10) / 10);
        rows[subject] = {
          regular: [round(score - 0.2), round(score), round(score + 0.1), "", ""],
          midterm: round(score + 0.05),
          final: round(score + 0.2),
        };
      });
      result[grade.key][semester.key] = rows;
    });
  });
  return result;
}

export default function TrangNhapHoSoHocTap() {
  const [profile, setProfile] = useState<LearningProfile>(initialProfile);
  const [selectedElectives, setSelectedElectives] =
    useState<string[]>(initialElectives);
  const [activeGrade, setActiveGrade] = useState<GradeKey>("grade12");
  const [activeSemester, setActiveSemester] =
    useState<SemesterKey>("semester1");
  const [transcriptScores, setTranscriptScores] = useState<TranscriptScores>(
    createInitialTranscript
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileReadFailed, setProfileReadFailed] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileReadError, setProfileReadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [seedBaseline, setSeedBaseline] = useState<SeedBaseline | null>(null);
  const [isAdminDemo, setIsAdminDemo] = useState(false);
  const [lockedElectives, setLockedElectives] = useState<string[] | null>(null);
  const [lockedForeignLanguage, setLockedForeignLanguage] = useState<string | null>(null);
  const [previousPlanCompletionRate, setPreviousPlanCompletionRate] = useState<number | undefined>(undefined);

  const params = new URLSearchParams(window.location.search);
  const isAdminPreview = params.get("from") === "admin";

  // Load the *current user's* profile from the server before allowing writes.
  // Never silently ignore an unreadable collection: doing so can overwrite data.
  useEffect(() => {
    let active = true;
    let requestId = 0;
    const fail = (description: string) => {
      if (!active) return;
      setProfileReadFailed(true);
      setProfileReadError(description);
      setMessage(description);
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const currentRequest = ++requestId;
      if (!active) return;
      setProfileReady(false);
      setProfileReadFailed(false);
      setProfileReadError("");
      setLoadedUid(null);
      setSeedBaseline(null);
      setIsAdminDemo(false);
      // Clear the previous account's in-memory values before loading a new UID.
      setProfile({ ...initialProfile });
      setSelectedElectives([...initialElectives]);
      setLockedElectives(null);
      setLockedForeignLanguage(null);
      setTranscriptScores(createInitialTranscript());
      setPreviousPlanCompletionRate(undefined);
      setMessage("Đang tải hồ sơ và bảng điểm đã lưu…");

      if (!user) {
        fail("Bạn cần đăng nhập bằng tài khoản Student trước khi nhập hoặc lưu điểm.");
        return;
      }

      const read = async (collectionName: string) => {
        try {
          return await getDocFromServer(doc(db, collectionName, user.uid));
        } catch (error) {
          const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code) : "unknown";
          throw new Error(`${collectionName}: ${code}`);
        }
      };

      try {
        // Admin demo can edit only documents under its OWN authenticated UID.
        // It never impersonates a student's UID or writes student-owned records.
        const account = await read("users");
        if (!active || currentRequest !== requestId) return;
        const accountData = account.exists() ? account.data() : null;
        const role = accountData?.role;
        if (!accountData || accountData.active !== true || (role !== "student" && role !== "admin")) {
          fail("Tài khoản chưa có vai trò Học sinh hoặc Quản trị viên đang hoạt động. Vui lòng liên hệ quản trị viên.");
          return;
        }
        setIsAdminDemo(role === "admin");

        const [saved, savedTranscript] = await Promise.all([
          read("learning_profiles"),
          read("student_transcripts"),
        ]);
        if (!active || currentRequest !== requestId) return;

        const value = saved.exists() ? saved.data() : {};
        const academic = savedTranscript.exists() ? savedTranscript.data() : value;
        // Use the server timestamps as optimistic-concurrency tokens. Missing
        // timestamps on legacy documents are NOT safe to overwrite automatically.
        const baseline = captureSeedBaseline(
          { exists: saved.exists(), data: saved.exists() ? saved.data() : null },
          { exists: savedTranscript.exists(), data: savedTranscript.exists() ? savedTranscript.data() : null },
        );
        if (!baseline) {
          fail("Dữ liệu cũ thiếu phiên bản cập nhật của máy chủ. Cần đối soát hoặc di chuyển schema trước khi lưu.");
          return;
        }
        const oldBehavior = value.behavior as { planCompletionRate?: number } | undefined;
        setPreviousPlanCompletionRate(
          typeof oldBehavior?.planCompletionRate === "number"
            ? oldBehavior.planCompletionRate : undefined
        );
        const oldProfile = value.profile as Partial<LearningProfile> | undefined;
        if (oldProfile) {
          setProfile(current => ({
            ...current,
            ...Object.fromEntries(
              Object.entries(oldProfile).map(([key, entry]) => [key, entry == null ? "" : String(entry)])
            ),
          }));
        }
        // Treat either saved academic record as an immutable identity. Never
        // silently reset/replace a malformed legacy curriculum.
        const storedProfileIdentity = saved.exists() ? parseAcademicIdentity(value.curriculum) : null;
        const storedTranscriptIdentity = savedTranscript.exists() ? parseAcademicIdentity(academic.curriculum) : null;
        if ((saved.exists() && !storedProfileIdentity)
            || (savedTranscript.exists() && !storedTranscriptIdentity)
            || (storedProfileIdentity && storedTranscriptIdentity
              && !sameAcademicIdentity(storedProfileIdentity, storedTranscriptIdentity))) {
          fail("Hồ sơ hoặc bảng điểm cũ có danh tính môn học thiếu/không nhất quán. Cần kiểm toán và khôi phục theo quy trình quản trị trước khi lưu.");
          return;
        }
        const lockedIdentity = storedTranscriptIdentity ?? storedProfileIdentity;
        if (lockedIdentity) {
          setSelectedElectives([...lockedIdentity.selectedElectives]);
          setLockedElectives([...lockedIdentity.selectedElectives]);
          setLockedForeignLanguage(lockedIdentity.foreignLanguage);
          setProfile(current => ({...current, foreignLanguage: lockedIdentity.foreignLanguage}));
          if (academic.transcript && findForeignTranscriptSubject(academic.transcript, lockedIdentity)) {
            fail("Bảng điểm cũ có môn học nằm ngoài tổ hợp 9 môn đã khóa. Cần đối soát dữ liệu trước khi lưu.");
            return;
          }
        }
        if (academic.transcript && typeof academic.transcript === "object") {
          setTranscriptScores(academic.transcript as TranscriptScores);
        }
        setSeedBaseline(baseline);
        setLoadedUid(user.uid);
        setProfileReady(true);
        setMessage("");
      } catch (error) {
        if (!active || currentRequest !== requestId) return;
        const detail = error instanceof Error ? error.message : "unknown";
        console.error("Không tải được hồ sơ để chỉnh sửa:", error);
        if (detail.includes("permission-denied")) {
          fail(`Không thể đọc dữ liệu đã lưu ${detail}. Hãy kiểm tra kết nối và quyền tài khoản; không chia sẻ dữ liệu công khai.`);
        } else if (detail.includes("unavailable")) {
          fail(`Không thể kết nối hệ thống dữ liệu (${detail}). Kiểm tra mạng và thử tải lại; không ghi đè dữ liệu khi mất kết nối.`);
        } else {
          fail(`Không tải được dữ liệu đã lưu (${detail}). Kiểm tra kết nối, dự án Firebase và thử tải lại.`);
        }
      }
    }, (error) => {
      fail(`Không xác minh được phiên đăng nhập Firebase (${error.message}).`);
    });
    return () => { active = false; requestId++; unsubscribe(); };
  }, [loadAttempt]);

  const gradedSubjects = useMemo(
    () => getNineGradedSubjects(profile.foreignLanguage, selectedElectives),
    [profile.foreignLanguage, selectedElectives]
  );

  function updateField(field: keyof LearningProfile, value: string) {
    if (field === "foreignLanguage" && lockedForeignLanguage !== null && value !== lockedForeignLanguage) {
      setMessage("Ngoại ngữ 1 đã được khóa cùng tổ hợp 9 môn. Cần quy trình điều chỉnh có biên bản kiểm toán.");
      return;
    }
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getScoreRow(
    grade: GradeKey,
    semester: SemesterKey,
    subject: string
  ): ScoreRow {
    return transcriptScores[grade]?.[semester]?.[subject] || emptyScoreRow();
  }

  // Validate both while editing and before saving to Firestore.
  // Empty is unknown, not a numeric zero.
  function validScore(value: string): boolean {
    if (value.trim() === "") return true;
    const normalized = value.trim().replace(",", ".");
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return false;
    const score = Number(normalized);
    return Number.isFinite(score) && score >= 0 && score <= 10;
  }

  function updateScore(
    grade: GradeKey,
    semester: SemesterKey,
    subject: string,
    field: "regular" | "midterm" | "final",
    value: string,
    regularIndex?: number
  ) {
    if (!validScore(value)) {
      setMessage("Điểm phải từ 0 đến 10. Có thể để trống khi chưa có điểm.");
      return;
    }
    // Store decimal values in a format understood by the GPA engine.
    const normalizedValue = value.replace(",", ".");
    setMessage((current) => current.startsWith("Điểm phải từ 0 đến 10") ? "" : current);
    setTranscriptScores((current) => {
      const currentGrade = current[grade] ?? { semester1: {}, semester2: {} };
      const currentSemester = currentGrade[semester] ?? {};
      const currentRow = currentSemester[subject] || emptyScoreRow();

      const nextRow: ScoreRow =
        field === "regular"
          ? {
              ...currentRow,
              regular: currentRow.regular.map((score, index) =>
                index === regularIndex ? normalizedValue : score
              ),
            }
          : {
              ...currentRow,
              [field]: normalizedValue,
            };

      return {
        ...current,
        [grade]: {
          ...currentGrade,
          [semester]: {
            ...currentSemester,
            [subject]: nextRow,
          },
        },
      };
    });
  }

  function toggleElective(subject: string) {
    if (lockedElectives) {
      setMessage("Tổ hợp 4 môn đã được xác nhận và khóa cho ba năm THPT; không thể tự thay đổi.");
      return;
    }
    setMessage("");

    if (selectedElectives.includes(subject)) {
      setSelectedElectives((current) =>
        current.filter((item) => item !== subject)
      );
      return;
    }

    if (selectedElectives.length >= 4) {
      setMessage("Chỉ được chọn tối đa 4 môn học lựa chọn.");
      return;
    }

    setSelectedElectives((current) => [...current, subject]);
  }

  function getSemesterSummary(grade: GradeKey, semester: SemesterKey) {
    return summarizeSemesterScores(
      gradedSubjects.map((subject) => getScoreRow(grade, semester, subject))
    );
  }

  function getYearGpa(grade: GradeKey) {
    return calculateYearAverage(
      getSemesterSummary(grade, "semester1"),
      getSemesterSummary(grade, "semester2")
    );
  }

  function getOverallGpa() {
    return calculateCompletedYearsAverage(
      gradeOptions.map((grade) => getYearGpa(grade.key))
    );
  }

  function buildTranscriptForSave() {
    const result = {} as TranscriptScores;

    gradeOptions.forEach((grade) => {
      result[grade.key] = {} as Record<SemesterKey, Record<string, ScoreRow>>;

      semesterOptions.forEach((semester) => {
        // Preserve subjects from previous years even when electives change;
        // otherwise saving a new selection would silently erase historic grades.
        result[grade.key][semester.key] = {
          ...(transcriptScores[grade.key]?.[semester.key] ?? {}),
        };

        gradedSubjects.forEach((subject) => {
          result[grade.key][semester.key][subject] = getScoreRow(
            grade.key,
            semester.key,
            subject
          );
        });
      });
    });

    return result;
  }

  // Persist an absent numeric input as null; zero is only an observed zero.
  function optionalNumber(value: string): number | null {
    if (!value.trim()) return null;
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function buildGpaSummary() {
    return {
      grade10: getYearGpa("grade10"),
      grade11: getYearGpa("grade11"),
      grade12: getYearGpa("grade12"),
      overall: getOverallGpa(),
      calculationVersion: "cla-academic-semester-v2-nine-subjects",
      coverage: {
        grade10: {
          semester1: getSemesterSummary("grade10", "semester1"),
          semester2: getSemesterSummary("grade10", "semester2"),
        },
        grade11: {
          semester1: getSemesterSummary("grade11", "semester1"),
          semester2: getSemesterSummary("grade11", "semester2"),
        },
        grade12: {
          semester1: getSemesterSummary("grade12", "semester1"),
          semester2: getSemesterSummary("grade12", "semester2"),
        },
      },
    };
  }

  function goTo(path: string) {
    navigateTo(path);
  }

  function handleLoadDemoPreset() {
    if (!isAdminDemo || !profileReady) return;
    if (lockedElectives !== null) {
      setMessage("Tổ hợp môn của hồ sơ này đã khóa. Không nạp bộ demo đè lên dữ liệu hiện có.");
      return;
    }
    const confirmed = window.confirm(
      "Nạp hồ sơ demo CLA 3 năm vào biểu mẫu hiện tại? Dữ liệu chưa được lưu. Hãy xem lại trước khi chủ động nhấn Lưu hồ sơ."
    );
    if (!confirmed) return;

    const demoElectives = ["Vật lý", "Hóa học", "Tin học", "Địa lý"];
    setProfile({
      fullName: "Học sinh minh họa CLA",
      className: "12A1 · DEMO",
      area: "TP. Hồ Chí Minh",
      targetMajor: "Khoa học dữ liệu / Trí tuệ nhân tạo",
      targetUniversity: "UIT / HCMUS / HCMUT · mục tiêu minh họa",
      foreignLanguage: "Tiếng Anh",
      studyHoursPerWeek: "14",
      practiceTestsPerWeek: "3",
      planCompletionRate: "72",
      goalSwitchFrequency: "2",
      taskAbandonmentRate: "18",
      contextSwitchRate: "32",
      learningStrategy: "68",
      motivationLevel: "75",
      educationBudget: "150000000",
      maxTuition: "60000000",
      studyAbroadInterest: "Đang cân nhắc",
      targetCountry: "Singapore",
      scholarshipInterest: "Có",
      scholarshipGoal: "Học bổng đầu vào và học bổng học tập · DEMO",
    });
    setSelectedElectives(demoElectives);
    setTranscriptScores(createSyntheticDemoTranscript(demoElectives));
    setActiveGrade("grade12");
    setActiveSemester("semester1");
    setPreviousPlanCompletionRate(undefined);
    setMessage("Đã nạp hồ sơ demo 3 năm vào biểu mẫu. Chưa có dữ liệu nào được lưu. Hãy kiểm tra và chỉ lưu trong tài khoản demo quản trị.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (profileReadFailed || !profileReady || !seedBaseline || loadedUid !== auth.currentUser?.uid) {
      setMessage(profileReadError || "Hồ sơ chưa tải xong hoặc phiên đăng nhập đã thay đổi. Hãy thử tải lại trước khi lưu.");
      return;
    }

    if (!isValidElectiveSelection(selectedElectives)) {
      setMessage("Bạn cần chọn đúng 4 môn học lựa chọn khác nhau, thuộc danh sách của chương trình.");
      return;
    }
    if (lockedElectives && lockedElectives.some((subject, index) => subject !== selectedElectives[index])) {
      setMessage("Không thể đổi tổ hợp đã khóa. Hãy liên hệ quản trị viên nếu cần điều chỉnh theo hồ sơ nhà trường.");
      return;
    }
    if (lockedForeignLanguage !== null && profile.foreignLanguage !== lockedForeignLanguage) {
      setMessage("Không thể thay Ngoại ngữ 1 đã khóa trong cả ba năm học.");
      return;
    }
    const unexpectedSubject = findForeignTranscriptSubject(buildTranscriptForSave(), {
      foreignLanguage: profile.foreignLanguage, selectedElectives,
    });
    if (unexpectedSubject) {
      setMessage(`Bảng điểm có môn nằm ngoài 9 môn đã khóa (${unexpectedSubject}). Cần kiểm tra lịch sử dữ liệu.`);
      return;
    }

    // Guard all grades and terms, including historical subjects no longer selected.
    for (const grade of gradeOptions) {
      for (const semester of semesterOptions) {
        const rows = transcriptScores[grade.key]?.[semester.key] ?? {};
        for (const [subject, row] of Object.entries(rows)) {
          if (![...row.regular, row.midterm, row.final].every(validScore)) {
            setMessage(`Điểm môn ${subject} (${grade.label}, ${semester.label}) phải từ 0 đến 10.`);
            return;
          }
        }
      }
    }

    // Validate the values once at the data-write boundary, not only via HTML
    // input attributes (which may be bypassed by programmatic form updates).
    const numericInputError = validateSeedNumericInput(profile);
    if (numericInputError) {
      setMessage(numericInputError);
      return;
    }

    try {
      setLoading(true);
      setMessage("Đang lưu hồ sơ học tập...");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setMessage("Bạn cần đăng nhập để lưu hồ sơ.");
        return;
      }

      const gpaSummary = buildGpaSummary();

      const behavior = {
        studyHoursPerWeek: optionalNumber(profile.studyHoursPerWeek),
        practiceTestsPerWeek: optionalNumber(profile.practiceTestsPerWeek),
        planCompletionRate: optionalNumber(profile.planCompletionRate),
        goalSwitchFrequency: optionalNumber(profile.goalSwitchFrequency),
        taskAbandonmentRate: optionalNumber(profile.taskAbandonmentRate),
        contextSwitchRate: optionalNumber(profile.contextSwitchRate),
        learningStrategy: optionalNumber(profile.learningStrategy),
        motivationLevel: optionalNumber(profile.motivationLevel),
      };

      const profileWrite = {
          schemaVersion: 1,
          userId: currentUser.uid,
          email: currentUser.email,
          dataScope: isAdminDemo ? "demo" : "student",
          profile,
          curriculum: {
            program: "GDPT 2018",
            compulsorySubjects: [
              "Toán",
              "Ngữ văn",
              profile.foreignLanguage,
              "Lịch sử",
              "Giáo dục thể chất",
              "Giáo dục quốc phòng và an ninh",
              "Hoạt động trải nghiệm - hướng nghiệp",
              "Giáo dục địa phương",
            ],
            gradedSubjects,
            selectedElectives,
            foreignLanguage: profile.foreignLanguage,
            electiveSelectionLocked: true,
          },
          // Other modules read gpaSummary from learning_profiles; transcript lives separately.
          gpaSummary,
          behavior,
          finance: {
            educationBudget: optionalNumber(profile.educationBudget),
            maxTuition: optionalNumber(profile.maxTuition),
            studyAbroadInterest: profile.studyAbroadInterest,
            targetCountry:
              profile.studyAbroadInterest === "Không"
                ? ""
                : profile.targetCountry,
            scholarshipInterest: profile.scholarshipInterest,
            scholarshipGoal:
              profile.scholarshipInterest === "Không"
                ? ""
                : profile.scholarshipGoal,
          },
          updatedAt: serverTimestamp(),
      };

      /*
       * IMPORTANT:
       * A cognitive snapshot is created only after the student explicitly
       * submits updated profile data. We do NOT write snapshots on every
       * dashboard mount/refresh, which keeps longitudinal history meaningful.
       */
      const cognitiveProfile: StudentProfile = {
        fullName: profile.fullName,
        className: profile.className,
        targetMajor: profile.targetMajor,
        targetUniversity: profile.targetUniversity,
        gpa10: gpaSummary.grade10 ?? 0,
        gpa11: gpaSummary.grade11 ?? 0,
        gpa12: gpaSummary.grade12 ?? 0,
        gpaOverall: gpaSummary.overall ?? 0,
        studyHoursPerWeek: behavior.studyHoursPerWeek ?? 0,
        practiceTestsPerWeek: behavior.practiceTestsPerWeek ?? 0,
        planCompletionRate: behavior.planCompletionRate ?? 0,
        motivationLevel: behavior.motivationLevel ?? 0,
        goalSwitchFrequency: behavior.goalSwitchFrequency ?? undefined,
        taskAbandonmentRate: behavior.taskAbandonmentRate ?? undefined,
        contextSwitchRate: behavior.contextSwitchRate ?? undefined,
        learningStrategy: behavior.learningStrategy ?? undefined,
        previousPlanCompletionRate,
      };

      // The existing UI/history StudentProfile type requires numeric fields.
      // Only pass actually observed numbers to the score engine; missing values
      // must not become zero-valued measurements.
      const cognitiveResult = calculateCognitive({
        ...cognitiveProfile,
        planCompletionRate: behavior.planCompletionRate ?? undefined,
        motivationLevel: behavior.motivationLevel ?? undefined,
        learningStrategy: behavior.learningStrategy ?? undefined,
        goalSwitchFrequency: behavior.goalSwitchFrequency ?? undefined,
        taskAbandonmentRate: behavior.taskAbandonmentRate ?? undefined,
        contextSwitchRate: behavior.contextSwitchRate ?? undefined,
      });

      // Single atomic Firestore commit: the profile and the associated
      // assessment snapshot either both persist or neither does.
      // We never generate a snapshot just from reading/mounting the dashboard.
      const historyRef = doc(
        collection(db, "learning_profiles", currentUser.uid, "cognitive_history")
      );
      const cognitiveSnapshot = createCognitiveSnapshot({
        studentId: currentUser.uid,
        profile: cognitiveProfile,
        cognitive: cognitiveResult,
        id: historyRef.id, // Firestore-generated unique ID avoids millisecond collisions.
      });
      // Read both documents + live account INSIDE a Firestore transaction before
      // writing. The previous writeBatch could silently overwrite edits made by
      // another tab after the initial profile load. The transaction retries on
      // contention, and the baseline guard then rejects an obsolete form.
      const profileRef = doc(db, "learning_profiles", currentUser.uid);
      const transcriptRef = doc(db, "student_transcripts", currentUser.uid);
      const userRef = doc(db, "users", currentUser.uid);
      await runTransaction(db, async transaction => {
        const [accountSnap, profileSnap, transcriptSnap] = await Promise.all([
          transaction.get(userRef), transaction.get(profileRef), transaction.get(transcriptRef),
        ]);
        const accountData = accountSnap.exists() ? accountSnap.data() : null;
        if (auth.currentUser?.uid !== currentUser.uid || !accountData || accountData.active !== true
          || accountData.role !== (isAdminDemo ? "admin" : "student")) {
          throw new Error("CLA_ACCOUNT_CHANGED_OR_INACTIVE");
        }
        const conflict = verifySeedTransaction(currentUser.uid, isAdminDemo ? "demo" : "student", seedBaseline,
          {exists: profileSnap.exists(), data: profileSnap.exists() ? profileSnap.data() : null},
          {exists: transcriptSnap.exists(), data: transcriptSnap.exists() ? transcriptSnap.data() : null},
          {foreignLanguage: profile.foreignLanguage, selectedElectives},
        );
        if (conflict) throw new Error(`CLA_SEED_CONFLICT: ${conflict}`);

        // Store the SAME measurement in profile and append-only history, with
        // exactly the same transaction as the authoritative transcript.
        transaction.set(profileRef, {
          ...profileWrite,
          cognitiveMeasurement: JSON.parse(JSON.stringify(cognitiveResult)),
        }, { merge: true });
        transaction.set(transcriptRef, {
          userId: currentUser.uid,
          schemaVersion: 1,
          dataScope: isAdminDemo ? "demo" : "student",
          curriculum: profileWrite.curriculum,
          transcript: buildTranscriptForSave(),
          gpaSummary,
          updatedAt: serverTimestamp(),
        });
        transaction.set(historyRef, {
          ...attachObservedSnapshotMetrics(cognitiveSnapshot, {
            gpaOverall: gpaSummary.overall,
            studyHoursPerWeek: behavior.studyHoursPerWeek,
            practiceTestsPerWeek: behavior.practiceTestsPerWeek,
            planCompletionRate: behavior.planCompletionRate,
            motivationLevel: behavior.motivationLevel,
          }),
          dataScope: isAdminDemo ? "demo" : "student",
          createdAt: serverTimestamp(),
        });
      });
      setLockedElectives([...selectedElectives]);
      setLockedForeignLanguage(profile.foreignLanguage);
      pushAppNotice({kind:"success", title:"Đã lưu hồ sơ học tập", detail:"Hồ sơ, bảng điểm và bản đo Cognitive đã lưu thành công. CLA sẽ chuyển về Dashboard."});
      // The app uses full-page navigation; replay this *generic* success once on the destination page.
      try { window.sessionStorage.setItem(`cla-seed-save-flash:${currentUser.uid}`, "saved"); } catch { /* In-app toast above still works if session storage is unavailable. */ }

      setMessage(
        "Đã lưu hồ sơ, bảng điểm và lịch sử học tập của bạn."
      );

      setTimeout(() => {
        goTo(isAdminPreview ? "/student?from=admin" : "/student");
      }, 800);
    } catch (error) {
      console.error(error);
      const detail = error instanceof Error ? error.message : "";
      const conflict = detail.startsWith("CLA_SEED_CONFLICT") || detail === "CLA_ACCOUNT_CHANGED_OR_INACTIVE";
      setMessage(conflict ? "Hồ sơ đã thay đổi hoặc tài khoản không còn hợp lệ. Hãy tải lại trang rồi đối chiếu trước khi lưu; không có dữ liệu nào được ghi từ lần gửi này." : "Không thể lưu hồ sơ. Hãy kiểm tra kết nối hoặc liên hệ hỗ trợ.");
      pushAppNotice({kind:"error", title:"Lưu hồ sơ thất bại", detail: conflict ? "Lần lưu đã bị chặn an toàn do dữ liệu hoặc quyền đã thay đổi. Tải lại hồ sơ trước khi thử." : "Dữ liệu chưa được xác nhận đã lưu. Kiểm tra Internet và quyền truy cập Firebase, rồi thử lại."});
    } finally {
      setLoading(false);
    }
  }

  const activeSemesterSummary = getSemesterSummary(activeGrade, activeSemester);
  const activeSemesterGpa = activeSemesterSummary.gpa;
  const activeYearGpa = getYearGpa(activeGrade);
  const overallGpa = getOverallGpa();
  const completedYearCount = gradeOptions.filter(grade => getYearGpa(grade.key) !== null).length;

  return (
    <main className="profile-page">
      <div className="profile-floating-header">
        <div className="profile-floating-left">
          <a
            className="profile-home-logo"
            href={isAdminPreview ? "/student?from=admin" : "/student"}
            aria-label="Về trang học sinh"
          >
            <img src={appLogo} alt="Cognitive Learn" />
          </a>
        </div>

        <UserMenu />
      </div>

      <section className="profile-shell">
        <ModuleSectionNav moduleKey="seed" />
        <header className="profile-head">
          <span>HỒ SƠ HỌC TẬP</span>
          <h1>Nhập dữ liệu THPT để Cognitive Learn phân tích</h1>
          <p>
            Hệ thống lưu bảng điểm lớp 10, 11, 12 theo học kì, theo đúng cấu
            trúc điểm thường xuyên, giữa kì, cuối kì để tính GPA, xu hướng học
            tập, SCI/MAS/CSL và dự báo tuyển sinh.
          </p>
        </header>

        <nav className="cla-seed-form-nav" aria-label="Đi đến từng phần hồ sơ">
          <a href="#cla-seed-section-goals"><span>01</span> Mục tiêu</a>
          <a href="#cla-seed-section-curriculum"><span>02</span> Môn học</a>
          <a href="#cla-seed-section-transcript"><span>03</span> Bảng điểm</a>
          <a href="#cla-seed-section-behavior"><span>04</span> Hành vi học tập</a>
          <a href="#cla-seed-section-finance"><span>05</span> Tài chính <small>Tùy chọn</small></a>
        </nav>

        {isAdminDemo && profileReady && (
          <>
            <p className="profile-message" role="status">
              CHẾ ĐỘ DEMO QUẢN TRỊ — dữ liệu minh họa chỉ thuộc tài khoản quản trị hiện tại; không phải kết quả của học sinh tham gia nghiên cứu.
            </p>
            <section className="cla-demo-prefill" aria-label="Nạp hồ sơ demo">
              <div>
                <strong>CLA · SYNTHETIC DEMO PRESET</strong>
                <p>Nạp hồ sơ minh họa lớp 10–12, 6 học kỳ và 9 môn để chạy thử Seed → Lumen → Orion → Atlas/Haven → Pulse. Dữ liệu chỉ điền vào biểu mẫu; không tự lưu.</p>
              </div>
              <button type="button" onClick={handleLoadDemoPreset} disabled={lockedElectives !== null}>
                {lockedElectives !== null ? "Hồ sơ đã khóa môn" : "Nạp hồ sơ demo 3 năm"}
              </button>
            </section>
            <p className="profile-note-box">Nạp dữ liệu mẫu chỉ điền vào biểu mẫu. Hãy kiểm tra kỹ trước khi lưu; dữ liệu mẫu chỉ dùng trong tài khoản demo quản trị.</p>
          </>
        )}

        <div className="cla-transcript-page-actions"><a href="/student/transcript">Xem bảng điểm đã lưu →</a></div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <section id="cla-seed-section-goals" className="profile-form-section">
            <div className="profile-section-title">
              <span>01</span>
              <h2>Thông tin mục tiêu</h2>
            </div>

            <div className="profile-field-grid">
              <label>
                Họ và tên
                <input
                  value={profile.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Lớp hiện tại
                <input
                  value={profile.className}
                  onChange={(event) =>
                    updateField("className", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Khu vực
                <input
                  value={profile.area}
                  onChange={(event) => updateField("area", event.target.value)}
                  required
                />
              </label>

              <label>
                Ngành mục tiêu
                <input
                  value={profile.targetMajor}
                  onChange={(event) =>
                    updateField("targetMajor", event.target.value)
                  }
                  required
                />
              </label>

              <label className="wide">
                Trường mục tiêu
                <input
                  value={profile.targetUniversity}
                  onChange={(event) =>
                    updateField("targetUniversity", event.target.value)
                  }
                  required
                />
              </label>
            </div>
          </section>

          <section id="cla-seed-section-curriculum" className="profile-form-section">
            <div className="profile-section-title">
              <span>02</span>
              <h2>Chương trình học GDPT 2018</h2>
            </div>

            <div className="profile-note-box">
              <strong>Cấu trúc môn học</strong>
              <p>
                Học sinh THPT có 8 môn học/hoạt động bắt buộc và chọn 4 môn học
                lựa chọn. Bảng điểm gồm 9 môn tính theo thang 10: Toán,
                Ngữ văn, Ngoại ngữ 1, Lịch sử, Giáo dục quốc phòng và an ninh,
                và 4 môn lựa chọn. Hai môn thi tự chọn tốt nghiệp là lựa chọn riêng.
              </p>
            </div>

            <div className="profile-field-grid">
              <label>
                Ngoại ngữ 1
                <select
                  value={profile.foreignLanguage}
                  disabled={lockedForeignLanguage !== null || !profileReady}
                  onChange={(event) =>
                    updateField("foreignLanguage", event.target.value)
                  }
                >
                  <option>Tiếng Anh</option>
                  <option>Tiếng Pháp</option>
                  <option>Tiếng Trung</option>
                  <option>Tiếng Nhật</option>
                  <option>Tiếng Hàn</option>
                  <option>Tiếng Đức</option>
                  <option>Tiếng Nga</option>
                </select>
              </label>
            </div>

            <div className="profile-subject-picker">
              <div className="profile-picker-head">
                <div>
                  <span>MÔN HỌC LỰA CHỌN</span>
                  <h3>Chọn đúng 4 môn học ổn định trong 3 năm THPT</h3>
                </div>

                <strong>{selectedElectives.length}/4</strong>
              </div>

              <div className="profile-subject-options">
                {electiveSubjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    className={
                      selectedElectives.includes(subject) ? "active" : ""
                    }
                    onClick={() => toggleElective(subject)}
                    disabled={lockedElectives !== null || !profileReady}
                    aria-pressed={selectedElectives.includes(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
              <p className="profile-note-box" role="status">
                {lockedElectives
                  ? "Tổ hợp 4 môn và Ngoại ngữ 1 đã khóa xuyên suốt lớp 10, 11, 12. Bất kỳ thay đổi chính thức nào phải có quy trình điều chỉnh và biên bản kiểm toán của nhà trường."
                  : "Sau lần lưu hồ sơ đầu tiên, 4 môn đã chọn sẽ được khóa và không thể tự sửa. Hãy kiểm tra kỹ trước khi xác nhận."}
              </p>
            </div>
          </section>

          <section id="cla-seed-section-transcript" className="profile-form-section">
            <div className="profile-section-title">
              <span>03</span>
              <h2>Bảng điểm 3 năm THPT</h2>
            </div>

            <div className="profile-note-box">
              <strong>Công thức trung bình môn học kì</strong>
              <p>
                TB môn học kì = (tổng điểm thường xuyên + giữa kì × 2 + cuối kì
                × 3) / (số cột thường xuyên + 2 + 3). Mỗi môn có tối đa 5 cột
                điểm thường xuyên.
              </p>
            </div>

            <div className="profile-note-box">
              <strong>Dành cho học sinh đang học lớp 12</strong>
              <p>
                Không cần nhập đủ 6 học kỳ. Điểm chưa có hãy để trống; điểm 0 chỉ nhập khi thực sự nhận 0.
                Các điểm hiện có được ghi là tạm tính, không được xem là GPA học kỳ/năm chính thức.
                GPA năm chỉ tính khi hai học kỳ đã đủ cột điểm của các môn được chấm điểm.
              </p>
            </div>

            <div className="profile-grade-tabs">
              {gradeOptions.map((grade) => (
                <button
                  key={grade.key}
                  type="button"
                  className={activeGrade === grade.key ? "active" : ""}
                  onClick={() => setActiveGrade(grade.key)}
                >
                  {grade.label}
                </button>
              ))}
            </div>

            <div className="profile-semester-tabs">
              {semesterOptions.map((semester) => (
                <button
                  key={semester.key}
                  type="button"
                  className={activeSemester === semester.key ? "active" : ""}
                  onClick={() => setActiveSemester(semester.key)}
                >
                  {semester.label}
                </button>
              ))}
            </div>

            <div className="profile-gpa-summary">
              <article>
                <span>Trung bình học kỳ đang chọn</span>
                <strong>{activeSemesterGpa ?? (activeSemesterSummary.provisionalAverage !== null
                  ? `${activeSemesterSummary.provisionalAverage} (tạm)` : "—")}</strong>
                <small>{activeSemesterSummary.completedSubjects}/{activeSemesterSummary.expectedSubjects} môn đủ cột điểm</small>
              </article>

              <article>
                <span>Trung bình năm (đủ 2 học kỳ)</span>
                <strong>{activeYearGpa ?? "—"}</strong>
              </article>

              <article>
                <span>TB các năm hoàn chỉnh ({completedYearCount}/3)</span>
                <strong>{overallGpa ?? "—"}</strong>
              </article>
            </div>

            <div className="profile-transcript-wrapper">
              <table className="profile-transcript-table">
                <thead>
                  <tr>
                    <th>Môn học</th>
                    <th>TX1</th>
                    <th>TX2</th>
                    <th>TX3</th>
                    <th>TX4</th>
                    <th>TX5</th>
                    <th>Giữa kì</th>
                    <th>Cuối kì</th>
                    <th>TB HK</th>
                  </tr>
                </thead>

                <tbody>
                  {gradedSubjects.map((subject) => {
                    const row = getScoreRow(
                      activeGrade,
                      activeSemester,
                      subject
                    );
                    const semesterAverage = calculateSemesterAverage(row);
                    const provisionalAverage = calculateProvisionalAverage(row);

                    return (
                      <tr key={subject}>
                        <td>
                          <strong>{subject}</strong>
                        </td>

                        {row.regular.map((score, index) => (
                          <td key={`${subject}-regular-${index}`}>
                            <input
                              aria-label={`${subject} · Lớp ${activeGrade} · Học kỳ ${activeSemester} · Điểm thường xuyên ${index + 1}`}
                              type="number"
                              step="any"
                              min="0"
                              max="10"
                              value={score}
                              onChange={(event) =>
                                updateScore(
                                  activeGrade,
                                  activeSemester,
                                  subject,
                                  "regular",
                                  event.target.value,
                                  index
                                )
                              }
                            />
                          </td>
                        ))}

                        <td>
                          <input
                            aria-label={`${subject} · Lớp ${activeGrade} · Học kỳ ${activeSemester} · Điểm giữa kỳ`}
                            type="number"
                            step="any"
                            min="0"
                            max="10"
                            value={row.midterm}
                            onChange={(event) =>
                              updateScore(
                                activeGrade,
                                activeSemester,
                                subject,
                                "midterm",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            aria-label={`${subject} · Lớp ${activeGrade} · Học kỳ ${activeSemester} · Điểm cuối kỳ`}
                            type="number"
                            step="any"
                            min="0"
                            max="10"
                            value={row.final}
                            onChange={(event) =>
                              updateScore(
                                activeGrade,
                                activeSemester,
                                subject,
                                "final",
                                event.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <b>{semesterAverage ?? (provisionalAverage !== null
                            ? `${provisionalAverage} (tạm)` : "—")}</b>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="cla-seed-section-behavior" className="profile-form-section">
            <div className="profile-section-title">
              <span>04</span>
              <h2>Hành vi học tập và nhận thức</h2>
            </div>

            <div className="cla-seed-measurement-note" role="note">
              <strong>Chỉ báo hành vi bổ sung · có thể để trống</strong>
              <p>Số lần đổi mục tiêu, tỷ lệ bỏ dở nhiệm vụ và tỷ lệ chuyển đổi tác vụ là các thông tin tự đánh giá bổ sung. Nếu chưa theo dõi hoặc không chắc con số, hãy để trống: Lumen sẽ ghi nhận thiếu dữ liệu thay vì tự đổi thành 0. Các thông tin cơ bản còn lại cần được điền để tạo phân tích ban đầu.</p>
            </div>

            <div className="profile-field-grid">
              <label>
                Số giờ học mỗi tuần
                <input
                  type="number"
                  min="0"
                  value={profile.studyHoursPerWeek}
                  onChange={(event) =>
                    updateField("studyHoursPerWeek", event.target.value)
                  }
                required
                  />
              </label>

              <label>
                Số đề luyện mỗi tuần
                <input
                  type="number"
                  min="0"
                  value={profile.practiceTestsPerWeek}
                  onChange={(event) =>
                    updateField("practiceTestsPerWeek", event.target.value)
                  }
                required
                  />
              </label>

              <label>
                Mức hoàn thành kế hoạch %
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.planCompletionRate}
                  onChange={(event) =>
                    updateField("planCompletionRate", event.target.value)
                  }
                required
                  />
              </label>

              <label>
                Số lần đổi mục tiêu/tháng
                <input
                  type="number"
                  min="0"
                  value={profile.goalSwitchFrequency}
                  onChange={(event) =>
                    updateField("goalSwitchFrequency", event.target.value)
                  }
                />
              </label>

              <label>
                Tỷ lệ bỏ dở nhiệm vụ %
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.taskAbandonmentRate}
                  onChange={(event) =>
                    updateField("taskAbandonmentRate", event.target.value)
                  }
                />
              </label>

              <label>
                Tỷ lệ chuyển đổi tác vụ % (tự đánh giá, chưa kiểm định)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.contextSwitchRate}
                  onChange={(event) =>
                    updateField("contextSwitchRate", event.target.value)
                  }
                />
              </label>

              <label>
                Mức sử dụng chiến lược học tập % (tự đánh giá, chưa kiểm định)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.learningStrategy}
                  onChange={(event) =>
                    updateField("learningStrategy", event.target.value)
                  }
                required
                  />
              </label>

              <label>
                Mức động lực %
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profile.motivationLevel}
                  onChange={(event) =>
                    updateField("motivationLevel", event.target.value)
                  }
                required
                  />
              </label>
            </div>
          </section>

          <section id="cla-seed-section-finance" className="profile-form-section">
            <div className="profile-section-title">
              <span>05</span>
              <h2>Tài chính, du học và học bổng (không bắt buộc)</h2>
            </div>

            <div className="profile-field-grid">
              <label>
                Ngân sách giáo dục dự kiến
                <input
                  type="number"
                  min="0"
                  value={profile.educationBudget}
                  onChange={(event) =>
                    updateField("educationBudget", event.target.value)
                  }
                />
              </label>

              <label>
                Mức học phí tối đa/năm
                <input
                  type="number"
                  min="0"
                  value={profile.maxTuition}
                  onChange={(event) =>
                    updateField("maxTuition", event.target.value)
                  }
                />
              </label>

              <label>
                Có quan tâm du học không?
                <select
                  value={profile.studyAbroadInterest}
                  onChange={(event) =>
                    updateField("studyAbroadInterest", event.target.value)
                  }
                >
                  <option>Không</option>
                  <option>Có</option>
                  <option>Đang cân nhắc</option>
                </select>
              </label>

              <label>
                Có quan tâm học bổng không?
                <select
                  value={profile.scholarshipInterest}
                  onChange={(event) =>
                    updateField("scholarshipInterest", event.target.value)
                  }
                >
                  <option>Không</option>
                  <option>Có</option>
                  <option>Đang cân nhắc</option>
                </select>
              </label>
            </div>

            {profile.studyAbroadInterest !== "Không" && (
              <div className="profile-conditional-box">
                <div className="profile-picker-head">
                  <div>
                    <span>DU HỌC</span>
                    <h3>Thông tin lộ trình du học</h3>
                  </div>
                </div>

                <div className="profile-field-grid">
                  <label>
                    Quốc gia quan tâm
                    <select
                      value={profile.targetCountry}
                      onChange={(event) =>
                        updateField("targetCountry", event.target.value)
                      }
                    >
                      <option value="">Chưa chọn</option>
                      {countryCatalog.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <small>Danh mục gồm 249 quốc gia/vùng lãnh thổ. Đây là lựa chọn sở thích; điều kiện tuyển sinh phải tra cứu riêng trong Atlas.</small>
                  </label>
                </div>
              </div>
            )}

            {profile.scholarshipInterest !== "Không" && (
              <div className="profile-conditional-box">
                <div className="profile-picker-head">
                  <div>
                    <span>HỌC BỔNG</span>
                    <h3>Nhu cầu tìm kiếm học bổng</h3>
                  </div>
                </div>

                <div className="profile-field-grid">
                  <label className="wide">
                    Mục tiêu học bổng
                    <input
                      value={profile.scholarshipGoal}
                      placeholder="Ví dụ: học bổng trong nước, học bổng du học Nhật, học bổng toàn phần..."
                      onChange={(event) =>
                        updateField("scholarshipGoal", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </section>

          <div className="profile-submit-bar">
            <button
              type="button"
              className="profile-secondary-button"
              onClick={() =>
                goTo(isAdminPreview ? "/student?from=admin" : "/student")
              }
            >
              Quay lại dashboard
            </button>

            <button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu hồ sơ học tập"}
            </button>
          </div>

          {message && <p className="profile-message" role={profileReadFailed ? "alert" : "status"}>{message}</p>}
          {profileReadFailed && (
            <button className="cla-action-button cla-action-button--outline" type="button" onClick={() => setLoadAttempt(value => value + 1)}>
              Thử tải lại hồ sơ
            </button>
          )}
        </form>
      </section>
    </main>
  );
}