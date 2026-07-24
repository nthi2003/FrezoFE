import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app — Nghỉ phép (giọng EU, khớp /docs/guide-leave)
 */
export const LEAVES_GUIDE: PageGuideConfig = {
  title: 'Xin nghỉ phép',
  subtitle: 'Tạo đơn nghỉ và theo dõi duyệt. Chuỗi duyệt do Admin gắn tại Cấu hình luồng duyệt.',
  docHref: '/docs/guide-leave',
  sections: [
    {
      type: 'steps',
      heading: 'Làm việc chính',
      steps: [
        {
          title: 'Bấm Tạo đơn',
          description: 'Chọn loại nghỉ, ngày bắt đầu / kết thúc, điền lý do ngắn.',
        },
        {
          title: 'Bấm Gửi',
          description: 'Đơn vào danh sách của bạn ở trạng thái chờ duyệt.',
        },
        {
          title: 'Theo dõi trạng thái',
          description: 'Chờ duyệt → Đã duyệt / Từ chối. Người duyệt làm việc ở Hộp thư duyệt.',
        },
      ],
    },
    {
      type: 'tips',
      heading: 'Admin — gắn luồng duyệt',
      tips: [
        'Muốn đổi ai duyệt nghỉ: Phê duyệt → Cấu hình luồng duyệt → kích hoạt luồng Nghỉ phép.',
        'Không dùng Thiết kế quy trình để gắn Leave — xem hướng dẫn Gắn luồng duyệt.',
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Hướng dẫn đầy đủ', href: '/docs/guide-leave' },
        { label: 'Gắn luồng duyệt vào nghỉ phép', href: '/docs/guide-approval-attach' },
        { label: 'Hộp thư duyệt', href: '/approval/inbox' },
        { label: 'Cấu hình luồng duyệt', href: '/approval/flows' },
      ],
    },
  ],
}
