import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getClaApiBaseUrl } from "../../lib/claApiBase";
import claChatMascot from "../../assets/cla-chat-mascot.webp";
import { ADVISOR_PAGE_CONTEXTS, advisorPageContextFromPath, advisorSuggestionsFor, normaliseAdvisorHistory, prepareAdvisorMessage, routeAdvisorQuestion, safeAdvisorDestination, type AdvisorTurn, type AdvisorRoute } from "../../lib/advisorChatPolicy";

import { advisorLocalIntent, answerLocalDecision, isPersonalLearningAdviceQuestion, isFocusLearningAdviceRequest, additionalDailyStudyHours, answerPersonalLearningAdvice, remoteAdvisorTurns, type AdvisorLocalIntent, type AdvisorLocalAnswer } from "../../lib/advisorDecisionContext";
import { useOptionalVerifiedStudentProfile } from "../../page/seed/hooks/StudentProfileContext";
import { safeAdmissionAdvisorSource } from "../../lib/advisorAdmissionAnswers";
import { answerClaKnowledge } from "../../lib/claKnowledgeRetrieval";
import { answerVerifiedCutoff, safeCutoffSource } from "../../lib/atlasDecisionComparison";

type AdvisorDisplayTurn = AdvisorTurn & { source?: string; destination?: AdvisorRoute["destination"] | AdvisorLocalAnswer["destination"]; linkLabel?: string; remote?: boolean; privateIntent?: AdvisorLocalIntent | "learning" };
export default function FloatingAdvisorChat() {
  const currentPath = window.location.pathname;
  const pageContext = advisorPageContextFromPath(currentPath);
  const pageContextLabel = ADVISOR_PAGE_CONTEXTS[pageContext];
  const suggestions = advisorSuggestionsFor(pageContext);
  const studentContext = useOptionalVerifiedStudentProfile();
  const [open, setOpen] = useState(false);
  const [sessionUid, setSessionUid] = useState<string|null>(null);
  const authenticated = Boolean(sessionUid && auth.currentUser?.uid === sessionUid);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<AdvisorDisplayTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const scrollAnchor = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => onAuthStateChanged(auth, user => {
    controllerRef.current?.abort(); controllerRef.current = null;
    setSessionUid(user?.uid ?? null); setQuestion(""); setLoading(false);
    setTurns([]); setNotice("");
  }), []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => { scrollAnchor.current?.scrollIntoView({ block: "nearest" }); }, [turns, loading]);
  useEffect(() => () => controllerRef.current?.abort(), []);
  async function send(raw = question) {
    if (loading || controllerRef.current) return;
    let message: string;
    try { message = prepareAdvisorMessage(raw); } catch (error) { setNotice(error instanceof Error ? error.message : "Câu hỏi chưa hợp lệ."); return; }
    const uid = auth.currentUser?.uid;
    if (!authenticated || !uid || uid !== sessionUid) { setNotice("Bạn cần đăng nhập để trò chuyện với trợ lý CLA."); return; }
    // Personal learning guidance uses this account's server-confirmed transcript and observed profile.
    // Study capacity, cognitive proxies and temporal signals are used locally, never sent to Gemini.
    if (isPersonalLearningAdviceQuestion(message)) {
      const local = answerPersonalLearningAdvice(studentContext, uid, { focusLowestSubject: isFocusLearningAdviceRequest(message), additionalDailyHours: additionalDailyStudyHours(message) ?? undefined, question: message });
      setTurns(current => [...current, { role: "user", text: message, privateIntent: "learning" }, { role: "model", text: local.answer, destination: local.destination, linkLabel: local.linkLabel, privateIntent: "learning" }]);
      setQuestion(""); setNotice(""); return;
    }
    // Other personal decisions and follow-ups stay local, before public facts or Gemini.
    const localIntent = advisorLocalIntent(message);
    const previousPrivate = turns[turns.length - 1]?.privateIntent;
    const privateFollowup = Boolean(previousPrivate && /^(vay|the|con|tiep|tai sao|vi sao|sao|neu|bao nhieu|lam sao|co nen|cu the|chi tiet|giai thich|them|tang)\b/i.test(message.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
    if (previousPrivate === "learning" && privateFollowup) {
      const local = answerPersonalLearningAdvice(studentContext, uid, { focusLowestSubject: isFocusLearningAdviceRequest(message), additionalDailyHours: additionalDailyStudyHours(message) ?? undefined, question: message });
      setTurns(current => [...current, { role: "user", text: message, privateIntent: "learning" }, { role: "model", text: local.answer, destination: local.destination, linkLabel: local.linkLabel, privateIntent: "learning" }]);
      setQuestion(""); setNotice(""); return;
    }
    if (localIntent || (privateFollowup && previousPrivate !== "learning")) {
      const intent = localIntent ?? "personal";
      const local = answerLocalDecision(intent, uid, window.location.pathname);
      setTurns(current => [...current, { role: "user", text: message, privateIntent: intent }, { role: "model", text: local.answer, destination: local.destination, linkLabel: local.linkLabel, privateIntent: intent }]);
      setQuestion(""); setNotice(""); return;
    }
    const verified = answerVerifiedCutoff(message);
    if (verified) {
      setTurns(current => [...current, { role: "user", text: message }, { role: "model", text: verified.answer, source: verified.source, destination: "/atlas/vietnam", linkLabel: "Xem Atlas" }]);
      setQuestion(""); setNotice(""); return;
    }
    const knowledge = answerClaKnowledge(message);
    if (knowledge) {
      setTurns(current => [...current, { role: "user", text: message }, { role: "model", text: knowledge.answer }]);
      setQuestion(""); setNotice(""); return;
    }
    const localRedirect = routeAdvisorQuestion(message);
    if (localRedirect) {
      setTurns(current => [...current, { role: "user", text: message }, { role: "model", text: localRedirect.answer, destination: localRedirect.destination, linkLabel: localRedirect.label, source: localRedirect.source }]);
      setQuestion(""); setNotice("");
      return;
    }
    const past = normaliseAdvisorHistory(remoteAdvisorTurns(turns));
    setTurns(current => [...current, { role: "user", text: message, remote: true }]);
    setQuestion(""); setNotice(""); setLoading(true);
    const controller = new AbortController(); controllerRef.current = controller;
    const isCurrent = () => controllerRef.current === controller && !controller.signal.aborted && auth.currentUser?.uid === uid;
    try {
      const user = auth.currentUser;
      if (!user || user.uid !== uid || !isCurrent()) throw new Error("Phiên đăng nhập đã hết hạn.");
      const token = await getIdToken(user);
      if (!isCurrent()) return;
      const response = await fetch(`${getClaApiBaseUrl()}/api/gemini-chat`, {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ version: 1, message, history: past, pageContext }),
      });
      const rawResponse = await response.text();
      if (!isCurrent()) return;
      if (rawResponse.length > 15000) throw new Error("Phản hồi trợ lý vượt giới hạn an toàn.");
      let payload: { ok?: boolean; answer?: string; message?: string; destination?: unknown; linkLabel?: string; source?: unknown };
      try { payload = JSON.parse(rawResponse); } catch { throw new Error("Máy chủ trả HTML/văn bản thay vì JSON. Kiểm tra VITE_API_BASE_URL và deployment Vercel Gemini API."); }
      if (!response.ok || !payload.ok || typeof payload.answer !== "string") throw new Error(payload.message || `Chatbot chưa khả dụng (HTTP ${response.status}).`);
      const destination = safeAdvisorDestination(payload.destination);
      setTurns(current => [...current, { role: "model", text: payload.answer!.slice(0, 4000), remote: true, destination, source: safeCutoffSource(payload.source) || safeAdmissionAdvisorSource(payload.source), linkLabel: destination && typeof payload.linkLabel === "string" ? payload.linkLabel.slice(0, 90) : undefined }]);
    } catch (error) {
      if (isCurrent()) setNotice(error instanceof Error ? error.message : "Chưa kết nối được trợ lý Gemini.");
    } finally { if (controllerRef.current === controller) { setLoading(false); controllerRef.current = null; } }
  }
  if (currentPath === "/" || currentPath === "/about" || currentPath === "/contact") return null;
  return <div className="cla-chat-root">
    {open && <section id="cla-advisor-dialog" className="cla-chat-panel" role="dialog" aria-modal="false" aria-label="Trợ lý CLA — trò chuyện trực tiếp" onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
      <header className="cla-chat-header">
        <img className="cla-chat-header-mascot" src={claChatMascot} alt="" aria-hidden="true" />
        <div className="cla-chat-header-copy"><strong>CLA Assistant</strong><span>Trợ lý học tập, hướng nghiệp và tuyển sinh</span><small>Đang ở: {pageContextLabel}</small></div>
        <button type="button" aria-label="Đóng trò chuyện" onClick={() => setOpen(false)}>×</button>
      </header>
      <div className="cla-chat-messages" role="log" aria-live="polite" aria-relevant="additions text">
        <p className="cla-chat-intro">Bạn có thể hỏi tự nhiên về điểm mạnh, điều cần cải thiện, phương pháp học, kế hoạch cá nhân, ngành học và tuyển sinh. Với câu hỏi cá nhân, CLA đối chiếu hồ sơ Seed đã xác minh; dữ liệu học tập được xử lý trên máy và không gửi sang Gemini. Kiến thức học tập thông thường được AI giải thích trực tiếp; thông tin tuyển sinh theo năm phải đối chiếu nguồn tuyển sinh chính thức. Bạn cũng có thể hỏi về kịch bản đã xác nhận tại Atlas/Orion.</p>
        {(authenticated ? turns : []).map((turn, index) => <div key={index} className={`cla-chat-message ${turn.role === "user" ? "is-user" : "is-model"}`}><span>{turn.role === "user" ? "Bạn" : "CLA"}</span><p>{turn.text}</p>{turn.source && <a className="cla-chat-context-link" href={turn.source} target="_blank" rel="noopener noreferrer">Nguồn công bố chính thức ↗</a>}{turn.destination && <a className="cla-chat-context-link" href={turn.destination}>{turn.linkLabel || "Mở chức năng liên quan"} ↗</a>}</div>)}
        {loading && <p className="cla-chat-thinking" role="status">Đang tạo câu trả lời…</p>}
        <div ref={scrollAnchor} />
      </div>
      {!authenticated && <p className="cla-chat-auth-note">Đăng nhập để sử dụng trợ lý CLA. Bạn vẫn có thể đóng cửa sổ và tiếp tục thao tác trên website.</p>}
      {authenticated && turns.length === 0 && <div className="cla-chat-suggestions-wrap"><span>GỢI Ý THEO TRANG ĐANG MỞ</span><div className="cla-chat-suggestions">{suggestions.map(value => <button type="button" key={value} onClick={() => void send(value)}>{value}</button>)}</div></div>}
      {notice && <p className="cla-chat-notice" role="alert">{notice}</p>}
      <form className="cla-chat-form" onSubmit={event => { event.preventDefault(); void send(); }}>
        <label htmlFor="cla-chat-input" className="sr-only">Câu hỏi cho trợ lý</label>
        <textarea id="cla-chat-input" ref={inputRef} rows={2} maxLength={1500} value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder={authenticated ? "Hỏi về ngành, trường, tuyển sinh…" : "Đăng nhập để trò chuyện"} disabled={loading || !authenticated} />
        <button type="submit" disabled={loading || !authenticated || question.trim().length < 2}>{loading ? "Đang gửi" : "Gửi"}</button>
      </form>
      <div className="cla-chat-footer"><a href="/atlas/vietnam">Atlas</a><a href="/atlas/study-abroad">Du học</a><a href="/haven/scholarships">Học bổng</a><button type="button" onClick={() => { controllerRef.current?.abort(); controllerRef.current = null; setLoading(false); setQuestion(""); setTurns([]); setNotice(""); }}>Xóa hội thoại</button></div>
    </section>}
    <button
      className={`cla-chat-launcher${open ? " is-open" : ""}`}
      type="button"
      title={open ? "Đóng trợ lý CLA" : "Hỏi đáp tuyển sinh cùng CLA"}
      aria-label={open ? "Đóng trợ lý CLA" : "Mở trợ lý CLA"}
      aria-expanded={open}
      aria-controls="cla-advisor-dialog"
      onClick={() => setOpen(value => !value)}
    >
      <img className="cla-chat-launcher-image" src={claChatMascot} alt="" aria-hidden="true" />
      {open && <span className="cla-chat-launcher-close" aria-hidden="true">×</span>}
    </button>
  </div>;
}
