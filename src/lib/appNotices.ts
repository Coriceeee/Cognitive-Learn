/** Transient, privacy-minimal in-app notifications. No push and no research data. */
export type AppNoticeKind = "success" | "error" | "reminder" | "info";
export type AppNotice = Readonly<{
  id: number;
  kind: AppNoticeKind;
  title: string;
  detail: string;
  createdAt: number;
  seen: boolean;
  visible: boolean;
  dedupeKey: string;
}>;

let notices: ReadonlyArray<AppNotice> = [];
let counter = 0;
const listeners = new Set<() => void>();
const EMPTY: ReadonlyArray<AppNotice> = Object.freeze([]);
const broadcast = () => listeners.forEach(listener => listener());

export const subscribeAppNotices = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const getAppNotices = (): ReadonlyArray<AppNotice> => notices;
export const getAppNoticesServer = (): ReadonlyArray<AppNotice> => EMPTY;

export function pushAppNotice(input: {
  kind: AppNoticeKind;
  title: string;
  detail: string;
  dedupeKey?: string;
}): void {
  const title = input.title.trim().slice(0, 90);
  const detail = input.detail.trim().slice(0, 260);
  if (!title || !detail) return;
  const timestamp = Date.now();
  const dedupeKey = input.dedupeKey || `${input.kind}:${title}:${detail}`;
  const existing = notices.find(item => item.dedupeKey === dedupeKey && timestamp - item.createdAt < 45_000);
  if (existing) return; // suppress duplicate re-render, repeated network events
  notices = [{ id: ++counter, kind: input.kind, title, detail, createdAt: timestamp,
    seen: false, visible: true, dedupeKey }, ...notices].slice(0, 20);
  broadcast();
}

export function dismissAppToast(id: number): void {
  if (!notices.some(item => item.id === id && item.visible)) return;
  notices = notices.map(item => item.id === id ? {...item, visible: false} : item);
  broadcast();
}
export function markAppNoticesRead(): void {
  if (!notices.some(item => !item.seen)) return;
  notices = notices.map(item => ({...item, seen: true}));
  broadcast();
}
export function clearAppNotices(): void {
  if (!notices.length) return;
  notices = [];
  broadcast();
}
