> **Cập nhật kiến trúc 08/11/2026:** Du học được chuyển thành phân hệ của Atlas theo [đặc tả V4](specifications/CLA_MODULE_HIERARCHY_V4_20261108.md); các mô tả Haven ở bản release note này là lịch sử, không còn là cấu trúc áp dụng.

# CLA CP25 — Chatbot nổi + Du học + Tra cứu tuyển sinh 2024–2026

Ngày 08/11/2026. Bản này mở rộng CP24 đã đạt 53 Node + 15 Rules tĩnh + 42 Firestore Emulator và full Vite build trên Windows theo log người dùng. **CP25 vẫn phải chạy xác minh độc lập**. Không deploy Rules production từ bản ZIP.

## 1. Mã đã thêm

- `src/components/common/FloatingAdvisorChat.tsx`: chatbot nổi sau đăng nhập, gửi tin qua backend; có trạng thái loading/error, xóa hội thoại, giới hạn số lượt trong context, không lưu lịch sử vào Firestore.
- `api/gemini-chat.ts`: backend nhận token Firebase, xác thực tài khoản, `active`, role; có giới hạn request tại instance, CORS chính xác và timeout Gemini. **Không truy xuất profile/điểm học sinh cho chat**.
- `src/page/atlas/components/OfficialAdmissionsExplorer.tsx`: tra năm 2024/2025/2026, lọc phương thức/ngành, liên kết nguồn gốc của 3 trường (PTIT, HUST, FTU). Kho thí điểm 10 ngành PTIT BVH đã đối chiếu điểm THPT 2024 và 2025; năm 2026 có đường dẫn thông báo điểm chuẩn của trường nhưng **chưa trích mọi điểm từng ngành**.
- `src/page/study-abroad/StudyAbroadPage.tsx`: Nhật, Hàn, Singapore, Đức, Anh, Úc; chứng chỉ, học thuật, hồ sơ học bổng; liên kết trực tiếp trang nhập học của 8 trường quốc tế.
- `vercel.json`: rewrite `/study-abroad` về SPA; **không rewrite `/api/*`**.
- `tests/admissions-and-chat.test.mjs`: 12 bài kiểm thử logic và kiểm tra cấu trúc.
- `docs/CP25_CHECKLIST_GAPS_20261108.md`: đối chiếu 145/145 mục Master V3 và 20 khoảng trống mới.

## 2. Một số nguồn trực tiếp đã kiểm tra (08/11/2026)

- PTIT 2026: https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/
- PTIT điểm chuẩn 2026: https://tuyensinh.ptit.edu.vn/thong-bao-diem-chuan-trung-tuyen-vao-dai-hoc-he-chinh-quy-nam-2026/
- PTIT điểm 2025: https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-nam-2025/
- HUST 2026: https://ts.hust.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026
- FTU 2026: https://qldt.ftu.edu.vn/category/tuyen-sinh/tuyen-sinh-dai-hoc-chinh-quy-2025/thong-tin-tuyen-sinh-chung-2026/
- NUS international admissions: https://www.nus.edu.sg/oam/admissions/international-qualifications-for-foreigners
- NUS scholarship: https://nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students
- 2027 Korean GKS: https://www.studyinkorea.go.kr/ko/notice/scholarshipsRead.do?bbsId=BBSMSTR_000000000461&nttId=4522

**Giới hạn:** URL, deadline và yêu cầu có thể thay đổi. Tag lĩnh vực của trường không chứng minh có ngành ở mỗi năm. Chênh lệch điểm lịch sử không phải xác suất đỗ, việc có JLPT/IELTS không phải tự động đủ điều kiện học bổng.

## 3. Chuẩn bị trên Windows

1. Giải nén bản full vào workspace sạch, ví dụ `C:\CLA-CP25\Cognitive-Learn`.
2. Đặt `.env.local` theo `.env.example` cho phần **VITE_FIREBASE_***; không chia sẻ/commit file chứa giá trị thật.
3. Nếu deploy Vercel, đặt biến **server-side** `GEMINI_API_KEY`, `GEMINI_MODEL` (tùy chọn), `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID`. Đặt `CORS_ALLOWED_ORIGINS` nếu frontend và API ở hai domain khác nhau. Không bao giờ đặt Gemini private key dưới tiền tố `VITE_`.
4. Chat tại `/api/gemini-chat` hoạt động với backend Vercel; `vite dev` đơn thuần không cung cấp API serverless. Nếu dùng frontend/backend khác origin, cấu hình `VITE_API_BASE_URL=https://...` và CORS tương ứng.
5. Chạy:

```powershell
npm ci
npm run verify:cp25
```

Báo cáo: `docs/checkpoints/CP25_VERIFY_LOCAL.json`. Lệnh này không deploy. Nếu muốn thử phần tĩnh: `npm run verify:cp25:static`.

## 4. Test evidence

| Gate | Trạng thái |
|---|---|
| CP25 test mới | 12/12 PASS, chạy tại môi trường đóng gói |
| Rules static | 15/15 PASS |
| Layout | PASS |
| CP25 TypeScript parse (11 file) | 11/11 không có lỗi cú pháp (không thay typecheck) |
| CP25 npm ci/full typecheck/Vite build | **NOT VERIFIED** tại môi trường đóng gói do cài dependency không hoàn tất |
| CP25 42 Firestore Emulator | Chỉ PASS trên CP24 theo log Windows; CP25 chưa chạy lại |
| Chat API thật, 4 vai trò, browser E2E, production smoke | **NOT RUN** |
| Research 120-case LLM (nhiều lượt) | **NOT RUN** — bộ template không phải kết quả AI |

## 5. Không được hiểu sai phạm vi

Bộ danh mục 3 trường trong nước/8 trường quốc tế chỉ là hạt giống dữ liệu có nguồn; chưa đủ để khuyên chọn nguyện vọng toàn quốc. Cần mở rộng mã ngành năm–cơ sở, điểm chuẩn đúng thang, quy đổi các phương thức, điều kiện chứng chỉ và học bổng theo từng chương trình, đối chiếu năm hiện hành, và E2E đọc hồ sơ thực mới có thể nghiệm thu các hạng mục E4/E7/K11/G1–G4.
