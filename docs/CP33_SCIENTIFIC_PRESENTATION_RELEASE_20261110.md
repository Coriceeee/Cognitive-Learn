# CP33 — Scientific presentation layer release

**Ngày:** 10/11/2026  
**Base:** `CLA_CP32_FLAT_START_HERE_20261109` + CP32 Scientific MVP.

## 1. Mục tiêu

Giảm việc trình bày kết quả dưới dạng nhiều ô/card. Chuyển các thông số có thể quan sát thành hình trực quan có trục, thang đo, legend, trạng thái thiếu dữ liệu và giới hạn diễn giải. Không thay đổi công thức engine hoặc tạo dữ liệu mới.

## 2. Visual kế thừa từ CP32

- Seed: quỹ đạo GPA 6 học kỳ và heatmap 9 môn × 6 học kỳ.
- Lumen: Cognitive Signal Atlas, radar chỉ vẽ chiều có dữ liệu, coverage ring, proxy bars, delta khi có hai snapshot tương thích và evidence lineage.
- Orion: strategy trade-off map từ ba kịch bản của engine; feasibility và expected gain được ghi nhãn heuristic.
- Atlas: slopegraph điểm chuẩn THPT 2024–2025 của 10 ngành PTIT BVH, kèm link nguồn chính thức; không tạo cutoff 2026.

## 3. Visual mới CP33

### 3.1 Haven — Pressure Topology

File: `src/page/haven/HavenPressureTopology.tsx`

- Parallel-coordinate plot bốn tín hiệu `tuitionPressure`, `studyPressure`, `admissionRisk`, `financialNeed`.
- Màu vùng 0–49 / 50–74 / 75–100 chỉ là mức theo dõi trực quan.
- Support Readiness ring và Family Pressure composite lấy từ `runHavenSupport`.
- Support Action Vector hiển thị các hành động thực do engine trả về.
- Ghi rõ đầu vào tự khai báo; chưa phải thang đo tâm trắc; không dùng làm xác suất học bổng.

### 3.2 Pulse — Metric Orbit

File: `src/page/pulse/PulseMetricOrbit.tsx`

- Sáu vòng đồng tâm lấy từ sáu `PulseMetric.score` hiện tại.
- Legend bên cạnh hiển thị giá trị, mục tiêu và tỷ lệ đạt.
- Điểm trung tâm là `overallScore` do Pulse engine tính.
- Ghi rõ target-normalized; bản nhập tay/mô phỏng không phải outcome nghiên cứu.

### 3.3 Pulse Admin — Evidence Circuit

File: `src/page/pulse/PulseEvidenceCircuit.tsx`

- Mạch bốn stage Seed → Lumen → Orion → Pulse, màu/nét nối dựa trên `PRESENT`, `LIMITED`, `MISSING`, `INVALID`.
- Hiển thị reason và source từng stage, data scope, Cognitive history.
- Admin-only do được gắn trong khu vực `isAdmin` của Pulse.
- Luôn ghi `LINEAGE CHECK ONLY · NOT END-TO-END`; không chuyển `complete=false` thành PASS.

## 4. Files changed

- Added: `src/page/haven/HavenPressureTopology.tsx`
- Added: `src/page/pulse/PulseMetricOrbit.tsx`
- Added: `src/page/pulse/PulseEvidenceCircuit.tsx`
- Updated: `src/page/haven/HavenPage.tsx`
- Updated: `src/page/pulse/PulsePage.tsx`
- Updated: `src/styles/23-scientific-visuals.css`
- Updated: `tests/scientific-visuals.test.cjs` (4 new CP33 contracts)
- Added: CP33 start, progress, checklist and action-plan documents.

## 5. Verification

- `npm test`: PASS (exit 0; 102 checks/subtests aggregated across scripts and TAP suites; 11 scientific visual contracts).
- `npm run test:rules:static`: 15/15 PASS.
- `npm run check:layout`: PASS (22 required files, 19 legacy misplacements absent).
- UCI baseline guard tests: 4/4 PASS.
- TypeScript syntax transpilation: 5/5 changed TSX files PASS.
- Strict type check for three new visual components: PASS using isolated JSX shim and imported domain types.
- `npm ci`: TIMEOUT in packaging runner; dependency installation incomplete.
- `npm run typecheck:api`: BLOCKED by missing `@types/node` in incomplete `node_modules`.
- `npm run build`: BLOCKED by missing React/Node/D3 type packages before full app compilation.
- Browser E2E, Firebase Emulator, Gemini live benchmark, staging/production: NOT RUN.

## 6. Acceptance boundaries

The visual components are implemented and contract-tested. They have not been visually verified in a live browser or production build in this environment. They do not add real learner observations, validated psychometric scores, ML metrics, admission probabilities, scholarship probabilities or causal claims.
