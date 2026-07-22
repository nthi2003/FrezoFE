# Hướng dẫn quy trình duyệt (Workflow)



Trang Admin: `/qtht/workflows` — cấu hình **template** bước duyệt (designer visual).  

User hàng ngày duyệt đơn ở **Approval Inbox** (`/approval/inbox`), không phải trang này.



## Hai lớp duyệt — chọn đúng chỗ



| Lớp | FE route | API chính | Actor | Mục đích |

|-----|----------|-----------|-------|----------|

| **Approval Inbox / Engine** | `/approval/inbox`, `/approval/flows` | `/approvals`, `/approvals/my`, `/approvals/{id}/approve\|reject`, `/approval-flows` | User duyệt + admin config flow theo subject | Duyệt đơn nghiệp vụ (leave, PR, payroll…) |

| **Visual Workflow designer** | `/qtht/workflows`, `/qtht/workflows/:id/designer` | API workflow definition/graph (module workflow) | Admin/HR thiết kế template bước | Template visual — **không** thay Inbox |



**Cảnh báo:** Đừng tạo “engine duyệt” thứ hai cho cùng loại nghiệp vụ nếu module đã gắn `/approval/flows`. Hỏi BA/tech lead trước khi nhân đôi luồng.



## Cách tạo flow an toàn



1. Đọc PageGuide trên trang (nút **Hướng dẫn**) hoặc checklist dưới đây.

2. Ưu tiên **Copy** quy trình gần giống → đổi mã + tên + chỉnh steps.

3. Mã `CODE`: chỉ `A-Z`, `0-9`, `_` — ví dụ `LEAVE_MANAGER_THEN_HR`.

4. Mỗi bước có tên rõ + approver hợp lệ (ROLE/USER phải chọn value).

5. Bật **Active** chỉ khi đã review xong.

6. Test bằng 1 đơn thật trên staging trước production.



## Checklist trước khi Lưu



- [ ] Mã không trùng quy trình khác cùng module

- [ ] Ít nhất 1 bước; thứ tự mũi tên đúng nghiệp vụ

- [ ] USER/ROLE đã chọn người/role tồn tại

- [ ] Không nhầm với Approval Flows nếu module đã dùng Inbox

- [ ] Đã đọc cảnh báo “cấu hình sai ảnh hưởng duyệt đơn thật”



## Screenshot text (layout trang)



```

[PageHeader] Quy trình duyệt     [Hướng dẫn] [Làm mới] [Thêm quy trình]

[Banner] Duyệt hàng ngày ở /approval/inbox — trang này chỉ template

[Toolbar] Tìm kiếm · filter module

[Cards] nhóm theo module · Sửa / Copy / Xoá

[Drawer] metadata + steps + Lưu

```



## Next steps



- Xem [Bắt đầu](/docs/getting-started) nếu mới vào Frezo.

- Duyệt đơn: `/approval/inbox`.

- Cấu hình flow Approval: `/approval/flows`.


