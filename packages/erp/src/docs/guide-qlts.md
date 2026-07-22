# Hướng dẫn Quản lý tài sản (QLTS)

Trang: `/admin/qlts` — kiểm kê, cấp phát và theo dõi trạng thái tài sản doanh nghiệp.

## Luồng cấp phát (happy path)

1. **Tạo tài sản** — nút **Thêm tài sản** trên PageHeader. Loại lấy từ danh mục `LoaiTaiSan`.
2. **Cấp phát** — asset **Sẵn sàng** → Cấp phát → chọn **Person** + lý do → gửi yêu cầu (ticket `PENDING`).
3. **Duyệt workflow** — tab **Yêu cầu cấp phát**. Các bước / người duyệt lấy từ Workflow Definition module **ASSET** (thường `ASSET_TRANSFER_DEFAULT`).
4. **Bàn giao** — sau khi đủ bước duyệt, xác nhận bàn giao → asset **IN_USE**.

## Ai duyệt?

Không hardcode Admin/HR trên màn QLTS. Cấu hình tại:

- `/qtht/workflows` → lọc module **ASSET**
- Code thường gặp: `ASSET_TRANSFER_DEFAULT` (entity type instance: `ASSET_TRANSFER`)

Stepper trên ticket đọc `wf/instances/by-entity/ASSET_TRANSFER/{requestId}` khi ticket đã gắn engine.

## Hai tab trên trang

| Tab | Việc làm |
|--|--|
| **Tài sản** | Grid/Bảng, KPI, tạo/sửa, mở cấp phát |
| **Yêu cầu cấp phát** | Filter status, duyệt / từ chối / bàn giao, theo dõi stepper |

## Khấu hao định kỳ

Sau khi tài sản có giá mua, mở drawer tài sản → tab **Khấu hao** → **Sinh lịch**.

Ghi sổ theo tháng tại **Khấu hao định kỳ** (`/assets/depreciation`): chọn kỳ → **Xem trước** → **Ghi sổ**.

Chi tiết luồng: [Khấu hao tài sản](/docs/guide-depreciation).

## Screenshot text (layout)

```
[PageHeader] Quản lý tài sản     [Hướng dẫn] [Làm mới] [Thêm tài sản]
[Tabs] Tài sản | Yêu cầu cấp phát (badge PENDING)
[KPI] Tổng · Đang dùng · Sẵn sàng · Bảo trì · BH · Giá trị
[Toolbar] Search · loại · status chips · Grid/Bảng
[Content] cards / table  hoặc  list ticket + WorkflowStepper
```

## Next steps / ngoài scope FE

- Thu hồi qua WF RETURN (đổi `/unassign`) — chờ Product.
- Permission seed mới — SA/BE; FE chỉ `usePermission` với key đã có trong codebase.
