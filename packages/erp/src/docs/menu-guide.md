# Hướng dẫn menu & sidebar

Sidebar Frezo lấy **cây menu từ BE** (parent/children). Nếu BE chưa seed parent, FE nhóm tạm theo prefix path.

## Nhóm theo path

| Prefix | Nhóm |
|--------|------|
| `/qlns/*` | Nhân sự |
| `/accounting/*` | Kế toán |
| `/warehouse/*` | Kho vận |
| `/crm/*` | CRM |
| `/approval/*` | Phê duyệt |
| `/task/*`, `/tasks/*` | Công việc |
| `/qtht/*` | Quản trị hệ thống |
| `/customer*`, `/customers*` | Khách hàng |
| `/assets/*` | Tài sản |
| `/assets/depreciation` | Khấu hao định kỳ (xem [Khấu hao tài sản](/docs/guide-depreciation)) |
| `/fb/*` | FB / Marketing |
| `/docs/*` | Tài liệu |
| `/admin/article-management*` | Bài viết (CMS) — xem `/docs/guide-articles` |

## Cách dùng sidebar

- Click **nhóm cha** → thu/mở danh sách con.
- Khi đang ở trang con, **parent được highlight** và tự mở.
- Sidebar thu gọn (chevron): chỉ hiện icon; hover để xem tên.

## Tài liệu in-app

Vào **Tài liệu** (`/docs`) từ Quick Actions trên Dashboard hoặc nút dưới sidebar.
