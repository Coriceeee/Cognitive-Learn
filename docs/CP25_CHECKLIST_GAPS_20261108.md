# COGNITIVE LEARN AI — AUDIT CHECKLIST 145 MỤC SAU BẢN MỞ RỘNG CP25

Ngày đánh giá: 08/11/2026. So Master V3, tracker CP24 và mã nguồn CP25; cập nhật theo bằng chứng đã thấy, không coi file UI hoặc URL là runtime nghiệm thu.

## Tổng quan

- **145/145 mục** (Website 76; Nghiên cứu 69); tracker CP24: **29 đang triển khai một phần, 116 chưa ghi nhận bắt đầu; **0 nghiệm thu hoàn tất** trên checklist strict.
- **CP24 đã PASS ở Windows** theo log người dùng: 53 Node; 15 Rules static; 42 Firebase Emulator; API typecheck và Vite build. CP25 không thể tự kế thừa PASS cho các tính năng mới.
- **CP25 có mã mới**: chat nổi và API Gemini, Atlas tra 2024–2026 cho 3 trường, 10 mã ngành PTIT với điểm 2024–2025, 6 quốc gia du học và 8 link trường quốc tế. Đây là **phạm vi danh mục thí điểm**.
- **Kiểm thử CP25 tại môi trường đóng gói**: 12/12 test mới PASS (logic/source), 15/15 Rules static PASS, layout PASS. `npm ci` chưa kết thúc tại runtime đóng gói; Vite build/typecheck, API live, E2E và Emulator CP25 **CHƯA XÁC NHẬN**.

## Những khoảng trống chính còn lại

### Trực tiếp phục vụ yêu cầu vừa bổ sung

1. **Chatbot:** cần cấu hình và chạy backend thực, E2E chat, phòng chống abuse giữa các serverless instance, grounded retrieval theo nguồn chính thức, đối chiếu consent/PII, benchmark 120 case.
2. **Tuyển sinh 2024–2026:** mới có 3 đại học (PTIT, HUST, FTU). PTIT có 10 ngành lưu điểm 2024–25; **2026 đã có thông báo điểm chính thức nhưng chưa nhập bảng ảnh được kiểm chứng**. Cần đủ ngành/trường/cơ sở/tổ hợp/điểm từng năm/phương thức/điểm ưu tiên và link cổng nộp.
3. **Gợi ý theo năng lực:** đang so sánh điểm THPT do người dùng nhập với điểm lịch sử một trường, chưa kết nối bảng điểm Firestore + sở thích + ngân sách + vị trí; chưa có sắp xếp nguyện vọng dựa trên điều kiện riêng từng năm.
4. **Du học:** có các nước Nhật, Hàn, Singapore, Đức, Anh, Úc; trường liên kết nguồn gốc được chọn lọc, nhưng chưa kiểm đủ điều kiện cho *từng chương trình* và các bằng được công nhận, không phải chỉ theo quốc gia.
5. **Học bổng:** thiếu bảng điều kiện/per-scholarship (quốc tịch, ngành, GPA, chứng chỉ, deadline, năm tuyển, coverage, điều kiện duy trì), học phí/tỷ giá/visa được cập nhật và phân tích tài chính có nguồn.
6. **UI/UX:** chưa review 7 module desktop/mobile, keyboard, màn hình trống/lỗi/loading, 22/22 hành động Nexus, deep links khi triển khai, hỗ trợ assistive tech.

### Website MVP quan trọng còn thiếu

- **A/B/C/D**: Git release SHA/CI, secret scan, 4-role browser E2E, đồng bộ hai phiên, export/delete/restore, profile 9 môn UI E2E.
- **E/F/G/H**: luồng đóng vòng từ khuyến nghị → can thiệp → check-in → outcome → đo lại → adaptation; Teacher/Parent share/revoke; Gemini có groundedness/fallback thực.
- **I/J/K**: staging production smoke, frontend E2E + accessibility + performance, 22 hành động Nexus, release rollback và ký nghiệm thu.

### Nghiên cứu (69 mục) còn thiếu nghiệm thu

- R1–R3: RQs/claim/SAP frozen, quyền dữ liệu, consent/assent, cohort thật, T0/T1/T2, dictionary, immutable raw, missingness.
- R4–R7: psychometric evidence, ML baseline/holdout/calibration, observed simulation validation, Static–Adaptive comparator và outcome.
- R8: benchmark 120 tình huống chỉ mới ở mức template; cần gold, chạy mô hình thực tối thiểu hai lượt, groundedness/safety/consistency.
- R9–R10: reproducible manifest, negative/AI/contribution logs, Claim–Evidence Matrix, báo cáo khoa học và defense 30s/3m/10m.

## Checklist tính năng CP25 (20 hạng mục, không thay thế 145 task)

| ID | Việc | Trạng thái | Còn thiếu / nghiệm thu | Master |
|---|---|---|---|---|
| C25-01 | Chat nổi có giao diện gõ/gửi | CÓ MÃ — CHƯA E2E | Kiểm tra mobile, màn hình nhỏ, keyboard, logout, chat history, lỗi mạng | G1,G4,I4,I5 |
| C25-02 | Gemini chat trả lời từ backend /api/gemini-chat | CÓ MÃ — CHƯA KẾT NỐI LIVE | Cấu hình env server, xác minh token/role trên deployment, chạy bài gọi Gemini thật | G1,G2,G4,R8.2 |
| C25-03 | Rate limiting và an toàn khi chat | MỘT PHẦN | Rate limit hiện là bộ nhớ trong một instance, cần store dùng chung; abuse/prompt-injection tests | G4,R2.5,R8.4 |
| C25-04 | Chat có dữ liệu học sinh cá nhân hóa | CHƯA LÀM | Consent, phạm vi dữ liệu, evidence-bound retrieval, không đưa PII vào LLM tùy ý | E8,G2,H2,R2.2 |
| C25-05 | Chat cập nhật đề án/điểm chuẩn thực thời gian | CHƯA LÀM | Nguồn đọc được, timestamp, trích dẫn/chống prompt injection, kiểm định groundedness | G2,E4,R8.2 |
| C25-06 | Tra tuyển sinh trong nước 2024–2026 | MỘT PHẦN | Hiện 3 trường x 3 năm; mở rộng nguồn toàn quốc, từng ngành, campus, tổ hợp, chỉ tiêu | E4,K11 |
| C25-07 | Điểm trúng tuyển THPT theo 3 năm | MỘT PHẦN | 10 ngành PTIT 2024–25; nhập 2026 từ bảng chính thức sau kiểm tra; bổ sung các trường khác | E4,K11 |
| C25-08 | Phương thức SAT/ACT/TSA/HSA/học bạ… từng ngành và năm | MỘT PHẦN | Gắn từng mã ngành với điều kiện/phương thức và công thức quy đổi riêng mỗi năm | E4,G2,K11 |
| C25-09 | Liên kết đề án + điểm + cổng nộp trường | MỘT PHẦN | Links PTIT/FTU/HUST và 8 trường quốc tế; rà link định kỳ, phân biệt hồ sơ đóng/mở | E4,E7,K11 |
| C25-10 | Gợi ý trường phù hợp năng lực học sinh | CHƯA HOÀN THIỆN | Kết nối transcript, tổ hợp, phương thức, sở thích, vùng, ngân sách, gắn hạn chế, tránh xác suất giả | D7,E4,G3 |
| C25-11 | Xây công cụ xếp nguyện vọng trong nước | CHƯA NGHIỆM THU | Tối ưu thứ tự nguyện vọng theo quy chế năm xét tuyển, điều kiện và tình huống dự phòng | E4,E8,H3 |
| C25-12 | Du học theo sáu quốc gia | CÓ MÃ — CHƯA E2E | Đầy đủ chương trình và admissions năm mới nhất, bộ lọc ngành và hồ sơ | E7,K14 |
| C25-13 | Đối chiếu ngôn ngữ và chứng chỉ quốc tế | MỘT PHẦN | Hiện hướng dẫn chung; cần mức chứng chỉ, hiệu lực, môn tiên quyết từng trường/course | E7,K14,R2.7 |
| C25-14 | Học bổng quốc tế có deadline và điều kiện | CHƯA HOÀN THIỆN | Nguồn chính thức từng quỹ, hạn, quốc tịch, năm nhập học, coverage, eligibility, renewal | E7,G3 |
| C25-15 | Chi phí du học + so sánh tài chính | CHƯA HOÀN THIỆN | Học phí theo ngành/năm, visa, sinh hoạt, tỷ giá có nguồn, tài chính tùy chọn không đoán | E7,G3 |
| C25-16 | Giấy tờ/visa/application checklist | MỘT PHẦN | Checklist trong phiên; cần per-program, ngày hạn, tự lưu tiến độ, hỗ trợ privacy | E7,K14 |
| C25-17 | UI/UX đồng bộ 7 module | CHƯA NGHIỆM THU | Audit giao diện mobile/desktop, loading/error/empty, a11y, design tokens, 22 thẻ Nexus | I4,I5,K16,K19 |
| C25-18 | Release staging và nghiệm thu CP25 | CHƯA CHẠY | npm ci, build/TypeScript, test Emulator, chat live, role E2E, smoke deploy | A3,A5,I3,I4,J3 |
| C25-19 | Research: 120-case Gemini benchmark | CHƯA ĐÁNH GIÁ THỰC | Gold rubric, >=2 runs/case, groundedness/consistency/safety/results, không dùng draft làm kết quả | R8.1,R8.2,R8.3,R8.4,R8.5 |
| C25-20 | Research: outcomes/psychometrics/ML/adaptive | CHƯA CÓ EVIDENCE THỰC | Dữ liệu hợp pháp, T0/T1/T2, holdout, comparator, CI và bộ defense | R2,R3,R4,R5,R6,R7,R9,R10 |

## 145 mục gốc — nguyên văn và trạng thái

Bản CSV/Excel kèm đầy đủ từng mục, giữ nguyên trạng thái tracker CP24 và thêm hai trường `CP25: dấu vết mới`, `CP25: ghi chú` (không tự tăng số task hoàn thành).

### A1 — A / Website
- Yêu cầu: Chốt một commit GitHub chính thức (commit SHA, nhánh release), so với CLA(5) và các checkpoint; không ghi đè chỉnh sửa mới. Bằng chứng: SHA + diff.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Chốt repo/commit release và diff.

### A2 — A / Website
- Yêu cầu: Bỏ .env, .env.local, node_modules, artifact không cần khỏi gói public/git; kiểm tra secret đã từng lộ, xoay key nếu cần. Bằng chứng: secret scan + .gitignore.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Quét lịch sử Git/secret và xác nhận không lộ khóa.

### A3 — A / Website
- Yêu cầu: npm ci, npx tsc -b và npm run build trên môi trường chuẩn: exit code 0. Bằng chứng: CI/build logs.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: CI sạch, npm ci và build chạy trên release/staging.

### A4 — A / Website
- Yêu cầu: Route thực sự tồn tại: /student, /student/profile, /student/transcript, /student/modules, /student/storage, /lumen, /atlas, /orion, /pulse, /haven, /teacher, /parent, /admin. CLA(5) đang thiếu /student/storage trong App.tsx. Bằng chứng: route smoke test.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; Route /study-abroad, chatbot nổi; chưa browser E2E.
- Thiếu: Browser route smoke cả 13 routes.

### A5 — A / Website
- Yêu cầu: Vercel/Firebase Hosting rewrite hợp lệ cho SPA, giữ /api/* hoạt động; CLA(5) chưa liệt kê /student/modules và /student/storage trong vercel.json. Bằng chứng: refresh/deep-link không 404.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; Vercel rewrite /study-abroad; chưa refresh trên staging.
- Thiếu: Vercel rewrite API và deep-link sau deploy.

### A6 — A / Website
- Yêu cầu: Kiểm tra chunk lớn, lỗi console, network requests, loading/error/empty ở desktop/mobile. Bằng chứng: build report + browser checks.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; CSS responsive/chat bổ sung; chưa visual/a11y QA.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### B1 — B / Website
- Yêu cầu: Tài khoản Student/Teacher/Parent/Admin đăng nhập, đăng xuất, reset password theo đúng vai trò. Bằng chứng: role matrix + UI tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Đăng nhập/reset/logout đủ 4 vai trò trong E2E.

### B2 — B / Website
- Yêu cầu: AccessGate.tsx thống nhất yêu cầu active === true với Security Rules (CLA5 còn điều kiện active === false). Bằng chứng: test tài khoản thiếu active.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E/Emulator/research validation as applicable

### B3 — B / Website
- Yêu cầu: Không cho tự tạo role Admin từ client; phục hồi Admin bằng quy trình tin cậy. Bằng chứng: Rules test.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Kiểm chứng luồng cấp Admin tin cậy ngoài client.

### B4 — B / Website
- Yêu cầu: Admin Demo chỉ đọc/ghi dữ liệu demo tại chính UID Admin, có nhãn dataScope=demo; không có quyền viết UID Student khác. Bằng chứng: quyền cho phép/từ chối.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: UI demo và staging cross-UID không truy cập được.

### B5 — B / Website
- Yêu cầu: Teacher/Parent không được truy cập Student profile riêng nếu không có cơ chế chia sẻ được học sinh đồng ý. Bằng chứng: unauthorized access tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### B6 — B / Website
- Yêu cầu: Xử lý lỗi Authentication, token hết hạn, trình duyệt mới, đa thiết bị và chuyển vai trò không để lại trạng thái nhầm. Bằng chứng: E2E matrix.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### C1 — C / Website
- Yêu cầu: Chốt schema + collection: users, learning_profiles, student_transcripts, atlas_workspaces, orion_drafts, pulse_drafts, haven_drafts, student_links, student_shared_reports, cognitive_history dưới profile; không tạo collection trùng mục đích. Bằng chứng: schema registry.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### C2 — C / Website
- Yêu cầu: Hợp nhất Rules Checkpoint 18 (Admin Demo) + Checkpoint 19 (khóa tổ hợp) + collections Checkpoint 13; KHÔNG dùng firestore.rules.CANDIDATE cũ trong CLA5. Bằng chứng: rules diff.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: So sánh candidate với production Rules; chưa publish.

### C3 — C / Website
- Yêu cầu: Run Firebase Emulator Rules test: mỗi role read/write đúng UID, deny cross-UID, quyền update/delete, truy vấn danh sách link/report. Bằng chứng: test report.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Nghiệm thu CP24 42/42 Emulator, bao gồm 9 case mới.

### C4 — C / Website
- Yêu cầu: Server-enforced bất biến bốn môn lựa chọn sau lần khóa; kiểm tra cả khi ghi learning_profiles và student_transcripts, không làm hỏng dữ liệu lịch sử. Bằng chứng: negative tests.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: 42/42 Emulator + kiểm thử cập nhật bất biến dữ liệu.

### C5 — C / Website
- Yêu cầu: Ghi bảng điểm và hồ sơ đồng bộ bằng batch/transaction; một lần ghi lỗi phải thông báo và không tạo trạng thái nửa vời. Bằng chứng: integration test.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### C6 — C / Website
- Yêu cầu: Không mặc định dữ liệu chưa có là 0; phân biệt missing/partial/complete, dataScope demo và dữ liệu thật; bảo đảm dữ liệu learning_profiles cũ vẫn có thể đọc/migrate. Bằng chứng: migration report.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Kiểm tra migrate hồ sơ legacy bằng E2E.

### C7 — C / Website
- Yêu cầu: Realtime sync từ tài khoản A trên hai phiên/trình duyệt: lưu → tải lại → xem Dashboard/kho; phòng ngừa ghi đè bản cũ; có updatedAt, lỗi quyền cụ thể. Bằng chứng: hai phiên E2E.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### C8 — C / Website
- Yêu cầu: Xuất/xóa dữ liệu có xác thực, chính sách giữ dữ liệu và phương án sao lưu/phục hồi; không lưu dữ liệu nhạy cảm không cần thiết. Bằng chứng: test export/restore.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Xuất/xóa/phục hồi theo quyền + retention.

### C9 — C / Website
- Yêu cầu: Rà soát dự án Firebase thật, Auth provider, Firestore indexes, quota, environment; không dùng system_health write public. Bằng chứng: environment audit.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### D1 — D / Website
- Yêu cầu: Mục nhập hồ sơ: tải dữ liệu cũ trước khi cho ghi; báo chính xác collection lỗi; retry an toàn, không overwrite. Bằng chứng: UI tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### D2 — D / Website
- Yêu cầu: Chương trình học 4 môn chung + 4 môn lựa chọn + Giáo dục quốc phòng và an ninh = 9 môn điểm số trong phạm vi cấu hình đang dùng; xử lý những môn đánh giá nhận xét nếu hỗ trợ. Bằng chứng: data dictionary + UI.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### D3 — D / Website
- Yêu cầu: Bốn môn lựa chọn chọn đúng một lần, khóa cho ba năm; có quy trình sửa ngoại lệ qua người có thẩm quyền kèm audit log, không tự mở khóa bằng UI. Bằng chứng: Rules + audit test.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### D4 — D / Website
- Yêu cầu: Từng ô điểm cho phép trống hoặc số 0–10, bao gồm số thập phân; từ chối NaN, âm, lớn hơn 10; điểm 0 hợp lệ. Bằng chứng: unit test.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Browser nhập/lưu/đọc lại số 0; golden cases đã PASS.

### D5 — D / Website
- Yêu cầu: Mục 05 tài chính/du học/học bổng không bắt buộc; trống phải lưu null/missing, không giả số 0. Bằng chứng: form test.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### D6 — D / Website
- Yêu cầu: GPA học kỳ/năm hiển thị rõ chính thức và tạm tính; không tính môn học cũ ngoài tổ hợp hiện tại, nhưng giữ lịch sử. Bằng chứng: golden data cases.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### D7 — D / Website
- Yêu cầu: /student/transcript và Dashboard đọc cùng student_transcripts/{uid}, cùng phiên bản phép tính; làm mới không mất điểm. Bằng chứng: two-page E2E.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### D8 — D / Website
- Yêu cầu: Empty/error/loading states; không trình bày dữ liệu mẫu như dữ liệu học sinh thực. Bằng chứng: smoke screenshots.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### E1 — E / Website
- Yêu cầu: Nexus Core: điều phối context và điều hướng giữa module; hoàn thiện bảy trang/cụm kiểm thử Admin theo K1–K19; không tái tính business logic trong UI. Bằng chứng: data-flow tracing.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### E2 — E / Website
- Yêu cầu: Seed Profile: dùng dữ liệu Firestore duy nhất, có trạng thái, lịch sử và phiên bản; cognitive composite được ghi nhãn thử nghiệm. Bằng chứng: snapshot log.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### E3 — E / Website
- Yêu cầu: Lumen Intelligence: input có cấu trúc, giải thích theo dữ liệu thực và có error state khi Gemini/engine thất bại; Admin phải mở đúng /lumen, có công cụ audit SCI/MAS/CSL và dữ liệu ML. Xem K7–K10. Bằng chứng: grounded test cases.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### E4 — E / Website
- Yêu cầu: Atlas Admission: Knowledge Base lưu Firestore, không chỉ localStorage; hiển thị provenance của điểm chuẩn, nguồn tuyển sinh và ngày hiệu lực. Bằng chứng: read/save/reload tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; Atlas: 3 trường × ba năm, 10 ngành PTIT có điểm 2024–25; chưa đủ cả nước/điểm 2026 được nhập.
- Thiếu: Atlas KB Firestore, nguồn/năm, read/reload.

### E5 — E / Website
- Yêu cầu: Orion Strategy: điểm trống không thành 0; can thiệp có kế hoạch, lịch thực hiện, trạng thái và lưu nháp Firestore. Bằng chứng: integration tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### E6 — E / Website
- Yêu cầu: Pulse Monitor: đọc outcome và lịch sử hợp lệ, không tự báo 'tiến bộ' nếu thiếu lần đo; báo cáo lưu/tải được. Bằng chứng: history tests.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Pulse UI lưu/đọc Evidence + outcome hợp lệ qua staging.

### E7 — E / Website
- Yêu cầu: Haven Support: ngân sách tùy chọn, không suy xác suất học bổng từ fit score; nguồn học bổng có hạn, ngày lấy dữ liệu và đường dẫn chính thức. Bằng chứng: sample cases.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; Haven: liên kết du học tới 6 quốc gia và các trường; chưa có học bổng đủ điều kiện từng chương trình.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### E8 — E / Website
- Yêu cầu: Một bộ hồ sơ có thể đi qua Seed → Lumen → Orion → Pulse (và Atlas/Haven nếu cần) mà không nhập đi nhập lại dữ liệu hoặc mâu thuẫn kết quả. Bằng chứng: E2E flow.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; Điều hướng Atlas/Haven/Study Abroad; chưa khép vòng dữ liệu và E2E.
- Thiếu: E2E một UID Seed→Lumen→Orion→Pulse; không nhập lại/không bịa outcome.

### F1 — F / Website
- Yêu cầu: Student tạo/thu hồi liên kết đúng UID; Teacher/Parent chỉ xem những gì học sinh đã chủ động chia sẻ. Bằng chứng: role E2E.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Kiểm thử cấp/thu hồi link hai vai trò theo UID.

### F2 — F / Website
- Yêu cầu: Báo cáo chia sẻ: tạo, nhận xét đúng một lần, xuất, thu hồi, không rò dữ liệu sau thu hồi. Bằng chứng: 3-account test.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E student→teacher/parent review/revoke.

### F3 — F / Website
- Yêu cầu: Admin có Nexus Console vận hành thực tế: xem trạng thái hệ thống, tài khoản/role theo quyền, các phép kiểm tra dữ liệu và engine, không tự có quyền sửa dữ liệu Student; muốn chỉnh hộ phải có quy trình phân quyền/audit riêng. Xem K1–K19. Bằng chứng: security tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### F4 — F / Website
- Yêu cầu: Các trường hợp đã xóa tài khoản, liên kết cũ, không có dữ liệu, lỗi mạng có trạng thái phù hợp. Bằng chứng: negative tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### G1 — G / Website
- Yêu cầu: /api/health, gemini-lumen, gemini-admission-reader chạy thật; Auth, CORS, limit, model và env chuẩn; không leak key. Bằng chứng: API integration tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; API /api/gemini-chat có kiểm tra token/active role, CORS và rate limit tại instance; API integration thực chưa chạy.
- Thiếu: API staging: Gemini/health/CORS/auth/limit.

### G2 — G / Website
- Yêu cầu: Gemini chỉ diễn giải Evidence Record; score/probability/eligibility do engine được xác định tạo; không bịa nguồn/deadline. Bằng chứng: 50–100 deterministic/LLM test cases.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: MỘT PHẦN MÃ CP25; Chat prompt không bịa số hoặc nguồn; chưa grounded retrieval/rubric eval.
- Thiếu: Đo groundedness/numeric integrity trên benchmark.

### G3 — G / Website
- Yêu cầu: Nếu không có outcome-labelled calibrated model, ghi rõ fit/scenario, không gọi đó là xác suất thành công; không dùng ngôn ngữ nhân quả tùy tiện. Bằng chứng: UI/response audit.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: MỘT PHẦN MÃ CP25; Atlas chỉ hiển thị chênh điểm quá khứ không tuyên bố xác suất đỗ; cần rà soát toàn app.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### G4 — G / Website
- Yêu cầu: Kiểm tra prompt injection, quá tải, timeout, quota, retry/fallback và thông báo lỗi phù hợp. Bằng chứng: API failure tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: MỘT PHẦN MÃ CP25; Chat có timeout/quota error UI, chưa prompt injection/production failure tests.
- Thiếu: API prompt injection, timeout, quota và fallback.

### H1 — H / Website
- Yêu cầu: Có một chuỗi kiểm thử được: trạng thái đầu vào → khuyến nghị → kế hoạch hành động → check-in → outcome → tái đo → cập nhật strategy. Bằng chứng: E2E logs ít nhất một hành trình demo đầy đủ.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Demo đóng vòng có outcome/check-in/reassess/adapt có trace.

### H2 — H / Website
- Yêu cầu: Mỗi kết quả quan trọng có snapshot ID, engine/version, công thức, factors, limitations và timestamp; demo cần có nhãn không phải dữ liệu nghiên cứu thật. Bằng chứng: Evidence Record.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Evidence đầy đủ + version/refs + E2E lưu/đọc; 9 ca CP24 pending.

### H3 — H / Website
- Yêu cầu: Recommendation có lựa chọn chấp nhận/từ chối và nhật ký thay đổi; human override khi quyết định quan trọng. Bằng chứng: event logs.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### H4 — H / Website
- Yêu cầu: Không hiển thị 'cải thiện nhờ CLA' nếu chỉ có mô phỏng hoặc thay đổi quan sát. Bằng chứng: claim–evidence audit.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### I1 — I / Website
- Yêu cầu: Thêm script test, test runner và CI. CLA5 hiện không có thư mục tests và workflow. Bằng chứng: CI pass.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: CI GitHub thật xanh; không chỉ tests local.

### I2 — I / Website
- Yêu cầu: Unit tests cho GPA 9 môn, khóa tổ hợp, indices, prediction/scenario và data validation. Bằng chứng: unit report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ TEST CP25; 12 unit/static source tests cho catalog/chat; chưa kiểm tra model/recommendation live.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### I3 — I / Website
- Yêu cầu: Firebase Emulator integration/security tests cho mỗi vai trò và tất cả collections. Bằng chứng: pass/deny matrix.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Ma trận Emulator cho Rules CP24 42/42.

### I4 — I / Website
- Yêu cầu: Browser E2E mobile/desktop cho luồng chính, toàn bộ 22 hành động Nexus Console và refresh deep links. Bằng chứng: automated + manual smoke.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: MỚI CÓ MÃ CP25; Nút/trang mới, chưa Playwright/mobile E2E.
- Thiếu: E2E 22 thẻ Nexus, mobile/desktop, refresh.

### I5 — I / Website
- Yêu cầu: Kiểm tra empty/loading/error, responsive, keyboard accessibility, lỗi JS runtime và Network. Bằng chứng: QA log.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: MỚI CÓ MÃ CP25; CSS responsive/chat state, chưa keyboard/screen reader audit.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### J1 — J / Website
- Yêu cầu: Có README hiện hành, schema/route/role matrix, config env không chứa giá trị secret, hướng dẫn deploy rollback. Bằng chứng: documentation.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### J2 — J / Website
- Yêu cầu: Release notes theo commit, version deployment, monitoring lỗi và phương án phục hồi. Bằng chứng: release manifest.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Release notes, commit/tag, rollback, monitoring thực tế.

### J3 — J / Website
- Yêu cầu: Bảng nghiệm thu có ngày, người kiểm tra, PASS/FAIL/NOT TESTED, screenshot/log và lỗi tồn tại; không công bố 100% nếu còn P0. Bằng chứng: sign-off.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K1 — K / Website
- Yêu cầu: [P0, F3/A4]. Xây trang/tầng dữ liệu Tổng quan hệ thống thật, không hiển thị KPI bịa đặt. Phải có trạng thái Auth, Firestore, API, Gemini, module status, source freshness, thời điểm kiểm tra; lỗi không được biểu diễn là "đang hoạt động".
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E/Emulator/research validation as applicable

### K2 — K / Website
- Yêu cầu: [P0, B4/F3]. Xem như học sinh phải lưu/đọc được demo dưới UID Admin, có dataScope=demo và nhãn demo rõ. Không impersonate UID thật; refresh vẫn giữ đúng vai trò.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K3 — K / Website
- Yêu cầu: [P0, B5/F1]. Xem như giáo viên dùng quyền hiện tại hoặc dữ liệu giả lập được ghi nhãn. Không có quyền đọc báo cáo học sinh ngoài liên kết/đồng ý hợp lệ.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K4 — K / Website
- Yêu cầu: [P0, B5/F1]. Xem như phụ huynh tương tự K3; tuyệt đối không cấp quyền từ tham số ?from=admin.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K5 — K / Website
- Yêu cầu: [P0, D1/C6]. Seed — kiểm tra dữ liệu nền: kiểm tra tồn tại profile/transcript, schemaVersion, UID, tổ hợp 4 môn, 9 môn cấu hình, GPA, dữ liệu null/partial/complete, lịch sử và scope demo; chỉ hiển thị dữ liệu mà Admin có quyền truy cập.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E/Emulator/research validation as applicable

### K6 — K / Website
- Yêu cầu: [P0, C3/D3]. Seed audit có trạng thái PASS/WARN/FAIL, thông tin lỗi và kiểm tra bất biến Firestore; thao tác kiểm tra không tự sửa dữ liệu. Không mở quyền đọc toàn bộ collection chỉ để làm màn kiểm tra.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K7 — K / Website
- Yêu cầu: [P1, A4/E3]. Đổi liên kết Admin "Xem phân tích nhận thức" từ /student sang /lumen hoặc anchor Lumen thật; kiểm tra sau reload/deep-link.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K8 — K / Website
- Yêu cầu: [P1, E3/I2]. Lumen — kiểm tra Cognitive Engine: input→rule/formula→SCI/MAS/CSL→factors→warning→version. Test dữ liệu thiếu, số 0 hợp lệ, giá trị biên và lịch sử giả lập.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E/Emulator/research validation as applicable

### K9 — K / Website
- Yêu cầu: [P1, G3/H2]. Phân biệt điểm proxy SCI/MAS/CSL với thang đo đã thẩm định; không gắn nhãn "đã kiểm định khoa học" nếu chưa có reliability/validity trên dữ liệu phù hợp.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K10 — K / Website
- Yêu cầu: [P1, H2/I2]. Lumen — chuẩn bị dữ liệu ML: kiểm tra cấu trúc dataset, nhãn outcome, độ thiếu dữ liệu, trùng lặp/leakage, thời gian, consent và chia train/validation/test theo học sinh/thời gian; xuất dữ liệu đã khử định danh hợp lệ. Không tuyên bố có ML model nếu mới có pipeline chuẩn bị.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E/Emulator/research validation as applicable

### K11 — K / Website
- Yêu cầu: [P1, E4/G2]. Atlas: cả 3 thẻ phải truy cập đúng khu vực, nguồn tuyển sinh phải có ngày/năm, phương thức xét tuyển/điểm chuẩn và kiểm tra KB sau reload.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; Atlas 2024–2026 liên kết chính thức PTIT/FTU/HUST; chưa đủ mã ngành, điểm chuẩn toàn bộ.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K12 — K / Website
- Yêu cầu: [P1, E5/H1]. Orion: tách anchor/panel cho kiểm tra kịch bản và roadmap; có 3 chiến lược, milestone, lưu/check-in/outcome và trace.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: 3 strategy/outcome checks, browser E2E

### K13 — K / Website
- Yêu cầu: [P1, E6/H2]. Pulse: phân tách panel báo cáo và rủi ro; giải thích trend/risk khi dữ liệu có hoặc không có lần đo, không biến số 0 kỹ thuật thành cảnh báo.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Full risk/no-data behavior browser E2E

### K14 — K / Website
- Yêu cầu: [P1, E7/G3]. Haven: liên kết thẳng tới đề xuất học bổng và hỗ trợ theo vai trò; tách trường hợp thiếu ngân sách, nguồn không xác minh, học bổng hết hạn hoặc không đạt eligibility.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CÓ MÃ CP25; Haven dẫn đến page du học, checklist chứng chỉ và trường; thiếu eligibility thực.
- Thiếu: Verify source age/eligibility and role-specific output

### K15 — K / Website
- Yêu cầu: [P0, B3/F3]. Bổ sung quản lý người dùng đúng quyền nếu là chức năng cam kết của Nexus: thống kê tài khoản/tình trạng/role qua backend đặc quyền, thay đổi role hoặc active chỉ qua quy trình tin cậy có audit log; không cho client query toàn bộ users bằng Rules rộng.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K16 — K / Website
- Yêu cầu: [P1, A4/I4]. Toàn bộ 22 thẻ: link/anchor đúng đích, không 404; nhấn back, refresh, deep link và thiết bị di động hoạt động. Thẻ chưa làm phải hiển thị trạng thái thật thay vì ghi "Mở chức năng".
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: MỚI CÓ MÃ CP25; Route mới và link; 22/22 Nexus click/auth/browser chưa nghiệm thu.
- Thiếu: 22/22 thẻ Admin chạy trên browser E2E; static anchors chưa đủ.

### K17 — K / Website
- Yêu cầu: [P1, B4/C3]. Ma trận role × Admin Console: Student/Parent/Teacher không vào /admin; Admin xem demo nhưng không đọc/ghi tài liệu UID Student khác. Kiểm thử bằng Firebase Emulator và E2E.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E Admin vs Student/Teacher/Parent; Emulator CP23 33/33 PASS.

### K18 — K / Website
- Yêu cầu: [P2, I5/J3]. Thay nhãn trạng thái tĩnh ready/soon bằng status đủ bằng chứng (UI available / endpoint reachable / data verified / test PASS) và nhật ký lần kiểm tra, không tạo số liệu giả.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### K19 — K / Website
- Yêu cầu: [P2, A6/I4]. Kiểm thử cả 7 ảnh trên desktop/mobile, menu trái, sidebar trạng thái active, header/logo, nút mở, accessibility, loading/error states, không trùng lặp các bảng điều hướng sau CP20.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R1.1 — R1 / Nghiên cứu
- Yêu cầu: [P0]. Viết chính xác problem statement của CLA: vấn đề ra quyết định học tập, vòng lặp động, khoảng trống giữa assessment–prediction–intervention–outcome–adaptation; tránh coi nhiều module là điểm mới duy nhất. Bằng chứng: research/protocol/research_problem.md.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R1.2 — R1 / Nghiên cứu
- Yêu cầu: [P0]. Chốt RQ1–RQ5 có thể đo được theo Master Protocol: chỉ số SCI/MAS/CSL; prediction incremental utility; simulation agreement; Static vs Adaptive; explainability/calibrated trust. RQ nào không có dữ liệu phải ghi not evaluable và thu hẹp claim. Bằng chứng: RQ registry.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: E2E/Emulator/research validation as applicable

### R1.3 — R1 / Nghiên cứu
- Yêu cầu: [P0]. Viết H0/H1, primary/secondary outcome, estimand và điều kiện phủ định cho từng RQ; không thay đổi outcome sau khi xem kết quả. Bằng chứng: preregistered protocol v1.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R1.4 — R1 / Nghiên cứu
- Yêu cầu: [P1]. Lập literature matrix với nguồn học thuật có thể kiểm chứng về SRL, learning analytics, educational recommender, intervention, XAI, psychometrics; ghi DOI/URL và ngày tra cứu. Bằng chứng: bibliography + matrix.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R1.5 — R1 / Nghiên cứu
- Yêu cầu: [P1]. Lập competitor/architecture matrix theo các trục predict, simulate, intervene, measure outcome, adapt, evidence/provenance; không tuyên bố CLA là duy nhất khi chưa chứng minh. Bằng chứng: competitor matrix.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R1.6 — R1 / Nghiên cứu
- Yêu cầu: [P0]. Ghi contribution statement theo P0–P4 từ Master Protocol; chia cái có demo, cái có validation và cái còn hypothesis. Bằng chứng: Claim–Evidence Matrix v1.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R2.1 — R2 / Nghiên cứu
- Yêu cầu: [P0]. Lập inventory mọi nguồn dữ liệu dự kiến dùng: CLA Firestore, log trước đây, nguồn mở, bảng tuyển sinh/học bổng; ghi người sở hữu, mục đích thu ban đầu, quyền nghiên cứu, hạn chế và thời hạn lưu. Bằng chứng: dataset permissions register.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Bản ghi quyền sử dụng từng nguồn chưa có phê duyệt.

### R2.2 — R2 / Nghiên cứu
- Yêu cầu: [P0]. Chỉ đưa dữ liệu học sinh thật vào nghiên cứu khi có căn cứ pháp lý và consent/assent phù hợp cho mục đích ấy; đồng ý sử dụng app không mặc nhiên là đồng ý nghiên cứu. Nếu thiếu căn cứ thì loại dữ liệu đó, không tự suy diễn. Bằng chứng: approval/consent status log.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R2.3 — R2 / Nghiên cứu
- Yêu cầu: [P0]. Tách dataScope=demo, test/synthetic, dữ liệu thật và dữ liệu nghiên cứu; ID pseudonym khác UID Firebase; không cho dữ liệu demo vào cohort phân tích. Bằng chứng: cohort exclusions + pseudonym mapping access design.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R2.4 — R2 / Nghiên cứu
- Yêu cầu: [P0]. Xác định chính sách retention, xóa/rút lui, quản lý người truy cập, backup mã hóa, kiểm toán xuất dữ liệu; dùng các trường dữ liệu tối thiểu. Bằng chứng: privacy/data management plan.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R2.5 — R2 / Nghiên cứu
- Yêu cầu: [P1]. Kiểm soát role, cross-UID, prompt injection, key exposure, data poisoning, model memorization/membership risk, kiểm soát admin có MFA nếu triển khai. Bằng chứng: threat model + security test report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R2.6 — R2 / Nghiên cứu
- Yêu cầu: [P1]. Quy định human-in-the-loop: học sinh có quyền từ chối khuyến nghị; thông báo không phải chẩn đoán/định hướng chắc chắn; cơ chế xử lý nội dung có dấu hiệu nguy cơ. Bằng chứng: policy and UI audit.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R2.7 — R2 / Nghiên cứu
- Yêu cầu: [P1]. Nếu dùng dữ liệu công khai/thứ cấp, lưu license, source/version và điều kiện phân phối; không suy ra population CLA giống population nguồn ngoài. Bằng chứng: secondary-source sheet.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: THAM KHẢO NGUỒN CP25; Có link nguồn giáo dục; chưa quyền/license dataset hay định kỳ xác minh.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.1 — R3 / Nghiên cứu
- Yêu cầu: [P0]. Audit thực tế dữ liệu hiện có: số record đủ điều kiện theo nguồn, ID, học kỳ, timestamp, outcome và consent; báo riêng tổng record/eligible unique students/records usable, không ước lượng. Bằng chứng: research/data/data_inventory.csv và lệnh tái tạo.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.2 — R3 / Nghiên cứu
- Yêu cầu: [P0]. Tạo data dictionary về điểm 9 môn, dataScope, behavior event, plan completion, intervention, outcome, SCI/MAS/CSL, source, missing reason, schemaVersion; ghi data type, range, unit, timing. Bằng chứng: research/data/data_dictionary.md.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.3 — R3 / Nghiên cứu
- Yêu cầu: [P0]. Thiết kế event_log và measurement_snapshot với timestamp, anonymous participant ID, task/plan, recommendation accepted/rejected, adherence và observed outcome; log chưa có nghĩa là đã có dữ liệu quá khứ. Bằng chứng: schema and capture tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.4 — R3 / Nghiên cứu
- Yêu cầu: [P0]. Tạo raw immutable + corrected layer, dataset hash/version, transform pipeline có log; không sửa trực tiếp dữ liệu thô để kết quả 'đẹp'. Bằng chứng: raw manifest + correction log.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.5 — R3 / Nghiên cứu
- Yêu cầu: [P0]. QA range/missingness: điểm 0–10, null vs zero, môn ngoài tổ hợp, timestamps, 4 môn cố định, event duplicate/impossible sequence, outcome lấy trước hay sau prediction. Bằng chứng: QA report.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Data quality trên dữ liệu hợp pháp, không phải synthetic.

### R3.6 — R3 / Nghiên cứu
- Yêu cầu: [P0]. Định nghĩa primary learning outcome và labeling window; không dùng cùng outcome làm feature dự báo chính outcome đó, không trộn train và test của cùng participant khi giả thuyết yêu cầu generalization. Bằng chứng: label specification.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.7 — R3 / Nghiên cứu
- Yêu cầu: [P1]. Có bảng participant/cohort flow theo eligibility, exclusions, timepoints T0/T1/T2, phân tích missing/attrition; nếu thiếu thời điểm, ghi không thể ước lượng thay đổi. Bằng chứng: participant flow figure.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.8 — R3 / Nghiên cứu
- Yêu cầu: [P1]. Phân tích descriptive không suy đoán: n, phân phối, phân nhóm lớp, số lần đo, missing rates, data freshness; hạn chế subgroup nếu số mẫu thấp. Bằng chứng: EDA report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R3.9 — R3 / Nghiên cứu
- Yêu cầu: [P1]. Xác định dữ liệu minh họa/synthetic dùng cho thử nghiệm deterministic, không đưa vào bảng accuracy/ML/hiệu quả học tập thật. Bằng chứng: dataset segregation test.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R4.1 — R4 / Nghiên cứu
- Yêu cầu: [P0]. Freeze định nghĩa vận hành SCI=goal-plan-action coherence; MAS=motivation/action stability; CSL=operational cognitive stability, không gắn nghĩa năng lực lâm sàng. Bằng chứng: index specification v1.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R4.2 — R4 / Nghiên cứu
- Yêu cầu: [P0]. Freeze công thức, trọng số, window, clipping, missing data, xử lý 0, fallback, confidence/uncertainty và version mỗi chỉ số. Bằng chứng: scoring spec + unit tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R4.3 — R4 / Nghiên cứu
- Yêu cầu: [P0]. Kiểm tra kỹ thuật: deterministic output, boundary cases, invariants, sensitivity khi đổi trọng số/window, missingness và outliers; kết quả phải tái lập. Bằng chứng: golden cases + sensitivity plots.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R4.4 — R4 / Nghiên cứu
- Yêu cầu: [P1]. Rà soát content validity bằng cơ sở lý thuyết, chuyên gia/phản hồi đã có và được phép sử dụng nếu tồn tại; không ghi đạt content validation nếu không có chứng cứ phù hợp. Không yêu cầu phỏng vấn mới. Bằng chứng: content audit + limitations.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R4.5 — R4 / Nghiên cứu
- Yêu cầu: [P1]. Nếu có dữ liệu thật lặp lại đủ điều kiện: kiểm tra test–retest/ICC và 95% CI, item/internal consistency (chỉ khi đúng construct), convergent/discriminant/criterion hypotheses; không dùng alpha cao để khẳng định mọi thứ. Bằng chứng: psychometric report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R4.6 — R4 / Nghiên cứu
- Yêu cầu: [P1]. Nếu không đủ dữ liệu psychometric, đổi nhãn trong UI/báo cáo thành exploratory behavioral composite/proxy, không nói validated psychological index. Bằng chứng: claim/UI review.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R4.7 — R4 / Nghiên cứu
- Yêu cầu: [P1]. Phân tích responsiveness nếu có nhiều thời điểm hợp lệ; không gọi chỉ số tăng là tác động do CLA nếu không có comparator. Bằng chứng: longitudinal analysis.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.1 — R5 / Nghiên cứu
- Yêu cầu: [P0]. Chốt target dự báo có outcome đo được (điểm kỳ sau, plan completion, rủi ro bỏ dở...), prediction horizon, dữ liệu sẵn tại thời điểm dự báo; tách 'fit score' và 'probability'. Bằng chứng: prediction task sheet.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Chốt nhãn outcome, horizon và cohort thật.

### R5.2 — R5 / Nghiên cứu
- Yêu cầu: [P0]. Chạy audit chống leakage: future score, post-intervention feature, within-student leakage, duplicate, preprocessing trước split, target-derived features. Bằng chứng: leakage report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.3 — R5 / Nghiên cứu
- Yêu cầu: [P1]. Nếu dataset đủ điều kiện: tạo participant-level/temporal train–validation–holdout split, freeze trước tuning; ghi seed/version/count. Bằng chứng: split manifest.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.4 — R5 / Nghiên cứu
- Yêu cầu: [P1]. Chạy baseline: last-score/mean, linear/logistic/academic-only theo loại outcome; luôn báo baseline cùng tập test. Bằng chứng: baseline metrics.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.5 — R5 / Nghiên cứu
- Yêu cầu: [P1]. Huấn luyện mô hình phức tạp chỉ khi phù hợp dữ liệu; toàn bộ imputation/normalization/feature selection fit trong train; không chỉ ghi RandomForest/XGBoost là chất lượng. Bằng chứng: versioned training pipeline.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.6 — R5 / Nghiên cứu
- Yêu cầu: [P1]. Báo MAE/RMSE/R² hoặc AUC/Brier/PR-AUC theo đúng task; CI/bootstraps phù hợp participant, calibration và lỗi theo giai đoạn, nhóm hợp lệ. Bằng chứng: holdout report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.7 — R5 / Nghiên cứu
- Yêu cầu: [P1]. Ablation: academic-only, +behavior, +SCI/MAS/CSL, full; ghi cả negative results, không chọn model vì đẹp trên test. Bằng chứng: ablation table.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.8 — R5 / Nghiên cứu
- Yêu cầu: [P1]. OOD, drift, uncertainty/abstention và failure analysis; nếu không có calibrated outcomes thì UI không hiển thị xác suất đỗ hay tăng điểm. Bằng chứng: calibration/OOD report + UI audit.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R5.9 — R5 / Nghiên cứu
- Yêu cầu: [P1]. Lưu model card, data card, feature/label version, model artifact và cách rollback; nếu không đủ outcome, giữ rule-based và báo NOT VALIDATED, không tự nhận ML đã hoàn thiện. Bằng chứng: model governance files.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R6.1 — R6 / Nghiên cứu
- Yêu cầu: [P0]. Phân loại rõ deterministic scenario calculator, predictive scenario, mechanistic assumptions, causal counterfactual; hiện tại không tự nhận nhân quả. Bằng chứng: simulation scope sheet.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R6.2 — R6 / Nghiên cứu
- Yêu cầu: [P0]. Freeze 3 chiến lược Orion (cân bằng/tập trung/bứt phá), input bounds, constraints, assumption, thời gian/dose và deterministic golden cases. Bằng chứng: scenario spec + unit tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R6.3 — R6 / Nghiên cứu
- Yêu cầu: [P1]. Trước khi quan sát outcome, lưu dự đoán/simulation v1 bất biến ở T0, không tính lại quá khứ bằng model mới rồi giả là dự báo cũ. Bằng chứng: timestamped Evidence Record.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R6.4 — R6 / Nghiên cứu
- Yêu cầu: [P1]. Nếu có longitudinal outcome: so predicted vs observed Δ, direction accuracy, delta MAE và scenario ranking, kèm CI. Bằng chứng: observed-vs-predicted report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R6.5 — R6 / Nghiên cứu
- Yêu cầu: [P1]. Theo dõi adherence và phân tích vì sao scenario không được thực hiện; không coi mismatch do không tuân thủ là lỗi dự báo thuần túy. Bằng chứng: adherence audit.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R6.6 — R6 / Nghiên cứu
- Yêu cầu: [P1]. Gắn cảnh báo trong UI: 'Mô phỏng theo mô hình và giả định hiện tại, không phải cam kết tăng điểm hay quan hệ nhân quả'. Bằng chứng: screenshot/content tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.1 — R7 / Nghiên cứu
- Yêu cầu: [P0]. Hoàn thiện một vòng có thể trace: snapshot → assessment → recommendation → intervention plan → check-in → observed outcome → reassessment → adaptation; dữ liệu demo chỉ chứng minh kỹ thuật. Bằng chứng: E2E run/trace.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.2 — R7 / Nghiên cứu
- Yêu cầu: [P0]. Freeze adaptation policy theo condition/threshold, intervention taxonomy, dose, adherence, human override; không để LLM tự quyết định can thiệp không kiểm soát. Bằng chứng: policy version + deterministic tests.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.3 — R7 / Nghiên cứu
- Yêu cầu: [P1]. Xây CLA Static comparator cùng nền tảng, chỉ khác adaptive policy; định nghĩa treatment contrast. Bằng chứng: static vs adaptive run configuration.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.4 — R7 / Nghiên cứu
- Yêu cầu: [P1]. Nếu có dữ liệu lịch sử hợp lệ, đánh giá retrospective/offline replay và nêu rõ không phải thử nghiệm nhân quả; ghi selection bias/coverage. Bằng chứng: offline evaluation report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.5 — R7 / Nghiên cứu
- Yêu cầu: [P1]. Nếu có outcome longitudinal và nhóm so sánh hợp lệ, freeze primary estimand, SAP, missing/attrition, dùng effect size và 95% CI; nếu không có thì ghi NO EMPIRICAL EFFECTIVENESS EVIDENCE. Bằng chứng: comparison study report hoặc status/limitations.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.6 — R7 / Nghiên cứu
- Yêu cầu: [P1]. Phân biệt ITT/per-protocol khi thiết kế hỗ trợ; dùng mixed/repeated measures đúng assumptions; không diễn giải quan sát trước–sau thành do CLA gây ra. Bằng chứng: SAP + audit.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.7 — R7 / Nghiên cứu
- Yêu cầu: [P1]. Ghi recommendation acceptance/rejection, action completion, fidelity, risk events và outcome do người dùng thật tạo; không tăng chỉ số demo thành nghiên cứu. Bằng chứng: intervention logs.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R7.8 — R7 / Nghiên cứu
- Yêu cầu: [P0]. Kết luận nghiên cứu theo bằng chứng: P0 closed-loop kỹ thuật có thể PASS với E2E; P3 hiệu quả/ P4 nhân quả không PASS nếu thiếu comparator/outcome/design thích hợp. Bằng chứng: Claim Matrix updated.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R8.1 — R8 / Nghiên cứu
- Yêu cầu: [P0]. Thiết kế bộ ít nhất 100 case có Evidence Record và bộ case lỗi/thiếu dữ liệu; bản tham chiếu khóa trước khi đánh giá. Bằng chứng: LLM benchmark manifest.
- Tracker CP24: ĐANG TRIỂN KHAI; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: MỞ RỘNG CP25; Chat API/UX, có 120 template trước đó; chưa gold rubric khóa và runs.
- Thiếu: Duyệt 120 bộ gold criteria, freeze test; chưa chấm LLM.

### R8.2 — R8 / Nghiên cứu
- Yêu cầu: [P1]. Chấm factual groundedness/faithfulness theo evidence; mục tiêu nội bộ của Master Protocol: ≥95% factual fields traceable trên benchmark, không gọi tuyệt đối không hallucination. Bằng chứng: rubric and results.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CHƯA THỰC NGHIỆM; Chưa chấm factual groundedness.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R8.3 — R8 / Nghiên cứu
- Yêu cầu: [P1]. Thử multiple runs để đo consistency; kiểm tra khi thiếu dữ liệu phải abstain, không bịa điểm, deadline, trường, học bổng hay xác suất. Bằng chứng: per-case logs.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CHƯA THỰC NGHIỆM; Chưa đánh giá 2 lượt/model hay consistency.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R8.4 — R8 / Nghiên cứu
- Yêu cầu: [P1]. Kiểm tra safety, bảo mật prompt injection, tình huống người dùng vị thành niên, quan hệ giữa score model và văn bản Gemini; human review cho trường hợp quan trọng. Bằng chứng: safety adversarial test.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CHƯA THỰC NGHIỆM; Chưa có bộ adversarial safety thực thi.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R8.5 — R8 / Nghiên cứu
- Yêu cầu: [P1]. Lưu model/prompt version, input evidence ID, source, timestamp, rubric scorer, error categories; thống kê success/failure, giới hạn. Bằng chứng: AI evaluation report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: CHƯA THỰC NGHIỆM; Chưa có LLM evaluation report per-case.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R9.1 — R9 / Nghiên cứu
- Yêu cầu: [P0]. Viết và freeze Statistical Analysis Plan trước khi xem final outcomes; xác định estimand, primary metric, CI, missingness, outlier, subgroup, multiplicity. Bằng chứng: immutable SAP version + timestamp.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R9.2 — R9 / Nghiên cứu
- Yêu cầu: [P0]. Có repo research/ tối thiểu: protocol/, data/, scripts/, models/, evaluations/, results/, figures/, logs/, reports/; không đưa PII/secret vào repo. Bằng chứng: directory tree and README.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R9.3 — R9 / Nghiên cứu
- Yêu cầu: [P0]. Chạy end-to-end reproducible run từ dataset hash, code commit, Python/package lock, seed, feature/model version đến figures/tables; cùng điều kiện ra kết quả tương đương. Bằng chứng: run manifest and replication log.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R9.4 — R9 / Nghiên cứu
- Yêu cầu: [P1]. Có Research Decision Log, Negative Result Log, AI Usage Log, Contribution Log và người phụ trách từng quyết định; chỉnh sau outcome đánh dấu post-hoc. Bằng chứng: audit logs.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R9.5 — R9 / Nghiên cứu
- Yêu cầu: [P1]. Báo descriptive, effect size, confidence interval, error calibration, sensitivity; không cherry-pick và không dùng p-value như minh chứng duy nhất. Bằng chứng: tables/figures linked to code.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R9.6 — R9 / Nghiên cứu
- Yêu cầu: [P0]. Claim–Evidence Matrix cho tất cả tuyên bố: evidence ID + loại T/S/O/E/D + mức claim P0–P4 + trạng thái VALIDATED/LIMITED/NOT TESTED/UNSUPPORTED. Bằng chứng: reviewed matrix.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R9.7 — R9 / Nghiên cứu
- Yêu cầu: [P1]. Tạo Data Card, Model Card, Version/Lineage, Privacy/Threat Model; ghi limitations/negative findings để người khác tái hiện được. Bằng chứng: governance bundle.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R10.1 — R10 / Nghiên cứu
- Yêu cầu: [P1]. Viết báo cáo khoa học hoàn chỉnh: abstract, vấn đề, novelty có giới hạn, phương pháp, dữ liệu, kết quả, CI, hạn chế, đạo đức/bảo mật, hướng phát triển. Mọi kết quả có source/figure ID. Bằng chứng: final report.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R10.2 — R10 / Nghiên cứu
- Yêu cầu: [P1]. Chuẩn bị demo 30 giây, thuyết trình 3 phút, bảo vệ 10 phút; 7 module và closed loop là kiến trúc, không là 7 bằng chứng khác nhau. Bằng chứng: storyboard, video/local demo plan.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R10.3 — R10 / Nghiên cứu
- Yêu cầu: [P1]. Chuẩn bị ít nhất 12 câu phản biện từ Master Protocol, đặc biệt validity SCI/MAS/CSL, leakage, ML calibration, causal claims, sample size, việc AI hỗ trợ phát triển. Bằng chứng: defense Q&A.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R10.4 — R10 / Nghiên cứu
- Yêu cầu: [P1]. Figure set tối thiểu: dataflow, RQ/design, participant flow, index sensitivity, baseline-vs-model, calibration hoặc missingness, Static vs Adaptive architecture, Evidence Record trace; thiếu dữ liệu thì hiển thị not evaluable, không giả biểu đồ. Bằng chứng: reproducible figures.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

### R10.5 — R10 / Nghiên cứu
- Yêu cầu: [P0]. Giữ 3 mục tiêu phấn đấu: Giải Nhất tỉnh ≥95%, chọn thi Quốc gia ≥80%, Top 3 Quốc gia ≥50%, nhưng không viết như xác suất đo được. Bằng chứng: claim scan toàn tài liệu/presentation.
- Tracker CP24: CHƯA GHI NHẬN BẮT ĐẦU; nghiệm thu: **CHƯA NGHIỆM THU**.
- CP25: KHÔNG CÓ BẰNG CHỨNG MỚI; Chưa kiểm tra bổ sung theo CP25.
- Thiếu: Thực thi đầy đủ yêu cầu gốc; lưu log/screenshot/số liệu phù hợp và người nghiệm thu.

---
**Không gọi “100% Website/Nghiên cứu”** khi chưa có dữ liệu nghiên cứu hợp lệ, E2E và nghiệm thu theo Master V3. Tất cả đường dẫn tuyển sinh/học bổng có thể thay đổi; cần đọc thông báo năm và chương trình thực tế trước khi nộp hồ sơ.
