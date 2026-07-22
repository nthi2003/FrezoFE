# Báo cáo module CRM & Khách hàng
Ngày: 2026-07-21  
Người: QA + BA  
Phương pháp: **code-first audit** (không login localhost) — đối chiếu `FE_UI_UX_STANDARD.md` (CRUD 10, PageGuide, Empty/Error, permission, StatusBadge, ConfirmDialog; **cấm** `prompt`/`alert`/`confirm` native), SRS `FR-CRM-*` / `FR-CUS-01`, rules QA Frontend + BA.

## 1. Tóm tắt điều hành

CRM (Deals / Meetings / Quotes / Invoices) còn ở mức **prototype vận hành**: có list/kanban + vài action, nhưng **vi phạm STANDARD cứng** (native `confirm`/`prompt`), thiếu **ErrorState + retry**, thiếu **PageGuide**, thiếu **permission gate** trên action, badge status tự chế (không `StatusBadge`), Quotes/Invoices gần như **không có Create UI** dù hook/API đã có.

Customer list đạt mức khá hơn (PageGuide, ConfirmDialog, mask/reveal phone, bulk + permission export/reveal). Customer 360 có EmptyState tốt nhưng còn **bug UX nút “Sửa”**, thiếu ErrorState, tab Documents stub, và filter deal/invoice client-side theo default pipeline (rủi ro thiếu data).

**Gate release: FAIL** — có nhiều S2 trên P0 flow bán hàng (deal WON/LOST, thu tiền HĐ, hạch toán GL) + thiếu CRUD state bắt buộc (Error/Empty/Confirm).

## 2. Phạm vi kiểm tra

| Route | File chính | FR |
| ----- | ---------- | -- |
| `/crm/deals` | `modules/crm/pages/DealsPage.tsx` | FR-CRM-02 |
| `/crm/meetings` | `modules/crm/pages/MeetingsPage.tsx` | FR-CRM-03 |
| `/crm/quotes` | `modules/crm/pages/QuotesPage.tsx` | FR-CRM-03 |
| `/crm/invoices` | `modules/crm/pages/InvoicesPage.tsx` | FR-CRM-03 |
| `/customer` | `modules/customers/pages/CustomersPage.tsx` | FR-CUS-01 |
| `/customer/:id/360` | `modules/customers/pages/Customer360Page.tsx` | FR-CUS-01 |
| `/customer/ncc` | (NCC — ngoài scope sâu; chỉ ghi nhận route tồn tại) | — |

Không audit sâu: Leads, Email sequences (ngoài 5 URL yêu cầu).  
Evidence: path + line / behavior trong code.

### Checklist CRUD 10 (tóm tắt theo màn)

| # | Khía cạnh | Deals | Meetings | Quotes | Invoices | Customer | C360 |
| - | --------- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | Loading | △ text | △ spinner | △ text | △ text | ✓ AppTable | ✓ skeleton |
| 2 | Empty | △ cột “Kéo…” | ✓ EmptyState | ✗ text td | ✗ text td | △ AppTable img (không EmptyState CTA) | ✓ |
| 3 | Error + retry | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| 4 | Success toast | △ hook một phần | ✓ | △ không toast status | ✓ issue/pay/post | ✓ | n/a |
| 5 | ConfirmDialog | ✗ native | ✗ huỷ 1-click | ✗ đổi status | ✗ native | ✓ delete | n/a |
| 6 | Undo | ✗ | ✗ | ✗ | ✗ | ✗ | n/a |
| 7 | Permission UI | ✗ | ✗ | ✗ | ✗ | △ EXPORT / REVEAL only | ✗ |
| 8 | Audit (BE) | n/a FE | n/a | n/a | n/a | reveal có ý audit | n/a |
| 9 | Retry giữ form | ✗ | △ | ✗ | ✗ | △ form giữ khi fail | ✗ |
| 10 | Optimistic | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## 3. Đánh giá đáp ứng yêu cầu (theo màn)

### 3.1 Deals (`/crm/deals`)

**Đạt:** Kanban theo stage, drag-drop đổi stage, tạo deal (AppModal), comment drawer, ensure default pipeline, format tiền/ngày VN.

**Gap / bug:**
- WON dùng `confirm()`, LOST dùng `prompt()` — **cấm STANDARD §6.6** (`DealsPage.tsx` L245–254).
- Không `ErrorState` khi pipeline/deals fail; loading chỉ text “Đang tải…” (L168) — không Skeleton.
- Empty pipeline: nút tạo default OK; empty stage chỉ text “Kéo deal vào đây” — không `EmptyState` CTA ở board rỗng toàn cục.
- Không `PageGuide`; không `usePermission` cho tạo/WON/LOST/move.
- Form tạo deal: raw `<input>`/`<select>`, không gắn `customerId` / owner — thiếu liên kết khách hàng (gap SRS/BA).
- Status WON/LOST không dùng `StatusBadge` (card chỉ OPEN trên board).

**Kết luận màn:** Chưa release-ready (S2 native dialog + thiếu Error).

### 3.2 Meetings (`/crm/meetings`)

**Đạt:** List + EmptyState + Create modal; cancel API qua PUT status; toast create/cancel error.

**Gap / bug:**
- Huỷ họp **không ConfirmDialog** — 1 click (`MeetingsPage.tsx` L86–93) → destructive không confirm (CRUD #5).
- Không `ErrorState`/`isError`; loading = Loader2 giữa trang (không Skeleton table).
- Form nhập **Deal ID / Customer ID** monotype — UX kém, không picker (S3/BA).
- Hiển thị raw `dealId`/`customerId`/`status` string — không StatusBadge, không tên KH/deal.
- Không PageGuide, không permission.

**Kết luận màn:** Empty OK; Confirm + Error + picker = bắt buộc trước P0.

### 3.3 Quotes (`/crm/quotes`)

**Đạt:** Search client, ExpiryBadge hữu ích, đổi status SENT/ACCEPTED/REJECTED từ list.

**Gap / bug:**
- **Không UI tạo/sửa báo giá** dù `useCreateQuote` / API tồn tại → FR-CRM-03 incomplete (S2).
- Empty = text trong `<td>` (L101–103), không `EmptyState` + CTA.
- Không ErrorState; loading text.
- Status = custom span `STATUS_TONE` — không `StatusBadge` (STANDARD).
- Đổi status (Duyệt/Từ chối) không ConfirmDialog — rủi ro nhầm (S2/S3).
- `useSetQuoteStatus` không `onError` toast riêng (chỉ invalidate) — mutate fail có thể im lặng nếu interceptor không cover.
- Không PageGuide, không permission, không tạo từ deal/customer.

**Kết luận màn:** Read-only-ish; block nếu quote là P0 sales.

### 3.4 Invoices (`/crm/invoices`)

**Đạt:** Filter status, search, progress bar thanh toán, issue / pay / post-GL, comment drawer, KPI phải thu.

**Gap / bug:**
- Thu tiền: `prompt()` (L163–166); Hạch toán: `confirm()` (L174) — **cấm native**.
- Không Create hoá đơn trên page (`useCreateInvoice` có sẵn) — S2.
- Empty/loading text td; không ErrorState; không StatusBadge; không PageGuide; không permission (issue/pay/post đều public trên UI).
- Issue không confirm — chấp nhận được nếu toast + undo; hiện không undo.

**Kết luận màn:** Action tài chính dùng native dialog → S2 block P0.

### 3.5 Customer (`/customer` + `/customer/:id/360`)

**List — đạt:** PageGuide (`CUSTOMERS_GUIDE`), ConfirmDialog xoá đơn/bulk, mask phone + `CUSTOMER.REVEAL_PHONE`, export gated `CUSTOMER.EXPORT`, AppForm + schema, KPI + filter tabs, AppTable selectable.

**List — gap:**
- Không `ErrorState` khi `useCustomers` fail.
- Create/Edit/Delete **không** check permission (chỉ EXPORT/REVEAL) — CRUD #7 incomplete.
- Import button **disabled** nhưng PageGuide vẫn mô tả Import CSV → lệch guide vs UI (BA/FE).
- Detail modal còn placeholder “đang phát triển” + emoji — trùng mục đích với 360 → polish.
- Empty AppTable dùng ảnh generic, không CTA “Thêm khách hàng”.

**360 — đạt:** Skeleton loading, EmptyState not-found, tabs deals/invoices/activities/notes với EmptyState; KPI YTD / overdue.

**360 — gap / bug:**
- Nút **“Sửa thông tin”** navigate `/customer` (list) thay vì mở edit — **sai label/behavior** (`Customer360Page.tsx` L264–266) → S2.
- “Deal mới” / “Hoá đơn mới” chỉ nhảy list CRM, không prefill `customerId`.
- Không ErrorState khi getById fail (coi như empty) vs lỗi mạng.
- Deals chỉ lấy **default pipeline** rồi filter client — deal ở pipeline khác biến mất trên 360 (S2 data correctness / có thể cần BE `listByCustomer`).
- Tab Documents stub; status deal/invoice không StatusBadge; không PageGuide; không permission.
- KPI gradient raw colors — chấp nhận được nếu design token; không block.

**Kết luận màn:** List gần chuẩn nhất module; 360 cần fix nút Sửa + data pipeline trước gate.

## 4. Bug / Gap log (ticket cho DEV)

| ID | Màn | Sev | Nhà | Title | Evidence | Expected | Actual | AC retest |
| -- | --- | --- | ---- | ----- | -------- | -------- | ------ | --------- |
| CRM-001 | Deals | S2 | FE | Thay `confirm`/`prompt` WON/LOST bằng ConfirmDialog + form lý do | `DealsPage.tsx` L245–254; STANDARD §6.6 | ConfirmDialog; LOST có field lý do trong modal | Native browser dialogs | WON/LOST không còn native; cancel giữ deal |
| CRM-002 | Invoices | S2 | FE | Thay `prompt` thu tiền + `confirm` hạch toán bằng AppModal/ConfirmDialog | `InvoicesPage.tsx` L163–175 | Modal số tiền + validate; ConfirmDialog post-GL | Native prompt/confirm | Thu tiền/hạch toán không native; validate amount ≤ remain |
| CRM-003 | Deals / Quotes / Invoices / Meetings / Customer | S2 | FE | Bổ sung ErrorState + onRetry cho mọi read query | Các page CRM + Customers; STANDARD CRUD #3 | `isError` → ErrorState Thử lại | Fail API → blank/list rỗng hoặc text loading cũ | Cắt mạng → thấy Error + retry load lại |
| CRM-004 | Quotes | S2 | FE (+BA AC) | Thiếu Create/Edit báo giá trên UI | `QuotesPage.tsx` chỉ list; `useCreateQuote` unused | CTA tạo BG, form fields theo SRS | Chỉ search + đổi status | Tạo DRAFT → hiện list; sửa được dòng |
| CRM-005 | Invoices | S2 | FE (+BA AC) | Thiếu Create hoá đơn trên UI | `InvoicesPage.tsx`; `useCreateInvoice` unused | CTA tạo HĐ gắn KH/lines | Chỉ filter + action trên HĐ có sẵn | Tạo DRAFT → Issue |
| CRM-006 | Meetings | S2 | FE | Huỷ họp phải ConfirmDialog | `MeetingsPage.tsx` L86–93 | Confirm trước CANCELLED | 1-click huỷ | Cancel confirm → status CANCELLED; dismiss không đổi |
| CRM-007 | Customer360 | S2 | FE | Nút “Sửa thông tin” mở edit, không về list | `Customer360Page.tsx` L264–266 | Mở modal/route edit KH hiện tại | `nav('/customer')` | Sửa lưu → data 360 cập nhật |
| CRM-008 | Customer360 | S2 | FE / BE | Deal 360 thiếu nếu không thuộc default pipeline | L152–163 filter `useDealsByPipeline(defaultPipelineId)` | Mọi deal của customer | Chỉ deal pipeline default | KH có deal pipeline khác vẫn thấy trên tab Deals |
| CRM-009 | Quotes / Invoices / Deals | S3 | FE | Dùng StatusBadge thay span tone tự chế | Quotes L114–116; Invoices L140–142; Deals cards | `StatusBadge` + config | Custom classes | Visual đồng bộ module khác |
| CRM-010 | CRM all | S3 | FE | Thêm PageGuideButton + guide constants | Chỉ Customer có `CUSTOMERS_GUIDE` | PageGuide mỗi màn CRM | Không có | Mở guide đúng copy BA |
| CRM-011 | CRM all | S2 | FE / BA | Gate permission action (CRM.\* / INVOICE.\*) | Không `usePermission` trong crm pages | Ẩn nút không quyền; 403 toast | Mọi user thấy WON/pay/post… | Role thiếu quyền không thấy nút |
| CRM-012 | Quotes | S3 | FE | Confirm trước ACCEPTED/REJECTED | `QuotesPage.tsx` L125–135 | ConfirmDialog | 1-click đổi status | Confirm mới đổi; toast success |
| CRM-013 | Meetings | S3 | FE / BA | Picker Deal/Customer thay nhập UUID | `MeetingsPage.tsx` L134–145 | Combobox tìm theo tên | Input monotype ID | Tạo họp gắn đúng tên KH/deal |
| CRM-014 | Customer | S3 | FE / BA | Align Import: enable UI hoặc sửa PageGuide | Guide steps Import; button disabled L429–431 | Guide khớp sản phẩm | Guide hứa Import, UI disabled | Không còn lệch |
| CRM-015 | Customer | S3 | FE | Permission CREATE/UPDATE/DELETE trên list | Chỉ REVEAL/EXPORT | Ẩn Thêm/Sửa/Xoá theo quyền | Ai cũng thấy | Role viewer không xoá được |
| CRM-016 | Deals | S3 | FE / BA | Form tạo deal gắn customer + validation FormField | Create modal L269–324 | Chọn KH bắt buộc (theo AC) | Chỉ title/amount/stage | Tạo deal có `customerId` |
| CRM-017 | CRM hooks | S3 | FE | onError toast cho mọi mutation CRM | `useCrm.ts` gần như chỉ onSuccess (trừ delete lead) | `toast.error` / `toast.apiError` | Fail có thể im lặng | Fail network → toast lỗi, form giữ |
| CRM-018 | Customer360 | S4 | FE | Prefill customerId khi CTA Deal/HĐ mới | L267–272 | Deep-link query `?customerId=` | Chỉ navigate list trống | Mở create với KH đã chọn |
| CRM-019 | Leads (ngoài scope URL nhưng cùng module) | S2 | FE | `confirm` convert lead | `LeadsPage.tsx` L177–179 | ConfirmDialog | Native confirm | Ghi nhận regression cùng pattern |

## 5. Cải thiện đề xuất (UX/SRS) — không phải bug

1. **BA — AC FR-CRM-03 chi tiết:** Spec form Quote/Invoice (lines, VAT, validUntil, map từ Deal WON); permission matrix `CRM.DEAL.*`, `CRM.QUOTE.*`, `CRM.INVOICE.ISSUE|PAY|POST_GL`, `CRM.MEETING.*`.
2. **BA — Customer 360 Object Page:** Spec tab Documents (upload/link hợp đồng), Notes CRUD riêng (không chỉ field `note`), deep-link create Deal/Invoice.
3. **UX — Deals:** View list + filter WON/LOST; filter owner; mobile card list (STANDARD table mobile).
4. **UX — Meetings:** Calendar/week view (pattern Base.vn / AMIS CRM) thay list thuần.
5. **Market brief (ngắn):** Đối thủ (Base, MISA AMIS, 1Office) luôn có: (a) create quote/invoice từ deal, (b) customer picker, (c) confirm tài chính không native dialog, (d) 360 đủ pipeline. Frezo nên ưu tiên (a)+(c) trước calendar đẹp.
6. **SA:** Endpoint `GET /crm/deals?customerId=` (đã có trong `crmApi` listByCustomer) — FE 360 nên dùng thay vì filter default pipeline.

## 6. Ưu tiên sprint (S1→S3)

### S1 (blockers trong sprint — xử lý trước feature mới)
_Không có S1 crash/security rõ từ code-static; native dialog + thiếu Create HĐ/BG trên P0 coi như **S2 gate**._

### S2 — làm ngay (same-day / trước release CRM)
1. **CRM-001** Deals ConfirmDialog WON/LOST  
2. **CRM-002** Invoices modal thu tiền + Confirm post-GL  
3. **CRM-003** ErrorState + retry (CRM + Customer)  
4. **CRM-004 / CRM-005** Create Quote & Invoice UI (BA AC trước nếu field TBD)  
5. **CRM-006** Meetings Confirm huỷ  
6. **CRM-007** Customer360 nút Sửa  
7. **CRM-008** Deals theo customer đúng data  
8. **CRM-011** Permission hide actions  

### S3 — sprint kế
- CRM-009 StatusBadge, CRM-010 PageGuide, CRM-012 confirm quote status, CRM-013 picker, CRM-014/015 Customer polish, CRM-016 deal↔customer, CRM-017 mutation errors.

### S4 — polish
- CRM-018 prefill; dọn placeholder emoji detail modal; Skeleton thay text loading.

## 7. Kết luận / Gate release

| Tiêu chí gate (QA rule) | Kết quả |
| ----------------------- | ------- |
| 0 S1 mở | PASS (không phát hiện S1) |
| 0 S2 mở trên P0 flows | **FAIL** — CRM-001…008, 011, (004/005 nếu quote/invoice P0) |
| CRUD state bắt buộc (Empty/Error/Confirm) | **FAIL** — thiếu Error toàn CRM; Confirm native; Quotes/Invoices empty kém |
| Không native prompt/alert/confirm | **FAIL** — Deals + Invoices (+ Leads) |
| Customer list gần DoD | **PARTIAL PASS** — tốt nhất module; còn Error + permission CRUD |

**Quyết định: KHÔNG release** module CRM & Customer 360 cho production cho đến khi đóng tối thiểu **CRM-001, CRM-002, CRM-003, CRM-006, CRM-007** và (nếu sales P0) **CRM-004, CRM-005**.

BA gán ticket → FE fix same-day S2 → QA retest theo cột AC → mới Close.

---

*File này là deliverable audit 2026-07-21. Không kèm hotfix code (theo mandat QA/BA).*
