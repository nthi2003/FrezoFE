# QA Bug Review — 2026-07-22

Sheet: [BUGS Frezo](https://docs.google.com/spreadsheets/d/1Bep0AyTObzFKeusDFbQhjA4zZviwrotK1Rl5sD2ScVM/edit?usp=sharing)

DEV đã audit + harden (không fake Pass runtime). Status sheet: **Fixed** = có fix logic/UI trong code; **Ready for QA** = code đủ + evidence, chờ chạy env.

| Bug ID | Verdict | Action | Note / Evidence |
|--------|---------|--------|-----------------|
| BUG-FP-04 | Fixed OK | Keep Fixed | `FiscalPeriodsPage` + `useClosePeriod`/`useReopenPeriod` + route `/accounting/periods` + menu `ACC_PERIODS` |
| NV-LNK01-02 | Ready for QA | Harden message | Orchestrator: 1 TX/person + catch → 200 summary. Harden: `PayrollController.buildCalculateAllMessage` không nói “hoàn tất” khi all-skip |
| NV-LNK02-06 | Fixed | Banner filter | `PayrollsPage` skipBanner chỉ list NV thiếu HĐ (không nhét technical error). Modal amber + CTA HĐ sẵn |
| NV-LNK02-07 | Ready for QA | Evidence | `PayrollCalculateModal` `allSkipped` title/hero warn — không success-only. Message BE align |
| NV-LNK03-07 | Ready for QA | Evidence | FE `AttendanceDailyRoster` + BE `GET /qlns/attendance/daily` left-join `NOT_CHECKED_IN` |
| NV-LNK03-08 | Fixed | LATE priority | BE `resolveDisplayStatus`: LATE trước CHECKED_OUT; FE roster ưu tiên `lateMinutes`/`LATE` |
| NV-LNK09-06 | Ready for QA | MailHog hint | Bulk `/email/send/bulk` + Activate; UI badge MailHog `:1025` / UI `:8025` trên `EmailConfigPage` |
| NV-LNK09-07 | Ready for QA | Evidence | Activate/Deactivate + Compose block khi thiếu config activated |
| NV-DEP-05 | Ready for QA | Idempotent UX | BE `postPeriod` return existing POSTED; FE confirm “idempotent DEP-YYYY-MM” |
| NV-MOB-03 | Fixed | LATE UI sync | Mobile `resolveAttendanceUiStatus` (displayStatus/lateMinutes→LATE); BE LATE enrich |

## Task DEV (đã làm 2026-07-22)

1. BE `AttendanceServiceImpl.resolveDisplayStatus` — LATE > CHECKED_OUT  
2. BE `PayrollController` — message theo success/skipped/error  
3. FE `PayrollsPage` — skipBanner filter HĐ  
4. FE `AttendanceDailyRoster.resolveDisplayStatus` — LATE ưu tiên  
5. FE `EmailConfigPage` — MailHog hint + help  
6. FE `DepreciationPostPage` — idempotent copy/confirm  
7. Mobile `attendance.tsx` + `types.ts` — LATE mapping  

## QA chạy env trước (P1)

1. **LNK01-02 + LNK02-06/07** — POST calculate-all kỳ mix / all-skip  
2. **LNK03-07/08** — roster hôm nay + check-in muộn → LATE (kể cả sau checkout)  
3. **LNK09-06/07** — Activate MailHog → bulk → `:8025`  
4. **DEP-05** — preview + post 2 lần cùng kỳ  
5. **MOB-03** — mobile check-in muộn ↔ ERP daily LATE  
