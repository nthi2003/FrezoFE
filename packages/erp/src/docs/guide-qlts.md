# Quản lý tài sản

Để thêm tài sản vào sổ, cấp phát cho nhân viên và theo dõi trạng thái — làm theo các bước dưới đây.

## Hai tab trên trang

| Tab | Việc làm |
|-----|----------|
| **Tài sản** | Xem danh sách, thêm / sửa, bấm **Cấp phát** |
| **Yêu cầu cấp phát** | Duyệt, từ chối, xác nhận **Bàn giao** |

## Cấp phát tài sản (việc chính)

> Chi tiết từng bước gửi / duyệt: [Yêu cầu cấp phát tài sản](/docs/guide-asset-assign).

1. Vào menu **Tài sản** → **Quản lý tài sản**.
2. Bấm **Thêm tài sản** — điền mã, tên, loại, giá trị (và bảo hành nếu có) → lưu.
3. Ở tab **Tài sản** (không phải tab **Yêu cầu cấp phát**): chỉ tài sản **Sẵn sàng** mới cấp phát được → bấm **Cấp phát**.
4. Chọn **nhân viên nhận**, ngày dự kiến và lý do → gửi yêu cầu.
5. Mở tab **Yêu cầu cấp phát** (hoặc **Hộp thư duyệt**) — người được phân duyệt bấm **Duyệt** (hoặc **Từ chối**) từng bước.
6. Khi đủ bước duyệt, bấm xác nhận **Bàn giao**.

**Kết quả:** Tài sản chuyển sang **Đang dùng** và gắn người đang giữ.

## Ai được duyệt cấp phát?

Không cố định một chức danh trên màn này.

**Lưu ý:** Chỉ tài khoản Admin (hoặc vai trò được cấp quyền cấu hình) mới sửa được bước duyệt tại **Quản trị hệ thống** → **Thiết kế quy trình** (lọc phần liên quan **Tài sản**).

## Sinh lịch khấu hao trên từng tài sản

1. Mở tài sản đã có **giá mua**.
2. Vào tab **Khấu hao**.
3. Bấm **Sinh lịch** → chọn số tháng.

Sau đó ghi sổ theo tháng tại **Khấu hao TSCĐ** — xem [Khấu hao tài sản](/docs/guide-depreciation).

## Lỗi thường gặp

| Bạn thấy trên màn | Cách xử lý |
|-------------------|------------|
| Không bấm được **Cấp phát** | Tài sản chưa **Sẵn sàng**, hoặc đang có yêu cầu cấp phát chưa xong |
| Yêu cầu ở **Chờ duyệt** lâu | Nhắc đúng người duyệt bước hiện tại (xem thanh bước trên phiếu) |
| Không thấy nút **Bàn giao** | Chưa đủ bước duyệt — hoàn tất duyệt trước |
| Không thấy nút **Thêm tài sản** | Chưa có quyền — nhờ Admin cấp quyền |

## Câu hỏi thường gặp

**Thu hồi tài sản về kho?**  
Luồng thu hồi chuẩn đang được Product chốt. Tạm thời hỏi quản lý kho / Admin cách xử lý nội bộ công ty.
