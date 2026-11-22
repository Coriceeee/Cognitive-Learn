/** CP66: display-only status resolver. It cannot mark Firestore data verified. */
export type ModuleUiTone = 'loading' | 'warning' | 'error' | 'success' | 'neutral';
export type DraftUiStatus = 'loading' | 'syncing' | 'empty' | 'ready' | 'signed-out' | 'error';
export type AutosaveUiStatus = 'idle' | 'saving' | 'saved' | 'pending';
export type DraftStatusArgs = {
  status: DraftUiStatus;
  error?: string;
  conflict: boolean;
  saving: boolean;
  notice?: string;
  noticeTone?: 'success' | 'warning' | 'error';
  autosave?: AutosaveUiStatus;
  dirty?: boolean;
};
export type ModuleUiPresentation = { tone: ModuleUiTone; label: string; message: string };

export function resolveDraftUiStatus(input: DraftStatusArgs): ModuleUiPresentation {
  // Never show an old 'saved' notice while another device has changed the draft.
  if (input.conflict) return { tone: 'error', label: 'Xung đột dữ liệu', message: 'Có thay đổi trên thiết bị khác. Các chỉnh sửa trên máy này vẫn được giữ; tải bản mới nhất sẽ bỏ các chỉnh sửa đó.' };
  if (input.saving) return { tone: 'loading', label: 'Đang lưu', message: 'Đang gửi bản nháp lên máy chủ. Chưa được xác nhận đã lưu.' };
  // Verified status always wins over stale notices when signed out, disconnected, or syncing.
  if (input.status === 'signed-out') return { tone: 'warning', label: 'Chưa đăng nhập', message: 'Đăng nhập để lưu và đồng bộ bản nháp.' };
  if (input.status === 'error') return { tone: 'error', label: 'Không thể đồng bộ', message: input.error || 'Không thể xác minh bản nháp. Hãy kiểm tra kết nối và quyền truy cập.' };
  if (input.status === 'syncing') return { tone: 'loading', label: 'Chờ xác minh', message: 'Đang chờ Firestore xác minh bản nháp từ máy chủ; dữ liệu cache chưa phải dữ liệu đã đồng bộ.' };
  if (input.status === 'loading') return { tone: 'loading', label: 'Đang tải', message: 'Đang tải dữ liệu đã lưu từ máy chủ…' };
  if (input.notice && input.noticeTone === 'error') return { tone: 'error', label: 'Thao tác chưa thành công', message: input.notice };
  if (input.autosave === 'pending') return { tone: 'warning', label: 'Chưa lưu được', message: input.noticeTone === 'warning' && input.notice ? input.notice : 'Tự lưu chưa thành công. Kiểm tra dữ liệu và chọn Lưu dữ liệu để thử lại.' };
  if (input.autosave === 'saving') return { tone: 'loading', label: 'Đang tự lưu', message: 'Đang tự lưu bản nháp; chưa xác nhận thành công.' };
  if (input.dirty) return { tone: 'warning', label: 'Chưa lưu thay đổi', message: 'Bạn có chỉnh sửa mới chưa được xác nhận lưu trên máy chủ.' };
  if (input.notice && input.noticeTone === 'warning') return { tone: 'warning', label: 'Còn thay đổi', message: input.notice };
  if (input.notice && input.noticeTone === 'success') return { tone: 'success', label: 'Đã xác nhận', message: input.notice };
  if (input.autosave === 'saved') return { tone: 'success', label: 'Đã tự lưu', message: 'Bản nháp đã được máy chủ xác nhận lưu.' };
  if (input.status === 'empty') return { tone: 'neutral', label: 'Chưa có bản nháp', message: 'Chưa có bản nháp đã lưu. Bạn có thể nhập thông tin và lưu.' };
  return { tone: 'success', label: 'Đã đồng bộ', message: 'Bản nháp đã được Firestore xác minh từ máy chủ.' };
}
