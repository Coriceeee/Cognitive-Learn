# CP89 — LUMEN dễ hiểu hơn, không thay đổi công thức

**Nền:** Cognitive Learn AI CP88 Full Source (giữ bố cục CP87 và bảo vệ bằng chứng CP86).

## Những gì đã thay đổi

- Trang `/lumen`: câu mở đầu dễ hiểu, nêu rõ **SEED đưa dữ liệu → LUMEN tính chỉ báo → học sinh tự xem xét → PULSE theo dõi**. Điểm tổng hợp ghi rõ là điểm **thử nghiệm**, không phải IQ.
- Trang `/lumen/indices`: hướng dẫn chia thành **3 nhóm / 7 chỉ số**. Mỗi chỉ số có tên tiếng Việt, số hiện có hoặc **Chưa có dữ liệu**, ý nghĩa, công thức/nguồn tính và bước học sinh có thể thử. Thuật ngữ tiếng Anh chuyển vào phần mở rộng.
- Radar: giữ nguyên hình và bốn giá trị SCI/MAS/CSL/CRI; ghi rõ **CRI không phải phép đo độc lập**. 7/7 là **độ đầy đủ dữ liệu, không phải độ chính xác 100%**.
- Trang `/lumen/evidence`, `/lumen/history`, `/lumen/insights`, `/lumen/advanced`: Việt hóa các nhãn tiếng Anh khó hiểu; phần nghề nghiệp làm rõ đây là **điểm chấm quy tắc**, không phải % xác suất phù hợp.
- Trang nghiên cứu: giữ mã chuẩn (ROC-AUC, MAE, RMSE) cho phần học thuật, nhưng diễn giải thêm bằng tiếng Việt.

## Phạm vi không thay đổi

- **Không chỉnh:** công thức các chỉ số, trọng số, mô hình ML, Gemini API, Firestore Rules, Firebase Auth, vai trò, tài khoản, dữ liệu học sinh, đường dẫn 6 phân hệ hoặc bố cục Dashboard.
- Nếu có điểm lưu sẵn trực tiếp, LUMEN có thể sử dụng giá trị đó theo bộ adapter hiện hành. Không được suy ra từ giao diện rằng số đó là **dữ liệu đã kiểm định hay dữ liệu thật**. Cần đối chiếu nguồn trong SEED.
- Không tự điền 70–80 khi thiếu dữ liệu; tiếp tục dùng `available` để phân biệt số 0 đã có và dữ liệu thiếu.

## Kiểm thử

- `node tools/verify-cp89-snapshot.cjs` — kiểm tra bất biến nguồn theo manifest CP89 (không dùng verifier CP88 cho release mới).
- `node --experimental-strip-types --test tests/cp89-lumen-vi-clarity.test.cjs tests/cp86-evidence-versioning.test.mjs tests/cp87-navigation-priority.test.cjs tests/cp88-full-bundle.test.cjs`.
- `npm run check:layout`, `npm run build`, `npm test` trên máy có dependencies. **Chưa nghiệm thu browser E2E hoặc Firebase thật từ môi trường đóng gói**.

## Cài vào thư mục gốc trên Windows

1. Đóng `npm run dev` trước khi cập nhật.
2. Sao lưu thư mục dự án hoặc ít nhất các tệp `src/page/lumen`, `src/page/seed/components/LearningIntelligencePanel.tsx`, `src/page/seed/components/CognitiveGrowthPanel.tsx`, `src/styles.css`.
3. Giải nén **CP89 Overlay ZIP** thẳng vào `C:\Gạo\Cognitive-Learn` (ZIP overlay không có thư mục `Cognitive-Learn` bên ngoài). Hoặc dùng bản Full ZIP tại thư mục mới nếu cần một bản nguồn độc lập.
4. Chạy `node tools/verify-cp89-snapshot.cjs`, `npm run check:layout`, `node --test tests/cp89-lumen-vi-clarity.test.cjs`, rồi `npm run build`.
5. Chạy lại website, kiểm tra `/lumen`, `/lumen/indices`, `/lumen/history`, `/lumen/evidence`, `/lumen/advanced`.

**Không deploy production chỉ vì các test giao diện tĩnh PASS.** Hai tài khoản Firebase ban đầu không bị tác động bởi bản UI này; các lỗi đăng nhập live trước đó vẫn cần kiểm tra riêng.
