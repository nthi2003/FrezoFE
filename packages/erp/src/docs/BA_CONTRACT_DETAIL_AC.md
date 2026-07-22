# BA AC — Chi tiết Hợp đồng (Contract Detail)

**Ngày:** 2026-07-21  
**Module:** QLNS / Contract  
**Ticket:** **FE-1** · Severity **S1** (block UX)  
**Tham chiếu:** `FE_UI_UX_STANDARD.md` §14.2 Object Page · `TEAM_HOUSES.md` §4bis

---

## Bối cảnh / quyết định BA

User báo: chi tiết HĐ đang mở **popup**, không có editor/viewer HTML, field trống → không dùng được.

| Quyết định | Bắt buộc |
|------------|----------|
| **KHÔNG modal / popup** cho chi tiết HĐ | Route Object Page: **`/qlns/contract/:id`** |
| Nội dung HTML | Vùng **viewer** `htmlContract` trên detail (read-only) |
| Sửa nội dung | **Navigate** sang màn create/edit — không edit inline trong popup |

---

## Ticket FE-1 (S1 — block UX)

| Mục | Giá trị |
|-----|---------|
| Nhà | **FE** |
| Priority | **S1** — drop work khác nếu cần; **same-day fix** |
| SLA | `TEAM_HOUSES` **§4bis**: BA gán ≤30 phút · DEV fix trong ngày · QA retest ≤2h sau fix |
| DoD | QA retest **PASS**; 0 S1 mở trước release |

**Dí DEV:** BA chase same-day đến Done theo §4bis — không để ticket nằm backlog.

---

## AC checklist (bắt buộc)

### AC-1 — Object Page, không modal
- [ ] Click row / “Xem chi tiết” → navigate **`/qlns/contract/:id`** (full Object Page).
- [ ] **Không** mở Dialog/Drawer/Modal cho chi tiết HĐ.
- [ ] URL deep-link được; refresh giữ đúng record.

### AC-2 — Viewer `htmlContract`
- [ ] Detail có vùng xem nội dung HTML từ field **`htmlContract`** (render an toàn / sanitised viewer).
- [ ] Có HTML → hiển thị nội dung; không HTML / rỗng → empty state rõ (không để vùng trống im lặng).
- [ ] **Edit** nội dung = CTA navigate create/edit (không editor TipTap trên popup).

### AC-3 — Map field hiệu lực & giá trị
- [ ] **`effFrom`** hiển thị đúng (ngày hiệu lực từ).
- [ ] **`effTo`** hiển thị đúng (ngày hiệu lực đến).
- [ ] **`value`** hiển thị đúng (giá trị HĐ; format tiền/locale VN nếu áp dụng).
- [ ] API trả null → “—” / empty copy; **không** để field blank không label.

### AC-4 — Banner trạng thái DRAFT / chưa kích hoạt
- [ ] Status **DRAFT** → banner cảnh báo rõ trên Object Page header.
- [ ] **`!activated`** (chưa kích hoạt) → banner tương ứng (phân biệt với DRAFT nếu BE tách trạng thái).
- [ ] Banner không che header actions; đọc được trên desktop + mobile width.

### AC-5 — Loading / error / permission (gate QA)
- [ ] Loading skeleton trên Object Page khi fetch.
- [ ] 404 / lỗi mạng → message + retry.
- [ ] 403 → ẩn action trái phép; không lộ HTML/field nhạy cảm.

---

## Handoff

```
BA (AC này + FE-1 S1) → FE fix same-day (§4bis) → QA retest PASS → Close
```

**Cấm:** giữ modal chi tiết; field trống khi BE đã trả data; thiếu viewer `htmlContract`.
