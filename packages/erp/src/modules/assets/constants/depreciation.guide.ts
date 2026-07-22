import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app cho /assets/depreciation (Khấu hao định kỳ)
 * Docs Hub: /docs/guide-depreciation
 */
export const DEPRECIATION_GUIDE: PageGuideConfig = {
  title: 'Khấu hao định kỳ',
  subtitle:
    'Chọn kỳ, xem trước tổng chi phí, xác nhận rồi ghi sổ kế toán. Chạy lại cùng kỳ không ghi đôi.',
  docHref: '/docs/guide-depreciation',
  sections: [
    {
      type: 'steps',
      heading: 'Quy trình chuẩn',
      steps: [
        {
          title: 'Sinh lịch trên tài sản',
          description:
            'Mở danh sách tài sản → chọn tài sản → tab Khấu hao → Sinh lịch (đường thẳng). Cần có lịch trước khi ghi sổ định kỳ.',
        },
        {
          title: 'Xem trước kỳ',
          description:
            'Chọn năm/tháng rồi bấm Xem trước để biết tổng tiền và số lịch sẽ ghi sổ.',
        },
        {
          title: 'Ghi sổ',
          description:
            'Bấm Ghi sổ → xác nhận trong hộp thoại. Hệ thống tạo chứng từ kế toán; chạy lại cùng kỳ không ghi đôi.',
        },
        {
          title: 'Theo dõi lịch sử',
          description:
            'Bảng lịch sử hiển thị kỳ đã ghi, số tiền và link chứng từ (nếu có).',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Lưu ý nhanh',
      tips: [
        'Kỳ kế toán đã đóng thì không ghi sổ được — mở lại kỳ hoặc chọn tháng khác.',
        'Chỉ người có quyền ghi sổ mới thấy nút Ghi sổ; thiếu quyền sinh lịch thì không thấy nút Sinh lịch trên tài sản.',
        'Nếu kỳ đã ghi sổ, chạy lại sẽ báo “Kỳ này đã ghi sổ” và không tạo chứng từ mới.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Tài liệu đầy đủ (Docs Hub)', href: '/docs/guide-depreciation' },
        { label: 'Danh sách tài sản', href: '/admin/qlts' },
        { label: 'Sổ nhật ký', href: '/accounting/journals' },
      ],
    },
  ],
}
