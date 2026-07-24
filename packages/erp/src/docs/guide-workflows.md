# Hướng dẫn quy trình duyệt (Workflow)

Trang **Thiết kế quy trình** (menu Quản trị hệ thống) dùng để cấu hình **bước duyệt**.  
User hàng ngày duyệt đơn ở **Hộp thư duyệt**, không phải trang thiết kế.

## Hai lớp duyệt — chọn đúng chỗ

| Lớp | Mục đích | Ai dùng |
|-----|----------|---------|
| **Hộp thư duyệt + Luồng duyệt** | Duyệt đơn thật; gắn luồng theo loại đơn | User duyệt + Admin cấu hình |
| **Thiết kế quy trình** | Vẽ / cấu hình bước duyệt theo module | Admin / HR |

**Lưu ý:** Đừng tạo quy trình duyệt thứ hai cho cùng loại nghiệp vụ nếu module đã gắn luồng duyệt. Hỏi BA trước khi nhân đôi luồng.

## Cách tạo flow an toàn

1. Đọc PageGuide trên trang (nút **Hướng dẫn**) hoặc checklist dưới đây.
2. Ưu tiên **Copy** quy trình gần giống → đổi mã + tên + chỉnh bước.
3. Mã `CODE`: chỉ `A-Z`, `0-9`, `_` — ví dụ `LEAVE_MANAGER_THEN_HR`.
4. Mỗi bước có tên rõ + người duyệt hợp lệ (ROLE/USER phải chọn giá trị).
5. Bật **Active** chỉ khi đã review xong.
6. Test bằng 1 đơn thật trên staging trước production.

## Checklist trước khi Lưu

- [ ] Mã không trùng quy trình khác cùng module
- [ ] Ít nhất 1 bước; thứ tự đúng nghiệp vụ
- [ ] USER/ROLE đã chọn người/role tồn tại
- [ ] Không nhầm với Luồng duyệt nếu module đã dùng Hộp thư duyệt
- [ ] Đã đọc cảnh báo “cấu hình sai ảnh hưởng duyệt đơn thật”

## Screenshot text (layout)

```
[PageHeader] Thiết kế quy trình     [Hướng dẫn] [Làm mới] [Thêm quy trình]
[Toolbar] Tìm kiếm · filter module
[Cards] nhóm theo module · Sửa / Copy / Xoá
[Drawer] metadata + steps + Lưu
```

## Next steps

- Xem [Bắt đầu](/docs/getting-started) nếu mới vào Frezo.
- Duyệt đơn: mở **Hộp thư duyệt** trên menu.
- Gắn luồng theo loại đơn: **Cấu hình luồng duyệt**.
