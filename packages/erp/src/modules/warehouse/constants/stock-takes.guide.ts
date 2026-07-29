import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Kiểm kê kho (giọng EU, khớp luồng DRAFT → POSTED)
 */
export const STOCK_TAKES_GUIDE: PageGuideConfig = {
  title: 'Kiểm kê kho',
  subtitle:
    'Đối chiếu tồn hệ thống với số đếm thực tế — điều chỉnh chênh lệch sau khi duyệt.',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình 4 bước',
      steps: [
        {
          title: 'Tạo phiếu',
          description:
            'Bấm Phiếu mới → chọn kho, ngày kiểm kê, thêm mã SP (vd. SP001) → Tạo phiếu.',
        },
        {
          title: 'Bắt đầu đếm',
          description:
            'Mở chi tiết phiếu DRAFT → Bắt đầu đếm. Hệ thống chốt SL tồn tại thời điểm start.',
        },
        {
          title: 'Gửi số đếm',
          description:
            'Nhập SL thực tế từng dòng → Gửi số đếm. Chênh lệch (+/−) hiển thị ngay trên bảng.',
        },
        {
          title: 'Điều chỉnh tồn',
          description:
            'Phiếu SUBMITTED → bấm Điều chỉnh tồn để ghi nhận variance (POSTED).',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo thao tác',
      tips: [
        'Lọc theo kho / trạng thái trên danh sách để tìm phiếu nhanh.',
        'Tab giữa các ô SL đếm trên màn chi tiết — không cần chuột.',
        'SL hệ thống lấy từ tồn khả dụng tại kho đã chọn.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Quy tắc tái nhập', href: '/warehouse/reorder-rules' },
        { label: 'Cảnh báo tồn kho', href: '/warehouse/stock-alerts' },
        { label: 'Phiếu nhập kho', href: '/warehouse/grn' },
      ],
    },
  ],
}
