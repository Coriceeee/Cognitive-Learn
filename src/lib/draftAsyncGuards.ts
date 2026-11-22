/**
 * Pure guards for the lifetime of a Firestore draft listener and a destructive
 * refresh. The listener epoch is deliberately separate from the write session:
 * accepting a remote draft cancels queued writes, but must NOT disable its
 * existing realtime subscription.
 */
export function currentDraftListener(
  expectedUid: string,
  expectedEpoch: number,
  actualUid: string | null | undefined,
  actualEpoch: number,
  mounted: boolean,
): boolean {
  return mounted && expectedUid.length > 0 && expectedUid === actualUid && expectedEpoch === actualEpoch;
}

export class DraftRefreshInterruptedError extends Error {
  constructor() {
    super("Bạn đã chỉnh sửa dữ liệu trong lúc tải bản mới nhất. Đã giữ lại nội dung đang nhập; hãy tải lại nếu muốn bỏ các thay đổi đó.");
    this.name = "DraftRefreshInterruptedError";
  }
}

export function assertDraftRefreshUninterrupted(requestEditGeneration: number, currentEditGeneration: number): void {
  if (requestEditGeneration !== currentEditGeneration) throw new DraftRefreshInterruptedError();
}
