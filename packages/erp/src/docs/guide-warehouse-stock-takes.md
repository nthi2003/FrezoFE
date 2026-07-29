# Kiểm kê kho

Đối chiếu **tồn trên hệ thống** với **số lượng đếm thực tế** tại kho — ghi nhận chênh lệch sau khi hoàn tất phiếu.

**Màn hình:** **Kho** → **Kiểm kê kho** (`/warehouse/stock-takes`)

**Ảnh minh hoạ:** `/docs-assets/eu/` (FTECH demo)

![Menu — nhóm Kho](/docs-assets/eu/menu-sidebar.png)

---

## Ai dùng, để làm gì?

| Vai trò | Việc chính |
|---------|------------|
| **Thủ kho / Kho vận** | Lập phiếu, đếm hàng, gửi số đếm, điều chỉnh tồn |
| **Quản lý kho** | Rà soát phiếu lệch, đối chiếu KPI trước khi chốt |
| **Kế toán / Kiểm soát** | Tra cứu phiếu **Hoàn tất** làm căn cứ điều chỉnh sổ |

**Mục đích:** Biết chính xác tồn thực tế — phát hiện thừa/thiếu, cập nhật hệ thống có căn cứ thay vì sửa tay ngoài quy trình.

---

## Quy trình 4 bước

| Bước | Trạng thái trên màn | Việc chính |
|------|---------------------|------------|
| **1. Tạo phiếu** | **Nháp** | Chọn kho, ngày kiểm kê, danh sách SP cần đếm |
| **2. Bắt đầu đếm** | **Đang đếm** | Hệ thống chốt **SL hệ thống** tại thời điểm bắt đầu |
| **3. Gửi số đếm** | **Đã gửi** | Nhập **SL đếm** thực tế — chênh lệch (+/−) hiện ngay |
| **4. Điều chỉnh tồn** | **Hoàn tất** | Ghi nhận chênh lệch — tồn kho được cập nhật |

> Thanh tiến trình trên màn chi tiết phiếu phản ánh đúng bốn bước trên. Mỗi bước chỉ làm được khi phiếu ở trạng thái phù hợp.

---

## Bốn trạng thái phiếu

| Trạng thái | Ý nghĩa | Tồn kho |
|------------|---------|---------|
| **Nháp** | Phiếu mới tạo, chưa bắt đầu đếm | **Chưa đổi** |
| **Đang đếm** | Đã chốt SL hệ thống, đang nhập SL thực tế | **Chưa đổi** |
| **Đã gửi** | Số đếm đã gửi, chờ điều chỉnh | **Chưa đổi** |
| **Hoàn tất** | Đã điều chỉnh tồn theo chênh lệch | **Đã cập nhật** |

---

## Xem & lọc danh sách phiếu

1. Vào **Kho** → **Kiểm kê kho**.
2. (Tuỳ chọn) Chọn **Tất cả kho** hoặc một kho cụ thể (*Kho Hà Nội*, *Kho TP.HCM*, …).
3. (Tuỳ chọn) Lọc theo trạng thái: **Nháp**, **Đang đếm**, **Đã gửi**, **Hoàn tất**.
4. Bảng hiển thị: **Mã phiếu**, **Kho**, **Ngày KK**, số **Dòng**, cột **Lệch**, **Trạng thái**.

Dải KPI phía trên (khi đã có phiếu): **Tổng phiếu**, **Nháp**, **Đang đếm**, **Chờ điều chỉnh**, **Hoàn tất**.

---

## Bước 1 — Tạo phiếu kiểm kê

1. Bấm **Phiếu mới** (góc phải).
2. Trong hộp thoại **Tạo phiếu kiểm kê**:
   - **Kho \*** — chọn kho cần kiểm kê.
   - **Ngày kiểm kê** — ngày thực hiện (mặc định hôm nay).
   - **Sản phẩm cần đếm \*** — mỗi dòng một mã SP (vd. `SP001`, `SP003`) hoặc ID sản phẩm; có thể phân cách bằng dấu phẩy.
   - **Ghi chú** — tuỳ chọn (vd. *Kiểm kê cuối tháng khu A*).
3. Bấm **Tạo phiếu**.

**Kết quả:** Phiếu mới ở trạng thái **Nháp**; hệ thống mở màn **chi tiết** phiếu vừa tạo.

**Ví dụ FTECH:** Kiểm kê *Rau Cải Xanh* và *Dâu Tây* tại *Kho Hà Nội* — nhập `SP001`, `SP003`.

---

## Bước 2 — Bắt đầu đếm

1. Mở **chi tiết** phiếu **Nháp** (bấm mã phiếu hoặc **Chi tiết** trên danh sách).
2. Bấm **Bắt đầu đếm**.
3. Trong hộp **Bắt đầu kiểm kê?** → bấm **Bắt đầu đếm** để xác nhận.

**Kết quả:** Phiếu chuyển **Nháp** → **Đang đếm**. Cột **SL hệ thống** trên từng dòng được **chốt** theo tồn khả dụng tại kho đã chọn — không đổi nếu có nhập/xuất phát sinh sau bước này cho đến khi hoàn tất phiếu.

> **Lưu ý:** Từ danh sách, phiếu **Nháp** có thể bấm **Start** để bắt đầu nhanh (tương đương **Bắt đầu đếm** trên màn chi tiết).

---

## Bước 3 — Nhập SL đếm & gửi số đếm

1. Trên màn chi tiết phiếu **Đang đếm**, nhập **SL đếm** thực tế vào từng dòng.
2. Cột **Chênh lệch** cập nhật ngay: **+** nếu thừa, **−** nếu thiếu, **0** nếu khớp.
3. Dùng **Tab** hoặc **Enter** để chuyển nhanh giữa các ô — không cần chuột.
4. Khi xong, bấm **Gửi số đếm**.
5. Trong hộp **Gửi số lượng đếm?** → bấm **Gửi số đếm**.

**Kết quả:** Phiếu chuyển **Đang đếm** → **Đã gửi**. KPI hiển thị **Khớp**, **Thừa (+)**, **Thiếu (−)**, **Net lệch** tổng hợp.

| Cột trên bảng | Ý nghĩa |
|---------------|---------|
| **SL hệ thống** | Tồn đã chốt khi **Bắt đầu đếm** |
| **SL đếm** | Số bạn đếm được thực tế |
| **Chênh lệch** | SL đếm − SL hệ thống |

---

## Bước 4 — Điều chỉnh tồn

1. Mở phiếu trạng thái **Đã gửi** (danh sách hiển thị **Chờ điều chỉnh** trên KPI).
2. Rà lại các dòng lệch — banner xanh nhắc số dòng cần điều chỉnh.
3. Bấm **Điều chỉnh tồn**.
4. Trong hộp **Điều chỉnh tồn kho?** → bấm **Điều chỉnh tồn** để xác nhận.

**Kết quả:** Phiếu chuyển **Đã gửi** → **Hoàn tất**. Tồn kho tại kho đó được cập nhật theo chênh lệch từng dòng. Phiếu **Hoàn tất** không sửa lại được.

> Nếu mọi dòng **khớp** (chênh lệch = 0), vẫn bấm **Điều chỉnh tồn** để chốt phiếu — tồn không đổi nhưng phiếu được ghi nhận hoàn tất.

---

## Câu hỏi thường gặp

**Kiểm kê khác phiếu nhập/xuất kho thế nào?**  
Phiếu nhập (**GRN**) và xuất (**GIN**) ghi nhận hàng vào/ra theo chứng từ. Kiểm kê **đối chiếu tồn sổ với thực tế** rồi điều chỉnh chênh lệch — xem thêm [Phiếu nhập & xuất kho](/docs/guide-warehouse-grn-gin).

**SL hệ thống lấy từ đâu?**  
Tồn **khả dụng** tại kho đã chọn, **chốt một lần** khi bấm **Bắt đầu đếm**. Nhập/xuất phát sinh sau đó không tự cập nhật lại cột SL hệ thống trên phiếu đang đếm.

**Có thể sửa số đếm sau khi gửi không?**  
**Không.** Sau **Gửi số đếm**, phiếu ở **Đã gửi** — chỉ còn bước **Điều chỉnh tồn** hoặc (nếu chưa chốt) liên hệ quản lý để xử lý ngoài quy trình. Cần đếm lại → tạo **Phiếu mới**.

**Ai được điều chỉnh tồn?**  
Thủ kho / vai trò được cấp quyền kho. Nếu không thấy nút **Điều chỉnh tồn**, kiểm tra quyền tài khoản.

**Kiểm kê có ảnh hưởng cảnh báo tồn min/max không?**  
**Có.** Sau **Hoàn tất**, tồn mới được dùng cho **Cảnh báo tồn kho** và **Quy tắc tái nhập** — xem [Quy tắc tái nhập kho](/docs/guide-warehouse-reorder-rules).

**Mã SP không tìm thấy khi tạo phiếu?**  
Hệ thống báo *Không tìm thấy SP* — kiểm tra mã (vd. `SP001`) đúng trên master sản phẩm hoặc dùng ID sản phẩm.

---

→ [Quy tắc tái nhập kho](/docs/guide-warehouse-reorder-rules) · [Cảnh báo tồn kho](/warehouse/stock-alerts) · [Phiếu nhập & xuất kho](/docs/guide-warehouse-grn-gin) · [Kiểm kê kho (màn hình)](/warehouse/stock-takes)
