# Quy trình duyệt — chọn đúng chỗ

Bạn cần **duyệt đơn hôm nay** hay **gắn ai duyệt loại đơn nào**? Hai việc nằm ở hai chỗ khác nhau — đừng nhầm.

## Chọn đúng màn hình

| Bạn muốn… | Vào đâu |
|-----------|---------|
| Duyệt / từ chối đơn đang chờ | Menu **Phê duyệt** → **Hộp thư duyệt** |
| Gắn luồng duyệt vào Nghỉ phép / Mua hàng / Lương | **Phê duyệt** → **Cấu hình luồng duyệt** |
| Vẽ / copy template thiết kế (Admin) | **Quản trị hệ thống** → **Thiết kế quy trình** |

**Lưu ý:** Chỉ tài khoản Admin (hoặc vai trò được cấp quyền cấu hình) mới thấy **Cấu hình luồng duyệt** và **Thiết kế quy trình**.

**Quan trọng:** Đơn nghỉ phép / yêu cầu mua / khoá kỳ lương chạy theo luồng **Đang kích hoạt** ở **Cấu hình luồng duyệt**. Trang **Thiết kế quy trình** là thư viện mẫu — **không** tự gắn vào đơn nghỉ.

## Duyệt đơn hàng ngày (mọi người)

1. Vào menu **Phê duyệt** → **Hộp thư duyệt**.
2. Mở tab **Chờ duyệt**.
3. Bấm vào đơn cần xử lý.
4. Bấm **Duyệt** (có thể thêm ghi chú) hoặc **Từ chối** (nhập lý do rõ ràng).

**Kết quả:** Đơn biến khỏi danh sách chờ của bạn; người gửi thấy trạng thái mới.

## Gắn luồng vào Nghỉ phép (Admin)

Chi tiết từng nút: [Gắn luồng duyệt vào nghỉ phép](/docs/guide-approval-attach).

Tóm tắt:

1. Vào **Phê duyệt** → **Cấu hình luồng duyệt**.
2. Mở hoặc **Tạo luồng mới** với **Loại đối tượng** = **Nghỉ phép**.
3. Thêm bước, chọn vai trò duyệt, tick **Đang kích hoạt**, bấm **Cập nhật** / **Tạo mới**.
4. Trên thẻ luồng: badge **Áp dụng: Nghỉ phép** = đơn nghỉ mới sẽ theo draft này.
5. Kiểm chứng: tạo đơn nghỉ → mở **Hộp thư duyệt** → đúng số bước đã cấu hình.

## Thiết kế quy trình (Admin — template)

Khi chỉ muốn vẽ / copy mẫu bước duyệt (không phải chỗ gắn Leave):

1. Vào **Quản trị hệ thống** → **Thiết kế quy trình**.
2. Ưu tiên **Copy** một mẫu gần giống → đổi tên → chỉnh bước.
3. Bật trạng thái đang dùng trên template nếu cần lưu nháp thiết kế.
4. Muốn đơn nghỉ thật đi theo bước mới → quay lại **Cấu hình luồng duyệt** và kích hoạt luồng **Nghỉ phép** tương ứng.

## Checklist trước khi kích hoạt Leave

- [ ] Đúng **Loại đối tượng** = Nghỉ phép
- [ ] Có ít nhất 1 bước; thứ tự đúng thực tế công ty
- [ ] Mỗi bước đã chọn vai trò có User thật (Quản lý / HR…)
- [ ] Thẻ hiện badge **Áp dụng: Nghỉ phép**
- [ ] Đã thử tạo 1 đơn nghỉ và thấy đúng ở Hộp thư duyệt

## Lỗi thường gặp

| Bạn thấy trên màn | Cách xử lý |
|-------------------|------------|
| Hộp thư trống nhưng biết có đơn | Kiểm tra bạn có phải bước hiện tại; nhờ Admin xem luồng Leave đang áp dụng |
| Không thấy nút **Duyệt** | Đơn không chờ bạn, hoặc bạn không phải người duyệt bước này |
| Sửa Designer nhưng Leave không đổi | Sửa và kích hoạt tại **Cấu hình luồng duyệt** |
| Báo không có người duyệt khi gửi đơn | Gán User + Role cho bước; xem [Gắn luồng duyệt](/docs/guide-approval-attach) |

## Liên quan

- [Gắn luồng duyệt vào nghỉ phép](/docs/guide-approval-attach)
- [Hộp thư duyệt](/docs/guide-approval-inbox)
- [Xin nghỉ phép](/docs/guide-leave)
- [Bắt đầu](/docs/getting-started)
