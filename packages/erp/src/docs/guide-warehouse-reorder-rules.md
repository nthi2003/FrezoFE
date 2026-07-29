# Quy tắc tái nhập kho

Đặt **ngưỡng tồn tối thiểu / tối đa** cho từng sản phẩm tại từng kho — hệ thống **cảnh báo** khi tồn xuống dưới min và gợi ý **số lượng đặt lại** khi tạo yêu cầu mua.

**Màn hình:** **Kho** → **Quy tắc tồn kho** (`/warehouse/reorder-rules`)

**Ảnh minh hoạ:** `/docs-assets/eu/` (FTECH demo)

![Menu — nhóm Kho](/docs-assets/eu/menu-sidebar.png)

---

## Ai dùng, để làm gì?

| Vai trò | Việc chính |
|---------|------------|
| **Thủ kho / Kho vận** | Theo dõi ngưỡng min/max, chỉnh nhanh khi mùa vụ đổi |
| **Mua hàng** | Biết SL đặt lại gợi ý; cảnh báo tồn dẫn sang **Cảnh báo tồn kho** → tạo PR |
| **Quản lý kho** | Rà soát quy tắc theo kho, xuất CSV báo cáo |

**Mục đích:** Không để hết hàng đột ngột — có ngưỡng rõ, cảnh báo sớm, đặt hàng đúng cỡ lô.

---

## Ba con số cần hiểu

| Thuật ngữ trên màn | Ý nghĩa | Ví dụ FTECH |
|--------------------|---------|-------------|
| **Min** | Dưới mức này → coi là **sắp thiếu**, sinh cảnh báo | *Rau Cải Xanh* tại *Kho Hà Nội*: Min **50** kg |
| **Max** | Trần tồn mong muốn (không bắt buộc chặn nhập) | Max **200** kg |
| **SL đặt lại** | Gợi ý số lượng khi tạo yêu cầu mua từ cảnh báo | Đặt lại **100** kg/lần |

> **Min phải ≤ Max.** Sửa trực tiếp trên bảng: bấm vào ô số → gõ → click ra ngoài để lưu.

---

## Làm việc chính — xem & lọc danh sách

1. Vào **Kho** → **Quy tắc tồn kho**.
2. Ở góc phải, chọn **Tất cả kho** hoặc một kho cụ thể (*Kho Hà Nội*, *Kho TP.HCM*, *Kho Đà Lạt*).
3. (Tuỳ chọn) Lọc thêm theo **Danh mục** sản phẩm.
4. Bảng hiển thị: tên SP, kho, min, max, SL đặt lại, trạng thái **ON/OFF**.

**Dữ liệu mẫu FTECH** (sau khi Admin khởi tạo demo):

| Sản phẩm | Kho | Min | Max | SL đặt lại |
|----------|-----|-----|-----|------------|
| Rau Cải Xanh Đà Lạt | Kho Hà Nội | 50 | 200 | 100 |
| Dâu Tây Đà Lạt | Kho Đà Lạt | 10 | 80 | 40 |
| Tôm Sú Cà Mau | Kho TP.HCM | 5 | 50 | 20 |
| Gạo ST25 Sóc Trăng | Kho TP.HCM | 20 | 500 | 100 |

---

## Thêm quy tắc mới

1. Bấm **Thêm quy tắc** (góc phải).
2. Trong hộp thoại **Thêm quy tắc tái nhập**:
   - **Kho \*** — chọn kho áp dụng.
   - **Mã / ID sản phẩm \*** — nhập mã SP (vd. `SP001`) hoặc ID hệ thống.
   - **Min \***, **Max \***, **SL đặt lại** — điền số dương; Min ≤ Max.
3. Bấm **Thêm**.

**Kết quả:** Dòng mới xuất hiện trên bảng, trạng thái **ON**. Mỗi cặp *một sản phẩm + một kho* chỉ có **một** quy tắc.

---

## Sửa nhanh trên bảng

1. Bấm vào ô **Min** hoặc **Max** trên dòng cần sửa.
2. Gõ số mới → click ra ngoài ô (hoặc Tab).
3. Hệ thống lưu tự động; nếu Min > Max sẽ báo lỗi và không lưu.

---

## Xoá một hoặc nhiều quy tắc

1. Tick checkbox ở đầu dòng (hoặc tick hàng đầu để **chọn tất cả**).
2. Bấm **Xoá (n)** — *n* là số dòng đã chọn.
3. Trong hộp **Xoá n quy tắc?** → bấm **Xoá** để xác nhận (không hoàn tác).

---

## Import / Export

| Nút | Việc làm |
|-----|----------|
| **Tải template** | Tải file CSV mẫu (cột: mã SP, mã kho, min, max, SL đặt lại) |
| **Import Excel** | Chọn file `.xlsx` / `.csv` theo template |
| **Export (n)** | Xuất các dòng đã chọn ra CSV |

> **Lưu ý:** Import hàng loạt đang được hoàn thiện — nếu import chưa ghi dòng, thêm thủ công bằng **Thêm quy tắc** hoặc liên hệ Admin.

---

## Liên kết với Cảnh báo tồn kho

1. Hệ thống quét quy tắc **ON** mỗi ngày (sáng sớm).
2. Nếu tồn khả dụng **< Min** → tạo cảnh báo tại **Kho** → **Cảnh báo tồn kho** (`/warehouse/stock-alerts`).
3. Từ cảnh báo, chọn dòng → **Tạo PR** để sinh **Yêu cầu mua hàng** (SL gợi ý theo **SL đặt lại**).

Ví dụ: *Rau Cải Xanh* tại *Kho Hà Nội* tồn **35** (Min **50**) → cảnh báo **Dưới min**.

---

## Câu hỏi thường gặp

**Min và Max khác gì ngưỡng cảnh báo trên sản phẩm?**  
Quy tắc tái nhập gắn **theo từng kho**. Ngưỡng trên master sản phẩm là mặc định chung; quy tắc kho chi tiết hơn cho vận hành.

**Tại sao không sửa SL đặt lại trực tiếp trên bảng?**  
Hiện chỉ sửa Min/Max inline; đổi SL đặt lại bằng cách xoá và thêm lại quy tắc (hoặc chờ bản cập nhật).

**OFF nghĩa là gì?**  
Quy tắc **OFF** — hệ thống **không** quét cảnh báo cho cặp SP+kho đó.

**Đặt hàng lại có tự tạo PO không?**  
**Không.** Cảnh báo → PR (có thể duyệt) → PO → GRN xác nhận mới tăng tồn. Xem thêm [Đơn hàng & tồn kho](/docs/guide-warehouse-sales).

→ [Cảnh báo tồn kho](/warehouse/stock-alerts) · [Yêu cầu mua hàng](/warehouse/purchase-requests) · [Phiếu nhập & xuất kho](/docs/guide-warehouse-grn-gin) · [Đơn hàng & tồn kho](/docs/guide-warehouse-sales)
