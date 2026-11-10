# COGNITIVE LEARN AI — DANH SÁCH CÒN CẦN HOÀN THÀNH

**Bản nguồn:** `CLA9_CP29_QA_RESEARCH_TRANSITION_20261109.zip` + vá trình bày chatbot CP30 (09/11/2026).

**Cơ sở:** checklist kiểm toán CP29 gồm 166 dòng, trong đó 2 dòng chatbot cũ không còn áp dụng; còn **164 dòng có hiệu lực**. Đây là danh sách điều kiện còn phải hoàn thiện/kiểm chứng, **không có nghĩa 164 chức năng chưa được viết**.

| Điểm kiểm toán CP29 | Số mục | Ý nghĩa |
|---:|---:|---|
| 0% | 43 | Chưa có bằng chứng đáp ứng |
| 25% | 49 | Có khung/đặc tả/một phần code |
| 50% | 45 | Có lõi chức năng, chưa đủ tích hợp/dữ liệu |
| 75% | 27 | Có code và kiểm tra tự động, chưa đủ nghiệm thu |
| 100% | 0 | Chưa mục nào có đủ evidence runtime/E2E theo điều kiện gốc |

**CP30 mới:** Chỉ cải thiện typography/màu tương phản của chatbot và thêm kiểm tra tĩnh. Không tự đổi điểm của toàn bộ checklist hay tuyên bố toàn hệ thống đã nghiệm thu.

## A. 14 việc P0 cần ưu tiên

- [ ] **A2 · 50%** — Hoàn tất kiểm toán lịch sử Git/secret, đánh giá xoay khóa và xác minh gói release sạch.
- [ ] **A3 · 50%** — Chạy npm ci sạch, TypeScript frontend/API và Vite production build trong CI có dependencies đầy đủ.
- [ ] **A4 · 75%** — Browser route smoke đủ đường dẫn học sinh/giáo viên/phụ huynh/Admin, thử refresh deep-link.
- [ ] **B2 · 75%** — Test tài khoản thật active/inactive/khác vai trò trên AccessGate và Firestore Rules.
- [ ] **C3 · 50%** — Chạy Emulator matrix allow/deny đúng UID, role và các collection.
- [ ] **C4 · 75%** — Negative test khóa bốn môn lựa chọn ở cả UI và Rules, kiểm tra tương thích dữ liệu cũ.
- [ ] **D3 · 75%** — Hoàn thiện quy trình ngoại lệ mở khóa môn có phê duyệt/audit, kiểm thử ba năm.
- [ ] **H1 · 0%** — Hoàn thiện toàn luồng Seed→Lumen→Orion→check-in→outcome→tái đo→adapt với Evidence Record replay được.
- [ ] **I3 · 50%** — Tích hợp Firebase Emulator cho toàn bộ collection theo role và UID.
- [ ] **I4 · 0%** — Chạy E2E desktop/mobile, 22 tác vụ Nexus, refresh/deep-link và quy trình người dùng.
- [ ] **K15 · 0%** — Xác nhận chức năng quản trị người dùng có trong scope; nếu có, xây API đặc quyền, MFA, audit và test quyền.
- [ ] **C25-06 · 50%** — Mở rộng nguồn tuyển sinh chính thức 2024–2026 theo trường/ngành/phương thức, có năm, nguồn và TTL.
- [ ] **C25-14 · 0%** — Tạo kho học bổng có URL chính thức, điều kiện, chứng chỉ, hạn nộp và ngày kiểm tra.
- [ ] **C25-18 · 0%** — Triển khai staging, kiểm thử smoke, backup/rollback, kiểm tra lại source và ký nghiệm thu.

## B. Toàn bộ checklist 164 mục theo nhóm

### I. Website MVP — 76 mục

- [ ] **A1 [P1] · 25%** — Chốt một commit GitHub chính thức (commit SHA, nhánh release), so với CLA(5) và các checkpoint; không ghi đè chỉnh sửa mới.
- [ ] **A2 [P0] · 50%** — Bỏ .env, .env.local, node_modules, artifact không cần khỏi gói public/git; kiểm tra secret đã từng lộ, xoay key nếu cần.
- [ ] **A3 [P0] · 50%** — npm ci, npx tsc -b và npm run build trên môi trường chuẩn: exit code 0.
- [ ] **A4 [P0] · 75%** — Route thực sự tồn tại: /student, /student/profile, /student/transcript, /student/modules, /student/storage, /lumen, /atlas, /orion, /pulse, /haven, /teacher, /parent, /admin. CLA(5) đang thiếu /student/storage trong App.tsx.
- [ ] **A5 [P1] · 50%** — Vercel/Firebase Hosting rewrite hợp lệ cho SPA, giữ /api/* hoạt động; CLA(5) chưa liệt kê /student/modules và /student/storage trong vercel.json.
- [ ] **A6 [P1] · 0%** — Kiểm tra chunk lớn, lỗi console, network requests, loading/error/empty ở desktop/mobile.
- [ ] **B1 [P1] · 25%** — Tài khoản Student/Teacher/Parent/Admin đăng nhập, đăng xuất, reset password theo đúng vai trò.
- [ ] **B2 [P0] · 75%** — AccessGate.tsx thống nhất yêu cầu active === true với Security Rules (CLA5 còn điều kiện active === false).
- [ ] **B3 [P1] · 75%** — Không cho tự tạo role Admin từ client; phục hồi Admin bằng quy trình tin cậy.
- [ ] **B4 [P1] · 25%** — Admin Demo chỉ đọc/ghi dữ liệu demo tại chính UID Admin, có nhãn dataScope=demo; không có quyền viết UID Student khác.
- [ ] **B5 [P1] · 25%** — Teacher/Parent không được truy cập Student profile riêng nếu không có cơ chế chia sẻ được học sinh đồng ý.
- [ ] **B6 [P1] · 0%** — Xử lý lỗi Authentication, token hết hạn, trình duyệt mới, đa thiết bị và chuyển vai trò không để lại trạng thái nhầm.
- [ ] **C1 [P1] · 25%** — Chốt schema + collection: users, learning_profiles, student_transcripts, atlas_workspaces, orion_drafts, pulse_drafts, haven_drafts, student_links, student_shared_reports, cognitive_history dưới profile; không tạo collection trùng mục đích.
- [ ] **C2 [P1] · 25%** — Hợp nhất Rules Checkpoint 18 (Admin Demo) + Checkpoint 19 (khóa tổ hợp) + collections Checkpoint 13; KHÔNG dùng firestore.rules.CANDIDATE cũ trong CLA5.
- [ ] **C3 [P0] · 50%** — Run Firebase Emulator Rules test: mỗi role read/write đúng UID, deny cross-UID, quyền update/delete, truy vấn danh sách link/report.
- [ ] **C4 [P0] · 75%** — Server-enforced bất biến bốn môn lựa chọn sau lần khóa; kiểm tra cả khi ghi learning_profiles và student_transcripts, không làm hỏng dữ liệu lịch sử.
- [ ] **C5 [P1] · 50%** — Ghi bảng điểm và hồ sơ đồng bộ bằng batch/transaction; một lần ghi lỗi phải thông báo và không tạo trạng thái nửa vời.
- [ ] **C6 [P1] · 50%** — Không mặc định dữ liệu chưa có là 0; phân biệt missing/partial/complete, dataScope demo và dữ liệu thật; bảo đảm dữ liệu learning_profiles cũ vẫn có thể đọc/migrate.
- [ ] **C7 [P1] · 25%** — Realtime sync từ tài khoản A trên hai phiên/trình duyệt: lưu → tải lại → xem Dashboard/kho; phòng ngừa ghi đè bản cũ; có updatedAt, lỗi quyền cụ thể.
- [ ] **C8 [P1] · 0%** — Xuất/xóa dữ liệu có xác thực, chính sách giữ dữ liệu và phương án sao lưu/phục hồi; không lưu dữ liệu nhạy cảm không cần thiết.
- [ ] **C9 [P1] · 0%** — Rà soát dự án Firebase thật, Auth provider, Firestore indexes, quota, environment; không dùng system_health write public.
- [ ] **D1 [P1] · 50%** — Mục nhập hồ sơ: tải dữ liệu cũ trước khi cho ghi; báo chính xác collection lỗi; retry an toàn, không overwrite.
- [ ] **D2 [P1] · 75%** — Chương trình học 4 môn chung + 4 môn lựa chọn + Giáo dục quốc phòng và an ninh = 9 môn điểm số trong phạm vi cấu hình đang dùng; xử lý những môn đánh giá nhận xét nếu hỗ trợ.
- [ ] **D3 [P0] · 75%** — Bốn môn lựa chọn chọn đúng một lần, khóa cho ba năm; có quy trình sửa ngoại lệ qua người có thẩm quyền kèm audit log, không tự mở khóa bằng UI.
- [ ] **D4 [P1] · 75%** — Từng ô điểm cho phép trống hoặc số 0–10, bao gồm số thập phân; từ chối NaN, âm, lớn hơn 10; điểm 0 hợp lệ.
- [ ] **D5 [P1] · 50%** — Mục 05 tài chính/du học/học bổng không bắt buộc; trống phải lưu null/missing, không giả số 0.
- [ ] **D6 [P1] · 50%** — GPA học kỳ/năm hiển thị rõ chính thức và tạm tính; không tính môn học cũ ngoài tổ hợp hiện tại, nhưng giữ lịch sử.
- [ ] **D7 [P1] · 50%** — /student/transcript và Dashboard đọc cùng student_transcripts/{uid}, cùng phiên bản phép tính; làm mới không mất điểm.
- [ ] **D8 [P1] · 25%** — Empty/error/loading states; không trình bày dữ liệu mẫu như dữ liệu học sinh thực.
- [ ] **E1 [P1] · 75%** — Nexus Core: điều phối context và điều hướng giữa module; hoàn thiện bảy trang/cụm kiểm thử Admin theo K1–K19; không tái tính business logic trong UI.
- [ ] **E2 [P1] · 50%** — Seed Profile: dùng dữ liệu Firestore duy nhất, có trạng thái, lịch sử và phiên bản; cognitive composite được ghi nhãn thử nghiệm.
- [ ] **E3 [P1] · 50%** — Lumen Intelligence: input có cấu trúc, giải thích theo dữ liệu thực và có error state khi Gemini/engine thất bại; Admin phải mở đúng /lumen, có công cụ audit SCI/MAS/CSL và dữ liệu ML. Xem K7–K10.
- [ ] **E4 [P1] · 50%** — Atlas Admission: Knowledge Base lưu Firestore, không chỉ localStorage; hiển thị provenance của điểm chuẩn, nguồn tuyển sinh và ngày hiệu lực.
- [ ] **E5 [P1] · 25%** — Orion Strategy: điểm trống không thành 0; can thiệp có kế hoạch, lịch thực hiện, trạng thái và lưu nháp Firestore.
- [ ] **E6 [P1] · 50%** — Pulse Monitor: đọc outcome và lịch sử hợp lệ, không tự báo 'tiến bộ' nếu thiếu lần đo; báo cáo lưu/tải được.
- [ ] **E7 [P1] · 50%** — Haven Support: ngân sách tùy chọn, không suy xác suất học bổng từ fit score; nguồn học bổng có hạn, ngày lấy dữ liệu và đường dẫn chính thức.
- [ ] **E8 [P1] · 25%** — Một bộ hồ sơ có thể đi qua Seed → Lumen → Orion → Pulse (và Atlas/Haven nếu cần) mà không nhập đi nhập lại dữ liệu hoặc mâu thuẫn kết quả.
- [ ] **F1 [P1] · 50%** — Student tạo/thu hồi liên kết đúng UID; Teacher/Parent chỉ xem những gì học sinh đã chủ động chia sẻ.
- [ ] **F2 [P1] · 50%** — Báo cáo chia sẻ: tạo, nhận xét đúng một lần, xuất, thu hồi, không rò dữ liệu sau thu hồi.
- [ ] **F3 [P1] · 50%** — Admin có Nexus Console vận hành thực tế: xem trạng thái hệ thống, tài khoản/role theo quyền, các phép kiểm tra dữ liệu và engine, không tự có quyền sửa dữ liệu Student; muốn chỉnh hộ phải có quy trình phân quyền/audit riêng. Xem K1–K19.
- [ ] **F4 [P1] · 25%** — Các trường hợp đã xóa tài khoản, liên kết cũ, không có dữ liệu, lỗi mạng có trạng thái phù hợp.
- [ ] **G1 [P1] · 25%** — /api/health, gemini-lumen, gemini-admission-reader chạy thật; Auth, CORS, limit, model và env chuẩn; không leak key.
- [ ] **G2 [P1] · 75%** — Gemini chỉ diễn giải Evidence Record; score/probability/eligibility do engine được xác định tạo; không bịa nguồn/deadline.
- [ ] **G3 [P1] · 75%** — Nếu không có outcome-labelled calibrated model, ghi rõ fit/scenario, không gọi đó là xác suất thành công; không dùng ngôn ngữ nhân quả tùy tiện.
- [ ] **G4 [P1] · 50%** — Kiểm tra prompt injection, quá tải, timeout, quota, retry/fallback và thông báo lỗi phù hợp.
- [ ] **H1 [P0] · 0%** — Có một chuỗi kiểm thử được: trạng thái đầu vào → khuyến nghị → kế hoạch hành động → check-in → outcome → tái đo → cập nhật strategy.
- [ ] **H2 [P1] · 75%** — Mỗi kết quả quan trọng có snapshot ID, engine/version, công thức, factors, limitations và timestamp; demo cần có nhãn không phải dữ liệu nghiên cứu thật.
- [ ] **H3 [P1] · 0%** — Recommendation có lựa chọn chấp nhận/từ chối và nhật ký thay đổi; human override khi quyết định quan trọng.
- [ ] **H4 [P1] · 50%** — Không hiển thị 'cải thiện nhờ CLA' nếu chỉ có mô phỏng hoặc thay đổi quan sát.
- [ ] **I1 [P1] · 75%** — Thêm script test, test runner và CI. CLA5 hiện không có thư mục tests và workflow.
- [ ] **I2 [P1] · 75%** — Unit tests cho GPA 9 môn, khóa tổ hợp, indices, prediction/scenario và data validation.
- [ ] **I3 [P0] · 50%** — Firebase Emulator integration/security tests cho mỗi vai trò và tất cả collections.
- [ ] **I4 [P0] · 0%** — Browser E2E mobile/desktop cho luồng chính, toàn bộ 22 hành động Nexus Console và refresh deep links.
- [ ] **I5 [P1] · 50%** — Kiểm tra empty/loading/error, responsive, keyboard accessibility, lỗi JS runtime và Network.
- [ ] **J1 [P1] · 25%** — Có README hiện hành, schema/route/role matrix, config env không chứa giá trị secret, hướng dẫn deploy rollback.
- [ ] **J2 [P1] · 25%** — Release notes theo commit, version deployment, monitoring lỗi và phương án phục hồi.
- [ ] **J3 [P1] · 25%** — Bảng nghiệm thu có ngày, người kiểm tra, PASS/FAIL/NOT TESTED, screenshot/log và lỗi tồn tại; không công bố 100% nếu còn P0.
- [ ] **K1 [P1] · 50%** — [P0, F3/A4]. Xây trang/tầng dữ liệu Tổng quan hệ thống thật, không hiển thị KPI bịa đặt. Phải có trạng thái Auth, Firestore, API, Gemini, module status, source freshness, thời điểm kiểm tra; lỗi không được biểu diễn là "đang hoạt động".
- [ ] **K2 [P1] · 50%** — [P0, B4/F3]. Xem như học sinh phải lưu/đọc được demo dưới UID Admin, có dataScope=demo và nhãn demo rõ. Không impersonate UID thật; refresh vẫn giữ đúng vai trò.
- [ ] **K3 [P1] · 50%** — [P0, B5/F1]. Xem như giáo viên dùng quyền hiện tại hoặc dữ liệu giả lập được ghi nhãn. Không có quyền đọc báo cáo học sinh ngoài liên kết/đồng ý hợp lệ.
- [ ] **K4 [P1] · 50%** — [P0, B5/F1]. Xem như phụ huynh tương tự K3; tuyệt đối không cấp quyền từ tham số ?from=admin.
- [ ] **K5 [P1] · 75%** — [P0, D1/C6]. Seed — kiểm tra dữ liệu nền: kiểm tra tồn tại profile/transcript, schemaVersion, UID, tổ hợp 4 môn, 9 môn cấu hình, GPA, dữ liệu null/partial/complete, lịch sử và scope demo; chỉ hiển thị dữ liệu mà Admin có quyền truy cập.
- [ ] **K6 [P1] · 75%** — [P0, C3/D3]. Seed audit có trạng thái PASS/WARN/FAIL, thông tin lỗi và kiểm tra bất biến Firestore; thao tác kiểm tra không tự sửa dữ liệu. Không mở quyền đọc toàn bộ collection chỉ để làm màn kiểm tra.
- [ ] **K7 [P1] · 75%** — [P1, A4/E3]. Đổi liên kết Admin "Xem phân tích nhận thức" từ /student sang /lumen hoặc anchor Lumen thật; kiểm tra sau reload/deep-link.
- [ ] **K8 [P1] · 75%** — [P1, E3/I2]. Lumen — kiểm tra Cognitive Engine: input→rule/formula→SCI/MAS/CSL→factors→warning→version. Test dữ liệu thiếu, số 0 hợp lệ, giá trị biên và lịch sử giả lập.
- [ ] **K9 [P1] · 75%** — [P1, G3/H2]. Phân biệt điểm proxy SCI/MAS/CSL với thang đo đã thẩm định; không gắn nhãn "đã kiểm định khoa học" nếu chưa có reliability/validity trên dữ liệu phù hợp.
- [ ] **K10 [P1] · 50%** — [P1, H2/I2]. Lumen — chuẩn bị dữ liệu ML: kiểm tra cấu trúc dataset, nhãn outcome, độ thiếu dữ liệu, trùng lặp/leakage, thời gian, consent và chia train/validation/test theo học sinh/thời gian; xuất dữ liệu đã khử định danh hợp lệ. Không tuyên bố có ML model nếu mới có pipeline chuẩn bị.
- [ ] **K11 [P1] · 75%** — [P1, E4/G2]. Atlas: cả 3 thẻ phải truy cập đúng khu vực, nguồn tuyển sinh phải có ngày/năm, phương thức xét tuyển/điểm chuẩn và kiểm tra KB sau reload.
- [ ] **K12 [P1] · 50%** — [P1, E5/H1]. Orion: tách anchor/panel cho kiểm tra kịch bản và roadmap; có 3 chiến lược, milestone, lưu/check-in/outcome và trace.
- [ ] **K13 [P1] · 50%** — [P1, E6/H2]. Pulse: phân tách panel báo cáo và rủi ro; giải thích trend/risk khi dữ liệu có hoặc không có lần đo, không biến số 0 kỹ thuật thành cảnh báo.
- [ ] **K14 [P1] · 50%** — [P1, E7/G3]. Haven: liên kết thẳng tới đề xuất học bổng và hỗ trợ theo vai trò; tách trường hợp thiếu ngân sách, nguồn không xác minh, học bổng hết hạn hoặc không đạt eligibility.
- [ ] **K15 [P0] · 0%** — [P0, B3/F3]. Bổ sung quản lý người dùng đúng quyền nếu là chức năng cam kết của Nexus: thống kê tài khoản/tình trạng/role qua backend đặc quyền, thay đổi role hoặc active chỉ qua quy trình tin cậy có audit log; không cho client query toàn bộ users bằng Rules rộng.
- [ ] **K16 [P1] · 25%** — [P1, A4/I4]. Toàn bộ 22 thẻ: link/anchor đúng đích, không 404; nhấn back, refresh, deep link và thiết bị di động hoạt động. Thẻ chưa làm phải hiển thị trạng thái thật thay vì ghi "Mở chức năng".
- [ ] **K17 [P1] · 50%** — [P1, B4/C3]. Ma trận role × Admin Console: Student/Parent/Teacher không vào /admin; Admin xem demo nhưng không đọc/ghi tài liệu UID Student khác. Kiểm thử bằng Firebase Emulator và E2E.
- [ ] **K18 [P1] · 25%** — [P2, I5/J3]. Thay nhãn trạng thái tĩnh ready/soon bằng status đủ bằng chứng (UI available / endpoint reachable / data verified / test PASS) và nhật ký lần kiểm tra, không tạo số liệu giả.
- [ ] **K19 [P1] · 0%** — [P2, A6/I4]. Kiểm thử cả 7 ảnh trên desktop/mobile, menu trái, sidebar trạng thái active, header/logo, nút mở, accessibility, loading/error states, không trùng lặp các bảng điều hướng sau CP20.

### II. Nghiên cứu — 69 mục

- [ ] **R1.1 [P1] · 25%** — [P0]. Viết chính xác problem statement của CLA: vấn đề ra quyết định học tập, vòng lặp động, khoảng trống giữa assessment–prediction–intervention–outcome–adaptation; tránh coi nhiều module là điểm mới duy nhất.
- [ ] **R1.2 [P1] · 25%** — [P0]. Chốt RQ1–RQ5 có thể đo được theo Master Protocol: chỉ số SCI/MAS/CSL; prediction incremental utility; simulation agreement; Static vs Adaptive; explainability/calibrated trust. RQ nào không có dữ liệu phải ghi not evaluable và thu hẹp claim.
- [ ] **R1.3 [P1] · 0%** — [P0]. Viết H0/H1, primary/secondary outcome, estimand và điều kiện phủ định cho từng RQ; không thay đổi outcome sau khi xem kết quả.
- [ ] **R1.4 [P1] · 25%** — [P1]. Lập literature matrix với nguồn học thuật có thể kiểm chứng về SRL, learning analytics, educational recommender, intervention, XAI, psychometrics; ghi DOI/URL và ngày tra cứu.
- [ ] **R1.5 [P1] · 25%** — [P1]. Lập competitor/architecture matrix theo các trục predict, simulate, intervene, measure outcome, adapt, evidence/provenance; không tuyên bố CLA là duy nhất khi chưa chứng minh.
- [ ] **R1.6 [P1] · 25%** — [P0]. Ghi contribution statement theo P0–P4 từ Master Protocol; chia cái có demo, cái có validation và cái còn hypothesis.
- [ ] **R2.1 [P1] · 25%** — [P0]. Lập inventory mọi nguồn dữ liệu dự kiến dùng: CLA Firestore, log trước đây, nguồn mở, bảng tuyển sinh/học bổng; ghi người sở hữu, mục đích thu ban đầu, quyền nghiên cứu, hạn chế và thời hạn lưu.
- [ ] **R2.2 [P1] · 0%** — [P0]. Chỉ đưa dữ liệu học sinh thật vào nghiên cứu khi có căn cứ pháp lý và consent/assent phù hợp cho mục đích ấy; đồng ý sử dụng app không mặc nhiên là đồng ý nghiên cứu. Nếu thiếu căn cứ thì loại dữ liệu đó, không tự suy diễn.
- [ ] **R2.3 [P1] · 50%** — [P0]. Tách dataScope=demo, test/synthetic, dữ liệu thật và dữ liệu nghiên cứu; ID pseudonym khác UID Firebase; không cho dữ liệu demo vào cohort phân tích.
- [ ] **R2.4 [P1] · 0%** — [P0]. Xác định chính sách retention, xóa/rút lui, quản lý người truy cập, backup mã hóa, kiểm toán xuất dữ liệu; dùng các trường dữ liệu tối thiểu.
- [ ] **R2.5 [P1] · 25%** — [P1]. Kiểm soát role, cross-UID, prompt injection, key exposure, data poisoning, model memorization/membership risk, kiểm soát admin có MFA nếu triển khai.
- [ ] **R2.6 [P1] · 25%** — [P1]. Quy định human-in-the-loop: học sinh có quyền từ chối khuyến nghị; thông báo không phải chẩn đoán/định hướng chắc chắn; cơ chế xử lý nội dung có dấu hiệu nguy cơ.
- [ ] **R2.7 [P1] · 25%** — [P1]. Nếu dùng dữ liệu công khai/thứ cấp, lưu license, source/version và điều kiện phân phối; không suy ra population CLA giống population nguồn ngoài.
- [ ] **R3.1 [P1] · 0%** — [P0]. Audit thực tế dữ liệu hiện có: số record đủ điều kiện theo nguồn, ID, học kỳ, timestamp, outcome và consent; báo riêng tổng record/eligible unique students/records usable, không ước lượng.
- [ ] **R3.2 [P1] · 25%** — [P0]. Tạo data dictionary về điểm 9 môn, dataScope, behavior event, plan completion, intervention, outcome, SCI/MAS/CSL, source, missing reason, schemaVersion; ghi data type, range, unit, timing.
- [ ] **R3.3 [P1] · 25%** — [P0]. Thiết kế event_log và measurement_snapshot với timestamp, anonymous participant ID, task/plan, recommendation accepted/rejected, adherence và observed outcome; log chưa có nghĩa là đã có dữ liệu quá khứ.
- [ ] **R3.4 [P1] · 0%** — [P0]. Tạo raw immutable + corrected layer, dataset hash/version, transform pipeline có log; không sửa trực tiếp dữ liệu thô để kết quả 'đẹp'.
- [ ] **R3.5 [P1] · 50%** — [P0]. QA range/missingness: điểm 0–10, null vs zero, môn ngoài tổ hợp, timestamps, 4 môn cố định, event duplicate/impossible sequence, outcome lấy trước hay sau prediction.
- [ ] **R3.6 [P1] · 25%** — [P0]. Định nghĩa primary learning outcome và labeling window; không dùng cùng outcome làm feature dự báo chính outcome đó, không trộn train và test của cùng participant khi giả thuyết yêu cầu generalization.
- [ ] **R3.7 [P1] · 0%** — [P1]. Có bảng participant/cohort flow theo eligibility, exclusions, timepoints T0/T1/T2, phân tích missing/attrition; nếu thiếu thời điểm, ghi không thể ước lượng thay đổi.
- [ ] **R3.8 [P1] · 0%** — [P1]. Phân tích descriptive không suy đoán: n, phân phối, phân nhóm lớp, số lần đo, missing rates, data freshness; hạn chế subgroup nếu số mẫu thấp.
- [ ] **R3.9 [P1] · 75%** — [P1]. Xác định dữ liệu minh họa/synthetic dùng cho thử nghiệm deterministic, không đưa vào bảng accuracy/ML/hiệu quả học tập thật.
- [ ] **R4.1 [P1] · 25%** — [P0]. Freeze định nghĩa vận hành SCI=goal-plan-action coherence; MAS=motivation/action stability; CSL=operational cognitive stability, không gắn nghĩa năng lực lâm sàng.
- [ ] **R4.2 [P1] · 25%** — [P0]. Freeze công thức, trọng số, window, clipping, missing data, xử lý 0, fallback, confidence/uncertainty và version mỗi chỉ số.
- [ ] **R4.3 [P1] · 50%** — [P0]. Kiểm tra kỹ thuật: deterministic output, boundary cases, invariants, sensitivity khi đổi trọng số/window, missingness và outliers; kết quả phải tái lập.
- [ ] **R4.4 [P1] · 0%** — [P1]. Rà soát content validity bằng cơ sở lý thuyết, chuyên gia/phản hồi đã có và được phép sử dụng nếu tồn tại; không ghi đạt content validation nếu không có chứng cứ phù hợp. Không yêu cầu phỏng vấn mới.
- [ ] **R4.5 [P1] · 0%** — [P1]. Nếu có dữ liệu thật lặp lại đủ điều kiện: kiểm tra test–retest/ICC và 95% CI, item/internal consistency (chỉ khi đúng construct), convergent/discriminant/criterion hypotheses; không dùng alpha cao để khẳng định mọi thứ.
- [ ] **R4.6 [P1] · 75%** — [P1]. Nếu không đủ dữ liệu psychometric, đổi nhãn trong UI/báo cáo thành exploratory behavioral composite/proxy, không nói validated psychological index.
- [ ] **R4.7 [P1] · 0%** — [P1]. Phân tích responsiveness nếu có nhiều thời điểm hợp lệ; không gọi chỉ số tăng là tác động do CLA nếu không có comparator.
- [ ] **R5.1 [P1] · 25%** — [P0]. Chốt target dự báo có outcome đo được (điểm kỳ sau, plan completion, rủi ro bỏ dở...), prediction horizon, dữ liệu sẵn tại thời điểm dự báo; tách 'fit score' và 'probability'.
- [ ] **R5.2 [P1] · 50%** — [P0]. Chạy audit chống leakage: future score, post-intervention feature, within-student leakage, duplicate, preprocessing trước split, target-derived features.
- [ ] **R5.3 [P1] · 25%** — [P1]. Nếu dataset đủ điều kiện: tạo participant-level/temporal train–validation–holdout split, freeze trước tuning; ghi seed/version/count.
- [ ] **R5.4 [P1] · 25%** — [P1]. Chạy baseline: last-score/mean, linear/logistic/academic-only theo loại outcome; luôn báo baseline cùng tập test.
- [ ] **R5.5 [P1] · 0%** — [P1]. Huấn luyện mô hình phức tạp chỉ khi phù hợp dữ liệu; toàn bộ imputation/normalization/feature selection fit trong train; không chỉ ghi RandomForest/XGBoost là chất lượng.
- [ ] **R5.6 [P1] · 0%** — [P1]. Báo MAE/RMSE/R² hoặc AUC/Brier/PR-AUC theo đúng task; CI/bootstraps phù hợp participant, calibration và lỗi theo giai đoạn, nhóm hợp lệ.
- [ ] **R5.7 [P1] · 0%** — [P1]. Ablation: academic-only, +behavior, +SCI/MAS/CSL, full; ghi cả negative results, không chọn model vì đẹp trên test.
- [ ] **R5.8 [P1] · 25%** — [P1]. OOD, drift, uncertainty/abstention và failure analysis; nếu không có calibrated outcomes thì UI không hiển thị xác suất đỗ hay tăng điểm.
- [ ] **R5.9 [P1] · 25%** — [P1]. Lưu model card, data card, feature/label version, model artifact và cách rollback; nếu không đủ outcome, giữ rule-based và báo NOT VALIDATED, không tự nhận ML đã hoàn thiện.
- [ ] **R6.1 [P1] · 25%** — [P0]. Phân loại rõ deterministic scenario calculator, predictive scenario, mechanistic assumptions, causal counterfactual; hiện tại không tự nhận nhân quả.
- [ ] **R6.2 [P1] · 75%** — [P0]. Freeze 3 chiến lược Orion (cân bằng/tập trung/bứt phá), input bounds, constraints, assumption, thời gian/dose và deterministic golden cases.
- [ ] **R6.3 [P1] · 25%** — [P1]. Trước khi quan sát outcome, lưu dự đoán/simulation v1 bất biến ở T0, không tính lại quá khứ bằng model mới rồi giả là dự báo cũ.
- [ ] **R6.4 [P1] · 0%** — [P1]. Nếu có longitudinal outcome: so predicted vs observed Δ, direction accuracy, delta MAE và scenario ranking, kèm CI.
- [ ] **R6.5 [P1] · 0%** — [P1]. Theo dõi adherence và phân tích vì sao scenario không được thực hiện; không coi mismatch do không tuân thủ là lỗi dự báo thuần túy.
- [ ] **R6.6 [P1] · 75%** — [P1]. Gắn cảnh báo trong UI: 'Mô phỏng theo mô hình và giả định hiện tại, không phải cam kết tăng điểm hay quan hệ nhân quả'.
- [ ] **R7.1 [P1] · 0%** — [P0]. Hoàn thiện một vòng có thể trace: snapshot → assessment → recommendation → intervention plan → check-in → observed outcome → reassessment → adaptation; dữ liệu demo chỉ chứng minh kỹ thuật.
- [ ] **R7.2 [P1] · 25%** — [P0]. Freeze adaptation policy theo condition/threshold, intervention taxonomy, dose, adherence, human override; không để LLM tự quyết định can thiệp không kiểm soát.
- [ ] **R7.3 [P1] · 0%** — [P1]. Xây CLA Static comparator cùng nền tảng, chỉ khác adaptive policy; định nghĩa treatment contrast.
- [ ] **R7.4 [P1] · 0%** — [P1]. Nếu có dữ liệu lịch sử hợp lệ, đánh giá retrospective/offline replay và nêu rõ không phải thử nghiệm nhân quả; ghi selection bias/coverage.
- [ ] **R7.5 [P1] · 0%** — [P1]. Nếu có outcome longitudinal và nhóm so sánh hợp lệ, freeze primary estimand, SAP, missing/attrition, dùng effect size và 95% CI; nếu không có thì ghi NO EMPIRICAL EFFECTIVENESS EVIDENCE.
- [ ] **R7.6 [P1] · 0%** — [P1]. Phân biệt ITT/per-protocol khi thiết kế hỗ trợ; dùng mixed/repeated measures đúng assumptions; không diễn giải quan sát trước–sau thành do CLA gây ra.
- [ ] **R7.7 [P1] · 25%** — [P1]. Ghi recommendation acceptance/rejection, action completion, fidelity, risk events và outcome do người dùng thật tạo; không tăng chỉ số demo thành nghiên cứu.
- [ ] **R7.8 [P1] · 25%** — [P0]. Kết luận nghiên cứu theo
- [ ] **R8.1 [P1] · 50%** — [P0]. Thiết kế bộ ít nhất 100 case có Evidence Record và bộ case lỗi/thiếu dữ liệu; bản tham chiếu khóa trước khi đánh giá.
- [ ] **R8.2 [P1] · 0%** — [P1]. Chấm factual groundedness/faithfulness theo evidence; mục tiêu nội bộ của Master Protocol: ≥95% factual fields traceable trên benchmark, không gọi tuyệt đối không hallucination.
- [ ] **R8.3 [P1] · 0%** — [P1]. Thử multiple runs để đo consistency; kiểm tra khi thiếu dữ liệu phải abstain, không bịa điểm, deadline, trường, học bổng hay xác suất.
- [ ] **R8.4 [P1] · 50%** — [P1]. Kiểm tra safety, bảo mật prompt injection, tình huống người dùng vị thành niên, quan hệ giữa score model và văn bản Gemini; human review cho trường hợp quan trọng.
- [ ] **R8.5 [P1] · 0%** — [P1]. Lưu model/prompt version, input evidence ID, source, timestamp, rubric scorer, error categories; thống kê success/failure, giới hạn.
- [ ] **R9.1 [P1] · 0%** — [P0]. Viết và freeze Statistical Analysis Plan trước khi xem final outcomes; xác định estimand, primary metric, CI, missingness, outlier, subgroup, multiplicity.
- [ ] **R9.2 [P1] · 50%** — [P0]. Có repo research/ tối thiểu: protocol/, data/, scripts/, models/, evaluations/, results/, figures/, logs/, reports/; không đưa PII/secret vào repo.
- [ ] **R9.3 [P1] · 0%** — [P0]. Chạy end-to-end reproducible run từ dataset hash, code commit, Python/package lock, seed, feature/model version đến figures/tables; cùng điều kiện ra kết quả tương đương.
- [ ] **R9.4 [P1] · 0%** — [P1]. Có Research Decision Log, Negative Result Log, AI Usage Log, Contribution Log và người phụ trách từng quyết định; chỉnh sau outcome đánh dấu post-hoc.
- [ ] **R9.5 [P1] · 0%** — [P1]. Báo descriptive, effect size, confidence interval, error calibration, sensitivity; không cherry-pick và không dùng p-value như minh chứng duy nhất.
- [ ] **R9.6 [P1] · 50%** — [P0]. Claim–Evidence Matrix cho tất cả tuyên bố: evidence ID + loại T/S/O/E/D + mức claim P0–P4 + trạng thái VALIDATED/LIMITED/NOT TESTED/UNSUPPORTED.
- [ ] **R9.7 [P1] · 25%** — [P1]. Tạo Data Card, Model Card, Version/Lineage, Privacy/Threat Model; ghi limitations/negative findings để người khác tái hiện được.
- [ ] **R10.1 [P1] · 0%** — [P1]. Viết báo cáo khoa học hoàn chỉnh: abstract, vấn đề, novelty có giới hạn, phương pháp, dữ liệu, kết quả, CI, hạn chế, đạo đức/bảo mật, hướng phát triển. Mọi kết quả có source/figure ID.
- [ ] **R10.2 [P1] · 0%** — [P1]. Chuẩn bị demo 30 giây, thuyết trình 3 phút, bảo vệ 10 phút; 7 module và closed loop là kiến trúc, không là 7 bằng chứng khác nhau.
- [ ] **R10.3 [P1] · 0%** — [P1]. Chuẩn bị ít nhất 12 câu phản biện từ Master Protocol, đặc biệt validity SCI/MAS/CSL, leakage, ML calibration, causal claims, sample size, việc AI hỗ trợ phát triển.
- [ ] **R10.4 [P1] · 0%** — [P1]. Figure set tối thiểu: dataflow, RQ/design, participant flow, index sensitivity, baseline-vs-model, calibration hoặc missingness, Static vs Adaptive architecture, Evidence Record trace; thiếu dữ liệu thì hiển thị not evaluable, không giả biểu đồ.
- [ ] **R10.5 [P1] · 75%** — [P0]. Giữ 3 mục tiêu phấn đấu: Giải Nhất tỉnh ≥95%, chọn thi Quốc gia ≥80%, Top 3 Quốc gia ≥50%, nhưng không viết như xác suất đo được.

### III. Bổ sung CP25 — 18 mục còn hiệu lực

- [ ] **C25-01 [P1] · 75%** — Chat nổi có giao diện gõ/gửi
- [ ] **C25-02 [P1] · 50%** — Gemini chat trả lời từ backend /api/gemini-chat
- [ ] **C25-03 [P1] · 25%** — Rate limiting và an toàn khi chat
- [ ] **C25-06 [P0] · 50%** — Tra tuyển sinh trong nước 2024–2026
- [ ] **C25-07 [P1] · 50%** — Điểm trúng tuyển THPT theo 3 năm
- [ ] **C25-08 [P1] · 25%** — Phương thức SAT/ACT/TSA/HSA/học bạ… từng ngành và năm
- [ ] **C25-09 [P1] · 25%** — Liên kết đề án + điểm + cổng nộp trường
- [ ] **C25-10 [P1] · 25%** — Gợi ý trường phù hợp năng lực học sinh
- [ ] **C25-11 [P1] · 25%** — Xây công cụ xếp nguyện vọng trong nước
- [ ] **C25-12 [P1] · 75%** — Du học theo sáu quốc gia
- [ ] **C25-13 [P1] · 50%** — Đối chiếu ngôn ngữ và chứng chỉ quốc tế
- [ ] **C25-14 [P0] · 0%** — Học bổng quốc tế có deadline và điều kiện
- [ ] **C25-15 [P1] · 25%** — Chi phí du học + so sánh tài chính
- [ ] **C25-16 [P1] · 25%** — Giấy tờ/visa/application checklist
- [ ] **C25-17 [P1] · 50%** — UI/UX đồng bộ 7 module
- [ ] **C25-18 [P0] · 0%** — Release staging và nghiệm thu CP25
- [ ] **C25-19 [P1] · 50%** — Research: 120-case Gemini benchmark
- [ ] **C25-20 [P1] · 0%** — Research: outcomes/psychometrics/ML/adaptive

### IV. Giao diện/mascot — 1 mục

- [ ] **C26-01 [P1] · 75%** — Nút chatbot tròn ở góc phải với ảnh mascot CLA quay trái, giữ chức năng chat, responsive/accessibility

## C. Các mục không còn áp dụng

- [x] **C25-04 (phạm vi cũ):** Chatbot phân tích hồ sơ học sinh cá nhân hóa. Đã thay bằng điều hướng theo ngữ cảnh, không gửi transcript/điểm cá nhân lên chat.
- [x] **C25-05 (phạm vi cũ):** Chatbot tự lấy và trả điểm chuẩn/đề án thời gian thực. Đã thay bằng chỉ đường đến Atlas và Haven.

## D. Cách đóng từng mục

- Chỉ chuyển **100%** khi đáp ứng đầy đủ tiêu chí có thể kiểm tra và lưu evidence (log, test, ảnh UI, thông tin dataset, nguồn chính thức, biên bản nghiệm thu).
- Kết quả synthetic/demo có thể dùng kiểm thử kỹ thuật nhưng không thay cho kết quả nghiên cứu trên dữ liệu học sinh thật.
- `NOT TESTED`, `NOT EVALUABLE` và `BLOCKED` không được tự đổi thành `PASS`.
- Target 95%/80%/50% là mục tiêu KHKT nội bộ, không phải xác suất đạt giải đã được kiểm chứng.
