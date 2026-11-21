# CP43 Changelog · 20/11/2026

**Design:** Daylight Data Studio — sáng, đồng nhất, data-first, không tái tạo số liệu.

**Navigation:** Native History API + `useSyncExternalStore` cho internal links; không dùng anchor-based CSS để ẩn toàn bộ module. AccessGate vẫn enforce role và student consent từng route.

**Organization:** Six student modules retain their independent workspaces; legacy Teacher/Parent components not referenced by the student app are removed. No change to Admin authority or Firestore Rules.

**QA:** TypeScript frontend/API, selected contracts and CSS syntax PASS. Full suite blocked by old CP31 source fingerprint; Linux Vite bundle blocked by missing platform-native Rolldown binding from Windows archive. Browser E2E/production **not claimed**.
