import { useMemo, useState } from "react";
import { runAdmissionEngine } from "../../../lib/admissionEngine";
import {
  getRiskLabel,
  type AdmissionProgramRule,
} from "../../../lib/admissionRules";
import type { AdmissionMethod, SubjectScoreMap } from "../../../lib/admissionTypes";
import { buildScoreConversionReport } from "../../../lib/scoreConversionEngine";
import type {
  AtlasProgram,
  AtlasUniversity,
} from "../../../lib/atlasKnowledgeBase";

type AtlasAdmissionEnginePanelProps = {
  programs: AtlasProgram[];
  universityMap: Record<string, AtlasUniversity>;
};

type ScoreInputKey =
  | "math"
  | "literature"
  | "english"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography";

const defaultSubjectScores: Record<ScoreInputKey, string> = {
  math: "8",
  literature: "7",
  english: "8",
  physics: "7.5",
  chemistry: "7.5",
  biology: "7",
  history: "7",
  geography: "7",
};

const scoreLabels: Record<ScoreInputKey, string> = {
  math: "Toán",
  literature: "Văn",
  english: "Anh",
  physics: "Lý",
  chemistry: "Hóa",
  biology: "Sinh",
  history: "Sử",
  geography: "Địa",
};

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed)) return 0;

  return Math.min(10, Math.max(0, parsed));
}

function getProgramBenchmark(program: AtlasProgram) {
  const majorName = program.majorName.toLowerCase();

  if (majorName.includes("công nghệ thông tin")) return 24;
  if (majorName.includes("khoa học máy tính")) return 27;
  if (majorName.includes("sư phạm")) return 25;
  if (majorName.includes("quản trị")) return 23;
  if (majorName.includes("kinh tế")) return 23.5;

  return undefined;
}

function toAdmissionPrograms(
  programs: AtlasProgram[],
  universityMap: Record<string, AtlasUniversity>
): AdmissionProgramRule[] {
  return programs.map((program) => {
    const university = universityMap[program.universityId];
    const normalizedMajorName = program.majorName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

    return {
      id: program.id,
      universityName: university?.name || "Trường chưa xác định",
      majorName: program.majorName,
      majorCode: program.majorCode,
      combinations: program.combinations,
      methods: program.methods as AdmissionMethod[],
      benchmarkScore: getProgramBenchmark(program),
      sourceYear: program.sourceYear,
      verified: program.status === "verified",
      tuitionLabel: program.tuitionLabel,
      scholarshipLabel: program.scholarshipLabel,
      isPedagogy:
        normalizedMajorName.includes("su pham") ||
        normalizedMajorName.includes("sư phạm"),
    };
  });
}

function getEngineStatus(programs: AtlasProgram[]) {
  if (programs.length === 0) {
    return {
      label: "Chưa có dữ liệu Atlas",
      className: "empty",
    };
  }

  const verifiedCount = programs.filter(
    (program) => program.status === "verified"
  ).length;

  if (verifiedCount > 0) {
    return {
      label: "Sẵn sàng chạy",
      className: "ready",
    };
  }

  return {
    label: "Dữ liệu nháp",
    className: "draft",
  };
}

export default function AtlasAdmissionEnginePanel({
  programs,
  universityMap,
}: AtlasAdmissionEnginePanelProps) {
  const [targetMajor, setTargetMajor] = useState("");
  const [priorityScore, setPriorityScore] = useState("0");
  const [subjectScores, setSubjectScores] =
    useState<Record<ScoreInputKey, string>>(defaultSubjectScores);

  const engineStatus = getEngineStatus(programs);

  const scoreMap: SubjectScoreMap = useMemo(
    () => ({
      math: toNumber(subjectScores.math),
      literature: toNumber(subjectScores.literature),
      english: toNumber(subjectScores.english),
      physics: toNumber(subjectScores.physics),
      chemistry: toNumber(subjectScores.chemistry),
      biology: toNumber(subjectScores.biology),
      history: toNumber(subjectScores.history),
      geography: toNumber(subjectScores.geography),
    }),
    [subjectScores]
  );

  const scoreReport = useMemo(() => {
    return buildScoreConversionReport({
      subjectScores: scoreMap,
      combinationCodes: [
        "A00",
        "A01",
        "A02",
        "B00",
        "C00",
        "C01",
        "D01",
        "D07",
        "D08",
      ],
      priorityScore: Number(priorityScore.replace(",", ".")) || 0,
    });
  }, [scoreMap, priorityScore]);

  const engineResult = useMemo(() => {
    if (programs.length === 0) return null;

    return runAdmissionEngine({
      scoreReport,
      programs: toAdmissionPrograms(programs, universityMap),
      targetMajor: targetMajor.trim(),
      maxAspirations: 15,
    });
  }, [programs, universityMap, scoreReport, targetMajor]);

  function updateScore(key: ScoreInputKey, value: string) {
    setSubjectScores((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetScores() {
    setSubjectScores(defaultSubjectScores);
    setPriorityScore("0");
    setTargetMajor("");
  }

  return (
    <section className="atlas-engine-panel">
      <div className="atlas-engine-head">
        <div>
          <span>ADMISSION ENGINE</span>
          <h2>Gợi ý tuyển sinh từ Atlas Engine</h2>
          <p>
            Engine dùng dữ liệu ngành trong Atlas Knowledge Base và điểm học
            sinh để xếp nhóm an toàn, vừa sức, bứt phá. Phần điểm hiện là chế độ
            mô phỏng nhanh; sau này sẽ tự lấy từ Seed Profile.
          </p>
        </div>

        <strong className={`atlas-engine-status ${engineStatus.className}`}>
          {engineStatus.label}
        </strong>
      </div>

      <div className="atlas-score-summary">
        <div>
          <span>Phương án tốt nhất</span>
          <strong>{scoreReport.bestOption?.label || "Chưa có"}</strong>
        </div>

        <div>
          <span>Điểm chuẩn hóa</span>
          <strong>
            {scoreReport.bestOption
              ? `${scoreReport.bestOption.normalizedScore.toFixed(1)}/100`
              : "0/100"}
          </strong>
        </div>

        <div>
          <span>Số ngành Atlas</span>
          <strong>{programs.length}</strong>
        </div>
      </div>

      <div className="atlas-engine-form">
        <label>
          <span>Ngành mục tiêu</span>
          <input
            value={targetMajor}
            onChange={(event) => setTargetMajor(event.target.value)}
            placeholder="Ví dụ: Công nghệ thông tin"
          />
        </label>

        <label>
          <span>Điểm ưu tiên</span>
          <input
            value={priorityScore}
            onChange={(event) => setPriorityScore(event.target.value)}
            placeholder="Ví dụ: 0.75"
          />
        </label>
      </div>

      <div className="atlas-score-grid">
        {(Object.keys(scoreLabels) as ScoreInputKey[]).map((key) => (
          <label key={key}>
            <span>{scoreLabels[key]}</span>
            <input
              value={subjectScores[key]}
              onChange={(event) => updateScore(key, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="atlas-engine-toolbar">
        <button type="button" onClick={resetScores}>
          Reset điểm mô phỏng
        </button>
      </div>

      {!engineResult ? (
        <div className="atlas-empty-state">
          <strong>Chưa có dữ liệu để chạy Admission Engine</strong>
          <p>
            Hãy dùng Gemini Admission Reader để lấy ngành tuyển sinh trước, sau
            đó engine sẽ tự tạo danh sách gợi ý.
          </p>
        </div>
      ) : (
        <>
          <div className="atlas-engine-summary">
            <strong>{engineResult.summary}</strong>

            <div>
              <span>An toàn: {engineResult.safeSchools.length}</span>
              <span>Vừa sức: {engineResult.targetSchools.length}</span>
              <span>Bứt phá: {engineResult.reachSchools.length}</span>
            </div>
          </div>

          {engineResult.aspirationPlan.items.length > 0 ? (
            <div className="atlas-aspiration-list">
              {engineResult.aspirationPlan.items.map((item) => (
                <article className="atlas-aspiration-card" key={item.programId}>
                  <div>
                    <span>NV{item.order}</span>
                    <h3>{item.majorName}</h3>
                    <p>{item.universityName}</p>
                  </div>

                  <div className="atlas-aspiration-meta">
                    <strong>{getRiskLabel(item.riskLevel)}</strong>
                    <span>{item.bestMethodLabel}</span>
                    <span>{item.normalizedScore.toFixed(1)}/100</span>
                  </div>

                  <p>{item.reason}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="atlas-empty-state">
              <strong>Chưa tạo được nguyện vọng phù hợp</strong>
              <p>
                Thử tăng điểm mô phỏng, nhập ngành mục tiêu rõ hơn hoặc lấy thêm
                dữ liệu ngành từ Gemini.
              </p>
            </div>
          )}

          {engineResult.warnings.length > 0 && (
            <div className="atlas-draft-warnings">
              <strong>Lưu ý từ Admission Engine</strong>
              <ul>
                {engineResult.warnings.slice(0, 8).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
} 