import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — tab Yêu cầu cấp phát (giọng EU, khớp /docs/guide-asset-assign)
 */
export const ASSETS_ASSIGN_GUIDE: PageGuideConfig = {
  title: 'Yêu cầu cấp phát tài sản',
  subtitle:
    'Tab này để xem và duyệt phiếu. Gửi yêu cầu mới từ tab Tài sản → nút Cấp phát trên tài sản Sẵn sàng.',
  docHref: '/docs/guide-asset-assign',
  sections: [
    {
      type: 'steps',
      heading: 'Gửi yêu cầu cấp phát',
      steps: [
        {
          title: 'Sang tab Tài sản',
          description:
            'Tab Yêu cầu cấp phát không tạo phiếu mới. Mở tab Tài sản trên cùng trang.',
        },
        {
          title: 'Chọn tài sản Sẵn sàng',
          description:
            'Lọc chip Sẵn sàng nếu cần. Chỉ tài sản Sẵn sàng mới có nút Cấp phát.',
        },
        {
          title: 'Bấm Cấp phát và gửi',
          description:
            'Chọn nhân viên nhận, ngày và lý do → xác nhận. Phiếu hiện Chờ duyệt trên tab này.',
        },
        {
          title: 'Duyệt hoặc bàn giao',
          description:
            'Người duyệt bấm Duyệt / Từ chối trên phiếu (hoặc Hộp thư duyệt). Đủ bước thì Bàn giao.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng nhanh',
      tips: [
        'Empty “Chờ duyệt” nghĩa là chưa có phiếu — không phải lỗi hệ thống.',
        'Đang có yêu cầu chưa xong thì không tạo thêm yêu cầu cho cùng tài sản.',
        'Xem hướng dẫn đầy đủ tại Tài liệu → Yêu cầu cấp phát tài sản.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-asset-assign' },
        { label: 'Quản lý tài sản (tổng quan)', href: '/docs/guide-qlts' },
        { label: 'Hộp thư duyệt', href: '/docs/guide-approval-inbox' },
      ],
    },
  ],
}
