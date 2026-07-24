import type { PageGuideConfig } from '@frezo/ui'

/**
 * Hướng dẫn in-app cho Hộp thư duyệt
 */
export const APPROVAL_INBOX_GUIDE: PageGuideConfig = {
  title: 'Hộp thư duyệt',
  subtitle:
    'Duyệt đơn nghiệp vụ hàng ngày (nghỉ phép, PR, lương…).',
  docHref: '/docs/guide-workflows',
  sections: [
    {
      type: 'steps',
      heading: 'Cách duyệt',
      steps: [
        {
          title: 'Mở Hộp thư duyệt',
          description: 'Tab Chờ duyệt để xem đơn đang chờ bạn xử lý.',
        },
        {
          title: 'Duyệt hoặc từ chối',
          description: 'Duyệt kèm ghi chú (tuỳ chọn); Từ chối bắt buộc lý do ≥ 3 ký tự.',
        },
        {
          title: 'Thiếu đơn?',
          description:
            'Liên hệ Admin kiểm tra cấu hình luồng duyệt đúng loại đơn. Đừng thiết kế lại quy trình nếu đơn đã gắn luồng duyệt sẵn.',
        },
      ],
    },
    {
      type: 'links',
      heading: 'Liên quan',
      links: [
        { label: 'Cấu hình luồng duyệt', href: '/approval/flows' },
        { label: 'Thiết kế quy trình', href: '/qtht/workflows' },
        { label: 'Tài liệu quy trình duyệt', href: '/docs/guide-workflows' },
      ],
    },
  ],
}
