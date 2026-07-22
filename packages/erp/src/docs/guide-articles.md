# Hướng dẫn Bài viết (CMS)

Trang: `/admin/article-management` — soạn tin nội bộ, gửi duyệt và xuất bản.

## Tạo bài mới (mã tự sinh)

1. Mở **Quản lý Bài viết** → bấm **Thêm mới**.
2. Nhập **tiêu đề** và **nội dung** (bắt buộc). Có thể thêm tóm tắt, ảnh đại diện, đơn vị, người duyệt.
3. Bấm **Lưu nháp**. Hệ thống tự cấp **mã bài** (dạng `QTBV-ngày-số`, ví dụ `QTBV-20260721-001`). Bạn không cần — và không thể — nhập mã tay.
4. Sau khi lưu, mã hiện ở thanh trên và sidebar (chỉ xem / sao chép).

## Gửi duyệt → duyệt → xuất bản

| Bước | Ai làm | Nút trên màn |
|------|--------|--------------|
| Gửi duyệt | Người viết (nháp / bị từ chối) | **Gửi duyệt** — nhớ lưu nháp trước |
| Duyệt / Từ chối | Quản lý được chọn làm người duyệt | **Duyệt** hoặc **Từ chối** khi bài **Chờ duyệt** |
| Xuất bản | Cùng quản lý đó | **Xuất bản** khi bài **Đã duyệt** |

Nếu bạn không thấy nút nào đó, thường là chưa có quyền hoặc bài chưa đúng trạng thái.

## Hai tài khoản demo để thử

Mật khẩu mặc định: `123456`

| Tài khoản | Vai trò | Việc nên thử |
|-----------|---------|----------------|
| `bichvn` | Nhân viên (Content) | Tạo nháp, gửi duyệt — **không** thấy Duyệt / Xuất bản |
| `anhhd` | Quản lý | Nhận bài chờ duyệt (khi được chọn người duyệt), Duyệt rồi Xuất bản |

## Lưu ý thường gặp

- Thiếu tiêu đề hoặc nội dung → không lưu được; form báo lỗi ngay trên màn.
- Mã bài không sửa được sau khi tạo.
- Chi tiết hướng dẫn in-app: nút **Hướng dẫn** trên danh sách / màn soạn.
