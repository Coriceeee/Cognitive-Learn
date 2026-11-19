# CLA — CP42 Spectral Observatory

Bản nâng cấp giao diện trang /student trên base CP42 Student Observatory. Thiết kế scientific-tech: nền navy sâu tại vùng phân tích, ba vòng phổ SCI/MAS/CSL có thang 0–100, cột GPA có độ cao theo dữ liệu đã đối soát, đường quan sát và EMA, các liên kết workflow. Vùng bên ngoài sáng và các workspace hiện có vẫn được giữ nguyên. Không thêm dữ liệu thật, không đổi công thức hoặc model, API, Firestore Rules, các route hoặc quyền truy cập.

## Áp dụng
Sao lưu source hiện tại. Giải nén patch tại thư mục gốc dự án CP42 Student Observatory, hoặc dùng full source đi kèm. Patch sửa `src/styles.css`, `src/page/seed/StudentPage.tsx`, `src/page/seed/components/StudentDecisionCanvas.tsx` và thêm `src/styles/35-cla-spectral-observatory.css`. Sau đó `npm ci`, `npm run build`, `npm run dev` tại máy phát triển đã cấu hình Firebase. Không thay secret hoặc publish Rules.

## Kiểm tra
- Chart-first: 7/7 PASS; Focused Workspaces: 10/10 PASS; layout PASS.
- TypeScript transpile syntax: 2 file TSX PASS (không phải full typecheck).
- Preview dựng từ component với fixture demo và fixture thiếu dữ liệu. Chromium: 1440px và 390px không tràn ngang; chuyển lựa chọn chỉ số biểu đồ thành công. Preview không kết nối Firebase, không phải production, điều hướng thật không được kiểm thử.
- Chưa xác nhận full build do môi trường thiếu node_modules dự án. Giao diện ngoài trang tổng quan chưa được chuyển sang ngôn ngữ Spectral Observatory.
