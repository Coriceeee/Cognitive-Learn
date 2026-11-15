import { useEffect, useMemo, useState } from "react";
import { analyzeJourney, type JourneyScenarioId, type JourneySubject } from "../../lib/closedLoopJourney";
import { useClosedLoopJourney } from "../../lib/useClosedLoopJourney";
import { evaluateShadowPolicies, replayShadowEvidence } from "../../lib/journeyShadowPolicy";
import "./closed-loop.css";

type OrionPlan = {
  targetMajor: string;
  weeksLeft: number;
  subjects: JourneySubject[];
  scenarios: Array<{ id: string; title: string; weeklyHours: number }>;
};
type Props = { mode: "orion" | "pulse" | "lumen"; plan?: OrionPlan };
const stageText: Record<string, string> = {
  NOT_STARTED: "Chưa bắt đầu", CHECK_IN: "Đợi check-in", READY_TO_REASSESS: "Đủ điều kiện đánh giá lại", REVIEWED: "Đã tổng kết",
};
const safeNumber = (raw: string, min: number, max: number, integer = false): number | null => {
  if (!raw.trim()) return null;
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)) ? value : null;
};

export default function ClosedLoopPanel({ mode, plan }: Props) {
  const journey = useClosedLoopJourney();
  const [scenarioId, setScenarioId] = useState<JourneyScenarioId>("balanced");
  const [week, setWeek] = useState("1");
  const [hours, setHours] = useState("");
  const [completed, setCompleted] = useState("");
  const [planned, setPlanned] = useState("3");
  const [checkNote, setCheckNote] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [reviewNote, setReviewNote] = useState("");
  const [notice, setNotice] = useState("");

  const active = journey.current;
  const latest = active ?? journey.latest;
  const analysis = useMemo(() => analyzeJourney(latest), [latest]);
  const shadow = useMemo(() => latest ? evaluateShadowPolicies(latest) : null, [latest]);
  const selectedScenario = plan?.scenarios.find(s => s.id === scenarioId);
  const canWrite = !journey.busy && (journey.status === "ready" || journey.status === "empty");
  const nextWeek = active ? Array.from({length: active.weeksLeft}, (_, i) => i + 1)
    .find(n => !active.checkIns.some(c => c.week === n)) : null;
  useEffect(() => {
    if (nextWeek !== null && nextWeek !== undefined) setWeek(String(nextWeek));
  }, [active?.id, active?.checkIns.length]);

  async function perform(action: () => Promise<void>, success: string) {
    setNotice("");
    try { await action(); setNotice(success); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Không thể lưu thay đổi."); }
  }
  const submitStart = () => {
    if (!plan || !selectedScenario) return;
    void perform(() => journey.start({scenarioId, scenarioTitle: selectedScenario.title,
      targetMajor: plan.targetMajor, weeksLeft: plan.weeksLeft, plannedWeeklyHours: selectedScenario.weeklyHours,
      subjects: plan.subjects }), "Đã tạo chu kỳ. Mở Pulse để ghi nhận hành động thực tế.");
  };
  const submitCheckIn = () => {
    if (!active) return;
    const parsedWeek = safeNumber(week, 1, active.weeksLeft, true);
    const actual = safeNumber(hours, 0, 168);
    const done = safeNumber(completed, 0, 20, true);
    const total = safeNumber(planned, 1, 20, true);
    if (parsedWeek === null || actual === null || done === null || total === null || done > total) {
      setNotice("Kiểm tra tuần, giờ học 0–168 và số nhiệm vụ hoàn thành không vượt số dự kiến."); return;
    }
    void perform(async () => {
      await journey.checkIn(active.id, { week: parsedWeek, actualHours: actual,
        completedActions: done, plannedActions: total, note: checkNote });
      setHours(""); setCompleted(""); setCheckNote("");
      const next = Array.from({length: active.weeksLeft}, (_, i) => i + 1)
        .find(n => n !== parsedWeek && !active.checkIns.some(c => c.week === n));
      if (next) setWeek(String(next));
    }, "Đã lưu check-in dạng tự báo cáo.");
  };
  const submitReassessment = () => {
    if (!active) return;
    const observations: Array<{key:string;score:number}> = [];
    for (const subject of active.subjects) {
      const raw = scores[subject.key] ?? "";
      if (!raw.trim()) continue;
      const value = safeNumber(raw, 0, 10);
      if (value === null) { setNotice(`Điểm đo lại môn ${subject.label} không hợp lệ (0–10).`); return; }
      observations.push({key: subject.key, score: value});
    }
    if (observations.length === 0) { setNotice("Cần nhập điểm đo lại của ít nhất một môn; số 0 là điểm hợp lệ."); return; }
    void perform(() => journey.reassess(active.id, {observations, note: reviewNote}),
      "Đã tổng kết chu kỳ bằng dữ liệu tự báo cáo. Mở Lumen để xem đánh giá diễn tiến.");
  };

  return <section id="cla-closed-loop" className="cla-journey" aria-labelledby={`cla-journey-title-${mode}`}>
    <div className="cla-journey__head">
      <div>
        <span className="cla-journey__eyebrow">CLA · CLOSED-LOOP JOURNEY V1</span>
        <h2 id={`cla-journey-title-${mode}`}>Khuyến nghị → hành động → đánh giá lại</h2>
        <p>Chu kỳ gắn với tài khoản học sinh. Điểm và giờ học nhập ở đây là <strong>tự báo cáo</strong>, không phải bằng chứng tác động nhân quả hay dự báo xác suất.</p>
      </div>
      <span className="cla-journey__state">{stageText[analysis.stage]}</span>
    </div>

    {journey.status === "loading" && <p role="status">Đang đọc hồ sơ chu kỳ trên Firestore…</p>}
    {journey.status === "signed-out" && <p role="status">Đăng nhập tài khoản học sinh để sử dụng chu kỳ.</p>}
    {journey.status === "error" && <p role="alert">{journey.error}</p>}
    {journey.error && journey.status !== "error" && <p role="alert">{journey.error}</p>}
    {notice && <p role="status" className="cla-journey__notice">{notice}</p>}

    {mode === "orion" && <div className="cla-journey__card">
      <h3>1. Chốt chiến lược trong Orion</h3>
      {active ? <p>Đang có chu kỳ <strong>{active.scenarioTitle}</strong>. Hãy ghi tiến độ và đo lại tại <a href="/pulse#cla-closed-loop">Pulse</a> trước khi tạo chu kỳ khác.</p>
        : !plan || !plan.subjects.length ? <p>Điền điểm hiện tại, mục tiêu và số tuần hợp lệ ở Orion để bắt đầu.</p>
        : <><p>Chụp một bản giá trị đầu vào hiện tại làm mốc so sánh. Không tự đồng bộ lại khi sửa bản nháp Orion.</p>
          <label>Chiến lược
            <select value={scenarioId} onChange={e => setScenarioId(e.target.value as JourneyScenarioId)}>
              {plan.scenarios.map(s => <option key={s.id} value={s.id}>{s.title} · {s.weeklyHours} giờ/tuần</option>)}
            </select>
          </label>
          <button type="button" disabled={!canWrite || !selectedScenario} onClick={submitStart}>
            {journey.busy ? "Đang tạo…" : "Bắt đầu chu kỳ hành động"}
          </button>
        </>}
    </div>}

    {latest && <div className="cla-journey__card">
      <div className="cla-journey__split"><h3>Chu kỳ {latest.status === "ACTIVE" ? "đang thực hiện" : "đã tổng kết"}</h3>
        <span>{latest.scenarioTitle}</span></div>
      <p>Khởi tạo: {new Date(latest.startedAt).toLocaleDateString("vi-VN")} · {latest.weeksLeft} tuần · dự kiến {latest.plannedWeeklyHours} giờ/tuần</p>
      <div className="cla-journey__metrics">
        <div><span>Check-in</span><strong>{latest.checkIns.length}</strong></div>
        <div><span>Giờ học tự báo cáo</span><strong>{analysis.totalHoursReported}</strong></div>
        <div><span>Hoàn thành hành động</span><strong>{analysis.completionRate === null ? "Chưa có" : `${analysis.completionRate}%`}</strong></div>
        <div><span>Thay đổi điểm TB môn đo lại</span><strong>{analysis.observedAverageDelta === null ? "Chưa đo" : `${analysis.observedAverageDelta > 0 ? "+" : ""}${analysis.observedAverageDelta}`}</strong></div>
      </div>
      <p>{analysis.explanation} Mọi thay đổi điểm chỉ là <strong>so sánh trước–sau tự báo cáo</strong>, không kết luận chương trình học gây ra thay đổi.</p>
      <div className="cla-journey__subjects">{latest.subjects.map(s => <span key={s.key}>{s.label}: {s.baseline} → mục tiêu {s.target}{latest.reassessment?.observations.find(o => o.key === s.key) ? ` · đo lại ${latest.reassessment.observations.find(o => o.key === s.key)?.score}` : ""}</span>)}</div>
      {mode !== "pulse" && <p><a href="/pulse#cla-closed-loop">Mở Pulse để cập nhật hành động</a></p>}
    </div>}

    {mode === "pulse" && <div className="cla-journey__card">
      <h3>2. Ghi check-in và 3. Đánh giá lại</h3>
      {!active ? <p>Chưa có chu kỳ đang thực hiện. Hãy bắt đầu từ <a href="/orion#cla-closed-loop">Orion</a>. Nếu chu kỳ trước đã tổng kết, mở Orion để tạo chu kỳ mới.</p>
      : <>
        <div className="cla-journey__fields">
          <label>Tuần của kế hoạch
            <input type="number" min="1" max={active.weeksLeft} step="1" value={week} onChange={e => setWeek(e.target.value)}/>
          </label>
          <label>Số giờ đã học trong tuần
            <input type="number" min="0" max="168" step="0.5" placeholder="Ví dụ 8" value={hours} onChange={e => setHours(e.target.value)}/>
          </label>
          <label>Hành động dự kiến
            <input type="number" min="1" max="20" step="1" value={planned} onChange={e => setPlanned(e.target.value)}/>
          </label>
          <label>Hành động đã hoàn thành
            <input type="number" min="0" max="20" step="1" placeholder="Ví dụ 2" value={completed} onChange={e => setCompleted(e.target.value)}/>
          </label>
        </div>
        <label>Ghi chú hành động (không bắt buộc)
          <textarea maxLength={240} rows={2} value={checkNote} onChange={e => setCheckNote(e.target.value)} placeholder="Đã học phần nào? Có trở ngại gì?"/>
        </label>
        <button type="button" disabled={!canWrite || nextWeek === null || active.checkIns.length >= 12} onClick={submitCheckIn}>Lưu check-in tuần</button>
        {active.checkIns.length > 0 && <><hr/><h3>Đánh giá lại sau hành động</h3>
          <p>Chỉ nhập kết quả nếu đã có bài kiểm tra hoặc ghi nhận mới. Không tự lấy điểm dự báo. Có thể để trống những môn chưa đo; điểm 0 vẫn hợp lệ.</p>
          <div className="cla-journey__fields">{active.subjects.map(s => <label key={s.key}>{s.label} · trước {s.baseline}/10
            <input type="text" inputMode="decimal" placeholder="Điểm đo lại 0–10" value={scores[s.key] ?? ""} onChange={e => setScores(current => ({...current,[s.key]:e.target.value}))}/>
          </label>)}</div>
          <label>Ghi chú về lần đo (không bắt buộc)
            <textarea maxLength={240} rows={2} value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Nguồn bài kiểm tra, ngày làm, giới hạn…"/>
          </label>
          <button type="button" disabled={!canWrite} onClick={submitReassessment}>Chốt lần đo lại và tổng kết chu kỳ</button>
        </>}
      </>}
      <p className="cla-journey__hint">{active?.checkIns.length ?? 0} check-in đã lưu. Sau khi tổng kết, chu kỳ trở thành chỉ-đọc và có thể bắt đầu chu kỳ mới tại Orion.</p>
    </div>}

    {mode === "lumen" && shadow && <div className="cla-journey__card" id="cla-decision-evidence-studio">
      <h3>Decision Evidence Studio · Static vs Adaptive</h3>
      <p><strong>Chế độ shadow — chỉ so sánh quyết định, không áp dụng can thiệp.</strong> Hai chính sách chạy trên cùng dữ liệu tự báo cáo; không đo được hiệu quả học tập của nhánh không được thực hiện.</p>
      <div className="cla-journey__metrics">
        <div><span>CLA Static · giữ kế hoạch gốc</span><strong>MAINTAIN</strong></div>
        <div><span>CLA Adaptive · xem xét lại</span><strong>{shadow.adaptiveDecision}</strong></div>
        <div><span>Chính sách khác nhau?</span><strong>{shadow.changed ? "Có" : "Chưa xác định / Không"}</strong></div>
        <div><span>Truy vết bản chụp</span><strong>{replayShadowEvidence(shadow) ? "REPLAY PASS" : shadow.adaptiveDecision === "ABSTAIN" ? "CHƯA ĐỦ DỮ LIỆU" : "REPLAY FAIL"}</strong></div>
      </div>
      <p>Điều kiện: <code>{shadow.trigger}</code> · phiên bản: <code>{shadow.policyVersion}</code>. Ngưỡng 60% chỉ là quy tắc kỹ thuật chưa được kiểm định.</p>
      <details className="cla-journey__evidence"><summary>Kiểm tra Decision Evidence Capsule (snapshot chỉ đọc)</summary>
        <p>Điểm hoàn thành: {shadow.completionPercent === null ? "Thiếu dữ liệu" : `${shadow.completionPercent}%`} · thay đổi điểm đo lại: {shadow.observedDelta ?? "Thiếu dữ liệu"}.</p>
        <pre style={{overflowX:"auto", whiteSpace:"pre-wrap", wordBreak:"break-word"}}>{JSON.stringify(shadow, null, 2)}</pre>
      </details>
      <p>Giới hạn: dữ liệu tự báo cáo, chưa có nhóm đối chứng, chưa có hiệu chỉnh xác suất hoặc xác nhận tác động nhân quả. Chế độ này không ghi dữ liệu nghiên cứu.</p>
    </div>}

    {mode === "lumen" && <div className="cla-journey__card">
      <h3>4. Lumen đọc diễn tiến và đề xuất bước sau</h3>
      {!latest ? <p>Chưa có hành trình. Bắt đầu tại <a href="/orion#cla-closed-loop">Orion</a>.</p>
      : <><p><strong>{analysis.suggestion === "REPLAN" ? "Cần xem lại chiến lược" : analysis.suggestion === "REASSESS" ? "Có thể ghi kết quả đo lại" : analysis.stage === "REVIEWED" ? "Có thể tạo chu kỳ tiếp theo" : "Tiếp tục thực hiện kế hoạch"}.</strong> {analysis.explanation}</p>
        {latest.status === "REVIEWED" && latest.evidenceRecord && <details className="cla-journey__evidence">
          <summary>Dấu vết minh chứng kỹ thuật (tự báo cáo)</summary>
          <p>Mã kết quả: <code>{latest.evidenceRecord.resultId}</code> · công thức {latest.evidenceRecord.engine.version}.</p>
          <p>Nguồn: {latest.evidenceRecord.datasetVersion}. Xác suất: <strong>không ước lượng</strong>.
            Chưa có chứng thực kết quả, độ bất định thống kê hoặc mã phiên bản source được chốt.</p>
        </details>}
        <ol className="cla-journey__timeline">
          <li>Orion · lựa chọn <strong>{latest.scenarioTitle}</strong> và lưu mốc điểm</li>
          {latest.checkIns.map(c => <li key={c.id}>Pulse · tuần {c.week}: {c.actualHours} giờ, hoàn thành {c.completedActions}/{c.plannedActions} nhiệm vụ (tự báo cáo)</li>)}
          <li>{latest.reassessment ? `Đo lại · ${latest.reassessment.observations.length} môn, tự báo cáo` : "Chưa có điểm đo lại; không kết luận tiến bộ"}</li>
          <li>Lumen · {analysis.explanation}</li>
        </ol>
        <p><a href={latest.status === "REVIEWED" ? "/orion#cla-closed-loop" : "/pulse#cla-closed-loop"}>{latest.status === "REVIEWED" ? "Mở Orion lập kế hoạch chu kỳ tiếp" : "Mở Pulse cập nhật tiến độ"}</a></p>
      </>}
    </div>}
    <p className="cla-journey__foot">Dữ liệu lưu trong Firestore của tài khoản hiện tại nếu Rules được triển khai tương ứng và có đồng ý sử dụng sản phẩm. Không sử dụng cho nghiên cứu, không suy ra tác động nhân quả. Chức năng thử nghiệm, cần nghiệm thu Emulator và trình duyệt.</p>
  </section>;
}
