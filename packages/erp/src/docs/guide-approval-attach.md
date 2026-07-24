# Gắn luồng duyệt vào nghỉ phép

Hướng dẫn Admin: tạo / sửa draft bước duyệt, **kích hoạt** để đơn nghỉ mới đi đúng quy trình, và kiểm tra đã gắn đúng chỗ.

**Lưu ý:** Chỉ tài khoản Admin (hoặc vai trò được cấp quyền cấu hình) mới thấy menu này.

## Chỗ đứng — đừng nhầm màn hình

| Việc bạn muốn | Vào đâu | Nút / trang |
|---------------|---------|-------------|
| Gắn / sửa luồng thật cho nghỉ phép | Menu **Phê duyệt** → **Cấu hình luồng duyệt** | Trang danh sách thẻ luồng |
| Duyệt đơn đang chờ | **Phê duyệt** → **Hộp thư duyệt** | Tab **Chờ duyệt** |
| Vẽ template thiết kế (không tự gắn Leave) | **Quản trị hệ thống** → **Thiết kế quy trình** | Chỉ tham khảo / copy mẫu |

Trang **Thiết kế quy trình** không thay thế **Cấu hình luồng duyệt**. Đơn nghỉ chỉ chạy theo luồng đã **Đang kích hoạt** ở **Cấu hình luồng duyệt**.

## Cách gắn vào Nghỉ phép (từng bước)

1. Vào menu **Phê duyệt** → **Cấu hình luồng duyệt**.
2. Tìm thẻ luồng loại **Nghỉ phép** (thường có sẵn *Nghỉ phép chuẩn*), hoặc bấm **Tạo luồng mới** góc phải.
3. Điền **Tên luồng** dễ hiểu (ví dụ: *Nghỉ phép — QL rồi HR*).
4. Ở **Loại đối tượng**, chọn **Nghỉ phép**.
5. Ở **Các bước duyệt**:
   - Bấm **Thêm bước** nếu cần thêm cấp.
   - Mỗi bước chọn vai trò duyệt (ví dụ **Quản lý trực tiếp**, **HR**).
   - Dùng ▲ / ▼ để đổi thứ tự (bước 1 duyệt trước).
6. Tick **Đang kích hoạt (áp vào đơn mới cùng loại; tắt các luồng khác cùng loại)**.
7. Bấm **Tạo mới** (lần đầu) hoặc **Cập nhật** (khi sửa).

**Kết quả trên danh sách:** thẻ luồng vừa lưu có badge **Áp dụng: Nghỉ phép**. Các luồng Nghỉ phép khác (nếu có) hiện **Chưa gắn — không tự chạy**.

## Làm sao biết đã gắn loại phiếu nào?

Trên mỗi thẻ luồng tại **Cấu hình luồng duyệt**:

- Badge xanh **Đang kích hoạt** + **Áp dụng: Nghỉ phép** (hoặc **Yêu cầu mua**, **Bảng lương**…) = đơn mới loại đó sẽ theo draft này.
- Badge **Chưa gắn — không tự chạy** = luồng tắt hoặc không phải bản đang dùng cho loại đó — tạo đơn sẽ không đi theo draft này.

Dòng **Loại đối tượng** ngay dưới tên thẻ cũng nhắc loại phiếu (Nghỉ phép / …).

## Sau khi gắn — kiểm chứng nhanh

1. Đăng nhập tài khoản nhân viên (hoặc nhờ NV).
2. Vào **Nhân sự** → **Nghỉ phép** → bấm **Tạo đơn**.
3. Điền loại nghỉ, ngày, lý do → bấm **Gửi**.
4. Đăng nhập người duyệt bước 1 → mở **Phê duyệt** → **Hộp thư duyệt** → tab **Chờ duyệt**.
5. Mở đơn: số bước và vai trò chờ duyệt phải khớp draft vừa cấu hình.

Nếu gửi đơn báo không có người duyệt: vào **Quản trị hệ thống** → gán User đúng Role cho từng bước, rồi gửi lại.

## Lỗi thường gặp

| Bạn thấy | Cách xử lý |
|----------|------------|
| Sửa ở **Thiết kế quy trình** nhưng đơn nghỉ vẫn duyệt như cũ | Đúng kỳ vọng — hãy sửa và **Đang kích hoạt** tại **Cấu hình luồng duyệt** |
| Hai thẻ cùng Nghỉ phép, không biết cái nào chạy | Chỉ thẻ có **Áp dụng: Nghỉ phép** là đang chạy |
| Gửi đơn bị lỗi “không có người duyệt” | Gán User + Role (Quản lý / HR…) trước; không bỏ qua |
| Hộp thư trống | Kiểm tra bạn có phải bước hiện tại không; hoặc đơn chưa tạo thành công |

## Liên quan

- Tổng quan chỗ đứng: [Quy trình duyệt](/docs/guide-workflows)
- Duyệt hàng ngày: [Hộp thư duyệt](/docs/guide-approval-inbox)
- Tạo đơn nghỉ: [Xin nghỉ phép](/docs/guide-leave)
