# Khấu hao tài sản

Trang **Khấu hao định kỳ**: `/assets/depreciation`.

Dùng khi cần ghi sổ chi phí khấu hao theo tháng — xem trước tổng tiền, xác nhận, rồi ghi vào sổ kế toán.

## Hai chỗ liên quan

| Chỗ | Việc làm |
|--|--|
| **Danh sách tài sản** (`/admin/qlts`) | Mở từng tài sản → tab **Khấu hao** → **Sinh lịch** (đường thẳng) |
| **Khấu hao định kỳ** (`/assets/depreciation`) | Chọn tháng → **Xem trước** → **Ghi sổ** → xem lịch sử |

## Luồng chuẩn

1. **Sinh lịch trên tài sản** — tài sản cần có giá mua. Bấm **Sinh lịch**, chọn số tháng. Mỗi tài sản chỉ có một lịch; sinh lần hai sẽ báo đã có lịch.
2. **Mở Khấu hao định kỳ** — vào `/assets/depreciation` (hoặc menu **Khấu hao TSCĐ**).
3. **Chọn tháng cần ghi sổ** — nhập năm và tháng.
4. **Xem trước** — xem tổng tiền và số lịch sẽ ghi. Nếu kỳ đã ghi sổ, trạng thái hiện **Đã ghi sổ**.
5. **Ghi sổ** — bấm **Ghi sổ**, đọc hộp xác nhận (kỳ + tổng tiền), rồi xác nhận. Hệ thống tạo chứng từ kế toán.
6. **Lịch sử** — bảng dưới trang liệt kê các lần ghi; bấm mã chứng từ (JE) để mở sổ nhật ký nếu cần.

## Chạy lại cùng kỳ

Chạy lại cùng tháng **không ghi đôi**. Hệ thống báo kỳ này đã ghi sổ và giữ chứng từ cũ.

## Quyền & lỗi thường gặp

- Không thấy nút **Ghi sổ** → bạn chưa có quyền ghi sổ khấu hao.
- Không thấy nút **Sinh lịch** trên tài sản → chưa có quyền tạo lịch.
- Không mở được trang / không thấy dữ liệu → chưa có quyền xem.
- **Kỳ kế toán đã đóng** → không ghi sổ được; chọn tháng khác hoặc nhờ kế toán mở lại kỳ.
- **Không có lịch đang hiệu lực** → sinh lịch trên tài sản trước, rồi xem trước lại.

## Liên quan

- [Quản lý tài sản (cấp phát)](/docs/guide-qlts)
- Sổ nhật ký: `/accounting/journals`
