# QA Test Plan (chi tiết) — Sprint Linkage S1 + related

| Field | Value |
|-------|-------|
| **Date** | 2026-07-21 |
| **Owner** | QA Frontend |
| **Method** | Static verify (FE/BE code + API contract + Docs Hub). **Không** chạy app / E2E runtime. |
| **Rules** | `qa-frontend.mdc`, `FE_UI_UX_STANDARD` CRUD checklist, AC từ `PLAN_LINKAGE_USABILITY.md` + `sprint-changelog.md` |
| **Changelog** | Linkage S1: LNK-02, LNK-03, LNK-09, LNK-04 (+ LNK-01 smoke). Smoke thêm: Depreciation, Fiscal period, Mobile ATT |
| **Gate** | Runtime Blocked ≠ PASS release. Fail confirmed → bug tracker. Cập nhật `BUG_PLAN.md` chỉ sau retest thật. |
| **Bug sheet** | [BUG FREZO](https://docs.google.com/spreadsheets/d/1Bep0AyTObzFKeusDFbQhjA4zZviwrotK1Rl5sD2ScVM/edit?usp=sharing) · paste files: `qa-bug-tracker-2026-07-21.tsv` / `.csv` |

---

## Scope

### In scope

| Source | Items |
|--------|--------|
| Sprint Linkage S1 | **LNK-01** (smoke), **LNK-02**, **LNK-03**, **LNK-09**, **LNK-04** |
| Recently viewed | Depreciation (`/assets/depreciation`), Fiscal (`FiscalPeriodController` + FE hooks), Mobile tabs ATT/leave/profile |

### Out of scope

LNK-05 PR approval rule, LNK-06 hire→User, LNK-07 menu SSOT, LNK-08 BGHD.

### Result legend

| Result | Meaning |
|--------|---------|
| **Pass** | Đã verify bằng đọc code / API contract / docs khớp AC. Không Pass theo lời DEV. |
| **Fail** | Lệch AC / thiếu UI bắt buộc — chứng minh bằng code. → **Confirmed bug**. |
| **Blocked** | Cần env chạy (FE:3000 + BE + data + MailHog/device). Không đoán Pass. → Status **Need Verify** trên bug tracker. |

### Severity (khi Fail)

Critical ≈ S1 · Major ≈ S2 · Minor ≈ S3 · Trivial ≈ S4 (`qa-frontend.mdc`).

---

## Summary counts

| Result | Count |
|--------|------:|
| **Pass** | 33 |
| **Fail** | 1 |
| **Blocked** | 9 |
| **Total** | 43 |

### Confirmed bugs (Fail only)

| Bug ID | TC | Severity | Title |
|--------|-----|----------|-------|
| **BUG-FP-04** | FP-04 | Major (S2) | Fiscal close/reopen: hooks + BE API có, **không page nào gọi** — kế toán không đóng/mở kỳ từ UI |

### Need Verify / Blocked (không phải confirmed bug)

LNK01-02, LNK02-06, LNK02-07, LNK03-07, LNK03-08, LNK09-06, LNK09-07, DEP-05, MOB-03.

**Release gate:** Không release P0 Linkage khi còn Blocked trên LNK-01/02/03 runtime + Fail FP-04 (nếu PO coi period close là P0 accounting).

---

## A. LNK-01 — Payroll calculate-all không 500

### LNK01-01 — FE gọi đúng verb/path calculate-all

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll |
| **Precondition** | Có quyền tính lương kỳ; đọc được `payrollApi.ts` |
| **Steps** | 1. Mở `packages/erp/src/modules/qlns/services/payrollApi.ts`. 2. Trace `calculateAll`. 3. Đối chiếu comment GET→405. |
| **Expected** | `POST /qlns/payroll/calculate-all` với `params` month/year (query); map `PayrollCalculateAllResponse` |
| **Actual** | `axiosClient.post(..., '/qlns/payroll/calculate-all', null, { params: data })`; interface có `successCount`/`skippedCount`/`errorCount`/`errors[]` |
| **Result** | **Pass** |
| **Evidence** | `payrollApi.ts` L28–40 |

### LNK01-02 — BE orchestrator không 500 cả batch vì 1 NV

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll (BE) |
| **Precondition** | BE code + ideally env có ≥2 NV (1 thiếu HĐ) |
| **Steps** | 1. Đọc `PayrollCalculationOrchestrator.calculateAll`. 2. Xác nhận skip `NO_ACTIVE_CONTRACT` ghi vào `errors` + `skippedCount`. 3. *(Runtime)* POST calculate-all thật. |
| **Expected** | 1 TX/person; skip/error item; HTTP 200 summary; không 500 cả batch |
| **Actual** | Code: `REASON_NO_ACTIVE_CONTRACT`, `itemError`, builder `skippedCount`/`successCount`. Runtime: **chưa gọi API trên env**. |
| **Result** | **Blocked** |
| **Evidence** | `PayrollCalculationOrchestrator.java`; `PayrollController` `@PostMapping("/calculate-all")` swagger note. Note: chờ retest PAY-01 |

### LNK01-03 — Modal RESULT hiện counts sau tính kỳ

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll FE |
| **Precondition** | Trace `PayrollsPage` + `PayrollCalculateModal` |
| **Steps** | 1. Đọc `PayrollsPage.runCalculation` / mutate calculate-all. 2. Trace map summary vào modal stage result. |
| **Expected** | `successCount`/`skippedCount`/`errorCount` từ BE, không hardcode 0 |
| **Actual** | Modal props từ `beSummary`; ResultStage dùng `created`/`skipped`/`errors` |
| **Result** | **Pass** |
| **Evidence** | `PayrollsPage.tsx`, `PayrollCalculateModal.tsx` |

---

## B. LNK-02 — Payroll skip thiếu HĐ (không silent)

### LNK02-01 — BE errors[] enrich + NO_ACTIVE_CONTRACT

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll BE |
| **Precondition** | Đọc DTO + orchestrator |
| **Steps** | 1. Mở `PayrollCalculateAllResponse.ItemError`. 2. Trace `itemError(person, ...)`. |
| **Expected** | `personId`, `personName`, `personCode`, `reason=NO_ACTIVE_CONTRACT`; `skippedCount` |
| **Actual** | DTO + `REASON_NO_ACTIVE_CONTRACT`; enrich trong `itemError` |
| **Result** | **Pass** |
| **Evidence** | `PayrollCalculateAllResponse.java`, `PayrollCalculationOrchestrator.java` |

### LNK02-02 — RESULT modal: số bỏ qua + bảng NV

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll FE |
| **Precondition** | Code modal ResultStage |
| **Steps** | 1. Đọc ResultStage khi `skipped > 0`. 2. Kiểm tra tile + bảng Tên/Mã/Lý do + màu amber. |
| **Expected** | Tile “Đã bỏ qua”; bảng; amber warn |
| **Actual** | `hasWarn` / skipped tile + list reasons; `NO_ACTIVE_CONTRACT` map VI |
| **Result** | **Pass** |
| **Evidence** | `PayrollCalculateModal.tsx` ResultStage |

### LNK02-03 — Toàn skip → không success-only

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll FE |
| **Precondition** | `successCount=0` && `skippedCount>0` |
| **Steps** | 1. Trace `allSkipped` title/hero. |
| **Expected** | Title “Không tạo được bảng lương”; hero amber; không “Hoàn tất” giả |
| **Actual** | `allSkipped` → title đúng; hero warn; CTA HĐ |
| **Result** | **Pass** |
| **Evidence** | `PayrollCalculateModal.tsx` `allSkipped` |

### LNK02-04 — CTA HĐLĐ

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll FE |
| **Precondition** | Modal + page có CTA |
| **Steps** | 1. Trace `contractsHref`. 2. Click handler navigate. |
| **Expected** | Navigate `/qlns/contract` |
| **Actual** | Default `contractsHref='/qlns/contract'`; `PayrollsPage` truyền `contractsHref="/qlns/contract"` |
| **Result** | **Pass** |
| **Evidence** | `PayrollCalculateModal.tsx`, `PayrollsPage.tsx` |

### LNK02-05 — Banner trên PayrollsPage sau skip

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll FE |
| **Precondition** | Sau calculate-all có skip |
| **Steps** | 1. Trace `skipBanner` state + render. |
| **Expected** | Banner amber + list tên + CTA HĐLĐ + dismiss |
| **Actual** | Block `skipBanner` khi `skippedCount > 0` |
| **Result** | **Pass** |
| **Evidence** | `PayrollsPage.tsx` LNK-02 banner |

### LNK02-06 — Runtime: kỳ có ≥1 NV thiếu HĐ ACTIVE

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll UAT |
| **Precondition** | FE+BE chạy; data ≥1 NV thiếu HĐ ACTIVE/activated |
| **Steps** | 1. Mở Payrolls. 2. Chọn kỳ. 3. Tính lương kỳ này. 4. Xem RESULT + banner. |
| **Expected** | `skippedCount≥1`; list person; UI warning |
| **Actual** | Chưa chạy app/data UAT |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify |

### LNK02-07 — Runtime: toàn bộ NV thiếu HĐ

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll UAT |
| **Precondition** | Kỳ all-skip |
| **Steps** | 1. calculate-all all-skip. 2. Kiểm tra title/hero/CTA; không toast success-only. |
| **Expected** | UI warning/amber; CTA HĐ; không success-only |
| **Actual** | Chưa chạy app |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify |

---

## C. LNK-03 — Attendance daily roster

### LNK03-01 — Tab “Theo dõi ngày”

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance |
| **Precondition** | Route `/admin/attendance` |
| **Steps** | 1. Đọc `AttendancePage` tabs. 2. Confirm default `daily` + render roster. |
| **Expected** | Default tab `daily`; `AttendanceDailyRoster` |
| **Actual** | `activeTab === 'daily' && <AttendanceDailyRoster />` |
| **Result** | **Pass** |
| **Evidence** | `AttendancePage.tsx` |

### LNK03-02 — Cột Tên · Phòng · In · Out · Status · GPS · Ghi chú

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance |
| **Precondition** | Đọc columns roster |
| **Steps** | 1. Mở `AttendanceDailyRoster` columns definition. |
| **Expected** | Đủ 7 cột theo changelog |
| **Actual** | titles: Tên, Phòng, In, Out, Status, GPS, Ghi chú |
| **Result** | **Pass** |
| **Evidence** | `AttendanceDailyRoster.tsx` columns |

### LNK03-03 — Filter dept / status / paging + Refresh

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance |
| **Precondition** | UI filters + hook |
| **Steps** | 1. Trace filterParams + AppTable paging + nút Làm mới. |
| **Expected** | `departmentId`, `status`, `pageNumber`/`pageSize`; Refresh |
| **Actual** | Filters + `useAttendanceDaily` params có đủ |
| **Result** | **Pass** |
| **Evidence** | `AttendanceDailyRoster.tsx`, `useAttendance.ts` |

### LNK03-04 — FE gọi GET /qlns/attendance/daily

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance FE |
| **Precondition** | Trace API |
| **Steps** | 1. Đọc `attendanceApi.getDaily`. 2. Kiểm tra fallback banner. |
| **Expected** | Path `/qlns/attendance/daily`; fallback banner nếu BE chưa sẵn sàng |
| **Actual** | getDaily ưu tiên daily; 404/501 → `source:'fallback'` + banner |
| **Result** | **Pass** |
| **Evidence** | `attendanceApi.ts`, roster banner `source === 'fallback'` |

### LNK03-05 — BE daily NOT_CHECKED_IN + LATE

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance BE |
| **Precondition** | Đọc controller + service |
| **Steps** | 1. Trace `GET /daily`. 2. Trace `resolveDisplayStatus`. |
| **Expected** | Left-join active; thiếu record → `NOT_CHECKED_IN`; late → `LATE` |
| **Actual** | Swagger + `setDisplayStatus("NOT_CHECKED_IN")` + `resolveDisplayStatus` |
| **Result** | **Pass** |
| **Evidence** | `AttendanceController.java`, `AttendanceServiceImpl.java` |

### LNK03-06 — Empty / Error + retry

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance FE |
| **Precondition** | Empty / API lỗi |
| **Steps** | 1. Trace EmptyState + Error EmptyState + retry/Làm mới. |
| **Expected** | EmptyState + “Thử lại”/Làm mới |
| **Actual** | EmptyState + Error EmptyState có CTA |
| **Result** | **Pass** |
| **Evidence** | `AttendanceDailyRoster.tsx` |

### LNK03-07 — Runtime UAT roster hôm nay

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance UAT |
| **Precondition** | Env + data chấm công |
| **Steps** | 1. HR mở tab daily. 2. Filter/paging/refresh. 3. Đối chiếu NOT_CHECKED_IN / LATE. |
| **Expected** | Có checked + NOT_CHECKED_IN; LATE đúng; paging OK |
| **Actual** | Chưa UAT env |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify (ATT-* chờ retest) |

### LNK03-08 — Runtime check-in muộn → LATE

| Field | Value |
|-------|-------|
| **Module** | QLNS / Attendance UAT |
| **Precondition** | Có thể check-in sau giờ |
| **Steps** | 1. Check-in muộn. 2. Xem roster daily. |
| **Expected** | `displayStatus=LATE` (không luôn PRESENT) |
| **Actual** | Chưa runtime |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify |

---

## D. LNK-09 — Email block khi chưa activated

### LNK09-01 — Compose block khi chưa activated

| Field | Value |
|-------|-------|
| **Module** | Email |
| **Precondition** | Không có config `activated` |
| **Steps** | 1. Đọc early return LNK-09 trên Compose. |
| **Expected** | EmptyState + CTA `/email/config` |
| **Actual** | Block khi `!hasActivatedConfig`; navigate `/email/config` |
| **Result** | **Pass** |
| **Evidence** | `EmailComposePage.tsx` |

### LNK09-02 — Inbox block khi chưa activated

| Field | Value |
|-------|-------|
| **Module** | Email |
| **Precondition** | Không activeConfig |
| **Steps** | 1. Đọc Inbox empty/activate CTA. |
| **Expected** | Copy Activate + nút `/email/config` |
| **Actual** | Parity inbox → Button navigate config |
| **Result** | **Pass** |
| **Evidence** | `EmailInboxPage.tsx` |

### LNK09-03 — Map error.email.config.not.found

| Field | Value |
|-------|-------|
| **Module** | Email |
| **Precondition** | Send bulk lỗi config |
| **Steps** | 1. Trace `resolveEmailSendError`. |
| **Expected** | Toast/copy VI nhắc Activate; banner CTA config |
| **Actual** | Regex + message VI; `needsConfig` |
| **Result** | **Pass** |
| **Evidence** | `EmailComposePage.tsx` `resolveEmailSendError` |

### LNK09-04 — Config page Activate API

| Field | Value |
|-------|-------|
| **Module** | Email |
| **Precondition** | Trace API |
| **Steps** | 1. Đọc `emailApi.activate`. |
| **Expected** | `PUT /email/config/{id}/activate` |
| **Actual** | `put(.../activate)` |
| **Result** | **Pass** |
| **Evidence** | `emailApi.ts` |

### LNK09-05 — Seed MAILHOG_LOCAL activated

| Field | Value |
|-------|-------|
| **Module** | Email / Seed |
| **Precondition** | Đọc `demo_data.sql` |
| **Steps** | 1. Tìm section 13b EMAIL CONFIG MailHog. |
| **Expected** | Insert `activated=true`, host localhost:1025 |
| **Actual** | `MAILHOG_LOCAL` localhost 1025; comment activated=true |
| **Result** | **Pass** |
| **Evidence** | `demo_data.sql` §13b |

### LNK09-06 — Runtime bulk send + MailHog

| Field | Value |
|-------|-------|
| **Module** | Email UAT |
| **Precondition** | Activate + MailHog :1025 |
| **Steps** | 1. Activate config. 2. Bulk send. 3. Kiểm tra MailHog. |
| **Expected** | 200/queued; mail vào MailHog |
| **Actual** | Chưa chạy MailHog/env |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify (MAIL-01) |

### LNK09-07 — Runtime Activate UI E2E

| Field | Value |
|-------|-------|
| **Module** | Email UAT |
| **Precondition** | UI config |
| **Steps** | 1. Deactivate. 2. Compose block. 3. Activate. 4. Compose mở. |
| **Expected** | Block ↔ unblock đúng |
| **Actual** | Chưa chạy UI |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify |

---

## E. LNK-04 — Approval Inbox ≠ Workflow designer

### LNK04-01 — Banner trên /qtht/workflows

| Field | Value |
|-------|-------|
| **Module** | Workflow / Approval |
| **Precondition** | Mở WorkflowsPage (code) |
| **Steps** | 1. Trace UX guard banner LNK-04. |
| **Expected** | Cảnh báo template ≠ hộp duyệt; link Inbox |
| **Actual** | Banner + navigate `/approval/inbox`; title “Thiết kế template quy trình” |
| **Result** | **Pass** |
| **Evidence** | `WorkflowsPage.tsx` |

### LNK04-02 — Banner trên designer

| Field | Value |
|-------|-------|
| **Module** | Workflow |
| **Precondition** | WorkflowDesignerPage |
| **Steps** | 1. Trace banner Path A + link inbox. |
| **Expected** | Designer = template; link `/approval/inbox` |
| **Actual** | Banner + `nav('/approval/inbox')` |
| **Result** | **Pass** |
| **Evidence** | `WorkflowDesignerPage.tsx` |

### LNK04-03 — PageGuide workflows

| Field | Value |
|-------|-------|
| **Module** | Docs / Workflow |
| **Precondition** | `WORKFLOWS_GUIDE` |
| **Steps** | 1. Đọc guide CTA Inbox vs Designer. |
| **Expected** | So sánh Inbox vs Designer; CTA Inbox |
| **Actual** | Guide title template; CTA `/approval/inbox` |
| **Result** | **Pass** |
| **Evidence** | `workflows.guide.ts` |

### LNK04-04 — Approval Inbox primary path

| Field | Value |
|-------|-------|
| **Module** | Approval |
| **Precondition** | ApprovalInboxPage |
| **Steps** | 1. Trace title + PageGuide. |
| **Expected** | Title “Hộp thư duyệt”; guide; banner trỏ workflows |
| **Actual** | `title="Hộp thư duyệt"` + `APPROVAL_INBOX_GUIDE` |
| **Result** | **Pass** |
| **Evidence** | `ApprovalInboxPage.tsx`, `approvals.guide.ts` |

### LNK04-05 — Approval Flows copy tách lớp

| Field | Value |
|-------|-------|
| **Module** | Approval |
| **Precondition** | ApprovalFlowConfigPage |
| **Steps** | 1. Đọc description page. |
| **Expected** | Nêu khác `/qtht/workflows` |
| **Actual** | Description: gắn flow → Inbox; khác template visual workflows |
| **Result** | **Pass** |
| **Evidence** | `ApprovalFlowConfigPage.tsx` |

### LNK04-06 — Label rename giảm nhầm

| Field | Value |
|-------|-------|
| **Module** | Workflow |
| **Precondition** | WorkflowsPage header |
| **Steps** | 1. Đọc PageHeader title. |
| **Expected** | “Thiết kế template quy trình” (không gọi chung “Approval”) |
| **Actual** | Title đúng |
| **Result** | **Pass** |
| **Evidence** | `WorkflowsPage.tsx` |

---

## F. Depreciation / Assets (Sprint 2 · smoke)

### DEP-01 — API preview/post/schedules/postings

| Field | Value |
|-------|-------|
| **Module** | Assets / Depreciation |
| **Precondition** | Trace `depreciationApi.ts` |
| **Steps** | 1. Đối chiếu paths. |
| **Expected** | `/asset/depreciation/preview`, `/post`, schedules, postings |
| **Actual** | `BASE='/asset/depreciation'` + preview/post/schedules/postings |
| **Result** | **Pass** |
| **Evidence** | `depreciationApi.ts` |

### DEP-02 — Page states + permission

| Field | Value |
|-------|-------|
| **Module** | Assets / Depreciation |
| **Precondition** | `DepreciationPostPage` |
| **Steps** | 1. Trace VIEW/UPDATE permission. 2. ErrorState+retry. 3. ConfirmDialog ghi sổ. |
| **Expected** | Ẩn xem nếu thiếu VIEW; ẩn Ghi sổ nếu thiếu UPDATE; ConfirmDialog |
| **Actual** | `usePermission` + ConfirmDialog + ErrorState |
| **Result** | **Pass** |
| **Evidence** | `DepreciationPostPage.tsx` |

### DEP-03 — Idempotent cùng kỳ (UI)

| Field | Value |
|-------|-------|
| **Module** | Assets / Depreciation |
| **Precondition** | Kỳ đã POSTED |
| **Steps** | 1. Trace `existingPosted` badge. |
| **Expected** | Badge Đã ghi sổ; không khuyến khích ghi đôi |
| **Actual** | `existingPosted` + displayStatus; guide copy không ghi đôi |
| **Result** | **Pass** |
| **Evidence** | `DepreciationPostPage.tsx`, `guide-depreciation.md` |

### DEP-04 — Guide Docs Hub

| Field | Value |
|-------|-------|
| **Module** | Docs |
| **Precondition** | `guide-depreciation.md` |
| **Steps** | 1. Đọc hai chỗ QLTS vs khấu hao định kỳ; lỗi kỳ đóng. |
| **Expected** | Có guide; nêu kỳ đã đóng |
| **Actual** | Guide đầy đủ; note “Kỳ kế toán đã đóng” |
| **Result** | **Pass** |
| **Evidence** | `packages/erp/src/docs/guide-depreciation.md` |

### DEP-05 — Runtime preview + post → JE

| Field | Value |
|-------|-------|
| **Module** | Assets / Accounting UAT |
| **Precondition** | Accounting env + lịch khấu hao |
| **Steps** | 1. Chọn tháng. 2. Xem trước. 3. Ghi sổ. 4. Chạy lại không double. |
| **Expected** | Tổng đúng; JE tạo; không double |
| **Actual** | Chưa chạy accounting env |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify |

---

## G. Fiscal period (recently viewed)

### FP-01 — BE endpoints periods

| Field | Value |
|-------|-------|
| **Module** | Accounting / Fiscal BE |
| **Precondition** | `FiscalPeriodController` |
| **Steps** | 1. Trace GET list, POST ensure, close, reopen + `@CheckPermission`. |
| **Expected** | Đủ 4 endpoints + permission |
| **Actual** | `/accounting/periods`, `/ensure`, `/{id}/close`, `/{id}/reopen` + VIEW/CREATE/UPDATE |
| **Result** | **Pass** |
| **Evidence** | `FiscalPeriodController.java` |

### FP-02 — FE API + hooks

| Field | Value |
|-------|-------|
| **Module** | Accounting FE |
| **Precondition** | `periodsApi` + hooks |
| **Steps** | 1. Trace list/ensure/close/reopen. 2. Trace hooks. |
| **Expected** | Client gọi đúng path |
| **Actual** | `periodsApi` + `useEnsureYear` / `useClosePeriod` / `useReopenPeriod` tồn tại |
| **Result** | **Pass** |
| **Evidence** | `accountingApi.ts`, `useAccounting.ts` |

### FP-03 — FE ensure năm từ Settings

| Field | Value |
|-------|-------|
| **Module** | Accounting FE |
| **Precondition** | `AccountingSettingsPage` + quyền PERIODS.CREATE |
| **Steps** | 1. Trace nút “Tạo năm tài chính…”. |
| **Expected** | Gọi ensure year hiện tại khi có quyền |
| **Actual** | `onEnsureCurrentYear` → `ensureYear.mutate(currentYear)`; gated `canCreatePeriod` |
| **Result** | **Pass** |
| **Evidence** | `AccountingSettingsPage.tsx` |

### FP-04 — FE UI đóng / mở lại kỳ — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | Accounting FE |
| **Severity** | **Major (S2)** |
| **Precondition** | BE close/reopen + FE hooks tồn tại |
| **Steps** | 1. Grep toàn `packages/erp` cho `useClosePeriod` / `useReopenPeriod`. 2. Kiểm tra mọi page accounting. 3. Xác nhận Settings chỉ ensure. |
| **Expected** | User đóng/reopen kỳ từ UI (Settings hoặc màn periods) |
| **Actual** | Hooks **chỉ định nghĩa** trong `useAccounting.ts`; **không page nào import/gọi**. Settings chỉ ensure. Guide khấu hao nói “kỳ đã đóng” nhưng UI không khóa/mở kỳ → lệch BE capability. |
| **Result** | **Fail** |
| **Evidence** | Grep consumers = 0 (ngoài định nghĩa hook). Assign FE (+ BA confirm AC màn periods). Bug tracker: **BUG-FP-04** |

---

## H. Mobile smoke (FrezoMobile)

### MOB-01 — Attendance tab skeleton/empty/stats LATE

| Field | Value |
|-------|-------|
| **Module** | FrezoMobile / Attendance |
| **Precondition** | Đọc `attendance.tsx` |
| **Steps** | 1. Trace Skeleton/EmptyState. 2. Đếm `status==='LATE'`. 3. CTA check-in. |
| **Expected** | Skeleton; EmptyState; LATE count; CTA check-in |
| **Actual** | `Skeleton`/`SkeletonList`/`EmptyState`; `late` filter; `router.push('/attendance/check-in')` |
| **Result** | **Pass** |
| **Evidence** | `FrezoMobile/app/(tabs)/attendance.tsx` |

### MOB-02 — Tabs layout leave / profile / attendance

| Field | Value |
|-------|-------|
| **Module** | FrezoMobile |
| **Precondition** | `_layout.tsx` + tab files |
| **Steps** | 1. Đọc tabs. 2. Confirm files leave/profile/attendance exist. |
| **Expected** | Tab routes tồn tại; không crash import |
| **Actual** | Tabs Clock/Calendar/User + files present |
| **Result** | **Pass** |
| **Evidence** | `_layout.tsx`, `leave.tsx`, `profile.tsx`, `attendance.tsx` |

### MOB-03 — Runtime mobile check-in ↔ ERP daily LATE

| Field | Value |
|-------|-------|
| **Module** | Mobile + ERP ATT |
| **Precondition** | Device/emulator + BE |
| **Steps** | 1. Check-in mobile muộn. 2. Xem roster FE admin. |
| **Expected** | Đồng bộ LATE / NOT_CHECKED_IN |
| **Actual** | Chưa device/emulator |
| **Result** | **Blocked** |
| **Evidence** | — Need Verify |

---

## Defects mở từ plan này

| Bug ID | TC | Severity | Priority | Status | Summary | Owner |
|--------|-----|----------|----------|--------|---------|-------|
| **BUG-FP-04** | FP-04 | Major | P1 | **Fixed** (sheet 2026-07-22) | Đã có `FiscalPeriodsPage` close/reopen — **cần QA retest runtime** | FE → QA |
| **BUG-ATT-ERR-01** | ATT-ERR-01 | Minor | P2 | **Confirmed** (2026-07-22) | Daily roster `isError` dùng EmptyState thay ErrorState | FE |

Expand Sprint 3 + mobile + PO/recruit/BCTC/CSV: xem `qa-test-plan-2026-07-22-sprint3-expand.md` (10 Confirmed mới trên sheet).

Các P0 Linkage (PAY-01, ATT-*, MAIL-01) vẫn chờ retest runtime (NV-* trên sheet). Không ghi PASS BUG_PLAN đến khi QA chạy env.

---

## Retest checklist (khi có env)

1. [ ] PAY calculate-all 200 + skip list (LNK01-02, LNK02-06/07) → PAY-01
2. [ ] ATT daily UAT (LNK03-07/08) → ATT-*
3. [ ] MAIL bulk + MailHog (LNK09-06/07) → MAIL-01
4. [ ] Fix FP-04 UI close/reopen → QA retest FP-04
5. [ ] (Optional) DEP-05 post JE + kỳ đóng chặn post
6. [ ] MOB-03 mobile ↔ roster LATE

---

## Evidence index

| Area | Path |
|------|------|
| Changelog | `packages/erp/src/docs/sprint-changelog.md` |
| Bug paste | `packages/erp/src/docs/qa-bug-tracker-2026-07-21.tsv` / `.csv` |
| Payroll FE | `qlns/services/payrollApi.ts`, `PayrollCalculateModal.tsx`, `PayrollsPage.tsx` |
| Payroll BE | `PayrollController.java`, `PayrollCalculationOrchestrator.java` |
| ATT FE | `AttendanceDailyRoster.tsx`, `attendanceApi.ts` |
| ATT BE | `AttendanceController.java`, `AttendanceServiceImpl.java` |
| Email | `EmailComposePage.tsx`, `EmailInboxPage.tsx`, `emailApi.ts`, `demo_data.sql` §13b |
| WF / Approval | `WorkflowsPage.tsx`, `WorkflowDesignerPage.tsx`, `ApprovalInboxPage.tsx` |
| Depreciation | `DepreciationPostPage.tsx`, `depreciationApi.ts`, `guide-depreciation.md` |
| Fiscal | `FiscalPeriodController.java`; `periodsApi`; `useAccounting.ts`; `AccountingSettingsPage.tsx`; **`FiscalPeriodsPage.tsx`** (fix FP-04) |
| Mobile | `FrezoMobile/app/(tabs)/attendance.tsx`, `_layout.tsx` |
| Expand 07-22 | `qa-test-plan-2026-07-22-sprint3-expand.md` + sheet BUGS |

---

*QA Frontend — static verify 2026-07-21 (chi tiết). Cập nhật chéo 2026-07-22: FP-04 Fixed trên sheet; bugs mới trên plan expand. Không commit BUG_PLAN PASS cho đến retest runtime.*
