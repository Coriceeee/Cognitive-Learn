/**
 * Account roles are verified using a fresh Firestore server read by the caller.
 * Never use a cached role, a selected UI tab, or the email address to grant Admin access.
 */
export type AccountRole = "student" | "admin";
export type AccountCheck =
  | { status: "ready"; role: AccountRole }
  | { status: "no-profile" | "inactive" | "invalid-role" };

type ReadRetryOptions = {
  maxAttempts?: number;
  pause?: (milliseconds: number) => Promise<void>;
};

export function checkAccountDocument(exists: boolean, data: unknown): AccountCheck {
  if (!exists || typeof data !== "object" || data === null) {
    return { status: "no-profile" };
  }

  const profile = data as Record<string, unknown>;
  // Only an explicitly active account is admitted. A missing `active` is not approval.
  if (profile.active !== true) return { status: "inactive" };
  const role = profile.role;
  if (role !== "student" && role !== "admin") {
    return { status: "invalid-role" };
  }
  return { status: "ready", role };
}

export function firebaseErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "unknown";
  const code = String(error.code);
  return code.startsWith("firestore/") ? code.slice("firestore/".length) : code;
}

export function isTemporaryFirestoreFailure(error: unknown): boolean {
  const code = firebaseErrorCode(error);
  return code === "unavailable" || code === "deadline-exceeded" || code === "aborted";
}

const normalPause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/** Bounded retry for transient network errors; never retries or bypasses permission denials. */
export async function readAccountDocumentWithRetry<T>(
  readFromServer: () => Promise<T>,
  options: ReadRetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.max(1, Math.min(3, Math.trunc(options.maxAttempts ?? 3)));
  const pause = options.pause ?? normalPause;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await readFromServer();
    } catch (error) {
      if (!isTemporaryFirestoreFailure(error) || attempt === maxAttempts) throw error;
      await pause(attempt === 1 ? 350 : 800);
    }
  }
  throw new Error("Account verification did not complete");
}


/** Safe, user-visible diagnosis; never print UID, tokens, email, secrets or raw SDK messages. */
export type AccessCheckpoint = "account-read" | "consent-read" | "account-watch" | "consent-watch" | "auth-stream";
export type AccessFailureInfo = {
  checkpoint: AccessCheckpoint;
  location: string;
  code: string;
  guidance: string;
  retryable: boolean;
};

export function explainAccessFailure(error: unknown, checkpoint: AccessCheckpoint): AccessFailureInfo {
  const rawCode = firebaseErrorCode(error);
  // Only display known, non-sensitive Firebase codes to users.
  const allowedCodes = new Set([
    "permission-denied", "unauthenticated", "unavailable", "deadline-exceeded",
    "failed-precondition", "resource-exhausted", "aborted", "cancelled",
    "auth/network-request-failed", "auth/user-token-expired", "unknown",
  ]);
  const code = allowedCodes.has(rawCode) ? rawCode : "unknown";
  const isConsent = checkpoint === "consent-read" || checkpoint === "consent-watch";
  const isAuth = checkpoint === "auth-stream";
  const location = isAuth ? "Firebase Authentication" : isConsent
    ? "student_consents/{uid}" : "users/{uid}";
  if (code === "permission-denied") {
    return {
      checkpoint, location, code, retryable: false,
      guidance: isConsent
        ? "Firestore Rules trên dự án THẬT chưa cho tài khoản đọc quyết định dữ liệu của chính mình. Kiểm tra rule GET tại student_consents/{uid}; Consent Gate đang bật. Đừng tắt kiểm soát quyền để vượt lỗi."
        : "Firestore Rules trên dự án THẬT đang từ chối quyền GET hồ sơ users/{uid}. Kiểm tra rule và tài khoản đang kết nối đúng Firebase Project; không cần xóa hay tạo lại tài khoản.",
    };
  }
  if (code === "unauthenticated" || code === "auth/user-token-expired") {
    return {checkpoint, location, code, retryable: false, guidance:
      "Phiên xác thực không còn hợp lệ. Đăng xuất rồi đăng nhập lại bằng tài khoản cũ; không tạo tài khoản mới."};
  }
  if (code === "unavailable" || code === "deadline-exceeded" || code === "auth/network-request-failed") {
    return {checkpoint, location, code, retryable: true, guidance:
      "Không kết nối được máy chủ Firebase. Kiểm tra kết nối mạng, VPN/DNS, tiện ích chặn mạng và cấu hình Firebase live; sau đó thử lại."};
  }
  if (code === "resource-exhausted") {
    return {checkpoint, location, code, retryable: false, guidance:
      "Dịch vụ Firestore đang báo vượt hạn mức hoặc giới hạn tài nguyên. Kiểm tra Firebase Console → Usage / Quotas."};
  }
  return {checkpoint, location, code, retryable: code === "aborted" || code === "cancelled", guidance:
    "Chưa xác định được lý do máy chủ từ chối. Mở Developer Tools → Console, xem lỗi gốc của AccessGate; kiểm tra Firebase Project, Firestore Rules và kết nối."};
}
