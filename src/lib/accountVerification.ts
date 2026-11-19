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
