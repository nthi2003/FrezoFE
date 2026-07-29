# Phiếu nhập & xuất kho

Làm việc **nhập hàng (GRN/PNK)** và **xuất hàng (GIN/PXK)** — chỉ khi **Xác nhận** thì tồn kho mới đổi.

**Màn hình:**
- **Tổng quan kho** → `/warehouse`
- **Phiếu nhập kho** → `/warehouse/grn`
- **Phiếu xuất kho** → `/warehouse/gin`

**Ảnh minh hoạ:** `/docs-assets/eu/` (FTECH demo)

![Menu — nhóm Kho](/docs-assets/eu/menu-sidebar.png)

---

## Ai dùng, để làm gì?

| Vai trò | Việc chính |
|---------|------------|
| **Thủ kho** | Tạo phiếu, kiểm số thực tế, bấm **Xác nhận** |
| **Mua hàng / Kế toán** | Theo dõi GRN sau PO, nhập **số HĐ NCC**, duyệt trước nhập kho |
| **Kinh doanh / giao hàng** | Tạo GIN xuất bán, chuyển kho hoặc xuất nội bộ |

**Mục đích:** Ghi nhận biến động tồn có thời điểm rõ ràng — khác với hoá đơn CRM (chỉ giấy tờ bán).

---

## Luồng mua hàng → nhập kho (chuẩn Frezo)

1. **Cảnh báo tồn** → **Yêu cầu mua (PR)** → duyệt ở Hộp thư.
2. Tạo **Đơn mua (PO)** khi cần.
3. Hàng về → **GRN (PNK)**: nháp → (tuỳ quy mô) **Gửi duyệt → Duyệt** → nhập **số HĐ NCC** nếu gắn PO/NCC → **Xác nhận nhập** → tồn tăng.

> Phiếu gắn **PO hoặc NCC** bắt buộc có **số hóa đơn GTGT đầu vào** trước khi xác nhận nhập (theo chuẩn SAP/AMIS).

---

## Trạng thái phiếu nhập / xuất

| Trạng thái | Ý nghĩa | Tồn kho |
|------------|---------|---------|
| **DRAFT** (Nháp) | Phiếu mới tạo, chỉnh sửa / huỷ được | **Chưa đổi** |
| **PENDING_APPROVAL** | Chờ duyệt (GIN/GRN) | **Chưa đổi** |
| **APPROVED** | Đã duyệt, chờ thủ kho xác nhận | **Chưa đổi** |
| **CONFIRMED** (Đã xác nhận) | Thủ kho đã kiểm và chốt số lượng | **Đã tăng (GRN) hoặc giảm (GIN)** |
| **CANCELLED** (Đã huỷ) | Không thực hiện | **Không đổi** |

> Demo FTECH có sẵn phiếu mẫu: `GRN-DEMO-001`…`004`, `GIN-DEMO-001`…`004` với đủ các trạng thái.

---

## Phiếu nhập kho (GRN / PNK)

### Làm việc chính

1. Vào **Kho** → **Phiếu nhập kho** (`/warehouse/grn`).
2. Bấm **Tạo PNK** (hoặc **Nhận hàng** từ đơn mua).
3. Chọn **kho**, **NCC**, thêm dòng hàng: sản phẩm, SL dự kiến, đơn giá.
4. Nhập **số HĐ NCC** và ngày HĐ nếu phiếu gắn PO/NCC.
5. Lưu → phiếu ở trạng thái **DRAFT**.
6. (Tuỳ chọn) **Gửi duyệt** → kế toán **Duyệt**.
7. Khi hàng về đủ, bấm **Xác nhận nhập** → nhập SL thực nhận → tồn **tăng**.

### Ví dụ demo

| Mã phiếu | Kho | Sản phẩm | Trạng thái | Ghi chú |
|----------|-----|----------|------------|---------|
| GRN-DEMO-001 | Kho Hà Nội | SP001 Rau Cải Xanh | DRAFT | Chờ kiểm 100 kg |
| GRN-DEMO-003 | Kho Đà Lạt | SP002 Dâu Tây | CONFIRMED | Đã nhập 20 hộp |
| GRN-DEMO-004 | Kho Hà Nội | SP003 Cà Chua Bi | CANCELLED | Huỷ chất lượng |

---

## Phiếu xuất kho (GIN / PXK)

### Loại xuất

| Loại | Khi nào dùng |
|------|----------------|
| **Xuất bán** | Giao hàng cho khách — tồn giảm tại kho xuất |
| **Chuyển kho** | Chuyển sang kho đích (chọn kho nhận) |
| **Xuất nội bộ** | Tiêu hao nội bộ, không qua bán hàng |

### Làm việc chính

1. Vào **Kho** → **Phiếu xuất kho** (`/warehouse/gin`).
2. Bấm **Tạo PXK** → chọn kho, loại xuất, khách (nếu xuất bán).
3. Thêm dòng hàng → lưu **DRAFT**.
4. **Gửi duyệt** (nếu công ty bật quy trình) → **Duyệt** → **Xác nhận xuất**.
5. Tồn **giảm**. Nếu thiếu tồn, hệ thống báo lỗi.

### Ví dụ demo

| Mã phiếu | Kho | Sản phẩm | Loại | Trạng thái | Ghi chú |
|----------|-----|----------|------|------------|---------|
| GIN-DEMO-001 | Kho Hà Nội | SP001 | Xuất bán | DRAFT | Nhà hàng Phố Cổ |
| GIN-DEMO-002 | Kho TP.HCM | SP009 | Chuyển kho | DRAFT | Chuyển gạo ST25 |
| GIN-DEMO-003 | Kho Hà Nội | SP012 Trứng gà | Xuất bán | CONFIRMED | BigC — 8 vỉ |
| GIN-DEMO-004 | Kho TP.HCM | SP006 Xoài | Xuất bán | CANCELLED | Khách đổi lịch |

---

## Liên quan luồng mua hàng

1. **Cảnh báo tồn** → **Yêu cầu mua (PR)** → duyệt ở Hộp thư.
2. Tạo **Đơn mua (PO)** khi cần.
3. **GRN xác nhận** → tồn tăng.

Duyệt PR **không** tự nhập kho — xem [Quy tắc tái nhập kho](/docs/guide-warehouse-reorder-rules).

---

## Lỗi / hiểu nhầm thường gặp

| Mong đợi | Thực tế |
|----------|---------|
| Tạo phiếu nháp → tồn đã đổi | **Chưa** — phải **Xác nhận** |
| Xuất hoá đơn CRM → tồn giảm | **Chưa** — phải làm GIN |
| Huỷ phiếu đã xác nhận | **Không được** — cần phiếu điều chỉnh (nếu có) |
| GRN từ PO không cần HĐ NCC | **Sai** — phải có số HĐ trước khi xác nhận nhập |

→ [Đơn hàng & tồn kho](/docs/guide-warehouse-sales) · [Quy tắc tái nhập kho](/docs/guide-warehouse-reorder-rules) · [Cảnh báo tồn kho](/warehouse/stock-alerts)
