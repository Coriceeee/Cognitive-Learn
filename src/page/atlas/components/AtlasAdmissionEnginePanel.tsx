import { useEffect, useMemo, useRef, useState } from "react";
import { useStudentTranscript } from "../../seed/hooks/useStudentTranscript";
import { chooseSeedAtlasScoreSnapshot, toSeedAtlasScoreSnapshot, SEED_ATLAS_SUBJECT_CODES, type SeedAtlasScoreSnapshot } from "../../../lib/seedAtlasScoreAdapter";
import { EXAM_ELECTIVES_2026, EXAM_POLICY_2026, optimizeExamChoices2026, type ExamElective2026 } from "../../../lib/examChoiceEngine";
import { matchPtitPublishedPathways2026 } from "../../../lib/ptitAdmissionPathways2026";

import { runAdmissionEngine } from "../../../lib/admissionEngine";
import { ADMISSION_POLICY_2026 } from "../../../lib/aspirationPlanner";
import AtlasAspirationDraftEditor from "./AtlasAspirationDraftEditor";

import { getRiskLabel } from "../../../lib/admissionRules";
import {
  getComparableAtlasBenchmark,
  mapAtlasProgramsToAdmissionRules,
} from "../../../lib/atlasBenchmarkBridge";

import type { SubjectScoreMap } from "../../../lib/admissionTypes";

import {
  buildScoreConversionReport,
  parseSubjectScore,
} from "../../../lib/scoreConversionEngine";

import type {
  AtlasAdmissionSource,
  AtlasProgram,
  AtlasUniversity,
} from "../../../lib/atlasKnowledgeBase";

type AtlasAdmissionEnginePanelProps = {
  programs: AtlasProgram[];
  sources: AtlasAdmissionSource[];
  universityMap: Record<
    string,
    AtlasUniversity
  >;
};

type ScoreInputKey =
  | "math"
  | "literature"
  | "english"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "civicEducation"
  | "informatics"
  | "technology";

const defaultSubjectScores: Record<
  ScoreInputKey,
  string
> = {
  math: "",
  literature: "",
  english: "",
  physics: "",
  chemistry: "",
  biology: "",
  history: "",
  geography: "",
  civicEducation: "",
  informatics: "",
  technology: "",
};

const scoreLabels: Record<
  ScoreInputKey,
  string
> = {
  math: "Toán",
  literature: "Văn",
  english: "Anh",
  physics: "Lý",
  chemistry: "Hóa",
  biology: "Sinh",
  history: "Sử",
  geography: "Địa",
  civicEducation: "GDKT & Pháp luật",
  informatics: "Tin học",
  technology: "Công nghệ",
};

type ScoreBasis = "practice" | "school" | "official_thpt_2026";

function getEngineStatus(
  programs: AtlasProgram[],
  approvedBenchmarkCount: number
) {
  if (programs.length === 0) {
    return {
      label:
        "Chưa có dữ liệu Atlas",

      className:
        "empty",
    };
  }

  const verifiedCount =
    programs.filter(
      (program) =>
        program.status ===
        "verified"
    ).length;

  if (approvedBenchmarkCount > 0) {
    return {
      label: `${approvedBenchmarkCount} mốc có nguồn được đánh dấu duyệt`,
      className: "verified",
    };
  }

  if (verifiedCount > 0) {
    return {
      label: "Chưa có điểm chuẩn đủ căn cứ",
      className: "draft",
    };
  }

  return {
    label:
      "Dữ liệu nháp",

    className:
      "draft",
  };
}

export default function AtlasAdmissionEnginePanel({
  programs,
  sources,
  universityMap,
}: AtlasAdmissionEnginePanelProps) {
  const [
    targetMajor,
    setTargetMajor,
  ] = useState("");

  const [
    priorityScore,
    setPriorityScore,
  ] = useState("");

  const [
    subjectScores,
    setSubjectScores,
  ] =
    useState<
      Record<
        ScoreInputKey,
        string
      >
    >(
      defaultSubjectScores
    );

  // Seed remains the read-only source of school marks; it never supplies THPT marks.
  const transcript = useStudentTranscript();
  const [seedTermId, setSeedTermId] = useState("auto");
  const [seedNote, setSeedNote] = useState("");
  const [importedSeedKeys, setImportedSeedKeys] = useState<ScoreInputKey[]>([]);
  const hasEditedScore = useRef(false);
  const previousUserId = useRef<string | null | undefined>(undefined);
  const [scoreBasis, setScoreBasis] = useState<ScoreBasis>("practice");
  const [selectedCombination, setSelectedCombination] = useState<string>("D01");
  const [showAllCombinations, setShowAllCombinations] = useState(false);
  const [confirmedGrade12Subjects, setConfirmedGrade12Subjects] = useState<ExamElective2026[]>([]);
  const [selectedExamPairId, setSelectedExamPairId] = useState("");
  const [showAllExamOptions, setShowAllExamOptions] = useState(false);

  const seedSnapshot = useMemo(() => {
    if (!transcript.data) return null;
    if (seedTermId === "auto") return chooseSeedAtlasScoreSnapshot(transcript.data);
    const term = transcript.data.terms.find(item => `${item.grade}:${item.semester}` === seedTermId);
    return term ? toSeedAtlasScoreSnapshot(term) : null;
  }, [transcript.data, seedTermId]);

  function loadSeedSchoolMarks(snapshot: SeedAtlasScoreSnapshot) {
    const next = { ...defaultSubjectScores };
    const keys = Object.keys(snapshot.scores) as ScoreInputKey[];
    for (const key of keys) next[key] = String(snapshot.scores[key]);
    setSubjectScores(next);
    setImportedSeedKeys(keys);
    setScoreBasis("school");
    setPriorityScore("");
    setSeedNote(`${snapshot.termLabel}: ${keys.length} điểm trung bình môn đầy đủ được đọc từ Seed. Không phải điểm thi THPT hay điểm xét tuyển được trường xác nhận.`);
    hasEditedScore.current = true;
  }

  // A mounted Atlas page must not retain another account's grades.
  useEffect(() => {
    if (previousUserId.current === undefined) {
      previousUserId.current = transcript.userId;
      return;
    }
    if (previousUserId.current === transcript.userId) return;
    previousUserId.current = transcript.userId;
    hasEditedScore.current = false;
    setSubjectScores({ ...defaultSubjectScores });
    setImportedSeedKeys([]);
    setScoreBasis("practice");
    setPriorityScore("");
    setSeedTermId("auto");
    setSeedNote("");
    setTargetMajor("");
    setConfirmedGrade12Subjects([]);
    setSelectedExamPairId("");
    setShowAllExamOptions(false);
  }, [transcript.userId]);

  // Automatically hydrate an untouched Atlas form once the student's own
  // transcript is available. Manual edits and resets are never overwritten.
  useEffect(() => {
    if (transcript.userId === null || transcript.status !== "ready" ||
        !seedSnapshot || hasEditedScore.current || seedSnapshot.completedSubjectCount === 0) return;
    loadSeedSchoolMarks(seedSnapshot);
  }, [transcript.userId, transcript.status, seedSnapshot]);

  const invalidScoreKeys = (Object.keys(subjectScores) as ScoreInputKey[]).filter(
    (key) => subjectScores[key].trim() !== "" && parseSubjectScore(subjectScores[key]) === undefined
  );
  const hasInvalidScores = invalidScoreKeys.length > 0;

  const benchmarkByProgram = useMemo(() => new Map(
    programs.map((program) => [program.id, getComparableAtlasBenchmark(program, sources)] as const)
  ), [programs, sources]);

  const approvedBenchmarkCount = Array.from(benchmarkByProgram.values())
    .filter(Boolean).length;

  const engineStatus = getEngineStatus(programs, approvedBenchmarkCount);

  const scoreMap: SubjectScoreMap = useMemo(() => {
    const map: SubjectScoreMap = {};
    (Object.keys(subjectScores) as ScoreInputKey[]).forEach((key) => {
      const score = parseSubjectScore(subjectScores[key]);
      if (score !== undefined) map[key] = score;
    });
    return map;
  }, [subjectScores]);

  const scoreReport =
    useMemo(() => {
      return buildScoreConversionReport(
        {
          subjectScores:
            scoreMap,

          priorityScore:
            Number(
              priorityScore.replace(
                ",",
                "."
              )
            ) || 0,
        }
      );
    }, [
      scoreMap,
      priorityScore,
    ]);

  const completeCombinations = useMemo(() =>
    scoreReport.combinationOptions.filter((item) => item.missingSubjects.length === 0)
      .sort((a, b) => b.rawScore - a.rawScore), [scoreReport]);

  const rankedCombinations = useMemo(() => [
    ...completeCombinations,
    ...scoreReport.combinationOptions.filter((item) => item.missingSubjects.length > 0),
  ], [completeCombinations, scoreReport]);

  const focusedCombination = scoreReport.combinationOptions.find(
    (item) => item.combinationCode === selectedCombination
  ) ?? rankedCombinations[0];

  const parsedPriority = priorityScore.trim() === "" ? 0 : Number(priorityScore.replace(",", "."));
  const validPriority = Number.isFinite(parsedPriority) && parsedPriority >= 0 && parsedPriority <= 3;
  const canClassifyAdmission = scoreBasis === "official_thpt_2026"
    && importedSeedKeys.length === 0 && !hasInvalidScores && validPriority && parsedPriority === 0
    && completeCombinations.length > 0;

  const engineResult = useMemo(() => {
    // A mock/practice/school score is NOT comparable with an official THPT
    // cutoff. Source year and actual admission method still need validation.
    if (programs.length === 0 || !canClassifyAdmission) return null;
    return runAdmissionEngine({
      scoreReport,
      programs: mapAtlasProgramsToAdmissionRules(programs, sources, universityMap).filter(
        (program) => program.sourceYear === ADMISSION_POLICY_2026.year
      ),
      targetMajor: targetMajor.trim(),
      maxAspirations: 15,
    });
  }, [programs, universityMap, sources, scoreReport, targetMajor, canClassifyAdmission]);

  // Only explicitly verified 2026 program + official source records can be used
  // for a program match. The demo/pending programs never become real advice.
  const sourceVerifiedPrograms = useMemo(() => programs.filter(program =>
    program.status === "verified" && program.sourceYear === EXAM_POLICY_2026.year &&
    program.methods.includes("THPT") && program.sourceIds.some(id => sources.some(source =>
      source.id === id && source.status === "verified" && source.sourceYear === EXAM_POLICY_2026.year &&
      /^https:\/\//.test(source.sourceUrl)
    ))
  ).map(({id, majorName, combinations}) => ({id, majorName, combinations})), [programs, sources]);

  const examChoiceReport = useMemo(() => optimizeExamChoices2026({
    confirmedGrade12Subjects, subjectScores: scoreMap, targetMajor, verifiedPrograms: sourceVerifiedPrograms,
  }), [confirmedGrade12Subjects, scoreMap, targetMajor, sourceVerifiedPrograms]);

  // 2026 PTIT BVH is a separately source-backed, BOUNDED program sample.
  // These matches never enter a cutoff/risk calculation or silently become
  // a nationwide ranking. Includes X06/X26 from PTIT's published scheme.
  const publishedPtitByPair = useMemo(() => new Map(examChoiceReport.options.map(option => [
    option.id,
    matchPtitPublishedPathways2026({
      selectedElectives: option.electives,
      scores: scoreMap,
      targetMajor,
    }),
  ] as const)), [examChoiceReport, scoreMap, targetMajor]);
  const selectedPtitPublished = selectedExamPairId
    ? publishedPtitByPair.get(selectedExamPairId) : undefined;

  // Curriculum subjects from Seed are only suggestions to review. The learner
  // must click the explicit confirmation control; grades are not evidence of
  // grade-12 enrollment by themselves.
  const seedSuggestedElectives = useMemo(() => {
    const candidates = new Set(EXAM_ELECTIVES_2026.map(item => item.code));
    const selected: Array<ExamElective2026 | undefined> = (transcript.data?.currentSubjects ?? []).map(subject => {
      const code = SEED_ATLAS_SUBJECT_CODES[subject];
      return candidates.has(code as ExamElective2026) ? code as ExamElective2026 : undefined;
    });
    return Array.from(new Set(selected)).filter((code): code is ExamElective2026 => code !== undefined);
  }, [transcript.data]);

  function toggleConfirmedExamSubject(code: ExamElective2026) {
    setConfirmedGrade12Subjects(current => current.includes(code) ? current.filter(item => item !== code) : [...current, code]);
    setSelectedExamPairId("");
  }

  function updateScore(
    key: ScoreInputKey,
    value: string
  ) {
    hasEditedScore.current = true;
    setImportedSeedKeys(current => current.filter(item => item !== key));
    setSubjectScores(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  function changeScoreBasis(basis: ScoreBasis) {
    if (basis === scoreBasis) return;
    // Points from different assessment systems must never silently mix.
    hasEditedScore.current = true;
    setSubjectScores({ ...defaultSubjectScores });
    setImportedSeedKeys([]);
    setSeedNote("");
    setPriorityScore("");
    setScoreBasis(basis);
  }

  function resetScores() {
    hasEditedScore.current = true;
    setImportedSeedKeys([]);
    setSeedNote("");
    setSubjectScores(
      defaultSubjectScores
    );

    setPriorityScore(
      ""
    );

    setTargetMajor(
      ""
    );
    setScoreBasis("practice");
    setSelectedCombination("D01");
    setShowAllCombinations(false);
  }

  return (
    <section className="atlas-engine-panel">

      <div className="atlas-engine-head">

        <div>

          <span>
            ADMISSION ENGINE
          </span>

          <h2>
            Gợi ý tuyển sinh từ
            Atlas Engine
          </h2>

          <p>
            Điểm bạn nhập được tính theo tổ hợp. CLA chỉ xếp nhóm nguyện vọng khi có điểm chuẩn, phương thức và nguồn xác minh phù hợp.
            Chưa có đủ căn cứ thì không tự xếp nhóm; điểm quy đổi không phải xác suất trúng tuyển.
          </p>
          <p>
            Quy chế tuyển sinh {ADMISSION_POLICY_2026.year}: tối đa {ADMISSION_POLICY_2026.maxAspirations} nguyện vọng;
            chương trình đào tạo giáo viên chỉ được xét tuyển từ NV1 đến NV{ADMISSION_POLICY_2026.teacherTrainingLastPriority}.
            Thứ tự ở đây chỉ là gợi ý, học sinh phải tự quyết định thứ tự ưu tiên khi đăng ký chính thức. {" "}
            <a href="#atlas-nguyen-vong-nhap">Mở sổ tay nguyện vọng nháp để tự sắp xếp</a>. {" "}
            <a href={ADMISSION_POLICY_2026.officialUrl} target="_blank" rel="noreferrer">
              Xem {ADMISSION_POLICY_2026.document}, {ADMISSION_POLICY_2026.article}
            </a>.
          </p>

        </div>

        <strong
          className={
            `atlas-engine-status ${engineStatus.className}`
          }
        >
          {engineStatus.label}
        </strong>

      </div>

      <div className="atlas-score-summary">

        <div>
          <span>
            Tổ hợp đủ 3 môn cao nhất
          </span>

          <strong>
            {
              hasInvalidScores
                ? "Kiểm tra điểm"
                : scoreReport.bestOption?.label || "Chưa đủ 3 môn"
            }
          </strong>
        </div>

        <div>
          <span>
            Tổng điểm 3 môn (tham khảo)
          </span>

          <strong>
            {scoreReport
              .bestOption && !hasInvalidScores
              ? `${completeCombinations[0]?.rawScore.toFixed(2)}/30`
              : "Chưa đủ dữ liệu"}
          </strong>
        </div>

        <div>
          <span>
            Số ngành Atlas
          </span>

          <strong>
            {programs.length}
          </strong>
        </div>

      </div>

      <div className="atlas-decision-story" aria-label="Lộ trình giải thích lựa chọn">
        <div><small>01 · QUAN SÁT</small><strong>Điểm đã nhập</strong><span>{Object.keys(scoreMap).length}/11 môn</span></div>
        <div><small>02 · SO SÁNH</small><strong>Tổ hợp đủ điểm</strong><span>{hasInvalidScores ? "Cần sửa dữ liệu" : `${completeCombinations.length}/9 tổ hợp`}</span></div>
        <div><small>03 · QUYẾT ĐỊNH</small><strong>Đối chiếu tuyển sinh</strong><span>{canClassifyAdmission ? "Cần nguồn điểm chuẩn" : "Chưa xác minh"}</span></div>
      </div>

      <div className="atlas-engine-form">

        <label>

          <span>
            Ngành mục tiêu
          </span>

          <input
            value={
              targetMajor
            }
            onChange={(event) =>
              setTargetMajor(
                event.target.value
              )
            }
            placeholder="Ví dụ: Công nghệ thông tin"
          />

        </label>

        <label className="atlas-score-basis">
          <span>Nguồn điểm đang sử dụng</span>
          <select value={scoreBasis} onChange={(event) => changeScoreBasis(event.target.value as ScoreBasis)}>
            <option value="practice">Điểm thi thử / tự đánh giá</option>
            <option value="school">Điểm học bạ</option>
            <option value="official_thpt_2026">Điểm thi THPT 2026 chính thức (tự khai báo)</option>
          </select>
        </label>

        <label>

          <span>
            Điểm ưu tiên
          </span>

          <input
            value={
              priorityScore
            }
            onChange={(event) =>
              setPriorityScore(
                event.target.value
              )
            }
            placeholder="Để trống nếu không có"
          />

        </label>

      </div>

      <section className="atlas-seed-bridge" aria-label="Đồng bộ bảng điểm Seed">
        <div className="atlas-seed-bridge-head">
          <div>
            <span>SEED → ATLAS · DỮ LIỆU CÓ NGUỒN</span>
            <h3>Dùng bảng điểm học sinh đã lưu</h3>
            <p>CLA tự đọc dữ liệu Seed khi bạn đã đăng nhập và biểu mẫu chưa được chỉnh sửa. Chỉ dùng trung bình môn <strong>đầy đủ trong cùng một học kỳ</strong>; không trộn các kỳ, không lấy điểm tạm tính.</p>
          </div>
          <div className="atlas-seed-bridge-controls">
            <label htmlFor="atlas-seed-term">Học kỳ lấy điểm</label>
            <select id="atlas-seed-term" value={seedTermId} onChange={event => setSeedTermId(event.target.value)} disabled={!transcript.data}>
              <option value="auto">Tự chọn học kỳ có tổ hợp đủ điểm gần nhất</option>
              {transcript.data?.terms.slice().reverse().map(term => (
                <option key={`${term.grade}:${term.semester}`} value={`${term.grade}:${term.semester}`}>
                  {({grade10:"Lớp 10",grade11:"Lớp 11",grade12:"Lớp 12"})[term.grade]} · {term.semester === "semester1" ? "Học kỳ I" : "Học kỳ II"}
                </option>
              ))}
            </select>
            <button type="button" disabled={!seedSnapshot || seedSnapshot.completedSubjectCount === 0 || transcript.status !== "ready"}
              onClick={() => { if (seedSnapshot) loadSeedSchoolMarks(seedSnapshot); }}>
              Nạp điểm học bạ từ Seed
            </button>
          </div>
        </div>
        {transcript.status === "loading" && <p role="status">Đang tải bảng điểm Seed…</p>}
        {transcript.status === "signed-out" && <p>Đăng nhập để Atlas đọc bảng điểm của chính bạn.</p>}
        {transcript.status === "empty" && <p>Seed chưa có điểm môn để đồng bộ. Bạn có thể nhập thủ công tại Atlas.</p>}
        {transcript.status === "error" && <p role="alert">Không đọc được bảng điểm Seed. {transcript.error}</p>}
        {seedSnapshot && <p className="atlas-seed-bridge-meta" role="status">
          {seedSnapshot.termLabel}: {seedSnapshot.completedSubjectCount} môn đủ điểm, {seedSnapshot.availableCombinations.length} tổ hợp trong danh mục thử nghiệm.
          {seedSnapshot.skippedPartialSubjects.length > 0 && ` Đã bỏ qua ${seedSnapshot.skippedPartialSubjects.length} môn mới có điểm tạm tính.`}
          {seedSnapshot.unsupportedSubjects.length > 0 && " Môn chưa có mã Atlas được giữ nguyên trong Seed, không tự chuyển đổi."}
        </p>}
        {seedNote && <p className="atlas-seed-bridge-note" role="status">{seedNote} {importedSeedKeys.length > 0 && `Còn ${importedSeedKeys.length} môn lấy trực tiếp từ Seed.`}</p>}
        <p className="atlas-seed-bridge-caution">Đổi loại điểm sẽ xóa các ô điểm Atlas hiện có để tránh trộn học bạ, thi thử và điểm THPT. Nạp lại điểm từ Seed sẽ thay các ô đang nhập. Điểm học bạ chỉ để khám phá tổ hợp, không được dùng làm điểm THPT chính thức.</p>
      </section>

      <p className="atlas-score-input-note">
        Nhập các môn bạn có điểm trên thang 10; <strong>không cần đủ 11 môn</strong>. Điểm 0 là hợp lệ, ô trống nghĩa là chưa có dữ liệu.
        Tổng tổ hợp là phép cộng tham khảo; không phải điểm xét tuyển chính thức, xác suất trúng tuyển hoặc khuyến nghị chọn môn thi.
      </p>
      {hasInvalidScores && <p className="atlas-score-error" role="alert">
        Điểm không hợp lệ: {invalidScoreKeys.map((key) => scoreLabels[key]).join(", ")}. Chỉ nhập số từ 0 đến 10.
      </p>}
      {!validPriority && <p className="atlas-score-error" role="alert">Điểm ưu tiên phải là số từ 0 đến 3. Quy tắc cộng điểm thực tế phụ thuộc phương thức và năm.</p>}
      {validPriority && parsedPriority > 0 && <p className="atlas-score-note" role="status">
        Điểm ưu tiên đang là giả định minh họa. CLA sẽ không phân loại nguyện vọng theo mốc chính thức cho đến khi có công thức ưu tiên được kiểm chứng.
      </p>}

      <div className="atlas-score-grid">

        {(
          Object.keys(
            scoreLabels
          ) as ScoreInputKey[]
        ).map(
          (key) => (
            <label key={key}>

              <span>
                {scoreLabels[key]}
              </span>

              <input
                inputMode="decimal"
                aria-label={`Điểm ${scoreLabels[key]}`}
                aria-invalid={subjectScores[key].trim() !== "" && parseSubjectScore(subjectScores[key]) === undefined}
                placeholder="Chưa có"
                value={
                  subjectScores[
                    key
                  ]
                }
                onChange={(
                  event
                ) =>
                  updateScore(
                    key,
                    event.target
                      .value
                  )
                }
              />

            </label>
          )
        )}

      </div>

      <div className="atlas-engine-toolbar">

        <button
          type="button"
          onClick={
            resetScores
          }
        >
          Xóa điểm đã nhập
        </button>

      </div>

      <section className="atlas-combination-studio" aria-label="Phòng phân tích tổ hợp">
        <div className="atlas-combination-header">
          <div>
            <span>SUBJECT COMBINATION LAB · DEMO TỪ ĐIỂM BẠN NHẬP</span>
            <h3>Khám phá điểm mạnh theo tổ hợp</h3>
            <p>Chọn một thẻ để xem cách tính. Chỉ tổ hợp đủ đúng ba môn mới được xếp hạng; tất cả kết quả cập nhật khi bạn sửa điểm.</p>
          </div>
          <button type="button" onClick={() => setShowAllCombinations(!showAllCombinations)}>
            {showAllCombinations ? "Thu gọn" : "Xem cả 9 tổ hợp"}
          </button>
        </div>
        <div className="atlas-combination-cards">
          {(showAllCombinations ? rankedCombinations : rankedCombinations.slice(0, 3)).map((item) => {
            const complete = item.missingSubjects.length === 0 && !hasInvalidScores;
            const selected = item.combinationCode === focusedCombination?.combinationCode;
            return (
              <button key={item.combinationCode} type="button"
                className={`atlas-combination-card ${complete ? "is-complete" : "is-incomplete"} ${selected ? "is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => setSelectedCombination(item.combinationCode)}>
                <span className="atlas-combination-card-top"><b>{item.combinationCode}</b><small>{complete ? "Đủ dữ liệu" : `Thiếu ${item.missingSubjects.length} môn`}</small></span>
                <strong>{complete ? `${item.rawScore.toFixed(2)}/30` : "Chưa tính"}</strong>
                <span className="atlas-combination-meter"><i style={{ width: `${complete ? (item.rawScore / 30) * 100 : 0}%` }} /></span>
                <span className="atlas-combination-card-bottom">{item.subjects.map((subject) => scoreLabels[subject as ScoreInputKey]).join(" · ")}</span>
              </button>
            );
          })}
        </div>
        {focusedCombination && <div className="atlas-combination-explain" role="status">
          <strong>Vì sao {focusedCombination.combinationCode} có kết quả này?</strong>
          {focusedCombination.missingSubjects.length > 0 || hasInvalidScores ? (
            <p>Còn thiếu hoặc sai: {focusedCombination.missingSubjects.map((subject) => scoreLabels[subject as ScoreInputKey]).join(", ") || "Điểm cần kiểm tra"}. CLA không thay điểm chưa có thành 0 để xếp hạng.</p>
          ) : (
            <p>{focusedCombination.subjects.map((subject) => `${scoreLabels[subject as ScoreInputKey]} ${scoreMap[subject]}`).join(" + ")} = <b>{focusedCombination.rawScore.toFixed(2)}/30</b>. Đây là tổng học thuật tham khảo của {scoreBasis === "school" ? "điểm học bạ" : scoreBasis === "practice" ? "điểm thi thử/tự đánh giá" : "điểm THPT do người dùng khai báo"}; tính hợp lệ đối với ngành/trường phải đối chiếu đề án chính thức.</p>
          )}
        </div>}
        <p className="atlas-combination-limitation">9 tổ hợp hiện là danh mục hỗ trợ thử nghiệm, <b>chưa phải toàn bộ tổ hợp theo chương trình mới</b>. Các môn GDKT & Pháp luật, Tin học, Công nghệ đã cho phép nhập nhưng sẽ chỉ được xếp tổ hợp sau khi có quy tắc và nguồn kiểm chứng.</p>
      </section>

      <section className="atlas-exam-choice" aria-label="Subject Optimizer 2026">
        <div className="atlas-exam-choice-head">
          <div>
            <span>SUBJECT OPTIMIZER · KỲ THI 2026</span>
            <h3>Hai môn tự chọn, nhiều con đường</h3>
            <p>Toán và Ngữ văn là hai môn bắt buộc. Hãy <b>xác nhận các môn bạn thực sự được học ở lớp 12</b>; CLA sẽ thử các cặp môn phù hợp và cho thấy tổ hợp có thể hình thành trong danh mục đang hỗ trợ.</p>
          </div>
          <div className="atlas-exam-choice-counter"><strong>{examChoiceReport.options.length}</strong><span>phương án từ môn đã xác nhận</span></div>
        </div>
        <div className="atlas-exam-choice-confirm">
          <p><b>Bước 1 · Xác nhận môn học lớp 12</b> (chỉ chọn môn đã học; không suy từ điểm số)</p>
          <div className="atlas-exam-choice-subjects">
            {EXAM_ELECTIVES_2026.map(item => (
              <label key={item.code} className={confirmedGrade12Subjects.includes(item.code) ? "is-on" : ""}>
                <input type="checkbox" checked={confirmedGrade12Subjects.includes(item.code)}
                  onChange={() => toggleConfirmedExamSubject(item.code)} />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
          <div className="atlas-exam-choice-hints">
            <span>{confirmedGrade12Subjects.length} môn đã xác nhận</span>
            {seedSuggestedElectives.length > 0 && <><span>Seed gợi ý: {seedSuggestedElectives.map(code => EXAM_ELECTIVES_2026.find(x => x.code === code)?.label).join(", ")}</span><button type="button" onClick={() => {
              setConfirmedGrade12Subjects(seedSuggestedElectives);
              setSelectedExamPairId("");
            }}>Tôi xác nhận các môn gợi ý từ hồ sơ Seed thuộc lớp 12</button></>}
          </div>
          <small>Hồ sơ Seed không ghi rõ việc học từng môn trong từng năm. Chỉ dùng nút xác nhận nếu danh sách khớp đúng môn đã học lớp 12. Quy định Ngoại ngữ khác môn đã học có ngoại lệ; phiên bản này chưa đánh giá các ngoại ngữ ngoài tiếng Anh. Hai định hướng Công nghệ cần được xác nhận riêng, không sử dụng điểm Công nghệ chung để quy đổi.</small>
        </div>
        <div className="atlas-exam-choice-results">
          <div className="atlas-exam-choice-title"><b>Bước 2 · Khám phá hai môn thi tự chọn</b><span>Ưu tiên: chương trình có nguồn duyệt → độ phủ 9 tổ hợp → điểm quan sát</span></div>
          {examChoiceReport.status === "NEED_COURSE_CONFIRMATION" ? (
            <p className="atlas-exam-choice-empty" role="status">Chọn ít nhất hai môn bạn đã học ở lớp 12 để xem các cặp môn thi khả dụng.</p>
          ) : (
            <div className="atlas-exam-choice-cards">
              {(showAllExamOptions ? examChoiceReport.options : examChoiceReport.options.slice(0, 8)).map((option, index) => <button
                className={`atlas-exam-choice-card ${selectedExamPairId === option.id ? "is-picked" : ""}`}
                key={option.id} type="button" onClick={() => setSelectedExamPairId(option.id)}
                aria-pressed={selectedExamPairId === option.id}>
                  <span className="atlas-exam-choice-number">PHƯƠNG ÁN {String(index + 1).padStart(2, "0")}</span>
                  <strong>{option.labels.join(" + ")}</strong>
                  <span>{option.exploratoryCombinations.length > 0
                    ? `Hình thành ${option.exploratoryCombinations.join(", ")} trong danh mục 9 tổ hợp`
                    : "Chưa có tổ hợp trong danh mục thử nghiệm"}</span>
                  <span className="atlas-exam-choice-meter"><i style={{width:`${option.exploratoryCombinations.length / 9 * 100}%`}} /></span>
                  <small>{option.electiveScoreSum !== null
                    ? `Tổng hai môn tự chọn theo điểm đang nhập: ${option.electiveScoreSum.toFixed(2)}/20`
                    : "Chưa đủ hai điểm quan sát cùng nguồn"}</small>
                  <small>{option.sourceVerifiedMatches.length ? `${option.sourceVerifiedMatches.length} chương trình trong kho Atlas có nguồn duyệt` : "Kho Atlas cá nhân chưa có chương trình nguồn duyệt"}</small>
                  <small className="atlas-ptit-count">{publishedPtitByPair.get(option.id)?.matches.length
                    ? `PTIT BVH 2026: ${publishedPtitByPair.get(option.id)?.matches.length} chương trình khớp tổ hợp đã công bố`
                    : "PTIT BVH 2026: chưa có chương trình khớp trong tập nguồn"}</small>
                </button>)}
            </div>
          )}
          {examChoiceReport.options.length > 8 && <button className="atlas-exam-choice-more" type="button" onClick={() => setShowAllExamOptions(!showAllExamOptions)}>
            {showAllExamOptions ? "Thu gọn về 8 phương án" : `Xem tất cả ${examChoiceReport.options.length} phương án`}
          </button>}
          {selectedExamPairId && (() => {
            const chosen = examChoiceReport.options.find(item => item.id === selectedExamPairId);
            if (!chosen) return null;
            return <div className="atlas-exam-choice-selected" role="status">
              <b>Phương án đang xem: {chosen.labels.join(" + ")}</b>
              <p>Hai môn bắt buộc vẫn là Toán và Ngữ văn. Các tổ hợp từ danh mục tham khảo: {chosen.exploratoryCombinations.join(", ") || "chưa có"}.</p>
              {chosen.completedCombinations.length > 0 && <p>Tổng điểm đủ ba môn theo nguồn hiện tại: {chosen.completedCombinations.map(item => `${item.code} ${item.score.toFixed(2)}/30`).join(" · ")}.</p>}
              {chosen.limitations.map(note => <p key={note}>{note}</p>)}
              <p>Đây là lựa chọn đang khám phá, không phải đăng ký môn thi hay nguyện vọng chính thức.</p>
            </div>;
          })()}
        </div>
        {selectedPtitPublished && <section className="atlas-official-pathways" aria-label="Đối chiếu chương trình PTIT 2026 theo môn thi">
          <div className="atlas-official-pathways-head">
            <div>
              <span>ATLAS · OFFICIAL PATHWAY MATCH</span>
              <h4>Từ hai môn thi đến chương trình có nguồn</h4>
              <p>Đối chiếu thí điểm <b>PTIT · cơ sở Hà Nội BVH · tuyển sinh 2026 · phương thức THPT</b>. Đây là 10 chương trình trong tập dữ liệu đã đối chiếu, <b>không phải toàn bộ trường/ngành Việt Nam</b>.</p>
            </div>
            <div className="atlas-official-pathways-stats"><strong>{selectedPtitPublished.matches.length}</strong><small>chương trình khớp cặp môn</small></div>
          </div>
          <div className="atlas-official-pathways-tags">
            {selectedPtitPublished.supportedCombinations.length > 0
              ? selectedPtitPublished.supportedCombinations.map(code => <span key={code}>{code} · Đề án PTIT 2026</span>)
              : <span>Không có tổ hợp trùng trong tập PTIT BVH đang đối chiếu</span>}
          </div>
          {selectedPtitPublished.matches.length ? <div className="atlas-official-pathways-list">
            {selectedPtitPublished.matches.map(match => <article className={`atlas-official-pathway-card ${match.matchesTarget ? "is-target" : ""}`} key={match.programId}>
              <div className="atlas-official-pathway-main">
                <small>{match.matchesTarget ? "Khớp từ khóa ngành mục tiêu · " : "Chương trình trong tập nguồn · "}Mã ngành {match.majorCode} · {match.campus}</small>
                <strong>{match.majorName}</strong>
                <p>{match.combinations.map(combo => `${combo.code}: ${combo.observedScore === null ? "chưa đủ điểm quan sát" : `${combo.observedScore.toFixed(2)}/30 (điểm ${scoreBasis === "school" ? "học bạ" : scoreBasis === "practice" ? "thi thử/tự đánh giá" : "THPT tự khai báo"})`}`).join(" · ")}</p>
              </div>
              <a href={match.officialSource} target="_blank" rel="noopener noreferrer">Xem đề án PTIT 2026 ↗</a>
            </article>)}
          </div> : <p className="atlas-official-pathways-empty">Không tìm thấy tổ hợp phù hợp trong <b>tập PTIT BVH được đối chiếu</b>. Điều này không có nghĩa các trường khác không nhận tổ hợp này.</p>}
          {targetMajor.trim() && selectedPtitPublished.matches.length > 0 && selectedPtitPublished.targetMatches === 0 &&
            <p className="atlas-official-pathways-empty">Chưa có chương trình khớp tên ngành mục tiêu bạn nhập trong tập PTIT này. Các chương trình khác được giữ để bạn tham khảo, không tự coi là phù hợp ngành.</p>}
          <p className="atlas-official-pathways-disclaimer"><b>Giới hạn bằng chứng:</b> đối chiếu tổ hợp do trường công bố, không xác nhận hồ sơ đã đủ điều kiện, không đối chiếu điểm chuẩn, không dự báo trúng tuyển. Điểm học bạ/thi thử chỉ là tổng tham khảo; điểm THPT nếu có vẫn do người dùng tự khai báo. Nguồn được kiểm tra trong CLA ngày 08/11/2026. Không dùng danh mục này để kết luận trúng tuyển hay tự sắp xếp nguyện vọng.</p>
          <a className="atlas-official-pathways-source" href="https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/" target="_blank" rel="noopener noreferrer">Mở văn bản tuyển sinh gốc của PTIT (2026) ↗</a>
        </section>}
        <AtlasAspirationDraftEditor matches={selectedPtitPublished?.matches ?? []} />
        <p className="atlas-exam-choice-source"><b>Nguồn chính sách:</b> <a href={EXAM_POLICY_2026.policySource} target="_blank" rel="noreferrer">{EXAM_POLICY_2026.reference}</a>. Tổ hợp được hiển thị là danh mục mẫu của CLA; tổ hợp trường chấp nhận phải kiểm tra đề án tuyển sinh từng năm.</p>
        {examChoiceReport.warnings.filter(message => !message.startsWith("Điểm học bạ/")).map(warning => <p className="atlas-exam-choice-warning" key={warning}>{warning}</p>)}
      </section>

      {!engineResult ? (
        <div className="atlas-empty-state">

          <strong>
            Chưa thể xếp nguyện vọng có căn cứ
          </strong>

          <p>
            {completeCombinations.length === 0
              ? "Hãy nhập đủ ba môn của ít nhất một tổ hợp được hỗ trợ. Bạn có thể khám phá các tổ hợp phía trên mà không cần nhập tất cả môn."
              : scoreBasis !== "official_thpt_2026"
                ? "Hiện bạn đang dùng điểm thi thử hoặc học bạ: có thể khám phá tổ hợp, nhưng không thể so sánh trực tiếp với mốc điểm chuẩn THPT 2026."
                : hasInvalidScores || !validPriority || parsedPriority > 0
                  ? "Cần sửa điểm không hợp lệ hoặc bỏ điểm ưu tiên giả định trước khi đối chiếu mốc tham chiếu."
                  : "Atlas chưa có chương trình đủ nguồn điểm chuẩn THPT 2026 và phương thức để xếp nhóm nguyện vọng. Xin kiểm tra thông báo chính thức của trường."}
          </p>

        </div>
      ) : (
        <>

          <div className="atlas-engine-summary">

            <strong>
              {
                engineResult.summary
              }
            </strong>

            <div>

              <span>
                An toàn:{" "}
                {
                  engineResult
                    .safeSchools
                    .length
                }
              </span>

              <span>
                Vừa sức:{" "}
                {
                  engineResult
                    .targetSchools
                    .length
                }
              </span>

              <span>
                Bứt phá:{" "}
                {
                  engineResult
                    .reachSchools
                    .length
                }
              </span>

            </div>

          </div>

          {engineResult
            .aspirationPlan
            .items
            .length > 0 ? (

            <div className="atlas-aspiration-list">

              {engineResult
                .aspirationPlan
                .items
                .map(
                  (item) => (
                    <article
                      className="atlas-aspiration-card"
                      key={
                        item.programId
                      }
                    >

                      <div>

                        <span>
                          NV
                          {
                            item.order
                          }
                        </span>

                        <h3>
                          {
                            item.majorName
                          }
                        </h3>
                        {item.isPedagogy && (
                          <p>Chương trình đào tạo giáo viên · chỉ xét tuyển NV1–NV5</p>
                        )}

                        <p>
                          {
                            item.universityName
                          }
                        </p>

                      </div>

                      <div className="atlas-aspiration-meta">

                        <strong>
                          {
                            getRiskLabel(
                              item.riskLevel
                            )
                          }
                        </strong>

                        <span>
                          {
                            item.bestMethodLabel
                          }
                        </span>

                        <span>
                          {
                            item.normalizedScore.toFixed(
                              1
                            )
                          }
                          /100
                        </span>

                      </div>

                      <p>
                        {
                          item.reason
                        }
                      </p>

                      {benchmarkByProgram.get(item.programId) && (
                        <p>
                          Mốc tham chiếu THPT năm {benchmarkByProgram.get(item.programId)?.year}: {benchmarkByProgram.get(item.programId)?.value}/30. {" "}
                          <a
                            href={benchmarkByProgram.get(item.programId)?.sourceUrls[0]}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Xem nguồn điểm chuẩn
                          </a>
                          {" "}— Cần tự kiểm tra công bố và quy tắc quy đổi của trường.
                        </p>
                      )}

                    </article>
                  )
                )}

            </div>

          ) : (

            <div className="atlas-empty-state">

              <strong>
                Chưa tạo được nguyện
                vọng phù hợp
              </strong>

              <p>
                Chưa có chương trình kèm điểm chuẩn và phương thức đủ căn cứ để xếp nguyện vọng.
                Hãy tra đề án tuyển sinh chính thức; không thể suy ra mức an toàn chỉ từ điểm học sinh.
              </p>

            </div>

          )}

          {engineResult
            .warnings
            .length > 0 && (

            <div className="atlas-draft-warnings">

              <strong>
                Lưu ý từ Admission Engine
              </strong>

              <ul>

                {[...engineResult.aspirationPlan.warnings,
                  ...engineResult.warnings.filter((warning) =>
                    !engineResult.aspirationPlan.warnings.includes(warning)
                  )]
                  .slice(0, 8)
                  .map(
                    (warning) => (
                      <li
                        key={
                          warning
                        }
                      >
                        {
                          warning
                        }
                      </li>
                    )
                  )}

              </ul>

            </div>

          )}

        </>
      )}

    </section>
  );
}