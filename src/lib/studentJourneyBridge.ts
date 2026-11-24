/**
 * CP70 student-only journey handoff. Describes navigation from verified records;
 * never derives academic success, psychological traits, or admissions chances.
 */
import { analyzeJourney, type JourneyCycle } from "./closedLoopJourney.ts";

export type StudentJourneyPhase = "sign-in" | "profile" | "waiting" | "error" | "new" | "check-in" | "reassess" | "reviewed";
export type StudentJourneyHandoff = {
  phase: StudentJourneyPhase;
  title: string;
  description: string;
  primaryLabel: string | null;
  primaryHref: string | null;
  currentModule: "seed" | "orion" | "pulse" | "lumen" | null;
  checkIns: number | null;
  plannedWeeks: number | null;
  sourceNote: string;
};
export type StudentJourneyInput = {
  uid: string;
  signedOut: boolean;
  status: "loading" | "syncing" | "ready" | "empty" | "signed-out" | "error";
  fromServer: boolean;
  hasProfile: boolean;
  latest: JourneyCycle | null;
};
const NO_DATA_NOTE = "Chưa có dữ liệu chu kỳ được máy chủ xác nhận. Không hiển thị số liệu từ cache.";
const SELF_REPORT_NOTE = "Chu kỳ đã được máy chủ xác nhận; check-in và điểm đo lại do học sinh tự báo cáo, chưa được xác thực độc lập.";

export function buildStudentJourneyHandoff(input: StudentJourneyInput): StudentJourneyHandoff {
  const base = { checkIns: null, plannedWeeks: null, sourceNote: NO_DATA_NOTE };
  if (input.signedOut || input.status === "signed-out") {
    return { ...base, phase: "sign-in", title: "Đăng nhập để tiếp tục hành trình", description: "Thông tin học tập chỉ hiển thị với đúng tài khoản.", primaryLabel: null, primaryHref: null, currentModule: null };
  }
  if (!input.uid) {
    return { ...base, phase: "waiting", title: "Đang xác minh tài khoản", description: "Chờ Firebase xác nhận phiên đăng nhập.", primaryLabel: null, primaryHref: null, currentModule: null };
  }
  // A student may create their Seed profile without waiting for the journey collection.
  // This does NOT expose an unverified cycle or grant write permission to it.
  if (!input.hasProfile) {
    return { ...base, phase: "profile", title: "Bắt đầu từ Seed", description: "Hoàn thiện hồ sơ và bảng điểm để có dữ liệu đặt mục tiêu học tập.", primaryLabel: "Hoàn thiện hồ sơ", primaryHref: "/student/profile", currentModule: "seed" };
  }
  if (input.status === "error") {
    return { ...base, phase: "error", title: "Chưa xác minh được chu kỳ", description: "Không sử dụng dữ liệu cũ để đưa ra hành động tiếp theo. Kiểm tra kết nối và quyền truy cập Firebase.", primaryLabel: null, primaryHref: null, currentModule: null };
  }
  if (input.status === "loading" || input.status === "syncing" || !input.fromServer) {
    return { ...base, phase: "waiting", title: "Đang xác minh chu kỳ học tập", description: "Chờ Firestore xác nhận dữ liệu trước khi hiện tiến trình hoặc cho phép cập nhật.", primaryLabel: null, primaryHref: null, currentModule: null };
  }
  if (!input.latest) {
    return { ...base, phase: "new", title: "Phân tích năng lực trước khi chọn mục tiêu", description: "Xem phân tích và kịch bản dự báo tại Lumen, khám phá tổ hợp/ngành/trường ở Atlas rồi lập chiến lược ở Orion. Bạn vẫn có thể vào trực tiếp bất kỳ phân hệ nào.", primaryLabel: "Xem phân tích ở Lumen", primaryHref: "/lumen/advanced", currentModule: "lumen" };
  }
  if (input.latest.userId !== input.uid) {
    return { ...base, phase: "error", title: "Chu kỳ không khớp tài khoản", description: "Đã ẩn dữ liệu chu kỳ; không trộn hồ sơ giữa các tài khoản.", primaryLabel: null, primaryHref: null, currentModule: null };
  }
  const cycle = input.latest;
  const confirmed = { checkIns: cycle.checkIns.length, plannedWeeks: cycle.weeksLeft, sourceNote: SELF_REPORT_NOTE };
  const assessment = analyzeJourney(cycle);
  if (cycle.status === "REVIEWED") {
    return { ...confirmed, phase: "reviewed", title: "Đã tổng kết chu kỳ gần nhất", description: "Xem bằng chứng và giới hạn diễn giải tại Lumen, rồi quyết định có tạo chu kỳ tiếp theo tại Orion hay không.", primaryLabel: "Xem bằng chứng ở Lumen", primaryHref: "/lumen/evidence", currentModule: "lumen" };
  }
  if (assessment.stage === "READY_TO_REASSESS") {
    return { ...confirmed, phase: "reassess", title: "Có nhật ký — sẵn sàng xem lại kế hoạch", description: "Bạn đã ghi check-in; chỉ đo lại khi có bài đánh giá thực tế, không coi nhật ký là bằng chứng tăng điểm.", primaryLabel: "Đo lại hoặc cập nhật ở Pulse", primaryHref: "/pulse/checkin", currentModule: "pulse" };
  }
  return { ...confirmed, phase: "check-in", title: "Đang thực hiện kế hoạch Orion", description: "Bắt đầu ghi nhật ký học tập tại Pulse để theo dõi số tuần và công việc thực tế.", primaryLabel: "Ghi check-in ở Pulse", primaryHref: "/pulse/checkin", currentModule: "pulse" };
}
