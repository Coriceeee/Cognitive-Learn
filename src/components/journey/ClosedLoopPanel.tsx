import { useEffect, useMemo, useState } from "react";
import { createJourneyCycle, analyzeJourney, auditJourneyEvidence, auditJourneyT0Snapshot, type JourneyScenarioId, type JourneySubject } from "../../lib/closedLoopJourney";
import { useClosedLoopJourney } from "../../lib/useClosedLoopJourney";
import { compareJourneyT0T1 } from "../../lib/journeyT0T1Comparison";
import { auditJourneyHistory } from "../../lib/journeyMultiCycleTrend";
import { auditJourneyMeasurements } from "../../lib/journeyMeasurementAudit";
import { listMeasurementPoints } from "../../lib/journeyMeasurementDeclarations";
import { useJourneyMeasurementDeclarations } from "../../lib/useJourneyMeasurementDeclarations";
import { evaluateShadowPolicies, replayShadowEvidence } from "../../lib/journeyShadowPolicy";
import { evaluateAdaptiveNextCycle, replayAdaptiveAdvice, freezeAdaptiveDecision, auditAdaptiveDecisionTrace } from "../../lib/adaptiveNextCycle";
import { evaluateFeedbackShadow } from "../../lib/bayesianFeedbackShadow";
import { MetricBar } from "../common/charts/AnalyticCharts";
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
  const [scenarioId, setScenarioId] = useState<JourneyScenarioId | "">("");
  const [decisionChoice, setDecisionChoice] = useState<{owner:string; advice:string; disposition:"ACCEPTED"|"DECLINED"}|null>(null);
  const [week, setWeek] = useState("1");
  const [hours, setHours] = useState("");
  const [completed, setCompleted] = useState("");
  const [planned, setPlanned] = useState("3");
  const [checkNote, setCheckNote] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [reviewNote, setReviewNote] = useState("");
  const [notice, setNotice] = useState("");
  const [measurementPointId, setMeasurementPointId] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [instrumentVersion, setInstrumentVersion] = useState("");
  const [formId, setFormId] = useState("");
  const [scoringProtocolId, setScoringProtocolId] = useState("");
  const [scaleId, setScaleId] = useState<"score-0-to-10" | "score-0-to-10-rounded">("score-0-to-10");

  useEffect(() => { setDecisionChoice(null); setScenarioId(""); }, [journey.uid]);
  const active = journey.current;
  const latest = active ?? journey.latest;
  const analysis = useMemo(() => analyzeJourney(latest), [latest]);
  const t0Audit = useMemo(() => latest ? auditJourneyT0Snapshot(latest) : "LEGACY_NO_T0", [latest]);
  const evidenceAudit = useMemo(() => latest ? auditJourneyEvidence(latest) : "NOT_REVIEWED", [latest]);
  const comparison = useMemo(() => compareJourneyT0T1(latest), [latest]);
  const history = useMemo(() => auditJourneyHistory(journey.cycles, journey.uid || undefined), [journey.cycles, journey.uid]);
  const declarations = useJourneyMeasurementDeclarations(journey.uid, journey.cycles);
  const measurement = useMemo(() => auditJourneyMeasurements(journey.cycles, declarations.manifest, journey.uid || undefined),
    [journey.cycles, declarations.manifest, journey.uid]);
  const measurementPoints = useMemo(() => journey.cycles.flatMap(c => listMeasurementPoints(c)), [journey.cycles]);
  const selectedMeasurementPoint = measurementPoints.find(p => `${p.cycleId}~${p.subjectKey}~${p.timepoint}` === measurementPointId)
    ?? measurementPoints[0];
  const alreadyDeclared = selectedMeasurementPoint && declarations.rows.some(row =>
    row.cycleId === selectedMeasurementPoint.cycleId && row.subjectKey === selectedMeasurementPoint.subjectKey &&
    row.timepoint === selectedMeasurementPoint.timepoint);
  const shadow = useMemo(() => latest ? evaluateShadowPolicies(latest) : null, [latest]);
  const adaptiveContext = useMemo(() => ({cycles: journey.cycles, owner: journey.uid || null,
    serverConfirmed: journey.status === "ready" && journey.recentFromServer,
    options: plan?.scenarios ?? []}), [journey.cycles, journey.uid, journey.status, journey.recentFromServer, plan]);
  const adaptiveAdvice = useMemo(() => evaluateAdaptiveNextCycle(adaptiveContext), [adaptiveContext]);
  const feedbackShadow = useMemo(() => evaluateFeedbackShadow(journey.cycles, journey.uid || null, journey.status === "ready" && journey.recentFromServer), [journey.cycles, journey.uid, journey.status, journey.recentFromServer]);
  const traceSource = latest?.decisionTrace ? [...journey.cycles,...journey.olderCycles].find(c=>c.id===latest.decisionTrace?.sourceCycleId) : undefined;
  const decisionAudit = latest ? auditAdaptiveDecisionTrace(latest,traceSource,journey.uid,journey.recentFromServer) : "NO_TRACE";
  const selectedScenario = plan?.scenarios.find(s => s.id === scenarioId);
  useEffect(() => {
    if (scenarioId && !selectedScenario) { setScenarioId(""); setDecisionChoice(null); }
  }, [scenarioId, selectedScenario]);
  const canWrite = !journey.busy && journey.recentFromServer && (journey.status === "ready" || journey.status === "empty");
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
  const submitMeasurement = () => {
    if(!selectedMeasurementPoint) return;
    if(!window.confirm("Lưu khai báo nguồn điểm một lần và không thể sửa/xóa? Đây CHỈ là thông tin tự báo cáo, không phải xác nhận của trường.")) return;
    void perform(() => declarations.save(selectedMeasurementPoint.cycleId,selectedMeasurementPoint.subjectKey,
      selectedMeasurementPoint.timepoint,{instrumentId,instrumentVersion,formId,scoringProtocolId,scaleId}),
      "Đã ghi nhận khai báo nguồn điểm bất biến (tự báo cáo, chưa kiểm chứng)." );
  };
  const submitStart = () => {
    if (!plan || !selectedScenario || !scenarioId) return;
    const input = {scenarioId, scenarioTitle: selectedScenario.title, targetMajor: plan.targetMajor,
      weeksLeft: plan.weeksLeft, plannedWeeklyHours: selectedScenario.weeklyHours, subjects: plan.subjects};
    void perform(async () => {
      if (decisionChoice) {
        if (decisionChoice.owner !== journey.uid || decisionChoice.advice !== JSON.stringify(adaptiveAdvice))
          throw new Error("Gợi ý hoặc tài khoản đã thay đổi. Hãy xác nhận lại hoặc chọn lưu thủ công.");
        const draft=createJourneyCycle({...input,id:"draft_preview_only",startedAt:new Date().toISOString()});
        const decisionTrace=freezeAdaptiveDecision(adaptiveContext,draft,decisionChoice.disposition);
        await journey.start({...input,decisionTrace});
      } else await journey.start(input);
      setDecisionChoice(null);
    }, "Đã tạo chu kỳ. Mở Pulse để ghi nhận hành động thực tế.");
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
    {journey.status === "syncing" && <p role="status">Đang chờ Firestore xác minh chu kỳ từ máy chủ. Dữ liệu cache chưa được dùng để hiển thị hoặc ghi cập nhật.</p>}
    {journey.status === "signed-out" && <p role="status">Đăng nhập tài khoản học sinh để sử dụng chu kỳ.</p>}
    {journey.status === "error" && <p role="alert">{journey.error}</p>}
    {journey.error && journey.status !== "error" && <p role="alert">{journey.error}</p>}
    {notice && <p role="status" className="cla-journey__notice">{notice}</p>}

    {mode === "orion" && <div className="cla-journey__card">
      <h3>1. Chốt chiến lược trong Orion</h3>
      {active ? <p>Đang có chu kỳ <strong>{active.scenarioTitle}</strong>. Hãy ghi tiến độ và đo lại tại <a href="/pulse/checkin#cla-closed-loop">Pulse</a> trước khi tạo chu kỳ khác.</p>
        : !plan || !plan.subjects.length ? <p>Điền điểm hiện tại, mục tiêu và số tuần hợp lệ ở Orion để bắt đầu.</p>
        : !plan.scenarios.length ? <p role="status">Không có chiến lược phù hợp giới hạn hiện tại. Điều chỉnh bộ lọc Orion trước khi tạo chu kỳ.</p>
        : <><p>Chụp một bản giá trị đầu vào hiện tại làm mốc so sánh. Không tự đồng bộ lại khi sửa bản nháp Orion.</p>
          {latest?.status === "REVIEWED" && <div className="cla-journey__comparison" aria-label="Gợi ý thích ứng cho chu kỳ tiếp">
            <h4>Adaptive Decision · Gợi ý chu kỳ tiếp theo</h4>
            <p>Chính sách thử nghiệm theo check-in tự báo cáo; không tự tăng giờ, không dự báo tác động học tập. Học sinh tự chọn kế hoạch.</p>
            {adaptiveAdvice.recommendedId ? <>
              <p>Đề xuất {adaptiveAdvice.recommendedHours} giờ/tuần · {adaptiveAdvice.decision === "REDUCE" ? "giảm tải" : "giữ thời lượng"}.</p>
              <button type="button" disabled={!canWrite || !replayAdaptiveAdvice(adaptiveContext, adaptiveAdvice)}
                onClick={() => { if(adaptiveAdvice.recommendedId && replayAdaptiveAdvice(adaptiveContext, adaptiveAdvice)) { setScenarioId(adaptiveAdvice.recommendedId); setDecisionChoice({owner:journey.uid,advice:JSON.stringify(adaptiveAdvice),disposition:"ACCEPTED"}); } }}>
                Chọn gợi ý vào bản nháp (chưa lưu)
              </button>
              {selectedScenario && scenarioId!==adaptiveAdvice.recommendedId && <button type="button" disabled={!canWrite || !replayAdaptiveAdvice(adaptiveContext,adaptiveAdvice)} onClick={()=>setDecisionChoice({owner:journey.uid,advice:JSON.stringify(adaptiveAdvice),disposition:"DECLINED"})}>Xác nhận chọn phương án khác</button>}
              {decisionChoice && <p role="status">Đã chọn {decisionChoice.disposition === "ACCEPTED" ? "chấp nhận" : "không chọn gợi ý"} vào bản nháp; chỉ lưu khi bắt đầu chu kỳ. <button type="button" onClick={()=>setDecisionChoice(null)}>Hủy ghi lựa chọn</button></p>}
            </> : <p role="status">Chưa thể đề xuất tự động ({adaptiveAdvice.reason}). Có thể xem lại thời lượng và chọn thủ công.</p>}
            <details className="cla-journey__evidence"><summary>Evidence Record · lý do và nguồn (chỉ đọc)</summary>
              <p>Phiên bản: {adaptiveAdvice.policyVersion} · Mã điều kiện: {adaptiveAdvice.reason} · Check-in: {adaptiveAdvice.factors.checkInCount} · Hoàn thành: {adaptiveAdvice.factors.completionPercent ?? "Chưa có"}%.</p>
              <p>Chu kỳ nguồn: {adaptiveAdvice.sourceCycleId ?? "Chưa đủ"} · Evidence: {adaptiveAdvice.reviewEvidenceId ?? "Chưa đủ"}. Kiểm tra tính nhất quán: {replayAdaptiveAdvice(adaptiveContext, adaptiveAdvice) ? "khớp nội bộ" : "không khớp"}.</p>
              <p>Khi xác nhận lựa chọn và bắt đầu chu kỳ, CLA sẽ lưu liên kết với chu kỳ nguồn cùng kế hoạch mới. Cần Rules candidate CP36 đã được nghiệm thu và triển khai đúng môi trường; không tự chuyển sang ghi thủ công nếu lỗi. Không phải phân nhóm thực nghiệm.</p>
            </details>
            <details className="cla-journey__evidence"><summary>Bayesian Feedback · thử nghiệm shadow</summary>
              {feedbackShadow.status === "SHADOW_ONLY" ? <><p>{feedbackShadow.met}/{feedbackShadow.weeks} tuần tự báo cáo đạt ngưỡng hoàn thành 60% (quy tắc thử nghiệm).</p><MetricBar label="Số tuần đạt ngưỡng tự báo cáo" value={feedbackShadow.met} max={feedbackShadow.weeks} unit={`/${feedbackShadow.weeks} tuần`} tone="teal"/></> : <p>Chưa đủ điều kiện phân tích tuần ({feedbackShadow.reason}).</p>}
              <p>Không dùng phân tích này để chọn chiến lược, dự báo khả năng thành công hoặc đánh giá tâm lý. Kết quả Bayesian có điều kiện chưa hiệu chỉnh; không hiển thị ước lượng xác suất cho học sinh.</p>
            </details>
          </div>}
          <label>Chiến lược
            <select value={selectedScenario ? scenarioId : ""} onChange={e => {setScenarioId(e.target.value as JourneyScenarioId | "");setDecisionChoice(null);}}>
              <option value="">Chọn phương án đáp ứng giới hạn Orion</option>
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
      <p role="status">{t0Audit === "FROZEN_CONSISTENT"
        ? `T0 ĐÃ CHỐT — khoảng cách mục tiêu mô tả ${latest.t0Snapshot!.planGapPoints} điểm; dự báo kết quả: CHƯA ƯỚC LƯỢNG. Không sử dụng điểm T1/T2 để tính lại mốc T0.`
        : t0Audit === "LEGACY_NO_T0"
          ? "BẢN GHI CŨ — chưa có snapshot T0 được chốt; không dùng để đánh giá dự báo tiền cứu."
          : "MỐC T0 KHÔNG NHẤT QUÁN — không sử dụng kết quả làm bằng chứng."}</p>
      <div className="cla-journey__metrics">
        <div><span>Check-in</span><strong>{latest.checkIns.length}</strong></div>
        <div><span>Giờ học tự báo cáo</span><strong>{analysis.totalHoursReported}</strong></div>
        <div><span>Hoàn thành hành động</span><strong>{analysis.completionRate === null ? "Chưa có" : `${analysis.completionRate}%`}</strong></div>
        <div><span>Thay đổi điểm TB môn đo lại</span><strong>{analysis.observedAverageDelta === null ? "Chưa đo" : `${analysis.observedAverageDelta > 0 ? "+" : ""}${analysis.observedAverageDelta}`}</strong></div>
      </div>
      <p>{analysis.explanation} Mọi thay đổi điểm chỉ là <strong>so sánh trước–sau tự báo cáo</strong>, không kết luận chương trình học gây ra thay đổi.</p>
      <div className="cla-journey__subjects">{latest.subjects.map(s => <span key={s.key}>{s.label}: {s.baseline} → mục tiêu {s.target}{latest.reassessment?.observations.find(o => o.key === s.key) ? ` · đo lại ${latest.reassessment.observations.find(o => o.key === s.key)?.score}` : ""}</span>)}</div>
      {latest.decisionTrace && <details className="cla-journey__evidence"><summary>Liên kết quyết định thích ứng (tự báo cáo)</summary>
        <p>{latest.decisionTrace.disposition === "ACCEPTED" ? "Chấp nhận gợi ý" : "Chọn phương án khác"} · nguồn {latest.decisionTrace.sourceCycleId} · gợi ý {latest.decisionTrace.recommendedHours} giờ/tuần · bản lưu {latest.decisionTrace.policyVersion}.</p>
        <p>Kiểm tra lại: {decisionAudit === "CONSISTENT" ? "Khớp nội bộ với chu kỳ nguồn" : decisionAudit === "SOURCE_REQUIRED" ? "Cần dữ liệu nguồn từ máy chủ" : "Không khớp — không dùng làm bằng chứng"}. Không chứng minh phân nhóm hay hiệu quả.</p>
      </details>}
      {latest.status === "REVIEWED" && <section className="cla-journey__comparison" aria-label="Đối chiếu T0 T1">
        <h4>Đối chiếu T0 → T1 (chỉ mang tính mô tả)</h4>
        {comparison.status === "DESCRIPTIVE_ONLY" ? <>
          <p role="status">Đã đối chiếu {comparison.summary.matchedSubjectCount} môn có cả T0/T1; {comparison.summary.missingT1SubjectCount} môn chưa có T1. Mốc T0: {comparison.t0FrozenAt}; T1 tự báo cáo: {comparison.t1RecordedAt}.</p>
          <div className="cla-journey__subjects">{comparison.measures.map(item => <span key={item.subjectKey}>{item.subjectLabel}: T0 {item.t0Score} → {item.matched ? `T1 ${item.t1Score} (${item.delta! > 0 ? "+" : ""}${item.delta})` : "T1 chưa đo"}</span>)}</div>
          <p>Thay đổi trung bình trên các môn đã đo lại: <strong>{comparison.summary.observedAverageDelta! > 0 ? "+" : ""}{comparison.summary.observedAverageDelta}</strong> điểm (tự báo cáo). Hoàn thành hành động: {comparison.summary.reportedCompletionPercent}% (tự báo cáo).</p>
        </> : <p role="status">{comparison.status === "LEGACY_NO_T0" ? "Bản ghi cũ chưa có T0 đã chốt; tạm ngừng đối chiếu." : comparison.status === "LEGACY_NO_EVIDENCE" ? "Bản ghi thiếu Evidence Record; tạm ngừng đối chiếu." : "Không đủ bằng chứng hợp lệ để đối chiếu T0/T1."}</p>}
        <p className="cla-journey__hint">KHÔNG ĐÁNH GIÁ DỰ BÁO: T0 chưa có dự báo ML được kiểm định. Chênh lệch T0/T1 và check-in không chứng minh hiệu quả nhân quả hoặc tác động từ CLA.</p>
      </section>}
      {mode !== "pulse" && <p><a href="/pulse/checkin#cla-closed-loop">Mở Pulse để cập nhật hành động</a></p>}
    </div>}

    {journey.status === "ready" && <section className="cla-journey__card cla-journey__history" aria-label="Lịch sử nhiều chu kỳ T0 T1 T2">
      <h3>Lịch sử T0 → T1 → T2 giữa các chu kỳ</h3>
      <p role="status">{history.status === "MULTI_CYCLE_DESCRIPTIVE"
        ? `CHUỖI ĐIỂM TỰ BÁO CÁO — ${history.reviewedCount} chu kỳ, ${history.subjectTrends.length} môn; ${measurement.status === "DECLARED_ALIGNED_ONLY" ? "metadata khai báo khớp nhưng chưa được xác minh" : "chưa đủ metadata để nối thành xu hướng hợp lệ"}.`
        : history.status === "ONE_REVIEWED_CYCLE" ? "Mới một chu kỳ đã tổng kết; chưa có lần đo T2."
        : history.status === "NO_HISTORY" ? "Chưa có chu kỳ nào."
        : history.status === "DISCONTINUITY" ? "GIÁN ĐOẠN: thời điểm, điểm nền hoặc môn đo không liên tục. Không nối dữ liệu thành xu hướng."
        : history.status === "INVALID" ? "DỮ LIỆU KHÔNG HỢP LỆ: không hiển thị xu hướng giữa chu kỳ."
        : "CHƯA ĐỦ BẰNG CHỨNG: có chu kỳ chưa tổng kết hoặc bản ghi thiếu T0/Evidence Record."}</p>
      {history.status === "MULTI_CYCLE_DESCRIPTIVE" && <p role="status" className="cla-journey__hint">
        KIỂM TOÁN THANG ĐO: {declarations.status !== "ready"
          ? "CHƯA ĐỦ THÔNG TIN — chưa tải/xác minh được khai báo phép đo; KHÔNG xác nhận khả năng so sánh."
          : measurement.status === "DECLARED_ALIGNED_ONLY"
            ? `KHAI BÁO KHỚP KỸ THUẬT (${measurement.suppliedPointCount}/${measurement.expectedPointCount}) — chưa kiểm định độ tin cậy hay tương đương bài kiểm tra.`
            : `CHƯA ĐỦ ĐIỀU KIỆN — ${measurement.status} (${measurement.suppliedPointCount}/${measurement.expectedPointCount}); không nối dữ liệu thành kết luận hiệu quả.`}
      </p>}
      {history.status === "MULTI_CYCLE_DESCRIPTIVE" && measurement.status === "DECLARED_ALIGNED_ONLY" && declarations.status === "ready" && <div className="cla-journey__subjects">
        {history.subjectTrends.map(track => <span key={track.key}>{track.label} (chỉ khai báo): {track.points.map(point => `${point.label} ${point.score}`).join(" → ")}</span>)}
      </div>}
      {history.status === "MULTI_CYCLE_DESCRIPTIVE" && (measurement.status !== "DECLARED_ALIGNED_ONLY" || declarations.status !== "ready") && <p role="status" className="cla-journey__hint">
        KHÔNG HIỂN THỊ ĐƯỜNG XU HƯỚNG: thiếu hoặc không tương thích nguồn phép đo. Những điểm tự báo cáo vẫn nằm trong hồ sơ từng chu kỳ, nhưng không ghép thành xu hướng.
      </p>}
      <div className="cla-journey__history-pagination" aria-label="Đọc lịch sử chu kỳ cũ">
        <p className="cla-journey__hint">Bộ phân tích T0/T1/T2 chỉ sử dụng tối đa 8 chu kỳ gần nhất. Đã tải thêm {journey.olderCycles.length} chu kỳ để đọc riêng; chúng KHÔNG được dùng để tính lại xu hướng hoặc nâng mức bằng chứng.</p>
        {!journey.recentFromServer && <p role="status">Đang chờ trang mới nhất được máy chủ xác nhận; không tuyên bố đã đọc hết lịch sử từ cache.</p>}
        {journey.olderError && <p role="alert">{journey.olderError}</p>}
        {journey.hasMoreOlder && <button type="button" onClick={()=>void journey.loadOlder()}
          disabled={!journey.recentFromServer || journey.loadingOlder || journey.olderCycles.length+journey.cycles.length>=80}>
          {journey.loadingOlder ? "Đang tải lịch sử…" : "Tải 8 chu kỳ cũ hơn (chỉ đọc)"}
        </button>}
        {journey.hasMoreOlder && journey.olderCycles.length+journey.cycles.length>=80 && <p role="status">Đã đạt giới hạn hiển thị 80 chu kỳ; lịch sử có thể còn dài hơn.</p>}
        {!journey.hasMoreOlder && journey.recentFromServer && !journey.olderError && <p role="status">Đã đọc đến cuối các trang được trả về trong phiên này; không phải bằng chứng về một bản chụp toàn bộ lịch sử bất biến.</p>}
        {journey.olderCycles.length>0 && <details><summary>Xem {journey.olderCycles.length} chu kỳ cũ (chỉ đọc, không tính xu hướng)</summary>
          <ul>{journey.olderCycles.map(c=><li key={c.id}>{c.startedAt.slice(0,10)} · {c.scenarioTitle} · {c.status=== "REVIEWED" ? "Đã tổng kết" : "Chưa tổng kết"} · Mã {c.id.slice(0,8)}</li>)}</ul>
        </details>}
      </div>
      {history.transitions.length > 0 && <details className="cla-journey__evidence"><summary>Kiểm toán ranh giới giữa các chu kỳ</summary>
        <ul>{history.transitions.map(t => <li key={`${t.fromCycleId}-${t.toCycleId}`}>
          {t.fromCycleId} → {t.toCycleId}: {t.status}; môn nối được {t.linkedSubjects.length}; môn thiếu/đổi {t.missingSubjects.length + t.changedSubjects.length}.
        </li>)}</ul>
      </details>}
      <p className="cla-journey__hint">T2 là lần đo lại của chu kỳ thứ hai, chỉ gắn nhãn khi T1 trước khớp điểm nền T0 sau. Chưa kiểm định độ tin cậy thang đo hoặc sự tương đương của đề kiểm tra. Điểm số là tự báo cáo; cùng điểm không chứng minh hai bài kiểm tra tương đương. Không gộp trung bình qua các nhóm môn khác nhau, không suy ra tác động nhân quả.</p>
    </section>}

    {mode === "pulse" && journey.cycles.length > 0 && <section className="cla-journey__card" aria-label="Khai báo nguồn phép đo học tập">
      <h3>4. Khai báo nguồn điểm (chỉ tự báo cáo)</h3>
      <p>Ghi nhận công cụ đo, phiên bản, mã đề, quy tắc chấm và thang điểm theo từng mốc T0/T1.
        Thời gian hệ thống lưu khai báo <strong>không phải ngày làm bài được xác minh</strong>. T0 khai báo sau khi đã có T1 là hồi cứu, không phải dữ liệu tiền cứu.</p>
      {declarations.status === "error" && <p role="alert">{declarations.error}</p>}
      {declarations.status === "loading" && <p role="status">Đang đồng bộ khai báo đã lưu…</p>}
      {declarations.status === "ready" && <p role="status">Đã lưu {declarations.rows.length} khai báo của các chu kỳ đang hiển thị. Chỉ được tạo một lần; không có quyền sửa hoặc xóa.</p>}
      {declarations.coverage && <p role="status" className="cla-journey__hint">
        {declarations.coverage.state === "LEGACY_READ_ONLY"
          ? `BẢN GHI CŨ: ${declarations.coverage.legacyCycleIds.length} chu kỳ thiếu mốc T0 hoặc Evidence Record. Chỉ xem lịch sử; không suy diễn nguồn phép đo. Có ${declarations.coverage.missingCount} mốc mới chưa khai báo.`
          : declarations.coverage.state === "PARTIAL_UNVERIFIED"
            ? `KHAI BÁO CHƯA ĐẦY ĐỦ: ${declarations.coverage.storedCount}/${declarations.coverage.expectedCount} mốc. Thiếu ${declarations.coverage.missingCount}; không xác nhận phép đo tương đương.`
            : `ĐỦ KHAI BÁO TRONG CỬA SỔ ĐÃ TẢI: ${declarations.coverage.storedCount}/${declarations.coverage.expectedCount} mốc. Chỉ tự báo cáo; chưa được thẩm định độc lập.`}
      </p>}
      {declarations.status === "loading" && declarations.error && <p role="status" className="cla-journey__hint">{declarations.error}</p>}
      {selectedMeasurementPoint && <>
        <label>Mốc điểm cần khai báo
          <select value={`${selectedMeasurementPoint.cycleId}~${selectedMeasurementPoint.subjectKey}~${selectedMeasurementPoint.timepoint}`}
            onChange={event => setMeasurementPointId(event.target.value)}>
            {measurementPoints.map(point => <option key={`${point.cycleId}~${point.subjectKey}~${point.timepoint}`}
              value={`${point.cycleId}~${point.subjectKey}~${point.timepoint}`}>
              {point.cycleId.slice(0,8)} · {point.subjectLabel} · {point.timepoint} · {point.score}/10
            </option>)}
          </select>
        </label>
        <p className="cla-journey__hint">Mốc gắn với hệ thống: {selectedMeasurementPoint.linkedAt}; không phải thời điểm tổ chức bài kiểm tra.</p>
        <div className="cla-journey__fields">
          <label>Mã công cụ (vd: test_math)<input value={instrumentId} onChange={e=>setInstrumentId(e.target.value)} maxLength={64}/></label>
          <label>Phiên bản (vd: version_001)<input value={instrumentVersion} onChange={e=>setInstrumentVersion(e.target.value)} maxLength={64}/></label>
          <label>Mã đề (vd: form_a)<input value={formId} onChange={e=>setFormId(e.target.value)} maxLength={64}/></label>
          <label>Quy tắc chấm (vd: rubric_v1)<input value={scoringProtocolId} onChange={e=>setScoringProtocolId(e.target.value)} maxLength={64}/></label>
          <label>Thang điểm<select value={scaleId} onChange={e=>setScaleId(e.target.value as typeof scaleId)}>
            <option value="score-0-to-10">0–10 (không làm tròn)</option>
            <option value="score-0-to-10-rounded">0–10 (làm tròn)</option>
          </select></label>
        </div>
        <button type="button" disabled={declarations.status!=="ready" || declarations.busy || Boolean(alreadyDeclared)}
          onClick={submitMeasurement}>{alreadyDeclared ? "Đã lưu — không thể sửa" : declarations.busy ? "Đang lưu…" : "Xác nhận và lưu khai báo một lần"}</button>
      </>}
      <p className="cla-journey__hint">Mã dùng chữ thường, số, dấu _ hoặc -, bắt đầu bằng chữ và dài 3–64 ký tự. Để trống không được suy đoán mặc định. Firestore Rules ứng viên chưa triển khai lên production; việc lưu có thể bị từ chối cho đến khi nghiệm thu.</p>
    </section>}

    {mode === "pulse" && <div className="cla-journey__card">
      <h3>2. Ghi check-in và 3. Đánh giá lại</h3>
      {!active ? <p>Chưa có chu kỳ đang thực hiện. Hãy bắt đầu từ <a href="/orion/scenarios#cla-closed-loop">Orion</a>. Nếu chu kỳ trước đã tổng kết, mở Orion để tạo chu kỳ mới.</p>
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
      {!latest ? <p>Chưa có hành trình. Bắt đầu tại <a href="/orion/scenarios#cla-closed-loop">Orion</a>.</p>
      : <><p><strong>{analysis.suggestion === "REPLAN" ? "Cần xem lại chiến lược" : analysis.suggestion === "REASSESS" ? "Có thể ghi kết quả đo lại" : analysis.stage === "REVIEWED" ? "Có thể tạo chu kỳ tiếp theo" : "Tiếp tục thực hiện kế hoạch"}.</strong> {analysis.explanation}</p>
        {latest.status === "REVIEWED" && <p role="status">
          <strong>Đối chiếu Evidence Record:</strong>{" "}
          {evidenceAudit === "CONSISTENT" ? "KHỚP CÔNG THỨC — chưa xác minh nguồn dữ liệu hoặc hiệu quả giáo dục" :
            evidenceAudit === "LEGACY_NO_EVIDENCE" ? "BẢN GHI CŨ — chưa có Evidence Record để đối chiếu" :
            "KHÔNG KHỚP — không sử dụng kết quả này làm bằng chứng"}
        </p>}
        {latest.status === "REVIEWED" && evidenceAudit === "CONSISTENT" && latest.evidenceRecord && <details className="cla-journey__evidence">
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
        <p><a href={latest.status === "REVIEWED" ? "/orion/scenarios#cla-closed-loop" : "/pulse/checkin#cla-closed-loop"}>{latest.status === "REVIEWED" ? "Mở Orion lập kế hoạch chu kỳ tiếp" : "Mở Pulse cập nhật tiến độ"}</a></p>
      </>}
    </div>}
    <p className="cla-journey__foot">Dữ liệu lưu trong Firestore của tài khoản hiện tại nếu Rules được triển khai tương ứng và có đồng ý sử dụng sản phẩm. Không sử dụng cho nghiên cứu, không suy ra tác động nhân quả. Chức năng thử nghiệm, cần nghiệm thu Emulator và trình duyệt.</p>
  </section>;
}
