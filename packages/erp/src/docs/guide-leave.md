# Xin nghỉ phép

Để bạn tạo đơn nghỉ, theo dõi trạng thái duyệt, và biết khi nào được nghỉ chính thức.

## Làm việc chính

1. Vào menu **Nhân sự** → **Nghỉ phép** (web), hoặc tab **Nghỉ phép** trên app Mobile.
2. Bấm **Tạo đơn** / **Thêm mới**.
3. Chọn **loại nghỉ**, **ngày bắt đầu**, **ngày kết thúc**, điền lý do ngắn.
4. Bấm **Gửi** (hoặc **Lưu rồi gửi** nếu form có hai bước).
5. Theo dõi trạng thái trên danh sách: **Chờ duyệt** → **Đã duyệt** / **Từ chối**.
6. Nếu bị từ chối: đọc lý do → sửa ngày hoặc tạo đơn mới.
7. Khi **Đã duyệt**: lịch nghỉ được ghi nhận; không cần gửi lại.

**Kết quả:** Đơn xuất hiện trong danh sách của bạn; người duyệt thấy đơn ở **Hộp thư duyệt**.

## Ai duyệt đơn của bạn?

Chuỗi duyệt (một cấp hay nhiều cấp) do Admin cấu hình tại **Phê duyệt** → **Cấu hình luồng duyệt** (luồng **Nghỉ phép** đang kích hoạt). Bạn không cần mở trang thiết kế quy trình chỉ để xin nghỉ.

Admin xem cách gắn: [Gắn luồng duyệt vào nghỉ phép](/docs/guide-approval-attach).

## Lỗi thường gặp

- **Không thấy nút tạo đơn:** Thiếu quyền hoặc tài khoản chưa gắn hồ sơ nhân viên — liên hệ HR.
- **Gửi được nhưng không ai duyệt:** Nhắc quản lý mở **Hộp thư duyệt**, hoặc nhờ Admin kiểm tra luồng **Nghỉ phép** đang áp dụng.
- **Báo không có người duyệt khi gửi:** Admin cần gán User đúng vai trò bước duyệt — xem [Gắn luồng duyệt](/docs/guide-approval-attach).
- **Trùng ngày / vượt ngày phép:** Đổi khoảng ngày hoặc hỏi HR số ngày còn lại.
