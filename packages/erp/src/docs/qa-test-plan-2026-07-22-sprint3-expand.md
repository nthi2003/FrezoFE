# QA Test Plan — 2026-07-22 expand (Sprint 3 + Linkage residual + Mobile)

| Field | Value |
|-------|-------|
| **Date** | 2026-07-22 |
| **Owner** | QA Frontend |
| **Method** | Static verify (FE/BE code + changelog). Không E2E runtime. |
| **Rules** | `qa-frontend.mdc`, `erp-ui-ux` / `FE_UI_UX_STANDARD` CRUD 10 |
| **Sheet** | [BUG FREZO](https://docs.google.com/spreadsheets/d/1Bep0AyTObzFKeusDFbQhjA4zZviwrotK1Rl5sD2ScVM/edit?usp=sharing) tab `BUGS` |
| **Prior plan** | `qa-test-plan-2026-07-21-linkage-s1.md` (không duplicate NV-* / BUG-FP-04) |

---

## Scope covered thêm (2026-07-22)

| Area | What checked |
|------|----------------|
| FiscalPeriodsPage | UI close/reopen đã có (`/accounting/periods`) — **BUG-FP-04 Fixed trên sheet** → chờ QA retest runtime |
| LNK-04 | Banner/PageGuide Inbox vs Designer — Pass trước đó, không mở bug mới |
| Depreciation | Post gate khi đã POSTED; CRUD states |
| Payroll | Hạch toán → GL confirm path |
| Attendance daily | Error vs Empty state |
| Leave drawer | Cancel confirm |
| PO list/detail | ErrorState / ConfirmDialog / permission |
| Recruitment board | Hire confirm |
| GL + Trial Balance | Changelog “Export CSV” vs UI thật |
| BCTC | ErrorState |
| Mobile leave / attendance | Error nuốt thành Empty |

**Không đụng Status:** BUG-FP-04, NV-LNK01-02, NV-LNK02-06/07, NV-LNK03-07/08, NV-LNK09-06/07, NV-DEP-05, NV-MOB-03.

---

## Summary

| Result | Count |
|--------|------:|
| **Fail → Confirmed (mới)** | 10 |
| **Need Verify mới** | 0 |
| **Prior Need Verify (giữ nguyên)** | 9 |

---

## Confirmed bugs mới

| Bug ID | Severity | Title |
|--------|----------|-------|
| **BUG-ACC-CSV-01** | Major | Changelog Export CSV GL+TB nhưng UI không có Xuất CSV |
| **BUG-PAY-GL-01** | Major | Hạch toán → GL dùng `window.confirm` native |
| **BUG-LEAVE-CFM-01** | Major | Huỷ đơn nghỉ dùng `confirm()` native |
| **BUG-ATT-ERR-01** | Minor | Roster lỗi dùng EmptyState thay ErrorState |
| **BUG-DEP-POST-01** | Minor | Ghi sổ vẫn enable khi kỳ đã POSTED |
| **BUG-PO-CRUD-01** | Major | PO thiếu ErrorState; Confirm không dialog / permission |
| **BUG-REC-HIRE-01** | Major | Duyệt thuê không ConfirmDialog |
| **BUG-BCTC-ERR-01** | Minor | BCTC lỗi không ErrorState + retry |
| **BUG-MOB-LEAVE-01** | Major | Mobile leave lỗi → Empty “Chưa có đơn” |
| **BUG-MOB-ATT-01** | Major | Mobile attendance lỗi → Empty |

---

## New TCs

### ACC-CSV-01 — Export CSV GL + TB — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | Accounting |
| **Severity** | Major |
| **Steps** | Changelog Sprint 3 → `GeneralLedgerPage` / `TrialBalancePage` → grep export CSV |
| **Expected** | Nút Xuất CSV |
| **Actual** | Không có; TB chỉ `window.print`; BE không endpoint export GL/TB |
| **Result** | **Fail** → **BUG-ACC-CSV-01** |

### PAY-GL-01 — Confirm Hạch toán GL — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | QLNS / Payroll |
| **Steps** | Trace nút Hạch toán → GL trên `PayrollsPage` |
| **Expected** | `ConfirmDialog` |
| **Actual** | `confirm(...)` native |
| **Result** | **Fail** → **BUG-PAY-GL-01** |

### LEAVE-CFM-01 — Cancel leave confirm — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | QLNS / Leave |
| **Steps** | `LeaveDetailDrawer.handleCancel` |
| **Expected** | `ConfirmDialog` danger |
| **Actual** | `confirm('Chắc chắn huỷ...')` |
| **Result** | **Fail** → **BUG-LEAVE-CFM-01** |

### ATT-ERR-01 — Daily roster error state — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | Attendance LNK-03 |
| **Steps** | `AttendanceDailyRoster` nhánh `isError` |
| **Expected** | `ErrorState` + retry |
| **Actual** | `EmptyState` “Không tải được roster” |
| **Result** | **Fail** → **BUG-ATT-ERR-01** |

### DEP-POST-01 — Post button when POSTED — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | Assets / Depreciation |
| **Steps** | `existingPosted` + disabled Ghi sổ |
| **Expected** | Disable/ẩn Ghi sổ khi đã POSTED |
| **Actual** | Chỉ `disabled={post.isPending}` |
| **Result** | **Fail** → **BUG-DEP-POST-01** |

### PO-CRUD-01 — PO list CRUD states — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | Warehouse / PO |
| **Steps** | Error UI + Confirm DRAFT + permission |
| **Expected** | ErrorState; ConfirmDialog; ẩn theo quyền |
| **Actual** | Thiếu cả ba |
| **Result** | **Fail** → **BUG-PO-CRUD-01** |

### REC-HIRE-01 — Hire confirm — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | Recruitment |
| **Steps** | Nút Duyệt thuê trên OFFER |
| **Expected** | ConfirmDialog trước hire |
| **Actual** | `hire.mutate` trực tiếp |
| **Result** | **Fail** → **BUG-REC-HIRE-01** |

### BCTC-ERR-01 — Financial statements error — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | Accounting / BCTC |
| **Steps** | `FinancialStatementsPage` `active.isError` |
| **Expected** | ErrorState + retry |
| **Actual** | `<p>` rose text |
| **Result** | **Fail** → **BUG-BCTC-ERR-01** |

### MOB-LEAVE-01 — Leave error as empty — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | FrezoMobile |
| **Steps** | `leave.tsx` ListEmptyComponent |
| **Expected** | Error + retry khi `isError` |
| **Actual** | Empty “Chưa có đơn phép” |
| **Result** | **Fail** → **BUG-MOB-LEAVE-01** |

### MOB-ATT-01 — Attendance error as empty — **FAIL**

| Field | Value |
|-------|-------|
| **Module** | FrezoMobile |
| **Steps** | `attendance.tsx` ListEmptyComponent |
| **Expected** | Error + retry khi `list.isError` |
| **Actual** | Empty “Chưa có dữ liệu chấm công” |
| **Result** | **Fail** → **BUG-MOB-ATT-01** |

### FP-04-RETEST — FiscalPeriodsPage (note)

| Field | Value |
|-------|-------|
| **Module** | Accounting / Fiscal |
| **Note** | Sheet **BUG-FP-04 = Fixed**. Code hiện có `FiscalPeriodsPage` close/reopen + ConfirmDialog + permissions. |
| **Result** | **Need runtime retest** (không đổi Status sheet) |

---

## Evidence index (mới)

| Area | Path |
|------|------|
| GL / TB | `accounting/pages/GeneralLedgerPage.tsx`, `TrialBalancePage.tsx` |
| BCTC | `FinancialStatementsPage.tsx` |
| Fiscal UI | `FiscalPeriodsPage.tsx` |
| Payroll GL | `qlns/pages/PayrollsPage.tsx` |
| Leave | `qlns/components/LeaveDetailDrawer.tsx` |
| ATT | `qlns/components/AttendanceDailyRoster.tsx` |
| DEP | `assets/pages/DepreciationPostPage.tsx` |
| PO | `warehouse/pages/PurchaseOrdersPage.tsx` |
| Recruit | `qlns/pages/RecruitmentBoardPage.tsx` |
| Mobile | `FrezoMobile/app/(tabs)/leave.tsx`, `attendance.tsx` |

---

*QA Frontend — static verify 2026-07-22. Không commit. Không PASS runtime Need Verify cũ.*
