# Cấu hình chấm công GPS / WiFi (Admin)

Trang **QTHT → Cài đặt → Định vị chấm công** chỉ dành cho **Admin**. Nhân viên Mobile check-in theo rule đã lưu — cấu hình sai sẽ bị từ chối điểm danh.

## Ai được cấu hình

| Vai trò | Được làm |
|---------|----------|
| Admin / QTHT settings | Sửa toạ độ văn phòng, bán kính, SSID/BSSID |
| HR / Manager thường | Chỉ xem báo cáo chấm công — **không** sửa geo |
| Nhân viên Mobile | Check-in trong bán kính **hoặc** khớp WiFi |

## Các bước Admin

1. Mở **Quản trị hệ thống → Cài đặt** → tab / section **Định vị**.
2. Nhập **vĩ độ / kinh độ** văn phòng (tâm geofence).
3. Đặt **bán kính (m)** — khuyến nghị 100–500m tuỳ diện tích.
4. (Tuỳ chọn) Thêm **WiFi SSID** công ty, cách nhau dấu phẩy; BSSID nếu cần chống giả mạo.
5. Xem **Preview rule check-in** ngay dưới form — xác nhận r/SSID trước khi Lưu.
6. Lưu → nhờ 1 máy Mobile test check-in trong/ngoài bán kính.

## Checklist trước khi Lưu

- [ ] Toạ độ đúng văn phòng (không để 0,0)
- [ ] Bán kính không quá hẹp (tránh từ chối ngoài cửa) cũng không quá rộng
- [ ] Nếu bắt buộc WiFi: SSID khớp đúng tên mạng công ty trên điện thoại
- [ ] Đã test Mobile 1 lần trong và ngoài bán kính

## Khi Mobile bị từ chối

1. Admin mở lại Preview — kiểm tra bán kính / SSID.
2. Nhân viên bật GPS (và WiFi nếu rule yêu cầu).
3. Không nhờ nhân viên «đoán» — chỉnh config Admin trước.
