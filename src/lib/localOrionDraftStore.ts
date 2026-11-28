import { DraftConflictError } from "./draftRevision";

export type LocalOrionDraftRecord<T extends Record<string, unknown> = Record<string, unknown>> = {
  uid: string;
  revision: number;
  data: T;
  updatedAt: number;
};

const DATABASE_NAME = "cla-orion-local-demo";
const DATABASE_VERSION = 1;
const STORE_NAME = "drafts";

export function canUseLocalOrionDraftFallback(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  return window.location.protocol === "http:"
    && ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Trình duyệt không hỗ trợ IndexedDB."));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "uid" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không mở được kho Orion cục bộ."));
    request.onblocked = () => reject(new Error("Kho Orion cục bộ đang bị khóa bởi tab khác. Hãy đóng tab CLA trùng."));
  });
}

export async function readLocalOrionDraft<T extends Record<string, unknown> = Record<string, unknown>>(
  uid: string,
): Promise<LocalOrionDraftRecord<T> | null> {
  if (!uid) throw new Error("Thiếu UID; từ chối đọc bản nháp cục bộ.");
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(uid);
    let result: LocalOrionDraftRecord<T> | null = null;
    request.onsuccess = () => {
      const value = request.result as LocalOrionDraftRecord<T> | undefined;
      if (value && value.uid === uid && Number.isSafeInteger(value.revision) &&
          value.revision >= 1 && value.data && typeof value.data === "object" && !Array.isArray(value.data)) {
        result = value;
      }
    };
    transaction.oncomplete = () => { database.close(); resolve(result); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error("Không đọc được bản nháp Orion cục bộ.")); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("Lỗi đọc IndexedDB.")); };
  });
}

export async function writeLocalOrionDraft<T extends Record<string, unknown>>(
  uid: string, data: T, expectedRevision: number,
): Promise<LocalOrionDraftRecord<T>> {
  if (!uid) throw new Error("Thiếu UID; từ chối lưu bản nháp cục bộ.");
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(uid);
    let result: LocalOrionDraftRecord<T> | null = null;
    let failure: Error | null = null;
    request.onsuccess = () => {
      const current = request.result as LocalOrionDraftRecord | undefined;
      const currentRevision = current?.uid === uid && Number.isSafeInteger(current.revision) ? current.revision : 0;
      if (currentRevision !== expectedRevision) {
        failure = new DraftConflictError();
        transaction.abort();
        return;
      }
      result = { uid, revision: currentRevision + 1, data, updatedAt: Date.now() };
      store.put(result);
    };
    request.onerror = () => { failure = request.error ?? new Error("Không đọc được phiên bản Orion cục bộ."); transaction.abort(); };
    transaction.oncomplete = () => {
      database.close();
      if (result) resolve(result);
      else reject(new Error("Không xác nhận được bản lưu Orion cục bộ."));
    };
    transaction.onabort = () => { database.close(); reject(failure ?? transaction.error ?? new Error("Không lưu được bản nháp Orion cục bộ.")); };
    transaction.onerror = () => { database.close(); reject(failure ?? transaction.error ?? new Error("Lỗi ghi IndexedDB.")); };
  });
}
