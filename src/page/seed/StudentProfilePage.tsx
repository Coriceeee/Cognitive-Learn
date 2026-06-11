import { FormEvent, useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

type GradeKey = "grade10" | "grade11" | "grade12";
type SemesterKey = "semester1" | "semester2";

type ScoreRow = {
  regular: string[];
  midterm: string;
  final: string;
};

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

const electiveSubjects = [
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Địa lý",
  "Giáo dục kinh tế và pháp luật",
  "Tin học",
  "Công nghệ",
  "Âm nhạc",
  "Mĩ thuật",
];

const initialProfile: LearningProfile = {
  fullName: "Nguyễn Minh Anh",
  className: "12A1",
  area: "Hà Nội",
  targetMajor: "Công nghệ thông tin",
  targetUniversity: "Học viện Công nghệ Bưu chính Viễn thông",
  foreignLanguage: "Tiếng Anh",
  studyHoursPerWeek: "18",
  practiceTestsPerWeek: "5",
  planCompletionRate: "75",
  goalSwitchFrequency: "2",
  taskAbandonmentRate: "20",
  motivationLevel: "70",
  educationBudget: "120000000",
  maxTuition: "35000000",
  studyAbroadInterest: "Không",
  targetCountry: "",
  scholarshipInterest: "Không",
  scholarshipGoal: "",
};

const initialElectives = ["Vật lý", "Hóa học", "Sinh học", "Địa lý"];

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

  const sampleSubjects = [
    "Toán",
    "Ngữ văn",
    "Tiếng Anh",
    "Lịch sử",
    ...initialElectives,
  ];

  sampleSubjects.forEach((subject) => {
    scores.grade12.semester1[subject] = {
      regular: ["8", "7.5", "8.2", "", ""],
      midterm: "7.8",
      final: "8.4",
    };
  });

  return scores;
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateSemesterAverage(row: ScoreRow) {
  const regularScores = row.regular
    .map((score) => toNumber(score))
    .filter((score): score is number => score !== null);

  const midterm = toNumber(row.midterm);
  const final = toNumber(row.final);

  if (regularScores.length === 0 || midterm === null || final === null) {
    return null;
  }

  const regularTotal = regularScores.reduce((sum, score) => sum + score, 0);
  const total = regularTotal + midterm * 2 + final * 3;
  const weight = regularScores.length + 2 + 3;

  return roundScore(total / weight);
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);
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

  const params = new URLSearchParams(window.location.search);
  const isAdminPreview = params.get("from") === "admin";

  const gradedSubjects = useMemo(
    () => [
      "Toán",
      "Ngữ văn",
      profile.foreignLanguage,
      "Lịch sử",
      ...selectedElectives,
    ],
    [profile.foreignLanguage, selectedElectives]
  );

  function updateField(field: keyof LearningProfile, value: string) {
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
    return transcriptScores[grade][semester][subject] || emptyScoreRow();
  }

  function updateScore(
    grade: GradeKey,
    semester: SemesterKey,
    subject: string,
    field: "regular" | "midterm" | "final",
    value: string,
    regularIndex?: number
  ) {
    setTranscriptScores((current) => {
      const currentRow = current[grade][semester][subject] || emptyScoreRow();

      const nextRow: ScoreRow =
        field === "regular"
          ? {
              ...currentRow,
              regular: currentRow.regular.map((score, index) =>
                index === regularIndex ? value : score
              ),
            }
          : {
              ...currentRow,
              [field]: value,
            };

      return {
        ...current,
        [grade]: {
          ...current[grade],
          [semester]: {
            ...current[grade][semester],
            [subject]: nextRow,
          },
        },
      };
    });
  }

  function toggleElective(subject: string) {
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

  function getSemesterGpa(grade: GradeKey, semester: SemesterKey) {
    const values = gradedSubjects
      .map((subject) =>
        calculateSemesterAverage(getScoreRow(grade, semester, subject))
      )
      .filter((score): score is number => score !== null);

    return average(values);
  }

  function getYearGpa(grade: GradeKey) {
    const semester1 = getSemesterGpa(grade, "semester1");
    const semester2 = getSemesterGpa(grade, "semester2");

    if (semester1 !== null && semester2 !== null) {
      return roundScore((semester1 + semester2 * 2) / 3);
    }

    if (semester1 !== null) {
      return semester1;
    }

    if (semester2 !== null) {
      return semester2;
    }

    return null;
  }

  function getOverallGpa() {
    const values = gradeOptions
      .map((grade) => getYearGpa(grade.key))
      .filter((score): score is number => score !== null);

    return average(values);
  }

  function buildTranscriptForSave() {
    const result = {} as TranscriptScores;

    gradeOptions.forEach((grade) => {
      result[grade.key] = {} as Record<SemesterKey, Record<string, ScoreRow>>;

      semesterOptions.forEach((semester) => {
        result[grade.key][semester.key] = {};

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

  function buildGpaSummary() {
    return {
      grade10: getYearGpa("grade10"),
      grade11: getYearGpa("grade11"),
      grade12: getYearGpa("grade12"),
      overall: getOverallGpa(),
    };
  }

  function goTo(path: string) {
    window.location.href = path;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedElectives.length !== 4) {
      setMessage("Bạn cần chọn đúng 4 môn học lựa chọn.");
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

      await setDoc(
        doc(db, "learning_profiles", currentUser.uid),
        {
          userId: currentUser.uid,
          email: currentUser.email,
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
          },
          transcript: buildTranscriptForSave(),
          gpaSummary: buildGpaSummary(),
          behavior: {
            studyHoursPerWeek: Number(profile.studyHoursPerWeek),
            practiceTestsPerWeek: Number(profile.practiceTestsPerWeek),
            planCompletionRate: Number(profile.planCompletionRate),
            goalSwitchFrequency: Number(profile.goalSwitchFrequency),
            taskAbandonmentRate: Number(profile.taskAbandonmentRate),
            motivationLevel: Number(profile.motivationLevel),
          },
          finance: {
            educationBudget: Number(profile.educationBudget),
            maxTuition: Number(profile.maxTuition),
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
        },
        { merge: true }
      );

      setMessage("Đã lưu hồ sơ học tập thành công.");

      setTimeout(() => {
        goTo(isAdminPreview ? "/student?from=admin" : "/student");
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage("Không thể lưu hồ sơ. Hãy kiểm tra Firestore Rules.");
    } finally {
      setLoading(false);
    }
  }

  const activeSemesterGpa = getSemesterGpa(activeGrade, activeSemester);
  const activeYearGpa = getYearGpa(activeGrade);
  const overallGpa = getOverallGpa();

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
        <header className="profile-head">
          <span>HỒ SƠ HỌC TẬP</span>
          <h1>Nhập dữ liệu THPT để Cognitive Learn phân tích</h1>
          <p>
            Hệ thống lưu bảng điểm lớp 10, 11, 12 theo học kì, theo đúng cấu
            trúc điểm thường xuyên, giữa kì, cuối kì để tính GPA, xu hướng học
            tập, SCI/MAS/CSL và dự báo tuyển sinh.
          </p>
        </header>

        <form className="profile-form" onSubmit={handleSubmit}>
          <section className="profile-form-section">
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

          <section className="profile-form-section">
            <div className="profile-section-title">
              <span>02</span>
              <h2>Chương trình học GDPT 2018</h2>
            </div>

            <div className="profile-note-box">
              <strong>Cấu trúc môn học</strong>
              <p>
                Học sinh THPT có 8 môn học/hoạt động bắt buộc và chọn 4 môn học
                lựa chọn. Phần tính GPA sẽ tập trung vào các môn có điểm: Toán,
                Ngữ văn, Ngoại ngữ 1, Lịch sử và 4 môn lựa chọn.
              </p>
            </div>

            <div className="profile-field-grid">
              <label>
                Ngoại ngữ 1
                <select
                  value={profile.foreignLanguage}
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
                  <h3>Chọn đúng 4 môn theo định hướng nghề nghiệp</h3>
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
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="profile-form-section">
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
                <span>GPA học kì đang chọn</span>
                <strong>{activeSemesterGpa ?? "—"}</strong>
              </article>

              <article>
                <span>GPA năm đang chọn</span>
                <strong>{activeYearGpa ?? "—"}</strong>
              </article>

              <article>
                <span>GPA toàn THPT</span>
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

                    return (
                      <tr key={subject}>
                        <td>
                          <strong>{subject}</strong>
                        </td>

                        {row.regular.map((score, index) => (
                          <td key={`${subject}-regular-${index}`}>
                            <input
                              type="number"
                              step="0.1"
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
                            type="number"
                            step="0.1"
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
                            type="number"
                            step="0.1"
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
                          <b>{semesterAverage ?? "—"}</b>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="profile-form-section">
            <div className="profile-section-title">
              <span>04</span>
              <h2>Hành vi học tập và nhận thức</h2>
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
                  required
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

          <section className="profile-form-section">
            <div className="profile-section-title">
              <span>05</span>
              <h2>Tài chính, du học và học bổng</h2>
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
                  required
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
                  required
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
                      <option>Nhật Bản</option>
                      <option>Hàn Quốc</option>
                      <option>Singapore</option>
                      <option>Hoa Kỳ</option>
                      <option>Đức</option>
                      <option>Anh</option>
                      <option>Úc</option>
                    </select>
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

          {message && <p className="profile-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}