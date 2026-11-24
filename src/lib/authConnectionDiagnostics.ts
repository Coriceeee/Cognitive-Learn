/**
 * CP90: read-only browser probe for Firebase Auth connectivity.
 * NEVER logs, returns, or stores the Web API key, credentials, ID tokens or UID.
 * This does not log in, create users, modify Firestore or relax access controls.
 */
export type AuthProbeCode =
  | 'WRONG_PROJECT' | 'EMULATOR_MODE' | 'NO_API_KEY' | 'BROWSER_OFFLINE'
  | 'AUTH_HTTP_REJECTED' | 'AUTH_NETWORK_BLOCKED' | 'AUTH_TIMEOUT'
  | 'AUTH_HOST_REACHABLE';

export type AuthProbeResult = { code: AuthProbeCode; message: string };
export type AuthProbeInput = {
  projectId?: string;
  apiKey?: string;
  authEmulator: boolean;
  browserOnline: boolean;
};

const EXPECTED_PROJECT = 'cognitive-learn-ai';

export async function probeFirebaseAuthConnection(
  input: AuthProbeInput,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<AuthProbeResult> {
  if (input.projectId !== EXPECTED_PROJECT) return {
    code: 'WRONG_PROJECT',
    message: 'Ứng dụng đang trỏ sang Firebase Project khác. Hãy khởi động Vite bằng --mode live và kiểm tra VITE_FIREBASE_PROJECT_ID trong .env.live.local.',
  };
  if (input.authEmulator) return {
    code: 'EMULATOR_MODE',
    message: 'Trình duyệt đang kết nối Firebase Emulator, không phải tài khoản Firebase thật. Dùng --mode live và VITE_USE_FIREBASE_EMULATORS=false.',
  };
  if (!input.apiKey?.trim() || /^fake-|^demo-|^your[-_]/i.test(input.apiKey)) return {
    code: 'NO_API_KEY',
    message: 'Firebase Web API key của Web App thật đang thiếu hoặc là giá trị thử nghiệm. Kiểm tra cấu hình .env.live.local, không dán key vào chat.',
  };
  if (!input.browserOnline) return {
    code: 'BROWSER_OFFLINE',
    message: 'Trình duyệt báo đang ngoại tuyến. Kiểm tra kết nối Internet rồi thử lại.',
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(
      `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(input.apiKey)}`,
      { method: 'GET', credentials: 'omit', cache: 'no-store', signal: controller.signal },
    );
    if (response.ok) return {
      code: 'AUTH_HOST_REACHABLE',
      message: 'Trình duyệt truy cập được máy chủ Firebase Auth. Nếu đăng nhập vẫn lỗi, mở F12 → Network và kiểm tra yêu cầu accounts:signInWithPassword (trạng thái HTTP hoặc blocked/failed); không gửi mật khẩu hay URL chứa key.',
    };
    return {
      code: 'AUTH_HTTP_REJECTED',
      message: `Firebase phản hồi HTTP ${response.status}. Kiểm tra Web API key, giới hạn HTTP referrer/API, Identity Toolkit API và cấu hình Firebase Project thật.`,
    };
  } catch (error) {
    const isTimeout = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
    return isTimeout ? {
      code: 'AUTH_TIMEOUT',
      message: 'Kết nối tới identitytoolkit.googleapis.com quá thời gian. Kiểm tra DNS, VPN/proxy, tường lửa và thử bằng mạng khác.',
    } : {
      code: 'AUTH_NETWORK_BLOCKED',
      message: 'Trình duyệt không truy cập được identitytoolkit.googleapis.com. Thử tắt tiện ích chặn quảng cáo/bảo mật trên trang CLA, kiểm tra VPN/proxy/DNS và Network → blocked/failed.',
    };
  } finally {
    clearTimeout(timer);
  }
}
