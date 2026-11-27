import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  route: string;
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * A failed lazy route or render must never collapse the entire student app
 * into a blank screen. Keep this boundary outside the authorized provider so
 * it also catches provider/route initialization failures.
 */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`CLA route render failed (${this.props.route})`, error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="cla-access-screen" role="alert">
        <section className="cla-access-panel" aria-labelledby="cla-route-error-title">
          <span className="cla-access-eyebrow">COGNITIVE LEARN AI · KHÔI PHỤC TRANG</span>
          <h1 id="cla-route-error-title">Không thể mở phân hệ này</h1>
          <p>
            Trang <code>{this.props.route}</code> gặp lỗi khi khởi tạo. Lỗi đã được ghi vào Console
            để có thể xác định chính xác thành phần gây ra sự cố.
          </p>
          <details>
            <summary>Chi tiết lỗi</summary>
            <pre>{error.message || "Lỗi khởi tạo không có thông báo."}</pre>
          </details>
          <div className="cla-access-actions">
            <button type="button" onClick={() => window.location.reload()}>Tải lại trang</button>
            <a href="/student">Về trang học sinh</a>
          </div>
        </section>
      </main>
    );
  }
}
