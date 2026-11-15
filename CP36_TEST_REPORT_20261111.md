# CLA CP36 — Test evidence

## PASS

| Gate | Kết quả | Ghi chú |
|---|---|---|
| `npm test` | PASS | Toàn bộ suites; gồm 14 academic, 4 cognitive observation, 98 TAP subtests và một số hợp đồng CLI |
| CP36 new contract tests | 5/5 PASS | Task finder, Haven, scholarship provenance, Atlas, CSS |
| CP36 executable source tests | 3/3 PASS | Lọc học bổng, uniqueness, 2026-only Atlas sources |
| `npm run test:rules:static` | 15/15 PASS | Chỉ kiểm tra tĩnh, chưa là Emulator |
| `npm run check:layout` | PASS | 22 required files, 19 legacy misplacements absent |
| `tsc -b` | PASS | Chạy compiler toàn cục với bộ dependency cache được trích từ source CLA cũ; chưa phải fresh `npm ci` |
| `tsc -p tsconfig.api.json` | PASS | Điều kiện như trên |
| TS/TSX syntax | 154 files / 0 diagnostics | Global TypeScript transpile pass |
| CSS PostCSS parse | 27 files / 0 errors | Parse cú pháp, không phải visual regression |

## BLOCKED / NOT RUN

- Vite bundle: BLOCKED vì cache `node_modules` từ Windows thiếu `@rolldown/binding-linux-x64-gnu` trên Linux runner. Không xóa lockfile để chạy vòng qua dependency gate.
- Fresh `npm ci`: chưa thực hiện thành công trong môi trường tạo bản; cần chạy trên Windows có kết nối registry.
- Browser E2E / screenshot QA: NOT RUN.
- Firebase Emulator allow/deny matrix: NOT RUN.
- Staging/production smoke, backup/rollback, deployment: NOT RUN.
- Full empirical ML/LLM/adaptive effectiveness validation: NOT RUN.

## Cách xác minh tiếp trên Windows

Tại thư mục gốc có `package.json` của CP36:

```powershell
npm ci
npm run verify:cp36:static
npm run build
npm run dev
```

Không được tính Vite build PASS cho đến khi lệnh `npm run build` thực sự thoát mã 0. Không được tính Rules runtime PASS trước khi chạy Firebase Emulator.
