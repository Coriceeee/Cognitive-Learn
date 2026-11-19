
import { checkAccountDocument, type AccountRole } from "../src/lib/accountVerification";
declare const db: unknown;
declare function doc(...args: unknown[]): unknown;
declare function getDocFromServer(ref: unknown): Promise<{ exists(): boolean; data(): unknown }>;
declare function readAccountDocumentWithRetry<T>(read: () => Promise<T>): Promise<T>;
declare function setMessage(value: string): void;
declare function redirectByRole(role: AccountRole): void;
async function verifyAndRedirect(uid: string) {
    const snapshot = await readAccountDocumentWithRetry(() =>
      getDocFromServer(doc(db, "users", uid)),
    );
    const account = checkAccountDocument(snapshot.exists(), snapshot.exists() ? snapshot.data() : null);
    if (account.status !== "ready") {
      if (account.status === "no-profile") {
        setMessage("Firebase đã xác thực, nhưng chưa có hồ sơ users/{uid}. Cần cấp hồ sơ hợp lệ trong đúng Firebase Project.");
      } else if (account.status === "inactive") {
        setMessage("Tài khoản chưa có active: true hoặc đang bị khóa. Hãy kiểm tra hồ sơ trong Firestore.");
      } else {
        setMessage("Vai trò tài khoản không hợp lệ. Cần kiểm tra trường role trong Firestore.");
      }
      return;
    }
    redirectByRole(account.role);
  }
