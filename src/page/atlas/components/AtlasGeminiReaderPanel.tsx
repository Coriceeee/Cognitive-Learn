import { useState } from "react";
import {
  extractAdmissionData,
  type GeminiAdmissionDraft,
} from "../../../lib/geminiAdmissionClient";

type AtlasGeminiReaderPanelProps = {
  onAddGeminiDraft: (draft: GeminiAdmissionDraft) => void;
};

function getValue(value?: string | number) {
  if (value === undefined || value === null || value === "") {
    return "Chưa có dữ liệu";
  }

  return String(value);
}

function getArrayText(values?: string[]) {
  if (!Array.isArray(values) || values.length === 0) {
    return "Chưa có dữ liệu";
  }

  return values.join(", ");
}

export default function AtlasGeminiReaderPanel({
  onAddGeminiDraft,
}: AtlasGeminiReaderPanelProps) {
  const [universityName, setUniversityName] = useState("");
  const [draft, setDraft] = useState<GeminiAdmissionDraft | null>(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleExtract() {
    const input = universityName.trim();

    if (!input) {
      setMessage("Nhập tên trường hoặc viết tắt trước đã.");
      return;
    }

    setLoading(true);
    setMessage("");
    setDraft(null);
    setRawText("");

    try {
      const result = await extractAdmissionData({
        universityName: input,
        sourceYear: new Date().getFullYear(),
      });

      if (!result.draft) {
        setMessage("Gemini chưa trả về dữ liệu tuyển sinh.");
        return;
      }

      setDraft(result.draft);
      setRawText(result.rawText || "");

      setMessage(
        result.usedSearch
          ? "Đã lấy dữ liệu bằng Gemini Search. Kiểm tra link nguồn bên dưới."
          : "Đã lấy dữ liệu bằng Gemini. Nếu thiếu link nguồn, hãy thử lại hoặc đổi model có hỗ trợ search."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  function handleSaveToAtlas() {
    if (!draft) return;

    onAddGeminiDraft(draft);
    setMessage("Đã lưu dữ liệu vào Atlas Knowledge Base.");
  }

  return (
    <section className="atlas-gemini-panel compact">
      <span>GEMINI ADMISSION READER</span>
      <h2>Tìm dữ liệu tuyển sinh bằng AI</h2>
      <p>
        Nhập tên trường hoặc viết tắt như CTU, HCMUT, HUST, NEU. Gemini sẽ cố
        gắng trả về ngành, mã ngành, tổ hợp, phương thức, học phí, học bổng và
        link nguồn để Atlas sử dụng.
      </p>

      <div className="atlas-gemini-search">
        <input
          value={universityName}
          onChange={(event) => setUniversityName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void handleExtract();
            }
          }}
          placeholder="Ví dụ: ctu, hcmut, bách khoa hcm, neu, ftu"
        />

        <button type="button" onClick={handleExtract} disabled={loading}>
          {loading ? "Đang tìm..." : "Tìm bằng Gemini"}
        </button>
      </div>

      {message && (
        <div
          className={`atlas-message ${
            message.toLowerCase().includes("lỗi") ||
            message.toLowerCase().includes("quota") ||
            message.toLowerCase().includes("không")
              ? "error"
              : ""
          }`}
        >
          {message}
        </div>
      )}

      {draft && (
        <article className="atlas-draft-card">
          <div className="atlas-draft-head">
            <div>
              <span>AI RESULT</span>
              <h3>{getValue(draft.universityName)}</h3>
            </div>

            <strong className="atlas-confidence">
              {Number(draft.confidence) || 0}% tin cậy
            </strong>
          </div>

          <div className="atlas-draft-grid">
            <div>
              <span>Năm dữ liệu</span>
              <strong>{getValue(draft.sourceYear)}</strong>
            </div>

            <div>
              <span>Số ngành</span>
              <strong>{draft.programs?.length || 0}</strong>
            </div>

            <div>
              <span>Nguồn</span>
              <strong>{draft.sourceUrl ? "Có link" : "Thiếu link"}</strong>
            </div>
          </div>

          <div className="atlas-draft-source">
            <div>
              <span>Link nguồn tuyển sinh</span>
              <strong>{draft.sourceTitle || "Nguồn do Gemini đề xuất"}</strong>
            </div>

            {draft.sourceUrl ? (
              <a href={draft.sourceUrl} target="_blank" rel="noreferrer">
                Mở nguồn tuyển sinh
              </a>
            ) : (
              <span>Gemini chưa trả link nguồn</span>
            )}
          </div>

          {draft.warnings && draft.warnings.length > 0 && (
            <div className="atlas-draft-warnings">
              <strong>Cảnh báo dữ liệu</strong>
              <ul>
                {draft.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="atlas-draft-programs">
            <h4>Ngành Gemini trả về</h4>

            {draft.programs && draft.programs.length > 0 ? (
              <div className="atlas-draft-program-list">
                {draft.programs.map((program, index) => (
                  <div
                    className="atlas-draft-program"
                    key={`${program.majorName}-${index}`}
                  >
                    <strong>{getValue(program.majorName)}</strong>
                    <p>Mã ngành: {getValue(program.majorCode)}</p>
                    <p>Tổ hợp: {getArrayText(program.combinations)}</p>
                    <p>Phương thức: {getArrayText(program.methods)}</p>
                    <p>Học phí: {getValue(program.tuitionLabel)}</p>
                    <p>Học bổng: {getValue(program.scholarshipLabel)}</p>
                    {program.notes && <p>Ghi chú: {program.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="atlas-empty-line">
                Gemini chưa trả về ngành đủ rõ. Hãy thử nhập tên trường đầy đủ
                hơn.
              </p>
            )}
          </div>

          <div className="atlas-draft-actions">
            <button type="button" onClick={handleSaveToAtlas}>
              Lưu vào Atlas Knowledge Base
            </button>

            {rawText && (
              <details>
                <summary>Xem JSON Gemini trả về</summary>
                <pre>{rawText}</pre>
              </details>
            )}
          </div>
        </article>
      )}
    </section>
  );
}