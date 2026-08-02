# Kho rau củ — quy trình SME



Hướng dẫn ngắn cho **SME phân phối rau củ tươi**: nhập theo lô, xuất FEFO, ghi hao hụt riêng.



**Màn hình:** [Tổng quan kho](/warehouse) · [Phiếu nhập](/warehouse/grn) · [Phiếu xuất](/warehouse/gin) · [Kiểm kê](/warehouse/stock-takes) · [Cảnh báo tồn](/warehouse/stock-alerts)



---



## Đặc thù rau củ



| Yếu tố | Cách Frezo hỗ trợ |

|--------|-------------------|

| Hàng tươi, hạn ngắn | Quản lý **mã lô** + **hạn tươi dự kiến** khi nhập |

| Rau lá 3–5 ngày, củ quả 7–14 ngày | Hệ thống gợi ý HSD; xuất **FEFO** (lô hết hạn trước xuất trước) |

| Hao hụt cao | Ghi **hao hụt riêng** (co hụt / hỏng / quá hạn) — không trộn vào xuất bán |

| Nhiều NCC, nhiều kho | Lô gắn NCC; chọn kho HN / HCM / ĐL trên phiếu |

| Bảo quản khác nhau | Gán **vị trí kho**: Lạnh ẩm / Mát / Khô thoáng |



---



## Nhập kho — 6 bước



1. **Cảnh báo tồn** → **Yêu cầu mua hàng** (PR) → duyệt → **Đơn mua hàng** (PO).

2. Hàng về → **Phiếu nhập kho** từ đơn mua.

3. **Kiểm hàng tại cửa:** chất lượng, % dập, nhiệt độ xe.

4. **Tạo mã lô** cho từng dòng: NCC + ngày nhập + hạn tươi dự kiến.

5. **Chọn vị trí kho** (bắt buộc) — rau lá thường ở khu Lạnh ẩm.

6. Nhập **số HĐ NCC** (nếu gắn đơn mua/NCC) → **Xác nhận nhập** → tồn tăng **theo lô**.



> Chỉ khi bấm **Xác nhận nhập** thì tồn mới đổi — giống [Phiếu nhập & xuất kho](/docs/guide-warehouse-grn-gin).



---



## Xuất kho — FEFO



1. Tạo **Phiếu xuất (GIN)**: xuất bán / chuyển kho / nội bộ.

2. Thêm sản phẩm + số lượng → hệ thống **gợi ý lô** (hạn gần nhất trước).

3. Bấm **Áp dụng gợi ý FEFO** hoặc chọn lô thủ công.

4. **Xác nhận xuất** → trừ tồn **theo lô**.



**Lô cận hạn** được ưu tiên xuất trước — giúp giảm hàng hủy.



---



## Hao hụt — ghi riêng



Khi phát hiện héo, dập, quá hạn — **không** xuất qua phiếu bán:



| Loại | Khi nào |

|------|---------|

| **Co hụt** | Cân lại thiếu, mất nước tự nhiên |

| **Hỏng / dập** | Vận chuyển, bốc xếp |

| **Quá hạn** | Không bán kịp sau cận hạn |



Chọn lô + số lượng + lý do → tồn lô giảm; Kế toán xem báo cáo hao hụt theo NCC.



---



## Kiểm kê & cảnh báo



| Việc | Tần suất gợi ý |

|------|----------------|

| Kiểm kê rau lá | Hàng ngày |

| Kiểm kê củ quả | 2–3 ngày/lần |

| Cảnh báo **dưới min** | Tự động → tạo PR |

| Cảnh báo **cận hạn** | Đẩy bán, giảm giá, hoặc ghi hao hụt |



Chi tiết kiểm kê: [Kiểm kê kho](/docs/guide-warehouse-stock-takes) · Tái nhập: [Quy tắc tái nhập kho](/docs/guide-warehouse-reorder-rules).



---



## Frezo hiện có / sắp có



| Tính năng | Trạng thái |

|-----------|------------|

| PR → PO → GRN → GIN | ✅ Có |

| Cảnh báo min → PR | ✅ Có |

| Kiểm kê 4 bước | ✅ Có |

| Tạo lô + FEFO + hao hụt + zone | 🔜 Đang bổ sung (SME rau củ) |



---



→ [Phiếu nhập & xuất kho](/docs/guide-warehouse-grn-gin) · [Kiểm kê kho](/docs/guide-warehouse-stock-takes) · [Quy tắc tái nhập](/docs/guide-warehouse-reorder-rules) · [Cảnh báo tồn](/warehouse/stock-alerts)
