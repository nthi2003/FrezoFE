import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Quản lý tài sản (giọng EU, khớp /docs/guide-qlts)
 */
export const ASSETS_GUIDE: PageGuideConfig = {
  title: 'Quản lý tài sản',
  subtitle:
    'Thêm tài sản, gửi yêu cầu cấp phát, duyệt từng bước rồi bàn giao — tài sản chuyển Đang dùng.',
  docHref: '/docs/guide-qlts',
  sections: [
    {
      type: 'steps',
      heading: 'Cấp phát tài sản',
      steps: [
        {
          title: 'Thêm tài sản',
          description:
            'Bấm Thêm tài sản — nhập mã, tên, loại, giá trị. Chỉ tài sản Sẵn sàng mới cấp phát được.',
        },
        {
          title: 'Cấp phát cho nhân viên',
          description:
            'Mở tài sản Sẵn sàng → bấm Cấp phát → chọn nhân viên nhận, ngày và lý do → gửi. Yêu cầu ở trạng thái Chờ duyệt.',
        },
        {
          title: 'Duyệt yêu cầu',
          description:
            'Tab Yêu cầu cấp phát: người được phân duyệt bấm Duyệt hoặc Từ chối theo từng bước trên phiếu.',
        },
        {
          title: 'Bàn giao → Đang dùng',
          description:
            'Khi đủ bước duyệt, bấm xác nhận Bàn giao. Tài sản chuyển Đang dùng và gắn người giữ.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Mẹo dùng nhanh',
      tips: [
        'Ai duyệt được cấu hình ở Thiết kế quy trình (phần Tài sản) — chỉ Admin/vai trò cấu hình.',
        'Tab Yêu cầu cấp phát ưu tiên xử lý phiếu Chờ duyệt trước khi tạo thêm.',
        'Đang có yêu cầu chưa xong thì không tạo thêm yêu cầu cấp phát cho cùng tài sản.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-qlts' },
        { label: 'Yêu cầu cấp phát', href: '/docs/guide-asset-assign' },
        { label: 'Khấu hao định kỳ', href: '/assets/depreciation' },
        { label: 'Hướng dẫn khấu hao', href: '/docs/guide-depreciation' },
        { label: 'Thiết kế quy trình', href: '/qtht/workflows' },
      ],
    },
    {
      type: 'notes',
      heading: 'Phạm vi hiện tại',
      notes:
        'Luồng cấp phát đã gắn duyệt theo bước. Thu hồi tài sản về kho đang chờ Product chốt — hỏi quản lý kho / Admin nếu cần thu hồi tạm thời.',
    },
  ],
}
