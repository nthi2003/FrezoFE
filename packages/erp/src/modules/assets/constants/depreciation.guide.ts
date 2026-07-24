import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Khấu hao định kỳ (giọng EU, khớp /docs/guide-depreciation)
 */
export const DEPRECIATION_GUIDE: PageGuideConfig = {
  title: 'Khấu hao định kỳ',
  subtitle:
    'Chọn tháng, xem trước tổng tiền, xác nhận rồi ghi sổ. Chạy lại cùng tháng không ghi đôi.',
  docHref: '/docs/guide-depreciation',
  sections: [
    {
      type: 'steps',
      heading: 'Ghi sổ tháng này',
      steps: [
        {
          title: 'Sinh lịch trên tài sản',
          description:
            'Vào Quản lý tài sản → mở tài sản có giá mua → tab Khấu hao → Sinh lịch. Cần có lịch trước khi ghi sổ tháng.',
        },
        {
          title: 'Xem trước',
          description:
            'Chọn năm và tháng → bấm Xem trước để kiểm tra tổng tiền và số lịch sẽ ghi.',
        },
        {
          title: 'Ghi sổ',
          description:
            'Bấm Ghi sổ → đọc hộp xác nhận → xác nhận. Hệ thống tạo chứng từ kế toán.',
        },
        {
          title: 'Xem lịch sử',
          description:
            'Bảng dưới trang liệt kê các lần đã ghi; bấm mã chứng từ nếu cần mở sổ nhật ký.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Lưu ý nhanh',
      tips: [
        'Kỳ kế toán đã đóng thì không ghi sổ được — chọn tháng khác hoặc nhờ kế toán mở lại kỳ.',
        'Không thấy nút Ghi sổ / Sinh lịch → chưa có quyền — nhờ Admin.',
        'Kỳ đã ghi sổ: chạy lại sẽ báo đã ghi và không tạo chứng từ mới.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-depreciation' },
        { label: 'Danh sách tài sản', href: '/admin/qlts' },
        { label: 'Sổ nhật ký', href: '/accounting/journals' },
      ],
    },
  ],
}
