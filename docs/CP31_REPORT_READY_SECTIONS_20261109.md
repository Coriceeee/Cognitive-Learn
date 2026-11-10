# Cognitive Learn — Nội dung báo cáo có thể viết ngay (CP31)

**Ngày chốt bằng chứng:** 09/11/2026  
**Cơ sở:** Source CP30 + 5 tài liệu đặc tả/protocol trong Project + kiểm thử tự động được chạy lại trong phiên này.  
**Nguyên tắc:** Chỉ ghi điều đã có trong source hoặc log. Phân biệt thiết kế, triển khai, kiểm thử kỹ thuật, dữ liệu tổng hợp, dữ liệu quan sát và dữ liệu ngoài.

## 1. Phần có thể viết thành nội dung chính thức ngay

### 1.1. Đặt vấn đề và mục tiêu

Cognitive Learn được định hướng là hệ thống hỗ trợ học sinh hiểu hồ sơ học tập, xem xét trạng thái học tập, khám phá thông tin tuyển sinh và xây dựng kế hoạch hành động. Mục tiêu kiến trúc không dừng ở việc đưa ra khuyến nghị mà hướng tới chuỗi: hồ sơ → đánh giá/diễn giải → dự báo hoặc mô phỏng → quyết định → kế hoạch can thiệp → hành động → đo lường kết quả → đánh giá lại và điều chỉnh. Hệ thống hỗ trợ quyết định, không thay thế học sinh, giáo viên hoặc chuyên gia.

Có thể viết phần bối cảnh, vấn đề, mục tiêu tổng quát, mục tiêu cụ thể và phạm vi MVP theo đặc tả đã khóa. Phần tổng quan tài liệu khoa học cần bổ sung trích dẫn học thuật có DOI/URL trước khi nộp.

### 1.2. Kiến trúc hệ thống và vai trò người dùng

Kiến trúc sản phẩm có bảy module chính:

1. Nexus Core — điều phối, định tuyến và ngữ cảnh dùng chung.
2. Seed Profile — hồ sơ, dữ liệu học tập, mục tiêu và lịch sử.
3. Lumen Intelligence — diễn giải các chỉ số và bằng chứng học tập.
4. Atlas Admission — tuyển sinh trong nước, du học, ngành/trường, phương thức và nguồn tuyển sinh.
5. Orion Strategy — chiến lược học tập, mô phỏng và kế hoạch hành động.
6. Pulse Monitor — theo dõi trạng thái và báo cáo.
7. Haven Support — học bổng, chi phí và hỗ trợ tài chính.

Trong trải nghiệm học sinh, điều hướng hiển thị sáu module học sinh; Nexus/Admin là vùng vận hành, không phải chức năng học sinh. Các kiểm tra hợp đồng source CP30 xác nhận menu học sinh tách khỏi menu Admin và module catalog có cấu trúc lồng nhau. CLA Assistant chỉ đảm nhiệm hỗ trợ thao tác và giải đáp thắc mắc về nền tảng; không cung cấp nội dung tuyển sinh. Thông tin tuyển sinh chi tiết phải được tra cứu trong các mục nghiệp vụ của Atlas và hiển thị kèm nguồn.

### 1.3. Thiết kế dữ liệu và luồng xử lý

Có thể mô tả data flow giữa hồ sơ học tập, các engine, nguồn tuyển sinh, kế hoạch, lịch sử và lớp bằng chứng. Mỗi kết quả quan trọng cần gắn dữ liệu đầu vào, phiên bản engine/công thức, yếu tố đóng góp, confidence/uncertainty, evidence references và giới hạn diễn giải.

### 1.4. SCI/MAS/CSL và giới hạn diễn giải

Có thể trình bày SCI/MAS/CSL như các composite/proxy hành vi học tập mang tính khám phá theo định nghĩa vận hành trong protocol. Không gọi đây là chẩn đoán tâm lý hoặc thang đo tâm trắc đã được xác thực. Phần kỹ thuật có thể mô tả xử lý missing khác zero, version hóa công thức và kiểm tra deterministic/boundary.

### 1.5. Orion Strategy

Có thể mô tả ba kịch bản Balanced, Focused và Breakthrough, input/assumption, mô phỏng điểm/kế hoạch và cách tạo lộ trình hành động. Cần ghi rõ đây là deterministic scenario simulation theo giả định hiện tại, không phải cam kết tăng điểm hay ước lượng tác động nhân quả. CP31 đã bổ sung một replay kỹ thuật synthetic tám stage dùng engine Orion hiện tại: snapshot → assessment → recommendation → intervention plan → check-in → simulated outcome → reassessment → adaptation. Replay không lưu Firestore, không chạy trong live Student UI và không phải outcome quan sát.

### 1.6. Bảo mật, quyền riêng tư và human-in-the-loop

Có thể viết nguyên tắc role-based access, ownership, phân tách vai trò Student/Teacher/Parent/Admin/Researcher, data minimization, consent, pseudonymization, human override và giới hạn quyền của AI. Có thể báo cáo các kiểm tra static hiện có; chưa được mô tả là đã nghiệm thu Firebase Emulator/production.

### 1.7. Triển khai phần mềm và kiểm thử kỹ thuật

Tại checkpoint CP30, `npm test` chạy thành công với 87 test case (14 kiểm thử học thuật, 4 kiểm thử cognitive và 69 TAP), cùng ba script kiểm tra hợp đồng route Admin, cấu trúc module và tách vai trò học sinh. Firestore Rules static suite đạt 15/15. Kiểm tra cấu trúc CLA đạt PASS. Bốn test mới cho pipeline baseline UCI đạt PASS; bốn test replay closed-loop synthetic cũng PASS.

Các kết quả này chỉ là kiểm thử tự động trên source/fixture; không thay thế browser E2E, Firebase Emulator, staging, production smoke hoặc user acceptance.

### 1.8. Thiết kế nghiên cứu và quy trình dữ liệu

Có thể viết Research Questions, giả thuyết ứng viên, phân loại bằng chứng T/S/O/E, quy trình kiểm tra license, data eligibility, chống leakage, baseline, benchmark LLM, tiêu chí báo cáo và quy tắc không suy diễn nhân quả. SAP hiện là bản candidate, chưa freeze/approve.

## 2. Phần có thể viết nhưng phải gắn nhãn giới hạn

- Kết quả kiểm thử SCI/MAS/CSL: chỉ báo cáo kiểm thử kỹ thuật, chưa phải validity/reliability tâm trắc.
- Kết quả mô phỏng Orion: chỉ báo cáo tính nhất quán/deterministic trên golden cases, chưa phải độ chính xác dự báo ngoài thực tế.
- Bộ benchmark LLM 120 case: chỉ báo cáo inventory/coverage; gold chưa review, model chưa chạy.
- Hugging Face VNHSGE: ứng viên benchmark kiến thức tiếng Việt; card có license `cc` chung, chưa xác định biến thể license. Chưa dùng để train hoặc redistribute.
- Hugging Face UCI Student Performance: ứng viên baseline phương pháp ngoài miền Việt Nam, CC BY 4.0; chưa tải file/hash trong môi trường hiện tại. Không có metric nào được báo cáo.

## 3. Phần chưa được phép viết như kết quả đã chứng minh

1. Accuracy/MAE/RMSE/AUC của mô hình ML trên dữ liệu học sinh CLA.
2. Khả năng dự báo tuyển sinh/đỗ trường hoặc xác suất đạt học bổng đã calibration.
3. Độ tin cậy tâm trắc, test–retest/ICC, convergent/discriminant validity của SCI/MAS/CSL.
4. Hiệu quả can thiệp Adaptive so với Static.
5. Tác động nhân quả của CLA đến điểm số, hành vi hoặc kết quả học tập.
6. LLM đạt 95% groundedness hoặc không hallucination.
7. Tuyên bố đã triển khai production, có bảo mật production hoặc đã nghiệm thu E2E.

## 4. Danh mục hình/bảng có thể dựng ngay

- Hình 1: Kiến trúc 7 module CLA.
- Hình 2: Phân tách trải nghiệm Student và Admin.
- Hình 3: Data flow và Evidence Record.
- Hình 4: Closed-loop target architecture.
- Bảng 1: Module, trách nhiệm và giới hạn.
- Bảng 2: Data scope và evidence class T/S/O/E.
- Bảng 3: Bộ kiểm thử tự động CP30.
- Bảng 4: Dataset register, license, population, mục đích và hạn chế.
- Bảng 5: Research Questions và trạng thái evaluability.

Hình closed-loop phải gắn nhãn **synthetic technical replay**; chưa thể gọi là live end-to-end hoặc có observed outcome cho đến khi tích hợp UI/Firestore và kiểm chứng bằng dữ liệu quan sát hợp lệ.

## 5. Bằng chứng còn thiếu để hoàn thiện phần kết quả

- Build sạch trên môi trường cài đủ dependency.
- Browser E2E cho các route/role và chat launcher.
- Firebase Emulator allow/deny matrix theo role/UID.
- Staging deploy, smoke test, backup/rollback.
- Tải và hash dataset ngoài; freeze license/source version.
- Review gold 120-case benchmark, pin model/prompt và chạy đánh giá.
- Dữ liệu nghiên cứu CLA có consent/assent và pseudonymization; hiện chưa xác minh được record đủ điều kiện.
- Replayable loop snapshot→recommendation→plan→check-in→outcome→reassessment→adaptation.

## 6. Trạng thái kết luận cho báo cáo hiện tại

Bản báo cáo có thể hoàn thiện ngay các chương **đặt vấn đề, mục tiêu, tổng quan kiến trúc, phân tích thiết kế, triển khai prototype, thiết kế chỉ số và chiến lược, bảo mật theo thiết kế, phương pháp nghiên cứu, quy trình dữ liệu và kiểm thử tự động**. Chương **kết quả thực nghiệm** chỉ được viết dưới dạng kết quả kiểm thử kỹ thuật và kết quả kiểm tra dữ liệu nguồn; chưa có căn cứ để kết luận hiệu quả ML, tâm trắc hoặc Adaptive.
