/**
 * Serialize writes from one mounted draft hook. A failed write must not block
 * later edits; eligibility is checked when a queued write actually starts.
 */
export function createDraftWriteQueue() {
  let tail: Promise<void> = Promise.resolve();
  return {
    enqueue<T>(write: () => Promise<T>): Promise<T> {
      const current = tail.then(write);
      tail = current.then(() => undefined, () => undefined);
      return current;
    },
  };
}
