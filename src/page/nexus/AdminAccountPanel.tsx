/** Optional CP29 K15 admin console. All authorization is checked on the server. */
import { useState, type FormEvent } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../lib/firebase';

type Action = 'inspect' | 'set-active' | 'set-role';
type Role = 'student';
type Reply = { status: string; requestId: string; targetUid: string; role: string; active: boolean };
const enabled = import.meta.env.VITE_CLA_ADMIN_ACCOUNTS_ENABLED === 'true';

export default function AdminAccountPanel() {
  const [uid, setUid] = useState('');
  const [ticket, setTicket] = useState('');
  const [action, setAction] = useState<Action>('inspect');
  const [active, setActive] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [pending, setPending] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [reply, setReply] = useState<Reply | null>(null);
  const [error, setError] = useState('');
  const changeInputs = () => { setRequestId(null); setReply(null); setError(''); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !enabled) return;
    const user = auth.currentUser;
    if (!user) { setError('Chưa đăng nhập.'); return; }
    if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid) || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]{5,79}$/.test(ticket)) {
      setError('UID hoặc mã yêu cầu kiểm toán không hợp lệ.'); return;
    }
    if (uid === user.uid) { setError('Không cho phép quản trị chính tài khoản đang đăng nhập.'); return; }
    if (action !== 'inspect' && !window.confirm(`Xác nhận ${action} đối với UID ${uid}? Hành động sẽ được ghi audit.`)) return;
    try {
      setPending(true); setError(''); setReply(null);
      const token = await user.getIdTokenResult(true);
      if (token.claims.claOperator !== true || !token.signInSecondFactor) {
        setError('Tài khoản thiếu quyền operator độc lập hoặc phiên đăng nhập MFA. Không thể thao tác.'); return;
      }
      const id = requestId ?? crypto.randomUUID();
      setRequestId(id);
      const fn = httpsCallable(getFunctions(auth.app, 'asia-southeast1'), 'claAdminAccountOperation');
      const result = await fn({action, targetUid:uid, requestId:id, ticket,
        ...(action === 'set-active' ? {active} : {}), ...(action === 'set-role' ? {role} : {})});
      setReply(result.data as Reply);
      setRequestId(null);
    } catch {
      setError('Backend từ chối hoặc không khả dụng. Không suy đoán giao dịch đã hoàn thành; thử lại sẽ dùng cùng requestId.');
    } finally { setPending(false); }
  }

  return (
    <section className="student-panel" aria-labelledby="cla-admin-accounts-title" style={{padding:20,marginTop:18}}>
      <h2 id="cla-admin-accounts-title">Quản trị tài khoản có truy vết — chỉ qua backend</h2>
      <p>Chế độ này mặc định TẮT. Yêu cầu operator được cấp ngoài ứng dụng, UID trong allowlist,
        xác thực đa yếu tố, đăng nhập gần đây và Admin đang hoạt động. Không tạo Admin, không liệt kê tài khoản,
        không đọc hồ sơ học sinh hay xóa Firebase Authentication.</p>
      {!enabled && <p role="status"><strong>NOT DEPLOYED / DISABLED.</strong> Chưa bật backend quản trị và cấu hình giao diện. Không có thao tác thật nào khả dụng.</p>}
      <form onSubmit={e => void submit(e)} style={{display:'grid',gap:12,maxWidth:580}}>
        <label>UID tài khoản cần kiểm tra
          <input value={uid} onChange={e => {changeInputs();setUid(e.target.value.trim());}}
            placeholder="UID cụ thể (không phải email)" autoComplete="off" required minLength={6} maxLength={128} />
        </label>
        <label>Mã yêu cầu kiểm toán
          <input value={ticket} onChange={e => {changeInputs();setTicket(e.target.value.trim());}}
            placeholder="Ví dụ: TICKET-2026-001" required minLength={6} maxLength={80} />
        </label>
        <label>Hành động
          <select value={action} onChange={e => {changeInputs();setAction(e.target.value as Action);}}>
            <option value="inspect">Kiểm tra trạng thái (có audit)</option>
            <option value="set-active">Khóa / kích hoạt lại tài khoản</option>
            <option value="set-role">Chuyển tài khoản cũ sang học sinh (có xác nhận)</option>
          </select>
        </label>
        {action === 'set-active' && (
          <label>Trạng thái mới
            <select value={String(active)} onChange={e => {changeInputs();setActive(e.target.value === 'true');}}>
              <option value="false">Khóa quyền ứng dụng (active=false)</option>
              <option value="true">Kích hoạt quyền ứng dụng (active=true)</option>
            </select>
          </label>
        )}
        {action === 'set-role' && (
          <label>Vai trò mới
            <select value={role} onChange={e => {changeInputs();setRole(e.target.value as Role);}}>
              <option value="student">Student</option>
            </select>
          </label>
        )}
        <button type="submit" disabled={!enabled || pending}>{pending ? 'Đang xác minh…' : 'Gửi yêu cầu có audit'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {reply && <p role="status">{reply.status}: UID đã xác nhận, vai trò {reply.role}, active={String(reply.active)}. Audit request: {reply.requestId}</p>}
      <p style={{marginTop:16}}>Chú ý: đặt active=false thu hồi quyền Firestore theo Rules ứng viên nhưng
        <strong> không đồng nghĩa đã vô hiệu hóa Firebase Auth hoặc các bản sao/cache/offline.</strong>
        Chức năng chưa được nghiệm thu production.</p>
    </section>
  );
}
