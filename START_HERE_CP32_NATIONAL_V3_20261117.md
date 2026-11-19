# CLA CP32 — National Admission V3 / Program Discovery

Base: `CLA_FULL_SOURCE_CP32_THREE_YEAR_HISTORY_20261117.zip`. This is an additive checkpoint, not the final national release. Không thay Firestore rules, dependency, dữ liệu cá nhân hay cấu hình production.

## Phạm vi
- 216 điểm công bố 2026 mới: UET 20, HUS 28, USSH 73, ULIS 17, UEB 12, UEd 12, VJU 9, UMP 6, Law 3, International School 14, TNUE 22. Đơn vị là giá trị theo mã/phương thức, không phải 216 ngành.
- Tổng 838 giá trị/16 cơ sở có dữ liệu số; danh mục 29 cơ sở, 48 mục trường–năm. Nguồn lưu trong từng bản ghi và registry. VNU: https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0 . Đọc thông báo gốc cho điều kiện/tiêu chí phụ. Dữ liệu do người triển khai nhập từ bảng nguồn, chưa được đối chiếu độc lập từng dòng.
- Màn khám phá theo ngành/mã, năm, miền, trường, tổ hợp; nhóm bản ghi theo trường/cơ sở/mã. Tổ hợp được ưu tiên nếu có trong dữ liệu; thiếu bằng chứng không loại trừ. Nhập điểm theo đúng thang/phương thức của bản ghi để tính khoảng cách. Không gán xác suất, không so chênh điểm giữa phương thức khác nhau. Bộ lọc sử dụng lựa chọn do người dùng nhập, chưa tự đồng bộ Seed hay mô hình Career Fit. Không lưu hoặc gửi lựa chọn này đến LLM.
- Chatbot tra cứu mã trường/ngành/năm/phương thức, trả nguồn; từ chối nếu thiếu. Các năm mới vẫn cần mở rộng dữ liệu gốc; chưa phủ toàn quốc. TDTU/UIT/UED chưa nhập điểm trong đợt này do bảng nguồn chưa đọc được đủ tin cậy.

## Kết quả chạy cục bộ
- `npm test`: 939/939 PASS; `npm run test:cp32:discovery` nằm trong đó (4 ca).
- `npm run research:atlas:lookup`: 848/848 PASS, expected lấy từ cùng registry, không phải xác minh độc lập nguồn hay LLM.
- `npm run test:rules:static`: 15/15 PASS; không thay thế emulator.
- `npm run check:layout`: PASS.
- `npm run demo:final`: 11/11 PASS, synthetic only.
- Strict TypeScript cho engine thuần: `tsc --noEmit --target ES2020 --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions src/lib/nationalProgramDiscovery.ts`: PASS (TS 5.8.3).
- `npm run build`: BLOCKED tại `tsc -b` (TS2307 React/Firebase do dependency chưa cài). Không xác nhận build/UI/browser.
- Firebase Emulator, production smoke, browser E2E, Gemini live, ML thực chứng: NOT RUN trong checkpoint này. Không tạo claim hiệu quả khoa học.

## Áp dụng
Dùng full source giải nén vào thư mục thử nghiệm riêng, hoặc backup bản V2 rồi đè patch đúng bản V2. Không đè `.env*`, credential hay deploy production. Chạy `npm ci`, `npm test`, `npm run research:atlas:lookup`, `npm run demo:final`, `npm run build`, `npm run dev` trên môi trường chuẩn. Kiểm tra thủ công Atlas → Khám phá theo tiêu chí cá nhân, phương thức khác nhau, tổ hợp chưa có dữ liệu và chatbot. Giữ nguyên các gate nghiệm thu còn lại trong CP28–CP36.
